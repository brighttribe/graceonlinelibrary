import type { Metadata } from 'next'
import Link from 'next/link'
import { createSupabaseClient } from '@/lib/supabase'

export const metadata: Metadata = {
  title: 'Authors',
  description: 'Browse Reformed and Puritan theological authors in the Grace Online Library — Calvin, Owen, Spurgeon, Edwards, Warfield, and hundreds more.',
}

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

const lastName = (name: string) => name.trim().split(/\s+/).pop() ?? name

export default async function AuthorsPage() {
  const supabase = createSupabaseClient()

  const [{ data }, { data: popular }] = await Promise.all([
    supabase
      .from('authors')
      .select('name')
      .not('slug', 'is', null)
      .gt('article_count', 0)
      .not('name', 'ilike', 'unknown%'),
    supabase
      .from('authors')
      .select('name, slug, article_count')
      .not('slug', 'is', null)
      .not('name', 'ilike', 'unknown%')
      .order('article_count', { ascending: false })
      .limit(12),
  ])

  const activeLetters = new Set(
    (data ?? []).map((a) => lastName(a.name)[0].toUpperCase())
  )

  return (
    <main>
      <div
        className="relative overflow-hidden text-white"
        style={{ background: 'radial-gradient(ellipse 140% 120% at 50% 10%, #3b1a8f 0%, #1e0a4e 45%, #0d0520 75%, #050212 100%)' }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
        <svg className="absolute top-0 right-0 w-[480px] h-[480px] pointer-events-none" viewBox="0 0 480 480" fill="none" aria-hidden="true">
          <circle cx="380" cy="100" r="200" stroke="rgba(139,92,246,0.04)" strokeWidth="60" />
          <circle cx="420" cy="60"  r="140" stroke="rgba(139,92,246,0.04)" strokeWidth="40" />
          <circle cx="340" cy="140" r="90"  stroke="rgba(139,92,246,0.04)" strokeWidth="30" />
        </svg>
        <div className="relative max-w-5xl mx-auto px-4 py-12">
          <nav className="mb-3 text-sm text-white/40 flex items-center gap-1.5">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <span>›</span>
            <span className="text-white/70">Authors</span>
          </nav>
          <h1 className="text-3xl font-bold mb-2">Authors</h1>
          <p className="text-white/50 text-sm">Browse by last name</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-12 space-y-10">

        {/* A–Z nav */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 relative overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-1 rounded-t-2xl" style={{ background: 'linear-gradient(90deg, #3b1a8f, #7c3aed, #a78bfa)' }} />
          <div className="flex flex-wrap justify-center gap-2 pt-1">
            {LETTERS.map((letter) => {
              const active = activeLetters.has(letter)
              return active ? (
                <Link
                  key={letter}
                  href={`/authors/${letter.toLowerCase()}`}
                  className="flex items-center justify-center w-12 h-12 rounded-xl font-bold text-sm transition-all bg-slate-50 border border-slate-200 text-slate-700 hover:bg-[#7c3aed] hover:text-white hover:border-[#7c3aed] hover:-translate-y-0.5 hover:shadow-md"
                >
                  {letter}
                </Link>
              ) : (
                <span
                  key={letter}
                  className="flex items-center justify-center w-12 h-12 rounded-xl font-bold text-sm bg-slate-50 border border-slate-100 text-slate-300 cursor-default"
                >
                  {letter}
                </span>
              )
            })}
          </div>
        </div>

        {/* Popular authors */}
        {popular && popular.length > 0 && (
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-4">Popular Authors</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-1">
              {popular.map((a) => (
                <Link
                  key={a.slug}
                  href={`/author/${a.slug}`}
                  className="flex items-center justify-between py-2 border-b border-slate-100 text-sm text-[#111111] hover:text-[#7c3aed] transition-colors group"
                >
                  <span>{a.name}</span>
                  <span className="text-xs text-slate-400 group-hover:text-[#a78bfa]">{a.article_count}</span>
                </Link>
              ))}
            </div>
          </div>
        )}

      </div>
    </main>
  )
}
