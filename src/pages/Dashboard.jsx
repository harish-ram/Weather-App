import React, { useEffect, useState } from 'react'
import GlassCard from '../components/GlassCard'
import AQMini from '../components/AQMini'
import { searchCity, getCurrentWeather, fetchAQNearby } from '../lib/api'

export default function Dashboard(){
  const [city, setCity] = useState('New Delhi')
  const [coords, setCoords] = useState({lat:28.6139, lon:77.2090})
  const [weather, setWeather] = useState(null)
  const [aqStation, setAqStation] = useState(null)

  useEffect(()=>{
    (async ()=>{
      const w = await getCurrentWeather(coords.lat, coords.lon)
      if(w) setWeather({ place: city, temperature: w.temperature, windspeed: w.windspeed, weathercode: w.weathercode })
      const aq = await fetchAQNearby(coords.lat, coords.lon, 20000, 10)
      if(aq && aq.length) setAqStation(aq[0])
    })()
  },[coords])

  async function onSearch(e){
    e.preventDefault()
    const q = e.target.elements.city.value
    const r = await searchCity(q)
    if(r){ setCoords({lat:r.latitude, lon:r.longitude}); setCity(r.name) }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl">Dashboard</h2>
        <form onSubmit={onSearch} className="flex gap-2">
          <input name="city" defaultValue={city} className="px-3 py-2 rounded bg-white/5" />
          <button className="px-3 py-2 bg-accent rounded">Search</button>
        </form>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4">
        <GlassCard weather={weather || {place:city, temperature:'—', windspeed:'—', weathercode:0}} />
        <AQMini station={aqStation} />
      </div>
    </div>
  )
}
