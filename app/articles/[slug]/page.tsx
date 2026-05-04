import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { createSupabaseClient } from '@/lib/supabase'
import { prepareContent } from '@/lib/content'
import { categorySlug } from '@/lib/categories'
import AuthorBio from '@/components/AuthorBio'

export async function generateStaticParams() {
  const supabase = createSupabaseClient()
  const { data } = await supabase.from('articles').select('slug').eq('status', 'published')
  return (data ?? []).map((a) => ({ slug: a.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const supabase = createSupabaseClient()
  const { data: article } = await supabase.from('articles').select('title, excerpt, author, meta_title, meta_description').eq('slug', slug).single()
  if (!article) return {}
  const title = article.meta_title || article.title
  const description = article.meta_description || article.excerpt || ''
  return {
    title,
    description,
    openGraph: { title, description, type: 'article' },
    twitter: { card: 'summary', title, description },
  }
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = createSupabaseClient()

  const { data: article } = await supabase
    .from('articles')
    .select('*, series_slug, series_name, part_num')
    .eq('slug', slug)
    .single()

  if (!article) notFound()

  const [
    { data: authorRow },
    { data: seriesData },
    { data: byAuthorData },
    { data: moreCatData },
  ] = await Promise.all([
    article.author
      ? supabase.from('authors').select('slug, article_count').ilike('name', article.author).single<{ slug: string; article_count: number }>()
      : Promise.resolve({ data: null }),
    article.series_slug
      ? supabase.from('articles').select('title, slug, part_num').eq('series_slug', article.series_slug).eq('status', 'published').order('part_num')
      : Promise.resolve({ data: [] }),
    article.author
      ? supabase.from('articles').select('title, slug').eq('status', 'published').ilike('author', article.author).neq('slug', slug).order('title').limit(6)
      : Promise.resolve({ data: [] }),
    article.category
      ? supabase.from('articles').select('title, slug').eq('status', 'published').eq('category', article.category).neq('slug', slug).order('title').limit(6)
      : Promise.resolve({ data: [] }),
  ])

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://graceonlinelibrary.org'
  const pageUrl = `${siteUrl}/articles/${slug}/`
  const html = prepareContent(article.content || '')
  const hasSeries = seriesData && seriesData.length > 1

  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Article',
        headline: article.title,
        description: article.excerpt || '',
        url: pageUrl,
        datePublished: article.published_at,
        author: article.author ? { '@type': 'Person', name: article.author } : { '@type': 'Organization', name: 'Grace Online Library' },
        publisher: { '@type': 'Organization', name: 'Grace Online Library', url: siteUrl },
        mainEntityOfPage: pageUrl,
      },
    ],
  }

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />

      {/* Hero */}
      <div className="relative overflow-hidden text-white" style={{ background: 'radial-gradient(ellipse 140% 120% at 50% 10%, #3b1a8f 0%, #1e0a4e 45%, #0d0520 75%, #050212 100%)' }}>
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        <svg className="absolute top-0 right-0 w-[480px] h-[480px] pointer-events-none" viewBox="0 0 480 480" fill="none" aria-hidden="true">
          <circle cx="380" cy="100" r="200" stroke="rgba(139,92,246,0.04)" strokeWidth="60" />
          <circle cx="420" cy="60"  r="140" stroke="rgba(139,92,246,0.04)" strokeWidth="40" />
          <circle cx="340" cy="140" r="90"  stroke="rgba(139,92,246,0.04)" strokeWidth="30" />
        </svg>
        <div className="relative max-w-5xl mx-auto px-4 pt-6 pb-10">
          <nav className="mb-5 text-sm text-white/40 flex items-center gap-1.5 flex-wrap">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <span>›</span>
            {article.category && (
              <>
                <Link href={`/category/${categorySlug(article.category)}`} className="hover:text-white transition-colors">{article.category}</Link>
                <span>›</span>
              </>
            )}
          </nav>
          {article.category && (
            <p className="text-[#c4b5fd] text-xs font-semibold uppercase tracking-widest mb-3 mt-4">{article.category}</p>
          )}
          <h1 className="text-3xl sm:text-4xl font-bold leading-tight mb-4 max-w-3xl">{article.title}</h1>
          <p className="text-white/50 text-sm">
            {article.author && (
              <>
                {'by '}
                {authorRow?.slug && (authorRow.article_count ?? 0) > 1 ? (
                  <Link href={`/author/${authorRow.slug}`} className="text-white/50 hover:text-white/80 transition-colors">{article.author}</Link>
                ) : article.author}
                <span className="mx-2 opacity-40">·</span>
              </>
            )}
            {readingTime(article.content ?? '')} min read
          </p>
        </div>
      </div>

      {/* Body + Sidebar */}
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="flex gap-10 items-start">

          {/* Main content */}
          <div className="flex-1 min-w-0">
            <div className="prose prose-lg max-w-none" dangerouslySetInnerHTML={{ __html: html }} />
            {article.author && (
              <div className="mt-12 pt-10 border-t border-slate-200">
                <AuthorBio authorName={article.author} />
              </div>
            )}
          </div>

          {/* Sidebar — series nav only (short = sticky works) */}
          {hasSeries && (
            <aside className="w-64 shrink-0 hidden lg:block">
              <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">In this Series</p>
                  <p className="text-sm font-semibold text-[#111] mt-0.5 leading-snug">{article.series_name ?? article.series_slug}</p>
                </div>
                <ul className="divide-y divide-slate-100">
                  {seriesData!.map((part, i) => (
                    <li key={part.slug}>
                      <Link
                        href={`/articles/${part.slug}`}
                        className={`flex items-start gap-2.5 px-4 py-2.5 text-xs transition-colors ${
                          part.slug === slug
                            ? 'bg-[#f5f3ff] text-[#7c3aed] font-semibold'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-[#7c3aed]'
                        }`}
                      >
                        <span className={`shrink-0 w-4 text-right ${part.slug === slug ? 'text-[#7c3aed]' : 'text-slate-300'}`}>{i + 1}.</span>
                        <span className="leading-snug">{part.title}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </aside>
          )}
        </div>
      </div>

      {/* Below-article panels */}
      <div className="border-t border-slate-100">
        <div className="max-w-5xl mx-auto px-4 py-10 grid sm:grid-cols-2 gap-10">

          {/* More by Author */}
          {byAuthorData && byAuthorData.length > 0 && article.author && (
            <div>
              <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">More by {article.author}</h2>
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <ul className="divide-y divide-slate-100">
                  {byAuthorData.map((a) => (
                    <li key={a.slug}>
                      <Link href={`/articles/${a.slug}`} className="block px-5 py-3.5 text-sm text-[#111] hover:bg-[#faf8ff] hover:text-[#7c3aed] transition-colors leading-snug font-medium">
                        {a.title}
                      </Link>
                    </li>
                  ))}
                </ul>
                {authorRow?.slug && (
                  <div className="px-5 py-3 border-t border-slate-100">
                    <Link href={`/author/${authorRow.slug}`} className="text-xs text-[#7c3aed] hover:text-[#6d28d9] font-medium">All articles →</Link>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* More in Category */}
          {moreCatData && moreCatData.length > 0 && article.category && (
            <div>
              <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">More in {article.category}</h2>
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <ul className="divide-y divide-slate-100">
                  {moreCatData.map((a) => (
                    <li key={a.slug}>
                      <Link href={`/articles/${a.slug}`} className="block px-5 py-3.5 text-sm text-[#111] hover:bg-[#faf8ff] hover:text-[#7c3aed] transition-colors leading-snug font-medium">
                        {a.title}
                      </Link>
                    </li>
                  ))}
                </ul>
                <div className="px-5 py-3 border-t border-slate-100">
                  <Link href={`/category/${categorySlug(article.category)}`} className="text-xs text-[#7c3aed] hover:text-[#6d28d9] font-medium">All {article.category} articles →</Link>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </main>
  )
}

function readingTime(html: string): number {
  const text = html.replace(/<[^>]+>/g, ' ')
  const words = text.trim().split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.ceil(words / 250))
}
