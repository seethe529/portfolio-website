#!/bin/bash
echo "🚀 Setting up Orbital Governance MVP..."

# Check if PostgreSQL is running
if ! pg_isready -q; then
    echo "❌ PostgreSQL is not running. Please start PostgreSQL first."
    exit 1
fi

# Install Python dependencies
echo "📦 Installing Python dependencies..."
pip install -r requirements.txt

# Check database connection
echo "🔍 Checking database connection..."
python3 -c "import psycopg2; psycopg2.connect(host='localhost', database='extra_orbital', user='postgres')" 2>/dev/null
if [ $? -eq 0 ]; then
    echo "✅ Database connection successful"
else
    echo "❌ Cannot connect to database 'extra_orbital'. Please check your PostgreSQL setup."
    exit 1
fi

# Calculate satellite positions if needed
echo "🛰️  Calculating satellite positions..."
python3 database/calculate_positions.py

echo "✅ Setup complete!"
echo "🚀 Run './scripts/run_demo.sh' to start the demo server"
