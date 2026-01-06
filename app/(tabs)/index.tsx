import { ScrollView, Text, View, TouchableOpacity, RefreshControl, ActivityIndicator, Platform } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useSettings } from "@/lib/settings-provider";
import { useState, useEffect, useCallback } from "react";
import { WeatherService } from "@/services/weather";
import { WeatherData } from "@/types/weather";
import { AltitudeWindCard } from "@/components/altitude-wind-card";
import { LocationSearchModal } from "@/components/location-search-modal";
import { useLocation } from "@/lib/location-provider";
import { useForecast } from "@/lib/forecast-provider";
import { WindForecastTimeline } from "@/components/wind-forecast-timeline";
import { LocationSearchResult } from "@/services/location-search";
import { TimelineSelection } from "@/types/forecast";
import * as Location from "expo-location";
import * as Haptics from "expo-haptics";
import {
  getFlightCondition,
  degreesToCompass,
  formatTime,
  formatWindSpeed,
  formatTemperature,
  mphToKph,
  fahrenheitToCelsius,
} from "@/lib/weather-utils";
import AsyncStorage from "@react-native-async-storage/async-storage";

const WEATHER_CACHE_KEY = '@dronewind_weather_cache';

export default function HomeScreen() {
  const { settings } = useSettings();
  const { currentLocation, setCurrentLocation, useGPS } = useLocation();
  const { forecast, loading: forecastLoading, selectedHour, setSelectedHour: setForecastSelectedHour, refreshForecast } = useForecast();
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locationPermission, setLocationPermission] = useState(false);
  const [searchModalVisible, setSearchModalVisible] = useState(false);

  useEffect(() => {
    initializeWeather();
  }, [useGPS]);

  // Fetch weather when current location changes (user selects new location)
  useEffect(() => {
    if (currentLocation) {
      fetchWeatherDataForLocation(currentLocation.latitude, currentLocation.longitude);
    }
  }, [currentLocation]);

  const initializeWeather = async () => {
    try {
      // Check if we have a saved location from previous session
      if (currentLocation) {
        await fetchWeatherDataForLocation(currentLocation.latitude, currentLocation.longitude);
        setLoading(false);
        return;
      }

      // Check location permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      setLocationPermission(status === 'granted');

      if (status === 'granted') {
        await fetchWeatherData();
      } else {
        // Load cached data or use default location
        const cached = await loadCachedWeather();
        if (cached) {
          setWeatherData(cached);
        } else {
          // Default to San Francisco if no permission and no cache
          await fetchWeatherDataForLocation(37.7749, -122.4194);
        }
      }
    } catch (err) {
      console.error('Error initializing weather:', err);
      setError('Failed to load weather data');
    } finally {
      setLoading(false);
    }
  };

  const fetchWeatherData = async () => {
    try {
      setLoading(true);
      const location = await Location.getCurrentPositionAsync({});
      await fetchWeatherDataForLocation(location.coords.latitude, location.coords.longitude);
    } catch (err) {
      console.error('Error fetching location:', err);
      setError('Failed to get location');
      setLoading(false);
    }
  };

  const fetchWeatherDataForLocation = async (lat: number, lon: number) => {
    try {
      const units = settings.units.wind === 'mph' ? 'imperial' : 'metric';
      const data = await WeatherService.getWeatherData(lat, lon, units);
      setWeatherData(data);
      setError(null);
      // Refresh forecast for this location
      await refreshForecast(lat, lon);
      
      // Cache the data
      await AsyncStorage.setItem(WEATHER_CACHE_KEY, JSON.stringify(data));
    } catch (err) {
      console.error('Error fetching weather:', err);
      setError('Failed to fetch weather data');
    }
  };

  const loadCachedWeather = async (): Promise<WeatherData | null> => {
    try {
      const cached = await AsyncStorage.getItem(WEATHER_CACHE_KEY);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (err) {
      console.error('Error loading cached weather:', err);
    }
    return null;
  };

  const handleLocationSelect = async (location: LocationSearchResult) => {
    try {
      await setCurrentLocation(location);
      setLoading(true);
      await fetchWeatherDataForLocation(location.latitude, location.longitude);
    } catch (err) {
      console.error('Error selecting location:', err);
      setError('Failed to load weather for selected location');
    } finally {
      setLoading(false);
      setSearchModalVisible(false);
    }
  };

  const handleForecastHourSelect = (selection: TimelineSelection) => {
    setForecastSelectedHour(selection);
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    if (locationPermission) {
      await fetchWeatherData();
    } else if (weatherData) {
      await fetchWeatherDataForLocation(weatherData.location.lat, weatherData.location.lon);
    }
    
    setRefreshing(false);
  }, [locationPermission, weatherData]);

  const displayForecast = forecast && !forecastLoading;

  if (loading) {
    return (
      <ScreenContainer className="justify-center items-center">
        <ActivityIndicator size="large" color="#0a7ea4" />
        <Text className="text-muted mt-4">Loading weather data...</Text>
      </ScreenContainer>
    );
  }

  if (error && !weatherData) {
    return (
      <ScreenContainer className="justify-center items-center p-6">
        <Text className="text-error text-lg font-semibold mb-2">⚠️ Error</Text>
        <Text className="text-muted text-center mb-4">{error}</Text>
        <TouchableOpacity
          onPress={initializeWeather}
          className="bg-primary px-6 py-3 rounded-full active:opacity-80"
        >
          <Text className="text-white font-semibold">Retry</Text>
        </TouchableOpacity>
      </ScreenContainer>
    );
  }

  if (!weatherData) {
    return (
      <ScreenContainer className="justify-center items-center p-6">
        <Text className="text-muted text-center">No weather data available</Text>
      </ScreenContainer>
    );
  }

  // Convert units if needed
  const displayWindSpeed = settings.units.wind === 'kph' && weatherData.current.windSpeed 
    ? mphToKph(weatherData.current.windSpeed) 
    : weatherData.current.windSpeed;
  
  const displayWindGust = settings.units.wind === 'kph' && weatherData.current.windGust
    ? mphToKph(weatherData.current.windGust)
    : weatherData.current.windGust;

  const displayTemp = settings.units.temp === 'celsius' && weatherData.current.temp
    ? fahrenheitToCelsius(weatherData.current.temp)
    : weatherData.current.temp;

  const flightCondition = getFlightCondition(displayWindSpeed, settings.thresholds);
  const windDirection = degreesToCompass(weatherData.current.windDirection);

  return (
    <ScreenContainer>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, padding: 24 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0a7ea4" />
        }
      >
        <View className="flex-1 gap-6">
          {/* Location Header with Search */}
          <View className="items-center">
            <TouchableOpacity
              onPress={() => setSearchModalVisible(true)}
              className="mb-3 px-4 py-2 bg-surface rounded-full border border-border active:bg-primary/10"
            >
              <Text className="text-sm text-primary font-semibold">🔍 Change Location</Text>
            </TouchableOpacity>
            <Text className="text-2xl font-bold text-foreground">{weatherData.location.name}</Text>
            <Text className="text-sm text-muted mt-1">{weatherData.current.weatherDescription}</Text>
          </View>

          {/* Wind Speed Display */}
          <View className="items-center py-6">
            <Text className="text-6xl font-bold" style={{ color: flightCondition.color }}>
              {displayWindSpeed}
            </Text>
            <Text className="text-2xl text-muted mt-1">{settings.units.wind}</Text>
            
            {/* Flight Status Badge */}
            <View
              className="mt-4 px-6 py-2 rounded-full"
              style={{ backgroundColor: flightCondition.color }}
            >
              <Text className="text-white font-bold text-lg">{flightCondition.message.toUpperCase()}</Text>
            </View>
          </View>

          {/* Weather Details Card */}
          <View className="bg-surface rounded-2xl p-4 border border-border">
            <Text className="text-lg font-semibold text-foreground mb-3">Current Conditions</Text>
            
            <View className="gap-2">
              <View className="flex-row justify-between">
                <Text className="text-base text-muted">Temperature</Text>
                <Text className="text-base text-foreground font-semibold">
                  {formatTemperature(displayTemp, settings.units.temp)}
                </Text>
              </View>
              
              <View className="flex-row justify-between">
                <Text className="text-base text-muted">Humidity</Text>
                <Text className="text-base text-foreground font-semibold">
                  {weatherData.current.humidity}%
                </Text>
              </View>
              
              <View className="flex-row justify-between">
                <Text className="text-base text-muted">Pressure</Text>
                <Text className="text-base text-foreground font-semibold">
                  {weatherData.current.pressure} hPa
                </Text>
              </View>
              
              <View className="flex-row justify-between">
                <Text className="text-base text-muted">Wind Gusts</Text>
                <Text className="text-base text-foreground font-semibold">
                  {formatWindSpeed(displayWindGust, settings.units.wind)}
                </Text>
              </View>
            </View>
          </View>

          {/* Wind Direction Card */}
          <View className="bg-surface rounded-2xl p-4 border border-border items-center">
            <Text className="text-lg font-semibold text-foreground mb-3">Wind Direction</Text>
            <View className="items-center">
              <View
                className="w-24 h-24 rounded-full bg-primary/20 items-center justify-center"
                style={{ transform: [{ rotate: `${weatherData.current.windDirection}deg` }] }}
              >
                <Text className="text-4xl">↑</Text>
              </View>
              <Text className="text-2xl font-bold text-foreground mt-3">{windDirection}</Text>
              <Text className="text-sm text-muted">{weatherData.current.windDirection}°</Text>
            </View>
          </View>

          {/* Hourly Forecast */}
          <View>
            <Text className="text-lg font-semibold text-foreground mb-3">Hourly Forecast</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-row gap-3">
                {weatherData.hourly.map((hour, index) => {
                  const hourWindSpeed = settings.units.wind === 'kph' 
                    ? mphToKph(hour.windSpeed) 
                    : hour.windSpeed;
                  const hourCondition = getFlightCondition(hourWindSpeed, settings.thresholds);
                  
                  return (
                    <View
                      key={index}
                      className="bg-surface rounded-xl p-3 border border-border items-center"
                      style={{ width: 80 }}
                    >
                      <Text className="text-sm text-muted font-semibold">{formatTime(hour.timestamp)}</Text>
                      <View
                        className="w-3 h-3 rounded-full my-2"
                        style={{ backgroundColor: hourCondition.color }}
                      />
                      <Text className="text-xl font-bold text-foreground">{hourWindSpeed}</Text>
                      <Text className="text-xs text-muted">{settings.units.wind}</Text>
                    </View>
                  );
                })}
              </View>
            </ScrollView>
          </View>

          {/* Wind at Altitude */}
          <AltitudeWindCard groundWindSpeed={displayWindSpeed} settings={settings} />

          {/* Wind Forecast Timeline */}
          {displayForecast && (
            <WindForecastTimeline
              forecast={forecast}
              loading={forecastLoading}
              selectedHour={selectedHour}
              onHourSelect={handleForecastHourSelect}
              safeThreshold={settings.thresholds.safe}
              cautionThreshold={settings.thresholds.caution}
              windUnit={settings.units.wind}
            />
          )}

          {/* Sun Times */}
          <View className="bg-surface rounded-2xl p-4 border border-border">
            <View className="flex-row justify-around">
              <View className="items-center">
                <Text className="text-3xl mb-1">🌅</Text>
                <Text className="text-sm text-muted">Sunrise</Text>
                <Text className="text-base text-foreground font-semibold">
                  {formatTime(weatherData.daily.sunrise)}
                </Text>
              </View>
              
              <View className="items-center">
                <Text className="text-3xl mb-1">🌇</Text>
                <Text className="text-sm text-muted">Sunset</Text>
                <Text className="text-base text-foreground font-semibold">
                  {formatTime(weatherData.daily.sunset)}
                </Text>
              </View>
            </View>
          </View>

          {/* Info Note */}
          {!locationPermission && (
            <View className="bg-warning/10 rounded-xl p-3 border border-warning/30">
              <Text className="text-sm text-warning text-center">
                📍 Enable location permissions for automatic updates
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
      
      {/* Location Search Modal */}
      <LocationSearchModal
        visible={searchModalVisible}
        onClose={() => setSearchModalVisible(false)}
        onSelectLocation={handleLocationSelect}
      />
    </ScreenContainer>
  );
}
