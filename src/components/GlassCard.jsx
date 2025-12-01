import React from "react";

export default function GlassCard({ weather }) {
  const { place, temperature, windspeed, weathercode } = weather;

  return (
    <div className="glass-card">
      <h2>{place}</h2>
      <div className="metrics">
        <div className="metric">
          <div className="label">Temperature</div>
          <div className="value">{temperature}°C</div>
        </div>
        <div className="metric">
          <div className="label">Wind</div>
          <div className="value">{windspeed} m/s</div>
        </div>
      </div>
      <div className="small">Weather code: {weathercode}</div>
    </div>
  );
}
