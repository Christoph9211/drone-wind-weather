import { WeatherData, HourlyForecast } from '@/types/weather';

const OPENWEATHER_API_KEY = process.env.EXPO_PUBLIC_OPENWEATHER_API_KEY || '';
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

export class WeatherService {
  /**
   * Fetch current weather and forecast data for a location
   */
  static async getWeatherData(lat: number, lon: number, units: 'metric' | 'imperial' = 'imperial'): Promise<WeatherData> {
    try {
      // Fetch current weather
      const currentResponse = await fetch(
        `${BASE_URL}/weather?lat=${lat}&lon=${lon}&units=${units}&appid=${OPENWEATHER_API_KEY}`
      );
      
      if (!currentResponse.ok) {
        throw new Error(`Weather API error: ${currentResponse.status}`);
      }
      
      const currentData = await currentResponse.json();
      
      // Fetch hourly forecast
      const forecastResponse = await fetch(
        `${BASE_URL}/forecast?lat=${lat}&lon=${lon}&units=${units}&appid=${OPENWEATHER_API_KEY}`
      );
      
      if (!forecastResponse.ok) {
        throw new Error(`Forecast API error: ${forecastResponse.status}`);
      }
      
      const forecastData = await forecastResponse.json();
      
      // Parse and structure the data
      const weatherData: WeatherData = {
        location: {
          name: currentData.name,
          lat: currentData.coord.lat,
          lon: currentData.coord.lon,
        },
        current: {
          temp: Math.round(currentData.main.temp),
          feelsLike: Math.round(currentData.main.feels_like),
          humidity: currentData.main.humidity,
          pressure: currentData.main.pressure,
          windSpeed: Math.round(currentData.wind.speed),
          windGust: currentData.wind.gust ? Math.round(currentData.wind.gust) : Math.round(currentData.wind.speed),
          windDirection: currentData.wind.deg,
          weatherCondition: currentData.weather[0].main,
          weatherDescription: currentData.weather[0].description,
          weatherIcon: currentData.weather[0].icon,
          timestamp: currentData.dt,
        },
        hourly: this.parseHourlyForecast(forecastData.list.slice(0, 12)),
        daily: {
          sunrise: currentData.sys.sunrise,
          sunset: currentData.sys.sunset,
        },
      };
      
      return weatherData;
    } catch (error) {
      console.error('Error fetching weather data:', error);
      throw error;
    }
  }
  
  /**
   * Search for a location by name
   */
  static async searchLocation(query: string): Promise<Array<{ name: string; lat: number; lon: number; country: string }>> {
    try {
      const response = await fetch(
        `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(query)}&limit=5&appid=${OPENWEATHER_API_KEY}`
      );
      
      if (!response.ok) {
        throw new Error(`Geocoding API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      return data.map((item: any) => ({
        name: item.name,
        lat: item.lat,
        lon: item.lon,
        country: item.country,
      }));
    } catch (error) {
      console.error('Error searching location:', error);
      throw error;
    }
  }
  
  /**
   * Get location name from coordinates (reverse geocoding)
   */
  static async getLocationName(lat: number, lon: number): Promise<string> {
    try {
      const response = await fetch(
        `https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${OPENWEATHER_API_KEY}`
      );
      
      if (!response.ok) {
        throw new Error(`Reverse geocoding API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.length > 0) {
        return data[0].name;
      }
      
      return 'Unknown Location';
    } catch (error) {
      console.error('Error getting location name:', error);
      return 'Unknown Location';
    }
  }
  
  /**
   * Parse hourly forecast data
   */
  private static parseHourlyForecast(forecastList: any[]): HourlyForecast[] {
    return forecastList.map((item) => ({
      timestamp: item.dt,
      temp: Math.round(item.main.temp),
      windSpeed: Math.round(item.wind.speed),
      windDirection: item.wind.deg,
      weatherIcon: item.weather[0].icon,
      weatherDescription: item.weather[0].description,
    }));
  }
  
  /**
   * Get weather icon URL from OpenWeatherMap
   */
  static getWeatherIconUrl(iconCode: string): string {
    return `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
  }
}
