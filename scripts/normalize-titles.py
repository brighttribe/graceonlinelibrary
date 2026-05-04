#!/usr/bin/env python3
"""
Normalize trailing part-number formats in article titles.

  "Title - Part IV"    → "Title – Part 4"
  "Title (Part 10)"    → "Title – Part 10"
  "Title: Part I"      → "Title – Part 1"
  "Title – Section 3"  → "Title – Part 3"

Titles with content AFTER the part number are left alone:
  "Title – Part I: Some Subtitle"   → unchanged
  "Title - Part II (Lecture 49)"    → unchanged

Usage:
  python3 scripts/normalize-titles.py           # dry run (preview only)
  python3 scripts/normalize-titles.py --apply   # write to DB
"""

import re
import sys
import psycopg2
import psycopg2.extras

DB = {
    'host': 'db.xhhvbxjllictpxtebeur.supabase.co',
    'dbname': 'postgres',
    'user': 'postgres',
    'password': 'hzwij3$9Tzy%Oq7Y',
    'port': 5432,
}

ROMAN = {
    'I': 1, 'II': 2, 'III': 3, 'IV': 4, 'V': 5,
    'VI': 6, 'VII': 7, 'VIII': 8, 'IX': 9, 'X': 10,
    'XI': 11, 'XII': 12, 'XIII': 13, 'XIV': 14, 'XV': 15,
    'XVI': 16, 'XVII': 17, 'XVIII': 18, 'XIX': 19, 'XX': 20,
}
ROMAN_PAT = r'(?:' + '|'.join(sorted(ROMAN.keys(), key=len, reverse=True)) + r')'
PART_NUM_PAT = rf'(?:{ROMAN_PAT}|\d+)'
_PART_WORD = r'(?:Part|Pt\.?|Section)'
_SEP = r'(?:\s*[-–—]\s*|\s*:\s*)'

# Matches ONLY trailing part indicators — nothing meaningful after the number.
# Group 1: number from "– Part N" style
# Group 2: number from "(Part N)" style
TRAILING_PART = re.compile(
    rf'(?:'
    rf'{_SEP}{_PART_WORD}\s+({PART_NUM_PAT})'           # – Part IV  or : Part 3
    rf'|\s*\(\s*{_PART_WORD}\s+({PART_NUM_PAT})\s*\)'   # (Part 10)
    rf')\s*$',
    re.IGNORECASE,
)


def parse_num(s: str) -> int:
    s = s.strip()
    if s.isdigit():
        return int(s)
    return ROMAN.get(s.upper(), 0)


def normalize_title(title: str):
    """Returns new title string, or None if no change needed."""
    t = title.strip()
    m = TRAILING_PART.search(t)
    if not m:
        return None

    num_str = m.group(1) or m.group(2)
    num = parse_num(num_str)
    if num == 0:
        return None

    base = t[:m.start()].strip().rstrip('–—-').strip()
    if not base:
        return None

    new_title = f"{base} – Part {num}"
    if new_title == t:
        return None
    return new_title


def main():
    apply = '--apply' in sys.argv

    conn = psycopg2.connect(**DB)
    cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)

    cur.execute("SELECT id, title FROM articles ORDER BY title")
    articles = cur.fetchall()

    changes = []
    for row in articles:
        new_title = normalize_title(row['title'])
        if new_title:
            changes.append((row['id'], row['title'], new_title))

    print(f"{'DRY RUN — ' if not apply else ''}Found {len(changes)} titles to update:\n")
    for _, old, new in changes:
        print(f"  {old}")
        print(f"  → {new}\n")

    if not apply:
        print(f"Run with --apply to write {len(changes)} changes to the database.")
        cur.close()
        conn.close()
        return

    psycopg2.extras.execute_batch(
        cur,
        "UPDATE articles SET title = %s WHERE id = %s",
        [(new, aid) for aid, _, new in changes],
        page_size=100,
    )
    conn.commit()
    print(f"✓ Updated {len(changes)} titles.")

    cur.close()
    conn.close()


if __name__ == '__main__':
    main()
