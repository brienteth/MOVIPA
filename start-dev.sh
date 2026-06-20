#!/bin/bash

# Bendle Development Startup Script
echo "🚀 Starting Bendle Development Environment"

# Check if we're in the right directory
if [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    echo "❌ Error: Please run this script from the Bendle root directory"
    exit 1
fi

# Start backend
echo "🔧 Starting Backend (FastAPI)..."
cd backend
if [ ! -d "venv" ]; then
    echo "📦 Creating Python virtual environment..."
    python3 -m venv venv
fi
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!
echo "✅ Backend started on http://localhost:8000 (PID: $BACKEND_PID)"
cd ..

# Start frontend
echo "🎨 Starting Frontend (React)..."
cd frontend
npm install
npm start &
FRONTEND_PID=$!
echo "✅ Frontend started on http://localhost:3000 (PID: $FRONTEND_PID)"
cd ..

# Save PIDs for cleanup
echo $BACKEND_PID > .backend.pid
echo $FRONTEND_PID > .frontend.pid

echo ""
echo "🎉 Bendle is running!"
echo "📱 Frontend: http://localhost:3000"
echo "🔌 Backend API: http://localhost:8000"
echo "📚 API Docs: http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for Ctrl+C
trap "echo '🛑 Stopping Bendle...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; rm -f .backend.pid .frontend.pid; exit" INT
wait