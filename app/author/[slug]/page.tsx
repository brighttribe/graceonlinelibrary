import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { createSupabaseClient } from '@/lib/supabase'
import { prepareContent } from '@/lib/content'
import { categorySlug } from '@/lib/categories'
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
  return { title: author.name, description }
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

  // Group by category
  const byCategory: Record<string, ArticlePreview[]> = {}
  for (const a of articles) {
    const cat = a.category ?? 'Uncategorized'
    if (!byCategory[cat]) byCategory[cat] = []
    byCategory[cat].push(a)
  }
  const categories = Object.keys(byCategory).sort((a, b) => byCategory[b].length - byCategory[a].length)

  // Sidebar: top categories by count, related authors (authors sharing categories)
  const topCategories = categories.slice(0, 8)

  const { data: relatedAuthorsData } = await supabase
    .from('authors')
    .select('name, slug, article_count')
    .neq('slug', slug)
    .gt('article_count', 2)
    .order('article_count', { ascending: false })
    .limit(50)

  // Pick related authors who share categories (simple: just pick popular ones for now)
  const relatedAuthors = (relatedAuthorsData ?? []).slice(0, 6)

  const bioContent = author.bio_long || author.bio

  return (
    <main>
      {/* Hero */}
      <div className="relative overflow-hidden text-white" style={{ background: 'radial-gradient(ellipse 140% 120% at 50% 10%, #3b1a8f 0%, #1e0a4e 45%, #0d0520 75%, #050212 100%)' }}>
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        <svg className="absolute top-0 right-0 w-[480px] h-[480px] pointer-events-none" viewBox="0 0 480 480" fill="none" aria-hidden="true">
          <circle cx="380" cy="100" r="200" stroke="rgba(139,92,246,0.04)" strokeWidth="60" />
          <circle cx="420" cy="60"  r="140" stroke="rgba(139,92,246,0.04)" strokeWidth="40" />
          <circle cx="340" cy="140" r="90"  stroke="rgba(139,92,246,0.04)" strokeWidth="30" />
        </svg>
        <div className="relative max-w-5xl mx-auto px-4 py-12">
          <nav className="mb-4 text-sm text-white/40 flex items-center gap-1.5">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <span>›</span>
            <Link href="/authors" className="hover:text-white transition-colors">Authors</Link>
            <span>›</span>
            <span className="text-white/70">{author.name}</span>
          </nav>
          <h1 className="text-4xl font-bold" style={{ fontFamily: 'Georgia, serif' }}>{author.name}</h1>
          <p className="mt-3 text-sm text-white/40">
            {articles.length} {articles.length === 1 ? 'article' : 'articles'} · {categories.length} {categories.length === 1 ? 'topic' : 'topics'}
          </p>
        </div>
      </div>

      {/* Body + Sidebar */}
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="flex gap-10 items-start">

          {/* Main content */}
          <div className="flex-1 min-w-0 space-y-10">
            {bioContent && (
              <div className="prose prose-lg max-w-none" dangerouslySetInnerHTML={{ __html: prepareContent(bioContent) }} />
            )}

            {categories.length === 0 && (
              <p className="text-slate-500 text-sm">No published articles found for this author.</p>
            )}

            {categories.map((cat) => (
              <div key={cat}>
                <div className="flex items-center justify-between mb-3">
                  <Link href={`/category/${categorySlug(cat)}`} className="text-xs font-semibold text-slate-400 uppercase tracking-widest hover:text-[#7c3aed] transition-colors">
                    {cat}
                  </Link>
                  <span className="text-xs text-slate-300">{byCategory[cat].length}</span>
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                  <ul className="divide-y divide-slate-100">
                    {byCategory[cat].map((article) => (
                      <li key={article.slug}>
                        <Link href={`/articles/${article.slug}`} className="flex items-start justify-between px-6 py-4 hover:bg-[#faf8ff] transition-colors group">
                          <div className="flex-1 pr-4">
                            <p className="font-semibold text-[#111111] group-hover:text-[#7c3aed] transition-colors leading-snug text-sm">{article.title}</p>
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

          {/* Sidebar */}
          <aside className="w-64 shrink-0 hidden lg:block space-y-6">

            {/* Topics */}
            {topCategories.length > 0 && (
              <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">Topics Written</p>
                </div>
                <ul className="divide-y divide-slate-100">
                  {topCategories.map((cat) => (
                    <li key={cat}>
                      <Link href={`/category/${categorySlug(cat)}`} className="flex items-center justify-between px-4 py-2.5 text-xs text-slate-600 hover:bg-slate-50 hover:text-[#7c3aed] transition-colors group">
                        <span className="leading-snug">{cat}</span>
                        <span className="ml-2 shrink-0 text-slate-300 group-hover:text-[#a78bfa] font-medium">{byCategory[cat].length}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Other Authors */}
            {relatedAuthors.length > 0 && (
              <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">Other Authors</p>
                </div>
                <ul className="divide-y divide-slate-100">
                  {relatedAuthors.map((a) => (
                    <li key={a.slug}>
                      <Link href={`/author/${a.slug}`} className="flex items-center justify-between px-4 py-2.5 text-xs text-slate-600 hover:bg-slate-50 hover:text-[#7c3aed] transition-colors group">
                        <span className="leading-snug">{a.name}</span>
                        <span className="ml-2 shrink-0 text-slate-300 group-hover:text-[#a78bfa]">{a.article_count}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
                <div className="px-4 py-2.5 border-t border-slate-100">
                  <Link href="/authors" className="text-xs text-[#7c3aed] hover:text-[#6d28d9] font-medium transition-colors">
                    All authors →
                  </Link>
                </div>
              </div>
            )}

          </aside>
        </div>
      </div>
    </main>
  )
}
