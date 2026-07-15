begin;

create table if not exists public.pesticide_library (
  id text primary key,
  name text not null,
  image_url text not null default '',
  trade_name text not null default '',
  active_ingredient text not null default '',
  type text not null default 'other' check (type in ('insecticide', 'fungicide', 'herbicide', 'biological', 'chemical', 'other')),
  category text not null default 'Thuốc BVTV',
  manufacturer text not null default '',
  description text not null default '',
  formulation text not null default '',
  dosage text not null default '',
  usage_instructions text not null default '',
  withdrawal_period text not null default '',
  phi_days int,
  safety_warnings text not null default '',
  target_crops text[] not null default '{}'::text[],
  target_diseases text[] not null default '{}'::text[],
  tags text[] not null default '{}'::text[],
  toxicity_level text check (toxicity_level in ('low', 'medium', 'high')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.pesticide_library
add column if not exists image_url text not null default '';

create index if not exists pesticide_library_category_idx on public.pesticide_library (category);
create index if not exists pesticide_library_type_idx on public.pesticide_library (type);
create index if not exists pesticide_library_updated_at_idx on public.pesticide_library (updated_at desc);

alter table public.pesticide_library enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'pesticide_library' and policyname = 'Public read pesticide library'
  ) then
    create policy "Public read pesticide library"
      on public.pesticide_library
      for select
      to public
      using (true);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'pesticide_library' and policyname = 'Admin manage pesticide library'
  ) then
    create policy "Admin manage pesticide library"
      on public.pesticide_library
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

create or replace function public.set_pesticide_library_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_pesticide_library_updated_at on public.pesticide_library;

create trigger trg_pesticide_library_updated_at
before update on public.pesticide_library
for each row
execute function public.set_pesticide_library_updated_at();

insert into storage.buckets (id, name, public)
values ('pesticide-images', 'pesticide-images', true)
on conflict (id) do nothing;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects' and policyname = 'Public read pesticide images'
  ) then
    create policy "Public read pesticide images"
      on storage.objects
      for select
      to public
      using (bucket_id = 'pesticide-images');
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects' and policyname = 'Admin upload pesticide images'
  ) then
    create policy "Admin upload pesticide images"
      on storage.objects
      for insert
      to authenticated
      with check (
        bucket_id = 'pesticide-images'
        and exists (
          select 1
          from public.profiles
          where profiles.id = auth.uid()
            and profiles.role = 'admin'
            and coalesce(profiles.is_active, true) = true
        )
      );
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects' and policyname = 'Admin update pesticide images'
  ) then
    create policy "Admin update pesticide images"
      on storage.objects
      for update
      to authenticated
      using (
        bucket_id = 'pesticide-images'
        and exists (
          select 1
          from public.profiles
          where profiles.id = auth.uid()
            and profiles.role = 'admin'
            and coalesce(profiles.is_active, true) = true
        )
      )
      with check (
        bucket_id = 'pesticide-images'
        and exists (
          select 1
          from public.profiles
          where profiles.id = auth.uid()
            and profiles.role = 'admin'
            and coalesce(profiles.is_active, true) = true
        )
      );
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects' and policyname = 'Admin delete pesticide images'
  ) then
    create policy "Admin delete pesticide images"
      on storage.objects
      for delete
      to authenticated
      using (
        bucket_id = 'pesticide-images'
        and exists (
          select 1
          from public.profiles
          where profiles.id = auth.uid()
            and profiles.role = 'admin'
            and coalesce(profiles.is_active, true) = true
        )
      );
  end if;
end $$;

