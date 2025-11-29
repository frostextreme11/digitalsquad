import { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Sphere, MeshDistortMaterial } from '@react-three/drei'

const AnimatedSphere = () => {
  const ref = useRef<any>(null)
  useFrame((state) => {
    const t = state.clock.getElapsedTime()
    // @ts-ignore
    if (ref.current) {
        ref.current.distort = 0.4 + Math.sin(t) * 0.2
    }
  })
  
  const meshRef = useRef<any>(null)
  useFrame((state) => {
    const t = state.clock.getElapsedTime()
    if (meshRef.current) {
        meshRef.current.rotation.x = t * 0.2
        meshRef.current.rotation.y = t * 0.2
    }
  })

  return (
    <Sphere ref={meshRef} args={[1, 100, 200]} scale={2.2}>
      <MeshDistortMaterial
        ref={ref}
        color="#6366f1"
        attach="material"
        distort={0.4}
        speed={1.5}
        roughness={0.1}
        metalness={0.9}
      />
    </Sphere>
  )
}

export default function Hero3D() {
  return (
    <div className="h-[80vh] w-full relative bg-slate-900 overflow-hidden">
       <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
       <Canvas camera={{ position: [0, 0, 6] }}>
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 5]} intensity={1.5} color="#a855f7" />
          <pointLight position={[-10, -10, -10]} color="#3b82f6" intensity={1} />
          <AnimatedSphere />
          <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={0.5} />
       </Canvas>
       <div className="absolute top-0 left-0 w-full h-full flex flex-col items-center justify-center pointer-events-none px-4">
          <h1 className="text-6xl md:text-8xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 text-center drop-shadow-[0_0_15px_rgba(168,85,247,0.5)] z-10 animate-pulse">
            DIGITAL SQUAD
          </h1>
          <p className="text-lg md:text-2xl text-slate-200 mt-6 max-w-3xl text-center drop-shadow-md z-10 font-medium">
            Platform Affiliate Paling Cuan di 2025. <br/>
            <span className="text-blue-400">Modal 50rb, Potensi 5-10 Juta!</span>
          </p>
          <div className="mt-8 pointer-events-auto z-20">
            <a href="#register" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold py-4 px-10 rounded-full shadow-lg transform hover:scale-105 transition duration-300 text-xl border border-white/20 backdrop-blur-sm">
              Join Sekarang
            </a>
          </div>
       </div>
    </div>
  )
}
