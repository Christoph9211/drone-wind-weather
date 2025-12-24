# DroneWind - Mobile App Design

## Design Philosophy

This app is designed for **drone pilots** who need quick, at-a-glance wind speed information to make safe flying decisions. The interface follows **Apple Human Interface Guidelines** and feels like a first-party iOS app, optimized for **mobile portrait orientation (9:16)** and **one-handed usage**.

## Color Palette

- **Primary**: `#0a7ea4` (Sky blue - represents clear flying conditions)
- **Success**: `#22C55E` (Green - safe to fly)
- **Warning**: `#F59E0B` (Amber - caution advised)
- **Error**: `#EF4444` (Red - unsafe conditions)
- **Background**: Light `#ffffff` / Dark `#151718`
- **Surface**: Light `#f5f5f5` / Dark `#1e2022`
- **Foreground**: Light `#11181C` / Dark `#ECEDEE`

## Screen List

### 1. Home Screen (Weather Dashboard)
**Primary Content:**
- Current location name
- Large wind speed display (mph/kph) with animated icon
- Flight condition status badge (Safe / Caution / Unsafe)
- Current weather conditions (temperature, humidity, pressure)
- Wind gust information
- Wind direction compass
- Hourly forecast cards (next 12 hours)
- Sunrise/sunset times

**Functionality:**
- Pull-to-refresh to update weather data
- Tap location to change/search locations
- Tap hourly cards to see detailed forecast
- Color-coded wind speed indicators

### 2. Settings Screen
**Primary Content:**
- Unit preferences (mph/kph, °F/°C)
- Wind speed thresholds for flight conditions:
  - Safe: 0-15 mph (default)
  - Caution: 15-25 mph (default)
  - Unsafe: 25+ mph (default)
- Location settings (auto-detect or manual)
- Theme toggle (light/dark/auto)
- About section

**Functionality:**
- Adjust wind thresholds with sliders
- Toggle units
- Save preferences to AsyncStorage

## Key User Flows

### Flow 1: Check Current Conditions
1. User opens app → Home screen loads
2. App fetches current location (if permission granted)
3. Weather data loads from API
4. Large wind speed display shows current conditions
5. Flight status badge indicates if safe to fly

### Flow 2: View Hourly Forecast
1. User scrolls down on Home screen
2. Horizontal scrollable list shows next 12 hours
3. Each card shows: time, wind speed, wind direction, weather icon
4. User can quickly scan for safe flying windows

### Flow 3: Adjust Safety Thresholds
1. User taps Settings tab
2. User adjusts wind speed sliders
3. Thresholds update immediately
4. User returns to Home → status badge reflects new thresholds

### Flow 4: Change Location
1. User taps location name on Home screen
2. Search modal appears
3. User types city name or uses current location
4. Weather data refreshes for new location

## Layout Specifications

### Home Screen Layout
```
┌─────────────────────────┐
│  [Location Name]   [⚙️] │ ← Header with settings icon
├─────────────────────────┤
│                         │
│    🌬️ 12 MPH          │ ← Large wind speed (48pt)
│    [SAFE TO FLY]       │ ← Status badge (green/amber/red)
│                         │
│  ┌─────────────────┐   │
│  │ Temp: 72°F      │   │ ← Weather details card
│  │ Humidity: 65%   │   │
│  │ Pressure: 30.1  │   │
│  │ Gusts: 18 mph   │   │
│  └─────────────────┘   │
│                         │
│  ┌─────────────────┐   │
│  │   Wind Direction│   │ ← Compass showing wind direction
│  │       ↗️ NE     │   │
│  └─────────────────┘   │
│                         │
│  Hourly Forecast        │ ← Section header
│  ┌───┬───┬───┬───┐    │
│  │2PM│3PM│4PM│5PM│    │ ← Horizontal scroll
│  │15 │12 │10 │8  │    │   (wind speeds)
│  │mph│mph│mph│mph│    │
│  └───┴───┴───┴───┘    │
│                         │
│  🌅 Sunrise: 6:45 AM   │
│  🌇 Sunset: 7:30 PM    │
└─────────────────────────┘
```

### Settings Screen Layout
```
┌─────────────────────────┐
│       Settings          │ ← Header
├─────────────────────────┤
│                         │
│  Units                  │
│  ┌─────────────────┐   │
│  │ Wind: [MPH▾]    │   │
│  │ Temp: [°F▾]     │   │
│  └─────────────────┘   │
│                         │
│  Flight Thresholds      │
│  ┌─────────────────┐   │
│  │ Safe: 0-15 mph  │   │
│  │ ●────────○────  │   │ ← Slider
│  │                 │   │
│  │ Caution: 15-25  │   │
│  │ ○────────●────  │   │
│  │                 │   │
│  │ Unsafe: 25+     │   │
│  └─────────────────┘   │
│                         │
│  Appearance             │
│  ┌─────────────────┐   │
│  │ Theme: [Auto▾]  │   │
│  └─────────────────┘   │
│                         │
│  About                  │
│  ┌─────────────────┐   │
│  │ Version 1.0.0   │   │
│  └─────────────────┘   │
└─────────────────────────┘
```

## Interaction Design

### Priority Order
1. **Functionality** - All weather data loads, all settings save
2. **Feedback** - Loading states, pull-to-refresh animation
3. **Polish** - Smooth transitions, wind icon animation

### Press Feedback
- **Settings icon**: Opacity 0.7 on press
- **Location name**: Opacity 0.7 on press
- **Hourly cards**: Scale 0.97 + light haptic
- **Threshold sliders**: Medium haptic on value change

### Animations
- Wind icon: Gentle rotation/sway animation
- Status badge: Fade in when data loads
- Hourly cards: Horizontal scroll with momentum
- Pull-to-refresh: Standard iOS-style spinner

## Data Requirements

### Weather API
- Use **OpenWeatherMap API** (free tier)
- Required data points:
  - Current wind speed & direction
  - Wind gusts
  - Temperature, humidity, pressure
  - Hourly forecast (12 hours)
  - Sunrise/sunset times
  - Weather conditions (clear, cloudy, rain, etc.)

### Local Storage (AsyncStorage)
- User preferences (units, thresholds, theme)
- Last known location
- Cached weather data (for offline viewing)

## Technical Notes

- No user authentication required (local app)
- No backend database needed (AsyncStorage sufficient)
- Location permission required for auto-detect
- Weather API key needed (user will provide or use free tier)
