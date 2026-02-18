import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, MapPin, Sun, Moon, Cloud,
  CloudRain, CloudSnow, CloudLightning, Gauge, Eye,
  Droplets, Zap, SunMedium, Sunset, Sunrise, Wind,
  Thermometer, Navigation, AlertTriangle, RefreshCw, X
} from 'lucide-react';
import axios from 'axios';
import { format, startOfHour } from 'date-fns';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, LineChart, Line
} from 'recharts';
import './App.css';

// ─── API ENDPOINTS ────────────────────────────────────────────────────────────
const GEO_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const WX_URL = 'https://api.open-meteo.com/v1/forecast';

// ─── WEATHER CODE MAP ─────────────────────────────────────────────────────────
const WX_MAP = {
  0: { t: 'Clear Skies', c: '#fbbf24', i: Sun },
  1: { t: 'Mainly Clear', c: '#fbbf24', i: SunMedium },
  2: { t: 'Partly Cloudy', c: '#94a3b8', i: Cloud },
  3: { t: 'Overcast', c: '#64748b', i: Cloud },
  45: { t: 'Foggy', c: '#94a3b8', i: Cloud },
  48: { t: 'Icy Fog', c: '#94a3b8', i: Cloud },
  51: { t: 'Light Drizzle', c: '#38bdf8', i: CloudRain },
  53: { t: 'Drizzle', c: '#38bdf8', i: CloudRain },
  55: { t: 'Heavy Drizzle', c: '#0ea5e9', i: CloudRain },
  61: { t: 'Light Rain', c: '#0ea5e9', i: CloudRain },
  63: { t: 'Rain', c: '#0ea5e9', i: CloudRain },
  65: { t: 'Heavy Rain', c: '#0284c7', i: CloudRain },
  71: { t: 'Light Snow', c: '#e2e8f0', i: CloudSnow },
  73: { t: 'Snow', c: '#e2e8f0', i: CloudSnow },
  75: { t: 'Heavy Snow', c: '#cbd5e1', i: CloudSnow },
  77: { t: 'Snow Grains', c: '#e2e8f0', i: CloudSnow },
  80: { t: 'Rain Showers', c: '#0ea5e9', i: CloudRain },
  81: { t: 'Rain Showers', c: '#0ea5e9', i: CloudRain },
  82: { t: 'Heavy Showers', c: '#0284c7', i: CloudRain },
  85: { t: 'Snow Showers', c: '#e2e8f0', i: CloudSnow },
  86: { t: 'Heavy Snow Showers', c: '#cbd5e1', i: CloudSnow },
  95: { t: 'Thunderstorm', c: '#fbbf24', i: CloudLightning },
  96: { t: 'Thunderstorm+Hail', c: '#fbbf24', i: CloudLightning },
  99: { t: 'Severe Thunderstorm', c: '#f59e0b', i: CloudLightning },
};

const getWx = (code) => WX_MAP[code] ?? WX_MAP[2];

// ─── WEATHER ICON ─────────────────────────────────────────────────────────────
const WxIcon = ({ code, isDay, size = 24 }) => {
  const cfg = getWx(code);
  const nightMode = !isDay && code <= 1;
  const Icon = nightMode ? Moon : cfg.i;
  const color = nightMode ? '#818cf8' : cfg.c;
  return <Icon size={size} color={color} strokeWidth={1.5} aria-hidden="true" />;
};

// ─── UV INDEX LABEL ───────────────────────────────────────────────────────────
const uvLabel = (uv) => {
  if (uv == null) return 'N/A';
  if (uv <= 2) return 'Low';
  if (uv <= 5) return 'Moderate';
  if (uv <= 7) return 'High';
  if (uv <= 10) return 'Very High';
  return 'Extreme';
};

// ─── CUSTOM TOOLTIP ───────────────────────────────────────────────────────────
const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <p className="chart-tooltip-label">{label}:00</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>
          {p.name}: <strong>{Math.round(p.value)}{p.name === 'Temp' ? '°' : '%'}</strong>
        </p>
      ))}
    </div>
  );
};

