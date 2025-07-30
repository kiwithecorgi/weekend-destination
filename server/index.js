require('dotenv').config();
const express = require('express');
const cors = require('cors');

// Try to load Google Maps service, but don't fail if it doesn't work
let GoogleMapsRecommendationService;
let recommendationService;

try {
  GoogleMapsRecommendationService = require('./services/googleMapsRecommendationService');
  recommendationService = new GoogleMapsRecommendationService();
  console.log('✅ Google Maps service loaded successfully');
} catch (error) {
  console.log('⚠️ Google Maps service not available, using fallback mode');
  recommendationService = null;
}

const app = express();
const PORT = process.env.PORT || 5002;

app.use(cors());
app.use(express.json());

// Health check endpoint with Google Maps status
app.get('/health', (req, res) => {
  console.log('✅ Health check endpoint hit!');
  
  const googleMapsStatus = process.env.GOOGLE_PLACES_API_KEY && 
                          !process.env.GOOGLE_PLACES_API_KEY.includes('your_google');
  
  res.json({ 
    status: 'OK', 
    port: PORT,
    googleMapsIntegration: googleMapsStatus ? 'active' : 'demo_mode',
    dataSource: googleMapsStatus ? 'Google Maps Platform' : 'Demo Data',
    timestamp: new Date().toISOString()
  });
});

// Google Maps powered recommendations endpoint
app.post('/api/recommendations', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const city = req.body.city || 'San Francisco';
    console.log(`✅ Google Maps recommendation request received for: ${city}`);
    console.log(`🎯 Selected activities: ${req.body.activities?.join(', ') || 'None'}`);
    
    // Use Google Maps service if available, otherwise use fallback
    let result;
    if (recommendationService) {
      result = await recommendationService.generateRecommendations(req.body);
    } else {
      // Fallback response
      result = {
        success: true,
        demoMode: true,
        packs: [
          {
            core: { 
              name: `Top-Rated Family Destination in ${city}`, 
              description: 'A highly-rated Google Maps location perfect for family adventures',
              rating: 4.7, 
              reviewCount: 342,
              vicinity: city, 
              dogFriendly: req.body.hasDog || false, 
              kidFriendly: req.body.kids > 0,
              priceLevel: 1,
              googleData: {
                placeId: 'demo_place_1',
                phone: null,
                website: null,
                isOpen: true,
                photos: []
              }
            },
            eta: { durationText: '15 mins' },
            spokes: [
              { name: 'Family-Friendly Café', type: 'restaurant' },
              { name: 'Local Playground', type: 'park' }
            ],
            itinerary: [
              {
                activity: "Arrival & Exploration",
                duration: "30 min",
                description: "Get oriented and explore the area"
              },
              {
                activity: "Main Family Activity", 
                duration: "90 min",
                description: "Enjoy quality time with family and pets"
              },
              {
                activity: "Nearby Discovery",
                duration: "45 min", 
                description: "Visit a nearby attraction or grab refreshments"
              }
            ]
          }
        ],
        dataSource: 'Demo Mode (Google Maps style)',
        totalResults: 1,
        searchParams: req.body
      };
    }
    
    const duration = Date.now() - startTime;
    console.log(`⚡ Response generated in ${duration}ms using ${result.dataSource}`);
    
    res.json({
      success: true,
      ...result,
      meta: {
        processingTime: `${duration}ms`,
        apiProvider: result.dataSource,
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('❌ API Error:', error.message);
    
    // Enhanced fallback with Google Maps style data
    const city = req.body.city || 'your city';
    res.json({
      success: true,
      demoMode: true,
      packs: [
        {
          core: { 
            name: `Top-Rated Family Destination in ${city}`, 
            description: 'A highly-rated Google Maps location perfect for family adventures',
            rating: 4.7, 
            reviewCount: 342,
            vicinity: city, 
            dogFriendly: req.body.hasDog || false, 
            kidFriendly: req.body.kids > 0,
            priceLevel: 1,
            googleData: {
              placeId: 'demo_place_1',
              phone: null,
              website: null,
              isOpen: true,
              photos: []
            }
          },
          eta: { durationText: '15 mins' },
          spokes: [
            { name: 'Family-Friendly Café', type: 'restaurant' },
            { name: 'Local Playground', type: 'park' }
          ],
          itinerary: [
            {
              activity: "Arrival & Exploration",
              duration: "30 min",
              description: "Get oriented and explore the area"
            },
            {
              activity: "Main Family Activity", 
              duration: "90 min",
              description: "Enjoy quality time with family and pets"
            },
            {
              activity: "Nearby Discovery",
              duration: "45 min", 
              description: "Visit a nearby attraction or grab refreshments"
            }
          ]
        }
      ],
      dataSource: 'Demo Mode (Google Maps style)',
      totalResults: 1,
      searchParams: req.body
    });
  }
});

// Alternative health endpoint (for compatibility)
app.get('/api/health', (req, res) => {
  const googleMapsStatus = process.env.GOOGLE_PLACES_API_KEY && 
                          !process.env.GOOGLE_PLACES_API_KEY.includes('your_google');
  
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    googleMapsIntegration: googleMapsStatus ? 'active' : 'demo_mode',
    endpoints: {
      recommendations: '/api/recommendations',
      health: '/health'
    }
  });
});

app.listen(PORT, () => {
  console.log(`🗺️ Google Maps powered server is LIVE on http://localhost:${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  
  // Check Google Maps integration status
  if (process.env.GOOGLE_PLACES_API_KEY && process.env.GOOGLE_MAPS_API_KEY) {
    console.log('✅ Google Maps Platform integration: ACTIVE');
  } else {
    console.log('⚠️ Google Maps integration: DEMO MODE');
    console.log('   Add your API keys to .env to enable real Google Maps data');
  }
});
