import { createSupabaseClient } from '@/lib/supabase'
import { CATEGORY_PARENT, CATEGORY_SLUGS, categorySlug } from '@/lib/categories'

export type Tier = 'basic' | 'intermediate' | 'advanced'

export type RecBook = {
  id: string
  title: string
  author: string | null
  year: number | null
  cover_url: string | null
  affiliate_url: string | null
  isbn13: string | null
  tier: Tier
  why: string | null
  top_pick: boolean
  sort: number
}

export type CategoryBooks = {
  basic: RecBook[]
  intermediate: RecBook[]
  advanced: RecBook[]
}

export const TIER_ORDER: Tier[] = ['basic', 'intermediate', 'advanced']
export const TIER_LABEL: Record<Tier, string> = {
  basic: 'Start Here',
  intermediate: 'Go Deeper',
  advanced: 'For Study',
}

const SELECT =
  'tier, why, top_pick, sort, book:books(id, title, author, year, cover_url, affiliate_url, isbn13)'

// PostgREST returns the embedded book as a nested object; flatten it.
function shape(rows: unknown[]): RecBook[] {
  return (rows ?? [])
    .map((r) => {
      const row = r as Record<string, unknown>
      const b = (Array.isArray(row.book) ? row.book[0] : row.book) as Record<string, unknown> | undefined
      if (!b) return null
      return {
        id: String(b.id),
        title: String(b.title),
        author: (b.author as string) ?? null,
        year: (b.year as number) ?? null,
        cover_url: (b.cover_url as string) ?? null,
        affiliate_url: (b.affiliate_url as string) ?? null,
        isbn13: (b.isbn13 as string) ?? null,
        tier: row.tier as Tier,
        why: (row.why as string) ?? null,
        top_pick: !!row.top_pick,
        sort: (row.sort as number) ?? 0,
      } as RecBook
    })
    .filter(Boolean) as RecBook[]
}

function group(books: RecBook[]): CategoryBooks {
  const out: CategoryBooks = { basic: [], intermediate: [], advanced: [] }
  for (const b of books) if (out[b.tier]) out[b.tier].push(b)
  for (const t of TIER_ORDER) out[t].sort((a, b) => Number(b.top_pick) - Number(a.top_pick) || a.sort - b.sort)
  return out
}

function flat(cb: CategoryBooks): RecBook[] {
  return [...cb.basic, ...cb.intermediate, ...cb.advanced]
}

/** All tiered books for a category slug (used by the hub + category pages). */
export async function booksForSlug(slug: string): Promise<CategoryBooks> {
  const supabase = createSupabaseClient()
  const { data } = await supabase.from('book_categories').select(SELECT).eq('slug', slug)
  return group(shape(data ?? []))
}

/** Tiered books for a category NAME (articles carry the display name). Falls
 *  back to the parent category if the exact one has nothing. */
export async function booksForCategoryName(category: string): Promise<{ slug: string; books: CategoryBooks }> {
  const supabase = createSupabaseClient()
  const slug = categorySlug(category)
  const { data } = await supabase.from('book_categories').select(SELECT).eq('slug', slug)
  let books = group(shape(data ?? []))
  let usedSlug = slug
  if (flat(books).length === 0) {
    const parent = CATEGORY_PARENT[slug]
    if (parent) {
      const { data: pd } = await supabase.from('book_categories').select(SELECT).eq('slug', parent)
      books = group(shape(pd ?? []))
      usedSlug = parent
    }
  }
  return { slug: usedSlug, books }
}

