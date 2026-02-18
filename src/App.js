import React, { useState, useEffect, useCallback, useMemo } from 'react';
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

const WX_THEMES = {
  0: { desc: 'Clear Skies', color: '#fbbf24', icon: Sun },
  1: { desc: 'Mainly Clear', color: '#fbbf24', icon: SunMedium },
  2: { desc: 'Partly Cloudy', color: '#94a3b8', icon: Cloud },
  3: { desc: 'Overcast', color: '#64748b', icon: Cloud },
  45: { desc: 'Foggy', color: '#94a3b8', icon: Activity },
  51: { desc: 'Light Drizzle', color: '#38bdf8', icon: CloudRain },
  61: { desc: 'Rainy', color: '#0ea5e9', icon: CloudRain },
  71: { desc: 'Snowy', color: '#e2e8f0', icon: CloudSnow },
  95: { desc: 'Thunderstorm', color: '#fbbf24', icon: CloudLightning },
};

const WxIcon = ({ code, isDay, size = 24 }) => {
  const meta = WX_THEMES[code] || WX_THEMES[2];
  const Icon = meta.icon;
  const color = !isDay && (code <= 1) ? '#818cf8' : meta.color;
  const FinalIcon = !isDay && (code <= 1) ? Moon : Icon;
  return <FinalIcon size={size} color={color} strokeWidth={1.5} />;
};

