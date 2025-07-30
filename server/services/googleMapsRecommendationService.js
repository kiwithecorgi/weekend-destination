const { Client } = require('@googlemaps/google-maps-services-js');
const axios = require('axios');

// Simple LLM simulation for itinerary generation
const generateLLMResponse = (prompt) => {
  // This is a simplified LLM simulation - in production, you'd use OpenAI, Anthropic, etc.
  const responses = {
    hiking: {
      insights: [
        "Families love starting early to avoid crowds and enjoy cooler temperatures",
        "Kids enjoy the interactive trail markers and wildlife spotting",
        "Best photo opportunities are at sunrise and sunset"
      ],
      itinerary: [
        {
          activity: "Morning Adventure",
          duration: "60 min",
          description: "Start with the main trail while kids are fresh and excited. Families recommend arriving early to avoid crowds and enjoy the peaceful morning atmosphere.",
          tips: "Bring water, snacks, and comfortable shoes - the visitor center has family-friendly facilities"
        },
        {
          activity: "Discovery Time",
          duration: "90 min",
          description: "Explore nearby attractions based on your family's interests. Recent visitors loved the interactive exhibits and outdoor play areas.",
          tips: "Check the weather - many families suggest bringing layers for changing conditions"
        },
        {
          activity: "Rest & Refresh",
          duration: "45 min",
          description: "Take a break at the visitor center or nearby facilities. Perfect time for snacks and planning your next adventure.",
          tips: "Great opportunity to use restrooms and refill water bottles"
        }
      ]
    },
    museum: {
      insights: [
        "Families recommend visiting during weekday afternoons for smaller crowds",
        "Kids love the interactive exhibits and hands-on activities",
        "Plan for 2-3 hours to fully explore without rushing"
      ],
      itinerary: [
        {
          activity: "Orientation & Planning",
          duration: "30 min",
          description: "Start at the visitor center to get oriented and pick up activity guides. Families love the interactive maps and helpful staff.",
          tips: "Ask about current exhibitions and family programs"
        },
        {
          activity: "Main Exploration",
          duration: "120 min",
          description: "Explore the main exhibits at your own pace. Recent visitors recommend starting with the most popular areas first.",
          tips: "Take breaks every 45 minutes to keep kids engaged"
        },
        {
          activity: "Wrap-up & Souvenirs",
          duration: "30 min",
          description: "Visit the gift shop and cafe before heading out. Perfect time to discuss favorite exhibits and plan your next visit.",
          tips: "Great photo opportunities in the main lobby"
        }
      ]
    },
    park: {
      insights: [
        "Weekend mornings are perfect for family activities and events",
        "Bring picnic supplies for a memorable family meal",
        "Check the park's event calendar for special family programs"
      ],
      itinerary: [
        {
          activity: "Arrival & Setup",
          duration: "30 min",
          description: "Find parking and get oriented with the park layout. Families recommend scouting out the best picnic spots early.",
          tips: "Bring a blanket or chairs for comfortable seating"
        },
        {
          activity: "Active Play",
          duration: "90 min",
          description: "Enjoy the playgrounds, trails, and open spaces. Recent visitors loved the variety of activities available for all ages.",
          tips: "Pack sports equipment and outdoor games for extra fun"
        },
        {
          activity: "Relaxation & Departure",
          duration: "45 min",
          description: "Wind down with a picnic or snack break. Perfect time to plan your next family adventure.",
          tips: "Don't forget to clean up and check for personal items"
        }
      ]
    }
  };

  // Determine the type based on the prompt content
  if (prompt.toLowerCase().includes('hiking') || prompt.toLowerCase().includes('trail')) {
    return responses.hiking;
  } else if (prompt.toLowerCase().includes('museum') || prompt.toLowerCase().includes('gallery')) {
    return responses.museum;
  } else {
    return responses.park;
  }
};

/**
 * Enhanced Recommendation Service using Google Maps Platform
 * Replaces Yelp with comprehensive Google Places data for ratings, reviews, and business info
 */
class GoogleMapsRecommendationService {
  constructor() {
    this.client = new Client({});
    this.placesApiKey = process.env.GOOGLE_PLACES_API_KEY;
    this.mapsApiKey = process.env.GOOGLE_MAPS_API_KEY;
    this.geocodingApiKey = process.env.GOOGLE_GEOCODING_API_KEY;
  }

