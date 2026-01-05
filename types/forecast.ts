/**
 * Forecast Data Types
 * Defines structures for wind forecast data
 */

export interface ForecastHour {
  timestamp: number; // Unix timestamp
  time: string; // Formatted time (e.g., "2:00 PM")
  hour: number; // Hour of day (0-23)
  windSpeed: number; // Wind speed in mph
  windGust: number; // Wind gust in mph
  windDirection: number; // Wind direction in degrees (0-360)
  temperature: number; // Temperature in Fahrenheit
  humidity: number; // Humidity percentage (0-100)
  precipitation: number; // Precipitation probability (0-100)
  cloudCover: number; // Cloud cover percentage (0-100)
  visibility: number; // Visibility in miles
  pressure: number; // Atmospheric pressure in mb
  feelsLike: number; // Feels like temperature
}

export interface ForecastData {
  location: {
    name: string;
    latitude: number;
    longitude: number;
  };
  generatedAt: number; // When forecast was generated
  expiresAt: number; // When forecast expires
  hourly: ForecastHour[];
  daily: {
    date: string;
    highTemp: number;
    lowTemp: number;
    avgWindSpeed: number;
    maxWindGust: number;
    precipitationChance: number;
    summary: string;
  }[];
}

export interface TimelineSelection {
  hourIndex: number;
  timestamp: number;
  data: ForecastHour;
}

export interface WindTrend {
  direction: 'increasing' | 'decreasing' | 'stable';
  magnitude: number; // Change in mph
  percentChange: number; // Percentage change
}
