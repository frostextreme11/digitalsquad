import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Search, ChevronLeft, ChevronRight, Filter } from 'lucide-react'
import { motion } from 'framer-motion'

export default function UserManagement() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [limit, setLimit] = useState(10)
  const [page, setPage] = useState(0)
  const [totalCount, setTotalCount] = useState(0)

  const fetchUsers = async () => {
    setLoading(true)
    try {
      // Fetch data
      const { data, error } = await supabase.rpc('get_user_performance_stats', {
        search_query: search,
        page_limit: limit,
        page_offset: page * limit
      })

      if (error) throw error
      setUsers(data || [])

      // Fetch count
      const { data: countData, error: countError } = await supabase.rpc('get_user_performance_count', {
        search_query: search
      })
      
      if (countError) throw countError
      setTotalCount(countData || 0)

    } catch (err) {
      console.error("Error fetching users:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [page, limit])

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(0) // Reset to first page on search
      fetchUsers()
    }, 500)
    return () => clearTimeout(timer)
  }, [search])

  const totalPages = Math.ceil(totalCount / limit)

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <h2 className="text-2xl font-bold text-white">User Management</h2>
        
        <div className="flex items-center gap-4 w-full md:w-auto">
          {/* Search */}
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input 
              type="text" 
              placeholder="Search users..." 
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

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-slate-300">
            <thead className="bg-slate-950 text-slate-400 text-xs uppercase font-semibold">
              <tr>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4 text-center">Clicks</th>
                <th className="px-6 py-4 text-center">Leads</th>
                <th className="px-6 py-4 text-center">Sales</th>
                <th className="px-6 py-4 text-right">Lifetime Omset</th>
                <th className="px-6 py-4 text-right text-blue-400">Monthly Omset</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                    Loading users...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                    No users found.
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
                    <td className="px-6 py-4 text-right font-medium">
                      Rp {user.omset_lifetime?.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-blue-400">
                      Rp {user.omset_current_month?.toLocaleString()}
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
      </div>
    </div>
  )
}
