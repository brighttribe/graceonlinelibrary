import Link from 'next/link'
import type { RecBook } from '@/lib/books'
import { BookCover, AmazonButton, AffiliateNote } from '@/components/BookBits'

// Full-width strip of book covers at the end of an article.
export default function RecommendedReadingStrip({
  books,
  category,
  slug,
}: {
  books: RecBook[]
  category: string
  slug: string | null
}) {
  if (!books.length) return null
  return (
    <section className="mt-14 border-t border-slate-200 pt-10">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-[#dc2626]">Recommended Reading</p>
          <h2 className="mt-1 text-xl font-bold text-[#111111]">Books on {category}</h2>
        </div>
        {slug && (
          <Link
            href={`/books/${slug}`}
            className="shrink-0 text-sm font-medium text-[#dc2626] hover:text-[#b91c1c]"
          >
            See all →
          </Link>
        )}
      </div>

      <div className="grid grid-cols-2 gap-x-5 gap-y-7 sm:grid-cols-3 lg:grid-cols-4">
        {books.map((book) => (
          <div key={book.id} className="flex flex-col">
            <a href={book.affiliate_url ?? '#'} target="_blank" rel="sponsored noopener noreferrer" className="block">
              <div className="w-full max-w-[150px]">
                <BookCover book={book} sizes="150px" />
              </div>
            </a>
            <h3 className="mt-3 text-sm font-semibold leading-snug text-[#111111] line-clamp-2">{book.title}</h3>
            {book.author && <p className="text-xs text-slate-500 line-clamp-1">{book.author}</p>}
            <div className="mt-2.5">
              <AmazonButton href={book.affiliate_url} />
            </div>
          </div>
        ))}
      </div>

      <AffiliateNote className="mt-6" />
    </section>
  )
}
