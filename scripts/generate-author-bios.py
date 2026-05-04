#!/usr/bin/env python3
"""
Generate author bios using Claude API.
Targets authors with no bio, or a bio but no bio_long.

Usage: ANTHROPIC_API_KEY=sk-... python3 scripts/generate-author-bios.py
"""

import os
import time
import psycopg2
import anthropic

DB = {
    'host': 'db.xhhvbxjllictpxtebeur.supabase.co',
    'dbname': 'postgres',
    'user': 'postgres',
    'password': 'hzwij3$9Tzy%Oq7Y',
    'port': 5432,
}

PROMPT = """I need biographical information about {name} for a Reformed and Puritan theology library website. One of their articles is titled "{title}".

Please provide two things:

SHORT_BIO: One sentence (under 220 characters) identifying who this person is — include dates if known, their denomination or theological tradition, and what they are most known for.

LONG_BIO: A thorough multi-paragraph biography written in the style of a scholarly reference work. Cover background and education, theological development and convictions, ministry history, and notable works and contributions. Focus on their intellectual and theological life — not personal details like family or grandchildren. Write at least 3–4 substantial paragraphs if the information is available. If you genuinely cannot find enough reliable information to write a full bio, write just the word INSUFFICIENT_INFO.

Format your response exactly like this — do not add any other text before SHORT_BIO:

SHORT_BIO: [one sentence]

LONG_BIO:
[paragraph 1]

[paragraph 2]

[paragraph 3]

[etc.]"""


def fetch_authors(cur):
    cur.execute("""
        SELECT a.name, a.slug, a.article_count,
               (SELECT title FROM articles
                WHERE status='published' AND author ILIKE a.name
                ORDER BY title LIMIT 1) as sample_title
        FROM authors a
        WHERE a.name NOT ILIKE 'unknown%'
          AND a.article_count >= 2
          AND (
              (a.bio IS NULL OR a.bio = '')
              OR (a.bio_long IS NULL OR a.bio_long = '')
          )
        ORDER BY a.article_count DESC
    """)
    return cur.fetchall()


def parse_response(text):
    short = None
    long_ = None

    lines = text.splitlines()
    for line in lines:
        if line.strip().startswith('SHORT_BIO:'):
            short = line.split('SHORT_BIO:', 1)[1].strip()
            break

    if 'LONG_BIO:' in text:
        after = text.split('LONG_BIO:', 1)[1].strip()
        if after.upper().startswith('INSUFFICIENT_INFO'):
            long_ = None
        else:
            long_ = after.strip()

    return short, long_


def run():
    api_key = os.environ.get('ANTHROPIC_API_KEY')
    if not api_key:
        print("ERROR: Set ANTHROPIC_API_KEY env var before running.")
        print("  ANTHROPIC_API_KEY=sk-... python3 scripts/generate-author-bios.py")
        return

    client = anthropic.Anthropic(api_key=api_key)
    conn = psycopg2.connect(**DB)
    conn.autocommit = False
    cur = conn.cursor()

    authors = fetch_authors(cur)
    print(f"Found {len(authors)} authors to process\n")

    for name, slug, count, title in authors:
        if not title:
            print(f"  SKIP (no article title): {name}")
            continue

        print(f"  → {name} ({count} articles) — \"{title[:60]}\"")

        prompt = PROMPT.format(name=name, title=title)

        try:
            msg = client.messages.create(
                model='claude-opus-4-7',
                max_tokens=2048,
                messages=[{'role': 'user', 'content': prompt}]
            )
            response = msg.content[0].text
            short, long_ = parse_response(response)

            if short:
                cur.execute(
                    "UPDATE authors SET bio = %s, bio_long = %s WHERE slug = %s",
                    (short, long_, slug)
                )
                conn.commit()
                print(f"    ✓ short: {short[:80]}...")
                print(f"    ✓ long: {'yes (' + str(len(long_)) + ' chars)' if long_ else 'insufficient info'}")
            else:
                print(f"    ! could not parse response — raw output:")
                print(f"    {response[:300]}")

        except Exception as e:
            print(f"    ! error: {e}")
            conn.rollback()

        time.sleep(0.5)

    cur.close()
    conn.close()
    print("\n✓ Done.")


if __name__ == '__main__':
    run()
