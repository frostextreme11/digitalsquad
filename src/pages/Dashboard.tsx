import { useEffect, useState } from 'react'
import { Routes, Route, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import DashboardLayout from '../components/dashboard/DashboardLayout'
import AgentOverview from '../components/dashboard/AgentOverview'
import AdminOverview from '../components/dashboard/AdminOverview'
import ProductList from '../components/dashboard/ProductList'
import LeadsList from '../components/dashboard/LeadsList'
import AdminLeadsList from '../components/dashboard/AdminLeadsList'
import UserManagement from '../components/dashboard/UserManagement'
import ProductManagement from '../components/dashboard/ProductManagement'
import Wallet from '../components/dashboard/Wallet'
import AdminWithdrawals from '../components/dashboard/AdminWithdrawals'
import AdminAcademy from '../components/dashboard/AdminAcademy'
import AcademyList from '../components/dashboard/AcademyList'
import AdminTestimonials from '../components/dashboard/AdminTestimonials'
import AgentTestimonials from '../components/dashboard/AgentTestimonials'
import FreeZone from '../components/dashboard/FreeZone'
import SalesPage from '../components/dashboard/SalesPage'
import AdminTierSettings from '../components/dashboard/AdminTierSettings'

export default function Dashboard() {
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<any>(null)
  const navigate = useNavigate()

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        navigate('/login')
        return
      }

      // Check transaction status for payment
      const { data: transaction } = await supabase
        .from('transactions')
        .select('status')
        .eq('user_id', user.id)
        .eq('type', 'registration')
        .eq('status', 'success')
        .limit(1)
        .maybeSingle()

      if (!transaction) {
        navigate('/payment')
        return
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error || !data) {
        console.error(error)
      }

      setProfile(data)
      setLoading(false)
    }
    checkUser()
  }, [navigate])

  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Loading...</div>
  if (!profile) return null

  return (
    <DashboardLayout role={profile.role}>
      <Routes>
        <Route path="/" element={profile.role === 'admin' ? <AdminOverview /> : <AgentOverview profile={profile} />} />
        <Route path="/sales" element={<SalesPage role={profile.role} />} />
        <Route path="/tiers" element={<AdminTierSettings />} />
        <Route path="/users" element={<UserManagement />} />
        <Route path="/leads" element={profile.role === 'admin' ? <AdminLeadsList /> : <LeadsList />} />
        <Route path="/products" element={profile.role === 'admin' ? <ProductManagement /> : <ProductList />} />
        <Route path="/wallet" element={profile.role === 'admin' ? <AdminWithdrawals /> : <Wallet />} />
        <Route path="/academy" element={profile.role === 'admin' ? <AdminAcademy /> : <AcademyList />} />
        <Route path="/testimonials" element={profile.role === 'admin' ? <AdminTestimonials /> : <AgentTestimonials />} />
        <Route path="/free-zone" element={<FreeZone />} />
      </Routes>
    </DashboardLayout>
  )
}
