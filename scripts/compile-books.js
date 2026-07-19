// Compiles the per-batch research JSON files (written by the research subagents)
// into a single normalized dataset: unique books + category definitions +
// book<->category tier links. Robust to a batch that failed to parse.
//
//   node scripts/compile-books.js
//
// Reads:  <scratchpad>/gol-books/research/batch-*.json
// Writes: scripts/build/books-compiled.json
const fs = require("fs");
const path = require("path");

const RESEARCH_DIR =
  process.env.RESEARCH_DIR ||
  "/private/tmp/claude-501/-Users-briandempsey/5fb1b26a-ec28-4091-b5ef-5acc2520ad37/scratchpad/gol-books/research";
const OUT_DIR = path.join(__dirname, "build");
const OUT = path.join(OUT_DIR, "books-compiled.json");
// Committed metadata the app imports (category name + doctrine definition).
const META_OUT = path.join(__dirname, "..", "content", "book-guide-meta.json");

const TIERS = ["basic", "intermediate", "advanced"];

function cleanIsbn(raw) {
  const d = String(raw || "").replace(/[^0-9Xx]/g, "");
  return /^\d{13}$/.test(d) ? d : null;
}

// A stable key for a book: prefer a valid ISBN-13, else title+author.
function bookKey(b) {
  return cleanIsbn(b.isbn13) || `t:${(b.title || "").toLowerCase().trim()}|${(b.author || "").toLowerCase().trim()}`;
}

function main() {
  const files = fs
    .readdirSync(RESEARCH_DIR)
    .filter((f) => /^batch-\d+\.json$/.test(f))
    .sort();

  const cats = new Map(); // slug -> {slug, category, definition}
  const books = new Map(); // key -> {isbn13, title, author, year, isbn_confidence}
  const links = []; // {key, slug, category, tier, why, top_pick, sort}
  const problems = [];

  for (const f of files) {
    const full = path.join(RESEARCH_DIR, f);
    let arr;
    try {
      arr = JSON.parse(fs.readFileSync(full, "utf8"));
    } catch (e) {
      problems.push(`${f}: JSON parse failed (${e.message.slice(0, 60)})`);
      continue;
    }
    if (!Array.isArray(arr)) {
      problems.push(`${f}: not an array`);
      continue;
    }
    for (const c of arr) {
      if (!c || !c.slug || !c.category) {
        problems.push(`${f}: category object missing slug/category`);
        continue;
      }
      if (!cats.has(c.slug)) {
        cats.set(c.slug, { slug: c.slug, category: c.category, definition: (c.definition || "").trim() });
      }
      const tiers = c.tiers || {};
      for (const tier of TIERS) {
        const list = Array.isArray(tiers[tier]) ? tiers[tier] : [];
        list.forEach((b, i) => {
          if (!b || !b.title) return;
          const key = bookKey(b);
          if (!books.has(key)) {
            books.set(key, {
              key,
              isbn13: cleanIsbn(b.isbn13),
              title: (b.title || "").trim(),
              author: (b.author || "").trim(),
              year: Number.isFinite(b.year) ? b.year : null,
              isbn_confidence: b.isbnConfidence || null,
            });
          } else {
            // fill gaps from later sightings
            const ex = books.get(key);
            if (!ex.isbn13 && cleanIsbn(b.isbn13)) ex.isbn13 = cleanIsbn(b.isbn13);
            if (!ex.year && Number.isFinite(b.year)) ex.year = b.year;
            if (!ex.author && b.author) ex.author = b.author.trim();
          }
          links.push({
            key,
            slug: c.slug,
            category: c.category,
            tier,
            why: (b.why || "").trim(),
            top_pick: !!b.topPick,
            sort: i,
          });
        });
      }
    }
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const out = {
    categories: [...cats.values()].sort((a, b) => a.category.localeCompare(b.category)),
    books: [...books.values()],
    links,
  };
  fs.writeFileSync(OUT, JSON.stringify(out, null, 2));

  // Committed guide metadata: slug -> {category, definition}. Only categories
  // that actually produced books are included.
  const withBooks = new Set(links.map((l) => l.slug));
  const meta = {};
  for (const c of out.categories) {
    if (withBooks.has(c.slug)) meta[c.slug] = { category: c.category, definition: c.definition };
  }
  fs.mkdirSync(path.dirname(META_OUT), { recursive: true });
  fs.writeFileSync(META_OUT, JSON.stringify(meta, null, 2));

  const withIsbn = out.books.filter((b) => b.isbn13).length;
  console.log(`batches read:      ${files.length}`);
  console.log(`categories:        ${out.categories.length}`);
  console.log(`unique books:      ${out.books.length} (${withIsbn} with valid ISBN-13, ${out.books.length - withIsbn} without)`);
  console.log(`category-tier links: ${out.links.length}`);
  if (problems.length) {
    console.log(`\nPROBLEMS (${problems.length}):`);
    problems.forEach((p) => console.log("  - " + p));
  }
  console.log(`\nwrote ${OUT}`);
}

main();
