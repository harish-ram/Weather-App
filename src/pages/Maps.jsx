import React from 'react'
import AQMapAdvanced from '../components/AQMapAdvanced'

export default function Maps(){
  return (
    <div className="space-y-4">
      <h2 className="text-2xl">AQI Map</h2>
      <div className="glass-card">
        <AQMapAdvanced />
      </div>
    </div>
  )
}
