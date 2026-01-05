import { View, Text, ActivityIndicator, Platform, ScrollView } from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { ScreenContainer } from '@/components/screen-container';
import { useLocation } from '@/lib/location-provider';
import { useSettings } from '@/lib/settings-provider';
import { WeatherService } from '@/services/weather';
import { WeatherData } from '@/types/weather';
import {
  windDirectionToVelocity,
  generateParticles,
  updateParticles,
  getWindSpeedColor,
  getWindSpeedCategory,
  Particle,
} from '@/lib/wind-particle-system';
import { formatWindSpeed } from '@/lib/weather-utils';

import { WindMapCanvasWeb } from '@/components/wind-map-canvas-web';
import { WindMapCanvasNative } from '@/components/wind-map-canvas-native';

// For web, we'll use Canvas API; for native, we'll use a custom canvas view
const MapCanvas = Platform.select({
  web: WindMapCanvasWeb,
  default: WindMapCanvasNative,
});

export default function WindMapScreen() {
  const { currentLocation } = useLocation();
  const { settings } = useSettings();
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [particles, setParticles] = useState<Particle[]>([]);
  const animationRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastUpdateRef = useRef<number>(Date.now());

  // Load weather data for current location
  useEffect(() => {
    loadWeatherData();
  }, [currentLocation]);

  const loadWeatherData = async () => {
    try {
      if (!currentLocation) {
        setError('No location selected');
        setLoading(false);
        return;
      }

      setLoading(true);
      const units = settings.units.wind === 'mph' ? 'imperial' : 'metric';
      const data = await WeatherService.getWeatherData(
        currentLocation.latitude,
        currentLocation.longitude,
        units
      );

      setWeatherData(data);
      setError(null);

      // Initialize particles
      initializeParticles(data);
    } catch (err) {
      console.error('Error loading weather data:', err);
      setError('Failed to load weather data');
    } finally {
      setLoading(false);
    }
  };

  const initializeParticles = (data: WeatherData) => {
    const { vx, vy } = windDirectionToVelocity(
      data.current.windDirection,
      data.current.windSpeed / 10 // Scale down for visualization
    );

    // Generate particles across the map
    const newParticles = generateParticles(
      150, // number of particles
      512, // center x (canvas width / 2)
      384, // center y (canvas height / 2)
      200, // radius
      vx,
      vy,
      2500 // lifetime in ms
    );

    setParticles(newParticles);
  };

  // Animation loop for particles
  useEffect(() => {
    if (!weatherData) return;

    const animate = () => {
      const now = Date.now();
      const deltaTime = now - lastUpdateRef.current;
      lastUpdateRef.current = now;

      setParticles((prevParticles) => {
        const updated = updateParticles(prevParticles, deltaTime);

        // Regenerate particles if count drops below threshold
        if (updated.length < 50) {
          const { vx, vy } = windDirectionToVelocity(
            weatherData.current.windDirection,
            weatherData.current.windSpeed / 10
          );

          const newParticles = generateParticles(
            50,
            512,
            384,
            200,
            vx,
            vy,
            2500
          );

          return [...updated, ...newParticles];
        }

        return updated;
      });

      animationRef.current = setTimeout(animate, 16) as any; // ~60fps
    };

    animationRef.current = setTimeout(animate, 16) as any;

    return () => {
      if (animationRef.current) {
        clearTimeout(animationRef.current);
      }
    };
  }, [weatherData]);

  if (loading) {
    return (
      <ScreenContainer className="justify-center items-center">
        <ActivityIndicator size="large" color="#0a7ea4" />
        <Text className="text-muted mt-3">Loading wind map...</Text>
      </ScreenContainer>
    );
  }

  if (error || !weatherData) {
    return (
      <ScreenContainer className="justify-center items-center p-6">
        <Text className="text-error text-lg font-semibold mb-2">⚠️ Error</Text>
        <Text className="text-muted text-center">{error || 'No weather data available'}</Text>
      </ScreenContainer>
    );
  }

  const windCategory = getWindSpeedCategory(weatherData.current.windSpeed);
  const windColor = getWindSpeedColor(
    weatherData.current.windSpeed,
    settings.thresholds.safe,
    settings.thresholds.caution
  );

  return (
    <ScreenContainer>
      <View className="flex-1">
        {/* Map Canvas */}
        <View className="flex-1 bg-background rounded-2xl overflow-hidden border border-border">
          <MapCanvas
            particles={particles}
            windSpeed={weatherData.current.windSpeed}
            windDirection={weatherData.current.windDirection}
            windCategory={windCategory}
          />
        </View>

        {/* Wind Info Overlay */}
        <View className="absolute top-4 left-4 right-4 bg-surface/95 rounded-lg p-3 border border-border">
          <Text className="text-sm text-muted">Wind Speed at {currentLocation?.name}</Text>
          <View className="flex-row items-baseline gap-2 mt-1">
            <Text className="text-3xl font-bold" style={{ color: windColor }}>
              {formatWindSpeed(weatherData.current.windSpeed, settings.units.wind)}
            </Text>
            <Text className="text-lg font-semibold text-foreground">
              {settings.units.wind}
            </Text>
          </View>
          <Text className="text-xs text-muted mt-2">
            Direction: {Math.round(weatherData.current.windDirection)}° | Gusts: {formatWindSpeed(weatherData.current.windGust, settings.units.wind)} {settings.units.wind}
          </Text>
        </View>

        {/* Legend */}
        <View className="absolute bottom-4 left-4 right-4 bg-surface/95 rounded-lg p-3 border border-border">
          <Text className="text-xs font-semibold text-foreground mb-2">Wind Status</Text>
          <View className="gap-1">
            <View className="flex-row items-center gap-2">
              <View className="w-3 h-3 rounded-full" style={{ backgroundColor: 'rgba(34, 197, 94, 0.8)' }} />
              <Text className="text-xs text-muted">Safe (≤{settings.thresholds.safe} {settings.units.wind})</Text>
            </View>
            <View className="flex-row items-center gap-2">
              <View className="w-3 h-3 rounded-full" style={{ backgroundColor: 'rgba(245, 158, 11, 0.8)' }} />
              <Text className="text-xs text-muted">Caution ({settings.thresholds.safe}-{settings.thresholds.caution} {settings.units.wind})</Text>
            </View>
            <View className="flex-row items-center gap-2">
              <View className="w-3 h-3 rounded-full" style={{ backgroundColor: 'rgba(239, 68, 68, 0.8)' }} />
              <Text className="text-xs text-muted">Unsafe ({'>='}{settings.thresholds.caution} {settings.units.wind})</Text>
            </View>
          </View>
        </View>
      </View>
    </ScreenContainer>
  );
}
