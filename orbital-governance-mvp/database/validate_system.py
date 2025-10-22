#!/usr/bin/env python3
"""
Spatial Accuracy Validation for Orbital Tract Volumetric Shells

Tests if satellite points correctly fall within their expected volumetric shells
using PostGIS spatial queries and orbital parameter matching.
"""

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
import pandas as pd

engine = create_engine("postgresql+psycopg2://postgres:@localhost:5432/extra_orbital")
Session = sessionmaker(bind=engine)
session = Session()

def validate_spatial_accuracy():
    """Check if satellites fall within correct volumetric shells"""
    
    print("🔍 Validating spatial accuracy of volumetric shells...")
    
    # Get satellite positions with orbital parameters
    satellites_query = text("""
        SELECT 
            satellite_id,
            name,
            longitude,
            latitude, 
            altitude,
            inclination,
            ST_X(position) as pos_lon,
            ST_Y(position) as pos_lat,
            ST_Z(position) as pos_alt
        FROM dev.tle_snapshots 
        WHERE position IS NOT NULL 
        AND altitude BETWEEN 200 AND 2000  -- LEO range
        LIMIT 100
    """)
    
    satellites = pd.read_sql(satellites_query, engine)
    print(f"📡 Found {len(satellites)} LEO satellites to validate")
    
    # Check each satellite against volumetric shells
    matches = []
    mismatches = []
    
    for _, sat in satellites.iterrows():
        sat_alt = sat['altitude']
        sat_inc = sat['inclination']
        
        # Calculate expected RAAN from longitude (simplified)
        # In reality, RAAN calculation is more complex
        sat_raan = sat['longitude'] % 360
        if sat_raan < 0:
            sat_raan += 360
            
        # Find matching volumetric shells using orbital parameters
        shell_query = text("""
            SELECT 
                tract_id,
                alt_min, alt_max,
                inc_min, inc_max, 
                raan_min, raan_max,
                ST_AsText(geom) as geom_wkt
            FROM dev.tract_volumetric_shells
            WHERE :sat_alt BETWEEN alt_min AND alt_max
            AND :sat_inc BETWEEN inc_min AND inc_max
            AND (:sat_raan BETWEEN raan_min AND raan_max 
                 OR (:sat_raan + 360) BETWEEN raan_min AND raan_max
                 OR (:sat_raan - 360) BETWEEN raan_min AND raan_max)
        """)
        
        matching_shells = pd.read_sql(shell_query, engine, params={
            'sat_alt': sat_alt,
            'sat_inc': sat_inc, 
            'sat_raan': sat_raan
        })
        
        if len(matching_shells) > 0:
            matches.append({
                'satellite_id': sat['satellite_id'],
                'name': sat['name'],
                'altitude': sat_alt,
                'inclination': sat_inc,
                'raan': sat_raan,
                'matching_shells': len(matching_shells),
                'shell_ids': matching_shells['tract_id'].tolist()[:3]  # First 3
            })
        else:
            mismatches.append({
                'satellite_id': sat['satellite_id'],
                'name': sat['name'],
                'altitude': sat_alt,
                'inclination': sat_inc,
                'raan': sat_raan
            })
    
    print(f"\n✅ Spatial Accuracy Results:")
    print(f"   Matches: {len(matches)} satellites")
    print(f"   Mismatches: {len(mismatches)} satellites")
    print(f"   Accuracy: {len(matches)/(len(matches)+len(mismatches))*100:.1f}%")
    
    # Show sample matches
    if matches:
        print(f"\n📊 Sample Matches:")
        for match in matches[:5]:
            print(f"   {match['name']}: ALT={match['altitude']:.0f}km, INC={match['inclination']:.1f}°, RAAN={match['raan']:.1f}° → {match['matching_shells']} shells")
    
    # Show mismatches for debugging
    if mismatches:
        print(f"\n⚠️  Sample Mismatches:")
        for miss in mismatches[:5]:
            print(f"   {miss['name']}: ALT={miss['altitude']:.0f}km, INC={miss['inclination']:.1f}°, RAAN={miss['raan']:.1f}°")
    
    return len(matches), len(mismatches)

def check_shell_coverage():
    """Check volumetric shell parameter space coverage"""
    
    print(f"\n🗺️  Checking volumetric shell coverage...")
    
    coverage_query = text("""
        SELECT 
            COUNT(*) as total_shells,
            MIN(alt_min) as min_altitude,
            MAX(alt_max) as max_altitude,
            MIN(inc_min) as min_inclination,
            MAX(inc_max) as max_inclination,
            MIN(raan_min) as min_raan,
            MAX(raan_max) as max_raan
        FROM dev.tract_volumetric_shells
    """)
    
    coverage = pd.read_sql(coverage_query, engine)
    
    print(f"   Total shells: {coverage.iloc[0]['total_shells']:,}")
    print(f"   Altitude range: {coverage.iloc[0]['min_altitude']:.0f} - {coverage.iloc[0]['max_altitude']:.0f} km")
    print(f"   Inclination range: {coverage.iloc[0]['min_inclination']:.0f} - {coverage.iloc[0]['max_inclination']:.0f}°")
    print(f"   RAAN range: {coverage.iloc[0]['min_raan']:.0f} - {coverage.iloc[0]['max_raan']:.0f}°")

def test_point_in_shell():
    """Test specific point-in-shell queries using PostGIS"""
    
    print(f"\n🎯 Testing point-in-shell spatial queries...")
    
    # Test with a known satellite position
    test_query = text("""
        WITH test_satellite AS (
            SELECT 
                'TEST-SAT' as name,
                400.0 as altitude,
                45.0 as inclination, 
                90.0 as raan
        ),
        matching_shells AS (
            SELECT 
                v.tract_id,
                v.alt_min, v.alt_max,
                v.inc_min, v.inc_max,
                v.raan_min, v.raan_max,
                ST_Contains(
                    v.geom, 
                    ST_MakePoint(t.raan, t.inclination, t.altitude)
                ) as contains_point
            FROM dev.tract_volumetric_shells v
            CROSS JOIN test_satellite t
            WHERE t.altitude BETWEEN v.alt_min AND v.alt_max
            AND t.inclination BETWEEN v.inc_min AND v.inc_max  
            AND t.raan BETWEEN v.raan_min AND v.raan_max
        )
        SELECT * FROM matching_shells WHERE contains_point = true;
    """)
    
    results = pd.read_sql(test_query, engine)
    
    if len(results) > 0:
        print(f"   ✅ Test point found in {len(results)} shells")
        print(f"   Sample shell: {results.iloc[0]['tract_id']}")
    else:
        print(f"   ⚠️  Test point not found in any shells")

if __name__ == "__main__":
    try:
        check_shell_coverage()
        matches, mismatches = validate_spatial_accuracy()
        test_point_in_shell()
        
    except Exception as e:
        print(f"❌ Error during validation: {e}")
    finally:
        session.close()