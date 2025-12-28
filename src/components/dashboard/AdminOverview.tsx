import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import StatsChart from './StatsChart'
import { motion } from 'framer-motion'
import { format, subMonths, startOfMonth, endOfMonth, eachMonthOfInterval } from 'date-fns'
import { Link } from 'react-router-dom'
import { Users, TrendingUp } from 'lucide-react'

export default function AdminOverview() {
    const [stats, setStats] = useState({
        users: 0,
        leads: 0,
        incomeTotal: 0,
        incomeAffiliate: 0,
        incomeOrganic: 0,
        totalWithdrawal: 0,
        netProfit: 0
    })
    const [chartData, setChartData] = useState<any[]>([])

    useEffect(() => {
        const fetchStats = async () => {
            // 1. Total Users
            const { count: users } = await supabase.from('profiles').select('*', { count: 'exact', head: true })

            // 2. Leads (Unpaid Organic)
            const { data: organicProfiles } = await supabase
                .from('profiles')
                .select('id, transactions!transactions_user_id_fkey(status, type)')
                .is('referred_by', null)

            let organicLeadsCount = 0
            if (organicProfiles) {
                organicProfiles.forEach((p: any) => {
                    const hasPaid = p.transactions?.some((t: any) => t.type === 'registration' && (t.status === 'success' || t.status === 'settlement'))
                    if (!hasPaid) organicLeadsCount++
                })
            }

            // 3. Income Split (Affiliate vs Organic)
            const { data: transactions } = await supabase
                .from('transactions')
                .select(`
                amount,
                created_at,
                profiles!transactions_user_id_fkey (referred_by)
            `)
                .eq('status', 'success')
                .eq('type', 'registration')

            let incomeAffiliate = 0
            let incomeOrganic = 0

            if (transactions) {
                transactions.forEach((t: any) => {
                    if (t.profiles?.referred_by) {
                        incomeAffiliate += t.amount
                    } else {
                        incomeOrganic += t.amount
                    }
                })
            }

            const incomeTotal = incomeAffiliate + incomeOrganic

            // 4. Total Withdrawal
            const { data: withdrawals } = await supabase
                .from('withdrawals')
                .select('amount, created_at')
                .eq('status', 'success')

            const totalWithdrawal = withdrawals?.reduce((sum, w) => sum + (w.amount + 2500), 0) || 0

            // 5. Net Profit (Omset - Withdrawal)
            // Note: Withdrawals here are Net Payouts. Ideally we might want to subtract (Withdrawal + Fee).
            // But prompt asks strictly "omset - withdrawal".
            const netProfit = incomeTotal - totalWithdrawal

            setStats({
                users: users || 0,
                leads: organicLeadsCount,
                incomeTotal,
                incomeAffiliate,
                incomeOrganic,
                totalWithdrawal,
                netProfit
            })

            // 6. Chart Data
            const endDate = new Date()
            const startDate = subMonths(endDate, 5)
            const months = eachMonthOfInterval({ start: startDate, end: endDate })

            const aggregatedData = months.map(month => {
                const monthStart = startOfMonth(month)
                const monthEnd = endOfMonth(month)

                const filterByMonth = (items: any[]) => items?.filter(item => {
                    const d = new Date(item.created_at)
                    return d >= monthStart && d <= monthEnd
                })

                const monthTransactions = filterByMonth(transactions || [])
                const monthWithdrawals = filterByMonth(withdrawals || [])

                const monthIncome = monthTransactions.reduce((sum, t) => sum + t.amount, 0)
                const monthWithdrawalTotal = monthWithdrawals.reduce((sum, w) => sum + (w.amount + 2500), 0)

                return {
                    name: format(month, 'MMM'),
                    income: monthIncome,
                    withdrawal: monthWithdrawalTotal,
                    net: monthIncome - monthWithdrawalTotal
                }
            })

            setChartData(aggregatedData)
        }
        fetchStats()
    }, [])

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    }

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    }

    return (
        <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="space-y-8"
        >
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white">Admin Dashboard</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <motion.div variants={item} className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400"><Users size={20} /></div>
                        <h3 className="text-slate-400 text-sm font-medium">Total Users</h3>
                    </div>
                    <p className="text-3xl font-bold text-white">{stats.users}</p>
                </motion.div>

                <Link to="/dashboard/leads">
                    <motion.div variants={item} className="bg-slate-900 p-6 rounded-2xl border border-slate-800 hover:border-blue-500/30 transition cursor-pointer h-full">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400"><Users size={20} /></div>
                            <h3 className="text-slate-400 text-sm font-medium">Organic Leads (Unpaid)</h3>
                        </div>
                        <p className="text-3xl font-bold text-white">{stats.leads}</p>
                        <p className="text-xs text-purple-400 mt-2">Click to view details</p>
                    </motion.div>
                </Link>

                <motion.div variants={item} className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-green-500/10 rounded-lg text-green-400"><TrendingUp size={20} /></div>
                        <h3 className="text-slate-400 text-sm font-medium">Total Omset</h3>
                    </div>
                    <p className="text-3xl font-bold text-green-400">Rp {stats.incomeTotal.toLocaleString()}</p>
                    <div className="mt-4 space-y-1 text-xs">
                        <div className="flex justify-between text-slate-400">
                            <span>Organic:</span>
                            <span className="text-white">Rp {stats.incomeOrganic.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-slate-400">
                            <span>Affiliate:</span>
                            <span className="text-white">Rp {stats.incomeAffiliate.toLocaleString()}</span>
                        </div>
                    </div>
                </motion.div>

                {/* Total Withdrawal */}
                <motion.div variants={item} className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-red-500/10 rounded-lg text-red-400"><TrendingUp size={20} className="rotate-180" /></div>
                        <h3 className="text-slate-400 text-sm font-medium">Total Withdrawal</h3>
                    </div>
                    <p className="text-3xl font-bold text-red-400">Rp {stats.totalWithdrawal.toLocaleString()}</p>
                </motion.div>

                {/* Net Profit */}
                <motion.div variants={item} className="bg-slate-900 p-6 rounded-2xl border border-slate-800 lg:col-span-2">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400"><TrendingUp size={20} /></div>
                        <h3 className="text-slate-400 text-sm font-medium">Net Profit (Omset - Withdrawal)</h3>
                    </div>
                    <p className="text-3xl font-bold text-emerald-400">Rp {stats.netProfit.toLocaleString()}</p>
                    <p className="text-slate-500 text-xs mt-2">
                        Profit bersih dari selisih total pemasukan dan total penarikan affiliate.
                    </p>
                </motion.div>
            </div>

            <motion.div variants={item}>
                <StatsChart data={chartData} currency={true} mode="admin" />
            </motion.div>
        </motion.div>
    )
}

