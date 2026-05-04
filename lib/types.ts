export type Article = {
  id: string
  wp_id: number | null
  title: string
  slug: string
  content: string | null
  excerpt: string | null
  category: string | null
  tags: string[]
  author: string | null
  published_at: string | null
  updated_at: string
  meta_title: string | null
  meta_description: string | null
  status: string
  featured: boolean
}

export type ArticlePreview = Pick<Article, 'id' | 'title' | 'slug' | 'excerpt' | 'category' | 'author' | 'published_at' | 'featured'>

export type Book = {
  id: string
  asin: string
  title: string
  author: string | null
  publisher: string | null
  cover_url: string | null
  affiliate_url: string | null
  verified: boolean
  topics: string[]
}
