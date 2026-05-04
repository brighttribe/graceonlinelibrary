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
      <div className="relative overflow-hidden border-b border-[#e5e7eb]" style={{ background: '#f5f5f5' }}>
        <div className="relative max-w-5xl mx-auto px-4 py-12">
          <nav className="mb-3 text-sm text-slate-400 flex items-center gap-1.5">
            <Link href="/" className="hover:text-slate-600 transition-colors">Home</Link>
            <span>›</span>
            <Link href="/authors" className="hover:text-slate-600 transition-colors">Authors</Link>
            <span>›</span>
            <span className="text-[#dc2626]">{l}</span>
          </nav>
          <h1 className="text-3xl font-bold mb-2 text-[#1a1a1a]">Authors — {l}</h1>
          <p className="text-slate-500 text-sm">{authors.length} {authors.length === 1 ? 'author' : 'authors'}</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-10 space-y-8">

        {/* Letter nav */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 relative overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-1 rounded-t-2xl" style={{ background: 'linear-gradient(90deg, #991b1b, #dc2626, #fca5a5)' }} />
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
                      ? 'bg-[#dc2626] text-white border border-[#dc2626] shadow-md'
                      : 'bg-slate-50 border border-slate-200 text-slate-700 hover:bg-[#dc2626] hover:text-white hover:border-[#dc2626] hover:-translate-y-0.5 hover:shadow-md'
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
              className="group flex flex-col bg-white border border-slate-200 rounded-xl px-5 py-4 hover:border-[#dc2626] hover:shadow-sm transition-all"
            >
              <div className="flex items-baseline justify-between gap-3">
                <span className="font-semibold text-[#111111] group-hover:text-[#dc2626] transition-colors leading-snug text-sm">
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
