import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Search, ChevronLeft, ChevronRight, Filter, SortAsc, CheckCircle, Clock, XCircle, Ban } from 'lucide-react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import ConfirmationModal from '../ConfirmationModal'

export default function UserManagement() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [sortBy, setSortBy] = useState('omset_current_month')
  const [limit, setLimit] = useState(10)
  const [page, setPage] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  const [tiers, setTiers] = useState<any[]>([])

  useEffect(() => {
    const fetchTiers = async () => {
      const { data } = await supabase.from('tiers').select('*')
      if (data) setTiers(data)
    }
    fetchTiers()
  }, [])

  // Modal State
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; userId: string | null; name: string }>({
    isOpen: false,
    userId: null,
    name: ''
  })
  const [isApproving, setIsApproving] = useState(false)

  const fetchUsers = async () => {
    setLoading(true)
    try {
      let usersData: any[] = []
      let count = 0

      if (sortBy === 'created_at desc') {
        const from = page * limit
        const to = from + limit - 1

        // 1. Fetch profiles sorted by created_at desc
        let query = supabase
          .from('profiles')
          .select('*, tier:tiers(*)', { count: 'exact' })
          .order('created_at', { ascending: false })
          .range(from, to)

        if (search) {
          query = query.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`)
        }

        const { data: profiles, error: profilesError, count: total } = await query
        if (profilesError) throw profilesError

        count = total || 0

        // 2. Hydrate stats for these profiles manually
        if (profiles && profiles.length > 0) {
          usersData = await Promise.all(profiles.map(async (profile: any) => {
            // Fetch basic stats in parallel
            const [clicksRes, leadsRes, txRes] = await Promise.all([
              supabase.from('visits').select('id', { count: 'exact', head: true }).eq('affiliate_code', profile.affiliate_code || ''),
              supabase.from('leads').select('id', { count: 'exact', head: true }).eq('referred_by_code', profile.affiliate_code || ''),
              supabase.from('transactions').select('amount, status, type').eq('user_id', profile.id)
            ])

            const transactions = txRes.data || []
            const successPurchases = transactions.filter((t: any) => t.status === 'success' && t.type === 'product_purchase')
            const registration = transactions.find((t: any) => t.type === 'registration')

            return {
              ...profile,
              clicks: clicksRes.count || 0,
              leads: leadsRes.count || 0,
              sales: successPurchases.length,
              omset_lifetime: successPurchases.reduce((sum: number, t: any) => sum + (t.amount || 0), 0),
              omset_current_month: 0, // Simplified for now
              payment_status: registration?.status || 'pending', // Infer status
            }
          }))
        }
      } else {
        // Use RPC for standard sorts
        const { data, error } = await (supabase.rpc as any)('get_user_performance_stats', {
          search_query: search,
          page_limit: limit,
          page_offset: page * limit,
          status_filter: statusFilter || null,
          sort_by: sortBy
        })

        if (error) throw error
        usersData = data || []

        // Sync Tier ID & Date just in case
        if (usersData.length > 0) {
          const userIds = usersData.map((u: any) => u.id)
          const { data: profilesData } = await supabase.from('profiles').select('id, tier_id, created_at').in('id', userIds)
          if (profilesData) {
            usersData = usersData.map((user: any) => {
              const profile = profilesData.find((p: any) => p.id === user.id)
              return {
                ...user,
                tier_id: profile?.tier_id || user.tier_id,
                created_at: profile?.created_at || user.created_at
              }
            })
          }
        }

        // Fetch count
        const { data: countData } = await (supabase.rpc as any)('get_user_performance_count', {
          search_query: search,
          status_filter: statusFilter || null
        })
        count = countData || 0
      }

      setUsers(usersData)
      setTotalCount(count)

    } catch (err) {
      console.error("Error fetching users:", err)
      toast.error("Failed to fetch users")
    } finally {
      setLoading(false)
    }
  }

  const handleTierUpdate = async (userId: string, newTierId: string | null) => {
    // Optimistic Update
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, tier_id: newTierId } : u))

    const { error } = await supabase.from('profiles').update({ tier_id: newTierId }).eq('id', userId)

    if (error) {
      toast.error('Failed to update tier')
      console.error(error)
      // Revert (conceptually, or just fetch again)
      fetchUsers()
    } else {
      toast.success('User tier updated')
      // No need to fetch immediately if optimistic update was accurate, but checking consistency is good
      // fetchUsers() 
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [page, limit, statusFilter, sortBy])

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(0) // Reset to first page on search
      fetchUsers()
    }, 500)
    return () => clearTimeout(timer)
  }, [search])

  const openApproveModal = (user: any) => {
    setConfirmModal({
      isOpen: true,
      userId: user.id,
      name: user.full_name || 'User'
    })
  }

  const handleConfirmApprove = async () => {
    if (!confirmModal.userId) return

    setIsApproving(true)
    try {
      const { error } = await (supabase.rpc as any)('admin_approve_user', {
        target_user_id: confirmModal.userId
      })

      if (error) throw error

      toast.success(`Successfully approved ${confirmModal.name}`)
      setConfirmModal(prev => ({ ...prev, isOpen: false }))
      fetchUsers() // Refresh list
    } catch (err: any) {
      console.error("Error approving user:", err)
      toast.error(err.message || "Failed to approve user")
    } finally {
      setIsApproving(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <span className="flex items-center gap-1 text-green-400 bg-green-500/10 px-2.5 py-1 rounded-lg text-xs font-medium"><CheckCircle size={14} /> Active</span>
      case 'pending':
        return <span className="flex items-center gap-1 text-yellow-400 bg-yellow-500/10 px-2.5 py-1 rounded-lg text-xs font-medium"><Clock size={14} /> Pending</span>
      case 'failed':
        return <span className="flex items-center gap-1 text-red-400 bg-red-500/10 px-2.5 py-1 rounded-lg text-xs font-medium"><XCircle size={14} /> Failed</span>
      case 'cancelled':
        return <span className="flex items-center gap-1 text-slate-400 bg-slate-500/10 px-2.5 py-1 rounded-lg text-xs font-medium"><Ban size={14} /> Cancelled</span>
      default:
        return <span className="text-slate-500 text-xs">Unknown</span>
    }
  }

  const getTierBadge = (tierId: string) => {
    const tier = tiers.find(t => t.id === tierId)
    const tierKey = tier?.tier_key || 'free'

    switch (tierKey) {
      case 'pro':
      case 'vip':
        return <span className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-2.5 py-1 rounded-lg text-xs font-bold shadow-lg shadow-blue-500/30 uppercase">{tierKey}</span>
      case 'basic':
        return <span className="bg-slate-700 text-slate-300 px-2.5 py-1 rounded-lg text-xs font-medium uppercase">{tierKey}</span>
      default:
        return <span className="bg-slate-800 text-slate-500 px-2.5 py-1 rounded-lg text-xs font-medium uppercase">FREE</span>
    }
  }

  const totalPages = Math.ceil(totalCount / limit)

  return (
    <div className="space-y-6">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
        <h2 className="text-2xl font-bold text-white">User Management</h2>

        <div className="flex flex-col md:flex-row items-center gap-4 w-full xl:w-auto">
          {/* Search */}
          <div className="relative flex-1 w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input
              type="text"
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-slate-200 focus:outline-none focus:border-blue-500 transition"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
            {/* Status Filter */}
            <div className="relative min-w-[140px]">
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value)
                  setPage(0)
                }}
                className="w-full appearance-none bg-slate-900 border border-slate-800 rounded-xl pl-4 pr-10 py-2.5 text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer text-sm"
              >
                <option value="">All Status</option>
                <option value="success">Active (Success)</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <Filter className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={14} />
            </div>

            {/* Sort Order */}
            <div className="relative min-w-[160px]">
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value)
                  setPage(0)
                }}
                className="w-full appearance-none bg-slate-900 border border-slate-800 rounded-xl pl-4 pr-10 py-2.5 text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer text-sm"
              >
                <option value="omset_current_month">Monthly Omset</option>
                <option value="omset_lifetime">Lifetime Omset</option>
                <option value="created_at desc">Latest Register</option>
                <option value="clicks">Clicks</option>
                <option value="leads">Leads</option>
                <option value="sales">Sales</option>
              </select>
              <SortAsc className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={14} />
            </div>

            {/* Limit Filter */}
            <div className="relative min-w-[100px]">
              <select
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value))
                  setPage(0)
                }}
                className="w-full appearance-none bg-slate-900 border border-slate-800 rounded-xl pl-4 pr-10 py-2.5 text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer text-sm"
              >
                <option value="10">10 / page</option>
                <option value="50">50 / page</option>
                <option value="100">100 / page</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-slate-300">
            <thead className="bg-slate-950 text-slate-400 text-xs uppercase font-semibold">
              <tr>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4 text-center">Tier</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-center">Clicks</th>
                <th className="px-6 py-4 text-center">Leads</th>
                <th className="px-6 py-4 text-center">Sales</th>
                <th className="px-6 py-4 text-right">Lifetime</th>
                <th className="px-6 py-4 text-right text-blue-400">Monthly</th>
                <th className="px-6 py-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-slate-500">
                    <div className="flex justify-center items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div> Loading users...
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-slate-500">
                    No users found matching your filters.
                  </td>
                </tr>
              ) : (
                users.map((user, index) => (
                  <motion.tr
                    key={user.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-slate-800/50 transition duration-150"
                  >
                    <td className="px-6 py-4">
                      <div className="font-medium text-white">{user.full_name || 'No Name'}</div>
                      <div className="text-sm text-slate-500">{user.email}</div>
                      <div className="text-xs text-slate-600 mt-1">
                        {user.created_at ? new Date(user.created_at).toLocaleString('id-ID', {
                          timeZone: 'Asia/Jakarta',
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        }) : '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex justify-center">{getTierBadge(user.tier_id)}</div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex justify-center">{getStatusBadge(user.payment_status)}</div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="bg-slate-800 text-slate-300 px-2.5 py-1 rounded-lg text-sm">{user.clicks}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="bg-purple-500/10 text-purple-400 px-2.5 py-1 rounded-lg text-sm">{user.leads}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="bg-green-500/10 text-green-400 px-2.5 py-1 rounded-lg text-sm">{user.sales}</span>
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-sm">
                      Rp {user.omset_lifetime?.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-blue-400 text-sm">
                      Rp {user.omset_current_month?.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex flex-col gap-2 items-center">
                        <select
                          value={user.tier_id || ''}
                          onChange={(e) => {
                            const newTierId = e.target.value || null
                            handleTierUpdate(user.id, newTierId)
                          }}
                          className="bg-slate-800 text-xs text-slate-300 border border-slate-700 rounded px-2 py-1 focus:outline-none focus:border-blue-500 max-w-[100px]"
                        >
                          <option value="">FREE</option>
                          {tiers.map(t => (
                            <option key={t.id} value={t.id}>{t.tier_key?.toUpperCase()}</option>
                          ))}
                        </select>

                        {user.payment_status === 'pending' && (
                          <button
                            onClick={() => openApproveModal(user)}
                            className="bg-green-500 hover:bg-green-600 text-white text-xs px-3 py-1.5 rounded-lg transition shadow-lg shadow-green-500/20 w-full"
                          >
                            Approve
                          </button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-slate-800 flex items-center justify-between bg-slate-950/50">
          <span className="text-sm text-slate-500">
            Showing {users.length} of {totalCount} users
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
              Page {page + 1} of {Math.max(1, totalPages)}
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
      </div>

      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        title="Approve User Payment"
        message={`Are you sure you want to manually approve payment for ${confirmModal.name}? This will set their transaction status to 'success'.`}
        confirmText="Yes, Approve"
        cancelText="Cancel"
        type="success"
        isProcessing={isApproving}
        onConfirm={handleConfirmApprove}
        onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  )
}
