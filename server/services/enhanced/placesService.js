const { Client } = require('@googlemaps/google-maps-services-js');

class PlacesService {
  constructor() {
    this.client = new Client({});
    this.apiKey = process.env.GOOGLE_PLACES_API_KEY;
  }

  async findFamilyFriendlyPlaces(params) {
    if (!this.apiKey || this.apiKey.includes('your_actual')) {
      console.log('⚠️ Using demo mode - Google Places API key not configured');
      return this.getDemoPlaces();
    }

    try {
      const { city, activities, hasDog, kids, travelTime } = params;
      
      // Get city coordinates
      const geocode = await this.client.geocode({
        params: {
          address: `${city}, CA, USA`,
          key: this.apiKey
        }
      });

      if (!geocode.data.results.length) {
        throw new Error('City not found');
      }

      const location = geocode.data.results[0].geometry.location;
      
      // Search for places
      const places = await this.client.placesNearby({
        params: {
          location,
          radius: Math.min(travelTime * 1000, 50000), // Max 50km
          type: this.getPlaceTypes(activities),
          key: this.apiKey
        }
      });

      return this.filterFamilyFriendly(places.data.results, { hasDog, kids });
    } catch (error) {
      console.error('Places API Error:', error.message);
      return this.getDemoPlaces();
    }
  }

  getPlaceTypes(activities) {
    const typeMap = {
      'Parks': 'park',
      'Museums': 'museum',
      'Beach': 'natural_feature',
      'Shopping': 'shopping_mall',
      'Restaurants': 'restaurant',
      'Playgrounds': 'park',
      'Hiking': 'park',
      'Gardens': 'park'
    };
    
    return activities.map(activity => typeMap[activity]).filter(Boolean);
  }

  filterFamilyFriendly(places, filters) {
    return places.map(place => ({
      name: place.name,
      rating: place.rating || 4.0,
      vicinity: place.vicinity,
      placeId: place.place_id,
      types: place.types,
      dogFriendly: this.isDogFriendly(place),
      kidFriendly: this.isKidFriendly(place)
    }));
  }

  isDogFriendly(place) {
    const dogFriendlyTypes = ['park', 'natural_feature', 'establishment'];
    return place.types.some(type => dogFriendlyTypes.includes(type));
  }

  isKidFriendly(place) {
    const kidFriendlyTypes = ['park', 'amusement_park', 'zoo', 'museum'];
    return place.types.some(type => kidFriendlyTypes.includes(type));
  }

  getDemoPlaces() {
    return [
      {
        name: "Golden Gate Park",
        rating: 4.8,
        vicinity: "San Francisco",
        placeId: "demo_1",
        types: ['park'],
        dogFriendly: true,
        kidFriendly: true
      },
      {
        name: "Exploratorium",
        rating: 4.6,
        vicinity: "San Francisco",
        placeId: "demo_2", 
        types: ['museum'],
        dogFriendly: false,
        kidFriendly: true
      }
    ];
  }
}

module.exports = PlacesService;
