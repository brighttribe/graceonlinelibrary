import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'About Grace Online Library',
  description: 'Grace Online Library has served the Reformed and Puritan theological community since 1999 — free articles, confessions, and resources for pastors, students, and serious Bible readers.',
}

export default function AboutPage() {
  return (
    <main>
      {/* Hero */}
      <div className="relative overflow-hidden text-white" style={{ background: 'radial-gradient(ellipse 140% 120% at 50% 10%, #3b1a8f 0%, #1e0a4e 45%, #0d0520 75%, #050212 100%)' }}>
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        <svg className="absolute top-0 right-0 w-[480px] h-[480px] pointer-events-none" viewBox="0 0 480 480" fill="none" aria-hidden="true">
          <circle cx="380" cy="100" r="200" stroke="rgba(139,92,246,0.04)" strokeWidth="60" />
          <circle cx="420" cy="60"  r="140" stroke="rgba(139,92,246,0.04)" strokeWidth="40" />
          <circle cx="340" cy="140" r="90"  stroke="rgba(139,92,246,0.04)" strokeWidth="30" />
        </svg>
        <div className="relative max-w-3xl mx-auto px-4 pt-6 pb-10">
          <nav className="mb-5 text-sm text-white/40 flex items-center gap-1.5">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <span>›</span>
            <span className="text-white/70">About</span>
          </nav>
          <h1 className="text-3xl sm:text-4xl font-bold leading-tight mb-3">
            About Grace Online Library
          </h1>
          <p className="text-white/50 text-sm">
            Serving the Reformed and Puritan theological community since 1999.
          </p>
        </div>
      </div>

      {/* Body */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-4 py-12">
          <div className="prose prose-lg max-w-none">

            <p>
              Grace Online Library exists to make the great writings of the Reformed and Puritan tradition freely accessible to every believer — pastors preparing sermons, students studying theology, and ordinary Christians seeking to understand their faith more deeply.
            </p>

            <p>
              For over 25 years, we have curated articles, sermons, and theological essays from the best Reformed thinkers — Calvin, Owen, Spurgeon, Bavinck, Warfield, and many others — in a library that is completely free to use.
            </p>

            <h2>What We Cover</h2>

            <p>
              The library spans the full breadth of Reformed and Puritan theology:
            </p>

            <ul>
              <li><strong>Reformed Theology</strong> — the five points of Calvinism, covenant theology, and the great doctrines of grace.</li>
              <li><strong>Puritan Writings</strong> — John Owen, Thomas Watson, John Flavel, Richard Baxter, and dozens of other Puritan authors.</li>
              <li><strong>Church History</strong> — the Reformation, the Puritans, the Great Awakening, and the history of the Reformed churches.</li>
              <li><strong>Practical Theology</strong> — sanctification, prayer, worship, preaching, and Christian living from a Reformed perspective.</li>
            </ul>

            <h2>Advertising</h2>

            <p>
              Grace Online Library is free to use and supported by advertising. Ads help cover hosting and development costs so this resource remains available to everyone at no charge.
            </p>

          </div>

          <div className="mt-10 rounded-2xl p-8 text-center border border-slate-200">
            <h2 className="text-xl font-bold text-[#111111] mb-3" style={{ fontFamily: 'Georgia, serif' }}>Start Reading</h2>
            <p className="text-slate-500 mb-6 text-sm">Reformed and Puritan theology — free to read.</p>
            <Link
              href="/articles"
              className="inline-flex items-center gap-2 bg-[#7c3aed] hover:bg-[#6d28d9] text-white px-6 py-2.5 rounded-xl font-semibold text-sm transition-colors"
            >
              Browse All Articles
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
