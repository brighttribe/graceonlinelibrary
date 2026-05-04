#!/usr/bin/env python3
"""
Strip all Amazon and WTSBooks affiliate book recommendation blocks from article content.
Removes:
  - <blockquote> blocks containing amazon.com or wtsbooks.com links
  - <h2>/<h3> "books" or "resources" headings + everything that follows them
  - Inline Amazon affiliate <a> links and tracker <img> tags
  - Empty <ul>/<li> left behind after removal
"""

import re
import psycopg2
import psycopg2.extras
from bs4 import BeautifulSoup, NavigableString

DB = {
    'host': 'db.xhhvbxjllictpxtebeur.supabase.co',
    'dbname': 'postgres',
    'user': 'postgres',
    'password': 'hzwij3$9Tzy%Oq7Y',
    'port': 5432,
}

BOOK_HEADING_RE = re.compile(
    r'\b(books?|resources?|reading list|recommended|further reading|bibliography)\b',
    re.IGNORECASE
)

def is_affiliate_url(url: str) -> bool:
    url = url.lower()
    return 'amazon.com' in url or 'wtsbooks.com' in url or 'amazon-adsystem.com' in url

def has_affiliate_link(tag) -> bool:
    for a in tag.find_all('a', href=True):
        if is_affiliate_url(a['href']):
            return True
    for img in tag.find_all('img', src=True):
        if is_affiliate_url(img['src']):
            return True
    return False

def clean_content(html: str) -> str:
    if not html:
        return html

    soup = BeautifulSoup(html, 'html.parser')

    # 1. Remove entire <blockquote> blocks containing affiliate links
    for bq in soup.find_all('blockquote'):
        if has_affiliate_link(bq):
            bq.decompose()

    # 2. Remove <h2>/<h3> "books/resources" headings and everything after them
    #    (these sections are always at the end of articles)
    for heading in soup.find_all(['h2', 'h3']):
        text = heading.get_text(strip=True)
        if BOOK_HEADING_RE.search(text):
            # Check if this heading or any following sibling has affiliate links
            siblings = list(heading.next_siblings)
            section_has_affiliate = has_affiliate_link(heading)
            for sib in siblings:
                if hasattr(sib, 'find_all') and has_affiliate_link(sib):
                    section_has_affiliate = True
                    break

            if section_has_affiliate:
                # Remove the heading and all following siblings
                for sib in siblings:
                    if hasattr(sib, 'decompose'):
                        sib.decompose()
                heading.decompose()

    # 3. Remove standalone affiliate <a> tags (and their tracker <img> siblings)
    for a in soup.find_all('a', href=True):
        if is_affiliate_url(a['href']):
            # Remove any immediately following <img> tracker
            nxt = a.next_sibling
            if nxt and hasattr(nxt, 'name') and nxt.name == 'img':
                if nxt.get('src') and is_affiliate_url(nxt['src']):
                    nxt.decompose()
            a.decompose()

    # 4. Remove Amazon tracker images that weren't caught above
    for img in soup.find_all('img', src=True):
        if is_affiliate_url(img.get('src', '')):
            img.decompose()

    # 5. Clean up empty <li>, <ul>, <ol> left behind
    for tag_name in ['li', 'ul', 'ol']:
        for tag in soup.find_all(tag_name):
            if not tag.get_text(strip=True):
                tag.decompose()

    # 6. Clean up empty <p> tags
    for p in soup.find_all('p'):
        if not p.get_text(strip=True) and not p.find('img'):
            p.decompose()

    return str(soup)


def run():
    conn = psycopg2.connect(**DB)
    conn.autocommit = False
    cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)

    cur.execute("""
        SELECT id, slug, content FROM articles
        WHERE lower(content) LIKE '%amazon%' OR lower(content) LIKE '%wtsbooks%'
        ORDER BY slug
    """)
    rows = cur.fetchall()
    print(f"Processing {len(rows)} articles…")

    updated = 0
    for row in rows:
        original = row['content'] or ''
        cleaned = clean_content(original)
        if cleaned != original:
            cur.execute("UPDATE articles SET content = %s WHERE id = %s", (cleaned, row['id']))
            updated += 1

    conn.commit()
    cur.close()
    conn.close()

    print(f"✓ Done. Updated {updated} of {len(rows)} articles.")

    # Verify no amazon/wts links remain
    conn2 = psycopg2.connect(**DB)
    cur2 = conn2.cursor()
    cur2.execute("SELECT count(*) FROM articles WHERE lower(content) LIKE '%amazon%' OR lower(content) LIKE '%wtsbooks%'")
    remaining = cur2.fetchone()[0]
    cur2.close()
    conn2.close()
    print(f"  Remaining articles with amazon/wts links: {remaining}")


if __name__ == '__main__':
    run()
