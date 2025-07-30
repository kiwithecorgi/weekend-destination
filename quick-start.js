// Quick start script to test everything
const { exec, spawn } = require('child_process');
const axios = require('axios');

console.log('🚀 Quick Start - Weekender App');

// Kill any existing processes
console.log('🧹 Cleaning up existing processes...');
exec('lsof -ti:5000,5001,5002,3000 | xargs kill -9', (error) => {
  if (error && !error.message.includes('No such process')) {
    console.log('Note: Some processes may have been cleaned up');
  }
  
  setTimeout(() => {
    startServer();
  }, 2000);
});

function startServer() {
  console.log('🎯 Starting backend server on port 5002...');
  
  // Simple test server
  const express = require('express');
  const cors = require('cors');
  
  const app = express();
  const PORT = 5002;
  
  app.use(cors());
  app.use(express.json());
  
  app.get('/health', (req, res) => {
    res.json({ 
      status: 'OK', 
      port: PORT, 
      timestamp: new Date().toISOString(),
      message: 'Backend is working!' 
    });
  });
  
  app.post('/api/recommendations', (req, res) => {
    console.log('📍 Received recommendation request:', req.body);
    res.json({
      success: true,
      demoMode: true,
      city: req.body.city,
      packs: [
        {
          core: {
            name: `Golden Gate Park - ${req.body.city}`,
            rating: 4.8,
            vicinity: `${req.body.city}, CA`,
            dogFriendly: true,
            kidFriendly: true
          },
          eta: {
            durationText: '15 mins',
            distanceText: '5 km'
          },
          spokes: [
            { name: 'Dog-Friendly Cafe', type: 'cafe' },
            { name: 'Family Restaurant', type: 'restaurant' }
          ]
        },
        {
          core: {
            name: `Crissy Field - ${req.body.city}`,
            rating: 4.7,
            vicinity: `${req.body.city}, CA`,
            dogFriendly: true,
            kidFriendly: true
          },
          eta: {
            durationText: '20 mins',
            distanceText: '8 km'
          },
          spokes: [
            { name: 'Ice Cream Shop', type: 'food' },
            { name: 'Pet Store', type: 'shopping' }
          ]
        }
      ]
    });
  });
  
  app.listen(PORT, () => {
    console.log(`✅ Backend server running on port ${PORT}`);
    console.log(`🔗 Health: http://localhost:${PORT}/health`);
    console.log(`🔗 API: http://localhost:${PORT}/api/recommendations`);
    console.log('');
    console.log('🌐 Now start the frontend:');
    console.log('   cd client && npm install --legacy-peer-deps && npm start');
    console.log('');
    console.log('📱 Then open: http://localhost:3000');
  });
} 