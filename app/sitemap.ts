import { MetadataRoute } from 'next'
import { createSupabaseClient } from '@/lib/supabase'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://graceonlinelibrary.org'
  const supabase = createSupabaseClient()
  const { data } = await supabase.from('articles').select('slug, updated_at').eq('status', 'published')

  const articleUrls = (data ?? []).map((a) => ({
    url: `${siteUrl}/articles/${a.slug}/`,
    lastModified: new Date(a.updated_at),
    changeFrequency: 'yearly' as const,
    priority: 0.7,
  }))

  return [
    { url: `${siteUrl}/`, lastModified: new Date(), changeFrequency: 'weekly', priority: 1.0 },
    { url: `${siteUrl}/articles/`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
    { url: `${siteUrl}/about/`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    ...articleUrls,
  ]
}
