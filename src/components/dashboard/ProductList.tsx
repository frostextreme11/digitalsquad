import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Download } from 'lucide-react'

export default function ProductList() {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProducts = async () => {
      const { data } = await supabase.from('products').select('*').eq('is_active', true)
      setProducts(data || [])
      setLoading(false)
    }
    fetchProducts()
  }, [])

  if (loading) return <div className="text-white">Loading products...</div>

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">Digital Products</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {products.map(product => (
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
                   <span className="text-green-400 font-bold">Rp {product.price.toLocaleString()}</span>
                   <button className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition">
                      <Download size={16} /> Access
                   </button>
                </div>
             </div>
          </div>
        ))}
        {products.length === 0 && (
            <div className="col-span-3 text-center py-20 bg-slate-900 rounded-2xl border border-slate-800 border-dashed">
                <p className="text-slate-500">Belum ada produk digital yang tersedia.</p>
            </div>
        )}
      </div>
    </div>
  )
}
