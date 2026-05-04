#!/usr/bin/env python3
"""
Detect article series from title patterns, populate series_slug, series_name,
and part_num columns on the articles table.

Handles:
  - Part N / Section N (Arabic or Roman) in parens, after dash, after colon
  - Sub-series embedded in parens: "Title (Series Name – Part N)"
  - Ordinal sub-sections: "Title: First Sermon - Part N"  →  composite part_num
  - Introduction articles (Part 0) — joins numbered series
  - Conclusion articles (Part 9999) — sorts last
  - Prefix-based series with no Part numbers (Revelation Twenty, C&L, Postmillennialism)
  - Standalone articles whose title matches a series name (Part 0)
"""

import re
import psycopg2
import psycopg2.extras
from collections import defaultdict

DB = {
    'host': 'db.xhhvbxjllictpxtebeur.supabase.co',
    'dbname': 'postgres',
    'user': 'postgres',
    'password': 'hzwij3$9Tzy%Oq7Y',
    'port': 5432,
}

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

ROMAN = {
    'I': 1, 'II': 2, 'III': 3, 'IV': 4, 'V': 5,
    'VI': 6, 'VII': 7, 'VIII': 8, 'IX': 9, 'X': 10,
    'XI': 11, 'XII': 12, 'XIII': 13, 'XIV': 14, 'XV': 15,
    'XVI': 16, 'XVII': 17, 'XVIII': 18, 'XIX': 19, 'XX': 20,
}
ROMAN_PAT = r'(?:' + '|'.join(sorted(ROMAN.keys(), key=len, reverse=True)) + r')'
ARABIC_PAT = r'\d+'
PART_NUM_PAT = rf'(?:{ROMAN_PAT}|{ARABIC_PAT})'


def parse_part_num(s: str) -> int:
    s = s.strip()
    if s.isdigit():
        return int(s)
    upper = s.upper()
    return ROMAN.get(upper, 0)


def slugify(text: str, max_len: int = 80) -> str:
    text = text.strip().lower()
    text = re.sub(r'[^\w\s-]', '', text)
    text = re.sub(r'[\s_]+', '-', text)
    text = re.sub(r'-+', '-', text)
    return text.strip('-')[:max_len].rstrip('-')


def normalize(text: str) -> str:
    text = text.strip().lower()
    text = text.replace('—', '-').replace('–', '-')
    text = re.sub(r'\s*-\s*', '-', text)
    text = re.sub(r'\s+', ' ', text)
    return text


# ---------------------------------------------------------------------------
# Pattern definitions
# ---------------------------------------------------------------------------

_DASH = r'(?:\s*[-–—]\s*)'
_PART_WORD = r'(?:Part|Pt\.?|Section)'

ORDINALS = {
    'first': 1, 'second': 2, 'third': 3, 'fourth': 4, 'fifth': 5,
    'sixth': 6, 'seventh': 7, 'eighth': 8, 'ninth': 9, 'tenth': 10,
}
_ORDINAL_ALT = '|'.join(ORDINALS.keys())

# Sub-series in parens: "Unique Title (Series Name – Part N)"
PAT9 = re.compile(
    rf'\((?P<sub_series>.+?){_DASH}{_PART_WORD}\s+(?P<p9>{PART_NUM_PAT})\s*(?:of\s+{PART_NUM_PAT})?\s*\)\s*$',
    re.IGNORECASE,
)
# "Title (Part N)" or "Title (Part N of M)"
PAT1 = re.compile(
    rf'\(\s*{_PART_WORD}\s+(?P<p1>{PART_NUM_PAT})\s*(?:of\s+{PART_NUM_PAT})?\s*\)\s*(?:\(.*?\)\s*)?$',
    re.IGNORECASE,
)
# "Title: First/Second/Third Noun [- Part N]"
PATORD = re.compile(
    rf':\s*(?P<ord>{_ORDINAL_ALT})\s+\w+(?:{_DASH}{_PART_WORD}\s+(?P<pord>{PART_NUM_PAT}))?',
    re.IGNORECASE,
)
# "Title: Part N" or "Title: Part N - Subtitle"
PAT6 = re.compile(
    rf':\s*{_PART_WORD}\s+(?P<p6>{PART_NUM_PAT})\s*(?:{_DASH}.*)?$',
    re.IGNORECASE,
)
# "Title - Part N" or "Title - Part N: Subtitle" (dash variants)
PAT3 = re.compile(
    rf'{_DASH}{_PART_WORD}\s+(?P<p3>{PART_NUM_PAT})\s*(?:[:\(].*)?$',
    re.IGNORECASE,
)
# Introduction: "Title - Introduction", "Title: Introduction", "Title (Introduction)"
PATINTRO = re.compile(
    r'(?:[-–—:]\s*(?:an?\s+)?introduction\s*$|\s*\(\s*(?:an?\s+)?introduction\s*\)\s*$)',
    re.IGNORECASE,
)
# Conclusion: "Title - Conclusion", "Title: Conclusion", "Title (Conclusion)"
PATCONC = re.compile(
    r'(?:[-–—:]\s*conclusion\s*$|\s*\(\s*conclusion\s*\)\s*$)',
    re.IGNORECASE,
)


