// Compiles the author-bibliography research (per-author books) into a single
// deduped book list keyed by ISBN-13. Reads both the batch pass and the deep
// exhaustive pass (deep/*.json), so it stays correct as coverage grows.
//
//   node scripts/compile-authorbooks.js
const fs = require("fs");
const path = require("path");

const ROOT =
  process.env.AUTHORBOOKS_DIR ||
  "/private/tmp/claude-501/-Users-briandempsey/5fb1b26a-ec28-4091-b5ef-5acc2520ad37/scratchpad/gol-authorbooks";
const RESEARCH_DIR = path.join(ROOT, "research");
const DEEP_DIR = path.join(ROOT, "deep");
const OUT_DIR = path.join(__dirname, "build");
const OUT = path.join(OUT_DIR, "authorbooks-compiled.json");

function cleanIsbn(raw) {
  const d = String(raw || "").replace(/[^0-9Xx]/g, "");
  return /^\d{13}$/.test(d) ? d : null;
}

function collectFrom(dir, authorObjs, problems) {
  if (!fs.existsSync(dir)) return;
  for (const f of fs.readdirSync(dir).filter((f) => f.endsWith(".json"))) {
    let arr;
    try {
      arr = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));
    } catch (e) {
      problems.push(`${f}: parse failed (${e.message.slice(0, 50)})`);
      continue;
    }
    // deep files are a single author object; research files are arrays.
    const list = Array.isArray(arr) ? arr : [arr];
    for (const a of list) if (a && a.name) authorObjs.push(a);
  }
}

function main() {
  const authorObjs = [];
  const problems = [];
  collectFrom(RESEARCH_DIR, authorObjs, problems);
  collectFrom(DEEP_DIR, authorObjs, problems);

  const books = new Map(); // isbn13 -> {isbn13,title,author,year,isbn_confidence}
  let authorsWithBooks = 0;
  for (const a of authorObjs) {
    const list = Array.isArray(a.books) ? a.books : [];
    if (list.length) authorsWithBooks++;
    for (const b of list) {
      const isbn = cleanIsbn(b.isbn13);
      if (!isbn || !b.title) continue;
      if (!books.has(isbn)) {
        books.set(isbn, {
          isbn13: isbn,
          title: (b.title || "").trim(),
          author: (a.name || b.author || "").trim(), // canonical GOL author name
          year: Number.isFinite(b.year) ? b.year : null,
          isbn_confidence: b.isbnConfidence || null,
        });
      }
    }
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify({ books: [...books.values()] }, null, 2));

  console.log(`author records:   ${authorObjs.length} (${authorsWithBooks} with >=1 book)`);
  console.log(`unique books:     ${books.size}`);
  if (problems.length) {
    console.log(`problems: ${problems.length}`);
    problems.forEach((p) => console.log("  - " + p));
  }
  console.log(`wrote ${OUT}`);
}

main();
