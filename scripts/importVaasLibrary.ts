import "dotenv/config";
import * as cheerio from "cheerio";
import { createClient } from "@supabase/supabase-js";
import { createHash } from "node:crypto";

type LibraryType = "Cây trồng" | "Sâu bệnh" | "Kỹ thuật" | "Quy trình" | "Tổng quan" | "Chính sách";
type LibraryDocType = "Hướng dẫn" | "Nghiên cứu" | "Báo cáo" | "Tổng hợp";
type SourceMode = "article" | "library" | "khuyennong";
type SourceKey = "vaas" | "khuyennongvn";

type ScrapedArticle = {
  id: string;
  title: string;
  category: string;
  type: LibraryType;
  crop: string | null;
  disease: string | null;
  symptom: string | null;
  doc_type: LibraryDocType;
  tags: string[];
  pdf_url: string | null;
  accent_class: string;
  read_time: string;
  date_label: string;
  excerpt: string;
  featured: boolean;
  content_html: string | null;
  source_name: string;
  source_url: string;
  image_url: string | null;
  published_at: string | null;
};

type CrawlSource = {
  key: SourceKey;
  sourceName: string;
  baseUrl: string;
  url: string;
  category: string;
  featured: boolean;
  mode: SourceMode;
  type?: LibraryType;
  docType?: LibraryDocType;
  pages?: number;
};

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("Thiếu SUPABASE URL hoặc SERVICE ROLE KEY trong environment.");
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const STORAGE_BUCKET = process.env.VAAS_LIBRARY_BUCKET || "library-pdfs";
const SHOULD_UPLOAD_PDFS = (process.env.VAAS_UPLOAD_PDFS || "true").toLowerCase() !== "false";

const CATEGORY_SOURCES: CrawlSource[] = [
  { key: "vaas", sourceName: "VAAS", baseUrl: "https://vaas.vn", url: "https://vaas.vn/vi/nong-nghiep-thuong-thuc", category: "Nông nghiệp thường thức", featured: true, mode: "article", type: "Tổng quan", docType: "Tổng hợp" },
  { key: "vaas", sourceName: "VAAS", baseUrl: "https://vaas.vn", url: "https://vaas.vn/vi/tin-tuc-nong-nghiep", category: "Tin tức nông nghiệp", featured: false, mode: "article", type: "Tổng quan", docType: "Tổng hợp" },
  { key: "vaas", sourceName: "VAAS", baseUrl: "https://vaas.vn", url: "https://vaas.vn/vi/nong-nghiep-trong-nuoc", category: "Nông nghiệp trong nước", featured: false, mode: "article", type: "Tổng quan", docType: "Tổng hợp" },
  { key: "vaas", sourceName: "VAAS", baseUrl: "https://vaas.vn", url: "https://vaas.vn/vi/nong-nghiep-nuoc-ngoai", category: "Nông nghiệp nước ngoài", featured: false, mode: "article", type: "Tổng quan", docType: "Tổng hợp" },
  { key: "vaas", sourceName: "VAAS", baseUrl: "https://vaas.vn", url: "https://vaas.vn/vi/khoa-hoc-cong-nghe", category: "Khoa học công nghệ", featured: true, mode: "article", type: "Kỹ thuật", docType: "Nghiên cứu" },
  { key: "vaas", sourceName: "VAAS", baseUrl: "https://vaas.vn", url: "https://vaas.vn/vi/san-pham-khcn", category: "Sản phẩm khoa học công nghệ", featured: false, mode: "article", type: "Kỹ thuật", docType: "Báo cáo" },
  { key: "vaas", sourceName: "VAAS", baseUrl: "https://vaas.vn", url: "https://vaas.vn/vi/nhiem-vu-khcn", category: "Nhiệm vụ khoa học công nghệ", featured: false, mode: "article", type: "Quy trình", docType: "Báo cáo" },
  { key: "vaas", sourceName: "VAAS", baseUrl: "https://vaas.vn", url: "https://vaas.vn/vi/library/sach", category: "Sách", featured: true, mode: "library", type: "Kỹ thuật", docType: "Hướng dẫn" },
  { key: "vaas", sourceName: "VAAS", baseUrl: "https://vaas.vn", url: "https://vaas.vn/vi/library/an-pham", category: "Ấn phẩm", featured: true, mode: "library", type: "Tổng quan", docType: "Tổng hợp" },
  { key: "vaas", sourceName: "VAAS", baseUrl: "https://vaas.vn", url: "https://vaas.vn/vi/library/bai-bao-quoc-te", category: "Bài báo quốc tế", featured: false, mode: "library", type: "Tổng quan", docType: "Nghiên cứu" },
  { key: "khuyennongvn", sourceName: "Khuyến nông Việt Nam", baseUrl: "https://khuyennongvn.gov.vn", url: "https://khuyennongvn.gov.vn/ky-thuat-trong-trot", category: "Kỹ thuật trồng trọt", featured: true, mode: "khuyennong", type: "Kỹ thuật", docType: "Hướng dẫn", pages: 5 },
];

