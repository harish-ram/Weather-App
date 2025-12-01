import React, { useEffect, useMemo, useState } from 'react'
import { fetchForecast, searchCity } from '../lib/api'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend } from 'chart.js'
import { Chart } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend)

function cToF(c) {
  return (c * 9) / 5 + 32
}

function msToKmh(ms) {
  return ms * 3.6
}

function kmhToMph(kmh) {
  return kmh * 0.621371
}

export default function Forecasts(){
  const [city, setCity] = useState('New Delhi')
  const [coords, setCoords] = useState({lat:28.6139, lon:77.2090})
  const [forecast, setForecast] = useState(null)
  const [loading, setLoading] = useState(false)
  const [unitTemp, setUnitTemp] = useState('C')
  const [unitWind, setUnitWind] = useState('km/h')

  useEffect(()=>{
    (async ()=>{
      setLoading(true)
      const f = await fetchForecast(coords.lat, coords.lon)
      setForecast(f)
      setLoading(false)
    })()
  },[coords])

  async function onSearch(e){
    e.preventDefault()
    const q = e.target.elements.city.value
    const r = await searchCity(q)
    if(r){ setCoords({lat:r.latitude, lon:r.longitude}); setCity(r.name) }
  }

  const hourlyChart = useMemo(()=>{
    if(!forecast || !forecast.hourly) return null
    const h = forecast.hourly
    const labels = h.time.map(t => t.replace('T',' '))
    const temps = (h.temperature_2m || []).map(t => unitTemp === 'C' ? t : cToF(t))
    const prec = h.precipitation || h.precipitation_sum || new Array(temps.length).fill(0)
    const windMs = h.windspeed_10m || h.wind_speed_10m || new Array(temps.length).fill(0)
    const windKmh = windMs.map(ms => msToKmh(ms))
    const wind = windKmh.map(k => unitWind === 'km/h' ? k : kmhToMph(k))

    return {
      labels,
      datasets:[
        { type: 'line', label: `Temperature (°${unitTemp})`, data: temps, borderColor: '#ef4444', backgroundColor: 'rgba(239,68,68,0.15)', yAxisID: 'y-temp', tension:0.2, pointRadius:0 },
        { type: 'bar', label: 'Precipitation (mm)', data: prec, borderColor: '#3b82f6', backgroundColor: 'rgba(59,130,246,0.6)', yAxisID: 'y-prec' },
        { type: 'line', label: `Wind (${unitWind})`, data: wind, borderColor: '#06b6d4', backgroundColor: 'rgba(6,182,212,0.15)', yAxisID: 'y-wind', borderDash:[4,4], pointRadius:0 }
      ]
    }
  },[forecast, unitTemp, unitWind])

  const options = useMemo(()=>({
    responsive:true,
    interaction:{ mode:'index', intersect:false },
    stacked:false,
    scales:{
      'y-temp':{ type:'linear', display:true, position:'left', grid:{ drawOnChartArea:false } },
      'y-prec':{ type:'linear', display:true, position:'right', grid:{ drawOnChartArea:false }, ticks:{ beginAtZero:true } },
      'y-wind':{ type:'linear', display:false, position:'right', grid:{ drawOnChartArea:false }, ticks:{ beginAtZero:true } },
      x:{ ticks:{ maxRotation:0, minRotation:0 } }
    }
  }),[])

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-3">Forecasts — {city}</h2>
      <form onSubmit={onSearch} className="mb-4 flex gap-2">
        <input name="city" placeholder="Search city" className="px-3 py-2 rounded bg-white/5" />
        <button className="px-3 py-2 bg-accent rounded">Search</button>
        <div className="ml-auto flex items-center gap-2">
          <div className="text-sm">Temp:</div>
          <button type="button" className={`px-2 py-1 rounded ${unitTemp==='C'?'bg-slate-900 text-white':'bg-slate-100'}`} onClick={()=>setUnitTemp('C')}>°C</button>
          <button type="button" className={`px-2 py-1 rounded ${unitTemp==='F'?'bg-slate-900 text-white':'bg-slate-100'}`} onClick={()=>setUnitTemp('F')}>°F</button>

          <div className="text-sm ml-4">Wind:</div>
          <button type="button" className={`px-2 py-1 rounded ${unitWind==='km/h'?'bg-slate-900 text-white':'bg-slate-100'}`} onClick={()=>setUnitWind('km/h')}>km/h</button>
          <button type="button" className={`px-2 py-1 rounded ${unitWind==='mph'?'bg-slate-900 text-white':'bg-slate-100'}`} onClick={()=>setUnitWind('mph')}>mph</button>
        </div>
      </form>

      {loading && <div>Loading forecast…</div>}

      {!loading && forecast && hourlyChart && (
        <div className="bg-white/5 p-4 rounded">
          <div className="mb-2 text-sm text-slate-500">Hourly forecast for {city}</div>
          <Chart type='bar' data={hourlyChart} options={options} />
        </div>
      )}
    </div>
  )
}
