import Link from 'next/link'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { booksForSlug, TIER_ORDER } from '@/lib/books'
import CategoryBooksModule from '@/components/CategoryBooksModule'
import guideMeta from '@/content/book-guide-meta.json'

type Meta = Record<string, { category: string; definition: string }>
const META = guideMeta as Meta

export function generateStaticParams() {
  return Object.keys(META).map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const m = META[slug]
  if (!m) return {}
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://graceonlinelibrary.org'
  return {
    title: `Best Books on ${m.category}`.slice(0, 60),
    description: `A tiered reading guide to the best Reformed books on ${m.category}, from beginner to advanced.`.slice(
      0,
      160
    ),
    alternates: { canonical: `${siteUrl}/books/${slug}` },
  }
}

export default async function GuideCategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const m = META[slug]
  if (!m) notFound()

  const books = await booksForSlug(slug)
  const total = TIER_ORDER.reduce((n, t) => n + books[t].length, 0)
  if (total === 0) notFound()

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://graceonlinelibrary.org'
  const all = [...books.basic, ...books.intermediate, ...books.advanced]
  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        name: `Best Books on ${m.category}`,
        description: m.definition,
        url: `${siteUrl}/books/${slug}`,
        publisher: { '@type': 'Organization', name: 'Grace Online Library', url: siteUrl },
      },
      {
        '@type': 'ItemList',
        name: `Best Books on ${m.category}`,
        itemListElement: all.slice(0, 20).map((b, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          item: {
            '@type': 'Book',
            name: b.title,
            author: b.author ? { '@type': 'Person', name: b.author } : undefined,
            isbn: b.isbn13 || undefined,
            url: b.affiliate_url || undefined,
          },
        })),
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: `${siteUrl}/` },
          { '@type': 'ListItem', position: 2, name: 'Reading Guides', item: `${siteUrl}/books` },
          { '@type': 'ListItem', position: 3, name: m.category, item: `${siteUrl}/books/${slug}` },
        ],
      },
    ],
  }

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />

      <section className="border-b border-[#e5e7eb] px-6 pt-8 pb-10" style={{ background: '#f5f5f5' }}>
        <div className="mx-auto max-w-4xl">
          <nav className="mb-5 flex flex-wrap items-center gap-1.5 text-sm text-slate-400">
            <Link href="/" className="transition-colors hover:text-slate-600">
              Home
            </Link>
            <span>›</span>
            <Link href="/books" className="transition-colors hover:text-slate-600">
              Reading Guides
            </Link>
            <span>›</span>
            <span className="text-[#dc2626]">{m.category}</span>
          </nav>
          <h1 className="mb-3 text-3xl font-bold leading-tight text-[#1a1a1a] sm:text-4xl">
            Best Books on {m.category}
          </h1>
          {m.definition && <p className="max-w-2xl text-base leading-relaxed text-slate-600">{m.definition}</p>}
        </div>
      </section>

      <div className="mx-auto max-w-4xl px-4 py-12">
        <CategoryBooksModule books={books} category={m.category} />

        <div className="mt-12 border-t border-slate-200 pt-8 text-center">
          <Link href={`/${slug}`} className="text-sm font-medium text-[#dc2626] hover:text-[#b91c1c]">
            Read {m.category} articles →
          </Link>
        </div>
      </div>
    </main>
  )
}