const ACCENTS = ["bg-emerald-500", "bg-blue-500", "bg-orange-500", "bg-purple-500", "bg-pink-500", "bg-red-500"];
const DEFAULT_LIMIT = Number(process.env.VAAS_IMPORT_LIMIT || "80");
const DEFAULT_PAGES = Number(process.env.VAAS_IMPORT_PAGES || "4");
const cliPagesArg = process.argv.find((arg) => arg.startsWith("--pages="));
const cliLimitArg = process.argv.find((arg) => arg.startsWith("--limit="));
const cliSourceArg = process.argv.find((arg) => arg.startsWith("--source="));
const PAGE_LIMIT = cliPagesArg ? Number(cliPagesArg.split("=")[1]) : DEFAULT_PAGES;
const IMPORT_LIMIT = cliLimitArg ? Number(cliLimitArg.split("=")[1]) : DEFAULT_LIMIT;
const SOURCE_FILTER = cliSourceArg?.split("=")[1]?.trim().toLowerCase() || "";

let bucketReady = false;

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const makeAbsoluteUrl = (value?: string | null, baseUrl?: string) => {
  if (!value) return null;
  try {
    return new URL(value, baseUrl ?? "https://vaas.vn").toString();
  } catch {
    return null;
  }
};

const createId = (value: string) => createHash("sha1").update(value).digest("hex").slice(0, 24);

const stripHtml = (html: string) =>
  html
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const normalizeDateTime = (text: string) => {
  const match = text.match(/(\d{2}):(\d{2})\s+(\d{2})\/(\d{2})\/(\d{4})/);
  if (!match) return null;

  const [, hour, minute, day, month, year] = match;
  return new Date(`${year}-${month}-${day}T${hour}:${minute}:00+07:00`).toISOString();
};

const titleToSlug = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);

const sanitizeFilename = (value: string) => {
  const clean = value
    .split("?")[0]
    .split("#")[0]
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
  return clean || "document.pdf";
};

const inferType = (title: string, category: string, sourceType?: LibraryType): LibraryType => {
  if (sourceType) return sourceType;
  const lower = `${title} ${category}`.toLowerCase();
  if (lower.includes("sâu") || lower.includes("bệnh") || lower.includes("rầy")) return "Sâu bệnh";
  if (lower.includes("quy trình") || lower.includes("quy chuẩn")) return "Quy trình";
  if (lower.includes("chính sách") || lower.includes("nghị định") || lower.includes("quyết định")) return "Chính sách";
  if (lower.includes("giống") || lower.includes("trồng") || lower.includes("cây")) return "Cây trồng";
  if (lower.includes("kỹ thuật")) return "Kỹ thuật";
  return "Tổng quan";
};

const inferDocType = (pdfUrl: string | null, title: string, sourceDocType?: LibraryDocType): LibraryDocType => {
  if (sourceDocType) return sourceDocType;
  const lower = title.toLowerCase();
  if (pdfUrl) return "Báo cáo";
  if (lower.includes("hướng dẫn") || lower.includes("quy trình") || lower.includes("sổ tay")) return "Hướng dẫn";
  if (lower.includes("nghiên cứu") || lower.includes("journal") || lower.includes("science")) return "Nghiên cứu";
  return "Tổng hợp";
};