/** Picks for an article: one inline callout book + an end-of-article strip. */
export async function articleBookPicks(
  category: string | null
): Promise<{ inline: RecBook | null; strip: RecBook[]; slug: string | null }> {
  if (!category) return { inline: null, strip: [], slug: null }
  const { slug, books } = await booksForCategoryName(category)
  const all = flat(books)
  if (all.length === 0) return { inline: null, strip: [], slug }

  // Inline: the basic top pick (most accessible), else first basic, else first.
  const inline = books.basic.find((b) => b.top_pick) ?? books.basic[0] ?? all[0]

  // Strip: top pick of each tier, then fill to 4, never repeating the inline.
  const picks: RecBook[] = []
  for (const t of TIER_ORDER) {
    const tp = books[t].find((b) => b.top_pick)
    if (tp) picks.push(tp)
  }
  for (const b of all) {
    if (picks.length >= 4) break
    if (!picks.find((p) => p.id === b.id)) picks.push(b)
  }
  const strip = picks.filter((b) => b.id !== inline.id).slice(0, 4)
  return { inline, strip, slug }
}

export type HubCategory = {
  slug: string
  category: string
  count: number
  covers: RecBook[]
}

// Like SELECT, but also carries slug + category so we can group in one pass.
const SELECT_WITH_CAT =
  'slug, category, tier, why, top_pick, sort, book:books(id, title, author, year, cover_url, affiliate_url, isbn13)'

/** All categories that have books, with a few cover thumbnails (for the hub). */
export async function hubCategories(): Promise<HubCategory[]> {
  const supabase = createSupabaseClient()
  const { data } = await supabase.from('book_categories').select(SELECT_WITH_CAT)
  const groups = new Map<string, { slug: string; category: string; books: RecBook[]; seen: Set<string> }>()
  for (const row of data ?? []) {
    const r = row as Record<string, unknown>
    const slug = r.slug as string
    if (!groups.has(slug)) groups.set(slug, { slug, category: r.category as string, books: [], seen: new Set() })
    const g = groups.get(slug)!
    const [book] = shape([row])
    if (book && !g.seen.has(book.id)) {
      g.seen.add(book.id)
      g.books.push(book)
    }
  }
  return [...groups.values()]
    .map((g) => ({
      slug: g.slug,
      category: g.category,
      count: g.books.length,
      covers: g.books.filter((b) => b.cover_url).slice(0, 4),
    }))
    .sort((a, b) => a.category.localeCompare(b.category))
}

/** A rotating-free featured set for the homepage: top picks with covers. */
export async function homepageFeatured(limit = 8): Promise<RecBook[]> {
  const supabase = createSupabaseClient()
  const { data } = await supabase
    .from('book_categories')
    .select(SELECT)
    .eq('top_pick', true)
    .eq('tier', 'basic')
  const books = shape(data ?? []).filter((b) => b.cover_url)
  // de-dupe by book id, keep a spread
  const seen = new Set<string>()
  const out: RecBook[] = []
  for (const b of books) {
    if (seen.has(b.id)) continue
    seen.add(b.id)
    out.push(b)
    if (out.length >= limit) break
  }
  return out
}

export function hasGuideCategory(slug: string): boolean {
  return !!CATEGORY_SLUGS[slug]
}

export type AuthorBook = {
  id: string
  title: string
  author: string | null
  year: number | null
  cover_url: string | null
  affiliate_url: string | null
  isbn13: string | null
}

// Must match the author_key backfill in seed-books.js: lowercase, drop
// punctuation and single-letter initials, then key on first + last token.
export function authorKey(name: string): string {
  const n = (name || '')
    .toLowerCase()
    .replace(/[.,]/g, '')
    .replace(/\b[a-z]\b/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  const p = n.split(' ').filter(Boolean)
  if (!p.length) return ''
  return `${p[0]}|${p[p.length - 1]}`
}

/** Every book we have by a given author (matched on a normalized name key). */
export async function booksByAuthor(name: string): Promise<AuthorBook[]> {
  const key = authorKey(name)
  if (!key) return []
  const supabase = createSupabaseClient()
  const { data } = await supabase
    .from('books')
    .select('id, title, author, year, cover_url, affiliate_url, isbn13')
    .eq('author_key', key)
  const books = (data ?? []) as AuthorBook[]
  // Covered books first, then newest, then alphabetical.
  return books.sort(
    (a, b) =>
      Number(!!b.cover_url) - Number(!!a.cover_url) ||
      (b.year ?? 0) - (a.year ?? 0) ||
      a.title.localeCompare(b.title)
  )
}
