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
      <div className="relative overflow-hidden border-b border-[#e5e7eb]" style={{ background: '#f5f5f5' }}>
        <div className="relative max-w-5xl mx-auto px-4 py-12">
          <nav className="mb-3 text-sm text-slate-400 flex items-center gap-1.5">
            <Link href="/" className="hover:text-slate-600 transition-colors">Home</Link>
            <span>›</span>
            <span className="text-[#dc2626]">Authors</span>
          </nav>
          <h1 className="text-3xl font-bold mb-2 text-[#1a1a1a]">Search by Author</h1>
          <p className="text-slate-500 text-sm">Browse by last name</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-12 space-y-10">

        {/* A–Z nav */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 relative overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-1 rounded-t-2xl" style={{ background: 'linear-gradient(90deg, #991b1b, #dc2626, #fca5a5)' }} />
          <div className="flex flex-wrap justify-center gap-2 pt-1">
            {LETTERS.map((letter) => {
              const active = activeLetters.has(letter)
              return active ? (
                <Link
                  key={letter}
                  href={`/authors/${letter.toLowerCase()}`}
                  className="flex items-center justify-center w-12 h-12 rounded-xl font-bold text-sm transition-all bg-slate-50 border border-slate-200 text-slate-700 hover:bg-[#dc2626] hover:text-white hover:border-[#dc2626] hover:-translate-y-0.5 hover:shadow-md"
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
                  className="flex items-center justify-between py-2 border-b border-slate-100 text-sm text-[#111111] hover:text-[#dc2626] transition-colors group"
                >
                  <span>{a.name}</span>
                  <span className="text-xs text-slate-400 group-hover:text-[#fca5a5]">{a.article_count}</span>
                </Link>
              ))}
            </div>
          </div>
        )}

      </div>
    </main>
  )
}
