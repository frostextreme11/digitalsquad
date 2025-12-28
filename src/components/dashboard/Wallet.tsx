import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { motion } from 'framer-motion'
import { CreditCard, History, AlertCircle, CheckCircle, Clock, XCircle, Wallet as WalletIcon, ArrowRight, ChevronDown } from 'lucide-react'

export default function Wallet() {
    const [balance, setBalance] = useState(0)
    const [savedAccounts, setSavedAccounts] = useState<any[]>([])
    const [withdrawals, setWithdrawals] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [limit, setLimit] = useState(10)
    const [tierInfo, setTierInfo] = useState<{ name: string, min_withdraw: number } | null>(null)
    const [formData, setFormData] = useState({
        amount: '',
        bank_name: '',
        account_number: '',
        account_name: ''
    })
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

    // Fetch wallet data and tier info
    const fetchWalletData = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            // Get profile for balance and tier
            const { data: profile } = await supabase
                .from('profiles')
                .select('balance, tier_id')
                .eq('id', user.id)
                .single()

            if (profile) {
                setBalance(profile.balance || 0)

                // Get tier info for min_withdraw
                if (profile.tier_id) {
                    const { data: tier } = await supabase
                        .from('tiers')
                        .select('name, min_withdraw')
                        .eq('id', profile.tier_id)
                        .single()

                    if (tier) setTierInfo(tier)
                } else {
                    // Default to basic tier values
                    setTierInfo({ name: 'SQUAD MEMBER', min_withdraw: 50000 })
                }
            }

            // Get withdrawal history
            const { data: withdrawalData } = await supabase
                .from('withdrawals')
                .select('*')
                .eq('agent_id', user.id)
                .order('created_at', { ascending: false })
                .limit(limit)

            setWithdrawals(withdrawalData || [])

            // Get saved bank accounts
            const { data: accountsData } = await (supabase.from('user_bank_accounts' as any)).select('*').eq('user_id', user.id)
            setSavedAccounts(accountsData || [])

        } catch (error) {
            console.error('Error fetching wallet data:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchWalletData()
    }, [limit])

    const removeSavedAccount = async (id: string, e: React.MouseEvent) => {
        e.preventDefault()
        if (!confirm('Hapus rekening tersimpan ini?')) return
        try {
            const { error } = await (supabase.from('user_bank_accounts' as any)).delete().eq('id', id)
            if (error) throw error
            setSavedAccounts(savedAccounts.filter(acc => acc.id !== id))
        } catch (err: any) {
            alert('Gagal menghapus: ' + err.message)
        }
    }

    const handleAccountSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const val = e.target.value
        if (val === 'new') {
            setFormData({ ...formData, bank_name: '', account_number: '', account_name: '' })
        } else {
            const acc = savedAccounts.find(a => a.id === val)
            if (acc) {
                setFormData({
                    ...formData,
                    bank_name: acc.bank_name,
                    account_number: acc.account_number,
                    account_name: acc.account_name
                })
            }
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setMessage(null)
        setSubmitting(true)

        const amount = parseFloat(formData.amount)

        if (isNaN(amount) || amount <= 0) {
            setMessage({ type: 'error', text: 'Jumlah penarikan tidak valid.' })
            setSubmitting(false)
            return
        }

        // Use tier-based minimum withdrawal
        const minWithdraw = tierInfo?.min_withdraw || 50000
        if (amount < minWithdraw) {
            setMessage({ type: 'error', text: `Minimal penarikan untuk tier ${tierInfo?.name || 'Anda'} adalah Rp ${minWithdraw.toLocaleString()}.` })
            setSubmitting(false)
            return
        }

        if (amount > balance) {
            setMessage({ type: 'error', text: 'Saldo tidak mencukupi.' })
            setSubmitting(false)
            return
        }

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('Not authenticated')

            const finalAmount = amount - 2500

            if (finalAmount < 0) {
                setMessage({ type: 'error', text: 'Jumlah penarikan terlalu kecil setelah dipotong biaya admin.' })
                setSubmitting(false)
                return
            }

            // 1. Submit Withdrawal
            const { error } = await supabase
                .from('withdrawals')
                .insert({
                    agent_id: user.id,
                    amount: finalAmount,
                    bank_details: {
                        bank_name: formData.bank_name,
                        account_number: formData.account_number,
                        account_name: formData.account_name
                    },
                    status: 'pending'
                })

            if (error) throw error

            // 2. Auto-save Bank Account
            const exists = savedAccounts.some(
                acc => acc.bank_name.toLowerCase() === formData.bank_name.toLowerCase()
                    && acc.account_number === formData.account_number
            )

            if (!exists) {
                await (supabase.from('user_bank_accounts' as any)).insert({
                    user_id: user.id,
                    bank_name: formData.bank_name,
                    account_number: formData.account_number,
                    account_name: formData.account_name
                }).select()
            }

            setMessage({ type: 'success', text: 'Permintaan penarikan berhasil dikirim.' })
            setFormData({ amount: '', bank_name: '', account_number: '', account_name: '' })
            fetchWalletData() // Refresh list & accounts

        } catch (error: any) {
            setMessage({ type: 'error', text: error.message || 'Gagal mengirim permintaan.' })
        } finally {
            setSubmitting(false)
        }
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'success': return <div className="flex items-center gap-1 text-emerald-400 bg-emerald-400/10 px-3 py-1 rounded-full text-xs font-medium"><CheckCircle size={14} /> Berhasil</div>
            case 'pending': return <div className="flex items-center gap-1 text-amber-400 bg-amber-400/10 px-3 py-1 rounded-full text-xs font-medium"><Clock size={14} /> Pending</div>
            case 'failed': return <div className="flex items-center gap-1 text-red-400 bg-red-400/10 px-3 py-1 rounded-full text-xs font-medium"><XCircle size={14} /> Gagal</div>
            case 'cancelled': return <div className="flex items-center gap-1 text-slate-400 bg-slate-400/10 px-3 py-1 rounded-full text-xs font-medium"><XCircle size={14} /> Dibatalkan</div>
            default: return null
        }
    }

    const container = {
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.1 } }
    }

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    }

    if (loading) return <div>Loading...</div>

    return (
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-8">

            {/* Header & Balance Card */}
            <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 bg-gradient-to-r from-slate-900 to-slate-800 p-8 rounded-3xl border border-slate-700/50 relative overflow-hidden">
                    <div className="relative z-10 flex flex-col h-full justify-between">
                        <div>
                            <h2 className="text-slate-400 font-medium mb-1">Total Saldo Dompet</h2>
                            <h3 className="text-4xl sm:text-5xl font-bold text-white tracking-tight">Rp {balance.toLocaleString()}</h3>
                        </div>
                        <p className="text-slate-400 text-sm mt-6 flex items-center gap-2">
                            <CheckCircle size={16} className="text-green-500" />
                            Siap ditarik ke rekening bank Anda.
                        </p>
                    </div>
                    <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-blue-500/10 to-transparent pointer-events-none"></div>
                </div>

                <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 flex flex-col justify-center items-center text-center">
                    <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center text-blue-400 mb-4">
                        <WalletIcon size={32} />
                    </div>
                    <h3 className="text-white font-medium mb-2">Perlu Bantuan?</h3>
                    <p className="text-slate-400 text-sm mb-4">Jika ada kendala dalam penarikan, hubungi admin.</p>
                </div>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Withdrawal Form */}
                <motion.div variants={item} className="lg:col-span-1">
                    <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400"><CreditCard size={20} /></div>
                            <h3 className="text-lg font-bold text-white">Ajukan Penarikan</h3>
                        </div>

                        {message && (
                            <div className={`mb-4 p-4 rounded-xl text-sm flex items-start gap-3 ${message.type === 'success' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                                {message.type === 'success' ? <CheckCircle size={18} className="shrink-0 mt-0.5" /> : <AlertCircle size={18} className="shrink-0 mt-0.5" />}
                                {message.text}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Saved Accounts Selector */}
                            {savedAccounts.length > 0 && (
                                <div className="mb-4">
                                    <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Pilih Rekening Tersimpan</label>
                                    <div className="relative">
                                        <select
                                            onChange={handleAccountSelect}
                                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition appearance-none"
                                            defaultValue="new"
                                        >
                                            <option value="new">-- Input Rekening Baru --</option>
                                            {savedAccounts.map(acc => (
                                                <option key={acc.id} value={acc.id}>
                                                    {acc.bank_name} - {acc.account_number} ({acc.account_name})
                                                </option>
                                            ))}
                                        </select>
                                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                                            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                                        </div>
                                    </div>
                                    {/* Show delete button if a saved account is selected (based on finding it in the array matching current form data could be complex, 
                                        so maybe just list them below or add a 'Manage' small text/button. 
                                        Let's stick to the prompt Requirement: "user agent can save or remove".
                                        Simpler: List saved accounts below or provide a delete button next to the select if value is not new.
                                     */}
                                </div>
                            )}

                            <div>
                                <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Jumlah Penarikan (Rp)</label>
                                <input
                                    type="number"
                                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition"
                                    placeholder="0"
                                    value={formData.amount}
                                    onChange={e => setFormData({ ...formData, amount: e.target.value })}
                                    required
                                />
                                <div className="flex flex-col gap-1 mt-2 text-xs text-slate-500">
                                    <div className="flex justify-between">
                                        <span>Min ({tierInfo?.name || 'Basic'}): Rp {(tierInfo?.min_withdraw || 50000).toLocaleString()}</span>
                                        <span className="cursor-pointer hover:text-blue-400" onClick={() => setFormData({ ...formData, amount: balance.toString() })}>Max: Rp {balance.toLocaleString()}</span>
                                    </div>
                                    {formData.amount && !isNaN(parseFloat(formData.amount)) && (
                                        <div className="bg-slate-900 border border-slate-800 p-2 rounded-lg mt-1 space-y-1">
                                            <div className="flex justify-between text-slate-400">
                                                <span>Jumlah:</span>
                                                <span>Rp {parseFloat(formData.amount).toLocaleString()}</span>
                                            </div>
                                            <div className="flex justify-between text-slate-400">
                                                <span>Biaya Admin (BI-FAST):</span>
                                                <span className="text-red-400">- Rp 2.500</span>
                                            </div>

                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-4 pt-2">
                                <div className="flex justify-between items-center">
                                    <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Informasi Bank</p>
                                    {savedAccounts.length > 0 && (
                                        <div className="text-xs text-slate-500">
                                            Kelola rekening tersimpan:
                                            <div className="flex flex-col gap-1 mt-1">
                                                {savedAccounts.map(acc => (
                                                    <div key={acc.id} className="flex items-center justify-between gap-2 bg-slate-900 border border-slate-800 p-1 px-2 rounded">
                                                        <span className="truncate max-w-[150px]">{acc.bank_name} - {acc.account_number}</span>
                                                        <button onClick={(e) => removeSavedAccount(acc.id, e)} className="text-red-400 hover:text-red-300"><XCircle size={14} /></button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <input
                                        type="text"
                                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition"
                                        placeholder="Nama Bank (BCA, Mandiri, dll)"
                                        value={formData.bank_name}
                                        onChange={e => setFormData({ ...formData, bank_name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <input
                                        type="text"
                                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition"
                                        placeholder="Nomor Rekening"
                                        value={formData.account_number}
                                        onChange={e => setFormData({ ...formData, account_number: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <input
                                        type="text"
                                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition"
                                        placeholder="Atas Nama (Pemilik Rekening)"
                                        value={formData.account_name}
                                        onChange={e => setFormData({ ...formData, account_name: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition duration-200 mt-4 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                            >
                                {submitting ? 'Mengirim...' : <>Kirim Permintaan <ArrowRight size={18} /></>}
                            </button>
                        </form>
                    </div>
                </motion.div>

                {/* Withdrawal History */}
                <motion.div variants={item} className="lg:col-span-2">
                    <div className="bg-slate-900/50 border border-slate-800/50 rounded-2xl p-6 h-full">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400"><History size={20} /></div>
                                <h3 className="text-lg font-bold text-white">Riwayat Penarikan</h3>
                            </div>

                            {/* Limit Selector */}
                            <div className="relative">
                                <select
                                    value={limit}
                                    onChange={(e) => setLimit(Number(e.target.value))}
                                    className="appearance-none bg-slate-900 border border-slate-800 text-slate-300 pl-3 pr-8 py-1.5 rounded-lg text-xs focus:outline-none focus:border-blue-500 cursor-pointer"
                                >
                                    <option value={10}>10 items</option>
                                    <option value={50}>50 items</option>
                                    <option value={100}>100 items</option>
                                </select>
                                <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 text-slate-500 pointer-events-none" size={14} />
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-800 text-slate-400 text-sm">
                                        <th className="py-4 px-4 font-medium">Tanggal</th>
                                        <th className="py-4 px-4 font-medium">Bank Info</th>
                                        <th className="py-4 px-4 font-medium">Jumlah</th>
                                        <th className="py-4 px-4 font-medium">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm">
                                    {withdrawals.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="py-8 text-center text-slate-500">
                                                Belum ada riwayat penarikan.
                                            </td>
                                        </tr>
                                    ) : (
                                        withdrawals.map((wd) => (
                                            <tr key={wd.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition">
                                                <td className="py-4 px-4 text-slate-300">
                                                    {new Date(wd.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                </td>
                                                <td className="py-4 px-4">
                                                    <div className="text-white font-medium">{wd.bank_details?.bank_name}</div>
                                                    <div className="text-slate-500 text-xs">{wd.bank_details?.account_number}</div>
                                                    <div className="text-slate-500 text-xs">{wd.bank_details?.account_name}</div>
                                                </td>
                                                <td className="py-4 px-4 font-mono text-white">
                                                    Rp {wd.amount.toLocaleString()}
                                                </td>
                                                <td className="py-4 px-4">
                                                    {getStatusBadge(wd.status)}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </motion.div>
            </div>
        </motion.div>
    )
}
