'use client'

import { useState } from 'react'
import type { AuthorBook } from '@/lib/books'
import { BookCover, AmazonButton, AffiliateNote } from '@/components/BookBits'

// Exhaustive shelf of every book by an author. Shows an initial set, with a
// "show all" toggle so long bibliographies stay tidy but complete.
export default function AuthorBooksShelf({
  books,
  authorName,
  initial = 10,
}: {
  books: AuthorBook[]
  authorName: string
  initial?: number
}) {
  const [expanded, setExpanded] = useState(false)
  if (!books.length) return null
  const shown = expanded ? books : books.slice(0, initial)
  const hidden = books.length - shown.length

  return (
    <section className="not-prose">
      <div className="mb-5 flex items-baseline justify-between gap-4">
        <h2 className="text-xl font-bold text-[#1a1a1a]">Books by {authorName}</h2>
        <span className="text-xs text-slate-400">
          {books.length} {books.length === 1 ? 'book' : 'books'}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-x-5 gap-y-7 sm:grid-cols-4 lg:grid-cols-5">
        {shown.map((book) => (
          <div key={book.id} className="flex flex-col">
            <a
              href={book.affiliate_url ?? '#'}
              target="_blank"
              rel="sponsored noopener noreferrer"
              className="group block"
              title={book.title}
            >
              <BookCover book={book} sizes="120px" className="transition-transform group-hover:-translate-y-1" />
            </a>
            <h3 className="mt-2.5 text-[13px] font-semibold leading-snug text-[#111111] line-clamp-2">{book.title}</h3>
            {book.year ? <p className="text-[11px] text-slate-400">{book.year}</p> : null}
            <div className="mt-2">
              <AmazonButton href={book.affiliate_url} label="Amazon" />
            </div>
          </div>
        ))}
      </div>

      {hidden > 0 && (
        <button
          onClick={() => setExpanded(true)}
          className="mt-7 inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-[#dc2626] transition-colors hover:border-[#dc2626] hover:bg-[#fff5f5]"
        >
          Show all {books.length} books
        </button>
      )}

      <AffiliateNote className="mt-6" />
    </section>
  )
}
