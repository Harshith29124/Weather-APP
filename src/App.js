import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, MapPin, Sun, Moon, Cloud,
  CloudRain, CloudSnow, CloudLightning, Gauge, Eye,
  Droplets, Zap, SunMedium, Sunset, Sunrise, Wind,
  Thermometer, Navigation, AlertTriangle, X
} from 'lucide-react';
import axios from 'axios';
import { format } from 'date-fns';
import {
  AreaChart, Area, XAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts';
import './App.css';

// ─── API CONFIGURATION ────────────────────────────────────────────────────────
const GEO_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const WX_URL = 'https://api.open-meteo.com/v1/forecast';

const QUICK_CITIES = [
  { name: 'Mumbai', lat: 19.0760, lon: 72.8777, country: 'India' },
  { name: 'London', lat: 51.5074, lon: -0.1278, country: 'UK' },
  { name: 'New York', lat: 40.7128, lon: -74.0060, country: 'USA' },
  { name: 'Tokyo', lat: 35.6762, lon: 139.6503, country: 'Japan' },
  { name: 'Paris', lat: 48.8566, lon: 2.3522, country: 'France' },
];

// ─── WEATHER UTILS ────────────────────────────────────────────────────────────
const WX_MAP = {
  0: { t: 'Clear', c: '#fbbf24', i: Sun },
  1: { t: 'Mainly Clear', c: '#fbbf24', i: SunMedium },
  2: { t: 'Partly Cloudy', c: '#94a3b8', i: Cloud },
  3: { t: 'Overcast', c: '#64748b', i: Cloud },
  45: { t: 'Fog', c: '#94a3b8', i: Cloud },
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
  82: { t: 'Heavy Showers', c: '#0284c7', i: CloudRain },
  95: { t: 'Thunderstorm', c: '#fbbf24', i: CloudLightning },
  96: { t: 'Thunderstorm+Hail', c: '#fbbf24', i: CloudLightning },
  99: { t: 'Severe Storm', c: '#f59e0b', i: CloudLightning },
};

const getWx = (code) => WX_MAP[code] ?? WX_MAP[2];

const WxIcon = ({ code, isDay, size = 24 }) => {
  const cfg = getWx(code);
  const nightMode = !isDay && code <= 1;
  const Icon = nightMode ? Moon : cfg.i;
  const color = nightMode ? '#818cf8' : cfg.c;
  return <Icon size={size} color={color} strokeWidth={1.5} aria-hidden="true" />;
};

const uvLabel = (uv) => {
  if (uv == null) return 'N/A';
  if (uv <= 2) return 'Low';
  if (uv <= 5) return 'Moderate';
  if (uv <= 7) return 'High';
  if (uv <= 10) return 'Very High';
  return 'Extreme';
};

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="custom-tooltip">
      <p style={{ fontSize: '0.8rem', opacity: 0.7, marginBottom: 4 }}>{label}</p>
      {payload.map((p, i) => (
        <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: '0.85rem' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: p.color }} />
          <span>{p.name}: <strong>{Math.round(p.value)}{p.unit}</strong></span>
        </div>
      ))}
    </div>
  );
};

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function App() {
  const [theme, setTheme] = useState(() =>
    window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
  );
  const [loc, setLoc] = useState({ name: 'New Delhi', lat: 28.61, lon: 77.21, country: 'India' });
  const [wx, setWx] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState('');
  const [hits, setHits] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [view, setView] = useState('current');
  const [now, setNow] = useState(new Date());
  const [geoLoading, setGeoLoading] = useState(false);

  const searchRef = useRef(null);

  useEffect(() => { document.documentElement.setAttribute('data-theme', theme); }, [theme]);
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(t); }, []);

  useEffect(() => {
    const clickOut = (e) => { if (searchRef.current && !searchRef.current.contains(e.target)) setShowDropdown(false); };
    document.addEventListener('mousedown', clickOut);
    return () => document.removeEventListener('mousedown', clickOut);
  }, []);

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
    } catch (err) {
      console.error(err);
      setError('Connection to weather satellite failed.');
    } finally {
      setTimeout(() => setLoading(false), 600);
    }
  }, []);

  useEffect(() => { fetchWx(loc.lat, loc.lon); }, [loc, fetchWx]);

  const onSearch = async (e) => {
    const q = e.target.value;
    setQuery(q);
    if (q.length < 2) { setHits([]); setShowDropdown(false); return; }
    try {
      const { data } = await axios.get(GEO_URL, { params: { name: q, count: 5, language: 'en' } });
      setHits(data.results || []);
      setShowDropdown(true);
    } catch { setHits([]); }
  };

  const selectCity = (city) => {
    setLoc({ name: city.name, lat: city.latitude, lon: city.longitude, country: city.country });
    setQuery('');
    setHits([]);
    setShowDropdown(false);
  };

  const handleGeo = () => {
    if (!navigator.geolocation) return;
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const { data } = await axios.get(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
          setLoc({
            name: data.address.city || data.address.town || 'My Location',
            country: data.address.country,
            lat: latitude,
            lon: longitude
          });
        } catch { setLoc({ name: 'My Location', country: '', lat: latitude, lon: longitude }); }
        finally { setGeoLoading(false); }
      },
      () => { setGeoLoading(false); setError('Location access denied.'); }
    );
  };

  const hourlyData = useMemo(() => {
    if (!wx) return [];
    const dayStartStr = format(now, 'yyyy-MM-dd') + 'T00:00';
    const dayStartIdx = wx.hourly.time.findIndex(t => t.startsWith(dayStartStr));
    const start = dayStartIdx >= 0 ? dayStartIdx : 0;
    return wx.hourly.time.slice(start, start + 24).map((t, i) => {
      const d = new Date(t);
      const isNow = d.getHours() === now.getHours() && d.getDate() === now.getDate();
      return {
        timeValue: d.getHours(),
        timeLabel: format(d, 'h a'),
        temp: Math.round(wx.hourly.temperature_2m[start + i]),
        rain: wx.hourly.precipitation_probability[start + i] ?? 0,
        wind: Math.round(wx.hourly.wind_speed_10m[start + i] ?? 0),
        code: wx.hourly.weather_code[start + i],
        isDay: wx.hourly.is_day[start + i],
        isNow
      };
    });
  }, [wx, now]);

  const windDir = (deg) => ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.round(deg / 45) % 8];

  if (loading && !wx) return (
    <div className="splash-screen">
      <div className="aurora"><div className="orb orb-1" /><div className="orb orb-2" /></div>
      <div className="brand" style={{ fontSize: '2rem' }}>
        <Sun size={48} className="spin" color="#38bdf8" />ATMOS
      </div>
    </div>
  );

  const cur = wx?.current || {};
  const daily = wx?.daily || {};

  return (
    <div className="app">
      <div className="aurora">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
      </div>

      <AnimatePresence>
        {error && (
          <motion.div className="error-banner" initial={{ y: -50 }} animate={{ y: 0 }} exit={{ y: -50 }}>
            <AlertTriangle size={18} /> {error}
            <button onClick={() => setError(null)}><X size={18} /></button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="main-content">
        <section className="col-left">
          <header className="header">
            <div className="brand"><Sun size={24} color="#38bdf8" /> ATMOS</div>
            <div className="header-controls">
              <button className="btn-icon" onClick={handleGeo} disabled={geoLoading}>
                <Navigation size={18} className={geoLoading ? 'spin' : ''} />
              </button>
              <button className="btn-icon" onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}>
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              </button>
            </div>
          </header>

          <nav className="discovery" ref={searchRef}>
            <form className="search-form" onSubmit={(e) => e.preventDefault()}>
              <Search className="search-icon-left" size={18} />
              <input
                className="search-field"
                placeholder="Search city..."
                value={query}
                onChange={onSearch}
                onFocus={() => hits.length > 0 && setShowDropdown(true)}
              />
              {query && <button type="button" className="search-clear-btn" onClick={() => { setQuery(''); setHits([]); }}><X size={14} /></button>}
              <AnimatePresence>
                {showDropdown && hits.length > 0 && (
                  <motion.ul className="search-dropdown" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}>
                    {hits.map((h, i) => (
                      <li key={i} className="dropdown-item" onClick={() => selectCity(h)}>
                        <MapPin size={14} className="text-tertiary" />
                        <div>
                          <div style={{ fontWeight: 600 }}>{h.name}</div>
                          <div style={{ fontSize: 12, opacity: 0.6 }}>{h.admin1}, {h.country}</div>
                        </div>
                      </li>
                    ))}
                  </motion.ul>
                )}
              </AnimatePresence>
            </form>

            <div className="quick-nav">
              {QUICK_CITIES.map(c => (
                <button key={c.name} className={`chip ${loc.name === c.name ? 'active' : ''}`} onClick={() => setLoc(c)}>
                  <Cloud size={14} /> {c.name}
                </button>
              ))}
            </div>
          </nav>

          <motion.div className="panel hero" initial={{ scale: 0.95 }} animate={{ scale: 1 }}>
            <div className="hero-meta">
              <MapPin size={14} /> {loc.name}, {loc.country}
              <span style={{ marginLeft: 'auto' }}>{format(now, 'EEE, MMM d')}</span>
            </div>
            <div className="hero-body">
              <div>
                <div className="temp-display">
                  {Math.round(cur.temperature_2m)}
                  <div className="temp-unit"><span>°</span><span>C</span></div>
                </div>
                <div className="condition-label">{getWx(cur.weather_code).t}</div>
                <div className="feels-like">Feels like {Math.round(cur.apparent_temperature)}°</div>
              </div>
              <WxIcon code={cur.weather_code} isDay={cur.is_day} size={88} />
            </div>
            <div className="hero-grid">
              <div className="stat-item">
                <div className="stat-label">Wind</div>
                <div className="stat-value">{Math.round(cur.wind_speed_10m)} km/h</div>
              </div>
              <div className="stat-item">
                <div className="stat-label">Humidity</div>
                <div className="stat-value">{cur.relative_humidity_2m}%</div>
              </div>
              <div className="stat-item">
                <div className="stat-label">UV Index</div>
                <div className="stat-value">{cur.uv_index?.toFixed(0)}</div>
              </div>
              <div className="stat-item">
                <div className="stat-label">Visibility</div>
                <div className="stat-value">{((cur.visibility || 0) / 1000).toFixed(0)} km</div>
              </div>
            </div>
          </motion.div>

          <section className="panel">
            <h3 className="section-title">24-Hour Forecast</h3>
            <div className="hourly-scroll">
              {hourlyData.map((h, i) => (
                <div key={i} className={`hour-card ${h.isNow ? 'current' : ''}`}>
                  <span className="hour-time">{h.isNow ? 'Now' : h.timeLabel}</span>
                  <WxIcon code={h.code} isDay={h.isDay} size={24} />
                  <span className="hour-temp">{h.temp}°</span>
                  <span className="hour-pop"><Droplets size={10} /> {h.rain}%</span>
                </div>
              ))}
            </div>
          </section>
        </section>

        <section className="col-right">
          <nav className="tab-group">
            {['current', 'hourly', '7-day'].map(id => (
              <button key={id} className={`tab-item ${view === id ? 'active' : ''}`} onClick={() => setView(id)}>
                {id.charAt(0).toUpperCase() + id.slice(1)}
              </button>
            ))}
          </nav>

          <AnimatePresence mode="wait">
            {view === 'current' && (
              <motion.div key="details" className="details-grid panel-content" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {[
                  { l: 'Humidity', v: cur.relative_humidity_2m, u: '%', i: Droplets },
                  { l: 'Real Feel', v: Math.round(cur.apparent_temperature), u: '°', i: Thermometer },
                  { l: 'UV Index', v: cur.uv_index, u: '', i: Zap, note: uvLabel(cur.uv_index) },
                  { l: 'Pressure', v: Math.round(cur.pressure_msl), u: 'hPa', i: Gauge },
                  { l: 'Wind', v: Math.round(cur.wind_speed_10m), u: 'km/h', i: Wind, note: windDir(cur.wind_direction_10m) },
                  { l: 'Visibility', v: (cur.visibility / 1000).toFixed(1), u: 'km', i: Eye },
                  { l: 'Sunrise', v: daily.sunrise?.[0] ? format(new Date(daily.sunrise[0]), 'HH:mm') : '--', u: '', i: Sunrise },
                  { l: 'Sunset', v: daily.sunset?.[0] ? format(new Date(daily.sunset[0]), 'HH:mm') : '--', u: '', i: Sunset },
                ].map((d, i) => (
                  <div key={i} className="panel detail-card">
                    <div className="detail-head"><d.i size={16} /> {d.l}</div>
                    <div className="detail-value">{d.v}<span className="detail-unit">{d.u}</span></div>
                    {d.note && <div className="detail-note">{d.note}</div>}
                  </div>
                ))}
              </motion.div>
            )}

            {view === '7-day' && (
              <motion.div key="7day" className="forecast-list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {daily.time?.map((t, i) => (
                  <div key={t} className="forecast-item">
                    <span className="f-day">{i === 0 ? 'Today' : format(new Date(t), 'EEE')}</span>
                    <WxIcon code={daily.weather_code[i]} isDay={true} size={20} />
                    <span className="f-cond">{getWx(daily.weather_code[i]).t}</span>
                    <div className="f-temps">
                      <span className="f-max">{Math.round(daily.temperature_2m_max[i])}°</span>
                      <span className="f-min">{Math.round(daily.temperature_2m_min[i])}°</span>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}

            {view === 'hourly' && (
              <motion.div key="charts" className="panel" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <h3 className="section-title">Temperature & Rain</h3>
                <div style={{ height: 220, width: '100%', marginTop: 10 }}>
                  <ResponsiveContainer>
                    <AreaChart data={hourlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="splitColor" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="rainGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#818cf8" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                      <XAxis dataKey="timeLabel" interval={3} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                      <Tooltip content={<ChartTooltip />} />
                      <Area type="monotone" dataKey="temp" name="Temp" unit="°" stroke="#38bdf8" strokeWidth={3} fill="url(#splitColor)" />
                      <Area type="monotone" dataKey="rain" name="Rain" unit="%" stroke="#818cf8" strokeWidth={2} fill="url(#rainGrad)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </div>

      <footer className="app-footer">
        © 2026 ATMOS ENGINE · {loc.name} Live
      </footer>
    </div>
  );
}
