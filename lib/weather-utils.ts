import { FlightCondition, UserSettings } from '@/types/weather';

/**
 * Determine flight condition based on wind speed and user thresholds
 */
export function getFlightCondition(windSpeed: number, thresholds: UserSettings['thresholds']): FlightCondition {
  if (windSpeed <= thresholds.safe) {
    return {
      status: 'safe',
      message: 'Safe to Fly',
      color: '#22C55E',
    };
  } else if (windSpeed <= thresholds.caution) {
    return {
      status: 'caution',
      message: 'Caution Advised',
      color: '#F59E0B',
    };
  } else {
    return {
      status: 'unsafe',
      message: 'Unsafe Conditions',
      color: '#EF4444',
    };
  }
}

/**
 * Convert wind direction degrees to compass direction
 */
export function degreesToCompass(degrees: number): string {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(degrees / 22.5) % 16;
  return directions[index];
}

/**
 * Get wind direction arrow rotation
 */
export function getWindDirectionRotation(degrees: number): number {
  return degrees;
}

/**
 * Convert mph to kph
 */
export function mphToKph(mph: number): number {
  return Math.round(mph * 1.60934);
}

/**
 * Convert kph to mph
 */
export function kphToMph(kph: number): number {
  return Math.round(kph / 1.60934);
}

/**
 * Convert Fahrenheit to Celsius
 */
export function fahrenheitToCelsius(fahrenheit: number): number {
  return Math.round((fahrenheit - 32) * (5 / 9));
}

/**
 * Convert Celsius to Fahrenheit
 */
export function celsiusToFahrenheit(celsius: number): number {
  return Math.round((celsius * 9) / 5 + 32);
}

/**
 * Format timestamp to time string (e.g., "2:30 PM")
 */
export function formatTime(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

/**
 * Format timestamp to date string (e.g., "Jan 15")
 */
export function formatDate(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * Get appropriate wind speed color based on flight condition
 */
export function getWindSpeedColor(windSpeed: number, thresholds: UserSettings['thresholds']): string {
  const condition = getFlightCondition(windSpeed, thresholds);
  return condition.color;
}

/**
 * Format wind speed with unit
 */
export function formatWindSpeed(windSpeed: number, unit: 'mph' | 'kph'): string {
  return `${windSpeed} ${unit}`;
}

/**
 * Format temperature with unit
 */
export function formatTemperature(temp: number, unit: 'fahrenheit' | 'celsius'): string {
  const symbol = unit === 'fahrenheit' ? '°F' : '°C';
  return `${temp}${symbol}`;
}

/**
 * Get default user settings
 */
export function getDefaultSettings(): UserSettings {
  return {
    units: {
      wind: 'mph',
      temp: 'fahrenheit',
    },
    thresholds: {
      safe: 15,
      caution: 25,
    },
    theme: 'auto',
  };
}
