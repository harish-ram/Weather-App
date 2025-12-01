import React, { useState } from 'react'
import { Routes, Route, Link } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Maps from './pages/Maps'
import Forecasts from './pages/Forecasts'
import Analytics from './pages/Analytics'
import Alerts from './pages/Alerts'
import './styles/layout.css'
import BookmarksPanel from './components/BookmarksPanel'

function Nav({ onToggleBookmarks }){
  return (
    <nav className="w-full bg-black/30 backdrop-blur-md p-3 flex gap-4 items-center">
      <div className="text-xl font-semibold">Check Weather</div>
      <div className="flex-1" />
      <Link to="/" className="px-3 py-1 rounded hover:bg-white/5">Dashboard</Link>
      <Link to="/forecasts" className="px-3 py-1 rounded hover:bg-white/5">Forecasts</Link>
      <Link to="/maps" className="px-3 py-1 rounded hover:bg-white/5">AQI Map</Link>
      <Link to="/analytics" className="px-3 py-1 rounded hover:bg-white/5">Analytics</Link>
      <Link to="/alerts" className="px-3 py-1 rounded hover:bg-white/5">Alerts</Link>
      <button onClick={onToggleBookmarks} className="px-3 py-1 rounded hover:bg-white/5">Bookmarks</button>
    </nav>
  )
}

export default function App(){
  const [showBookmarks, setShowBookmarks] = useState(false)
  return (
    <div className="min-h-screen flex flex-col">
      <Nav onToggleBookmarks={()=>setShowBookmarks(v=>!v)} />
      <BookmarksPanel open={showBookmarks} onClose={()=>setShowBookmarks(false)} />
      <main className="flex-1 p-6">
        <Routes>
          <Route path='/' element={<Dashboard/>} />
          <Route path='/forecasts' element={<Forecasts/>} />
          <Route path='/maps' element={<Maps/>} />
          <Route path='/analytics' element={<Analytics/>} />
          <Route path='/alerts' element={<Alerts/>} />
        </Routes>
      </main>
    </div>
  )
}
