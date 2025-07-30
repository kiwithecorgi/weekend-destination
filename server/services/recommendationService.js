const { Client } = require('@googlemaps/google-maps-services-js');
const { getFirestore } = require('../config/firebase');
const NodeCache = require('node-cache');

const client = new Client({});
const cache = new NodeCache({
  stdTTL: parseInt(process.env.CACHE_TTL) || 3600,
  checkperiod: parseInt(process.env.CACHE_CHECK_PERIOD) || 600
});

// Activity type mappings for Google Places API
const ACTIVITY_TYPES = {
  'Hiking': ['natural_feature', 'park'],
  'Beach': ['natural_feature'],
  'Playgrounds': ['park'],
  'Scenic Drives': ['natural_feature', 'tourist_attraction'],
  'Shopping': ['shopping_mall', 'store'],
  'Farmers Markets': ['food'],
  'Picnic Areas': ['park'],
  'Breweries': ['food', 'bar'],
  'Museums': ['museum'],
  'Parks': ['park'],
  'Restaurants': ['restaurant'],
  'Coffee Shops': ['cafe']
};

// Dog-friendly keywords
const DOG_FRIENDLY_KEYWORDS = [
  'dog friendly', 'pet friendly', 'dogs welcome', 'pets welcome',
  'dog park', 'off leash', 'dog beach', 'pet friendly patio'
];

// Kid-friendly activity types
const KID_FRIENDLY_TYPES = ['park', 'playground', 'museum', 'aquarium', 'zoo'];

// Demo data for when API is not available
const DEMO_PLACES = {
  'San Francisco': [
    {
      place_id: 'demo_sf_1',
      name: 'Golden Gate Park',
      rating: 4.8,
      user_ratings_total: 15420,
      vicinity: 'San Francisco, CA',
      types: ['park', 'natural_feature'],
      geometry: { location: { lat: 37.7694, lng: -122.4862 } },
      activity: 'Parks',
      dogFriendly: true,
      kidFriendly: true
    },
    {
      place_id: 'demo_sf_2',
      name: 'Crissy Field',
      rating: 4.7,
      user_ratings_total: 8920,
      vicinity: 'San Francisco, CA',
      types: ['park', 'natural_feature'],
      geometry: { location: { lat: 37.8063, lng: -122.4659 } },
      activity: 'Beach',
      dogFriendly: true,
      kidFriendly: true
    },
    {
      place_id: 'demo_sf_3',
      name: 'Fisherman\'s Wharf',
      rating: 4.2,
      user_ratings_total: 45670,
      vicinity: 'San Francisco, CA',
      types: ['tourist_attraction', 'food'],
      geometry: { location: { lat: 37.8080, lng: -122.4177 } },
      activity: 'Shopping',
      dogFriendly: false,
      kidFriendly: true
    }
  ],
  'Oakland': [
    {
      place_id: 'demo_oak_1',
      name: 'Lake Merritt',
      rating: 4.6,
      user_ratings_total: 12340,
      vicinity: 'Oakland, CA',
      types: ['park', 'natural_feature'],
      geometry: { location: { lat: 37.8021, lng: -122.2576 } },
      activity: 'Parks',
      dogFriendly: true,
      kidFriendly: true
    }
  ]
};

class RecommendationService {
  constructor() {
    this.db = getFirestore();
    this.hasApiKey = !!process.env.GOOGLE_PLACES_API_KEY;
    
    if (!this.hasApiKey) {
      console.warn('⚠️  Google Places API key not set. Running in demo mode.');
    }
  }

  async generateRecommendations(preferences) {
    const { city, adults, kids, hasDog, hasCar, travelTime, activities } = preferences;
    
    try {
      // Get city coordinates
      const cityCoords = await this.getCityCoordinates(city);
      if (!cityCoords) {
        throw new Error(`Could not find coordinates for ${city}`);
      }

      // Calculate search radius based on car availability
      const searchRadius = hasCar ? Math.min(travelTime * 1000, 50000) : 8000; // 8km for no car

      // Get candidate places for each activity
      const allCandidates = [];
      for (const activity of activities) {
        const candidates = await this.getPlacesForActivity(
          cityCoords,
          activity,
          searchRadius,
          hasDog
        );
        allCandidates.push(...candidates);
      }

      // Filter and rank candidates
      const rankedCandidates = this.rankCandidates(allCandidates, preferences);

      // Generate 3 outing packs
      const packs = await this.generateOutingPacks(rankedCandidates, cityCoords, preferences);

      return {
        success: true,
        packs,
        metadata: {
          totalCandidates: allCandidates.length,
          searchRadius,
          city,
          generatedAt: new Date().toISOString(),
          demoMode: !this.hasApiKey
        }
      };

    } catch (error) {
      console.error('Error generating recommendations:', error);
      throw error;
    }
  }

