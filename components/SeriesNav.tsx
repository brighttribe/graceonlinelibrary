import Link from 'next/link'
import { createSupabaseClient } from '@/lib/supabase'

type SeriesPart = {
  id: string
  title: string
  slug: string
  part_num: number
}

export default async function SeriesNav({
  seriesSlug,
  seriesName,
  currentSlug,
}: {
  seriesSlug: string
  seriesName: string
  currentSlug: string
}) {
  const supabase = createSupabaseClient()

  const { data: parts } = await supabase
    .from('articles')
    .select('id, title, slug, part_num')
    .eq('series_slug', seriesSlug)
    .eq('status', 'published')
    .order('part_num')

  if (!parts || parts.length < 2) return null

  return (
    <div className="border border-slate-200 rounded-2xl overflow-hidden mt-10">
      <div
        className="px-5 py-3 flex items-center gap-2"
        style={{ background: '#f5f3ff', borderBottom: '1px solid #e2e8f0' }}
      >
        <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: '#7c3aed' }}>
          In this series
        </span>
        <span className="text-[10px] text-slate-400 font-medium truncate">— {seriesName}</span>
      </div>

      <ul className="divide-y divide-slate-100">
        {(parts as SeriesPart[]).map((part, i) => {
          const isCurrent = part.slug === currentSlug
          const label = part.title
          return (
            <li key={part.id} className={isCurrent ? 'bg-[#faf8ff]' : 'bg-white'}>
              {isCurrent ? (
                <div className="flex items-baseline gap-3 px-5 py-3">
                  <span
                    className="shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded"
                    style={{ background: '#7c3aed', color: '#fff' }}
                  >
                    {i + 1}
                  </span>
                  <span className="text-sm font-semibold text-[#111111]">{label}</span>
                </div>
              ) : (
                <Link
                  href={`/articles/${part.slug}`}
                  className="flex items-baseline gap-3 px-5 py-3 group transition-colors hover:bg-[#faf8ff]"
                >
                  <span
                    className="shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded transition-colors"
                    style={{ background: '#ede9fe', color: '#7c3aed' }}
                  >
                    {i + 1}
                  </span>
                  <span className="text-sm text-[#111111] group-hover:text-[#7c3aed] transition-colors">
                    {label}
                  </span>
                </Link>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