const inferCrop = (title: string) => {
  const crops = ["lúa", "chuối", "ngô", "mía", "sắn", "điều", "hồ tiêu", "đậu nành", "cà phê", "cà phê chè", "ớt", "khoai tây", "bí xanh", "đậu tương"];
  const lower = title.toLowerCase();
  const found = crops.find((crop) => lower.includes(crop));
  return found ? found.replace(/\b\w/g, (char) => char.toUpperCase()) : null;
};

const inferTags = (title: string, category: string, crop: string | null, sourceLabel?: string) => {
  const base = new Set<string>();
  title
    .split(/[\s,:;()]+/)
    .map((item) => item.trim())
    .filter((item) => item.length >= 3)
    .slice(0, 8)
    .forEach((item) => base.add(item));
  base.add(category);
  if (sourceLabel) base.add(sourceLabel);
  if (crop) base.add(crop);
  return [...base].slice(0, 10);
};

const buildPagedUrl = (source: CrawlSource, page: number) => {
  if (page <= 0) return source.url;
  if (source.mode === "khuyennong") {
    return `${source.url.replace(/\/+$/, "")}/p/${page + 1}`;
  }
  const url = new URL(source.url);
  url.searchParams.set("page", String(page));
  return url.toString();
};

const fetchHtml = async (url: string) => {
  const response = await fetch(url, {
    headers: {
      "user-agent": "TerraformFloraBot/1.0 (+https://terraform-flora.local)",
      accept: "text/html,application/xhtml+xml",
    },
  });

  if (!response.ok) {
    throw new Error(`Không tải được ${url}: ${response.status}`);
  }

  return response.text();
};

const ensureBucket = async () => {
  if (!SHOULD_UPLOAD_PDFS || bucketReady) return;

  const { data: buckets, error: listError } = await supabase.storage.listBuckets();
  if (listError) throw listError;

  if (!buckets.find((bucket) => bucket.name === STORAGE_BUCKET)) {
    const { error: createError } = await supabase.storage.createBucket(STORAGE_BUCKET, {
      public: true,
      fileSizeLimit: 50 * 1024 * 1024,
      allowedMimeTypes: ["application/pdf"],
    });
    if (createError && !createError.message.toLowerCase().includes("already exists")) {
      throw createError;
    }
  }

  bucketReady = true;
};

const uploadPdfToStorage = async (sourcePdfUrl: string, title: string, itemId: string, sourceKey: SourceKey) => {
  if (!SHOULD_UPLOAD_PDFS) return sourcePdfUrl;

  await ensureBucket();

  const response = await fetch(sourcePdfUrl, {
    headers: {
      "user-agent": "TerraformFloraBot/1.0 (+https://terraform-flora.local)",
      accept: "application/pdf,*/*",
    },
  });

  if (!response.ok) {
    throw new Error(`Không tải được PDF ${sourcePdfUrl}: ${response.status}`);
  }

  const bytes = new Uint8Array(await response.arrayBuffer());
  const originalName = sourcePdfUrl.split("/").pop() || `${titleToSlug(title)}.pdf`;
  const fileName = sanitizeFilename(originalName.endsWith(".pdf") ? originalName : `${originalName}.pdf`);
  const path = `${sourceKey}/${itemId}/${fileName}`;

  const { error: uploadError } = await supabase.storage.from(STORAGE_BUCKET).upload(path, bytes, {
    upsert: true,
    contentType: "application/pdf",
    cacheControl: "3600",
  });

  if (uploadError) {
    throw uploadError;
  }

  return supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path).data.publicUrl;
};

