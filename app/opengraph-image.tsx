import { ImageResponse } from 'next/og'

export const alt = 'Grace Online Library — Reformed & Puritan Theology'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function Image() {
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', background: '#111111', display: 'flex', flexDirection: 'column', padding: '60px 70px' }}>
        <div style={{ height: '4px', background: 'linear-gradient(90deg, #991b1b, #dc2626, #fca5a5)', borderRadius: '2px', marginBottom: '0px' }} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ color: '#dc2626', fontSize: '18px', fontWeight: 700, letterSpacing: '4px', textTransform: 'uppercase', marginBottom: '28px' }}>
            Grace Online Library
          </div>
          <div style={{ color: '#ffffff', fontSize: '64px', fontWeight: 800, lineHeight: 1.1, marginBottom: '28px' }}>
            Reformed &amp; Puritan Theology
          </div>
          <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '22px', lineHeight: 1.5 }}>
            A curated library of theological articles — free for the church since 1999
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
