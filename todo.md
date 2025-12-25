# DroneWind TODO

## Branding
- [x] Generate custom drone-themed app logo
- [x] Update app.config.ts with app name and logo URL

## Home Screen (Weather Dashboard)
- [x] Create weather service to fetch data from OpenWeatherMap API
- [x] Implement location detection and permission handling
- [x] Build large wind speed display component
- [x] Create flight condition status badge (Safe/Caution/Unsafe)
- [x] Display current weather details (temp, humidity, pressure, gusts)
- [x] Add wind direction compass component
- [x] Build hourly forecast horizontal scroll list
- [x] Add sunrise/sunset times display
- [x] Implement pull-to-refresh functionality
- [x] Add loading states and error handling
- [ ] Implement location search/change functionality

## Settings Screen
- [x] Create settings screen with tab navigation
- [x] Add unit preference toggles (mph/kph, °F/°C)
- [x] Build wind speed threshold sliders
- [ ] Implement theme toggle (light/dark/auto)
- [x] Save preferences to AsyncStorage
- [x] Load preferences on app start
- [x] Add about section with version info

## Data & State Management
- [x] Set up AsyncStorage for local persistence
- [x] Create types for weather data
- [x] Implement weather data caching
- [x] Add location state management
- [x] Create settings context/state

## UI Polish
- [x] Add wind icon animation
- [x] Implement color-coded wind speed indicators
- [x] Add haptic feedback to interactive elements
- [x] Style status badges with appropriate colors
- [x] Ensure responsive layout for different screen sizes
- [ ] Test dark mode appearance

## Testing & Validation
- [x] Test location permission flow
- [x] Verify weather API integration
- [x] Test offline mode with cached data
- [x] Validate threshold calculations
- [x] Test unit conversions
- [x] Verify AsyncStorage persistence

## Wind Speed at Altitude Feature
- [x] Create altitude wind calculation model using power law
- [x] Add altitude slider component (0-400 feet)
- [x] Build altitude wind speed display card
- [x] Integrate altitude feature into home screen
- [x] Add flight safety indicator for altitude
- [x] Create altitude presets for common drone types
- [x] Test altitude calculations against real-world data

## Bug Fixes
- [x] Debug altitude wind card UI visibility on home screen
- [x] Verify component rendering and styling
- [x] Test on different screen sizes

## Location Search Feature
- [x] Create location search service using geocoding API
- [x] Build location search input component
- [x] Add search results display with city/address suggestions
- [x] Implement location selection and storage
- [x] Add location history for quick access
- [x] Integrate search into home screen header
- [x] Allow toggling between GPS and manual search
- [x] Test location search with various queries
