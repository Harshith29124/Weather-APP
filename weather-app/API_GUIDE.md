# WeatherAPI.com Integration Guide

## Overview

WeatherPro X uses WeatherAPI.com as its data source. This guide explains the API integration, endpoints used, and how to customize the implementation.

## API Endpoints Used

### 1. Current Weather
```
GET https://api.weatherapi.com/v1/current.json
```

**Parameters:**
- `key`: Your API key
- `q`: Location query (city, zip, coordinates)
- `aqi`: Air quality data (yes/no)

**Response includes:**
- Current temperature
- Feels like temperature
- Weather condition
- Wind speed and direction
- Humidity
- Pressure
- Visibility
- UV index
- Air quality index

### 2. Forecast Weather
```
GET https://api.weatherapi.com/v1/forecast.json
```

**Parameters:**
- `key`: Your API key
- `q`: Location query
- `days`: Number of days (1-14, free tier: 3)
- `aqi`: Air quality data (yes/no)

**Response includes:**
- Daily forecasts
- Hourly forecasts
- Astronomy data (sunrise/sunset)
- Temperature highs/lows
- Precipitation probability
- Wind forecasts

### 3. Historical Weather
```
GET https://api.weatherapi.com/v1/history.json
```

**Parameters:**
- `key`: Your API key
- `q`: Location query
- `dt`: Date (YYYY-MM-DD format)

**Response includes:**
- Historical temperature data
- Past weather conditions
- Hourly historical data
- Precipitation records
- Wind history

### 4. Marine Weather
```
GET https://api.weatherapi.com/v1/marine.json
```

**Parameters:**
- `key`: Your API key
- `q`: Location query (coastal areas only)
- `days`: Number of days (1-7)

**Response includes:**
- Wave height
- Water temperature
- Marine wind conditions
- Visibility for boating
- Tide information

## API Key Setup

### Method 1: Direct in Code (Quick Start)

Edit `src/App.js` line 13:
```javascript
const API_KEY = 'your_actual_api_key_here';
```

### Method 2: Environment Variables (Recommended)

1. Create `.env` file in weather-app folder:
```env
REACT_APP_WEATHER_API_KEY=your_actual_api_key_here
```

2. Update `src/App.js` line 13:
```javascript
const API_KEY = process.env.REACT_APP_WEATHER_API_KEY;
```

3. Restart the app:
```bash
npm start
```

### Method 3: Config File (Advanced)

1. Create `src/config.js`:
```javascript
export const config = {
  weatherApiKey: process.env.REACT_APP_WEATHER_API_KEY || 'fallback_key',
  weatherApiBase: 'https://api.weatherapi.com/v1'
};
```

2. Import in `src/App.js`:
```javascript
import { config } from './config';
const API_KEY = config.weatherApiKey;
const BASE_URL = config.weatherApiBase;
```

## API Call Implementation

### Current Implementation

```javascript
// Current weather
const currentRes = await axios.get(`${BASE_URL}/current.json`, {
  params: { key: API_KEY, q: loc, aqi: 'yes' }
});

// Forecast
const forecastRes = await axios.get(`${BASE_URL}/forecast.json`, {
  params: { key: API_KEY, q: loc, days: 7, aqi: 'yes' }
});

// Historical
const historyRes = await axios.get(`${BASE_URL}/history.json`, {
  params: { key: API_KEY, q: loc, dt: dateStr }
});

// Marine
const marineRes = await axios.get(`${BASE_URL}/marine.json`, {
  params: { key: API_KEY, q: loc, days: 3 }
});
```

### Error Handling

```javascript
try {
  const response = await axios.get(url, { params });
  setWeatherData(response.data);
} catch (err) {
  setError(err.response?.data?.error?.message || 'Failed to fetch');
}
```

## Rate Limits

### Free Tier
- **Calls per month**: 1,000,000
- **Calls per minute**: No limit
- **Forecast days**: 3 days
- **Historical days**: 1 day at a time
- **Features**: All features included

### Paid Tiers
- **Starter**: 2M calls/month, $4/month
- **Developer**: 5M calls/month, $10/month
- **Business**: 10M calls/month, $20/month
- **Enterprise**: Custom pricing

## Optimization Tips

### 1. Caching Strategy

Implement caching to reduce API calls:

```javascript
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes
const cache = new Map();

const getCachedData = (key) => {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  return null;
};

const setCachedData = (key, data) => {
  cache.set(key, { data, timestamp: Date.now() });
};
```

### 2. Debouncing Search

Prevent excessive API calls during typing:

```javascript
import { debounce } from 'lodash';

const debouncedSearch = debounce((location) => {
  fetchWeatherData(location);
}, 500);
```

### 3. Batch Requests

Combine multiple requests when possible:

```javascript
const fetchAllData = async (location) => {
  const [current, forecast, history] = await Promise.all([
    axios.get(`${BASE_URL}/current.json`, { params: {...} }),
    axios.get(`${BASE_URL}/forecast.json`, { params: {...} }),
    axios.get(`${BASE_URL}/history.json`, { params: {...} })
  ]);
  return { current, forecast, history };
};
```

### 4. Conditional Marine Requests

Only fetch marine data for coastal locations:

```javascript
const isCoastalLocation = (location) => {
  const coastal = ['miami', 'seattle', 'boston', 'san diego'];
  return coastal.some(city => 
    location.toLowerCase().includes(city)
  );
};

if (isCoastalLocation(location)) {
  const marineRes = await axios.get(`${BASE_URL}/marine.json`, {...});
}
```

## Location Query Formats

### City Name
```javascript
q: "New York"
q: "London"
q: "Tokyo"
```

