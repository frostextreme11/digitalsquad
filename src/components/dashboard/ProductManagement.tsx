import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Search, ChevronLeft, ChevronRight, Filter, Plus, Edit, Trash, FileText, Image as ImageIcon, X, Check, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function ProductManagement() {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [limit, setLimit] = useState(50)
  const [page, setPage] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<any>(null)
  const [formData, setFormData] = useState({
      title: '',
      description: '',
      price: '',
      file_url: '',
      thumbnail_url: '',
      is_active: true
  })
  const [saving, setSaving] = useState(false)

  const fetchProducts = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase.rpc('get_products_paginated', {
        search_query: search,
        page_limit: limit,
        page_offset: page * limit
      })

      if (error) throw error
      setProducts(data || [])

      const { data: countData } = await supabase.rpc('get_products_count', {
        search_query: search
      })
      setTotalCount(countData || 0)

    } catch (err) {
      console.error("Error fetching products:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [page, limit])

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(0)
      fetchProducts()
    }, 500)
    return () => clearTimeout(timer)
  }, [search])

  const totalPages = Math.ceil(totalCount / limit)

  const handleOpenModal = (product: any = null) => {
      if (product) {
          setEditingProduct(product)
          setFormData({
              title: product.title,
              description: product.description || '',
              price: product.price.toString(),
              file_url: product.file_url || '',
              thumbnail_url: product.thumbnail_url || '',
              is_active: product.is_active
          })
      } else {
          setEditingProduct(null)
          setFormData({
              title: '',
              description: '',
              price: '',
              file_url: '',
              thumbnail_url: '',
              is_active: true
          })
      }
      setIsModalOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
      e.preventDefault()
      setSaving(true)
      try {
          const payload = {
              title: formData.title,
              description: formData.description,
              price: parseFloat(formData.price),
              file_url: formData.file_url,
              thumbnail_url: formData.thumbnail_url,
              is_active: formData.is_active
          }

          if (editingProduct) {
              const { error } = await supabase.from('products').update(payload).eq('id', editingProduct.id)
              if (error) throw error
          } else {
              const { error } = await supabase.from('products').insert(payload)
              if (error) throw error
          }
          
          setIsModalOpen(false)
          fetchProducts()
      } catch (error: any) {
          alert('Error saving product: ' + error.message)
      } finally {
          setSaving(false)
      }
  }

  const handleDelete = async (id: string) => {
      if (!confirm('Are you sure you want to delete this product?')) return
      try {
          const { error } = await supabase.from('products').delete().eq('id', id)
          if (error) throw error
          fetchProducts()
      } catch (error: any) {
          alert('Error deleting product: ' + error.message)
      }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <h2 className="text-2xl font-bold text-white">Product Management</h2>
        
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input 
              type="text" 
              placeholder="Search products..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-slate-200 focus:outline-none focus:border-blue-500 transition"
            />
          </div>

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
            </select>
            <Filter className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={16} />
          </div>

          <button 
            onClick={() => handleOpenModal()}
            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 transition shadow-lg shadow-blue-600/20"
          >
              <Plus size={20} />
              <span className="hidden sm:inline">Add Product</span>
          </button>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-slate-300">
            <thead className="bg-slate-950 text-slate-400 text-xs uppercase font-semibold">
              <tr>
                <th className="px-6 py-4">Product</th>
                <th className="px-6 py-4">Price</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loading ? (
                <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-500">Loading...</td></tr>
              ) : products.length === 0 ? (
                <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-500">No products found.</td></tr>
              ) : (
                products.map((product, index) => (
                  <motion.tr 
                    key={product.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-slate-800/50 transition duration-150"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-lg bg-slate-800 border border-slate-700 overflow-hidden flex-shrink-0">
                              {product.thumbnail_url ? (
                                  <img src={product.thumbnail_url} alt={product.title} className="w-full h-full object-cover" />
                              ) : (
                                  <div className="w-full h-full flex items-center justify-center text-slate-600">
                                      <ImageIcon size={20} />
                                  </div>
                              )}
                          </div>
                          <div>
                              <div className="font-medium text-white">{product.title}</div>
                              <div className="text-xs text-slate-500 truncate max-w-[200px]">{product.description}</div>
                          </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-green-400">
                      Rp {product.price?.toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${product.is_active ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                          {product.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                          <button onClick={() => handleOpenModal(product)} className="p-2 hover:bg-blue-500/10 text-slate-400 hover:text-blue-400 rounded-lg transition">
                              <Edit size={18} />
                          </button>
                          <button onClick={() => handleDelete(product.id)} className="p-2 hover:bg-red-500/10 text-slate-400 hover:text-red-400 rounded-lg transition">
                              <Trash size={18} />
                          </button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="px-6 py-4 border-t border-slate-800 flex items-center justify-between bg-slate-950/50">
          <span className="text-sm text-slate-500">Showing {products.length} of {totalCount} products</span>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 disabled:opacity-50"><ChevronLeft size={20} /></button>
            <span className="text-sm text-slate-400 px-2">Page {page + 1} of {totalPages || 1}</span>
            <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 disabled:opacity-50"><ChevronRight size={20} /></button>
          </div>
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
          {isModalOpen && (
              <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4"
              >
                  <motion.div 
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.95, opacity: 0 }}
                      className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden"
                  >
                      <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center">
                          <h3 className="text-xl font-bold text-white">{editingProduct ? 'Edit Product' : 'New Product'}</h3>
                          <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white"><X size={24} /></button>
                      </div>
                      
                      <form onSubmit={handleSave} className="p-6 space-y-4">
                          <div>
                              <label className="block text-sm font-medium text-slate-400 mb-1">Title</label>
                              <input required type="text" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:border-blue-500 focus:outline-none" 
                                  value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
                          </div>
                          <div>
                              <label className="block text-sm font-medium text-slate-400 mb-1">Description</label>
                              <textarea className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:border-blue-500 focus:outline-none h-24 resize-none" 
                                  value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                          </div>
                          <div>
                              <label className="block text-sm font-medium text-slate-400 mb-1">Price (IDR)</label>
                              <input required type="number" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:border-blue-500 focus:outline-none" 
                                  value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
                          </div>
                          <div>
                              <label className="block text-sm font-medium text-slate-400 mb-1">Thumbnail URL</label>
                              <input type="url" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:border-blue-500 focus:outline-none" 
                                  value={formData.thumbnail_url} onChange={e => setFormData({...formData, thumbnail_url: e.target.value})} />
                          </div>
                          <div>
                              <label className="block text-sm font-medium text-slate-400 mb-1">File URL (Download Link)</label>
                              <input type="url" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:border-blue-500 focus:outline-none" 
                                  value={formData.file_url} onChange={e => setFormData({...formData, file_url: e.target.value})} />
                          </div>
                          <div className="flex items-center gap-3 pt-2">
                              <input type="checkbox" id="is_active" className="w-5 h-5 rounded bg-slate-950 border-slate-800 text-blue-600 focus:ring-blue-500" 
                                  checked={formData.is_active} onChange={e => setFormData({...formData, is_active: e.target.checked})} />
                              <label htmlFor="is_active" className="text-white font-medium select-none cursor-pointer">Active Product</label>
                          </div>

                          <div className="pt-4 flex justify-end gap-3">
                              <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition">Cancel</button>
                              <button type="submit" disabled={saving} className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-xl font-medium transition flex items-center gap-2">
                                  {saving ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
                                  Save Product
                              </button>
                          </div>
                      </form>
                  </motion.div>
              </motion.div>
          )}
      </AnimatePresence>
    </div>
  )
}
