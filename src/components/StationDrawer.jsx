import React from 'react'
import { motion } from 'framer-motion'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend)

const BOOKMARK_KEY = 'aq_bookmarks_v1'

export default function StationDrawer({ open=false, station=null, onClose=()=>{} }){
  const [windowHours, setWindowHours] = React.useState(24)
  const [bookmarked, setBookmarked] = React.useState(false)

  React.useEffect(()=>{
    if(!station) return
    const key = bookmarkIdFor(station)
    const list = JSON.parse(localStorage.getItem(BOOKMARK_KEY) || '[]')
    // list may be array of objects or legacy strings
    const exists = list.some(item => (typeof item === 'string' ? item === key : item.id === key))
    setBookmarked(!!exists)
  },[station])

  function bookmarkIdFor(s){
    if(!s) return null
    if(s.id) return `id:${s.id}`
    if(s.location) return `loc:${s.location}`
    return `coords:${s.latitude||''},${s.longitude||''}`
  }

  function toggleBookmark(){
    if(!station) return
    const key = bookmarkIdFor(station)
    const listRaw = JSON.parse(localStorage.getItem(BOOKMARK_KEY) || '[]')
    // normalize to object form {id, station}
    const list = listRaw.map(item => typeof item === 'string' ? { id: item, station: null } : item)
    const idx = list.findIndex(i => i.id === key)
    if(idx >= 0){ list.splice(idx,1); setBookmarked(false) }
    else { list.push({ id: key, station: { ...station, bookmarkedAt: Date.now() } }); setBookmarked(true) }
    localStorage.setItem(BOOKMARK_KEY, JSON.stringify(list))
  }

  async function shareStation(){
    if(!station) return
    const text = `${station.location || 'Station'} — PM2.5: ${station.measurements?.pm25?.value ?? 'N/A'}`
    const url = typeof window !== 'undefined' ? window.location.href : ''
    try{
      if(navigator.share){ await navigator.share({ title: station.location, text, url }) }
      else if(navigator.clipboard){ await navigator.clipboard.writeText(`${text} ${url}`); alert('Station details copied to clipboard') }
      else { prompt('Copy station info', `${text} ${url}`) }
    }catch(e){ console.warn('share failed', e) }
  }

  function exportCSV(){
    if(!station) return
    const history = (station.history && station.history.slice(-windowHours)) || generateMockHistory(windowHours)
    const rows = [['time','value']].concat(history.map(h=>[new Date(h.time).toISOString(), h.value]))
    const csv = rows.map(r=>r.map(c=>`"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    const name = (station.location || 'station').replace(/[^a-z0-9\-]/ig,'_')
    a.download = `${name}-history-${windowHours}h.csv`
    document.body.appendChild(a)
    a.click()
    a.remove()
  }

  // build chart data from station.history (fallback to mock)
  const history = (station && station.history && station.history.slice(-windowHours)) || (station ? generateMockHistory(windowHours) : [])
  const labels = history.map((h,idx)=> h.time ? new Date(h.time).toLocaleString() : `${idx}`)
  const data = {
    labels,
    datasets: [
      {
        label: 'PM2.5',
        data: history.map(h=>h.value),
        borderColor: '#e07b24',
        backgroundColor: 'rgba(224,123,36,0.2)',
        tension: 0.3,
      }
    ]
  }

  React.useEffect(()=>{
    function onKey(e){ if(e.key === 'Escape' && open) onClose() }
    if(open) document.addEventListener('keydown', onKey)
    return ()=> document.removeEventListener('keydown', onKey)
  },[open,onClose])

  return (
    <motion.aside
      initial={{ x: '100%' }}
      animate={{ x: open ? 0 : '100%' }}
      transition={{ type: 'spring', stiffness: 260, damping: 30 }}
      style={{ position: 'fixed', right:0, top:0, bottom:0, width: '360px', zIndex:1000 }}
      className="bg-black/60 backdrop-blur-md p-4"
      aria-hidden={!open}
      role="dialog"
      aria-modal={open}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-lg">{station?.location || 'Station Details'}</h3>
        <div className="flex items-center gap-2">
          <button type="button" onClick={toggleBookmark} aria-pressed={bookmarked} aria-label={bookmarked? 'Remove bookmark':'Bookmark station'} className={`px-2 py-1 rounded ${bookmarked? 'bg-yellow-400 text-black' : 'bg-white/5'}`}>{bookmarked? 'Bookmarked':'Bookmark'}</button>
          <button type="button" onClick={shareStation} className="px-2 py-1 rounded bg-white/5" aria-label="Share station">Share</button>
          <button type="button" onClick={exportCSV} className="px-2 py-1 rounded bg-white/5" aria-label="Download CSV">CSV</button>
          <button type="button" onClick={onClose} className="px-2 py-1" aria-label="Close station details">Close</button>
        </div>
      </div>
      <div className="mt-3">
        {station ? (
          <div>
            <div className="text-sm">{station.location}</div>
            <div className="mt-2">Lat/Lon: {station.latitude?.toFixed?.(4) || station.latitude},{' '}{station.longitude?.toFixed?.(4) || station.longitude}</div>
            <div className="mt-2">PM2.5: {station.measurements?.pm25?.value ?? 'N/A'}</div>
            <div>AQI approx: {pmToAqi(station.measurements?.pm25?.value ?? station.measurements?.pm2_5?.value) || '—'}</div>
            <div className="mt-3 flex items-center gap-2">
              <div className="text-sm">History:</div>
              <button type="button" className={`px-2 py-1 rounded ${windowHours===24? 'bg-slate-900 text-white':'bg-slate-100'}`} onClick={()=>setWindowHours(24)}>24h</button>
              <button type="button" className={`px-2 py-1 rounded ${windowHours===168? 'bg-slate-900 text-white':'bg-slate-100'}`} onClick={()=>setWindowHours(168)}>7d</button>
            </div>
            <div className="mt-4">
              <Line data={data} />
            </div>
          </div>
        ) : (
          <div className="text-sm text-slate-300">Select a station on the map</div>
        )}
      </div>
    </motion.aside>
  )
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

function generateMockHistory(hours=24){
  const now = Date.now()
  const arr = []
  for(let i=0;i<hours;i++) arr.push({ time: now - (hours-1-i)*3600*1000, value: Math.round(10 + Math.random()*200) })
  return arr
}
