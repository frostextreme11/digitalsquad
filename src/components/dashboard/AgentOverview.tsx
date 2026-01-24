import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Copy, CheckCircle, Users, TrendingUp, MousePointer, GraduationCap, Crown, Star, Shield, ArrowUp, RefreshCw, Download, Play, MessageCircle, Instagram, Twitter, Music2, Calendar, Clock, Video, Loader2, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import StatsChart from './StatsChart'
import { format, subMonths, startOfMonth, endOfMonth, eachMonthOfInterval } from 'date-fns'

interface TierInfo {
   id: string
   tier_key: 'basic' | 'pro' | 'vip'
   name: string
   commission_rate: number
   min_withdraw: number
   upgrade_sales_threshold: number | null
   priority_withdrawal: boolean
}

export default function AgentOverview({ profile }: { profile: any }) {
   const [stats, setStats] = useState({ visits: 0, leads: 0, sales: 0, commission: 0, academy: { total: 0, completed: 0, percentage: 0, currentBadge: 'Novice' } })
   const [chartData, setChartData] = useState<any[]>([])
   const [copied, setCopied] = useState(false)
   const [tierInfo, setTierInfo] = useState<TierInfo | null>(null)
   const [nextTier, setNextTier] = useState<TierInfo | null>(null)
   const [totalSales, setTotalSales] = useState(0)
   const [loadingTier, setLoadingTier] = useState(true)

   // Mission State
   const [missions, setMissions] = useState<{ content: any, testimony: any }>({ content: null, testimony: null })
   const [missionLoading, setMissionLoading] = useState(true)
   const [selectedMission, setSelectedMission] = useState<any>(null)
   const [currentTime, setCurrentTime] = useState(new Date())

   const DEFAULT_TIER: TierInfo = {
      id: 'default',
      tier_key: 'basic',
      name: 'Basic Agent',
      commission_rate: 0.30,
      min_withdraw: 50000,
      upgrade_sales_threshold: 5,
      priority_withdrawal: false
   }

   const [localAffiliateCode, setLocalAffiliateCode] = useState(profile.affiliate_code)

   useEffect(() => {
      // If code is missing from prop, try to fetch it (self-healing for backfilled/newly generated codes)
      if (!localAffiliateCode && profile.id) {
         const fetchCode = async () => {
            const { data } = await supabase
               .from('profiles')
               .select('affiliate_code')
               .eq('id', profile.id)
               .single()

            if (data?.affiliate_code) {
               setLocalAffiliateCode(data.affiliate_code)
            }
         }
         fetchCode()
      }
   }, [profile.id, localAffiliateCode])

   const affiliateLink = `${window.location.origin}/?ref=${localAffiliateCode || 'generating...'}`

   useEffect(() => {
      let isMounted = true

      const fetchTierInfo = async () => {
         try {
            // Reset states before fetching
            setNextTier(null)

            // Get user's current tier and sales from DB to ensure fresh data
            const { data: profileData } = await supabase
               .from('profiles')
               .select('tier_id, total_sales')
               .eq('id', profile.id)
               .maybeSingle()

            if (!isMounted) return
            setTotalSales(profileData?.total_sales || 0)

            let currentTier: TierInfo | null = null

            // 1. Try to fetch assigned tier if it exists
            if (profileData?.tier_id) {
               const { data: tier } = await supabase
                  .from('tiers')
                  .select('*')
                  .eq('id', profileData.tier_id)
                  .single()

               if (tier) {
                  currentTier = tier as TierInfo
               }
            }

            // 2. Fallback: query 'basic' tier if no tier assigned or fetch failed
            if (!currentTier) {
               const { data: basicTier } = await supabase
                  .from('tiers')
                  .select('*')
                  .eq('tier_key', 'basic')
                  .single()

               currentTier = basicTier ? (basicTier as TierInfo) : DEFAULT_TIER
            }

            // 3. Set tier info and calculate next tier
            if (isMounted && currentTier) {
               setTierInfo(currentTier)

               // Get next tier for upgrade progress
               const tierOrder: string[] = ['basic', 'pro', 'vip']
               const currentKey = (currentTier.tier_key || 'basic') as string
               const currentIndex = tierOrder.indexOf(currentKey)

               if (currentIndex !== -1 && currentIndex < tierOrder.length - 1) {
                  const { data: next } = await supabase
                     .from('tiers')
                     .select('*')
                     .eq('tier_key', tierOrder[currentIndex + 1] as 'basic' | 'pro' | 'vip')
                     .single()
                  if (next && isMounted) setNextTier(next as TierInfo)
               }
            }
         } catch (error) {
            console.error("Error fetching tier info:", error)
            if (isMounted) setTierInfo(DEFAULT_TIER)
         } finally {
            if (isMounted) setLoadingTier(false)
         }
      }

      if (profile?.id) {
         setLoadingTier(true)
         fetchTierInfo()
      } else {
         setLoadingTier(false)
      }

      return () => { isMounted = false }
   }, [profile?.id])

   useEffect(() => {
      const fetchStats = async () => {
         const codeToUse = localAffiliateCode || profile.affiliate_code
         if (!codeToUse) return

         const endDate = new Date()
         const startDate = subMonths(endDate, 5)

         try {
            const [
               { count: visits },
               { data: pendingLeads },
               { count: sales },
               { data: allModules },
               { data: userProgress },
               { data: visitsData },
               { data: leadsData },
               { data: salesData }
            ] = await Promise.all([
               supabase.from('visits').select('*', { count: 'exact', head: true }).eq('affiliate_code', codeToUse),
               // @ts-ignore
               supabase.rpc('get_agent_leads_count', { p_agent_id: profile.id, search_query: '' }),
               supabase.from('commissions').select('*', { count: 'exact', head: true }).eq('agent_id', profile.id),
               supabase.from('academy_posts').select('id, level_badge').eq('is_active', true).order('order_index', { ascending: true }),
               supabase.from('academy_progress').select('post_id').eq('user_id', profile.id),
               supabase.from('visits').select('created_at').eq('affiliate_code', codeToUse).gte('created_at', startDate.toISOString()),
               supabase.from('profiles').select('created_at').eq('referred_by', profile.id).gte('created_at', startDate.toISOString()),
               supabase.from('commissions').select('created_at').eq('agent_id', profile.id).gte('created_at', startDate.toISOString())
            ])

            // Academy Logic
            const totalModules = allModules?.length || 0
            const completedModules = userProgress?.length || 0
            let currentBadge = 'Novice'

            if (allModules && userProgress) {
               const completedPostIds = new Set(userProgress.map(p => p.post_id))
               for (const module of allModules) {
                  if (completedPostIds.has(module.id) && module.level_badge) {
                     currentBadge = module.level_badge
                  }
               }
            }

            setStats(prev => ({
               ...prev,
               visits: visits || 0,
               leads: Number(pendingLeads || 0),
               sales: sales || 0,
               academy: {
                  total: totalModules,
                  completed: completedModules,
                  percentage: totalModules ? Math.round((completedModules / totalModules) * 100) : 0,
                  currentBadge
               }
            }))

            // Chart Data Logic
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
                  leads: filterByMonth(leadsData || []),
                  sales: filterByMonth(salesData || [])
               }
            })

            setChartData(aggregatedData)

         } catch (error) {
            console.error("Error fetching stats:", error)
         }
      }

      if (profile.id) fetchStats()
   }, [profile.id, localAffiliateCode])

   // Updates current time every minute for the schedule highlighter
   useEffect(() => {
      const timer = setInterval(() => setCurrentTime(new Date()), 60000)
      return () => clearInterval(timer)
   }, [])

   // Mission Logic
   useEffect(() => {
      fetchRandomMission()
   }, [])

   const fetchRandomMission = async () => {
      setMissionLoading(true)
      try {
         const { data } = await supabase.from('video_testimonials').select('*')
         if (data && data.length > 0) {
            const contentVideos = data.filter(v => v.category === 'content')
            const testimonyVideos = data.filter(v => !v.category || v.category === 'testimony')

            const randomContent = contentVideos.length > 0 ? contentVideos[Math.floor(Math.random() * contentVideos.length)] : null
            const randomTestimony = testimonyVideos.length > 0 ? testimonyVideos[Math.floor(Math.random() * testimonyVideos.length)] : null

            setMissions({ content: randomContent, testimony: randomTestimony })
         }
      } catch (err) {
         console.error("Error fetching mission", err)
      } finally {
         setMissionLoading(false)
      }
   }

   const handleMissionCopy = (video: any) => {
      if (!video) return
      const text = `${video.description || ''}\n\nInfo lebih lanjut: ${affiliateLink}`
      navigator.clipboard.writeText(text)
      toast.success('Caption + Link berhasil disalin!')
   }

   const handleMissionDownload = async (video: any) => {
      if (!video) return
      toast.loading('Mulai download...', { duration: 2000 })
      try {
         const response = await fetch(video.video_url)
         const blob = await response.blob()
         const url = window.URL.createObjectURL(blob)
         const a = document.createElement('a')
         a.href = url
         a.download = `${video.title.replace(/\s+/g, '_')}.mp4`
         document.body.appendChild(a)
         a.click()
         window.URL.revokeObjectURL(url)
         document.body.removeChild(a)
         toast.success('Download berhasil!')
      } catch (err) {
         console.error('Download failed', err)
         window.open(video.video_url, '_blank')
      }
   }

   const isWeekend = new Date().getDay() === 0 || new Date().getDay() === 6
   const todaySchedule = isWeekend ? [
      { time: '07:00 - 08:00', tasks: [{ name: 'WA Status', icon: MessageCircle }, { name: 'IG Story', icon: Instagram }] },
      { time: '12:00 - 13:00', tasks: [{ name: 'Tiktok', icon: Music2 }, { name: 'Twitter', icon: Twitter }, { name: 'IG Post', icon: Instagram }, { name: 'IG Story', icon: Instagram }, { name: 'WA Status', icon: MessageCircle }] },
      { time: '13:00 - 15:00', tasks: [{ name: 'Tiktok', icon: Music2 }, { name: 'IG Post', icon: Instagram }, { name: 'Twitter', icon: Twitter }, { name: 'IG Story', icon: Instagram }, { name: 'WA Status', icon: MessageCircle }] },
      { time: '19:00 - 22:00', tasks: [{ name: 'Tiktok', icon: Music2 }, { name: 'IG Post', icon: Instagram }, { name: 'Twitter', icon: Twitter }, { name: 'IG Story', icon: Instagram }, { name: 'WA Status', icon: MessageCircle }], label: 'Golden Hour' }
   ] : [
      { time: '07:00 - 08:00', tasks: [{ name: 'WA Status', icon: MessageCircle }, { name: 'IG Story', icon: Instagram }] },
      { time: '12:00 - 13:00', tasks: [{ name: 'Tiktok', icon: Music2 }, { name: 'Twitter', icon: Twitter }, { name: 'IG Post', icon: Instagram }, { name: 'IG Story', icon: Instagram }, { name: 'WA Status', icon: MessageCircle }] },
      { time: '15:30 - 17:00', tasks: [{ name: 'Twitter', icon: Twitter }, { name: 'IG Story', icon: Instagram }, { name: 'WA Status', icon: MessageCircle }] },
      { time: '19:00 - 21:00', tasks: [{ name: 'Tiktok', icon: Music2 }, { name: 'IG Post', icon: Instagram }, { name: 'Twitter', icon: Twitter }, { name: 'IG Story', icon: Instagram }, { name: 'WA Status', icon: MessageCircle }], label: 'Golden Hour' }
   ]

   const getScheduleStatus = (timeRange: string) => {
      // timeRange format "HH:mm - HH:mm"
      const [startStr, endStr] = timeRange.split(' - ')
      if (!startStr || !endStr) return 'normal'

      const now = currentTime
      const [startHour, startMinute] = startStr.split(':').map(Number)
      const [endHour, endMinute] = endStr.split(':').map(Number)

      const startTime = new Date(now)
      startTime.setHours(startHour, startMinute, 0, 0)

      const endTime = new Date(now)
      endTime.setHours(endHour, endMinute, 0, 0)

      // Handle crossing midnight if needed (though schedule seems fit in day)
      // Assuming schedules are within same day for simplicity given requirements

      const approachingTime = new Date(startTime)
      approachingTime.setHours(startTime.getHours() - 2) // 2 hours before

      if (now >= startTime && now <= endTime) return 'active'
      if (now >= approachingTime && now < startTime) return 'approaching'
      return 'normal'
   }

   const copyLink = () => {
      navigator.clipboard.writeText(affiliateLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
   }

   const getTierIcon = (tierKey: string) => {
      switch (tierKey) {
         case 'basic': return <Star size={24} />
         case 'pro': return <Crown size={24} />
         case 'vip': return <Shield size={24} />
         default: return <Star size={24} />
      }
   }

   const getTierGradient = (tierKey: string) => {
      switch (tierKey) {
         case 'basic': return 'from-slate-700 to-slate-800 border-slate-600'
         case 'pro': return 'from-blue-600 to-indigo-700 border-blue-500'
         case 'vip': return 'from-yellow-500 to-amber-600 border-yellow-400'
         default: return 'from-slate-700 to-slate-800 border-slate-600'
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

   // Use a derived state for rendering to guarantee we always show something
   const activeTier = tierInfo || DEFAULT_TIER

   const upgradeProgress = nextTier?.upgrade_sales_threshold
      ? Math.min(100, (totalSales / nextTier.upgrade_sales_threshold) * 100)
      : 0

   return (
      <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">

         {/* Top Row: Balance & Affiliate */}
         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.div variants={item} className="bg-gradient-to-br from-blue-600 to-indigo-800 p-6 md:p-8 rounded-3xl shadow-2xl text-white relative overflow-hidden flex flex-col justify-between h-full min-h-[200px]">
               <div className="relative z-10">
                  <h2 className="text-blue-100 font-medium mb-1 text-sm uppercase tracking-wider">Saldo Dompet</h2>
                  <div className="text-4xl md:text-5xl font-bold tracking-tight mb-6">Rp {profile.balance?.toLocaleString()}</div>
                  <div className="flex flex-wrap items-center justify-between gap-4">
                     <div className="bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 text-xs md:text-sm text-blue-50">
                        Min. WD: <span className="font-semibold text-white">Rp {activeTier.min_withdraw?.toLocaleString() || '50.000'}</span>
                     </div>
                     <Link to="/dashboard/wallet" className="bg-white text-blue-700 px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-blue-50 transition shadow-lg flex items-center gap-2">
                        Withdraw <ArrowUp size={16} />
                     </Link>
                  </div>
               </div>
               <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
            </motion.div>

            <motion.div
               variants={item}
               animate={copied ? {
                  boxShadow: "0 0 30px rgba(59, 130, 246, 0.4)",
                  borderColor: "rgba(59, 130, 246, 0.5)",
                  scale: 1.02
               } : {
                  boxShadow: "0 0 0px rgba(59, 130, 246, 0)",
                  borderColor: "rgba(30, 41, 59, 0.5)",
                  scale: 1
               }}
               transition={{ duration: 0.3 }}
               className="bg-slate-900/80 backdrop-blur-xl p-6 md:p-8 rounded-3xl border border-slate-800 flex flex-col justify-center h-full min-h-[200px] relative overflow-hidden group"
            >
               {/* Border Beam Animation (Idle) */}
               {!copied && (
                  <div className="absolute inset-0 rounded-3xl pointer-events-none overflow-hidden z-0">
                     <motion.div
                        initial={{ x: '-100%', opacity: 0 }}
                        animate={{ x: '200%', opacity: [0, 1, 1, 0] }}
                        transition={{
                           repeat: Infinity,
                           duration: 3,
                           ease: "linear",
                           repeatDelay: 1
                        }}
                        className="absolute top-0 bottom-0 w-[40%] bg-gradient-to-r from-transparent via-blue-500/60 to-transparent skew-x-12 -ml-20"
                        style={{ filter: 'blur(5px)' }}
                     />
                     {/* Masking the center to create outline effect */}
                     <div className="absolute inset-[1px] bg-slate-900 rounded-[22px]" />
                  </div>
               )}

               {/* Background Glow */}
               <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-transparent opacity-50 group-hover:opacity-100 transition duration-500 z-0"></div>

               <motion.div
                  className="absolute -inset-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-3xl opacity-0 blur-lg transition duration-500"
                  animate={copied ? { opacity: 0.3 } : { opacity: 0 }}
               ></motion.div>

               <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-4">
                     <div className={`p-2 rounded-lg transition-colors duration-300 ${copied ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-800 text-slate-400'}`}>
                        <Copy size={18} />
                     </div>
                     <label className={`text-sm font-medium uppercase tracking-wide transition-colors duration-300 ${copied ? 'text-blue-400' : 'text-slate-400'}`}>Link Affiliate</label>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                     <div className={`flex-1 bg-slate-950 border rounded-xl px-4 py-3 text-slate-300 font-mono text-xs md:text-sm truncate select-all transition-colors duration-300 ${copied ? 'border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.2)]' : 'border-slate-800'}`}>
                        {affiliateLink}
                     </div>
                     <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={copyLink}
                        className={`px-6 py-3 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 shadow-lg font-bold shrink-0 relative overflow-hidden ${copied
                           ? 'bg-green-500 text-white shadow-green-500/50'
                           : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-500/30'
                           }`}
                     >
                        {copied && (
                           <motion.div
                              initial={{ scale: 0, opacity: 0 }}
                              animate={{ scale: 20, opacity: 0 }}
                              transition={{ duration: 0.5 }}
                              className="absolute inset-0 bg-white rounded-full place-self-center pointer-events-none"
                           />
                        )}
                        {copied ? (
                           <motion.div
                              initial={{ scale: 0.5, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              className="flex items-center gap-2"
                           >
                              <CheckCircle size={20} /> <span>Tersalin!</span>
                           </motion.div>
                        ) : (
                           <span className="flex items-center gap-2">Salin Link</span>
                        )}
                     </motion.button>
                  </div>
                  <p className="text-xs text-slate-500 mt-4 leading-relaxed group-hover:text-slate-400 transition-colors">
                     Bagikan link ini ke media sosial atau teman untuk mendapatkan komisi
                     <span className="text-blue-400 font-bold glow-text"> {(activeTier.commission_rate || 0.3) * 100}%</span> dari setiap penjualan.
                  </p>
               </div>

               {/* Decorative floating elements */}
               <div className="absolute bottom-0 right-0 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl translate-y-10 translate-x-10 pointer-events-none mix-blend-screen animate-pulse"></div>
               <div className="absolute top-0 left-0 w-32 h-32 bg-purple-500/5 rounded-full blur-3xl -translate-y-10 -translate-x-10 pointer-events-none mix-blend-screen"></div>
            </motion.div>
         </div>

         {/* Mission Card */}
         <motion.div variants={item} className="bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-900 rounded-3xl border border-indigo-500/30 overflow-hidden shadow-2xl relative">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

            <div className="p-6 md:p-8 relative z-10">
               <div className="flex flex-col md:flex-row gap-8 items-start">

                  {/* Left: Schedule */}
                  <div className="flex-1 w-full">
                     <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-300">
                           <Calendar size={24} />
                        </div>
                        <div>
                           <h3 className="text-xl font-bold text-white">Misi Harian Agent</h3>
                           <p className="text-indigo-200 text-sm">{isWeekend ? 'Jadwal Weekend (Sabtu - Minggu)' : 'Jadwal Weekday (Senin - Jumat)'}</p>
                        </div>
                     </div>

                     <div className="space-y-4">
                        {todaySchedule.map((slot, idx) => {
                           const status = getScheduleStatus(slot.time)

                           return (
                              <div
                                 key={idx}
                                 className={`p-4 rounded-xl border transition-all duration-500 relative overflow-hidden ${status === 'active'
                                    ? 'bg-gradient-to-r from-green-900/40 to-emerald-900/40 border-green-500 shadow-[0_0_20px_rgba(34,197,94,0.3)]'
                                    : status === 'approaching'
                                       ? 'bg-indigo-900/30 border-yellow-500/50 shadow-[0_0_15px_rgba(234,179,8,0.2)]'
                                       : slot.label ? 'bg-indigo-900/30 border-indigo-500/50' : 'bg-slate-800/40 border-slate-700/50'
                                    }`}
                              >
                                 {status === 'active' && (
                                    <div className="absolute inset-0 bg-green-500/10 animate-pulse pointer-events-none"></div>
                                 )}
                                 {status === 'approaching' && (
                                    <div className="absolute inset-0 bg-yellow-500/5 animate-pulse pointer-events-none" style={{ animationDuration: '3s' }}></div>
                                 )}

                                 <div className="relative z-10">
                                    <div className="flex justify-between items-center mb-3">
                                       <div className={`flex items-center gap-2 font-mono font-semibold ${status === 'active' ? 'text-green-400' : status === 'approaching' ? 'text-yellow-400' : 'text-white'
                                          }`}>
                                          <Clock size={16} className={status === 'active' ? 'animate-bounce' : ''} />
                                          {slot.time}
                                          {status === 'active' && <span className="text-[10px] bg-green-500 text-black px-2 py-0.5 rounded font-bold animate-pulse">NOW</span>}
                                          {status === 'approaching' && <span className="text-[10px] bg-yellow-500/20 text-yellow-300 border border-yellow-500/50 px-2 py-0.5 rounded font-bold">SOON</span>}
                                       </div>
                                       {slot.label && (
                                          <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded border border-amber-500/30 flex items-center gap-1">
                                             <Star size={10} fill="currentColor" /> {slot.label}
                                          </span>
                                       )}
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                       {slot.tasks.map((task, tIdx) => (
                                          <div key={tIdx} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs ${status === 'active'
                                             ? 'bg-green-950/50 border-green-500/30 text-green-200'
                                             : 'bg-slate-900/80 border-slate-700 text-slate-300'
                                             }`}>
                                             <task.icon size={12} className={task.name.includes('IG') ? 'text-pink-500' : task.name.includes('Twitter') ? 'text-sky-500' : task.name.includes('WA') ? 'text-green-500' : task.name.includes('Tiktok') ? 'text-white' : 'text-slate-400'} />
                                             {task.name}
                                          </div>
                                       ))}
                                    </div>
                                 </div>
                              </div>
                           )
                        })}
                     </div>
                  </div>

                  {/* Right: Content Generator */}

                  {/* Right: Content Generator - Stacked for 2 items */}
                  <div className="w-full md:w-[400px] shrink-0 flex flex-col gap-4">

                     {/* 1. Testimony Mission */}
                     <div className="bg-slate-950/50 border border-indigo-500/20 rounded-2xl p-5 backdrop-blur-sm flex-1 flex flex-col">
                        <div className="flex items-center justify-between mb-2">
                           <h4 className="text-white font-bold flex items-center gap-2 text-sm">
                              <Star size={16} className="text-yellow-500" />
                              Misi: Share Testimoni
                           </h4>
                           <button onClick={fetchRandomMission} className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition">
                              <RefreshCw size={14} className={missionLoading ? 'animate-spin' : ''} />
                           </button>
                        </div>
                        {missionLoading ? (
                           <div className="h-32 bg-slate-900 rounded-lg animate-pulse"></div>
                        ) : missions.testimony ? (
                           <div className="flex gap-3">
                              <div
                                 className="w-24 aspect-[9/16] bg-black rounded-lg overflow-hidden relative cursor-pointer group shrink-0 border border-slate-700"
                                 onClick={() => setSelectedMission(missions.testimony)}
                              >
                                 {missions.testimony.thumbnail_url ? (
                                    <img src={missions.testimony.thumbnail_url} className="w-full h-full object-cover opacity-80" />
                                 ) : (
                                    <video src={missions.testimony.video_url + '#t=1.0'} className="w-full h-full object-cover opacity-80" />
                                 )}
                                 <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-transparent transition">
                                    <Play size={20} className="text-white drop-shadow-md" />
                                 </div>
                              </div>
                              <div className="flex-1 min-w-0 flex flex-col">
                                 <h5 className="text-white text-xs font-bold line-clamp-2 leading-tight mb-1">{missions.testimony.title}</h5>
                                 <p className="text-slate-500 text-[10px] line-clamp-2 mb-auto">{missions.testimony.description}</p>
                                 <div className="flex gap-2 mt-2">
                                    <button onClick={() => handleMissionCopy(missions.testimony)} className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-1.5 rounded-lg text-[10px] font-bold">Copy</button>
                                    <button onClick={() => handleMissionDownload(missions.testimony)} className="px-2 bg-slate-800 hover:bg-slate-700 text-slate-300 py-1.5 rounded-lg"><Download size={12} /></button>
                                 </div>
                              </div>
                           </div>
                        ) : (
                           <div className="h-20 flex items-center justify-center text-slate-600 text-xs">No testimony available</div>
                        )}
                     </div>

                     {/* 2. Content Mission */}
                     <div className="bg-slate-950/50 border border-pink-500/20 rounded-2xl p-5 backdrop-blur-sm flex-1 flex flex-col">
                        <div className="flex items-center justify-between mb-2">
                           <h4 className="text-white font-bold flex items-center gap-2 text-sm">
                              <Video size={16} className="text-pink-500" />
                              Misi: Upload Konten
                           </h4>
                        </div>
                        {missionLoading ? (
                           <div className="h-32 bg-slate-900 rounded-lg animate-pulse"></div>
                        ) : missions.content ? (
                           <div className="flex gap-3">
                              <div
                                 className="w-24 aspect-[9/16] bg-black rounded-lg overflow-hidden relative cursor-pointer group shrink-0 border border-slate-700"
                                 onClick={() => setSelectedMission(missions.content)}
                              >
                                 {missions.content.thumbnail_url ? (
                                    <img src={missions.content.thumbnail_url} className="w-full h-full object-cover opacity-80" />
                                 ) : (
                                    <video src={missions.content.video_url + '#t=1.0'} className="w-full h-full object-cover opacity-80" />
                                 )}
                                 <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-transparent transition">
                                    <Play size={20} className="text-white drop-shadow-md" />
                                 </div>
                              </div>
                              <div className="flex-1 min-w-0 flex flex-col">
                                 <h5 className="text-white text-xs font-bold line-clamp-2 leading-tight mb-1">{missions.content.title}</h5>
                                 <p className="text-slate-500 text-[10px] line-clamp-2 mb-auto">{missions.content.description}</p>
                                 <div className="flex gap-2 mt-2">
                                    <button onClick={() => handleMissionCopy(missions.content)} className="flex-1 bg-pink-600 hover:bg-pink-500 text-white py-1.5 rounded-lg text-[10px] font-bold">Copy</button>
                                    <button onClick={() => handleMissionDownload(missions.content)} className="px-2 bg-slate-800 hover:bg-slate-700 text-slate-300 py-1.5 rounded-lg"><Download size={12} /></button>
                                 </div>
                              </div>
                           </div>
                        ) : (
                           <div className="h-20 flex items-center justify-center text-slate-600 text-xs">No content available</div>
                        )}
                     </div>

                  </div>

               </div>
            </div>
         </motion.div>

         {/* Video Modal */}
         <AnimatePresence>
            <AnimatePresence>
               {selectedMission && (
                  <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md px-4" onClick={() => setSelectedMission(null)}>
                     <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        onClick={(e) => e.stopPropagation()}
                        className="relative w-full max-w-sm md:max-w-4xl bg-black rounded-2xl overflow-hidden shadow-2xl border border-slate-800 flex flex-col max-h-[90vh]"
                     >
                        <div className="flex items-center justify-between p-4 bg-slate-900 border-b border-slate-800">
                           <h3 className="text-white font-bold truncate pr-4">{selectedMission.title}</h3>
                           <button onClick={() => setSelectedMission(null)} className="text-slate-400 hover:text-white bg-slate-800 p-2 rounded-full hover:bg-slate-700 transition">
                              <X size={20} />
                           </button>
                        </div>
                        <div className="flex-1 bg-black flex items-center justify-center overflow-hidden">
                           <video
                              src={selectedMission.video_url}
                              controls
                              autoPlay
                              className="w-full h-full object-contain max-h-[70vh]"
                           />
                        </div>
                        <div className="p-4 bg-slate-900 border-t border-slate-800 flex justify-end gap-3">
                           <button
                              onClick={() => handleMissionCopy(selectedMission)}
                              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-sm font-bold transition"
                           >
                              <Copy size={16} /> Copy Caption
                           </button>
                           <button
                              onClick={() => handleMissionDownload(selectedMission)}
                              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded-xl text-sm font-bold transition border border-slate-700"
                           >
                              <Download size={16} /> Download
                           </button>
                        </div>
                     </motion.div>
                  </div>
               )}
            </AnimatePresence>
         </AnimatePresence>

         {/* Tier Card */}
         {loadingTier ? (
            <div className="bg-slate-900/50 rounded-3xl p-8 h-48 animate-pulse border border-slate-800"></div>
         ) : (
            <motion.div
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ duration: 0.4 }}
               className={`bg-gradient-to-br ${getTierGradient(activeTier.tier_key)} border p-1 rounded-3xl shadow-xl relative overflow-hidden`}>
               <div className="bg-slate-950/20 backdrop-blur-sm rounded-[22px] p-6 h-full relative z-10">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
                     {/* Tier Identity */}
                     <div className="flex items-center gap-5">
                        <div className={`w-20 h-20 rounded-2xl flex items-center justify-center shadow-inner ${activeTier.tier_key === 'vip' ? 'bg-gradient-to-br from-yellow-400 to-amber-600 text-white' : activeTier.tier_key === 'pro' ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white' : 'bg-slate-700 text-slate-300'}`}>
                           {getTierIcon(activeTier.tier_key)}
                        </div>
                        <div>
                           <p className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-1">Current Membership</p>
                           <h3 className="text-2xl md:text-3xl font-bold text-white tracking-tight">{activeTier.name}</h3>
                           {activeTier.tier_key === 'vip' && <span className="inline-block mt-1 px-2 py-0.5 bg-yellow-500/20 border border-yellow-500/30 rounded text-[10px] text-yellow-300 font-bold uppercase">Sultan Access</span>}
                        </div>
                     </div>

                     {/* Benefits Grid */}
                     <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                           <p className="text-white/50 text-[10px] uppercase">Komisi Penjualan</p>
                           <p className="text-white font-bold text-xl">{(activeTier.commission_rate * 100).toFixed(0)}%</p>
                        </div>
                        <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                           <p className="text-white/50 text-[10px] uppercase">Auto Upgrade</p>
                           <p className="text-white font-bold text-xl">{totalSales} Sales</p>
                        </div>
                        <div className="bg-white/5 border border-white/10 rounded-xl p-3 col-span-2 flex items-center justify-between">
                           <div>
                              <p className="text-white/50 text-[10px] uppercase">Minimum Withdrawal</p>
                              <p className="text-white font-bold">Rp {activeTier.min_withdraw.toLocaleString()}</p>
                           </div>
                           {activeTier.priority_withdrawal && <div className="text-[10px] bg-green-500/20 text-green-400 px-2 py-1 rounded">Priority</div>}
                        </div>
                     </div>

                     {/* Next Tier Progress */}
                     <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                        {nextTier && nextTier.upgrade_sales_threshold ? (
                           <div className="space-y-3">
                              <div className="flex justify-between items-end">
                                 <div>
                                    <p className="text-white/60 text-xs mb-1">Next Tier: <span className="text-white font-semibold">{nextTier.name}</span></p>
                                    <p className="text-xs text-white/40">Need {nextTier.upgrade_sales_threshold - totalSales} more sales</p>
                                 </div>
                                 <div className="text-right">
                                    <p className="text-white font-bold">{Math.round(upgradeProgress)}%</p>
                                 </div>
                              </div>
                              <div className="w-full bg-slate-900/50 h-2 rounded-full overflow-hidden">
                                 <div className="bg-white h-full rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(255,255,255,0.5)]" style={{ width: `${upgradeProgress}%` }}></div>
                              </div>
                           </div>
                        ) : (
                           <div className="flex items-center justify-center h-full text-center">
                              <div>
                                 <Crown className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
                                 <p className="text-white font-bold">Max Tier Reached!</p>
                                 <p className="text-white/50 text-xs">You are at the top of the food chain.</p>
                              </div>
                           </div>
                        )}
                     </div>
                  </div>
               </div>
            </motion.div>
         )}

         {/* Stats Grid */}
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Link to="/dashboard/academy" className="block group">
               <motion.div variants={item} className="bg-slate-900 p-6 rounded-2xl border border-slate-800 hover:border-blue-500/50 transition relative overflow-hidden h-full flex flex-col justify-between">
                  <div className="relative z-10">
                     <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-blue-500/10 rounded-xl text-blue-400 group-hover:scale-110 transition-transform"><GraduationCap size={22} /></div>
                        <div className="text-right">
                           <p className="text-slate-500 text-xs uppercase font-bold">Academy Rank</p>
                           <p className="text-white font-bold">{stats.academy.currentBadge}</p>
                        </div>
                     </div>
                     <div className="mt-2">
                        <div className="flex justify-between text-xs text-slate-400 mb-1">
                           <span>Progress</span>
                           <span>{stats.academy.percentage}%</span>
                        </div>
                        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                           <div className="bg-blue-500 h-full rounded-full" style={{ width: `${stats.academy.percentage}%` }}></div>
                        </div>
                     </div>
                  </div>
               </motion.div>
            </Link>

            <motion.div variants={item} className="bg-slate-900 p-6 rounded-2xl border border-slate-800 relative overflow-hidden h-full flex flex-col justify-between">
               <div className="flex justify-between items-start mb-2">
                  <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400"><MousePointer size={22} /></div>
                  <div className="px-2 py-1 bg-slate-800 rounded text-[10px] text-slate-400">Total Visits</div>
               </div>
               <div>
                  <p className="text-3xl font-bold text-white">{stats.visits}</p>
                  <p className="text-slate-500 text-xs mt-1">Unique link clicks</p>
               </div>
            </motion.div>

            <Link to="/dashboard/leads" className="block group">
               <motion.div variants={item} className="bg-slate-900 p-6 rounded-2xl border border-slate-800 hover:border-purple-500/50 transition relative overflow-hidden h-full flex flex-col justify-between">
                  <div className="flex justify-between items-start mb-2">
                     <div className="p-3 bg-purple-500/10 rounded-xl text-purple-400 group-hover:scale-110 transition-transform"><Users size={22} /></div>
                     <div className="px-2 py-1 bg-slate-800 rounded text-[10px] text-slate-400">Pending Leads</div>
                  </div>
                  <div>
                     <p className="text-3xl font-bold text-white">{stats.leads}</p>
                     <p className="text-slate-500 text-xs mt-1">Potential customers</p>
                  </div>
               </motion.div>
            </Link>

            <Link to="/dashboard/sales" className="block group">
               <motion.div variants={item} className="bg-slate-900 p-6 rounded-2xl border border-slate-800 hover:border-green-500/50 transition relative overflow-hidden h-full flex flex-col justify-between">
                  <div className="flex justify-between items-start mb-2">
                     <div className="p-3 bg-green-500/10 rounded-xl text-green-400 group-hover:scale-110 transition-transform"><TrendingUp size={22} /></div>
                     <div className="px-2 py-1 bg-slate-800 rounded text-[10px] text-slate-400">Total Sales</div>
                  </div>
                  <div>
                     <p className="text-3xl font-bold text-white">{stats.sales}</p>
                     <p className="text-slate-500 text-xs mt-1">Successful products sold</p>
                  </div>
                  <div className="absolute right-0 bottom-0 opacity-10 transform translate-y-4 translate-x-4">
                     <TrendingUp size={80} />
                  </div>
               </motion.div>
            </Link>
         </div>

         {/* Chart Section */}
         <motion.div variants={item} className="bg-slate-900 rounded-3xl border border-slate-800 p-6 md:p-8">
            <div className="flex items-center justify-between mb-6">
               <div>
                  <h3 className="text-lg font-bold text-white">Performance Overview</h3>
                  <p className="text-slate-400 text-sm">Traffic, Leads, and Sales last 6 months</p>
               </div>
               <div className="hidden md:flex gap-4">
                  <div className="flex items-center gap-2 text-xs text-slate-400"><div className="w-3 h-3 bg-blue-500 rounded-full"></div> Leads</div>
                  <div className="flex items-center gap-2 text-xs text-slate-400"><div className="w-3 h-3 bg-green-500 rounded-full"></div> Sales</div>
               </div>
            </div>
            <div className="h-[300px] w-full">
               <StatsChart data={chartData} mode="agent" />
            </div>
         </motion.div>
      </motion.div>
   )
}