insert into public.pesticide_library (
  id,
  name,
  image_url,
  trade_name,
  active_ingredient,
  type,
  category,
  manufacturer,
  description,
  formulation,
  dosage,
  usage_instructions,
  withdrawal_period,
  phi_days,
  safety_warnings,
  target_crops,
  target_diseases,
  tags,
  toxicity_level
)
values
  (
    'pesticide-ridomil-gold',
    'Ridomil Gold',
    'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&w=1200&q=80',
    'Ridomil Gold 68WG',
    'Metalaxyl-M + Mancozeb',
    'fungicide',
    'Thuốc trừ nấm',
    'Syngenta',
    'Phòng trừ nấm bệnh và giả nấm trên rau màu, cây ăn trái, lúa.',
    'WG',
    '20-25g/bình 16L',
    'Phun khi bệnh chớm xuất hiện, lặp lại sau 5-7 ngày nếu áp lực bệnh cao.',
    '7 ngày',
    7,
    'Mang đầy đủ bảo hộ, không pha gần nguồn nước sinh hoạt.',
    array['Lúa', 'Cà chua', 'Dưa leo', 'Ớt'],
    array['Sương mai', 'Thối rễ', 'Thối gốc', 'Đạo ôn'],
    array['nội hấp', 'trừ nấm', 'rau màu'],
    'medium'
  ),
  (
    'pesticide-confidor',
    'Confidor',
    'https://images.unsplash.com/photo-1589923188900-85dae523342b?auto=format&fit=crop&w=1200&q=80',
    'Confidor 100SL',
    'Imidacloprid',
    'insecticide',
    'Thuốc trừ sâu',
    'Bayer',
    'Kiểm soát rầy, rệp, bọ trĩ và côn trùng chích hút.',
    'SL',
    '8-12ml/bình 16L',
    'Phun khi mật độ sâu vượt ngưỡng, luân phiên hoạt chất để tránh kháng thuốc.',
    '14 ngày',
    14,
    'Không phun lúc ong hoạt động mạnh, tránh hít hơi thuốc.',
    array['Lúa', 'Ớt', 'Cam', 'Xoài'],
    array['Rầy nâu', 'Rệp sáp', 'Bọ trĩ', 'Rệp mềm'],
    array['chích hút', 'lưu dẫn', 'trừ sâu'],
    'medium'
  ),
  (
    'pesticide-kocide',
    'Kocide',
    'https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=1200&q=80',
    'Kocide 53.8DF',
    'Copper Hydroxide',
    'chemical',
    'Thuốc hóa học',
    'Corteva',
    'Phòng trừ bệnh vi khuẩn và nấm trên cây ăn trái, rau, cây công nghiệp.',
    'DF',
    '20-30g/bình 16L',
    'Phun phòng hoặc phun sớm khi bệnh mới chớm, không pha chung với thuốc có tính kiềm mạnh.',
    '7 ngày',
    7,
    'Mang khẩu trang và găng tay, không đổ tồn dư xuống ao hồ.',
    array['Cà chua', 'Cam', 'Quýt', 'Sầu riêng'],
    array['Loét vi khuẩn', 'Thán thư', 'Đốm lá', 'Xì mủ'],
    array['gốc đồng', 'vi khuẩn', 'phòng bệnh'],
    'low'
  ),
  (
    'pesticide-bio-bacillus',
    'Bio Bacillus',
    'https://images.unsplash.com/photo-1523741543316-beb7fc7023d8?auto=format&fit=crop&w=1200&q=80',
    'Bio Bacillus WP',
    'Bacillus subtilis',
    'biological',
    'Thuốc sinh học',
    'BioAgri',
    'Hỗ trợ ức chế nấm bệnh, phù hợp canh tác an toàn và hữu cơ.',
    'WP',
    '30g/bình 16L',
    'Phun định kỳ 5-7 ngày/lần, hiệu quả tốt khi dùng sớm.',
    '3 ngày',
    3,
    'Bảo quản nơi khô ráo, tránh nắng nóng trực tiếp.',
    array['Dưa leo', 'Xà lách', 'Cà chua', 'Dâu tây'],
    array['Phấn trắng', 'Sương mai', 'Đốm lá', 'Thối nhũn'],
    array['sinh học', 'an toàn', 'hữu cơ'],
    'low'
  )
on conflict (id) do update
set
  name = excluded.name,
  image_url = excluded.image_url,
  trade_name = excluded.trade_name,
  active_ingredient = excluded.active_ingredient,
  type = excluded.type,
  category = excluded.category,
  manufacturer = excluded.manufacturer,
  description = excluded.description,
  formulation = excluded.formulation,
  dosage = excluded.dosage,
  usage_instructions = excluded.usage_instructions,
  withdrawal_period = excluded.withdrawal_period,
  phi_days = excluded.phi_days,
  safety_warnings = excluded.safety_warnings,
  target_crops = excluded.target_crops,
  target_diseases = excluded.target_diseases,
  tags = excluded.tags,
  toxicity_level = excluded.toxicity_level,
  updated_at = now();

commit;
