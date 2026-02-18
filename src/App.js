import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Eye, MapPin, Sun, Moon, Cloud,
  CloudRain, CloudSnow, CloudLightning, Gauge, Activity,
  Droplets, Zap, SunMedium, Sunset, Sunrise
} from 'lucide-react';
import axios from 'axios';
import { format } from 'date-fns';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import './App.css';

const GEO_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const WX_URL = 'https://api.open-meteo.com/v1/forecast';
const WX_DESC = {
  0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
  45: 'Foggy', 48: 'Rime fog', 51: 'Light drizzle', 53: 'Drizzle', 55: 'Dense drizzle',
  61: 'Slight rain', 63: 'Moderate rain', 65: 'Heavy rain',
  71: 'Slight snow', 73: 'Moderate snow', 75: 'Heavy snow', 77: 'Snow grains',
  80: 'Rain showers', 81: 'Moderate showers', 82: 'Heavy showers',
  85: 'Snow showers', 86: 'Heavy snow showers', 95: 'Thunderstorm', 96: 'Thunderstorm + hail', 99: 'Heavy thunderstorm'
};

const WxIcon = ({ code, isDay, size = 20 }) => {
  const p = { size, strokeWidth: 1.5 };
  if (code <= 1) return isDay ? <Sun {...p} color="#fbbf24" /> : <Moon {...p} color="#818cf8" />;
  if (code <= 3) return <Cloud {...p} color="#94a3b8" />;
  if (code >= 51 && code <= 67) return <CloudRain {...p} color="#4fc3f7" />;
  if (code >= 71 && code <= 77) return <CloudSnow {...p} color="#e0f2fe" />;
  if (code >= 95) return <CloudLightning {...p} color="#fbbf24" />;
  return <CloudRain {...p} color="#38bdf8" />;
};

const heroGradients = (code, isDay) => {
  if (!isDay) return 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)';
  if (code <= 1) return 'linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%)';
  if (code <= 3) return 'linear-gradient(135deg, #334155 0%, #475569 100%)';
  if (code >= 51 && code <= 82) return 'linear-gradient(135deg, #1e3a8a 0%, #172554 100%)';
  return 'linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%)';
};

