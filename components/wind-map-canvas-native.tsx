import { View, Text } from 'react-native';
import { Particle } from '@/lib/wind-particle-system';

interface WindMapCanvasNativeProps {
  particles: Particle[];
  windSpeed: number;
  windDirection: number;
  windCategory: 'safe' | 'caution' | 'unsafe';
}

/**
 * Native wind map canvas component
 * For native platforms, we use react-native-skia or similar
 * For now, this is a placeholder that shows particle count
 */
export function WindMapCanvasNative({
  particles,
  windSpeed,
  windDirection,
  windCategory,
}: WindMapCanvasNativeProps) {
  return (
    <View className="flex-1 bg-background items-center justify-center">
      <Text className="text-muted text-center">
        Wind Map Visualization
      </Text>
      <Text className="text-foreground text-lg font-semibold mt-2">
        {particles.length} particles
      </Text>
      <Text className="text-muted text-sm mt-1">
        {windSpeed} mph @ {Math.round(windDirection)}°
      </Text>
    </View>
  );
}
