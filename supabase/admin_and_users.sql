create extension if not exists "pgcrypto";

do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'app_role'
      and n.nspname = 'public'
  ) then
    create type public.app_role as enum ('user', 'admin');
  end if;
end $$;

create table if not exists public.profiles (
  id uuid primary key,
  email text unique,
  full_name text,
  role public.app_role not null default 'user',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;

create trigger set_profiles_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

create or replace function public.is_admin(check_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = check_user_id
      and role = 'admin'
      and is_active = true
  );
$$;

alter table public.profiles enable row level security;

drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile"
on public.profiles
for select
to authenticated
using (
  auth.uid() = id
  or public.is_admin()
);

drop policy if exists "Users can create own profile" on public.profiles;
create policy "Users can create own profile"
on public.profiles
for insert
to authenticated
with check (
  auth.uid() = id
  and role = 'user'
);

drop policy if exists "Users can update own profile or admin can manage" on public.profiles;
create policy "Users can update own profile or admin can manage"
on public.profiles
for update
to authenticated
using (
  auth.uid() = id
  or public.is_admin()
)
with check (
  (
    auth.uid() = id
    and role = 'user'
  )
  or public.is_admin()
);

drop policy if exists "Only admins can delete profiles" on public.profiles;
create policy "Only admins can delete profiles"
on public.profiles
for delete
to authenticated
using (public.is_admin());

create table if not exists public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles (id) on delete set null,
  action text not null,
  target_table text,
  target_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.admin_audit_logs enable row level security;

drop policy if exists "Admins can read audit logs" on public.admin_audit_logs;
create policy "Admins can read audit logs"
on public.admin_audit_logs
for select
to authenticated
using (public.is_admin());

drop policy if exists "Admins can insert audit logs" on public.admin_audit_logs;
create policy "Admins can insert audit logs"
on public.admin_audit_logs
for insert
to authenticated
with check (public.is_admin());

create or replace view public.admin_user_overview as
select
  p.id,
  p.email,
  p.full_name,
  p.role,
  p.is_active,
  p.created_at,
  p.updated_at
from public.profiles p;

comment on table public.profiles is 'Thong tin nguoi dung va vai tro cho app.';
comment on table public.admin_audit_logs is 'Nhat ky thao tac cho khu vuc admin.';
comment on view public.admin_user_overview is 'View danh sach nguoi dung cho trang admin.';

-- Lenh cap quyen admin thu cong:
-- update public.profiles
-- set role = 'admin'
-- where email = 'admin@example.com';
