import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../../lib/supabase'
import type { AcademyPostWithProgress, AcademyPost } from '../../types/academy'
import { CheckCircle, FileText, Download, Copy, ChevronDown, ChevronUp } from 'lucide-react'
import confetti from 'canvas-confetti'

export default function AcademyList() {
    const [modules, setModules] = useState<AcademyPostWithProgress[]>([])
    const [loading, setLoading] = useState(true)
    const [expandedId, setExpandedId] = useState<string | null>(null)
    const [completingId, setCompletingId] = useState<string | null>(null)

    useEffect(() => {
        fetchModules()
    }, [])

    const fetchModules = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            // Fetch all active posts
            const { data: posts, error: postsError } = await supabase
                .from('academy_posts')
                .select('*')
                .eq('is_active', true)
                .order('order_index', { ascending: true })

            if (postsError) throw postsError

            // Fetch user progress
            const { data: progress, error: progressError } = await supabase
                .from('academy_progress')
                .select('post_id')
                .eq('user_id', user.id)

            if (progressError) throw progressError

            const completedIds = new Set(progress?.map(p => p.post_id))

            const formattedModules = posts.map((post: AcademyPost) => ({
                ...post,
                is_completed: completedIds.has(post.id)
            }))

            setModules(formattedModules)
        } catch (error) {
            console.error('Error fetching academy modules:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleComplete = async (moduleId: string) => {
        try {
            setCompletingId(moduleId)
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { error } = await supabase
                .from('academy_progress')
                .insert({
                    user_id: user.id,
                    post_id: moduleId
                })

            if (error) throw error

            // Optimistic update
            setModules(prev => prev.map(m =>
                m.id === moduleId ? { ...m, is_completed: true } : m
            ))

            // Celebration effect
            confetti({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#FFD700', '#FFA500', '#FF4500', '#00ff00', '#00bfff']
            })

        } catch (error) {
            console.error('Error completing module:', error)
        } finally {
            setCompletingId(null)
        }
    }

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text)
        // Could add a toast here
    }

    const toggleExpand = (id: string) => {
        setExpandedId(expandedId === id ? null : id)
    }

    const progressPercentage = modules.length > 0
        ? Math.round((modules.filter(m => m.is_completed).length / modules.length) * 100)
        : 0

    if (loading) return <div className="text-white p-8">Loading Academy...</div>

    return (
        <div className="space-y-6 pb-20">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-white">Digital Squad Academy</h2>
                    <p className="text-slate-400">Level Up Your Skills</p>
                </div>
                <div className="text-right">
                    <div className="text-3xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                        {progressPercentage}%
                    </div>
                    <div className="text-xs text-slate-500 uppercase tracking-wider">Progress</div>
                </div>
            </div>

            <div className="w-full bg-slate-800/50 rounded-full h-2 mb-8">
                <motion.div
                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercentage}%` }}
                    transition={{ duration: 1 }}
                />
            </div>

            <div className="grid gap-4">
                {modules.map((module, index) => (
                    <motion.div
                        key={module.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={`bg-slate-900 border ${module.is_completed ? 'border-green-500/30' : 'border-slate-800'} rounded-xl overflow-hidden`}
                    >
                        <div
                            onClick={() => toggleExpand(module.id)}
                            className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-800/50 transition-colors"
                        >
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${module.is_completed ? 'bg-green-500/20 text-green-400' : 'bg-slate-800 text-slate-400'}`}>
                                    {module.is_completed ? <CheckCircle size={20} /> : <span className="font-bold">{index + 1}</span>}
                                </div>
                                <div>
                                    <h3 className={`font-semibold ${module.is_completed ? 'text-green-400' : 'text-white'}`}>
                                        {module.title}
                                    </h3>
                                    {module.level_badge && (
                                        <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 mt-1 inline-block">
                                            {module.level_badge}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div>
                                {expandedId === module.id ? <ChevronUp size={20} className="text-slate-400" /> : <ChevronDown size={20} className="text-slate-400" />}
                            </div>
                        </div>

                        <AnimatePresence>
                            {expandedId === module.id && (
                                <motion.div
                                    initial={{ height: 0 }}
                                    animate={{ height: 'auto' }}
                                    exit={{ height: 0 }}
                                    className="overflow-hidden"
                                >
                                    <div className="p-4 pt-0 border-t border-slate-800/50 space-y-4">

                                        {/* Video Section */}
                                        {module.video_url && (
                                            <div className="aspect-video bg-black rounded-lg overflow-hidden mt-4">
                                                <iframe
                                                    src={module.video_url.replace('watch?v=', 'embed/')}
                                                    className="w-full h-full"
                                                    allowFullScreen
                                                    title={module.title}
                                                />
                                            </div>
                                        )}

                                        {/* Description */}
                                        {module.description && (
                                            <div className="prose prose-invert max-w-none text-sm text-slate-300 mt-4" dangerouslySetInnerHTML={{ __html: module.description }} />
                                        )}

                                        {/* Copyable Text */}
                                        {module.copyable_text && (
                                            <div className="bg-slate-950 p-4 rounded-lg flex items-start justify-between gap-4 border border-slate-800">
                                                <code className="text-sm text-blue-300 font-mono break-all">
                                                    {module.copyable_text}
                                                </code>
                                                <button
                                                    onClick={() => copyToClipboard(module.copyable_text!)}
                                                    className="p-2 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors"
                                                    title="Copy to clipboard"
                                                >
                                                    <Copy size={16} />
                                                </button>
                                            </div>
                                        )}

                                        {/* Attachment */}
                                        {module.attachment_url && (
                                            <a
                                                href={module.attachment_url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm font-medium p-3 bg-blue-500/10 rounded-lg border border-blue-500/20"
                                            >
                                                <Download size={16} />
                                                Download Resource
                                            </a>
                                        )}

                                        {/* Mission */}
                                        {module.mission_text && (
                                            <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-lg">
                                                <h4 className="text-yellow-500 font-bold mb-2 flex items-center gap-2">
                                                    <FileText size={16} /> Mission
                                                </h4>
                                                <p className="text-slate-300 text-sm">{module.mission_text}</p>
                                            </div>
                                        )}

                                        {/* Action */}
                                        {!module.is_completed && (
                                            <div className="pt-4 flex justify-end">
                                                <button
                                                    onClick={() => handleComplete(module.id)}
                                                    disabled={completingId === module.id}
                                                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white px-6 py-2 rounded-lg font-medium transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    {completingId === module.id ? 'Completing...' : 'Mark as Complete'}
                                                </button>
                                            </div>
                                        )}

                                        {module.is_completed && (
                                            <div className="pt-4 flex justify-end">
                                                <div className="px-4 py-2 bg-green-500/10 text-green-400 rounded-lg text-sm font-medium flex items-center gap-2">
                                                    <CheckCircle size={16} /> Completed
                                                </div>
                                            </div>
                                        )}

                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                ))}
            </div>
        </div>
    )
}
