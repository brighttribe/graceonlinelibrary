import Link from 'next/link'
import type { Metadata } from 'next'
import { createSupabaseClient } from '@/lib/supabase'
import type { ArticlePreview } from '@/lib/types'

export const metadata: Metadata = {
  title: 'Grace Online Library — Reformed & Puritan Theological Resources',
  description: 'A curated library of Reformed, Puritan, and confessionally Baptist theological articles — free for the church since 1999.',
}

const FEATURED_CATEGORIES = [
  { slug: 'reformed-theology',        name: 'Reformed Theology' },
  { slug: 'five-points-of-calvinism', name: 'Five Points of Calvinism' },
  { slug: 'puritans',                 name: 'Puritans' },
  { slug: 'sovereignty-of-god',       name: 'Sovereignty of God' },
  { slug: 'church-history',           name: 'Church History' },
  { slug: 'covenant-theology',        name: 'Covenant Theology' },
  { slug: 'justification',            name: 'Justification' },
  { slug: 'sanctification',           name: 'Sanctification' },
  { slug: 'eschatology',              name: 'Eschatology' },
  { slug: 'apologetics',              name: 'Apologetics' },
  { slug: 'biographies',              name: 'Biographies' },
  { slug: 'the-atonement',            name: 'The Atonement' },
]

export default async function HomePage() {
  const supabase = createSupabaseClient()
  const { data: recent } = await supabase
    .from('articles')
    .select('id, title, slug, excerpt, category, author, published_at, featured')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(12)

  const articles = (recent ?? []) as ArticlePreview[]

  return (
    <main>

      {/* ── Hero ── */}
      <section
        className="relative overflow-hidden border-b border-[#e5e7eb] pt-24 pb-20 px-6"
        style={{ background: '#e8e8e8' }}
      >
        <div className="relative max-w-3xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-bold mb-5 tracking-tight leading-[1.1] text-[#1a1a1a]">
            A Curated Library of<br />
            <span className="text-[#d33d26]">Puritan &amp; Reformed</span> Theology
          </h1>
          <p className="text-lg text-slate-500 max-w-xl mx-auto leading-relaxed">
            Historic Baptist, Reformed, and Puritan resources for pastors, students, and serious Bible readers.
          </p>
        </div>
      </section>

      {/* ── Browse by Topic ── */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-[#111111] mb-2">Browse by Topic</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {FEATURED_CATEGORIES.map((cat) => (
              <Link
                key={cat.slug}
                href={`/${cat.slug}`}
                className="bg-white border border-slate-200 rounded-xl px-4 py-3.5 text-sm font-medium text-[#111111] hover:bg-[#dc2626] hover:text-white hover:border-[#dc2626] transition-all shadow-sm text-center"
              >
                {cat.name}
              </Link>
            ))}
          </div>
          <div className="text-center mt-6">
            <Link href="/articles" className="text-sm text-[#dc2626] font-medium hover:underline">
              View all articles →
            </Link>
          </div>
        </div>
      </section>

      {/* ── Recent Articles ── */}
      <section className="py-16 px-4 bg-[#f5f5f5]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-[#111111] mb-2">Recent Articles</h2>
            <p className="text-slate-500 text-sm">Timeless Reformed and Puritan writings</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {articles.map((article) => (
              <Link
                key={article.slug}
                href={`/${article.slug}`}
                className="bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-md hover:-translate-y-0.5 transition-all group"
              >
                {article.category && (
                  <span className="text-xs font-semibold text-[#dc2626] uppercase tracking-wider">{article.category}</span>
                )}
                <h3 className="mt-1.5 text-base font-semibold text-[#111111] leading-snug group-hover:text-[#dc2626] transition-colors line-clamp-2">
                  {article.title}
                </h3>
                {article.excerpt && (
                  <p className="mt-2 text-sm text-slate-500 leading-relaxed line-clamp-3">{article.excerpt}</p>
                )}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── About strip ── */}
      <section className="py-16 px-4 bg-white border-t border-slate-100">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-[#111111] mb-4">About Grace Online Library</h2>
          <p className="text-slate-500 leading-relaxed mb-6 max-w-xl mx-auto">
            Founded in 1999, Grace Online Library has served pastors, students, and serious Bible readers with curated Reformed and Puritan theological resources — completely free.
          </p>
          <Link href="/about" className="inline-flex items-center gap-2 bg-[#dc2626] hover:bg-[#b91c1c] text-white px-6 py-2.5 rounded-xl font-semibold text-sm transition-colors">
            Learn More
          </Link>
        </div>
      </section>

    </main>
  )
}
