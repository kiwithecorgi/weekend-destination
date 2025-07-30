// Simple test to verify server can start
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 5002;

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'OK', port: PORT, timestamp: new Date().toISOString() });
});

app.post('/api/recommendations', (req, res) => {
  console.log('Received request:', req.body);
  res.json({
    success: true,
    demoMode: true,
    packs: [
      {
        core: {
          name: 'Golden Gate Park',
          rating: 4.8,
          vicinity: 'San Francisco, CA',
          dogFriendly: true,
          kidFriendly: true
        },
        eta: {
          durationText: '15 mins',
          distanceText: '5 km'
        },
        spokes: [
          { name: 'Cafe Nearby', type: 'cafe' },
          { name: 'Family Restaurant', type: 'restaurant' }
        ]
      }
    ]
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Test server running on port ${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
}); 