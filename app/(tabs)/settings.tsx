import { ScrollView, Text, View, TouchableOpacity, Platform } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useSettings } from "@/lib/settings-provider";
import { useState } from "react";
import * as Haptics from "expo-haptics";

export default function SettingsScreen() {
  const { settings, updateSettings } = useSettings();
  const [safeThreshold, setSafeThreshold] = useState(settings.thresholds.safe);
  const [cautionThreshold, setCautionThreshold] = useState(settings.thresholds.caution);

  const handleWindUnitChange = async () => {
    const newUnit = settings.units.wind === 'mph' ? 'kph' : 'mph';
    await updateSettings({
      units: { ...settings.units, wind: newUnit },
    });
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleTempUnitChange = async () => {
    const newUnit = settings.units.temp === 'fahrenheit' ? 'celsius' : 'fahrenheit';
    await updateSettings({
      units: { ...settings.units, temp: newUnit },
    });
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleThresholdChange = async (type: 'safe' | 'caution', value: number) => {
    if (type === 'safe') {
      setSafeThreshold(value);
      await updateSettings({
        thresholds: { ...settings.thresholds, safe: value },
      });
    } else {
      setCautionThreshold(value);
      await updateSettings({
        thresholds: { ...settings.thresholds, caution: value },
      });
    }
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  return (
    <ScreenContainer className="p-6">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1 gap-6">
          {/* Header */}
          <View>
            <Text className="text-3xl font-bold text-foreground">Settings</Text>
            <Text className="text-sm text-muted mt-1">Customize your drone flying preferences</Text>
          </View>

          {/* Units Section */}
          <View className="bg-surface rounded-2xl p-4 border border-border">
            <Text className="text-lg font-semibold text-foreground mb-3">Units</Text>
            
            <View className="gap-3">
              <View className="flex-row justify-between items-center">
                <Text className="text-base text-foreground">Wind Speed</Text>
                <TouchableOpacity
                  onPress={handleWindUnitChange}
                  className="bg-primary px-4 py-2 rounded-lg active:opacity-80"
                >
                  <Text className="text-white font-semibold">{settings.units.wind.toUpperCase()}</Text>
                </TouchableOpacity>
              </View>

              <View className="flex-row justify-between items-center">
                <Text className="text-base text-foreground">Temperature</Text>
                <TouchableOpacity
                  onPress={handleTempUnitChange}
                  className="bg-primary px-4 py-2 rounded-lg active:opacity-80"
                >
                  <Text className="text-white font-semibold">
                    {settings.units.temp === 'fahrenheit' ? '°F' : '°C'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Flight Thresholds Section */}
          <View className="bg-surface rounded-2xl p-4 border border-border">
            <Text className="text-lg font-semibold text-foreground mb-3">Flight Thresholds</Text>
            <Text className="text-sm text-muted mb-4">
              Set wind speed limits for safe drone flying
            </Text>

            <View className="gap-4">
              {/* Safe Threshold */}
              <View>
                <View className="flex-row justify-between items-center mb-2">
                  <Text className="text-base text-foreground">Safe (0-{safeThreshold} {settings.units.wind})</Text>
                  <View className="bg-green-500 px-3 py-1 rounded-full">
                    <Text className="text-white font-semibold text-sm">Safe</Text>
                  </View>
                </View>
                <View className="flex-row gap-2">
                  {[10, 12, 15, 18, 20].map((value) => (
                    <TouchableOpacity
                      key={value}
                      onPress={() => handleThresholdChange('safe', value)}
                      className={`flex-1 py-2 rounded-lg ${
                        safeThreshold === value ? 'bg-primary' : 'bg-background border border-border'
                      }`}
                    >
                      <Text
                        className={`text-center font-semibold ${
                          safeThreshold === value ? 'text-white' : 'text-foreground'
                        }`}
                      >
                        {value}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Caution Threshold */}
              <View>
                <View className="flex-row justify-between items-center mb-2">
                  <Text className="text-base text-foreground">
                    Caution ({safeThreshold + 1}-{cautionThreshold} {settings.units.wind})
                  </Text>
                  <View className="bg-amber-500 px-3 py-1 rounded-full">
                    <Text className="text-white font-semibold text-sm">Caution</Text>
                  </View>
                </View>
                <View className="flex-row gap-2">
                  {[20, 22, 25, 28, 30].map((value) => (
                    <TouchableOpacity
                      key={value}
                      onPress={() => handleThresholdChange('caution', value)}
                      className={`flex-1 py-2 rounded-lg ${
                        cautionThreshold === value ? 'bg-primary' : 'bg-background border border-border'
                      }`}
                    >
                      <Text
                        className={`text-center font-semibold ${
                          cautionThreshold === value ? 'text-white' : 'text-foreground'
                        }`}
                      >
                        {value}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Unsafe Info */}
              <View className="flex-row justify-between items-center">
                <Text className="text-base text-foreground">Unsafe ({cautionThreshold + 1}+ {settings.units.wind})</Text>
                <View className="bg-red-500 px-3 py-1 rounded-full">
                  <Text className="text-white font-semibold text-sm">Unsafe</Text>
                </View>
              </View>
            </View>
          </View>

          {/* About Section */}
          <View className="bg-surface rounded-2xl p-4 border border-border">
            <Text className="text-lg font-semibold text-foreground mb-3">About</Text>
            <View className="gap-2">
              <View className="flex-row justify-between">
                <Text className="text-base text-muted">Version</Text>
                <Text className="text-base text-foreground">1.0.0</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-base text-muted">Weather Data</Text>
                <Text className="text-base text-foreground">OpenWeatherMap</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
