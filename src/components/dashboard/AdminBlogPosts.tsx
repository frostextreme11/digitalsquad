import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { processSEO } from '../../lib/seoUtils'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import { useNavigate } from 'react-router-dom'
import {
    Plus, Edit, Trash2, Eye, EyeOff, ChevronDown, ChevronUp,
    Bold, Italic, List, ListOrdered, Image as ImageIcon, Link as LinkIcon,
    Heading1, Heading2, Undo, Redo, X, Globe
} from 'lucide-react'
import toast from 'react-hot-toast'

interface BlogPost {
    id: string
    title: string
    content: string
    slug: string
    meta_description: string | null
    reading_time: number
    keywords: string[]
    is_published: boolean
    author_name: string
    featured_image: string | null
    created_at: string
    updated_at: string
}

// Tiptap Editor Toolbar Component
function EditorToolbar({ editor }: { editor: any }) {
    if (!editor) return null

    const addImage = () => {
        const url = window.prompt('Enter image URL:')
        if (url) {
            editor.chain().focus().setImage({ src: url }).run()
        }
    }

    const addLink = () => {
        const url = window.prompt('Enter link URL:')
        if (url) {
            editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
        }
    }

    const buttonClass = (isActive: boolean) =>
        `p-2 rounded-lg transition-colors ${isActive
            ? 'bg-blue-500/20 text-blue-400'
            : 'text-slate-400 hover:text-white hover:bg-slate-700'
        }`

    return (
        <div className="flex flex-wrap gap-1 p-2 border-b border-slate-700 bg-slate-800/50">
            <button
                type="button"
                onClick={() => editor.chain().focus().toggleBold().run()}
                className={buttonClass(editor.isActive('bold'))}
                title="Bold"
            >
                <Bold size={18} />
            </button>
            <button
                type="button"
                onClick={() => editor.chain().focus().toggleItalic().run()}
                className={buttonClass(editor.isActive('italic'))}
                title="Italic"
            >
                <Italic size={18} />
            </button>
            <div className="w-px h-6 bg-slate-600 mx-1 self-center" />
            <button
                type="button"
                onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                className={buttonClass(editor.isActive('heading', { level: 1 }))}
                title="Heading 1"
            >
                <Heading1 size={18} />
            </button>
            <button
                type="button"
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                className={buttonClass(editor.isActive('heading', { level: 2 }))}
                title="Heading 2"
            >
                <Heading2 size={18} />
            </button>
            <div className="w-px h-6 bg-slate-600 mx-1 self-center" />
            <button
                type="button"
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                className={buttonClass(editor.isActive('bulletList'))}
                title="Bullet List"
            >
                <List size={18} />
            </button>
            <button
                type="button"
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                className={buttonClass(editor.isActive('orderedList'))}
                title="Numbered List"
            >
                <ListOrdered size={18} />
            </button>
            <div className="w-px h-6 bg-slate-600 mx-1 self-center" />
            <button
                type="button"
                onClick={addLink}
                className={buttonClass(editor.isActive('link'))}
                title="Add Link"
            >
                <LinkIcon size={18} />
            </button>
            <button
                type="button"
                onClick={addImage}
                className={buttonClass(false)}
                title="Add Image"
            >
                <ImageIcon size={18} />
            </button>
            <div className="w-px h-6 bg-slate-600 mx-1 self-center" />
            <button
                type="button"
                onClick={() => editor.chain().focus().undo().run()}
                disabled={!editor.can().undo()}
                className={`${buttonClass(false)} disabled:opacity-30`}
                title="Undo"
            >
                <Undo size={18} />
            </button>
            <button
                type="button"
                onClick={() => editor.chain().focus().redo().run()}
                disabled={!editor.can().redo()}
                className={`${buttonClass(false)} disabled:opacity-30`}
                title="Redo"
            >
                <Redo size={18} />
            </button>
        </div>
    )
}

