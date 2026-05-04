import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { createSupabaseClient } from '@/lib/supabase'
import type { ArticlePreview } from '@/lib/types'

type Author = {
  id: string
  name: string
  slug: string
  bio: string | null
  bio_long: string | null
  article_count: number | null
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const supabase = createSupabaseClient()
  const { data: author } = await supabase
    .from('authors')
    .select('name, bio, bio_long')
    .eq('slug', slug)
    .single<{ name: string; bio: string | null; bio_long: string | null }>()

  if (!author) return {}
  const description = author.bio_long
    ? author.bio_long.slice(0, 155)
    : author.bio
      ? author.bio.slice(0, 155)
      : `Reformed and Puritan theological articles by ${author.name} at Grace Online Library.`
  return {
    title: author.name,
    description,
  }
}

export default async function AuthorPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = createSupabaseClient()

  const { data: author } = await supabase
    .from('authors')
    .select('id, name, slug, bio, bio_long, article_count')
    .eq('slug', slug)
    .single<Author>()

  if (!author) notFound()

  const { data } = await supabase
    .from('articles')
    .select('id, title, slug, excerpt, category, author, published_at, featured')
    .eq('status', 'published')
    .ilike('author', author.name)
    .order('title')

  const articles = (data ?? []) as ArticlePreview[]

  const byCategory: Record<string, ArticlePreview[]> = {}
  for (const a of articles) {
    const cat = a.category ?? 'Uncategorized'
    if (!byCategory[cat]) byCategory[cat] = []
    byCategory[cat].push(a)
  }
  const categories = Object.keys(byCategory).sort()

  const bioContent = author.bio_long || author.bio

  return (
    <main>
      {/* Hero — name only */}
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
        <div className="relative max-w-3xl mx-auto px-4 py-12">
          <nav className="mb-4 text-sm text-white/40 flex items-center gap-1.5">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <span>›</span>
            <Link href="/authors" className="hover:text-white transition-colors">Authors</Link>
            <span>›</span>
            <span className="text-white/70">{author.name}</span>
          </nav>
          <h1 className="text-4xl font-bold" style={{ fontFamily: 'Georgia, serif' }}>
            {author.name}
          </h1>
          <p className="mt-3 text-sm text-white/40">
            {articles.length} {articles.length === 1 ? 'article' : 'articles'} in the library
          </p>
        </div>
      </div>

      {/* Bio + Articles */}
      <div className="max-w-3xl mx-auto px-4 py-10 space-y-10">

        {/* Bio */}
        {bioContent && (
          <div className="space-y-4">
            {bioContent.split('\n\n').map((para, i) => (
              <p key={i} className="text-base leading-relaxed text-[#1a1a1a]" style={{ fontFamily: 'Georgia, serif' }}>
                {para}
              </p>
            ))}
          </div>
        )}

        {/* Articles by category */}
        {categories.length === 0 && (
          <p className="text-slate-500 text-sm">No published articles found for this author.</p>
        )}

        {categories.map((cat) => (
          <div key={cat}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold text-slate-500 uppercase tracking-widest text-xs">{cat}</h2>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <ul className="divide-y divide-slate-100">
                {byCategory[cat].map((article) => (
                  <li key={article.slug}>
                    <Link
                      href={`/articles/${article.slug}`}
                      className="flex items-start justify-between px-6 py-4 hover:bg-red-50/50 transition-colors group"
                    >
                      <div className="flex-1 pr-4">
                        <p className="font-semibold text-[#111111] group-hover:text-[#7c3aed] transition-colors leading-snug text-sm">
                          {article.title}
                        </p>
                        {article.excerpt && (
                          <p className="text-xs text-slate-400 mt-1 line-clamp-1 leading-relaxed">{article.excerpt}</p>
                        )}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}
