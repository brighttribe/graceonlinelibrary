#!/usr/bin/env python3
"""
Import WordPress XML export into Supabase articles table.
Skips blog/book-review posts. Strips WPBakery shortcodes.

Usage: python3 scripts/import-wp.py ~/Desktop/gol-wp.xml
"""

import sys
import re
import json
import os
from datetime import datetime

try:
    from lxml import etree
except ImportError:
    print("Run: pip3 install lxml --break-system-packages")
    sys.exit(1)

try:
    from supabase import create_client
except ImportError:
    print("Run: npm install (supabase-py not needed — using REST directly)")
    import urllib.request

# ── Config ──────────────────────────────────────────────────────────────────

WP_FILE = sys.argv[1] if len(sys.argv) > 1 else os.path.expanduser("~/Desktop/gol-wp.xml")

# Load env
env = {}
env_path = os.path.join(os.path.dirname(__file__), '..', '.env.local')
with open(env_path) as f:
    for line in f:
        line = line.strip()
        if line and not line.startswith('#') and '=' in line:
            k, v = line.split('=', 1)
            env[k.strip()] = v.strip()

SUPABASE_URL = env['NEXT_PUBLIC_SUPABASE_URL']
SERVICE_KEY  = env['SUPABASE_SERVICE_ROLE_KEY']

SKIP_CATEGORIES = {'blog', 'book-reviews', 'test', 'content', 'featured', 'featured-books', 'quotes'}

# ── Helpers ──────────────────────────────────────────────────────────────────

def strip_shortcodes(text):
    # Remove WPBakery and other shortcode wrappers, keep inner content
    text = re.sub(r'\[/?vc_[^\]]*\]', '', text)
    text = re.sub(r'\[/?nectar_[^\]]*\]', '', text)
    text = re.sub(r'\[/?cs_[^\]]*\]', '', text)
    # Remove remaining unknown shortcodes
    text = re.sub(r'\[[a-z_]+[^\]]*\]', '', text)
    return text.strip()

def clean_content(text):
    if not text:
        return ''
    text = strip_shortcodes(text)
    # Remove WordPress upload domain variants
    text = re.sub(r'https?://graceonlinelibrary\.org\.previewdns\.com', 'https://graceonlinelibrary.org', text)
    # Collapse excessive blank lines
    text = re.sub(r'\n{3,}', '\n\n', text)
    return text.strip()

def excerpt_from_content(content, max_len=300):
    # Strip HTML tags
    text = re.sub(r'<[^>]+>', '', content)
    text = re.sub(r'\s+', ' ', text).strip()
    if len(text) <= max_len:
        return text
    return text[:max_len].rsplit(' ', 1)[0] + '…'

def slugify(text):
    text = text.lower()
    text = re.sub(r'[^\w\s-]', '', text)
    text = re.sub(r'[-\s]+', '-', text)
    return text.strip('-')

def insert_batch(rows):
    data = json.dumps(rows).encode('utf-8')
    req = urllib.request.Request(
        f"{SUPABASE_URL}/rest/v1/articles",
        data=data,
        headers={
            'apikey': SERVICE_KEY,
            'Authorization': f'Bearer {SERVICE_KEY}',
            'Content-Type': 'application/json',
            'Prefer': 'resolution=ignore-duplicates',
        },
        method='POST'
    )
    try:
        with urllib.request.urlopen(req) as resp:
            return resp.status
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        print(f"  ERROR {e.code}: {body[:200]}")
        return e.code

# ── Parse XML ────────────────────────────────────────────────────────────────

WP      = 'http://wordpress.org/export/1.2/'
CONTENT = 'http://purl.org/rss/1.0/modules/content/'
DC      = 'http://purl.org/dc/elements/1.1/'

print(f"Parsing {WP_FILE}...")
parser = etree.XMLParser(recover=True)
tree   = etree.parse(WP_FILE, parser)
root   = tree.getroot()

items     = root.findall('.//item')
published = [i for i in items
             if i.findtext(f'{{{WP}}}post_type') == 'post'
             and i.findtext(f'{{{WP}}}status') == 'publish']

print(f"Found {len(published)} published posts")

# ── Build rows ───────────────────────────────────────────────────────────────

rows = []
skipped = 0
seen_slugs = set()

for item in published:
    cats_nice = [c.get('nicename') for c in item.findall('category') if c.get('domain') == 'category']
    cats_name = [c.text for c in item.findall('category') if c.get('domain') == 'category']
    tags_name = [c.text for c in item.findall('category') if c.get('domain') == 'post_tag']

    # Skip blog/noise categories
    if any(c in SKIP_CATEGORIES for c in cats_nice):
        skipped += 1
        continue

    title   = item.findtext('title') or ''
    slug    = item.findtext(f'{{{WP}}}post_name') or slugify(title)
    wp_id   = item.findtext(f'{{{WP}}}post_id')
    author  = item.findtext(f'{{{DC}}}creator') or ''
    date    = item.findtext(f'{{{WP}}}post_date') or ''
    content = clean_content(item.findtext(f'{{{CONTENT}}}encoded') or '')
    excerpt = clean_content(item.findtext(f'{{http://wordpress.org/export/1.2/excerpt/}}encoded') or '')
    if not excerpt and content:
        excerpt = excerpt_from_content(content)

    # Primary category (first non-skip one)
    category = cats_name[0] if cats_name else None

    # Deduplicate slugs
    original_slug = slug
    counter = 1
    while slug in seen_slugs:
        slug = f"{original_slug}-{counter}"
        counter += 1
    seen_slugs.add(slug)

    try:
        pub_date = datetime.strptime(date, '%Y-%m-%d %H:%M:%S').isoformat()
    except Exception:
        pub_date = None

    rows.append({
        'wp_id':        int(wp_id) if wp_id else None,
        'title':        title,
        'slug':         slug,
        'content':      content,
        'excerpt':      excerpt,
        'category':     category,
        'tags':         tags_name,
        'author':       author,
        'published_at': pub_date,
        'status':       'published',
        'featured':     'featured' in cats_nice,
    })

print(f"Importing {len(rows)} articles (skipped {skipped} blog posts)...")

# ── Insert in batches of 50 ───────────────────────────────────────────────────

BATCH = 50
for i in range(0, len(rows), BATCH):
    batch = rows[i:i+BATCH]
    status = insert_batch(batch)
    print(f"  Batch {i//BATCH + 1}/{(len(rows)+BATCH-1)//BATCH} → HTTP {status}")

print("Done.")
