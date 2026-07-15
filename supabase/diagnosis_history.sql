create extension if not exists "pgcrypto";

create table if not exists public.diagnoses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  disease_name text not null,
  crop_name text not null,
  confidence integer not null default 0 check (confidence between 0 and 100),
  severity text not null default 'Trung bình',
  treatment text[] not null default '{}'::text[],
  recommendation text not null default '',
  symptoms text[] not null default '{}'::text[],
  pesticide_type text,
  pathogen text,
  risk_level integer check (risk_level between 1 and 5),
  spread_speed text,
  prevention text[],
  treatment_checklist text[],
  raw_label text,
  top_predictions jsonb,
  confidence_breakdown jsonb,
  provider text,
  model text,
  image_url text not null,
  created_at timestamptz not null default now()
);

alter table public.diagnoses enable row level security;

drop policy if exists "Users can read own diagnoses" on public.diagnoses;
create policy "Users can read own diagnoses"
on public.diagnoses
for select
to authenticated
using (
  auth.uid() = user_id
  or public.is_admin()
);

drop policy if exists "Users can create own diagnoses" on public.diagnoses;
create policy "Users can create own diagnoses"
on public.diagnoses
for insert
to authenticated
with check (
  auth.uid() = user_id
  and exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and is_active = true
  )
);

create index if not exists diagnoses_user_created_at_idx on public.diagnoses (user_id, created_at desc);
create index if not exists diagnoses_created_at_idx on public.diagnoses (created_at desc);

comment on table public.diagnoses is 'Luu ket qua chan doan AI cho nguoi dung.';
