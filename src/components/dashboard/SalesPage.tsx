import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { motion } from 'framer-motion'
import { TrendingUp, UserPlus, ShoppingBag, Filter, Calendar, Search, ChevronDown } from 'lucide-react'

interface SalesPageProps {
    role?: string
}

export default function SalesPage({ role }: SalesPageProps) {
    const [stats, setStats] = useState({
        totalProfit: 0,
        registrationCount: 0,
        productSaleCount: 0
    })
    const [transactions, setTransactions] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState<'all' | 'registration' | 'product_purchase'>('all')
    const [limit, setLimit] = useState(50)
    const [searchQuery, setSearchQuery] = useState('')

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchSalesData()
        }, 500) // Debounce search
        return () => clearTimeout(timeoutId)
    }, [filter, role, limit, searchQuery])

    const fetchSalesData = async () => {
        setLoading(true)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        let finalTxns: any[] = []
        let total = 0
        let regCount = 0
        let prodCount = 0

        const userIdsToFetch = new Set<string>()
        const leadIdsToFetch = new Set<string>()

        if (role === 'admin') {
            // Admin: Fetch ALL successful transactions
            let query = supabase
                .from('transactions')
                .select(`
                    id,
                    type,
                    amount,
                    status,
                    created_at,
                    user_id,
                    lead_id,
                    product_purchases (
                        product_id,
                        customer_name,
                        products (
                            title
                        )
                    ),
                    commissions (
                        amount
                    )
                `)
                .eq('status', 'success')
                .order('created_at', { ascending: false })
                .limit(limit)

            if (filter !== 'all') {
                query = query.eq('type', filter)
            }

            const { data: adminTxns, error } = await query

            if (error) {
                console.error("Error fetching admin sales:", error)
                setLoading(false)
                return
            }

            adminTxns?.forEach((tx: any) => {
                // Calculate Net Profit: Transaction Amount - Commissions Paid
                const commissionPaid = tx.commissions?.reduce((sum: number, c: any) => sum + c.amount, 0) || 0;
                const netAmount = tx.amount - commissionPaid;

                // Accumulate totals (Admin sees total NET profit)
                total += netAmount

                if (tx.type === 'registration') regCount++
                if (tx.type === 'product_purchase') prodCount++

                if (tx.type === 'registration') {
                    if (tx.user_id) userIdsToFetch.add(tx.user_id)
                    if (tx.lead_id) leadIdsToFetch.add(tx.lead_id)
                }

                finalTxns.push({
                    id: tx.id,
                    date: new Date(tx.created_at).toLocaleDateString(['id-ID'], { day: 'numeric', month: 'short', year: 'numeric' }),
                    grossAmount: tx.amount,
                    commissionPaid: commissionPaid,
                    netAmount: netAmount, // Actual Income
                    type: tx.type,
                    details: tx,
                    isCommission: false
                })
            })

        } else {
            // Agent: Fetch Commissions
            // Ensure we join transactions correctly
            let query = supabase
                .from('commissions')
                .select(`
                    id,
                    amount,
                    created_at,
                    transactions:source_transaction_id (
                        id,
                        type,
                        amount,
                        status,
                        user_id,
                        lead_id,
                        product_purchases (
                            product_id,
                            customer_name,
                            products (
                                title
                            )
                        )
                    )
                `)
                .eq('agent_id', user.id)
                .order('created_at', { ascending: false })
                .limit(limit)

            const { data: commissions, error } = await query

            if (error) {
                console.error("Error fetching agent sales:", error)
                setLoading(false)
                return
            }

            commissions?.forEach((comm: any) => {
                const tx = comm.transactions
                // Even if tx is missing (deleted?), show commission record
                // But generally tx should be there.

                // Filter Logic
                if (tx && filter !== 'all' && tx.type !== filter) return

                total += comm.amount
                if (tx) {
                    if (tx.type === 'registration') regCount++
                    if (tx.type === 'product_purchase') prodCount++

                    if (tx.type === 'registration') {
                        if (tx.user_id) userIdsToFetch.add(tx.user_id)
                        if (tx.lead_id) leadIdsToFetch.add(tx.lead_id)
                    }
                }

                finalTxns.push({
                    id: comm.id,
                    date: new Date(comm.created_at).toLocaleDateString(['id-ID'], { day: 'numeric', month: 'short', year: 'numeric' }),
                    amount: comm.amount, // Commission Amount
                    type: tx?.type || 'unknown',
                    details: tx || {},
                    isCommission: true
                })
            })
        }

        // Bulk fetch profiles/leads names for search and display
        const namesMap = new Map<string, string>()

        if (userIdsToFetch.size > 0) {
            const { data: profiles } = await supabase.from('profiles').select('id, full_name, email').in('id', Array.from(userIdsToFetch))
            profiles?.forEach((p: any) => namesMap.set(p.id, p.full_name || p.email))
        }
        if (leadIdsToFetch.size > 0) {
            const { data: leads } = await supabase.from('leads').select('id, full_name, email').in('id', Array.from(leadIdsToFetch))
            leads?.forEach((l: any) => namesMap.set(l.id, l.full_name || l.email))
        }

        // Attach names & Apply Clientside Search
        finalTxns = finalTxns.map(t => {
            let sourceName = 'Unknown'
            if (t.type === 'registration') {
                if (t.details.user_id) sourceName = namesMap.get(t.details.user_id) || 'User'
                else if (t.details.lead_id) sourceName = namesMap.get(t.details.lead_id) || 'Lead'
            } else if (t.type === 'product_purchase') {
                const pp = t.details.product_purchases?.[0]
                if (pp) {
                    sourceName = pp.products?.title || 'Product'
                    if (pp.customer_name) sourceName += ` (${pp.customer_name})`
                }
            } else {
                sourceName = 'System Adjustment'
            }
            return { ...t, sourceName }
        }).filter(item => {
            if (!searchQuery) return true
            const q = searchQuery.toLowerCase()
            return (
                item.sourceName.toLowerCase().includes(q) ||
                item.type.toLowerCase().includes(q) ||
                item.id.toLowerCase().includes(q)
            )
        })

        setStats({ totalProfit: total, registrationCount: regCount, productSaleCount: prodCount })
        setTransactions(finalTxns)
        setLoading(false)
    }

    return (
        <div className="space-y-8 p-6 pb-24 md:pb-8">
            <header>
                <h1 className="text-3xl font-bold text-white mb-2">{role === 'admin' ? 'Revenue Dashboard' : 'Sales Dashboard'}</h1>
                <p className="text-slate-400">Track your {role === 'admin' ? 'platform revenue' : 'earnings'} and transaction history.</p>
            </header>

            {/* Total Net Profit/Revenue Card */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl p-6 text-white shadow-xl">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                            <TrendingUp size={24} />
                        </div>
                        <div>
                            <p className="text-blue-100 font-medium">{role === 'admin' ? 'Net Profit (Bersih)' : 'Total Earnings'}</p>
                            <h2 className="text-3xl font-bold">Rp {stats.totalProfit.toLocaleString('id-ID')}</h2>
                        </div>
                    </div>
                </div>
                {/* Stats Cards */}
                <div className="bg-slate-800 rounded-2xl p-6 text-white border border-slate-700">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center text-purple-400">
                            <UserPlus size={20} />
                        </div>
                        <div>
                            <p className="text-slate-400 text-sm">Registrations</p>
                            <h3 className="text-2xl font-bold">{stats.registrationCount}</h3>
                        </div>
                    </div>
                </div>
                <div className="bg-slate-800 rounded-2xl p-6 text-white border border-slate-700">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center text-emerald-400">
                            <ShoppingBag size={20} />
                        </div>
                        <div>
                            <p className="text-slate-400 text-sm">Product Sales</p>
                            <h3 className="text-2xl font-bold">{stats.productSaleCount}</h3>
                        </div>
                    </div>
                </div>
            </div>

            {/* Controls: Filter, Search, Limit */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition whitespace-nowrap ${filter === 'all' ? 'bg-white text-slate-900' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                    >
                        All Transactions
                    </button>
                    <button
                        onClick={() => setFilter('registration')}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition whitespace-nowrap flex items-center gap-2 ${filter === 'registration' ? 'bg-white text-slate-900' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                    >
                        <UserPlus size={16} /> Registration
                    </button>
                    <button
                        onClick={() => setFilter('product_purchase')}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition whitespace-nowrap flex items-center gap-2 ${filter === 'product_purchase' ? 'bg-white text-slate-900' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                    >
                        <ShoppingBag size={16} /> Product Sales
                    </button>
                </div>

                <div className="flex gap-2 w-full md:w-auto">
                    {/* Search */}
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                        <input
                            type="text"
                            placeholder="Search name, type..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-slate-800 border-none rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    {/* Limit */}
                    <div className="relative">
                        <select
                            value={limit}
                            onChange={(e) => setLimit(Number(e.target.value))}
                            className="appearance-none bg-slate-800 text-white pl-4 pr-10 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                        >
                            <option value={50}>50 items</option>
                            <option value={200}>200 items</option>
                            <option value={500}>500 items</option>
                            <option value={1000}>1K items</option>
                        </select>
                        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                </div>
            </div>

            {/* Transactions List */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                    <h3 className="font-bold text-white">Recent Transactions</h3>
                    <div className="bg-slate-800 text-slate-400 px-3 py-1 rounded-lg text-xs font-medium">
                        Showing {transactions.length} items
                    </div>
                </div>

                {loading ? (
                    <div className="p-8 text-center text-slate-500">Loading history...</div>
                ) : transactions.length === 0 ? (
                    <div className="p-12 text-center text-slate-500">
                        <Filter className="w-12 h-12 mx-auto mb-4 opacity-20" />
                        <p>No transactions found.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-800">
                        {transactions.map((txn, idx) => (
                            <motion.div
                                key={txn.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className="p-4 hover:bg-slate-800/50 transition flex flex-col md:flex-row md:items-center justify-between group gap-4"
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${txn.type === 'registration' ? 'bg-purple-500/20 text-purple-400' : 'bg-emerald-500/20 text-emerald-400'
                                        }`}>
                                        {txn.type === 'registration' ? <UserPlus size={18} /> : <ShoppingBag size={18} />}
                                    </div>
                                    <div>
                                        <p className="text-white font-medium">{txn.sourceName}</p>
                                        <div className="flex items-center gap-2 text-xs text-slate-500">
                                            <span className="capitalize">{txn.type?.replace('_', ' ')}</span>
                                            {txn.type === 'registration' && role === 'admin' && (
                                                <span className="bg-slate-800 px-1 rounded text-[10px] text-slate-400">ID: {txn.details.id?.slice(0, 8)}</span>
                                            )}
                                            <span>•</span>
                                            <span className="flex items-center gap-1"><Calendar size={12} /> {txn.date}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right flex flex-col items-end">
                                    {role === 'admin' ? (
                                        <>
                                            <p className="text-green-400 font-bold text-lg flex items-center gap-1">
                                                + Rp {txn.netAmount.toLocaleString()}
                                            </p>
                                            <div className="text-xs text-slate-500 flex flex-col items-end">
                                                <span>Gross: <span className="text-slate-400">Rp {txn.grossAmount.toLocaleString()}</span></span>
                                                {txn.commissionPaid > 0 && (
                                                    <span className="text-red-400/70">Comm: - Rp {txn.commissionPaid.toLocaleString()}</span>
                                                )}
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <p className="text-green-400 font-bold text-lg">+ Rp {txn.amount.toLocaleString()}</p>
                                            <p className="text-xs text-slate-500 badge badge-ghost">Commission</p>
                                        </>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
