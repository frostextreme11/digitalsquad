import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

export default function AdminOverview() {
  const [stats, setStats] = useState({ users: 0, leads: 0, income: 0 })

  useEffect(() => {
     const fetchStats = async () => {
         // Total Users (All profiles)
         const { count: users } = await supabase.from('profiles').select('*', { count: 'exact', head: true })
         
         // Total Leads (Registered users who have NOT paid)
         // Since we can't easily join in a count query, we might need a different approach or just count all 'agent' profiles 
         // and subtract those with sales? 
         // Simpler proxy: Count profiles created recently?
         // Better: Let's assume "Leads" = "Total Users" for now, or "Users - Active Users".
         // But the user specifically asked for "leads".
         // Let's count profiles who don't have a successful transaction.
         
         // Fetch all profiles and their transactions status (this might be heavy for large DB, but fine for now)
         const { data: profiles } = await supabase
            .from('profiles')
            .select('id, transactions!transactions_user_id_fkey(status, type)')
         
         let activeSales = 0
         let potentialLeads = 0
         
         if (profiles) {
             profiles.forEach((p: any) => {
                 const hasPaid = p.transactions?.some((t: any) => t.type === 'registration' && (t.status === 'success' || t.status === 'settlement'))
                 if (hasPaid) {
                     activeSales++
                 } else {
                     potentialLeads++
                 }
             })
         }

         // Income logic: sum of registration fees (approx)
         const { data: transactions } = await supabase.from('transactions').select('amount').eq('status', 'success')
         const income = transactions?.reduce((acc, curr) => acc + curr.amount, 0) || 0
         
         setStats({ 
             users: users || 0, 
             leads: potentialLeads, // Use calculated leads 
             income 
         })
     }
     fetchStats()
  }, [])

  return (
    <div className="space-y-8">
       <h2 className="text-2xl font-bold text-white">Admin Dashboard</h2>
       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
             <h3 className="text-slate-400 text-sm mb-1">Total Users</h3>
             <p className="text-3xl font-bold text-white">{stats.users}</p>
          </div>
          <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
             <h3 className="text-slate-400 text-sm mb-1">Total Leads</h3>
             <p className="text-3xl font-bold text-white">{stats.leads}</p>
          </div>
          <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
             <h3 className="text-slate-400 text-sm mb-1">Total Omset</h3>
             <p className="text-3xl font-bold text-green-400">Rp {stats.income.toLocaleString()}</p>
          </div>
       </div>
    </div>
  )
}
