import { useEffect, useState, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { supabase } from '../lib/supabase'
import { ArrowLeft, Clock, Calendar, User, Tag } from 'lucide-react'
import { Marked } from 'marked'

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

// Default OG image fallback
const DEFAULT_OG_IMAGE = '/og-default.jpg'

// Extract first image from HTML or Markdown content
function extractFirstImage(content: string): string | null {
    // Strip YAML frontmatter first - handle both Unix and Windows line endings
    let cleanContent = content.replace(/^---[\r\n]+[\s\S]*?[\r\n]+---[\r\n]+/, '')

    // Also try alternative frontmatter pattern
    if (cleanContent.startsWith('---')) {
        const endIndex = cleanContent.indexOf('---', 3)
        if (endIndex !== -1) {
            cleanContent = cleanContent.substring(endIndex + 3).trim()
        }
    }

    // Try HTML img tag first
    const htmlMatch = cleanContent.match(/<img[^>]+src=["']([^"']+)["']/i)
    if (htmlMatch && !htmlMatch[1].startsWith('/images/')) return htmlMatch[1]

    // Try Markdown image syntax ![alt](url)
    const mdMatch = cleanContent.match(/!\[.*?\]\(([^)]+)\)/)
    if (mdMatch && !mdMatch[1].startsWith('/images/')) return mdMatch[1]

    return null
}

