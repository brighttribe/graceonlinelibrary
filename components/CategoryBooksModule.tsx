import Link from 'next/link'
import { TIER_ORDER, TIER_LABEL, type CategoryBooks, type RecBook } from '@/lib/books'
import { BookCover, AmazonButton, AffiliateNote } from '@/components/BookBits'

function GuideCard({ book }: { book: RecBook }) {
  return (
    <div className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <a
        href={book.affiliate_url ?? '#'}
        target="_blank"
        rel="sponsored noopener noreferrer"
        className="w-16 shrink-0 sm:w-20"
      >
        <BookCover book={book} sizes="80px" />
      </a>
      <div className="min-w-0 flex-1">
        <div className="flex items-start gap-2">
          <h3 className="min-w-0 flex-1 text-sm font-bold leading-snug text-[#111111]">{book.title}</h3>
          {book.top_pick && (
            <span className="shrink-0 rounded-full bg-[#fef2f2] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#dc2626]">
              Top pick
            </span>
          )}
        </div>
        {book.author && (
          <p className="text-xs text-slate-500">
            {book.author}
            {book.year ? ` · ${book.year}` : ''}
          </p>
        )}
        {book.why && <p className="mt-1.5 text-[13px] leading-relaxed text-slate-600 line-clamp-3">{book.why}</p>}
        <div className="mt-2.5">
          <AmazonButton href={book.affiliate_url} />
        </div>
      </div>
    </div>
  )
}

/** Full tiered reading guide for a category (used on /books/[slug]). */
export default function CategoryBooksModule({
  books,
  category,
}: {
  books: CategoryBooks
  category: string
}) {
  const tiers = TIER_ORDER.filter((t) => books[t].length > 0)
  if (tiers.length === 0) return null
  return (
    <div className="space-y-12">
      {tiers.map((tier) => (
        <div key={tier}>
          <div className="mb-5 flex items-center gap-3">
            <h2 className="text-lg font-bold text-[#111111]">{TIER_LABEL[tier]}</h2>
            <span className="text-xs font-medium uppercase tracking-widest text-slate-400">{tier}</span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {books[tier].map((book) => (
              <GuideCard key={book.id} book={book} />
            ))}
          </div>
        </div>
      ))}
      <AffiliateNote />
      <span className="sr-only">A tiered reading guide of the best books on {category}.</span>
    </div>
  )
}

/** Compact top-picks teaser (used near the top of a topic/category page). */
export function CategoryBooksTeaser({
  picks,
  slug,
  category,
}: {
  picks: RecBook[]
  slug: string
  category: string
}) {
  if (!picks.length) return null
  return (
    <div id="recommended-books" className="rounded-2xl border border-slate-200 bg-[#faf7f5] p-5 sm:p-6">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-[#dc2626]">Reading Guide</p>
          <h2 className="mt-1 text-lg font-bold text-[#111111]">Best Books on {category}</h2>
        </div>
        <Link href={`/books/${slug}`} className="shrink-0 text-sm font-medium text-[#dc2626] hover:text-[#b91c1c]">
          Full guide →
        </Link>
      </div>
      <div className="grid grid-cols-3 gap-4 sm:grid-cols-5">
        {picks.slice(0, 5).map((book) => (
          <a
            key={book.id}
            href={book.affiliate_url ?? '#'}
            target="_blank"
            rel="sponsored noopener noreferrer"
            className="group block"
          >
            <BookCover book={book} sizes="120px" className="transition-transform group-hover:-translate-y-1" />
            <p className="mt-2 text-[11px] font-medium leading-snug text-slate-600 line-clamp-2 group-hover:text-[#dc2626]">
              {book.title}
            </p>
          </a>
        ))}
      </div>
    </div>
  )
}
