import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Copy, CheckCircle, Users, TrendingUp, MousePointer } from 'lucide-react'

export default function AgentOverview({ profile }: { profile: any }) {
  const [stats, setStats] = useState({ visits: 0, leads: 0, sales: 0, commission: 0 })
  const [copied, setCopied] = useState(false)

  const affiliateLink = `${window.location.origin}/?ref=${profile.affiliate_code || 'generating...'}`

  useEffect(() => {
     // Fetch stats
     const fetchStats = async () => {
         if (!profile.affiliate_code) return

         // Visits
         const { count: visits } = await supabase.from('visits').select('*', { count: 'exact', head: true }).eq('affiliate_code', profile.affiliate_code)
         
         // Leads
         const { count: leads } = await supabase.from('leads').select('*', { count: 'exact', head: true }).eq('referred_by_code', profile.affiliate_code)

         // Sales (Commissions count)
         const { count: sales } = await supabase.from('commissions').select('*', { count: 'exact', head: true }).eq('agent_id', profile.id)
         
         setStats(prev => ({
             ...prev,
             visits: visits || 0,
             leads: leads || 0,
             sales: sales || 0,
         }))
     }
     if (profile.id) fetchStats()
  }, [profile])

  const copyLink = () => {
    navigator.clipboard.writeText(affiliateLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-8">
       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <div className="bg-gradient-to-br from-blue-600 to-purple-700 p-8 rounded-3xl shadow-2xl text-white relative overflow-hidden">
              <div className="relative z-10">
                  <h2 className="text-xl font-medium mb-2 opacity-90">Saldo Dompet</h2>
                  <div className="text-5xl font-bold tracking-tight">Rp {profile.balance?.toLocaleString()}</div>
                  <p className="mt-4 text-sm opacity-75">Siap ditarik kapan saja.</p>
              </div>
              <div className="absolute right-0 bottom-0 w-32 h-32 bg-white/10 rounded-full blur-2xl transform translate-x-10 translate-y-10 pointer-events-none"></div>
           </div>

           <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800 flex flex-col justify-center">
              <label className="block text-slate-400 mb-3 text-sm font-medium uppercase tracking-wide">Link Affiliate Anda</label>
              <div className="flex gap-3">
                 <div className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-300 font-mono text-sm truncate flex items-center">
                    {affiliateLink}
                 </div>
                 <button onClick={copyLink} className="bg-slate-800 hover:bg-slate-700 text-white px-5 py-3 rounded-xl flex items-center gap-2 transition duration-200 border border-slate-700">
                   {copied ? <CheckCircle size={20} className="text-green-400" /> : <Copy size={20} />}
                 </button>
              </div>
              <p className="text-xs text-slate-500 mt-3">Bagikan link ini untuk mendapatkan komisi.</p>
           </div>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800/50 hover:border-blue-500/30 transition">
             <div className="flex items-center gap-4 mb-2">
                <div className="p-3 bg-blue-500/10 rounded-lg text-blue-400"><MousePointer size={24} /></div>
                <h3 className="text-slate-400 font-medium">Total Clicks</h3>
             </div>
             <p className="text-3xl font-bold text-white pl-1">{stats.visits}</p>
          </div>
          <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800/50 hover:border-purple-500/30 transition">
             <div className="flex items-center gap-4 mb-2">
                <div className="p-3 bg-purple-500/10 rounded-lg text-purple-400"><Users size={24} /></div>
                <h3 className="text-slate-400 font-medium">Total Leads</h3>
             </div>
             <p className="text-3xl font-bold text-white pl-1">{stats.leads}</p>
          </div>
          <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800/50 hover:border-green-500/30 transition">
             <div className="flex items-center gap-4 mb-2">
                <div className="p-3 bg-green-500/10 rounded-lg text-green-400"><TrendingUp size={24} /></div>
                <h3 className="text-slate-400 font-medium">Total Sales</h3>
             </div>
             <p className="text-3xl font-bold text-white pl-1">{stats.sales}</p>
          </div>
       </div>
    </div>
  )
}
