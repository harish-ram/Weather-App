import React from "react";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";

// Convert PM2.5 concentration (ug/m3) to approximate US AQI using EPA breakpoints.
function pm25ToAQI(pm) {
  if (pm == null) return null;
  const breakpoints = [
    { cLow: 0.0, cHigh: 12.0, iLow: 0, iHigh: 50 },
    { cLow: 12.1, cHigh: 35.4, iLow: 51, iHigh: 100 },
    { cLow: 35.5, cHigh: 55.4, iLow: 101, iHigh: 150 },
    { cLow: 55.5, cHigh: 150.4, iLow: 151, iHigh: 200 },
    { cLow: 150.5, cHigh: 250.4, iLow: 201, iHigh: 300 },
    { cLow: 250.5, cHigh: 350.4, iLow: 301, iHigh: 400 },
    { cLow: 350.5, cHigh: 500.4, iLow: 401, iHigh: 500 },
  ];
  for (const bp of breakpoints) {
    if (pm >= bp.cLow && pm <= bp.cHigh) {
      const a = ((bp.iHigh - bp.iLow) / (bp.cHigh - bp.cLow)) * (pm - bp.cLow) + bp.iLow;
      return Math.round(a);
    }
  }
  return null;
}

function aqiColor(aqi) {
  if (aqi == null) return "#888";
  if (aqi <= 50) return "#55a84f";
  if (aqi <= 100) return "#a3c239";
  if (aqi <= 150) return "#d2b132";
  if (aqi <= 200) return "#e07b24";
  if (aqi <= 300) return "#d43f3a";
  return "#7e0023";
}

export default function AQMap({ center, aqData }) {
  const zoom = 11;
  const points = (aqData || []).filter(d => d && typeof d.latitude === 'number' && typeof d.longitude === 'number');
  return (
    <div className="aq-map" style={{ height: 360, width: "100%", borderRadius: 12, overflow: "hidden" }}>
      <MapContainer center={center} zoom={zoom} style={{ height: "100%", width: "100%" }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {points.length > 0 && points.map((d, i) => {
          const pm25 = d.measurements?.pm25?.value ?? d.measurements?.pm2_5?.value ?? d.measurements?.pm2_5?.value ?? null;
          const aqi = pm25 != null ? pm25ToAQI(pm25) : null;
          const color = aqiColor(aqi);
          const radius = Math.max(6, Math.min(28, (aqi || 30) / 6));
          return (
            <CircleMarker
              key={i}
              center={[d.latitude, d.longitude]}
              pathOptions={{ color, fillColor: color, fillOpacity: 0.7 }}
              radius={radius}
            >
              <Popup>
                <div style={{ minWidth: 160 }}>
                  <strong>{d.location}</strong>
                  <div>PM2.5: {pm25 ?? "N/A"} µg/m³</div>
                  <div>AQI: {aqi ?? "N/A"}</div>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>
      {(!points || points.length === 0) && (
        <div style={{position:'absolute',left:12,top:12,zIndex:400,padding:'6px 10px',background:'rgba(0,0,0,0.5)',borderRadius:8,fontSize:13}}>
          No AQ points available nearby
        </div>
      )}
    </div>
  );
}
