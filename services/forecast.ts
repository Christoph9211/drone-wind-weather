/**
 * Forecast Service
 * Fetches and processes wind forecast data from OpenWeatherMap API
 */

import { ForecastData, ForecastHour, WindTrend } from '@/types/forecast';

const OPENWEATHER_API = 'https://api.openweathermap.org/data/2.5';

export class ForecastService {
  /**
   * Get hourly forecast for the next 48 hours
   */
  static async getHourlyForecast(
    latitude: number,
    longitude: number,
    units: 'imperial' | 'metric' = 'imperial'
  ): Promise<ForecastData> {
    const apiKey = process.env.EXPO_PUBLIC_OPENWEATHER_API_KEY;
    if (!apiKey) {
      throw new Error('OpenWeatherMap API key not configured');
    }

    try {
      const response = await fetch(
        `${OPENWEATHER_API}/forecast?lat=${latitude}&lon=${longitude}&units=${units}&appid=${apiKey}`
      );

      if (!response.ok) {
        throw new Error(`Forecast API error: ${response.status}`);
      }

      const data = await response.json();
      return this.processForecastData(data, units);
    } catch (error) {
      console.error('Error fetching forecast:', error);
      throw error;
    }
  }

  /**
   * Process raw forecast data into structured format
   */
  private static processForecastData(
    data: any,
    units: 'imperial' | 'metric'
  ): ForecastData {
    const hourly: ForecastHour[] = data.list.slice(0, 40).map((item: any, index: number) => {
      const date = new Date(item.dt * 1000);
      const hours = date.getHours();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours % 12 || 12;

      return {
        timestamp: item.dt * 1000,
        time: `${displayHours}:${String(date.getMinutes()).padStart(2, '0')} ${ampm}`,
        hour: hours,
        windSpeed: item.wind.speed,
        windGust: item.wind.gust || item.wind.speed * 1.2, // Estimate gust if not provided
        windDirection: item.wind.deg || 0,
        temperature: item.main.temp,
        humidity: item.main.humidity,
        precipitation: (item.pop || 0) * 100, // Probability of precipitation
        cloudCover: item.clouds.all,
        visibility: (item.visibility || 10000) / 1000, // Convert to km or miles
        pressure: item.main.pressure,
        feelsLike: item.main.feels_like,
      };
    });

    // Group hourly data into daily summaries
    const dailyMap = new Map<string, ForecastHour[]>();
    hourly.forEach((hour) => {
      const date = new Date(hour.timestamp);
      const dateKey = date.toISOString().split('T')[0];
      if (!dailyMap.has(dateKey)) {
        dailyMap.set(dateKey, []);
      }
      dailyMap.get(dateKey)!.push(hour);
    });

    const daily = Array.from(dailyMap.entries()).map(([dateKey, hours]) => {
      const temps = hours.map((h) => h.temperature);
      const windSpeeds = hours.map((h) => h.windSpeed);
      const gusts = hours.map((h) => h.windGust);
      const precips = hours.map((h) => h.precipitation);

      return {
        date: dateKey,
        highTemp: Math.max(...temps),
        lowTemp: Math.min(...temps),
        avgWindSpeed: windSpeeds.reduce((a, b) => a + b, 0) / windSpeeds.length,
        maxWindGust: Math.max(...gusts),
        precipitationChance: Math.max(...precips),
        summary: this.generateDailySummary(windSpeeds),
      };
    });

    return {
      location: {
        name: data.city.name,
        latitude: data.city.coord.lat,
        longitude: data.city.coord.lon,
      },
      generatedAt: Date.now(),
      expiresAt: Date.now() + 6 * 60 * 60 * 1000, // 6 hours
      hourly,
      daily,
    };
  }

  /**
   * Generate a text summary of daily wind conditions
   */
  private static generateDailySummary(windSpeeds: number[]): string {
    const avg = windSpeeds.reduce((a, b) => a + b, 0) / windSpeeds.length;
    const max = Math.max(...windSpeeds);

    if (max <= 15) return 'Light winds throughout the day';
    if (avg <= 15) return 'Mostly light winds with occasional gusts';
    if (avg <= 25) return 'Moderate winds expected';
    return 'Strong winds throughout the day';
  }

  /**
   * Calculate wind trend between two hours
   */
  static calculateWindTrend(previousHour: ForecastHour, currentHour: ForecastHour): WindTrend {
    const magnitude = currentHour.windSpeed - previousHour.windSpeed;
    const percentChange = (magnitude / previousHour.windSpeed) * 100;

    let direction: 'increasing' | 'decreasing' | 'stable';
    if (Math.abs(magnitude) < 1) {
      direction = 'stable';
    } else if (magnitude > 0) {
      direction = 'increasing';
    } else {
      direction = 'decreasing';
    }

    return {
      direction,
      magnitude: Math.abs(magnitude),
      percentChange: Math.abs(percentChange),
    };
  }

  /**
   * Find peak wind speed in forecast
   */
  static findPeakWind(forecast: ForecastData): ForecastHour {
    return forecast.hourly.reduce((max, hour) =>
      hour.windSpeed > max.windSpeed ? hour : max
    );
  }

  /**
   * Find safest flying window in forecast
   */
  static findSafeWindow(
    forecast: ForecastData,
    safeThreshold: number = 15
  ): { start: ForecastHour; end: ForecastHour } | null {
    let currentWindow: ForecastHour | null = null;
    let longestWindow: { start: ForecastHour; end: ForecastHour } | null = null;
    let longestDuration = 0;

    for (let i = 0; i < forecast.hourly.length; i++) {
      const hour = forecast.hourly[i];

      if (hour.windSpeed <= safeThreshold) {
        if (!currentWindow) {
          currentWindow = hour;
        }
      } else {
        if (currentWindow) {
          const duration = i - forecast.hourly.indexOf(currentWindow);
          if (duration > longestDuration) {
            longestDuration = duration;
            longestWindow = { start: currentWindow, end: forecast.hourly[i - 1] };
          }
          currentWindow = null;
        }
      }
    }

    // Check if we're still in a safe window at the end
    if (currentWindow) {
      const duration = forecast.hourly.length - forecast.hourly.indexOf(currentWindow);
      if (duration > longestDuration) {
        longestWindow = { start: currentWindow, end: forecast.hourly[forecast.hourly.length - 1] };
      }
    }

    return longestWindow;
  }
}
