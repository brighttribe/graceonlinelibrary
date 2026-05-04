import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { createSupabaseClient } from '@/lib/supabase'
import type { ArticlePreview } from '@/lib/types'
import { CATEGORY_SLUGS, CATEGORY_CHILDREN, CATEGORY_PARENT, categorySlug } from '@/lib/categories'
import { prepareContent, readingTime } from '@/lib/content'
import AuthorBio from '@/components/AuthorBio'

function getCategoryName(slug: string): string | null {
  return CATEGORY_SLUGS[slug] ?? null
}

export async function generateStaticParams() {
  const categorySlugs = Object.keys(CATEGORY_SLUGS).map((slug) => ({ slug }))
  const supabase = createSupabaseClient()
  const { data } = await supabase.from('articles').select('slug').eq('status', 'published')
  const articleSlugs = (data ?? []).map((a) => ({ slug: a.slug }))
  return [...categorySlugs, ...articleSlugs]
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://graceonlinelibrary.org'
  const categoryName = getCategoryName(slug)
  if (categoryName) {
    return {
      title: `${categoryName} Articles`,
      description: `Reformed and Puritan articles on ${categoryName} from Grace Online Library.`,
      alternates: { canonical: `${siteUrl}/${slug}/` },
    }
  }
  const supabase = createSupabaseClient()
  const { data: article } = await supabase
    .from('articles')
    .select('title, excerpt, author, meta_title, meta_description')
    .eq('slug', slug)
    .single()
  if (!article) return {}
  const title = article.meta_title || article.title
  const description = article.meta_description || article.excerpt || ''
  return {
    title,
    description,
    alternates: { canonical: `${siteUrl}/${slug}/` },
    openGraph: { title, description, type: 'article' },
    twitter: { card: 'summary', title, description },
  }
}

// ─── Category page ────────────────────────────────────────────────────────────

type SubCat = { slug: string; name: string; count: number }

