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

            // 1. Get current user's affiliate code
            const { data: profile } = await supabase
                .from('profiles')
                .select('affiliate_code')
                .eq('id', user.id)
                .single()
            
            if (!profile?.affiliate_code) {
                setLoading(false)
                return
            }

            // 2. Fetch profiles referred by this user
            // We want users who are referred by me (via profile.referred_by OR leads.referred_by_code)
            // But specifically "potential new user who are register but doesn't do the payment"
            // This means: Profile exists, referred_by = me, NO successful transaction.
            
            // Step 2a: Get all profiles referred by me
            const { data: referredProfiles } = await supabase
                .from('profiles')
                .select(`
                    id, 
                    full_name, 
                    email, 
                    phone, 
                    created_at,
                    transactions!transactions_user_id_fkey (status, type)
                `)
                .eq('referred_by', user.id)
                .order('created_at', { ascending: false })
            
            if (referredProfiles) {
                // Filter those who have NOT paid successfully for registration
                const unpaidLeads = referredProfiles.filter((p: any) => {
                    const hasSuccessRegistration = p.transactions?.some(
                        (t: any) => t.type === 'registration' && (t.status === 'success' || t.status === 'settlement')
                    )
                    return !hasSuccessRegistration
                })
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
