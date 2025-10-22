GENERATE_METADATA = True
GENERATE_GEOMETRY = True

from sqlalchemy import create_engine, Column, String, Integer, Float, DateTime, text
from sqlalchemy.orm import declarative_base, sessionmaker
from datetime import datetime
from shapely.validation import make_valid
from shapely.geometry.polygon import orient

Base = declarative_base()

class Tract(Base):
    __tablename__ = 'tracts'
    __table_args__ = {'schema': 'dev'} 
    tract_id = Column(String, primary_key=True)
    alt_min = Column(Float)
    alt_max = Column(Float)
    inc_min = Column(Float)
    inc_max = Column(Float)
    az_min = Column(Float)
    az_max = Column(Float)
    orbit_zone = Column(String, default='LEO')
    theta_start_idx = Column(Integer)
    theta_end_idx = Column(Integer)
    created_at = Column(DateTime, default=datetime.utcnow)


# Single DB connection and session for both sections
engine = create_engine("postgresql://postgres:@localhost:5432/extra_orbital")
Base.metadata.create_all(engine)
Session = sessionmaker(bind=engine)
session = Session()

if GENERATE_METADATA:
    # Create new volumetric table
    Base.metadata.create_all(engine)
    
    # FULL cleanup before regeneration
    session.execute(text("DROP TABLE IF EXISTS dev.tract_volumetric_shells CASCADE"))
    session.execute(text("DELETE FROM dev.tract_geometries_leo"))
    session.execute(text("DELETE FROM dev.tracts WHERE orbit_zone = 'LEO'"))
    session.commit()
    
    # Recreate volumetric table
    Base.metadata.create_all(engine)

    # Bin definitions - full orbital parameter space
    alt_bins = [(a, a + 50) for a in range(200, 2001, 50)]
    inc_bins = [(i, i + 5) for i in range(0, 180, 5)]  # Full inclination range
    raan_bins = [(r, r + 5) for r in range(0, 360, 5)]

    # Angular resolution: 1 degree → 360 total segments
    n_segments = 360
    segment_span = 360 / n_segments  # = 1.0

    new_tracts = []

    for alt_min, alt_max in alt_bins:
        for inc_min, inc_max in inc_bins:
            for az_min, az_max in raan_bins:
                zone = "LEO"
                theta_start_idx = int(az_min // segment_span)
                theta_end_idx = int(az_max // segment_span)

                tract_id = f"{zone}-A{alt_min}-I{inc_min}-RAAN{az_min}_{az_max}"
                new_tracts.append(Tract(
                    tract_id=tract_id,
                    alt_min=alt_min,
                    alt_max=alt_max,
                    inc_min=inc_min,
                    inc_max=inc_max,
                    az_min=az_min,
                    az_max=az_max,
                    orbit_zone=zone,
                    theta_start_idx=theta_start_idx,
                    theta_end_idx=theta_end_idx
                ))

    # Save to database
    session.bulk_save_objects(new_tracts)
    session.commit()

    print(f"✅ Inserted {len(new_tracts)} updated metadata rows with arc segment indices.")

# Geometry related imports

import numpy as np
from pyproj import Transformer
from shapely.geometry import Polygon, mapping, shape
from shapely.ops import unary_union
from shapely.wkt import dumps
from sqlalchemy import create_engine, Column, String, Float, Integer, DateTime
from sqlalchemy.orm import declarative_base, sessionmaker
from geoalchemy2 import Geometry
from datetime import datetime

class TractVolumetricGeometry(Base):
    __tablename__ = 'tract_volumetric_shells'
    __table_args__ = {'schema': 'dev'}

    tract_id = Column(String, primary_key=True)
    geom = Column(Geometry(geometry_type='POLYGONZ', srid=0), nullable=False)  # Parameter space, not geographic
    alt_min = Column(Float)
    alt_max = Column(Float)
    inc_min = Column(Float)
    inc_max = Column(Float)
    raan_min = Column(Float)
    raan_max = Column(Float)
    volume_m3 = Column(Float)
    created_at = Column(DateTime, default=datetime.utcnow)

if GENERATE_GEOMETRY:
    import numpy as np
    from pyproj import Transformer
    from shapely.geometry import Polygon
    from shapely.wkt import dumps

    transformer = Transformer.from_crs("epsg:4978", "epsg:4326", always_xy=True)

    def normalize_longitude(lon):
        return ((lon + 180) % 360) - 180

    def unwrap_lon(lon):
        if lon > 180:
            return lon - 360
        elif lon < -180:
            return lon + 360
        return lon

    def orbital_to_cartesian(r, inc, raan, arg_per=0, true_anom=0):
        """Convert orbital elements to Cartesian coordinates (ECI frame)"""
        # Convert angles to radians
        inc_rad = np.radians(inc)
        raan_rad = np.radians(raan)
        arg_per_rad = np.radians(arg_per)
        true_anom_rad = np.radians(true_anom)
        
        # Position in orbital plane
        x_orb = r * np.cos(true_anom_rad)
        y_orb = r * np.sin(true_anom_rad)
        z_orb = 0
        
        # Rotation matrices for orbital mechanics
        # Rotate by argument of periapsis
        cos_w, sin_w = np.cos(arg_per_rad), np.sin(arg_per_rad)
        x1 = cos_w * x_orb - sin_w * y_orb
        y1 = sin_w * x_orb + cos_w * y_orb
        z1 = z_orb
        
        # Rotate by inclination
        cos_i, sin_i = np.cos(inc_rad), np.sin(inc_rad)
        x2 = x1
        y2 = cos_i * y1 - sin_i * z1
        z2 = sin_i * y1 + cos_i * z1
        
        # Rotate by RAAN
        cos_raan, sin_raan = np.cos(raan_rad), np.sin(raan_rad)
        x_eci = cos_raan * x2 - sin_raan * y2
        y_eci = sin_raan * x2 + cos_raan * y2
        z_eci = z2
        
        return x_eci, y_eci, z_eci
    
    def cartesian_to_geodetic(x, y, z):
        """Convert ECI Cartesian to geodetic coordinates"""
        # Convert to geographic coordinates
        lon = np.degrees(np.arctan2(y, x))
        lat = np.degrees(np.arctan2(z, np.sqrt(x*x + y*y)))
        alt = np.sqrt(x*x + y*y + z*z) - 6371.0  # Earth radius
        
        return unwrap_lon(lon), np.clip(lat, -89.9, 89.9), alt
    
    def generate_volumetric_shell(alt_min, alt_max, inc_min, inc_max, raan_min, raan_max, tract_id):
        """Generate 3D volumetric shell in orbital parameter space"""
        from shapely.validation import explain_validity
        
        # Guard against degenerate tiles
        if raan_max <= raan_min or inc_max <= inc_min or alt_max <= alt_min:
            print(f"[degenerate] {tract_id}: RAAN={raan_min}-{raan_max}, INC={inc_min}-{inc_max}, ALT={alt_min}-{alt_max}")
            return Polygon()
        
        # Skip extreme polar cases
        if inc_min >= 170:
            return Polygon()
        
        # Create simple 3D rectangular shell in orbital parameter space
        # Use average altitude to avoid self-intersection
        avg_alt = (alt_min + alt_max) / 2
        
        coords = [
            (raan_min, inc_min, avg_alt),
            (raan_max, inc_min, avg_alt),
            (raan_max, inc_max, avg_alt),
            (raan_min, inc_max, avg_alt),
            (raan_min, inc_min, avg_alt)  # Close polygon
        ]
        
        try:
            poly = Polygon(coords)
            if not poly.is_valid:
                print(f"[invalid] {tract_id}: {explain_validity(poly)}")
                return Polygon()
            elif poly.is_empty:
                print(f"[empty] {tract_id}")
                return Polygon()
            elif poly.area == 0:
                print(f"[zero-area] {tract_id}: Δraan={raan_max-raan_min}, Δinc={inc_max-inc_min}")
                return Polygon()
            else:
                return poly
        except Exception as e:
            print(f"[exception] {tract_id}: {e}")
            return Polygon()

    # Create volumetric table if not exists
    Base.metadata.create_all(engine)
    
    # Load metadata and regenerate geometry
    tracts = session.query(Tract).filter(Tract.orbit_zone == 'LEO').all()
    session.execute(text("DELETE FROM dev.tract_volumetric_shells"))
    session.commit()

    print(f"Loaded {len(tracts)} LEO tracts for geometry generation.")
    count = 0

    # ===================== 🟦 Volumetric Shell Geometry Generation 🟦 =====================
    skipped_polar = 0
    failed_generation = 0
    invalid_geometry = 0
    
    for tract in tracts:
        # Skip only the most extreme polar cases
        if tract.inc_min >= 170:
            skipped_polar += 1
            continue
            
        volume = generate_volumetric_shell(tract.alt_min, tract.alt_max, tract.inc_min, tract.inc_max, tract.az_min, tract.az_max, tract.tract_id)

        if not isinstance(volume, Polygon) or volume.is_empty:
            failed_generation += 1
            if failed_generation <= 3:  # Show first few failures
                print(f"Failed generation: {tract.tract_id}")
            continue

        # Ensure volume validity
        if volume.is_empty or not volume.is_valid or volume.geom_type not in ["Polygon", "MultiPolygon"]:
            invalid_geometry += 1
            if invalid_geometry <= 3:  # Show first few invalid
                print(f"Invalid geometry: {tract.tract_id} - valid={volume.is_valid}, empty={volume.is_empty}, type={volume.geom_type}")
            continue

        volume_wkt = dumps(volume, output_dimension=3)

        # Calculate approximate volume (simplified)
        volume_m3 = volume.area * (tract.alt_max - tract.alt_min) * 1000  # Rough approximation
        
        session.merge(TractVolumetricGeometry(
            tract_id=tract.tract_id,
            geom=volume_wkt,  # No SRID prefix for parameter space
            alt_min=tract.alt_min,
            alt_max=tract.alt_max,
            inc_min=tract.inc_min,
            inc_max=tract.inc_max,
            raan_min=tract.az_min,
            raan_max=tract.az_max,
            volume_m3=volume_m3
        ))
        count += 1
        
        if count % 100 == 0:
            print(f"Processed {count} valid volumes...")

    session.commit()
    print(f"✅ Inserted {count} volumetric LEO shell geometries into dev.tract_volumetric_shells.")
    print(f"Debug: Skipped polar={skipped_polar}, Failed generation={failed_generation}, Invalid geometry={invalid_geometry}")
