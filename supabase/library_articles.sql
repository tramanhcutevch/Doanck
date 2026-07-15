begin;

create table if not exists public.library_articles (
  id text primary key,
  title text not null,
  category text,
  type text check (type in ('Cây trồng', 'Sâu bệnh', 'Kỹ thuật', 'Quy trình', 'Tổng quan', 'Chính sách')),
  crop text,
  disease text,
  symptom text,
  doc_type text check (doc_type in ('Hướng dẫn', 'Nghiên cứu', 'Báo cáo', 'Tổng hợp')),
  tags jsonb not null default '[]'::jsonb,
  pdf_url text,
  accent_class text,
  read_time text,
  date_label text,
  excerpt text,
  featured boolean not null default false,
  content_html text,
  source_name text not null default 'VAAS',
  source_url text not null unique,
  image_url text,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists library_articles_category_idx on public.library_articles (category);
create index if not exists library_articles_type_idx on public.library_articles (type);
create index if not exists library_articles_published_at_idx on public.library_articles (published_at desc);

alter table public.library_articles enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'library_articles' and policyname = 'Public read library articles'
  ) then
    create policy "Public read library articles"
      on public.library_articles
      for select
      to public
      using (true);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'library_articles' and policyname = 'Admin manage library articles'
  ) then
    create policy "Admin manage library articles"
      on public.library_articles
      for all
      to authenticated
      using (
        exists (
          select 1
          from public.profiles
          where profiles.id = auth.uid()
            and profiles.role = 'admin'
            and coalesce(profiles.is_active, true) = true
        )
      )
      with check (
        exists (
          select 1
          from public.profiles
          where profiles.id = auth.uid()
            and profiles.role = 'admin'
            and coalesce(profiles.is_active, true) = true
        )
      );
  end if;
end $$;

create or replace function public.set_library_articles_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_library_articles_updated_at on public.library_articles;

create trigger trg_library_articles_updated_at
before update on public.library_articles
for each row
execute function public.set_library_articles_updated_at();

commit;
