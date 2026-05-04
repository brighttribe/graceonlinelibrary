import type { Metadata } from 'next'
import Link from 'next/link'
import { categorySlug } from '@/lib/categories'

export const metadata: Metadata = {
  title: 'Topics',
  description: 'Browse Reformed and Puritan theological topics — from the Five Points of Calvinism to Eschatology, Church History, Christian Life, and more.',
}

type Category = string | { label: string; children: string[] }
type Bucket = { label: string; href?: string; categories?: Category[] }

const TOPICS: Bucket[] = [
  {
    label: 'Reformed Theology',
    categories: [
      { label: 'Five Points of Calvinism', children: ['Total Depravity', 'Predestination & Election', 'Limited Atonement', 'Irresistible Grace'] },
      { label: 'Arminianism', children: ['Prevenient Grace'] },
      'Free Will', 'Decrees of God', 'Foreknowledge of God',
      'Covenant Theology', 'Augustine & Pelagius', 'Regeneration', 'Reformed Theology',
    ],
  },
  {
    label: 'Doctrine & Theology',
    categories: [
      { label: 'Doctrine of God', children: ['Attributes of God', 'God the Creator'] },
      'Sovereignty of God', 'Providence of God',
      'Christology', 'The Atonement', 'Resurrection', 'Doctrine of Man', 'Justification',
      'The Holy Spirit', 'The Trinity', 'The Sabbath', 'The Law of God',
      { label: 'The Word of God', children: ['Inspiration of Scripture'] },
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
    href: '/category/biographies',
  },
]

export default function TopicsPage() {
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
        <div className="relative max-w-5xl mx-auto px-4 pt-6 pb-10">
          <nav className="mb-5 text-sm text-white/40 flex items-center gap-1.5">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <span>›</span>
            <span className="text-white/70">Topics</span>
          </nav>
          <h1 className="text-3xl sm:text-4xl font-bold leading-tight mb-3">Browse by Topic</h1>
          <p className="text-white/50 text-sm">Reformed and Puritan theology organized by subject.</p>
        </div>
      </div>

      {/* Topics grid */}
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {TOPICS.map((bucket) => (
            <div key={bucket.label}>
              {bucket.href ? (
                <Link
                  href={bucket.href}
                  className="block text-base font-bold text-[#111111] hover:text-[#7c3aed] transition-colors mb-3 pb-2 border-b-2 border-[#7c3aed]"
                >
                  {bucket.label}
                </Link>
              ) : (
                <h2 className="text-base font-bold text-[#111111] mb-3 pb-2 border-b-2 border-[#7c3aed]">
                  {bucket.label}
                </h2>
              )}

              <div className="space-y-0.5">
                {bucket.categories?.map((item) => {
                  if (typeof item === 'string') {
                    return (
                      <Link
                        key={item}
                        href={`/category/${categorySlug(item)}`}
                        className="block text-sm text-[#444] hover:text-[#7c3aed] py-1 transition-colors"
                      >
                        {item}
                      </Link>
                    )
                  }
                  return (
                    <div key={item.label}>
                      <Link
                        href={`/category/${categorySlug(item.label)}`}
                        className="block text-sm font-semibold text-[#222] hover:text-[#7c3aed] py-1 transition-colors"
                      >
                        {item.label}
                      </Link>
                      {item.children.map((child) => (
                        <Link
                          key={child}
                          href={`/category/${categorySlug(child)}`}
                          className="block text-sm text-[#666] hover:text-[#7c3aed] py-1 pl-4 transition-colors"
                        >
                          {child}
                        </Link>
                      ))}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