// ─── LOADING SPINNER ──────────────────────────────────────────────────────────
const Spinner = () => (
  <div className="spinner-ring" aria-label="Loading weather data" role="status">
    <div /><div /><div /><div />
  </div>
);

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [theme, setTheme] = useState(() =>
    window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  );
  const [loc, setLoc] = useState({ name: 'New Delhi', lat: 28.61, lon: 77.21, country: 'India' });
  const [wx, setWx] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState('');
  const [hits, setHits] = useState([]);
  const [open, setOpen] = useState(false);
  const [view, setView] = useState('current');
  const [now, setNow] = useState(new Date());
  const [geoLoading, setGeoLoading] = useState(false);

  const searchRef = useRef(null);
  const inputRef = useRef(null);

  // ── Clock ──
  useEffect(() => {
    const tic = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(tic);
  }, []);

  // ── Theme ──
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // ── Close dropdown on outside click ──
  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Fetch Weather ──
  const fetchWx = useCallback(async (lat, lon) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await axios.get(WX_URL, {
        params: {
          latitude: lat,
          longitude: lon,
          current: 'temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m,wind_direction_10m,pressure_msl,visibility,uv_index',
          hourly: 'temperature_2m,weather_code,is_day,precipitation_probability,wind_speed_10m',
          daily: 'temperature_2m_max,temperature_2m_min,weather_code,sunrise,sunset,precipitation_sum,uv_index_max',
          timezone: 'auto',
          forecast_days: 7,
        },
      });
      setWx(data);
    } catch (e) {
      console.error('Weather fetch failed:', e);
      setError('Unable to fetch weather data. Please check your connection and try again.');
    } finally {
      setTimeout(() => setLoading(false), 600);
    }
  }, []);

  useEffect(() => { fetchWx(loc.lat, loc.lon); }, [loc, fetchWx]);

  // ── Geolocation ──
  const handleGeolocate = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lon } = pos.coords;
        try {
          const { data } = await axios.get(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
            { headers: { 'Accept-Language': 'en' } }
          );
          const name = data.address.city || data.address.town || data.address.village || 'My Location';
          const country = data.address.country || '';
          setLoc({ name, country, lat, lon });
        } catch {
          setLoc({ name: 'My Location', country: '', lat, lon });
        } finally {
          setGeoLoading(false);
        }
      },
      () => {
        setGeoLoading(false);
        setError('Location access denied. Please search for your city manually.');
      },
      { timeout: 10000 }
    );
  };

  // ── City Search ──
  const searchTimer = useRef(null);
  const onSearch = (v) => {
    setQuery(v);
    clearTimeout(searchTimer.current);
    if (v.length < 2) { setHits([]); return; }
    searchTimer.current = setTimeout(async () => {
      try {
        const { data } = await axios.get(GEO_URL, { params: { name: v, count: 6, language: 'en' } });
        setHits(data.results || []);
      } catch { setHits([]); }
    }, 300);
  };

  const selectCity = (h) => {
    setLoc({ name: h.name, lat: h.latitude, lon: h.longitude, country: h.country });
    setOpen(false);
    setQuery('');
    setHits([]);
  };

  // ── Dynamic background based on weather ──
  const bgStyle = useMemo(() => {
    if (!wx) return {};
    const { weather_code: c, is_day: d } = wx.current;
    if (!d) return { background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)' };
    if (c <= 1) return { background: 'linear-gradient(135deg, #0c4a6e 0%, #0369a1 50%, #0ea5e9 100%)' };
    if (c <= 3) return { background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)' };
    if (c >= 51 && c <= 67) return { background: 'linear-gradient(135deg, #1e3a5f 0%, #1e293b 100%)' };
    if (c >= 71 && c <= 77) return { background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)' };
    if (c >= 95) return { background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)' };
    return { background: 'linear-gradient(135deg, #334155 0%, #1e293b 100%)' };
  }, [wx]);

  // ── Hourly data starting from current hour ──
  const currentHourIndex = useMemo(() => {
    if (!wx) return 0;
    const nowHour = startOfHour(now).toISOString().slice(0, 13);
    const idx = wx.hourly.time.findIndex(t => t.startsWith(nowHour));
    return idx >= 0 ? idx : 0;
  }, [wx, now]);

  const hourlyData = useMemo(() => {
    if (!wx) return [];
    const start = currentHourIndex;
    return wx.hourly.time.slice(start, start + 24).map((t, i) => ({
      time: format(new Date(t), 'HH'),
      temp: Math.round(wx.hourly.temperature_2m[start + i]),
      rain: wx.hourly.precipitation_probability[start + i] ?? 0,
      wind: Math.round(wx.hourly.wind_speed_10m[start + i] ?? 0),
      code: wx.hourly.weather_code[start + i],
      isDay: wx.hourly.is_day[start + i],
    }));
  }, [wx, currentHourIndex]);

  // ── Wind direction compass ──
  const windDir = (deg) => {
    const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    return dirs[Math.round(deg / 45) % 8];
  };

  // ─── LOADING STATE ──────────────────────────────────────────────────────────
  if (loading && !wx) {
    return (
      <div className="app splash">
        <div className="aurora" aria-hidden="true">
          <div className="orb orb-1" />
          <div className="orb orb-2" />
        </div>
        <div className="splash-inner">
          <div className="splash-logo">
            <Sun size={40} strokeWidth={2} color="#38bdf8" />
            <span>ATMOS</span>
          </div>
          <Spinner />
          <p className="splash-text">Fetching weather intelligence…</p>
        </div>
      </div>
    );
  }

  // ─── ERROR STATE ────────────────────────────────────────────────────────────
  if (error && !wx) {
    return (
      <div className="app splash">
        <div className="aurora" aria-hidden="true">
          <div className="orb orb-1" />
          <div className="orb orb-2" />
        </div>
        <div className="splash-inner">
          <AlertTriangle size={48} color="#f59e0b" />
          <p className="error-title">Connection Error</p>
          <p className="error-msg">{error}</p>
          <button className="retry-btn" onClick={() => fetchWx(loc.lat, loc.lon)}>
            <RefreshCw size={16} /> Retry
          </button>
        </div>
      </div>
    );
  }

  const cur = wx?.current || {};
  const daily = wx?.daily || {};

  // ─── MAIN APP ───────────────────────────────────────────────────────────────
  return (
    <div className="app">
      {/* Aurora background */}
      <div className="aurora" aria-hidden="true">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
      </div>

      {/* Error banner (non-fatal) */}
      <AnimatePresence>
        {error && (
          <motion.div
            className="error-banner"
            initial={{ y: -60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -60, opacity: 0 }}
          >
            <AlertTriangle size={16} />
            <span>{error}</span>
            <button onClick={() => setError(null)} aria-label="Dismiss error">
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="main-content">
        {/* ── LEFT COLUMN ─────────────────────────────────────────────────── */}
        <section className="left-col">
          {/* Header */}
          <header className="nav-header">
            <div className="logo" aria-label="Atmos Weather">
              <Sun size={28} strokeWidth={2.5} color="#38bdf8" aria-hidden="true" />
              <span>ATMOS</span>
            </div>
            <div className="header-actions">
              <button
                className="btn-round"
                onClick={handleGeolocate}
                aria-label="Use my location"
                title="Use my location"
                disabled={geoLoading}
              >
                <Navigation size={18} className={geoLoading ? 'spin' : ''} />
              </button>
              <button
                className="btn-round"
                onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
                aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                title="Toggle theme"
              >
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              </button>
            </div>
          </header>

          {/* Search */}
          <div className="search-box" ref={searchRef}>
            <Search className="search-icon" size={18} aria-hidden="true" />
            <input
              ref={inputRef}
              className="search-input"
              placeholder="Search city…"
              value={query}
              onChange={e => onSearch(e.target.value)}
              onFocus={() => hits.length > 0 && setOpen(true)}
              aria-label="Search for a city"
              aria-autocomplete="list"
              autoComplete="off"
              spellCheck="false"
            />
            {query && (
              <button
                className="search-clear"
                onClick={() => { setQuery(''); setHits([]); setOpen(false); inputRef.current?.focus(); }}
                aria-label="Clear search"
              >
                <X size={16} />
              </button>
            )}
            <AnimatePresence>
              {open && hits.length > 0 && (
                <motion.ul
                  className="dropdown"
                  role="listbox"
                  aria-label="City suggestions"
                  initial={{ opacity: 0, y: -8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.98 }}
                  transition={{ duration: 0.15 }}
                >
                  {hits.map((h, i) => (
                    <li
                      key={`${h.name}-${h.latitude}-${i}`}
                      role="option"
                      aria-selected={false}
                      className="dropdown-item"
                      onClick={() => selectCity(h)}
                      onKeyDown={e => e.key === 'Enter' && selectCity(h)}
                      tabIndex={0}
                    >
                      <MapPin size={14} aria-hidden="true" />
                      <div>
                        <p className="city-name">{h.name}{h.admin1 ? `, ${h.admin1}` : ''}</p>
                        <p className="city-country">{h.country}</p>
                      </div>
                    </li>
                  ))}
                </motion.ul>
              )}
            </AnimatePresence>
          </div>

          {/* Hero Panel */}
          <motion.div
            className="panel hero"
            style={bgStyle}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="hero-location">
              <MapPin size={13} aria-hidden="true" />
              <span>{loc.name}{loc.country ? `, ${loc.country}` : ''}</span>
            </div>

            <div className="hero-main">
              <div className="hero-left">
                <h1 className="temp-hero" aria-label={`${Math.round(cur.temperature_2m ?? 0)} degrees`}>
                  {Math.round(cur.temperature_2m ?? 0)}°
                </h1>
                <p className="condition-text">{getWx(cur.weather_code).t}</p>
                <p className="feels-like">Feels like {Math.round(cur.apparent_temperature ?? 0)}°</p>
                <time className="datetime" dateTime={now.toISOString()}>
                  {format(now, 'EEEE, dd MMMM')}
                  <span className="time-sep">•</span>
                  <span className="clock">{format(now, 'HH:mm:ss')}</span>
                </time>
              </div>
              <div className="hero-right" aria-hidden="true">
                <WxIcon code={cur.weather_code} isDay={cur.is_day} size={96} />
              </div>
            </div>

            <div className="hero-stats">
              <div className="h-stat">
                <p className="h-stat-label">High</p>
                <p className="h-stat-value">{Math.round(daily.temperature_2m_max?.[0] ?? 0)}°</p>
              </div>
              <div className="h-stat">
                <p className="h-stat-label">Low</p>
                <p className="h-stat-value">{Math.round(daily.temperature_2m_min?.[0] ?? 0)}°</p>
              </div>
              <div className="h-stat">
                <p className="h-stat-label">Humidity</p>
                <p className="h-stat-value">{cur.relative_humidity_2m ?? '--'}%</p>
              </div>
              <div className="h-stat">
                <p className="h-stat-label">Wind</p>
                <p className="h-stat-value">
                  {Math.round(cur.wind_speed_10m ?? 0)}
                  <small> km/h</small>
                </p>
              </div>
            </div>
          </motion.div>

          {/* Hourly Rail */}
          <div className="panel" style={{ padding: '24px' }}>
            <h2 className="label-sm">Next 24 Hours</h2>
            <div className="hourly-rail" role="list" aria-label="Hourly forecast">
              {hourlyData.map((h, i) => (
                <div key={`hour-${i}`} className="hour-card" role="listitem">
                  <span className="hour-time">{i === 0 ? 'Now' : `${h.time}:00`}</span>
                  <WxIcon code={h.code} isDay={h.isDay} size={28} />
                  <span className="hour-temp">{h.temp}°</span>
                  <span className="hour-rain" title="Precipitation probability">
                    <Droplets size={10} /> {h.rain}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── RIGHT COLUMN ────────────────────────────────────────────────── */}
        <section className="right-col">
          {/* Tab Nav */}
          <nav className="tabs" role="tablist" aria-label="Weather views">
            {[
              { id: 'current', label: 'Current' },
              { id: 'hourly', label: 'Hourly' },
              { id: '7-day', label: '7-Day' },
              { id: 'details', label: 'Details' },
            ].map(({ id, label }) => (
              <button
                key={id}
                role="tab"
                aria-selected={view === id}
                aria-controls={`panel-${id}`}
                className={`tab-btn ${view === id ? 'active' : ''}`}
                onClick={() => setView(id)}
              >
                {label}
              </button>
            ))}
          </nav>

          <AnimatePresence mode="wait">
            {/* CURRENT TAB */}
            {view === 'current' && (
              <motion.div
                id="panel-current"
                key="cur"
                role="tabpanel"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25 }}
                className="detail-grid"
              >
                {[
                  {
                    l: 'Pressure',
                    v: `${Math.round(cur.pressure_msl ?? 0)}`,
                    u: 'hPa',
                    i: <Gauge size={20} />,
                    sub: (cur.pressure_msl ?? 1013) > 1013 ? 'High pressure' : 'Low pressure',
                  },
                  {
                    l: 'Visibility',
                    v: `${((cur.visibility ?? 0) / 1000).toFixed(1)}`,
                    u: 'km',
                    i: <Eye size={20} />,
                    sub: (cur.visibility ?? 0) >= 10000 ? 'Clear' : 'Reduced',
                  },
                  {
                    l: 'Humidity',
                    v: `${cur.relative_humidity_2m ?? '--'}`,
                    u: '%',
                    i: <Droplets size={20} />,
                    sub: (() => {
                      const h = cur.relative_humidity_2m ?? 50;
                      return h < 30 ? 'Dry' : h < 60 ? 'Comfortable' : 'Humid';
                    })(),
                  },
                  {
                    l: 'UV Index',
                    v: cur.uv_index != null ? cur.uv_index.toFixed(1) : '--',
                    u: '',
                    i: <Zap size={20} />,
                    sub: uvLabel(cur.uv_index),
                  },
                  {
                    l: 'Wind',
                    v: `${Math.round(cur.wind_speed_10m ?? 0)}`,
                    u: 'km/h',
                    i: <Wind size={20} />,
                    sub: cur.wind_direction_10m != null
                      ? `From ${windDir(cur.wind_direction_10m)}`
                      : 'Calm',
                  },
                  {
                    l: 'Feels Like',
                    v: `${Math.round(cur.apparent_temperature ?? 0)}`,
                    u: '°C',
                    i: <Thermometer size={20} />,
                    sub: (() => {
                      const diff = (cur.apparent_temperature ?? 0) - (cur.temperature_2m ?? 0);
                      if (diff <= -3) return 'Colder than actual';
                      if (diff >= 3) return 'Warmer than actual';
                      return 'Same as actual';
                    })(),
                  },
                  {
                    l: 'Sunrise',
                    v: daily.sunrise?.[0] ? format(new Date(daily.sunrise[0]), 'HH:mm') : '--:--',
                    u: '',
                    i: <Sunrise size={20} />,
                    sub: 'Golden hour',
                  },
                  {
                    l: 'Sunset',
                    v: daily.sunset?.[0] ? format(new Date(daily.sunset[0]), 'HH:mm') : '--:--',
                    u: '',
                    i: <Sunset size={20} />,
                    sub: 'Blue hour',
                  },
                ].map((d, i) => (
                  <motion.div
                    key={d.l}
                    className="panel tile"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.04 }}
                  >
                    <div className="tile-head">
                      <span className="tile-icon">{d.i}</span>
                      <span>{d.l}</span>
                    </div>
                    <div className="tile-body">
                      {d.v}<span className="tile-unit">{d.u}</span>
                    </div>
                    {d.sub && <p className="tile-sub">{d.sub}</p>}
                  </motion.div>
                ))}
              </motion.div>
            )}

            {/* HOURLY TAB */}
            {view === 'hourly' && (
              <motion.div
                id="panel-hourly"
                key="hourly"
                role="tabpanel"
                className="panel chart-panel"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
              >
                <h2 className="label-sm">24-Hour Temperature & Rain Chance</h2>
                <div className="chart-wrap">
                  <ResponsiveContainer width="100%" height={240}>
                    <AreaChart data={hourlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="gradTemp" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0EA5E9" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#0EA5E9" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="gradRain" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeOpacity={0.06} vertical={false} />
                      <XAxis
                        dataKey="time"
                        tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                        interval={3}
                        tickFormatter={v => `${v}:00`}
                      />
                      <YAxis
                        yAxisId="temp"
                        hide
                        domain={['dataMin - 3', 'dataMax + 3']}
                      />
                      <YAxis
                        yAxisId="rain"
                        orientation="right"
                        hide
                        domain={[0, 100]}
                      />
                      <Tooltip content={<ChartTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }} />
                      <Area
                        yAxisId="temp"
                        type="monotone"
                        dataKey="temp"
                        name="Temp"
                        stroke="#0EA5E9"
                        fill="url(#gradTemp)"
                        strokeWidth={2.5}
                        dot={false}
                        activeDot={{ r: 4, fill: '#0EA5E9' }}
                      />
                      <Area
                        yAxisId="rain"
                        type="monotone"
                        dataKey="rain"
                        name="Rain"
                        stroke="#818cf8"
                        fill="url(#gradRain)"
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4, fill: '#818cf8' }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <h2 className="label-sm" style={{ marginTop: 24 }}>Hourly Wind Speed</h2>
                <div className="chart-wrap">
                  <ResponsiveContainer width="100%" height={160}>
                    <LineChart data={hourlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeOpacity={0.06} vertical={false} />
                      <XAxis
                        dataKey="time"
                        tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                        interval={3}
                        tickFormatter={v => `${v}:00`}
                      />
                      <YAxis hide domain={['dataMin - 2', 'dataMax + 2']} />
                      <Tooltip
                        contentStyle={{
                          background: 'var(--bg-surface)',
                          border: '1px solid var(--glass-stroke)',
                          borderRadius: 12,
                          fontSize: 12,
                        }}
                        formatter={v => [`${v} km/h`, 'Wind']}
                        labelFormatter={l => `${l}:00`}
                        cursor={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="wind"
                        stroke="#f59e0b"
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4, fill: '#f59e0b' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>
            )}

            {/* 7-DAY TAB */}
            {view === '7-day' && (
              <motion.div
                id="panel-7-day"
                key="7d"
                role="tabpanel"
                className="panel"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
              >
                <h2 className="label-sm">7-Day Forecast</h2>
                <div className="forecast-list" role="list">
                  {(daily.time || []).map((d, i) => (
                    <div key={d} className="forecast-row" role="listitem">
                      <span className="forecast-day">
                        {i === 0 ? 'Today' : format(new Date(d + 'T12:00:00'), 'EEE, MMM d')}
                      </span>
                      <div className="forecast-icon">
                        <WxIcon code={daily.weather_code?.[i]} isDay={1} size={22} />
                      </div>
                      <div className="forecast-condition">
                        <span className="forecast-cond-text">{getWx(daily.weather_code?.[i]).t}</span>
                        {(daily.precipitation_sum?.[i] ?? 0) > 0 && (
                          <span className="forecast-precip">
                            <Droplets size={10} /> {daily.precipitation_sum[i].toFixed(1)} mm
                          </span>
                        )}
                      </div>
                      <div className="forecast-temps">
                        <span className="forecast-max">{Math.round(daily.temperature_2m_max?.[i] ?? 0)}°</span>
                        <span className="forecast-min">{Math.round(daily.temperature_2m_min?.[i] ?? 0)}°</span>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* DETAILS TAB */}
            {view === 'details' && (
              <motion.div
                id="panel-details"
                key="details"
                role="tabpanel"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
                style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
              >
                {/* Sun & Moon */}
                <div className="panel">
                  <h2 className="label-sm">Sun & Moon</h2>
                  <div className="sun-arc-wrap">
                    <div className="sun-times">
                      <div className="sun-time-item">
                        <Sunrise size={24} color="#fbbf24" aria-hidden="true" />
                        <div>
                          <p className="sun-label">Sunrise</p>
                          <p className="sun-value">
                            {daily.sunrise?.[0] ? format(new Date(daily.sunrise[0]), 'HH:mm') : '--:--'}
                          </p>
                        </div>
                      </div>
                      <div className="sun-time-item">
                        <Sunset size={24} color="#f97316" aria-hidden="true" />
                        <div>
                          <p className="sun-label">Sunset</p>
                          <p className="sun-value">
                            {daily.sunset?.[0] ? format(new Date(daily.sunset[0]), 'HH:mm') : '--:--'}
                          </p>
                        </div>
                      </div>
                    </div>
                    {/* Day length */}
                    {daily.sunrise?.[0] && daily.sunset?.[0] && (() => {
                      const srMs = new Date(daily.sunrise[0]).getTime();
                      const ssMs = new Date(daily.sunset[0]).getTime();
                      const hrs = Math.floor((ssMs - srMs) / 3600000);
                      const mins = Math.floor(((ssMs - srMs) % 3600000) / 60000);
                      const pct = Math.min(100, ((now - srMs) / (ssMs - srMs)) * 100);
                      return (
                        <div className="daylight-bar-wrap">
                          <div className="daylight-bar">
                            <div className="daylight-progress" style={{ width: `${Math.max(0, pct)}%` }}>
                              <div className="sun-dot" />
                            </div>
                          </div>
                          <p className="daylight-label">Daylight: {hrs}h {mins}m</p>
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* Weekly UV Max */}
                <div className="panel">
                  <h2 className="label-sm">UV Index — 7-Day Peak</h2>
                  <div className="uv-list">
                    {(daily.time || []).map((d, i) => {
                      const uv = daily.uv_index_max?.[i] ?? 0;
                      const pct = Math.min(100, (uv / 11) * 100);
                      return (
                        <div key={d} className="uv-row">
                          <span className="uv-day">
                            {i === 0 ? 'Today' : format(new Date(d + 'T12:00:00'), 'EEE')}
                          </span>
                          <div className="uv-bar-track">
                            <div
                              className="uv-bar-fill"
                              style={{
                                width: `${pct}%`,
                                background: uv <= 2 ? '#22c55e'
                                  : uv <= 5 ? '#eab308'
                                    : uv <= 7 ? '#f97316'
                                      : uv <= 10 ? '#ef4444'
                                        : '#9333ea',
                              }}
                            />
                          </div>
                          <span className="uv-val">{uv.toFixed(1)}</span>
                          <span className="uv-label-text">{uvLabel(uv)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Weekly Precipitation */}
                <div className="panel">
                  <h2 className="label-sm">Weekly Precipitation (mm)</h2>
                  <div className="chart-wrap">
                    <ResponsiveContainer width="100%" height={160}>
                      <AreaChart
                        data={(daily.time || []).map((d, i) => ({
                          day: i === 0 ? 'Today' : format(new Date(d + 'T12:00:00'), 'EEE'),
                          rain: daily.precipitation_sum?.[i] ?? 0,
                        }))}
                        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient id="gradPrecip" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#818cf8" stopOpacity={0.5} />
                            <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeOpacity={0.06} vertical={false} />
                        <XAxis
                          dataKey="day"
                          tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis hide domain={[0, 'dataMax + 5']} />
                        <Tooltip
                          contentStyle={{
                            background: 'var(--bg-surface)',
                            border: '1px solid var(--glass-stroke)',
                            borderRadius: 12,
                            fontSize: 12,
                          }}
                          formatter={v => [`${v.toFixed(1)} mm`, 'Precipitation']}
                          cursor={false}
                        />
                        <Area
                          type="monotone"
                          dataKey="rain"
                          stroke="#818cf8"
                          fill="url(#gradPrecip)"
                          strokeWidth={2.5}
                          dot={{ fill: '#818cf8', strokeWidth: 0, r: 3 }}
                          activeDot={{ r: 5, fill: '#818cf8' }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </main>

      <footer className="footer">
        <p>© 2026 ATMOS WEATHER ENGINE · Powered by Open-Meteo · Live Data</p>
      </footer>
    </div>
  );
}
