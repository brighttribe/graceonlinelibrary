'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import ArticleSearch from './ArticleSearch'
import { categorySlug } from '@/lib/categories'

const BUCKETS = [
  {
    label: 'Reformed Theology',
    categories: [
      'Five Points of Calvinism', 'Total Depravity', 'Predestination & Election',
      'Limited Atonement', 'Irresistible Grace', 'Arminianism',
      'Free Will', 'Decrees of God', 'Covenant Theology', 'Augustine & Pelagius',
      'Regeneration', 'Reformed Theology',
    ],
  },
  {
    label: 'Doctrine & Theology',
    categories: [
      'Doctrine of God', 'Attributes of God', 'God the Creator',
      'Sovereignty of God', 'Providence of God',
      'Christology', 'The Atonement', 'Resurrection', 'Doctrine of Man', 'Justification',
      'The Holy Spirit', 'The Trinity', 'The Sabbath', 'The Law of God',
      'The Word of God', 'Inspiration of Scripture',
      'Apologetics', 'Doctrine & Theology',
    ],
  },
  {
    label: 'Salvation',
    categories: ['Salvation', 'Evangelism', 'Sanctification', 'Repentance', 'Assurance'],
  },
  {
    label: 'Christian Life',
    categories: [
      'Christian Life', 'Personal Holiness', 'Devotional Life', 'Prayer & Fasting',
      'Love & Charity', 'Sin & Temptation', 'Discernment', 'Christian Modesty', 'Bible Study',
    ],
  },
  {
    label: 'Church Ministry',
    categories: [
      'Preaching', 'Worship', 'Revival', 'Pastoral Ministry', 'Church Ministry',
      'Leaders & Elders', "Lord's Supper", 'Church Discipline', 'The Church',
      'Role of Women', 'Charismatic Movement',
    ],
  },
  {
    label: 'Home & Family',
    categories: ['Family Worship', 'Marriage', 'Christian Parenting'],
  },
  {
    label: 'Church History',
    categories: [
      'Church History', 'Puritans & Puritanism', 'Accounts of Revival',
      'Creeds & Confessions', 'Sermons & Tracts', 'The Baptists', 'False Teachers',
    ],
  },
  {
    label: 'Eschatology',
    categories: [
      'Dispensationalism', 'Amillennialsm', 'Postmillennialism', 'Revelation 20',
      'Eschatology', 'Eternal Punishment', 'Partial Preterism', 'The 2nd Coming',
    ],
  },
  {
    label: 'Biographies',
    categories: [],
    href: '/category/biographies',
  },
]

export default function MobileMenu() {
  const [open, setOpen] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const pathname = usePathname()

  useEffect(() => { setOpen(false); setExpanded(null) }, [pathname])
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

        <div className="px-6 pt-5 pb-4 shrink-0">
          <ArticleSearch />
        </div>

        <div className="px-6 pb-4 flex gap-6 shrink-0 border-b border-white/10">
          <Link href="/articles" className="text-sm font-medium text-white/70 hover:text-white transition-colors">All Articles</Link>
          <Link href="/authors" className="text-sm font-medium text-white/70 hover:text-white transition-colors">Authors</Link>
          <Link href="/about" className="text-sm font-medium text-white/70 hover:text-white transition-colors">About</Link>
        </div>

        <nav className="flex-1 overflow-y-auto py-3">
          {BUCKETS.map((bucket) =>
            bucket.href ? (
              <Link
                key={bucket.label}
                href={bucket.href}
                className="flex items-center px-6 py-3 text-sm font-semibold text-white/80 hover:text-white hover:bg-white/5 transition-colors"
              >
                {bucket.label}
              </Link>
            ) : (
              <div key={bucket.label}>
                <button
                  onClick={() => setExpanded(expanded === bucket.label ? null : bucket.label)}
                  className="w-full flex items-center justify-between px-6 py-3 text-sm font-semibold text-white/80 hover:text-white hover:bg-white/5 transition-colors"
                >
                  <span>{bucket.label}</span>
                  <svg
                    width="14" height="14" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
                    className={`transition-transform duration-200 ${expanded === bucket.label ? 'rotate-180' : ''}`}
                  >
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </button>
                {expanded === bucket.label && (
                  <div className="px-6 pb-3 flex flex-col gap-0.5 bg-white/5">
                    {bucket.categories.map((cat) => (
                      <Link
                        key={cat}
                        href={`/category/${categorySlug(cat)}`}
                        className="text-sm text-white/50 hover:text-white py-1.5 transition-colors"
                      >
                        {cat}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )
          )}
        </nav>
      </div>
    </>
  )
}
