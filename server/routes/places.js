const express = require('express');
const router = express.Router();
const { Client } = require('@googlemaps/google-maps-services-js');
const { validateRequest, placeSearchSchema } = require('../middleware/validation');
const NodeCache = require('node-cache');

const client = new Client({});
const cache = new NodeCache({
  stdTTL: 3600, // 1 hour
  checkperiod: 600
});

// GET /api/places/search
// Search for places with optional filters
router.get('/search', async (req, res, next) => {
  try {
    const { query, lat, lng, radius = 5000, types } = req.query;

    if (!query) {
      return res.status(400).json({
        error: {
          message: 'Query parameter is required'
        }
      });
    }

    const cacheKey = `places_search_${query}_${lat}_${lng}_${radius}_${types}`;
    let results = cache.get(cacheKey);

    if (!results) {
      const params = {
        query,
        key: process.env.GOOGLE_PLACES_API_KEY
      };

      if (lat && lng) {
        params.location = { lat: parseFloat(lat), lng: parseFloat(lng) };
        params.radius = parseInt(radius);
      }

      if (types) {
        params.type = types.split(',')[0]; // Use first type
      }

      const response = await client.textSearch({ params });
      results = response.data.results;

      cache.set(cacheKey, results, 1800); // Cache for 30 minutes
    }

    res.json({
      success: true,
      data: {
        results,
        count: results.length
      }
    });

  } catch (error) {
    console.error('Error searching places:', error);
    next(error);
  }
});

// GET /api/places/details/:placeId
// Get detailed information about a specific place
router.get('/details/:placeId', async (req, res, next) => {
  try {
    const { placeId } = req.params;
    const { fields = 'name,rating,user_ratings_total,formatted_address,opening_hours,price_level,types,geometry,photos' } = req.query;

    const cacheKey = `place_details_${placeId}_${fields}`;
    let details = cache.get(cacheKey);

    if (!details) {
      const response = await client.placeDetails({
        params: {
          place_id: placeId,
          fields: fields.split(','),
          key: process.env.GOOGLE_PLACES_API_KEY
        }
      });

      details = response.data.result;
      cache.set(cacheKey, details, 86400); // Cache for 24 hours
    }

    res.json({
      success: true,
      data: details
    });

  } catch (error) {
    console.error('Error getting place details:', error);
    next(error);
  }
});

// GET /api/places/nearby
// Find places near a location
router.get('/nearby', async (req, res, next) => {
  try {
    const { lat, lng, radius = 5000, type, keyword } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        error: {
          message: 'Latitude and longitude are required'
        }
      });
    }

    const cacheKey = `places_nearby_${lat}_${lng}_${radius}_${type}_${keyword}`;
    let results = cache.get(cacheKey);

    if (!results) {
      const params = {
        location: { lat: parseFloat(lat), lng: parseFloat(lng) },
        radius: parseInt(radius),
        key: process.env.GOOGLE_PLACES_API_KEY
      };

      if (type) {
        params.type = type;
      }

      if (keyword) {
        params.keyword = keyword;
      }

      const response = await client.placesNearby({ params });
      results = response.data.results;

      cache.set(cacheKey, results, 1800); // Cache for 30 minutes
    }

    res.json({
      success: true,
      data: {
        results,
        count: results.length
      }
    });

  } catch (error) {
    console.error('Error finding nearby places:', error);
    next(error);
  }
});

// GET /api/places/autocomplete
// Get place autocomplete suggestions
router.get('/autocomplete', async (req, res, next) => {
  try {
    const { input, lat, lng, radius = 50000 } = req.query;

    if (!input) {
      return res.status(400).json({
        error: {
          message: 'Input parameter is required'
        }
      });
    }

    const cacheKey = `places_autocomplete_${input}_${lat}_${lng}`;
    let predictions = cache.get(cacheKey);

    if (!predictions) {
      const params = {
        input,
        key: process.env.GOOGLE_PLACES_API_KEY,
        types: '(cities)' // Restrict to cities for now
      };

      if (lat && lng) {
        params.location = { lat: parseFloat(lat), lng: parseFloat(lng) };
        params.radius = parseInt(radius);
      }

      const response = await client.placeAutocomplete({ params });
      predictions = response.data.predictions;

      cache.set(cacheKey, predictions, 3600); // Cache for 1 hour
    }

    res.json({
      success: true,
      data: {
        predictions,
        count: predictions.length
      }
    });

  } catch (error) {
    console.error('Error getting autocomplete:', error);
    next(error);
  }
});

// GET /api/places/geocode
// Geocode an address to coordinates
router.get('/geocode', async (req, res, next) => {
  try {
    const { address } = req.query;

    if (!address) {
      return res.status(400).json({
        error: {
          message: 'Address parameter is required'
        }
      });
    }

    const cacheKey = `geocode_${address}`;
    let result = cache.get(cacheKey);

    if (!result) {
      const response = await client.geocode({
        params: {
          address,
          key: process.env.GOOGLE_PLACES_API_KEY
        }
      });

      if (response.data.results.length > 0) {
        result = {
          location: response.data.results[0].geometry.location,
          formattedAddress: response.data.results[0].formatted_address,
          placeId: response.data.results[0].place_id
        };
      } else {
        result = null;
      }

      cache.set(cacheKey, result, 86400); // Cache for 24 hours
    }

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Error geocoding address:', error);
    next(error);
  }
});

// GET /api/places/distance
// Calculate distance and travel time between two points
router.get('/distance', async (req, res, next) => {
  try {
    const { origin, destination, mode = 'driving' } = req.query;

    if (!origin || !destination) {
      return res.status(400).json({
        error: {
          message: 'Origin and destination are required'
        }
      });
    }

    const cacheKey = `distance_${origin}_${destination}_${mode}`;
    let result = cache.get(cacheKey);

    if (!result) {
      const response = await client.distancematrix({
        params: {
          origins: [origin],
          destinations: [destination],
          mode,
          key: process.env.GOOGLE_PLACES_API_KEY
        }
      });

      const element = response.data.rows[0]?.elements[0];
      if (element && element.status === 'OK') {
        result = {
          distance: element.distance,
          duration: element.duration,
          mode
        };
      } else {
        result = {
          error: 'Could not calculate distance',
          status: element?.status
        };
      }

      cache.set(cacheKey, result, 3600); // Cache for 1 hour
    }

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Error calculating distance:', error);
    next(error);
  }
});

module.exports = router; 