import { isSupabaseConfigured, supabase } from "../lib/supabase.js";

export interface LibraryArticle {
  id: string;
  title: string;
  category: string;
  type: "Cây trồng" | "Sâu bệnh" | "Kỹ thuật" | "Quy trình" | "Tổng quan" | "Chính sách";
  crop?: string;
  disease?: string;
  symptom?: string;
  docType: "Hướng dẫn" | "Nghiên cứu" | "Báo cáo" | "Tổng hợp";
  tags: string[];
  pdfUrl: string;
  accentClass: string;
  readTime: string;
  date: string;
  excerpt: string;
  featured?: boolean;
  contentHtml?: string;
  sourceName?: string;
  sourceUrl?: string;
  imageUrl?: string;
  publishedAt?: string | null;
}

interface LibraryArticleRow {
  id: string;
  title: string;
  category: string | null;
  type: LibraryArticle["type"] | null;
  crop: string | null;
  disease: string | null;
  symptom: string | null;
  doc_type: LibraryArticle["docType"] | null;
  tags: string[] | null;
  pdf_url: string | null;
  accent_class: string | null;
  read_time: string | null;
  date_label: string | null;
  excerpt: string | null;
  featured: boolean | null;
  content_html: string | null;
  source_name: string | null;
  source_url: string | null;
  image_url: string | null;
  published_at: string | null;
  created_at: string | null;
}

const LIBRARY_BOOKMARK_PREFIX = "terraform-flora.library.bookmarks";

const accentPalette = [
  "bg-emerald-500",
  "bg-blue-500",
  "bg-orange-500",
  "bg-purple-500",
  "bg-pink-500",
  "bg-red-500",
];

export const libraryArticles: LibraryArticle[] = [
  {
    id: "lib-1",
    title: "Kỹ thuật trồng lúa ST25 đạt năng suất cao",
    category: "Cây trồng",
    type: "Kỹ thuật",
    crop: "Lúa",
    docType: "Hướng dẫn",
    tags: ["Sâu bệnh", "Nước", "Phân bón"],
    disease: "Rầy nâu",
    symptom: "Vàng lá",
    pdfUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    accentClass: "bg-emerald-500",
    readTime: "8 phút",
    date: "20/03/2026",
    excerpt: "Tối ưu giống, quản lý nước, bón phân và theo dõi sâu bệnh để giữ năng suất ổn định suốt vụ.",
    featured: true,
    sourceName: "Terraform Flora",
    sourceUrl: "https://example.com/library/st25",
    publishedAt: "2026-03-20T00:00:00.000Z",
  },
  {
    id: "lib-2",
    title: "Phòng trừ sâu cuốn lá bằng phương pháp sinh học",
    category: "Sâu bệnh",
    type: "Kỹ thuật",
    crop: "Lúa",
    docType: "Nghiên cứu",
    tags: ["Sâu cuốn lá", "Biện pháp sinh học", "IPM"],
    disease: "Sâu cuốn lá",
    symptom: "Lá cuốn",
    pdfUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    accentClass: "bg-blue-500",
    readTime: "12 phút",
    date: "18/03/2026",
    excerpt: "Gợi ý quy trình IPM theo từng giai đoạn mật độ sâu và điều kiện thời tiết thực tế.",
    featured: true,
    sourceName: "Terraform Flora",
    sourceUrl: "https://example.com/library/sau-cuon-la",
    publishedAt: "2026-03-18T00:00:00.000Z",
  },
  {
    id: "lib-3",
    title: "Bón phân hữu cơ đúng cách cho cây ăn trái",
    category: "Kỹ thuật",
    type: "Cây trồng",
    crop: "Cây ăn trái",
    docType: "Hướng dẫn",
    tags: ["Phân hữu cơ", "Đất đai", "Độ ẩm"],
    pdfUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    accentClass: "bg-orange-500",
    readTime: "10 phút",
    date: "15/03/2026",
    excerpt: "Cân bằng hữu cơ, khoáng và vi sinh để phục hồi đất và duy trì chất lượng trái.",
    sourceName: "Terraform Flora",
    sourceUrl: "https://example.com/library/phan-huu-co",
    publishedAt: "2026-03-15T00:00:00.000Z",
  },
  {
    id: "lib-4",
    title: "Hệ thống tưới nhỏ giọt thông minh trong nhà màng",
    category: "Kỹ thuật",
    type: "Cây trồng",
    crop: "Cà chua",
    docType: "Báo cáo",
    tags: ["Tưới tiêu", "Nhà màng", "Tự động hóa"],
    symptom: "Rễ khô hạn",
    pdfUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    accentClass: "bg-purple-500",
    readTime: "15 phút",
    date: "12/03/2026",
    excerpt: "Thiết kế cụm lọc, van, lịch tưới và các điểm cần lưu ý khi vận hành thực tế.",
    sourceName: "Terraform Flora",
    sourceUrl: "https://example.com/library/tuoi-nha-mang",
    publishedAt: "2026-03-12T00:00:00.000Z",
  },
  {
    id: "lib-5",
    title: "Canh tác nông nghiệp tuần hoàn: Xu hướng tương lai",
    category: "Kỹ thuật",
    type: "Tổng quan",
    docType: "Tổng hợp",
    tags: ["Tuần hoàn", "Bền vững", "Vòng đời"],
    pdfUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    accentClass: "bg-pink-500",
    readTime: "20 phút",
    date: "10/03/2026",
    excerpt: "Tư duy hệ sinh thái trồng trọt khép kín để giảm chi phí đầu vào và tăng độ bền vững.",
    sourceName: "Terraform Flora",
    sourceUrl: "https://example.com/library/tuan-hoan",
    publishedAt: "2026-03-10T00:00:00.000Z",
  },
  {
    id: "lib-6",
    title: "Tiêu chuẩn VietGAP và quy trình chứng nhận",
    category: "Quy trình",
    type: "Chính sách",
    docType: "Hướng dẫn",
    tags: ["VietGAP", "Chuẩn", "Chứng nhận"],
    pdfUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    accentClass: "bg-red-500",
    readTime: "18 phút",
    date: "05/03/2026",
    excerpt: "Checklist hồ sơ, nhật ký, truy xuất và vận hành cần chuẩn bị trước khi đánh giá chứng nhận.",
    sourceName: "Terraform Flora",
    sourceUrl: "https://example.com/library/vietgap",
    publishedAt: "2026-03-05T00:00:00.000Z",
  },
];