export default function BlogPostPage() {
    const { slug } = useParams<{ slug: string }>()
    const [post, setPost] = useState<BlogPost | null>(null)
    const [loading, setLoading] = useState(true)
    const [notFound, setNotFound] = useState(false)

    useEffect(() => {
        const fetchPost = async () => {
            if (!slug) {
                setNotFound(true)
                setLoading(false)
                return
            }

            const { data, error } = await supabase
                .from('posts')
                .select('*')
                .eq('slug', slug)
                .eq('is_published', true)
                .single()

            if (error || !data) {
                setNotFound(true)
            } else {
                setPost(data)
            }
            setLoading(false)
        }

        fetchPost()
    }, [slug])

    // Parse markdown content to HTML (must be before any early returns)
    const parsedContent = useMemo(() => {
        if (!post) return ''

        let content = post.content

        console.log('Original content (first 300 chars):', content.substring(0, 300))

        // STEP 1: Process HTML from Tiptap and convert to clean markdown
        // Tiptap outputs HTML, so we need to convert relevant tags BACK to markdown

        // First, decode any HTML entities
        content = content
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/&nbsp;/g, ' ')

        // Check if content has HTML tags (from Tiptap)
        if (content.includes('<')) {
            console.log('Content has HTML tags, converting to markdown...')

            // STEP 1a: Convert HTML formatting to markdown equivalents
            // Convert <strong> to ** (markdown bold)
            content = content.replace(/<strong>([^<]*)<\/strong>/gi, '**$1**')

            // Convert <em> to * (markdown italic)
            content = content.replace(/<em>([^<]*)<\/em>/gi, '*$1*')

            // Convert <a> tags to markdown links [text](url)
            // This handles Tiptap's auto-linked URLs
            content = content.replace(/<a[^>]+href=["']([^"']+)["'][^>]*>([^<]*)<\/a>/gi, (_m, url, text) => {
                return `[${text}](${url})`
            })

            // Convert headings
            content = content.replace(/<h1[^>]*>([^<]*)<\/h1>/gi, '# $1')
            content = content.replace(/<h2[^>]*>([^<]*)<\/h2>/gi, '## $1')
            content = content.replace(/<h3[^>]*>([^<]*)<\/h3>/gi, '### $1')
            content = content.replace(/<h4[^>]*>([^<]*)<\/h4>/gi, '#### $1')

            // Convert blockquotes
            content = content.replace(/<blockquote[^>]*>([^<]*)<\/blockquote>/gi, '> $1')

            // Convert list items
            content = content.replace(/<li[^>]*>([^<]*)<\/li>/gi, '- $1')

            // STEP 1b: Fix markdown links that got broken by paragraph tags
            // Pattern: [text]</p><p>(url) -> [text](url)
            content = content.replace(/\](<\/p>\s*<p>)\s*\(/gi, '](')
            content = content.replace(/\]\s*<\/p>\s*<p>\s*\(/gi, '](')

            // Fix text inside brackets broken by p tags
            content = content.replace(/\[([^\]]*)<\/p>\s*<p>([^\]]*)\]/gi, '[$1 $2]')

            // Remove <br> tags - replace with newline
            content = content.replace(/<br\s*\/?>/gi, '\n')

            // Convert paragraph breaks to double newlines
            content = content.replace(/<\/p>\s*<p>/gi, '\n\n')

            // Remove remaining p tags
            content = content.replace(/<\/?p>/gi, '')

            // Remove list wrapper tags
            content = content.replace(/<\/?[ou]l[^>]*>/gi, '')

            // Remove any remaining HTML tags but keep their content
            content = content.replace(/<[^>]+>/g, '')

            // Clean up excessive whitespace
            content = content.replace(/\n{3,}/g, '\n\n')
            content = content.trim()
        }

        // STEP 1c: Fix malformed nested markdown links (CAREFUL - be specific, not greedy!)

        // Fix: [**[text](url) -> [**text**](url)
        // Pattern: [**[DigitalSquad](http://DigitalSquad.id) -> [**DigitalSquad**](https://digitalsquad.id)
        // Only matches if [** is followed immediately by another [
        content = content.replace(/\[\*\*\[([^\]]+)\]\(([^)]+)\)/g, '[**$1**]($2)')

        // Fix: ]([https://url](https://url)) -> ](https://url)
        // Only when there's [https:// or [http:// inside the parentheses (double-link pattern)
        content = content.replace(/\]\(\[https?:\/\/[^\]]+\]\((https?:\/\/[^)]+)\)\)/g, ']($1)')

        // Fix: ](url](url) pattern - but ONLY for URLs (starts with http)
        // Pattern: ](http://url1](https://url2) -> ](https://url2)
        content = content.replace(/\]\(https?:\/\/[^\s\]]+\]\((https?:\/\/[^)]+)\)/g, ']($1)')

        // Fix: [>> text [**url)**](url) -> [>> text <<](url)
        // This handles the case where << was converted to a bolded link
        content = content.replace(/\[\*\*https?:\/\/[^\]]*\)\*\*\]/g, '<<]')

        // Also handle without the closing **
        content = content.replace(/ \[\*\*https?:\/\/[^\]]+\)\*\*\]\(/g, ' <<](')

        // Clean up orphaned **) that might be left after the link
        // Pattern: ](url)**) -> ](url)
        content = content.replace(/\]\(([^)]+)\)\*\*\)/g, ']($1)')

        // Also clean up standalone **) that appears after links
        content = content.replace(/\)\s*\*\*\)/g, ')')

        console.log('After HTML strip (first 300 chars):', content.substring(0, 300))

        // DEBUG: Find CTA links in content
        const ctaMatch = content.match(/\[.*?(>>|<<|\*\*).*?\]\([^)]+\)/g)
        console.log('CTA links found after HTML strip:', ctaMatch)

        // DEBUG: Search for digitalsquad.id URLs
        const urlMatch = content.match(/digitalsquad\.id/g)
        console.log('digitalsquad.id URLs found:', urlMatch?.length || 0)

        // STEP 2: Strip YAML frontmatter (--- block at the start)
        content = content.replace(/^---[\s\S]*?---\s*/m, '')

        console.log('After frontmatter strip (first 300 chars):', content.substring(0, 300))

        // DEBUG: Check CTA links after frontmatter strip
        const ctaMatch2 = content.match(/\[.*?(>>|<<|\*\*).*?\]\([^)]+\)/g)
        console.log('CTA links after frontmatter strip:', ctaMatch2)

        // STEP 3: Parse markdown to HTML using marked v17
        const markedInstance = new Marked({
            breaks: true,
            gfm: true,
        })

        const html = markedInstance.parse(content)
        console.log('Parsed HTML (first 500 chars):', String(html).substring(0, 500))

        // DEBUG: Check if links are in final HTML
        const linkMatch = String(html).match(/<a[^>]+href="[^"]*digitalsquad[^"]*"[^>]*>/g)
        console.log('digitalsquad links in final HTML:', linkMatch)

        return html as string
    }, [post])

    // Handle broken images in article content
    useEffect(() => {
        if (!parsedContent) return

        // Use setTimeout to wait for DOM to update
        const timer = setTimeout(() => {
            const articleImages = document.querySelectorAll('.blog-content img')
            articleImages.forEach((img) => {
                const imgEl = img as HTMLImageElement
                // Hide placeholder images
                if (imgEl.src.includes('/images/')) {
                    imgEl.style.display = 'none'
                }
                // Handle error for other images
                imgEl.onerror = () => {
                    imgEl.style.display = 'none'
                }
            })
        }, 100)

        return () => clearTimeout(timer)
    }, [parsedContent])

    // Format date
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        })
    }

    // Loading state
    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
            </div>
        )
    }

    // 404 state
    if (notFound || !post) {
        return (
            <>
                <Helmet>
                    <title>Post Not Found | Digital Squad Blog</title>
                    <meta name="robots" content="noindex" />
                </Helmet>
                <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center px-4">
                    <h1 className="text-4xl font-bold text-white mb-4">404</h1>
                    <p className="text-slate-400 mb-8">Blog post not found</p>
                    <Link
                        to="/blog"
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors"
                    >
                        <ArrowLeft size={20} />
                        Back to Blog
                    </Link>
                </div>
            </>
        )
    }

    // Get OG image (first image in content or featured image or default)
    const ogImage = post.featured_image || extractFirstImage(post.content) || DEFAULT_OG_IMAGE

    // JSON-LD structured data
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: post.title,
        description: post.meta_description || '',
        image: ogImage,
        datePublished: post.created_at,
        dateModified: post.updated_at,
        author: {
            '@type': 'Person',
            name: post.author_name
        },
        publisher: {
            '@type': 'Organization',
            name: 'Digital Squad',
            logo: {
                '@type': 'ImageObject',
                url: '/android-chrome-512x512.png'
            }
        },
        keywords: post.keywords.join(', '),
        mainEntityOfPage: {
            '@type': 'WebPage',
            '@id': `https://www.digitalsquad.id/blog/${post.slug}`
        }
    }

    return (
        <>
            {/* SEO Meta Tags */}
            <Helmet>
                <title>{post.title} | Digital Squad Blog</title>
                <meta name="description" content={post.meta_description || ''} />
                <meta name="keywords" content={post.keywords.join(', ')} />
                <meta name="author" content={post.author_name} />

                {/* Open Graph */}
                <meta property="og:type" content="article" />
                <meta property="og:title" content={post.title} />
                <meta property="og:description" content={post.meta_description || ''} />
                <meta property="og:image" content={ogImage} />
                <meta property="og:url" content={`https://www.digitalsquad.id/blog/${post.slug}`} />
                <meta property="og:site_name" content="Digital Squad" />
                <meta property="article:published_time" content={post.created_at} />
                <meta property="article:modified_time" content={post.updated_at} />
                <meta property="article:author" content={post.author_name} />

                {/* Twitter Card */}
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content={post.title} />
                <meta name="twitter:description" content={post.meta_description || ''} />
                <meta name="twitter:image" content={ogImage} />

                {/* Canonical URL */}
                <link rel="canonical" href={`https://www.digitalsquad.id/blog/${post.slug}`} />

                {/* JSON-LD Structured Data */}
                <script type="application/ld+json">
                    {JSON.stringify(jsonLd)}
                </script>
            </Helmet>

            {/* Page Content */}
            <div className="min-h-screen bg-slate-950 text-slate-100">
                {/* Navigation */}
                <nav className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-slate-800">
                    <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
                        <Link
                            to="/blog"
                            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
                        >
                            <ArrowLeft size={20} />
                            <span className="hidden sm:inline">Back to Blog</span>
                        </Link>
                        <Link
                            to="/"
                            className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500"
                        >
                            Digital Squad
                        </Link>
                    </div>
                </nav>

                {/* Article */}
                <main className="max-w-4xl mx-auto px-4 py-12">
                    {/* Article Header */}
                    <header className="mb-10">
                        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
                            {post.title}
                        </h1>

                        {/* Meta info */}
                        <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400">
                            <div className="flex items-center gap-2">
                                <User size={16} />
                                <span>{post.author_name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Calendar size={16} />
                                <time dateTime={post.created_at}>{formatDate(post.created_at)}</time>
                            </div>
                            <div className="flex items-center gap-2">
                                <Clock size={16} />
                                <span>{post.reading_time} min read</span>
                            </div>
                        </div>

                        {/* Keywords */}
                        {post.keywords.length > 0 && (
                            <div className="flex flex-wrap items-center gap-2 mt-4">
                                <Tag size={16} className="text-slate-500" />
                                {post.keywords.map((keyword, i) => (
                                    <span
                                        key={i}
                                        className="px-2 py-1 bg-slate-800 rounded-lg text-xs text-slate-400"
                                    >
                                        {keyword}
                                    </span>
                                ))}
                            </div>
                        )}
                    </header>

                    {/* Featured Image - hidden if broken or placeholder path */}
                    {post.featured_image && !post.featured_image.startsWith('/images/') && (
                        <figure className="mb-10">
                            <img
                                src={post.featured_image}
                                alt={post.title}
                                className="w-full rounded-2xl object-cover max-h-96"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none'
                                }}
                            />
                        </figure>
                    )}

                    {/* Article Content */}
                    <article
                        className="blog-content"
                        dangerouslySetInnerHTML={{ __html: parsedContent }}
                    />

                    {/* Divider */}
                    <hr className="my-12 border-slate-800" />

                    {/* Back to Blog */}
                    <div className="flex justify-center">
                        <Link
                            to="/blog"
                            className="flex items-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-colors"
                        >
                            <ArrowLeft size={20} />
                            Back to Blog
                        </Link>
                    </div>
                </main>

                {/* Footer */}
                <footer className="border-t border-slate-800 py-8 mt-12">
                    <div className="max-w-4xl mx-auto px-4 text-center text-slate-500 text-sm">
                        © {new Date().getFullYear()} Digital Squad. All rights reserved.
                    </div>
                </footer>
            </div>
        </>
    )
}
