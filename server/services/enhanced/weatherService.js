const axios = require('axios');

class WeatherService {
  constructor() {
    this.apiKey = process.env.OPENWEATHER_API_KEY;
    this.baseURL = 'https://api.openweathermap.org/data/2.5';
  }

  async getCurrentWeather(city) {
    if (!this.apiKey || this.apiKey.includes('your_openweather')) {
      console.log('⚠️ Using demo weather - OpenWeatherMap API key not configured');
      return this.getDemoWeather();
    }

    try {
      const response = await axios.get(`${this.baseURL}/weather`, {
        params: {
          q: `${city},CA,US`,
          appid: this.apiKey,
          units: 'imperial'
        },
        timeout: 5000
      });

      return {
        temperature: Math.round(response.data.main.temp),
        description: response.data.weather[0].description,
        humidity: response.data.main.humidity,
        windSpeed: response.data.wind.speed,
        icon: response.data.weather[0].icon
      };
    } catch (error) {
      console.error('Weather API Error:', error.message);
      return this.getDemoWeather();
    }
  }

  getDemoWeather() {
    return {
      temperature: 72,
      description: 'partly cloudy',
      humidity: 65,
      windSpeed: 8,
      icon: '02d'
    };
  }
}

module.exports = WeatherService;
