import React, { useEffect, useRef, useState } from 'react'
import { MapContainer, TileLayer, Marker, CircleMarker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet.markercluster/dist/MarkerCluster.css'
import 'leaflet.markercluster/dist/MarkerCluster.Default.css'
// plugin JS is non-ESM and expects a global `L` variable.
// We'll load the JS plugins dynamically after assigning `window.L = L`.
import { fetchAQNearby, fetchAQHistory } from '../lib/api'
import StationDrawer from './StationDrawer'

function Legend(){
  const items = [
    {color:'#55a84f',label:'0-50'},
    {color:'#a3c239',label:'51-100'},
    {color:'#d2b132',label:'101-150'},
    {color:'#e07b24',label:'151-200'},
    {color:'#d43f3a',label:'201-300'},
    {color:'#7e0023',label:'301+'},
  ]
  return (
    <div className="legend-card absolute left-4 bottom-4 z-50">
      {items.map(i=> (
        <div key={i.label} className="flex items-center gap-2 text-sm"><span style={{width:12,height:12,background:i.color,borderRadius:6}}></span>{i.label}</div>
      ))}
    </div>
  )
}

export default function AQMapAdvanced(){
  const center = [20.5937,78.9629] // India center
  const [points, setPoints] = useState([])
  const [selected, setSelected] = useState(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  useEffect(()=>{
    (async()=>{
      const data = await fetchAQNearby(28.65,77.23,20000,100) // placeholder coords
      if(data) setPoints(data)
      else {
        // fallback: generate mock points
        const mock = []
        for(let i=0;i<30;i++){
          mock.push({latitude:28.65 + (Math.random()-0.5)*1, longitude:77.23 + (Math.random()-0.5)*1, measurements:{pm25:{value:Math.round(Math.random()*300)}}})
        }
        setPoints(mock)
      }
    })()
  },[])

  // create heat points (raw)
  const heatPointsRaw = points.map(p=>({lat:p.latitude,lon:p.longitude,pm:p.measurements?.pm25?.value||10}))

  return (
    <div style={{height:520,position:'relative'}}>
      <MapContainer center={center} zoom={5} style={{height:'100%',width:'100%'}}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <ClusterLayer points={points} onSelect={async p=>{
          // fetch recent history for this station and attach
          let history = null
          try{ history = await fetchAQHistory({ location: p.location, latitude: p.latitude, longitude: p.longitude }, 48) }catch(e){}
          const withHistory = Object.assign({}, p, { history: history || p.history || null })
          setSelected(withHistory)
          setDrawerOpen(true)
        }} />
        <HeatLayer pointsRaw={heatPointsRaw} />
      </MapContainer>
      <Legend />
      <StationDrawer open={drawerOpen} onClose={()=>setDrawerOpen(false)} station={selected} />
    </div>
  )
}

function ClusterLayer({points,onSelect}){
  const map = useMap()
  useEffect(()=>{
    if(!map) return
    (async ()=>{
      if(!L.markerClusterGroup){
        if(typeof window !== 'undefined') window.L = L
        await import('leaflet.markercluster/dist/leaflet.markercluster.js')
      }
      // compute max PM for normalization
      const maxPM = Math.max(0, ...points.map(p=>p.measurements?.pm25?.value || p.measurements?.pm2_5?.value || 0)) || 100
      const markers = L.markerClusterGroup({
        iconCreateFunction: function(cluster){
          // compute average PM2.5 among child markers
          const childMarkers = cluster.getAllChildMarkers()
          let sum = 0, count = 0
          for(const m of childMarkers){ if(typeof m.pm === 'number'){ sum += m.pm; count++ }}
          const avg = count? Math.round(sum/count) : 0
          const aqi = pmToAqi(avg) || 0
          const color = aqiColor(aqi)
          // size scaled by avg / maxPM to avoid overly large clusters
          const norm = Math.min(1, avg / Math.max(1, maxPM))
          const size = 28 + Math.round(32 * norm) + Math.min(30, Math.round((aqi/500)*30))
          const html = `<div style="background:${color};width:${size}px;height:${size}px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-size:12px;border:2px solid rgba(255,255,255,0.12)"><span>${count||childMarkers.length}</span></div>`
          const title = `Cluster of ${count||childMarkers.length} stations — avg PM2.5 ${avg} — AQI ${aqi}`
          const htmlWithTitle = `<div data-cluster="true" title="${title}" aria-label="${title}" role="button" tabindex="0">${html}</div>`
          return L.divIcon({ html: htmlWithTitle, className: 'marker-cluster-custom', iconSize: [size, size] })
        }
      })
      points.forEach((p,i)=>{
        if(!p.latitude || !p.longitude) return
        const pm = p.measurements?.pm25?.value || p.measurements?.pm2_5?.value || 30
        const col = aqiColor(pmToAqi(pm))
        const marker = L.circleMarker([p.latitude,p.longitude],{radius:8,fillColor:col,color:col,fillOpacity:0.9, className: 'aq-marker'})
        // store pm value on the marker so cluster icon can aggregate
        marker.pm = pm
        marker.bindPopup(`<div><strong>${p.location||'Station '+i}</strong><div>PM2.5: ${pm}</div><div>AQI:${pmToAqi(pm)}</div></div>`)
        marker.on('click', ()=>{ try{ onSelect && onSelect(p) }catch(e){} })
        markers.addLayer(marker)
      })
      map.addLayer(markers)

      // cluster click to spiderfy or zoom
      markers.on('clusterclick', function(e){
        const cluster = e.layer
        try{
          const childs = cluster.getAllChildMarkers()
          if(childs.length <= 12){ cluster.spiderfy() }
          else { map.fitBounds(cluster.getBounds(), { padding: [40,40] }) }
        }catch(err){
          map.fitBounds(cluster.getBounds())
        }
      })

      // keyboard accessibility for cluster icons (Enter to activate click)
      function onKey(e){
        if(e.key !== 'Enter') return
        const el = document.activeElement
        if(el && el.getAttribute && el.getAttribute('data-cluster') === 'true'){
          el.click()
        }
      }
      document.addEventListener('keydown', onKey)
    })()
    return ()=>{
      try{
        if(map && map.hasLayer){
          map.eachLayer(layer=>{
            // MarkerClusterGroup class is available on L.markerClusterGroup
            try{ if(layer && layer instanceof L.MarkerClusterGroup) map.removeLayer(layer) }catch(e){}
          })
        }
        document.removeEventListener('keydown', onKey)
      }catch(e){}
    }
  },[map,points,onSelect])
  return null
}

function HeatLayer({points}){
  const map = useMap()
  useEffect(()=>{
    if(!map) return
    (async ()=>{
      if(!L.heatLayer){
        if(typeof window !== 'undefined') window.L = L
        await import('leaflet.heat')
      }
      // points is expected as array of {lat,lon,pm}
      const maxP = Math.max(1, ...points.map(p=>p.pm||0))
      const normalized = points.map(p=>[p.lat, p.lon, Math.max(0.05, Math.min(1, (p.pm||0)/maxP))])
      const heat = L.heatLayer ? L.heatLayer(normalized, { radius: 22, blur: 18, gradient: { 0.2: '#55a84f', 0.4: '#a3c239', 0.6: '#e07b24', 0.8: '#d43f3a', 1: '#7e0023' } }) : null
      if(heat) map.addLayer(heat)
      // store for cleanup
      map._aqHeatLayer = heat
    })()
    return ()=>{ try{ if(map && map._aqHeatLayer) map.removeLayer(map._aqHeatLayer) }catch(e){} }
  },[map,points])
  return null
}

function pmToAqi(pm){
  if(pm==null) return null
  const bp=[
    {cLow:0,cHigh:12,iLow:0,iHigh:50},
    {cLow:12.1,cHigh:35.4,iLow:51,iHigh:100},
    {cLow:35.5,cHigh:55.4,iLow:101,iHigh:150},
    {cLow:55.5,cHigh:150.4,iLow:151,iHigh:200},
    {cLow:150.5,cHigh:250.4,iLow:201,iHigh:300},
    {cLow:250.5,cHigh:350.4,iLow:301,iHigh:400},
    {cLow:350.5,cHigh:500.4,iLow:401,iHigh:500},
  ]
  for(const b of bp){ if(pm>=b.cLow && pm<=b.cHigh){ return Math.round(((b.iHigh-b.iLow)/(b.cHigh-b.cLow))*(pm-b.cLow)+b.iLow) }}
  return null
}
function aqiColor(aqi){
  if(aqi==null) return '#888'
  if(aqi<=50) return '#55a84f'
  if(aqi<=100) return '#a3c239'
  if(aqi<=150) return '#d2b132'
  if(aqi<=200) return '#e07b24'
  if(aqi<=300) return '#d43f3a'
  return '#7e0023'
}
