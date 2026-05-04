import { MetadataRoute } from 'next'
import { createSupabaseClient } from '@/lib/supabase'
import { CATEGORY_SLUGS } from '@/lib/categories'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://graceonlinelibrary.org'
  const supabase = createSupabaseClient()

  const [{ data: articles }, { data: authors }] = await Promise.all([
    supabase.from('articles').select('slug, updated_at').eq('status', 'published'),
    supabase.from('authors').select('slug').gt('article_count', 0),
  ])

  const articleUrls = (articles ?? []).map((a) => ({
    url: `${siteUrl}/${a.slug}/`,
    lastModified: new Date(a.updated_at),
    changeFrequency: 'yearly' as const,
    priority: 0.7,
  }))

  const categoryUrls = Object.keys(CATEGORY_SLUGS).map((slug) => ({
    url: `${siteUrl}/${slug}/`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }))

  const authorUrls = (authors ?? []).map((a) => ({
    url: `${siteUrl}/author/${a.slug}/`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.5,
  }))

  return [
    { url: `${siteUrl}/`,         lastModified: new Date(), changeFrequency: 'weekly',  priority: 1.0 },
    { url: `${siteUrl}/articles/`, lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.9 },
    { url: `${siteUrl}/authors/`,  lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${siteUrl}/topics/`,   lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${siteUrl}/about/`,    lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    ...categoryUrls,
    ...authorUrls,
    ...articleUrls,
  ]
}