// SEO Preview Accordion Component
function SEOPreview({
    slug,
    metaDescription,
    readingTime,
    keywords
}: {
    slug: string
    metaDescription: string
    readingTime: number
    keywords: string[]
}) {
    const [isOpen, setIsOpen] = useState(false)

    return (
        <div className="border border-slate-700 rounded-xl overflow-hidden">
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-4 bg-slate-800/50 hover:bg-slate-800 transition-colors"
            >
                <span className="font-medium text-slate-300">SEO Preview</span>
                {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
            {isOpen && (
                <div className="p-4 space-y-4 bg-slate-900/50">
                    <div>
                        <label className="text-xs uppercase tracking-wider text-slate-500 font-semibold">Slug (URL)</label>
                        <p className="text-blue-400 font-mono text-sm mt-1">/blog/{slug || 'your-post-slug'}</p>
                    </div>
                    <div>
                        <label className="text-xs uppercase tracking-wider text-slate-500 font-semibold">Meta Description</label>
                        <p className="text-slate-300 text-sm mt-1">{metaDescription || 'Auto-generated from content...'}</p>
                        <span className="text-xs text-slate-500">{metaDescription.length}/155 characters</span>
                    </div>
                    <div>
                        <label className="text-xs uppercase tracking-wider text-slate-500 font-semibold">Reading Time</label>
                        <p className="text-slate-300 text-sm mt-1">{readingTime} min read</p>
                    </div>
                    <div>
                        <label className="text-xs uppercase tracking-wider text-slate-500 font-semibold">Keywords</label>
                        <div className="flex flex-wrap gap-2 mt-2">
                            {keywords.length > 0 ? keywords.map((keyword, i) => (
                                <span key={i} className="px-2 py-1 bg-slate-700 rounded-lg text-xs text-slate-300">
                                    {keyword}
                                </span>
                            )) : (
                                <span className="text-slate-500 text-sm">Auto-extracted from content...</span>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default function AdminBlogPosts() {
    const navigate = useNavigate()
    const [posts, setPosts] = useState<BlogPost[]>([])
    const [loading, setLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingPost, setEditingPost] = useState<BlogPost | null>(null)
    const [saving, setSaving] = useState(false)

    // Form state
    const [title, setTitle] = useState('')
    const [isPublished, setIsPublished] = useState(false)

    // SEO preview state (computed in real-time)
    const [seoPreview, setSeoPreview] = useState({
        slug: '',
        meta_description: '',
        reading_time: 1,
        keywords: [] as string[]
    })

    // Tiptap Editor
    const editor = useEditor({
        extensions: [
            StarterKit,
            Image.configure({
                HTMLAttributes: {
                    class: 'rounded-lg max-w-full',
                },
            }),
            Link.configure({
                openOnClick: false,
                HTMLAttributes: {
                    class: 'text-blue-400 underline',
                },
            }),
            Placeholder.configure({
                placeholder: 'Write your blog post content here...',
            }),
        ],
        content: '',
        editorProps: {
            attributes: {
                class: 'prose prose-invert max-w-none p-4 min-h-[300px] focus:outline-none',
            },
        },
        onUpdate: ({ editor }) => {
            updateSEOPreview(title, editor.getHTML())
        },
    })

    // Update SEO preview when title or content changes
    const updateSEOPreview = (newTitle: string, content: string) => {
        const seoFields = processSEO(newTitle, content)
        setSeoPreview({
            slug: seoFields.slug,
            meta_description: seoFields.meta_description,
            reading_time: seoFields.reading_time,
            keywords: seoFields.keywords
        })
    }

    // Handle title change
    const handleTitleChange = (newTitle: string) => {
        setTitle(newTitle)
        updateSEOPreview(newTitle, editor?.getHTML() || '')
    }

    // Fetch posts
    const fetchPosts = async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from('posts')
            .select('*')
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Error fetching posts:', error)
            toast.error('Failed to load blog posts')
        } else {
            setPosts(data || [])
        }
        setLoading(false)
    }

    useEffect(() => {
        fetchPosts()
    }, [])

    // Reset form
    const resetForm = () => {
        setTitle('')
        setIsPublished(false)
        setSeoPreview({ slug: '', meta_description: '', reading_time: 1, keywords: [] })
        editor?.commands.setContent('')
        setEditingPost(null)
    }

    // Open modal for create
    const handleCreate = () => {
        resetForm()
        setIsModalOpen(true)
    }

    // Open modal for edit
    const handleEdit = (post: BlogPost) => {
        setEditingPost(post)
        setTitle(post.title)
        setIsPublished(post.is_published)
        editor?.commands.setContent(post.content)
        updateSEOPreview(post.title, post.content)
        setIsModalOpen(true)
    }

    // Delete post
    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this post?')) return

        const { error } = await supabase.from('posts').delete().eq('id', id)
        if (error) {
            toast.error('Failed to delete post')
        } else {
            toast.success('Post deleted successfully')
            fetchPosts()
        }
    }

    // Toggle publish status
    const handleTogglePublish = async (post: BlogPost) => {
        const { error } = await supabase
            .from('posts')
            .update({ is_published: !post.is_published })
            .eq('id', post.id)

        if (error) {
            toast.error('Failed to update post status')
        } else {
            toast.success(post.is_published ? 'Post unpublished' : 'Post published')
            fetchPosts()
        }
    }

    // Save post
    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!title.trim()) {
            toast.error('Please enter a title')
            return
        }

        const content = editor?.getHTML() || ''
        if (!content || content === '<p></p>') {
            toast.error('Please add some content')
            return
        }

        setSaving(true)

        // Generate SEO fields
        const seoFields = processSEO(title, content)

        const payload = {
            title: title.trim(),
            content,
            slug: seoFields.slug,
            meta_description: seoFields.meta_description,
            reading_time: seoFields.reading_time,
            keywords: seoFields.keywords,
            featured_image: seoFields.featured_image,
            is_published: isPublished,
        }

        try {
            if (editingPost) {
                // Update existing post
                const { error } = await supabase
                    .from('posts')
                    .update(payload)
                    .eq('id', editingPost.id)

                if (error) throw error
                toast.success('Post updated successfully')
            } else {
                // Create new post
                const { error } = await supabase
                    .from('posts')
                    .insert(payload)

                if (error) throw error
                toast.success('Post created successfully')
            }

            setIsModalOpen(false)
            resetForm()
            fetchPosts()
        } catch (error: any) {
            console.error('Error saving post:', error)
            if (error.code === '23505') {
                toast.error('A post with this title/slug already exists')
            } else {
                toast.error('Failed to save post')
            }
        } finally {
            setSaving(false)
        }
    }

    // Format date
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        })
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Blog Posts</h1>
                    <p className="text-slate-400 text-sm mt-1">Manage your blog content</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => navigate('/admin/sitemap-generator')}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl transition-colors"
                    >
                        <Globe size={20} />
                        Sitemap
                    </button>
                    <button
                        onClick={handleCreate}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors"
                    >
                        <Plus size={20} />
                        New Post
                    </button>
                </div>
            </div>

            {/* Posts List */}
            {loading ? (
                <div className="text-center py-12 text-slate-400">Loading...</div>
            ) : posts.length === 0 ? (
                <div className="text-center py-12">
                    <p className="text-slate-400 mb-4">No blog posts yet</p>
                    <button
                        onClick={handleCreate}
                        className="text-blue-400 hover:text-blue-300 underline"
                    >
                        Create your first post
                    </button>
                </div>
            ) : (
                <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-slate-800">
                                <th className="text-left p-4 text-slate-400 font-medium text-sm">Title</th>
                                <th className="text-left p-4 text-slate-400 font-medium text-sm hidden md:table-cell">Status</th>
                                <th className="text-left p-4 text-slate-400 font-medium text-sm hidden md:table-cell">Reading Time</th>
                                <th className="text-left p-4 text-slate-400 font-medium text-sm hidden lg:table-cell">Created</th>
                                <th className="text-right p-4 text-slate-400 font-medium text-sm">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {posts.map((post) => (
                                <tr key={post.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                                    <td className="p-4">
                                        <p className="font-medium text-white">{post.title}</p>
                                        <p className="text-sm text-slate-500 font-mono">/blog/{post.slug}</p>
                                    </td>
                                    <td className="p-4 hidden md:table-cell">
                                        <span className={`px-2 py-1 rounded-lg text-xs font-medium ${post.is_published
                                            ? 'bg-green-500/20 text-green-400'
                                            : 'bg-yellow-500/20 text-yellow-400'
                                            }`}>
                                            {post.is_published ? 'Published' : 'Draft'}
                                        </span>
                                    </td>
                                    <td className="p-4 text-slate-300 hidden md:table-cell">{post.reading_time} min</td>
                                    <td className="p-4 text-slate-400 hidden lg:table-cell">{formatDate(post.created_at)}</td>
                                    <td className="p-4">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => handleTogglePublish(post)}
                                                className={`p-2 rounded-lg transition-colors ${post.is_published
                                                    ? 'text-yellow-400 hover:bg-yellow-500/20'
                                                    : 'text-green-400 hover:bg-green-500/20'
                                                    }`}
                                                title={post.is_published ? 'Unpublish' : 'Publish'}
                                            >
                                                {post.is_published ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                            <button
                                                onClick={() => handleEdit(post)}
                                                className="p-2 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-colors"
                                                title="Edit"
                                            >
                                                <Edit size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(post.id)}
                                                className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                                                title="Delete"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Create/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 backdrop-blur-sm p-4 pt-20">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-4xl mb-10">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-6 border-b border-slate-800">
                            <h2 className="text-xl font-bold text-white">
                                {editingPost ? 'Edit Post' : 'Create New Post'}
                            </h2>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <form onSubmit={handleSave} className="p-6 space-y-6">
                            {/* Title Input */}
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Title <span className="text-red-400">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => handleTitleChange(e.target.value)}
                                    placeholder="Enter your post title..."
                                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                />
                            </div>

                            {/* Content Editor */}
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Content <span className="text-red-400">*</span>
                                </label>
                                <div className="border border-slate-700 rounded-xl overflow-hidden">
                                    <EditorToolbar editor={editor} />
                                    <EditorContent editor={editor} />
                                </div>
                            </div>

                            {/* Publish Toggle */}
                            <div className="flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsPublished(!isPublished)}
                                    className={`relative w-12 h-6 rounded-full transition-colors ${isPublished ? 'bg-green-500' : 'bg-slate-600'
                                        }`}
                                >
                                    <span
                                        className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${isPublished ? 'translate-x-6' : ''
                                            }`}
                                    />
                                </button>
                                <span className="text-slate-300">
                                    {isPublished ? 'Published' : 'Draft'}
                                </span>
                            </div>

                            {/* SEO Preview */}
                            <SEOPreview
                                slug={seoPreview.slug}
                                metaDescription={seoPreview.meta_description}
                                readingTime={seoPreview.reading_time}
                                keywords={seoPreview.keywords}
                            />

                            {/* Submit Button */}
                            <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-6 py-3 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {saving ? (
                                        <>
                                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        editingPost ? 'Update Post' : 'Create Post'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Editor Styles */}
            <style>{`
        .ProseMirror {
          min-height: 300px;
        }
        .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          color: #64748b;
          pointer-events: none;
          position: absolute;
        }
        .ProseMirror h1 {
          font-size: 2em;
          font-weight: bold;
          margin-top: 1em;
          margin-bottom: 0.5em;
        }
        .ProseMirror h2 {
          font-size: 1.5em;
          font-weight: bold;
          margin-top: 1em;
          margin-bottom: 0.5em;
        }
        .ProseMirror ul, .ProseMirror ol {
          padding-left: 1.5em;
          margin: 0.5em 0;
        }
        .ProseMirror li {
          margin: 0.25em 0;
        }
        .ProseMirror img {
          max-width: 100%;
          height: auto;
          margin: 1em 0;
        }
      `}</style>
        </div>
    )
}
