'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const SECTIONS = [
  {
    label: 'Reformed Theology',
    slug: 'reformed-theology',
    subs: ['Five Points of Calvinism', 'Arminianism', 'Covenant Theology', 'Free Will', 'Decrees of God', 'Foreknowledge of God', 'Augustine & Pelagius', 'Regeneration', 'Reprobation'],
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
      </svg>
    ),
  },
  {
    label: 'Doctrine & Theology',
    slug: 'doctrine-theology',
    subs: ['Doctrine of God', 'Christology', 'The Atonement', 'The Trinity', 'Sovereignty of God', 'Providence of God', 'The Holy Spirit', 'Resurrection', 'Doctrine of Man', 'Justification', 'The Word of God', 'The Law of God', 'Apologetics'],
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 8v4" /><path d="M12 16h.01" />
      </svg>
    ),
  },
  {
    label: 'Salvation',
    slug: 'salvation',
    subs: ['Justification', 'Sanctification', 'Repentance', 'Evangelism', 'Assurance'],
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
  },
  {
    label: 'Christian Life',
    slug: 'christian-life',
    subs: ['Personal Holiness', 'Prayer & Fasting', 'Devotional Life', 'Discernment', 'Love & Charity', 'Sin & Temptation', 'Bible Study', 'Christian Modesty'],
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    ),
  },
  {
    label: 'Church Ministry',
    slug: 'church-ministry',
    subs: ['Preaching', 'Worship', 'Pastoral Ministry', 'Revival', 'Leaders & Elders', "Lord's Supper", 'Church Discipline', 'Role of Women', 'Charismatic Movement'],
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    label: 'Church History',
    slug: 'church-history',
    subs: ['Puritans & Puritanism', 'Accounts of Revival', 'Creeds & Confessions', 'The Baptists', 'Sermons & Tracts', 'False Teachers'],
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2L2 7l10 5 10-5-10-5z" />
        <path d="M2 17l10 5 10-5" />
        <path d="M2 12l10 5 10-5" />
      </svg>
    ),
  },
  {
    label: 'Eschatology',
    slug: 'eschatology',
    subs: ['Dispensationalism', 'Premillennialism', 'Amillennialism', 'Postmillennialism', 'Revelation 20', 'Eternal Punishment', 'Partial Preterism', 'The 2nd Coming'],
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
  },
  {
    label: 'Home & Family',
    slug: 'home-family',
    subs: ['Family Worship', 'Marriage', 'Christian Parenting'],
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    label: 'Biographies',
    slug: 'biographies',
    subs: ['Reformers', 'Puritans', 'Church Fathers', 'Missionaries'],
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
]

const PREVIEW = 4

export default function MegaMenu() {
  const [open, setOpen] = useState(false)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const pathname = usePathname()

  useEffect(() => { setOpen(false) }, [pathname])

  const scheduleClose = () => { closeTimer.current = setTimeout(() => setOpen(false), 150) }
  const cancelClose = () => clearTimeout(closeTimer.current)

  return (
    <div className="flex items-center gap-1" onMouseLeave={scheduleClose}>
      <button
        onMouseEnter={() => { cancelClose(); setOpen(true) }}
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-colors ${
          open ? 'text-white bg-white/10' : 'text-white/70 hover:text-white hover:bg-white/5'
        }`}
      >
        Topics
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
          className={`transition-transform duration-150 ${open ? 'rotate-180' : ''}`}>
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      <Link href="/authors" className="px-3 py-1.5 rounded text-sm font-medium text-white/70 hover:text-white hover:bg-white/5 transition-colors whitespace-nowrap">
        Authors
      </Link>
      <Link href="/about" className="px-3 py-1.5 rounded text-sm font-medium text-white/70 hover:text-white hover:bg-white/5 transition-colors whitespace-nowrap">
        About
      </Link>

      {open && (
        <div
          className="fixed top-16 left-0 right-0 bg-[#0a0218] border-b border-white/10 shadow-2xl z-50"
          onMouseEnter={cancelClose}
          onMouseLeave={scheduleClose}
        >
          <div className="max-w-6xl mx-auto px-6 py-8">
            <div className="grid grid-cols-3 gap-3">
              {SECTIONS.map((section) => {
                const preview = section.subs.slice(0, PREVIEW)
                const more = section.subs.length - PREVIEW
                return (
                  <Link
                    key={section.slug}
                    href={`/category/${section.slug}`}
                    className="group flex items-start gap-3 rounded-xl p-4 hover:bg-white/5 transition-colors"
                  >
                    <span className="text-[#7c3aed] group-hover:text-[#a78bfa] transition-colors mt-0.5 shrink-0">
                      {section.icon}
                    </span>
                    <div>
                      <p className="text-white font-semibold text-[14px] mb-1.5 group-hover:text-[#a78bfa] transition-colors">
                        {section.label}
                      </p>
                      <p className="text-white/35 text-[12px] leading-relaxed">
                        {preview.join(' · ')}
                        {more > 0 && (
                          <span className="text-white/20"> · +{more} more</span>
                        )}
                      </p>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
