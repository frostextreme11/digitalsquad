import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || ''

/**
 * Serverless function that generates pre-rendered HTML for blog posts.
 * This is critical for SEO because our SPA renders blog content client-side,
 * which means Googlebot sees an empty <div id="root"></div>.
 * 
 * This function intercepts requests from crawlers and returns full HTML
 * with all meta tags, structured data, and content pre-rendered.
 * 
 * Usage: /api/prerender?path=/blog/my-post-slug
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
    const path = req.query.path as string

    if (!path) {
        res.status(400).json({ error: 'Missing path parameter' })
        return
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    const baseUrl = 'https://www.digitalsquad.id'

    try {
        // Handle blog post pages
        if (path.startsWith('/blog/')) {
            const slug = path.replace('/blog/', '')

            const { data: post, error } = await supabase
                .from('posts')
                .select('*')
                .eq('slug', slug)
                .eq('is_published', true)
                .single()

            if (error || !post) {
                res.status(404).send(generateNotFoundHTML())
                return
            }

            const html = generateBlogPostHTML(post, baseUrl)
            res.setHeader('Content-Type', 'text/html; charset=utf-8')
            res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=600')
            res.status(200).send(html)
            return
        }

        // Handle blog list page
        if (path === '/blog') {
            const { data: posts } = await supabase
                .from('posts')
                .select('id, title, slug, meta_description, reading_time, featured_image, created_at, author_name')
                .eq('is_published', true)
                .order('created_at', { ascending: false })

            const html = generateBlogListHTML(posts || [], baseUrl)
            res.setHeader('Content-Type', 'text/html; charset=utf-8')
            res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=600')
            res.status(200).send(html)
            return
        }

        // Default: redirect to SPA
        res.status(302).setHeader('Location', path).end()
    } catch (err) {
        console.error('Prerender error:', err)
        res.status(500).send('Internal server error')
    }
}

function escapeHtml(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;')
}

function generateBlogPostHTML(post: any, baseUrl: string): string {
    const ogImage = post.featured_image || `${baseUrl}/android-chrome-512x512.png`
    const canonicalUrl = `${baseUrl}/blog/${post.slug}`
    const safeTitle = escapeHtml(post.title)
    const safeDescription = escapeHtml(post.meta_description || '')
    const keywords = (post.keywords || []).join(', ')

    // Simple markdown-to-text for the body preview
    let contentPreview = (post.content || '')
        .replace(/<[^>]+>/g, '') // Strip HTML
        .replace(/[#*_`~\[\]()]/g, '') // Strip markdown chars
        .substring(0, 500)

    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: post.title,
        description: post.meta_description || '',
        image: ogImage,
        datePublished: post.created_at,
        dateModified: post.updated_at,
        author: { '@type': 'Person', name: post.author_name },
        publisher: {
            '@type': 'Organization',
            name: 'Digital Squad',
            logo: { '@type': 'ImageObject', url: `${baseUrl}/android-chrome-512x512.png` }
        },
        keywords: keywords,
        mainEntityOfPage: { '@type': 'WebPage', '@id': canonicalUrl }
    }

    return `<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${safeTitle} | Digital Squad Blog</title>
    <meta name="description" content="${safeDescription}">
    <meta name="keywords" content="${escapeHtml(keywords)}">
    <meta name="author" content="${escapeHtml(post.author_name)}">
    
    <!-- Canonical URL -->
    <link rel="canonical" href="${canonicalUrl}">
    
    <!-- Open Graph -->
    <meta property="og:type" content="article">
    <meta property="og:title" content="${safeTitle}">
    <meta property="og:description" content="${safeDescription}">
    <meta property="og:image" content="${ogImage}">
    <meta property="og:url" content="${canonicalUrl}">
    <meta property="og:site_name" content="Digital Squad">
    <meta property="article:published_time" content="${post.created_at}">
    <meta property="article:modified_time" content="${post.updated_at}">
    <meta property="article:author" content="${escapeHtml(post.author_name)}">
    
    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${safeTitle}">
    <meta name="twitter:description" content="${safeDescription}">
    <meta name="twitter:image" content="${ogImage}">
    
    <!-- JSON-LD Structured Data -->
    <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
    
    <!-- Redirect real users to SPA -->
    <script>
        if (!navigator.userAgent.match(/Googlebot|bingbot|Baiduspider|yandex|facebookexternalhit|Twitterbot|rogerbot|linkedinbot|embedly|quora link preview|showyoubot|outbrain|pinterest/i)) {
            window.location.replace('${canonicalUrl}');
        }
    </script>
</head>
<body>
    <h1>${safeTitle}</h1>
    <p>By ${escapeHtml(post.author_name)} | ${new Date(post.created_at).toLocaleDateString('id-ID')} | ${post.reading_time} min read</p>
    <article>${contentPreview}...</article>
    <p><a href="${baseUrl}/blog">← Back to Blog</a></p>
    <footer>© ${new Date().getFullYear()} Digital Squad. All rights reserved.</footer>
</body>
</html>`
}

function generateBlogListHTML(posts: any[], baseUrl: string): string {
    const postLinks = posts.map(post =>
        `<li><a href="${baseUrl}/blog/${post.slug}">${escapeHtml(post.title)}</a> - ${escapeHtml(post.meta_description || '')}</li>`
    ).join('\n')

    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Blog',
        name: 'Digital Squad Blog',
        description: 'Tips, strategi, dan insight tentang digital marketing untuk mengembangkan bisnis Anda.',
        url: `${baseUrl}/blog`,
        publisher: {
            '@type': 'Organization',
            name: 'Digital Squad',
            logo: { '@type': 'ImageObject', url: `${baseUrl}/android-chrome-512x512.png` }
        }
    }

    return `<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Blog | Digital Squad - Tips &amp; Strategi Digital Marketing</title>
    <meta name="description" content="Baca artikel terbaru tentang digital marketing, tips bisnis online, dan strategi untuk mengembangkan bisnis Anda bersama Digital Squad.">
    <meta name="keywords" content="digital marketing, tips bisnis, online marketing, strategi digital, digital squad">
    
    <link rel="canonical" href="${baseUrl}/blog">
    
    <meta property="og:type" content="website">
    <meta property="og:title" content="Blog | Digital Squad">
    <meta property="og:description" content="Tips, strategi, dan insight tentang digital marketing untuk mengembangkan bisnis Anda.">
    <meta property="og:url" content="${baseUrl}/blog">
    <meta property="og:site_name" content="Digital Squad">
    
    <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
    
    <script>
        if (!navigator.userAgent.match(/Googlebot|bingbot|Baiduspider|yandex|facebookexternalhit|Twitterbot|rogerbot|linkedinbot|embedly|quora link preview|showyoubot|outbrain|pinterest/i)) {
            window.location.replace('${baseUrl}/blog');
        }
    </script>
</head>
<body>
    <h1>Blog Digital Squad</h1>
    <p>Tips, strategi, dan insight tentang digital marketing untuk mengembangkan bisnis Anda.</p>
    <ul>
        ${postLinks}
    </ul>
    <p><a href="${baseUrl}">← Back to Home</a></p>
    <footer>© ${new Date().getFullYear()} Digital Squad. All rights reserved.</footer>
</body>
</html>`
}

function generateNotFoundHTML(): string {
    return `<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>404 - Page Not Found | Digital Squad</title>
    <meta name="robots" content="noindex, nofollow">
</head>
<body>
    <h1>404 - Page Not Found</h1>
    <p>The page you are looking for does not exist.</p>
    <a href="https://www.digitalsquad.id/blog">Back to Blog</a>
</body>
</html>`
}
