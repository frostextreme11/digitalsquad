import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Mail, Calendar, Phone, Search, ChevronLeft, ChevronRight, Filter } from 'lucide-react'
import { format } from 'date-fns'
import { motion } from 'framer-motion'

export default function LeadsList() {
    const [leads, setLeads] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [limit, setLimit] = useState(10)
    const [page, setPage] = useState(0)
    const [totalCount, setTotalCount] = useState(0)

    const fetchLeads = async () => {
        setLoading(true)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        try {
            // Fetch filtered leads
            const { data: leadsData, error } = await supabase
                .rpc('get_agent_leads_paginated', { 
                    p_agent_id: user.id,
                    search_query: search,
                    page_limit: limit,
                    page_offset: page * limit
                })
            
            if (error) throw error
            setLeads(leadsData || [])

            // Fetch count
            const { data: countData } = await supabase
                .rpc('get_agent_leads_count', { 
                    p_agent_id: user.id,
                    search_query: search 
                })
            
            setTotalCount(countData || 0)

        } catch (error) {
            console.error("Error fetching leads:", error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchLeads()
    }, [page, limit])

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setPage(0)
            fetchLeads()
        }, 500)
        return () => clearTimeout(timer)
    }, [search])

    const totalPages = Math.ceil(totalCount / limit)

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <h2 className="text-2xl font-bold text-white">Potential Leads (Belum Bayar)</h2>
                
                <div className="flex items-center gap-4 w-full md:w-auto">
                    {/* Search */}
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                        <input 
                            type="text" 
                            placeholder="Search leads..." 
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-slate-200 focus:outline-none focus:border-blue-500 transition"
                        />
                    </div>

                    {/* Limit Filter */}
                    <div className="relative">
                        <select 
                            value={limit}
                            onChange={(e) => {
                                setLimit(Number(e.target.value))
                                setPage(0)
                            }}
                            className="appearance-none bg-slate-900 border border-slate-800 rounded-xl pl-4 pr-10 py-2.5 text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
                        >
                            <option value="10">10 / page</option>
                            <option value="50">50 / page</option>
                            <option value="100">100 / page</option>
                            <option value="1000">1000 / page</option>
                        </select>
                        <Filter className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={16} />
                    </div>
                </div>
            </div>
            
            {loading ? (
                <div className="text-slate-500 bg-slate-900/50 p-8 rounded-2xl text-center border border-slate-800">
                    Loading leads...
                </div>
            ) : leads.length === 0 ? (
                <div className="text-slate-500 bg-slate-900/50 p-8 rounded-2xl text-center border border-slate-800">
                    Belum ada leads yang pending pembayaran.
                </div>
            ) : (
                <>
                    <div className="grid gap-4">
                        {leads.map((lead, index) => (
                            <motion.div 
                                key={lead.id} 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="bg-slate-900 border border-slate-800 p-6 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-slate-700 transition"
                            >
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
                            </motion.div>
                        ))}
                    </div>

                    {/* Pagination */}
                    <div className="px-6 py-4 border-t border-slate-800/50 flex items-center justify-between bg-slate-900/30 rounded-xl">
                        <span className="text-sm text-slate-500">
                            Showing {leads.length} of {totalCount} leads
                        </span>
                        <div className="flex items-center gap-2">
                            <button 
                                onClick={() => setPage(p => Math.max(0, p - 1))}
                                disabled={page === 0}
                                className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <ChevronLeft size={20} />
                            </button>
                            <span className="text-sm text-slate-400 px-2">
                                Page {page + 1} of {totalPages || 1}
                            </span>
                            <button 
                                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                                disabled={page >= totalPages - 1}
                                className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <ChevronRight size={20} />
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}

