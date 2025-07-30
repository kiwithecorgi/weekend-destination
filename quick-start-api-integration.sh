#!/bin/bash

echo "🚀 QUICK START: API Integration & Cleanup"
echo "=========================================="

# Step 1: Kill all processes
echo "🔄 Killing all existing processes..."
pkill -f "node index.js" 2>/dev/null || true
pkill -f "nodemon" 2>/dev/null || true
pkill -f "react-scripts" 2>/dev/null || true
sleep 3

# Step 2: Remove ALL Firebase and old service files
echo "🗑️ Removing ALL Firebase and old service files..."
find . -name "*firebase*" -type f -delete 2>/dev/null || true
find . -name "*recommendationService*" -type f -delete 2>/dev/null || true
rm -rf server/config/firebase.js 2>/dev/null || true
rm -rf server/services/recommendationService.js 2>/dev/null || true
rm -rf server/services/enhanced 2>/dev/null || true
rm -rf server/routes/feedback.js 2>/dev/null || true
rm -rf server/routes/places.js 2>/dev/null || true
rm -rf server/routes/recommendations.js 2>/dev/null || true
rm -rf server/routes/googleMapsRecommendations.js 2>/dev/null || true

# Step 3: Clean and reinstall server
echo "📦 Cleaning and reinstalling server dependencies..."
cd server
rm -rf node_modules package-lock.json
npm install
echo "✅ Server dependencies installed"

# Step 4: Start server
echo "🚀 Starting server on port 5002..."
PORT=5002 node index.js &
SERVER_PID=$!
echo "✅ Server started with PID: $SERVER_PID"

# Step 5: Wait and test
echo "⏳ Waiting for server to be ready..."
sleep 5
echo "🏥 Testing server health..."
curl -s http://localhost:5002/health | head -20
echo ""

# Step 6: Start client
echo "🎨 Starting client on port 3000..."
cd ../client
npm start &
CLIENT_PID=$!
echo "✅ Client started with PID: $CLIENT_PID"

# Step 7: Final status
echo ""
echo "🎉 QUICK START COMPLETE! Your app should be running at:"
echo "   🌐 Frontend: http://localhost:3000"
echo "   🔧 Backend: http://localhost:5002"
echo "   🏥 Health: http://localhost:5002/health"
echo ""
echo "📝 To stop the app, run: pkill -f 'node index.js' && pkill -f 'react-scripts'"
echo "" 