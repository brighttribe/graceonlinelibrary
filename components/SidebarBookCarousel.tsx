'use client'

import { useEffect, useState } from 'react'
import { BookCover } from '@/components/BookBits'

export type CarouselBook = {
  id: string
  title: string
  author: string | null
  cover_url: string | null
  affiliate_url: string | null
}

// Compact auto-advancing book carousel for the top of the article sidebar.
export default function SidebarBookCarousel({
  books,
  heading,
}: {
  books: CarouselBook[]
  heading: string
}) {
  const [i, setI] = useState(0)
  const [paused, setPaused] = useState(false)
  const n = books.length

  useEffect(() => {
    if (n <= 1 || paused) return
    const id = setInterval(() => setI((v) => (v + 1) % n), 6000)
    return () => clearInterval(id)
  }, [n, paused])

  if (!n) return null
  const book = books[Math.min(i, n - 1)]
  const go = (d: number) => setI((v) => (v + d + n) % n)

  return (
    <div
      className="overflow-hidden rounded-xl border border-slate-200 bg-white"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-4 py-3">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-[#dc2626]">{heading}</p>
        {n > 1 && (
          <div className="flex items-center gap-1">
            <button
              aria-label="Previous book"
              onClick={() => go(-1)}
              className="flex h-5 w-5 items-center justify-center rounded text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-700"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
            </button>
            <button
              aria-label="Next book"
              onClick={() => go(1)}
              className="flex h-5 w-5 items-center justify-center rounded text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-700"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
            </button>
          </div>
        )}
      </div>

      <a
        href={book.affiliate_url ?? '#'}
        target="_blank"
        rel="sponsored noopener noreferrer"
        className="group block px-4 py-4 text-center"
      >
        <div className="mx-auto w-24">
          <BookCover book={book} sizes="96px" className="transition-transform group-hover:-translate-y-1" />
        </div>
        <h4 className="mt-3 text-[13px] font-semibold leading-snug text-[#111111] line-clamp-2 group-hover:text-[#dc2626]">
          {book.title}
        </h4>
        {book.author && <p className="mt-0.5 text-[11px] text-slate-400 line-clamp-1">{book.author}</p>}
        <span className="mt-2.5 inline-flex items-center justify-center rounded-lg bg-[#dc2626] px-3 py-1.5 text-[11px] font-semibold text-white transition-colors group-hover:bg-[#b91c1c]">
          View on Amazon
        </span>
      </a>

      {n > 1 && (
        <div className="flex items-center justify-center gap-1.5 pb-3">
          {books.map((b, idx) => (
            <button
              key={b.id}
              aria-label={`Book ${idx + 1}`}
              onClick={() => setI(idx)}
              className={`h-1.5 rounded-full transition-all ${idx === i ? 'w-4 bg-[#dc2626]' : 'w-1.5 bg-slate-300 hover:bg-slate-400'}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