  async getCityCoordinates(city) {
    const cacheKey = `city_coords_${city.toLowerCase()}`;
    let coords = cache.get(cacheKey);

    if (!coords) {
      if (!this.hasApiKey) {
        // Demo coordinates for common cities
        const demoCoords = {
          'san francisco': { lat: 37.7749, lng: -122.4194 },
          'oakland': { lat: 37.8044, lng: -122.2711 },
          'san jose': { lat: 37.3382, lng: -121.8863 },
          'berkeley': { lat: 37.8715, lng: -122.2730 },
          'palo alto': { lat: 37.4419, lng: -122.1430 }
        };
        coords = demoCoords[city.toLowerCase()] || { lat: 37.7749, lng: -122.4194 };
      } else {
        try {
          const response = await client.geocode({
            params: {
              address: `${city}, CA, USA`,
              key: process.env.GOOGLE_PLACES_API_KEY
            }
          });

          if (response.data.results.length > 0) {
            const location = response.data.results[0].geometry.location;
            coords = { lat: location.lat, lng: location.lng };
            cache.set(cacheKey, coords, 86400); // Cache for 24 hours
          }
        } catch (error) {
          console.error('Error getting city coordinates:', error);
          return null;
        }
      }
    }

    return coords;
  }

  async getPlacesForActivity(coords, activity, radius, hasDog) {
    const cacheKey = `places_${activity}_${coords.lat}_${coords.lng}_${radius}_${hasDog}`;
    let places = cache.get(cacheKey);

    if (!places) {
      if (!this.hasApiKey) {
        // Return demo places
        const cityName = this.getCityNameFromCoords(coords);
        places = DEMO_PLACES[cityName] || DEMO_PLACES['San Francisco'];
        places = places.map(place => ({
          ...place,
          activity,
          dogFriendly: this.isDogFriendly(place, hasDog),
          kidFriendly: this.isKidFriendly(place, activity)
        }));
      } else {
        try {
          const types = ACTIVITY_TYPES[activity] || ['establishment'];
          const keyword = hasDog ? 'dog friendly' : '';

          const response = await client.placesNearby({
            params: {
              location: coords,
              radius,
              type: types[0], // Use first type for nearby search
              keyword,
              key: process.env.GOOGLE_PLACES_API_KEY
            }
          });

          places = response.data.results.map(place => ({
            ...place,
            activity,
            dogFriendly: this.isDogFriendly(place, hasDog),
            kidFriendly: this.isKidFriendly(place, activity)
          }));

          cache.set(cacheKey, places, 3600); // Cache for 1 hour
        } catch (error) {
          console.error(`Error getting places for ${activity}:`, error);
          places = [];
        }
      }
    }

    return places;
  }

  getCityNameFromCoords(coords) {
    // Simple mapping for demo purposes
    if (coords.lat > 37.8) return 'San Francisco';
    if (coords.lat > 37.7) return 'Oakland';
    return 'San Francisco';
  }

  isDogFriendly(place, hasDog) {
    if (!hasDog) return true; // Not relevant if no dog

    const name = place.name?.toLowerCase() || '';
    const types = place.types || [];
    const vicinity = place.vicinity?.toLowerCase() || '';

    // Check for dog-friendly keywords
    const hasDogKeywords = DOG_FRIENDLY_KEYWORDS.some(keyword => 
      name.includes(keyword) || vicinity.includes(keyword)
    );

    // Check for dog park type
    const isDogPark = types.includes('park') && name.includes('dog');

    return hasDogKeywords || isDogPark;
  }

  isKidFriendly(place, activity) {
    const types = place.types || [];
    return KID_FRIENDLY_TYPES.some(type => types.includes(type)) || 
           activity === 'Playgrounds' || 
           activity === 'Museums';
  }

