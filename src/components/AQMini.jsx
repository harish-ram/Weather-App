import React from 'react'

export default function AQMini({station}){
  if(!station) return (
    <div className="glass-card p-3">No AQ info available</div>
  )
  const pm = station.measurements?.pm25?.value ?? station.measurements?.pm2_5?.value ?? null
  const aqi = pm ? pmToAqi(pm) : null
  const color = aqiColor(aqi)
  return (
    <div className="glass-card p-3">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-muted">Nearest station</div>
          <div className="font-semibold">{station.location}</div>
        </div>
        <div style={{textAlign:'right'}}>
          <div style={{background:color,padding:'6px 10px',borderRadius:8,color:'#fff',fontWeight:700}}>{aqi ?? '—'}</div>
          <div className="text-xs text-muted">PM2.5: {pm ?? '—'}</div>
        </div>
      </div>
    </div>
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
function aqiColor(aqi){
  if(aqi==null) return '#888'
  if(aqi<=50) return '#55a84f'
  if(aqi<=100) return '#a3c239'
  if(aqi<=150) return '#d2b132'
  if(aqi<=200) return '#e07b24'
  if(aqi<=300) return '#d43f3a'
  return '#7e0023'
}