  async generateRecommendations(params) {
    const { city, adults, kids, hasDog, hasCar, travelTime, activities } = params;

    try {
      console.log(`🔍 Generating Google Maps recommendations for ${city}...`);
      
      // Get city coordinates using Google Geocoding
      const coordinates = await this.getCoordinates(city);
      
      // Search for family-friendly places using Google Places
      const places = await this.findPlacesWithRatings(coordinates, params);
      
      // Get detailed place information including ratings and reviews
      const detailedPlaces = await this.getPlaceDetails(places);
      
      // Generate enhanced recommendations
      const recommendations = await this.buildRecommendations(detailedPlaces, params);
      
      console.log(`✅ Generated ${recommendations.length} Google Maps recommendations`);
      
      return {
        packs: recommendations,
        totalResults: recommendations.length,
        searchParams: params,
        dataSource: 'Google Maps Platform',
        demoMode: this.isDemoMode()
      };
    } catch (error) {
      console.error('Google Maps API Error:', error);
      return this.getFallbackRecommendations(params);
    }
  }

  async getCoordinates(city) {
    if (!this.geocodingApiKey || this.geocodingApiKey.includes('your_google')) {
      // Return default Bay Area coordinates
      return { lat: 37.7749, lng: -122.4194 };
    }

    try {
      const response = await this.client.geocode({
        params: {
          address: `${city}, CA, USA`,
          key: this.geocodingApiKey
        }
      });

      if (response.data.results.length > 0) {
        return response.data.results[0].geometry.location;
      }
    } catch (error) {
      console.error('Geocoding error:', error);
    }

    // Fallback coordinates
    return { lat: 37.7749, lng: -122.4194 };
  }

  async findPlacesWithRatings(coordinates, params) {
    if (!this.placesApiKey || this.placesApiKey.includes('your_google')) {
      return this.getDemoPlaces();
    }

    try {
      const { activities, travelTime, hasDog, kids } = params;
      
      // Calculate search radius based on realistic travel times
      // Assumes average speed: local roads 40km/h, highways 80km/h
      let searchRadius;
      if (travelTime <= 15) {
        // Local destinations: 5-8km (walking/biking + local driving)
        searchRadius = Math.min(travelTime * 400, 8000);
      } else if (travelTime <= 30) {
        // Nearby destinations: 8-20km (local highways)
        searchRadius = 8000 + ((travelTime - 15) * 800); // 8km + up to 12km more
      } else if (travelTime <= 60) {
        // Regional destinations: 20-50km (highways)
        searchRadius = 20000 + ((travelTime - 30) * 1000); // 20km + up to 30km more
      } else {
        // Long-distance destinations: 50km+ (major highways)
        searchRadius = Math.min(50000 + ((travelTime - 60) * 800), 100000); // Up to 100km max
      }
      
      console.log(`🚗 Travel time: ${travelTime}min → Search radius: ${(searchRadius/1000).toFixed(1)}km`);

      // Search for multiple place types based on selected activities
      const placeTypes = this.mapActivitiesToPlaceTypes(activities);
      console.log(`🔍 Searching for place types: ${placeTypes.join(', ')} in radius ${searchRadius}m`);
      const allPlaces = [];

      for (const placeType of placeTypes) {
        try {
          const response = await this.client.placesNearby({
            params: {
              location: coordinates,
              radius: searchRadius,
              type: placeType,
              key: this.placesApiKey,
              // Only get places with ratings
              fields: ['place_id', 'name', 'rating', 'user_ratings_total', 'vicinity', 'types', 'price_level']
            }
          });

          // Filter for high-rated places
          const filteredPlaces = response.data.results.filter(place => 
            place.rating && place.rating >= 4.0 && place.user_ratings_total >= 10
          );

          console.log(`📍 Found ${response.data.results.length} ${placeType} places, ${filteredPlaces.length} after filtering`);
          allPlaces.push(...filteredPlaces);
        } catch (error) {
          console.error(`Error searching for ${placeType}:`, error);
        }
      }

      // Remove duplicates and sort by travel time preference + rating
      const uniquePlaces = this.removeDuplicates(allPlaces);
      
      // Sort places based on travel time budget
      const sortedPlaces = uniquePlaces.sort((a, b) => {
        if (travelTime <= 20) {
          // Short trips: prioritize rating heavily, slightly prefer closer places
          return (b.rating - a.rating) * 2 + (a.geometry?.location ? 0.1 : 0);
        } else if (travelTime <= 45) {
          // Medium trips: balance rating and variety
          return (b.rating - a.rating) * 1.5;
        } else {
          // Long trips: prioritize highly rated destinations regardless of distance
          return (b.rating - a.rating) * 3;
        }
      });
      
      return sortedPlaces.slice(0, 10);

    } catch (error) {
      console.error('Places search error:', error);
      return this.getDemoPlaces();
    }
  }

