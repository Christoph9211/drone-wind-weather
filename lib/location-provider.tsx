import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LocationSearchResult } from '@/services/location-search';

interface SavedLocation extends LocationSearchResult {
  savedAt: number; // timestamp
}

interface LocationContextType {
  currentLocation: SavedLocation | null;
  locationHistory: SavedLocation[];
  setCurrentLocation: (location: LocationSearchResult) => Promise<void>;
  addToHistory: (location: LocationSearchResult) => Promise<void>;
  removeFromHistory: (latitude: number, longitude: number) => Promise<void>;
  clearHistory: () => Promise<void>;
  useGPS: boolean;
  setUseGPS: (use: boolean) => Promise<void>;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

const CURRENT_LOCATION_KEY = '@dronewind_current_location';
const LOCATION_HISTORY_KEY = '@dronewind_location_history';
const USE_GPS_KEY = '@dronewind_use_gps';
const MAX_HISTORY_ITEMS = 10;

export function LocationProvider({ children }: { children: ReactNode }) {
  const [currentLocation, setCurrentLocationState] = useState<SavedLocation | null>(null);
  const [locationHistory, setLocationHistoryState] = useState<SavedLocation[]>([]);
  const [useGPS, setUseGPSState] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  // Load saved location and history on mount
  useEffect(() => {
    loadLocationData();
  }, []);

  const loadLocationData = async () => {
    try {
      const [savedLocation, history, gpsPreference] = await Promise.all([
        AsyncStorage.getItem(CURRENT_LOCATION_KEY),
        AsyncStorage.getItem(LOCATION_HISTORY_KEY),
        AsyncStorage.getItem(USE_GPS_KEY),
      ]);

      if (savedLocation) {
        setCurrentLocationState(JSON.parse(savedLocation));
      }

      if (history) {
        setLocationHistoryState(JSON.parse(history));
      }

      if (gpsPreference !== null) {
        setUseGPSState(JSON.parse(gpsPreference));
      }
    } catch (error) {
      console.error('Error loading location data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setCurrentLocation = async (location: LocationSearchResult) => {
    try {
      const savedLocation: SavedLocation = {
        ...location,
        savedAt: Date.now(),
      };

      setCurrentLocationState(savedLocation);
      await AsyncStorage.setItem(CURRENT_LOCATION_KEY, JSON.stringify(savedLocation));

      // Also add to history
      await addToHistory(location);
    } catch (error) {
      console.error('Error setting current location:', error);
      throw error;
    }
  };

  const addToHistory = async (location: LocationSearchResult) => {
    try {
      const savedLocation: SavedLocation = {
        ...location,
        savedAt: Date.now(),
      };

      // Remove duplicate if exists
      const filtered = locationHistory.filter(
        (item) => !(item.latitude === location.latitude && item.longitude === location.longitude)
      );

      // Add new location to beginning
      const updated = [savedLocation, ...filtered].slice(0, MAX_HISTORY_ITEMS);

      setLocationHistoryState(updated);
      await AsyncStorage.setItem(LOCATION_HISTORY_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Error adding to location history:', error);
      throw error;
    }
  };

  const removeFromHistory = async (latitude: number, longitude: number) => {
    try {
      const updated = locationHistory.filter(
        (item) => !(item.latitude === latitude && item.longitude === longitude)
      );

      setLocationHistoryState(updated);
      await AsyncStorage.setItem(LOCATION_HISTORY_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Error removing from location history:', error);
      throw error;
    }
  };

  const clearHistory = async () => {
    try {
      setLocationHistoryState([]);
      await AsyncStorage.removeItem(LOCATION_HISTORY_KEY);
    } catch (error) {
      console.error('Error clearing location history:', error);
      throw error;
    }
  };

  const handleSetUseGPS = async (use: boolean) => {
    try {
      setUseGPSState(use);
      await AsyncStorage.setItem(USE_GPS_KEY, JSON.stringify(use));
    } catch (error) {
      console.error('Error setting GPS preference:', error);
      throw error;
    }
  };

  const value: LocationContextType = {
    currentLocation,
    locationHistory,
    setCurrentLocation,
    addToHistory,
    removeFromHistory,
    clearHistory,
    useGPS,
    setUseGPS: handleSetUseGPS,
  };

  return (
    <LocationContext.Provider value={value}>
      {!isLoading && children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
}
