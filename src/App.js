import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Wind, Eye, MapPin, Sun, Moon, Cloud,
  CloudRain, CloudSnow, CloudLightning, Gauge, Activity,
  Umbrella, Thermometer, Calendar, Waves,
  Navigation, Droplets, Zap, Locate,
  SunMedium, Sunset, Sunrise, ArrowUp, ArrowDown, X
} from 'lucide-react';
import axios from 'axios';
import { format, subDays, parseISO } from 'date-fns';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts';
import './App.css';

/* ── API ENDPOINTS ─────────────────────────────────────────── */
const GEO_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const WEATHER_URL = 'https://api.open-meteo.com/v1/forecast';
const MARINE_URL = 'https://marine-api.open-meteo.com/v1/marine';

/* ── WEATHER CODE MAPS ─────────────────────────────────────── */
const WX_DESC = {
  0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
  45: 'Foggy', 48: 'Rime fog', 51: 'Light drizzle', 53: 'Drizzle', 55: 'Dense drizzle',
  61: 'Slight rain', 63: 'Moderate rain', 65: 'Heavy rain',
  71: 'Slight snow', 73: 'Moderate snow', 75: 'Heavy snow', 77: 'Snow grains',
  80: 'Rain showers', 81: 'Moderate showers', 82: 'Heavy showers',
  85: 'Snow showers', 86: 'Heavy snow showers',
  95: 'Thunderstorm', 96: 'Thunderstorm + hail', 99: 'Heavy thunderstorm'
};

function wxDesc(code) { return WX_DESC[code] || 'Unknown'; }

function WxIcon({ code, isDay, size = 24 }) {
  const p = { size, strokeWidth: 1.5 };
  if (code === 0 || code === 1)
    return isDay ? <Sun {...p} color="#fbbf24" /> : <Moon {...p} color="#818cf8" />;
  if (code === 2) return <Cloud {...p} color="#94a3b8" />;
  if (code === 3) return <Cloud {...p} color="#64748b" />;
  if (code === 45 || code === 48) return <Cloud {...p} color="#94a3b8" />;
  if (code >= 51 && code <= 67) return <CloudRain {...p} color="#4fc3f7" />;
  if (code >= 71 && code <= 77) return <CloudSnow {...p} color="#e0f2fe" />;
  if (code >= 80 && code <= 82) return <CloudRain {...p} color="#38bdf8" />;
  if (code >= 85 && code <= 86) return <CloudSnow {...p} color="#bae6fd" />;
  if (code >= 95) return <CloudLightning {...p} color="#fbbf24" />;
  return <Cloud {...p} color="#94a3b8" />;
}

/* ── GRADIENT BY CONDITION ─────────────────────────────────── */
function heroBg(code, isDay) {
  if (!isDay) return 'linear-gradient(135deg,#0a0f1e 0%,#0d1b3e 60%,#0a1628 100%)';
  if (code === 0 || code === 1) return 'linear-gradient(135deg,#0c2461 0%,#1565c0 50%,#0277bd 100%)';
  if (code === 2 || code === 3) return 'linear-gradient(135deg,#1a237e 0%,#283593 50%,#37474f 100%)';
  if (code >= 51 && code <= 82) return 'linear-gradient(135deg,#1a237e 0%,#263238 50%,#37474f 100%)';
  if (code >= 71 && code <= 77) return 'linear-gradient(135deg,#1a237e 0%,#37474f 50%,#546e7a 100%)';
  if (code >= 95) return 'linear-gradient(135deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%)';
  return 'linear-gradient(135deg,#0c2461 0%,#1565c0 50%,#0277bd 100%)';
}

/* ── DEFAULTS ──────────────────────────────────────────────── */
const DEFAULT_LOCATION = { name: 'New Delhi', lat: 28.6139, lon: 77.2090, country: 'India' };
const DEFAULT_FAVS = [
  { name: 'Mumbai', lat: 19.0760, lon: 72.8777, country: 'India' },
  { name: 'London', lat: 51.5074, lon: -0.1278, country: 'UK' },
  { name: 'New York', lat: 40.7128, lon: -74.0060, country: 'USA' },
  { name: 'Tokyo', lat: 35.6762, lon: 139.6503, country: 'Japan' },
];

/* ── LIVE CLOCK ────────────────────────────────────────────── */
function useClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

/* ── CUSTOM TOOLTIP ────────────────────────────────────────── */
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="custom-tooltip">
      <div style={{ fontWeight: 600, marginBottom: 4 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color, fontSize: '0.8rem' }}>
          {p.name}: {typeof p.value === 'number' ? p.value.toFixed(1) : p.value}{p.unit || ''}
        </div>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   MAIN APP
