#!/bin/bash

# 🗺️ Google Maps Environment Setup Script
# This script helps you configure the environment to use Google Maps data

echo "🌟 Setting up Google Maps configuration..."

# Create the new .env file focused on Google Maps
cat > server/.env << 'ENVEOF'
# 🌟 Weekend Destination App - Google Maps Focused Configuration
# Use Google's comprehensive rating and business data

# Server Configuration
PORT=5002
NODE_ENV=development

# 🗺️ Google Maps Platform APIs (Primary Data Source)
# Get these from: https://console.cloud.google.com/
GOOGLE_PLACES_API_KEY=your_google_places_api_key_here
GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
GOOGLE_GEOCODING_API_KEY=your_google_geocoding_api_key_here

# 🌦️ Weather API (Secondary Enhancement)
# Get free key from: https://openweathermap.org/api
OPENWEATHER_API_KEY=your_openweather_api_key_here

# ⚡ Performance Configuration
CACHE_TTL=3600
CACHE_CHECK_PERIOD=600
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# 🌐 CORS & Security
CORS_ORIGIN=http://localhost:3000

# 📝 Logging
LOG_LEVEL=info

# 🚀 Why Google Maps:
# ✅ Superior location coverage
# ✅ More accurate ratings and reviews
# ✅ Integrated photos and business info
# ✅ Better family/pet-friendly detection
# ✅ Single API for all location needs
ENVEOF

echo "✅ Created .env file with Google Maps configuration"
echo ""
echo "📋 Next steps:"
echo "1. Get your Google Maps API keys from: https://console.cloud.google.com/"
echo "2. Enable these APIs in Google Cloud Console:"
echo "   - Places API (New)"
echo "   - Maps JavaScript API"  
echo "   - Geocoding API"
echo "3. Edit server/.env and replace the placeholder API keys"
echo "4. Optional: Get OpenWeatherMap API key for weather data"
echo ""
echo "🎯 What you'll get with Google Maps data:"
echo "✅ Real ratings from Google Maps users"
echo "✅ Comprehensive business information"
echo "✅ Photos from Google Street View and users"
echo "✅ Accurate opening hours and contact info"
echo "✅ Better family/pet-friendly place detection"
