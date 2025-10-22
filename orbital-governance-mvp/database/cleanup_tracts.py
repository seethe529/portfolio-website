#!/usr/bin/env python3
"""
Clean Up Orbital Tracts Database

Removes MEO and GEO tracts to focus the demo on LEO (Low Earth Orbit) only.
This makes the demo cleaner and more focused on the main business case.

LEO (200-2000km) is where most commercial satellites operate:
- Starlink, OneWeb, Planet Labs, etc.
- This is the primary market for orbital governance
"""

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Database connection
engine = create_engine("postgresql+psycopg2://postgres:@localhost:5432/extra_orbital")
Session = sessionmaker(bind=engine)
session = Session()

def show_current_data():
    """Show what data we currently have"""
    
    print("🔍 Current orbital tract data:")
    
    result = session.execute(text("""
        SELECT 
            orbit_zone, 
            COUNT(*) as tract_count,
            MIN(alt_min) as min_altitude,
            MAX(alt_max) as max_altitude
        FROM dev.tracts 
        GROUP BY orbit_zone 
        ORDER BY orbit_zone
    """))
    
    total_tracts = 0
    for row in result:
        zone, count, min_alt, max_alt = row
        total_tracts += count
        print(f"   {zone}: {count:,} tracts ({min_alt}-{max_alt}km)")
    
    print(f"   Total: {total_tracts:,} tracts")
    return total_tracts

def cleanup_non_leo_tracts():
    """Remove MEO and GEO tracts, keep only LEO"""
    
    print("\n🧹 Cleaning up non-LEO tracts...")
    
    # Count what we're about to remove
    result = session.execute(text("""
        SELECT COUNT(*) FROM dev.tracts WHERE orbit_zone != 'LEO'
    """))
    tracts_to_remove = result.fetchone()[0]
    
    if tracts_to_remove == 0:
        print("✅ Database already clean - only LEO tracts present")
        return
    
    print(f"   Will remove {tracts_to_remove:,} non-LEO tracts")
    
    # Remove related volumetric shells first (foreign key constraint)
    print("   Removing volumetric shells for non-LEO tracts...")
    result = session.execute(text("""
        DELETE FROM dev.tract_volumetric_shells 
        WHERE tract_id IN (
            SELECT tract_id FROM dev.tracts WHERE orbit_zone != 'LEO'
        )
    """))
    print(f"   Removed {result.rowcount} volumetric shells")
    
    # Remove non-LEO tracts
    print("   Removing non-LEO tract metadata...")
    result = session.execute(text("""
        DELETE FROM dev.tracts WHERE orbit_zone != 'LEO'
    """))
    print(f"   Removed {result.rowcount} tract records")
    
    # Commit changes
    session.commit()
    print("✅ Cleanup completed")

def show_leo_summary():
    """Show summary of remaining LEO data"""
    
    print("\n📊 LEO tract summary:")
    
    result = session.execute(text("""
        SELECT 
            COUNT(*) as total_tracts,
            MIN(alt_min) as min_altitude,
            MAX(alt_max) as max_altitude,
            COUNT(DISTINCT CONCAT(alt_min, '-', alt_max)) as altitude_bins,
            COUNT(DISTINCT CONCAT(inc_min, '-', inc_max)) as inclination_bins
        FROM dev.tracts 
        WHERE orbit_zone = 'LEO'
    """))
    
    stats = result.fetchone()
    
    print(f"   Total LEO tracts: {stats[0]:,}")
    print(f"   Altitude range: {stats[1]}-{stats[2]} km")
    print(f"   Altitude bins: {stats[3]}")
    print(f"   Inclination bins: {stats[4]}")
    
    # Show some sample tracts
    print("\n   Sample LEO tracts:")
    result = session.execute(text("""
        SELECT tract_id, alt_min, alt_max, inc_min, inc_max 
        FROM dev.tracts 
        WHERE orbit_zone = 'LEO' 
        ORDER BY alt_min, inc_min 
        LIMIT 5
    """))
    
    for row in result:
        tract_id, alt_min, alt_max, inc_min, inc_max = row
        print(f"   {tract_id}: {alt_min}-{alt_max}km, {inc_min}-{inc_max}°")

def main():
    """Main cleanup process"""
    
    print("🛰️  Orbital Tract Database Cleanup")
    print("=" * 50)
    
    try:
        # Show current state
        total_before = show_current_data()
        
        # Ask for confirmation
        print(f"\n❓ Remove MEO and GEO tracts to focus demo on LEO only?")
        print("   This will make your demo cleaner and more focused.")
        print("   You can always regenerate them later if needed.")
        
        response = input("   Continue? (y/N): ").strip().lower()
        
        if response in ['y', 'yes']:
            cleanup_non_leo_tracts()
            show_leo_summary()
            
            print(f"\n🎉 Database cleanup complete!")
            print(f"   Your demo will now focus on LEO orbital governance")
            print(f"   Perfect for business presentations!")
            
        else:
            print("   Cleanup cancelled - no changes made")
            
    except Exception as e:
        print(f"❌ Error during cleanup: {e}")
        session.rollback()
    finally:
        session.close()

if __name__ == "__main__":
    main()