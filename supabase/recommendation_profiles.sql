begin;

-- =========================================================
-- 1) TABLE: crops
-- =========================================================
create table if not exists public.crops (
  id text primary key,
  name text not null unique,
  created_at timestamptz not null default now()
);

create index if not exists crops_name_idx
  on public.crops (name);

alter table public.crops enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'crops'
      and policyname = 'Public read crops'
  ) then
    create policy "Public read crops"
      on public.crops
      for select
      to public
      using (true);
  end if;
end $$;

-- =========================================================
-- 2) TABLE: disease_assistant_profiles
--    mỗi dòng = 1 bệnh cụ thể của 1 loại cây
-- =========================================================
create table if not exists public.disease_assistant_profiles (
  id text primary key,
  crop_id text not null references public.crops(id) on delete cascade,
  name text not null,
  type text not null check (type in ('fungal', 'bacterial', 'insect', 'physiological')),
  description text not null,
  symptoms jsonb not null default '[]'::jsonb,
  impact_level text not null,
  causes text not null,
  protocols jsonb not null default '[]'::jsonb,
  alternatives jsonb,
  usage_notes jsonb not null default '{}'::jsonb,
  reference_sources jsonb,
  quick_action text not null,
  confidence_base int not null default 70 check (confidence_base >= 0 and confidence_base <= 100),
  immediate_actions jsonb not null default '[]'::jsonb,
  stage_plans jsonb not null default '{}'::jsonb,
  symptom_options jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists disease_assistant_profiles_crop_id_idx
  on public.disease_assistant_profiles (crop_id);

create index if not exists disease_assistant_profiles_type_idx
  on public.disease_assistant_profiles (type);

alter table public.disease_assistant_profiles enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'disease_assistant_profiles'
      and policyname = 'Public read disease assistant profiles'
  ) then
    create policy "Public read disease assistant profiles"
      on public.disease_assistant_profiles
      for select
      to public
      using (true);
  end if;
end $$;

-- =========================================================
-- 3) UPDATED_AT trigger
-- =========================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_disease_assistant_profiles_updated_at
  on public.disease_assistant_profiles;

create trigger trg_disease_assistant_profiles_updated_at
before update on public.disease_assistant_profiles
for each row
execute function public.set_updated_at();

-- =========================================================
-- 4) SEED: crops
-- =========================================================
insert into public.crops (id, name)
values
  ('tomato', 'Cà chua'),
  ('rice', 'Lúa'),
  ('pepper', 'Ớt'),
  ('cucumber', 'Dưa leo'),
  ('orange', 'Cam'),
  ('pomelo', 'Bưởi'),
  ('mango', 'Xoài'),
  ('durian', 'Sầu riêng'),
  ('coffee', 'Cà phê'),
  ('dragon-fruit', 'Thanh long')
on conflict (id) do update set
  name = excluded.name;

