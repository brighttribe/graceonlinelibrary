import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { createSupabaseClient } from '@/lib/supabase'
import { prepareContent } from '@/lib/content'
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

  const [{ data: article }, { data: related }] = await Promise.all([
    supabase.from('articles').select('*').eq('slug', slug).single(),
    supabase.from('articles').select('id, title, slug, category').eq('status', 'published').order('title').limit(200),
  ])

  if (!article) notFound()

  const { data: authorRow } = article.author
    ? await supabase
        .from('authors')
        .select('slug, article_count')
        .ilike('name', article.author)
        .single<{ slug: string; article_count: number }>()
    : { data: null }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://graceonlinelibrary.org'
  const pageUrl = `${siteUrl}/articles/${slug}/`

  const relatedArticles = (related ?? [])
    .filter((a) => a.slug !== slug && a.category === article.category)
    .slice(0, 6)

  const faqItems = [
    {
      '@type': 'Question',
      name: `What is "${article.title}" about?`,
      acceptedAnswer: {
        '@type': 'Answer',
        text: article.excerpt || `This article covers ${article.category ? `the topic of ${article.category}` : 'Reformed and Puritan theology'} from a biblical perspective.`,
      },
    },
    ...(article.author ? [{
      '@type': 'Question',
      name: `Who wrote "${article.title}"?`,
      acceptedAnswer: {
        '@type': 'Answer',
        text: `This article was written by ${article.author}.`,
      },
    }] : []),
    ...(article.category ? [{
      '@type': 'Question',
      name: `What topic does this article cover?`,
      acceptedAnswer: {
        '@type': 'Answer',
        text: `This article is categorized under ${article.category} and is part of the Grace Online Library's collection of Reformed and Puritan theological resources.`,
      },
    }] : []),
  ]

  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Article',
        headline: article.title,
        description: article.excerpt || '',
        url: pageUrl,
        datePublished: article.published_at,
        dateModified: article.updated_at,
        ...(article.author ? {
          author: { '@type': 'Person', name: article.author },
        } : {
          author: { '@type': 'Organization', name: 'Grace Online Library' },
        }),
        publisher: { '@type': 'Organization', name: 'Grace Online Library', url: siteUrl },
        mainEntityOfPage: pageUrl,
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl },
          ...(article.category ? [{ '@type': 'ListItem', position: 2, name: article.category, item: `${siteUrl}/category/${slugify(article.category)}/` }] : []),
          { '@type': 'ListItem', position: article.category ? 3 : 2, name: article.title, item: pageUrl },
        ],
      },
      {
        '@type': 'FAQPage',
        mainEntity: faqItems,
      },
    ],
  }

  const html = prepareContent(article.content || '')

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />

      {/* Article hero */}
      <div className="relative overflow-hidden text-white" style={{ background: 'radial-gradient(ellipse 140% 120% at 50% 10%, #3b1a8f 0%, #1e0a4e 45%, #0d0520 75%, #050212 100%)' }}>
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        <svg className="absolute top-0 right-0 w-[480px] h-[480px] pointer-events-none" viewBox="0 0 480 480" fill="none" aria-hidden="true">
          <circle cx="380" cy="100" r="200" stroke="rgba(139,92,246,0.04)" strokeWidth="60" />
          <circle cx="420" cy="60"  r="140" stroke="rgba(139,92,246,0.04)" strokeWidth="40" />
          <circle cx="340" cy="140" r="90"  stroke="rgba(139,92,246,0.04)" strokeWidth="30" />
        </svg>
        <div className="relative max-w-3xl mx-auto px-4 pt-6 pb-10">
          <nav className="mb-5 text-sm text-white/40 flex items-center gap-1.5 flex-wrap">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <span>›</span>
            <Link href="/articles" className="hover:text-white transition-colors">Articles</Link>
          </nav>
          {article.category && (
            <p className="text-[#c4b5fd] text-xs font-semibold uppercase tracking-widest mb-3 mt-6">{article.category}</p>
          )}
          <h1 className="text-3xl sm:text-4xl font-bold leading-tight mb-3">
            {article.title}
          </h1>
          {article.author && (
            <p className="text-white/50 text-sm mb-3">
              {'by '}
              {authorRow?.slug && (authorRow.article_count ?? 0) > 1 ? (
                <Link href={`/author/${authorRow.slug}`} className="text-white/50 hover:text-white/80 transition-colors">
                  {article.author}
                </Link>
              ) : (
                article.author
              )}
            </p>
          )}
        </div>
      </div>

      {/* Article body */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-4 py-12">
          <div
            className="prose prose-lg max-w-none"
            dangerouslySetInnerHTML={{ __html: html }}
          />
          {article.author && (
            <div className="mt-10">
              <AuthorBio authorName={article.author} />
            </div>
          )}
        </div>
      </div>

      {/* Related articles */}
      {relatedArticles.length > 0 && (
        <div className="bg-[#f5f5f5]">
          <div className="max-w-3xl mx-auto px-4 py-10">
            <h2 className="text-lg font-bold text-[#111111] mb-5">
              More in {article.category}
            </h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {relatedArticles.map((r) => (
                <Link
                  key={r.slug}
                  href={`/articles/${r.slug}`}
                  className="bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-[#111111] hover:text-[#7c3aed] hover:border-[#7c3aed] transition-all"
                >
                  {r.title}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

function slugify(text: string) {
  return text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s_]+/g, '-').replace(/^-+|-+$/g, '')
}
