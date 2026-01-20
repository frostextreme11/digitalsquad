import React, { useState, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { supabase } from '../lib/supabase'
import { useNavigate, Link } from 'react-router-dom'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { data: { user }, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error

      if (user) {
        // Check transaction status
        const { data: transaction } = await supabase
          .from('transactions')
          .select('status')
          .eq('user_id', user.id)
          .eq('type', 'registration')
          .eq('status', 'success') // Only check success for now, as settlement is not in enum
          .limit(1)
          .maybeSingle()

        if (transaction) {
          navigate('/dashboard')
        } else {
          navigate('/payment')
        }
      }
    } catch (error: any) {
      alert(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4 relative overflow-hidden">
      <Helmet>
        <title>Login Member Area - Digital Squad</title>
        <meta name="description" content="Masuk ke member area Digital Squad untuk mengakses materi pembelajaran, tools bisnis online, dan dashboard affiliate." />
      </Helmet>

      {/* Animated Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Primary Aurora Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-indigo-600/20 blur-[120px] animate-pulse-glow" />

        {/* Secondary Floating Glow */}
        <div className="absolute top-1/4 left-1/4 w-[350px] h-[350px] rounded-full bg-gradient-to-r from-blue-500/25 to-cyan-500/25 blur-[80px] animate-float-slow" />

        {/* Tertiary Floating Glow */}
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 blur-[100px] animate-float-reverse" />

        {/* Accent Glow */}
        <div className="absolute top-1/3 right-1/3 w-[250px] h-[250px] rounded-full bg-gradient-to-r from-indigo-400/15 to-violet-500/15 blur-[60px] animate-pulse-slow" />

        {/* Floating Particles */}
        <div className="absolute inset-0">
          {[...Array(15)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-blue-400/50 rounded-full animate-particle"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 4}s`,
                animationDuration: `${4 + Math.random() * 4}s`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Login Card */}
      <div
        className={`relative z-10 w-full max-w-md transition-all duration-700 ease-out ${mounted ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-95'
          }`}
      >
        {/* Card Outer Glow */}
        <div className="absolute -inset-1 bg-gradient-to-r from-blue-600/30 via-purple-600/30 to-indigo-600/30 rounded-3xl blur-xl opacity-60 animate-card-glow" />

        {/* Glass Card */}
        <div className="relative bg-gradient-to-br from-slate-800/60 via-slate-900/80 to-slate-950/90 backdrop-blur-xl border border-blue-500/20 rounded-2xl p-8 shadow-2xl shadow-blue-500/10 overflow-hidden">
          {/* Inner Card Glow Effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5 rounded-2xl" />

          {/* Animated Border Shimmer */}
          <div className="absolute inset-0 rounded-2xl animate-border-shimmer" />

          {/* Logo/Icon Area */}
          <div className="relative flex justify-center mb-6">
            <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/40 animate-logo-pulse">
              <div className="absolute inset-1 rounded-full bg-gradient-to-br from-white/20 to-transparent" />
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            {/* Icon Glow Ring */}
            <div className="absolute w-20 h-20 rounded-full border border-blue-400/30 animate-spin-very-slow" style={{ top: '-8px' }} />
          </div>

          <h1 className="relative text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-300 via-purple-300 to-indigo-300 text-center mb-8">
            Login Digital Squad
          </h1>

          <form onSubmit={handleLogin} className="relative space-y-6">
            {/* Email Field */}
            <div className="group">
              <label className="block text-slate-300 mb-2 text-sm font-medium">Email</label>
              <div className="relative">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/50 to-purple-500/50 rounded-lg opacity-0 group-focus-within:opacity-100 blur transition-opacity duration-300" />
                <input
                  type="email"
                  className="relative w-full bg-slate-800/80 border border-slate-600/50 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-400/70 focus:bg-slate-800 transition-all duration-300"
                  placeholder="Masukkan email Anda"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="group">
              <label className="block text-slate-300 mb-2 text-sm font-medium">Password</label>
              <div className="relative">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/50 to-purple-500/50 rounded-lg opacity-0 group-focus-within:opacity-100 blur transition-opacity duration-300" />
                <input
                  type="password"
                  className="relative w-full bg-slate-800/80 border border-slate-600/50 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-400/70 focus:bg-slate-800 transition-all duration-300"
                  placeholder="Masukkan password Anda"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Link to="/forgot-password" className="text-sm text-blue-400 hover:text-blue-300 transition-colors duration-300 hover:underline">
                Lupa Password?
              </Link>
            </div>

            {/* Glowing Animated Button */}
            <div className="relative">
              {/* Button Outer Glow */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-xl blur-lg opacity-50 animate-button-glow" />

              {/* Button Pulse Ring */}
              <div className="absolute inset-0 rounded-xl animate-button-pulse-ring" />

              <button
                type="submit"
                disabled={loading}
                className="relative w-full bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-500/30 overflow-hidden group transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/40 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {/* Button Shimmer Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />

                {/* Button Inner Glow */}
                <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/10 rounded-xl" />

                <span className="relative flex items-center justify-center gap-2">
                  {loading ? (
                    <>
                      <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Sedang Masuk...</span>
                    </>
                  ) : (
                    <>
                      <span>Masuk</span>
                      <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </>
                  )}
                </span>
              </button>
            </div>
          </form>

          <p className="relative text-center text-slate-400 mt-8">
            Belum punya akun?{' '}
            <a href="/" className="text-blue-400 hover:text-blue-300 font-medium transition-colors duration-300 hover:underline">
              Daftar sekarang
            </a>
          </p>

          {/* Decorative Corner Glows */}
          <div className="absolute -top-2 -left-2 w-4 h-4 bg-blue-400/50 rounded-full blur-sm animate-corner-glow" />
          <div className="absolute -top-2 -right-2 w-3 h-3 bg-purple-400/50 rounded-full blur-sm animate-corner-glow-delay" />
          <div className="absolute -bottom-2 -left-2 w-3 h-3 bg-indigo-400/50 rounded-full blur-sm animate-corner-glow-delay" />
          <div className="absolute -bottom-2 -right-2 w-4 h-4 bg-cyan-400/50 rounded-full blur-sm animate-corner-glow" />
        </div>
      </div>

      {/* Custom Animations */}
      <style>{`
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.4; transform: translate(-50%, -50%) scale(1); }
          50% { opacity: 0.7; transform: translate(-50%, -50%) scale(1.1); }
        }
        
        @keyframes float-slow {
          0%, 100% { transform: translateY(0) translateX(0); }
          25% { transform: translateY(-25px) translateX(15px); }
          50% { transform: translateY(-15px) translateX(-10px); }
          75% { transform: translateY(-30px) translateX(20px); }
        }
        
        @keyframes float-reverse {
          0%, 100% { transform: translateY(0) translateX(0); }
          25% { transform: translateY(20px) translateX(-15px); }
          50% { transform: translateY(10px) translateX(15px); }
          75% { transform: translateY(25px) translateX(-10px); }
        }
        
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.15); }
        }
        
        @keyframes particle {
          0% { opacity: 0; transform: translateY(0) scale(0); }
          25% { opacity: 1; transform: translateY(-40px) scale(1); }
          75% { opacity: 0.4; transform: translateY(-100px) scale(0.5); }
          100% { opacity: 0; transform: translateY(-140px) scale(0); }
        }
        
        @keyframes card-glow {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.7; }
        }
        
        @keyframes border-shimmer {
          0% { box-shadow: inset 0 0 20px rgba(59, 130, 246, 0.1); }
          50% { box-shadow: inset 0 0 40px rgba(147, 51, 234, 0.15); }
          100% { box-shadow: inset 0 0 20px rgba(59, 130, 246, 0.1); }
        }
        
        @keyframes logo-pulse {
          0%, 100% { box-shadow: 0 0 20px rgba(59, 130, 246, 0.4), 0 0 40px rgba(147, 51, 234, 0.2); }
          50% { box-shadow: 0 0 30px rgba(59, 130, 246, 0.6), 0 0 60px rgba(147, 51, 234, 0.3); }
        }
        
        @keyframes spin-very-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        @keyframes button-glow {
          0%, 100% { opacity: 0.4; transform: scale(0.98); }
          50% { opacity: 0.7; transform: scale(1.02); }
        }
        
        @keyframes button-pulse-ring {
          0% { box-shadow: 0 0 0 0 rgba(147, 51, 234, 0.4); }
          70% { box-shadow: 0 0 0 15px rgba(147, 51, 234, 0); }
          100% { box-shadow: 0 0 0 0 rgba(147, 51, 234, 0); }
        }
        
        @keyframes corner-glow {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.3); }
        }
        
        @keyframes corner-glow-delay {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.4); }
        }
        
        .animate-pulse-glow {
          animation: pulse-glow 5s infinite ease-in-out;
        }
        
        .animate-float-slow {
          animation: float-slow 10s infinite ease-in-out;
        }
        
        .animate-float-reverse {
          animation: float-reverse 9s infinite ease-in-out;
        }
        
        .animate-pulse-slow {
          animation: pulse-slow 6s infinite ease-in-out;
        }
        
        .animate-particle {
          animation: particle 5s infinite ease-out;
        }
        
        .animate-card-glow {
          animation: card-glow 4s infinite ease-in-out;
        }
        
        .animate-border-shimmer {
          animation: border-shimmer 4s infinite ease-in-out;
        }
        
        .animate-logo-pulse {
          animation: logo-pulse 3s infinite ease-in-out;
        }
        
        .animate-spin-very-slow {
          animation: spin-very-slow 15s infinite linear;
        }
        
        .animate-button-glow {
          animation: button-glow 2.5s infinite ease-in-out;
        }
        
        .animate-button-pulse-ring {
          animation: button-pulse-ring 2s infinite;
        }
        
        .animate-corner-glow {
          animation: corner-glow 3s infinite ease-in-out;
        }
        
        .animate-corner-glow-delay {
          animation: corner-glow-delay 3s infinite ease-in-out 1.5s;
        }
      `}</style>
    </div>
  )
}
