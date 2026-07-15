create extension if not exists "pgcrypto";

create table if not exists public.community_posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles (id) on delete cascade,
  author_name text not null,
  title text not null check (char_length(trim(title)) between 8 and 180),
  body text not null check (char_length(trim(body)) between 20 and 5000),
  category text not null check (category in ('Kỹ thuật', 'Sâu bệnh', 'Thị trường', 'Kinh nghiệm', 'Hỏi đáp', 'Thảo luận')),
  tags text[] not null default '{}'::text[],
  vote_score integer not null default 0,
  upvote_count integer not null default 0,
  downvote_count integer not null default 0,
  comment_count integer not null default 0,
  is_pinned boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.community_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.community_posts (id) on delete cascade,
  parent_comment_id uuid references public.community_comments (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  author_name text not null,
  body text not null check (char_length(trim(body)) between 2 and 1500),
  created_at timestamptz not null default now()
);

alter table public.community_comments
add column if not exists parent_comment_id uuid references public.community_comments (id) on delete cascade;

create table if not exists public.community_votes (
  post_id uuid not null references public.community_posts (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  value smallint not null check (value in (-1, 1)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create table if not exists public.community_reports (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.community_posts (id) on delete cascade,
  post_title text not null,
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  reporter_name text not null,
  reason text not null check (char_length(trim(reason)) between 4 and 160),
  details text,
  status text not null default 'open' check (status in ('open', 'reviewing', 'resolved', 'dismissed')),
  reviewed_at timestamptz,
  reviewed_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.community_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  type text not null check (type in ('comment', 'report_status', 'post_removed')),
  title text not null,
  message text not null,
  post_id uuid references public.community_posts (id) on delete set null,
  comment_id uuid references public.community_comments (id) on delete set null,
  is_read boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

drop trigger if exists set_community_posts_updated_at on public.community_posts;
create trigger set_community_posts_updated_at
before update on public.community_posts
for each row
execute function public.set_updated_at();

drop trigger if exists set_community_votes_updated_at on public.community_votes;
create trigger set_community_votes_updated_at
before update on public.community_votes
for each row
execute function public.set_updated_at();

create or replace function public.sync_community_post_vote_totals(target_post_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.community_posts
  set
    upvote_count = (
      select count(*)::int
      from public.community_votes
      where post_id = target_post_id
        and value = 1
    ),
    downvote_count = (
      select count(*)::int
      from public.community_votes
      where post_id = target_post_id
        and value = -1
    ),
    vote_score = (
      select coalesce(sum(value), 0)::int
      from public.community_votes
      where post_id = target_post_id
    )
  where id = target_post_id;
end;
$$;

create or replace function public.sync_community_post_comment_total(target_post_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.community_posts
  set comment_count = (
    select count(*)::int
    from public.community_comments
    where post_id = target_post_id
  )
  where id = target_post_id;
end;
$$;

create or replace function public.create_community_notification(
  target_user_id uuid,
  notification_type text,
  notification_title text,
  notification_message text,
  target_post_id uuid default null,
  target_comment_id uuid default null,
  notification_metadata jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if target_user_id is null then
    return;
  end if;

  insert into public.community_notifications (
    user_id,
    type,
    title,
    message,
    post_id,
    comment_id,
    metadata
  )
  values (
    target_user_id,
    notification_type,
    notification_title,
    notification_message,
    target_post_id,
    target_comment_id,
    coalesce(notification_metadata, '{}'::jsonb)
  );
end;
$$;

create or replace function public.handle_community_vote_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.sync_community_post_vote_totals(coalesce(new.post_id, old.post_id));
  return coalesce(new, old);
end;
$$;

create or replace function public.handle_community_comment_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  post_owner_id uuid;
  parent_comment_owner_id uuid;
  comment_preview text;
begin
  perform public.sync_community_post_comment_total(coalesce(new.post_id, old.post_id));

  if tg_op = 'INSERT' then
    select author_id into post_owner_id
    from public.community_posts
    where id = new.post_id;

    comment_preview := left(new.body, 140);

    if post_owner_id is not null and post_owner_id <> new.author_id then
      perform public.create_community_notification(
        post_owner_id,
        'comment',
        'Bai viet cua ban co binh luan moi',
        new.author_name || ' vua binh luan: ' || comment_preview,
        new.post_id,
        new.id,
        jsonb_build_object('author_name', new.author_name)
      );
    end if;

    if new.parent_comment_id is not null then
      select author_id into parent_comment_owner_id
      from public.community_comments
      where id = new.parent_comment_id;

      if parent_comment_owner_id is not null
         and parent_comment_owner_id <> new.author_id
         and parent_comment_owner_id <> post_owner_id then
        perform public.create_community_notification(
          parent_comment_owner_id,
          'comment',
          'Co nguoi tra loi binh luan cua ban',
          new.author_name || ' da tra loi: ' || comment_preview,
          new.post_id,
          new.id,
          jsonb_build_object('author_name', new.author_name, 'parent_comment_id', new.parent_comment_id)
        );
      end if;
    end if;
  end if;

  return coalesce(new, old);
end;
$$;

create or replace function public.handle_community_report_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'UPDATE' and old.status is distinct from new.status then
    perform public.create_community_notification(
      new.reporter_id,
      'report_status',
      'Bao cao cua ban da duoc xu ly',
      'Trang thai moi: ' || new.status || ' cho bai viet "' || new.post_title || '"',
      new.post_id,
      null,
      jsonb_build_object('report_id', new.id, 'status', new.status)
    );
  end if;

  return new;
end;
$$;

create or replace function public.handle_admin_deleted_post_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null and auth.uid() <> old.author_id and public.is_admin(auth.uid()) then
    perform public.create_community_notification(
      old.author_id,
      'post_removed',
      'Bai viet cua ban da bi go',
      'Admin da xoa bai viet "' || old.title || '" do can kiem duyet.',
      old.id,
      null,
      jsonb_build_object('deleted_by', auth.uid())
    );
  end if;

  return old;
end;
$$;

drop trigger if exists sync_vote_totals_after_insert on public.community_votes;
create trigger sync_vote_totals_after_insert
after insert on public.community_votes
for each row
execute function public.handle_community_vote_change();

drop trigger if exists sync_vote_totals_after_update on public.community_votes;
create trigger sync_vote_totals_after_update
after update on public.community_votes
for each row
execute function public.handle_community_vote_change();

drop trigger if exists sync_vote_totals_after_delete on public.community_votes;
create trigger sync_vote_totals_after_delete
after delete on public.community_votes
for each row
execute function public.handle_community_vote_change();

drop trigger if exists sync_comment_total_after_insert on public.community_comments;
create trigger sync_comment_total_after_insert
after insert on public.community_comments
for each row
execute function public.handle_community_comment_change();

drop trigger if exists sync_comment_total_after_delete on public.community_comments;
create trigger sync_comment_total_after_delete
after delete on public.community_comments
for each row
execute function public.handle_community_comment_change();

drop trigger if exists community_report_status_notification on public.community_reports;
create trigger community_report_status_notification
after update on public.community_reports
for each row
execute function public.handle_community_report_status_change();

drop trigger if exists community_admin_deleted_post_notification on public.community_posts;
create trigger community_admin_deleted_post_notification
before delete on public.community_posts
for each row
execute function public.handle_admin_deleted_post_notification();

alter table public.community_posts enable row level security;
alter table public.community_comments enable row level security;
alter table public.community_votes enable row level security;
alter table public.community_reports enable row level security;
alter table public.community_notifications enable row level security;

drop policy if exists "Community posts are readable by everyone" on public.community_posts;
create policy "Community posts are readable by everyone"
on public.community_posts
for select
using (true);

drop policy if exists "Authenticated users can create posts" on public.community_posts;
create policy "Authenticated users can create posts"
on public.community_posts
for insert
to authenticated
with check (
  auth.uid() = author_id
  and exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and is_active = true
  )
);

drop policy if exists "Authors or admins can update posts" on public.community_posts;
create policy "Authors or admins can update posts"
on public.community_posts
for update
to authenticated
using (
  auth.uid() = author_id
  or public.is_admin()
)
with check (
  auth.uid() = author_id
  or public.is_admin()
);

drop policy if exists "Authors or admins can delete posts" on public.community_posts;
create policy "Authors or admins can delete posts"
on public.community_posts
for delete
to authenticated
using (
  auth.uid() = author_id
  or public.is_admin()
);

drop policy if exists "Community comments are readable by everyone" on public.community_comments;
create policy "Community comments are readable by everyone"
on public.community_comments
for select
using (true);

drop policy if exists "Authenticated users can create comments" on public.community_comments;
create policy "Authenticated users can create comments"
on public.community_comments
for insert
to authenticated
with check (
  auth.uid() = author_id
  and exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and is_active = true
  )
);

drop policy if exists "Authors or admins can delete comments" on public.community_comments;
create policy "Authors or admins can delete comments"
on public.community_comments
for delete
to authenticated
using (
  auth.uid() = author_id
  or public.is_admin()
);

drop policy if exists "Users can read own votes" on public.community_votes;
create policy "Users can read own votes"
on public.community_votes
for select
to authenticated
using (
  auth.uid() = user_id
  or public.is_admin()
);

drop policy if exists "Users can manage own votes" on public.community_votes;
create policy "Users can manage own votes"
on public.community_votes
for all
to authenticated
using (
  auth.uid() = user_id
  or public.is_admin()
)
with check (
  auth.uid() = user_id
  or public.is_admin()
);

drop policy if exists "Users can create reports" on public.community_reports;
create policy "Users can create reports"
on public.community_reports
for insert
to authenticated
with check (
  auth.uid() = reporter_id
  and exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and is_active = true
  )
);

drop policy if exists "Admins can review reports" on public.community_reports;
create policy "Admins can review reports"
on public.community_reports
for select
to authenticated
using (public.is_admin());

drop policy if exists "Admins can update reports" on public.community_reports;
create policy "Admins can update reports"
on public.community_reports
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Users can read own reports" on public.community_reports;
create policy "Users can read own reports"
on public.community_reports
for select
to authenticated
using (
  auth.uid() = reporter_id
  or public.is_admin()
);

drop policy if exists "Users can read own notifications" on public.community_notifications;
create policy "Users can read own notifications"
on public.community_notifications
for select
to authenticated
using (
  auth.uid() = user_id
  or public.is_admin()
);

drop policy if exists "Users can update own notifications" on public.community_notifications;
create policy "Users can update own notifications"
on public.community_notifications
for update
to authenticated
using (
  auth.uid() = user_id
  or public.is_admin()
)
with check (
  auth.uid() = user_id
  or public.is_admin()
);

create index if not exists community_posts_created_at_idx on public.community_posts (created_at desc);
create index if not exists community_posts_score_idx on public.community_posts (vote_score desc, created_at desc);
create index if not exists community_posts_category_idx on public.community_posts (category);
create index if not exists community_comments_post_id_idx on public.community_comments (post_id, created_at asc);
create index if not exists community_comments_parent_comment_id_idx on public.community_comments (parent_comment_id, created_at asc);
create index if not exists community_votes_user_id_idx on public.community_votes (user_id);
create index if not exists community_reports_status_idx on public.community_reports (status, created_at desc);
create index if not exists community_notifications_user_idx on public.community_notifications (user_id, is_read, created_at desc);

update public.community_posts p
set
  upvote_count = coalesce(v.upvotes, 0),
  downvote_count = coalesce(v.downvotes, 0),
  vote_score = coalesce(v.score, 0),
  comment_count = coalesce(c.comment_total, 0)
from (
  select
    post_id,
    count(*) filter (where value = 1)::int as upvotes,
    count(*) filter (where value = -1)::int as downvotes,
    coalesce(sum(value), 0)::int as score
  from public.community_votes
  group by post_id
) v
full join (
  select
    post_id,
    count(*)::int as comment_total
  from public.community_comments
  group by post_id
) c on c.post_id = v.post_id
where p.id = coalesce(v.post_id, c.post_id);

update public.community_posts
set
  upvote_count = 0,
  downvote_count = 0,
  vote_score = 0,
  comment_count = 0
where id not in (
  select post_id from public.community_votes
  union
  select post_id from public.community_comments
);

comment on table public.community_posts is 'Bang bai viet cong dong kieu Reddit.';
comment on table public.community_comments is 'Binh luan cho bai viet cong dong.';
comment on table public.community_votes is 'Upvote/downvote cho bai viet cong dong.';
comment on table public.community_reports is 'Bao cao bai viet trong cong dong cho admin xu ly.';
comment on table public.community_notifications is 'Thong bao cho nguoi dung khi bai viet co tuong tac hoac report duoc xu ly.';
