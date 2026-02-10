import { useRef, useState, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Sphere, MeshDistortMaterial } from '@react-three/drei'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { LogIn, BookOpen } from 'lucide-react'

const AuroraBackground = () => {
  return (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
      <div className="absolute -top-[50%] -left-[10%] w-[120%] h-[120%] bg-gradient-to-br from-purple-900/40 via-slate-900 to-blue-900/40 animate-aurora opacity-50 filter blur-[80px]"></div>
      <div className="absolute top-[20%] left-[10%] w-96 h-96 bg-cyan-500/20 rounded-full blur-[120px] animate-pulse-slow"></div>
      <div className="absolute bottom-[20%] right-[10%] w-96 h-96 bg-purple-500/20 rounded-full blur-[120px] animate-pulse-slow delay-1000"></div>
    </div>
  )
}

const AnimatedSphere = () => {
  const ref = useRef<any>(null)
  useFrame((state) => {
    const t = state.clock.getElapsedTime()
    // @ts-ignore
    if (ref.current) {
      ref.current.distort = 0.3 + Math.sin(t * 0.5) * 0.2
    }
  })

  const meshRef = useRef<any>(null)
  useFrame((state) => {
    const t = state.clock.getElapsedTime()
    if (meshRef.current) {
      meshRef.current.rotation.x = t * 0.1
      meshRef.current.rotation.y = t * 0.15
    }
  })

  return (
    <Sphere ref={meshRef} args={[1, 100, 200]} scale={2.2}>
      <MeshDistortMaterial
        ref={ref}
        color="#4f46e5" // Indigo-600
        attach="material"
        distort={0.4}
        speed={1.5}
        roughness={0.2}
        metalness={0.8}
      />
    </Sphere>
  )
}

export default function Hero3D() {
  const [isMobile, setIsMobile] = useState(true) // Default to true for safety/performance first

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  return (
    <div className="h-[90vh] w-full relative bg-slate-950 overflow-hidden flex items-center justify-center">
      <AuroraBackground />
      <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-10 mix-blend-overlay z-0"></div>

      {/* Navigation Buttons - Absolute Top Right */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.5 }}
        className="absolute top-6 right-6 z-50 flex items-center gap-3"
      >
        <Link
          to="/blog"
          className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/10 text-white/90 hover:text-white font-medium transition-all duration-300 shadow-lg hover:shadow-indigo-500/20 group"
        >
          <span className="text-sm">Blog</span>
          <BookOpen className="w-4 h-4 text-pink-400 group-hover:text-pink-300 transition-colors" />
        </Link>
        <Link
          to="/login"
          className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/10 text-white/90 hover:text-white font-medium transition-all duration-300 shadow-lg hover:shadow-indigo-500/20 group"
        >
          <span className="text-sm">Login</span>
          <LogIn className="w-4 h-4 text-indigo-400 group-hover:text-indigo-300 transition-colors" />
        </Link>
      </motion.div>

      {/* 3D Background Layer - Desktop Only */}
      {!isMobile && (
        <div className="absolute inset-0 z-0 opacity-60">
          <Canvas camera={{ position: [0, 0, 6] }}>
            <ambientLight intensity={0.5} />
            <directionalLight position={[10, 10, 5]} intensity={1.5} color="#818cf8" />
            <pointLight position={[-10, -10, -10]} color="#c084fc" intensity={1} />
            <AnimatedSphere />
            <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={0.5} />
          </Canvas>
        </div>
      )}

      {/* Mobile Fallback Background */}
      {isMobile && (
        <div className="absolute inset-0 z-0 flex items-center justify-center opacity-30">
          <div className="w-[300px] h-[300px] bg-indigo-600/30 rounded-full blur-[80px] animate-pulse"></div>
        </div>
      )}
      {/* Content Layer */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 text-center flex flex-col items-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }} // Reduced y distance
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }} // Faster animation
        ><br></br><br></br>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-white leading-tight tracking-tight mb-6 drop-shadow-2xl">
            Belajar Bisnis Digital & Dapat Penghasilan Tambahan Di<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Digital Squad!</span>
          </h1>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <h2 className="text-xl md:text-2xl text-slate-300 mb-8 leading-relaxed max-w-2xl mx-auto font-light">
            <span className="text-yellow-400 font-bold">Platform #1 untuk pemula</span> yang ingin belajar bisnis digital & dapatkan penghasilan tambahan dari HP tanpa perlu bikin produk sendiri.
            <span className="text-yellow-400 font-bold"> Cara mudah belajar bisnis digital.</span> Anda tinggal Contek, Praktek, dan Hasilkan! <span className="italic"></span>
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="relative group"
        >
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-full blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-tilt"></div>
          <button
            onClick={() => document.getElementById('reality-check')?.scrollIntoView({ behavior: 'smooth' })}
            className="relative flex items-center justify-center bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white font-bold py-4 px-10 rounded-full text-lg shadow-2xl shadow-green-500/30 transform transition duration-200 hover:scale-[1.05] hover:-translate-y-1"
          >
            Pelajari Selengkapnya
            <div className="absolute inset-0 rounded-full ring-2 ring-white/20 group-hover:ring-white/40 transition-all" />
          </button>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-4 text-sm text-slate-500 font-medium flex items-center gap-2"
        >
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
          🔒 Komisi dan penjualan bisa dipantau
        </motion.p>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-4 text-sm text-slate-500 font-medium flex items-center gap-2"
        >
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
          📲 Bisa dari HP: Cocok untuk pemula
        </motion.p>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-4 text-sm text-slate-500 font-medium flex items-center gap-2"
        >
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
          Sudah dibuktikan oleh 5.000+ member.
        </motion.p>
      </div>
    </div>
  )
}
