# DroneWind - Weather App for Drone Flyers

A cross-platform mobile weather application specifically engineered for drone pilots. It provides critical, real-time wind data, flight condition assessments, and advanced wind-at-altitude calculations to ensure informed and safe flying decisions.

## Key Features

DroneWind goes beyond standard weather apps by focusing on the unique needs of drone operation:

### 🌬️ Real-Time Flight Condition Assessment
- **Large Wind Speed Display**: Current wind speeds are displayed prominently with a dynamic, color-coded indicator.
- **Automatic Safety Status**: Provides an instant assessment of flying conditions (Safe, Caution, or Unsafe) based on user-defined wind speed thresholds.
- **Wind Direction Compass**: A visual compass shows the exact wind direction in degrees and cardinal points.
- **Wind Gust Tracking**: Monitors wind gusts to help pilots anticipate sudden and dangerous changes in air movement.

### 🗺️ Interactive Wind Map Visualization
A dedicated **Wind Map** tab provides a visual, animated representation of current wind conditions:
- **Particle System**: Uses a particle animation system to visually simulate the speed and direction of the wind flow.
- **Dynamic Coloring**: The map's visual elements are color-coded to instantly reflect the safety status (Green, Amber, Red) based on your custom thresholds.
- **Toggleable Details**: Allows the user to switch between a detailed data overlay and a clean, full-screen visualization.

### 📈 Wind at Altitude Calculation
A crucial tool for high-altitude drone operations:
- **Power Law Model**: Estimates wind speed at various altitudes above ground level (AGL) using the meteorological Power Law Model, accounting for surface friction.
- **Max Safe Altitude**: Calculates and recommends the highest altitude at which wind conditions remain within the user's "Safe" threshold.
- **Altitude Presets**: Quick-check presets (e.g., 50ft, 100ft, 400ft) provide instant safety analysis for common flying heights.

### ⚙️ Customization and Location
- **Unit Preferences**: Easily switch between MPH/KPH for wind speed and °F/°C for temperature.
- **Custom Thresholds**: Pilots can set their own wind speed limits for Safe, Caution, and Unsafe conditions to match their drone's specifications and personal experience level.
- **Location Services**: Supports automatic location detection and manual location search via geocoding.

## Tech Stack

DroneWind is built as a modern, cross-platform application using a robust and scalable technology stack:

| Category | Technology | Purpose |
| :--- | :--- | :--- |
| **Framework** | React Native (Expo SDK 54) | Cross-platform mobile and web development |
| **Language** | TypeScript | Type safety and improved developer experience |
| **Styling** | NativeWind (Tailwind CSS) | Utility-first styling for rapid UI development |
| **Navigation** | Expo Router | File-system based routing for seamless navigation |
| **State/Data** | React Query (TanStack) | Data fetching, caching, and state management |
| **Data Source** | OpenWeatherMap API | Primary source for real-time weather data |
| **Visualization** | React Native Canvas | Custom particle system for wind map animation |

## Getting Started

Follow these steps to set up and run the project locally.

### Prerequisites

