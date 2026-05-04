import { ImageResponse } from 'next/og'
import { createSupabaseClient } from '@/lib/supabase'

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = createSupabaseClient()
  const { data: author } = await supabase
    .from('authors')
    .select('name, bio, article_count')
    .eq('slug', slug)
    .single<{ name: string; bio: string | null; article_count: number | null }>()

  const name = author?.name ?? 'Author'
  const count = author?.article_count ?? 0

  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', background: '#111111', display: 'flex', flexDirection: 'column', padding: '60px 70px' }}>
        <div style={{ height: '4px', background: 'linear-gradient(90deg, #991b1b, #dc2626, #fca5a5)', borderRadius: '2px', marginBottom: '0px' }} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ color: '#dc2626', fontSize: '18px', fontWeight: 700, letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '24px' }}>
            Author · Grace Online Library
          </div>
          <div style={{ color: '#ffffff', fontSize: name.length > 30 ? 56 : 72, fontWeight: 800, lineHeight: 1.1, marginBottom: '24px' }}>
            {name}
          </div>
          {count > 0 ? (
            <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '22px' }}>
              {count} {count === 1 ? 'article' : 'articles'} in the library
            </div>
          ) : null}
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
