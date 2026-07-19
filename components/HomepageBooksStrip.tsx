import Link from 'next/link'
import type { RecBook } from '@/lib/books'
import { BookCover } from '@/components/BookBits'

// Featured book covers on the homepage, linking into the books hub.
export default function HomepageBooksStrip({ books }: { books: RecBook[] }) {
  if (!books.length) return null
  return (
    <section className="bg-white py-16 px-4">
      <div className="mx-auto max-w-5xl">
        <div className="mb-10 text-center">
          <h2 className="mb-2 text-2xl font-bold text-[#111111]">Recommended Reformed Reading</h2>
          <p className="text-sm text-slate-500">Hand-picked books to go deeper, tiered from beginner to advanced.</p>
        </div>
        <div className="grid grid-cols-3 gap-5 sm:grid-cols-4 lg:grid-cols-8">
          {books.slice(0, 8).map((book) => (
            <a
              key={book.id}
              href={book.affiliate_url ?? '#'}
              target="_blank"
              rel="sponsored noopener noreferrer"
              className="group block"
              title={`${book.title}${book.author ? ' by ' + book.author : ''}`}
            >
              <BookCover book={book} sizes="120px" className="transition-transform group-hover:-translate-y-1" />
            </a>
          ))}
        </div>
        <div className="mt-8 text-center">
          <Link
            href="/books"
            className="inline-flex items-center gap-2 rounded-xl bg-[#dc2626] px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#b91c1c]"
          >
            Browse the Reading Guides
          </Link>
        </div>
      </div>
    </section>
  )
}
