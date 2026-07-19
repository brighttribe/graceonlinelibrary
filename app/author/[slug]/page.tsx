import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { createSupabaseClient } from '@/lib/supabase'
import { prepareContent } from '@/lib/content'
import { categorySlug } from '@/lib/categories'
import type { ArticlePreview } from '@/lib/types'
import { booksByAuthor } from '@/lib/books'
import AuthorBooksShelf from '@/components/AuthorBooksShelf'

type Author = {
  id: string
  name: string
  slug: string
  bio: string | null
  bio_long: string | null
  article_count: number | null
}

export async function generateStaticParams() {
  const supabase = createSupabaseClient()
  const { data } = await supabase.from('authors').select('slug').gt('article_count', 0)
  return (data ?? []).map((a) => ({ slug: a.slug }))
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
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://graceonlinelibrary.org'
  const description = author.bio_long
    ? author.bio_long.slice(0, 155)
    : author.bio
      ? author.bio.slice(0, 155)
      : `Reformed and Puritan theological articles by ${author.name} at Grace Online Library.`
  return {
    title: author.name,
    description,
    alternates: { canonical: `${siteUrl}/author/${slug}/` },
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
  const authorBooks = await booksByAuthor(author.name)

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

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://graceonlinelibrary.org'
  const authorSchema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Person',
        name: author.name,
        url: `${siteUrl}/author/${author.slug}/`,
        ...(author.bio || author.bio_long ? { description: (author.bio_long || author.bio)!.slice(0, 300) } : {}),
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home',    item: `${siteUrl}/` },
          { '@type': 'ListItem', position: 2, name: 'Authors', item: `${siteUrl}/authors/` },
          { '@type': 'ListItem', position: 3, name: author.name, item: `${siteUrl}/author/${author.slug}/` },
        ],
      },
    ],
  }

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(authorSchema) }} />
      {/* Hero */}
      <div className="relative overflow-hidden border-b border-[#e5e7eb]" style={{ background: '#f5f5f5' }}>
        <div className="relative max-w-5xl mx-auto px-4 py-12">
          <nav className="mb-4 text-sm text-slate-400 flex items-center gap-1.5">
            <Link href="/" className="hover:text-slate-600 transition-colors">Home</Link>
            <span>›</span>
            <Link href="/authors" className="hover:text-slate-600 transition-colors">Authors</Link>
            <span>›</span>
            <span className="text-[#dc2626]">{author.name}</span>
          </nav>
          <h1 className="text-4xl font-bold text-[#1a1a1a]" style={{ fontFamily: 'Georgia, serif' }}>{author.name}</h1>
          <p className="mt-3 text-sm text-slate-400">
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

            {authorBooks.length > 0 && (
              <div className="rounded-2xl border border-slate-200 bg-[#faf7f5] p-5 sm:p-6">
                <AuthorBooksShelf books={authorBooks} authorName={author.name} />
              </div>
            )}

            {categories.length === 0 && (
              <p className="text-slate-500 text-sm">No published articles found for this author.</p>
            )}

            {categories.length > 0 && (
              <h2 className="text-xl font-bold text-[#1a1a1a]">
                Read Articles by {author.name}
              </h2>
            )}

            {categories.map((cat) => (
              <div key={cat}>
                <div className="flex items-center justify-between mb-3">
                  <Link href={`/${categorySlug(cat)}`} className="text-xs font-semibold text-slate-400 uppercase tracking-widest hover:text-[#dc2626] transition-colors">
                    {cat}
                  </Link>
                  <span className="text-xs text-slate-300">{byCategory[cat].length}</span>
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                  <ul className="divide-y divide-slate-100">
                    {byCategory[cat].map((article) => (
                      <li key={article.slug}>
                        <Link href={`/${article.slug}`} className="flex items-start justify-between px-6 py-4 hover:bg-[#fff5f5] transition-colors group">
                          <div className="flex-1 pr-4">
                            <p className="font-semibold text-[#111111] group-hover:text-[#dc2626] transition-colors leading-snug text-sm">{article.title}</p>
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
                      <Link href={`/${categorySlug(cat)}`} className="flex items-center justify-between px-4 py-2.5 text-xs text-slate-600 hover:bg-slate-50 hover:text-[#dc2626] transition-colors group">
                        <span className="leading-snug">{cat}</span>
                        <span className="ml-2 shrink-0 text-slate-300 group-hover:text-[#fca5a5] font-medium">{byCategory[cat].length}</span>
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
                      <Link href={`/author/${a.slug}`} className="flex items-center justify-between px-4 py-2.5 text-xs text-slate-600 hover:bg-slate-50 hover:text-[#dc2626] transition-colors group">
                        <span className="leading-snug">{a.name}</span>
                        <span className="ml-2 shrink-0 text-slate-300 group-hover:text-[#fca5a5]">{a.article_count}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
                <div className="px-4 py-2.5 border-t border-slate-100">
                  <Link href="/authors" className="text-xs text-[#dc2626] hover:text-[#b91c1c] font-medium transition-colors">
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