  rankCandidates(candidates, preferences) {
    const { kids, hasDog } = preferences;

    return candidates
      .map(candidate => {
        // Base score from rating and review count
        const baseScore = (candidate.rating || 3.5) * Math.log1p(candidate.user_ratings_total || 1);

        // Dog bonus
        const dogBonus = (hasDog && candidate.dogFriendly) ? 1.2 : 1.0;

        // Kid bonus
        const kidBonus = (kids > 0 && candidate.kidFriendly) ? 1.3 : 1.0;

        // Activity diversity bonus
        const activityBonus = 1.0; // Could be enhanced based on user preferences

        const finalScore = baseScore * dogBonus * kidBonus * activityBonus;

        return {
          ...candidate,
          score: finalScore,
          dogBonus,
          kidBonus,
          activityBonus
        };
      })
      .sort((a, b) => b.score - a.score);
  }

  async generateOutingPacks(candidates, cityCoords, preferences) {
    const packs = [];
    const usedPlaces = new Set();

    for (let i = 0; i < 3 && i < candidates.length; i++) {
      const core = candidates.find(c => !usedPlaces.has(c.place_id));
      if (!core) break;

      usedPlaces.add(core.place_id);

      // Find nearby spokes (within 1 mile)
      const spokes = await this.findNearbySpokes(core, cityCoords, usedPlaces, preferences);
      usedPlaces.add(...spokes.map(s => s.place_id));

      // Calculate ETA
      const eta = await this.calculateETA(core, cityCoords, preferences.hasCar);

      // Generate static map
      const mapUrl = await this.generateStaticMap(core, spokes);

      packs.push({
        id: `pack_${Date.now()}_${i}`,
        core: {
          placeId: core.place_id,
          name: core.name,
          rating: core.rating,
          userRatingsTotal: core.user_ratings_total,
          vicinity: core.vicinity,
          types: core.types,
          geometry: core.geometry
        },
        spokes,
        eta,
        mapUrl,
        kidScore: this.calculateKidScore(core, preferences.kids),
        dogFriendly: core.dogFriendly,
        activity: core.activity
      });
    }

    return packs;
  }

  async findNearbySpokes(core, cityCoords, usedPlaces, preferences) {
    const spokes = [];
    const maxDistance = 1609; // 1 mile in meters

    if (!this.hasApiKey) {
      // Demo spokes
      const demoSpokes = [
        {
          placeId: 'demo_spoke_1',
          name: 'Local Coffee Shop',
          type: 'cafe',
          rating: 4.3,
          vicinity: 'Nearby',
          geometry: core.geometry,
          distance: 200
        },
        {
          placeId: 'demo_spoke_2',
          name: 'Family Restaurant',
          type: 'restaurant',
          rating: 4.1,
          vicinity: 'Nearby',
          geometry: core.geometry,
          distance: 400
        }
      ];
      return demoSpokes;
    }

    try {
      // Find nearby places
      const response = await client.placesNearby({
        params: {
          location: core.geometry.location,
          radius: maxDistance,
          key: process.env.GOOGLE_PLACES_API_KEY
        }
      });

      const nearbyPlaces = response.data.results
        .filter(place => !usedPlaces.has(place.place_id))
        .filter(place => this.isValidSpoke(place, preferences))
        .slice(0, 3); // Max 3 spokes

      // Ensure we have at least one restaurant if needed
      if (preferences.adults > 0) {
        const restaurant = nearbyPlaces.find(p => p.types?.includes('restaurant'));
        if (restaurant && !spokes.some(s => s.place_id === restaurant.place_id)) {
          spokes.push(this.formatSpoke(restaurant, 'restaurant'));
        }
      }

      // Add other valid spokes
      nearbyPlaces.forEach(place => {
        if (spokes.length < 3 && !spokes.some(s => s.place_id === place.place_id)) {
          const type = this.determineSpokeType(place);
          spokes.push(this.formatSpoke(place, type));
        }
      });

    } catch (error) {
      console.error('Error finding nearby spokes:', error);
    }

    return spokes;
  }

