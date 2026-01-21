import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { supabase } from '../lib/supabase'
import { Clock, ArrowRight, Calendar } from 'lucide-react'
import { motion } from 'framer-motion'

interface BlogPost {
    id: string
    title: string
    slug: string
    meta_description: string | null
    reading_time: number
    keywords: string[]
    featured_image: string | null
    created_at: string
    author_name: string
}

export default function BlogListPage() {
    const [posts, setPosts] = useState<BlogPost[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchPosts = async () => {
            const { data, error } = await supabase
                .from('posts')
                .select('id, title, slug, meta_description, reading_time, keywords, featured_image, created_at, author_name')
                .eq('is_published', true)
                .order('created_at', { ascending: false })

            if (error) {
                console.error('Error fetching posts:', error)
            } else {
                setPosts(data || [])
            }
            setLoading(false)
        }

        fetchPosts()
    }, [])

    // Format date
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        })
    }

    // Animation variants
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    }

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.5 }
        }
    }

    // JSON-LD for blog listing
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Blog',
        name: 'Digital Squad Blog',
        description: 'Tips, strategi, dan insight tentang digital marketing untuk mengembangkan bisnis Anda.',
        url: 'https://digitalsquad.id/blog',
        publisher: {
            '@type': 'Organization',
            name: 'Digital Squad',
            logo: {
                '@type': 'ImageObject',
                url: '/android-chrome-512x512.png'
            }
        }
    }

    return (
        <>
            {/* SEO Meta Tags */}
            <Helmet>
                <title>Blog | Digital Squad - Tips & Strategi Digital Marketing</title>
                <meta name="description" content="Baca artikel terbaru tentang digital marketing, tips bisnis online, dan strategi untuk mengembangkan bisnis Anda bersama Digital Squad." />
                <meta name="keywords" content="digital marketing, tips bisnis, online marketing, strategi digital, digital squad" />

                {/* Open Graph */}
                <meta property="og:type" content="website" />
                <meta property="og:title" content="Blog | Digital Squad" />
                <meta property="og:description" content="Tips, strategi, dan insight tentang digital marketing untuk mengembangkan bisnis Anda." />
                <meta property="og:url" content="https://digitalsquad.id/blog" />
                <meta property="og:site_name" content="Digital Squad" />

                {/* Canonical URL */}
                <link rel="canonical" href="https://digitalsquad.id/blog" />

                {/* JSON-LD */}
                <script type="application/ld+json">
                    {JSON.stringify(jsonLd)}
                </script>
            </Helmet>

            {/* Page Content */}
            <div className="min-h-screen bg-slate-950 text-slate-100">
                {/* Navigation */}
                <nav className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-slate-800">
                    <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
                        <Link
                            to="/"
                            className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500"
                        >
                            Digital Squad
                        </Link>
                        <div className="flex items-center gap-6">
                            <Link to="/" className="text-slate-400 hover:text-white transition-colors">
                                Home
                            </Link>
                            <Link to="/blog" className="text-white font-medium">
                                Blog
                            </Link>
                        </div>
                    </div>
                </nav>

                {/* Header */}
                <header className="py-16 px-4 text-center bg-gradient-to-b from-slate-900 to-slate-950">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                            Blog
                        </h1>
                        <p className="text-slate-400 text-lg max-w-2xl mx-auto">
                            Tips, strategi, dan insight tentang digital marketing untuk mengembangkan bisnis Anda.
                        </p>
                    </motion.div>
                </header>

                {/* Blog Posts Grid */}
                <main className="max-w-6xl mx-auto px-4 py-12">
                    {loading ? (
                        <div className="flex justify-center py-12">
                            <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                        </div>
                    ) : posts.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-slate-400 text-lg">Belum ada artikel.</p>
                            <p className="text-slate-500 mt-2">Stay tuned untuk konten menarik!</p>
                        </div>
                    ) : (
                        <motion.div
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                            className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
                        >
                            {posts.map((post) => (
                                <motion.article
                                    key={post.id}
                                    variants={itemVariants}
                                    className="group"
                                >
                                    <Link to={`/blog/${post.slug}`}>
                                        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden hover:border-slate-700 transition-all hover:shadow-xl hover:shadow-blue-500/5 hover:-translate-y-1">
                                            {/* Image */}
                                            {post.featured_image && !post.featured_image.startsWith('/images/') ? (
                                                <div className="aspect-video overflow-hidden">
                                                    <img
                                                        src={post.featured_image}
                                                        alt={post.title}
                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                        onError={(e) => {
                                                            // Replace with fallback gradient
                                                            const parent = (e.target as HTMLImageElement).parentElement
                                                            if (parent) {
                                                                parent.innerHTML = '<div class="w-full h-full bg-gradient-to-br from-blue-600/20 to-purple-600/20 flex items-center justify-center"><span class="text-4xl">📝</span></div>'
                                                            }
                                                        }}
                                                    />
                                                </div>
                                            ) : (
                                                <div className="aspect-video bg-gradient-to-br from-blue-600/20 to-purple-600/20 flex items-center justify-center">
                                                    <span className="text-4xl">📝</span>
                                                </div>
                                            )}

                                            {/* Content */}
                                            <div className="p-6">
                                                <h2 className="text-xl font-bold text-white mb-3 group-hover:text-blue-400 transition-colors line-clamp-2">
                                                    {post.title}
                                                </h2>

                                                {post.meta_description && (
                                                    <p className="text-slate-400 text-sm mb-4 line-clamp-3">
                                                        {post.meta_description}
                                                    </p>
                                                )}

                                                {/* Meta */}
                                                <div className="flex items-center justify-between text-sm text-slate-500">
                                                    <div className="flex items-center gap-4">
                                                        <div className="flex items-center gap-1">
                                                            <Calendar size={14} />
                                                            <span>{formatDate(post.created_at)}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <Clock size={14} />
                                                            <span>{post.reading_time} min</span>
                                                        </div>
                                                    </div>
                                                    <ArrowRight size={16} className="text-blue-400 group-hover:translate-x-1 transition-transform" />
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                </motion.article>
                            ))}
                        </motion.div>
                    )}
                </main>

                {/* Footer */}
                <footer className="border-t border-slate-800 py-8 mt-12">
                    <div className="max-w-6xl mx-auto px-4 text-center text-slate-500 text-sm">
                        © {new Date().getFullYear()} Digital Squad. All rights reserved.
                    </div>
                </footer>
            </div>
        </>
    )
}
