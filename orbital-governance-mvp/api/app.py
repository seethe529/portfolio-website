from flask import Flask, jsonify, request, render_template
from flask_cors import CORS
import psycopg2
import os
from datetime import datetime

app = Flask(__name__, template_folder='../frontend/templates', static_folder='../frontend/static')
CORS(app)

def get_db():
    """Get database connection"""
    return psycopg2.connect(
        host=os.getenv('DB_HOST', 'localhost'),
        database=os.getenv('DB_NAME', 'extra_orbital'),
        user=os.getenv('DB_USER', 'postgres'),
        password=os.getenv('DB_PASSWORD', '')
    )

@app.route('/')
def index():
    """Main demo page"""
    return render_template('index.html')

@app.route('/api/stats')
def get_stats():
    """Get system statistics"""
    try:
        conn = get_db()
        cur = conn.cursor()
        
        # Total tracts
        cur.execute("SELECT COUNT(*) FROM dev.tracts")
        total_tracts = cur.fetchone()[0]
        
        # Active satellites
        cur.execute("SELECT COUNT(*) FROM dev.tle_snapshots WHERE position IS NOT NULL")
        active_satellites = cur.fetchone()[0]
        
        conn.close()
        
        return jsonify({
            'total_tracts': total_tracts,
            'active_satellites': active_satellites,
            'available_tracts': total_tracts - active_satellites,
            'last_updated': datetime.now().isoformat()
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/satellites')
def get_satellites():
    """Get live satellite data"""
    try:
        conn = get_db()
        cur = conn.cursor()
        cur.execute("""
            SELECT satellite_id, name, altitude, inclination, longitude, latitude 
            FROM dev.tle_snapshots 
            WHERE position IS NOT NULL 
            ORDER BY name
        """)
        
        satellites = []
        for row in cur.fetchall():
            satellites.append({
                'satellite_id': row[0],
                'name': row[1],
                'altitude': round(row[2], 1),
                'inclination': round(row[3], 1),
                'longitude': round(row[4], 1),
                'latitude': round(row[5], 1)
            })
        
        conn.close()
        return jsonify(satellites)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/tracts/available')
def get_available_tracts():
    """Find available orbital tracts"""
    altitude = request.args.get('altitude', type=float)
    inclination = request.args.get('inclination', type=float)
    
    try:
        conn = get_db()
        cur = conn.cursor()
        
        # Find tracts matching criteria
        cur.execute("""
            SELECT tract_id, alt_min, alt_max, inc_min, inc_max, az_min, az_max
            FROM dev.tracts 
            WHERE %s BETWEEN alt_min AND alt_max 
            AND %s BETWEEN inc_min AND inc_max
            LIMIT 10
        """, (altitude, inclination))
        
        tracts = []
        for row in cur.fetchall():
            tracts.append({
                'tract_id': row[0],
                'altitude_range': f"{row[1]}-{row[2]}km",
                'inclination_range': f"{row[3]}-{row[4]}°",
                'raan_range': f"{row[5]}-{row[6]}°"
            })
        
        conn.close()
        return jsonify(tracts)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/satellites/register', methods=['POST'])
def register_satellite():
    """Register a new satellite in an orbital tract"""
    try:
        data = request.json
        required_fields = ['satellite_name', 'operator', 'tract_id', 'mission_type']
        
        # Validate required fields
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        conn = get_db()
        cur = conn.cursor()
        
        # Verify tract exists and get details
        cur.execute("""
            SELECT tract_id, alt_min, alt_max, inc_min, inc_max, az_min, az_max
            FROM dev.tracts WHERE tract_id = %s
        """, (data['tract_id'],))
        
        tract = cur.fetchone()
        if not tract:
            return jsonify({'error': 'Invalid tract ID'}), 400
        
        # Generate registration ID
        registration_id = f"REG-{data['tract_id']}-{datetime.now().strftime('%Y%m%d%H%M%S')}"
        
        # For demo purposes, we'll create a simple registration record
        # In production, this would integrate with actual satellite databases
        registration = {
            'registration_id': registration_id,
            'satellite_name': data['satellite_name'],
            'operator': data['operator'],
            'tract_id': data['tract_id'],
            'mission_type': data['mission_type'],
            'status': 'APPROVED',
            'registered_at': datetime.now().isoformat(),
            'tract_details': {
                'altitude_range': f"{tract[1]}-{tract[2]}km",
                'inclination_range': f"{tract[3]}-{tract[4]}°",
                'raan_range': f"{tract[5]}-{tract[6]}°"
            }
        }
        
        conn.close()
        return jsonify(registration)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    print("🛰️  Starting Extra Orbital Solutions Demo Server...")
    print("📡 Demo available at: http://localhost:3000")
    app.run(debug=True, host='0.0.0.0', port=3000)