  async getPlaceDetails(places) {
    const detailedPlaces = [];

    for (const place of places.slice(0, 12)) {
      try {
        if (!this.placesApiKey || this.placesApiKey.includes('your_google')) {
          // Use basic place data if no API key
          detailedPlaces.push({
            ...place,
            photos: [],
            reviews: [],
            formatted_phone_number: null,
            website: null,
            opening_hours: null
          });
          continue;
        }

        const response = await this.client.placeDetails({
          params: {
            place_id: place.place_id,
            key: this.placesApiKey,
            fields: [
              'name', 'rating', 'user_ratings_total', 'reviews', 'photos',
              'formatted_phone_number', 'website', 'opening_hours', 'vicinity',
              'types', 'price_level', 'formatted_address', 'geometry'
            ]
          }
        });

        detailedPlaces.push({
          ...place,
          details: response.data.result
        });

        // Add small delay to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        console.error(`Error getting details for ${place.name}:`, error);
        // Include place without details if API call fails
        detailedPlaces.push(place);
      }
    }

    return detailedPlaces;
  }

  async buildRecommendations(places, params) {
    const recommendations = [];
    
    for (const place of places) {
      const details = place.details || place;
      
      // Extract key information from Google Places data
      const rating = details.rating || place.rating || 4.0;
      const reviewCount = details.user_ratings_total || place.user_ratings_total || 0;
      const priceLevel = details.price_level || 0;
      
      // Generate description from Google data
      const description = this.generateDescriptionFromGoogleData(details, reviewCount, priceLevel);
      
      // Determine family/pet friendliness from place types
      const dogFriendly = this.isDogFriendlyFromTypes(details.types || place.types);
      const kidFriendly = this.isKidFriendlyFromTypes(details.types || place.types);
      
      // Generate nearby attractions
      const nearbyAttractions = await this.generateNearbyAttractions(details, params.city);
      
      // Extract family insights from reviews
      const familyInsights = await this.extractFamilyInsights(
        place.place_id, 
        details.name || place.name, 
        details.types || place.types
      );
      
      // Generate inspirational itinerary with family insights
      const inspirationalItinerary = await this.generateInspirationalItinerary(
        {
          name: details.name || place.name,
          rating: rating,
          reviewCount: reviewCount
        },
        nearbyAttractions,
        familyInsights,
        params
      );

      recommendations.push({
        core: {
          name: details.name || place.name,
          description,
          rating: rating,
          reviewCount,
          vicinity: details.vicinity || place.vicinity,
          dogFriendly,
          kidFriendly,
          priceLevel,
          // Include Google-specific data
          googleData: {
            placeId: place.place_id,
            phone: details.formatted_phone_number,
            website: details.website,
            isOpen: details.opening_hours?.open_now,
            photos: details.photos?.slice(0, 3) || [],
            // Add banner photo URL for the destination image
            bannerPhoto: this.generateBannerPhoto(details, place)
          }
        },
        eta: {
          durationText: `${Math.round(Math.random() * 20 + 10)} mins`
        },
        spokes: nearbyAttractions,
        itinerary: inspirationalItinerary.itinerary,
        familyInsights: inspirationalItinerary.insights
      });
    }
    
    return recommendations;
  }

  generateDescriptionFromGoogleData(place, reviewCount, priceLevel) {
    const priceText = ['Free', '$', '$$', '$$$', '$$$$'][priceLevel] || '';
    const reviewText = reviewCount > 0 ? ` with ${reviewCount} Google reviews` : '';
    
    // Use place types to generate relevant description
    const primaryType = place.types?.[0] || 'establishment';
    const typeDescriptions = {
      'park': 'A beautiful outdoor space perfect for family adventures',
      'museum': 'An educational and entertaining destination',
      'restaurant': 'A highly-rated dining experience',
      'shopping_mall': 'A convenient shopping destination',
      'tourist_attraction': 'A popular destination worth visiting',
      'establishment': 'A well-rated local destination'
    };
    
    const baseDescription = typeDescriptions[primaryType] || typeDescriptions['establishment'];
    return `${baseDescription}${reviewText}. ${priceText ? `Price range: ${priceText}` : ''}`.trim();
  }

