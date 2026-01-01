import React, { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate, Link } from 'react-router-dom'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

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
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800 shadow-2xl w-full max-w-md">
        <h1 className="text-3xl font-bold text-white text-center mb-8">Login Digital Squad</h1>
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-slate-400 mb-2">Email</label>
            <input
              type="email"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-slate-400 mb-2">Password</label>
            <input
              type="password"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="flex justify-end">
            <Link to="/forgot-password" className="text-sm text-blue-400 hover:text-blue-300 transition">
              Lupa Password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-3 rounded-lg hover:opacity-90 transition"
          >
            {loading ? 'Loading...' : 'Masuk'}
          </button>
        </form>
        <p className="text-center text-slate-500 mt-6">
          Belum punya akun? <a href="/" className="text-blue-400 hover:underline">Daftar sekarang</a>
        </p>
      </div>
    </div>
  )
}