1.  **OpenWeatherMap API Key**
    *   Visit [OpenWeatherMap](https://openweathermap.org/api) and sign up for a free account.
    *   Obtain your API key from the dashboard. The free tier is sufficient for development.

2.  **Node.js and pnpm**
    *   Ensure you have Node.js (v18+) and the pnpm package manager installed.

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/Christoph9211/drone-wind-weather.git
    cd drone-wind-weather
    ```

2.  **Install dependencies:**
    ```bash
    pnpm install
    ```

3.  **Set up your API Key:**
    The application is configured to prompt for the API key on first run. Alternatively, you can set it manually:
    *   Create a file named `.env` in the project root.
    *   Add your key: `EXPO_PUBLIC_OPENWEATHER_API_KEY="YOUR_API_KEY_HERE"`

4.  **Start the development server:**
    The project uses a full-stack setup with a tRPC server and a Metro bundler for the client:
    ```bash
    pnpm dev
    ```

5.  **Open the app:**
    *   **Mobile (iOS/Android)**: Scan the QR code displayed in the terminal with the Expo Go app.
    *   **Web**: The app will open automatically in your default web browser.

## Usage Guide

### Home Screen (Weather Dashboard)

The main tab provides a summary of all critical flight data:

| Element | Description | Safety Indicator |
| :--- | :--- | :--- |
| **Wind Speed** | Current speed and unit (MPH/KPH) | Color-coded (Green, Amber, Red) |
| **Flight Status** | Overall assessment of flying conditions | Text label (Safe, Caution, Unsafe) |
| **Wind Direction** | Compass reading and degree value | Visual compass |
| **Hourly Forecast** | Scrollable timeline for the next 12 hours | Helps find the best flying window |

**Pro Tip**: Pull down on the screen to refresh the weather data instantly.

### Wind Map Screen

This screen visualizes the wind:

*   **Particle Flow**: Observe the speed and direction of the wind through the movement of animated particles. Faster movement indicates higher wind speed.
*   **Safety Zones**: The color of the particles and the map overlay correspond to the safety thresholds you have set.

### Settings Screen

This is where you tailor the app to your needs:

| Setting | Description | Default Values |
| :--- | :--- | :--- |
| **Units** | Toggle between Imperial (MPH, °F) and Metric (KPH, °C) | MPH and °F |
| **Safe Threshold** | Maximum wind speed for **Safe** flying | 15 MPH (24 KPH) |
| **Caution Threshold** | Maximum wind speed for **Caution** flying | 25 MPH (40 KPH) |

**Note**: Any wind speed above the **Caution Threshold** is automatically considered **Unsafe**.

## Project Structure Highlights

| Path | Description |
| :--- | :--- |
| `app/(tabs)/index.tsx` | Main Weather Dashboard screen. |
| `app/(tabs)/wind-map.tsx` | Interactive Wind Map visualization screen. |
| `app/(tabs)/settings.tsx` | User settings and threshold configuration. |
| `components/altitude-wind-card.tsx` | Component for the Wind at Altitude calculation and display. |
| `lib/wind-particle-system.ts` | Core logic for the animated wind particle visualization. |
| `lib/altitude-wind-calculator.ts` | Implementation of the Power Law Model for wind-at-altitude estimation. |
| `services/weather.ts` | Service layer for fetching and processing OpenWeatherMap data. |
| `server/` | Full-stack tRPC server setup (currently focused on client-side data fetching). |

## Default Wind Speed Thresholds

The app uses the following sensible defaults, which can be adjusted in the Settings:

| Status | Wind Speed (MPH) | Wind Speed (KPH) | Recommendation |
| :--- | :--- | :--- | :--- |
| **Safe** | 0 - 15 mph | 0 - 24 kph | Ideal conditions for most drones and pilots. |
| **Caution** | 15 - 25 mph | 24 - 40 kph | Experienced pilots only; smaller or lighter drones may struggle. |
| **Unsafe** | 25+ mph | 40+ kph | Not recommended for recreational or commercial flying. |

## Privacy & Data

*   **Local Storage**: All user preferences and settings are stored locally on your device using AsyncStorage.
*   **No User Accounts**: The app does not require any sign-up or login.
*   **Location**: Location permissions are optional and only used to fetch weather data for your current position. No location data is collected or transmitted externally.

## Contributing

We welcome contributions from the community! If you have suggestions for new features, bug fixes, or improvements, please feel free to open an issue or submit a pull request.

## License

This project is licensed under the **MIT License**.

## Acknowledgments

- Weather data provided by [OpenWeatherMap](https://openweathermap.org/).
- Built with [Expo](https://expo.dev/) and [React Native](https://reactnative.dev/).

---

**Fly Safe! 🚁**

*Disclaimer: This application is a tool to assist your decision-making. Always check local regulations, perform pre-flight checks, and use your best judgment before operating a drone.*
