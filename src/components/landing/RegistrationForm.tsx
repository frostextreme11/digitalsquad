import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Link, useNavigate } from 'react-router-dom'
import { Star, Crown, Check, Gift, Timer } from 'lucide-react'
import { motion } from 'framer-motion'

export default function RegistrationForm() {
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const [selectedTier, setSelectedTier] = useState<'basic' | 'pro'>('basic')
  const [tierIds, setTierIds] = useState<Record<string, string>>({})
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: ''
  })

  // Countdown Timer State
  const [timeLeft, setTimeLeft] = useState({ h: 2, m: 59, s: 59 })

  const tierPricing = {
    basic: { name: 'SQUAD MEMBER', price: 50000, commission: '30%' },
    pro: { name: 'SQUAD ELITE', price: 150000, commission: '50%' }
  }

  // Load Snap Script & Tiers & Timer
  useEffect(() => {
    const snapUrl = 'https://app.sandbox.midtrans.com/snap/snap.js'
    const clientKey = import.meta.env.VITE_MIDTRANS_CLIENT_KEY || 'SB-Mid-client-placeholder'

    const script = document.createElement('script')
    script.src = snapUrl
    script.setAttribute('data-client-key', clientKey)
    script.async = true
    document.body.appendChild(script)

    // Check if tier was pre-selected from TierPricing section
    const preSelectedTier = sessionStorage.getItem('selectedTier')
    if (preSelectedTier === 'basic' || preSelectedTier === 'pro') {
      setSelectedTier(preSelectedTier)
      sessionStorage.removeItem('selectedTier')
    }

    // Fetch Tier IDs
    const fetchTiers = async () => {
      const { data } = await supabase.from('tiers').select('id, tier_key')
      if (data) {
        const mapping: Record<string, string> = {}
        data.forEach((tier: any) => {
          mapping[tier.tier_key] = tier.id
        })
        setTierIds(mapping)
      }
    }
    fetchTiers()

    // Timer Logic
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.s > 0) return { ...prev, s: prev.s - 1 }
        else if (prev.m > 0) return { ...prev, m: prev.m - 1, s: 59 }
        else if (prev.h > 0) return { ...prev, h: prev.h - 1, m: 59, s: 59 }
        else return { h: 0, m: 0, s: 0 }
      })
    }, 1000)

    return () => {
      clearInterval(timer)
      // if (document.body.contains(script)) {
      //   document.body.removeChild(script)
      // }
    }
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // 0. Ensure we have the Tier ID
      let effectiveTierId = tierIds[selectedTier];
      if (!effectiveTierId) {
        // Fallback fetch if state wasn't ready
        const { data } = await supabase.from('tiers').select('id').eq('tier_key', selectedTier).single();
        if (data) effectiveTierId = data.id;
      }

      // 1. Get Referral from localStorage
      const referredByCode = localStorage.getItem('affiliate_ref')
      let referrerId = null

      if (referredByCode) {
        const { data: refProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('affiliate_code', referredByCode)
          .single()
        if (refProfile) referrerId = refProfile.id
      }

      // Sign Up with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            phone: formData.phone,
            role: 'agent',
            referred_by: referrerId,
            tier_id: effectiveTierId // Update trigger will use this
          }
        }
      })

      if (authError) {
        if (authError.message.includes("already registered") || authError.message.includes("already exists")) {
          const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
            email: formData.email,
            password: formData.password
          })

          if (loginError) {
            alert("Email sudah terdaftar. Silakan login jika Anda sudah punya akun.")
            setLoading(false)
            return
          }

          if (loginData.user) {
            // If logging in, try to set the tier if not set
            if (effectiveTierId) {
              await supabase.rpc('set_registration_tier', { tier_id: effectiveTierId })
            }
            navigate('/payment')
            return
          }
        }
        throw authError
      }

      if (!authData.user) throw new Error("Gagal membuat akun")

      // Force set tier using RPC (Bypasses RLS issues)
      if (effectiveTierId) {
        const { error: rpcError } = await supabase.rpc('set_registration_tier', { tier_id: effectiveTierId })
        if (rpcError) console.error("Failed to set tier via RPC:", rpcError)
      }

      // Also ensure profile fields are consistent (optional redundant check)
      await supabase.from('profiles').update({
        full_name: formData.fullName,
        phone: formData.phone,
        referred_by: referrerId
      }).eq('id', authData.user.id)

      await new Promise(resolve => setTimeout(resolve, 1000));

      // Calculate amount based on selected tier
      const paymentAmount = tierPricing[selectedTier].price

      // Call Edge Function
      const functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-payment`;

      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          amount: paymentAmount,
          userId: authData.user.id,
          type: 'registration',
          referralCode: referredByCode,
          selectedTier: selectedTier,
          customerDetails: {
            first_name: formData.fullName,
            email: formData.email,
            phone: formData.phone
          }
        })
      })

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Function Error:", errorText);
        throw new Error(`Payment Server Error: ${response.status} - ${errorText}`);
      }

      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      if (data.token) {
        // @ts-ignore
        window.snap.pay(data.token, {
          onSuccess: function (result: any) {
            console.log('success', result)
            window.location.href = '/dashboard'
          },
          onPending: function (result: any) {
            console.log('pending', result)
            window.location.href = '/dashboard?pending=true'
          },
          onError: function (result: any) {
            console.log('error', result)
            alert("Payment failed!")
          },
          onClose: function () {
            console.log('closed')
          }
        })
      } else {
        alert('Gagal memuat pembayaran. Cek koneksi atau coba lagi.')
      }

    } catch (error: any) {
      console.error(error)
      alert('Terjadi kesalahan: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const currentTier = tierPricing[selectedTier]

  return (
    <section id="register" className="py-20 bg-slate-950 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900 to-slate-950"></div>
      <div className="container mx-auto px-4 max-w-lg relative z-10">

        {/* FOMO Section with Luxury Animation */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="relative mb-8 group"
        >
          {/* Animated Border/Glow */}
          <div className="absolute -inset-0.5 bg-gradient-to-r from-yellow-600 via-yellow-300 to-yellow-600 rounded-2xl opacity-75 blur-sm group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-tilt"></div>

          <div className="relative bg-gradient-to-br from-slate-900 to-slate-800 p-6 rounded-2xl border border-yellow-500/50 overflow-hidden">
            {/* Shine Effect */}
            <div className="absolute top-0 -left-[100%] w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12 animate-shimmer"></div>

            <div className="absolute top-0 right-0 p-3 opacity-20 text-yellow-500">
              <Gift size={100} />
            </div>

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-yellow-400 bg-yellow-400/10 px-3 py-1 rounded-full border border-yellow-400/20">
                  <Timer className="w-4 h-4 animate-pulse" />
                  <span className="font-bold text-xs tracking-widest uppercase">Berakhir Dalam</span>
                </div>
                <div className="font-mono text-xl font-bold text-white tracking-widest tabular-nums bg-slate-950 px-3 py-1 rounded-md border border-slate-700">
                  {String(timeLeft.h).padStart(2, '0')} : {String(timeLeft.m).padStart(2, '0')} : {String(timeLeft.s).padStart(2, '0')}
                </div>
              </div>

              <h3 className="text-xl font-bold text-white mb-2 leading-tight">
                🎁 Bonus <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-amber-500">Produk Digital Premium</span>
              </h3>
              <p className="text-slate-300 text-sm mb-4 leading-relaxed">
                Daftar sekarang dan dapatkan database produk senilai <strong className="text-yellow-400">Rp 10.000.000+</strong> secara GRATIS. Bisa dijual kembali 100% profit milik Anda!
              </p>

              <div className="flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-wider text-yellow-500/80">
                <span className="bg-slate-950/50 px-2 py-1 rounded border border-yellow-500/20">Limited Invitation</span>
                <span className="bg-slate-950/50 px-2 py-1 rounded border border-yellow-500/20">Auto-Access</span>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="bg-slate-900/80 backdrop-blur-lg p-8 rounded-2xl border border-slate-700/50 shadow-2xl ring-1 ring-white/10">
          <h2 className="text-3xl font-bold text-white text-center mb-2">Join Digital Squad</h2>
          <p className="text-center text-slate-400 mb-6">Pilih tier dan mulai perjalanan cuan-mu!</p>

          {/* Tier Selection */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <button
              type="button"
              onClick={() => setSelectedTier('basic')}
              className={`p-4 rounded-xl border-2 transition duration-200 text-left ${selectedTier === 'basic'
                ? 'border-slate-500 bg-slate-800/50 ring-2 ring-slate-500/50'
                : 'border-slate-700 bg-slate-800/30 hover:border-slate-600'
                }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <Star size={18} className="text-slate-400" />
                <span className="font-bold text-white text-sm">Basic</span>
                {selectedTier === 'basic' && <Check size={16} className="text-green-400 ml-auto" />}
              </div>
              <p className="text-lg font-bold text-white">Rp 50.000</p>
              <p className="text-xs text-slate-400">Komisi 30%</p>
            </button>

            <button
              type="button"
              onClick={() => setSelectedTier('pro')}
              className={`p-4 rounded-xl border-2 transition duration-200 text-left relative ${selectedTier === 'pro'
                ? 'border-blue-500 bg-blue-900/30 ring-2 ring-blue-500/50'
                : 'border-slate-700 bg-slate-800/30 hover:border-blue-600'
                }`}
            >
              <div className="absolute -top-2 -right-2 bg-yellow-500 text-black text-[10px] font-bold px-2 py-0.5 rounded-full">
                BEST
              </div>
              <div className="flex items-center gap-2 mb-2">
                <Crown size={18} className="text-blue-400" />
                <span className="font-bold text-white text-sm">Pro</span>
                {selectedTier === 'pro' && <Check size={16} className="text-green-400 ml-auto" />}
              </div>
              <p className="text-lg font-bold text-white">Rp 150.000</p>
              <p className="text-xs text-blue-400">Komisi 50%</p>
            </button>
          </div>

          {/* Total Display */}
          <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 border border-blue-500/30 rounded-xl p-4 mb-6 text-center">
            <p className="text-slate-400 text-sm mb-1">Total yang harus dibayar:</p>
            <p className="text-3xl font-black text-white">
              Rp {currentTier.price.toLocaleString('id-ID')}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {currentTier.name} • Komisi {currentTier.commission} per penjualan
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-slate-300 mb-1 text-sm font-medium">Nama Lengkap</label>
              <input
                type="text"
                name="fullName"
                required
                className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                placeholder="Contoh: Agus Setiawan"
                onChange={handleChange}
              />
            </div>
            <div>
              <label className="block text-slate-300 mb-1 text-sm font-medium">Email</label>
              <input
                type="email"
                name="email"
                required
                className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                placeholder="nama@email.com"
                onChange={handleChange}
              />
            </div>
            <div>
              <label className="block text-slate-300 mb-1 text-sm font-medium">No. WhatsApp</label>
              <input
                type="tel"
                name="phone"
                required
                className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                placeholder="081234567890"
                onChange={handleChange}
              />
            </div>
            <div>
              <label className="block text-slate-300 mb-1 text-sm font-medium">Password</label>
              <input
                type="password"
                name="password"
                required
                minLength={6}
                className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                placeholder="******"
                onChange={handleChange}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-3.5 rounded-lg hover:opacity-90 transition disabled:opacity-50 mt-6 shadow-lg shadow-blue-600/20"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Mohon tunggu sebentar, link pembelian sedang di buat :)</span>
                </div>
              ) : `Daftar ${currentTier.name} - Rp ${currentTier.price.toLocaleString('id-ID')}`}
            </button>
            <p className="text-xs text-slate-500 text-center mt-4">
              Dengan mendaftar, Anda menyetujui Syarat & Ketentuan kami.
            </p>
            <div className="mt-6 pt-6 border-t border-slate-800 text-center">
              <p className="text-slate-400">
                Sudah join? akses ke sini: <Link to="/login" className="text-blue-400 hover:text-blue-300 font-medium hover:underline">Login</Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </section>
  )
}