export default function App() {
  const [theme, setTheme] = useState('dark');
  const [loc, setLoc] = useState({ name: 'New Delhi', lat: 28.61, lon: 77.21, country: 'India' });
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
          current: 'temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m,wind_direction_10m,pressure_msl,visibility,uv_index',
          hourly: 'temperature_2m,weather_code,is_day,precipitation_probability',
          daily: 'temperature_2m_max,temperature_2m_min,weather_code,sunrise,sunset,uv_index_max',
          timezone: 'auto'
        }
      });
      setWeather(data);
    } catch (e) {
      console.error("API Error", e);
    } finally {
      setTimeout(() => setLoading(false), 800);
    }
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

  const getHeroGradient = useMemo(() => {
    if (!weather) return '';
    const code = weather.current.weather_code;
    const isDay = weather.current.is_day;
    if (!isDay) return 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)';
    if (code <= 1) return 'linear-gradient(135deg, #0369a1 0%, #075985 100%)';
    if (code <= 3) return 'linear-gradient(135deg, #334155 0%, #1e293b 100%)';
    return 'linear-gradient(135deg, #1e3a8a 0%, #1e293b 100%)';
  }, [weather]);

  if (loading && !weather) return (
    <div className="loader-screen">
      <SunMedium className="animate-pulse" size={48} color="#fff" />
      <div className="loading-bar"><div className="loading-bar-fill" /></div>
    </div>
  );

  return (
    <div className="app-shell">
      <div className="aurora-mesh">
        <div className="mesh-orb" style={{ background: 'hsla(210, 100%, 50%, 0.3)', top: '-10%', left: '-10%' }} />
        <div className="mesh-orb" style={{ background: 'hsla(260, 100%, 60%, 0.2)', bottom: '10%', right: '-5%' }} />
        <div className="mesh-orb" style={{ background: 'hsla(180, 100%, 40%, 0.1)', top: '40%', right: '20%' }} />
      </div>

      <main className="main-wrapper">
        {/* HEADER */}
        <header className="header-bar">
          <div className="brand-logo"><SunMedium size={32} strokeWidth={2.5} /> ATMOS</div>

          <div className="search-container">
            <Search className="search-field-icon" size={20} />
            <input
              className="search-field"
              placeholder="Search major cities..."
              value={search}
              onChange={e => handleSearch(e.target.value)}
              onFocus={() => setShowSearch(true)}
            />
            <AnimatePresence>
              {showSearch && results.length > 0 && (
                <motion.div className="dropdown" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
                  {results.map((r, i) => (
                    <div key={i} className="drop-item" onClick={() => { setLoc({ name: r.name, lat: r.latitude, lon: r.longitude, country: r.country }); setShowSearch(false); setSearch(''); }}>
                      <MapPin size={18} color="#94a3b8" />
                      <div><p style={{ fontWeight: 700 }}>{r.name}</p><p style={{ fontSize: 12, opacity: 0.6 }}>{r.country} • {r.admin1}</p></div>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="action-group" style={{ display: 'flex', gap: 10 }}>
            <button className="action-btn" onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}>
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>
        </header>

        <section className="dashboard-grid">
          {/* PRIMARY COLUMN */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <motion.div
              className="glass-panel hero-v2"
              style={{ background: getHeroGradient }}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, opacity: 0.8 }}>
                  <MapPin size={14} /> <span style={{ fontWeight: 600 }}>{loc.name}, {loc.country}</span>
                </div>
                <h1 className="hero-temp-hero">{Math.round(weather.current.temperature_2m)}°</h1>
                <p style={{ fontSize: '1.5rem', fontWeight: 600, opacity: 0.9 }}>
                  {(WX_THEMES[weather.current.weather_code] || WX_THEMES[2]).desc}
                </p>
                <p style={{ opacity: 0.6, fontSize: 14 }}>{format(time, 'EEEE, dd MMMM • HH:mm:ss')}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <WxIcon code={weather.current.weather_code} isDay={weather.current.is_day} size={120} />
                <p style={{ marginTop: 12, fontWeight: 700, fontSize: 18 }}>Feels like {Math.round(weather.current.apparent_temperature)}°</p>
              </div>
            </motion.div>

            <div className="stat-grid">
              <div className="glass-panel stat-tile">
                <span className="stat-label">Humidity</span>
                <span className="stat-value">{weather.current.relative_humidity_2m}%</span>
              </div>
              <div className="glass-panel stat-tile">
                <span className="stat-label">UV Index</span>
                <span className="stat-value">{weather.current.uv_index.toFixed(1)}</span>
              </div>
              <div className="glass-panel stat-tile">
                <span className="stat-label">Wind</span>
                <span className="stat-value">{Math.round(weather.current.wind_speed_10m)} <small style={{ fontSize: 10 }}>km/h</small></span>
              </div>
              <div className="glass-panel stat-tile">
                <span className="stat-label">Pressure</span>
                <span className="stat-value">{Math.round(weather.current.pressure_msl)} <small style={{ fontSize: 10 }}>hPa</small></span>
              </div>
            </div>

            <div className="glass-panel">
              <h3 className="stat-label" style={{ marginBottom: 16 }}>Next 24 Hours</h3>
              <div className="hourly-rail">
                {weather.hourly.time.slice(0, 24).map((t, i) => (
                  <div key={i} className="hour-node">
                    <span style={{ fontSize: 12, opacity: 0.6 }}>{format(new Date(t), 'HH:mm')}</span>
                    <WxIcon code={weather.hourly.weather_code[i]} isDay={weather.hourly.is_day[i]} size={32} />
                    <span style={{ fontWeight: 800, fontSize: 16 }}>{Math.round(weather.hourly.temperature_2m[i])}°</span>
                    <span style={{ fontSize: 10, color: 'var(--accent-blue)' }}>{weather.hourly.precipitation_probability[i]}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* SECONDARY COLUMN */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div className="glass-panel" style={{ height: '100%' }}>
              <h3 className="stat-label" style={{ marginBottom: 24 }}>7-Day Forecast</h3>
              <div className="forecast-strip">
                {weather.daily.time.map((d, i) => (
                  <motion.div
                    key={i}
                    className="forecast-item"
                    initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <span style={{ fontWeight: 700 }}>{i === 0 ? 'Today' : format(new Date(d), 'EEEE')}</span>
                    <WxIcon code={weather.daily.weather_code[i]} isDay={1} size={24} />
                    <div style={{ height: 4, background: 'rgba(255,255,255,0.05)', borderRadius: 2, margin: '0 16px', position: 'relative' }}>
                      <div style={{ position: 'absolute', left: '20%', right: '20%', top: 0, bottom: 0, background: 'var(--accent-base)', borderRadius: 2, opacity: 0.5 }} />
                    </div>
                    <div style={{ textAlign: 'right', fontWeight: 800 }}>
                      {Math.round(weather.daily.temperature_2m_max[i])}°
                      <span style={{ opacity: 0.4, fontWeight: 400, marginLeft: 8 }}>{Math.round(weather.daily.temperature_2m_min[i])}°</span>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="chart-container" style={{ marginTop: 40 }}>
                <h3 className="stat-label" style={{ marginBottom: 16 }}>Temperature Trend</h3>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={weather.hourly.time.slice(0, 24).map((t, i) => ({ time: format(new Date(t), 'HH'), temp: weather.hourly.temperature_2m[i] }))}>
                    <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#4fc3f7" stopOpacity={0.3} /><stop offset="95%" stopColor="#4fc3f7" stopOpacity={0} /></linearGradient></defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                    <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                    <YAxis hide domain={['dataMin - 2', 'dataMax + 2']} />
                    <Tooltip cursor={{ stroke: 'rgba(255,255,255,0.1)' }} contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12 }} />
                    <Area type="monotone" dataKey="temp" stroke="#4fc3f7" fillOpacity={1} fill="url(#g)" strokeWidth={3} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
              <div className="glass-panel stat-tile">
                <span className="stat-label" style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Sunrise size={14} /> Sunrise</span>
                <span className="stat-value" style={{ fontSize: '1.2rem' }}>{format(new Date(weather.daily.sunrise[0]), 'HH:mm')}</span>
              </div>
              <div className="glass-panel stat-tile">
                <span className="stat-label" style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Sunset size={14} /> Sunset</span>
                <span className="stat-value" style={{ fontSize: '1.2rem' }}>{format(new Date(weather.daily.sunset[0]), 'HH:mm')}</span>
              </div>
            </div>
          </div>
        </section>

        <footer className="app-footer">
          © 2026 ATMOS WEATHER ENGINE • PROCESSED WITH PRECISION • 24H LIVE DATA
        </footer>
      </main>
    </div>
  );
}
