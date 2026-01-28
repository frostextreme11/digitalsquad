import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Plus, Search, Edit, Trash2, Video, X, Save, Loader2, Copy } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface Testimonial {
    id: string
    created_at: string
    video_url: string
    title: string
    description: string | null
    thumbnail_url?: string | null
    category?: 'testimony' | 'content' | null
}

export default function AdminTestimonials() {
    const [testimonials, setTestimonials] = useState<Testimonial[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [categoryFilter, setCategoryFilter] = useState<'all' | 'testimony' | 'content'>('all')
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingItem, setEditingItem] = useState<Testimonial | null>(null)
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        video_url: '',
        thumbnail_url: '',
        category: 'testimony'
    })
    const [submitting, setSubmitting] = useState(false)

    useEffect(() => {
        fetchTestimonials()
    }, [])

    const fetchTestimonials = async () => {
        setLoading(true)
        let query = supabase
            .from('video_testimonials')
            .select('*')
            .order('created_at', { ascending: false })

        if (search) {
            query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`)
        }

        if (categoryFilter !== 'all') {
            query = query.eq('category', categoryFilter)
        }

        const { data, error } = await query

        if (error) {
            console.error('Error fetching testimonials:', error)
        } else {
            setTestimonials(data || [])
        }
        setLoading(false)
    }

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchTestimonials()
        }, 500)
        return () => clearTimeout(timer)
    }, [search, categoryFilter])

    const handleOpenModal = (item?: Testimonial) => {
        if (item) {
            setEditingItem(item)
            setFormData({
                title: item.title,
                description: item.description || '',
                video_url: item.video_url,
                thumbnail_url: item.thumbnail_url || '',
                category: (item.category as any) || 'testimony'
            })
        } else {
            setEditingItem(null)
            setFormData({
                title: '',
                description: '',
                video_url: '',
                thumbnail_url: '',
                category: 'testimony' as any
            })
        }
        setIsModalOpen(true)
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this video?')) return

        const { error } = await supabase
            .from('video_testimonials')
            .delete()
            .eq('id', id)

        if (error) {
            alert('Error deleting video')
        } else {
            fetchTestimonials()
        }
    }

    const handleDuplicate = async (item: Testimonial) => {
        // Find base title (remove ending numbers)
        const match = item.title.match(/^(.*?)( \d+)?$/)
        const baseTitle = match ? match[1] : item.title

        // Find all titles starting with baseTitle
        const { data: similarItems } = await supabase
            .from('video_testimonials')
            .select('title')
            .ilike('title', `${baseTitle}%`)

        // Calculate next number
        let nextNum = 2
        if (similarItems) {
            const numbers = similarItems
                .map(t => {
                    const m = t.title.match(new RegExp(`^${baseTitle}( (\\d+))?$`))
                    if (!m) return 0
                    return m[2] ? parseInt(m[2]) : 1
                })
                .filter(n => n > 0)

            if (numbers.length > 0) {
                nextNum = Math.max(...numbers) + 1
            }
        }

        const newTitle = `${baseTitle} ${nextNum}`

        const payload = {
            title: newTitle,
            description: item.description,
            video_url: item.video_url,
            thumbnail_url: item.thumbnail_url,
            category: item.category
        }

        const { error } = await supabase
            .from('video_testimonials')
            .insert([payload])

        if (error) {
            alert('Error duplicating video: ' + error.message)
        } else {
            fetchTestimonials()
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitting(true)

        const payload = {
            ...formData,
            thumbnail_url: formData.thumbnail_url || null
        }

        let error
        if (editingItem) {
            const { error: updateError } = await supabase
                .from('video_testimonials')
                .update(payload)
                .eq('id', editingItem.id)
            error = updateError
        } else {
            const { error: insertError } = await supabase
                .from('video_testimonials')
                .insert([payload])
            error = insertError
        }

        setSubmitting(false)
        if (error) {
            alert('Error saving video: ' + error.message)
        } else {
            setIsModalOpen(false)
            fetchTestimonials()
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
                        Videos Management
                    </h2>
                    <p className="text-slate-400">Manage video testimonials and ad content.</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl transition duration-200 w-full md:w-auto justify-center"
                >
                    <Plus size={20} />
                    Add New
                </button>
            </div>

            {/* Search Filter and Category */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search by title..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition"
                    />
                </div>
                <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value as any)}
                    className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 focus:ring-2 focus:ring-blue-500/50 outline-none"
                >
                    <option value="all">All Categories</option>
                    <option value="testimony">Testimonials</option>
                    <option value="content">Content Iklan</option>
                </select>
            </div>

            {/* List/Table */}
            {loading ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="animate-spin text-blue-500" size={40} />
                </div>
            ) : (
                <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
                    {testimonials.length === 0 ? (
                        <div className="p-8 text-center text-slate-500">No videos found.</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-950/50 text-slate-400 uppercase text-xs font-semibold">
                                    <tr>
                                        <th className="px-6 py-4">Title</th>
                                        <th className="px-6 py-4">Category</th>
                                        <th className="px-6 py-4 hidden md:table-cell">Description</th>
                                        <th className="px-6 py-4 hidden md:table-cell">Video URL</th>
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800">
                                    {testimonials.map((item) => (
                                        <motion.tr
                                            key={item.id}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="hover:bg-slate-800/50 transition duration-150"
                                        >
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-slate-200">{item.title}</div>
                                                <div className="md:hidden text-xs text-slate-500 mt-1 truncate max-w-[200px]">{item.description}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`text-xs px-2 py-1 rounded font-bold uppercase ${item.category === 'content' ? 'bg-purple-500/20 text-purple-400' : 'bg-green-500/20 text-green-400'}`}>
                                                    {item.category || 'testimony'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-slate-400 hidden md:table-cell max-w-xs truncate">
                                                {item.description}
                                            </td>
                                            <td className="px-6 py-4 text-slate-400 hidden md:table-cell max-w-xs truncate">
                                                <a href={item.video_url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline flex items-center gap-1">
                                                    <Video size={14} /> Link
                                                </a>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => handleDuplicate(item)}
                                                        className="p-2 text-slate-400 hover:text-green-400 hover:bg-green-500/10 rounded-lg transition"
                                                        title="Duplicate"
                                                    >
                                                        <Copy size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleOpenModal(item)}
                                                        className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition"
                                                        title="Edit"
                                                    >
                                                        <Edit size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(item.id)}
                                                        className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"
                                                        title="Delete"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsModalOpen(false)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden"
                        >
                            <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-950/30">
                                <h3 className="text-xl font-bold text-white">
                                    {editingItem ? 'Edit Video' : 'Add New Video'}
                                </h3>
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="text-slate-400 hover:text-white transition"
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">Title</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.title}
                                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white focus:ring-2 focus:ring-blue-500/50 outline-none"
                                        placeholder="e.g. Success Story from John"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">Description</label>
                                    <textarea
                                        rows={3}
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white focus:ring-2 focus:ring-blue-500/50 outline-none resize-none"
                                        placeholder="Brief description of the video content..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">Video URL</label>
                                    <input
                                        type="url"
                                        required
                                        value={formData.video_url}
                                        onChange={e => {
                                            let val = e.target.value
                                            // Auto-convert GitHub to jsDelivr
                                            if (val.includes('github.com') && val.includes('/blob/')) {
                                                val = val.replace('github.com', 'cdn.jsdelivr.net/gh').replace('/blob/', '@')
                                            }
                                            setFormData({ ...formData, video_url: val })
                                        }}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white focus:ring-2 focus:ring-blue-500/50 outline-none"
                                        placeholder="https://..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">Thumbnail URL (Optional)</label>
                                    <input
                                        type="url"
                                        value={formData.thumbnail_url}
                                        onChange={e => setFormData({ ...formData, thumbnail_url: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white focus:ring-2 focus:ring-blue-500/50 outline-none"
                                        placeholder="https://..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">Category</label>
                                    <select
                                        value={formData.category}
                                        onChange={e => setFormData({ ...formData, category: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white focus:ring-2 focus:ring-blue-500/50 outline-none"
                                    >
                                        <option value="testimony">Testimony (Success Story)</option>
                                        <option value="content">Content Iklan (For Agents)</option>
                                    </select>
                                </div>

                                <div className="flex justify-end gap-3 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="px-4 py-2 text-slate-400 hover:text-white transition"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {submitting ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                                        Save
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    )
}

