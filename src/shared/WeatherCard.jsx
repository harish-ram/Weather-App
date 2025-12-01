import React from 'react'

export default function WeatherCard(){
  // Placeholder card with advanced metrics layout
  return (
    <div className="glass-card">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-3xl font-bold">26°C</div>
          <div className="text-sm text-slate-300">RealFeel 28°C • Clear</div>
        </div>
        <div className="text-right">
          <div className="text-sm">Wind</div>
          <div className="font-semibold">6 m/s • NNE</div>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-4">
        <div>Humidity: 64%</div>
        <div>Pressure: 1008 hPa ↑</div>
        <div>Dew point: 18°C</div>
        <div>Visibility: 10 km</div>
      </div>
    </div>
  )
}