const parseArticleListingPage = async (source: CrawlSource, page: number) => {
  const html = await fetchHtml(buildPagedUrl(source, page));
  const $ = cheerio.load(html);

  return $("article[about]")
    .map((index, element) => {
      const about = $(element).attr("about");
      const title = $(element).find(".field--name-title").text().trim();
      return {
        url: makeAbsoluteUrl(about, source.baseUrl),
        title,
        accentClass: ACCENTS[index % ACCENTS.length],
      };
    })
    .get()
    .filter((item) => item.url && item.title) as Array<{ url: string; title: string; accentClass: string }>;
};

const parseLibraryListingPage = async (source: CrawlSource, page: number) => {
  const html = await fetchHtml(buildPagedUrl(source, page));
  const $ = cheerio.load(html);

  return $("a.lib-link")
    .map((index, element) => {
      const href = $(element).attr("href");
      const title = $(element).find(".lib-title").text().trim() || $(element).text().replace(/\s+/g, " ").trim();
      return {
        url: makeAbsoluteUrl(href, source.baseUrl),
        title,
        accentClass: ACCENTS[index % ACCENTS.length],
      };
    })
    .get()
    .filter((item) => item.url && item.title) as Array<{ url: string; title: string; accentClass: string }>;
};

const parseKhuyenNongListingPage = async (source: CrawlSource, page: number) => {
  let html = await fetchHtml(buildPagedUrl(source, 0));

  if (page > 0) {
    const newsId =
      cheerio.load(html)("#dnn_NewsView_Main_ctl00_NewsId").attr("value")?.trim() ||
      html.match(/id="dnn_NewsView_Main_ctl00_NewsId"[^>]*value="(\d+)"/)?.[1] ||
      "28612";
    const categoryId = html.match(/newslistpage\.ashx\?p="\s*\+\s*p\s*\+\s*"&cid=(\d+)/)?.[1] || "145";
    const pageId = html.match(/newslistpage\.ashx\?p="\s*\+\s*p\s*\+\s*"&cid=\d+&pid=(\d+)/)?.[1] || "0";
    const ajaxUrl = `${source.baseUrl}/services/home/newslistpage.ashx?p=${page + 1}&cid=${categoryId}&pid=${pageId}&nid=${newsId}`;
    html = await fetchHtml(ajaxUrl);
  }

  const $ = cheerio.load(html);

  const links = new Map<string, { url: string; title: string; accentClass: string }>();
  let accentIndex = 0;

  $(".topnewstow h2 a, article.boxcate p.kntitle a").each((_, element) => {
    const href = $(element).attr("href");
    const title = $(element).attr("title")?.trim() || $(element).text().replace(/\s+/g, " ").trim();
    const url = makeAbsoluteUrl(href, source.baseUrl);
    if (!url || !title || links.has(url)) return;

    links.set(url, {
      url,
      title,
      accentClass: ACCENTS[accentIndex % ACCENTS.length],
    });
    accentIndex += 1;
  });

  return [...links.values()];
};

