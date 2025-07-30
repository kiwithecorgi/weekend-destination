const PlacesService = require('./placesService');
const WeatherService = require('./weatherService');

class EnhancedRecommendationService {
  constructor() {
    this.placesService = new PlacesService();
    this.weatherService = new WeatherService();
  }

  async generateRecommendations(params) {
    const { city, adults, kids, hasDog, hasCar, travelTime, activities } = params;

    try {
      console.log(`🔍 Generating recommendations for ${city}...`);
      
      // Get current weather
      const weather = await this.weatherService.getCurrentWeather(city);
      
      // Get places
      const places = await this.placesService.findFamilyFriendlyPlaces(params);
      
      // Combine and enhance results
      const recommendations = this.combineResults(places, params);
      
      console.log(`✅ Generated ${recommendations.length} recommendations`);
      
      return {
        packs: recommendations,
        weather,
        totalResults: recommendations.length,
        searchParams: params,
        demoMode: this.isDemoMode()
      };
    } catch (error) {
      console.error('Enhanced recommendation error:', error);
      throw error;
    }
  }

  combineResults(places, params) {
    return places.slice(0, 6).map(place => {
      // Generate custom itinerary
      const itinerary = this.generateItinerary(place, params);
      
      // Generate nearby attractions
      const nearbyAttractions = this.generateNearbyAttractions(place, params.city);

      return {
        core: {
          name: place.name,
          description: this.generateDescription(place),
          rating: place.rating,
          vicinity: place.vicinity,
          dogFriendly: place.dogFriendly,
          kidFriendly: place.kidFriendly
        },
        eta: {
          durationText: `${Math.round(Math.random() * 20 + 10)} mins`
        },
        spokes: nearbyAttractions
      };
    });
  }

  generateDescription(place) {
    const descriptions = {
      park: "A beautiful outdoor space perfect for family adventures and pet-friendly activities.",
      museum: "An educational and entertaining destination that sparks curiosity for all ages.",
      shopping_mall: "A convenient shopping destination with family-friendly amenities.",
      restaurant: "A welcoming dining spot that caters to families and offers great experiences."
    };
    
    const primaryType = place.types[0] || 'park';
    return descriptions[primaryType] || descriptions.park;
  }

  generateNearbyAttractions(place, city) {
    const attractions = [
      { name: `${city} Historic District`, type: "landmark" },
      { name: "Local Artisan Coffee Shop", type: "cafe" },
      { name: "Family-Friendly Restaurant", type: "restaurant" },
      { name: "Community Playground", type: "park" },
      { name: "Scenic Overlook", type: "viewpoint" }
    ];
    
    return attractions.slice(0, 3 + Math.floor(Math.random() * 3));
  }

  generateItinerary(place, params) {
    if (place.types.includes('park')) {
      return [
        {
          activity: "Nature Walk & Photos",
          duration: "45 min",
          description: "Explore the trails and capture beautiful family moments"
        },
        {
          activity: "Playground & Picnic Time",
          duration: "90 min",
          description: "Let the kids play while you enjoy a relaxing picnic"
        },
        {
          activity: "Scenic Viewpoint Visit",
          duration: "60 min",
          description: "Discover nearby overlooks and gardens for stunning views"
        }
      ];
    } else if (place.types.includes('museum')) {
      return [
        {
          activity: "Museum Exploration",
          duration: "60 min",
          description: "Discover fascinating exhibits and interactive displays"
        },
        {
          activity: "Educational Activities",
          duration: "45 min",
          description: "Participate in hands-on learning experiences"
        },
        {
          activity: "Gift Shop & Reflection",
          duration: "30 min",
          description: "Browse souvenirs and discuss your favorite discoveries"
        }
      ];
    } else {
      return [
        {
          activity: "Arrival & Exploration",
          duration: "30 min",
          description: "Get oriented and plan your visit"
        },
        {
          activity: "Main Experience",
          duration: "90 min",
          description: "Enjoy the primary attraction with your family"
        },
        {
          activity: "Nearby Discovery",
          duration: "45 min",
          description: "Explore a nearby gem before heading home"
        }
      ];
    }
  }

  isDemoMode() {
    const hasGoogleKey = process.env.GOOGLE_PLACES_API_KEY && !process.env.GOOGLE_PLACES_API_KEY.includes('your_actual');
    const hasWeatherKey = process.env.OPENWEATHER_API_KEY && !process.env.OPENWEATHER_API_KEY.includes('your_openweather');
    return !hasGoogleKey || !hasWeatherKey;
  }
}

module.exports = EnhancedRecommendationService;
