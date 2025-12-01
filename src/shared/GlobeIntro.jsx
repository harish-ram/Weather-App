import React from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Stars } from '@react-three/drei'

function Globe(){
  return (
    <mesh>
      <sphereGeometry args={[2.2, 64, 64]} />
      <meshStandardMaterial roughness={0.6} metalness={0.1} color="#0ea5a4" />
    </mesh>
  )
}

export default function GlobeIntro(){
  return (
    <div className="w-full h-64 rounded-lg overflow-hidden glass-card">
      <Canvas camera={{ position: [0,0,6] }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[5,5,5]} intensity={0.8} />
        <Globe />
        <Stars />
        <OrbitControls enableZoom={false} />
      </Canvas>
    </div>
  )
}
