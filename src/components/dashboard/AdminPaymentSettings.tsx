import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { motion } from 'framer-motion'
import { CreditCard, Save, Check, AlertCircle, RefreshCw, Settings } from 'lucide-react'

interface ConfigItem {
    key: string
    value: string
    description: string | null
}

export default function AdminPaymentSettings() {
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [configs, setConfigs] = useState<ConfigItem[]>([])
    const [activeGateway, setActiveGateway] = useState<'midtrans' | 'mayar'>('midtrans')
    const [saveSuccess, setSaveSuccess] = useState(false)

    useEffect(() => {
        fetchConfigs()
    }, [])

    const fetchConfigs = async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from('app_config')
            .select('key, value, description')
            .in('key', [
                'payment_gateway',
                'midtrans_snap_url',
                'midtrans_api_url',
                'midtrans_client_key',
                'mayar_api_url',
                'mayar_redirect_url'
            ])

        if (data) {
            setConfigs(data)
            const gateway = data.find(c => c.key === 'payment_gateway')
            if (gateway?.value === 'mayar') {
                setActiveGateway('mayar')
            } else {
                setActiveGateway('midtrans')
            }
        }
        if (error) console.error('Error fetching configs:', error)
        setLoading(false)
    }

    const handleGatewayChange = async (gateway: 'midtrans' | 'mayar') => {
        setSaving(true)
        setSaveSuccess(false)

        const { error } = await supabase
            .from('app_config')
            .upsert({
                key: 'payment_gateway',
                value: gateway,
                description: 'Active payment gateway: midtrans or mayar',
                updated_at: new Date().toISOString()
            })

        if (error) {
            console.error('Error updating gateway:', error)
            alert('Gagal menyimpan pengaturan: ' + error.message)
        } else {
            setActiveGateway(gateway)
            setSaveSuccess(true)
            setTimeout(() => setSaveSuccess(false), 3000)
        }
        setSaving(false)
    }

    const getConfigValue = (key: string): string => {
        return configs.find(c => c.key === key)?.value || ''
    }

    const isSandbox = (gateway: 'midtrans' | 'mayar'): boolean => {
        if (gateway === 'midtrans') {
            const url = getConfigValue('midtrans_api_url')
            return url.includes('sandbox')
        } else {
            const url = getConfigValue('mayar_api_url')
            return url.includes('mayar.club')
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/20 rounded-lg">
                        <CreditCard className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white">Payment Gateway</h2>
                        <p className="text-sm text-slate-400">Kelola gateway pembayaran aktif</p>
                    </div>
                </div>
                <button
                    onClick={fetchConfigs}
                    className="p-2 bg-slate-800 rounded-lg hover:bg-slate-700 transition"
                >
                    <RefreshCw className="w-5 h-5 text-slate-400" />
                </button>
            </div>

            {/* Success Message */}
            {saveSuccess && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="bg-green-500/20 border border-green-500/30 rounded-lg p-4 flex items-center gap-3"
                >
                    <Check className="w-5 h-5 text-green-400" />
                    <span className="text-green-400">Pengaturan berhasil disimpan!</span>
                </motion.div>
            )}

            {/* Gateway Selection */}
            <div className="grid md:grid-cols-2 gap-4">
                {/* Midtrans Card */}
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleGatewayChange('midtrans')}
                    disabled={saving}
                    className={`relative p-6 rounded-xl border-2 text-left transition-all ${activeGateway === 'midtrans'
                            ? 'border-green-500 bg-green-500/10'
                            : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                        }`}
                >
                    {activeGateway === 'midtrans' && (
                        <div className="absolute top-3 right-3">
                            <div className="flex items-center gap-1 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                                <Check className="w-3 h-3" />
                                AKTIF
                            </div>
                        </div>
                    )}

                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                            M
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white">Midtrans</h3>
                            <p className="text-xs text-slate-400">Snap Payment Gateway</p>
                        </div>
                    </div>

                    <p className="text-sm text-slate-400 mb-4">
                        Payment popup terintegrasi dengan berbagai metode pembayaran (QRIS, VA, E-Wallet, dll).
                    </p>

                    <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${isSandbox('midtrans')
                                ? 'bg-yellow-500/20 text-yellow-400'
                                : 'bg-green-500/20 text-green-400'
                            }`}>
                            {isSandbox('midtrans') ? 'SANDBOX' : 'PRODUCTION'}
                        </span>
                    </div>
                </motion.button>

                {/* Mayar Card */}
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleGatewayChange('mayar')}
                    disabled={saving}
                    className={`relative p-6 rounded-xl border-2 text-left transition-all ${activeGateway === 'mayar'
                            ? 'border-green-500 bg-green-500/10'
                            : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                        }`}
                >
                    {activeGateway === 'mayar' && (
                        <div className="absolute top-3 right-3">
                            <div className="flex items-center gap-1 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                                <Check className="w-3 h-3" />
                                AKTIF
                            </div>
                        </div>
                    )}

                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-500 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                            MY
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white">Mayar</h3>
                            <p className="text-xs text-slate-400">Headless Payment API</p>
                        </div>
                    </div>

                    <p className="text-sm text-slate-400 mb-4">
                        Redirect ke halaman pembayaran Mayar. Mendukung QRIS, VA, dan E-Wallet.
                    </p>

                    <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${isSandbox('mayar')
                                ? 'bg-yellow-500/20 text-yellow-400'
                                : 'bg-green-500/20 text-green-400'
                            }`}>
                            {isSandbox('mayar') ? 'SANDBOX' : 'PRODUCTION'}
                        </span>
                    </div>
                </motion.button>
            </div>

            {/* Warning */}
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
                <div>
                    <p className="text-yellow-400 font-medium text-sm">Perhatian</p>
                    <p className="text-slate-400 text-sm mt-1">
                        Mengubah gateway pembayaran hanya mempengaruhi transaksi baru.
                        Transaksi yang sudah pending akan tetap menggunakan gateway sebelumnya.
                    </p>
                </div>
            </div>

            {/* Configuration Details */}
            <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
                <div className="flex items-center gap-2 mb-4">
                    <Settings className="w-5 h-5 text-slate-400" />
                    <h3 className="text-lg font-bold text-white">Konfigurasi Aktif</h3>
                </div>

                <div className="space-y-3">
                    {activeGateway === 'midtrans' ? (
                        <>
                            <div className="flex justify-between items-center py-2 border-b border-slate-700">
                                <span className="text-slate-400 text-sm">API URL</span>
                                <code className="text-xs text-blue-400 bg-slate-900 px-2 py-1 rounded">
                                    {getConfigValue('midtrans_api_url') || 'Not set'}
                                </code>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-slate-700">
                                <span className="text-slate-400 text-sm">Snap URL</span>
                                <code className="text-xs text-blue-400 bg-slate-900 px-2 py-1 rounded">
                                    {getConfigValue('midtrans_snap_url') || 'Not set'}
                                </code>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="flex justify-between items-center py-2 border-b border-slate-700">
                                <span className="text-slate-400 text-sm">API URL</span>
                                <code className="text-xs text-purple-400 bg-slate-900 px-2 py-1 rounded">
                                    {getConfigValue('mayar_api_url') || 'Not set'}
                                </code>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-slate-700">
                                <span className="text-slate-400 text-sm">Redirect URL</span>
                                <code className="text-xs text-purple-400 bg-slate-900 px-2 py-1 rounded">
                                    {getConfigValue('mayar_redirect_url') || 'Not set'}
                                </code>
                            </div>
                        </>
                    )}
                </div>

                <p className="text-xs text-slate-500 mt-4">
                    * Server Key dan Webhook Token disimpan di Supabase Edge Function Secrets untuk keamanan.
                </p>
            </div>
        </div>
    )
}
