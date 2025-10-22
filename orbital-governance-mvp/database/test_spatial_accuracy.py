#!/usr/bin/env python3
"""
Comprehensive Spatial Accuracy Test

Tests if satellites correctly fall within their expected orbital tracts
using both parameter-based matching and PostGIS spatial queries.
"""

from sqlalchemy import create_engine, text
import pandas as pd

engine = create_engine("postgresql+psycopg2://postgres:@localhost:5432/extra_orbital")

def test_parameter_matching():
    """Test if satellites match tracts based on orbital parameters"""
    
    print("🔍 Testing Parameter-Based Spatial Accuracy...")
    
    # Get sample of LEO satellites with their parameters
    query = text("""
        SELECT 
            satellite_id,
            name,
            altitude,
            inclination,
            longitude
        FROM dev.tle_snapshots 
        WHERE position IS NOT NULL 
        AND altitude BETWEEN 200 AND 2000
        ORDER BY name
        LIMIT 100
    """)
    
    satellites = pd.read_sql(query, engine)
    print(f"📡 Testing {len(satellites)} LEO satellites...")
    
    matches = 0
    sample_matches = []
    
    for _, sat in satellites.iterrows():
        sat_alt = sat['altitude']
        sat_inc = sat['inclination']
        # Simplified RAAN calculation from longitude
        sat_raan = (sat['longitude'] + 360) % 360
        
        # Find matching tracts
        tract_query = text("""
            SELECT tract_id, alt_min, alt_max, inc_min, inc_max, az_min, az_max
            FROM dev.tracts 
            WHERE orbit_zone = 'LEO'
            AND :sat_alt BETWEEN alt_min AND alt_max
            AND :sat_inc BETWEEN inc_min AND inc_max
            AND :sat_raan BETWEEN az_min AND az_max
            LIMIT 1
        """)
        
        result = pd.read_sql(tract_query, engine, params={
            'sat_alt': sat_alt,
            'sat_inc': sat_inc,
            'sat_raan': sat_raan
        })
        
        if len(result) > 0:
            matches += 1
            if len(sample_matches) < 5:
                sample_matches.append({
                    'name': sat['name'],
                    'alt': sat_alt,
                    'inc': sat_inc,
                    'raan': sat_raan,
                    'tract': result.iloc[0]['tract_id']
                })
    
    accuracy = (matches / len(satellites)) * 100
    
    print(f"\n📊 Parameter Matching Results:")
    print(f"   Satellites tested: {len(satellites)}")
    print(f"   Successful matches: {matches}")
    print(f"   Accuracy: {accuracy:.1f}%")
    
    if sample_matches:
        print(f"\n✅ Sample successful matches:")
        for match in sample_matches:
            print(f"   {match['name']}: ALT={match['alt']:.0f}km, INC={match['inc']:.1f}°, RAAN={match['raan']:.1f}° → {match['tract']}")
    
    return accuracy

def test_tract_coverage():
    """Test orbital tract parameter space coverage"""
    
    print(f"\n🗺️  Testing Tract Coverage...")
    
    coverage_query = text("""
        SELECT 
            COUNT(*) as total_tracts,
            MIN(alt_min) as min_altitude,
            MAX(alt_max) as max_altitude,
            MIN(inc_min) as min_inclination,
            MAX(inc_max) as max_inclination,
            MIN(az_min) as min_raan,
            MAX(az_max) as max_raan,
            COUNT(DISTINCT CONCAT(alt_min, '-', alt_max)) as altitude_bins,
            COUNT(DISTINCT CONCAT(inc_min, '-', inc_max)) as inclination_bins,
            COUNT(DISTINCT CONCAT(az_min, '-', az_max)) as raan_bins
        FROM dev.tracts 
        WHERE orbit_zone = 'LEO'
    """)
    
    coverage = pd.read_sql(coverage_query, engine)
    cov = coverage.iloc[0]
    
    print(f"   Total LEO tracts: {cov['total_tracts']:,}")
    print(f"   Altitude coverage: {cov['min_altitude']:.0f} - {cov['max_altitude']:.0f} km")
    print(f"   Inclination coverage: {cov['min_inclination']:.0f} - {cov['max_inclination']:.0f}°")
    print(f"   RAAN coverage: {cov['min_raan']:.0f} - {cov['max_raan']:.0f}°")
    print(f"   Resolution: {cov['altitude_bins']} alt × {cov['inclination_bins']} inc × {cov['raan_bins']} raan bins")
    
    # Calculate expected vs actual tract count
    expected_tracts = cov['altitude_bins'] * cov['inclination_bins'] * cov['raan_bins']
    coverage_percent = (cov['total_tracts'] / expected_tracts) * 100
    
    print(f"   Coverage completeness: {coverage_percent:.1f}% ({cov['total_tracts']:,} / {expected_tracts:,})")
    
    return coverage_percent

