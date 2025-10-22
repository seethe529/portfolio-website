#!/bin/bash
echo "🛰️  Starting Extra Orbital Solutions Demo..."
echo "📡 Demo will be available at: http://localhost:3000"
echo "🔄 Press Ctrl+C to stop the server"
echo "🌐 Open your browser to: http://localhost:3000"
echo ""

# Check if we're in the right directory
if [ ! -f "api/app.py" ]; then
    echo "❌ Error: Run this script from the orbital-governance-mvp directory"
    echo "   cd /Users/ryanl/Desktop/orbital-tract-generator/orbital-governance-mvp"
    echo "   ./scripts/run_demo.sh"
    exit 1
fi

# Check if Flask is installed
python3 -c "import flask" 2>/dev/null
if [ $? -ne 0 ]; then
    echo "❌ Flask not installed. Installing now..."
    pip3 install flask flask-cors psycopg2-binary sqlalchemy
fi

# Start the server
echo "🚀 Starting Flask server..."
cd api
python3 app.py
