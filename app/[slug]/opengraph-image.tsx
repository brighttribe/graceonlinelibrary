import { ImageResponse } from 'next/og'
import { createSupabaseClient } from '@/lib/supabase'
import { CATEGORY_SLUGS } from '@/lib/categories'

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  let title = ''
  let label = ''

  const categoryName = CATEGORY_SLUGS[slug]
  if (categoryName) {
    title = categoryName
    label = 'Topic · Grace Online Library'
  } else {
    const supabase = createSupabaseClient()
    const { data } = await supabase
      .from('articles')
      .select('title, author, category')
      .eq('slug', slug)
      .single()

    if (data) {
      title = data.title ?? ''
      label = data.author ? `by ${data.author}` : data.category ?? 'Grace Online Library'
    }
  }

  if (!title) {
    title = 'Grace Online Library'
    label = 'Reformed & Puritan Theology'
  }

  const fontSize = title.length > 80 ? 36 : title.length > 55 ? 46 : title.length > 35 ? 56 : 66

  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', background: '#111111', display: 'flex', flexDirection: 'column', padding: '60px 70px' }}>
        <div style={{ height: '4px', background: 'linear-gradient(90deg, #991b1b, #dc2626, #fca5a5)', borderRadius: '2px', marginBottom: '0px' }} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          {label ? (
            <div style={{ color: '#dc2626', fontSize: '18px', fontWeight: 700, letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '24px' }}>
              {label}
            </div>
          ) : null}
          <div style={{ color: '#ffffff', fontSize: `${fontSize}px`, fontWeight: 800, lineHeight: 1.15, maxWidth: '1000px' }}>
            {title}
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '28px' }}>
          <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '18px' }}>graceonlinelibrary.org</div>
          <div style={{ color: '#dc2626', fontSize: '16px', fontWeight: 600, letterSpacing: '1px' }}>REFORMED · PURITAN · BAPTIST</div>
        </div>
      </div>
    ),
    { ...size }
  )
}