def extract_series_info(title: str):
    """Returns (base_title, part_num) or None."""
    t = title.strip()

    # Introduction → part 0
    m = PATINTRO.search(t)
    if m:
        base = t[:m.start()].strip()
        if base:
            return base, 0

    # Conclusion → part 9999
    m = PATCONC.search(t)
    if m:
        base = t[:m.start()].strip()
        if base:
            return base, 9999

    # Sub-series in parens
    m = PAT9.search(t)
    if m:
        return m.group('sub_series').strip(), parse_part_num(m.group('p9'))

    # (Part N) or (Part N of M)
    m = PAT1.search(t)
    if m:
        base = t[:m.start()].strip().rstrip('–—-').strip()
        if base:
            return base, parse_part_num(m.group('p1'))

    # Ordinal subsections
    m = PATORD.search(t)
    if m:
        base = t[:m.start()].strip()
        ordinal_num = ORDINALS[m.group('ord').lower()]
        sub_str = m.group('pord')
        composite = ordinal_num * 100 + (parse_part_num(sub_str) if sub_str else 0)
        if base:
            return base, composite

    # Title: Part N
    m = PAT6.search(t)
    if m:
        base = t[:m.start()].strip()
        if base:
            return base, parse_part_num(m.group('p6'))

    # Title - Part N
    m = PAT3.search(t)
    if m:
        base = t[:m.start()].strip()
        if base:
            return base, parse_part_num(m.group('p3'))

    return None


# ---------------------------------------------------------------------------
# Prefix-based series detection (no Part numbers — e.g. "Title - Chapter Name")
# ---------------------------------------------------------------------------

_SEP = re.compile(r'^(.+?)\s*[-–—:]\s*(.+)$')
_INTRO_SUB = re.compile(r'^(?:an?\s+)?introduction\s*$', re.IGNORECASE)
_CONC_SUB  = re.compile(r'^conclusion\s*$', re.IGNORECASE)


def subtitle_sort_key(subtitle: str):
    if _INTRO_SUB.match(subtitle.strip()):
        return (0, '')
    if _CONC_SUB.match(subtitle.strip()):
        return (2, subtitle)
    return (1, subtitle.lower())


