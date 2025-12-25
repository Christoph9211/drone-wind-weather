/**
 * Location Search Service
 * Uses OpenWeatherMap Geocoding API to search for locations by name
 * and convert coordinates to location names
 */

export interface LocationSearchResult {
  name: string;
  country: string;
  state?: string;
  latitude: number;
  longitude: number;
  fullName: string; // Formatted display name
}

export interface ReverseGeocodeResult {
  name: string;
  country: string;
  state?: string;
  latitude: number;
  longitude: number;
}

const OPENWEATHER_GEO_API = 'https://api.openweathermap.org/geo/1.0';

/**
 * Search for locations by name using OpenWeatherMap Geocoding API
 */
export async function searchLocations(
  query: string,
  limit: number = 10
): Promise<LocationSearchResult[]> {
  if (!query || query.trim().length === 0) {
    return [];
  }

  const apiKey = process.env.EXPO_PUBLIC_OPENWEATHER_API_KEY;
  if (!apiKey) {
    throw new Error('OpenWeatherMap API key not configured');
  }

  try {
    const response = await fetch(
      `${OPENWEATHER_GEO_API}/direct?q=${encodeURIComponent(query)}&limit=${limit}&appid=${apiKey}`
    );

    if (!response.ok) {
      throw new Error(`Geocoding API error: ${response.status}`);
    }

    const data = await response.json();

    return data.map((location: any) => ({
      name: location.name,
      country: location.country,
      state: location.state,
      latitude: location.lat,
      longitude: location.lon,
      fullName: formatLocationName(location),
    }));
  } catch (error) {
    console.error('Location search error:', error);
    throw error;
  }
}

/**
 * Reverse geocode coordinates to get location name
 */
export async function reverseGeocode(
  latitude: number,
  longitude: number
): Promise<ReverseGeocodeResult | null> {
  const apiKey = process.env.EXPO_PUBLIC_OPENWEATHER_API_KEY;
  if (!apiKey) {
    throw new Error('OpenWeatherMap API key not configured');
  }

  try {
    const response = await fetch(
      `${OPENWEATHER_GEO_API}/reverse?lat=${latitude}&lon=${longitude}&limit=1&appid=${apiKey}`
    );

    if (!response.ok) {
      throw new Error(`Reverse geocoding API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.length === 0) {
      return null;
    }

    const location = data[0];
    return {
      name: location.name,
      country: location.country,
      state: location.state,
      latitude: location.lat,
      longitude: location.lon,
    };
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return null;
  }
}

/**
 * Format location name for display
 */
export function formatLocationName(location: any): string {
  const parts = [location.name];

  if (location.state) {
    parts.push(location.state);
  }

  if (location.country) {
    parts.push(location.country);
  }

  return parts.join(', ');
}

/**
 * Validate coordinates
 */
export function isValidCoordinates(latitude: number, longitude: number): boolean {
  return (
    typeof latitude === 'number' &&
    typeof longitude === 'number' &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
}

/**
 * Calculate distance between two coordinates in kilometers
 * Uses Haversine formula
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
