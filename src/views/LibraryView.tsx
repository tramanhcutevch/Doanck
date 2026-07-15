import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Bookmark,
  Clock,
  ExternalLink,
  Library,
  Maximize2,
  Search,
  Share2,
  Sparkles,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { getLibraryBookmarks, LibraryArticle, loadLibraryArticles, toggleLibraryBookmark } from "../services/libraryService";
import libraryVisual1 from "../../anh/thuvien1.jpg";
import libraryVisual2 from "../../anh/thuvien2.jpg";
import libraryVisual3 from "../../anh/thuvien.jpg";
import libraryVisual4 from "../../anh/sinhtruong2.jpg";
import libraryVisual5 from "../../anh/sinhtruong.png";
import libraryVisual6 from "../../anh/grape.jpeg";
import libraryVisual7 from "../../anh/apple.jpeg";
import libraryVisual8 from "../../anh/dau.jpeg";
import libraryVisual9 from "../../anh/ngô.jpeg";
import libraryVisual10 from "../../anh/benh-tren-cay-ca-chua-4.jpg";
import libraryVisual11 from "../../anh/ricebacteria.jpeg";
import libraryVisual12 from "../../anh/tungro.webp";
import { LocalizedDictionary, useI18n } from "../i18n";

const libraryText: LocalizedDictionary = {
  cropManual: { vi: "Sổ tay cây trồng", en: "Crop handbook", ja: "作物ハンドブック" },
  technicalDocs: { vi: "Tài liệu kỹ thuật", en: "Technical documents", ja: "技術資料" },
  fieldLookup: { vi: "Tra cứu hiện trường", en: "Field lookup", ja: "現場検索" },
  illustration: { vi: "Ảnh minh họa", en: "Illustration", ja: "参考画像" },
  agricultureLibrary: { vi: "Thư viện nông nghiệp", en: "Agriculture library", ja: "農業ライブラリ" },
  heroTitleA: { vi: "Tra cứu tri thức canh tác", en: "Search cultivation knowledge", ja: "栽培知識を検索" },
  heroTitleB: { vi: "gọn, nhanh, dễ đọc", en: "clean, fast, easy to read", ja: "簡潔・高速・読みやすく" },
  heroCopy: {
    vi: "Tập hợp bài viết, PDF, kỹ thuật cây trồng, sâu bệnh và tài liệu thực địa để người dùng tìm đúng nội dung cần xử lý trong vài thao tác.",
    en: "Articles, PDFs, crop techniques, pest knowledge, and field documents are organized so users can find the right answer in a few steps.",
    ja: "記事、PDF、作物技術、病害虫、現場資料を整理し、数ステップで必要な内容を見つけられます。",
  },
  documents: { vi: "Tài liệu", en: "Documents", ja: "資料" },
  categories: { vi: "Danh mục", en: "Categories", ja: "カテゴリ" },
  dataSource: { vi: "Nguồn dữ liệu", en: "Data source", ja: "データソース" },
  explore: { vi: "Khám phá kiến thức", en: "Explore knowledge", ja: "知識を探索" },
  searchTitle: { vi: "Tìm theo cây, bệnh, triệu chứng hoặc tài liệu", en: "Search by crop, disease, symptom, or document", ja: "作物、病害、症状、資料で検索" },
  currentSource: { vi: "Nguồn hiện tại", en: "Current source", ja: "現在のソース" },
  crawled: { vi: "Supabase / bài viết đã crawl", en: "Supabase / crawled articles", ja: "Supabase / 収集記事" },
  localFallback: { vi: "Dữ liệu fallback local", en: "Local fallback data", ja: "ローカル代替データ" },
  searchPlaceholder: { vi: "Tìm kiếm theo từ khóa...", en: "Search by keyword...", ja: "キーワードで検索..." },
  all: { vi: "Tất cả", en: "All", ja: "すべて" },
  docType: { vi: "Loại tài liệu", en: "Document type", ja: "資料タイプ" },
  contentType: { vi: "Kiểu nội dung", en: "Content type", ja: "コンテンツ種別" },
  crop: { vi: "Cây trồng", en: "Crop", ja: "作物" },
  disease: { vi: "Bệnh", en: "Disease", ja: "病害" },
  results: { vi: "kết quả", en: "results", ja: "件" },
  sortNewest: { vi: "Sắp xếp: mới nhất", en: "Sort: newest", ja: "並び替え: 新しい順" },
  saved: { vi: "Đã lưu", en: "Saved", ja: "保存済み" },
  save: { vi: "Lưu", en: "Save", ja: "保存" },
  readOnline: { vi: "Đọc online", en: "Read online", ja: "オンラインで読む" },
  core: { vi: "Cốt lõi chức năng", en: "Core features", ja: "主な機能" },
  fieldReady: { vi: "Thư viện dùng được ngay trên đồng ruộng", en: "A library ready for field use", ja: "現場ですぐ使えるライブラリ" },
  core1: { vi: "Tra cứu theo từ khóa, cây trồng, bệnh và triệu chứng", en: "Search by keyword, crop, disease, and symptom", ja: "キーワード、作物、病害、症状で検索" },
  core2: { vi: "Gợi ý từ khóa khi nhập", en: "Keyword suggestions while typing", ja: "入力中のキーワード候補" },
  core3: { vi: "Lọc theo danh mục, loại tài liệu và kiểu nội dung", en: "Filter by category, document type, and content type", ja: "カテゴリ、資料タイプ、コンテンツ種別で絞り込み" },
  core4: { vi: "Đọc online trực tiếp PDF, không cần tải", en: "Read PDFs online without downloading", ja: "PDFをダウンロードせずオンライン閲覧" },
  readerMode: { vi: "Reader Mode", en: "Reader Mode", ja: "リーダーモード" },
  openPdf: { vi: "Mở PDF", en: "Open PDF", ja: "PDFを開く" },
  openSource: { vi: "Mở nguồn", en: "Open source", ja: "元ソースを開く" },
  cropLabel: { vi: "Cây", en: "Crop", ja: "作物" },
  diseaseLabel: { vi: "Bệnh", en: "Disease", ja: "病害" },
  symptomLabel: { vi: "Triệu chứng", en: "Symptom", ja: "症状" },
  pdfShowing: { vi: "Đang hiển thị file PDF đính kèm của tài liệu này.", en: "Showing the attached PDF for this document.", ja: "この資料に添付されたPDFを表示しています。" },
  openNewTab: { vi: "Mở tab mới", en: "Open new tab", ja: "新しいタブで開く" },
  noEmbedded: { vi: "Bài viết này chưa có nội dung nhúng. Hãy mở nguồn gốc để xem đầy đủ.", en: "This article has no embedded content yet. Open the source to view the full version.", ja: "この記事には埋め込みコンテンツがありません。全文は元ソースで確認してください。" },
  related: { vi: "Tài liệu liên quan", en: "Related documents", ja: "関連資料" },
};

