import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, Loader2 } from 'lucide-react'

export default function PaymentPage() {
  const [loading, setLoading] = useState(false)
  const [checkingStatus, setCheckingStatus] = useState(true)
  const navigate = useNavigate()
  const [userProfile, setUserProfile] = useState<any>(null)
  const [checkingPayment, setCheckingPayment] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  // Load Snap Script
  useEffect(() => {
    const snapUrl = 'https://app.sandbox.midtrans.com/snap/snap.js'
    const clientKey = import.meta.env.VITE_MIDTRANS_CLIENT_KEY || 'SB-Mid-client-placeholder'
    
    // Check if script already exists
    if (!document.querySelector(`script[src="${snapUrl}"]`)) {
        const script = document.createElement('script')
        script.src = snapUrl
        script.setAttribute('data-client-key', clientKey)
        script.async = true
        document.body.appendChild(script)
    }
  }, [])

  // Check Auth and Payment Status
  useEffect(() => {
    const init = async () => {
        await checkUser()
        // Auto check status after initial load if still on this page (meaning pending)
        setTimeout(() => {
            handleCheckStatus(true) // Silent check
        }, 1000)
    }
    init()
  }, [])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        navigate('/login')
        return
    }

    // Check if already paid or settled
    const { data: transaction } = await supabase
        .from('transactions')
        .select('status')
        .eq('user_id', user.id)
        .eq('type', 'registration')
        .eq('status', 'success')
        .limit(1)
        .maybeSingle()

    if (transaction) {
        navigate('/dashboard')
        return
    }

    // Fetch profile for payment details
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
    
    if (profile) {
        setUserProfile(profile)
    }
    setCheckingStatus(false)
  }

  // New function to force check status against Midtrans API
  const handleCheckStatus = async (silent = false) => {
      if (!silent) setCheckingPayment(true)
      try {
           const { data: { user } } = await supabase.auth.getUser()
           if (!user) return

           // Get the pending transaction ID
           const { data: transaction } = await supabase
            .from('transactions')
            .select('id')
            .eq('user_id', user.id)
            .eq('type', 'registration')
            .eq('status', 'pending')
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle()
            
           if (transaction) {
               const functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/check-payment-status`
               const response = await fetch(functionUrl, {
                   method: 'POST',
                   headers: {
                       'Content-Type': 'application/json',
                       'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
                   },
                   body: JSON.stringify({ order_id: transaction.id })
               })
               
               const data = await response.json()
               console.log("Check Status Result:", data)
               
               if (data.new_status === 'success') {
                   setShowSuccess(true)
                   setTimeout(() => {
                       window.location.reload()
                   }, 3000)
               } else {
                   if (!silent) alert("Status pembayaran masih: " + (data.midtrans_data?.transaction_status || 'Pending'))
               }
           } else {
               // No pending transaction found, maybe it's already success?
               // If we are here, checkUser didn't redirect, so maybe it just became success?
               // Let's re-run checkUser
               checkUser()
           }
      } catch (e: any) {
          console.error(e)
          if (!silent) alert("Gagal mengecek status: " + e.message)
      } finally {
          if (!silent) setCheckingPayment(false)
      }
  }

  const handlePayment = async () => {
    if (!userProfile) return
    setLoading(true)
    
    try {
      const functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-payment`
      
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          amount: 50000,
          userId: userProfile.id,
          type: 'registration',
          customerDetails: {
             first_name: userProfile.full_name,
             email: userProfile.email,
             phone: userProfile.phone
          }
        })
      })
      
      if (!response.ok) {
          throw new Error('Network response was not ok')
      }
      
      const data = await response.json()
      
      if (data.token) {
        // @ts-ignore
        window.snap.pay(data.token, {
           onSuccess: function(result: any){
               console.log('success', result)
               setShowSuccess(true)
               setTimeout(() => {
                   window.location.reload()
               }, 3000)
           },
           onPending: function(result: any){
               console.log('pending', result)
               // Auto check will catch it or user can click check
           },
           onError: function(result: any){
               console.log('error', result)
               alert("Payment failed!")
           },
           onClose: function(){
               console.log('closed')
               handleCheckStatus(true) // Check status when they close popup
           }
        })
      } else {
          alert('Gagal memuat pembayaran.')
      }
      
    } catch (error: any) {
      console.error(error)
      alert('Terjadi kesalahan: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  if (checkingStatus) {
      return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4 relative">
      {/* Success Modal */}
      <AnimatePresence>
        {showSuccess && (
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm"
            >
                <motion.div 
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-slate-900 border border-slate-700 p-8 rounded-2xl shadow-2xl flex flex-col items-center max-w-sm mx-4 text-center"
                >
                    <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mb-6">
                        <CheckCircle className="w-10 h-10 text-green-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Pembayaran Berhasil!</h2>
                    <p className="text-slate-400 mb-6">Akun Anda telah aktif. Mengalihkan ke dashboard...</p>
                    <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                </motion.div>
            </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800 shadow-2xl w-full max-w-md text-center">
        <h1 className="text-3xl font-bold text-white mb-4">Selesaikan Pembayaran</h1>
        <p className="text-slate-400 mb-8">
            Akun Anda telah dibuat, namun pembayaran pendaftaran belum selesai.
            Silakan bayar <span className="text-green-400 font-bold">Rp 50.000</span> untuk mengaktifkan akun.
        </p>
        
        <div className="space-y-4">
            <div className="bg-slate-800/50 p-4 rounded-lg text-left">
                <p className="text-sm text-slate-500">Email</p>
                <p className="text-white">{userProfile?.email}</p>
            </div>
             <div className="bg-slate-800/50 p-4 rounded-lg text-left">
                <p className="text-sm text-slate-500">Nama</p>
                <p className="text-white">{userProfile?.full_name}</p>
            </div>
        </div>

        <button 
          onClick={handlePayment}
          disabled={loading}
          className="w-full mt-8 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold py-3 rounded-lg hover:opacity-90 transition shadow-lg shadow-green-600/20 flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="animate-spin w-5 h-5" /> : 'Bayar Sekarang'}
        </button>

        <button 
          onClick={() => handleCheckStatus(false)}
          disabled={checkingPayment}
          className="w-full mt-3 bg-slate-800 border border-slate-700 text-slate-300 font-bold py-3 rounded-lg hover:bg-slate-700 transition flex items-center justify-center gap-2"
        >
          {checkingPayment ? <Loader2 className="animate-spin w-5 h-5" /> : 'Cek Status Pembayaran'}
        </button>
        
        <button 
            onClick={() => supabase.auth.signOut().then(() => navigate('/login'))}
            className="mt-4 text-slate-500 hover:text-white text-sm"
        >
            Logout / Ganti Akun
        </button>
      </div>
    </div>
  )
}
