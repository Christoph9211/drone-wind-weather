import { View, Text, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { useState } from 'react';
import * as Haptics from 'expo-haptics';
import {
  calculateWindAtAltitude,
  analyzeAltitudeWindConditions,
  findMaxSafeAltitude,
  AltitudeWindData,
} from '@/lib/altitude-wind-calculator';
import { UserSettings } from '@/types/weather';
import { mphToKph } from '@/lib/weather-utils';

interface AltitudeWindCardProps {
  groundWindSpeed: number;
  settings: UserSettings;
}

export function AltitudeWindCard({ groundWindSpeed, settings }: AltitudeWindCardProps) {
  // Common drone altitude presets
  const altitudePresets = [
    { label: '25ft', value: 25, description: 'Low flight' },
    { label: '50ft', value: 50, description: 'Standard' },
    { label: '100ft', value: 100, description: 'Medium' },
    { label: '150ft', value: 150, description: 'High' },
    { label: '200ft', value: 200, description: 'Very High' },
    { label: '300ft', value: 300, description: 'Max (Part 107)' },
    { label: '400ft', value: 400, description: 'Extreme' },
  ];

  const [selectedAltitude, setSelectedAltitude] = useState(100);

  const maxSafeAltitude = findMaxSafeAltitude(
    groundWindSpeed,
    settings.thresholds.safe,
    'suburban'
  );

  const analysis = analyzeAltitudeWindConditions(
    groundWindSpeed,
    selectedAltitude,
    settings.thresholds,
    'suburban'
  );

  const displayWindSpeed = settings.units.wind === 'kph' 
    ? mphToKph(analysis.windSpeed)
    : analysis.windSpeed;

  const handleAltitudeSelect = (altitude: number) => {
    setSelectedAltitude(altitude);
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const getSafetyColor = (safety: 'safe' | 'caution' | 'unsafe'): string => {
    switch (safety) {
      case 'safe':
        return '#22C55E';
      case 'caution':
        return '#F59E0B';
      case 'unsafe':
        return '#EF4444';
    }
  };

  return (
    <View className="bg-surface rounded-2xl p-4 border border-border">
      {/* Header */}
      <View className="mb-4">
        <Text className="text-lg font-semibold text-foreground">Wind at Altitude</Text>
        <Text className="text-sm text-muted mt-1">
          Wind speed increases with height above ground
        </Text>
      </View>

      {/* Current Altitude Display */}
      <View className="bg-background rounded-xl p-4 mb-4 border border-border">
        <View className="flex-row justify-between items-start mb-3">
          <View>
            <Text className="text-sm text-muted mb-1">Selected Altitude</Text>
            <Text className="text-3xl font-bold text-foreground">{selectedAltitude}</Text>
            <Text className="text-sm text-muted">feet AGL</Text>
          </View>
          <View
            className="px-3 py-2 rounded-lg"
            style={{ backgroundColor: getSafetyColor(analysis.flightSafety) }}
          >
            <Text className="text-white font-bold text-sm">
              {analysis.flightSafety.toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Wind Speed at Altitude */}
        <View className="border-t border-border pt-3">
          <View className="flex-row justify-between items-center mb-2">
            <Text className="text-sm text-muted">Wind Speed at {selectedAltitude}ft</Text>
            <Text className="text-2xl font-bold" style={{ color: getSafetyColor(analysis.flightSafety) }}>
              {displayWindSpeed} {settings.units.wind}
            </Text>
          </View>

          {/* Wind Increase Info */}
          <View className="flex-row justify-between items-center">
            <Text className="text-xs text-muted">
              +{analysis.windIncrease.toFixed(1)} {settings.units.wind} from ground
            </Text>
            <Text className="text-xs text-muted">
              ({analysis.percentageIncrease.toFixed(0)}% increase)
            </Text>
          </View>
        </View>
      </View>

      {/* Recommendation */}
      <View className="bg-background rounded-lg p-3 mb-4 border border-border">
        <Text className="text-sm text-foreground">{analysis.recommendation}</Text>
      </View>

      {/* Max Safe Altitude Info */}
      {maxSafeAltitude > 0 && (
        <View className="bg-success/10 rounded-lg p-3 mb-4 border border-success/30 flex-row items-center">
          <Text className="text-lg mr-2">📍</Text>
          <View className="flex-1">
            <Text className="text-sm text-foreground font-semibold">
              Max Safe Altitude: {maxSafeAltitude}ft
            </Text>
            <Text className="text-xs text-muted mt-0.5">
              Highest altitude with safe wind conditions
            </Text>
          </View>
        </View>
      )}

      {/* Altitude Presets */}
      <View>
        <Text className="text-sm font-semibold text-foreground mb-2">Quick Presets</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row gap-2">
            {altitudePresets.map((preset) => {
              const presetAnalysis = analyzeAltitudeWindConditions(
                groundWindSpeed,
                preset.value,
                settings.thresholds,
                'suburban'
              );

              const isSelected = selectedAltitude === preset.value;
              const safetyColor = getSafetyColor(presetAnalysis.flightSafety);

              return (
                <TouchableOpacity
                  key={preset.value}
                  onPress={() => handleAltitudeSelect(preset.value)}
                  className={`rounded-lg p-3 border ${
                    isSelected
                      ? 'bg-primary border-primary'
                      : 'bg-background border-border'
                  }`}
                  style={{ minWidth: 75 }}
                >
                  <Text
                    className={`text-sm font-bold text-center ${
                      isSelected ? 'text-white' : 'text-foreground'
                    }`}
                  >
                    {preset.label}
                  </Text>
                  <View
                    className="w-2 h-2 rounded-full mx-auto mt-1"
                    style={{ backgroundColor: isSelected ? 'white' : safetyColor }}
                  />
                  <Text
                    className={`text-xs text-center mt-1 ${
                      isSelected ? 'text-white/80' : 'text-muted'
                    }`}
                  >
                    {presetAnalysis.windSpeed.toFixed(0)} {settings.units.wind}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </View>

      {/* Information Note */}
      <View className="mt-4 pt-4 border-t border-border">
        <Text className="text-xs text-muted leading-relaxed">
          💡 Wind speed increases with altitude due to reduced surface friction. This uses the
          power law model, a standard meteorological approach. Actual conditions depend on terrain,
          weather systems, and time of day.
        </Text>
      </View>
    </View>
  );
}
