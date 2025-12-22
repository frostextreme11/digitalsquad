import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import type { AcademyPost } from '../../types/academy'
import { Plus, Edit, Trash2, ChevronUp, ChevronDown, Video, Link, AlignLeft, Info } from 'lucide-react'

export default function AdminAcademy() {
    const [posts, setPosts] = useState<AcademyPost[]>([])
    const [loading, setLoading] = useState(true)
    const [isEditing, setIsEditing] = useState(false)
    const [currentPost, setCurrentPost] = useState<Partial<AcademyPost>>({})

    const fetchPosts = async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from('academy_posts')
            .select('*')
            .order('order_index', { ascending: true })

        if (error) {
            console.error('Error fetching posts:', error)
        } else {
            setPosts(data || [])
        }
        setLoading(false)
    }

    useEffect(() => {
        fetchPosts()
    }, [])

    const handleCreate = () => {
        setCurrentPost({
            title: '',
            description: '',
            video_url: '',
            attachment_url: '',
            mission_text: '',
            copyable_text: '',
            level_badge: '',
            order_index: posts.length,
            is_active: true
        })
        setIsEditing(true)
    }

    const handleEdit = (post: AcademyPost) => {
        setCurrentPost(post)
        setIsEditing(true)
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this module?')) return

        const { error } = await supabase
            .from('academy_posts')
            .delete()
            .eq('id', id)

        if (error) {
            console.error('Error deleting post:', error)
            alert('Failed to delete module')
        } else {
            fetchPosts()
        }
    }

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()

        // Auto format Youtube URL if needed
        let videoUrl = currentPost.video_url
        if (videoUrl && videoUrl.includes('youtube.com/watch?v=')) {
            // keep as is, will rely on embed replacement in view
        } else if (videoUrl && videoUrl.includes('youtu.be/')) {
            const id = videoUrl.split('youtu.be/')[1]
            videoUrl = `https://www.youtube.com/watch?v=${id}`
        }

        if (!currentPost.title) {
            alert('Title is required')
            return
        }

        // Explicitly construct payload to avoid 'any' type
        const payload = {
            title: currentPost.title,
            description: currentPost.description,
            video_url: videoUrl,
            attachment_url: currentPost.attachment_url,
            mission_text: currentPost.mission_text,
            copyable_text: currentPost.copyable_text,
            level_badge: currentPost.level_badge,
            order_index: currentPost.order_index,
            is_active: currentPost.is_active
        }

        if (currentPost.id) {
            const { error } = await supabase
                .from('academy_posts')
                .update(payload)
                .eq('id', currentPost.id)

            if (error) {
                alert('Failed to update module')
                console.error(error)
                return
            }
        } else {
            const { error } = await supabase
                .from('academy_posts')
                .insert(payload)

            if (error) {
                alert('Failed to create module')
                console.error(error)
                return
            }
        }

        setIsEditing(false)
        fetchPosts()
    }

    const handleMove = async (index: number, direction: 'up' | 'down') => {
        if (direction === 'up' && index === 0) return
        if (direction === 'down' && index === posts.length - 1) return

        const newPosts = [...posts]
        const swapIndex = direction === 'up' ? index - 1 : index + 1

        const temp = newPosts[index]
        newPosts[index] = newPosts[swapIndex]
        newPosts[swapIndex] = temp

        // Update local state primarily for visual feedback
        setPosts(newPosts)

        // Update DB
        // Ideally use a batch update or stored procedure, but simple loop for now is fine for small lists
        for (let i = 0; i < newPosts.length; i++) {
            await supabase
                .from('academy_posts')
                .update({ order_index: i })
                .eq('id', newPosts[i].id)
        }
    }

    if (loading && !isEditing) return <div className="text-white">Loading...</div>

    return (
        <div className="text-white space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Academy Management</h2>
                <button
                    onClick={handleCreate}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                >
                    <Plus size={20} /> Add Module
                </button>
            </div>

            {isEditing ? (
                <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
                    <h3 className="text-xl font-bold mb-6">{currentPost.id ? 'Edit Module' : 'New Module'}</h3>
                    <form onSubmit={handleSave} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1">Title</label>
                            <input
                                required
                                type="text"
                                value={currentPost.title || ''}
                                onChange={e => setCurrentPost({ ...currentPost, title: e.target.value })}
                                className="w-full bg-slate-800 border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1">Description (HTML supported)</label>
                            <textarea
                                rows={4}
                                value={currentPost.description || ''}
                                onChange={e => setCurrentPost({ ...currentPost, description: e.target.value })}
                                className="w-full bg-slate-800 border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1"><Video size={14} className="inline mr-1" /> Youtube URL</label>
                                <input
                                    type="url"
                                    value={currentPost.video_url || ''}
                                    onChange={e => setCurrentPost({ ...currentPost, video_url: e.target.value })}
                                    className="w-full bg-slate-800 border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                                    placeholder="https://youtube.com/..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1"><Link size={14} className="inline mr-1" /> Attachment URL</label>
                                <input
                                    type="url"
                                    value={currentPost.attachment_url || ''}
                                    onChange={e => setCurrentPost({ ...currentPost, attachment_url: e.target.value })}
                                    className="w-full bg-slate-800 border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1"><Info size={14} className="inline mr-1" /> Mission / Action required</label>
                            <input
                                type="text"
                                value={currentPost.mission_text || ''}
                                onChange={e => setCurrentPost({ ...currentPost, mission_text: e.target.value })}
                                className="w-full bg-slate-800 border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                                placeholder="Ex: Watch this video and join the telegram group"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1"><AlignLeft size={14} className="inline mr-1" /> Copyable Text (User can one-click copy this)</label>
                            <textarea
                                rows={2}
                                value={currentPost.copyable_text || ''}
                                onChange={e => setCurrentPost({ ...currentPost, copyable_text: e.target.value })}
                                className="w-full bg-slate-800 border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                                placeholder="Ex: Promotional script..."
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1">Level Badge Name</label>
                            <input
                                type="text"
                                value={currentPost.level_badge || ''}
                                onChange={e => setCurrentPost({ ...currentPost, level_badge: e.target.value })}
                                className="w-full bg-slate-800 border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                                placeholder="Ex: Beginner"
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="is_active"
                                checked={currentPost.is_active}
                                onChange={e => setCurrentPost({ ...currentPost, is_active: e.target.checked })}
                                className="w-4 h-4 rounded"
                            />
                            <label htmlFor="is_active" className="text-sm font-medium text-slate-400">Published (Visible to agents)</label>
                        </div>

                        <div className="flex justify-end gap-3 pt-4">
                            <button
                                type="button"
                                onClick={() => setIsEditing(false)}
                                className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg"
                            >
                                {currentPost.id ? 'Save Changes' : 'Create Module'}
                            </button>
                        </div>
                    </form>
                </div>
            ) : (
                <div className="space-y-2">
                    {posts.map((post, index) => (
                        <div key={post.id} className="bg-slate-800/50 p-4 rounded-lg flex items-center gap-4 group">
                            <div className="flex flex-col gap-1 text-slate-500">
                                <button onClick={() => handleMove(index, 'up')} className="hover:text-white disabled:opacity-30" disabled={index === 0}><ChevronUp size={16} /></button>
                                <button onClick={() => handleMove(index, 'down')} className="hover:text-white disabled:opacity-30" disabled={index === posts.length - 1}><ChevronDown size={16} /></button>
                            </div>
                            <div className="h-8 w-8 bg-slate-700 rounded flex items-center justify-center text-sm font-bold">
                                {index + 1}
                            </div>
                            <div className="flex-1">
                                <h4 className="font-semibold text-white">{post.title}</h4>
                                <div className="text-xs text-slate-400 flex gap-3 mt-1">
                                    {post.level_badge && <span className="bg-slate-700 px-1.5 rounded">{post.level_badge}</span>}
                                    <span>{post.is_active ? 'Active' : 'Draft'}</span>
                                </div>
                            </div>
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => handleEdit(post)} className="p-2 hover:bg-slate-700 rounded text-blue-400"><Edit size={18} /></button>
                                <button onClick={() => handleDelete(post.id)} className="p-2 hover:bg-slate-700 rounded text-red-400"><Trash2 size={18} /></button>
                            </div>
                        </div>
                    ))}
                    {posts.length === 0 && (
                        <div className="text-center py-12 text-slate-500">No modules yet. Create one to get started.</div>
                    )}
                </div>
            )}
        </div>
    )
}
