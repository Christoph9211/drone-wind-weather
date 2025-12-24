export interface WeatherData {
  location: {
    name: string;
    lat: number;
    lon: number;
  };
  current: {
    temp: number;
    feelsLike: number;
    humidity: number;
    pressure: number;
    windSpeed: number;
    windGust: number;
    windDirection: number;
    weatherCondition: string;
    weatherDescription: string;
    weatherIcon: string;
    timestamp: number;
  };
  hourly: HourlyForecast[];
  daily: {
    sunrise: number;
    sunset: number;
  };
}

export interface HourlyForecast {
  timestamp: number;
  temp: number;
  windSpeed: number;
  windDirection: number;
  weatherIcon: string;
  weatherDescription: string;
}

export interface FlightCondition {
  status: 'safe' | 'caution' | 'unsafe';
  message: string;
  color: string;
}

export interface UserSettings {
  units: {
    wind: 'mph' | 'kph';
    temp: 'fahrenheit' | 'celsius';
  };
  thresholds: {
    safe: number;
    caution: number;
  };
  theme: 'light' | 'dark' | 'auto';
  lastLocation?: {
    name: string;
    lat: number;
    lon: number;
  };
}
