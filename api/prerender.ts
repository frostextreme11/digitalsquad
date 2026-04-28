import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

// Simple helper to enforce a maximum timeout to prevent Lambda from crashing with 504
const withTimeout = <T>(promise: Promise<T>, ms: number = 7000): Promise<T> => {
    let timeoutId: NodeJS.Timeout;
    const timeoutPromise = new Promise<T>((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error('Supabase query timed out')), ms);
    });
    return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timeoutId));
};

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

            const { data: post, error } = await withTimeout(supabase
                .from('posts')
                .select('*')
                .eq('slug', slug)
                .eq('is_published', true)
                .single())

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
            const { data: posts } = await withTimeout(supabase
                .from('posts')
                .select('id, title, slug, meta_description, reading_time, featured_image, created_at, author_name')
                .eq('is_published', true)
                .order('created_at', { ascending: false }))

            const html = generateBlogListHTML(posts || [], baseUrl)
            res.setHeader('Content-Type', 'text/html; charset=utf-8')
            res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=600')
            res.status(200).send(html)
            return
        }

        // Handle /50 landing page
        if (path === '/50') {
            const html = generateLanding50HTML(baseUrl)
            res.setHeader('Content-Type', 'text/html; charset=utf-8')
            res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=600')
            res.status(200).send(html)
            return
        }

        // Default: redirect to SPA if crawler accesses unknown path directly
        res.status(200).send(generateGenericSPAHTML(path, baseUrl))
    } catch (err) {
        console.error('Prerender error:', err)
        // Fallback gracefully so GSC doesn't record a 500 error
        res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120')
        res.status(200).send(generateGenericSPAHTML(req.query.path as string, baseUrl))
    }
}

function generateGenericSPAHTML(path: string, baseUrl: string): string {
    return `<!doctype html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="robots" content="index, follow" />
  <link rel="canonical" href="${baseUrl}${path}" />
  <title>Digital Squad - Solusi Bisnis Online Modal Kecil</title>
  <meta name="description" content="Platform Belajar Digital Marketing & Bisnis Online Terbaik. Ubah modal kecil jadi solusi lunas hutang & bisnis online bersama Digital Squad.">
</head>
<body>
  <div id="root">
    <h1>Digital Squad</h1>
    <p>Loading application...</p>
    <p>Digital Squad adalah platform belajar digital marketing dan bisnis online terbaik.</p>
  </div>
  <!-- Note: We don't include the JS script here because this is for bots. 
       If a human somehow lands here, they will just see the static content. -->
</body>
</html>`
}

function generateLanding50HTML(baseUrl: string): string {
    const canonicalUrl = `${baseUrl}/50`
    const ogImage = `${baseUrl}/android-chrome-512x512.png`

    return `<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Promo Khusus 50rb | Digital Squad - Solusi Bebas Hutang</title>
    <meta name="description" content="Hanya dengan modal 50 ribu, dapatkan akses ke materi digital marketing premium, produk digital PLR, dan sistem affiliate yang menghasilkan. Solusi lunas hutang & bebas pinjol.">
    <meta name="keywords" content="bebas hutang, lunas pinjol, bisnis modal 50rb, digital marketing, bisnis online, affiliate marketing">
    
    <link rel="canonical" href="${canonicalUrl}">
    
    <!-- Open Graph -->
    <meta property="og:type" content="website">
    <meta property="og:title" content="Digital Squad - Promo Spesial 50 Ribu">
    <meta property="og:description" content="Ubah 50 ribu jadi sumber penghasilan. Bergabung dengan Digital Squad dan mulai bisnis online Anda sekarang.">
    <meta property="og:image" content="${ogImage}">
    <meta property="og:url" content="${canonicalUrl}">
    <meta property="og:site_name" content="Digital Squad">
    
    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="Digital Squad - Promo Spesial 50 Ribu">
    <meta name="twitter:description" content="Ubah 50 ribu jadi sumber penghasilan.">
    <meta name="twitter:image" content="${ogImage}">
</head>
<body>
    <main>
        <h1>Digital Squad - Tantangan 50 Ribu</h1>
        <section>
            <h2>Ubah Modal 50 Ribu Jadi Solusi Lunas Hutang</h2>
            <p>Bergabunglah dengan komunitas Digital Squad. Dapatkan akses ke:</p>
            <ul>
                <li>Materi Digital Marketing Terlengkap</li>
                <li>Produk Digital PLR Siap Jual</li>
                <li>Sistem Affiliate Komisi Tinggi</li>
                <li>Bimbingan Eksklusif</li>
            </ul>
            <p>Hanya dengan investasi satu kali sebesar Rp 50.000,-</p>
        </section>
        <p><a href="${baseUrl}/login">Daftar Sekarang</a></p>
    </main>
    <footer>© ${new Date().getFullYear()} Digital Squad. All rights reserved.</footer>
</body>
</html>`
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
