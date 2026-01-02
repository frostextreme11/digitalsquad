import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Search, Play, Download, X, Loader2, Copy } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'

interface Testimonial {
    id: string
    created_at: string
    video_url: string
    title: string
    description: string | null
    thumbnail_url?: string | null
}

export default function AgentTestimonials() {
    const [testimonials, setTestimonials] = useState<Testimonial[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [selectedVideo, setSelectedVideo] = useState<Testimonial | null>(null)

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

        const { data, error } = await query

        if (error) {
            console.error('Error fetching testimonials:', error)
            toast.error('Failed to load testimonials')
        } else {
            setTestimonials(data || [])
        }
        setLoading(false)
    }

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchTestimonials()
        }, 500)
        return () => clearTimeout(timer)
    }, [search])

    const handleDownload = async (e: React.MouseEvent, video: Testimonial) => {
        e.stopPropagation()
        try {
            const response = await fetch(video.video_url)
            const blob = await response.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `${video.title.replace(/\s+/g, '_')}.mp4`
            document.body.appendChild(a)
            a.click()
            window.URL.revokeObjectURL(url)
            document.body.removeChild(a)
            toast.success('Download started')
        } catch (err) {
            console.error('Download failed', err)
            window.open(video.video_url, '_blank')
        }
    }

    const handleCopyDescription = (e: React.MouseEvent, description: string | null) => {
        e.stopPropagation()
        if (!description) return
        navigator.clipboard.writeText(description)
        toast.success('Description copied to clipboard')
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
                        Success Stories
                    </h2>
                    <p className="text-slate-400">Learn from other agents and boost your sales.</p>
                </div>
            </div>

            {/* Search Filter */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
                <input
                    type="text"
                    placeholder="Search videos..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition duration-200"
                />
            </div>

            {/* Grid */}
            {loading ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="animate-spin text-blue-500" size={40} />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {testimonials.length === 0 ? (
                        <div className="col-span-full text-center text-slate-500 py-12">No videos found.</div>
                    ) : (
                        testimonials.map((item) => (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="group bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden hover:border-blue-500/30 hover:shadow-lg hover:shadow-blue-500/10 transition duration-300 flex flex-col"
                            >
                                {/* Thumbnail / Video Preview Area */}
                                <div
                                    className="aspect-video bg-slate-950 relative overflow-hidden cursor-pointer"
                                    onClick={() => setSelectedVideo(item)}
                                >
                                    {item.thumbnail_url ? (
                                        <img src={item.thumbnail_url} alt={item.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition duration-500 group-hover:scale-105" />
                                    ) : (
                                        <video
                                            src={item.video_url + '#t=0.001'}
                                            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition duration-500 group-hover:scale-105"
                                            muted
                                            preload="metadata"
                                            playsInline
                                        />
                                    )}

                                    {/* Play Button Overlay */}
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/10 transition duration-300">
                                        <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center group-hover:bg-blue-600 group-hover:scale-110 transition duration-300 border border-white/20 group-hover:border-blue-500">
                                            <Play size={24} className="text-white ml-1" />
                                        </div>
                                    </div>
                                </div>

                                <div className="p-5 flex-1 flex flex-col">
                                    <h3 className="font-bold text-lg text-slate-100 line-clamp-2 mb-2 group-hover:text-blue-400 transition">{item.title}</h3>
                                    <p className="text-slate-400 text-sm line-clamp-3 mb-4 flex-1">{item.description}</p>

                                    <div className="flex items-center gap-2 mt-auto pt-4 border-t border-slate-800/50">
                                        <button
                                            onClick={() => setSelectedVideo(item)}
                                            className="flex-1 py-2 bg-slate-800 hover:bg-blue-600 hover:text-white text-slate-300 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2"
                                        >
                                            <Play size={16} /> Watch
                                        </button>

                                        <button
                                            onClick={(e) => handleCopyDescription(e, item.description)}
                                            className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition"
                                            title="Copy Description"
                                        >
                                            <Copy size={16} />
                                        </button>

                                        <button
                                            onClick={(e) => handleDownload(e, item)}
                                            className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition"
                                            title="Download Video"
                                        >
                                            <Download size={16} />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>
            )}

            {/* Video Modal */}
            <AnimatePresence>
                {selectedVideo && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedVideo(null)}
                            className="absolute inset-0"
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="relative w-full max-w-4xl bg-black rounded-2xl overflow-hidden shadow-2xl border border-slate-800"
                        >
                            <div className="flex items-center justify-between p-4 bg-slate-900/50 border-b border-slate-800 absolute top-0 left-0 right-0 z-10 backdrop-blur-sm bg-gradient-to-b from-black/80 to-transparent border-none">
                                <h3 className="font-medium text-white text-shadow truncate px-2">{selectedVideo.title}</h3>
                                <button
                                    onClick={() => setSelectedVideo(null)}
                                    className="bg-black/50 hover:bg-white/20 text-white p-2 rounded-full backdrop-blur-md transition"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="aspect-video bg-black flex items-center justify-center">
                                <video
                                    src={selectedVideo.video_url}
                                    controls
                                    autoPlay
                                    className="w-full h-full"
                                    style={{ maxHeight: '80vh' }}
                                >
                                    Your browser does not support the video tag.
                                </video>
                            </div>

                            <div className="p-4 bg-slate-900 border-t border-slate-800 flex justify-between items-start gap-4">
                                <p className="text-slate-300 text-sm flex-1">{selectedVideo.description}</p>
                                <button
                                    onClick={() => {
                                        if (selectedVideo.description) {
                                            navigator.clipboard.writeText(selectedVideo.description)
                                            toast.success('Copied to clipboard')
                                        }
                                    }}
                                    className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition"
                                    title="Copy Description"
                                >
                                    <Copy size={16} />
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    )
}
