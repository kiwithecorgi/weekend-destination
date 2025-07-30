#!/bin/bash

echo "🧹 COMPREHENSIVE CLEANUP & STARTUP SCRIPT"
echo "=========================================="

# Kill all existing processes
echo "🔄 Killing existing processes..."
pkill -f "node index.js" 2>/dev/null || true
pkill -f "nodemon" 2>/dev/null || true
pkill -f "react-scripts" 2>/dev/null || true
sleep 2

# Clean up node_modules and reinstall
echo "📦 Cleaning and reinstalling server dependencies..."
cd server
rm -rf node_modules package-lock.json
npm install
echo "✅ Server dependencies installed"

# Start server in background
echo "🚀 Starting server on port 5002..."
PORT=5002 node index.js &
SERVER_PID=$!
echo "✅ Server started with PID: $SERVER_PID"

# Wait for server to be ready
echo "⏳ Waiting for server to be ready..."
sleep 5

# Test server health
echo "🏥 Testing server health..."
curl -s http://localhost:5002/health | head -20
echo ""

# Start client in background
echo "🎨 Starting client on port 3000..."
cd ../client
npm start &
CLIENT_PID=$!
echo "✅ Client started with PID: $CLIENT_PID"

# Wait for client to be ready
echo "⏳ Waiting for client to be ready..."
sleep 10

echo ""
echo "🎉 CLEANUP COMPLETE! Your app should be running at:"
echo "   🌐 Frontend: http://localhost:3000"
echo "   🔧 Backend: http://localhost:5002"
echo "   🏥 Health: http://localhost:5002/health"
echo ""
echo "📝 To stop the app, run: pkill -f 'node index.js' && pkill -f 'react-scripts'"
echo "" 