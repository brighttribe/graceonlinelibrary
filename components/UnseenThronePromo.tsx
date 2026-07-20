const ASIN = 'B0F31X4Z44'
const AMAZON_TAG = 'gol016-20'
const AMAZON_LINK = `https://www.amazon.com/dp/${ASIN}?tag=${AMAZON_TAG}`

export default function UnseenThronePromo() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">Featured Book</p>
      </div>
      <div className="p-2.5 text-center">
        <a href={AMAZON_LINK} target="_blank" rel="noopener noreferrer sponsored" className="block group">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/unseen-throne-cover.webp"
            alt="The Unseen Throne book cover"
            width={190}
            height={285}
            className="mx-auto w-[190px] h-auto rounded-lg shadow-md mb-3 transition-all duration-200 group-hover:-translate-y-1 group-hover:shadow-xl"
          />
          <h3 className="font-bold text-[#111] leading-snug text-sm group-hover:text-[#dc2626] transition-colors">The Unseen Throne</h3>
          <p className="text-xs text-slate-500 mt-1">Psalm 82 and the Divine Council</p>
          <p className="text-[11px] text-slate-400 mt-1 italic">A Response to Michael Heiser&apos;s The Unseen Realm</p>
          <p className="text-[11px] text-slate-400 mt-2 mb-3">by Brian A. Dempsey</p>
        </a>
        <a
          href={AMAZON_LINK}
          target="_blank"
          rel="noopener noreferrer sponsored"
          className="block w-full py-2 rounded-lg bg-[#dc2626] text-white text-xs font-semibold hover:bg-[#b91c1c] transition-colors"
        >
          Buy on Amazon
        </a>
      </div>
    </div>
  )
}