  mapActivitiesToPlaceTypes(activities) {
    const typeMap = {
      // Frontend activity names -> Google Place types
      'Hiking': ['park', 'hiking_area', 'natural_feature'],
      'Beach': ['beach', 'natural_feature'],
      'Playgrounds': ['park', 'amusement_park', 'playground'],
      'Scenic Drives': ['scenic_drive', 'tourist_attraction', 'natural_feature'],
      'Shopping': ['shopping_mall', 'store', 'department_store'],
      'Farmers Markets': ['food', 'market', 'grocery_or_supermarket'],
      'Picnic Areas': ['park', 'campground'],
      'Breweries': ['bar', 'restaurant', 'food'],
      'Museums': ['museum', 'art_gallery', 'tourist_attraction'],
      'Dog Parks': ['park', 'veterinary_care'],
      'Gardens': ['park', 'botanical_garden', 'tourist_attraction'],
      'Outdoor Dining': ['restaurant', 'cafe', 'meal_takeaway'],
      // Legacy mappings (just in case)
      'Parks': ['park', 'national_park'],
      'Restaurants': ['restaurant', 'cafe']
    };
    
    const allTypes = [];
    activities.forEach(activity => {
      if (typeMap[activity]) {
        allTypes.push(...typeMap[activity]);
      }
    });
    
    // If no activities selected or no valid mappings, use default family-friendly types
    if (allTypes.length === 0) {
      allTypes.push('park', 'tourist_attraction', 'amusement_park', 'museum');
    }
    
    return [...new Set(allTypes)]; // Remove duplicates
  }

  isDogFriendlyFromTypes(types) {
    const dogFriendlyTypes = ['park', 'hiking_area', 'beach', 'natural_feature', 'campground'];
    return types?.some(type => dogFriendlyTypes.includes(type)) || false;
  }

  isKidFriendlyFromTypes(types) {
    const kidFriendlyTypes = ['park', 'amusement_park', 'zoo', 'museum', 'aquarium', 'playground'];
    return types?.some(type => kidFriendlyTypes.includes(type)) || false;
  }

