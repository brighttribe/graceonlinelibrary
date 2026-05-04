'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import ArticleSearch from './ArticleSearch'

export default function MobileMenu() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => { setOpen(false) }, [pathname])
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="md:hidden flex flex-col justify-center items-center w-10 h-10 gap-1.5 shrink-0"
        aria-label="Open menu"
      >
        <span className="block w-6 h-0.5 bg-white rounded-full" />
        <span className="block w-6 h-0.5 bg-white rounded-full" />
        <span className="block w-6 h-0.5 bg-white rounded-full" />
      </button>

      <div onClick={() => setOpen(false)} className={`fixed inset-0 bg-black/50 z-50 transition-opacity duration-300 ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} />

      <div className={`fixed top-0 right-0 h-full w-80 bg-[#1e0a4e] z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${open ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex justify-between items-center px-6 h-16 border-b border-white/10 shrink-0">
          <span className="text-white/60 text-sm font-medium uppercase tracking-wider">Menu</span>
          <button onClick={() => setOpen(false)} className="w-9 h-9 flex items-center justify-center text-white/60 hover:text-white transition-colors" aria-label="Close menu">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 pt-6 pb-4">
          <ArticleSearch />
        </div>

        <nav className="px-8 pt-4 flex flex-col gap-6">
          <Link href="/articles" className="text-2xl font-semibold text-white/80 hover:text-white transition-colors">All Articles</Link>
          <Link href="/category/reformed-theology" className="text-2xl font-semibold text-white/80 hover:text-white transition-colors">Reformed Theology</Link>
          <Link href="/category/puritans" className="text-2xl font-semibold text-white/80 hover:text-white transition-colors">Puritans</Link>
          <Link href="/category/church-history" className="text-2xl font-semibold text-white/80 hover:text-white transition-colors">Church History</Link>
          <Link href="/about" className="text-2xl font-semibold text-white/80 hover:text-white transition-colors">About</Link>
        </nav>
      </div>
    </>
  )
}
