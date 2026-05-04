import type { Metadata } from 'next'
import Link from 'next/link'
import { createSupabaseClient } from '@/lib/supabase'
import type { ArticlePreview } from '@/lib/types'

export const metadata: Metadata = {
  title: 'All Articles',
  description: 'Browse all 774 Reformed and Puritan theological articles in the Grace Online Library.',
}

export default async function ArticlesPage() {
  const supabase = createSupabaseClient()
  const { data } = await supabase
    .from('articles')
    .select('id, title, slug, excerpt, category, author, published_at, featured')
    .eq('status', 'published')
    .order('title')

  const articles = (data ?? []) as ArticlePreview[]

  const byCategory: Record<string, ArticlePreview[]> = {}
  for (const a of articles) {
    const cat = a.category ?? 'Uncategorized'
    if (!byCategory[cat]) byCategory[cat] = []
    byCategory[cat].push(a)
  }
  const categories = Object.keys(byCategory).sort()

  return (
    <main>
      <div className="relative overflow-hidden border-b border-[#e5e7eb]" style={{ background: '#f5f5f5' }}>
        <div className="relative max-w-5xl mx-auto px-4 py-12">
          <nav className="mb-3 text-sm text-slate-400 flex items-center gap-1.5">
            <Link href="/" className="hover:text-slate-600 transition-colors">Home</Link>
            <span>›</span>
            <span className="text-[#dc2626]">All Articles</span>
          </nav>
          <h1 className="text-3xl font-bold text-[#1a1a1a]">All Articles</h1>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-10 space-y-12">
        {categories.map((cat) => (
          <div key={cat}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-[#111111]" style={{ fontFamily: "Georgia, serif" }}>{cat}</h2>
              <Link href={`/${slugify(cat)}`} className="text-xs text-[#dc2626] font-medium hover:underline">
                View all →
              </Link>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <ul className="divide-y divide-slate-100">
                {byCategory[cat].map((article) => (
                  <li key={article.slug}>
                    <Link href={`/${article.slug}`} className="flex items-baseline justify-between px-5 py-3.5 hover:bg-red-50/50 transition-colors group">
                      <span className="font-medium text-[#111111] group-hover:text-[#dc2626] transition-colors text-sm leading-snug pr-4">
                        {article.title}
                      </span>
                      {article.author && (
                        <span className="text-xs text-slate-400 shrink-0">{article.author}</span>
                      )}
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

function slugify(text: string) {
  return text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s_]+/g, '-').replace(/^-+|-+$/g, '')
}