const parseArticlePage = async (
  source: CrawlSource,
  url: string,
  category: string,
  accentClass: string,
  featured: boolean,
  sourceType?: LibraryType,
  sourceDocType?: LibraryDocType
): Promise<ScrapedArticle> => {
  const html = await fetchHtml(url);
  const $ = cheerio.load(html);

  $("script, style").remove();

  const title =
    $(".page-title .field--name-title").first().text().trim() ||
    $("meta[property='og:title']").attr("content")?.trim() ||
    $("title").text().replace(/\s+\|.+$/, "").trim();

  const submitted = $(".node__submitted").first().text().trim();
  const publishedAt = normalizeDateTime(submitted);
  const dateLabel = publishedAt ? new Date(publishedAt).toLocaleDateString("vi-VN") : submitted || new Date().toLocaleDateString("vi-VN");

  const contentHtmlRaw =
    $(".node__content .text-formatted").first().html()?.trim() ||
    $(".node__content").first().html()?.trim() ||
    null;
  const contentHtml = contentHtmlRaw ? contentHtmlRaw.replace(/\s{2,}/g, " ").trim() : null;

  const imageUrl =
    makeAbsoluteUrl($("meta[property='og:image']").attr("content"), source.baseUrl) ||
    makeAbsoluteUrl($(".node__content img").first().attr("src"), source.baseUrl);
  const sourcePdfUrl =
    makeAbsoluteUrl($(".file--application-pdf a").first().attr("href"), source.baseUrl) ||
    makeAbsoluteUrl($("a[href$='.pdf']").first().attr("href"), source.baseUrl);
  const pdfUrl = sourcePdfUrl ? await uploadPdfToStorage(sourcePdfUrl, title, createId(url), source.key) : null;

  const plainText = stripHtml(contentHtml ?? "");
  const excerpt =
    plainText.slice(0, 220).trim() ||
    "Bài viết được đồng bộ từ VAAS. Chọn đọc nguồn hoặc mở tệp đính kèm để xem chi tiết.";
  const crop = inferCrop(title);
  const type = inferType(title, category, sourceType);
  const docType = inferDocType(sourcePdfUrl, title, sourceDocType);

  return {
    id: createId(url),
    title,
    category,
    type,
    crop,
    disease: null,
    symptom: null,
    doc_type: docType,
    tags: inferTags(title, category, crop, source.sourceName),
    pdf_url: pdfUrl,
    accent_class: accentClass,
    read_time: `${Math.max(3, Math.round(Math.max(plainText.split(/\s+/).length, 80) / 180))} phút`,
    date_label: dateLabel,
    excerpt,
    featured,
    content_html: contentHtml,
    source_name: source.sourceName,
    source_url: url,
    image_url: imageUrl,
    published_at: publishedAt,
  };
};

const parseLibraryDetailPage = async (
  source: CrawlSource,
  url: string,
  category: string,
  accentClass: string,
  featured: boolean,
  sourceType?: LibraryType,
  sourceDocType?: LibraryDocType
): Promise<ScrapedArticle> => {
  const html = await fetchHtml(url);
  const $ = cheerio.load(html);

  $("script, style").remove();

  const title =
    $(".page-title .field--name-title").first().text().trim() ||
    $(".field--name-title").first().text().trim() ||
    $("title").text().replace(/\s+\|.+$/, "").trim();
  const detailText = $(".node__content").text().replace(/\s+/g, " ").trim();
  const contentHtmlRaw = $(".node__content").first().html()?.trim() || null;
  const contentHtml = contentHtmlRaw ? contentHtmlRaw.replace(/\s{2,}/g, " ").trim() : null;
  const imageUrl =
    makeAbsoluteUrl($("meta[property='og:image']").attr("content"), source.baseUrl) ||
    makeAbsoluteUrl($(".field--name-field-image img, .field--name-field-thumbnail img, .node__content img").first().attr("src"), source.baseUrl);
  const sourcePdfUrl =
    makeAbsoluteUrl($(".lib-file .file--application-pdf a").first().attr("href"), source.baseUrl) ||
    makeAbsoluteUrl($(".file--application-pdf a").first().attr("href"), source.baseUrl) ||
    makeAbsoluteUrl($("a[href$='.pdf']").first().attr("href"), source.baseUrl);
  const pdfUrl = sourcePdfUrl ? await uploadPdfToStorage(sourcePdfUrl, title, createId(url), source.key) : null;
  const publishedFromMeta = $("meta[property='article:published_time']").attr("content")?.trim() || null;
  const publishedAt = publishedFromMeta && !Number.isNaN(new Date(publishedFromMeta).getTime()) ? new Date(publishedFromMeta).toISOString() : null;
  const dateLabel = publishedAt ? new Date(publishedAt).toLocaleDateString("vi-VN") : new Date().toLocaleDateString("vi-VN");
  const excerpt =
    detailText.slice(0, 220).trim() ||
    "Tài liệu thư viện được đồng bộ từ VAAS và có thể mở trực tiếp trên hệ thống.";
  const crop = inferCrop(title);
  const type = inferType(title, category, sourceType);
  const docType = inferDocType(sourcePdfUrl, title, sourceDocType);

  return {
    id: createId(url),
    title,
    category,
    type,
    crop,
    disease: null,
    symptom: null,
    doc_type: docType,
    tags: inferTags(title, category, crop, `${source.sourceName} Library`),
    pdf_url: pdfUrl,
    accent_class: accentClass,
    read_time: `${Math.max(4, Math.round(Math.max(detailText.split(/\s+/).filter(Boolean).length, 140) / 180))} phút`,
    date_label: dateLabel,
    excerpt,
    featured,
    content_html: contentHtml,
    source_name: `${source.sourceName} Library`,
    source_url: url,
    image_url: imageUrl,
    published_at: publishedAt,
  };
};