  async generateNearbyAttractions(place, city) {
    // Use real Google Places API to find nearby attractions
    try {
      if (!this.placesApiKey || this.placesApiKey.includes('your_google')) {
        return this.getFallbackNearbyAttractions(city);
      }

      let location;
    
    // Try to get coordinates from place details first
    if (place.details?.geometry?.location) {
      location = place.details.geometry.location;
    }
    // Fall back to original place geometry 
    else if (place.geometry?.location) {
      location = place.geometry.location;
    }
    // Last resort - return fallback attractions if no coordinates
    else {
      console.log(`⚠️ No coordinates found for ${place.name}, using fallback attractions`);
      return this.getFallbackNearbyAttractions(city);
    }

    console.log(`🎯 Using coordinates (${location.lat}, ${location.lng}) for ${place.name}`);
    
    const radius = 800; // Smaller radius for better results
      
      // Make one broader search instead of multiple type-specific searches
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/place/nearbysearch/json`,
        {
          params: {
            location: `${location.lat},${location.lng}`,
            radius: radius,
            key: this.placesApiKey
          }
        }
      );

      if (response.data.results && response.data.results.length > 0) {
        const nearbyPlaces = response.data.results
          .filter(p => p.rating && p.rating >= 3.8 && p.user_ratings_total >= 5)
          .filter(p => !p.name.toLowerCase().includes('parking')) // Filter out parking
          .filter(p => this.isTouristAttraction(p)) // Filter out non-tourist places
          .filter(p => !p.name.toLowerCase().includes(place.name.toLowerCase())) // Filter out the destination itself
          .sort((a, b) => b.rating - a.rating)
          .slice(0, 5)
          .map(place => ({
            name: place.name,
            type: this.categorizePlace(place),
            rating: place.rating,
            vicinity: place.vicinity
          }));

        console.log(`📍 Found ${nearbyPlaces.length} real nearby attractions for ${place.name}`);
        return nearbyPlaces.length > 0 ? nearbyPlaces : this.getFallbackNearbyAttractions(city);
      }

      return this.getFallbackNearbyAttractions(city);
      
    } catch (error) {
      console.error('Error generating nearby attractions:', error.message);
      return this.getFallbackNearbyAttractions(city);
    }
  }

  async extractFamilyInsights(placeId, placeName, placeTypes) {
    try {
      if (!this.placesApiKey || this.placesApiKey.includes('your_google')) {
        return this.getFallbackFamilyInsights(placeName, placeTypes);
      }

      // Get place details including reviews
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/place/details/json`,
        {
          params: {
            place_id: placeId,
            fields: 'reviews,rating,user_ratings_total',
            key: this.placesApiKey
          }
        }
      );

      if (response.data.result && response.data.result.reviews) {
        const reviews = response.data.result.reviews;
        
        // Extract family-related insights from reviews
        const familyInsights = this.analyzeReviewsForFamilyInsights(reviews, placeName, placeTypes);
        
        console.log(`📝 Extracted ${familyInsights.length} family insights for ${placeName}`);
        return familyInsights;
      }

      return this.getFallbackFamilyInsights(placeName, placeTypes);

    } catch (error) {
      console.error('Error extracting family insights:', error.message);
      return this.getFallbackFamilyInsights(placeName, placeTypes);
    }
  }

  analyzeReviewsForFamilyInsights(reviews, placeName, placeTypes) {
    const familyKeywords = [
      'family', 'kids', 'children', 'child', 'baby', 'toddler', 'teen', 'teenager',
      'parents', 'mom', 'dad', 'mother', 'father', 'grandparents', 'grandma', 'grandpa',
      'playground', 'play', 'fun', 'enjoy', 'love', 'great', 'amazing', 'wonderful',
      'safe', 'clean', 'friendly', 'helpful', 'staff', 'service', 'food', 'restaurant',
      'cafe', 'snack', 'drink', 'water', 'bathroom', 'restroom', 'parking', 'easy',
      'convenient', 'accessible', 'wheelchair', 'stroller', 'baby', 'diaper', 'nursing'
    ];

    const insights = [];
    const seenInsights = new Set();

    reviews.forEach(review => {
      const text = review.text.toLowerCase();
      const rating = review.rating;
      
      // Only consider positive reviews (4+ stars) for insights
      if (rating >= 4) {
        // Look for family-related patterns
        if (familyKeywords.some(keyword => text.includes(keyword))) {
          // Extract meaningful sentences
          const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);
          
          sentences.forEach(sentence => {
            const cleanSentence = sentence.trim();
            if (cleanSentence.length > 30 && cleanSentence.length < 200) {
              // Check if this insight is unique
              const insightKey = cleanSentence.substring(0, 50);
              if (!seenInsights.has(insightKey)) {
                seenInsights.add(insightKey);
                insights.push({
                  text: cleanSentence.charAt(0).toUpperCase() + cleanSentence.slice(1),
                  rating: rating,
                  source: 'Family Review'
                });
              }
            }
          });
        }
      }
    });

    // Return top 3 insights, or fallback if none found
    return insights.slice(0, 3);
  }

  getFallbackFamilyInsights(placeName, placeTypes) {
    const type = placeTypes?.[0] || 'attraction';
    
    const fallbackInsights = {
      park: [
        "Families love the open spaces and playgrounds",
        "Perfect for picnics and outdoor activities",
        "Great place for kids to run around and play"
      ],
      museum: [
        "Interactive exhibits keep kids engaged",
        "Educational and fun for the whole family",
        "Staff are very helpful with family visitors"
      ],
      restaurant: [
        "Family-friendly atmosphere and menu",
        "Good portion sizes for sharing",
        "Comfortable seating for families"
      ],
      attraction: [
        "Fun experience for all ages",
        "Well-maintained and safe for families",
        "Great photo opportunities throughout"
      ]
    };

    return fallbackInsights[type] || fallbackInsights.attraction;
  }

  async generateInspirationalItinerary(destination, nearbyAttractions, familyInsights, params) {
    try {
      // Create a context-rich prompt for LLM
      const prompt = this.buildItineraryPrompt(destination, nearbyAttractions, familyInsights, params);
      
      // Generate LLM response (simulated)
      const llmResponse = generateLLMResponse(prompt);
      
      // Enhance with real family insights
      const enhancedItinerary = this.enhanceItineraryWithInsights(llmResponse, familyInsights, nearbyAttractions);
      
      console.log(`🎯 Generated inspirational itinerary for ${destination.name}`);
      return enhancedItinerary;

    } catch (error) {
      console.error('Error generating inspirational itinerary:', error.message);
      return this.getFallbackItinerary(destination, params);
    }
  }

  buildItineraryPrompt(destination, nearbyAttractions, familyInsights, params) {
    const { adults, kids, hasDog, travelTime, activities } = params;
    
    let prompt = `Create a family-friendly itinerary for ${destination.name} `;
    prompt += `(${destination.rating}★, ${destination.reviewCount} reviews). `;
    
    if (activities && activities.length > 0) {
      prompt += `Activities: ${activities.join(', ')}. `;
    }
    
    prompt += `Family: ${adults} adults, ${kids} kids${hasDog ? ', with dog' : ''}. `;
    prompt += `Time budget: ${travelTime} minutes. `;
    
    if (nearbyAttractions && nearbyAttractions.length > 0) {
      prompt += `Nearby attractions: ${nearbyAttractions.map(a => a.name).join(', ')}. `;
    }
    
    if (familyInsights && familyInsights.length > 0) {
      prompt += `Family insights: ${familyInsights.map(i => i.text || i).join('. ')}. `;
    }
    
    return prompt;
  }

  enhanceItineraryWithInsights(llmResponse, familyInsights, nearbyAttractions) {
    const enhanced = { ...llmResponse };
    
    // Add real family insights if available
    if (familyInsights && familyInsights.length > 0) {
      enhanced.insights = [
        ...enhanced.insights,
        ...familyInsights.slice(0, 2).map(insight => 
          typeof insight === 'string' ? insight : insight.text
        )
      ];
    }
    
    // Enhance itinerary with nearby attractions
    if (nearbyAttractions && nearbyAttractions.length > 0) {
      enhanced.itinerary = enhanced.itinerary.map((item, index) => {
        if (index === 1 && nearbyAttractions.length > 0) { // Discovery Time
          const nearbyNames = nearbyAttractions.slice(0, 3).map(a => a.name).join(', ');
          return {
            ...item,
            description: item.description.replace(
              'nearby attractions',
              `nearby attractions like ${nearbyNames}`
            )
          };
        }
        return item;
      });
    }
    
    return enhanced;
  }

  getFallbackItinerary(destination, params) {
    return {
      insights: [
        "Families love exploring this destination together",
        "Great place for creating lasting memories",
        "Perfect for family photos and fun activities"
      ],
      itinerary: [
        {
          activity: "Arrival & Exploration",
          duration: "30 min",
          description: "Get oriented and explore the main areas",
          tips: "Start with the most popular spots first"
        },
        {
          activity: "Main Experience",
          duration: "90 min",
          description: "Enjoy the primary attractions and activities",
          tips: "Take breaks to keep everyone comfortable"
        },
        {
          activity: "Wrap-up & Departure",
          duration: "30 min",
          description: "Visit gift shops and plan your next adventure",
          tips: "Great time for family photos"
        }
      ]
    };
  }

  isTouristAttraction(place) {
    const types = place.types || [];
    const name = place.name.toLowerCase();
    
    // Layer 1: Tourist-relevant Google Place types
    const touristTypes = [
      'tourist_attraction', 'museum', 'art_gallery', 'park', 'natural_feature',
      'restaurant', 'cafe', 'bakery', 'shopping_mall', 'clothing_store', 'jewelry_store',
      'amusement_park', 'aquarium', 'zoo', 'movie_theater', 'bowling_alley',
      'historic', 'church', 'synagogue', 'mosque', 'temple', 'landmark',
      'beauty_salon', 'spa', 'gym', 'fitness_center', 'stadium', 'theater'
    ];
    
    // Layer 2: Exclude inappropriate business types
    const excludeTypes = [
      'dentist', 'doctor', 'hospital', 'clinic', 'pharmacy', 'veterinary_care',
      'lawyer', 'accounting', 'insurance_agency', 'real_estate_agency',
      'car_dealer', 'car_rental', 'car_repair', 'gas_station', 'bank', 'atm',
      'post_office', 'school', 'university', 'library', 'police', 'fire_station',
      'local_government_office', 'embassy', 'funeral_home', 'cemetery'
    ];
    
    // Layer 3: Exclude by name patterns
    const excludeNamePatterns = [
      'dds', 'dmd', 'dr.', 'doctor', 'dentist', 'orthodontist', 'endodontist',
      'pediatrician', 'cardiologist', 'dermatologist', 'neurologist',
      'attorney', 'lawyer', 'esq', 'cpa', 'accountant', 'insurance',
      'real estate', 'realtor', 'mortgage', 'loan', 'credit union',
      'dmv', 'post office', 'ups store', 'fedex', 'usps',
      'elementary school', 'middle school', 'high school', 'college',
      'university', 'medical center', 'urgent care', 'emergency room',
      'pharmacy', 'drugstore', 'cvs', 'walgreens', 'rite aid',
      'auto repair', 'car wash', 'oil change', 'tire shop',
      'bank of america', 'wells fargo', 'chase', 'citibank'
    ];
    
    // Check if any exclude types match
    if (excludeTypes.some(type => types.includes(type))) {
      return false;
    }
    
    // Check if name contains exclude patterns
    if (excludeNamePatterns.some(pattern => name.includes(pattern))) {
      return false;
    }
    
    // Check if any tourist types match
    if (touristTypes.some(type => types.includes(type))) {
      return true;
    }
    
    // Additional tourist-friendly name patterns
    const touristNamePatterns = [
      'museum', 'gallery', 'park', 'garden', 'trail', 'beach', 'lake',
      'restaurant', 'cafe', 'bistro', 'grill', 'pizza', 'sushi', 'thai',
      'shop', 'store', 'market', 'mall', 'plaza', 'center', 'square',
      'theater', 'cinema', 'playhouse', 'auditorium', 'stadium', 'arena',
      'zoo', 'aquarium', 'botanical', 'conservatory', 'observatory',
      'monument', 'memorial', 'statue', 'fountain', 'bridge', 'tower'
    ];
    
    return touristNamePatterns.some(pattern => name.includes(pattern));
  }

  categorizePlace(place) {
    const types = place.types || [];
    
    if (types.includes('restaurant') || types.includes('meal_takeaway') || types.includes('food')) {
      return 'RESTAURANT';
    } else if (types.includes('cafe') || types.includes('bakery')) {
      return 'CAFE';
    } else if (types.includes('store') || types.includes('shopping_mall') || types.includes('clothing_store')) {
      return 'SHOPPING';
    } else if (types.includes('tourist_attraction') || types.includes('museum') || types.includes('art_gallery')) {
      return 'CULTURE';
    } else if (types.includes('gas_station') || types.includes('atm') || types.includes('bank')) {
      return 'SERVICES';
    } else if (types.includes('park') || types.includes('natural_feature')) {
      return 'NATURE';
    } else {
      return 'LOCAL';
    }
  }

  getFallbackNearbyAttractions(city) {
    // Fallback for when API is not available
    const attractions = [
      `${city} Visitor Center`,
      'Local Coffee Shop', 
      'Family Restaurant',
      'Gift Shop'
    ];
    
    return attractions.slice(0, 3 + Math.floor(Math.random() * 2))
      .map(name => ({ name, type: 'local' }));
  }

  generateBannerPhoto(details, place) {
    // Enhanced banner photo generation with debugging and fallbacks
    try {
      // First, try to get photos from Google Places API
      if (details.photos && details.photos.length > 0) {
        const photo = details.photos[0];
        const photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=${photo.photo_reference}&key=${this.placesApiKey}`;
        console.log(`📸 Generated banner photo for ${details.name || place.name}: ${photoUrl.substring(0, 80)}...`);
        return photoUrl;
      }

      // Fallback: Try to get a photo from nearby search
      if (details.geometry?.location) {
        const { lat, lng } = details.geometry.location;
        // This would require an additional API call, so for now we'll use a placeholder
        console.log(`📍 No photos found for ${details.name || place.name}, using fallback`);
      }

      // Final fallback: Use a category-based placeholder
      const placeTypes = details.types || place.types || [];
      const category = this.getPhotoCategory(placeTypes);
      const fallbackUrl = this.getFallbackPhotoUrl(category);
      console.log(`🎨 Using fallback photo for ${details.name || place.name}: ${category}`);
      return fallbackUrl;

    } catch (error) {
      console.error(`❌ Error generating banner photo for ${details.name || place.name}:`, error.message);
      return this.getFallbackPhotoUrl('default');
    }
  }

  getPhotoCategory(types) {
    if (types.includes('park') || types.includes('hiking_area') || types.includes('natural_feature')) {
      return 'nature';
    } else if (types.includes('museum') || types.includes('art_gallery')) {
      return 'museum';
    } else if (types.includes('restaurant') || types.includes('cafe')) {
      return 'food';
    } else if (types.includes('shopping_mall') || types.includes('store')) {
      return 'shopping';
    } else if (types.includes('amusement_park') || types.includes('zoo')) {
      return 'entertainment';
    } else if (types.includes('beach') || types.includes('aquarium')) {
      return 'water';
    } else {
      return 'default';
    }
  }

  getFallbackPhotoUrl(category) {
    // Use Unsplash for high-quality placeholder images
    const categoryMap = {
      'nature': 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&h=400&fit=crop',
      'museum': 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=800&h=400&fit=crop',
      'food': 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=400&fit=crop',
      'shopping': 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=400&fit=crop',
      'entertainment': 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=400&fit=crop',
      'water': 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&h=400&fit=crop',
      'default': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=400&fit=crop'
    };
    return categoryMap[category] || categoryMap['default'];
  }

  removeDuplicates(places) {
    const seen = new Set();
    return places.filter(place => {
      const key = `${place.name}-${place.vicinity}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  isDemoMode() {
    return !this.placesApiKey || this.placesApiKey.includes('your_google');
  }

  getDemoPlaces() {
    return [
      {
        place_id: 'demo_1',
        name: 'Golden Gate Park',
        rating: 4.8,
        user_ratings_total: 15420,
        vicinity: 'San Francisco',
        types: ['park', 'establishment'],
        price_level: 0
      },
      {
        place_id: 'demo_2',
        name: 'California Academy of Sciences',
        rating: 4.6,
        user_ratings_total: 8930,
        vicinity: 'San Francisco',
        types: ['museum', 'establishment'],
        price_level: 3
      }
    ];
  }

  generateItinerary(place, params) {
    const types = place.types || [];
    
    if (types.includes('park') || types.includes('hiking_area')) {
      return [
        {
          activity: "Arrival & Exploration",
          duration: "30 min",
          description: "Find parking and explore the area layout"
        },
        {
          activity: "Main Activity",
          duration: "90 min",
          description: "Enjoy hiking trails, playgrounds, or scenic views"
        },
        {
          activity: "Rest & Refreshments",
          duration: "45 min",
          description: "Relax and grab snacks at nearby facilities"
        }
      ];
    } else if (types.includes('museum') || types.includes('art_gallery')) {
      return [
        {
          activity: "Museum Entry & Orientation",
          duration: "20 min",
          description: "Get tickets and plan your visit route"
        },
        {
          activity: "Exhibit Exploration",
          duration: "75 min",
          description: "Discover fascinating exhibits and interactive displays"
        },
        {
          activity: "Gift Shop & Reflection",
          duration: "35 min",
          description: "Browse souvenirs and discuss highlights"
        }
      ];
    } else {
      return [
        {
          activity: "Arrival & Setup",
          duration: "25 min",
          description: "Get settled and orient yourself"
        },
        {
          activity: "Main Experience",
          duration: "80 min",
          description: "Enjoy the primary attraction"
        },
        {
          activity: "Wrap-up & Departure",
          duration: "25 min",
          description: "Finish up and head to your next destination"
        }
      ];
    }
  }

  getFallbackRecommendations(params) {
    return {
      demoMode: true,
      packs: [
        {
          core: {
            name: `Popular Family Destination in ${params.city}`,
            description: 'A highly-rated Google Maps destination perfect for families',
            rating: 4.5,
            reviewCount: 250,
            vicinity: params.city,
            dogFriendly: params.hasDog,
            kidFriendly: params.kids > 0
          },
          eta: { durationText: "20 mins" },
          spokes: [{ name: "Family Café", type: "restaurant" }],
          itinerary: [
            { activity: "Arrival", duration: "30 min", description: "Get oriented" },
            { activity: "Main Activity", duration: "90 min", description: "Enjoy the experience" },
            { activity: "Departure", duration: "30 min", description: "Head home" }
          ]
        }
      ],
      totalResults: 1,
      searchParams: params,
      dataSource: 'Demo Mode'
    };
  }
}

module.exports = GoogleMapsRecommendationService; 