# WeatherPro X - Quick Reference Card

## 🚀 Installation (30 seconds)

```bash
cd weather-app
npm install
# Edit src/App.js line 13 with your API key
npm start
```

## 🔑 Get API Key

https://www.weatherapi.com/signup.aspx (Free - 1M calls/month)

## 📂 Key Files

| File | Purpose |
|------|---------|
| `src/App.js` | Main app logic & components |
| `src/App.css` | iOS liquid glass styles |
| `package.json` | Dependencies & scripts |
| `.env` | API key (create this) |

## 🎨 Main Components

```javascript
<CurrentWeather />    // Current conditions
<ForecastWeather />   // 7-day forecast
<HistoricalWeather /> // Yesterday's data
<MarineWeather />     // Coastal conditions
<MetricCard />        // Reusable metric display
```

## 🔧 NPM Scripts

```bash
npm start          # Development server (port 3000)
npm run build      # Production build
npm test           # Run tests
npm run eject      # Eject from CRA (careful!)
```

## 🌐 API Endpoints

```javascript
// Current
GET /v1/current.json?key=KEY&q=LOCATION&aqi=yes

// Forecast
GET /v1/forecast.json?key=KEY&q=LOCATION&days=7&aqi=yes

// Historical
GET /v1/history.json?key=KEY&q=LOCATION&dt=YYYY-MM-DD

// Marine
GET /v1/marine.json?key=KEY&q=LOCATION&days=3
```

## 🔍 Search Formats

```javascript
"New York"              // City name
"10001"                 // ZIP code
"40.7128,-74.0060"      // Coordinates
"JFK"                   // Airport code
"New York, NY"          // City with state
```

## 🎯 Key State Variables

```javascript
const [location, setLocation]           // Current location
const [weatherData, setWeatherData]     // Current weather
const [forecastData, setForecastData]   // Forecast data
const [marineData, setMarineData]       // Marine data
const [historicalData, setHistoricalData] // Historical data
const [activeTab, setActiveTab]         // Active view tab
const [loading, setLoading]             // Loading state
const [error, setError]                 // Error message
```

## 🎨 CSS Classes

```css
.glass-card          /* Glassmorphism card */
.glass-input         /* Glass input field */
.glass-button        /* Glass button */
.hero-card           /* Main weather display */
.metric-card         /* Individual metric */
.forecast-card       /* Forecast day card */
.tab-button          /* Navigation tab */
```

## 🎭 Framer Motion Variants

```javascript
initial={{ opacity: 0, y: 20 }}
animate={{ opacity: 1, y: 0 }}
exit={{ opacity: 0, x: 20 }}
transition={{ delay: 0.1 }}
whileHover={{ scale: 1.05 }}
```

## 📱 Responsive Breakpoints

```css
/* Mobile */
@media (max-width: 480px) { }

/* Tablet */
@media (max-width: 768px) { }

/* Desktop */
@media (min-width: 1024px) { }
```

## 🎨 Color Variables

```css
--glass-bg: rgba(255, 255, 255, 0.08)
--glass-border: rgba(255, 255, 255, 0.18)
--accent-blue: #007AFF
--accent-purple: #AF52DE
--text-primary: #FFFFFF
--text-secondary: rgba(255, 255, 255, 0.7)
```

## 🔧 Common Customizations

### Change Default Location
```javascript
// Line 18 in App.js
const [location, setLocation] = useState('Your City');
```

### Change Temperature Unit
```javascript
// Replace temp_f with temp_c throughout
{Math.round(current.temp_c)}°C
```

### Change Forecast Days
```javascript
// Line 31 in App.js
params: { key: API_KEY, q: loc, days: 14 }
```

### Add Dark Mode
```css
/* Add to App.css */
.dark-mode {
  --glass-bg: rgba(0, 0, 0, 0.3);
  --text-primary: #FFFFFF;
}
```

## 🐛 Quick Debugging

```javascript
// Add console logs
console.log('Weather Data:', weatherData);
console.log('API Response:', response.data);
console.log('Error:', error);

// Check API calls in Network tab (F12)
// Check console for errors (F12)
// Verify API key is correct
```

## 📦 Build & Deploy

```bash
# Build
npm run build

# Deploy to Netlify
# Drag build folder to netlify.com/drop

# Deploy to Vercel
npx vercel

# Deploy to GitHub Pages
npm install --save-dev gh-pages
# Add to package.json:
"homepage": "https://username.github.io/repo"
"predeploy": "npm run build"
"deploy": "gh-pages -d build"
npm run deploy
```

## 🔒 Environment Variables

```bash
# Create .env file
REACT_APP_WEATHER_API_KEY=your_key_here

# Use in code
const API_KEY = process.env.REACT_APP_WEATHER_API_KEY;

# Restart server after .env changes
```

## 🎯 Performance Tips

```javascript
// 1. Implement caching
const cache = new Map();

// 2. Debounce search
import { debounce } from 'lodash';
const debouncedSearch = debounce(fetchWeather, 500);

// 3. Lazy load components
const Component = React.lazy(() => import('./Component'));

// 4. Memoize expensive calculations
const memoizedValue = useMemo(() => compute(data), [data]);
```

## 🧪 Testing Locations

```javascript
// Coastal (for marine data)
'Miami, FL'
'San Diego, CA'
'Seattle, WA'

// International
'London, UK'
'Tokyo, Japan'
'Paris, France'

// Coordinates
'40.7128,-74.0060'  // New York
'51.5074,-0.1278'   // London
```

## 📊 Data Structure Quick Reference

```javascript
// Current Weather
weatherData.current.temp_f
weatherData.current.condition.text
weatherData.current.wind_mph
weatherData.current.humidity

// Forecast
forecastData.forecast.forecastday[0].day.maxtemp_f
forecastData.forecast.forecastday[0].astro.sunrise

// Location
weatherData.location.name
weatherData.location.country
```

## 🎨 Icon Components (Lucide)

```javascript
import { 
  Search, Wind, Droplets, Eye, Gauge, 
  MapPin, Calendar, Waves, Sun, Moon,
  Cloud, CloudRain, Thermometer, Activity
} from 'lucide-react';

<Wind size={24} />
<Droplets className="icon-class" />
```

## 🚨 Common Errors & Fixes

| Error | Fix |
|-------|-----|
| API key invalid | Check key in App.js line 13 |
| Location not found | Verify spelling or use coordinates |
| Marine data unavailable | Only works for coastal cities |
| CORS error | API should handle CORS automatically |
| Module not found | Run `npm install` |
| Port 3000 in use | Use `PORT=3001 npm start` |

## 📚 Documentation Files

- `README.md` - Overview
- `SETUP_GUIDE.md` - Detailed setup
- `FEATURES.md` - All features
- `API_GUIDE.md` - API details
- `PROJECT_SUMMARY.md` - Complete summary
- `QUICK_REFERENCE.md` - This file

## 🔗 Useful Links

- WeatherAPI Docs: https://www.weatherapi.com/docs/
- React Docs: https://react.dev
- Framer Motion: https://www.framer.com/motion/
- Lucide Icons: https://lucide.dev/

## 💡 Pro Tips

1. Use environment variables for API keys
2. Implement caching to reduce API calls
3. Test on multiple devices and browsers
4. Monitor API usage in WeatherAPI dashboard
5. Use React DevTools for debugging
6. Enable source maps for production debugging
7. Implement error boundaries for better UX
8. Add loading skeletons for better perceived performance
9. Use lazy loading for images
10. Optimize bundle size with code splitting

---

**Keep this reference handy while developing!** 🚀
