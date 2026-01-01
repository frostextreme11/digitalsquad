import React, { useState } from 'react'
import { supabase } from '../lib/supabase'
import { Link } from 'react-router-dom'

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setMessage(null)

        try {
            // Allow user to reset password. 
            // Redirect to the update-password page after clicking the link in email
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/update-password`,
            })

            if (error) throw error

            setMessage({
                type: 'success',
                text: 'Instruksi reset password telah dikirim ke email Anda. Silakan cek inbox atau folder spam.'
            })
        } catch (error: any) {
            setMessage({
                type: 'error',
                text: error.message || 'Terjadi kesalahan saat mengirim instruksi reset password.'
            })
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
            <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800 shadow-2xl w-full max-w-md">
                <h1 className="text-3xl font-bold text-white text-center mb-4">Lupa Password?</h1>
                <p className="text-slate-400 text-center mb-8">
                    Masukkan email Anda untuk menerima instruksi reset password.
                </p>

                {message && (
                    <div className={`p-4 rounded-lg mb-6 ${message.type === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                        }`}>
                        {message.text}
                    </div>
                )}

                <form onSubmit={handleResetPassword} className="space-y-6">
                    <div>
                        <label className="block text-slate-400 mb-2">Email</label>
                        <input
                            type="email"
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            required
                            placeholder="nama@email.com"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-3 rounded-lg hover:opacity-90 transition disabled:opacity-50"
                    >
                        {loading ? 'Mengirim...' : 'Kirim Instruksi'}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <Link to="/login" className="text-slate-400 hover:text-white transition flex items-center justify-center gap-2">
                        ← Kembali ke Login
                    </Link>
                </div>
            </div>
        </div>
    )
}
