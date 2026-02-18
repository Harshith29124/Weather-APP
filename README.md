# 🌤️ Atmos Weather — 2026 Standard

![Atmos Dashboard](https://raw.githubusercontent.com/Harshith29124/Weather-APP/main/public/logo512.png)

Atmos is a production-level, ultra-modern weather application designed with 2026 aesthetics. It features a stunning **Aurora UI**, deep **Glassmorphism**, and high-precision data from Open-Meteo.

## ✨ Elite Features

- **🌈 Dynamic Aurora Background**: 4 drift-animated gradient orbs that react to the time of day and theme.
- **💎 Glassmorphism 2.0**: Sophisticated layered transparency with `backdrop-filter: blur(20px)` and subtle inner glows.
- **📍 Smart Geolocation**: One-tap "My Location" support using browser GPS for hyper-local forecasts.
- **🕒 Live Real-Time Clock**: High-precision clock with second-level updates and adaptive date formatting.
- **📊 Interactive Data Visualization**: Beautiful temperature and wave height trends powered by **Recharts**.
- **🧭 Sun Position Tracking**: Live SVG-based celestial arc showing sunrise, sunset, and current sun position.
- **🌊 Marine Forecasting**: Comprehensive wave heights, swell, period, and wind wave data for coastal locations.
- **⏳ Historical Analysis**: Access past weather data with hourly granularity for the last 7 days.
- **🌓 Adaptive Theming**: Seamless transition between "Midnight Navy" dark mode and "Crystal Blue" light mode.

## 🚀 Tech Stack

- **Framework**: React 18
- **Animations**: Framer Motion
- **Data Visualization**: Recharts
- **Icons**: Lucide React
- **Time/Date**: date-fns
- **Networking**: Axios
- **API**: Open-Meteo (High-availability, free, no-key required)
- **Styling**: Vanilla CSS with modern flex/grid and custom design tokens

## 🛠️ Quick Start

### 1. Build the Foundation
Clone the repository and install the production dependencies:

```bash
git clone https://github.com/Harshith29124/Weather-APP.git
cd Weather-APP
npm install
```

### 2. Launch the Experience
Start the development server:

```bash
npm start
```

The application will launch at `http://localhost:3000`.

## 🛰️ API System

Atmos integrates three specialized Open-Meteo endpoints for absolute reliability:

1. **Geocoding Engine**: `https://geocoding-api.open-meteo.com` (Sub-300ms search responses)
2. **Forecast Engine**: `https://api.open-meteo.com` (Current, Hourly, Daily & Historical)
3. **Marine Engine**: `https://marine-api.open-meteo.com` (Oceanic metrics & Wave physics)

## 🎨 Design Philosophy

- **Consistency First**: Hardcoded white text on all hero cards to ensure legibility against deep gradients.
- **Accessibility**: High-contrast ratios and semantic HTML for screen readers.
- **Performance**: Memoized components and hardware-accelerated CSS animations.
- **Responsive**: Fully optimized for everything from ultra-wide monitors to 360px mobile devices.

## 📂 Project Structure

```text
Weather-APP/
├── public/          # HTML5 Template & Static Assets
├── src/
│   ├── App.js       # Core Application Logic & Sub-components
│   ├── App.css      # 2026 Design System & Tokens
│   ├── index.js     # Entry point
│   └── index.css    # Global Reset & Typography
└── package.json     # Orchestration & Dependencies
```

## 📜 License

MIT © 2026 Atmos Team. Built for excellence.

---
Built with ❤️ by [Harshith](https://github.com/Harshith29124)
