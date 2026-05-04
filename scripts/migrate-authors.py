#!/usr/bin/env python3
"""
Extract authors from article titles, populate authors table,
and clean titles. Slugs are never changed.
"""

import re
import os
import psycopg2
import psycopg2.extras

DB = {
    'host': 'db.xhhvbxjllictpxtebeur.supabase.co',
    'dbname': 'postgres',
    'user': 'postgres',
    'password': 'hzwij3$9Tzy%Oq7Y',
    'port': 5432,
}

def slugify(text):
    text = text.strip().lower()
    text = re.sub(r'[^\w\s-]', '', text)
    text = re.sub(r'[\s_]+', '-', text)
    text = re.sub(r'-+', '-', text)
    return text.strip('-')

def extract_author_from_title(title):
    """
    Returns (clean_title, author_string) or (title, None) if no match.
    Works right-to-left through " by " occurrences, skipping any that
    sit inside unmatched parentheses (e.g. "Revised by Editor").
    """
    positions = [m.start() for m in re.finditer(r'\s+by\s+', title, re.IGNORECASE)]
    if not positions:
        return title, None

    for pos in reversed(positions):
        after = re.search(r'\s+by\s+(.+)', title[pos:], re.IGNORECASE)
        if not after:
            continue
        author_raw = after.group(1).strip()
        if not author_raw or not author_raw[0].isupper():
            continue
        candidate_title = title[:pos].strip()
        # Skip if this " by " is inside parens
        if candidate_title.count('(') > candidate_title.count(')'):
            continue
        author_raw = author_raw.rstrip(')').strip()
        return candidate_title, author_raw

    return title, None


def split_authors(author_string):
    """Split 'Author A & Author B' into individual names."""
    parts = re.split(r'\s*&\s*|\s+and\s+', author_string)
    return [p.strip() for p in parts if p.strip()]


def run():
    conn = psycopg2.connect(**DB)
    conn.autocommit = False
    cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)

    print("Creating authors and article_authors tables…")
    sql_path = os.path.join(os.path.dirname(__file__), 'add-authors.sql')
    cur.execute(open(sql_path).read())

    cur.execute("SELECT id, title FROM articles ORDER BY title")
    articles = cur.fetchall()
    print(f"Processing {len(articles)} articles…")

    author_cache = {}  # name -> (id, slug)
    skipped = []

    for art in articles:
        art_id = art['id']
        clean_title, author_string = extract_author_from_title(art['title'])

        if author_string is None:
            skipped.append(art['title'])
            continue

        cur.execute(
            "UPDATE articles SET title = %s, author = %s WHERE id = %s",
            (clean_title, author_string, art_id)
        )

        for order, name in enumerate(split_authors(author_string)):
            if name not in author_cache:
                author_slug = slugify(name)
                base = author_slug
                c = 2
                used_slugs = {v[1] for v in author_cache.values()}
                while author_slug in used_slugs:
                    author_slug = f"{base}-{c}"
                    c += 1
                cur.execute(
                    """INSERT INTO authors (name, slug) VALUES (%s, %s)
                       ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
                       RETURNING id, slug""",
                    (name, author_slug)
                )
                row = cur.fetchone()
                author_cache[name] = (row['id'], row['slug'])

            cur.execute(
                """INSERT INTO article_authors (article_id, author_id, display_order)
                   VALUES (%s, %s, %s) ON CONFLICT DO NOTHING""",
                (art_id, author_cache[name][0], order)
            )

    cur.execute("""
        UPDATE authors a
        SET article_count = (SELECT count(*) FROM article_authors aa WHERE aa.author_id = a.id)
    """)

    conn.commit()
    cur.close()
    conn.close()

    print(f"\n✓ Done.")
    print(f"  Authors created : {len(author_cache)}")
    print(f"  Articles without author pattern: {len(skipped)}")
    if skipped:
        print("\nNo author extracted from:")
        for t in skipped:
            print(f"  - {t}")

    conn2 = psycopg2.connect(**DB)
    cur2 = conn2.cursor(cursor_factory=psycopg2.extras.DictCursor)
    cur2.execute("SELECT name, article_count FROM authors ORDER BY article_count DESC LIMIT 25")
    print("\nTop authors:")
    for r in cur2.fetchall():
        print(f"  {r['article_count']:3d}  {r['name']}")
    cur2.close()
    conn2.close()


if __name__ == '__main__':
    run()
