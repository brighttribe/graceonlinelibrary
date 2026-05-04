#!/usr/bin/env python3
"""
Merge duplicate/variant author names in both the articles table (author field)
and the authors table (consolidate rows, recalculate article_count).

For each non-canonical name:
  1. Update articles.author to the canonical name
  2. Re-point article_authors.author_id to the canonical author row
  3. Update canonical author's article_count
  4. Delete the now-orphaned duplicate author row
"""

import psycopg2
import psycopg2.extras

DB = {
    'host': 'db.xhhvbxjllictpxtebeur.supabase.co',
    'dbname': 'postgres',
    'user': 'postgres',
    'password': 'hzwij3$9Tzy%Oq7Y',
    'port': 5432,
}

# (non-canonical name, canonical name)
# canonical name must already exist in the authors table
MERGES = [
    # Warfield typos
    ("Benjiman B. Warfield",    "Benjamin B. Warfield"),
    ("Benjamine B. Warfield",   "Benjamin B. Warfield"),

    # Pink variants
    ("Arthur Pink",             "Arthur W. Pink"),
    ("A.W. Pink",               "Arthur W. Pink"),
    ("Author W. Pink",          "Arthur W. Pink"),

    # Dabney formatting
    ("R.L. Dabney",             "R. L. Dabney"),

    # Ryle formatting
    ("J. C. Ryle",              "J.C. Ryle"),

    # Packer formatting
    ("J. I. Packer",            "J.I. Packer"),

    # Spurgeon
    ("Charles Spurgeon",        "Charles H. Spurgeon"),

    # Lloyd-Jones — all variants → D. Martyn Lloyd-Jones
    ("Martin Lloyd-Jones",      "D. Martyn Lloyd-Jones"),
    ("Martyn Lloyd-Jones",      "D. Martyn Lloyd-Jones"),
    ("Dr. Martyn Lloyd-Jones",  "D. Martyn Lloyd-Jones"),

    # Hodge formatting
    ("A.A. Hodge",              "A. A. Hodge"),

    # Engelsma — all → Prof. David J. Engelsma
    ("Prof. David Engelsma",    "Prof. David J. Engelsma"),
    ("David J. Engelsma",       "Prof. David J. Engelsma"),

    # McCheyne duplicate slug
    ("Robert Murray M'Cheyne",  "Robert Murray M'Cheyne"),   # handled via slug below

    # Rutherford old spelling
    ("Samuel Rutherfurd",       "Samuel Rutherford"),

    # Bahnsen — Dr. prefix is canonical
    ("Greg Bahnsen",            "Dr. Greg Bahnsen"),

    # Gentry trailing period
    ("Kenneth L. Gentry, Jr",   "Kenneth L. Gentry, Jr."),

    # Schreiner typo
    ("Thomas Schriner",         "Thomas Schreiner"),

    # Boice — full name canonical
    ("James M. Boice",          "James Montgomery Boice"),

    # Martin
    ("Albert Martin",           "Albert N. Martin"),

    # Reisinger — "Earnest" is a misspelling of "Ernest"
    ("Earnest C. Reisinger",    "Ernest C Reisinger"),

    # Finlayson formatting
    ("R.A. Finlayson",          "R. A. Finlayson"),

    # Duncan — full name canonical
    ("Ligon Duncan",            "J. Ligon Duncan"),

    # Beza — remove date from name
    ("Theodore Beza (1519-1605", "Theodore Beza"),

    # Merle d'Aubigné formatting
    ("J.H. Merle D'Aubigne",    "J. H. Merle d'Aubigné"),

    # Nettles — Thomas J. is more formal
    ("Tom Nettles",             "Thomas J. Nettles"),

    # Waldron typo
    ("Samual E. Waldron",       "Samuel E. Waldron"),
]

# Special case: "Samual E. Waldron" needs the canonical name fixed too
# (the correct spelling "Samuel E. Waldron" may not exist yet — we handle below)


def get_author(cur, name):
    cur.execute("SELECT id, name, slug, article_count FROM authors WHERE name = %s", (name,))
    return cur.fetchone()


def run():
    conn = psycopg2.connect(**DB)
    conn.autocommit = False
    cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)

    # Special case: fix "Samual E. Waldron" name in the authors table itself
    cur.execute("UPDATE authors SET name = 'Samuel E. Waldron', slug = 'samuel-e-waldron' "
                "WHERE slug = 'samual-e-waldron' AND NOT EXISTS "
                "(SELECT 1 FROM authors WHERE slug = 'samuel-e-waldron')")
    if cur.rowcount:
        print("  fixed: Samual E. Waldron → Samuel E. Waldron")

    # Special case: "Robert Murray M'Cheyne" has two separate rows with identical names
    # (different slugs: robert-murray-mcheyne and robert-murray-mcheyne-2)
    cur.execute("SELECT id FROM authors WHERE slug = 'robert-murray-mcheyne'")
    canonical_mcheyne = cur.fetchone()
    cur.execute("SELECT id FROM authors WHERE slug = 'robert-murray-mcheyne-2'")
    dup_mcheyne = cur.fetchone()
    if canonical_mcheyne and dup_mcheyne:
        can_id = canonical_mcheyne['id']
        dup_id = dup_mcheyne['id']
        cur.execute("UPDATE article_authors SET author_id = %s WHERE author_id = %s", (can_id, dup_id))
        cur.execute("DELETE FROM authors WHERE id = %s", (dup_id,))
        print(f"  merged: Robert Murray M'Cheyne duplicate slug")

    merged = 0
    skipped = 0

    for non_canonical, canonical in MERGES:
        if non_canonical == "Robert Murray M'Cheyne":
            continue  # handled above

        canonical_row = get_author(cur, canonical)
        if not canonical_row:
            print(f"  ! CANONICAL NOT FOUND: {canonical!r}")
            skipped += 1
            continue

        dup_row = get_author(cur, non_canonical)
        if not dup_row:
            skipped += 1
            continue

        can_id = canonical_row['id']
        dup_id = dup_row['id']

        if can_id == dup_id:
            skipped += 1
            continue

        # Update articles.author
        cur.execute(
            "UPDATE articles SET author = %s WHERE author = %s",
            (canonical, non_canonical)
        )
        articles_updated = cur.rowcount

        # Re-point article_authors
        cur.execute(
            "UPDATE article_authors SET author_id = %s WHERE author_id = %s",
            (can_id, dup_id)
        )

        # Delete duplicate author row
        cur.execute("DELETE FROM authors WHERE id = %s", (dup_id,))

        print(f"  merged: {non_canonical!r} → {canonical!r}  ({articles_updated} articles)")
        merged += 1

    # Recalculate article_count for all affected canonical authors
    canonical_names = list({c for _, c in MERGES} | {"Robert Murray M'Cheyne", "Samuel E. Waldron"})
    for name in canonical_names:
        cur.execute(
            "UPDATE authors SET article_count = ("
            "  SELECT count(*) FROM article_authors aa "
            "  JOIN authors a ON a.id = aa.author_id WHERE a.name = %s"
            ") WHERE name = %s",
            (name, name)
        )

    conn.commit()
    cur.close()
    conn.close()
    print(f"\n✓ Done. Merged {merged} duplicates, skipped {skipped}.")


if __name__ == '__main__':
    run()