const libraryTermText: LocalizedDictionary = {
  "Tất cả": { vi: "Tất cả", en: "All", ja: "すべて" },
  "Tin tức nông nghiệp": { vi: "Tin tức nông nghiệp", en: "Agriculture news", ja: "農業ニュース" },
  "Kỹ thuật trồng trọt": { vi: "Kỹ thuật trồng trọt", en: "Cultivation techniques", ja: "栽培技術" },
  "Nông nghiệp trong nước": { vi: "Nông nghiệp trong nước", en: "Domestic agriculture", ja: "国内農業" },
  "Nông nghiệp thường thức": { vi: "Nông nghiệp thường thức", en: "Agriculture basics", ja: "農業基礎知識" },
  "Nông nghiệp nước ngoài": { vi: "Nông nghiệp nước ngoài", en: "International agriculture", ja: "海外農業" },
  "Cây trồng": { vi: "Cây trồng", en: "Crops", ja: "作物" },
  "Sâu bệnh": { vi: "Sâu bệnh", en: "Pests and diseases", ja: "病害虫" },
  "Kỹ thuật": { vi: "Kỹ thuật", en: "Technique", ja: "技術" },
  "Quy trình": { vi: "Quy trình", en: "Process", ja: "手順" },
  "Tổng quan": { vi: "Tổng quan", en: "Overview", ja: "概要" },
  "Chính sách": { vi: "Chính sách", en: "Policy", ja: "政策" },
  "Tổng hợp": { vi: "Tổng hợp", en: "General", ja: "総合" },
  "Bài viết": { vi: "Bài viết", en: "Article", ja: "記事" },
  "Tài liệu": { vi: "Tài liệu", en: "Document", ja: "資料" },
  "PDF": { vi: "PDF", en: "PDF", ja: "PDF" },
  "Lúa": { vi: "Lúa", en: "Rice", ja: "稲" },
  "Cà chua": { vi: "Cà chua", en: "Tomato", ja: "トマト" },
  "Cây ăn trái": { vi: "Cây ăn trái", en: "Fruit trees", ja: "果樹" },
  "Ngô": { vi: "Ngô", en: "Corn", ja: "トウモロコシ" },
  "Nho": { vi: "Nho", en: "Grape", ja: "ブドウ" },
  "Táo": { vi: "Táo", en: "Apple", ja: "リンゴ" },
  "Khoai tây": { vi: "Khoai tây", en: "Potato", ja: "ジャガイモ" },
  "Xoài": { vi: "Xoài", en: "Mango", ja: "マンゴー" },
  "Dâu": { vi: "Dâu", en: "Strawberry", ja: "イチゴ" },
  "Rầy nâu": { vi: "Rầy nâu", en: "Brown planthopper", ja: "トビイロウンカ" },
  "Sâu cuốn lá": { vi: "Sâu cuốn lá", en: "Leaf folder", ja: "葉巻虫" },
  "Đạo ôn": { vi: "Đạo ôn", en: "Rice blast", ja: "いもち病" },
  "Tungro": { vi: "Tungro", en: "Tungro", ja: "ツングロ病" },
  "Bạc lá": { vi: "Bạc lá", en: "Bacterial leaf blight", ja: "白葉枯病" },
  "Đốm lá": { vi: "Đốm lá", en: "Leaf spot", ja: "葉斑病" },
  "Thán thư": { vi: "Thán thư", en: "Anthracnose", ja: "炭疽病" },
  "Sương mai": { vi: "Sương mai", en: "Downy mildew", ja: "べと病" },
  "Xoăn lá": { vi: "Xoăn lá", en: "Leaf curl", ja: "葉巻症状" },
  "Héo xanh": { vi: "Héo xanh", en: "Bacterial wilt", ja: "青枯病" },
};

