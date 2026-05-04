-- Articles
create table if not exists articles (
  id               uuid primary key default gen_random_uuid(),
  wp_id            integer unique,
  title            text not null,
  slug             text unique not null,
  content          text,
  excerpt          text,
  category         text,
  tags             text[] default '{}',
  author           text,
  published_at     timestamptz,
  updated_at       timestamptz default now(),
  meta_title       text,
  meta_description text,
  status           text default 'published',
  featured         boolean default false
);

create index if not exists articles_slug_idx on articles(slug);
create index if not exists articles_category_idx on articles(category);
create index if not exists articles_status_idx on articles(status);

-- Books
create table if not exists books (
  id           uuid primary key default gen_random_uuid(),
  asin         text unique not null,
  title        text not null,
  author       text,
  publisher    text,
  cover_url    text,
  amazon_url   text,
  affiliate_url text,
  verified     boolean default false,
  verified_at  timestamptz,
  topics       text[] default '{}'
);

-- Article <-> Book junction
create table if not exists article_books (
  article_id     uuid references articles(id) on delete cascade,
  book_id        uuid references books(id) on delete cascade,
  display_order  integer default 0,
  ai_suggested   boolean default false,
  manually_added boolean default false,
  primary key (article_id, book_id)
);
