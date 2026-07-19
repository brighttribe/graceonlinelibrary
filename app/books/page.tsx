import Link from 'next/link'
import type { Metadata } from 'next'
import { hubCategories, type HubCategory } from '@/lib/books'
import { CATEGORY_CHILDREN, CATEGORY_SLUGS } from '@/lib/categories'
import { BookCover } from '@/components/BookBits'

export const metadata: Metadata = {
  title: 'Reformed & Puritan Reading Guides',
  description:
    'Tiered reading guides to the best Reformed and Puritan books by topic, from beginner introductions to advanced study, curated by Grace Online Library.'.slice(
      0,
      160
    ),
  alternates: { canonical: '/books' },
}

// Section order for the hub, drawn from the site's own category hierarchy.
const SECTIONS: { title: string; parent: string }[] = [
  { title: 'Reformed Theology', parent: 'reformed-theology' },
  { title: 'The Five Points of Calvinism', parent: 'five-points-of-calvinism' },
  { title: 'Doctrine & Theology', parent: 'doctrine-theology' },
  { title: 'The Doctrine of God', parent: 'doctrine-of-god' },
  { title: 'Salvation', parent: 'salvation' },
  { title: 'The Christian Life', parent: 'christian-life' },
  { title: 'Church & Ministry', parent: 'church-ministry' },
  { title: 'Church History', parent: 'church-history' },
  { title: 'Last Things', parent: 'eschatology' },
  { title: 'Home & Family', parent: 'home-family' },
]

function CategoryCard({ cat }: { cat: HubCategory }) {
  return (
    <Link
      href={`/books/${cat.slug}`}
      className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#dc2626] hover:shadow-md"
    >
      <div className="flex shrink-0 -space-x-3">
        {cat.covers.slice(0, 3).map((b) => (
          <div key={b.id} className="w-10 overflow-hidden rounded shadow ring-1 ring-black/5">
            <BookCover book={b} sizes="40px" className="!shadow-none !ring-0" />
          </div>
        ))}
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="text-sm font-bold leading-snug text-[#111111] group-hover:text-[#dc2626]">{cat.category}</h3>
        <p className="text-xs text-slate-400">{cat.count} books</p>
      </div>
    </Link>
  )
}

export default async function BooksHubPage() {
  const cats = await hubCategories()
  const bySlug = new Map(cats.map((c) => [c.slug, c]))
  const used = new Set<string>()

  const sections = SECTIONS.map((s) => {
    const slugs = [s.parent, ...(CATEGORY_CHILDREN[s.parent] ?? [])]
    const items = slugs
      .map((slug) => bySlug.get(slug))
      .filter((c): c is HubCategory => !!c)
    items.forEach((c) => used.add(c.slug))
    return { title: s.title, items }
  }).filter((s) => s.items.length > 0)

  const leftovers = cats.filter((c) => !used.has(c.slug))
  if (leftovers.length) sections.push({ title: 'More Topics', items: leftovers })

  const totalBooks = cats.reduce((n, c) => n + c.count, 0)
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://graceonlinelibrary.org'
  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        name: 'Reformed & Puritan Reading Guides',
        description: metadata.description,
        url: `${siteUrl}/books`,
        publisher: { '@type': 'Organization', name: 'Grace Online Library', url: siteUrl },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: `${siteUrl}/` },
          { '@type': 'ListItem', position: 2, name: 'Reading Guides', item: `${siteUrl}/books` },
        ],
      },
    ],
  }

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />

      <section className="border-b border-[#e5e7eb] px-6 pt-16 pb-12" style={{ background: '#e8e8e8' }}>
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="mb-4 text-4xl font-bold leading-[1.1] tracking-tight text-[#1a1a1a] sm:text-5xl">
            Reformed &amp; Puritan <span className="text-[#d33d26]">Reading Guides</span>
          </h1>
          <p className="mx-auto max-w-xl text-lg leading-relaxed text-slate-500">
            The best books on {cats.length} topics, tiered from beginner introductions to advanced study. {totalBooks}{' '}
            titles, hand-picked for pastors, students, and serious readers.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-4 py-14">
        <div className="space-y-12">
          {sections.map((s) => (
            <div key={s.title}>
              <h2 className="mb-5 text-xs font-semibold uppercase tracking-widest text-slate-400">{s.title}</h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {s.items.map((c) => (
                  <CategoryCard key={c.slug} cat={c} />
                ))}
              </div>
            </div>
          ))}
        </div>

        <a
          href="https://puritanpaperbacks.com"
          target="_blank"
          rel="noopener noreferrer"
          className="group mt-14 block rounded-2xl border border-slate-200 bg-[#faf7f5] p-6 text-center transition-colors hover:border-[#dc2626] sm:p-8"
        >
          <p className="text-[11px] font-semibold uppercase tracking-widest text-[#dc2626]">Our Sister Site</p>
          <h2 className="mt-2 text-xl font-bold text-[#111111]">Explore the Puritan Paperbacks Collection</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-slate-600">
            Browse the full Banner of Truth Puritan Paperbacks series with reading guides, author collections, and
            thousands of quotes at PuritanPaperbacks.com.
          </p>
          <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[#dc2626] group-hover:text-[#b91c1c]">
            Visit Puritan Paperbacks &rarr;
          </span>
        </a>

        <p className="mt-10 text-center text-[11px] leading-relaxed text-slate-400">
          Grace Online Library is an Amazon Associate. Purchases through these links help support the library at no
          extra cost to you.
        </p>
      </div>
    </main>
  )
}
