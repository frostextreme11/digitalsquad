import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Mail, Calendar, Phone } from 'lucide-react'
import { format } from 'date-fns'

export default function LeadsList() {
    const [leads, setLeads] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchLeads = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            // Use RPC to fetch leads with payment status (bypassing RLS on transactions)
            const { data: leadsData, error } = await supabase
                .rpc('get_agent_leads', { agent_id: user.id })
            
            if (error) {
                console.error("Error fetching leads:", error)
                setLoading(false)
                return
            }
            
            if (leadsData) {
                // Filter for pending/unpaid only
                const unpaidLeads = leadsData.filter((l: any) => l.payment_status === 'pending')
                setLeads(unpaidLeads)
            }
            
            setLoading(false)
        }
        
        fetchLeads()
    }, [])

    if (loading) return <div className="text-white">Loading leads...</div>

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white mb-4">Potential Leads (Belum Bayar)</h2>
            
            {leads.length === 0 ? (
                <div className="text-slate-500 bg-slate-900/50 p-8 rounded-2xl text-center border border-slate-800">
                    Belum ada leads yang pending pembayaran.
                </div>
            ) : (
                <div className="grid gap-4">
                    {leads.map((lead) => (
                        <div key={lead.id} className="bg-slate-900 border border-slate-800 p-6 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-slate-700 transition">
                            <div>
                                <h3 className="text-lg font-bold text-white">{lead.full_name || 'Tanpa Nama'}</h3>
                                <div className="flex flex-col gap-1 mt-2">
                                    <div className="flex items-center gap-2 text-slate-400 text-sm">
                                        <Mail size={16} /> {lead.email}
                                    </div>
                                    <div className="flex items-center gap-2 text-slate-400 text-sm">
                                        <Phone size={16} /> {lead.phone || '-'}
                                    </div>
                                    <div className="flex items-center gap-2 text-slate-500 text-xs mt-1">
                                        <Calendar size={14} /> Registered: {format(new Date(lead.created_at), 'dd MMM yyyy, HH:mm')}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-500/10 text-yellow-500 border border-yellow-500/20">
                                    Pending Payment
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
