import React, { useState } from "react";
import "./App.css";

function App() {
  const [location, setLocation] = useState("Bangalore");
  const [mode, setMode] = useState("current");
  const [date, setDate] = useState("");
  const [data, setData] = useState(null);

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
    const coords = await getCoordinates(location);
    if (!coords) return alert("Location not found");

    let url = "";

    if (mode === "current") {
      url = `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&current_weather=true`;
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
  };

  return (
    <div className="app">
      <div className="card">
        <h2>Weather App</h2>

        <input
          type="text"
          placeholder="Enter location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />

        <select value={mode} onChange={(e) => setMode(e.target.value)}>
          <option value="current">Current Weather</option>
          <option value="historical">Historical Weather</option>
          <option value="marine">Marine Weather</option>
        </select>

        {mode === "historical" && (
          <input
            type="date"
            onChange={(e) => setDate(e.target.value)}
          />
        )}

        <button onClick={fetchWeather}>Fetch</button>

        <div className="result">
          {data && mode === "current" && (
            <div>
              <p>Temperature: {data.current_weather?.temperature}°C</p>
              <p>Wind: {data.current_weather?.windspeed} km/h</p>
            </div>
          )}

          {data && mode === "historical" && (
            <div>
              <p>Max Temp: {data.daily?.temperature_2m_max[0]}°C</p>
              <p>Min Temp: {data.daily?.temperature_2m_min[0]}°C</p>
            </div>
          )}

          {data && mode === "marine" && (
            <div>
              <p>Wave Height: {data.hourly?.wave_height[0]} m</p>
              <p>Sea Temp: {data.hourly?.sea_surface_temperature[0]}°C</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;