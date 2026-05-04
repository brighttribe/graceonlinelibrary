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
    href: '/biographies',
  },
]

export default function TopicsPage() {
  return (
    <main>
      {/* Hero */}
      <div className="relative overflow-hidden border-b border-[#e5e7eb]" style={{ background: '#f5f5f5' }}>
        <div className="relative max-w-5xl mx-auto px-4 pt-6 pb-10">
          <nav className="mb-5 text-sm text-slate-400 flex items-center gap-1.5">
            <Link href="/" className="hover:text-slate-600 transition-colors">Home</Link>
            <span>›</span>
            <span className="text-[#dc2626]">Topics</span>
          </nav>
          <h1 className="text-3xl sm:text-4xl font-bold leading-tight mb-3 text-[#1a1a1a]">Browse by Topic</h1>
          <p className="text-slate-500 text-sm">Reformed and Puritan theology organized by subject.</p>
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
                  className="block text-base font-bold text-[#111111] hover:text-[#dc2626] transition-colors mb-3 pb-2 border-b-2 border-[#dc2626]"
                >
                  {bucket.label}
                </Link>
              ) : (
                <h2 className="text-base font-bold text-[#111111] mb-3 pb-2 border-b-2 border-[#dc2626]">
                  {bucket.label}
                </h2>
              )}

              <div className="space-y-0.5">
                {bucket.categories?.map((item) => {
                  if (typeof item === 'string') {
                    return (
                      <Link
                        key={item}
                        href={`/${categorySlug(item)}`}
                        className="block text-sm text-[#444] hover:text-[#dc2626] py-1 transition-colors"
                      >
                        {item}
                      </Link>
                    )
                  }
                  return (
                    <div key={item.label}>
                      <Link
                        href={`/${categorySlug(item.label)}`}
                        className="block text-sm font-semibold text-[#222] hover:text-[#dc2626] py-1 transition-colors"
                      >
                        {item.label}
                      </Link>
                      {item.children.map((child) => (
                        <Link
                          key={child}
                          href={`/${categorySlug(child)}`}
                          className="block text-sm text-[#666] hover:text-[#dc2626] py-1 pl-4 transition-colors"
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
