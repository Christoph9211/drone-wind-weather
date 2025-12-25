import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Modal,
  Platform,
} from 'react-native';
import { useState, useCallback } from 'react';
import * as Haptics from 'expo-haptics';
import { searchLocations, LocationSearchResult } from '@/services/location-search';

interface LocationSearchModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectLocation: (location: LocationSearchResult) => void;
}

export function LocationSearchModal({
  visible,
  onClose,
  onSelectLocation,
}: LocationSearchModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<LocationSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = useCallback(
    async (query: string) => {
      setSearchQuery(query);
      setError(null);

      if (query.trim().length < 2) {
        setResults([]);
        return;
      }

      setLoading(true);
      try {
        const searchResults = await searchLocations(query);
        setResults(searchResults);
      } catch (err) {
        setError('Failed to search locations. Please try again.');
        setResults([]);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const handleSelectLocation = (location: LocationSearchResult) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onSelectLocation(location);
    setSearchQuery('');
    setResults([]);
    onClose();
  };

  const renderLocationItem = ({ item }: { item: LocationSearchResult }) => (
    <TouchableOpacity
      onPress={() => handleSelectLocation(item)}
      className="px-4 py-3 border-b border-border active:bg-primary/10"
    >
      <Text className="text-base font-semibold text-foreground">{item.name}</Text>
      <Text className="text-sm text-muted mt-1">
        {item.state ? `${item.state}, ` : ''}
        {item.country}
      </Text>
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-background">
        {/* Header */}
        <View className="bg-surface border-b border-border px-4 py-4 pt-6">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-lg font-bold text-foreground">Search Location</Text>
            <TouchableOpacity
              onPress={onClose}
              className="px-3 py-2 rounded-lg active:bg-primary/10"
            >
              <Text className="text-primary font-semibold">Cancel</Text>
            </TouchableOpacity>
          </View>

          {/* Search Input */}
          <View className="bg-background rounded-lg border border-border px-3 py-2 flex-row items-center">
            <Text className="text-lg mr-2">🔍</Text>
            <TextInput
              placeholder="Search city, country, or coordinates..."
              placeholderTextColor="#687076"
              value={searchQuery}
              onChangeText={handleSearch}
              className="flex-1 text-foreground py-2 text-base"
              autoFocus
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => {
                  setSearchQuery('');
                  setResults([]);
                }}
                className="px-2"
              >
                <Text className="text-lg">✕</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Results or Empty State */}
        <View className="flex-1">
          {loading && (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator size="large" color="#0a7ea4" />
              <Text className="text-muted mt-3">Searching locations...</Text>
            </View>
          )}

          {error && (
            <View className="flex-1 items-center justify-center px-4">
              <Text className="text-error text-center">{error}</Text>
              <TouchableOpacity
                onPress={() => setError(null)}
                className="mt-4 px-4 py-2 bg-error/10 rounded-lg"
              >
                <Text className="text-error font-semibold">Dismiss</Text>
              </TouchableOpacity>
            </View>
          )}

          {!loading && !error && results.length === 0 && searchQuery.length > 0 && (
            <View className="flex-1 items-center justify-center px-4">
              <Text className="text-2xl mb-2">🌍</Text>
              <Text className="text-foreground font-semibold text-center">
                No locations found
              </Text>
              <Text className="text-muted text-center mt-2">
                Try searching for a city name or country
              </Text>
            </View>
          )}

          {!loading && !error && results.length === 0 && searchQuery.length === 0 && (
            <View className="flex-1 items-center justify-center px-4">
              <Text className="text-3xl mb-3">📍</Text>
              <Text className="text-foreground font-semibold text-center text-lg">
                Search for a location
              </Text>
              <Text className="text-muted text-center mt-2">
                Enter a city name, state, or country to find weather data for that location
              </Text>
            </View>
          )}

          {!loading && !error && results.length > 0 && (
            <FlatList
              data={results}
              renderItem={renderLocationItem}
              keyExtractor={(item, index) =>
                `${item.latitude}-${item.longitude}-${index}`
              }
              scrollEnabled
              contentContainerStyle={{ flexGrow: 1 }}
            />
          )}
        </View>

        {/* Info Footer */}
        <View className="bg-surface border-t border-border px-4 py-3">
          <Text className="text-xs text-muted text-center">
            💡 Powered by OpenWeatherMap Geocoding API
          </Text>
        </View>
      </View>
    </Modal>
  );
}
