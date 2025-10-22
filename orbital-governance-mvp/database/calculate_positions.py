#!/usr/bin/env python3
"""
Calculate Satellite Positions from TLE Data

This script takes raw TLE (Two-Line Element) data and calculates:
- Geographic positions (latitude, longitude, altitude)
- Orbital parameters (inclination)
- PostGIS geometry for spatial queries

This is essential for the demo to show live satellite positions.
"""

from skyfield.api import EarthSatellite, load
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from datetime import timezone

# Database connection
engine = create_engine("postgresql+psycopg2://postgres:@localhost:5432/extra_orbital")
Session = sessionmaker(bind=engine)
session = Session()

def calculate_satellite_positions():
    """Calculate positions for satellites that don't have geometry yet"""
    
    print("🛰️  Calculating satellite positions from TLE data...")
    
    # Load time scale for orbital calculations
    ts = load.timescale()
    
    # Get TLE snapshots that need position calculation
    result = session.execute(text("""
        SELECT id, tle_line1, tle_line2, name
        FROM dev.tle_snapshots
        WHERE position IS NULL
        ORDER BY id
    """))
    rows = result.fetchall()
    
    print(f"📡 Found {len(rows)} satellites needing position calculation...")
    
    if len(rows) == 0:
        print("✅ All satellites already have positions calculated")
        return
    
    updates = []
    errors = 0
    
    for row in rows:
        snapshot_id, line1, line2, name = row
        try:
            # Create satellite object from TLE data
            satellite = EarthSatellite(line1, line2, name=name or str(snapshot_id), ts=ts)
            
            # Calculate current position
            now = ts.now()
            subpoint = satellite.at(now).subpoint()
            
            # Extract position data
            lat = subpoint.latitude.degrees
            lon = subpoint.longitude.degrees
            alt = subpoint.elevation.km
            
            # Get inclination from orbital model
            incl = satellite.model.inclo  # radians
            incl_deg = incl * 180 / 3.141592653589793
            
            # Create PostGIS point geometry
            point_wkt = f"POINTZ({lon} {lat} {alt})"
            
            updates.append({
                'point_wkt': point_wkt,
                'lon': float(lon),
                'lat': float(lat),
                'alt': float(alt),
                'incl': float(incl_deg),
                'snapshot_id': snapshot_id
            })
            
        except Exception as e:
            print(f"⚠️  Error calculating position for {name or snapshot_id}: {e}")
            errors += 1
    
    # Apply position updates to database
    if updates:
        print(f"💾 Updating {len(updates)} satellite positions...")
        
        for update in updates:
            session.execute(text("""
                UPDATE dev.tle_snapshots
                SET 
                    position = ST_GeomFromText(:point_wkt, 4326),
                    longitude = :lon,
                    latitude = :lat,
                    altitude = :alt,
                    inclination = :incl
                WHERE id = :snapshot_id
            """), update)
        
        session.commit()
        print(f"✅ Successfully updated {len(updates)} satellite positions")
        
        if errors > 0:
            print(f"⚠️  {errors} satellites had calculation errors")
    else:
        print("❌ No valid position calculations completed")
    
    session.close()

def show_position_summary():
    """Show summary of calculated positions"""
    
    result = session.execute(text("""
        SELECT 
            COUNT(*) as total_satellites,
            COUNT(position) as positioned_satellites,
            MIN(altitude) as min_altitude,
            MAX(altitude) as max_altitude,
            AVG(altitude) as avg_altitude
        FROM dev.tle_snapshots
    """))
    
    stats = result.fetchone()
    
    print(f"\n📊 Satellite Position Summary:")
    print(f"   Total satellites: {stats[0]}")
    print(f"   With positions: {stats[1]}")
    print(f"   Altitude range: {stats[2]:.1f} - {stats[3]:.1f} km")
    print(f"   Average altitude: {stats[4]:.1f} km")
    
    session.close()

if __name__ == "__main__":
    try:
        calculate_satellite_positions()
        show_position_summary()
    except Exception as e:
        print(f"❌ Error: {e}")
        print("Make sure PostgreSQL is running and the database exists")