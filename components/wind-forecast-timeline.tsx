import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useState, useEffect } from 'react';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';
import { ForecastData, ForecastHour, TimelineSelection } from '@/types/forecast';
import { formatWindSpeed } from '@/lib/weather-utils';
import { getWindSpeedColor } from '@/lib/wind-particle-system';

interface WindForecastTimelineProps {
  forecast: ForecastData | null;
  loading: boolean;
  selectedHour: TimelineSelection | null;
  onHourSelect: (selection: TimelineSelection) => void;
  safeThreshold: number;
  cautionThreshold: number;
  windUnit: 'mph' | 'kph';
}

export function WindForecastTimeline({
  forecast,
  loading,
  selectedHour,
  onHourSelect,
  safeThreshold,
  cautionThreshold,
  windUnit,
}: WindForecastTimelineProps) {
  const screenWidth = Dimensions.get('window').width;
  const chartHeight = 150;
  const maxWindSpeed = forecast
    ? Math.max(...forecast.hourly.map((h) => h.windSpeed)) * 1.2
    : 40;

  if (loading) {
    return (
      <View className="bg-surface rounded-2xl p-4 border border-border items-center justify-center h-40">
        <ActivityIndicator size="small" color="#0a7ea4" />
        <Text className="text-muted text-sm mt-2">Loading forecast...</Text>
      </View>
    );
  }

  if (!forecast || forecast.hourly.length === 0) {
    return (
      <View className="bg-surface rounded-2xl p-4 border border-border items-center justify-center h-40">
        <Text className="text-muted text-center">No forecast data available</Text>
      </View>
    );
  }

  return (
    <View className="gap-3">
      {/* Chart */}
      <View className="bg-surface rounded-2xl p-4 border border-border overflow-hidden">
        <View className="h-40 bg-background rounded-lg">
          <WindSpeedChart
            hourly={forecast.hourly}
            maxWindSpeed={maxWindSpeed}
            selectedIndex={selectedHour?.hourIndex ?? 0}
            safeThreshold={safeThreshold}
            cautionThreshold={cautionThreshold}
          />
        </View>
      </View>

      {/* Timeline Scrubber */}
      <View className="bg-surface rounded-2xl p-3 border border-border">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingHorizontal: 4 }}
        >
          {forecast.hourly.map((hour, index) => (
            <TimelineHourButton
              key={`${hour.timestamp}-${index}`}
              hour={hour}
              index={index}
              isSelected={selectedHour?.hourIndex === index}
              windSpeed={hour.windSpeed}
              safeThreshold={safeThreshold}
              cautionThreshold={cautionThreshold}
              windUnit={windUnit}
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                onHourSelect({
                  hourIndex: index,
                  timestamp: hour.timestamp,
                  data: hour,
                });
              }}
            />
          ))}
        </ScrollView>
      </View>

      {/* Selected Hour Details */}
      {selectedHour && (
        <View className="bg-surface rounded-2xl p-4 border border-border gap-3">
          <View className="flex-row justify-between items-start">
            <View>
              <Text className="text-sm text-muted">Selected Time</Text>
              <Text className="text-lg font-bold text-foreground mt-1">
                {selectedHour.data.time}
              </Text>
            </View>
            <View className="items-end">
              <Text className="text-sm text-muted">Wind Speed</Text>
              <Text
                className="text-lg font-bold mt-1"
                style={{
                  color: getWindSpeedColor(
                    selectedHour.data.windSpeed,
                    safeThreshold,
                    cautionThreshold
                  ),
                }}
              >
                {formatWindSpeed(selectedHour.data.windSpeed, windUnit)}
              </Text>
            </View>
          </View>

          {/* Detailed Info Grid */}
          <View className="gap-2">
            <View className="flex-row gap-2">
              <DetailCard
                label="Gust"
                value={`${formatWindSpeed(selectedHour.data.windGust, windUnit)}`}
                unit={windUnit}
              />
              <DetailCard
                label="Direction"
                value={`${Math.round(selectedHour.data.windDirection)}°`}
              />
              <DetailCard
                label="Temp"
                value={`${Math.round(selectedHour.data.temperature)}°`}
              />
            </View>
            <View className="flex-row gap-2">
              <DetailCard
                label="Humidity"
                value={`${selectedHour.data.humidity}%`}
              />
              <DetailCard
                label="Pressure"
                value={`${Math.round(selectedHour.data.pressure)}`}
                unit="mb"
              />
              <DetailCard
                label="Clouds"
                value={`${selectedHour.data.cloudCover}%`}
              />
            </View>
          </View>

          {/* Flight Safety Indicator */}
          <FlightSafetyIndicator
            windSpeed={selectedHour.data.windSpeed}
            safeThreshold={safeThreshold}
            cautionThreshold={cautionThreshold}
          />
        </View>
      )}

      {/* Peak Wind Warning */}
      {forecast && (
        <PeakWindAlert forecast={forecast} windUnit={windUnit} />
      )}
    </View>
  );
}

