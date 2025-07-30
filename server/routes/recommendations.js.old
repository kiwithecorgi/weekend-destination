const express = require('express');
const EnhancedRecommendationService = require('../services/enhanced/enhancedRecommendationService');

const router = express.Router();
const recommendationService = new EnhancedRecommendationService();

router.post('/recommendations', async (req, res) => {
  const startTime = Date.now();
  
  try {
    console.log('📍 Recommendation request received for:', req.body.city);
    
    const result = await recommendationService.generateRecommendations(req.body);
    
    const duration = Date.now() - startTime;
    console.log(`⚡ Response generated in ${duration}ms`);
    
    res.json(result);
  } catch (error) {
    console.error('❌ API Error:', error.message);
    
    // Fallback to demo mode on error
    const demoResult = {
      demoMode: true,
      packs: [
        {
          core: {
            name: "Golden Gate Park in " + req.body.city,
            rating: 4.8,
            vicinity: req.body.city,
            dogFriendly: true,
            kidFriendly: true
          },
          eta: { durationText: "20 mins" },
          spokes: [{ name: "Dog-friendly Cafe", type: "cafe" }]
        }
      ],
      weather: {
        temperature: 72,
        description: "partly cloudy",
        icon: "02d"
      }
    };
    
    res.json(demoResult);
  }
});

module.exports = router;
