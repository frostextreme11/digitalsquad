import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || ''

export default async function handler(req: VercelRequest, res: VercelResponse) {
    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    const baseUrl = 'https://digitalsquad.id'
    const today = new Date().toISOString().split('T')[0]

    try {
        // Fetch all published blog posts
        const { data: posts, error } = await supabase
            .from('posts')
            .select('slug, updated_at, created_at, title, featured_image')
            .eq('is_published', true)
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Sitemap error:', error)
            res.status(500).send('Error generating sitemap')
            return
        }

        let xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
        xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n'

        // Static: Homepage
        xml += `  <url>\n`
        xml += `    <loc>${baseUrl}</loc>\n`
        xml += `    <lastmod>${today}</lastmod>\n`
        xml += `    <changefreq>daily</changefreq>\n`
        xml += `    <priority>1.0</priority>\n`
        xml += `  </url>\n`

        // Static: Blog listing
        xml += `  <url>\n`
        xml += `    <loc>${baseUrl}/blog</loc>\n`
        xml += `    <lastmod>${today}</lastmod>\n`
        xml += `    <changefreq>daily</changefreq>\n`
        xml += `    <priority>0.9</priority>\n`
        xml += `  </url>\n`

        // Static: Login page
        xml += `  <url>\n`
        xml += `    <loc>${baseUrl}/login</loc>\n`
        xml += `    <lastmod>${today}</lastmod>\n`
        xml += `    <changefreq>monthly</changefreq>\n`
        xml += `    <priority>0.6</priority>\n`
        xml += `  </url>\n`

        // Static: Basic tier landing
        xml += `  <url>\n`
        xml += `    <loc>${baseUrl}/50</loc>\n`
        xml += `    <lastmod>${today}</lastmod>\n`
        xml += `    <changefreq>weekly</changefreq>\n`
        xml += `    <priority>0.8</priority>\n`
        xml += `  </url>\n`

        // Dynamic: Blog posts
        if (posts) {
            for (const post of posts) {
                const date = new Date(post.updated_at || post.created_at).toISOString().split('T')[0]
                xml += `  <url>\n`
                xml += `    <loc>${baseUrl}/blog/${post.slug}</loc>\n`
                xml += `    <lastmod>${date}</lastmod>\n`
                xml += `    <changefreq>weekly</changefreq>\n`
                xml += `    <priority>0.7</priority>\n`

                // Add image for better indexing
                if (post.featured_image && post.featured_image.startsWith('http')) {
                    const safeTitle = post.title
                        .replace(/&/g, '&amp;')
                        .replace(/</g, '&lt;')
                        .replace(/>/g, '&gt;')
                        .replace(/"/g, '&quot;')
                        .replace(/'/g, '&apos;')
                    xml += `    <image:image>\n`
                    xml += `      <image:loc>${post.featured_image}</image:loc>\n`
                    xml += `      <image:title>${safeTitle}</image:title>\n`
                    xml += `    </image:image>\n`
                }

                xml += `  </url>\n`
            }
        }

        xml += '</urlset>'

        // Set proper headers for sitemap
        res.setHeader('Content-Type', 'application/xml')
        res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=600')
        res.status(200).send(xml)
    } catch (err) {
        console.error('Sitemap generation failed:', err)
        res.status(500).send('Internal server error')
    }
}
