import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { LogOut, LayoutDashboard, Users, Wallet, ShoppingBag, Menu, X, GraduationCap, Video, Gift, DollarSign, Crown, CreditCard } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function DashboardLayout({ children, role }: { children: React.ReactNode, role: 'agent' | 'admin' }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Overview', roles: ['agent', 'admin'] },
    { path: '/dashboard/users', icon: Users, label: 'Members', roles: ['admin'] },
    { path: '/dashboard/leads', icon: Users, label: 'Leads', roles: ['admin'] },
    { path: '/dashboard/tiers', icon: Crown, label: 'Tier Settings', roles: ['admin'] },
    { path: '/dashboard/payment-settings', icon: CreditCard, label: 'Payment Gateway', roles: ['admin'] },
    { path: '/dashboard/sales', icon: DollarSign, label: 'Sales & Profit', roles: ['agent', 'admin'] },
    { path: '/dashboard/products', icon: ShoppingBag, label: 'Products', roles: ['agent', 'admin'] },
    { path: '/dashboard/free-zone', icon: Gift, label: 'Free Zone', roles: ['agent'] },
    { path: '/dashboard/wallet', icon: Wallet, label: role === 'admin' ? 'Withdrawals' : 'My Wallet', roles: ['agent', 'admin'] },
    { path: '/dashboard/academy', icon: GraduationCap, label: 'Academy', roles: ['agent', 'admin'] },
    { path: '/dashboard/testimonials', icon: Video, label: 'Testimonials', roles: ['agent', 'admin'] },
  ]

  const NavLink = ({ item, onClick }: { item: any, onClick?: () => void }) => {
    const isActive = location.pathname === item.path
    return (
      <Link
        to={item.path}
        onClick={onClick}
        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition duration-200 ${isActive
          ? 'bg-blue-600/10 text-blue-400 font-medium'
          : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
      >
        <item.icon size={20} />
        {item.label}
      </Link>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 flex text-slate-100 font-sans selection:bg-blue-500/30">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">Digital Squad</h1>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 text-slate-400 hover:text-white">
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: -100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            className="lg:hidden fixed inset-0 z-40 bg-slate-950 pt-20 px-6"
          >
            <nav className="space-y-2">
              {navItems.filter(item => item.roles.includes(role)).map((item) => (
                <NavLink key={item.path} item={item} onClick={() => setMobileMenuOpen(false)} />
              ))}
              <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-xl w-full transition duration-200 mt-8">
                <LogOut size={20} />
                Logout
              </button>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 bg-slate-900 border-r border-slate-800 flex-col fixed h-full">
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">Digital Squad</h1>
          <span className="text-xs uppercase tracking-wider text-slate-500 font-semibold mt-1 block">{role} Panel</span>
        </div>

        <nav className="flex-1 p-4 space-y-2 mt-4">
          {navItems.filter(item => item.roles.includes(role)).map((item) => (
            <NavLink key={item.path} item={item} />
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-xl w-full transition duration-200">
            <LogOut size={20} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:ml-64 w-full p-4 lg:p-8 pt-20 lg:pt-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}