const normalizeKhuyenNongDate = (value?: string | null) => {
  if (!value) return null;

  const directDate = value.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?)?/i);
  if (directDate) {
    const [, dayOrMonth, monthOrDay, year, hourRaw, minuteRaw, secondRaw, periodRaw] = directDate;
    let day = Number(dayOrMonth);
    let month = Number(monthOrDay);
    let hour = Number(hourRaw ?? "0");
    const minute = Number(minuteRaw ?? "0");
    const second = Number(secondRaw ?? "0");
    const period = periodRaw?.toUpperCase();

    if (period) {
      day = Number(monthOrDay);
      month = Number(dayOrMonth);
      if (period === "PM" && hour < 12) hour += 12;
      if (period === "AM" && hour === 12) hour = 0;
    }

    return new Date(Date.UTC(Number(year), month - 1, day, hour - 7, minute, second)).toISOString();
  }

  const viDate = value.match(/(\d{1,2}):(\d{2}).*?(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (viDate) {
    const [, hour, minute, day, month, year] = viDate;
    return new Date(`${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}T${hour.padStart(2, "0")}:${minute}:00+07:00`).toISOString();
  }

  return null;
};

const parseKhuyenNongDetailPage = async (
  source: CrawlSource,
  url: string,
  category: string,
  accentClass: string,
  featured: boolean,
  sourceType?: LibraryType,
  sourceDocType?: LibraryDocType
): Promise<ScrapedArticle> => {
  const html = await fetchHtml(url);
  const $ = cheerio.load(html);

  $("script, style").remove();

  const title =
    $(".post-title").first().text().trim() ||
    $("meta[property='og:title']").attr("content")?.trim() ||
    $("title").text().replace(/\s+\|.+$/, "").trim();
  const summary = $(".postsummary").first().text().replace(/\s+/g, " ").trim();
  const contentHtmlRaw =
    $(".post-content").first().html()?.trim() ||
    $("div[itemprop='articleBody']").first().html()?.trim() ||
    null;
  const contentHtml = contentHtmlRaw ? contentHtmlRaw.replace(/\s{2,}/g, " ").trim() : null;
  const publishedText = $(".lbPublishedDate").first().text().replace(/\s+/g, " ").trim();
  const publishedAt =
    normalizeKhuyenNongDate($("meta[property='article:published_time']").attr("content")?.trim()) ||
    normalizeKhuyenNongDate(publishedText);
  const dateLabel = publishedAt ? new Date(publishedAt).toLocaleDateString("vi-VN") : publishedText || new Date().toLocaleDateString("vi-VN");
  const imageUrl =
    makeAbsoluteUrl($("meta[property='og:image']").attr("content"), source.baseUrl) ||
    makeAbsoluteUrl($(".post-content img").first().attr("src"), source.baseUrl);
  const sourcePdfUrl =
    makeAbsoluteUrl($(".atfile a[href$='.pdf']").first().attr("href"), source.baseUrl) ||
    makeAbsoluteUrl($(".post-content a[href$='.pdf']").first().attr("href"), source.baseUrl);
  const pdfUrl = sourcePdfUrl ? await uploadPdfToStorage(sourcePdfUrl, title, createId(url), source.key) : null;
  const plainText = stripHtml(contentHtml ?? "");
  const excerpt =
    summary ||
    plainText.slice(0, 220).trim() ||
    "Bài viết được đồng bộ từ Cổng Khuyến nông Việt Nam.";
  const crop = inferCrop(title);
  const type = inferType(title, category, sourceType);
  const docType = inferDocType(sourcePdfUrl, title, sourceDocType);

  return {
    id: createId(url),
    title,
    category,
    type,
    crop,
    disease: null,
    symptom: null,
    doc_type: docType,
    tags: inferTags(title, category, crop, source.sourceName),
    pdf_url: pdfUrl,
    accent_class: accentClass,
    read_time: `${Math.max(3, Math.round(Math.max(plainText.split(/\s+/).filter(Boolean).length, 120) / 180))} phút`,
    date_label: dateLabel,
    excerpt,
    featured,
    content_html: contentHtml,
    source_name: source.sourceName,
    source_url: url,
    image_url: imageUrl,
    published_at: publishedAt,
  };
};

const parseSourcePage = (source: CrawlSource, page: number) => {
  if (source.mode === "library") {
    return parseLibraryListingPage(source, page);
  }
  if (source.mode === "khuyennong") {
    return parseKhuyenNongListingPage(source, page);
  }
  return parseArticleListingPage(source, page);
};

const parseSourceDetail = (source: CrawlSource, link: { url: string; accentClass: string }) => {
  if (source.mode === "library") {
    return parseLibraryDetailPage(source, link.url, source.category, link.accentClass, source.featured, source.type, source.docType);
  }
  if (source.mode === "khuyennong") {
    return parseKhuyenNongDetailPage(source, link.url, source.category, link.accentClass, source.featured, source.type, source.docType);
  }
  return parseArticlePage(source, link.url, source.category, link.accentClass, source.featured, source.type, source.docType);
};

const main = async () => {
  const imported: ScrapedArticle[] = [];
  const seen = new Set<string>();
  const activeSources = SOURCE_FILTER
    ? CATEGORY_SOURCES.filter(
        (source) =>
          source.key.toLowerCase() === SOURCE_FILTER ||
          source.sourceName.toLowerCase().includes(SOURCE_FILTER) ||
          source.category.toLowerCase().includes(SOURCE_FILTER)
      )
    : CATEGORY_SOURCES;

  if (activeSources.length === 0) {
    throw new Error(`Khong tim thay source phu hop voi --source=${SOURCE_FILTER}`);
  }

  for (const source of activeSources) {
    if (imported.length >= IMPORT_LIMIT) break;

    const totalPages = source.pages ?? PAGE_LIMIT;
    console.log(`Dang quet danh muc: ${source.url} (${totalPages} trang, mode=${source.mode})`);

    for (let page = 0; page < totalPages; page += 1) {
      if (imported.length >= IMPORT_LIMIT) break;

      const links = await parseSourcePage(source, page);
      if (links.length === 0) {
        console.log(`Khong con du lieu o trang ${page + 1} cua ${source.category}`);
        break;
      }

      console.log(`- ${source.category}: trang ${page + 1}, ${links.length} muc`);

      for (const link of links) {
        if (!link.url || seen.has(link.url) || imported.length >= IMPORT_LIMIT) continue;
        seen.add(link.url);

        try {
          const parsed = await parseSourceDetail(source, link);
          imported.push(parsed);
          console.log(`Imported: [${source.category}] ${parsed.title}${parsed.pdf_url ? " + PDF" : ""}`);
        } catch (error) {
          console.warn(`Bo qua ${link.url}`, error);
        }

        await delay(source.mode === "library" ? 900 : 500);
      }
    }
  }

  if (imported.length === 0) {
    throw new Error("Khong lay duoc tai lieu nao tu cac nguon da cau hinh.");
  }

  const { error } = await supabase.from("library_articles").upsert(imported, { onConflict: "source_url" });
  if (error) throw error;

  console.log(`Da import ${imported.length} tai lieu vao library_articles.`);
  if (SHOULD_UPLOAD_PDFS) {
    console.log(`PDF duoc dong bo sang bucket public: ${STORAGE_BUCKET}`);
  }
};

void main().catch((error) => {
  console.error(error);
  process.exit(1);
});
