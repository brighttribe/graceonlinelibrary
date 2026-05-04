#!/usr/bin/env python3
"""
Strip WordPress content artifacts from all articles:

  Images:
    - Remove all <img> tags (no hosted images; content is text-only)
    - If the wrapping <a> contained only the image, remove the <a> too
    - Remove empty <p>/<div>/<figure> shells left behind

  Spans/fonts:
    - Unwrap Google Translate spans (class ILfuVd / e24Kjd)
    - Unwrap all <font> tags (keep text)
    - Unwrap <span> tags that have only presentational style/class

  Inline styles — strip these properties everywhere:
    font-family, color, background-color, background, border (inline),
    width, height (on non-img elements), text-decoration

  HTML4 presentational attributes (on any tag):
    align, border, bgcolor, cellpadding, cellspacing, valign, width, height

  Shortcodes:
    - [caption ...] ... [/caption] blocks
    - Orphaned [/caption], [embed], [gallery], [audio], [video] tags

  Misc:
    - &nbsp; → regular space
    - Empty <p>, <li>, <ul>, <ol> left behind after removal
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

CAPTION_BLOCK_RE = re.compile(r'\[caption[^\]]*\].*?\[/caption\]', re.IGNORECASE | re.DOTALL)
SHORTCODE_RE = re.compile(r'\[/?(caption|embed|gallery|audio|video|playlist|wp[_-][a-z_]+)[^\]]*\]', re.IGNORECASE)

# Style properties to strip entirely
STRIP_STYLE_PROPS = re.compile(
    r'\s*(font-family|font-size|color|background-color|background|border|'
    r'text-decoration|width|height|margin|padding)\s*:[^;"]*(;|(?=["\'\\s]))',
    re.IGNORECASE
)

# HTML4 presentational attributes to remove from any element
JUNK_ATTRS = {'align', 'border', 'bgcolor', 'cellpadding', 'cellspacing', 'valign', 'width', 'height'}

# Span classes from Google Translate injection
GTRANSLATE_CLASSES = {'ILfuVd', 'e24Kjd'}


def clean_style(style: str) -> str:
    cleaned = STRIP_STYLE_PROPS.sub('', style)
    cleaned = re.sub(r';{2,}', ';', cleaned).strip('; \t')
    return cleaned


def only_contains_img(tag) -> bool:
    """Return True if tag's only meaningful content is an <img>."""
    children = [c for c in tag.children if not (isinstance(c, NavigableString) and not c.strip())]
    return len(children) == 1 and getattr(children[0], 'name', None) == 'img'


def clean_content(html: str) -> str:
    if not html:
        return html

    # 1. Strip full [caption]...[/caption] blocks
    html = CAPTION_BLOCK_RE.sub('', html)
    # 2. Strip orphaned shortcode tags
    html = SHORTCODE_RE.sub('', html)
    # 3. Replace &nbsp; with a plain space
    html = html.replace('&nbsp;', ' ')

    soup = BeautifulSoup(html, 'html.parser')

    # 4. Remove all <img> tags.
    #    If the wrapping <a> only contained the img, remove the <a> too.
    for img in soup.find_all('img'):
        parent = img.parent
        if parent and parent.name == 'a' and only_contains_img(parent):
            parent.decompose()
        else:
            img.decompose()

    # 5. Remove block wrappers (p, div, figure) that are now empty or image-only
    for tag_name in ['figure', 'div', 'p']:
        for tag in soup.find_all(tag_name):
            if not tag.get_text(strip=True) and not tag.find(['img', 'a', 'table']):
                tag.decompose()

    # 6. Unwrap Google Translate spans
    for span in soup.find_all('span', class_=True):
        classes = set(span.get('class', []))
        if classes & GTRANSLATE_CLASSES:
            span.unwrap()

    # 7. Unwrap <font> tags
    for font in soup.find_all('font'):
        font.unwrap()

    # 8. Unwrap purely presentational <span> tags (style/class only, no semantic value)
    for span in soup.find_all('span'):
        # If the span has no meaningful class and its style is empty after cleaning, unwrap
        span_style = clean_style(span.get('style', ''))
        span_classes = set(span.get('class', []))
        if not span_style and not (span_classes - GTRANSLATE_CLASSES):
            span.unwrap()
        elif span_style != span.get('style', ''):
            if span_style:
                span['style'] = span_style
            else:
                del span['style']

    # 9. Strip junk inline style properties from all remaining elements
    for tag in soup.find_all(True, style=True):
        new_style = clean_style(tag.get('style', ''))
        if new_style:
            tag['style'] = new_style
        else:
            del tag['style']

    # 10. Strip HTML4 presentational attributes from all elements
    for tag in soup.find_all(True):
        for attr in list(tag.attrs.keys()):
            if attr.lower() in JUNK_ATTRS:
                del tag[attr]

    # 11. Clean up empty list items and lists
    for tag_name in ['li', 'ul', 'ol']:
        for tag in soup.find_all(tag_name):
            if not tag.get_text(strip=True):
                tag.decompose()

    # 12. Final pass: remove empty <p> tags
    for p in soup.find_all('p'):
        if not p.get_text(strip=True) and not p.find(['img', 'table', 'a']):
            p.decompose()

    return str(soup)


def run():
    conn = psycopg2.connect(**DB)
    conn.autocommit = False
    cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)

    cur.execute(r"""
        SELECT id, slug, content FROM articles
        WHERE content ~ '\[[a-z/?]'
           OR lower(content) LIKE '%<img%'
           OR lower(content) LIKE '%<font%'
           OR lower(content) LIKE '%<span%'
           OR lower(content) LIKE '%font-family%'
           OR lower(content) LIKE '%color:%'
           OR lower(content) LIKE '%background-color%'
           OR lower(content) LIKE '%&nbsp;%'
           OR content ~ '(align|border|bgcolor|cellpadding|cellspacing)='
        ORDER BY slug
    """)
    rows = cur.fetchall()
    print(f"Candidates: {len(rows)} articles")

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

    # Verification pass
    conn2 = psycopg2.connect(**DB)
    cur2 = conn2.cursor()
    checks = [
        ("wp-content images",    "lower(content) LIKE '%<img%'"),
        ("font tags",            "lower(content) LIKE '%<font%'"),
        ("font-family styles",   "lower(content) LIKE '%font-family%'"),
        ("GT spans",             "lower(content) LIKE '%class=\"ILfuVd\"%'"),
        ("shortcodes",           r"content ~ '\[[a-z/?]'"),
        ("&nbsp;",               "content LIKE '%&nbsp;%'"),
    ]
    print("\nVerification:")
    for label, where in checks:
        cur2.execute(f"SELECT count(*) FROM articles WHERE {where}")
        n = cur2.fetchone()[0]
        status = "✓" if n == 0 else "!"
        print(f"  {status} {label}: {n} remaining")
    cur2.close()
    conn2.close()


if __name__ == '__main__':
    run()
