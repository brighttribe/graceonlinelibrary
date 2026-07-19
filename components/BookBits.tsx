import Image from 'next/image'
import type { RecBook } from '@/lib/books'

// Shared visual primitives for every book surface. Amazon links are affiliate
// links (tag baked in at seed time) and always open in a new tab, rel sponsored.

export function BookCover({
  book,
  className = '',
  sizes = '140px',
}: {
  book: Pick<RecBook, 'title' | 'author' | 'cover_url'>
  className?: string
  sizes?: string
}) {
  if (book.cover_url) {
    return (
      <Image
        src={book.cover_url}
        alt={`${book.title}${book.author ? ' by ' + book.author : ''}`}
        width={300}
        height={450}
        sizes={sizes}
        className={`h-auto w-full rounded-md object-contain shadow-md ring-1 ring-black/5 ${className}`}
      />
    )
  }
  // Text fallback cover for the handful of books with no image.
  return (
    <div
      className={`flex aspect-[2/3] w-full flex-col justify-center rounded-md bg-gradient-to-br from-[#7f1d1d] to-[#dc2626] p-3 text-center shadow-md ring-1 ring-black/5 ${className}`}
    >
      <span className="text-[13px] font-semibold leading-snug text-white line-clamp-5">{book.title}</span>
      {book.author && <span className="mt-1.5 text-[11px] text-white/70 line-clamp-1">{book.author}</span>}
    </div>
  )
}

export function AmazonButton({
  href,
  label = 'View on Amazon',
  className = '',
}: {
  href: string | null
  label?: string
  className?: string
}) {
  if (!href) return null
  return (
    <a
      href={href}
      target="_blank"
      rel="sponsored noopener noreferrer"
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#dc2626] px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#b91c1c] ${className}`}
    >
      {label}
    </a>
  )
}

export function AffiliateNote({ className = '' }: { className?: string }) {
  return (
    <p className={`text-[11px] leading-relaxed text-slate-400 ${className}`}>
      Grace Online Library is an Amazon Associate. Purchases made through these links help support the library at no
      extra cost to you.
    </p>
  )
}
