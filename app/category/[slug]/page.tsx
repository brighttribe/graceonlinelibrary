import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { createSupabaseClient } from '@/lib/supabase'
import type { ArticlePreview } from '@/lib/types'
import { CATEGORY_SLUGS, CATEGORY_CHILDREN } from '@/lib/categories'

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

  // Fetch articles and sub-category counts in parallel
  const childNames = childSlugs.map((s) => CATEGORY_SLUGS[s]).filter(Boolean)

  const [{ data: articleData }, { data: allCatData }] = await Promise.all([
    supabase
      .from('articles')
      .select('id, title, slug, excerpt, category, author, published_at, featured')
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
  ])

  const articles = (articleData ?? []) as ArticlePreview[]

  // Count articles per child category (an article may match via category or tags)
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

  const subCats: SubCat[] = childSlugs
    .map((s) => ({ slug: s, name: CATEGORY_SLUGS[s] ?? s, count: countMap[CATEGORY_SLUGS[s]] ?? 0 }))
    .filter((s) => s.count > 0)

  const totalCount = articles.length + Object.values(countMap).reduce((a, b) => a + b, 0)

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
        <div className="relative max-w-5xl mx-auto px-4 pt-6 pb-10">
          <nav className="mb-5 text-sm text-white/40 flex items-center gap-1.5">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <span>›</span>
            <Link href="/topics" className="hover:text-white transition-colors">Topics</Link>
            <span>›</span>
            <span className="text-white/70">{categoryName}</span>
          </nav>
          <h1 className="text-3xl sm:text-4xl font-bold leading-tight mb-3">{categoryName}</h1>
          <p className="text-white/50 text-sm">
            {subCats.length > 0 ? `${totalCount} articles across ${subCats.length} sub-topics` : `${articles.length} ${articles.length === 1 ? 'article' : 'articles'}`}
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-10 space-y-10">
        {/* Sub-category navigation */}
        {subCats.length > 0 && (
          <div>
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">Browse by Sub-topic</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {subCats.map((sub) => (
                <Link
                  key={sub.slug}
                  href={`/category/${sub.slug}`}
                  className="group flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 hover:border-[#7c3aed] hover:bg-[#faf8ff] transition-all shadow-sm"
                >
                  <span className="text-sm font-medium text-[#111111] group-hover:text-[#7c3aed] transition-colors leading-snug">
                    {sub.name}
                  </span>
                  <span className="ml-3 shrink-0 text-xs font-semibold text-white bg-[#7c3aed] group-hover:bg-[#6d28d9] rounded-full px-2 py-0.5 transition-colors">
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
                {articles.map((article) => (
                  <li key={article.slug}>
                    <Link href={`/articles/${article.slug}`} className="flex items-start justify-between px-6 py-4 hover:bg-[#faf8ff] transition-colors group">
                      <div className="flex-1 pr-4">
                        <h2 className="font-semibold text-[#111111] group-hover:text-[#7c3aed] transition-colors leading-snug text-sm">
                          {article.title}
                        </h2>
                        {article.excerpt && (
                          <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">{article.excerpt}</p>
                        )}
                      </div>
                      {article.author && (
                        <span className="text-xs text-slate-400 shrink-0 mt-0.5">{article.author}</span>
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
    </main>
  )
}