def test_satellite_distribution():
    """Test how satellites are distributed across orbital parameter space"""
    
    print(f"\n📈 Testing Satellite Distribution...")
    
    distribution_query = text("""
        SELECT 
            CASE 
                WHEN altitude < 400 THEN 'Very Low (200-400km)'
                WHEN altitude < 600 THEN 'Low (400-600km)'
                WHEN altitude < 1000 THEN 'Medium (600-1000km)'
                ELSE 'High (1000-2000km)'
            END as altitude_band,
            CASE 
                WHEN inclination < 30 THEN 'Equatorial (0-30°)'
                WHEN inclination < 60 THEN 'Mid-Latitude (30-60°)'
                WHEN inclination < 90 THEN 'High-Latitude (60-90°)'
                ELSE 'Polar (90°+)'
            END as inclination_band,
            COUNT(*) as satellite_count
        FROM dev.tle_snapshots 
        WHERE position IS NOT NULL 
        AND altitude BETWEEN 200 AND 2000
        GROUP BY altitude_band, inclination_band
        ORDER BY satellite_count DESC
    """)
    
    distribution = pd.read_sql(distribution_query, engine)
    
    print(f"   Satellite distribution by orbital bands:")
    for _, row in distribution.iterrows():
        print(f"   {row['altitude_band']} × {row['inclination_band']}: {row['satellite_count']:,} satellites")
    
    return len(distribution)

def test_edge_cases():
    """Test edge cases and boundary conditions"""
    
    print(f"\n🧪 Testing Edge Cases...")
    
    # Test satellites at tract boundaries
    boundary_query = text("""
        WITH boundary_satellites AS (
            SELECT 
                s.satellite_id,
                s.name,
                s.altitude,
                s.inclination,
                (s.longitude + 360) % 360 as normalized_raan,
                t.tract_id,
                t.alt_min, t.alt_max,
                t.inc_min, t.inc_max,
                t.az_min, t.az_max,
                CASE 
                    WHEN ABS(s.altitude - t.alt_min) < 1 OR ABS(s.altitude - t.alt_max) < 1 THEN 'altitude_boundary'
                    WHEN ABS(s.inclination - t.inc_min) < 0.5 OR ABS(s.inclination - t.inc_max) < 0.5 THEN 'inclination_boundary'
                    WHEN ABS(((s.longitude + 360) % 360) - t.az_min) < 0.5 OR ABS(((s.longitude + 360) % 360) - t.az_max) < 0.5 THEN 'raan_boundary'
                    ELSE 'interior'
                END as boundary_type
            FROM dev.tle_snapshots s
            JOIN dev.tracts t ON (
                s.altitude BETWEEN t.alt_min AND t.alt_max
                AND s.inclination BETWEEN t.inc_min AND t.inc_max
                AND ((s.longitude + 360) % 360) BETWEEN t.az_min AND t.az_max
                AND t.orbit_zone = 'LEO'
            )
            WHERE s.position IS NOT NULL 
            AND s.altitude BETWEEN 200 AND 2000
            LIMIT 1000
        )
        SELECT 
            boundary_type,
            COUNT(*) as count
        FROM boundary_satellites
        GROUP BY boundary_type
        ORDER BY count DESC
    """)
    
    boundary_results = pd.read_sql(boundary_query, engine)
    
    print(f"   Boundary condition analysis:")
    total_tested = boundary_results['count'].sum()
    for _, row in boundary_results.iterrows():
        percent = (row['count'] / total_tested) * 100
        print(f"   {row['boundary_type']}: {row['count']} satellites ({percent:.1f}%)")
    
    return total_tested

def main():
    """Run comprehensive spatial accuracy tests"""
    
    print("🛰️  COMPREHENSIVE SPATIAL ACCURACY TEST")
    print("=" * 50)
    
    try:
        # Test 1: Parameter matching
        param_accuracy = test_parameter_matching()
        
        # Test 2: Tract coverage
        coverage_percent = test_tract_coverage()
        
        # Test 3: Satellite distribution
        distribution_bands = test_satellite_distribution()
        
        # Test 4: Edge cases
        boundary_tests = test_edge_cases()
        
        # Overall assessment
        print(f"\n🎯 OVERALL ASSESSMENT:")
        print(f"   Parameter Accuracy: {param_accuracy:.1f}%")
        print(f"   Tract Coverage: {coverage_percent:.1f}%")
        print(f"   Distribution Bands: {distribution_bands} different orbital regions")
        print(f"   Boundary Tests: {boundary_tests:,} satellites tested")
        
        if param_accuracy >= 95 and coverage_percent >= 90:
            print(f"\n✅ EXCELLENT: System demonstrates high spatial accuracy!")
            print(f"   Ready for business presentations and customer demos")
        elif param_accuracy >= 85 and coverage_percent >= 80:
            print(f"\n✅ GOOD: System shows solid spatial accuracy")
            print(f"   Minor improvements recommended before major presentations")
        else:
            print(f"\n⚠️  NEEDS IMPROVEMENT: Spatial accuracy below expectations")
            print(f"   Recommend debugging before customer presentations")
            
    except Exception as e:
        print(f"❌ Error during testing: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()