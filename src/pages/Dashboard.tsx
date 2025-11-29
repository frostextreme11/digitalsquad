import { useEffect, useState } from 'react'
import { Routes, Route, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import DashboardLayout from '../components/dashboard/DashboardLayout'
import AgentOverview from '../components/dashboard/AgentOverview'
import AdminOverview from '../components/dashboard/AdminOverview'
import ProductList from '../components/dashboard/ProductList'

// Placeholder for sub-pages
const Placeholder = ({ title }: { title: string }) => <div className="text-white text-xl">{title}</div>

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
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      
      if (error || !data) {
          // Handle case where profile doesn't exist yet (e.g. created via Auth but trigger failed)
          // Or just show loading
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
        <Route path="/users" element={<Placeholder title="User Management (Admin)" />} />
        <Route path="/leads" element={<Placeholder title="Leads Management (Admin)" />} />
        <Route path="/products" element={<ProductList />} />
        <Route path="/wallet" element={<Placeholder title="Wallet & Withdrawals" />} />
      </Routes>
    </DashboardLayout>
  )
}
