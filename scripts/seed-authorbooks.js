// Seeds author-bibliography books into the `books` table, tagged with
// author_key so author pages can find them. Upserts by ISBN-13; never clears
// topics/category links on books that are already in the topic catalog.
//
//   node scripts/seed-authorbooks.js
const fs = require("fs");
const path = require("path");
const { Client } = require("pg");

const AFFILIATE_TAG = "gol016-20";
const COMPILED = path.join(__dirname, "build", "authorbooks-compiled.json");
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

// Must match authorKey() in lib/books.ts.
function authorKey(name) {
  const n = (name || "")
    .toLowerCase()
    .replace(/[.,]/g, "")
    .replace(/\b[a-z]\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
  const p = n.split(" ").filter(Boolean);
  if (!p.length) return "";
  return `${p[0]}|${p[p.length - 1]}`;
}

async function main() {
  const e = env();
  const ref = e.NEXT_PUBLIC_SUPABASE_URL.replace(/^https?:\/\//, "").split(".")[0];
  const { books } = JSON.parse(fs.readFileSync(COMPILED, "utf8"));

  const c = new Client({
    host: `db.${ref}.supabase.co`,
    port: 5432,
    user: "postgres",
    password: e.SUPABASE_DB_PASSWORD,
    database: "postgres",
    ssl: { rejectUnauthorized: false },
  });
  await c.connect();

  // ISBN-13 is our identity; ASIN is derived and may repeat across editions.
  await c.query(`alter table books drop constraint if exists books_asin_key`);

  let inserted = 0;
  let withCover = 0;
  for (const b of books) {
    const asin = isbn13to10(b.isbn13);
    const url = asin
      ? `https://www.amazon.com/dp/${asin}?tag=${AFFILIATE_TAG}`
      : `https://www.amazon.com/s?k=${encodeURIComponent(`${b.title} ${b.author}`)}&tag=${AFFILIATE_TAG}`;
    const coverExists = fs.existsSync(path.join(COVER_DIR, `${b.isbn13}.jpg`));
    if (coverExists) withCover++;
    const cover_url = coverExists ? `/book-covers/${b.isbn13}.jpg` : null;
    const key = authorKey(b.author);
    await c.query(
      `insert into books (asin, isbn13, title, author, author_key, year, cover_url, amazon_url, affiliate_url, isbn_confidence, topics, verified)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$8,$9,'{}',$10)
       on conflict (isbn13) where isbn13 is not null do update set
         author=excluded.author, author_key=excluded.author_key, year=coalesce(books.year, excluded.year),
         cover_url=coalesce(books.cover_url, excluded.cover_url),
         amazon_url=coalesce(books.amazon_url, excluded.amazon_url),
         affiliate_url=coalesce(books.affiliate_url, excluded.affiliate_url)`,
      [asin, b.isbn13, b.title, b.author, key, b.year, cover_url, url, b.isbn_confidence, !!asin]
    );
    inserted++;
  }

  const { rows } = await c.query("select count(*)::int n from books");
  await c.end();
  console.log(`author books upserted: ${inserted} (${withCover} with cover)`);
  console.log(`total books in table:  ${rows[0].n}`);
}

main().catch((e) => {
  console.error("SEED ERROR", e.message);
  process.exit(1);
});
