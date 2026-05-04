import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { createSupabaseClient } from '@/lib/supabase'

type AuthorRow = {
  name: string
  slug: string
  bio: string | null
  article_count: number | null
}

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
const lastName = (name: string) => name.trim().split(/\s+/).pop() ?? name

export async function generateStaticParams() {
  return LETTERS.map((l) => ({ letter: l.toLowerCase() }))
}

export async function generateMetadata({ params }: { params: Promise<{ letter: string }> }): Promise<Metadata> {
  const { letter } = await params
  const l = letter.toUpperCase()
  return {
    title: `Authors — ${l}`,
    description: `Reformed and Puritan theological authors with last names starting with ${l} at Grace Online Library.`,
  }
}

export default async function AuthorsLetterPage({ params }: { params: Promise<{ letter: string }> }) {
  const { letter } = await params
  const l = letter.toUpperCase()

  if (!LETTERS.includes(l)) notFound()

  const supabase = createSupabaseClient()

  const { data } = await supabase
    .from('authors')
    .select('name, slug, bio, article_count')
    .not('slug', 'is', null)
    .gt('article_count', 0)
    .not('name', 'ilike', 'unknown%')

  const authors = ((data ?? []) as AuthorRow[])
    .filter((a) => lastName(a.name)[0].toUpperCase() === l)
    .sort((a, b) => lastName(a.name).localeCompare(lastName(b.name)))

  if (authors.length === 0) notFound()

  // Which letters are active (for nav)
  const allActive = new Set(
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
            <Link href="/authors" className="hover:text-white transition-colors">Authors</Link>
            <span>›</span>
            <span className="text-white/70">{l}</span>
          </nav>
          <h1 className="text-3xl font-bold mb-2">Authors — {l}</h1>
          <p className="text-white/50 text-sm">{authors.length} {authors.length === 1 ? 'author' : 'authors'}</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-10 space-y-8">

        {/* Letter nav */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 relative overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-1 rounded-t-2xl" style={{ background: 'linear-gradient(90deg, #3b1a8f, #7c3aed, #a78bfa)' }} />
          <div className="flex flex-wrap justify-center gap-2 pt-1">
            {LETTERS.map((letter) => {
              const active = allActive.has(letter)
              const current = letter === l
              return active ? (
                <Link
                  key={letter}
                  href={`/authors/${letter.toLowerCase()}`}
                  className={`flex items-center justify-center w-11 h-11 rounded-xl font-bold text-sm transition-all ${
                    current
                      ? 'bg-[#7c3aed] text-white border border-[#7c3aed] shadow-md'
                      : 'bg-slate-50 border border-slate-200 text-slate-700 hover:bg-[#7c3aed] hover:text-white hover:border-[#7c3aed] hover:-translate-y-0.5 hover:shadow-md'
                  }`}
                >
                  {letter}
                </Link>
              ) : (
                <span
                  key={letter}
                  className="flex items-center justify-center w-11 h-11 rounded-xl font-bold text-sm bg-slate-50 border border-slate-100 text-slate-300 cursor-default"
                >
                  {letter}
                </span>
              )
            })}
          </div>
        </div>

        {/* Author cards */}
        <div className="grid sm:grid-cols-2 gap-3">
          {authors.map((author) => (
            <Link
              key={author.slug}
              href={`/author/${author.slug}`}
              className="group flex flex-col bg-white border border-slate-200 rounded-xl px-5 py-4 hover:border-[#7c3aed] hover:shadow-sm transition-all"
            >
              <div className="flex items-baseline justify-between gap-3">
                <span className="font-semibold text-[#111111] group-hover:text-[#7c3aed] transition-colors leading-snug text-sm">
                  {author.name}
                </span>
                <span className="text-xs text-slate-400 shrink-0">
                  {author.article_count} {author.article_count === 1 ? 'article' : 'articles'}
                </span>
              </div>
              {author.bio && (
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed line-clamp-2">
                  {author.bio}
                </p>
              )}
            </Link>
          ))}
        </div>

      </div>
    </main>
  )
}
