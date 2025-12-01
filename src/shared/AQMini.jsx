import React from 'react'

export default function AQMini(){
  return (
    <div className="glass-card">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-2xl font-bold">AQI 72</div>
          <div className="text-sm text-slate-300">Moderate • PM2.5</div>
        </div>
        <div className="text-right">Dominant: PM2.5</div>
      </div>
      <div className="mt-3 text-sm">Health advice and quick tips (placeholder)</div>
    </div>
  )
}