async function CategoryPage({ slug }: { slug: string }) {
  const categoryName = getCategoryName(slug)!
  const supabase = createSupabaseClient()
  const childSlugs = CATEGORY_CHILDREN[slug] ?? []
  const parentSlug = CATEGORY_PARENT[slug] ?? null
  const parentName = parentSlug ? getCategoryName(parentSlug) : null
  const siblingsSlugs = parentSlug ? (CATEGORY_CHILDREN[parentSlug] ?? []).filter(s => s !== slug) : []

  const childNames = childSlugs.map((s) => CATEGORY_SLUGS[s]).filter(Boolean)
  const siblingNames = siblingsSlugs.map((s) => CATEGORY_SLUGS[s]).filter(Boolean)

  const [{ data: articleData }, { data: allCatData }, { data: siblingCountData }] = await Promise.all([
    supabase
      .from('articles')
      .select('id, title, slug, category, author, published_at, featured, content')
      .eq('status', 'published')
      .or(`category.eq.${categoryName},tags.cs.{${categoryName}}`)
      .order('title'),
    childNames.length > 0
      ? supabase.from('articles').select('category, tags').eq('status', 'published')
          .or(childNames.map(n => `category.eq.${n},tags.cs.{${n}}`).join(','))
      : Promise.resolve({ data: [] }),
    siblingNames.length > 0
      ? supabase.from('articles').select('category, tags').eq('status', 'published')
          .or(siblingNames.map(n => `category.eq.${n},tags.cs.{${n}}`).join(','))
      : Promise.resolve({ data: [] }),
  ])

  type ArticleRow = ArticlePreview & { content: string | null }
  const articles = (articleData ?? []) as ArticleRow[]

  const countMap: Record<string, number> = {}
  for (const row of allCatData ?? []) {
    const matched = new Set<string>()
    if (childNames.includes(row.category)) matched.add(row.category)
    for (const tag of row.tags ?? []) { if (childNames.includes(tag)) matched.add(tag) }
    for (const name of matched) { countMap[name] = (countMap[name] ?? 0) + 1 }
  }

  const siblingCountMap: Record<string, number> = {}
  for (const row of siblingCountData ?? []) {
    const matched = new Set<string>()
    if (siblingNames.includes(row.category)) matched.add(row.category)
    for (const tag of row.tags ?? []) { if (siblingNames.includes(tag)) matched.add(tag) }
    for (const name of matched) { siblingCountMap[name] = (siblingCountMap[name] ?? 0) + 1 }
  }

  const subCats: SubCat[] = childSlugs
    .map((s) => ({ slug: s, name: CATEGORY_SLUGS[s] ?? s, count: countMap[CATEGORY_SLUGS[s]] ?? 0 }))
    .filter((s) => s.count > 0)

  const siblings: SubCat[] = siblingsSlugs
    .map((s) => ({ slug: s, name: CATEGORY_SLUGS[s] ?? s, count: siblingCountMap[CATEGORY_SLUGS[s]] ?? 0 }))
    .filter((s) => s.count > 0)

  const totalCount = articles.length + Object.values(countMap).reduce((a, b) => a + b, 0)
  const breadcrumb = parentSlug && parentName
    ? [{ href: `/${parentSlug}`, label: parentName }]
    : []

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://graceonlinelibrary.org'
  const breadcrumbItems: { '@type': string; position: number; name: string; item: string }[] = [
    { '@type': 'ListItem', position: 1, name: 'Home',   item: `${siteUrl}/` },
    { '@type': 'ListItem', position: 2, name: 'Topics', item: `${siteUrl}/topics/` },
  ]
  if (parentName && parentSlug) {
    breadcrumbItems.push({ '@type': 'ListItem', position: 3, name: parentName,    item: `${siteUrl}/${parentSlug}/` })
    breadcrumbItems.push({ '@type': 'ListItem', position: 4, name: categoryName,  item: `${siteUrl}/${slug}/` })
  } else {
    breadcrumbItems.push({ '@type': 'ListItem', position: 3, name: categoryName,  item: `${siteUrl}/${slug}/` })
  }
  const categorySchema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        name: `${categoryName} Articles`,
        description: `Reformed and Puritan articles on ${categoryName} from Grace Online Library.`,
        url: `${siteUrl}/${slug}/`,
        publisher: { '@type': 'Organization', name: 'Grace Online Library', url: siteUrl },
      },
      { '@type': 'BreadcrumbList', itemListElement: breadcrumbItems },
    ],
  }

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(categorySchema) }} />
      <div className="relative overflow-hidden border-b border-[#e5e7eb]" style={{ background: '#f5f5f5' }}>
        <div className="relative max-w-5xl mx-auto px-4 pt-6 pb-10">
          <nav className="mb-5 text-sm text-slate-400 flex items-center gap-1.5 flex-wrap">
            <Link href="/" className="hover:text-slate-600 transition-colors">Home</Link>
            <span>›</span>
            <Link href="/topics" className="hover:text-slate-600 transition-colors">Topics</Link>
            {breadcrumb.map((crumb) => (
              <span key={crumb.href} className="contents">
                <span>›</span>
                <Link href={crumb.href} className="hover:text-slate-600 transition-colors">{crumb.label}</Link>
              </span>
            ))}
            <span>›</span>
            <span className="text-[#dc2626]">{categoryName}</span>
          </nav>
          <h1 className="text-3xl sm:text-4xl font-bold leading-tight mb-3 text-[#1a1a1a]">{categoryName}</h1>
          <p className="text-slate-500 text-sm">
            {subCats.length > 0 ? `${totalCount} articles across ${subCats.length} sub-topics` : `${articles.length} ${articles.length === 1 ? 'article' : 'articles'}`}
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="flex gap-10 items-start">
          <div className="flex-1 min-w-0 space-y-10">
            {subCats.length > 0 && (
              <div>
                <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">Browse by Sub-topic</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {subCats.map((sub) => (
                    <Link
                      key={sub.slug}
                      href={`/${sub.slug}`}
                      className="group flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 hover:border-[#dc2626] hover:bg-[#fff5f5] transition-all shadow-sm"
                    >
                      <span className="text-sm font-medium text-[#111111] group-hover:text-[#dc2626] transition-colors leading-snug">{sub.name}</span>
                      <span className="ml-3 shrink-0 text-xs font-semibold text-white bg-[#dc2626] group-hover:bg-[#b91c1c] rounded-full px-2 py-0.5 transition-colors">{sub.count}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {articles.length > 0 && (
              <div>
                {subCats.length > 0 && (
                  <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">Articles in {categoryName}</h2>
                )}
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                  <ul className="divide-y divide-slate-100">
                    {articles.map((article, i) => (
                      <li key={article.slug} className={i % 2 === 1 ? 'bg-slate-100' : ''}>
                        <Link href={`/${article.slug}`} className="block px-6 py-3.5 hover:bg-[#fff5f5] transition-colors group">
                          <p className="font-semibold text-[#111111] group-hover:text-[#dc2626] transition-colors leading-snug text-sm">{article.title}</p>
                          {(article.author || article.content) && (
                            <p className="text-xs text-slate-400 mt-0.5">
                              {article.author}
                              {article.author && <span className="mx-1.5 text-[#dc2626]">·</span>}
                              {readingTime(article.content ?? '')} min
                            </p>
                          )}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {articles.length === 0 && subCats.length === 0 && (
              <p className="text-slate-500 text-sm">No articles found in this category.</p>
            )}
          </div>

          {siblings.length > 0 && (
            <aside className="w-56 shrink-0 hidden lg:block">
              <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
                  {parentName && parentSlug && (
                    <Link href={`/${parentSlug}`} className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest hover:text-[#dc2626] transition-colors">
                      {parentName}
                    </Link>
                  )}
                </div>
                <ul className="divide-y divide-slate-100">
                  <li>
                    <span className="flex items-center justify-between px-4 py-2.5 text-xs font-semibold text-[#dc2626] bg-[#fef2f2]">
                      <span>{categoryName}</span>
                      <span className="text-[#dc2626]">{articles.length}</span>
                    </span>
                  </li>
                  {siblings.map((s) => (
                    <li key={s.slug}>
                      <Link href={`/${s.slug}`} className="flex items-center justify-between px-4 py-2.5 text-xs text-slate-600 hover:bg-slate-50 hover:text-[#dc2626] transition-colors group">
                        <span className="leading-snug">{s.name}</span>
                        <span className="ml-2 shrink-0 text-slate-500 group-hover:text-[#fca5a5]">{s.count}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </aside>
          )}
        </div>
      </div>
    </main>
  )
}

// ─── Article page ─────────────────────────────────────────────────────────────

async function ArticlePage({ slug }: { slug: string }) {
  const supabase = createSupabaseClient()

  const { data: article } = await supabase
    .from('articles')
    .select('*, series_slug, series_name, part_num')
    .eq('slug', slug)
    .single()

  if (!article) notFound()

  const [{ data: authorRow }, { data: seriesData }, { data: byAuthorData }, { data: moreCatData }] = await Promise.all([
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
      ? supabase.from('articles').select('title, slug, author').eq('status', 'published').eq('category', article.category).neq('slug', slug).order('title').limit(6)
      : Promise.resolve({ data: [] }),
  ])

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://graceonlinelibrary.org'
  const pageUrl = `${siteUrl}/${slug}/`
  const html = prepareContent(article.content || '')
  const hasSeries = seriesData && seriesData.length > 1

  const articleBreadcrumbs: { '@type': string; position: number; name: string; item: string }[] = [
    { '@type': 'ListItem', position: 1, name: 'Home', item: `${siteUrl}/` },
  ]
  if (article.category) {
    articleBreadcrumbs.push({ '@type': 'ListItem', position: 2, name: article.category, item: `${siteUrl}/${categorySlug(article.category)}/` })
    articleBreadcrumbs.push({ '@type': 'ListItem', position: 3, name: article.title, item: pageUrl })
  } else {
    articleBreadcrumbs.push({ '@type': 'ListItem', position: 2, name: article.title, item: pageUrl })
  }

  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Article',
        headline: article.title,
        description: article.excerpt || '',
        url: pageUrl,
        datePublished: article.published_at,
        dateModified: article.updated_at || article.published_at,
        author: article.author ? { '@type': 'Person', name: article.author } : { '@type': 'Organization', name: 'Grace Online Library' },
        publisher: { '@type': 'Organization', name: 'Grace Online Library', url: siteUrl },
        mainEntityOfPage: pageUrl,
      },
      { '@type': 'BreadcrumbList', itemListElement: articleBreadcrumbs },
    ],
  }

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />

      <div className="relative overflow-hidden border-b border-[#e5e7eb]" style={{ background: '#f5f5f5' }}>
        <div className="relative max-w-5xl mx-auto px-4 pt-6 pb-10">
          <nav className="mb-5 text-sm text-slate-400 flex items-center gap-1.5 flex-wrap">
            <Link href="/" className="hover:text-slate-600 transition-colors">Home</Link>
            <span>›</span>
            {article.category && (
              <>
                <Link href={`/${categorySlug(article.category)}`} className="hover:text-slate-600 transition-colors">{article.category}</Link>
                <span>›</span>
              </>
            )}
          </nav>
          <h1 className="text-3xl sm:text-4xl font-bold leading-tight mb-4 max-w-3xl text-[#1a1a1a]">{article.title}</h1>
          <p className="text-slate-500 text-sm">
            {article.author && (
              <>
                {'by '}
                {authorRow?.slug && (authorRow.article_count ?? 0) > 1 ? (
                  <Link href={`/author/${authorRow.slug}`} className="text-slate-500 hover:text-slate-700 transition-colors">{article.author}</Link>
                ) : article.author}
                <span className="mx-2 opacity-40">·</span>
              </>
            )}
            {readingTime(article.content ?? '')} min read
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="flex gap-10 items-start">
          <div className="flex-1 min-w-0">
            <div className="prose prose-lg max-w-none" dangerouslySetInnerHTML={{ __html: html }} />
            {article.author && (
              <div className="mt-12 pt-10 border-t border-slate-200">
                <AuthorBio authorName={article.author} />
              </div>
            )}
          </div>

          <aside className="w-64 shrink-0 hidden lg:block space-y-6">
            {hasSeries && (
              <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">In this Series</p>
                  <p className="text-sm font-semibold text-[#111] mt-0.5 leading-snug">{(article.series_name ?? article.series_slug ?? '').replace(/[\s\-–—]+$/, '')}</p>
                </div>
                <ul className="divide-y divide-slate-100">
                  {seriesData!.filter(p => p.title && p.slug).map((part, i) => (
                    <li key={part.slug}>
                      <Link
                        href={`/${part.slug}`}
                        className={`flex items-start gap-2.5 px-4 py-2.5 text-xs transition-colors ${
                          part.slug === slug ? 'bg-[#fef2f2] text-[#dc2626] font-semibold' : 'text-slate-600 hover:bg-slate-50 hover:text-[#dc2626]'
                        }`}
                      >
                        <span className={`shrink-0 w-4 text-right ${part.slug === slug ? 'text-[#dc2626]' : 'text-slate-300'}`}>{i + 1}.</span>
                        <span className="leading-snug">{part.title}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {byAuthorData && byAuthorData.length > 1 && article.author && (
              <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">More by {article.author}</p>
                </div>
                <ul className="divide-y divide-slate-100">
                  {byAuthorData.map((a) => (
                    <li key={a.slug}>
                      <Link href={`/${a.slug}`} className="block px-4 py-2.5 text-xs text-slate-600 hover:bg-[#fff5f5] hover:text-[#dc2626] transition-colors leading-snug">
                        {a.title}
                      </Link>
                    </li>
                  ))}
                </ul>
                {authorRow?.slug && (
                  <div className="px-4 py-2.5 border-t border-slate-100">
                    <Link href={`/author/${authorRow.slug}`} className="text-xs text-[#dc2626] hover:text-[#b91c1c] font-medium">All articles →</Link>
                  </div>
                )}
              </div>
            )}

            {moreCatData && moreCatData.length > 0 && article.category && (
              <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">More in {article.category}</p>
                </div>
                <ul className="divide-y divide-slate-100">
                  {moreCatData.map((a) => (
                    <li key={a.slug}>
                      <Link href={`/${a.slug}`} className="block px-4 py-2.5 hover:bg-[#fff5f5] transition-colors group">
                        <span className="text-xs text-slate-600 group-hover:text-[#dc2626] leading-snug block">{a.title}</span>
                        {a.author && <span className="text-[11px] text-slate-400 mt-0.5 block">{a.author}</span>}
                      </Link>
                    </li>
                  ))}
                </ul>
                <div className="px-4 py-2.5 border-t border-slate-100">
                  <Link href={`/${categorySlug(article.category)}`} className="text-xs text-[#dc2626] hover:text-[#b91c1c] font-medium">All {article.category} articles →</Link>
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>
    </main>
  )
}

// ─── Router ───────────────────────────────────────────────────────────────────

export default async function SlugPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  if (getCategoryName(slug)) return CategoryPage({ slug })
  return ArticlePage({ slug })
}
