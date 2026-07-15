create extension if not exists "pgcrypto";

create table if not exists public.growth_cycles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  crop_name text not null,
  start_date date not null,
  duration integer not null check (duration > 0),
  current_stage text not null check (current_stage in ('Gieo trồng', 'Sinh trưởng', 'Ra hoa', 'Thu hoạch')),
  status text not null default 'active' check (status in ('active', 'harvested', 'failed')),
  notes text,
  progress integer not null default 0 check (progress >= 0 and progress <= 100),
  last_update timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.growth_tasks (
  id uuid primary key default gen_random_uuid(),
  cycle_id uuid not null references public.growth_cycles (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  due_date date not null,
  completed boolean not null default false,
  type text not null check (type in ('water', 'fertilize', 'check', 'other')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.growth_photos (
  id uuid primary key default gen_random_uuid(),
  cycle_id uuid not null references public.growth_cycles (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  url text not null,
  date date not null,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists growth_cycles_user_id_idx on public.growth_cycles (user_id, last_update desc);
create index if not exists growth_tasks_cycle_id_idx on public.growth_tasks (cycle_id, due_date asc);
create index if not exists growth_photos_cycle_id_idx on public.growth_photos (cycle_id, date desc);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists touch_growth_cycles_updated_at on public.growth_cycles;
create trigger touch_growth_cycles_updated_at
before update on public.growth_cycles
for each row
execute function public.touch_updated_at();

drop trigger if exists touch_growth_tasks_updated_at on public.growth_tasks;
create trigger touch_growth_tasks_updated_at
before update on public.growth_tasks
for each row
execute function public.touch_updated_at();

drop trigger if exists touch_growth_photos_updated_at on public.growth_photos;
create trigger touch_growth_photos_updated_at
before update on public.growth_photos
for each row
execute function public.touch_updated_at();

alter table public.growth_cycles enable row level security;
alter table public.growth_tasks enable row level security;
alter table public.growth_photos enable row level security;

drop policy if exists "Users or admins can read growth cycles" on public.growth_cycles;
create policy "Users or admins can read growth cycles"
on public.growth_cycles
for select
to authenticated
using (auth.uid() = user_id or public.is_admin());

drop policy if exists "Users can create own growth cycles" on public.growth_cycles;
create policy "Users can create own growth cycles"
on public.growth_cycles
for insert
to authenticated
with check (auth.uid() = user_id or public.is_admin());

drop policy if exists "Users or admins can update growth cycles" on public.growth_cycles;
create policy "Users or admins can update growth cycles"
on public.growth_cycles
for update
to authenticated
using (auth.uid() = user_id or public.is_admin())
with check (auth.uid() = user_id or public.is_admin());

drop policy if exists "Users or admins can delete growth cycles" on public.growth_cycles;
create policy "Users or admins can delete growth cycles"
on public.growth_cycles
for delete
to authenticated
using (auth.uid() = user_id or public.is_admin());

drop policy if exists "Users or admins can read growth tasks" on public.growth_tasks;
create policy "Users or admins can read growth tasks"
on public.growth_tasks
for select
to authenticated
using (auth.uid() = user_id or public.is_admin());

drop policy if exists "Users can create own growth tasks" on public.growth_tasks;
create policy "Users can create own growth tasks"
on public.growth_tasks
for insert
to authenticated
with check (auth.uid() = user_id or public.is_admin());

drop policy if exists "Users or admins can update growth tasks" on public.growth_tasks;
create policy "Users or admins can update growth tasks"
on public.growth_tasks
for update
to authenticated
using (auth.uid() = user_id or public.is_admin())
with check (auth.uid() = user_id or public.is_admin());

drop policy if exists "Users or admins can delete growth tasks" on public.growth_tasks;
create policy "Users or admins can delete growth tasks"
on public.growth_tasks
for delete
to authenticated
using (auth.uid() = user_id or public.is_admin());

drop policy if exists "Users or admins can read growth photos" on public.growth_photos;
create policy "Users or admins can read growth photos"
on public.growth_photos
for select
to authenticated
using (auth.uid() = user_id or public.is_admin());

drop policy if exists "Users can create own growth photos" on public.growth_photos;
create policy "Users can create own growth photos"
on public.growth_photos
for insert
to authenticated
with check (auth.uid() = user_id or public.is_admin());

drop policy if exists "Users or admins can update growth photos" on public.growth_photos;
create policy "Users or admins can update growth photos"
on public.growth_photos
for update
to authenticated
using (auth.uid() = user_id or public.is_admin())
with check (auth.uid() = user_id or public.is_admin());

drop policy if exists "Users or admins can delete growth photos" on public.growth_photos;
create policy "Users or admins can delete growth photos"
on public.growth_photos
for delete
to authenticated
using (auth.uid() = user_id or public.is_admin());
