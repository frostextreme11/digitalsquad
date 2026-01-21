import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Link, useNavigate } from 'react-router-dom'
import { Star, Crown, Check, Gift, Timer } from 'lucide-react'
import { motion } from 'framer-motion'
import { trackEvent } from '../../lib/pixel'

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

  // Dynamic Tier Pricing State
  // Initialize with null/loading or safe fallback to prevent crashes, but rely on effect
  const [tierPricing, setTierPricing] = useState<Record<string, any>>({
    basic: { name: 'SQUAD MEMBER', price: 50000, commission: '...' },
    pro: { name: 'SQUAD ELITE', price: 150000, commission: '...' }
  })

  // Countdown Timer State
  const [timeLeft, setTimeLeft] = useState({ h: 2, m: 59, s: 59 })

  // Load Snap Script & Tiers & Timer
  useEffect(() => {
    const loadSnap = async () => {
      // Fetch Snap URL and Client Key from DB configuration
      const { data: configs } = await supabase
        .from('app_config')
        .select('key, value')
        .in('key', ['midtrans_snap_url', 'midtrans_client_key'])

      const configMap = configs?.reduce((acc: any, curr: any) => ({ ...acc, [curr.key]: curr.value }), {}) || {}

      const snapUrl = configMap['midtrans_snap_url'] || 'https://app.sandbox.midtrans.com/snap/snap.js'
      // Use DB key if available, otherwise fallback to env
      const clientKey = configMap['midtrans_client_key'] !== 'SB-Mid-client-placeholder'
        ? configMap['midtrans_client_key']
        : (import.meta.env.VITE_MIDTRANS_CLIENT_KEY || 'SB-Mid-client-placeholder')

      // Check if script already exists
      if (!document.querySelector(`script[src="${snapUrl}"]`)) {
        const script = document.createElement('script')
        script.src = snapUrl
        script.setAttribute('data-client-key', clientKey)
        script.async = true
        document.body.appendChild(script)
      }
    }

    loadSnap()

    // Check if tier was pre-selected from TierPricing section
    const preSelectedTier = sessionStorage.getItem('selectedTier')
    if (preSelectedTier === 'basic' || preSelectedTier === 'pro') {
      setSelectedTier(preSelectedTier)
      sessionStorage.removeItem('selectedTier')
    }

    // Listen for custom tier selection event (for when component is already mounted)
    const handleTierSelection = (e: Event) => {
      const customEvent = e as CustomEvent
      if (customEvent.detail === 'basic' || customEvent.detail === 'pro') {
        setSelectedTier(customEvent.detail)
      }
    }
    window.addEventListener('tierSelected', handleTierSelection)

    // Fetch Tier IDs and Pricing
    const fetchTiers = async () => {
      const { data } = await supabase.from('tiers').select('id, tier_key, registration_price, name, commission_rate, description')
      if (data && data.length > 0) {
        setTierIds(prev => {
          const mapping: Record<string, string> = { ...prev };
          data.forEach((tier: any) => {
            if (tier.tier_key) mapping[tier.tier_key] = tier.id;
          });
          return mapping;
        });

        // Initialize empty pricing to ensure we overwrite completely
        const newPricing: Record<string, any> = {};

        data.forEach((tier: any) => {
          if (tier.tier_key === 'basic' || tier.tier_key === 'pro') {
            const commRate = Number(tier.commission_rate || (tier.tier_key === 'basic' ? 0.5 : 0.7));
            newPricing[tier.tier_key] = {
              name: tier.name,
              price: tier.registration_price,
              commission: `${Math.round(commRate * 100)}%`
            }
          }
        })

        // If data was fetched but keys missing for some reason
        if (!newPricing.basic) {
          newPricing.basic = { name: 'SQUAD MEMBER', price: 50000, commission: '50%' }
        }
        if (!newPricing.pro) {
          newPricing.pro = { name: 'SQUAD ELITE', price: 150000, commission: '70%' }
        }

        setTierPricing(newPricing);
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
      window.removeEventListener('tierSelected', handleTierSelection)
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
      // Safety: use fallback or optional chaining
      const price = tierPricing[selectedTier]?.price || 50000

      // Track Registration Pixel
      trackEvent('CompleteRegistration', {
        content_name: selectedTier,
        value: price,
        currency: 'IDR'
      })

      // Call Edge Function
      const functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-payment`;

      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          amount: price,
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

      // Handle based on gateway response
      if (data.gateway === 'mayar' && data.payment_url) {
        // Mayar: Redirect to payment page
        console.log('Redirecting to Mayar payment:', data.payment_url)
        trackEvent('InitiateCheckout', {
          value: price,
          currency: 'IDR',
          gateway: 'mayar'
        })
        window.location.href = data.payment_url
      } else if (data.token) {
        // Midtrans: Use Snap popup
        // @ts-ignore
        window.snap.pay(data.token, {
          onSuccess: function (result: any) {
            console.log('success', result)
            trackEvent('Purchase', {
              value: price,
              currency: 'IDR',
              order_id: data.token // or result.order_id if available
            })
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

  // Safe fallback
  const currentTier = tierPricing[selectedTier] || tierPricing.basic;

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
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2 text-yellow-400 bg-yellow-400/10 px-3 py-1.5 rounded-full border border-yellow-400/20 w-fit">
                  <Timer className="w-4 h-4 animate-pulse shrink-0" />
                  <span className="font-bold text-xs tracking-widest uppercase whitespace-nowrap">Berakhir Dalam</span>
                </div>
                <div className="font-mono text-2xl sm:text-xl font-bold text-white tracking-widest tabular-nums bg-slate-950 px-4 py-2 sm:py-1 rounded-md border border-slate-700 w-full sm:w-auto text-center shadow-inner">
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

        <motion.div
          animate={{
            boxShadow: selectedTier === 'pro'
              ? '0 0 40px rgba(59, 130, 246, 0.3)'
              : '0 0 0px rgba(0, 0, 0, 0)',
            borderColor: selectedTier === 'pro'
              ? 'rgba(59, 130, 246, 0.5)'
              : 'rgba(51, 65, 85, 0.5)'
          }}
          transition={{ duration: 0.5 }}
          className={`bg-slate-900/80 backdrop-blur-lg p-8 rounded-2xl border shadow-2xl ring-1 ring-white/10 transition-colors duration-500 relative overflow-hidden`}
        >
          {/* Background Ambient Glow for Pro */}
          {selectedTier === 'pro' && (
            <div className="absolute inset-0 bg-blue-500/5 z-0 pointer-events-none animate-pulse" />
          )}

          <div className="relative z-10">
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
                <p className="text-lg font-bold text-white">Rp {(tierPricing.basic?.price || 0).toLocaleString('id-ID')}</p>
                <p className="text-xs text-slate-400">Komisi {tierPricing.basic?.commission || '...'}</p>
              </button>

              <motion.button
                type="button"
                whileHover={{ scale: 1.02, boxShadow: "0 0 25px rgba(59, 130, 246, 0.4)" }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedTier('pro')}
                className={`p-4 rounded-xl border-2 transition-all duration-300 text-left relative overflow-visible ${selectedTier === 'pro'
                  ? 'border-blue-400 bg-gradient-to-br from-blue-900/60 via-indigo-900/40 to-slate-900/60 ring-2 ring-blue-400/50 shadow-[0_0_20px_rgba(59,130,246,0.2)]'
                  : 'border-slate-700 bg-slate-800/30 hover:border-blue-500 hover:bg-slate-800/50 shadow-[0_0_15px_rgba(59,130,246,0.15)] animate-pulse-slow' /* Added shadow and slow pulse to unselected state */
                  }`}
              >
                {/* Glowing Pulse Effect for Pro */}
                <div className="absolute inset-0 rounded-xl bg-blue-500/5 blur-xl animate-pulse" />

                <div className="absolute -top-3 -right-2 transform rotate-2">
                  <span className="relative flex h-6 w-auto">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                    <span className="relative inline-flex items-center justify-center px-3 py-0.5 rounded-full bg-gradient-to-r from-yellow-400 to-amber-500 text-slate-950 text-[10px] font-black uppercase tracking-wider shadow-lg ring-1 ring-white/20">
                      Most Popular
                    </span>
                  </span>
                </div>

                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`p-1.5 rounded-lg ${selectedTier === 'pro' ? 'bg-blue-500/20 text-blue-300' : 'bg-slate-700/50 text-slate-400'}`}>
                      <Crown size={18} className={selectedTier === 'pro' ? 'fill-blue-500/20' : ''} />
                    </div>
                    <span className={`font-bold text-sm ${selectedTier === 'pro' ? 'text-white' : 'text-slate-300'}`}>Squad Elite</span>
                    {selectedTier === 'pro' && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}><Check size={18} className="text-blue-400 ml-auto drop-shadow-[0_0_8px_rgba(96,165,250,0.8)]" /></motion.div>}
                  </div>

                  <div className="flex items-end gap-1 mb-1">
                    <p className="text-2xl font-black text-white tracking-tight">Rp {(tierPricing.pro?.price || 0).toLocaleString('id-ID')}</p>
                    {/* <p className="text-xs text-slate-500 line-through mb-1.5">Rp 300.000</p> */}
                  </div>

                  <div className={`text-xs px-2 py-1 rounded-md inline-block font-medium ${selectedTier === 'pro' ? 'bg-blue-500/20 text-blue-200 border border-blue-500/30' : 'text-slate-500 bg-slate-800'}`}>
                    🔥 Komisi {tierPricing.pro?.commission || '...'} / penjualan
                  </div>
                </div>
              </motion.button>
            </div>

            {/* Total Display */}
            <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 border border-blue-500/30 rounded-xl p-4 mb-6 text-center">
              <p className="text-slate-400 text-sm mb-1">Total yang harus dibayar:</p>
              <p className="text-3xl font-black text-white">
                Rp {(currentTier.price || 0).toLocaleString('id-ID')}
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
                    <span>Mohon tunggu sebentar, link pembayaran sedang di buat :)</span>
                  </div>
                ) : `Daftar ${currentTier.name} - Rp ${(currentTier.price || 0).toLocaleString('id-ID')}`}
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
        </motion.div>
      </div>
    </section>
  )
}
