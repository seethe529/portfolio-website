# 🚀 Quick Start Guide

## How to Start the Server

### Option 1: One Command (Recommended)
```bash
./START_DEMO.sh
```

### Option 2: Manual Steps
```bash
cd api
python3 app.py
```

## What You'll See
```
🛰️  Starting Extra Orbital Solutions Demo Server...
📡 Demo available at: http://localhost:3000
 * Serving Flask app 'app'
 * Debug mode: on
```

## Open the Demo
1. **Open your browser**
2. **Go to**: http://localhost:3000
3. **You should see**: Orbital Governance System dashboard

## Stop the Server
- Press `Ctrl+C` in the terminal

## Troubleshooting

### Port Already in Use
```bash
# Kill any process on port 3000
lsof -ti:3000 | xargs kill -9
# Then restart
python3 app.py
```

### Database Connection Error
```bash
# Check PostgreSQL is running
pg_isready
# Should show: accepting connections
```

### Missing Python Packages
```bash
pip3 install flask flask-cors psycopg2-binary
```

## What Extra Orbital Solutions Shows
- **12,981 satellites** from your PostgreSQL database
- **95,904 orbital tracts** available for reservation
- **Real-time search** and filtering
- **Collision risk indicators**
- **Live data updates** every 30 seconds

## Files You Need to Know
- `api/app.py` - The Flask server (this is what you run)
- `frontend/templates/index.html` - The web page
- `frontend/static/app.js` - The interactive features
- `frontend/static/style.css` - The styling

That's it! The server connects to your PostgreSQL database automatically.