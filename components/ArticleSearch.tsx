'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseClient } from '@/lib/supabase'

type Result = { title: string; slug: string; category: string | null }

export default function ArticleSearch({ large = false }: { large?: boolean }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Result[]>([])
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (query.trim().length < 2) { setResults([]); setOpen(false); return }
    const timer = setTimeout(async () => {
      const supabase = createSupabaseClient()
      const { data } = await supabase
        .from('articles')
        .select('title, slug, category')
        .ilike('title', `%${query.trim()}%`)
        .eq('status', 'published')
        .order('title')
        .limit(8)
      setResults(data ?? [])
      setOpen(true)
    }, 180)
    return () => clearTimeout(timer)
  }, [query])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function select(slug: string) {
    router.push(`/articles/${slug}`)
    setOpen(false)
    setQuery('')
  }

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <svg className={`absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none ${large ? 'w-5 h-5' : 'w-4 h-4'}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
        </svg>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder="Search articles…"
          className={`w-full bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#7c3aed] focus:border-transparent shadow-sm ${
            large ? 'pl-11 pr-4 py-4 text-lg' : 'pl-9 pr-4 py-1.5 text-base'
          }`}
        />
      </div>
      {open && results.length > 0 && (
        <ul className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden z-50">
          {results.map((r) => (
            <li key={r.slug}>
              <button
                className="w-full text-left px-4 py-3 hover:bg-red-50 transition-colors border-b border-slate-50 last:border-0"
                onClick={() => select(r.slug)}
              >
                <span className="block font-medium text-slate-900 text-sm">{r.title}</span>
                {r.category && <span className="text-xs text-[#7c3aed]">{r.category}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
