import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'

export default function UpdatePasswordPage() {
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
    const navigate = useNavigate()

    useEffect(() => {
        // Handle password recovery flow
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event) => {
            if (event === 'PASSWORD_RECOVERY') {
                // Determine if we need to do anything specific
            }
        })

        // Check if user is authenticated
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) {
                // If no session, wait a bit to see if onAuthStateChange picks it up (from hash)
                // or just stay here. If we redirect too fast, we break the recovery link flow.
                // Alternatively, we can show a UI message if not logged in.
            }
        }
        checkSession()

        return () => {
            subscription.unsubscribe()
        }
    }, [navigate])

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault()

        if (password !== confirmPassword) {
            setMessage({ type: 'error', text: 'Password tidak sama.' })
            return
        }

        if (password.length < 6) {
            setMessage({ type: 'error', text: 'Password harus minimal 6 karakter.' })
            return
        }

        setLoading(true)
        setMessage(null)

        try {
            const { error } = await supabase.auth.updateUser({ password })

            if (error) throw error

            setMessage({
                type: 'success',
                text: 'Password berhasil diperbarui! Anda akan dialihkan ke dashboard...'
            })

            setTimeout(() => {
                navigate('/dashboard')
            }, 2000)

        } catch (error: any) {
            setMessage({
                type: 'error',
                text: error.message || 'Gagal memperbarui password.'
            })
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
            <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800 shadow-2xl w-full max-w-md">
                <h1 className="text-3xl font-bold text-white text-center mb-8">Set Password Baru</h1>

                {message && (
                    <div className={`p-4 rounded-lg mb-6 ${message.type === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                        }`}>
                        {message.text}
                    </div>
                )}

                <form onSubmit={handleUpdatePassword} className="space-y-6">
                    <div>
                        <label className="block text-slate-400 mb-2">Password Baru</label>
                        <input
                            type="password"
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                            minLength={6}
                        />
                    </div>

                    <div>
                        <label className="block text-slate-400 mb-2">Konfirmasi Password</label>
                        <input
                            type="password"
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                            value={confirmPassword}
                            onChange={e => setConfirmPassword(e.target.value)}
                            required
                            minLength={6}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-3 rounded-lg hover:opacity-90 transition disabled:opacity-50"
                    >
                        {loading ? 'Menyimpan...' : 'Simpan Password Baru'}
                    </button>
                </form>
            </div>
        </div>
    )
}
