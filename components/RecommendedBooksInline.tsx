import type { RecBook } from '@/lib/books'
import { BookCover, AmazonButton } from '@/components/BookBits'

// A single tasteful book callout woven into the article body after the intro.
export default function RecommendedBooksInline({ book }: { book: RecBook }) {
  return (
    <aside className="my-8 not-prose overflow-hidden rounded-2xl border border-slate-200 bg-[#faf7f5]">
      <div className="flex gap-4 p-4 sm:gap-5 sm:p-5">
        <div className="w-20 shrink-0 sm:w-24">
          <BookCover book={book} sizes="96px" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-[#dc2626]">Recommended Reading</p>
          <h4 className="mt-1 text-base font-bold leading-snug text-[#111111]">{book.title}</h4>
          {book.author && <p className="text-xs text-slate-500">{book.author}</p>}
          {book.why && <p className="mt-2 text-sm leading-relaxed text-slate-600">{book.why}</p>}
          <div className="mt-3">
            <AmazonButton href={book.affiliate_url} />
          </div>
        </div>
      </div>
    </aside>
  )
}
