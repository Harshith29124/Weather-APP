import React, { useState } from "react";
import "./App.css";

function App() {
  const [location, setLocation] = useState("Bangalore");
  const [mode, setMode] = useState("current");
  const [date, setDate] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const getCoordinates = async (city) => {
    const res = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${city}&count=1`
    );
    const json = await res.json();
    if (!json.results) return null;
    return {
      lat: json.results[0].latitude,
      lon: json.results[0].longitude,
    };
  };

  const fetchWeather = async () => {
    setLoading(true);
    const coords = await getCoordinates(location);
    if (!coords) {
      alert("Location not found");
      setLoading(false);
      return;
    }

    let url = "";

    if (mode === "current") {
      url = `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&current_weather=true&hourly=relativehumidity_2m`;
    }

    if (mode === "historical" && date) {
      url = `https://archive-api.open-meteo.com/v1/archive?latitude=${coords.lat}&longitude=${coords.lon}&start_date=${date}&end_date=${date}&daily=temperature_2m_max,temperature_2m_min`;
    }

    if (mode === "marine") {
      url = `https://marine-api.open-meteo.com/v1/marine?latitude=${coords.lat}&longitude=${coords.lon}&hourly=wave_height,sea_surface_temperature`;
    }

    const res = await fetch(url);
    const json = await res.json();
    setData(json);
    setLoading(false);
  };

  return (
    <div className="app">
      <div className="dashboard">
        <h1>Weather Dashboard</h1>

        <div className="controls">
          <input
            type="text"
            placeholder="Enter location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />

          <select value={mode} onChange={(e) => setMode(e.target.value)}>
            <option value="current">Current</option>
            <option value="historical">Historical</option>
            <option value="marine">Marine</option>
          </select>

          {mode === "historical" && (
            <input type="date" onChange={(e) => setDate(e.target.value)} />
          )}

          <button onClick={fetchWeather}>
            {loading ? "Loading..." : "Search"}
          </button>
        </div>

        <div className="cards">
          {data && mode === "current" && (
            <>
              <div className="card">
                <h3>Temperature</h3>
                <p className="big">{data.current_weather?.temperature}°C</p>
              </div>

              <div className="card">
                <h3>Wind Speed</h3>
                <p className="big">{data.current_weather?.windspeed} km/h</p>
              </div>

              <div className="card">
                <h3>Humidity</h3>
                <p className="big">
                  {data.hourly?.relativehumidity_2m[0]}%
                </p>
              </div>
            </>
          )}

          {data && mode === "historical" && (
            <>
              <div className="card">
                <h3>Max Temp</h3>
                <p className="big">
                  {data.daily?.temperature_2m_max[0]}°C
                </p>
              </div>

              <div className="card">
                <h3>Min Temp</h3>
                <p className="big">
                  {data.daily?.temperature_2m_min[0]}°C
                </p>
              </div>
            </>
          )}

          {data && mode === "marine" && (
            <>
              <div className="card">
                <h3>Wave Height</h3>
                <p className="big">
                  {data.hourly?.wave_height[0]} m
                </p>
              </div>

              <div className="card">
                <h3>Sea Temperature</h3>
                <p className="big">
                  {data.hourly?.sea_surface_temperature[0]}°C
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;