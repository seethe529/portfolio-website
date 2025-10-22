#!/bin/bash
# One-command demo starter for Orbital Governance MVP

echo "🛰️  EXTRA ORBITAL SOLUTIONS DEMO STARTER"
echo "=================================="
echo ""

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
cd "$SCRIPT_DIR"

echo "📍 Working directory: $SCRIPT_DIR"
echo ""

# Check PostgreSQL
echo "🔍 Checking PostgreSQL..."
if pg_isready -q; then
    echo "✅ PostgreSQL is running"
else
    echo "❌ PostgreSQL is not running"
    echo "   Please start PostgreSQL first"
    exit 1
fi

# Check database connection
echo "🔍 Checking database connection..."
python3 -c "import psycopg2; psycopg2.connect(host='localhost', database='extra_orbital', user='postgres')" 2>/dev/null
if [ $? -eq 0 ]; then
    echo "✅ Database connection successful"
else
    echo "❌ Cannot connect to database 'extra_orbital'"
    echo "   Please check your PostgreSQL setup"
    exit 1
fi

# Check Flask installation
echo "🔍 Checking Flask installation..."
python3 -c "import flask, flask_cors, psycopg2, sqlalchemy" 2>/dev/null
if [ $? -eq 0 ]; then
    echo "✅ All Python packages installed"
else
    echo "📦 Installing required packages..."
    pip3 install flask flask-cors psycopg2-binary sqlalchemy
fi

# Quick data check
echo "🔍 Checking data..."
TRACT_COUNT=$(psql -d extra_orbital -t -c "SELECT COUNT(*) FROM dev.tracts;" 2>/dev/null | xargs)
SAT_COUNT=$(psql -d extra_orbital -t -c "SELECT COUNT(*) FROM dev.tle_snapshots WHERE position IS NOT NULL;" 2>/dev/null | xargs)

if [ "$TRACT_COUNT" -gt 0 ] && [ "$SAT_COUNT" -gt 0 ]; then
    echo "✅ Data ready: $TRACT_COUNT tracts, $SAT_COUNT satellites"
else
    echo "⚠️  Warning: Limited data available"
fi

echo ""
echo "🚀 STARTING DEMO SERVER..."
echo "📡 Demo will be available at: http://localhost:3000"
echo "🌐 Open your browser to: http://localhost:3000"
echo "🔄 Press Ctrl+C to stop the server"
echo ""
echo "🎯 Perfect for your OneDay MBA presentation!"
echo ""

# Start the Flask server
cd api
python3 app.py