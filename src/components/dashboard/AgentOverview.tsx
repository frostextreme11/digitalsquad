import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Copy, CheckCircle, Users, TrendingUp, MousePointer, GraduationCap } from 'lucide-react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import StatsChart from './StatsChart'
import { format, subMonths, startOfMonth, endOfMonth, eachMonthOfInterval } from 'date-fns'

export default function AgentOverview({ profile }: { profile: any }) {
   const [stats, setStats] = useState({ visits: 0, leads: 0, sales: 0, commission: 0, academy: { total: 0, completed: 0, percentage: 0, currentBadge: 'Novice' } })
   const [chartData, setChartData] = useState<any[]>([])
   const [copied, setCopied] = useState(false)

   const affiliateLink = `${window.location.origin}/?ref=${profile.affiliate_code || 'generating...'}`

   useEffect(() => {
      // Fetch stats
      const fetchStats = async () => {
         if (!profile.affiliate_code) return

         // Visits
         const { count: visits } = await supabase.from('visits').select('*', { count: 'exact', head: true }).eq('affiliate_code', profile.affiliate_code)

         // Leads (People referred by me who haven't paid or are just starting)
         // Note: We count profiles referred by me.
         const { count: leads } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .eq('referred_by', profile.id)

         // Sales (Commissions count)
         const { count: sales } = await supabase.from('commissions').select('*', { count: 'exact', head: true }).eq('agent_id', profile.id)

         // Academy Stats
         // Fetch all active posts to determine levels
         const { data: allModules } = await supabase
            .from('academy_posts')
            .select('id, level_badge, order_index')
            .eq('is_active', true)
            .order('order_index', { ascending: true })

         const { data: userProgress } = await supabase
            .from('academy_progress')
            .select('post_id')
            .eq('user_id', profile.id)

         const totalModules = allModules?.length || 0
         const completedModules = userProgress?.length || 0

         // Determine current badge
         // Logic: Find the highest order_index module that is completed and has a badge
         let currentBadge = 'Novice' // Default Starting Badge

         if (allModules && userProgress) {
            const completedPostIds = new Set(userProgress.map(p => p.post_id))

            // Iterate through modules in order. 
            // If a module is completed and has a badge, update currentBadge.
            // This assumes modules are linear.
            for (const module of allModules) {
               if (completedPostIds.has(module.id)) {
                  if (module.level_badge) {
                     currentBadge = module.level_badge
                  }
               }
            }
         }

         setStats(prev => ({
            ...prev,
            visits: visits || 0,
            leads: (leads || 0) - (sales || 0), // Pending leads = Total referred - Sales
            sales: sales || 0,
            academy: {
               total: totalModules || 0,
               completed: completedModules || 0,
               percentage: totalModules ? Math.round(((completedModules || 0) / totalModules) * 100) : 0,
               currentBadge: currentBadge
            }
         }))

         // Fetch Chart Data (Last 6 Months)
         const endDate = new Date()
         const startDate = subMonths(endDate, 5) // 6 months total including current

         // 1. Visits by date
         const { data: visitsData } = await supabase
            .from('visits')
            .select('created_at')
            .eq('affiliate_code', profile.affiliate_code)
            .gte('created_at', startDate.toISOString())

         // 2. Leads (Registered) by date
         const { data: leadsData } = await supabase
            .from('profiles')
            .select('created_at')
            .eq('referred_by', profile.id)
            .gte('created_at', startDate.toISOString())

         // 3. Sales (Commissions) by date
         const { data: salesData } = await supabase
            .from('commissions')
            .select('created_at')
            .eq('agent_id', profile.id)
            .gte('created_at', startDate.toISOString())

         // Aggregate by month
         const months = eachMonthOfInterval({ start: startDate, end: endDate })

         const aggregatedData = months.map(month => {
            const monthStart = startOfMonth(month)
            const monthEnd = endOfMonth(month)

            const filterByMonth = (items: any[]) => items?.filter(item => {
               const d = new Date(item.created_at)
               return d >= monthStart && d <= monthEnd
            }).length || 0

            return {
               name: format(month, 'MMM'),
               clicks: filterByMonth(visitsData || []),
               leads: filterByMonth(leadsData || []), // This is "Total Signups" for chart
               sales: filterByMonth(salesData || [])
            }
         })

         setChartData(aggregatedData)
      }
      if (profile.id) fetchStats()
   }, [profile])

   const copyLink = () => {
      navigator.clipboard.writeText(affiliateLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
   }

   const container = {
      hidden: { opacity: 0 },
      show: {
         opacity: 1,
         transition: {
            staggerChildren: 0.1
         }
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
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <motion.div variants={item} className="bg-gradient-to-br from-blue-600 to-purple-700 p-8 rounded-3xl shadow-2xl text-white relative overflow-hidden">
               <div className="relative z-10">
                  <h2 className="text-xl font-medium mb-2 opacity-90">Saldo Dompet</h2>
                  <div className="text-5xl font-bold tracking-tight">Rp {profile.balance?.toLocaleString()}</div>
                  <div className="flex items-center justify-between mt-4">
                     <p className="text-sm opacity-75">Siap ditarik kapan saja.</p>
                     <Link to="/dashboard/wallet" className="bg-white text-blue-600 px-4 py-2 rounded-xl text-sm font-bold hover:bg-blue-50 transition shadow-lg">
                        Withdraw
                     </Link>
                  </div>
               </div>
               <div className="absolute right-0 bottom-0 w-32 h-32 bg-white/10 rounded-full blur-2xl transform translate-x-10 translate-y-10 pointer-events-none"></div>
            </motion.div>

            <motion.div variants={item} className="bg-slate-900 p-8 rounded-3xl border border-slate-800 flex flex-col justify-center">
               <label className="block text-slate-400 mb-3 text-sm font-medium uppercase tracking-wide">Link Affiliate Anda</label>
               <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-300 font-mono text-sm truncate flex items-center">
                     {affiliateLink}
                  </div>
                  <button onClick={copyLink} className="bg-slate-800 hover:bg-slate-700 text-white px-5 py-3 rounded-xl flex items-center justify-center gap-2 transition duration-200 border border-slate-700 shrink-0">
                     {copied ? <CheckCircle size={20} className="text-green-400" /> : <Copy size={20} />}
                  </button>
               </div>
               <p className="text-xs text-slate-500 mt-3">Bagikan link ini untuk mendapatkan komisi.</p>
            </motion.div>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Link to="/dashboard/academy" className="block">
               <motion.div variants={item} className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800/50 hover:border-blue-500/30 transition cursor-pointer h-full relative overflow-hidden">
                  <div className="flex items-center gap-4 mb-2 relative z-10">
                     <div className="p-3 bg-blue-500/10 rounded-lg text-blue-400"><GraduationCap size={24} /></div>
                     <div className="flex flex-col">
                        <h3 className="text-slate-400 text-xs font-medium uppercase tracking-wider">Rank</h3>
                        <span className="text-white font-bold text-lg leading-tight">{stats.academy.currentBadge}</span>
                     </div>
                  </div>
                  <div className="relative z-10">
                     <p className="text-3xl font-bold text-white pl-1">{stats.academy.percentage}%</p>
                     <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
                        <div className="bg-blue-500 h-full rounded-full transition-all duration-1000" style={{ width: `${stats.academy.percentage}%` }}></div>
                     </div>
                  </div>
                  {/* Background Decoration */}
                  <div className="absolute -right-4 -bottom-4 text-slate-800/20 rotate-[-15deg]">
                     <GraduationCap size={100} />
                  </div>
               </motion.div>
            </Link>
            <motion.div variants={item} className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800/50 hover:border-blue-500/30 transition">
               <div className="flex items-center gap-4 mb-2">
                  <div className="p-3 bg-blue-500/10 rounded-lg text-blue-400"><MousePointer size={24} /></div>
                  <h3 className="text-slate-400 font-medium">Total Clicks</h3>
               </div>
               <p className="text-3xl font-bold text-white pl-1">{stats.visits}</p>
            </motion.div>

            <Link to="/dashboard/leads" className="block">
               <motion.div variants={item} className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800/50 hover:border-purple-500/30 transition cursor-pointer h-full">
                  <div className="flex items-center gap-4 mb-2">
                     <div className="p-3 bg-purple-500/10 rounded-lg text-purple-400"><Users size={24} /></div>
                     <h3 className="text-slate-400 font-medium">Total Leads</h3>
                  </div>
                  <p className="text-3xl font-bold text-white pl-1">{stats.leads}</p>
                  <p className="text-xs text-purple-400 mt-2">Klik untuk lihat detail</p>
               </motion.div>
            </Link>

            <motion.div variants={item} className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800/50 hover:border-green-500/30 transition">
               <div className="flex items-center gap-4 mb-2">
                  <div className="p-3 bg-green-500/10 rounded-lg text-green-400"><TrendingUp size={24} /></div>
                  <h3 className="text-slate-400 font-medium">Total Sales</h3>
               </div>
               <p className="text-3xl font-bold text-white pl-1">{stats.sales}</p>
            </motion.div>
         </div>

         <motion.div variants={item}>
            <StatsChart data={chartData} />
         </motion.div>
      </motion.div>
   )
}

