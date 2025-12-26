import { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, Loader2, AlertCircle } from 'lucide-react'

export default function ProductSalesPage() {
    const { productId } = useParams()
    const [searchParams] = useSearchParams()
    const refCode = searchParams.get('ref')

    const [product, setProduct] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [processing, setProcessing] = useState(false)
    const [showSuccess, setShowSuccess] = useState(false)

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: ''
    })

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
        const fetchProduct = async () => {
            if (!productId) return
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .eq('id', productId)
                .eq('is_active', true)
                .single()

            if (error) {
                setError('Produk tidak ditemukan atau sudah tidak aktif.')
            } else {
                setProduct(data)
            }
            setLoading(false)
        }
        fetchProduct()
    }, [productId])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setProcessing(true)

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
                    agentCode: refCode,
                    customerDetails: {
                        first_name: formData.name,
                        email: formData.email,
                        phone: formData.phone
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
                    setShowSuccess(true)
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
            setProcessing(false)
        }
    }

    if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Loading...</div>

    if (error) return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-red-500/50 p-8 rounded-2xl max-w-md text-center">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-white mb-2">Error</h2>
                <p className="text-slate-400">{error}</p>
            </div>
        </div>
    )

    return (
        <div className="min-h-screen bg-slate-950 relative overflow-x-hidden">
            {/* Background Gradients */}
            <div className="absolute top-0 left-0 w-full h-96 bg-blue-600/5 blur-[100px] pointer-events-none z-0" />
            <div className="absolute bottom-0 right-0 w-full h-96 bg-purple-600/5 blur-[100px] pointer-events-none z-0" />

            {/* Success Modal */}
            <AnimatePresence>
                {showSuccess && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="bg-slate-900 border border-green-500/50 p-8 rounded-2xl shadow-2xl flex flex-col items-center max-w-sm w-full text-center"
                        >
                            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mb-6">
                                <CheckCircle className="w-10 h-10 text-green-500" />
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-2">Pembayaran Berhasil!</h2>
                            <p className="text-slate-400 mb-6">
                                Terima kasih telah membeli <strong>{product.title}</strong>.
                                Link download telah dikirim ke email <strong>{formData.email}</strong>.
                            </p>
                            <button
                                onClick={() => window.location.reload()}
                                className="bg-slate-800 hover:bg-slate-700 text-white px-6 py-2 rounded-lg transition"
                            >
                                Tutup
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="container mx-auto px-4 py-8 md:py-16 max-w-4xl relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
                    {/* Product Details - Left Column */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6"
                    >
                        <div className="w-full bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 shadow-xl">
                            {product.thumbnail_url ? (
                                <img src={product.thumbnail_url} alt={product.title} className="w-full h-auto object-contain max-h-[500px]" />
                            ) : (
                                <div className="w-full h-64 flex items-center justify-center text-slate-600">No Image</div>
                            )}
                        </div>
                        <div>
                            <h1 className="text-3xl md:text-4xl font-bold text-white mb-4 leading-tight">{product.title}</h1>
                            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                                <p className="text-slate-200 leading-relaxed whitespace-pre-wrap">{product.description}</p>
                            </div>
                        </div>
                    </motion.div>

                    {/* Checkout Form - Right Column */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="md:sticky md:top-8 h-fit"
                    >
                        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 md:p-8 shadow-2xl ring-1 ring-white/10">
                            <div className="flex justify-between items-end mb-8 border-b border-slate-800 pb-6">
                                <div>
                                    <p className="text-slate-400 text-sm mb-1">Harga Produk</p>
                                    <p className="text-3xl font-bold text-green-400">Rp {product.price.toLocaleString()}</p>
                                </div>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-slate-300 mb-1.5 text-sm font-medium">Nama Lengkap</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                                        placeholder="Nama Anda"
                                    />
                                </div>
                                <div>
                                    <label className="block text-slate-300 mb-1.5 text-sm font-medium">Email Address</label>
                                    <input
                                        type="email"
                                        required
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                                        placeholder="email@example.com"
                                    />
                                    <p className="text-xs text-slate-500 mt-1">Link produk akan dikirim ke email ini.</p>
                                </div>
                                <div>
                                    <label className="block text-slate-300 mb-1.5 text-sm font-medium">No. WhatsApp</label>
                                    <input
                                        type="tel"
                                        required
                                        value={formData.phone}
                                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                        className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                                        placeholder="08xxxxxxxxxx"
                                    />
                                </div>

                                <div className="pt-4">
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-600/20 transition transform hover:scale-[1.02] flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                                    >
                                        {processing ? <Loader2 className="animate-spin" /> : 'Beli Sekarang'}
                                    </button>
                                    <p className="text-center text-xs text-slate-500 mt-4 px-4">
                                        Pastikan email dan nomor telepon yang Anda masukkan sudah benar. Karena produk akan dikirimkan ke Email / Nomor HP anda
                                    </p>
                                </div>
                            </form>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    )
}
