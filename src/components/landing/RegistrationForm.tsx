import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Link, useNavigate } from 'react-router-dom'

export default function RegistrationForm() {
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: ''
  })

  // Load Snap Script
  useEffect(() => {
    const snapUrl = 'https://app.sandbox.midtrans.com/snap/snap.js'
    const clientKey = import.meta.env.VITE_MIDTRANS_CLIENT_KEY || 'SB-Mid-client-placeholder' // User needs to set this

    const script = document.createElement('script')
    script.src = snapUrl
    script.setAttribute('data-client-key', clientKey)
    script.async = true
    document.body.appendChild(script)

    return () => {
      document.body.removeChild(script)
    }
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // 0. Get Referral from localStorage (set by useAffiliateTracker)
      const referredByCode = localStorage.getItem('affiliate_ref')
      let referrerId = null

      if (referredByCode) {
        // Resolve referrer ID from code
        const { data: refProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('affiliate_code', referredByCode)
          .single()
        if (refProfile) referrerId = refProfile.id
      }

      // 0. Sign Up with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            phone: formData.phone,
            role: 'agent', // optional, triggers logic
            referred_by: referrerId
          }
        }
      })

      if (authError) {
        if (authError.message.includes("already registered") || authError.message.includes("already exists")) {
          // Try auto-login
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
            // Check payment status by redirecting to payment page which handles the check
            navigate('/payment')
            return
          }
        }
        throw authError
      }

      if (!authData.user) throw new Error("Gagal membuat akun")

      // 0.5. Create Profile Entry Manually - Force it!
      // We loop a bit or wait to ensure it's there because even upsert might fail if auth.users isn't ready in some race conditions
      // or RLS prevents insert.
      // Let's try a direct insert and ignore error if it exists.

      const { error: profileError } = await supabase.from('profiles').upsert({
        id: authData.user.id,
        email: formData.email,
        full_name: formData.fullName,
        phone: formData.phone,
        role: 'agent',
        referred_by: referrerId // Explicitly set referrer
      })

      if (profileError) {
        console.log("Profile upsert error (might be handled by trigger):", profileError)
      }

      // Wait a second to ensure DB consistency if trigger is slow
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 1. Call Edge Function to Create Transaction & Get Snap Token
      // Note: Ensure your Edge Function is deployed and available.
      const functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-payment`;

      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          amount: 50000,
          userId: authData.user.id, // Pass newly created User ID
          type: 'registration',
          referralCode: referredByCode, // Pass referral code explicitly for patching
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

  return (
    <section id="register" className="py-20 bg-slate-950 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900 to-slate-950"></div>
      <div className="container mx-auto px-4 max-w-md relative z-10">
        <div className="bg-slate-900/80 backdrop-blur-lg p-8 rounded-2xl border border-slate-700/50 shadow-2xl ring-1 ring-white/10">
          <h2 className="text-3xl font-bold text-white text-center mb-2">Join Digital Squad</h2>
          <p className="text-center text-slate-400 mb-8">Biaya pendaftaran hanya <span className="text-green-400 font-bold">Rp 50.000</span>.<br />Sekali bayar, cuan berkali-kali.</p>

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
              {loading ? 'Memproses...' : 'Daftar Sekarang'}
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
