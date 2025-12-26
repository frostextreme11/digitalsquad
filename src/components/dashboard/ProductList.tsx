import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Download, Search } from 'lucide-react'

export default function ProductList() {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [limit, setLimit] = useState(50)
  const [orderBy, setOrderBy] = useState('title_asc')
  const [affiliateCode, setAffiliateCode] = useState<string | null>(null)
  const [purchasedProductIds, setPurchasedProductIds] = useState<Set<string>>(new Set())
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [userProfile, setUserProfile] = useState<any>(null)

  // Load Snap Script
  useEffect(() => {
    const snapUrl = 'https://app.sandbox.midtrans.com/snap/snap.js'
    const clientKey = import.meta.env.VITE_MIDTRANS_CLIENT_KEY || 'SB-Mid-client-placeholder'

    if (!document.querySelector(`script[src="${snapUrl}"]`)) {
      const script = document.createElement('script')
      script.src = snapUrl
      script.setAttribute('data-client-key', clientKey)
      script.async = true
      document.body.appendChild(script)
    }
  }, [])

  useEffect(() => {
    const fetchUserAndProducts = async () => {
      // 1. Get User Data & Purchases
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        // Get Profile
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
        if (profile) {
          setAffiliateCode(profile.affiliate_code)
          setUserProfile(profile)
        }

        // Get Purchases
        // Fetch purchases linked to user_id OR email (for legacy or external purchases that match)
        // Optimization: Just check user_id for now as we just added it. 
        // Or check checking email if easy.
        const { data: purchases } = await supabase
          .from('product_purchases')
          .select('product_id')
          .or(`user_id.eq.${user.id},customer_email.eq.${user.email}`)

        if (purchases) {
          setPurchasedProductIds(new Set(purchases.map(p => p.product_id)))
        }
      }

      // 2. Fetch Products
      let query = supabase.from('products').select('*').eq('is_active', true)

      // Filter out free products (price > 0)
      query = query.gt('price', 0)

      if (searchTerm) {
        query = query.ilike('title', `%${searchTerm}%`)
      }

      // Apply sorting
      switch (orderBy) {
        case 'price_asc':
          query = query.order('price', { ascending: true })
          break
        case 'price_desc':
          query = query.order('price', { ascending: false })
          break
        case 'title_asc':
          query = query.order('title', { ascending: true })
          break
        case 'title_desc':
          query = query.order('title', { ascending: false })
          break
        default:
          query = query.order('title', { ascending: true })
      }

      const { data } = await query.limit(limit)
      setProducts(data || [])
      setLoading(false)
    }

    const timeoutId = setTimeout(() => {
      fetchUserAndProducts()
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [searchTerm, limit, orderBy])

  const copyAffiliateLink = (productId: string) => {
    if (!affiliateCode) {
      alert("Anda belum memiliki kode afiliasi. Silakan hubungi admin.")
      return
    }
    const url = `${window.location.origin}/buy/${productId}?ref=${affiliateCode}`
    navigator.clipboard.writeText(url)
    alert("Link afiliasi berhasil disalin!")
  }

  const handleBuy = async (product: any) => {
    if (!userProfile) return
    setProcessingId(product.id)

    try {
      const functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-product-payment`

      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          productId: product.id,
          agentCode: affiliateCode, // Self-referral? Or null? Maybe allow self-commission or just track it.
          userId: userProfile.id, // Pass user ID to link purchase
          customerDetails: {
            first_name: userProfile.full_name || 'Agent',
            email: userProfile.email,
            phone: userProfile.phone || '0000000000'
          }
        })
      })

      if (!response.ok) {
        const errData = await response.json()
        throw new Error(errData.error || 'Terjadi kesalahan saat memproses pembayaran.')
      }

      const data = await response.json()

      // @ts-ignore
      window.snap.pay(data.token, {
        onSuccess: function (result: any) {
          console.log('success', result)
          alert("Pembayaran Berhasil! Produk kini dapat diakses.")
          window.location.reload()
        },
        onPending: function (result: any) {
          console.log('pending', result)
          alert("Pembayaran tertunda. Silakan selesaikan pembayaran Anda.")
        },
        onError: function (result: any) {
          console.log('error', result)
          alert("Pembayaran gagal!")
        },
        onClose: function () {
          console.log('closed')
        }
      })
    } catch (err: any) {
      alert(err.message)
    } finally {
      setProcessingId(null)
    }
  }

  if (loading) return <div className="text-white">Loading products...</div>

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Digital Products</h2>
        <div className="flex gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 pl-10 pr-4 text-white focus:outline-none focus:border-blue-500 transition"
            />
          </div>
          <select
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition"
          >
            <option value={50}>50</option>
            <option value={100}>100</option>
            <option value={500}>500</option>
          </select>
          <select
            value={orderBy}
            onChange={(e) => setOrderBy(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition"
          >
            <option value="title_asc">Name (A-Z)</option>
            <option value="title_desc">Name (Z-A)</option>
            <option value="price_asc">Price (Low to High)</option>
            <option value="price_desc">Price (High to Low)</option>
          </select>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {products.map(product => {
          const isPurchased = purchasedProductIds.has(product.id)
          return (
            <div key={product.id} className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden hover:border-blue-500/50 transition group">
              <div className="h-48 bg-slate-800 relative overflow-hidden">
                {product.thumbnail_url ? (
                  <img src={product.thumbnail_url} alt={product.title} className="w-full h-full object-cover group-hover:scale-110 transition duration-500" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-600">No Image</div>
                )}
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-white mb-2">{product.title}</h3>
                <p className="text-slate-400 text-sm mb-4 line-clamp-2">{product.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-green-400 font-bold">
                    {product.price === 0 ? 'Free' : `Rp ${product.price.toLocaleString()}`}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => copyAffiliateLink(product.id)}
                      className="bg-slate-800 hover:bg-slate-700 text-white px-3 py-2 rounded-lg text-sm flex items-center gap-2 transition"
                      title="Copy Affiliate Link"
                    >
                      <Download size={16} className="rotate-0" /> Share
                    </button>
                    {isPurchased ? (
                      <a
                        href={product.file_url}
                        target="_blank"
                        rel="noreferrer"
                        className="bg-green-600 hover:bg-green-500 text-white px-3 py-2 rounded-lg text-sm flex items-center gap-2 transition"
                      >
                        Akses
                      </a>
                    ) : (
                      <button
                        onClick={() => handleBuy(product)}
                        disabled={processingId === product.id}
                        className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-2 rounded-lg text-sm flex items-center gap-2 transition disabled:opacity-50"
                      >
                        {processingId === product.id ? 'Loading...' : 'Beli'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
        {products.length === 0 && (
          <div className="col-span-3 text-center py-20 bg-slate-900 rounded-2xl border border-slate-800 border-dashed">
            <p className="text-slate-500">Belum ada produk digital yang tersedia.</p>
          </div>
        )}
      </div>
    </div>
  )
}