══════════════════════════════════════════════════════════════ */
export default function App() {
  const now = useClock();
  const [theme, setTheme] = useState('dark');
  const [location, setLocation] = useState(DEFAULT_LOCATION);
  const [searchInput, setSearchInput] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearch, setShowSearch] = useState(false);
  const [weatherData, setWeatherData] = useState(null);
  const [historicalData, setHistoricalData] = useState(null);
  const [marineData, setMarineData] = useState(null);
  const [favWeather, setFavWeather] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeView, setActiveView] = useState('current');
  const [selectedDate, setSelectedDate] = useState(format(subDays(new Date(), 1), 'yyyy-MM-dd'));
  const [geoLoading, setGeoLoading] = useState(false);
  const searchRef = useRef(null);
  const searchTimerRef = useRef(null);

  /* Apply theme */
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  /* Fetch main weather */
  useEffect(() => {
    if (location.lat && location.lon) fetchWeather(location.lat, location.lon);
  }, [location]);

  /* Fetch view-specific data */
  useEffect(() => {
    if (!location.lat) return;
    if (activeView === 'historical') fetchHistorical(location.lat, location.lon, selectedDate);
    if (activeView === 'marine') fetchMarine(location.lat, location.lon);
  }, [activeView, location, selectedDate]);

  /* Fetch fav city temps */
  useEffect(() => {
    DEFAULT_FAVS.forEach(fav => fetchFavTemp(fav));
  }, []);

  /* Close search on outside click */
  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSearch(false);
        setSearchResults([]);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  /* ── DATA FETCHERS ───────────────────────────────────────── */
  const fetchWeather = async (lat, lon) => {
    setLoading(true); setError(null);
    try {
      const { data } = await axios.get(WEATHER_URL, {
        params: {
          latitude: lat, longitude: lon,
          current: 'temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m,wind_direction_10m,pressure_msl,visibility,uv_index',
          hourly: 'temperature_2m,weather_code,is_day,precipitation_probability,wind_speed_10m',
          daily: 'weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max,precipitation_sum,wind_speed_10m_max',
          timezone: 'auto', forecast_days: 7
        }
      });
      setWeatherData(data);
    } catch { setError('Failed to fetch weather data'); }
    finally { setLoading(false); }
  };

  const fetchHistorical = async (lat, lon, date) => {
    try {
      const start = format(subDays(parseISO(date), 6), 'yyyy-MM-dd');
      const { data } = await axios.get(WEATHER_URL, {
        params: {
          latitude: lat, longitude: lon,
          start_date: start, end_date: date,
          hourly: 'temperature_2m,weather_code,precipitation,wind_speed_10m',
          daily: 'temperature_2m_max,temperature_2m_min,precipitation_sum,weather_code,wind_speed_10m_max',
          timezone: 'auto'
        }
      });
      setHistoricalData(data);
    } catch { console.error('Historical fetch failed'); }
  };

  const fetchMarine = async (lat, lon) => {
    try {
      const { data } = await axios.get(MARINE_URL, {
        params: {
          latitude: lat, longitude: lon,
          hourly: 'wave_height,wave_direction,wave_period,wind_wave_height,swell_wave_height',
          daily: 'wave_height_max,wave_direction_dominant,wave_period_max',
          timezone: 'auto', forecast_days: 7
        }
      });
      setMarineData(data);
    } catch { setMarineData(null); }
  };

  const fetchFavTemp = async (fav) => {
    try {
      const { data } = await axios.get(WEATHER_URL, {
        params: {
          latitude: fav.lat, longitude: fav.lon,
          current: 'temperature_2m,weather_code,is_day',
          timezone: 'auto'
        }
      });
      setFavWeather(prev => ({ ...prev, [fav.name]: data.current }));
    } catch { }
  };

  /* ── SEARCH ──────────────────────────────────────────────── */
  const handleSearchInput = useCallback((val) => {
    setSearchInput(val);
    clearTimeout(searchTimerRef.current);
    if (!val.trim()) { setSearchResults([]); return; }
    searchTimerRef.current = setTimeout(async () => {
      try {
        const { data } = await axios.get(GEO_URL, { params: { name: val, count: 6, language: 'en', format: 'json' } });
        setSearchResults(data.results || []);
      } catch { setSearchResults([]); }
    }, 350);
  }, []);

  const selectLocation = useCallback((result) => {
    setLocation({ name: result.name, lat: result.latitude, lon: result.longitude, country: result.country });
    setShowSearch(false); setSearchInput(''); setSearchResults([]);
  }, []);

  /* ── GEOLOCATION ─────────────────────────────────────────── */
  const handleGeolocate = useCallback(() => {
    if (!navigator.geolocation) { setError('Geolocation not supported'); return; }
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const { latitude: lat, longitude: lon } = pos.coords;
      try {
        const { data } = await axios.get(GEO_URL, { params: { latitude: lat, longitude: lon, count: 1, language: 'en', format: 'json' } });
        const r = data.results?.[0];
        setLocation({ name: r?.name || 'My Location', lat, lon, country: r?.country || '' });
      } catch {
        setLocation({ name: 'My Location', lat, lon, country: '' });
      }
      setGeoLoading(false);
    }, () => { setError('Location access denied'); setGeoLoading(false); });
  }, []);

  /* ── RENDER ──────────────────────────────────────────────── */
  if (loading && !weatherData) return <LoadingScreen />;
  if (!weatherData) return null;

  const { current } = weatherData;
  const isDay = current.is_day;

  return (
    <div className="app">
      {/* Aurora background */}
      <div className="aurora-bg">
        <div className="aurora-orb" />
        <div className="aurora-orb" />
        <div className="aurora-orb" />
        <div className="aurora-orb" />
      </div>

      <div className="app-layout">
        {/* HEADER */}
        <header className="header">
          <div className="header-brand">
            <div className="brand-icon">
              <SunMedium size={20} color="#fff" strokeWidth={2} />
            </div>
            <span className="brand-name">Atmos</span>
          </div>

          {/* Search bar */}
          <div className="search-bar" ref={searchRef}>
            <span className="search-bar-icon"><Search size={14} /></span>
            <input
              className="search-bar-input"
              type="text"
              placeholder="Search city…"
              value={searchInput}
              onFocus={() => setShowSearch(true)}
              onChange={e => handleSearchInput(e.target.value)}
              onKeyDown={e => e.key === 'Escape' && setShowSearch(false)}
            />
            <AnimatePresence>
              {showSearch && searchResults.length > 0 && (
                <motion.div
                  className="search-dropdown"
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.15 }}
                >
                  {searchResults.map((r, i) => (
                    <div key={i} className="search-result-item" onClick={() => selectLocation(r)}>
                      <div className="search-result-icon"><MapPin size={14} /></div>
                      <div>
                        <div className="search-result-name">{r.name}</div>
                        <div className="search-result-meta">{r.admin1 && `${r.admin1}, `}{r.country}</div>
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="header-actions">
            <button className="geo-btn" onClick={handleGeolocate} disabled={geoLoading} title="Use my location">
              <Locate size={14} />
              <span>{geoLoading ? 'Locating…' : 'My Location'}</span>
            </button>
            <button
              className={`header-btn ${theme === 'light' ? 'active' : ''}`}
              onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
              title="Toggle theme"
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>
        </header>

        {/* FAVORITES STRIP */}
        <div className="favorites-strip" style={{ marginBottom: 4 }}>
          {DEFAULT_FAVS.map(fav => {
            const fw = favWeather[fav.name];
            const isActive = location.name === fav.name;
            return (
              <button key={fav.name} className={`fav-chip ${isActive ? 'active' : ''}`}
                onClick={() => setLocation(fav)}>
                {fw && <WxIcon code={fw.weather_code} isDay={fw.is_day} size={12} />}
                <span>{fav.name}</span>
                {fw && <span className="fav-chip-temp">{Math.round(fw.temperature_2m)}°</span>}
              </button>
            );
          })}
        </div>

        {/* MAIN GRID */}
        <div className="main-grid">
          {/* LEFT COLUMN */}
          <div className="left-col">
            <HeroCard
              data={weatherData}
              location={location}
              now={now}
              heroBg={heroBg(current.weather_code, isDay)}
            />

            <SunCard data={weatherData} />

            {/* TABS */}
            <div className="tabs-container">
              {[
                { id: 'current', label: 'Current', icon: <Sun size={14} /> },
                { id: 'hourly', label: 'Hourly', icon: <Activity size={14} /> },
                { id: 'historical', label: 'Historical', icon: <Calendar size={14} /> },
                { id: 'marine', label: 'Marine', icon: <Waves size={14} /> },
              ].map(tab => (
                <button key={tab.id} className={`tab-btn ${activeView === tab.id ? 'active' : ''}`}
                  onClick={() => setActiveView(tab.id)}>
                  {tab.icon}<span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* HOURLY STRIP (always visible) */}
            <div className="glass-card card-body-sm animate-fade-up">
              <div className="section-label">Hourly Forecast</div>
              <HourlyStrip data={weatherData} />
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="right-col">
            <AnimatePresence mode="wait">
              {activeView === 'current' && (
                <motion.div key="current" className="right-col"
                  initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.25 }}>
                  <CurrentDetails data={weatherData} />
                  <ForecastCard data={weatherData} />
                </motion.div>
              )}
              {activeView === 'hourly' && (
                <motion.div key="hourly" className="right-col"
                  initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.25 }}>
                  <HourlyChartCard data={weatherData} />
                  <PrecipCard data={weatherData} />
                </motion.div>
              )}
              {activeView === 'historical' && (
                <motion.div key="historical" className="right-col"
                  initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.25 }}>
                  <HistoricalView
                    data={historicalData}
                    selectedDate={selectedDate}
                    setSelectedDate={setSelectedDate}
                  />
                </motion.div>
              )}
              {activeView === 'marine' && (
                <motion.div key="marine" className="right-col"
                  initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.25 }}>
                  <MarineView data={marineData} location={location} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* ERROR TOAST */}
      <AnimatePresence>
        {error && (
          <motion.div className="toast"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}>
            {error}
            <button onClick={() => setError(null)} style={{ marginLeft: 8, opacity: 0.7 }}>
              <X size={12} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   LOADING SCREEN
══════════════════════════════════════════════════════════════ */
function LoadingScreen() {
  return (
    <div className="loading-screen">
      <div className="aurora-bg">
        <div className="aurora-orb" /><div className="aurora-orb" />
        <div className="aurora-orb" /><div className="aurora-orb" />
      </div>
      <div className="loading-logo"><SunMedium size={32} color="#fff" /></div>
      <div className="loading-text">ATMOS WEATHER</div>
      <div className="loading-dots">
        <div className="loading-dot" />
        <div className="loading-dot" />
        <div className="loading-dot" />
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   HERO CARD
══════════════════════════════════════════════════════════════ */
function HeroCard({ data, location, now, heroBg: bg }) {
  const { current, daily } = data;
  return (
    <div className="glass-card hero-card animate-fade-up" style={{ background: bg }}>
      <div className="hero-top">
        <div className="hero-location">
          <div className="hero-city">{location.name}</div>
          <div className="hero-country">
            <MapPin size={11} />
            {location.country}
          </div>
        </div>
        <div className="hero-datetime">
          <div className="hero-time">{format(now, 'HH:mm:ss')}</div>
          <div className="hero-date">{format(now, 'EEE, MMM d')}</div>
        </div>
      </div>

      <div className="hero-main">
        <div className="hero-temp-block">
          <div className="hero-temp">
            {Math.round(current.temperature_2m)}
            <span className="hero-temp-unit">°C</span>
          </div>
          <div className="hero-condition">{wxDesc(current.weather_code)}</div>
          <div className="hero-feels-like">Feels like {Math.round(current.apparent_temperature)}°C</div>
        </div>
        <div className="hero-icon-wrap">
          <WxIcon code={current.weather_code} isDay={current.is_day} size={90} />
        </div>
      </div>

      <div className="hero-bottom">
        <div className="hero-stat">
          <div className="hero-stat-label">High</div>
          <div className="hero-stat-value">{Math.round(daily.temperature_2m_max[0])}°</div>
        </div>
        <div className="hero-stat-divider" />
        <div className="hero-stat">
          <div className="hero-stat-label">Low</div>
          <div className="hero-stat-value">{Math.round(daily.temperature_2m_min[0])}°</div>
        </div>
        <div className="hero-stat-divider" />
        <div className="hero-stat">
          <div className="hero-stat-label">Humidity</div>
          <div className="hero-stat-value">{current.relative_humidity_2m}%</div>
        </div>
        <div className="hero-stat-divider" />
        <div className="hero-stat">
          <div className="hero-stat-label">Wind</div>
          <div className="hero-stat-value">{Math.round(current.wind_speed_10m)} km/h</div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   HOURLY STRIP
══════════════════════════════════════════════════════════════ */
function HourlyStrip({ data }) {
  const { hourly } = data;
  const currentHour = new Date().getHours();
  const items = useMemo(() =>
    hourly.time.slice(0, 24).map((t, i) => ({
      time: t, hour: new Date(t),
      code: hourly.weather_code[i],
      isDay: hourly.is_day[i],
      temp: hourly.temperature_2m[i],
      precip: hourly.precipitation_probability[i],
    })), [hourly]);

  return (
    <div className="hourly-strip">
      {items.map((item, i) => {
        const isNow = item.hour.getHours() === currentHour && i < 24;
        return (
          <div key={i} className={`hourly-item ${isNow ? 'now' : ''}`}>
            <div className="hourly-time">{isNow ? 'Now' : format(item.hour, 'ha')}</div>
            <div className="hourly-icon"><WxIcon code={item.code} isDay={item.isDay} size={22} /></div>
            <div className="hourly-temp">{Math.round(item.temp)}°</div>
            {item.precip > 0 && <div className="hourly-precip">{item.precip}%</div>}
          </div>
        );
      })}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   CURRENT DETAILS
══════════════════════════════════════════════════════════════ */
function CurrentDetails({ data }) {
  const { current, daily } = data;
  const uv = daily.uv_index_max[0];
  const uvLabel = uv < 3 ? 'Low' : uv < 6 ? 'Moderate' : uv < 8 ? 'High' : 'Very High';
  const uvColor = uv < 3 ? '#4ade80' : uv < 6 ? '#fbbf24' : uv < 8 ? '#fb923c' : '#fb7185';

  const windDir = current.wind_direction_10m;
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const dirLabel = dirs[Math.round(windDir / 45) % 8];

  const tiles = [
    {
      icon: <Wind size={14} />, label: 'Wind Speed',
      value: Math.round(current.wind_speed_10m), unit: ' km/h',
      bar: Math.min((current.wind_speed_10m / 100) * 100, 100),
      barColor: 'linear-gradient(90deg,#4fc3f7,#818cf8)'
    },
    {
      icon: <Navigation size={14} />, label: 'Wind Dir',
      value: dirLabel, unit: ` (${Math.round(windDir)}°)`,
      bar: null
    },
    {
      icon: <Gauge size={14} />, label: 'Pressure',
      value: Math.round(current.pressure_msl), unit: ' hPa',
      bar: Math.min(((current.pressure_msl - 950) / 100) * 100, 100),
      barColor: 'linear-gradient(90deg,#818cf8,#c084fc)'
    },
    {
      icon: <Eye size={14} />, label: 'Visibility',
      value: (current.visibility / 1000).toFixed(1), unit: ' km',
      bar: Math.min((current.visibility / 20000) * 100, 100),
      barColor: 'linear-gradient(90deg,#2dd4bf,#4fc3f7)'
    },
    {
      icon: <Droplets size={14} />, label: 'Humidity',
      value: current.relative_humidity_2m, unit: '%',
      bar: current.relative_humidity_2m,
      barColor: 'linear-gradient(90deg,#4fc3f7,#2dd4bf)'
    },
    {
      icon: <Zap size={14} />, label: 'UV Index',
      value: uv?.toFixed(1) ?? '—', unit: ` (${uvLabel})`,
      bar: Math.min((uv / 11) * 100, 100),
      barColor: `linear-gradient(90deg,${uvColor},${uvColor}88)`
    },
    {
      icon: <Umbrella size={14} />, label: 'Precipitation',
      value: current.precipitation, unit: ' mm',
      bar: Math.min(current.precipitation * 10, 100),
      barColor: 'linear-gradient(90deg,#38bdf8,#818cf8)'
    },
    {
      icon: <Thermometer size={14} />, label: 'Feels Like',
      value: Math.round(current.apparent_temperature), unit: '°C',
      bar: null
    },
  ];

  return (
    <div className="glass-card card-body animate-fade-up delay-1">
      <div className="section-label">Weather Details</div>
      <div className="detail-grid">
        {tiles.map((t, i) => (
          <div key={i} className="detail-tile">
            <div className="detail-tile-header">{t.icon}{t.label}</div>
            <div>
              <span className="detail-tile-value">{t.value}</span>
              <span className="detail-tile-unit">{t.unit}</span>
            </div>
            {t.bar !== null && (
              <div className="detail-tile-bar">
                <div className="detail-tile-bar-fill"
                  style={{ width: `${t.bar}%`, background: t.barColor }} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   SUN CARD (Sunrise / Sunset arc)
══════════════════════════════════════════════════════════════ */
function SunCard({ data }) {
  const { daily } = data;
  const sunrise = new Date(daily.sunrise[0]);
  const sunset = new Date(daily.sunset[0]);
  const now = new Date();

  const totalMs = sunset - sunrise;
  const elapsedMs = Math.max(0, Math.min(now - sunrise, totalMs));
  const progress = totalMs > 0 ? elapsedMs / totalMs : 0;

  // Arc path: semicircle from left to right
  const W = 280, H = 90, R = 110;
  const cx = W / 2, cy = H + 10;
  const startX = cx - R, endX = cx + R;
  const arcPath = `M ${startX} ${cy} A ${R} ${R} 0 0 1 ${endX} ${cy}`;

  // Sun position along arc
  const angle = Math.PI - progress * Math.PI;
  const sunX = cx + R * Math.cos(angle);
  const sunY = cy - R * Math.sin(angle);

  return (
    <div className="glass-card sun-arc-card animate-fade-up delay-2">
      <div className="section-label">Sun Position</div>
      <svg className="sun-arc-svg" viewBox={`0 0 ${W} ${H}`} style={{ overflow: 'visible' }}>
        {/* Track */}
        <path d={arcPath} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="2" strokeDasharray="4 4" />
        {/* Progress */}
        <path d={arcPath} fill="none" stroke="url(#sunGrad)" strokeWidth="2"
          strokeDasharray={`${progress * Math.PI * R} ${Math.PI * R}`} />
        <defs>
          <linearGradient id="sunGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#f97316" />
            <stop offset="100%" stopColor="#fbbf24" />
          </linearGradient>
        </defs>
        {/* Sun dot */}
        {progress > 0 && progress < 1 && (
          <>
            <circle cx={sunX} cy={sunY} r="10" fill="#fbbf24" opacity="0.2" />
            <circle cx={sunX} cy={sunY} r="6" fill="#fbbf24" />
          </>
        )}
        {/* Horizon line */}
        <line x1={startX - 10} y1={cy} x2={endX + 10} y2={cy}
          stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
      </svg>
      <div className="sun-arc-times">
        <div className="sun-time">
          <div className="sun-time-label"><Sunrise size={10} style={{ display: 'inline', marginRight: 3 }} />Sunrise</div>
          <div className="sun-time-value">{format(sunrise, 'h:mm a')}</div>
        </div>
        <div className="sun-time">
          <div className="sun-time-label"><Sunset size={10} style={{ display: 'inline', marginRight: 3 }} />Sunset</div>
          <div className="sun-time-value">{format(sunset, 'h:mm a')}</div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   7-DAY FORECAST CARD
══════════════════════════════════════════════════════════════ */
function ForecastCard({ data }) {
  const { daily } = data;
  const maxTemp = Math.max(...daily.temperature_2m_max);
  const minTemp = Math.min(...daily.temperature_2m_min);
  const range = maxTemp - minTemp || 1;

  return (
    <div className="glass-card card-body animate-fade-up delay-3">
      <div className="section-label">7-Day Forecast</div>
      <div className="forecast-list">
        {daily.time.map((date, i) => {
          const hi = daily.temperature_2m_max[i];
          const lo = daily.temperature_2m_min[i];
          const barStart = ((lo - minTemp) / range) * 100;
          const barWidth = ((hi - lo) / range) * 100;
          return (
            <div key={i} className="forecast-row">
              <div className={`forecast-day-name ${i === 0 ? 'today' : ''}`}>
                {i === 0 ? 'Today' : format(parseISO(date), 'EEE')}
              </div>
              <div className="forecast-icon">
                <WxIcon code={daily.weather_code[i]} isDay={1} size={20} />
              </div>
              <div className="forecast-bar-wrap">
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', width: 28 }}>
                  {Math.round(lo)}°
                </span>
                <div className="forecast-bar-track">
                  <div className="forecast-bar-fill"
                    style={{ marginLeft: `${barStart}%`, width: `${barWidth}%` }} />
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-primary)', width: 28, textAlign: 'right' }}>
                  {Math.round(hi)}°
                </span>
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textAlign: 'right' }}>
                {daily.precipitation_sum[i] > 0 ? `${daily.precipitation_sum[i].toFixed(1)}mm` : '—'}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   HOURLY CHART CARD
══════════════════════════════════════════════════════════════ */
function HourlyChartCard({ data }) {
  const { hourly } = data;
  const chartData = useMemo(() =>
    hourly.time.slice(0, 24).map((t, i) => ({
      time: format(new Date(t), 'ha'),
      temp: Math.round(hourly.temperature_2m[i]),
      wind: Math.round(hourly.wind_speed_10m[i]),
    })), [hourly]);

  return (
    <div className="glass-card card-body animate-fade-up">
      <div className="section-label">Temperature Trend (24h)</div>
      <div className="chart-wrap">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="tempGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4fc3f7" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#4fc3f7" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="time" tick={{ fontSize: 10 }} interval={3} />
            <YAxis tick={{ fontSize: 10 }} unit="°" />
            <Tooltip content={<ChartTooltip />} />
            <Area type="monotone" dataKey="temp" name="Temp" unit="°C"
              stroke="#4fc3f7" strokeWidth={2} fill="url(#tempGrad)" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   PRECIPITATION CARD
══════════════════════════════════════════════════════════════ */
function PrecipCard({ data }) {
  const { hourly } = data;
  const items = useMemo(() =>
    hourly.time.slice(0, 24).map((t, i) => ({
      time: format(new Date(t), 'ha'),
      prob: hourly.precipitation_probability[i] ?? 0,
    })).filter((_, i) => i % 3 === 0), [hourly]);

  return (
    <div className="glass-card card-body animate-fade-up delay-1">
      <div className="section-label">Precipitation Probability</div>
      {items.map((item, i) => (
        <div key={i} className="precip-row">
          <div className="precip-label">{item.time}</div>
          <div className="precip-bar-track">
            <div className="precip-bar-fill" style={{ width: `${item.prob}%` }} />
          </div>
          <div className="precip-value">{item.prob}%</div>
        </div>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   HISTORICAL VIEW
══════════════════════════════════════════════════════════════ */
function HistoricalView({ data, selectedDate, setSelectedDate }) {
  const daily = data?.daily;
  const hourly = data?.hourly;

  const selIdx = useMemo(() =>
    daily ? daily.time.findIndex(d => d === selectedDate) : -1,
    [daily, selectedDate]);

  const hourlyForDay = useMemo(() => {
    if (!hourly) return [];
    return hourly.time
      .map((t, i) => ({ t, temp: hourly.temperature_2m[i], precip: hourly.precipitation[i] }))
      .filter(item => item.t.startsWith(selectedDate))
      .map(item => ({ time: format(new Date(item.t), 'ha'), temp: Math.round(item.temp), precip: item.precip }));
  }, [hourly, selectedDate]);

  if (!data) return (
    <div className="glass-card card-body" style={{ textAlign: 'center', padding: 40 }}>
      <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Loading historical data…</div>
    </div>
  );

  return (
    <>
      {/* Date picker */}
      <div className="glass-card card-body-sm animate-fade-up">
        <div className="section-label">Select Date</div>
        <div className="date-picker-strip">
          {daily.time.map(date => (
            <button key={date} className={`date-chip ${selectedDate === date ? 'active' : ''}`}
              onClick={() => setSelectedDate(date)}>
              <div className="date-chip-day">{format(parseISO(date), 'EEE')}</div>
              <div className="date-chip-date">{format(parseISO(date), 'MMM d')}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Summary tiles */}
      {selIdx >= 0 && (
        <div className="glass-card card-body animate-fade-up delay-1">
          <div className="section-label">Summary — {format(parseISO(selectedDate), 'MMMM d')}</div>
          <div className="detail-grid" style={{ gridTemplateColumns: 'repeat(2,1fr)' }}>
            {[
              { icon: <ArrowUp size={14} />, label: 'High', value: Math.round(daily.temperature_2m_max[selIdx]), unit: '°C' },
              { icon: <ArrowDown size={14} />, label: 'Low', value: Math.round(daily.temperature_2m_min[selIdx]), unit: '°C' },
              { icon: <Umbrella size={14} />, label: 'Precipitation', value: daily.precipitation_sum[selIdx]?.toFixed(1) ?? '0', unit: ' mm' },
              { icon: <Wind size={14} />, label: 'Max Wind', value: Math.round(daily.wind_speed_10m_max[selIdx]), unit: ' km/h' },
            ].map((t, i) => (
              <div key={i} className="detail-tile">
                <div className="detail-tile-header">{t.icon}{t.label}</div>
                <div><span className="detail-tile-value">{t.value}</span><span className="detail-tile-unit">{t.unit}</span></div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hourly chart for selected day */}
      {hourlyForDay.length > 0 && (
        <div className="glass-card card-body animate-fade-up delay-2">
          <div className="section-label">Hourly Temperature</div>
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hourlyForDay} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="histGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="time" tick={{ fontSize: 10 }} interval={3} />
                <YAxis tick={{ fontSize: 10 }} unit="°" />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="temp" name="Temp" unit="°C"
                  stroke="#818cf8" strokeWidth={2} fill="url(#histGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </>
  );
}

/* ══════════════════════════════════════════════════════════════
   MARINE VIEW
══════════════════════════════════════════════════════════════ */
function MarineView({ data, location }) {
  const hasData = data?.hourly?.wave_height?.[0] != null && data?.daily?.wave_height_max?.[0] != null;

  const chartData = useMemo(() => {
    if (!hasData || !data?.hourly) return [];
    return data.hourly.time.slice(0, 24).map((t, i) => ({
      time: format(new Date(t), 'ha'),
      wave: data.hourly.wave_height[i]?.toFixed(2),
      swell: data.hourly.swell_wave_height[i]?.toFixed(2),
    }));
  }, [hasData, data]);

  if (!hasData) return (
    <div className="glass-card marine-no-data animate-fade-up">
      <div className="marine-no-data-icon"><Waves size={56} /></div>
      <div className="marine-no-data-title">Marine Data Unavailable</div>
      <div className="marine-no-data-desc">
        Marine weather data is only available for coastal and ocean locations.
        <br /><br />
        <strong>{location.name}</strong> appears to be inland.
      </div>
    </div>
  );

  const { hourly, daily } = data;
  const maxWave = Math.max(...daily.wave_height_max);

  return (
    <>
      {/* Hero */}
      <div className="glass-card hero-card animate-fade-up"
        style={{ background: 'linear-gradient(135deg,#0c2461 0%,#006064 60%,#00838f 100%)' }}>
        <div className="hero-top">
          <div className="hero-location">
            <div className="hero-city">{location.name}</div>
            <div className="hero-country"><Waves size={11} /> Marine Conditions</div>
          </div>
        </div>
        <div className="hero-main">
          <div className="hero-temp-block">
            <div className="hero-temp">
              {hourly.wave_height[0]?.toFixed(1)}
              <span className="hero-temp-unit">m</span>
            </div>
            <div className="hero-condition">Wave Height</div>
            <div className="hero-feels-like">Period: {hourly.wave_period[0]?.toFixed(1)}s</div>
          </div>
          <div className="hero-icon-wrap"><Waves size={80} color="#4fc3f7" /></div>
        </div>
        <div className="hero-bottom">
          <div className="hero-stat">
            <div className="hero-stat-label">Swell</div>
            <div className="hero-stat-value">{hourly.swell_wave_height[0]?.toFixed(1)}m</div>
          </div>
          <div className="hero-stat-divider" />
          <div className="hero-stat">
            <div className="hero-stat-label">Direction</div>
            <div className="hero-stat-value">{Math.round(hourly.wave_direction[0])}°</div>
          </div>
          <div className="hero-stat-divider" />
          <div className="hero-stat">
            <div className="hero-stat-label">Wind Waves</div>
            <div className="hero-stat-value">{hourly.wind_wave_height[0]?.toFixed(1)}m</div>
          </div>
        </div>
      </div>

      {/* Wave chart */}
      <div className="glass-card card-body animate-fade-up delay-1">
        <div className="section-label">Wave Height (24h)</div>
        <div className="chart-wrap">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="waveGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2dd4bf" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#2dd4bf" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="time" tick={{ fontSize: 10 }} interval={3} />
              <YAxis tick={{ fontSize: 10 }} unit="m" />
              <Tooltip content={<ChartTooltip />} />
              <Area type="monotone" dataKey="wave" name="Wave" unit="m"
                stroke="#2dd4bf" strokeWidth={2} fill="url(#waveGrad)" dot={false} />
              <Area type="monotone" dataKey="swell" name="Swell" unit="m"
                stroke="#818cf8" strokeWidth={1.5} fill="none" dot={false} strokeDasharray="4 2" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 7-day marine */}
      <div className="glass-card card-body animate-fade-up delay-2">
        <div className="section-label">7-Day Marine Forecast</div>
        <div className="forecast-list">
          {daily.time.map((date, i) => {
            const waveH = daily.wave_height_max[i];
            const barW = maxWave > 0 ? (waveH / maxWave) * 100 : 0;
            return (
              <div key={i} className="forecast-row">
                <div className={`forecast-day-name ${i === 0 ? 'today' : ''}`}>
                  {i === 0 ? 'Today' : format(parseISO(date), 'EEE')}
                </div>
                <div className="forecast-icon"><Waves size={18} color="#4fc3f7" /></div>
                <div className="forecast-bar-wrap">
                  <div className="forecast-bar-track">
                    <div className="forecast-bar-fill"
                      style={{ width: `${barW}%`, background: 'linear-gradient(90deg,#2dd4bf,#4fc3f7)' }} />
                  </div>
                </div>
                <div className="forecast-temps">
                  <span className="temp-low">{waveH?.toFixed(1)}m</span>
                  <span className="temp-high">{daily.wave_period_max[i]?.toFixed(1)}s</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
