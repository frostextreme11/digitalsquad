/**
 * SEO Utilities for Blog Posts
 * Auto-generates SEO fields from title and content
 */

// Common English stop words to filter out from keyword extraction
const STOP_WORDS = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'up', 'about', 'into', 'through', 'during',
    'before', 'after', 'above', 'below', 'between', 'under', 'again',
    'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why',
    'how', 'all', 'each', 'few', 'more', 'most', 'other', 'some', 'such',
    'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very',
    'can', 'will', 'just', 'should', 'now', 'also', 'like', 'even', 'because',
    'as', 'until', 'while', 'although', 'though', 'after', 'before', 'if',
    'it', 'its', 'this', 'that', 'these', 'those', 'am', 'is', 'are', 'was',
    'were', 'be', 'been', 'being', 'have', 'has', 'had', 'having', 'do',
    'does', 'did', 'doing', 'would', 'could', 'might', 'must', 'shall',
    'he', 'she', 'they', 'we', 'you', 'i', 'me', 'him', 'her', 'us', 'them',
    'my', 'your', 'his', 'their', 'our', 'what', 'which', 'who', 'whom',
    'get', 'got', 'make', 'made', 'go', 'went', 'come', 'came', 'take', 'took',
    // Indonesian stop words
    'dan', 'atau', 'yang', 'di', 'ke', 'dari', 'untuk', 'dengan', 'pada',
    'ini', 'itu', 'adalah', 'akan', 'juga', 'sudah', 'belum', 'tidak',
    'bisa', 'dapat', 'harus', 'saya', 'kamu', 'anda', 'kami', 'mereka',
    'ada', 'lebih', 'sangat', 'jika', 'karena', 'saat', 'ketika', 'setelah',
    'sebelum', 'antara', 'dalam', 'luar', 'atas', 'bawah', 'kita', 'bila'
]);

/**
 * Strip HTML tags and Markdown syntax from content and return plain text
 */
