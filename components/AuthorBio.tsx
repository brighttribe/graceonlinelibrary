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

const GROUP_WORDS = /\b(assembly|synod|committee|council|board|conference|church|society|association|classis|presbytery|convention|institute|foundation|college|seminary|session|parliament|delegation|body)\b/i

export default async function AuthorBio({ authorName }: { authorName: string }) {
  if (/^unknown/i.test(authorName.trim())) return null
  if (GROUP_WORDS.test(authorName)) return null

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
        background: '#fef2f2',
        borderLeft: '4px solid #dc2626',
      }}
    >
      <p
        className="text-[10px] font-semibold uppercase tracking-widest mb-2"
        style={{ color: '#dc2626' }}
      >
        About the Author
      </p>

      {author.slug ? (
        <Link
          href={`/author/${author.slug}`}
          className="text-base font-bold text-[#1a1a1a] hover:text-[#dc2626] transition-colors"
        >
          {author.name}
        </Link>
      ) : (
        <p className="text-base font-bold text-[#1a1a1a]">{author.name}</p>
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

      {author.slug && (author.bio_long || (author.article_count ?? 0) > 1) && (
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
          {author.bio_long && (
            <Link
              href={`/author/${author.slug}`}
              className="text-xs font-semibold text-[#dc2626] hover:underline"
            >
              Read full bio &rarr;
            </Link>
          )}
          {(author.article_count ?? 0) > 1 && (
            <Link
              href={`/author/${author.slug}`}
              className="text-xs font-semibold text-[#dc2626] hover:underline"
            >
              All articles by {author.name} &rarr;
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
