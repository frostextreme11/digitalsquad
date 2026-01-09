import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Download, Search } from 'lucide-react'

export default function FreeZone() {
    const [products, setProducts] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [limit, setLimit] = useState(50)

    useEffect(() => {
        const fetchProducts = async () => {
            let query = supabase.from('products').select('*').eq('is_active', true).eq('price', 0)

            if (searchTerm) {
                query = query.ilike('title', `%${searchTerm}%`)
            }

            const { data } = await query.limit(limit)
            setProducts(data || [])
            setLoading(false)
        }

        const timeoutId = setTimeout(() => {
            fetchProducts()
        }, 500)

        return () => clearTimeout(timeoutId)
    }, [searchTerm, limit])

    const handleDownload = async (e: React.MouseEvent, product: any) => {
        const url = product.file_url
        if (!url) return

        // Check if it's a jsDelivr PDF link that needs forced download
        const isJsDelivrPdf = url.includes('cdn.jsdelivr.net') && url.toLowerCase().endsWith('.pdf')

        if (isJsDelivrPdf) {
            e.preventDefault()
            try {
                const response = await fetch(url)
                const blob = await response.blob()
                const blobUrl = window.URL.createObjectURL(blob)

                // Use product title as filename, ensuring .pdf extension
                let filename = product.title || 'download'
                // Remove special chars for filename safety
                filename = filename.replace(/[^a-z0-9]/gi, '_').toLowerCase()

                if (!filename.endsWith('.pdf')) {
                    filename += '.pdf'
                }

                const link = document.createElement('a')
                link.href = blobUrl
                link.download = filename
                document.body.appendChild(link)
                link.click()
                document.body.removeChild(link)
                window.URL.revokeObjectURL(blobUrl)
            } catch (error) {
                console.error("Download failed, opening in new tab", error)
                window.open(url, '_blank')
            }
        }
        // Otherwise let the default behavior happen (or existing target="_blank")
    }

    if (loading) return <div className="text-white">Loading free products...</div>

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <h2 className="text-2xl font-bold text-white">Free For Members</h2>
                <div className="flex gap-4 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search free products..."
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
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {products.map(product => (
                    <div key={product.id} className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden hover:border-blue-500/50 transition group">
                        <div className="h-48 bg-slate-800 relative overflow-hidden">
                            {product.thumbnail_url ? (
                                <img src={product.thumbnail_url} alt={product.title} className="w-full h-full object-contain group-hover:scale-110 transition duration-500" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-600">No Image</div>
                            )}
                        </div>
                        <div className="p-6">
                            <h3 className="text-xl font-bold text-white mb-2">{product.title}</h3>
                            <p className="text-slate-400 text-sm mb-4 line-clamp-2">{product.description}</p>
                            <div className="flex items-center justify-between">
                                <span className="text-green-400 font-bold">
                                    Free
                                </span>
                                <a
                                    href={product.file_url}
                                    onClick={(e) => handleDownload(e, product)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition"
                                >
                                    <Download size={16} /> Access
                                </a>
                            </div>
                        </div>
                    </div>
                ))}
                {products.length === 0 && (
                    <div className="col-span-3 text-center py-20 bg-slate-900 rounded-2xl border border-slate-800 border-dashed">
                        <p className="text-slate-500">Belum ada produk gratis yang tersedia.</p>
                    </div>
                )}
            </div>
        </div>
    )
}
