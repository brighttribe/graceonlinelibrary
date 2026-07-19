// Fetches cover images for every book in books-compiled.json from free sources
// and saves them to public/book-covers/{isbn13}.jpg (Next/Image optimizes at
// serve time). Priority: Amazon (best size) -> OpenLibrary -> Google Books.
//
//   node scripts/fetch-book-covers.js
const fs = require("fs");
const path = require("path");

const BUILD = path.join(__dirname, "build");
const OUT_DIR = path.join(__dirname, "..", "public", "book-covers");
const CONCURRENCY = 8;

// Merge every book we know about (topic catalog + author bibliographies),
// deduped by ISBN-13, so one pass fetches all missing covers.
function allBooks() {
  const files = ["books-compiled.json", "authorbooks-compiled.json"];
  const seen = new Map();
  for (const f of files) {
    const p = path.join(BUILD, f);
    if (!fs.existsSync(p)) continue;
    const { books } = JSON.parse(fs.readFileSync(p, "utf8"));
    for (const b of books || []) if (b.isbn13 && !seen.has(b.isbn13)) seen.set(b.isbn13, b);
  }
  return [...seen.values()];
}

function isbn13to10(isbn13) {
  if (!/^97[89]\d{10}$/.test(isbn13)) return null;
  const core = isbn13.slice(3, 12);
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += (10 - i) * Number(core[i]);
  const check = (11 - (sum % 11)) % 11;
  return core + (check === 10 ? "X" : String(check));
}

async function tryFetch(url) {
  try {
    const res = await fetch(url, { redirect: "follow" });
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 3000) return null; // reject 1x1 placeholders
    return buf;
  } catch {
    return null;
  }
}

async function fetchCover(isbn13) {
  const isbn10 = isbn13to10(isbn13);
  const candidates = [];
  if (isbn10) {
    candidates.push(
      `https://images-na.ssl-images-amazon.com/images/P/${isbn10}.01._SCLZZZZZZZ_.jpg`,
      `https://images-na.ssl-images-amazon.com/images/P/${isbn10}.jpg`
    );
  }
  candidates.push(`https://covers.openlibrary.org/b/isbn/${isbn13}-L.jpg?default=false`);
  for (const url of candidates) {
    const buf = await tryFetch(url);
    if (buf) return buf;
  }
  try {
    const res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn13}`);
    if (res.ok) {
      const data = await res.json();
      let link = data?.items?.[0]?.volumeInfo?.imageLinks?.thumbnail;
      if (link) {
        link = link.replace("http://", "https://").replace("&edge=curl", "");
        const buf = await tryFetch(link);
        if (buf) return buf;
      }
    }
  } catch {}
  return null;
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const targets = allBooks().filter((b) => b.isbn13);
  const got = [];
  const miss = [];
  let idx = 0;

  async function worker() {
    while (idx < targets.length) {
      const b = targets[idx++];
      const dest = path.join(OUT_DIR, `${b.isbn13}.jpg`);
      if (fs.existsSync(dest)) {
        got.push(b.isbn13);
        continue;
      }
      const buf = await fetchCover(b.isbn13);
      if (buf) {
        fs.writeFileSync(dest, buf);
        got.push(b.isbn13);
      } else {
        miss.push({ isbn13: b.isbn13, title: b.title });
      }
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  console.log(`covers: ${got.length}/${targets.length} have images`);
  console.log(`missing: ${miss.length}`);
  if (miss.length) {
    fs.writeFileSync(path.join(__dirname, "build", "covers-missing.json"), JSON.stringify(miss, null, 2));
    miss.slice(0, 40).forEach((m) => console.log("  - " + m.isbn13 + "  " + m.title));
    if (miss.length > 40) console.log(`  ... and ${miss.length - 40} more (see build/covers-missing.json)`);
  }
}

main();