-- =========================================================
-- 5) SEED: diseases
-- =========================================================
insert into public.disease_assistant_profiles (
  id,
  crop_id,
  name,
  type,
  description,
  symptoms,
  impact_level,
  causes,
  protocols,
  alternatives,
  usage_notes,
  reference_sources,
  quick_action,
  confidence_base,
  immediate_actions,
  stage_plans,
  symptom_options
)
values
(
  'tomato-root-rot',
  'tomato',
  'Thối rễ do nấm',
  'fungal',
  'Bệnh xuất hiện ở vùng rễ khi đất ẩm kéo dài, làm cây vàng lá, héo nhanh và suy kiệt.',
  $$[
    "Lá vàng từ dưới lên",
    "Cây héo ban ngày",
    "Rễ nâu đen",
    "Rễ có mùi thối"
  ]$$::jsonb,
  'Cao',
  'Đất bí chặt, thoát nước kém, nấm tồn lưu trong đất và tưới quá dày.',
  $$[
    {
      "id": "trr-moderate",
      "severity": "moderate",
      "steps": [
        "Ngừng tưới đẫm trong 1-2 ngày và mở thoáng gốc.",
        "Loại bỏ cây hư nặng để giảm nguồn bệnh.",
        "Tưới gốc bằng thuốc phù hợp theo nhãn.",
        "Bổ sung vi sinh hoặc hữu cơ hoai để phục hồi vùng rễ."
      ],
      "drugs": [
        { "name": "Ridomil Gold", "activeIngredient": "Metalaxyl + Mancozeb", "dosage": "25g/16L" },
        { "name": "Aliette", "activeIngredient": "Fosetyl-Al", "dosage": "30g/16L" }
      ],
      "usage": "Ưu tiên tưới vùng gốc, kết hợp cải thiện thoát nước.",
      "frequency": "2-3 lần",
      "interval": "5-7 ngày",
      "notes": "Không tưới vào cuối chiều khi đất còn ẩm nặng."
    }
  ]$$::jsonb,
  null,
  $${
    "timing": "Xử lý ngay khi thấy héo rũ đi kèm vàng lá và rễ có dấu hiệu nâu đen.",
    "weather": "Ưu tiên xử lý lúc sáng sớm, tránh mưa kéo dài sau khi tưới thuốc.",
    "safety": "Đeo găng, khẩu trang và tránh để thuốc đọng ở nguồn nước sinh hoạt.",
    "withdrawal": "7 ngày tùy sản phẩm."
  }$$::jsonb,
  $$["Sổ tay BVTV rau màu", "Khuyến nông địa phương"]$$::jsonb,
  'Ngừng tưới đẫm, kiểm tra vùng rễ và mở thoáng gốc ngay hôm nay.',
  76,
  $$[
    "Dừng tưới dồn trong 24 giờ tới.",
    "Bới kiểm tra rễ ở 3-5 cây đại diện.",
    "Đánh dấu và cách ly cây đã héo nặng."
  ]$$::jsonb,
  $${
    "immediate": ["Ngừng tưới mạnh", "Tách cây bệnh nặng", "Mở rãnh thoát nước"],
    "next24h": ["Tưới gốc bằng thuốc phù hợp", "Khử khuẩn dụng cụ", "Bổ sung giá thể thoáng khí"],
    "followUp": ["Theo dõi cây lân cận 3 ngày", "Giảm mật độ ẩm vùng gốc", "Điều chỉnh lịch tưới cố định"]
  }$$::jsonb,
  $$["Lá vàng", "Héo rũ", "Thối rễ", "Thối thân"]$$::jsonb
),
(
  'rice-blast',
  'rice',
  'Đạo ôn lá',
  'fungal',
  'Bệnh phổ biến trên lúa trong điều kiện ẩm cao, có thể làm cháy lá và giảm năng suất mạnh.',
  $$[
    "Vết bệnh hình thoi",
    "Tâm vết xám trắng",
    "Rìa nâu",
    "Lá cháy từng mảng"
  ]$$::jsonb,
  'Cao',
  'Ẩm độ cao, bón thừa đạm, ruộng rậm và sương mù kéo dài.',
  $$[
    {
      "id": "rb-moderate",
      "severity": "moderate",
      "steps": [
        "Ngưng bón thêm đạm trong ngắn hạn.",
        "Giữ mực nước ổn định.",
        "Phun thuốc đặc trị theo nhãn vào sáng sớm hoặc chiều mát.",
        "Kiểm tra lại sau 5 ngày để đánh giá vết bệnh mới."
      ],
      "drugs": [
        { "name": "Beam 75WP", "activeIngredient": "Tricyclazole", "dosage": "20g/16L" },
        { "name": "Filia 525SE", "activeIngredient": "Tricyclazole + Propiconazole", "dosage": "20ml/16L" }
      ],
      "usage": "Phun đều hai mặt lá, tập trung ổ bệnh trước.",
      "frequency": "2 lần",
      "interval": "5-7 ngày",
      "notes": "Không phun khi gió mạnh hoặc trước mưa."
    }
  ]$$::jsonb,
  null,
  $${
    "timing": "Xử lý khi vết bệnh mới xuất hiện hoặc khi thời tiết thuận lợi cho bệnh bùng phát.",
    "weather": "Tránh mưa trong vài giờ sau phun.",
    "safety": "Mang bảo hộ đầy đủ, tuân thủ đúng liều trên nhãn.",
    "withdrawal": "7-14 ngày."
  }$$::jsonb,
  $$["Quy trình IPM lúa", "Tài liệu đạo ôn lúa"]$$::jsonb,
  'Ngưng đạm, khoanh vùng ổ bệnh và phun xử lý sớm.',
  74,
  $$[
    "Dừng bón đạm thêm.",
    "Khảo sát mật độ vết bệnh theo từng đám ruộng.",
    "Chuẩn bị thuốc xử lý trước khi trời tiếp tục ẩm."
  ]$$::jsonb,
  $${
    "immediate": ["Khoanh ổ bệnh", "Ngưng đạm", "Giữ mực nước ổn định"],
    "next24h": ["Phun thuốc đúng liều", "Ghi nhận vùng nặng", "So sánh lá mới nhiễm"],
    "followUp": ["Tái kiểm tra sau 5-7 ngày", "Điều chỉnh dinh dưỡng", "Theo dõi cổ bông khi gần trổ"]
  }$$::jsonb,
  $$["Đốm nâu", "Lá cuốn", "Cháy mép lá", "Lá vàng"]$$::jsonb
),
(
  'pepper-bacterial-wilt',
  'pepper',
  'Héo xanh vi khuẩn',
  'bacterial',
  'Bệnh làm cây héo đột ngột dù lá còn xanh, rất khó hồi phục nếu phát hiện muộn.',
  $$[
    "Cây héo nhanh",
    "Mạch thân nâu",
    "Dịch vi khuẩn trắng đục",
    "Lá còn xanh nhưng cây rũ"
  ]$$::jsonb,
  'Rất cao',
  'Vi khuẩn tồn trong đất, nước tưới nhiễm khuẩn, luân canh kém và nhiệt độ đất cao.',
  $$[
    {
      "id": "pbw-severe",
      "severity": "severe",
      "steps": [
        "Nhổ bỏ cây bệnh và mang ra khỏi khu canh tác.",
        "Khử khuẩn hố trồng và dụng cụ tiếp xúc.",
        "Giảm di chuyển nước từ khu bệnh sang khu khỏe.",
        "Bổ sung vi sinh và cải tạo đất cho vụ sau."
      ],
      "drugs": [
        { "name": "Kasumin", "activeIngredient": "Kasugamycin", "dosage": "20ml/16L" }
      ],
      "usage": "Xử lý kết hợp tiêu hủy cây bệnh và vệ sinh vùng trồng.",
      "frequency": "2 lần",
      "interval": "5 ngày",
      "notes": "Hiệu quả phụ thuộc phát hiện sớm và vệ sinh đồng ruộng."
    }
  ]$$::jsonb,
  null,
  $${
    "timing": "Can thiệp ngay khi phát hiện cây héo đột ngột.",
    "weather": "Hạn chế thao tác khi ruộng ướt sũng làm lây lan qua nước.",
    "safety": "Vệ sinh tay, dụng cụ, giày dép sau khi xử lý vùng bệnh.",
    "withdrawal": "Theo nhãn sản phẩm sử dụng."
  }$$::jsonb,
  $$["Tài liệu héo xanh vi khuẩn", "Khuyến nông rau màu"]$$::jsonb,
  'Nhổ bỏ cây héo đột ngột và khử khuẩn khu vực quanh gốc.',
  78,
  $$[
    "Đánh dấu cây héo đột ngột.",
    "Nhổ bỏ và tiêu hủy cây nặng.",
    "Không để nước chảy từ khu bệnh sang khu khỏe."
  ]$$::jsonb,
  $${
    "immediate": ["Nhổ cây bệnh", "Khử khuẩn dụng cụ", "Ngăn dòng nước lây bệnh"],
    "next24h": ["Kiểm tra thêm cây cạnh bên", "Xử lý cục bộ vùng gốc", "Giảm ẩm đất"],
    "followUp": ["Xem lại luân canh", "Bổ sung vi sinh đất", "Theo dõi cây mới héo"]
  }$$::jsonb,
  $$["Héo rũ", "Lá vàng", "Thối thân"]$$::jsonb
),
(
  'cucumber-downy-mildew',
  'cucumber',
  'Sương mai dưa leo',
  'fungal',
  'Bệnh phát triển nhanh khi ẩm cao, làm lá vàng loang và giảm quang hợp mạnh.',
  $$[
    "Đốm vàng góc cạnh trên lá",
    "Mặt dưới lá có mốc xám tím",
    "Lá vàng loang",
    "Lá suy nhanh"
  ]$$::jsonb,
  'Trung bình đến cao',
  'Ẩm độ cao, tưới chiều muộn, tán lá rậm và nhà màng kém thông thoáng.',
  $$[
    {
      "id": "cdm-moderate",
      "severity": "moderate",
      "steps": [
        "Tỉa lá bệnh nặng và tăng thông thoáng tán.",
        "Giảm tưới chiều tối, ưu tiên tưới sáng.",
        "Phun thuốc phù hợp khi bệnh mới chớm lan.",
        "Theo dõi lá non trong 48 giờ tiếp theo."
      ],
      "drugs": [
        { "name": "Revus Opti", "activeIngredient": "Mandipropamid + Chlorothalonil", "dosage": "25ml/16L" }
      ],
      "usage": "Phun phủ đều hai mặt lá, ưu tiên tầng lá thấp.",
      "frequency": "2-3 lần",
      "interval": "5 ngày",
      "notes": "Kết hợp thông gió nhà lưới hoặc giàn leo."
    }
  ]$$::jsonb,
  null,
  $${
    "timing": "Xử lý sớm khi mới xuất hiện đốm vàng góc cạnh.",
    "weather": "Tránh phun sát cơn mưa hoặc khi lá còn ướt đẫm.",
    "safety": "Mặc đồ bảo hộ và rửa sạch bình phun sau dùng.",
    "withdrawal": "5-7 ngày."
  }$$::jsonb,
  $$["Quản lý bệnh dưa leo", "Quy trình nhà màng"]$$::jsonb,
  'Giảm ẩm lá, tỉa lá bệnh và tăng thông gió ngay.',
  72,
  $$[
    "Tỉa bỏ lá bị nặng.",
    "Ngừng tưới chiều tối.",
    "Mở giàn cho tán thoáng."
  ]$$::jsonb,
  $${
    "immediate": ["Tỉa lá nặng", "Giảm ẩm lá", "Mở thông gió"],
    "next24h": ["Phun xử lý nếu bệnh lan", "Kiểm tra mặt dưới lá", "Theo dõi đốm mới"],
    "followUp": ["Duy trì tưới sáng", "Giãn tán lá", "Kiểm tra lô kế bên"]
  }$$::jsonb,
  $$["Lá vàng", "Đốm nâu", "Mốc trắng", "Cháy mép lá"]$$::jsonb
),
(
  'orange-greening',
  'orange',
  'Vàng lá gân xanh',
  'bacterial',
  'Bệnh nguy hiểm trên cây có múi, làm vàng lá, méo trái và suy kiệt kéo dài.',
  $$[
    "Lá vàng loang nhưng gân còn xanh",
    "Vàng lá không đối xứng",
    "Trái nhỏ lệch",
    "Vị đắng"
  ]$$::jsonb,
  'Rất cao',
  'Vi khuẩn Liberibacter lây qua rầy chổng cánh và cây giống nhiễm bệnh.',
  $$[
    {
      "id": "og-severe",
      "severity": "severe",
      "steps": [
        "Đánh dấu cây nghi nhiễm nặng.",
        "Quản lý rầy chổng cánh đồng loạt.",
        "Cắt bỏ cành bệnh nặng hoặc loại bỏ cây quá nặng.",
        "Bổ sung dinh dưỡng và phục hồi cây còn khả năng giữ lại."
      ],
      "drugs": [
        { "name": "Actara", "activeIngredient": "Thiamethoxam", "dosage": "8g/16L" }
      ],
      "usage": "Phun quản lý môi giới truyền bệnh kết hợp vệ sinh vườn.",
      "frequency": "2-3 lần",
      "interval": "7 ngày",
      "notes": "Không chỉ xử lý một cây đơn lẻ, cần làm đồng loạt theo khu."
    }
  ]$$::jsonb,
  null,
  $${
    "timing": "Can thiệp ngay khi phát hiện lá vàng gân xanh không đối xứng.",
    "weather": "Theo dõi sát sau đợt lộc non vì rầy thường phát sinh mạnh.",
    "safety": "Phun thuốc đúng bảo hộ và giữ khoảng cách với khu dân cư.",
    "withdrawal": "Theo nhãn sản phẩm."
  }$$::jsonb,
  $$["Quản lý HLB trên cây có múi"]$$::jsonb,
  'Kiểm tra rầy chổng cánh và khoanh vùng cây có biểu hiện vàng lá gân xanh ngay.',
  80,
  $$[
    "Đánh dấu cây nghi nhiễm.",
    "Khảo sát rầy trên lộc non.",
    "Không lấy mắt ghép từ cây nghi nhiễm."
  ]$$::jsonb,
  $${
    "immediate": ["Khoanh vùng cây bệnh", "Kiểm tra rầy chổng cánh", "Ngưng nhân giống từ cây nghi nhiễm"],
    "next24h": ["Phun quản lý môi giới truyền bệnh", "Cắt tỉa cành nặng", "Bổ sung dinh dưỡng lá"],
    "followUp": ["Theo dõi lộc non", "Đánh giá cây giữ lại hay loại bỏ", "Quản lý vườn đồng loạt"]
  }$$::jsonb,
  $$["Lá vàng", "Vàng lá gân xanh", "Rụng hoa"]$$::jsonb
),
(
  'pomelo-melanose',
  'pomelo',
  'Đốm dầu trên bưởi',
  'fungal',
  'Bệnh làm lá và trái có nhiều đốm nâu sần, ảnh hưởng mã trái và chất lượng thương phẩm.',
  $$[
    "Lá có chấm nâu nhỏ",
    "Trái có vết nhám sần màu nâu",
    "Đốm nâu trên vỏ",
    "Mã trái xấu"
  ]$$::jsonb,
  'Trung bình',
  'Nấm phát triển mạnh trong mùa mưa, vườn rậm và tán lá ẩm lâu.',
  $$[
    {
      "id": "pm-moderate",
      "severity": "moderate",
      "steps": [
        "Tỉa cành cho tán thông thoáng.",
        "Thu gom lá cành bệnh rụng dưới gốc.",
        "Phun thuốc phòng trị vào giai đoạn lá non và trái non.",
        "Theo dõi lại sau các đợt mưa lớn."
      ],
      "drugs": [
        { "name": "Kocide", "activeIngredient": "Copper Hydroxide", "dosage": "20g/16L" }
      ],
      "usage": "Phun đều tán lá và giai đoạn trái non dễ nhiễm.",
      "frequency": "2 lần",
      "interval": "7 ngày",
      "notes": "Ưu tiên phòng sớm đầu mùa mưa."
    }
  ]$$::jsonb,
  null,
  $${
    "timing": "Phun sớm ở giai đoạn lá non, trái non.",
    "weather": "Lặp lại sau mưa kéo dài nếu áp lực bệnh cao.",
    "safety": "Mang đồ bảo hộ và tránh phun giữa trưa nắng gắt.",
    "withdrawal": "7 ngày."
  }$$::jsonb,
  $$["Sổ tay cây có múi"]$$::jsonb,
  'Tỉa tán và vệ sinh lá cành rụng trước khi xử lý thuốc.',
  69,
  $$[
    "Thu gom lá rụng dưới gốc.",
    "Kiểm tra lứa lá non mới ra.",
    "Mở tán cho giảm ẩm."
  ]$$::jsonb,
  $${
    "immediate": ["Vệ sinh vườn", "Tỉa cành", "Giảm ẩm tán"],
    "next24h": ["Phun phòng trị", "Đánh giá trái non", "Theo dõi lá non"],
    "followUp": ["Lặp lại sau mưa", "Duy trì thông thoáng", "Kiểm tra mã trái"]
  }$$::jsonb,
  $$["Đốm nâu", "Lá vàng"]$$::jsonb
),
(
  'mango-anthracnose',
  'mango',
  'Thán thư xoài',
  'fungal',
  'Bệnh gây cháy bông, đốm lá và thối đen trên trái, đặc biệt nặng trong mùa mưa ẩm.',
  $$[
    "Bông bị cháy nâu đen",
    "Trái có đốm đen lõm",
    "Lá có vết nâu cháy",
    "Rụng bông"
  ]$$::jsonb,
  'Cao',
  'Ẩm độ cao, mưa nhiều, tán cây rậm và không vệ sinh sau thu hoạch.',
  $$[
    {
      "id": "ma-moderate",
      "severity": "moderate",
      "steps": [
        "Tỉa bỏ chùm bông hoặc cành bệnh nặng.",
        "Phun thuốc phòng trị vào giai đoạn trổ bông và đậu trái non.",
        "Vệ sinh tán cây và thu gom trái bệnh.",
        "Theo dõi lại sau mưa."
      ],
      "drugs": [
        { "name": "Antracol", "activeIngredient": "Propineb", "dosage": "20g/16L" }
      ],
      "usage": "Phun kỹ bông, trái non và tầng tán bên trong.",
      "frequency": "2-3 lần",
      "interval": "5-7 ngày",
      "notes": "Luân phiên hoạt chất để giảm kháng thuốc."
    }
  ]$$::jsonb,
  null,
  $${
    "timing": "Ưu tiên xử lý ở giai đoạn bông và trái non.",
    "weather": "Theo dõi sát sau mưa hoặc sương đêm dày.",
    "safety": "Phun đúng liều, đeo găng và khẩu trang.",
    "withdrawal": "7-14 ngày."
  }$$::jsonb,
  $$["Quản lý bệnh thán thư xoài"]$$::jsonb,
  'Xử lý sớm trên bông và trái non, không để vườn quá rậm trong mùa mưa.',
  75,
  $$[
    "Cắt bỏ phần bông bị cháy nặng.",
    "Thu gom trái bệnh rụng.",
    "Đánh giá mật độ đốm trên trái non."
  ]$$::jsonb,
  $${
    "immediate": ["Tỉa bỏ ổ bệnh", "Vệ sinh trái rụng", "Mở thông tán"],
    "next24h": ["Phun phòng trị", "Theo dõi bông và trái non", "Ghi nhận vùng nặng"],
    "followUp": ["Lặp lại sau mưa", "Luân phiên hoạt chất", "Duy trì tán thoáng"]
  }$$::jsonb,
  $$["Đốm nâu", "Rụng hoa", "Mốc trắng"]$$::jsonb
),
(
  'durian-phytophthora',
  'durian',
  'Xì mủ thân cành',
  'fungal',
  'Bệnh gây chảy nhựa, thối vỏ thân và có thể làm cây suy nhanh nếu không xử lý kịp.',
  $$[
    "Thân cành chảy nhựa nâu",
    "Vỏ thâm",
    "Lá vàng",
    "Cành suy yếu"
  ]$$::jsonb,
  'Rất cao',
  'Nấm Phytophthora phát triển khi ẩm độ đất và không khí cao kéo dài.',
  $$[
    {
      "id": "dp-severe",
      "severity": "severe",
      "steps": [
        "Cạo sạch vùng vỏ bị bệnh đến phần mô khỏe.",
        "Quét thuốc xử lý vết bệnh và xử lý vùng rễ nếu cần.",
        "Cải thiện thoát nước quanh tán.",
        "Giảm tưới và theo dõi nhựa chảy mới."
      ],
      "drugs": [
        { "name": "Aliette", "activeIngredient": "Fosetyl-Al", "dosage": "30g/16L" },
        { "name": "Ridomil Gold", "activeIngredient": "Metalaxyl + Mancozeb", "dosage": "25g/16L" }
      ],
      "usage": "Kết hợp quét thân và xử lý vùng rễ.",
      "frequency": "2 lần",
      "interval": "7 ngày",
      "notes": "Không để nước đọng quanh gốc."
    }
  ]$$::jsonb,
  null,
  $${
    "timing": "Xử lý ngay khi thấy vệt chảy nhựa đầu tiên.",
    "weather": "Đặc biệt chú ý sau mưa dài ngày.",
    "safety": "Dùng đồ bảo hộ và vệ sinh dao cạo sau khi thao tác.",
    "withdrawal": "Theo nhãn sản phẩm."
  }$$::jsonb,
  $$["Kỹ thuật chăm sóc sầu riêng", "Quản lý Phytophthora"]$$::jsonb,
  'Cạo sạch vùng bệnh và cải thiện thoát nước ngay để chặn lan sâu vào thân.',
  79,
  $$[
    "Đánh dấu các điểm chảy nhựa mới.",
    "Ngưng tưới mạnh quanh gốc.",
    "Kiểm tra hệ thống thoát nước."
  ]$$::jsonb,
  $${
    "immediate": ["Cạo sạch vết bệnh", "Quét thuốc xử lý", "Thoát nước quanh gốc"],
    "next24h": ["Kiểm tra vết chảy mới", "Xử lý rễ nếu cần", "Giảm ẩm tán"],
    "followUp": ["Theo dõi 5-7 ngày", "Duy trì thoát nước", "Phục hồi dinh dưỡng cây"]
  }$$::jsonb,
  $$["Lá vàng", "Nứt thân", "Thối thân"]$$::jsonb
),
(
  'coffee-rust',
  'coffee',
  'Rỉ sắt cà phê',
  'fungal',
  'Bệnh phổ biến làm lá rụng sớm, giảm diện tích quang hợp và suy cây kéo dài.',
  $$[
    "Mặt dưới lá có bột vàng cam",
    "Mặt trên lá có đốm vàng",
    "Lá rụng sớm",
    "Cây suy kéo dài"
  ]$$::jsonb,
  'Cao',
  'Ẩm độ cao, vườn rậm, thiếu dinh dưỡng và giống mẫn cảm.',
  $$[
    {
      "id": "cr-moderate",
      "severity": "moderate",
      "steps": [
        "Tỉa cành cho vườn thông thoáng.",
        "Bổ sung dinh dưỡng cân đối, đặc biệt kali.",
        "Phun thuốc phù hợp khi bệnh chớm lan.",
        "Theo dõi lá non sau 7 ngày."
      ],
      "drugs": [
        { "name": "Tilt Super", "activeIngredient": "Propiconazole + Difenoconazole", "dosage": "15ml/16L" }
      ],
      "usage": "Phun kỹ mặt dưới lá là nơi bào tử phát triển mạnh.",
      "frequency": "2 lần",
      "interval": "7 ngày",
      "notes": "Kết hợp tỉa cành để tăng hiệu quả."
    }
  ]$$::jsonb,
  null,
  $${
    "timing": "Xử lý sớm khi thấy đốm vàng đầu tiên trên lá bánh tẻ.",
    "weather": "Tránh phun lúc có gió mạnh hoặc mưa sát giờ phun.",
    "safety": "Mang găng tay, kính và khẩu trang khi pha phun.",
    "withdrawal": "Theo nhãn sản phẩm."
  }$$::jsonb,
  $$["Quy trình quản lý rỉ sắt cà phê"]$$::jsonb,
  'Kiểm tra mặt dưới lá và xử lý sớm trước khi cây rụng lá hàng loạt.',
  73,
  $$[
    "Khảo sát lá bánh tẻ trong tán.",
    "Tỉa cành vượt làm vườn thông thoáng.",
    "Bổ sung kali nếu cây yếu."
  ]$$::jsonb,
  $${
    "immediate": ["Khảo sát mặt dưới lá", "Tỉa cành thông thoáng", "Khoanh vùng nặng"],
    "next24h": ["Phun xử lý", "Bổ sung dinh dưỡng", "Theo dõi lá mới"],
    "followUp": ["Đánh giá rụng lá", "Tái kiểm tra sau 7 ngày", "Duy trì thông thoáng vườn"]
  }$$::jsonb,
  $$["Lá vàng", "Đốm nâu"]$$::jsonb
),
(
  'dragon-fruit-stem-rot',
  'dragon-fruit',
  'Đốm nâu thối cành thanh long',
  'fungal',
  'Bệnh gây đốm nâu trên cành, sau đó lan rộng làm mô bị thối và khô cành.',
  $$[
    "Cành có vết nâu lõm",
    "Mô mềm ướt",
    "Khô cháy cành",
    "Có mốc nhẹ"
  ]$$::jsonb,
  'Trung bình đến cao',
  'Ẩm độ cao, cành dày, vườn thiếu thông thoáng và mưa kéo dài.',
  $$[
    {
      "id": "dfs-moderate",
      "severity": "moderate",
      "steps": [
        "Cắt bỏ cành bệnh nặng khỏi trụ.",
        "Thu gom và tiêu hủy mô bệnh.",
        "Phun thuốc phù hợp lên toàn bộ trụ bị ảnh hưởng.",
        "Giảm mật độ cành rậm."
      ],
      "drugs": [
        { "name": "Nativo", "activeIngredient": "Tebuconazole + Trifloxystrobin", "dosage": "10g/16L" }
      ],
      "usage": "Phun đều cành và vị trí vết bệnh sau khi cắt tỉa.",
      "frequency": "2 lần",
      "interval": "5-7 ngày",
      "notes": "Vệ sinh kéo cắt sau mỗi trụ bệnh."
    }
  ]$$::jsonb,
  null,
  $${
    "timing": "Can thiệp ngay khi vết nâu còn nhỏ và chưa lan rộng.",
    "weather": "Tăng kiểm tra sau mưa kéo dài hoặc sương đêm nhiều.",
    "safety": "Đeo găng tay, khẩu trang và tránh tiếp xúc trực tiếp với thuốc.",
    "withdrawal": "7 ngày."
  }$$::jsonb,
  $$["Quản lý bệnh trên thanh long"]$$::jsonb,
  'Cắt bỏ cành bệnh sớm và giữ trụ thanh long luôn thông thoáng.',
  71,
  $$[
    "Đánh dấu trụ có cành xuất hiện vết nâu.",
    "Cắt bỏ cành bệnh nặng.",
    "Thu gom mô bệnh ra khỏi vườn."
  ]$$::jsonb,
  $${
    "immediate": ["Cắt cành bệnh", "Thu gom tiêu hủy", "Khử khuẩn dụng cụ"],
    "next24h": ["Phun xử lý toàn trụ", "Giảm mật độ cành", "Theo dõi vết mới"],
    "followUp": ["Kiểm tra sau mưa", "Duy trì trụ thông thoáng", "Theo dõi cành non"]
  }$$::jsonb,
  $$["Đốm nâu", "Thối thân", "Mốc trắng"]$$::jsonb
)
on conflict (id) do update set
  crop_id = excluded.crop_id,
  name = excluded.name,
  type = excluded.type,
  description = excluded.description,
  symptoms = excluded.symptoms,
  impact_level = excluded.impact_level,
  causes = excluded.causes,
  protocols = excluded.protocols,
  alternatives = excluded.alternatives,
  usage_notes = excluded.usage_notes,
  reference_sources = excluded.reference_sources,
  quick_action = excluded.quick_action,
  confidence_base = excluded.confidence_base,
  immediate_actions = excluded.immediate_actions,
  stage_plans = excluded.stage_plans,
  symptom_options = excluded.symptom_options,
  updated_at = now();

commit;