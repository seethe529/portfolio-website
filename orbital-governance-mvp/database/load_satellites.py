import requests
from datetime import datetime, timezone
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from skyfield.api import EarthSatellite

# === PostgreSQL connection using SQLAlchemy ===
engine = create_engine("postgresql+psycopg2://postgres:@localhost:5432/extra_orbital")
Session = sessionmaker(bind=engine)
session = Session()

# === TLE Source ===
url = "https://celestrak.com/NORAD/elements/gp.php?GROUP=active&FORMAT=tle"
response = requests.get(url)
tle_lines = response.text.strip().splitlines()

# === Process in groups of 3 (Name, Line1, Line2) ===
now = datetime.now(timezone.utc)
inserted = 0

for i in range(0, len(tle_lines), 3):
    try:
        name = tle_lines[i].strip()
        line1 = tle_lines[i+1].strip()
        line2 = tle_lines[i+2].strip()
        sat = EarthSatellite(line1, line2, name)
        sat_id = str(sat.model.satnum)
        raan_deg = sat.model.nodeo * (180 / 3.141592653589793)

        try:
            session.execute(text("""
                INSERT INTO dev.tle_snapshots (satellite_id, name, tle_line1, tle_line2, timestamp_collected, raan_deg)
                VALUES (:sat_id, :name, :line1, :line2, :now, :raan_deg)
                ON CONFLICT (satellite_id, timestamp_collected) DO NOTHING;
            """), {"sat_id": sat_id, "name": name, "line1": line1, "line2": line2, "now": now, "raan_deg": raan_deg})
        except Exception as e:
            # Retry insert without raan_deg in case column doesn't exist
            session.rollback()
            session.execute(text("""
                INSERT INTO dev.tle_snapshots (satellite_id, name, tle_line1, tle_line2, timestamp_collected)
                VALUES (:sat_id, :name, :line1, :line2, :now)
                ON CONFLICT (satellite_id, timestamp_collected) DO NOTHING;
            """), {"sat_id": sat_id, "name": name, "line1": line1, "line2": line2, "now": now})

        inserted += 1

    except Exception as e:
        print(f"❌ Error inserting satellite {i//3}: {e}")
        session.rollback()

session.commit()
session.close()

print(f"✅ TLE snapshot stored successfully. {inserted} entries attempted.")
