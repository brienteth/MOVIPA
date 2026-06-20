#!/bin/bash

# Bendle Production Startup Script
echo "🚀 Starting Bendle Production Environment"

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    echo "❌ PM2 is not installed. Installing..."
    npm install -g pm2
fi

# Start backend with PM2
echo "🔧 Starting Backend (FastAPI)..."
cd backend
if [ ! -d "venv" ]; then
    echo "📦 Creating Python virtual environment..."
    python3 -m venv venv
fi
source venv/bin/activate
pip install -r requirements.txt

# Create PM2 ecosystem file for backend
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'bendle-backend',
    script: 'main.py',
    interpreter: 'venv/bin/python',
    cwd: process.cwd(),
    env: {
      PORT: 8000,
      NODE_ENV: 'production'
    }
  }]
};
EOF

pm2 start ecosystem.config.js
cd ..

# Build and start frontend
echo "🎨 Building and Starting Frontend (React)..."
cd frontend
npm install
npm run build

# Serve built frontend with PM2
pm2 serve build 3000 --name bendle-frontend --spa
cd ..

echo ""
echo "🎉 Bendle Production is running!"
echo "📱 Frontend: http://localhost:3000"
echo "🔌 Backend API: http://localhost:8000"
echo ""
echo "📊 PM2 Status:"
pm2 list
echo ""
echo "To stop: pm2 stop all"
echo "To restart: pm2 restart all"
echo "To view logs: pm2 logs"