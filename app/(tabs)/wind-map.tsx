import { View, Text, ActivityIndicator, Platform, TouchableOpacity } from 'react-native';
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
import { formatWindSpeed, degreesToCompass, getFlightCondition } from '@/lib/weather-utils';
import * as Haptics from 'expo-haptics';

import { WindMapCanvasWeb } from '@/components/wind-map-canvas-web';
import { WindMapCanvasNative } from '@/components/wind-map-canvas-native';

const MapCanvas = Platform.OS === 'web' ? WindMapCanvasWeb : WindMapCanvasNative;

export default function WindMapScreen() {
  const { currentLocation } = useLocation();
  const { settings } = useSettings();
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [showDetails, setShowDetails] = useState(true);
  const animationRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastUpdateRef = useRef<number>(Date.now());

  useEffect(() => {
    console.log('Wind Map - Platform:', Platform.OS, 'Particles:', particles.length);
  }, [particles]);

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
      data.current.windSpeed / 8
    );

    const newParticles = generateParticles(
      200,
      512,
      384,
      280,
      vx,
      vy,
      3000
    );

    console.log('Particles initialized:', newParticles.length);
    setParticles(newParticles);
  };

  useEffect(() => {
    if (!weatherData) return;

    const animate = () => {
      const now = Date.now();
      const deltaTime = now - lastUpdateRef.current;
      lastUpdateRef.current = now;

      setParticles((prevParticles) => {
        const updated = updateParticles(prevParticles, deltaTime);

        if (updated.length < 80) {
          const { vx, vy } = windDirectionToVelocity(
            weatherData.current.windDirection,
            weatherData.current.windSpeed / 8
          );

          const newParticles = generateParticles(
            60,
            512,
            384,
            280,
            vx,
            vy,
            3000
          );

          return [...updated, ...newParticles];
        }

        return updated;
      });

      animationRef.current = setTimeout(animate, 16) as any;
    };

    animationRef.current = setTimeout(animate, 16) as any;

    return () => {
      if (animationRef.current) {
        clearTimeout(animationRef.current);
      }
    };
  }, [weatherData]);

  const toggleDetails = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setShowDetails(!showDetails);
  };

  if (loading) {
    return (
      <ScreenContainer className="justify-center items-center bg-[#0f172a]">
        <ActivityIndicator size="large" color="#10b981" />
        <Text className="text-slate-400 mt-4 text-sm">Loading wind map...</Text>
      </ScreenContainer>
    );
  }

  if (error || !weatherData) {
    return (
      <ScreenContainer className="justify-center items-center p-6 bg-[#0f172a]">
        <Text className="text-red-400 text-lg font-semibold mb-2">Unable to Load</Text>
        <Text className="text-slate-400 text-center text-sm">{error || 'No weather data available'}</Text>
        <TouchableOpacity
          onPress={loadWeatherData}
          className="mt-4 bg-emerald-600 px-6 py-3 rounded-full active:opacity-80"
        >
          <Text className="text-white font-semibold">Retry</Text>
        </TouchableOpacity>
      </ScreenContainer>
    );
  }

  const windCategory = getWindSpeedCategory(weatherData.current.windSpeed);
  const windColor = getWindSpeedColor(
    weatherData.current.windSpeed,
    settings.thresholds.safe,
    settings.thresholds.caution
  );
  const flightCondition = getFlightCondition(weatherData.current.windSpeed, settings.thresholds);
  const windDirection = degreesToCompass(weatherData.current.windDirection);

  const statusColors = {
    safe: { bg: 'bg-emerald-500/20', border: 'border-emerald-500/40', text: 'text-emerald-400' },
    caution: { bg: 'bg-amber-500/20', border: 'border-amber-500/40', text: 'text-amber-400' },
    unsafe: { bg: 'bg-red-500/20', border: 'border-red-500/40', text: 'text-red-400' },
  };

  const status = statusColors[windCategory];

  return (
    <ScreenContainer containerClassName="bg-[#0f172a]">
      <View className="flex-1">
        {/* Map Canvas */}
        <View className="flex-1 overflow-hidden" style={{ width: '100%', height: '100%' }}>
          <MapCanvas
            particles={particles}
            windSpeed={weatherData.current.windSpeed}
            windDirection={weatherData.current.windDirection}
            windCategory={windCategory}
            safeThreshold={settings.thresholds.safe}
            cautionThreshold={settings.thresholds.caution}
          />
        </View>

        {/* Top Info Bar */}
        {showDetails && (
          <View className="absolute top-3 left-3 right-3">
            <View className="bg-slate-900/95 rounded-xl border border-slate-700/50 overflow-hidden">
              {/* Location Header */}
              <View className="px-4 py-3 border-b border-slate-700/50">
                <View className="flex-row items-center justify-between">
                  <View className="flex-1">
                    <Text className="text-slate-400 text-xs uppercase tracking-wider">Current Location</Text>
                    <Text className="text-white font-semibold text-base mt-0.5" numberOfLines={1}>
                      {currentLocation?.name || 'Unknown'}
                    </Text>
                  </View>
                  <View className={`px-3 py-1.5 rounded-full ${status.bg} border ${status.border}`}>
                    <Text className={`text-xs font-bold uppercase ${status.text}`}>
                      {flightCondition.status}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Wind Stats */}
              <View className="flex-row">
                <View className="flex-1 px-4 py-3 border-r border-slate-700/50">
                  <Text className="text-slate-500 text-xs uppercase tracking-wider">Wind Speed</Text>
                  <View className="flex-row items-baseline mt-1">
                    <Text className="text-2xl font-bold" style={{ color: windColor }}>
                      {Math.round(weatherData.current.windSpeed)}
                    </Text>
                    <Text className="text-slate-400 text-sm ml-1">{settings.units.wind}</Text>
                  </View>
                </View>
                <View className="flex-1 px-4 py-3 border-r border-slate-700/50">
                  <Text className="text-slate-500 text-xs uppercase tracking-wider">Gusts</Text>
                  <View className="flex-row items-baseline mt-1">
                    <Text className="text-2xl font-bold text-slate-200">
                      {Math.round(weatherData.current.windGust)}
                    </Text>
                    <Text className="text-slate-400 text-sm ml-1">{settings.units.wind}</Text>
                  </View>
                </View>
                <View className="flex-1 px-4 py-3">
                  <Text className="text-slate-500 text-xs uppercase tracking-wider">Direction</Text>
                  <View className="flex-row items-baseline mt-1">
                    <Text className="text-2xl font-bold text-slate-200">{windDirection}</Text>
                    <Text className="text-slate-400 text-sm ml-1">{weatherData.current.windDirection}°</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Bottom Legend */}
        {showDetails && (
          <View className="absolute bottom-3 left-3 right-3">
            <View className="bg-slate-900/95 rounded-xl border border-slate-700/50 px-4 py-3">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-4">
                  <View className="flex-row items-center gap-2">
                    <View className="w-3 h-3 rounded-full bg-emerald-500" />
                    <Text className="text-slate-400 text-xs">Safe ≤{settings.thresholds.safe}</Text>
                  </View>
                  <View className="flex-row items-center gap-2">
                    <View className="w-3 h-3 rounded-full bg-amber-500" />
                    <Text className="text-slate-400 text-xs">Caution</Text>
                  </View>
                  <View className="flex-row items-center gap-2">
                    <View className="w-3 h-3 rounded-full bg-red-500" />
                    <Text className="text-slate-400 text-xs">Unsafe ≥{settings.thresholds.caution}</Text>
                  </View>
                </View>
                <Text className="text-slate-500 text-xs">
                  Updated {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Toggle Details Button */}
        <TouchableOpacity
          onPress={toggleDetails}
          className="absolute top-3 right-3 w-10 h-10 bg-slate-800/90 rounded-full items-center justify-center border border-slate-700/50 active:opacity-70"
        >
          <Text className="text-white text-lg">{showDetails ? '−' : '+'}</Text>
        </TouchableOpacity>
      </View>
    </ScreenContainer>
  );
}
