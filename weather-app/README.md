# WeatherPro X - 2026 iOS Liquid Glass Design

A modern, responsive weather application featuring iOS liquid glass design principles with comprehensive weather data including current conditions, 7-day forecasts, historical weather, and marine forecasts.

## Features

- **Current Weather**: Real-time weather conditions with detailed metrics
- **7-Day Forecast**: Extended weather predictions with hourly breakdowns
- **Historical Weather**: View past weather data and trends
- **Marine Weather**: Coastal and marine conditions (for applicable locations)
- **iOS Liquid Glass Design**: Modern glassmorphism UI with smooth animations
- **Fully Responsive**: Optimized for mobile, tablet, and desktop devices
- **Cross-Platform**: Works on all modern browsers and platforms

## Tech Stack

- React 19.2.4
- Framer Motion (animations)
- Axios (API calls)
- Lucide React (icons)
- WeatherAPI.com (data source)
- CSS3 with Glassmorphism effects

## Setup Instructions

### 1. Install Dependencies

```bash
cd weather-app
npm install
```

### 2. Get API Key

1. Visit [WeatherAPI.com](https://www.weatherapi.com/)
2. Sign up for a free account
3. Get your API key from the dashboard

### 3. Configure API Key

Open `src/App.js` and replace the API key on line 13:

```javascript
const API_KEY = 'your_actual_api_key_here';
```

### 4. Run the Application

```bash
npm start
```

The app will open at `http://localhost:3000`

## Usage

### Search Locations
- Enter city name (e.g., "New York")
- Enter ZIP code (e.g., "10001")
- Enter coordinates (e.g., "40.7128,-74.0060")
- Enter airport code (e.g., "JFK")

### Navigate Tabs
- **Current**: View real-time weather conditions
- **Forecast**: See 7-day weather predictions
- **Historical**: Check yesterday's weather data
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
- Air Quality Index (AQI)

### 7-Day Forecast
- Daily high/low temperatures
- Weather conditions
- Precipitation probability
- Wind speed
- Sunrise/sunset times

### Historical Weather
- Previous day's conditions
- Temperature ranges
- Hourly breakdown
- Precipitation data
- Wind and visibility metrics

### Marine Weather
- Wave height predictions
- Wind conditions
- Water temperature
- Visibility for boating

## Design Features

### iOS Liquid Glass Effect
- Glassmorphism with backdrop blur
- Smooth animations and transitions
- Gradient backgrounds
- Responsive hover states
- Touch-optimized for mobile

### Responsive Breakpoints
- Desktop: 1400px max-width
- Tablet: 768px and below
- Mobile: 480px and below

### Accessibility
- Reduced motion support
- Semantic HTML
- ARIA labels
- Keyboard navigation
- High contrast ratios

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Performance Optimizations

- Lazy loading components
- Optimized animations with Framer Motion
- Efficient API calls with error handling
- CSS backdrop-filter for hardware acceleration
- Responsive images

## API Rate Limits

Free tier of WeatherAPI.com includes:
- 1,000,000 calls/month
- Current weather
- 3-day forecast (extendable to 7 days)
- Historical data (1 day)
- Marine data

## Troubleshooting

### API Key Issues
- Ensure your API key is valid and active
- Check if you've exceeded rate limits
- Verify the API key has proper permissions

### Marine Data Not Available
- Marine data only works for coastal locations
- Try searching for a coastal city

### Location Not Found
- Check spelling of location name
- Try using coordinates instead
- Use official city names

## Future Enhancements

- Weather alerts and notifications
- Multiple location favorites
- Weather radar maps
- Extended historical data (30 days)
- Weather comparison tool
- Dark/light theme toggle
- Offline mode with cached data

## License

MIT License - feel free to use this project for learning and development.

## Credits

- Weather data: [WeatherAPI.com](https://www.weatherapi.com/)
- Icons: [Lucide React](https://lucide.dev/)
- Design inspiration: iOS 17+ design language

---

Built with ❤️ using modern web technologies and 2026 design standards.
