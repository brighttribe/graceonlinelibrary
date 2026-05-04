import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Link from 'next/link'
import Image from 'next/image'
import ArticleSearch from '@/components/ArticleSearch'
import MobileMenu from '@/components/MobileMenu'
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
  openGraph: { siteName: 'Grace Online Library', type: 'website' },
  icons: { icon: '/gol-purple.png' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.className}>
      <body className="bg-white text-[#1a1a1a] antialiased">

        <header className="bg-[#1e0a4e] sticky top-0 z-40 border-b border-white/10">
          <div className="max-w-6xl mx-auto px-4 h-16 flex items-center gap-4">
            <Link href="/" className="shrink-0 flex items-center gap-3">
              <Image src="/gol-purple.png" alt="" width={36} height={36} priority className="shrink-0" />
              <span className="text-white font-bold text-lg leading-tight tracking-tight">
                GraceOnlineLibrary
              </span>
            </Link>

            <div className="flex-1" />

            <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-white/70 shrink-0">
              <Link href="/articles" className="hover:text-white transition-colors">All Articles</Link>
              <Link href="/authors" className="hover:text-white transition-colors">Authors</Link>
              <Link href="/category/reformed-theology" className="hover:text-white transition-colors">Reformed Theology</Link>
              <Link href="/category/puritans" className="hover:text-white transition-colors">Puritans</Link>
              <Link href="/about" className="hover:text-white transition-colors">About</Link>
            </nav>

            <div className="hidden md:block w-52 shrink-0">
              <ArticleSearch />
            </div>

            <MobileMenu />
          </div>
        </header>

        <div className="min-h-screen">
          {children}
        </div>
        <BackToTop />

        <footer className="bg-[#0d0520] text-white/50 py-14">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex flex-col sm:flex-row justify-between gap-10 mb-10">
              <div className="max-w-xs">
                <div className="flex items-center gap-2 mb-3">
                  <Image src="/gol-purple.png" alt="" width={26} height={26} className="opacity-80" />
                  <span className="text-white font-bold text-sm">GraceOnlineLibrary</span>
                </div>
                <p className="text-sm text-white/40 leading-relaxed">
                  A curated library of Reformed, Puritan, and confessionally Baptist theological resources — free for the church since 1999.
                </p>
              </div>
              <div className="flex gap-16 text-sm">
                <div>
                  <p className="text-white/80 font-semibold mb-3 uppercase text-xs tracking-wider">Browse</p>
                  <div className="flex flex-col gap-2">
                    <Link href="/articles" className="hover:text-white transition-colors">All Articles</Link>
                    <Link href="/authors" className="hover:text-white transition-colors">Authors</Link>
                    <Link href="/category/reformed-theology" className="hover:text-white transition-colors">Reformed Theology</Link>
                    <Link href="/category/puritans" className="hover:text-white transition-colors">Puritans</Link>
                    <Link href="/category/church-history" className="hover:text-white transition-colors">Church History</Link>
                    <Link href="/category/five-points-of-calvinism" className="hover:text-white transition-colors">Five Points of Calvinism</Link>
                  </div>
                </div>
                <div>
                  <p className="text-white/80 font-semibold mb-3 uppercase text-xs tracking-wider">Site</p>
                  <div className="flex flex-col gap-2">
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
    </html>
  )
}
