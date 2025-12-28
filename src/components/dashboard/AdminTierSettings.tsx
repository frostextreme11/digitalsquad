import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { motion } from 'framer-motion'
import { Crown, Edit2, Save, X, Users, Star, Shield } from 'lucide-react'

interface Tier {
    id: string
    tier_key: 'basic' | 'pro' | 'vip'
    name: string
    description: string | null
    commission_rate: number
    min_withdraw: number
    upgrade_price: number
    registration_price: number
    upgrade_sales_threshold: number | null
    override_commission_rate: number | null
    priority_withdrawal: boolean
    is_purchasable: boolean
    member_count?: number
}

export default function AdminTierSettings() {
    const [tiers, setTiers] = useState<Tier[]>([])
    const [loading, setLoading] = useState(true)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editForm, setEditForm] = useState<Partial<Tier>>({})
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        fetchTiers()
    }, [])

    const fetchTiers = async () => {
        setLoading(true)

        // Fetch tiers
        const { data: tiersData, error } = await supabase
            .from('tiers')
            .select('*')
            .order('commission_rate', { ascending: true })

        if (error) {
            console.error('Error fetching tiers:', error)
            setLoading(false)
            return
        }

        // Count members per tier
        const tiersWithCounts = await Promise.all(
            (tiersData || []).map(async (tier) => {
                const { count } = await supabase
                    .from('profiles')
                    .select('*', { count: 'exact', head: true })
                    .eq('tier_id', tier.id)

                return { ...tier, member_count: count || 0 }
            })
        )

        setTiers(tiersWithCounts)
        setLoading(false)
    }

    const startEdit = (tier: Tier) => {
        setEditingId(tier.id)
        setEditForm({
            name: tier.name,
            description: tier.description,
            commission_rate: tier.commission_rate,
            min_withdraw: tier.min_withdraw,
            upgrade_price: tier.upgrade_price,
            registration_price: tier.registration_price,
            upgrade_sales_threshold: tier.upgrade_sales_threshold,
            override_commission_rate: tier.override_commission_rate,
            priority_withdrawal: tier.priority_withdrawal,
            is_purchasable: tier.is_purchasable
        })
    }

    const cancelEdit = () => {
        setEditingId(null)
        setEditForm({})
    }

    const saveEdit = async () => {
        if (!editingId) return
        setSaving(true)

        const { error } = await supabase
            .from('tiers')
            .update({
                name: editForm.name,
                description: editForm.description,
                commission_rate: editForm.commission_rate,
                min_withdraw: editForm.min_withdraw,
                upgrade_price: editForm.upgrade_price,
                registration_price: editForm.registration_price,
                upgrade_sales_threshold: editForm.upgrade_sales_threshold,
                override_commission_rate: editForm.override_commission_rate,
                priority_withdrawal: editForm.priority_withdrawal,
                is_purchasable: editForm.is_purchasable
            })
            .eq('id', editingId)

        if (error) {
            alert('Gagal menyimpan: ' + error.message)
        } else {
            await fetchTiers()
            setEditingId(null)
            setEditForm({})
        }
        setSaving(false)
    }

    const getTierIcon = (tierKey: string) => {
        switch (tierKey) {
            case 'basic': return <Star className="text-slate-400" size={24} />
            case 'pro': return <Crown className="text-blue-400" size={24} />
            case 'vip': return <Shield className="text-yellow-400" size={24} />
            default: return <Star size={24} />
        }
    }

    const getTierColor = (tierKey: string) => {
        switch (tierKey) {
            case 'basic': return 'border-slate-600'
            case 'pro': return 'border-blue-500'
            case 'vip': return 'border-yellow-500'
            default: return 'border-slate-600'
        }
    }

    if (loading) {
        return (
            <div className="text-center py-12">
                <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
                <p className="text-slate-400 mt-4">Memuat data tier...</p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Tier Settings</h1>
                    <p className="text-slate-400">Kelola konfigurasi tier keanggotaan</p>
                </div>
            </div>

            <div className="grid gap-6">
                {tiers.map((tier) => (
                    <motion.div
                        key={tier.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`bg-slate-900 rounded-2xl border-2 ${getTierColor(tier.tier_key)} p-6`}
                    >
                        {editingId === tier.id ? (
                            // Edit Mode
                            <div className="space-y-4">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        {getTierIcon(tier.tier_key)}
                                        <span className="text-xs uppercase tracking-wider text-slate-500">{tier.tier_key}</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={cancelEdit}
                                            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
                                        >
                                            <X size={20} />
                                        </button>
                                        <button
                                            onClick={saveEdit}
                                            disabled={saving}
                                            className="p-2 text-green-400 hover:text-white hover:bg-green-600 rounded-lg transition disabled:opacity-50"
                                        >
                                            <Save size={20} />
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-slate-400 text-sm mb-1">Nama Tier</label>
                                        <input
                                            type="text"
                                            value={editForm.name || ''}
                                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-slate-400 text-sm mb-1">Deskripsi</label>
                                        <input
                                            type="text"
                                            value={editForm.description || ''}
                                            onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-slate-400 text-sm mb-1">Commission Rate (0-1)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            max="1"
                                            value={editForm.commission_rate || 0}
                                            onChange={(e) => setEditForm({ ...editForm, commission_rate: parseFloat(e.target.value) })}
                                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-slate-400 text-sm mb-1">Min Withdraw (Rp)</label>
                                        <input
                                            type="number"
                                            value={editForm.min_withdraw || 0}
                                            onChange={(e) => setEditForm({ ...editForm, min_withdraw: parseInt(e.target.value) })}
                                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-slate-400 text-sm mb-1">Upgrade Price (Rp)</label>
                                        <input
                                            type="number"
                                            value={editForm.upgrade_price || 0}
                                            onChange={(e) => setEditForm({ ...editForm, upgrade_price: parseInt(e.target.value) })}
                                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-slate-400 text-sm mb-1">Registration Price (Rp)</label>
                                        <input
                                            type="number"
                                            value={editForm.registration_price || 50000}
                                            onChange={(e) => setEditForm({ ...editForm, registration_price: parseInt(e.target.value) })}
                                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                                        />
                                        <p className="text-xs text-slate-500 mt-1">Harga pendaftaran tier ini</p>
                                    </div>
                                    <div>
                                        <label className="block text-slate-400 text-sm mb-1">Sales Threshold (Auto-upgrade)</label>
                                        <input
                                            type="number"
                                            value={editForm.upgrade_sales_threshold || ''}
                                            onChange={(e) => setEditForm({ ...editForm, upgrade_sales_threshold: e.target.value ? parseInt(e.target.value) : null })}
                                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                                            placeholder="Kosongkan jika tidak ada"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-slate-400 text-sm mb-1">Override Commission (VIP)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={editForm.override_commission_rate || ''}
                                            onChange={(e) => setEditForm({ ...editForm, override_commission_rate: e.target.value ? parseFloat(e.target.value) : null })}
                                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                                            placeholder="0.05 = 5%"
                                        />
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <label className="flex items-center gap-2 text-slate-300">
                                            <input
                                                type="checkbox"
                                                checked={editForm.priority_withdrawal || false}
                                                onChange={(e) => setEditForm({ ...editForm, priority_withdrawal: e.target.checked })}
                                                className="w-4 h-4 rounded"
                                            />
                                            Priority Withdraw
                                        </label>
                                        <label className="flex items-center gap-2 text-slate-300">
                                            <input
                                                type="checkbox"
                                                checked={editForm.is_purchasable || false}
                                                onChange={(e) => setEditForm({ ...editForm, is_purchasable: e.target.checked })}
                                                className="w-4 h-4 rounded"
                                            />
                                            Bisa Dibeli
                                        </label>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            // View Mode
                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-slate-800 rounded-xl">
                                        {getTierIcon(tier.tier_key)}
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-white">{tier.name}</h3>
                                        <p className="text-slate-400 text-sm">{tier.description}</p>
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-4 items-center">
                                    <div className="bg-slate-800 px-4 py-2 rounded-lg">
                                        <p className="text-xs text-slate-400">Komisi</p>
                                        <p className="text-white font-bold">{(tier.commission_rate * 100).toFixed(0)}%</p>
                                    </div>
                                    <div className="bg-slate-800 px-4 py-2 rounded-lg">
                                        <p className="text-xs text-slate-400">Reg. Price</p>
                                        <p className="text-white font-bold">Rp {tier.registration_price?.toLocaleString('id-ID') || '50.000'}</p>
                                    </div>
                                    <div className="bg-slate-800 px-4 py-2 rounded-lg">
                                        <p className="text-xs text-slate-400">Min WD</p>
                                        <p className="text-white font-bold">Rp {tier.min_withdraw.toLocaleString('id-ID')}</p>
                                    </div>
                                    <div className="bg-slate-800 px-4 py-2 rounded-lg">
                                        <p className="text-xs text-slate-400">Upgrade</p>
                                        <p className="text-white font-bold">
                                            {tier.upgrade_price > 0
                                                ? `Rp ${tier.upgrade_price.toLocaleString('id-ID')}`
                                                : tier.upgrade_sales_threshold
                                                    ? `${tier.upgrade_sales_threshold} sales`
                                                    : '-'
                                            }
                                        </p>
                                    </div>
                                    <div className="bg-slate-800 px-4 py-2 rounded-lg">
                                        <p className="text-xs text-slate-400">Members</p>
                                        <p className="text-white font-bold flex items-center gap-1">
                                            <Users size={14} />
                                            {tier.member_count}
                                        </p>
                                    </div>

                                    <button
                                        onClick={() => startEdit(tier)}
                                        className="p-3 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
                                    >
                                        <Edit2 size={20} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </motion.div>
                ))}
            </div>

            {/* Info Box */}
            <div className="bg-blue-900/20 border border-blue-500/30 rounded-xl p-4 mt-6">
                <h4 className="text-blue-400 font-medium mb-2">ℹ️ Catatan Penting</h4>
                <ul className="text-slate-400 text-sm space-y-1">
                    <li>• <strong>Commission Rate</strong>: Persentase komisi (0.30 = 30%, 0.50 = 50%)</li>
                    <li>• <strong>Registration Price</strong>: Harga yang harus dibayar user untuk mendaftar ke tier ini (default Rp 50.000)</li>
                    <li>• <strong>Override Commission</strong>: Komisi tambahan untuk VIP dari penjualan 1 level downline</li>
                    <li>• <strong>Sales Threshold</strong>: Jumlah penjualan untuk auto-upgrade gratis</li>
                    <li>• Tier VIP tidak bisa dibeli, hanya bisa dicapai via auto-upgrade di 100 sales</li>
                </ul>
            </div>
        </div>
    )
}
