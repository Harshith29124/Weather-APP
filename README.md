# WeatherPro X - Modern Weather Application

A modern, responsive weather application featuring comprehensive weather data including current conditions, 7-day forecasts, historical weather, and marine forecasts.

## Features

- **Current Weather**: Real-time weather conditions with detailed metrics
- **7-Day Forecast**: Extended weather predictions with hourly breakdowns
- **Historical Weather**: View past 7 days of weather data
- **Marine Weather**: Coastal and marine conditions (for applicable locations)
- **Modern UI**: Glassmorphism design with smooth animations
- **Fully Responsive**: Optimized for mobile, tablet, and desktop devices
- **Cross-Platform**: Works on all modern browsers

## Tech Stack

- React 18.3.1
- Framer Motion (animations)
- Axios (API calls)
- Lucide React (icons)
- date-fns (date formatting)
- Open-Meteo API (weather data - free, no API key required)
- CSS3 with Glassmorphism effects

## Setup Instructions

### 1. Install Dependencies

```bash
cd weather-app
npm install
```

### 2. Run the Application

```bash
npm start
```

The app will open at `http://localhost:3000`

**Note:** No API key is required! The app uses the free Open-Meteo API.

## API Information

This app uses three Open-Meteo API endpoints:

1. **Geocoding API**: `https://geocoding-api.open-meteo.com/v1/search`
   - Search for locations by name
   - Returns coordinates and location details

2. **Weather Forecast API**: `https://api.open-meteo.com/v1/forecast`
   - Current weather conditions
   - 7-day forecast
   - Historical weather data
   - Hourly predictions

3. **Marine Weather API**: `https://marine-api.open-meteo.com/v1/marine`
   - Wave height and direction
   - Wave period
   - Swell information
   - Wind waves

All APIs are free and don't require authentication.

## Usage

### Search Locations
- Click the location button or search icon
- Enter city name (e.g., "New York", "London", "Tokyo")
- Select from search results

### Navigate Tabs
- **Current**: View real-time weather conditions
- **Historical**: Check past 7 days of weather data
- **Marine**: View marine conditions (coastal areas only)

## Features Breakdown

### Current Weather
- Temperature with feels-like
- Weather condition with icon
- Wind speed and direction
- Humidity levels
- Visibility range
- Barometric pressure
- UV index
- Precipitation
- Sunrise/sunset times

### 7-Day Forecast
- Daily high/low temperatures
- Weather conditions with icons
- Precipitation probability
- Visual temperature range bars

### Historical Weather
- Past 7 days of weather data
- Hourly breakdown for selected day
- Temperature ranges
- Precipitation data

### Marine Weather
- Wave height predictions
- Wave direction and period
- Swell wave height
- Wind wave height
- 7-day marine forecast

## Design Features

### Modern UI
- Glassmorphism with backdrop blur
- Smooth animations and transitions
- Responsive hover states
- Touch-optimized for mobile
- Dark mode support (system preference)

### Responsive Breakpoints
- Desktop: 1400px max-width
- Tablet: 768px and below
- Mobile: 480px and below
- Very small screens: 375px and below

### Accessibility
- Reduced motion support
- Semantic HTML
- Keyboard navigation
- High contrast ratios
- Focus indicators

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Performance Optimizations

- Optimized animations with Framer Motion
- Efficient API calls with error handling
- CSS backdrop-filter for hardware acceleration
- Memoized computations with useMemo
- Optimized callbacks with useCallback

## Troubleshooting

### Marine Data Not Available
- Marine data only works for coastal locations
- Try searching for a coastal city (e.g., "Miami", "Sydney", "Mumbai")

### Location Not Found
- Check spelling of location name
- Try using major city names
- Use official city names in English

### App Not Loading
- Check your internet connection
- Clear browser cache
- Try a different browser

## Development

### Available Scripts

- `npm start` - Run development server
- `npm test` - Run tests
- `npm run build` - Build for production
- `npm run eject` - Eject from Create React App (not recommended)

### Project Structure

```
weather-app/
├── public/          # Static files
├── src/
│   ├── App.js       # Main application component
│   ├── App.css      # Application styles
│   ├── index.js     # Entry point
│   └── index.css    # Global styles
└── package.json     # Dependencies
```

## License

MIT License - feel free to use this project for learning and development.

## Credits

- Weather data: [Open-Meteo](https://open-meteo.com/)
- Icons: [Lucide React](https://lucide.dev/)
- Design inspiration: Modern glassmorphism UI trends

---

Built with modern web technologies and best practices.
