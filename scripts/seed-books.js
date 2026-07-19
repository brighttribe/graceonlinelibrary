// Seeds the Supabase `books` and `book_categories` tables from
// books-compiled.json. Idempotent: upserts books by ISBN-13, rebuilds the
// category links each run. Cover files already fetched into public/book-covers.
//
//   node scripts/seed-books.js
const fs = require("fs");
const path = require("path");
const { Client } = require("pg");

const AFFILIATE_TAG = "gol016-20";
const COMPILED = path.join(__dirname, "build", "books-compiled.json");
const COVER_DIR = path.join(__dirname, "..", "public", "book-covers");

function env() {
  const raw = fs.readFileSync(path.join(__dirname, "..", ".env.local"), "utf8");
  return Object.fromEntries(
    raw.split("\n").filter((l) => l.includes("=")).map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, "")];
    })
  );
}

function isbn13to10(isbn13) {
  if (!/^97[89]\d{10}$/.test(isbn13)) return null;
  const core = isbn13.slice(3, 12);
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += (10 - i) * Number(core[i]);
  const check = (11 - (sum % 11)) % 11;
  return core + (check === 10 ? "X" : String(check));
}

function affiliateUrl(book) {
  const asin = book.isbn13 ? isbn13to10(book.isbn13) : null;
  if (asin) return { asin, url: `https://www.amazon.com/dp/${asin}?tag=${AFFILIATE_TAG}` };
  const q = encodeURIComponent(`${book.title} ${book.author}`.trim());
  return { asin: null, url: `https://www.amazon.com/s?k=${q}&tag=${AFFILIATE_TAG}` };
}

async function main() {
  const e = env();
  const ref = e.NEXT_PUBLIC_SUPABASE_URL.replace(/^https?:\/\//, "").split(".")[0];
  const { categories, books, links } = JSON.parse(fs.readFileSync(COMPILED, "utf8"));

  const c = new Client({
    host: `db.${ref}.supabase.co`,
    port: 5432,
    user: "postgres",
    password: e.SUPABASE_DB_PASSWORD,
    database: "postgres",
    ssl: { rejectUnauthorized: false },
  });
  await c.connect();

  // Allow books that have no clean ASIN (search-link fallback); unique ISBN-13.
  await c.query(`alter table books alter column asin drop not null`);
  await c.query(
    `create unique index if not exists books_isbn13_uidx on books(isbn13) where isbn13 is not null`
  );

  // Only books with a valid ISBN-13 get a stable upsert key.
  const seedable = books.filter((b) => b.isbn13);
  let inserted = 0;
  const idByIsbn = new Map();

  for (const b of seedable) {
    const { asin, url } = affiliateUrl(b);
    const coverExists = fs.existsSync(path.join(COVER_DIR, `${b.isbn13}.jpg`));
    const cover_url = coverExists ? `/book-covers/${b.isbn13}.jpg` : null;
    const topics = [...new Set(links.filter((l) => l.key === b.key).map((l) => l.category))];
    const res = await c.query(
      `insert into books (asin, isbn13, title, author, year, cover_url, amazon_url, affiliate_url, isbn_confidence, topics, verified)
       values ($1,$2,$3,$4,$5,$6,$7,$7,$8,$9,$10)
       on conflict (isbn13) where isbn13 is not null do update set
         asin=excluded.asin, title=excluded.title, author=excluded.author, year=excluded.year,
         cover_url=coalesce(excluded.cover_url, books.cover_url), amazon_url=excluded.amazon_url,
         affiliate_url=excluded.affiliate_url, isbn_confidence=excluded.isbn_confidence, topics=excluded.topics
       returning id`,
      [asin, b.isbn13, b.title, b.author || null, b.year, cover_url, url, b.isbn_confidence, topics, !!asin]
    );
    idByIsbn.set(b.isbn13, res.rows[0].id);
    inserted++;
  }

  // Rebuild category links fresh.
  await c.query(`truncate table book_categories`);
  const isbnByKey = new Map(books.map((b) => [b.key, b.isbn13]));
  let linkRows = 0;
  let skipped = 0;
  for (const l of links) {
    const isbn = isbnByKey.get(l.key);
    const bookId = isbn ? idByIsbn.get(isbn) : null;
    if (!bookId) {
      skipped++;
      continue;
    }
    await c.query(
      `insert into book_categories (book_id, category, slug, tier, why, top_pick, sort)
       values ($1,$2,$3,$4,$5,$6,$7)
       on conflict (book_id, slug) do update set
         tier=excluded.tier, why=excluded.why, top_pick=excluded.top_pick, sort=excluded.sort`,
      [bookId, l.category, l.slug, l.tier, l.why || null, l.top_pick, l.sort]
    );
    linkRows++;
  }

  const withCover = seedable.filter((b) => fs.existsSync(path.join(COVER_DIR, `${b.isbn13}.jpg`))).length;
  await c.end();

  console.log(`books upserted:   ${inserted}/${books.length} (${books.length - seedable.length} had no ISBN, skipped)`);
  console.log(`books with cover: ${withCover}/${seedable.length}`);
  console.log(`category links:   ${linkRows} inserted, ${skipped} skipped (no book id)`);
  console.log(`categories:       ${categories.length}`);
}

main().catch((e) => {
  console.error("SEED ERROR", e.message);
  process.exit(1);
});
