import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Copy, Download, RefreshCw } from 'lucide-react'

export default function SitemapGenerator() {
    const [xml, setXml] = useState('')
    const [loading, setLoading] = useState(true)
    const [postCount, setPostCount] = useState(0)

    const generateSitemap = async () => {
        setLoading(true)
        const baseUrl = 'https://digitalsquad.id'
        const today = new Date().toISOString().split('T')[0]

        // Static routes
        const staticRoutes = [
            { path: '', priority: '1.0', changefreq: 'daily' },
            { path: '/blog', priority: '0.9', changefreq: 'daily' },
            { path: '/login', priority: '0.8', changefreq: 'monthly' },
            { path: '/payment', priority: '0.8', changefreq: 'monthly' },
        ]

        try {
            // Fetch blog posts
            const { data: posts, error } = await supabase
                .from('posts')
                .select('slug, updated_at, created_at, title, featured_image')
                .eq('is_published', true)
                .order('created_at', { ascending: false })

            if (error) throw error

            setPostCount(posts?.length || 0)

            let sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n'
            sitemap += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n'

            // Add static routes
            staticRoutes.forEach(route => {
                sitemap += '  <url>\n'
                sitemap += `    <loc>${baseUrl}${route.path}</loc>\n`
                sitemap += `    <lastmod>${today}</lastmod>\n`
                sitemap += `    <changefreq>${route.changefreq}</changefreq>\n`
                sitemap += `    <priority>${route.priority}</priority>\n`
                sitemap += '  </url>\n'
            })

            // Add blog posts
            posts?.forEach(post => {
                const date = new Date(post.updated_at || post.created_at).toISOString().split('T')[0]
                sitemap += '  <url>\n'
                sitemap += `    <loc>${baseUrl}/blog/${post.slug}</loc>\n`
                sitemap += `    <lastmod>${date}</lastmod>\n`
                sitemap += '    <changefreq>weekly</changefreq>\n'
                sitemap += '    <priority>0.7</priority>\n'

                // Add Featured Image for SEO
                if (post.featured_image) {
                    sitemap += '    <image:image>\n'
                    sitemap += `      <image:loc>${post.featured_image.startsWith('http') ? post.featured_image : baseUrl + post.featured_image}</image:loc>\n`
                    sitemap += `      <image:title>${post.title.replace(/&/g, '&amp;')}</image:title>\n`
                    sitemap += '    </image:image>\n'
                }

                sitemap += '  </url>\n'
            })

            sitemap += '</urlset>'
            setXml(sitemap)
        } catch (err) {
            console.error('Error generating sitemap:', err)
            setXml('Error generating sitemap. Check console.')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        generateSitemap()
    }, [])

    const handleCopy = () => {
        navigator.clipboard.writeText(xml)
        alert('Sitemap copied to clipboard!')
    }

    const handleDownload = () => {
        const blob = new Blob([xml], { type: 'text/xml' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'sitemap.xml'
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
    }

    return (
        <div className="min-h-screen bg-slate-950 text-white p-8">
            <div className="max-w-4xl mx-auto">
                <header className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">Sitemap Generator</h1>
                        <p className="text-slate-400">Generates sitemap.xml including all dynamic blog posts.</p>
                    </div>
                </header>

                <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 shadow-xl">
                    <div className="flex items-center justify-between mb-4">
                        <div className="text-sm text-slate-400">
                            Found <span className="text-blue-400 font-bold">{postCount}</span> published blog posts.
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={generateSitemap}
                                disabled={loading}
                                className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm transition-colors"
                            >
                                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                                Regenerate
                            </button>
                            <button
                                onClick={handleCopy}
                                disabled={loading}
                                className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm transition-colors"
                            >
                                <Copy size={16} />
                                Copy XML
                            </button>
                            <button
                                onClick={handleDownload}
                                disabled={loading}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm transition-colors"
                            >
                                <Download size={16} />
                                Download File
                            </button>
                        </div>
                    </div>

                    <div className="relative">
                        <pre className="w-full h-[600px] bg-slate-950 p-4 rounded-lg overflow-auto text-xs font-mono text-slate-300 border border-slate-800">
                            {loading ? 'Generating...' : xml}
                        </pre>
                    </div>

                    <div className="mt-6 p-4 bg-blue-900/20 border border-blue-500/20 rounded-lg">
                        <h3 className="text-blue-400 font-bold mb-2">Instructions:</h3>
                        <ol className="list-decimal list-inside text-sm text-slate-300 space-y-1">
                            <li>Check the generated XML above.</li>
                            <li>Click "Download File" to save as <code>sitemap.xml</code>.</li>
                            <li>Place this file in your project's <code>public/</code> folder, replacing the old one.</li>
                            <li>Re-deploy your project.</li>
                        </ol>
                    </div>
                </div>
            </div>
        </div>
    )
}