export function stripHtml(content: string): string {
    let text = content;

    // Strip YAML frontmatter (--- block at the start)
    // Handle both Unix (\n) and Windows (\r\n) line endings
    text = text.replace(/^---[\r\n]+[\s\S]*?[\r\n]+---[\r\n]+/, '');

    // Also try alternative frontmatter pattern
    if (text.startsWith('---')) {
        const endIndex = text.indexOf('---', 3);
        if (endIndex !== -1) {
            text = text.substring(endIndex + 3).trim();
        }
    }

    // Remove HTML tags
    text = text.replace(/<[^>]*>/g, ' ');

    // Remove Markdown syntax
    text = text
        // Remove images ![alt](url)
        .replace(/!\[.*?\]\([^)]+\)/g, '')
        // Remove links [text](url) but keep text
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        // Remove headers # ## ### etc.
        .replace(/^#+\s+/gm, '')
        // Remove bold **text** or __text__
        .replace(/(\*\*|__)(.*?)\1/g, '$2')
        // Remove italic *text* or _text_
        .replace(/(\*|_)(.*?)\1/g, '$2')
        // Remove strikethrough ~~text~~
        .replace(/~~(.*?)~~/g, '$1')
        // Remove inline code `code`
        .replace(/`([^`]+)`/g, '$1')
        // Remove code blocks ```code```
        .replace(/```[\s\S]*?```/g, '')
        // Remove blockquotes >
        .replace(/^>\s?/gm, '')
        // Remove horizontal rules ---
        .replace(/^-{3,}$/gm, '')
        // Remove list markers - * 1.
        .replace(/^[\s]*[-*+]\s+/gm, '')
        .replace(/^[\s]*\d+\.\s+/gm, '');

    // Decode HTML entities
    text = text
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'");

    // Normalize whitespace
    return text.replace(/\s+/g, ' ').trim();
}

/**
 * Generate SEO-friendly slug from title
 * - Converts to lowercase
 * - Replaces spaces and special chars with hyphens
 * - Removes consecutive hyphens
 * - Removes leading/trailing hyphens
 */
export function generateSlug(title: string): string {
    return title
        .toLowerCase()
        .trim()
        // Replace Indonesian special characters
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        // Replace spaces and special chars with hyphens
        .replace(/[^a-z0-9]+/g, '-')
        // Remove consecutive hyphens
        .replace(/-+/g, '-')
        // Remove leading/trailing hyphens
        .replace(/^-|-$/g, '');
}

/**
 * Generate meta description from HTML content
 * - Strips HTML tags
 * - Truncates to 155 characters
 * - Doesn't cut words in half
 * - Adds ellipsis if truncated
 */
export function generateMetaDescription(htmlContent: string): string {
    const plainText = stripHtml(htmlContent);

    if (plainText.length <= 155) {
        return plainText;
    }

    // Find the last space before 155 characters
    const truncated = plainText.substring(0, 155);
    const lastSpace = truncated.lastIndexOf(' ');

    if (lastSpace > 100) {
        return truncated.substring(0, lastSpace).trim() + '...';
    }

    // If no good break point, just truncate at 152 and add ellipsis
    return truncated.substring(0, 152).trim() + '...';
}

/**
 * Calculate reading time based on word count
 * Standard: 200 words per minute
 * Returns integer (minutes), minimum 1
 */
export function calculateReadingTime(htmlContent: string): number {
    const plainText = stripHtml(htmlContent);
    const words = plainText.split(/\s+/).filter(word => word.length > 0);
    const wordCount = words.length;
    const readingTime = Math.ceil(wordCount / 200);
    return Math.max(1, readingTime);
}

/**
 * Extract top 5 most repeated keywords from content
 * - Filters out stop words
 * - Filters out short words (< 3 chars)
 * - Returns array of top 5 keywords
 */
export function extractKeywords(htmlContent: string): string[] {
    const plainText = stripHtml(htmlContent);

    // Tokenize: split by non-word characters, convert to lowercase
    const words = plainText
        .toLowerCase()
        .split(/[^a-zA-Z0-9\u00C0-\u024F]+/)
        .filter(word =>
            word.length >= 3 &&
            !STOP_WORDS.has(word) &&
            !/^\d+$/.test(word) // Exclude pure numbers
        );

    // Count word frequencies
    const wordCount: Record<string, number> = {};
    for (const word of words) {
        wordCount[word] = (wordCount[word] || 0) + 1;
    }

    // Sort by frequency and get top 5
    const sortedWords = Object.entries(wordCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([word]) => word);

    return sortedWords;
}

/**
 * Extract first image URL from HTML or Markdown content
 * Returns null if no image found or if image is a placeholder
 */
export function extractFirstImage(content: string): string | null {
    // Strip YAML frontmatter first
    let cleanContent = content.replace(/^---[\r\n]+[\s\S]*?[\r\n]+---[\r\n]+/, '');

    // Also try alternative frontmatter pattern
    if (cleanContent.startsWith('---')) {
        const endIndex = cleanContent.indexOf('---', 3);
        if (endIndex !== -1) {
            cleanContent = cleanContent.substring(endIndex + 3).trim();
        }
    }

    // Try HTML img tag first
    const htmlMatch = cleanContent.match(/<img[^>]+src=["']([^"']+)["']/i);
    if (htmlMatch && !htmlMatch[1].startsWith('/images/')) return htmlMatch[1];

    // Try Markdown image syntax ![alt](url)
    const mdMatch = cleanContent.match(/!\[.*?\]\(([^)]+)\)/);
    if (mdMatch && !mdMatch[1].startsWith('/images/')) return mdMatch[1];

    return null;
}

/**
 * Main SEO processing function
 * Takes title and HTML content, returns all generated SEO fields
 */
export interface SEOFields {
    slug: string;
    meta_description: string;
    reading_time: number;
    keywords: string[];
    featured_image: string | null;
}

export function processSEO(title: string, content: string): SEOFields {
    return {
        slug: generateSlug(title),
        meta_description: generateMetaDescription(content),
        reading_time: calculateReadingTime(content),
        keywords: extractKeywords(content),
        featured_image: extractFirstImage(content),
    };
}
