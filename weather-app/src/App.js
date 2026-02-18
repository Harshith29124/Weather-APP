import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Wind, Droplets, Eye, MapPin, Sun, Moon, Cloud, 
  CloudRain, X, Gauge, Activity, Umbrella, Thermometer,
  Calendar, Waves, TrendingUp, Navigation
} from 'lucide-react';
import axios from 'axios';
import { format, subDays } from 'date-fns';
import './App.css';

const GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const WEATHER_URL = 'https://api.open-meteo.com/v1/forecast';
const MARINE_URL = 'https://marine-api.open-meteo.com/v1/marine';

export default function WeatherApp() {
  const [location, setLocation] = useState({ name: 'New Delhi', lat: 28.6139, lon: 77.2090 });
  const [searchInput, setSearchInput] = useState('');
  const [weatherData, setWeatherData] = useState(null);
  const [historicalData, setHistoricalData] = useState(null);
  const [marineData, setMarineData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showSearch, setShowSearch] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [activeView, setActiveView] = useState('current');
  const [selectedHistoricalDate, setSelectedHistoricalDate] = useState(
    format(subDays(new Date(), 1), 'yyyy-MM-dd')
  );

  useEffect(() => {
    if (location.lat && location.lon) {
      fetchWeatherData(location.lat, location.lon);
      if (activeView === 'historical') {
        fetchHistoricalData(location.lat, location.lon, selectedHistoricalDate);
      }
      if (activeView === 'marine') {
        fetchMarineData(location.lat, location.lon);
      }
    }
  }, [location, selectedHistoricalDate, activeView]);

  const searchLocation = async (query) => {
    if (!query.trim()) return;
    
    try {
      const response = await axios.get(GEOCODING_URL, {
        params: { name: query, count: 5, language: 'en', format: 'json' }
      });
      
      if (response.data.results) {
        setSearchResults(response.data.results);
      } else {
        setSearchResults([]);
        setError('Location not found');
      }
    } catch (err) {
      setError('Failed to search location');
      setSearchResults([]);
    }
  };

  const selectLocation = (result) => {
    setLocation({
      name: result.name,
      lat: result.latitude,
      lon: result.longitude,
      country: result.country
    });
    setShowSearch(false);
    setSearchInput('');
    setSearchResults([]);
  };

  const fetchWeatherData = async (lat, lon) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(WEATHER_URL, {
        params: {
          latitude: lat,
          longitude: lon,
          current: 'temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,cloud_cover,wind_speed_10m,wind_direction_10m,pressure_msl,visibility',
          hourly: 'temperature_2m,weather_code,is_day,precipitation_probability',
          daily: 'weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_sum,wind_speed_10m_max,uv_index_max',
          timezone: 'auto',
          forecast_days: 7
        }
      });

      setWeatherData(response.data);
    } catch (err) {
      setError('Failed to fetch weather data');
    } finally {
      setLoading(false);
    }
  };

  const fetchHistoricalData = async (lat, lon, date) => {
    try {
      const endDate = date;
      const startDate = format(subDays(new Date(date), 6), 'yyyy-MM-dd');
      
      const response = await axios.get(WEATHER_URL, {
        params: {
          latitude: lat,
          longitude: lon,
          start_date: startDate,
          end_date: endDate,
          hourly: 'temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m',
          daily: 'temperature_2m_max,temperature_2m_min,precipitation_sum,weather_code',
          timezone: 'auto'
        }
      });

      setHistoricalData(response.data);
    } catch (err) {
      console.error('Failed to fetch historical data');
    }
  };

  const fetchMarineData = async (lat, lon) => {
    try {
      const response = await axios.get(MARINE_URL, {
        params: {
          latitude: lat,
          longitude: lon,
          hourly: 'wave_height,wave_direction,wave_period,wind_wave_height,swell_wave_height',
          daily: 'wave_height_max,wave_direction_dominant,wave_period_max',
          timezone: 'auto',
          forecast_days: 7
        }
      });

      setMarineData(response.data);
    } catch (err) {
      setMarineData(null);
    }
  };

  const handleSearch = useCallback((e) => {
    e.preventDefault();
    searchLocation(searchInput);
  }, [searchInput]);

  const getWeatherDescription = useCallback((code) => {
    const codes = {
      0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
      45: 'Foggy', 48: 'Rime fog', 51: 'Light drizzle', 53: 'Drizzle',
      55: 'Dense drizzle', 61: 'Slight rain', 63: 'Rain', 65: 'Heavy rain',
      71: 'Slight snow', 73: 'Snow', 75: 'Heavy snow', 77: 'Snow grains',
      80: 'Rain showers', 81: 'Rain showers', 82: 'Heavy rain showers',
      85: 'Snow showers', 86: 'Heavy snow showers', 95: 'Thunderstorm',
      96: 'Thunderstorm with hail', 99: 'Heavy thunderstorm'
    };
    return codes[code] || 'Unknown';
  }, []);

  const getWeatherIcon = useCallback((code, isDay, size = 24) => {
    const props = { size, strokeWidth: 1.5 };
    if (code === 0 || code === 1) return isDay ? <Sun {...props} /> : <Moon {...props} />;
    if (code === 2 || code === 3) return <Cloud {...props} />;
    if (code >= 51 && code <= 65) return <CloudRain {...props} />;
    if (code >= 80 && code <= 82) return <CloudRain {...props} />;
    return <Cloud {...props} />;
  }, []);

  if (loading && !weatherData) {
    return (
      <div className="loading-container">
        <motion.div 
          className="loading-spinner"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <Sun size={40} />
        </motion.div>
      </div>
    );
  }

  if (!weatherData) return null;

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <div className="location" onClick={() => setShowSearch(true)}>
            <MapPin size={18} />
            <span>{location.name}</span>
          </div>
          <button className="search-btn" onClick={() => setShowSearch(true)}>
            <Search size={20} />
          </button>
        </div>
      </header>

      <div className="view-tabs">
        <div className="tabs-container">
          <button 
            className={`tab ${activeView === 'current' ? 'active' : ''}`}
            onClick={() => setActiveView('current')}
            aria-label="Current weather"
          >
            <Sun size={18} />
            <span>Current</span>
          </button>
          <button 
            className={`tab ${activeView === 'historical' ? 'active' : ''}`}
            onClick={() => setActiveView('historical')}
            aria-label="Historical weather"
          >
            <Calendar size={18} />
            <span>Historical</span>
          </button>
          <button 
            className={`tab ${activeView === 'marine' ? 'active' : ''}`}
            onClick={() => setActiveView('marine')}
            aria-label="Marine weather"
          >
            <Waves size={18} />
            <span>Marine</span>
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeView === 'current' && weatherData && (
          <CurrentWeatherView 
            key="current"
            weatherData={weatherData}
            location={location}
            getWeatherIcon={getWeatherIcon}
            getWeatherDescription={getWeatherDescription}
          />
        )}

        {activeView === 'historical' && historicalData && (
          <HistoricalWeatherView
            key="historical"
            historicalData={historicalData}
            location={location}
            selectedDate={selectedHistoricalDate}
            setSelectedDate={setSelectedHistoricalDate}
            getWeatherIcon={getWeatherIcon}
            getWeatherDescription={getWeatherDescription}
          />
        )}

        {activeView === 'marine' && (
          <MarineWeatherView
            key="marine"
            marineData={marineData}
            location={location}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSearch && (
          <motion.div 
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowSearch(false)}
          >
            <motion.div 
              className="modal"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button className="modal-close" onClick={() => setShowSearch(false)}>
                <X size={20} />
              </button>
              <h2>Search Location</h2>
              <form onSubmit={handleSearch}>
                <input
                  type="text"
                  placeholder="Enter city name..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  autoFocus
                />
                <button type="submit">Search</button>
              </form>
              
              {searchResults.length > 0 && (
                <div className="search-results">
                  {searchResults.map((result, index) => (
                    <div 
                      key={index} 
                      className="result-item"
                      onClick={() => selectLocation(result)}
                    >
                      <MapPin size={16} />
                      <div>
                        <div className="result-name">{result.name}</div>
                        <div className="result-meta">
                          {result.admin1 && `${result.admin1}, `}{result.country}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {error && <div className="error-toast">{error}</div>}
    </div>
  );
}

function CurrentWeatherView({ weatherData, location, getWeatherIcon, getWeatherDescription }) {
  const { current, hourly, daily } = weatherData;
  const currentHour = new Date().getHours();

  const hourlyForecast = useMemo(() => 
    hourly.time.slice(0, 24).map((time, index) => ({
      time,
      hour: new Date(time),
      weatherCode: hourly.weather_code[index],
      isDay: hourly.is_day[index],
      temp: hourly.temperature_2m[index],
      precipitation: hourly.precipitation_probability[index]
    })),
    [hourly]
  );

  return (
    <motion.main 
      className="main-grid"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <section className="hero-card">
        <div className="hero-content">
          <div className="hero-left">
            <div className="temp-display">
              <span className="temp-main">{Math.round(current.temperature_2m)}</span>
              <span className="temp-unit">°C</span>
            </div>
            <div className="condition">{getWeatherDescription(current.weather_code)}</div>
            <div className="location-name">{location.name}</div>
          </div>
          
          <div className="hero-right">
            <div className="weather-icon-hero">
              {getWeatherIcon(current.weather_code, current.is_day, 80)}
            </div>
          </div>
        </div>

        <div className="hero-stats">
          <div className="stat">
            <Sun size={16} />
            <div>
              <div className="stat-label">Sunrise</div>
              <div className="stat-value">{format(new Date(daily.sunrise[0]), 'h:mm a')}</div>
            </div>
          </div>
          <div className="stat">
            <Moon size={16} />
            <div>
              <div className="stat-label">Sunset</div>
              <div className="stat-value">{format(new Date(daily.sunset[0]), 'h:mm a')}</div>
            </div>
          </div>
          <div className="stat">
            <Droplets size={16} />
            <div>
              <div className="stat-label">Humidity</div>
              <div className="stat-value">{current.relative_humidity_2m}%</div>
            </div>
          </div>
        </div>
      </section>

      <section className="hourly-section">
        <h2 className="section-title">Hourly Forecast</h2>
        <div className="hourly-scroll">
          {hourlyForecast.map((item, index) => {
            const isNow = item.hour.getHours() === currentHour && index < 24;
            
            return (
              <motion.div 
                key={index} 
                className={`hourly-card ${isNow ? 'active' : ''}`}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.02 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="hourly-time">
                  {isNow ? 'Now' : format(item.hour, 'ha')}
                </div>
                <div className="hourly-icon">
                  {getWeatherIcon(item.weatherCode, item.isDay, 28)}
                </div>
                <div className="hourly-temp">{Math.round(item.temp)}°</div>
                <div className="hourly-rain">{item.precipitation}%</div>
              </motion.div>
            );
          })}
        </div>
      </section>

      <aside className="side-panels">
        <motion.div 
          className="panel"
          whileHover={{ scale: 1.02, y: -2 }}
          transition={{ duration: 0.2 }}
        >
          <div className="panel-header">
            <Wind size={18} />
            <span>Wind</span>
          </div>
          <div className="panel-value">{Math.round(current.wind_speed_10m)} km/h</div>
          <div className="panel-label">{current.wind_direction_10m}°</div>
        </motion.div>

        <motion.div 
          className="panel"
          whileHover={{ scale: 1.02, y: -2 }}
          transition={{ duration: 0.2 }}
        >
          <div className="panel-header">
            <Gauge size={18} />
            <span>Pressure</span>
          </div>
          <div className="panel-value">{Math.round(current.pressure_msl)} hPa</div>
          <div className="panel-label">Sea level</div>
        </motion.div>

        <motion.div 
          className="panel"
          whileHover={{ scale: 1.02, y: -2 }}
          transition={{ duration: 0.2 }}
        >
          <div className="panel-header">
            <Eye size={18} />
            <span>Visibility</span>
          </div>
          <div className="panel-value">{(current.visibility / 1000).toFixed(1)} km</div>
          <div className="panel-label">Clear view</div>
        </motion.div>

        <motion.div 
          className="panel"
          whileHover={{ scale: 1.02, y: -2 }}
          transition={{ duration: 0.2 }}
        >
          <div className="panel-header">
            <Thermometer size={18} />
            <span>Feels Like</span>
          </div>
          <div className="panel-value">{Math.round(current.apparent_temperature)}°C</div>
          <div className="panel-label">Apparent temp</div>
        </motion.div>

        <motion.div 
          className="panel"
          whileHover={{ scale: 1.02, y: -2 }}
          transition={{ duration: 0.2 }}
        >
          <div className="panel-header">
            <Activity size={18} />
            <span>UV Index</span>
          </div>
          <div className="panel-value">{daily.uv_index_max[0]}</div>
          <div className="panel-label">
            {daily.uv_index_max[0] < 3 ? 'Low' : daily.uv_index_max[0] < 6 ? 'Moderate' : 'High'}
          </div>
        </motion.div>

        <motion.div 
          className="panel"
          whileHover={{ scale: 1.02, y: -2 }}
          transition={{ duration: 0.2 }}
        >
          <div className="panel-header">
            <Umbrella size={18} />
            <span>Precipitation</span>
          </div>
          <div className="panel-value">{current.precipitation} mm</div>
          <div className="panel-label">Current</div>
        </motion.div>
      </aside>

      <section className="forecast-section">
        <h2 className="section-title">7-Day Forecast</h2>
        <div className="forecast-list">
          {daily.time.map((date, index) => {
            const tempRange = daily.temperature_2m_max[0] - daily.temperature_2m_min[0];
            const currentRange = daily.temperature_2m_max[index] - daily.temperature_2m_min[index];
            const rangePercent = tempRange > 0 ? (currentRange / tempRange) * 100 : 50;
            
            return (
              <motion.div 
                key={index} 
                className="forecast-item"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
              >
                <div className="forecast-day">
                  {index === 0 ? 'Today' : format(new Date(date), 'EEE')}
                </div>
                <div className="forecast-icon">
                  {getWeatherIcon(daily.weather_code[index], 1, 24)}
                </div>
                <div className="forecast-bar">
                  <span className="temp-low">{Math.round(daily.temperature_2m_min[index])}°</span>
                  <div className="temp-range-bar">
                    <motion.div 
                      className="temp-range-fill" 
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(rangePercent, 100)}%` }}
                      transition={{ duration: 0.5, delay: index * 0.05 }}
                    />
                  </div>
                  <span className="temp-high">{Math.round(daily.temperature_2m_max[index])}°</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>
    </motion.main>
  );
}

const HistoricalWeatherView = memo(function HistoricalWeatherView({ historicalData, location, selectedDate, setSelectedDate, getWeatherIcon, getWeatherDescription }) {
  const { hourly, daily } = historicalData;
  const selectedDayIndex = daily.time.findIndex(d => d === selectedDate);
  const selectedDayData = selectedDayIndex >= 0 ? {
    temp_max: daily.temperature_2m_max[selectedDayIndex],
    temp_min: daily.temperature_2m_min[selectedDayIndex],
    precipitation: daily.precipitation_sum[selectedDayIndex],
    weather_code: daily.weather_code[selectedDayIndex]
  } : null;

  const hourlyDataForSelectedDay = useMemo(() => 
    hourly.time
      .map((time, index) => ({
        time,
        hour: new Date(time),
        weatherCode: hourly.weather_code[index],
        temp: hourly.temperature_2m[index],
        precipitation: hourly.precipitation[index]
      }))
      .filter(item => format(item.hour, 'yyyy-MM-dd') === selectedDate),
    [hourly, selectedDate]
  );

  return (
    <motion.main 
      className="main-grid historical-grid"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <section className="date-selector">
        <div className="date-selector-header">
          <Calendar size={20} />
          <h2>Select Date</h2>
        </div>
        <div className="date-buttons">
          {daily.time.map((date, index) => (
            <motion.button
              key={date}
              className={`date-btn ${selectedDate === date ? 'active' : ''}`}
              onClick={() => setSelectedDate(date)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <div className="date-day">{format(new Date(date), 'EEE')}</div>
              <div className="date-date">{format(new Date(date), 'MMM d')}</div>
            </motion.button>
          ))}
        </div>
      </section>

      {selectedDayData && (
        <>
          <section className="hourly-section">
            <h2 className="section-title">Historical Data - {format(new Date(selectedDate), 'MMMM d')}</h2>
            <div className="hourly-scroll">
              {hourlyDataForSelectedDay.map((item, index) => (
                <motion.div 
                  key={index} 
                  className="hourly-card"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.02 }}
                  whileHover={{ scale: 1.05 }}
                >
                  <div className="hourly-time">{format(item.hour, 'ha')}</div>
                  <div className="hourly-icon">
                    {getWeatherIcon(item.weatherCode, 1, 28)}
                  </div>
                  <div className="hourly-temp">{Math.round(item.temp)}°</div>
                  <div className="hourly-rain">{item.precipitation} mm</div>
                </motion.div>
              ))}
            </div>
          </section>

          <aside className="side-panels">
            <motion.div 
              className="panel"
              whileHover={{ scale: 1.02, y: -2 }}
            >
              <div className="panel-header">
                <TrendingUp size={18} />
                <span>High</span>
              </div>
              <div className="panel-value">{Math.round(selectedDayData.temp_max)}°C</div>
              <div className="panel-label">Maximum</div>
            </motion.div>

            <motion.div 
              className="panel"
              whileHover={{ scale: 1.02, y: -2 }}
            >
              <div className="panel-header">
                <TrendingUp size={18} style={{ transform: 'rotate(180deg)' }} />
                <span>Low</span>
              </div>
              <div className="panel-value">{Math.round(selectedDayData.temp_min)}°C</div>
              <div className="panel-label">Minimum</div>
            </motion.div>

            <motion.div 
              className="panel"
              whileHover={{ scale: 1.02, y: -2 }}
            >
              <div className="panel-header">
                <CloudRain size={18} />
                <span>Precipitation</span>
              </div>
              <div className="panel-value">{selectedDayData.precipitation} mm</div>
              <div className="panel-label">Total</div>
            </motion.div>
          </aside>
        </>
      )}
    </motion.main>
  );
});

const MarineWeatherView = memo(function MarineWeatherView({ marineData, location }) {
  // Check data availability first
  const hasValidData = marineData && 
                       marineData.hourly && 
                       marineData.daily &&
                       marineData.hourly.wave_height && 
                       marineData.hourly.wave_height[0] &&
                       marineData.daily.wave_height_max && 
                       marineData.daily.wave_height_max[0];

  // Always call hooks in the same order - compute data even if not valid
  const hourlyMarineData = useMemo(() => {
    if (!hasValidData || !marineData.hourly) return [];
    
    return marineData.hourly.time.slice(0, 24).map((time, index) => ({
      time,
      hour: new Date(time),
      waveHeight: marineData.hourly.wave_height[index],
      wavePeriod: marineData.hourly.wave_period[index]
    }));
  }, [hasValidData, marineData]);

  // Early return after all hooks
  if (!hasValidData) {
    return (
      <motion.div 
        className="no-data-container"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.3 }}
      >
        <div className="no-data-card">
          <Waves size={64} />
          <h2>Marine Data Not Available</h2>
          <p>Marine weather data is only available for coastal and ocean locations.</p>
          <p className="location-info">Current location: {location.name}</p>
        </div>
      </motion.div>
    );
  }

  const { hourly, daily } = marineData;

  return (
    <motion.main 
      className="main-grid marine-grid"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <section className="hero-card">
        <div className="hero-content">
          <div className="hero-left">
            <div className="temp-display">
              <span className="temp-main">{hourly.wave_height[0].toFixed(1)}</span>
              <span className="temp-unit">m</span>
            </div>
            <div className="condition">Wave Height</div>
            <div className="location-name">{location.name} - Marine Forecast</div>
          </div>
          
          <div className="hero-right">
            <div className="weather-icon-hero">
              <Waves size={80} />
            </div>
          </div>
        </div>

        <div className="hero-stats">
          <div className="stat">
            <Waves size={16} />
            <div>
              <div className="stat-label">Wave Period</div>
              <div className="stat-value">{hourly.wave_period[0].toFixed(1)}s</div>
            </div>
          </div>
          <div className="stat">
            <Navigation size={16} />
            <div>
              <div className="stat-label">Wave Direction</div>
              <div className="stat-value">{Math.round(hourly.wave_direction[0])}°</div>
            </div>
          </div>
          <div className="stat">
            <Activity size={16} />
            <div>
              <div className="stat-label">Swell Height</div>
              <div className="stat-value">{hourly.swell_wave_height[0].toFixed(1)}m</div>
            </div>
          </div>
        </div>
      </section>

      <section className="hourly-section">
        <h2 className="section-title">Hourly Marine Forecast</h2>
        <div className="hourly-scroll">
          {hourlyMarineData.map((item, index) => (
            <motion.div 
              key={index} 
              className="hourly-card"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.02 }}
              whileHover={{ scale: 1.05 }}
            >
              <div className="hourly-time">{format(item.hour, 'ha')}</div>
              <div className="hourly-icon">
                <Waves size={28} />
              </div>
              <div className="hourly-temp">{item.waveHeight.toFixed(1)}m</div>
              <div className="hourly-rain">{item.wavePeriod.toFixed(1)}s</div>
            </motion.div>
          ))}
        </div>
      </section>

      <aside className="side-panels">
        <motion.div 
          className="panel"
          whileHover={{ scale: 1.02, y: -2 }}
        >
          <div className="panel-header">
            <Waves size={18} />
            <span>Max Wave Height</span>
          </div>
          <div className="panel-value">{daily.wave_height_max[0].toFixed(1)} m</div>
          <div className="panel-label">Today</div>
        </motion.div>

        <motion.div 
          className="panel"
          whileHover={{ scale: 1.02, y: -2 }}
        >
          <div className="panel-header">
            <Navigation size={18} />
            <span>Dominant Direction</span>
          </div>
          <div className="panel-value">{Math.round(daily.wave_direction_dominant[0])}°</div>
          <div className="panel-label">Wave direction</div>
        </motion.div>

        <motion.div 
          className="panel"
          whileHover={{ scale: 1.02, y: -2 }}
        >
          <div className="panel-header">
            <Activity size={18} />
            <span>Max Period</span>
          </div>
          <div className="panel-value">{daily.wave_period_max[0].toFixed(1)}s</div>
          <div className="panel-label">Peak period</div>
        </motion.div>

        <motion.div 
          className="panel"
          whileHover={{ scale: 1.02, y: -2 }}
        >
          <div className="panel-header">
            <Wind size={18} />
            <span>Wind Waves</span>
          </div>
          <div className="panel-value">{hourly.wind_wave_height[0].toFixed(1)}m</div>
          <div className="panel-label">Current</div>
        </motion.div>
      </aside>

      <section className="forecast-section">
        <h2 className="section-title">7-Day Marine Forecast</h2>
        <div className="forecast-list">
          {daily.time.map((date, index) => {
            const maxWaveHeight = Math.max(...daily.wave_height_max);
            const wavePercent = (daily.wave_height_max[index] / maxWaveHeight) * 100;
            
            return (
              <motion.div 
                key={index} 
                className="forecast-item"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
              >
                <div className="forecast-day">
                  {index === 0 ? 'Today' : format(new Date(date), 'EEE')}
                </div>
                <div className="forecast-icon">
                  <Waves size={24} />
                </div>
                <div className="forecast-bar">
                  <span className="temp-low">{daily.wave_height_max[index].toFixed(1)}m</span>
                  <div className="temp-range-bar">
                    <motion.div 
                      className="temp-range-fill" 
                      initial={{ width: 0 }}
                      animate={{ width: `${wavePercent}%` }}
                      transition={{ duration: 0.5, delay: index * 0.05 }}
                    />
                  </div>
                  <span className="temp-high">{daily.wave_period_max[index].toFixed(1)}s</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>
    </motion.main>
  );
});