interface TimelineHourButtonProps {
  hour: ForecastHour;
  index: number;
  isSelected: boolean;
  windSpeed: number;
  safeThreshold: number;
  cautionThreshold: number;
  windUnit: 'mph' | 'kph';
  onPress: () => void;
}

function TimelineHourButton({
  hour,
  isSelected,
  windSpeed,
  safeThreshold,
  cautionThreshold,
  windUnit,
  onPress,
}: TimelineHourButtonProps) {
  const getStatus = (speed: number) => {
    if (speed <= safeThreshold) return 'safe';
    if (speed <= cautionThreshold) return 'caution';
    return 'unsafe';
  };

  const status = getStatus(windSpeed);
  const statusColor =
    status === 'safe'
      ? '#22c55e'
      : status === 'caution'
        ? '#f59e0b'
        : '#ef4444';

  return (
    <TouchableOpacity
      onPress={onPress}
      className={`px-3 py-2 rounded-lg border-2 ${
        isSelected ? 'bg-primary/10 border-primary' : 'bg-background border-border'
      }`}
    >
      <Text className="text-xs text-muted text-center">{hour.time}</Text>
      <Text
        className="text-sm font-bold text-center mt-1"
        style={{ color: statusColor }}
      >
        {formatWindSpeed(windSpeed, windUnit)}
      </Text>
      <View
        className="w-1 h-1 rounded-full self-center mt-1"
        style={{ backgroundColor: statusColor }}
      />
    </TouchableOpacity>
  );
}

interface DetailCardProps {
  label: string;
  value: string;
  unit?: string;
}

function DetailCard({ label, value, unit }: DetailCardProps) {
  return (
    <View className="flex-1 bg-background rounded-lg p-2 items-center">
      <Text className="text-xs text-muted">{label}</Text>
      <Text className="text-sm font-semibold text-foreground mt-1">
        {value}
        {unit && <Text className="text-xs ml-1">{unit}</Text>}
      </Text>
    </View>
  );
}

interface FlightSafetyIndicatorProps {
  windSpeed: number;
  safeThreshold: number;
  cautionThreshold: number;
}

function FlightSafetyIndicator({
  windSpeed,
  safeThreshold,
  cautionThreshold,
}: FlightSafetyIndicatorProps) {
  let status: string;
  let color: string;
  let emoji: string;

  if (windSpeed <= safeThreshold) {
    status = 'Safe to Fly';
    color = '#22c55e';
    emoji = '✅';
  } else if (windSpeed <= cautionThreshold) {
    status = 'Caution';
    color = '#f59e0b';
    emoji = '⚠️';
  } else {
    status = 'Unsafe to Fly';
    color = '#ef4444';
    emoji = '❌';
  }

  return (
    <View
      className="rounded-lg p-3 items-center justify-center"
      style={{ backgroundColor: `${color}20`, borderColor: color, borderWidth: 1 }}
    >
      <Text className="text-2xl mb-1">{emoji}</Text>
      <Text className="font-semibold" style={{ color }}>
        {status}
      </Text>
    </View>
  );
}

interface WindSpeedChartProps {
  hourly: ForecastHour[];
  maxWindSpeed: number;
  selectedIndex: number;
  safeThreshold: number;
  cautionThreshold: number;
}

function WindSpeedChart({
  hourly,
  maxWindSpeed,
  selectedIndex,
  safeThreshold,
  cautionThreshold,
}: WindSpeedChartProps) {
  const width = Dimensions.get('window').width - 48; // Account for padding
  const height = 140;
  const barWidth = width / hourly.length;

  return (
    <View className="flex-1 flex-row items-flex-end justify-between px-2 py-2">
      {hourly.map((hour, index) => {
        const barHeight = (hour.windSpeed / maxWindSpeed) * height;
        const isSelected = index === selectedIndex;
        const color = getWindSpeedColor(
          hour.windSpeed,
          safeThreshold,
          cautionThreshold
        );

        return (
          <View
            key={`bar-${index}`}
            className="items-center"
            style={{ width: barWidth }}
          >
            <View
              className={`rounded-t ${isSelected ? 'border-2 border-primary' : ''}`}
              style={{
                width: barWidth - 4,
                height: barHeight,
                backgroundColor: color,
                opacity: isSelected ? 1 : 0.7,
              }}
            />
          </View>
        );
      })}
    </View>
  );
}

interface PeakWindAlertProps {
  forecast: ForecastData;
  windUnit: 'mph' | 'kph';
}

function PeakWindAlert({ forecast, windUnit }: PeakWindAlertProps) {
  const peakHour = forecast.hourly.reduce((max, hour) =>
    hour.windSpeed > max.windSpeed ? hour : max
  );

  return (
    <View className="bg-warning/10 rounded-2xl p-3 border border-warning/30">
      <Text className="text-xs font-semibold text-warning mb-1">📊 Peak Wind Alert</Text>
      <Text className="text-sm text-warning">
        Highest winds expected at {peakHour.time} with{' '}
        <Text className="font-bold">{formatWindSpeed(peakHour.windSpeed, windUnit)}</Text>
      </Text>
    </View>
  );
}
