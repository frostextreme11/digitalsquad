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
  const [pendingTransaction, setPendingTransaction] = useState<any>(null)

  // Load Snap Script
  useEffect(() => {
    const loadSnap = async () => {
      const { data: configs } = await supabase
        .from('app_config')
        .select('key, value')
        .in('key', ['midtrans_snap_url', 'midtrans_client_key'])

      const configMap = configs?.reduce((acc: any, curr: any) => ({ ...acc, [curr.key]: curr.value }), {}) || {}

      const snapUrl = configMap['midtrans_snap_url'] || 'https://app.sandbox.midtrans.com/snap/snap.js'
      const clientKey = configMap['midtrans_client_key'] !== 'SB-Mid-client-placeholder'
        ? configMap['midtrans_client_key']
        : (import.meta.env.VITE_MIDTRANS_CLIENT_KEY || 'SB-Mid-client-placeholder')

      // Check if script already exists
      if (!document.querySelector(`script[src="${snapUrl}"]`)) {
        const script = document.createElement('script')
        script.src = snapUrl
        script.setAttribute('data-client-key', clientKey)
        script.async = true
        document.body.appendChild(script)
      }
    }
    loadSnap()
  }, [])

  // Check Auth and Payment Status
  useEffect(() => {
    const init = async () => {

      // First check user validation
      await checkUser()
      // Then immediately check payment status if we found a pending one
      // We use a small timeout to let state settle, but effectively immediate
      setTimeout(() => {
        // User requested to "disable buttons" aka show checking state during this auto-check
        // So we set checkingPayment to true, and call handleCheckStatus(true) (silent alert, but UI is busy)
        setCheckingPayment(true)
        handleCheckStatus(true).finally(() => {
          setCheckingPayment(false)
        })
      }, 500)

      //Extra check for payment status
      setTimeout(async () => {
        if (await handleCheckStatus(false)) {
          if (window.location.pathname !== '/dashboard') {
            navigate('/dashboard')
          }
        }
      }, 3000)
    }
    init()
  }, [])

  const checkUser = async () => {
    setCheckingStatus(true)
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

    // Check for pending transaction
    const { data: pending } = await supabase
      .from('transactions')
      .select('id, midtrans_id, amount')
      .eq('user_id', user.id)
      .eq('type', 'registration')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (pending) {
      setPendingTransaction(pending)
    }

    setCheckingStatus(false)
  }

  // Check status against Midtrans API
  // Returns true if payment is confirmed success, false otherwise
  const handleCheckStatus = async (silent = false) => {
    if (!silent) setCheckingPayment(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return false

      // 1. First, check IF we actually already have a success transaction in DB
      // (This covers cases where webhook updated it in background)
      const { data: successTx } = await supabase
        .from('transactions')
        .select('id, status')
        .eq('user_id', user.id)
        .eq('type', 'registration')
        .eq('status', 'success') // Explicitly check success
        .not('midtrans_id', 'is', null) // Ensure it's a real tx
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (successTx) {
        console.log("Found existing success transaction in DB")
        setShowSuccess(true)
        setTimeout(() => window.location.reload(), 2000)
        return true
      }

      // 2. If no success in DB, check pending
      const { data: transaction } = await supabase
        .from('transactions')
        .select('id, amount, midtrans_id')
        .eq('user_id', user.id)
        .eq('type', 'registration')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (transaction) {
        setPendingTransaction(transaction)

        // Call Edge Function to check Midtrans Status
        const functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/check-payment-status`
        const response = await fetch(functionUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify({ order_id: transaction.id })
        })

        if (response.ok) {
          const data = await response.json()
          console.log("Check Status Result:", data)

          // Check if status is effectively success
          const isSuccess = data.new_status === 'success' ||
            (data.midtrans_data &&
              (data.midtrans_data.transaction_status === 'settlement' ||
                data.midtrans_data.transaction_status === 'capture'))

          if (isSuccess) {
            setShowSuccess(true)
            setTimeout(() => window.location.reload(), 2000)
            return true
          } else {
            if (!silent) alert("Status pembayaran masih: " + (data.midtrans_data?.transaction_status || 'Pending'))
          }
        }
      } else {
        // No pending, check user again just in case
        checkUser()
      }
    } catch (e: any) {
      console.error(e)
      if (!silent) alert("Gagal mengecek status: " + e.message)
    } finally {
      if (!silent) setCheckingPayment(false)
    }
    return false
  }

  const handlePayment = async () => {
    if (!userProfile) return
    setLoading(true)

    try {
      // STEP 1: STRICT PRE-CHECK
      // Before creating ANY new payment, strictly verify if we are already paid.
      // We call handleCheckStatus(true) which returns boolean 'isSuccess'
      setCheckingPayment(true) // Show checking UI
      const isAlreadyPaid = await handleCheckStatus(true)
      setCheckingPayment(false)

      if (isAlreadyPaid) {
        console.log("Payment already completed. Aborting new payment.")
        return // STOP HERE
      }

      // STEP 2: Create Payment / Get Token
      const functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-payment`

      // Base payload
      const payload: any = {
        amount: pendingTransaction ? pendingTransaction.amount : 50000,
        userId: userProfile.id,
        type: 'registration',
        customerDetails: {
          first_name: userProfile.full_name,
          email: userProfile.email,
          phone: userProfile.phone
        }
      }

      // Try to reuse existing Order ID first (if it's pending)
      if (pendingTransaction) {
        payload.orderId = pendingTransaction.id
      }

      console.log("Creating payment with payload:", payload)

      let response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify(payload)
      })

      // RETRY LOGIC (Safe Mode)
      // Only retry if we are SURE it failed due to ID duplication AND we know it's not success (Step 1 cleared that)
      if (!response.ok) {
        const errorText = await response.text()
        console.log("First attempt failed:", errorText)

        if (errorText.includes("sudah digunakan") || errorText.includes("already used") || response.status === 400) {
          console.log("Order ID confirmed used (and active/pending). Retrying with NEW ID to allow payment...")

          // Remove orderId to force backend to generate a NEW one
          delete payload.orderId

          response = await fetch(functionUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
            },
            body: JSON.stringify(payload)
          })
        } else {
          throw new Error(errorText || 'Server Error')
        }
      }

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        throw new Error(errData.error || 'Gagal membuat pembayaran')
      }

      const data = await response.json()

      if (data.token) {
        // @ts-ignore
        if (window.snap) {
          // @ts-ignore
          window.snap.pay(data.token, {
            onSuccess: function (result: any) {
              console.log('success', result)
              setShowSuccess(true)
              setTimeout(() => window.location.reload(), 2000)
            },
            onPending: function (result: any) {
              console.log('pending', result)
              handleCheckStatus(true)
            },
            onError: function (result: any) {
              console.log('error', result)
              alert("Pembayaran gagal atau dibatalkan.")
            },
            onClose: function () {
              console.log('closed')
              handleCheckStatus(true)
            }
          })
        } else {
          alert("Sistem pembayaran belum siap. Harap refresh halaman.")
        }
      } else {
        alert('Gagal memuat token pembayaran.')
      }

    } catch (error: any) {
      console.error(error)
      alert('Terjadi kesalahan: ' + error.message)
    } finally {
      if (!showSuccess) {
        setLoading(false)
      }
    }
  }

  if (checkingStatus) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
        <p className="text-slate-400 animate-pulse">Mengecek data pembayaran...</p>
      </div>
    )
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

        {pendingTransaction ? (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-8">
            <p className="text-yellow-400 font-medium mb-1">Menunggu Pembayaran</p>
            <p className="text-slate-400 text-sm">
              Mohon lunasi pembayaran untuk mengakses dashboard Digital Squad.
            </p>
          </div>
        ) : (
          <p className="text-slate-400 mb-8">
            Akun Anda telah dibuat, namun pembayaran pendaftaran belum selesai.
            Silakan bayar <span className="text-green-400 font-bold">Rp 50.000</span> untuk mengaktifkan akun.
          </p>
        )}

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
          disabled={loading || checkingPayment} // Button disabled when checking payment
          className="w-full mt-8 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold py-3 rounded-lg hover:opacity-90 transition shadow-lg shadow-green-600/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading || checkingPayment ? (
            <>
              <Loader2 className="animate-spin w-5 h-5" />
              {checkingPayment ? 'Mengecek Pembayaran...' : 'Memproses...'}
            </>
          ) : (
            'Bayar Sekarang'
          )}
        </button>

        <button
          onClick={() => handleCheckStatus(false)}
          disabled={checkingPayment}
          className="w-full mt-3 bg-slate-800 border border-slate-700 text-slate-300 font-bold py-3 rounded-lg hover:bg-slate-700 transition flex items-center justify-center gap-2"
        >
          {checkingPayment ? <Loader2 className="animate-spin w-5 h-5" /> : 'Cek Status Pembayaran Manual'}
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