const libraryVisuals = [
  {
    src: libraryVisual1,
    labelKey: "cropManual",
  },
  {
    src: libraryVisual2,
    labelKey: "technicalDocs",
  },
  {
    src: libraryVisual3,
    labelKey: "fieldLookup",
  },
];

const libraryCardVisuals = [
  libraryVisual1,
  libraryVisual2,
  libraryVisual3,
  libraryVisual4,
  libraryVisual5,
  libraryVisual6,
  libraryVisual7,
  libraryVisual8,
  libraryVisual9,
  libraryVisual10,
  libraryVisual11,
  libraryVisual12,
];

const getArticleVisual = (article: LibraryArticle, index: number) => ({
  src: article.imageUrl || libraryCardVisuals[index % libraryCardVisuals.length],
  label: article.imageUrl ? article.title : `Illustration ${index + 1}`,
});

const stripHtml = (value?: string) =>
  (value || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

const shouldPreferPdfReader = (article: LibraryArticle | null) => {
  if (!article?.pdfUrl) return false;
  const plainContent = stripHtml(article.contentHtml);
  if (!plainContent) return true;

  const placeholderPhrases = [
    "để xem chi tiết vui lòng kích vào file đính kèm",
    "để xem chi tiết vui lòng click vào file đính kèm",
    "vui lòng kích vào file đính kèm",
    "vui lòng click vào file đính kèm",
  ];

  const normalized = plainContent.toLowerCase();
  return placeholderPhrases.some((phrase) => normalized.includes(phrase)) || normalized.length < 120;
};

const LibraryView = () => {
  const { language } = useI18n();
  const tt = (key: string) => libraryText[key]?.[language] ?? libraryText[key]?.vi ?? key;
  const displayOption = (value?: string | null) => (value ? libraryTermText[value]?.[language] ?? value : "");
  const [articles, setArticles] = useState<LibraryArticle[]>([]);
  const [dataSource, setDataSource] = useState<"supabase" | "local">("local");
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("Tất cả");
  const [selectedType, setSelectedType] = useState("Tất cả");
  const [selectedCrop, setSelectedCrop] = useState("Tất cả");
  const [selectedDisease, setSelectedDisease] = useState("Tất cả");
  const [selectedDocType, setSelectedDocType] = useState("Tất cả");
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<LibraryArticle | null>(null);
  const [readerArticle, setReaderArticle] = useState<LibraryArticle | null>(null);

  useEffect(() => {
    setBookmarks(getLibraryBookmarks());
    void loadLibraryArticles().then((result) => {
      setArticles(result.articles);
      setSelectedArticle(result.articles[0] ?? null);
      setDataSource(result.source);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return undefined;

    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;

    if (readerArticle) {
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
      window.dispatchEvent(new CustomEvent("app-overlay-change", { detail: { hideNavbar: true } }));
    } else {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
      window.dispatchEvent(new CustomEvent("app-overlay-change", { detail: { hideNavbar: false } }));
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && readerArticle) {
        setReaderArticle(null);
      }
    };

    if (readerArticle) {
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
      window.dispatchEvent(new CustomEvent("app-overlay-change", { detail: { hideNavbar: false } }));
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [readerArticle]);

  const categories: string[] = ["Tất cả", ...new Set<string>(articles.map((article) => article.category))];
  const types: string[] = ["Tất cả", ...new Set<string>(articles.map((article) => article.type))];
  const crops: string[] = ["Tất cả", ...new Set<string>(articles.filter((a) => a.crop).map((article) => article.crop as string))];
  const diseases: string[] = ["Tất cả", ...new Set<string>(articles.filter((a) => a.disease).map((article) => article.disease as string))];
  const docTypes: string[] = ["Tất cả", ...new Set<string>(articles.map((article) => article.docType))];

  const keywords = useMemo(() => {
    const all = new Set<string>();
    articles.forEach((article) => {
      article.title.split(" ").forEach((w) => all.add(w));
      article.tags.forEach((tag) => all.add(tag));
    });
    return Array.from(all);
  }, [articles]);

  const suggestions = searchTerm
    ? keywords
        .filter((kw) => kw.toLowerCase().includes(searchTerm.toLowerCase()))
        .slice(0, 6)
    : [];

  const filteredArticles = useMemo(
    () =>
      articles.filter((article) => {
        const searchLower = searchTerm.toLowerCase();
        const matchSearch =
          searchTerm === "" ||
          article.title.toLowerCase().includes(searchLower) ||
          article.excerpt.toLowerCase().includes(searchLower) ||
          article.tags.some((tag) => tag.toLowerCase().includes(searchLower));

        const filterCategory = activeCategory === "Tất cả" || article.category === activeCategory;
        const filterType = selectedType === "Tất cả" || article.type === selectedType;
        const filterCrop = selectedCrop === "Tất cả" || article.crop === selectedCrop;
        const filterDisease = selectedDisease === "Tất cả" || article.disease === selectedDisease;
        const filterDocType = selectedDocType === "Tất cả" || article.docType === selectedDocType;

        return matchSearch && filterCategory && filterType && filterCrop && filterDisease && filterDocType;
      }),
    [articles, searchTerm, activeCategory, selectedType, selectedCrop, selectedDisease, selectedDocType]
  );

  const sortedArticles = [...filteredArticles].sort((a, b) => (a.date < b.date ? 1 : -1));

  const suggestedArticles = selectedArticle
    ? articles.filter(
        (article) =>
          article.id !== selectedArticle.id &&
          (article.crop === selectedArticle.crop || article.disease === selectedArticle.disease || article.type === selectedArticle.type)
      )
    : [];

  const readerShouldShowPdf = shouldPreferPdfReader(readerArticle);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f6f7ef] pb-24 pt-24 text-[#17211b]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-[linear-gradient(115deg,#edf7ec_0%,#f8fbf6_48%,#eef3df_100%)]" />
      <div className="pointer-events-none absolute left-0 top-36 h-px w-full bg-emerald-900/10" />
      <div className="pointer-events-none absolute left-[8vw] top-0 h-full w-px bg-emerald-900/10" />
      <div className="pointer-events-none absolute right-[14vw] top-0 h-full w-px bg-emerald-900/10" />

      <div className="relative z-10 mb-7">
        <div className="mx-auto max-w-7xl px-6">
          <section className="relative overflow-hidden border border-emerald-950/10 border-l-4 border-l-emerald-700 bg-[#fffdf7]/92 shadow-[0_24px_70px_rgba(33,48,37,0.08)] backdrop-blur md:rounded-[22px]">
            <div className="absolute left-0 top-0 h-full w-16 bg-[repeating-linear-gradient(180deg,rgba(5,95,70,0.08)_0,rgba(5,95,70,0.08)_1px,transparent_1px,transparent_14px)]" />
            <div className="relative grid gap-8 p-6 pl-8 md:p-8 md:pl-10 lg:grid-cols-[minmax(0,0.95fr)_520px] lg:p-10">
              <div className="flex min-h-[310px] flex-col justify-between">
                <div>
                  <div className="inline-flex items-center gap-2 border-b-2 border-emerald-700 pb-2 text-xs font-black uppercase tracking-[0.24em] text-emerald-800">
                    <Library className="h-4 w-4" />
                    {tt("agricultureLibrary")}
                  </div>
                  <h1 className="mt-6 max-w-3xl text-4xl font-black leading-[0.96] tracking-tight text-[#14231b] md:text-6xl">
                    {tt("heroTitleA")}
                    <span className="block text-[#049a68]">{tt("heroTitleB")}</span>
                  </h1>
                  <p className="mt-6 max-w-2xl border-l border-emerald-900/20 pl-5 text-sm leading-7 text-slate-600 md:text-base">
                    {tt("heroCopy")}
                  </p>
                </div>

                <div className="mt-7 flex flex-wrap divide-x divide-emerald-950/15 border-y border-emerald-950/15 bg-[#f4f8ed]">
                  {[
                    { value: articles.length, label: tt("documents") },
                    { value: categories.length - 1, label: tt("categories") },
                    { value: dataSource === "supabase" ? "Live" : "Local", label: tt("dataSource") },
                  ].map((item) => (
                    <div key={item.label} className="min-w-[150px] flex-1 px-5 py-4">
                      <p className="text-3xl font-black text-[#14231b]">{item.value}</p>
                      <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.24em] text-slate-500">{item.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="relative min-h-[320px]">
                <div className="absolute inset-x-8 bottom-2 h-12 rounded-full bg-emerald-950/10 blur-2xl" />
                <div className="absolute left-0 top-7 h-[260px] w-[58%] overflow-hidden rounded-[8px] border-[8px] border-white shadow-[0_18px_38px_rgba(15,29,23,0.18)]">
                  <img src={libraryVisuals[0].src} alt={tt(libraryVisuals[0].labelKey)} className="h-full w-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
                  <p className="absolute bottom-5 left-5 right-5 text-2xl font-black text-white">{tt(libraryVisuals[0].labelKey)}</p>
                </div>
                <div className="absolute right-0 top-0 h-[155px] w-[44%] rotate-2 overflow-hidden rounded-[8px] border-[8px] border-white shadow-[0_18px_38px_rgba(15,29,23,0.16)]">
                  <img src={libraryVisuals[1].src} alt={tt(libraryVisuals[1].labelKey)} className="h-full w-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/5 to-transparent" />
                  <p className="absolute bottom-4 left-4 right-4 text-sm font-black uppercase tracking-[0.16em] text-white">{tt(libraryVisuals[1].labelKey)}</p>
                </div>
                <div className="absolute bottom-0 right-6 h-[165px] w-[42%] -rotate-1 overflow-hidden rounded-[8px] border-[8px] border-white shadow-[0_18px_38px_rgba(15,29,23,0.16)]">
                  <img src={libraryVisuals[2].src} alt={tt(libraryVisuals[2].labelKey)} className="h-full w-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/5 to-transparent" />
                  <p className="absolute bottom-4 left-4 right-4 text-sm font-black uppercase tracking-[0.16em] text-white">{tt(libraryVisuals[2].labelKey)}</p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-6">
        <section className="mb-6 overflow-visible border border-emerald-950/10 bg-[#173f31] text-white shadow-[0_18px_50px_rgba(15,29,23,0.12)] md:rounded-[18px]">
          <div className="grid gap-5 p-5 lg:grid-cols-[minmax(0,1fr)_460px] lg:items-center">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-emerald-200">{tt("explore")}</p>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-white md:text-3xl">{tt("searchTitle")}</h2>
              <p className="mt-2 text-sm leading-6 text-white/65">
                {tt("currentSource")}: <span className="font-bold text-emerald-100">{dataSource === "supabase" ? tt("crawled") : tt("localFallback")}</span>
              </p>
            </div>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-emerald-700" />
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={tt("searchPlaceholder")}
                className="w-full rounded-[12px] border border-white/10 bg-white py-4 pl-12 pr-4 text-slate-900 outline-none transition-all placeholder:text-slate-500 focus:border-emerald-300 focus:ring-4 focus:ring-emerald-300/20"
              />
              {suggestions.length > 0 && (
                <ul className="absolute z-20 mt-2 max-h-52 w-full overflow-auto rounded-[12px] border border-emerald-950/10 bg-white p-2 text-sm shadow-lg">
                  {suggestions.map((item) => (
                    <li
                      key={item}
                      className="cursor-pointer rounded-[8px] px-3 py-2 text-slate-700 transition-colors hover:bg-emerald-50 hover:text-emerald-700"
                      onClick={() => setSearchTerm(item)}
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </section>

        <div className="mb-5 flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-emerald-950/10 bg-transparent pb-3">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`border-b-2 px-1 py-2 text-xs font-black uppercase tracking-[0.18em] transition-all ${
                activeCategory === category
                  ? "border-emerald-700 text-emerald-800"
                  : "border-transparent text-slate-500 hover:border-emerald-300 hover:text-emerald-800"
              }`}
            >
              {displayOption(category)}
            </button>
          ))}
        </div>

        <div className="mb-8 grid gap-3 border border-emerald-950/10 bg-[#fffdf7] p-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: tt("docType"), value: selectedDocType, options: docTypes, setter: setSelectedDocType },
            { label: tt("contentType"), value: selectedType, options: types, setter: setSelectedType },
            { label: tt("crop"), value: selectedCrop, options: crops, setter: setSelectedCrop },
            { label: tt("disease"), value: selectedDisease, options: diseases, setter: setSelectedDisease },
          ].map(({ label, value, options, setter }) => (
            <label key={label} className="block">
              <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">{label}</span>
              <select
                value={value}
                onChange={(e) => setter(e.target.value)}
                className="w-full rounded-[10px] border border-emerald-950/10 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition-colors focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10"
              >
                {options.map((opt) => (
                  <option key={opt} value={opt} className="bg-white text-slate-900">
                    {displayOption(opt)}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>

        <div className="grid gap-8">
          <div>
            <div className="mb-6 flex items-center justify-between border-y border-emerald-950/10 bg-transparent py-4">
              <span className="text-sm font-bold uppercase tracking-wider text-slate-600">{sortedArticles.length} {tt("results")}</span>
              <span className="text-sm font-black text-emerald-800">{tt("sortNewest")}</span>
            </div>
            {loading && <div className="mb-5 h-24 animate-pulse rounded-[24px] border border-emerald-950/10 bg-white" />}
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {sortedArticles.map((article, index) => {
                const isBookmarked = bookmarks.includes(article.id);
                const visual = getArticleVisual(article, index);
                return (
                  <motion.div
                    key={article.id}
                    initial={{ opacity: 0, y: 15 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    className="group overflow-hidden border border-emerald-950/10 bg-[#fffdf7] shadow-[0_8px_28px_rgba(33,48,37,0.06)] transition-all duration-300 hover:-translate-y-1 hover:border-emerald-700/25 hover:shadow-[0_20px_45px_rgba(33,48,37,0.12)] md:rounded-[14px]"
                  >
                    <div className="relative h-40 overflow-hidden border-b border-emerald-950/10">
                      <img
                        src={visual.src}
                        alt={visual.label}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
                      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between gap-3">
                        <span className="rounded-full bg-white/90 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-900">{displayOption(article.type)}</span>
                        <span className="rounded-full bg-black/45 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white/80">{article.readTime}</span>
                      </div>
                    </div>

                    <div className="p-5">
                      <div className="mb-4 flex items-center justify-between">
                        <span className="border-b border-emerald-700 pb-1 text-xs font-black uppercase tracking-[0.16em] text-emerald-800">{displayOption(article.category)}</span>
                        <button
                          onClick={() => setBookmarks(toggleLibraryBookmark(article.id))}
                          className={`rounded-[8px] px-3 py-1 text-xs font-bold transition-all ${
                            isBookmarked ? "bg-emerald-800 text-white shadow-lg" : "bg-slate-100 text-slate-600 hover:bg-emerald-800 hover:text-white"
                          }`}
                        >
                          {isBookmarked ? tt("saved") : tt("save")}
                        </button>
                      </div>
                      <h3 className="mb-3 line-clamp-2 cursor-pointer text-xl font-black text-[#17211b] transition-colors hover:text-emerald-800">
                        {article.title}
                      </h3>
                      <p className="mb-4 line-clamp-3 text-sm leading-6 text-slate-600">{article.excerpt}</p>
                      <div className="mb-4 flex flex-wrap gap-2">
                        <span className="rounded-[6px] bg-slate-100 px-3 py-1 text-xs text-slate-700">{displayOption(article.docType)}</span>
                        {article.crop && <span className="rounded-[6px] bg-emerald-100 px-3 py-1 text-xs text-emerald-700">{displayOption(article.crop)}</span>}
                        {article.disease && <span className="rounded-[6px] bg-red-100 px-3 py-1 text-xs text-red-700">{displayOption(article.disease)}</span>}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setSelectedArticle(article);
                            setReaderArticle(article);
                          }}
                          className="inline-flex flex-1 items-center justify-center gap-2 rounded-[10px] bg-emerald-800 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-emerald-700"
                        >
                          {tt("readOnline")}
                          <ArrowRight className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedArticle(article);
                            setReaderArticle(article);
                          }}
                          className="inline-flex items-center gap-2 rounded-[10px] bg-slate-100 px-3 py-3 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-200"
                        >
                          <Maximize2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-10 grid gap-5 border border-emerald-950/10 bg-[#173f31] p-6 text-white md:grid-cols-[0.8fr_1.2fr] md:rounded-[18px]">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-emerald-300">{tt("core")}</p>
            <h3 className="mt-3 text-3xl font-black tracking-tight">{tt("fieldReady")}</h3>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              tt("core1"),
              tt("core2"),
              tt("core3"),
              tt("core4"),
            ].map((item) => (
              <div key={item} className="rounded-[10px] border border-white/10 bg-white/[0.06] p-4 text-sm leading-6 text-white/70">
                {item}
              </div>
            ))}
          </div>
        </div>

        <AnimatePresence>
          {readerArticle && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[220] overflow-y-auto bg-black/40 p-2 md:p-4 backdrop-blur-sm"
              onClick={(e) => {
                if (e.target === e.currentTarget) {
                  setReaderArticle(null);
                }
              }}
            >
              <div className="flex min-h-full items-center justify-center">
                <motion.div
                  initial={{ y: 20, scale: 0.95 }}
                  animate={{ y: 0, scale: 1 }}
                  exit={{ y: 20, scale: 0.95 }}
                  transition={{ type: "spring", damping: 25, stiffness: 300 }}
                  className="my-2 flex min-h-[calc(100vh-1rem)] w-full max-w-[98vw] flex-col overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-2xl md:my-4 md:min-h-[calc(100vh-2rem)] md:max-w-[96vw] md:rounded-[32px] lg:max-h-[calc(100vh-2rem)] lg:min-h-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div
                    className={`flex justify-between gap-4 border-b border-slate-300 bg-slate-50 ${
                      readerShouldShowPdf ? "items-center px-5 py-3" : "items-start px-6 py-5"
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-emerald-700">{tt("readerMode")}</p>
                      <h2 className={`max-w-4xl font-black tracking-tight text-slate-900 ${readerShouldShowPdf ? "mt-1 line-clamp-2 text-xl md:text-2xl" : "mt-2 text-2xl md:text-3xl"}`}>
                        {readerArticle.title}
                      </h2>
                      <p className={`${readerShouldShowPdf ? "mt-1 text-xs" : "mt-3 text-sm"} text-slate-700`}>
                        {displayOption(readerArticle.category)} • {displayOption(readerArticle.type)} • {readerArticle.readTime}
                        {readerArticle.sourceName ? ` • ${readerArticle.sourceName}` : ""}
                      </p>
                    </div>
                    <div className={`flex shrink-0 items-center ${readerShouldShowPdf ? "gap-2" : "gap-3"}`}>
                      {readerArticle.pdfUrl && (
                        <a
                          href={readerArticle.pdfUrl}
                          target="_blank"
                          rel="noreferrer"
                          className={`inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-slate-50 font-bold uppercase text-slate-900 hover:bg-slate-100 transition-colors ${
                            readerShouldShowPdf ? "px-3 py-2 text-[11px] tracking-[0.18em]" : "px-4 py-3 text-xs tracking-[0.22em]"
                          }`}
                        >
                          {tt("openPdf")}
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      )}
                      {readerArticle.sourceUrl && (
                        <a
                          href={readerArticle.sourceUrl}
                          target="_blank"
                          rel="noreferrer"
                          className={`inline-flex items-center gap-2 rounded-xl bg-emerald-500 font-bold uppercase text-black hover:bg-emerald-400 transition-colors ${
                            readerShouldShowPdf ? "px-3 py-2 text-[11px] tracking-[0.18em]" : "px-4 py-3 text-xs tracking-[0.22em]"
                          }`}
                        >
                          {tt("openSource")}
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      )}
                      <button
                        onClick={() => setReaderArticle(null)}
                        className="rounded-xl border border-slate-300 bg-slate-50 p-3 text-slate-600 hover:bg-slate-100 transition-colors"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                  <div
                    className={`min-h-0 flex-1 ${
                      readerShouldShowPdf ? "grid gap-0 lg:grid-cols-[minmax(0,1fr)_280px]" : "grid gap-0 lg:grid-cols-[minmax(0,0.72fr)_minmax(280px,0.28fr)]"
                    }`}
                  >
                    <div
                      className={`min-h-0 bg-slate-50 ${readerShouldShowPdf ? "px-3 py-3 md:px-4 md:py-4" : "custom-scrollbar overflow-y-auto overscroll-contain px-4 py-4 md:px-6 md:py-5"} ${
                        readerShouldShowPdf ? "flex h-full flex-col overflow-hidden" : ""
                      }`}
                    >
                      <div className={`mx-auto w-full ${readerShouldShowPdf ? "flex min-h-0 h-full max-w-none flex-1 flex-col" : "max-w-3xl"}`}>
                        <div className={`flex flex-wrap gap-2 ${readerShouldShowPdf ? "mb-3" : "mb-6"}`}>
                          {readerArticle.docType && <span className="rounded-full bg-slate-50 px-3 py-1 text-xs text-slate-700">{displayOption(readerArticle.docType)}</span>}
                          {readerArticle.crop && <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs text-emerald-800">{tt("cropLabel")}: {displayOption(readerArticle.crop)}</span>}
                          {readerArticle.disease && <span className="rounded-full bg-red-500/15 px-3 py-1 text-xs text-red-800">{tt("diseaseLabel")}: {displayOption(readerArticle.disease)}</span>}
                          {readerArticle.symptom && <span className="rounded-full bg-amber-500/15 px-3 py-1 text-xs text-amber-800">{tt("symptomLabel")}: {displayOption(readerArticle.symptom)}</span>}
                        </div>

                        <div className={`${readerShouldShowPdf ? "mb-2 p-3 text-xs leading-6" : "mb-8 p-5 text-base leading-8"} rounded-[24px] border border-slate-300 bg-slate-100 text-slate-700`}>
                          {readerArticle.excerpt}
                        </div>

                        {readerShouldShowPdf ? (
                          <div className="flex min-h-0 flex-1 flex-col gap-2">
                            <div className="flex items-center justify-between rounded-[20px] border border-emerald-500/20 bg-emerald-500/8 px-4 py-2 text-xs text-emerald-800">
                              <span>{tt("pdfShowing")}</span>
                              <a
                                href={readerArticle.pdfUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-black"
                              >
                                {tt("openNewTab")}
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            </div>
                            <div className="min-h-0 flex-1 overflow-hidden rounded-[28px] border border-white/10 bg-black shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
                              <iframe
                                title="PDF Reader"
                                src={readerArticle.pdfUrl}
                                className="h-full min-h-0 w-full"
                                frameBorder="0"
                              />
                            </div>
                          </div>
                        ) : readerArticle.contentHtml ? (
                          <article
                            className="prose max-w-none text-[15px] leading-8 text-slate-700 prose-headings:text-slate-900 prose-strong:text-slate-900 prose-a:text-emerald-800 [&_p]:mb-5 [&_img]:rounded-2xl [&_img]:border [&_img]:border-slate-200 [&_table]:w-full [&_td]:border [&_td]:border-slate-200 [&_td]:p-2 [&_th]:border [&_th]:border-slate-200 [&_th]:p-2"
                            dangerouslySetInnerHTML={{ __html: readerArticle.contentHtml }}
                          />
                        ) : readerArticle.pdfUrl ? (
                          <div className="h-[70vh] overflow-hidden rounded-[24px] border border-white/10 bg-black">
                            <iframe title="PDF Reader" src={readerArticle.pdfUrl} className="h-full w-full" frameBorder="0" />
                          </div>
                        ) : (
                          <div className="rounded-[24px] border border-white/10 bg-slate-100 p-6 text-slate-600">
                            {tt("noEmbedded")}
                          </div>
                        )}
                      </div>
                    </div>

                    <aside className="custom-scrollbar min-h-0 overflow-y-auto overscroll-contain border-t border-slate-300 bg-slate-50 p-5 lg:border-l lg:border-t-0">
                      <h3 className="text-lg font-black text-emerald-800">{tt("related")}</h3>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {readerArticle.tags.slice(0, 8).map((tag) => (
                          <span key={tag} className="rounded-full bg-slate-200 px-3 py-1 text-[11px] text-slate-600">
                            {displayOption(tag)}
                          </span>
                        ))}
                      </div>

                      <div className="mt-6 space-y-3">
                        {suggestedArticles.slice(0, 6).map((item) => (
                          <button
                            key={item.id}
                            onClick={() => {
                              setSelectedArticle(item);
                              setReaderArticle(item);
                            }}
                            className="w-full rounded-[20px] border border-slate-300 bg-slate-100 p-4 text-left transition-all hover:border-emerald-400/30 hover:bg-emerald-500/10"
                          >
                            <p className="font-bold text-slate-900">{item.title}</p>
                            <p className="mt-2 text-sm text-slate-600">{displayOption(item.category)} • {item.readTime}</p>
                          </button>
                        ))}
                      </div>
                    </aside>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default LibraryView;
