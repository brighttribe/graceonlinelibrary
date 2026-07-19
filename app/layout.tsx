import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Link from 'next/link'
import Image from 'next/image'
import { GoogleAnalytics } from '@next/third-parties/google'
import ArticleSearch from '@/components/ArticleSearch'
import MobileMenu from '@/components/MobileMenu'
import MegaMenu from '@/components/MegaMenu'
import BackToTop from '@/components/BackToTop'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: 'Grace Online Library — Reformed & Puritan Theological Resources',
    template: '%s | Grace Online Library',
  },
  description: 'A curated library of Reformed, Puritan, and Baptist theological articles. Serving the church for over 30 years.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://graceonlinelibrary.org'),
  openGraph: {
    siteName: 'Grace Online Library',
    type: 'website',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Grace Online Library — Reformed & Puritan Theological Resources' }],
  },
  twitter: {
    card: 'summary_large_image',
    images: ['/og-image.png'],
  },
  icons: { icon: '/gol-icon-red.png' },
  alternates: {
    types: {
      'application/rss+xml': [{ url: '/feed.xml', title: 'Grace Online Library RSS Feed' }],
    },
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.className}>
      <body className="bg-white text-[#1a1a1a] antialiased">

        <header className="bg-white sticky top-0 z-40 border-b border-slate-200">
          <div className="max-w-6xl mx-auto px-4 h-16 flex items-center gap-4">
            <Link href="/" className="shrink-0 flex items-center gap-3">
              <div className="relative w-9 h-9 shrink-0 overflow-hidden">
                <Image src="/gol-wht.png" alt="Grace Online Library" fill priority style={{ objectFit: 'cover', objectPosition: 'left center' }} />
              </div>
              <span className="text-[#1a1a1a] font-bold text-lg leading-tight tracking-tight">
                GraceOnlineLibrary
              </span>
            </Link>

            <div className="flex-1" />
            <div className="hidden md:flex">
              <MegaMenu />
            </div>
            <div className="flex-1" />

            <div className="hidden md:block w-44 shrink-0">
              <ArticleSearch />
            </div>

            <MobileMenu />
          </div>
        </header>

        <div className="min-h-screen">
          {children}
        </div>
        <BackToTop />

        <footer className="bg-[#111111] text-white/50 py-14">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex flex-col sm:flex-row justify-between gap-10 mb-10">
              <div className="max-w-xs">
                <div className="flex items-center gap-2 mb-3">
                  <div className="relative w-9 h-9 shrink-0 overflow-hidden">
                    <Image src="/gol-wht.png" alt="" fill style={{ objectFit: 'cover', objectPosition: 'left center' }} />
                  </div>
                  <span className="text-white font-bold text-sm">GraceOnlineLibrary</span>
                </div>
                <p className="text-sm text-white/40 leading-relaxed">
                  A curated library of Reformed, Puritan, and confessionally Baptist theological resources — free for the church since 1999.
                </p>
              </div>
              <div className="flex flex-wrap gap-10 text-sm">
                <div>
                  <p className="text-white/80 font-semibold mb-3 uppercase text-xs tracking-wider">Reformed</p>
                  <div className="flex flex-col gap-2">
                    <Link href="/reformed-theology" className="hover:text-white transition-colors">Reformed Theology</Link>
                    <Link href="/doctrine-theology" className="hover:text-white transition-colors">Doctrine &amp; Theology</Link>
                    <Link href="/salvation" className="hover:text-white transition-colors">Salvation</Link>
                  </div>
                </div>
                <div>
                  <p className="text-white/80 font-semibold mb-3 uppercase text-xs tracking-wider">Life &amp; Ministry</p>
                  <div className="flex flex-col gap-2">
                    <Link href="/christian-life" className="hover:text-white transition-colors">Christian Life</Link>
                    <Link href="/church-ministry" className="hover:text-white transition-colors">Church Ministry</Link>
                    <Link href="/church-history" className="hover:text-white transition-colors">Church History</Link>
                  </div>
                </div>
                <div>
                  <p className="text-white/80 font-semibold mb-3 uppercase text-xs tracking-wider">More Topics</p>
                  <div className="flex flex-col gap-2">
                    <Link href="/eschatology" className="hover:text-white transition-colors">Eschatology</Link>
                    <Link href="/home-family" className="hover:text-white transition-colors">Home &amp; Family</Link>
                    <Link href="/biographies" className="hover:text-white transition-colors">Biographies</Link>
                  </div>
                </div>
                <div>
                  <p className="text-white/80 font-semibold mb-3 uppercase text-xs tracking-wider">Site</p>
                  <div className="flex flex-col gap-2">
                    <Link href="/books" className="hover:text-white transition-colors">Reading Guides</Link>
                    <Link href="/topics" className="hover:text-white transition-colors">All Topics</Link>
                    <Link href="/authors" className="hover:text-white transition-colors">Authors</Link>
                    <Link href="/about" className="hover:text-white transition-colors">About</Link>
                    <a href="https://biblespeak.org" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">BibleSpeak.org</a>
                  </div>
                </div>
              </div>
            </div>
            <div className="border-t border-white/10 pt-6 text-xs text-white/30 flex flex-col sm:flex-row justify-between gap-2">
              <span>© {new Date().getFullYear()} GraceOnlineLibrary.org — Reformed &amp; Puritan Theological Resources</span>
              <span>Free to use and supported by advertising.</span>
            </div>
          </div>
        </footer>

      </body>
      <GoogleAnalytics gaId="G-98SRBV5Z4C" />
    </html>
  )
}