export default function App() {
  const [theme, setTheme] = useState('dark');
  const [loc, setLoc] = useState({ name: 'New Delhi', lat: 28.6, lon: 77.2, country: 'India' });
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const [showSearch, setShowSearch] = useState(false);
  const [view, setView] = useState('current');
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const fetchWeather = useCallback(async (lat, lon) => {
    setLoading(true);
    try {
      const { data } = await axios.get(WX_URL, {
        params: {
          latitude: lat, longitude: lon,
          current: 'temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m,pressure_msl,visibility,uv_index',
          hourly: 'temperature_2m,weather_code,is_day,precipitation_probability',
          daily: 'temperature_2m_max,temperature_2m_min,weather_code,sunrise,sunset',
          timezone: 'auto'
        }
      });
      setWeather(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchWeather(loc.lat, loc.lon); }, [loc, fetchWeather]);

  const handleSearch = async (val) => {
    setSearch(val);
    if (val.length < 2) { setResults([]); return; }
    try {
      const { data } = await axios.get(GEO_URL, { params: { name: val, count: 5 } });
      setResults(data.results || []);
    } catch { setResults([]); }
  };

  if (loading && !weather) return (
    <div className="app" style={{ justifyContent: 'center', alignItems: 'center' }}>
      <Activity className="animate-spin" size={48} color="#4fc3f7" />
    </div>
  );

  return (
    <div className="app">
      <div className="aurora-bg">
        <div className="orb" style={{ width: 800, height: 800, background: 'var(--accent-blue)', top: '-20%', left: '-10%' }} />
        <div className="orb" style={{ width: 600, height: 600, background: 'var(--accent-indigo)', bottom: '5%', right: '-5%' }} />
      </div>

      <main className="main-container">
        {/* HEADER */}
        <header className="header">
          <div className="brand-row">
            <div className="brand"><SunMedium size={28} /><span>ATMOS</span></div>
            <button className="round-btn" onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}>
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>

          <div className="search-wrap">
            <Search className="input-icon" size={20} />
            <input
              className="search-input"
              placeholder="Search city..."
              value={search}
              onChange={e => handleSearch(e.target.value)}
              onFocus={() => setShowSearch(true)}
            />
            <AnimatePresence>
              {showSearch && results.length > 0 && (
                <motion.div className="search-dropdown" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  {results.map((r, i) => (
                    <div key={i} className="dropdown-item" onClick={() => { setLoc({ name: r.name, lat: r.latitude, lon: r.longitude, country: r.country }); setShowSearch(false); setSearch(''); }}>
                      <MapPin size={18} />
                      <div><p style={{ fontWeight: 700 }}>{r.name}</p><p style={{ fontSize: 12, opacity: 0.6 }}>{r.country}</p></div>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </header>

        <div className="content-grid">
          {/* LEFT: HERO & TABS */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div className="glass-pane hero-card" style={{ background: heroGradients(weather.current.weather_code, weather.current.is_day) }}>
              <div className="hero-main">
                <div>
                  <h2 className="hero-city">{loc.name}</h2>
                  <p style={{ opacity: 0.8, fontWeight: 500, fontSize: 14 }}>{loc.country} • {format(time, 'HH:mm')}</p>
                </div>
                <WxIcon code={weather.current.weather_code} isDay={weather.current.is_day} size={64} />
              </div>

              <div>
                <h1 className="hero-temp">{Math.round(weather.current.temperature_2m)}°</h1>
                <p style={{ fontSize: '1.2rem', fontWeight: 600 }}>{WX_DESC[weather.current.weather_code]}</p>
                <p style={{ opacity: 0.7, fontSize: 14 }}>Feels like {Math.round(weather.current.apparent_temperature)}°</p>
              </div>

              <div className="hero-stats">
                <div className="hero-stat"><span className="h-stat-label">High</span><span className="h-stat-val">{Math.round(weather.daily.temperature_2m_max[0])}°</span></div>
                <div className="hero-stat"><span className="h-stat-label">Low</span><span className="h-stat-val">{Math.round(weather.daily.temperature_2m_min[0])}°</span></div>
                <div className="hero-stat"><span className="h-stat-label">Humidity</span><span className="h-stat-val">{weather.current.relative_humidity_2m}%</span></div>
                <div className="hero-stat"><span className="h-stat-label">Wind</span><span className="h-stat-val">{Math.round(weather.current.wind_speed_10m)} km/h</span></div>
              </div>
            </div>

            <nav className="nav-tabs">
              {['Current', 'Hourly', '7-Day', 'Details'].map(t => (
                <button key={t} className={`nav-tab ${view === t.toLowerCase() ? 'active' : ''}`} onClick={() => setView(t.toLowerCase())}>{t}</button>
              ))}
            </nav>

            <div className="glass-pane tile-card">
              <h3 className="section-lab">Next 12 Hours</h3>
              <div className="hourly-strip">
                {weather.hourly.time.slice(0, 12).map((t, i) => (
                  <div key={i} className="hour-tile">
                    <span style={{ fontSize: 12, opacity: 0.6 }}>{format(new Date(t), 'HH:mm')}</span>
                    <WxIcon code={weather.hourly.weather_code[i]} isDay={weather.hourly.is_day[i]} />
                    <span style={{ fontWeight: 800 }}>{Math.round(weather.hourly.temperature_2m[i])}°</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT: DETAILS */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {view === 'current' && (
              <div className="detail-tiles">
                {[
                  { lab: 'Pressure', val: weather.current.pressure_msl, unit: ' hPa', icon: <Gauge size={18} /> },
                  { lab: 'Visibility', val: Math.round(weather.current.visibility / 1000), unit: ' km', icon: <Eye size={18} /> },
                  { lab: 'Humidity', val: weather.current.relative_humidity_2m, unit: '%', icon: <Droplets size={18} /> },
                  { lab: 'UV Index', val: weather.current.uv_index, unit: '', icon: <Zap size={18} /> },
                  { lab: 'Sunrise', val: format(new Date(weather.daily.sunrise[0]), 'HH:mm'), unit: '', icon: <Sunrise size={18} /> },
                  { lab: 'Sunset', val: format(new Date(weather.daily.sunset[0]), 'HH:mm'), unit: '', icon: <Sunset size={18} /> },
                ].map((d, i) => (
                  <div key={i} className="glass-pane tile-card">
                    <div className="section-lab" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>{d.icon}<span>{d.lab}</span></div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{d.val}<span style={{ fontSize: 14, fontWeight: 400, opacity: 0.5 }}>{d.unit}</span></div>
                  </div>
                ))}
              </div>
            )}

            {view === '7-day' && (
              <div className="glass-pane tile-card">
                <h3 className="section-lab">7-Day Forecast</h3>
                {weather.daily.time.map((d, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: i < 6 ? '1px solid var(--glass-edge)' : 'none' }}>
                    <span style={{ width: 80, fontWeight: 700 }}>{i === 0 ? 'Today' : format(new Date(d), 'EEE')}</span>
                    <WxIcon code={weather.daily.weather_code[i]} isDay={1} size={28} />
                    <div style={{ fontWeight: 800 }}>{Math.round(weather.daily.temperature_2m_max[i])}° <span style={{ opacity: 0.4, fontWeight: 400 }}>{Math.round(weather.daily.temperature_2m_min[i])}°</span></div>
                  </div>
                ))}
              </div>
            )}

            {(view === 'hourly' || view === 'details') && (
              <div className="glass-pane tile-card">
                <h3 className="section-lab">24-Hour Trend</h3>
                <div className="chart-box">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={weather.hourly.time.slice(0, 24).map((t, i) => ({ time: format(new Date(t), 'HH'), temp: weather.hourly.temperature_2m[i] }))}>
                      <defs><linearGradient id="grad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="var(--accent-blue)" stopOpacity={0.3} /><stop offset="95%" stopColor="var(--accent-blue)" stopOpacity={0} /></linearGradient></defs>
                      <CartesianGrid strokeOpacity={0.05} vertical={false} />
                      <XAxis dataKey="time" hide />
                      <YAxis hide domain={['dataMin - 2', 'dataMax + 2']} />
                      <Tooltip cursor={false} contentStyle={{ background: 'var(--bg-deep)', border: 'none', borderRadius: 16, boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }} />
                      <Area type="monotone" dataKey="temp" stroke="var(--accent-blue)" fillOpacity={1} fill="url(#grad)" strokeWidth={3} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        </div>

        <footer className="footer">© 2026 ATMOS WEATHER • PRECISION FORECASTS</footer>
      </main>
    </div>
  );
}