### City with State/Country
```javascript
q: "New York, NY"
q: "Paris, France"
```

### ZIP Code (US)
```javascript
q: "10001"
q: "90210"
```

### Coordinates
```javascript
q: "40.7128,-74.0060"  // Latitude,Longitude
q: "51.5074,-0.1278"   // London
```

### Airport Code (IATA)
```javascript
q: "JFK"
q: "LAX"
q: "LHR"
```

### IP Address
```javascript
q: "auto:ip"  // Auto-detect from IP
```

## Response Data Structure

### Current Weather Response
```json
{
  "location": {
    "name": "New York",
    "region": "New York",
    "country": "USA",
    "lat": 40.71,
    "lon": -74.01
  },
  "current": {
    "temp_f": 72,
    "temp_c": 22,
    "is_day": 1,
    "condition": {
      "text": "Partly cloudy",
      "icon": "//cdn.weatherapi.com/weather/64x64/day/116.png",
      "code": 1003
    },
    "wind_mph": 12,
    "wind_dir": "NW",
    "pressure_in": 30.1,
    "humidity": 45,
    "feelslike_f": 68,
    "vis_miles": 10,
    "uv": 4,
    "gust_mph": 15,
    "air_quality": {
      "us-epa-index": 1
    }
  }
}
```

### Forecast Response
```json
{
  "forecast": {
    "forecastday": [
      {
        "date": "2026-02-18",
        "day": {
          "maxtemp_f": 75,
          "mintemp_f": 62,
          "avgtemp_f": 68,
          "maxwind_mph": 15,
          "totalprecip_in": 0.1,
          "daily_chance_of_rain": 20,
          "condition": {
            "text": "Partly cloudy",
            "icon": "//cdn.weatherapi.com/weather/64x64/day/116.png"
          }
        },
        "astro": {
          "sunrise": "06:42 AM",
          "sunset": "07:58 PM"
        },
        "hour": [
          // 24 hourly forecasts
        ]
      }
    ]
  }
}
```

## Error Codes

### Common Errors

| Code | Message | Solution |
|------|---------|----------|
| 1002 | API key not provided | Add your API key |
| 1003 | Parameter 'q' not provided | Include location query |
| 1005 | API request url is invalid | Check endpoint URL |
| 1006 | No location found | Verify location spelling |
| 2006 | API key provided is invalid | Check your API key |
| 2007 | API key has exceeded calls per month quota | Upgrade plan or wait for reset |
| 2008 | API key has been disabled | Contact WeatherAPI support |
| 9999 | Internal application error | Try again later |

### Error Handling Example

```javascript
const handleApiError = (error) => {
  const errorCode = error.response?.data?.error?.code;
  
  switch(errorCode) {
    case 1006:
      return "Location not found. Please check spelling.";
    case 2006:
      return "Invalid API key. Please check your configuration.";
    case 2007:
      return "API limit exceeded. Please try again later.";
    default:
      return error.response?.data?.error?.message || "An error occurred";
  }
};
```

## Advanced Features

### 1. Auto-complete Search

```javascript
const searchLocations = async (query) => {
  const response = await axios.get(`${BASE_URL}/search.json`, {
    params: { key: API_KEY, q: query }
  });
  return response.data; // Array of matching locations
};
```

### 2. Astronomy Data

Already included in forecast response:
- Sunrise time
- Sunset time
- Moonrise time
- Moonset time
- Moon phase
- Moon illumination

### 3. Time Zone Information

Included in location response:
- Time zone name
- Local time
- UTC offset

### 4. Alerts (Paid feature)

```javascript
const alerts = await axios.get(`${BASE_URL}/forecast.json`, {
  params: { key: API_KEY, q: location, alerts: 'yes' }
});
```

## Testing

### Test Locations

```javascript
// Coastal (for marine data)
const coastalCities = [
  'Miami, FL',
  'San Diego, CA',
  'Boston, MA',
  'Seattle, WA'
];

// International
const internationalCities = [
  'London, UK',
  'Tokyo, Japan',
  'Paris, France',
  'Sydney, Australia'
];

// Coordinates
const coordinates = [
  '40.7128,-74.0060',  // New York
  '51.5074,-0.1278',   // London
  '35.6762,139.6503'   // Tokyo
];
```

### Mock Data for Development

Create `src/mockData.js` for offline development:

```javascript
export const mockWeatherData = {
  location: {
    name: "San Francisco",
    region: "California",
    country: "USA"
  },
  current: {
    temp_f: 72,
    condition: { text: "Partly cloudy", icon: "..." },
    // ... more fields
  }
};
```

## Switching API Providers

To switch to a different weather API:

1. Update `BASE_URL` in App.js
2. Modify API call parameters
3. Update response data mapping
4. Adjust error handling

Example for OpenWeatherMap:
```javascript
const BASE_URL = 'https://api.openweathermap.org/data/2.5';
const response = await axios.get(`${BASE_URL}/weather`, {
  params: { q: location, appid: API_KEY, units: 'imperial' }
});
```

## Best Practices

1. **Always use HTTPS** for API calls
2. **Store API keys securely** in environment variables
3. **Implement caching** to reduce API calls
4. **Handle errors gracefully** with user-friendly messages
5. **Validate user input** before making API calls
6. **Monitor API usage** to avoid exceeding limits
7. **Use appropriate timeouts** for API requests
8. **Implement retry logic** for failed requests
9. **Log errors** for debugging
10. **Test with various locations** including edge cases

---

For more information, visit the official [WeatherAPI.com Documentation](https://www.weatherapi.com/docs/)