  isValidSpoke(place, preferences) {
    const types = place.types || [];
    
    // Must be open (we'll check hours later)
    if (place.opening_hours && !place.opening_hours.open_now) {
      return false;
    }

    // Must be dog-friendly if user has dog
    if (preferences.hasDog && !this.isDogFriendly(place, true)) {
      return false;
    }

    return true;
  }

  determineSpokeType(place) {
    const types = place.types || [];
    
    if (types.includes('restaurant')) return 'restaurant';
    if (types.includes('cafe')) return 'cafe';
    if (types.includes('park')) return 'park';
    if (types.includes('store') || types.includes('shopping_mall')) return 'shopping';
    if (types.includes('museum')) return 'museum';
    
    return 'attraction';
  }

  formatSpoke(place, type) {
    return {
      placeId: place.place_id,
      name: place.name,
      type,
      rating: place.rating,
      vicinity: place.vicinity,
      geometry: place.geometry,
      distance: this.calculateDistance(place.geometry.location, place.geometry.location) // This will be calculated properly
    };
  }

  async calculateETA(destination, origin, hasCar) {
    if (!this.hasApiKey) {
      // Demo ETA
      return {
        duration: 1800, // 30 minutes default
        durationText: '30 mins',
        distance: 10000, // 10km default
        distanceText: '10 km'
      };
    }

    try {
      const response = await client.distancematrix({
        params: {
          origins: [origin],
          destinations: [destination.geometry.location],
          mode: hasCar ? 'driving' : 'transit',
          key: process.env.GOOGLE_PLACES_API_KEY
        }
      });

      const element = response.data.rows[0]?.elements[0];
      if (element && element.status === 'OK') {
        return {
          duration: element.duration.value, // seconds
          durationText: element.duration.text,
          distance: element.distance.value, // meters
          distanceText: element.distance.text
        };
      }
    } catch (error) {
      console.error('Error calculating ETA:', error);
    }

    return {
      duration: 1800, // 30 minutes default
      durationText: '30 mins',
      distance: 10000, // 10km default
      distanceText: '10 km'
    };
  }

  async generateStaticMap(core, spokes) {
    if (!this.hasApiKey) {
      // Return a demo map URL or placeholder
      return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQwIiBoZWlnaHQ9IjMyMCIgdmlld0JveD0iMCAwIDY0MCAzMjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI2NDAiIGhlaWdodD0iMzIwIiBmaWxsPSIjRjNGNEY2Ii8+Cjx0ZXh0IHg9IjMyMCIgeT0iMTYwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTYiIGZpbGw9IiM2QjcyODAiIHRleHQtYW5jaG9yPSJtaWRkbGUiPk1hcCBVbmF2YWlsYWJsZTwvdGV4dD4KPC9zdmc+';
    }

    const markers = [
      `markers=color:teal|label:C|${core.geometry.location.lat},${core.geometry.location.lng}`,
      ...spokes.map((spoke, i) => 
        `markers=color:gray|label:${i + 1}|${spoke.geometry.location.lat},${spoke.geometry.location.lng}`
      )
    ].join('&');

    const mapUrl = `https://maps.googleapis.com/maps/api/staticmap?` +
      `size=640x320&` +
      `zoom=14&` +
      `center=${core.geometry.location.lat},${core.geometry.location.lng}&` +
      `${markers}&` +
      `key=${process.env.GOOGLE_PLACES_API_KEY}`;

    return mapUrl;
  }

  calculateKidScore(place, kids) {
    if (kids === 0) return null;

    let score = 3; // Base score

    const types = place.types || [];
    const name = place.name?.toLowerCase() || '';

    // Bonus for kid-friendly types
    if (types.includes('park') || types.includes('playground')) score += 1;
    if (types.includes('museum') || types.includes('aquarium')) score += 1;
    if (name.includes('park') || name.includes('playground')) score += 1;

    // Bonus for family-friendly keywords
    if (name.includes('family') || name.includes('kids')) score += 1;

    return Math.min(score, 5);
  }

  calculateDistance(point1, point2) {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = point1.lat * Math.PI / 180;
    const φ2 = point2.lat * Math.PI / 180;
    const Δφ = (point2.lat - point1.lat) * Math.PI / 180;
    const Δλ = (point2.lng - point1.lng) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // Distance in meters
  }
}

module.exports = new RecommendationService(); 