import Link from 'next/link'
import { createSupabaseClient } from '@/lib/supabase'

type Author = {
  id: string
  name: string
  slug: string | null
  bio: string | null
  bio_long: string | null
  article_count: number | null
}

export default async function AuthorBio({ authorName }: { authorName: string }) {
  if (/^unknown/i.test(authorName.trim())) return null

  const supabase = createSupabaseClient()

  const { data: author } = await supabase
    .from('authors')
    .select('id, name, slug, bio, bio_long, article_count')
    .ilike('name', authorName)
    .single<Author>()

  if (!author) return null

  if (!author.bio && !author.bio_long && !author.slug) return null

  return (
    <div
      className="rounded-xl px-6 py-5"
      style={{
        background: '#f5f3ff',
        borderLeft: '4px solid #7c3aed',
      }}
    >
      <p
        className="text-[10px] font-semibold uppercase tracking-widest mb-2"
        style={{ color: '#7c3aed' }}
      >
        About the Author
      </p>

      {author.slug ? (
        <Link
          href={`/author/${author.slug}`}
          className="text-base font-bold text-[#1e0a4e] hover:text-[#7c3aed] transition-colors"
        >
          {author.name}
        </Link>
      ) : (
        <p className="text-base font-bold text-[#1e0a4e]">{author.name}</p>
      )}

      {author.bio && (
        <div className="mt-2 space-y-2">
          {author.bio.split('\n\n').map((para, i) => (
            <p key={i} className="text-sm leading-relaxed text-[#1a1a1a]" style={{ fontFamily: 'Georgia, serif' }}>
              {para}
            </p>
          ))}
        </div>
      )}

      {author.slug && (
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
          {author.bio_long && (
            <Link
              href={`/author/${author.slug}`}
              className="text-xs font-semibold text-[#7c3aed] hover:underline"
            >
              Read full bio &rarr;
            </Link>
          )}
          <Link
            href={`/author/${author.slug}`}
            className="text-xs font-semibold text-[#7c3aed] hover:underline"
          >
            All articles by {author.name} &rarr;
          </Link>
        </div>
      )}
    </div>
  )
}
