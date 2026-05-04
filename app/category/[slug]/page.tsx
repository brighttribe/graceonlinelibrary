import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { createSupabaseClient } from '@/lib/supabase'
import type { ArticlePreview } from '@/lib/types'
import { CATEGORY_SLUGS, CATEGORY_CHILDREN, CATEGORY_PARENT } from '@/lib/categories'
import { readingTime } from '@/lib/content'

function getCategoryName(slug: string): string | null {
  return CATEGORY_SLUGS[slug] ?? null
}

export function generateStaticParams() {
  return Object.keys(CATEGORY_SLUGS).map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const name = getCategoryName(slug)
  if (!name) return {}
  return {
    title: `${name} Articles`,
    description: `Reformed and Puritan articles on ${name} from Grace Online Library.`,
  }
}

type SubCat = { slug: string; name: string; count: number }

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const categoryName = getCategoryName(slug)
  if (!categoryName) notFound()

  const supabase = createSupabaseClient()
  const childSlugs = CATEGORY_CHILDREN[slug] ?? []
  const parentSlug = CATEGORY_PARENT[slug] ?? null
  const parentName = parentSlug ? getCategoryName(parentSlug) : null

  // Sibling categories (other children of the same parent)
  const siblingsSlugs = parentSlug ? (CATEGORY_CHILDREN[parentSlug] ?? []).filter(s => s !== slug) : []

  // Fetch articles and sub-category counts in parallel
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
      ? supabase
          .from('articles')
          .select('category, tags')
          .eq('status', 'published')
          .or(childNames.map(n => `category.eq.${n},tags.cs.{${n}}`).join(','))
      : Promise.resolve({ data: [] }),
    siblingNames.length > 0
      ? supabase
          .from('articles')
          .select('category, tags')
          .eq('status', 'published')
          .or(siblingNames.map(n => `category.eq.${n},tags.cs.{${n}}`).join(','))
      : Promise.resolve({ data: [] }),
  ])

  type ArticleRow = ArticlePreview & { content: string | null }
  const articles = (articleData ?? []) as ArticleRow[]

  // Count articles per child category
  const countMap: Record<string, number> = {}
  for (const row of allCatData ?? []) {
    const matched = new Set<string>()
    if (childNames.includes(row.category)) matched.add(row.category)
    for (const tag of row.tags ?? []) {
      if (childNames.includes(tag)) matched.add(tag)
    }
    for (const name of matched) {
      countMap[name] = (countMap[name] ?? 0) + 1
    }
  }

  // Count articles per sibling category
  const siblingCountMap: Record<string, number> = {}
  for (const row of siblingCountData ?? []) {
    const matched = new Set<string>()
    if (siblingNames.includes(row.category)) matched.add(row.category)
    for (const tag of row.tags ?? []) {
      if (siblingNames.includes(tag)) matched.add(tag)
    }
    for (const name of matched) {
      siblingCountMap[name] = (siblingCountMap[name] ?? 0) + 1
    }
  }

  const subCats: SubCat[] = childSlugs
    .map((s) => ({ slug: s, name: CATEGORY_SLUGS[s] ?? s, count: countMap[CATEGORY_SLUGS[s]] ?? 0 }))
    .filter((s) => s.count > 0)

  const siblings: SubCat[] = siblingsSlugs
    .map((s) => ({ slug: s, name: CATEGORY_SLUGS[s] ?? s, count: siblingCountMap[CATEGORY_SLUGS[s]] ?? 0 }))
    .filter((s) => s.count > 0)

  const totalCount = articles.length + Object.values(countMap).reduce((a, b) => a + b, 0)

  // Breadcrumb: build parent chain
  const breadcrumb = parentSlug && parentName
    ? [{ href: `/category/${parentSlug}`, label: parentName }]
    : []

  return (
    <main>
      {/* Hero */}
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

          {/* Main content */}
          <div className="flex-1 min-w-0 space-y-10">

            {/* Sub-category navigation */}
            {subCats.length > 0 && (
              <div>
                <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">Browse by Sub-topic</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {subCats.map((sub) => (
                    <Link
                      key={sub.slug}
                      href={`/category/${sub.slug}`}
                      className="group flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 hover:border-[#dc2626] hover:bg-[#fff5f5] transition-all shadow-sm"
                    >
                      <span className="text-sm font-medium text-[#111111] group-hover:text-[#dc2626] transition-colors leading-snug">
                        {sub.name}
                      </span>
                      <span className="ml-3 shrink-0 text-xs font-semibold text-white bg-[#dc2626] group-hover:bg-[#b91c1c] rounded-full px-2 py-0.5 transition-colors">
                        {sub.count}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Articles in this category */}
            {articles.length > 0 && (
              <div>
                {subCats.length > 0 && (
                  <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">
                    Articles in {categoryName}
                  </h2>
                )}
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                  <ul className="divide-y divide-slate-100">
                    {articles.map((article, i) => (
                      <li key={article.slug} className={i % 2 === 1 ? 'bg-slate-100' : ''}>
                        <Link href={`/articles/${article.slug}`} className="block px-6 py-3.5 hover:bg-[#fff5f5] transition-colors group">
                          <p className="font-semibold text-[#111111] group-hover:text-[#dc2626] transition-colors leading-snug text-sm">
                            {article.title}
                          </p>
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

          {/* Sidebar — sibling categories (only on child pages) */}
          {siblings.length > 0 && (
            <aside className="w-56 shrink-0 hidden lg:block">
              <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
                  {parentName && parentSlug && (
                    <Link href={`/category/${parentSlug}`} className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest hover:text-[#dc2626] transition-colors">
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
                      <Link href={`/category/${s.slug}`} className="flex items-center justify-between px-4 py-2.5 text-xs text-slate-600 hover:bg-slate-50 hover:text-[#dc2626] transition-colors group">
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