const getKey = (userId?: string | null) => `${LIBRARY_BOOKMARK_PREFIX}.${userId || "guest"}`;

const normalizeDateLabel = (value?: string | null) => {
  if (!value) return new Date().toLocaleDateString("vi-VN");
  const asDate = new Date(value);
  if (Number.isNaN(asDate.getTime())) return value;
  return asDate.toLocaleDateString("vi-VN");
};

const estimateReadTime = (text: string) => {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(3, Math.round(words / 180));
  return `${minutes} phút`;
};

const mapRowToArticle = (row: LibraryArticleRow, index: number): LibraryArticle => ({
  id: row.id,
  title: row.title,
  category: row.category ?? "Kỹ thuật",
  type: row.type ?? "Tổng quan",
  crop: row.crop ?? undefined,
  disease: row.disease ?? undefined,
  symptom: row.symptom ?? undefined,
  docType: row.doc_type ?? "Tổng hợp",
  tags: row.tags ?? [],
  pdfUrl: row.pdf_url ?? row.source_url ?? "",
  accentClass: row.accent_class ?? accentPalette[index % accentPalette.length],
  readTime: row.read_time ?? estimateReadTime(`${row.title} ${row.excerpt ?? ""}`),
  date: row.date_label ?? normalizeDateLabel(row.published_at ?? row.created_at),
  excerpt: row.excerpt ?? "Bài viết được đồng bộ từ nguồn dữ liệu bên ngoài.",
  featured: row.featured ?? false,
  contentHtml: row.content_html ?? undefined,
  sourceName: row.source_name ?? "VAAS",
  sourceUrl: row.source_url ?? undefined,
  imageUrl: row.image_url ?? undefined,
  publishedAt: row.published_at ?? row.created_at,
});

export const getLibraryBookmarks = (userId?: string | null) => {
  if (typeof localStorage === "undefined") return [] as string[];

  try {
    const raw = localStorage.getItem(getKey(userId));
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
};

export const toggleLibraryBookmark = (articleId: string, userId?: string | null) => {
  const current = getLibraryBookmarks(userId);
  const next = current.includes(articleId)
    ? current.filter((id) => id !== articleId)
    : [...current, articleId];

  if (typeof localStorage !== "undefined") {
    localStorage.setItem(getKey(userId), JSON.stringify(next));
  }

  return next;
};

export const loadLibraryArticles = async () => {
  if (!isSupabaseConfigured || !supabase) {
    return { articles: libraryArticles, source: "local" as const };
  }

  try {
    const { data, error } = await supabase
      .from("library_articles")
      .select(
        "id, title, category, type, crop, disease, symptom, doc_type, tags, pdf_url, accent_class, read_time, date_label, excerpt, featured, content_html, source_name, source_url, image_url, published_at, created_at"
      )
      .order("published_at", { ascending: false })
      .order("created_at", { ascending: false });

    if (error || !data || data.length === 0) {
      return { articles: libraryArticles, source: "local" as const };
    }

    return {
      articles: (data as LibraryArticleRow[]).map(mapRowToArticle),
      source: "supabase" as const,
    };
  } catch {
    return { articles: libraryArticles, source: "local" as const };
  }
};
