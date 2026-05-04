export function formatContent(content: string): string {
  if (!content) return ''

  // If content already has <p> tags throughout, return as-is
  const hasPTags = (content.match(/<p[\s>]/g) || []).length > 3
  if (hasPTags) return content

  // Split on double newlines, wrap each block in <p> if not already a block element
  const BLOCK = /^<(h[1-6]|ul|ol|li|blockquote|pre|div|table|figure|img|a\s)/i

  // Ensure text immediately after a closing block tag gets its own paragraph
  const normalized = content.replace(
    /<\/(blockquote|ul|ol|div|table)>\n(?=[^\n<])/gi,
    '</$1>\n\n'
  )

  return normalized
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => (BLOCK.test(block) || block.startsWith('</') ? block : `<p>${block}</p>`))
    .join('\n')
}

// Strip broken WP image tags (pointing to old uploads that no longer exist)
export function stripBrokenImages(content: string): string {
  return content.replace(/<a[^>]*wp-content\/uploads[^>]*>[\s\S]*?<\/a>/gi, '')
               .replace(/<img[^>]*wp-content\/uploads[^>]*\/?>/gi, '')
}

const BLOCK_TAG_RE = /^<(p|h[1-6]|ul|ol|li|blockquote|pre|div|table|figure|hr)[\s>]/i
// A lone <strong> or <em> with nothing else — likely a section heading, not prose
const LONE_HEADING_RE = /^(<(strong|em)>[^<]*<\/\2>\s*)+$/i

function wrapLeadingInlines(html: string): string {
  const trimmed = html.trimStart()
  if (BLOCK_TAG_RE.test(trimmed)) return html

  const match = trimmed.match(/<(p|h[1-6]|ul|ol|li|blockquote|pre|div|table|figure|hr)[\s>]/i)
  if (!match || match.index === undefined) {
    return LONE_HEADING_RE.test(trimmed) ? html : `<p>${html}</p>`
  }

  const leading = trimmed.slice(0, match.index).trim()
  const rest = trimmed.slice(match.index)
  if (!leading) return rest
  // Don't wrap lone bold/italic heading fragments — leave them floating so
  // the drop cap targets the first real prose <p> instead
  return LONE_HEADING_RE.test(leading) ? `${leading}${rest}` : `<p>${leading}</p>${rest}`
}

function wrapLeadWords(html: string): string {
  const firstP = html.search(/<p>/i)
  if (firstP === -1) return html

  const afterP = html.slice(firstP + 3)
  if (afterP.trimStart().startsWith('<')) return html

  const endP = afterP.indexOf('</p>')
  if (endP === -1) return html

  const inner = afterP.slice(0, endP)
  const parts = inner.split(/(\s+)/)
  let wordCount = 0
  let cutoff = parts.length
  for (let i = 0; i < parts.length; i++) {
    if (/\S/.test(parts[i])) {
      wordCount++
      if (wordCount >= 5) { cutoff = i + 1; break }
    }
  }
  if (wordCount < 2) return html
  let lead = parts.slice(0, cutoff).join('')
  if (lead.includes('<')) return html
  // Convert ALL_CAPS words to Title Case (e.g. "FOR" → "For")
  lead = lead.replace(/\b([A-Z]{2,})\b/g, (w) => w[0] + w.slice(1).toLowerCase())
  const tail = parts.slice(cutoff).join('')
  return (
    html.slice(0, firstP + 3) +
    `<span class="lead-words">${lead}</span>` +
    tail +
    html.slice(firstP + 3 + endP)
  )
}

export function prepareContent(content: string): string {
  return wrapLeadWords(wrapLeadingInlines(formatContent(stripBrokenImages(content))))
}
