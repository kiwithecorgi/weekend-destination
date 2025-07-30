#!/bin/bash

echo "🚀 Starting Weekender App..."

# Kill any existing processes on relevant ports
echo "🧹 Cleaning up existing processes..."
lsof -ti:5000,5001,5002,3000 | xargs -r kill -9 2>/dev/null || true

# Wait a moment
sleep 2

echo "📦 Installing client dependencies..."
cd client
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps

echo "🎯 Starting backend server..."
cd ../server
node index.js &
SERVER_PID=$!

# Wait for server to start
sleep 5

echo "🌐 Starting frontend client..."
cd ../client
npm start &
CLIENT_PID=$!

echo ""
echo "✅ Application is starting!"
echo ""
echo "🔗 Backend: http://localhost:5002"
echo "🔗 Frontend: http://localhost:3000"
echo "🔗 Health Check: http://localhost:5002/health"
echo ""
echo "📋 Process IDs:"
echo "   Server PID: $SERVER_PID"
echo "   Client PID: $CLIENT_PID"
echo ""
echo "To stop the application, run:"
echo "   kill $SERVER_PID $CLIENT_PID"

# Keep script running
wait 