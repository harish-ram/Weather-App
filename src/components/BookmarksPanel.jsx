import React, { useEffect, useState } from 'react'

const BOOKMARK_KEY = 'aq_bookmarks_v1'

export default function BookmarksPanel({ open=false, onClose=()=>{} }){
  const [list, setList] = useState([])
  const [tzLocal, setTzLocal] = useState(true)

  useEffect(()=>{
    load()
  },[])

  function load(){
    const raw = JSON.parse(localStorage.getItem(BOOKMARK_KEY) || '[]')
    const normalized = raw.map(item => typeof item === 'string' ? { id: item, station: null } : item)
    setList(normalized)
  }

  function removeOne(id){
    const raw = JSON.parse(localStorage.getItem(BOOKMARK_KEY) || '[]')
    const normalized = raw.map(item => typeof item === 'string' ? { id: item, station: null } : item)
    const filtered = normalized.filter(i=>i.id !== id)
    localStorage.setItem(BOOKMARK_KEY, JSON.stringify(filtered))
    setList(filtered)
  }

  function clearAll(){
    localStorage.removeItem(BOOKMARK_KEY)
    setList([])
  }

  function downloadCSV(includeMetadata=true){
    // Build rows: station_id, location, lat, lon, time_local, time_utc, value
    const rows = [["station_id","location","latitude","longitude","time_local","time_utc","value"]]
    for(const item of list){
      const station = item.station || null
      const hist = station && station.history ? station.history : []
      if(hist.length === 0){
        // include one metadata-only row
        rows.push([item.id, station?.location||'', station?.latitude||'', station?.longitude||'', '', '', ''])
      } else {
        for(const h of hist){
          const tUtc = h.time ? new Date(h.time) : null
          const tLocal = tUtc ? new Date(tUtc.getTime() + (new Date()).getTimezoneOffset()*60000 * -1) : null
          const timeLocal = tLocal ? tLocal.toISOString() : ''
          const timeUtc = tUtc ? tUtc.toISOString() : ''
          const value = h.value ?? ''
          rows.push([item.id, station?.location||'', station?.latitude||'', station?.longitude||'', tzLocal? timeLocal: timeUtc, timeUtc, value])
        }
      }
    }
    const csv = rows.map(r=>r.map(c=>`"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `aqi-bookmarks-${Date.now()}.csv`
    document.body.appendChild(a)
    a.click()
    a.remove()
  }

  return (
    <aside aria-hidden={!open} className={`fixed top-0 left-0 bottom-0 w-80 bg-black/70 backdrop-blur-md p-4 z-50 ${open? 'translate-x-0':'-translate-x-full'}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg">Bookmarks</h3>
        <div className="flex items-center gap-2">
          <label className="text-sm mr-2">Local TZ</label>
          <input type="checkbox" checked={tzLocal} onChange={e=>setTzLocal(e.target.checked)} />
          <button onClick={onClose} className="px-2 py-1 rounded">Close</button>
        </div>
      </div>

      <div className="mb-3 flex gap-2">
        <button className="px-3 py-2 bg-accent rounded" onClick={()=>downloadCSV(true)}>Export CSV (metadata)</button>
        <button className="px-3 py-2 bg-white/5 rounded" onClick={()=>downloadCSV(false)}>Export CSV (values)</button>
        <button className="px-3 py-2 bg-red-600 rounded" onClick={clearAll}>Clear</button>
      </div>

      <div className="overflow-auto" style={{maxHeight:'70vh'}}>
        {list.length === 0 && <div className="text-sm text-slate-400">No bookmarks yet. Open a station and click "Bookmark".</div>}
        {list.map(item=> (
          <div key={item.id} className="p-2 mb-2 bg-white/5 rounded">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold">{item.station?.location || item.id}</div>
                <div className="text-sm">{item.station ? `Lat ${item.station.latitude?.toFixed?.(4)||''}, Lon ${item.station.longitude?.toFixed?.(4)||''}` : 'No metadata saved'}</div>
                <div className="text-sm">Saved: {item.station?.bookmarkedAt ? new Date(item.station.bookmarkedAt).toLocaleString() : 'unknown'}</div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <button className="px-2 py-1 bg-white/5 rounded" onClick={()=>{ navigator.clipboard && navigator.clipboard.writeText(item.station? `${item.station.latitude},${item.station.longitude}`: item.id); alert('Copied coords') }}>Copy</button>
                <button className="px-2 py-1 bg-red-600 rounded" onClick={()=>removeOne(item.id)}>Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </aside>
  )
}
