-- Authors table
create table if not exists authors (
  id           uuid primary key default gen_random_uuid(),
  name         text unique not null,
  slug         text unique not null,
  bio          text,
  article_count integer default 0
);

create index if not exists authors_slug_idx on authors(slug);

-- Article <-> Author junction (supports co-authors)
create table if not exists article_authors (
  article_id   uuid references articles(id) on delete cascade,
  author_id    uuid references authors(id) on delete cascade,
  display_order integer default 0,
  primary key (article_id, author_id)
);

create index if not exists article_authors_author_idx on article_authors(author_id);
create index if not exists article_authors_article_idx on article_authors(article_id);
