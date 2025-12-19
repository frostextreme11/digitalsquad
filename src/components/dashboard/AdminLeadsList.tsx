import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Mail, Calendar, Phone, UserX } from 'lucide-react'
import { format } from 'date-fns'

export default function AdminLeadsList() {
    const [leads, setLeads] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchLeads = async () => {
            // Fetch profiles that have NO referrer (organic leads)
            // AND specifically those who have NOT paid? 
            // Or just all organic users?
            // "leads the user who are registered without reference affiliate id"
            // Usually "lead" means unpaid. Let's assume unpaid organic users.
            
            // 1. Get all profiles with referred_by IS NULL
            const { data: profiles } = await supabase
                .from('profiles')
                .select(`
                    id, 
                    full_name, 
                    email, 
                    phone, 
                    created_at,
                    transactions!transactions_user_id_fkey (status, type)
                `)
                .is('referred_by', null)
                .order('created_at', { ascending: false })
            
            if (profiles) {
                // Filter those who have NOT paid successfully
                const unpaidOrganicLeads = profiles.filter((p: any) => {
                    const hasSuccessRegistration = p.transactions?.some(
                        (t: any) => t.type === 'registration' && (t.status === 'success' || t.status === 'settlement')
                    )
                    return !hasSuccessRegistration
                })
                setLeads(unpaidOrganicLeads)
            }
            
            setLoading(false)
        }
        
        fetchLeads()
    }, [])

    if (loading) return <div className="text-white">Loading leads...</div>

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white mb-4">Organic Leads (Tanpa Affiliate)</h2>
            <p className="text-slate-400">Daftar user yang mendaftar langsung (tanpa link affiliate) dan belum melakukan pembayaran.</p>
            
            {leads.length === 0 ? (
                <div className="text-slate-500 bg-slate-900/50 p-8 rounded-2xl text-center border border-slate-800">
                    Belum ada organic leads yang pending.
                </div>
            ) : (
                <div className="grid gap-4">
                    {leads.map((lead) => (
                        <div key={lead.id} className="bg-slate-900 border border-slate-800 p-6 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-slate-700 transition">
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-slate-800 rounded-lg text-slate-400">
                                    <UserX size={24} />
                                </div>
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
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                    Organic Lead
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
