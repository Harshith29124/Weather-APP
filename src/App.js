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

const WX_MAP = {
  0: { t: 'Clear Skies', c: '#fbbf24', i: Sun },
  1: { t: 'Mainly Clear', c: '#fbbf24', i: SunMedium },
  2: { t: 'Partly Cloudy', c: '#94a3b8', i: Cloud },
  3: { t: 'Overcast', c: '#64748b', i: Cloud },
  45: { t: 'Foggy', c: '#94a3b8', i: Activity },
  51: { t: 'Drizzle', c: '#38bdf8', i: CloudRain },
  61: { t: 'Rainy', c: '#0ea5e9', i: CloudRain },
  71: { t: 'Snowy', c: '#e2e8f0', i: CloudSnow },
  95: { t: 'Thunderstorm', c: '#fbbf24', i: CloudLightning },
};

const WxIcon = ({ code, isDay, size = 24 }) => {
  const cfg = WX_MAP[code] || WX_MAP[2];
  const Icon = cfg.i;
  const color = !isDay && (code <= 1) ? '#818cf8' : cfg.c;
  const FinalIcon = !isDay && (code <= 1) ? Moon : Icon;
  return <FinalIcon size={size} color={color} strokeWidth={1.5} />;
};

export default function App() {
  const [theme, setTheme] = useState('dark');
  const [loc, setLoc] = useState({ name: 'New Delhi', lat: 28.61, lon: 77.21, country: 'India' });
  const [wx, setWx] = useState(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [hits, setHits] = useState([]);
  const [open, setOpen] = useState(false);
  const [view, setView] = useState('current');
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const tic = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(tic);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const fetchWx = useCallback(async (lat, lon) => {
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
      setWx(data);
    } catch (e) {
      console.error(e);
    } finally {
      setTimeout(() => setLoading(false), 800);
    }
  }, []);

  useEffect(() => { fetchWx(loc.lat, loc.lon); }, [loc, fetchWx]);

  const onSearch = async (v) => {
    setQuery(v);
    if (v.length < 2) { setHits([]); return; }
    try {
      const { data } = await axios.get(GEO_URL, { params: { name: v, count: 5 } });
      setHits(data.results || []);
    } catch { setHits([]); }
  };

  const bgStyle = useMemo(() => {
    if (!wx) return '';
    const { weather_code: c, is_day: d } = wx.current;
    if (!d) return 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)';
    if (c <= 1) return 'linear-gradient(135deg, #0EA5E9 0%, #0369A1 100%)';
    return 'linear-gradient(135deg, #334155 0%, #1e293b 100%)';
  }, [wx]);

  if (loading && !wx) return (
    <div className="app" style={{ justifyContent: 'center', alignItems: 'center' }}>
      <Activity className="animate-spin" size={48} color="#0EA5E9" />
    </div>
  );

  return (
    <div className="app">
      <div className="aurora">
        <div className="orb" style={{ width: 800, height: 800, background: 'var(--text-accent)', top: '-10%', left: '-10%' }} />
        <div className="orb" style={{ width: 600, height: 600, background: '#818cf8', bottom: '10%', right: '-5%' }} />
      </div>

      <main className="main-content">
        <section>
          <header className="nav-header">
            <div className="logo"><SunMedium size={32} strokeWidth={2.5} /> ATMOS</div>
            <button className="btn-round" onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}>
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </header>

          <div className="search-box">
            <Search className="input-icon" size={20} style={{ position: 'absolute', left: 18, top: 16, opacity: 0.5 }} />
            <input
              className="search-input"
              placeholder="Search major city..."
              value={query}
              onChange={e => onSearch(e.target.value)}
              onFocus={() => setOpen(true)}
            />
            <AnimatePresence>
              {open && hits.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  style={{ position: 'absolute', top: 60, left: 0, right: 0, background: 'var(--bg-deep)', borderRadius: 20, border: '1px solid var(--glass-stroke)', zIndex: 100, overflow: 'hidden' }}
                >
                  {hits.map((h, i) => (
                    <div key={i} onClick={() => { setLoc({ name: h.name, lat: h.latitude, lon: h.longitude, country: h.country }); setOpen(false); setQuery(''); }} style={{ padding: '14px 20px', cursor: 'pointer', borderBottom: '1px solid var(--glass-stroke)', display: 'flex', alignItems: 'center', gap: 10 }}>
                      <MapPin size={16} opacity={0.5} />
                      <div><p style={{ fontWeight: 700 }}>{h.name}</p><p style={{ fontSize: 12, opacity: 0.5 }}>{h.country}</p></div>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div style={{ marginTop: 32, display: 'flex', flexDirection: 'column', gap: 20 }}>
            <motion.div className="panel hero" style={{ background: bgStyle, color: '#fff' }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div className="hero-main">
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, opacity: 0.8, fontSize: 14, fontWeight: 600 }}><MapPin size={14} />{loc.name}, {loc.country}</div>
                  <h1 className="temp-hero">{Math.round(wx.current.temperature_2m)}°</h1>
                  <p style={{ fontSize: '1.5rem', fontWeight: 700 }}>{(WX_MAP[wx.current.weather_code] || WX_MAP[2]).t}</p>
                  <p style={{ opacity: 0.6, fontSize: 14, marginTop: 4 }}>{format(now, 'EEEE, dd MMMM • HH:mm')}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <WxIcon code={wx.current.weather_code} isDay={wx.current.is_day} size={100} />
                  <p style={{ marginTop: 8, fontWeight: 700 }}>Feels like {Math.round(wx.current.apparent_temperature)}°</p>
                </div>
              </div>

              <div className="hero-stats">
                <div className="h-stat"><p className="h-stat-label">High</p><p className="h-stat-value">{Math.round(wx.daily.temperature_2m_max[0])}°</p></div>
                <div className="h-stat"><p className="h-stat-label">Low</p><p className="h-stat-value">{Math.round(wx.daily.temperature_2m_min[0])}°</p></div>
                <div className="h-stat"><p className="h-stat-label">Humidity</p><p className="h-stat-value">{wx.current.relative_humidity_2m}%</p></div>
                <div className="h-stat"><p className="h-stat-label">Wind</p><p className="h-stat-value">{Math.round(wx.current.wind_speed_10m)} <small>km/h</small></p></div>
              </div>
            </motion.div>

            <div className="panel">
              <h3 className="label-sm">Next 24 Hours</h3>
              <div className="hourly-rail">
                {wx.hourly.time.slice(0, 24).map((t, i) => (
                  <div key={i} className="hour-card">
                    <span style={{ fontSize: 12, opacity: 0.5 }}>{format(new Date(t), 'HH:mm')}</span>
                    <WxIcon code={wx.hourly.weather_code[i]} isDay={wx.hourly.is_day[i]} size={32} />
                    <span style={{ fontWeight: 800, fontSize: 18 }}>{Math.round(wx.hourly.temperature_2m[i])}°</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-accent)' }}>{wx.hourly.precipitation_probability[i]}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section>
          <nav className="tabs">
            {['Current', 'Hourly', '7-Day', 'Details'].map(t => (
              <button key={t} className={`tab-btn ${view === t.toLowerCase() ? 'active' : ''}`} onClick={() => setView(t.toLowerCase())}>{t}</button>
            ))}
          </nav>

          <AnimatePresence mode="wait">
            {view === 'current' && (
              <motion.div key="cur" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} className="detail-grid">
                {[
                  { l: 'Pressure', v: Math.round(wx.current.pressure_msl), u: ' hPa', i: <Gauge size={18} /> },
                  { l: 'Visibility', v: Math.round(wx.current.visibility / 1000), u: ' km', i: <Eye size={18} /> },
                  { l: 'Humidity', v: wx.current.relative_humidity_2m, u: '%', i: <Droplets size={18} /> },
                  { l: 'UV Index', v: wx.current.uv_index.toFixed(1), u: '', i: <Zap size={18} /> },
                  { l: 'Sunrise', v: format(new Date(wx.daily.sunrise[0]), 'HH:mm'), u: '', i: <Sunrise size={18} /> },
                  { l: 'Sunset', v: format(new Date(wx.daily.sunset[0]), 'HH:mm'), u: '', i: <Sunset size={18} /> },
                ].map((d, i) => (
                  <div key={i} className="panel tile">
                    <div className="tile-head">{d.i}<span>{d.l}</span></div>
                    <div className="tile-body">{d.v}<span style={{ fontSize: 14, opacity: 0.5, marginLeft: 4 }}>{d.u}</span></div>
                  </div>
                ))}
              </motion.div>
            )}

            {view === '7-day' && (
              <motion.div key="7d" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="panel">
                <h3 className="label-sm">7-Day Forecast</h3>
                <div className="forecast-list">
                  {wx.daily.time.map((d, i) => (
                    <div key={i} className="forecast-row">
                      <span style={{ fontWeight: 700 }}>{i === 0 ? 'Today' : format(new Date(d), 'EEEE')}</span>
                      <WxIcon code={wx.daily.weather_code[i]} isDay={1} size={24} />
                      <div style={{ height: 4, background: 'var(--bg-glass-1)', borderRadius: 2, margin: '0 16px' }} />
                      <div style={{ textAlign: 'right', fontWeight: 800 }}>
                        {Math.round(wx.daily.temperature_2m_max[i])}°
                        <span style={{ opacity: 0.3, fontWeight: 400, marginLeft: 8 }}>{Math.round(wx.daily.temperature_2m_min[i])}°</span>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {(view === 'hourly' || view === 'details') && (
              <motion.div key="hr" className="panel" style={{ height: 400 }}>
                <h3 className="label-sm">Temperature Trend</h3>
                <ResponsiveContainer width="100%" height="80%">
                  <AreaChart data={wx.hourly.time.slice(0, 24).map((t, i) => ({ time: format(new Date(t), 'HH'), temp: wx.hourly.temperature_2m[i] }))}>
                    <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#0EA5E9" stopOpacity={0.3} /><stop offset="95%" stopColor="#0EA5E9" stopOpacity={0} /></linearGradient></defs>
                    <CartesianGrid strokeOpacity={0.05} vertical={false} />
                    <XAxis dataKey="time" hide />
                    <YAxis hide domain={['dataMin - 2', 'dataMax + 2']} />
                    <Tooltip cursor={false} contentStyle={{ background: 'var(--bg-deep)', border: 'none', borderRadius: 16, boxShadow: 'var(--shadow-env)' }} />
                    <Area type="monotone" dataKey="temp" stroke="#0EA5E9" fillOpacity={1} fill="url(#g)" strokeWidth={4} />
                  </AreaChart>
                </ResponsiveContainer>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </main>

      <footer className="footer">
        © 2026 ATMOS WEATHER ENGINE • PROCESSED WITH PRECISION • 24H LIVE
      </footer>
    </div>
  );
}
