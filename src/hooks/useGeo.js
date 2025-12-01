import { useState, useEffect } from 'react'

export default function useGeo(){
  const [pos, setPos] = useState(null)
  useEffect(()=>{
    if(!(navigator && navigator.geolocation)) return
    navigator.geolocation.getCurrentPosition(p=>{
      setPos({lat:p.coords.latitude,lon:p.coords.longitude})
    }, ()=>{})
  },[])
  return pos
}
