import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { LogOut, LayoutDashboard, Users, Wallet, ShoppingBag } from 'lucide-react'

export default function DashboardLayout({ children, role }: { children: React.ReactNode, role: 'agent' | 'admin' }) {
  const navigate = useNavigate()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-slate-950 flex text-slate-100">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col fixed h-full">
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">Digital Squad</h1>
          <span className="text-xs uppercase tracking-wider text-slate-500 font-semibold mt-1 block">{role} Panel</span>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 mt-4">
          <Link to="/dashboard" className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition duration-200">
            <LayoutDashboard size={20} />
            Overview
          </Link>
          
          {role === 'admin' ? (
             <>
               <Link to="/dashboard/users" className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition duration-200">
                 <Users size={20} />
                 Members
               </Link>
               <Link to="/dashboard/leads" className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition duration-200">
                 <Users size={20} />
                 Leads
               </Link>
             </>
          ) : (
             <Link to="/dashboard/products" className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition duration-200">
               <ShoppingBag size={20} />
               Products
             </Link>
          )}

           <Link to="/dashboard/wallet" className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition duration-200">
            <Wallet size={20} />
            {role === 'admin' ? 'Withdrawals' : 'My Wallet'}
          </Link>
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-xl w-full transition duration-200">
            <LogOut size={20} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 overflow-y-auto p-8">
          {children}
      </main>
    </div>
  )
}
