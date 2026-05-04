import { createSupabaseClient } from '@/lib/supabase'

export async function GET() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://graceonlinelibrary.org'
  const supabase = createSupabaseClient()

  const { data: articles } = await supabase
    .from('articles')
    .select('title, slug, excerpt, author, category, published_at')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(50)

  const esc = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

  const items = (articles ?? []).map((a) => {
    const url = `${siteUrl}/${a.slug}/`
    const pubDate = a.published_at ? new Date(a.published_at).toUTCString() : ''
    return [
      '    <item>',
      `      <title>${esc(a.title ?? '')}</title>`,
      `      <link>${url}</link>`,
      `      <guid isPermaLink="true">${url}</guid>`,
      pubDate ? `      <pubDate>${pubDate}</pubDate>` : '',
      a.excerpt ? `      <description>${esc(a.excerpt)}</description>` : '',
      a.author ? `      <author>${esc(a.author)}</author>` : '',
      a.category ? `      <category>${esc(a.category)}</category>` : '',
      '    </item>',
    ].filter(Boolean).join('\n')
  }).join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Grace Online Library</title>
    <link>${siteUrl}/</link>
    <description>Reformed and Puritan theological articles — free for the church since 1999.</description>
    <language>en-us</language>
    <atom:link href="${siteUrl}/feed.xml" rel="self" type="application/rss+xml" />
    <image>
      <url>${siteUrl}/gol-icon-red.png</url>
      <title>Grace Online Library</title>
      <link>${siteUrl}/</link>
    </image>
${items}
  </channel>
</rss>`

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  })
}
