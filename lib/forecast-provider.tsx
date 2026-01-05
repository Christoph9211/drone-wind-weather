import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ForecastData, TimelineSelection } from '@/types/forecast';
import { ForecastService } from '@/services/forecast';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ForecastContextType {
  forecast: ForecastData | null;
  loading: boolean;
  error: string | null;
  selectedHour: TimelineSelection | null;
  setSelectedHour: (selection: TimelineSelection) => void;
  refreshForecast: (latitude: number, longitude: number) => Promise<void>;
}

const ForecastContext = createContext<ForecastContextType | undefined>(undefined);

const FORECAST_CACHE_KEY = '@dronewind_forecast_cache';
const FORECAST_CACHE_EXPIRY_KEY = '@dronewind_forecast_expiry';

export function ForecastProvider({ children }: { children: ReactNode }) {
  const [forecast, setForecast] = useState<ForecastData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedHour, setSelectedHour] = useState<TimelineSelection | null>(null);

  // Set initial selected hour when forecast loads
  useEffect(() => {
    if (forecast && forecast.hourly.length > 0 && !selectedHour) {
      setSelectedHour({
        hourIndex: 0,
        timestamp: forecast.hourly[0].timestamp,
        data: forecast.hourly[0],
      });
    }
  }, [forecast]);

  const loadCachedForecast = async (): Promise<ForecastData | null> => {
    try {
      const cached = await AsyncStorage.getItem(FORECAST_CACHE_KEY);
      const expiry = await AsyncStorage.getItem(FORECAST_CACHE_EXPIRY_KEY);

      if (cached && expiry) {
        const expiryTime = parseInt(expiry, 10);
        if (Date.now() < expiryTime) {
          return JSON.parse(cached);
        }
      }
    } catch (err) {
      console.error('Error loading cached forecast:', err);
    }
    return null;
  };

  const cacheForecast = async (data: ForecastData) => {
    try {
      await AsyncStorage.setItem(FORECAST_CACHE_KEY, JSON.stringify(data));
      await AsyncStorage.setItem(
        FORECAST_CACHE_EXPIRY_KEY,
        String(data.expiresAt)
      );
    } catch (err) {
      console.error('Error caching forecast:', err);
    }
  };

  const refreshForecast = async (latitude: number, longitude: number) => {
    try {
      setLoading(true);
      setError(null);

      const data = await ForecastService.getHourlyForecast(latitude, longitude);
      setForecast(data);
      await cacheForecast(data);
    } catch (err) {
      console.error('Error refreshing forecast:', err);
      setError('Failed to load forecast data');

      // Try to load cached data as fallback
      const cached = await loadCachedForecast();
      if (cached) {
        setForecast(cached);
      }
    } finally {
      setLoading(false);
    }
  };

  const value: ForecastContextType = {
    forecast,
    loading,
    error,
    selectedHour,
    setSelectedHour,
    refreshForecast,
  };

  return (
    <ForecastContext.Provider value={value}>
      {children}
    </ForecastContext.Provider>
  );
}

export function useForecast() {
  const context = useContext(ForecastContext);
  if (context === undefined) {
    throw new Error('useForecast must be used within a ForecastProvider');
  }
  return context;
}