def detect_prefix_series(articles, already_matched_ids, min_size=3):
    """
    Find groups of articles sharing the same 'Title - Subtitle' prefix
    (same author, no Part N number) with at least min_size members.
    Returns list of (series_name, series_slug, [(article_id, part_num), ...]).
    """
    prefix_groups = defaultdict(list)
    for row in articles:
        if row['id'] in already_matched_ids:
            continue
        m = _SEP.match(row['title'].strip())
        if not m:
            continue
        prefix = m.group(1).strip()
        subtitle = m.group(2).strip()
        author = (row['author'] or '').strip().lower()
        key = (normalize(prefix), author)
        prefix_groups[key].append({
            'id': row['id'],
            'title': row['title'],
            'prefix': prefix,
            'subtitle': subtitle,
            'author': row['author'],
        })

    results = []
    for (norm_prefix, author_lower), members in prefix_groups.items():
        if len(members) < min_size:
            continue
        # Sort: intro first, conclusion last, rest alphabetically
        members_sorted = sorted(members, key=lambda x: subtitle_sort_key(x['subtitle']))
        canonical_prefix = members_sorted[0]['prefix']
        author_words = author_lower.split()
        author_key = author_words[-1] if author_words else 'unknown'
        series_slug = slugify(f"{canonical_prefix}--{author_key}", max_len=80)
        parts = [(m['id'], i + 1) for i, m in enumerate(members_sorted)]
        results.append((canonical_prefix, series_slug, parts, members_sorted))

    return results


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    conn = psycopg2.connect(**DB)
    cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)

    print("Ensuring columns exist...")
    cur.execute("""
        ALTER TABLE articles
            ADD COLUMN IF NOT EXISTS series_slug TEXT,
            ADD COLUMN IF NOT EXISTS series_name TEXT,
            ADD COLUMN IF NOT EXISTS part_num INT;
    """)
    conn.commit()

    print("Clearing existing series data...")
    cur.execute("UPDATE articles SET series_slug = NULL, series_name = NULL, part_num = NULL")
    conn.commit()

    cur.execute("SELECT id, title, author FROM articles WHERE status = 'published' ORDER BY title")
    articles = cur.fetchall()
    print(f"Loaded {len(articles)} published articles\n")

    # --- Pass 1: extract Part-N patterns ---
    candidates = []
    for row in articles:
        result = extract_series_info(row['title'])
        if result is None:
            continue
        base_title, part_num = result
        norm_base = normalize(base_title)
        author = (row['author'] or '').strip()
        candidates.append({
            'id': row['id'],
            'title': row['title'],
            'base_title': base_title,
            'norm_base': norm_base,
            'author': author,
            'part_num': part_num,
        })

    # Group by (normalized_base, author)
    groups = defaultdict(list)
    for c in candidates:
        key = (c['norm_base'], c['author'].lower())
        groups[key].append(c)

    updates = []
    matched_ids = set()

    for (norm_base, author_lower), parts in sorted(groups.items(), key=lambda x: x[0][0]):
        # Need at least 2 numbered parts (part_num > 0 and < 9999) to confirm it's a series
        numbered = [p for p in parts if 0 < p['part_num'] < 9999]
        if len(numbered) < 2:
            continue

        parts_sorted = sorted(parts, key=lambda x: x['part_num'])
        # Use the part-1 article's base for canonical name
        part1 = next((p for p in parts_sorted if p['part_num'] == 1), parts_sorted[0])
        canonical_base = part1['base_title']

        author_words = author_lower.split()
        author_key = author_words[-1] if author_words else 'unknown'
        series_slug = slugify(f"{canonical_base}--{author_key}", max_len=80)

        print(f"Series: {canonical_base!r}  [{len(parts_sorted)} parts]")
        for p in parts_sorted:
            print(f"  Part {p['part_num']:>4}: {p['title']}")
            updates.append((series_slug, canonical_base, p['part_num'], p['id']))
            matched_ids.add(p['id'])

    print(f"\n→ {len(updates)} articles from Part-N detection")

    # --- Pass 2: standalone articles whose title matches a series name ---
    series_names_to_slug = {}
    for (series_slug, series_name, part_num, article_id) in updates:
        series_names_to_slug[normalize(series_name)] = (series_slug, series_name)

    for row in articles:
        if row['id'] in matched_ids:
            continue
        norm_title = normalize(row['title'])
        if norm_title in series_names_to_slug:
            series_slug, series_name = series_names_to_slug[norm_title]
            print(f"  Standalone→Part0: {row['title']!r}")
            updates.append((series_slug, series_name, 0, row['id']))
            matched_ids.add(row['id'])

    # --- Pass 3: prefix-based series (no Part numbers) ---
    prefix_series = detect_prefix_series(articles, matched_ids, min_size=3)
    for canonical_prefix, series_slug, parts, members_sorted in prefix_series:
        print(f"\nPrefix series: {canonical_prefix!r}  [{len(parts)} parts]")
        for member, (article_id, part_num) in zip(members_sorted, parts):
            print(f"  Part {part_num:>3}: {member['title']}")
            updates.append((series_slug, canonical_prefix, part_num, article_id))
            matched_ids.add(article_id)

    print(f"\nUpdating {len(updates)} articles in DB...")
    psycopg2.extras.execute_batch(
        cur,
        "UPDATE articles SET series_slug = %s, series_name = %s, part_num = %s WHERE id = %s",
        updates,
        page_size=100,
    )
    conn.commit()

    cur.execute("SELECT COUNT(*) FROM articles WHERE series_slug IS NOT NULL")
    tagged = cur.fetchone()[0]
    total_series = len(set(u[0] for u in updates))
    print(f"\n✓ Done. {tagged} articles tagged across {total_series} series.")

    cur.close()
    conn.close()


if __name__ == '__main__':
    main()
