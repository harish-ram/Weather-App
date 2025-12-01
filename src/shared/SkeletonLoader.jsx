import React from 'react'

export default function SkeletonLoader({width='100%',height=16}){
  return (
    <div style={{width,height,background:'linear-gradient(90deg,#0b2540 25%, #0f3b55 50%, #0b2540 75%)',backgroundSize:'200% 100%',animation:'pulse 1.6s infinite'}} />
  )
}
