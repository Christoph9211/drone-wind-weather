# DroneWind - Weather App for Drone Flyers

A mobile weather app specifically designed for drone pilots, featuring detailed wind speed information, flight condition assessments, and location-based weather data to help make informed flying decisions.

## Features

### 🌬️ Wind-Focused Weather Data
- **Large Wind Speed Display**: See current wind speeds at a glance with color-coded indicators
- **Flight Condition Status**: Automatic assessment of flying conditions (Safe/Caution/Unsafe)
- **Wind Direction Compass**: Visual compass showing wind direction with degree measurements
- **Wind Gust Information**: Track wind gusts to anticipate sudden changes

### 📊 Comprehensive Weather Details
- Current temperature, humidity, and pressure
- Hourly forecast for the next 12 hours
- Sunrise and sunset times
- Weather conditions and descriptions

### ⚙️ Customizable Settings
- **Unit Preferences**: Switch between MPH/KPH for wind speed and °F/°C for temperature
- **Custom Thresholds**: Set your own wind speed limits for safe, caution, and unsafe conditions
- **Persistent Settings**: All preferences saved locally for quick access

### 📍 Location Features
- Automatic location detection (with permission)
- Manual location search
- Cached weather data for offline viewing
- Pull-to-refresh for instant updates

## Tech Stack

- **Framework**: React Native with Expo SDK 54
- **Language**: TypeScript
- **Styling**: NativeWind (Tailwind CSS for React Native)
- **Navigation**: Expo Router with tab navigation
- **Data Storage**: AsyncStorage for local persistence
- **Weather API**: OpenWeatherMap API
- **Location**: Expo Location for GPS and permissions

## Getting Started

### Prerequisites

1. **OpenWeatherMap API Key**
   - Visit [OpenWeatherMap](https://openweathermap.org/api)
   - Sign up for a free account
   - Get your API key from the dashboard
   - The free tier includes 1,000 API calls per day

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Set up your API key:
   - The app will prompt you to enter your OpenWeatherMap API key
   - Or set it manually in the environment variables as `EXPO_PUBLIC_OPENWEATHER_API_KEY`

4. Start the development server:
   ```bash
   pnpm dev
   ```

5. Open the app:
   - **iOS**: Scan the QR code with the Camera app, then open in Expo Go
   - **Android**: Scan the QR code with the Expo Go app
   - **Web**: The app will open automatically in your browser

## Usage

### Home Screen (Weather Dashboard)

The main screen displays all essential weather information for drone flying:

1. **Wind Speed**: Large, color-coded display showing current wind speed
   - Green: Safe to fly (default: 0-15 mph)
   - Amber: Caution advised (default: 15-25 mph)
   - Red: Unsafe conditions (default: 25+ mph)

2. **Current Conditions**: Temperature, humidity, pressure, and wind gusts

3. **Wind Direction**: Visual compass showing wind direction

4. **Hourly Forecast**: Scroll through the next 12 hours to find the best flying window

5. **Sun Times**: Sunrise and sunset times for planning your flights

**Pull down to refresh** weather data at any time.

### Settings Screen

Customize the app to your preferences:

1. **Units**: Toggle between MPH/KPH and °F/°C
2. **Flight Thresholds**: Adjust wind speed limits for safe, caution, and unsafe conditions
3. **About**: View app version and data source information

All settings are saved automatically and persist between app sessions.

## Default Wind Speed Thresholds

The app comes with sensible defaults based on common drone flying guidelines:

- **Safe**: 0-15 mph (0-24 kph) - Ideal conditions for most drones
- **Caution**: 15-25 mph (24-40 kph) - Experienced pilots only, smaller drones may struggle
- **Unsafe**: 25+ mph (40+ kph) - Not recommended for recreational flying

You can adjust these thresholds in the Settings screen to match your drone's capabilities and your experience level.

## Project Structure

```
app/
  (tabs)/
    index.tsx        ← Home screen (Weather Dashboard)
    settings.tsx     ← Settings screen
services/
  weather.ts         ← Weather API service
types/
  weather.ts         ← TypeScript types for weather data
lib/
  weather-utils.ts   ← Utility functions for weather calculations
  settings-provider.tsx ← Settings context and state management
components/
  screen-container.tsx ← SafeArea wrapper component
  ui/
    icon-symbol.tsx  ← Icon mappings for tab bar
```

## API Usage

The app uses the OpenWeatherMap API to fetch:
- Current weather conditions
- 5-day forecast (displaying next 12 hours)
- Geocoding for location search

**Free tier limits**: 1,000 calls per day (more than sufficient for personal use)

## Privacy & Data

- **No user accounts required**: All data is stored locally on your device
- **Location permissions**: Optional, but recommended for automatic weather updates
- **No data collection**: Your location and preferences never leave your device
- **Offline support**: Cached weather data available when offline

## Contributing

This app was built with drone pilots in mind. If you have suggestions for improvements or additional features, feel free to contribute!

## License

MIT License - feel free to use and modify for your own projects.

## Acknowledgments

- Weather data provided by [OpenWeatherMap](https://openweathermap.org/)
- Built with [Expo](https://expo.dev/) and [React Native](https://reactnative.dev/)
- Icons from [Material Icons](https://fonts.google.com/icons)

---

**Happy Flying! 🚁**

Remember: Always check local regulations and weather conditions before flying your drone. This app is a tool to assist your decision-making, but you are responsible for safe flying practices.
