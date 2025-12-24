import { describe, it, expect } from 'vitest';

describe('OpenWeatherMap API', () => {
  it('should validate API key by fetching weather data', async () => {
    const apiKey = process.env.EXPO_PUBLIC_OPENWEATHER_API_KEY;
    
    expect(apiKey).toBeDefined();
    expect(apiKey).not.toBe('');
    
    // Test with San Francisco coordinates
    const lat = 37.7749;
    const lon = -122.4194;
    
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=imperial&appid=${apiKey}`
    );
    
    expect(response.ok).toBe(true);
    
    const data = await response.json();
    
    // Verify response structure
    expect(data).toHaveProperty('coord');
    expect(data).toHaveProperty('weather');
    expect(data).toHaveProperty('main');
    expect(data).toHaveProperty('wind');
    expect(data.wind).toHaveProperty('speed');
    expect(data.wind).toHaveProperty('deg');
  }, 10000); // 10 second timeout for API call
});
