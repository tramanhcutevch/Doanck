begin;

create table if not exists public.shop_products (
  id text primary key,
  slug text not null unique,
  name text not null,
  category text not null,
  price numeric(12,2) not null default 0,
  original_price numeric(12,2),
  stock int not null default 0,
  sku text not null unique,
  manufacturer text not null default '',
  origin text not null default '',
  short_description text not null default '',
  description text not null default '',
  image text not null default '',
  images jsonb not null default '[]'::jsonb,
  tags jsonb not null default '[]'::jsonb,
  badge text,
  rating numeric(3,2) not null default 0,
  review_count int not null default 0,
  sales_count int not null default 0,
  featured boolean not null default false,
  best_seller boolean not null default false,
  shipping_class text not null default '',
  benefits jsonb not null default '[]'::jsonb,
  specs jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists shop_products_category_idx on public.shop_products (category);
create index if not exists shop_products_best_seller_idx on public.shop_products (best_seller);
create index if not exists shop_products_featured_idx on public.shop_products (featured);

create table if not exists public.shop_orders (
  id text primary key,
  code text not null unique,
  user_id uuid references auth.users(id) on delete set null,
  customer_name text not null,
  customer_email text not null,
  customer_phone text not null,
  shipping_address text not null,
  note text,
  items jsonb not null default '[]'::jsonb,
  subtotal numeric(12,2) not null default 0,
  shipping_fee numeric(12,2) not null default 0,
  discount numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  payment_method text not null check (payment_method in ('cod', 'bank_transfer', 'momo', 'card', 'vnpay')),
  payment_status text not null check (payment_status in ('pending', 'paid', 'failed', 'refunded')),
  status text not null check (status in ('pending', 'confirmed', 'shipping', 'delivered', 'cancelled')),
  created_at timestamptz not null default now()
);

create table if not exists public.shop_carts (
  user_id uuid primary key references auth.users(id) on delete cascade,
  items jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.shop_orders
  drop constraint if exists shop_orders_payment_method_check;

alter table public.shop_orders
  add constraint shop_orders_payment_method_check
  check (payment_method in ('cod', 'bank_transfer', 'momo', 'card', 'vnpay'));

create index if not exists shop_orders_user_id_idx on public.shop_orders (user_id);
create index if not exists shop_orders_status_idx on public.shop_orders (status);
create index if not exists shop_orders_created_at_idx on public.shop_orders (created_at desc);
create index if not exists shop_carts_updated_at_idx on public.shop_carts (updated_at desc);

alter table public.shop_products enable row level security;
alter table public.shop_orders enable row level security;
alter table public.shop_carts enable row level security;

drop policy if exists "Public read shop products" on public.shop_products;
create policy "Public read shop products"
  on public.shop_products
  for select
  to public
  using (true);

drop policy if exists "Admin manage shop products" on public.shop_products;
create policy "Admin manage shop products"
  on public.shop_products
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Users create shop orders" on public.shop_orders;
drop policy if exists "Public create shop orders" on public.shop_orders;
create policy "Public create shop orders"
  on public.shop_orders
  for insert
  to public
  with check (
    (auth.uid() is null and user_id is null)
    or user_id = auth.uid()
    or public.is_admin()
  );

drop policy if exists "Users read own shop orders" on public.shop_orders;
create policy "Users read own shop orders"
  on public.shop_orders
  for select
  to authenticated
  using (
    user_id = auth.uid()
    or public.is_admin()
  );

drop policy if exists "Admin manage shop orders" on public.shop_orders;
create policy "Admin manage shop orders"
  on public.shop_orders
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Users read own shop cart" on public.shop_carts;
create policy "Users read own shop cart"
  on public.shop_carts
  for select
  to authenticated
  using (
    user_id = auth.uid()
    or public.is_admin()
  );

drop policy if exists "Users upsert own shop cart" on public.shop_carts;
create policy "Users upsert own shop cart"
  on public.shop_carts
  for insert
  to authenticated
  with check (
    user_id = auth.uid()
    or public.is_admin()
  );

drop policy if exists "Users update own shop cart" on public.shop_carts;
create policy "Users update own shop cart"
  on public.shop_carts
  for update
  to authenticated
  using (
    user_id = auth.uid()
    or public.is_admin()
  )
  with check (
    user_id = auth.uid()
    or public.is_admin()
  );

drop policy if exists "Users delete own shop cart" on public.shop_carts;
create policy "Users delete own shop cart"
  on public.shop_carts
  for delete
  to authenticated
  using (
    user_id = auth.uid()
    or public.is_admin()
  );

create or replace function public.set_shop_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_shop_products_updated_at on public.shop_products;

create trigger trg_shop_products_updated_at
before update on public.shop_products
for each row
execute function public.set_shop_updated_at();

drop trigger if exists trg_shop_carts_updated_at on public.shop_carts;

create trigger trg_shop_carts_updated_at
before update on public.shop_carts
for each row
execute function public.set_shop_updated_at();

insert into public.shop_products (
  id,
  slug,
  name,
  category,
  price,
  original_price,
  stock,
  sku,
  manufacturer,
  origin,
  short_description,
  description,
  image,
  images,
  tags,
  badge,
  rating,
  review_count,
  sales_count,
  featured,
  best_seller,
  shipping_class,
  benefits,
  specs
)
values
  (
    'shop-1',
    'giong-ca-chua-bi-f1',
    'Cây Giống Cà Chua Bi F1',
    'Cây giống',
    259000,
    319000,
    46,
    'TF-SEED-001',
    'Terraform Nursery',
    'Việt Nam',
    'Khay cây giống khỏe, đồng đều, dễ hồi phục sau trồng cho mô hình nhà màng và sân vườn.',
    'Lô cây giống cà chua bi F1 được tuyển chọn đồng đều, thân mập, lá dày và phù hợp xuống giống nhanh cho các vườn thương phẩm hoặc mô hình trồng thử nghiệm.',
    'https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?auto=format&fit=crop&w=900&q=80',
    '["https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?auto=format&fit=crop&w=900&q=80","https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=900&q=80"]'::jsonb,
    '["Cây giống","F1","Rau quả"]'::jsonb,
    'Best Seller',
    4.9,
    184,
    412,
    true,
    true,
    'Giao nhanh 2H nội thành',
    '["Cây đồng đều","Tỷ lệ sống cao","Đóng khay an toàn"]'::jsonb,
    '{"Quy cách":"Khay 50 cây","Chiều cao cây":"12-18cm","Thời gian trồng":"Xuống giống ngay"}'::jsonb
  ),
  (
    'shop-2',
    'phan-bon-la-vi-luong-nano-green',
    'Phân Bón Lá Vi Lượng Nano Green',
    'Phân bón',
    189000,
    229000,
    72,
    'TF-FER-002',
    'GreenTech',
    'Việt Nam',
    'Phân bón lá chuyên xanh lá, dày tán và phục hồi cây sau mưa kéo dài hoặc thiếu dinh dưỡng.',
    'Công thức nano NPK kết hợp vi lượng hỗ trợ cây tăng tốc sinh trưởng, bung đọt khỏe và hạn chế sốc dinh dưỡng sau thời tiết bất lợi.',
    'https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?auto=format&fit=crop&w=900&q=80',
    '["https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?auto=format&fit=crop&w=900&q=80","https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?auto=format&fit=crop&w=900&q=80"]'::jsonb,
    '["Phân bón","Vi lượng","Phục hồi"]'::jsonb,
    'Flash Deal',
    4.8,
    121,
    295,
    true,
    true,
    'Miễn phí ship đơn từ 499K',
    '["Hấp thụ nhanh","Xanh lá dày","Dễ pha"]'::jsonb,
    '{"Thành phần":"NPK + Zn + B + Mn","Liều dùng":"25ml/16L","Chu kỳ":"7-10 ngày/lần"}'::jsonb
  ),
  (
    'shop-4',
    'bo-loc-tuoi-aqua-pure',
    'Bộ Lọc Tưới Aqua Pure',
    'Vật tư',
    1249000,
    1499000,
    16,
    'TF-IRR-004',
    'AquaTech Solutions',
    'Hàn Quốc',
    'Bộ lọc nguồn nước đầu vào cho hệ thống tưới nhỏ giọt và phun mưa.',
    'Thiết bị lọc nước chuyên cho nhà màng và vườn cây ăn trái, giúp hạn chế cặn bẩn, kéo dài tuổi thọ béc tưới và ổn định lưu lượng.',
    'https://images.unsplash.com/photo-1502741338009-cac2772e18bc?auto=format&fit=crop&w=900&q=80',
    '["https://images.unsplash.com/photo-1502741338009-cac2772e18bc?auto=format&fit=crop&w=900&q=80","https://images.unsplash.com/photo-1471193945509-9ad0617afabf?auto=format&fit=crop&w=900&q=80"]'::jsonb,
    '["Vật tư","Tưới nhỏ giọt","Nhà màng"]'::jsonb,
    'Premium',
    4.9,
    64,
    92,
    true,
    false,
    'Lắp đặt theo khu vực',
    '["Ổn định áp lực","Giảm nghẹt béc","Độ bền cao"]'::jsonb,
    '{"Công suất":"2m3/h","Chất liệu":"Than hoạt tính + nano bạc","Ứng dụng":"Nhà màng, vườn cây ăn trái"}'::jsonb
  ),
  (
    'shop-10',
    'phan-ca-huu-co-fish-plus',
    'Phân Cá Hữu Cơ Fish Plus',
    'Phân bón',
    239000,
    null,
    52,
    'TF-ORG-010',
    'Ocean Harvest',
    'Việt Nam',
    'Dinh dưỡng hữu cơ đậm đặc cho giai đoạn hồi cây, nuôi lá và giữ bộ rễ khỏe.',
    'Fish Plus là phân cá thủy phân dùng được cho cả phun lá và tưới gốc, phù hợp hộ trồng rau, cây ăn trái và canh tác hữu cơ.',
    'https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=900&q=80',
    '["https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=900&q=80","https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?auto=format&fit=crop&w=900&q=80"]'::jsonb,
    '["Phân cá","Hữu cơ","Nuôi lá"]'::jsonb,
    null,
    4.7,
    81,
    196,
    true,
    true,
    'Miễn phí ship đơn từ 499K',
    '["Đậm đặc","Ít mùi hơn","Dễ phối trộn"]'::jsonb,
    '{"Quy cách":"Can 1L","Liều dùng":"20-30ml/16L","Ứng dụng":"Tưới gốc, phun lá"}'::jsonb
  ),
  (
    'shop-12',
    'combo-khoi-dong-vuon-rau-mini',
    'Combo Khởi Động Vườn Rau Mini',
    'Combo',
    499000,
    579000,
    24,
    'TF-COMBO-012',
    'Terraform Flora',
    'Việt Nam',
    'Combo dành cho người mới bắt đầu gồm giống, giá thể và dinh dưỡng nền cơ bản.',
    'Bộ combo gói gọn các vật tư cần thiết để lên một vườn rau nhỏ tại nhà, phù hợp ban công, sân thượng hoặc khu thử nghiệm.',
    'https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=900&q=80',
    '["https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=900&q=80","https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?auto=format&fit=crop&w=900&q=80"]'::jsonb,
    '["Combo","Người mới","Vườn rau"]'::jsonb,
    'Combo tiết kiệm',
    4.8,
    58,
    111,
    true,
    false,
    'Miễn phí ship',
    '["Dễ bắt đầu","Đủ vật tư cơ bản","Chi phí tối ưu"]'::jsonb,
    '{"Thành phần":"Giống + giá thể + phân cá + dụng cụ","Phù hợp":"Ban công, sân thượng","Quy mô":"4-6 khay trồng nhỏ"}'::jsonb
  )
on conflict (id) do update
set
  slug = excluded.slug,
  name = excluded.name,
  category = excluded.category,
  price = excluded.price,
  original_price = excluded.original_price,
  stock = excluded.stock,
  sku = excluded.sku,
  manufacturer = excluded.manufacturer,
  origin = excluded.origin,
  short_description = excluded.short_description,
  description = excluded.description,
  image = excluded.image,
  images = excluded.images,
  tags = excluded.tags,
  badge = excluded.badge,
  rating = excluded.rating,
  review_count = excluded.review_count,
  sales_count = excluded.sales_count,
  featured = excluded.featured,
  best_seller = excluded.best_seller,
  shipping_class = excluded.shipping_class,
  benefits = excluded.benefits,
  specs = excluded.specs,
  updated_at = now();

commit;
