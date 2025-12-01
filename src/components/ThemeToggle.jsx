import React from 'react'
import { useThemeStore } from '../store/themeStore'

export default function ThemeToggle(){
  const mode = useThemeStore(s=>s.mode)
  const setMode = useThemeStore(s=>s.setMode)
  return (
    <div className="flex items-center gap-2">
      <button onClick={()=>setMode('light')} className="px-2 py-1 rounded">Light</button>
      <button onClick={()=>setMode('dark')} className="px-2 py-1 rounded">Dark</button>
      <button onClick={()=>setMode('auto')} className="px-2 py-1 rounded">Auto</button>
    </div>
  )
}
