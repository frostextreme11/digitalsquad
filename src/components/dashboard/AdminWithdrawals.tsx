import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { motion } from 'framer-motion'
import { CheckCircle, XCircle, Clock, Check, X, Copy, Search, ChevronDown, RefreshCcw, Filter } from 'lucide-react'
import { format } from 'date-fns'

interface WithdrawalRequest {
    id: string
    created_at: string
    amount: number
    status: 'pending' | 'success' | 'failed' | 'cancelled'
    bank_details: {
        bank_name: string
        account_number: string
        account_name: string
    }
    agent_id: string
    profiles: {
        full_name: string
        email: string
        affiliate_code: string
    }
}

const CopyButton = ({ text, label }: { text: string, label?: string }) => {
    const [copied, setCopied] = useState(false)

    const handleCopy = () => {
        navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <button
            onClick={handleCopy}
            className="text-slate-500 hover:text-white transition p-1 rounded hover:bg-slate-800"
            title={`Copy ${label || 'text'}`}
        >
            {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
        </button>
    )
}

export default function AdminWithdrawals() {
    const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([])
    const [loading, setLoading] = useState(true)
    const [processing, setProcessing] = useState<string | null>(null)
    const [limit, setLimit] = useState(50)
    const [statusFilter, setStatusFilter] = useState('all')
    const [search, setSearch] = useState('')

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchWithdrawals()
        }, 500)
        return () => clearTimeout(timer)
    }, [search, limit, statusFilter])

    const fetchWithdrawals = async () => {
        setLoading(true)
        try {
            const { data, error } = await (supabase as any).rpc('get_admin_withdrawals', {
                search_query: search,
                status_filter: statusFilter,
                limit_val: limit
            })

            if (error) throw error
            setWithdrawals((data as any) || [])
        } catch (error) {
            console.error('Error fetching withdrawals:', error)
        } finally {
            setLoading(false)
        }
    }

    // ... existing handleStatusChange and getStatusBadge ...

    const handleStatusChange = async (id: string, currentStatus: string, newStatus: 'pending' | 'success' | 'failed', agentId: string, amount: number) => {
        if (!confirm(`Are you sure you want to change status from ${currentStatus.toUpperCase()} to ${newStatus.toUpperCase()}?`)) return

        setProcessing(id)
        try {
            // 1. Update withdrawal status
            const { error: updateError } = await supabase
                .from('withdrawals')
                .update({ status: newStatus })
                .eq('id', id)

            if (updateError) throw updateError

            // 2. Handle Balance Adjustments
            let balanceChange = 0

            // If moving TO success (Paid), we deduct balance
            if (newStatus === 'success' && currentStatus !== 'success') {
                balanceChange = -amount
            }
            // If moving FROM success (Un-paying), we refund balance
            else if (currentStatus === 'success' && newStatus !== 'success') {
                balanceChange = amount
            }

            if (balanceChange !== 0) {
                const { error: rpcError } = await (supabase as any).rpc('increment_balance', {
                    user_id: agentId,
                    amount: balanceChange
                })

                if (rpcError) {
                    console.error('Error updating balance:', rpcError)
                    alert(`Status updated via RPC, but balance adjustment (${balanceChange}) failed. Please check manually.`)
                }
            }

            await fetchWithdrawals()

        } catch (error: any) {
            console.error('Error updating status:', error)
            alert('Failed to update status: ' + error.message)
        } finally {
            setProcessing(null)
        }
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'success': return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"><CheckCircle size={14} /> Paid</span>
            case 'pending': return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20"><Clock size={14} /> Pending</span>
            case 'failed': return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20"><XCircle size={14} /> Rejected</span>
            case 'cancelled': return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-500/10 text-slate-400 border border-slate-500/20"><XCircle size={14} /> Cancelled</span>
            default: return null
        }
    }

    const container = {
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.1 } }
    }

    return (
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-white">Withdrawal Requests</h2>
                    <p className="text-slate-400 text-sm">Manage pending payouts to agents.</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                    {/* Search Input */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500" size={18} />
                        <input
                            type="text"
                            placeholder="Search agent, bank..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="bg-slate-900 border border-slate-800 text-slate-200 pl-10 pr-4 py-2 rounded-xl focus:outline-none focus:border-blue-500 w-full sm:w-64"
                        />
                    </div>

                    {/* Status Filter */}
                    <div className="relative">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="appearance-none bg-slate-900 border border-slate-800 text-slate-200 pl-10 pr-10 py-2 rounded-xl focus:outline-none focus:border-blue-500 cursor-pointer w-full sm:w-auto"
                        >
                            <option value="all">All Status</option>
                            <option value="pending">Pending</option>
                            <option value="success">Paid</option>
                            <option value="failed">Rejected</option>
                        </select>
                        <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 pointer-events-none" size={16} />
                        <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 pointer-events-none" size={16} />
                    </div>

                    {/* Limit Select */}
                    <div className="relative">
                        <select
                            value={limit}
                            onChange={(e) => setLimit(Number(e.target.value))}
                            className="appearance-none bg-slate-900 border border-slate-800 text-slate-200 pl-4 pr-10 py-2 rounded-xl focus:outline-none focus:border-blue-500 cursor-pointer w-full sm:w-auto"
                        >
                            <option value={50}>50 rows</option>
                            <option value={200}>200 rows</option>
                            <option value={500}>500 rows</option>
                            <option value={1000}>1000 rows</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 pointer-events-none" size={16} />
                    </div>
                </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-950/50 border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider">
                                <th className="py-4 px-6 font-semibold">Date</th>
                                <th className="py-4 px-6 font-semibold">Agent</th>
                                <th className="py-4 px-6 font-semibold">Bank Details</th>
                                <th className="py-4 px-6 font-semibold">Amount</th>
                                <th className="py-4 px-6 font-semibold">Status</th>
                                <th className="py-4 px-6 font-semibold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="py-12 text-center text-slate-500">
                                        Loading data...
                                    </td>
                                </tr>
                            ) : withdrawals.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-12 text-center text-slate-500">
                                        No withdrawal requests found.
                                    </td>
                                </tr>
                            ) : (
                                withdrawals.map((item) => (
                                    <tr
                                        key={item.id}
                                        className={`transition duration-150 ${item.status === 'success'
                                            ? 'bg-gradient-to-r from-emerald-900/20 to-transparent hover:from-emerald-900/30'
                                            : item.status === 'failed'
                                                ? 'bg-gradient-to-r from-red-900/20 to-transparent hover:from-red-900/30'
                                                : 'hover:bg-slate-800/30'
                                            }`}
                                    >
                                        <td className="py-4 px-6 text-slate-300 text-sm whitespace-nowrap">
                                            {format(new Date(item.created_at), 'dd MMM yyyy')}
                                            <div className="text-xs text-slate-500">{format(new Date(item.created_at), 'HH:mm')}</div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="flex flex-col">
                                                <span className="text-white font-medium">{item.profiles?.full_name || 'Unknown'}</span>
                                                <span className="text-slate-500 text-xs">{item.profiles?.email}</span>
                                                <span className="text-blue-400 text-xs font-mono mt-0.5">{item.profiles?.affiliate_code}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="flex flex-col text-sm">
                                                <span className="text-slate-300 font-medium">{item.bank_details?.bank_name}</span>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-slate-400 text-xs font-mono">{item.bank_details?.account_number}</span>
                                                    <CopyButton text={item.bank_details?.account_number} label="account number" />
                                                </div>
                                                <span className="text-slate-500 text-xs">{item.bank_details?.account_name}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-2">
                                                <span className="text-white font-mono font-bold tracking-tight">
                                                    Rp {item.amount.toLocaleString()}
                                                </span>
                                                <CopyButton text={item.amount.toString()} label="amount" />
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            {getStatusBadge(item.status)}
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {item.status !== 'success' && (
                                                    <button
                                                        onClick={() => handleStatusChange(item.id, item.status, 'success', item.agent_id, item.amount)}
                                                        disabled={processing === item.id}
                                                        className="p-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg border border-emerald-500/20 transition disabled:opacity-50"
                                                        title="Approve & Mark Paid"
                                                    >
                                                        <Check size={18} />
                                                    </button>
                                                )}

                                                {item.status !== 'pending' && (
                                                    <button
                                                        onClick={() => handleStatusChange(item.id, item.status, 'pending', item.agent_id, item.amount)}
                                                        disabled={processing === item.id}
                                                        className="p-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 rounded-lg border border-amber-500/20 transition disabled:opacity-50"
                                                        title="Mark Pending"
                                                    >
                                                        <RefreshCcw size={18} />
                                                    </button>
                                                )}

                                                {item.status !== 'failed' && item.status !== 'cancelled' && (
                                                    <button
                                                        onClick={() => handleStatusChange(item.id, item.status, 'failed', item.agent_id, item.amount)}
                                                        disabled={processing === item.id}
                                                        className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg border border-red-500/20 transition disabled:opacity-50"
                                                        title="Reject"
                                                    >
                                                        <X size={18} />
                                                    </button>
                                                )}
                                            </div>

                                            {processing === item.id && <span className="text-xs text-slate-500 animate-pulse block mt-1">Processing...</span>}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </motion.div>
    )
}
