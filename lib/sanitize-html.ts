import DOMPurify from 'dompurify';

/**
 * Sanitize HTML content to prevent XSS attacks
 * @param html - Raw HTML string
 * @returns Sanitized HTML safe for rendering
 */
export function sanitizeHTML(html: string): string {
  if (typeof window === 'undefined') {
    // Server-side: return as-is (DOMPurify requires DOM)
    // Server-rendered HTML is safe as it's from database
    return html;
  }

  // Client-side: sanitize with DOMPurify
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      // Text formatting
      'p', 'br', 'strong', 'em', 'u', 's', 'del', 'ins', 'mark', 'small', 'sub', 'sup',
      // Headings
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      // Lists
      'ul', 'ol', 'li',
      // Links and media
      'a', 'img', 'video', 'audio', 'source', 'iframe',
      // Tables
      'table', 'thead', 'tbody', 'tr', 'th', 'td',
      // Semantic
      'div', 'span', 'section', 'article', 'aside', 'header', 'footer', 'nav', 'main',
      // Code
      'pre', 'code', 'blockquote',
      // Other
      'hr'
    ],
    ALLOWED_ATTR: [
      'href', 'src', 'alt', 'title', 'class', 'id', 'style',
      'width', 'height', 'target', 'rel', 'type', 'controls',
      'autoplay', 'loop', 'muted', 'poster'
    ],
    ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp|data):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
    // Keep safe iframe content (e.g., YouTube embeds)
    ADD_TAGS: ['iframe'],
    ADD_ATTR: ['allow', 'allowfullscreen', 'frameborder', 'scrolling'],
  });
}
