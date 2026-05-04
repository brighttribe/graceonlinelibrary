# Admin Panel – Brainstorm

Similar to brandblueprint.ai blog post editor.

## Core Features

- **Article editor**
  - WYSIWYG + raw HTML/code toggle
  - Editable preview (see how it'll look live)
  - Slug editor (auto-generated, manually overridable)
  - Meta title, meta description, keywords fields
  - Category selector (dropdown from existing categories)
  - Image field (upload/URL, not displayed in articles yet but store it)
  - Status toggle: draft / published
  - Published date picker

- **Search / list view**
  - Full-text search by title, author, content
  - Filter by category, status, author
  - Sortable columns (title, author, date, category)
  - Bulk status change

- **Author management**
  - Edit bio (short) and bio_long
  - View all articles by author

## Tech options to consider

- Next.js App Router with server actions (stays in same codebase)
- Route group `(admin)` with its own layout + auth middleware
- Auth: NextAuth or Supabase Auth (already using Supabase)
- Editor: TipTap (WYSIWYG + code mode) or Lexical
- Protect with a simple password/session or role-based Supabase RLS

---

# Amazon Affiliate Book Links – Brainstorm

Monetize via Amazon Associates by surfacing relevant book recommendations.

## Placement ideas

- **Article pages** — sidebar or end-of-article "Books on this topic" section
- **Category pages** — "Recommended reading" block above or below the article list
- **Author pages** — "Books by this author" if they have published works on Amazon

## Data

- **DB table:** `books` — id, title, author, asin, cover_image_url, description, category/topic tags, affiliate_url
- Or store as ASIN + generate affiliate URL dynamically with your Associates tag

## Sourcing

- Manually curate a starter list of classic Reformed/Puritan titles
- Could scrape book recommendations from existing Reformed resource sites
- Amazon Product Advertising API for metadata/covers (requires Associates account)

## Notes

- Need Amazon Associates account + tracking ID
- FTC disclosure required on any page with affiliate links
- Focus on public domain author's MODERN EDITIONS (Banner of Truth, Reformation Heritage, etc.) — high relevance, good conversion

---

# Quotes Section – Brainstorm

Dedicated quotes area with hundreds of scraped Reformed/Puritan quotes, browsable by topic.

## Data

- **DB table:** `quotes` — id, quote (text), author, source (book/sermon title), topic, slug
- **Open questions:**
  - Single topic per quote or multiple tags?
  - Use same category taxonomy as articles, or simpler tag system?
  - Include source field (depends on scrape quality)

## Scraping

- **Primary target:** gracegems.org "pithy gems from various authors" — already a curated quote collection with attribution
- Use sitemap/CDX API approach same as article scraping plan

## Pages

- `/quotes` — masonry grid of cards, filter by topic
- `/quotes/[topic]` — quotes by topic
- Maybe `/quotes/[author]` — all quotes by an author

## UI

- Masonry card grid — visual, distinct feel from article list pages
- Quote text large, author + source below in muted text
- Topic tags on each card

---

## Notes

- Not building now — frontend fixes first
- Image field: store URL in DB, display TBD
- Series fields (series_slug, series_name, part_num) should be visible/editable too
