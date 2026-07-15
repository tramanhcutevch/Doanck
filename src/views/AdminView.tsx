import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "motion/react";
import {
  ArrowRight,
  BarChart3,
  BellRing,
  BookOpen,
  Boxes,
  CheckCircle2,
  CreditCard,
  DollarSign,
  LayoutDashboard,
  Lock,
  LogIn,
  MessageSquare,
  PackagePlus,
  Pencil,
  RefreshCw,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sprout,
  Trash2,
  Truck,
  Users,
  Clock3,
} from "lucide-react";
import { collection, db, limit, onSnapshot, orderBy, query } from "../lib/localDb";
import { AdminUserProfile, listAdminUsers, updateAdminUserProfile } from "../services/adminUserService";
import { deleteCommunityPost, listCommunityPosts, listCommunityReports, updateCommunityReportStatus } from "../services/communityService";
import { subscribeToDiagnoses } from "../services/diagnosisService";
import { LibraryArticle, loadLibraryArticles } from "../services/libraryService";
import { openOrderSupportMessenger } from "../services/orderSupportService";
import { isAdminUser } from "../services/roleService";
import { deleteShopProduct, getShopAnalytics, getShopBootstrap, updateShopOrder, upsertShopProduct } from "../services/shopService";
import { AppUser, CommunityPost, CommunityReport, Diagnosis, GrowthCycle, ShopOrder, ShopProduct } from "../types";
import { LocalizedDictionary, useI18n } from "../i18n";

interface AdminViewProps {
  user: AppUser | null;
  onLogin: () => void | Promise<void>;
}

type AdminTab = "overview" | "products" | "orders" | "community" | "users";

type ProductFormState = {
  id?: string;
  name: string;
  category: string;
  price: string;
  originalPrice: string;
  stock: string;
  sku: string;
  manufacturer: string;
  origin: string;
  shortDescription: string;
  description: string;
  image: string;
  tags: string;
  badge: string;
  rating: string;
  reviewCount: string;
  salesCount: string;
  featured: boolean;
  bestSeller: boolean;
  shippingClass: string;
  benefits: string;
  specs: string;
};

const defaultFormState: ProductFormState = {
  name: "",
  category: "",
  price: "",
  originalPrice: "",
  stock: "",
  sku: "",
  manufacturer: "",
  origin: "",
  shortDescription: "",
  description: "",
  image: "",
  tags: "",
  badge: "",
  rating: "4.8",
  reviewCount: "0",
  salesCount: "0",
  featured: true,
  bestSeller: false,
  shippingClass: "",
  benefits: "",
  specs: "",
};

const formatCurrency = (value: number, locale = "vi-VN") => `${value.toLocaleString(locale)}đ`;

const adminText: LocalizedDictionary = {
  adminDashboard: { vi: "Admin Dashboard", en: "Admin Dashboard", ja: "管理ダッシュボード" },
  loginRequiredDesc: {
    vi: "Đăng nhập để quản lý toàn bộ hệ thống: cửa hàng, diễn đàn, chu kỳ sinh trưởng, thư viện và các tín hiệu vận hành chung.",
    en: "Sign in to manage the full system: shop, forum, growth cycles, library, and platform operation signals.",
    ja: "ショップ、フォーラム、生育サイクル、ライブラリ、運用シグナルを管理するにはログインしてください。",
  },
  login: { vi: "Đăng nhập", en: "Sign in", ja: "ログイン" },
  noAdminTitle: { vi: "Bạn chưa có quyền admin", en: "You do not have admin access", ja: "管理者権限がありません" },
  noAdminDesc: { vi: "Tài khoản hiện tại chưa được cấp quyền quản trị toàn hệ thống.", en: "The current account has not been granted system admin access.", ja: "現在のアカウントにはシステム管理権限がありません。" },
  adminList: { vi: "Danh sách admin hiện tại", en: "Current admin list", ja: "現在の管理者一覧" },
  noAdminConfig: { vi: "Hiện chưa cấu hình VITE_ADMIN_EMAILS. Hãy gán role admin trong profiles hoặc cấu hình email admin.", en: "VITE_ADMIN_EMAILS is not configured. Assign the admin role in profiles or configure admin email.", ja: "VITE_ADMIN_EMAILS が未設定です。profilesでadminロールを付与するか管理者メールを設定してください。" },
  systemControl: { vi: "System Control", en: "System Control", ja: "システム管理" },
  dashboardTitle: { vi: "Dashboard quản trị toàn hệ thống", en: "System administration dashboard", ja: "システム管理ダッシュボード" },
  dashboardDesc: {
    vi: "Một nơi duy nhất để theo dõi commerce, cộng đồng, chu kỳ mùa vụ, thư viện tri thức và tín hiệu hoạt động chung của nền tảng.",
    en: "One place to monitor commerce, community, crop cycles, knowledge library, and overall platform signals.",
    ja: "コマース、コミュニティ、作期、知識ライブラリ、プラットフォーム全体のシグナルを一元管理します。",
  },
  refreshOrders: { vi: "Làm mới đơn", en: "Refresh orders", ja: "注文を更新" },
  overview: { vi: "Tổng quan", en: "Overview", ja: "概要" },
  products: { vi: "Sản phẩm", en: "Products", ja: "商品" },
  orders: { vi: "Đơn hàng", en: "Orders", ja: "注文" },
  community: { vi: "Cộng đồng", en: "Community", ja: "コミュニティ" },
  users: { vi: "Người dùng", en: "Users", ja: "ユーザー" },
  revenue: { vi: "Doanh thu", en: "Revenue", ja: "売上" },
  totalGmv: { vi: "Tổng GMV", en: "Total GMV", ja: "総GMV" },
  storefrontOrders: { vi: "Đơn từ storefront", en: "Storefront orders", ja: "ストア注文" },
  pendingFollow: { vi: "Cần admin theo dõi", en: "Needs admin attention", ja: "管理者確認が必要" },
  forumPosts: { vi: "Bài diễn đàn", en: "Forum posts", ja: "フォーラム投稿" },
  recentRecords: { vi: "Bản ghi gần đây", en: "Recent records", ja: "最近の記録" },
  pending: { vi: "Chờ xử lý", en: "Pending", ja: "処理待ち" },
  confirmed: { vi: "Đã xác nhận", en: "Confirmed", ja: "確認済み" },
  shipping: { vi: "Đang giao", en: "Shipping", ja: "配送中" },
  delivered: { vi: "Hoàn tất", en: "Delivered", ja: "完了" },
  cancelled: { vi: "Đã hủy", en: "Cancelled", ja: "キャンセル" },
  paymentPending: { vi: "Chờ thanh toán", en: "Payment pending", ja: "支払い待ち" },
  paid: { vi: "Đã thanh toán", en: "Paid", ja: "支払い済み" },
  failed: { vi: "Thanh toán lỗi", en: "Payment failed", ja: "支払い失敗" },
  refunded: { vi: "Đã hoàn tiền", en: "Refunded", ja: "返金済み" },
  newOrderNotice: { vi: "Thông báo đơn hàng mới", en: "New order notifications", ja: "新規注文通知" },
  newOrdersNeedAdmin: { vi: "Đơn mới cần admin xử lý", en: "New orders need admin handling", ja: "対応が必要な新規注文" },
  openOrderCenter: { vi: "Mở trung tâm đơn hàng", en: "Open order center", ja: "注文センターを開く" },
  noPendingOrders: { vi: "Chưa có đơn hàng mới trong nhóm chờ xử lý.", en: "No new orders in the pending group.", ja: "処理待ちの新規注文はありません。" },
  revenueGrowth: { vi: "Tăng trưởng doanh thu", en: "Revenue growth", ja: "売上推移" },
  monthlyRevenue: { vi: "Doanh thu theo tháng", en: "Monthly revenue", ja: "月別売上" },
  monthlyRevenueDesc: {
    vi: "Theo dõi 12 tháng gần nhất từ các đơn hợp lệ, bỏ qua đơn hủy và thanh toán lỗi.",
    en: "Tracks the latest 12 months from valid orders, excluding cancelled and failed-payment orders.",
    ja: "キャンセル注文と支払い失敗注文を除いた有効注文から直近12か月を追跡します。",
  },
  currentMonthRevenue: { vi: "Tháng gần nhất có doanh thu", en: "Latest revenue month", ja: "直近売上月" },
  previousMonthRevenue: { vi: "Kỳ trước", en: "Previous period", ja: "前期" },
  monthlyOrders: { vi: "Đơn trong tháng", en: "Monthly orders", ja: "月間注文" },
  noMonthlyRevenue: { vi: "Chưa có doanh thu trong 12 tháng này", en: "No revenue in this 12-month window", ja: "この12か月の売上はまだありません" },
  versusPreviousMonth: { vi: "so với kỳ trước", en: "vs previous period", ja: "前期比" },
  system: { vi: "Hệ thống", en: "System", ja: "システム" },
  noBestSeller: { vi: "Chưa có best seller", en: "No best seller yet", ja: "売れ筋はまだありません" },
  currentBestSeller: { vi: "Top bán chạy hiện tại", en: "Current top seller", ja: "現在の売れ筋" },
  sold: { vi: "lượt bán", en: "sold", ja: "販売" },
  libraryDocs: { vi: "tài liệu thư viện", en: "library documents", ja: "件のライブラリ資料" },
  librarySourceDesc: { vi: "Nguồn nội dung để user portal và thư viện cùng dùng", en: "Content source shared by user portal and library", ja: "ユーザーポータルとライブラリで共有するコンテンツソース" },
  recentDiagnoses: { vi: "ca chẩn đoán gần đây", en: "recent diagnoses", ja: "件の最近の診断" },
  diagnosisSignalDesc: { vi: "Giúp admin theo dõi tín hiệu bệnh và tần suất sử dụng AI", en: "Helps admins monitor disease signals and AI usage frequency", ja: "病害シグナルとAI利用頻度を管理者が確認できます" },
  topProducts: { vi: "Top sản phẩm", en: "Top products", ja: "上位商品" },
  recentOrders: { vi: "Đơn hàng gần đây", en: "Recent orders", ja: "最近の注文" },
  lowStockAttention: { vi: "Tồn kho cần chú ý", en: "Inventory needing attention", ja: "注意が必要な在庫" },
  stockLeft: { vi: "Còn", en: "Left", ja: "残り" },
  stock: { vi: "Tồn", en: "Stock", ja: "在庫" },
  productEditor: { vi: "Product Editor", en: "Product Editor", ja: "商品エディタ" },
  updateProduct: { vi: "Cập nhật sản phẩm", en: "Update product", ja: "商品を更新" },
  updateProductTitle: { vi: "Cập nhật sản phẩm", en: "Update product", ja: "商品を更新" },
  createProductTitle: { vi: "Tạo sản phẩm mới", en: "Create new product", ja: "新しい商品を作成" },
  createProduct: { vi: "Tạo sản phẩm", en: "Create product", ja: "商品を作成" },
  productWarehouse: { vi: "Kho sản phẩm", en: "Product inventory", ja: "商品在庫" },
  saving: { vi: "Đang lưu...", en: "Saving...", ja: "保存中..." },
  reset: { vi: "Reset", en: "Reset", ja: "リセット" },
  sku: { vi: "SKU", en: "SKU", ja: "SKU" },
  badge: { vi: "Badge", en: "Badge", ja: "バッジ" },
  rating: { vi: "Rating", en: "Rating", ja: "評価" },
  featuredProduct: { vi: "Sản phẩm nổi bật", en: "Featured product", ja: "注目商品" },
  bestSeller: { vi: "Best seller", en: "Best seller", ja: "売れ筋" },
  orderCenter: { vi: "Order Center", en: "Order Center", ja: "注文センター" },
  orderManagement: { vi: "Quản lý đơn hàng", en: "Order management", ja: "注文管理" },
  orderManagementDesc: { vi: "Theo dõi đơn mới, cập nhật tiến độ giao hàng và trạng thái thanh toán ngay trong dashboard.", en: "Track new orders and update shipping progress and payment status in the dashboard.", ja: "新規注文、配送状況、支払い状態をダッシュボードで更新できます。" },
  orderSearchPlaceholder: { vi: "Tìm mã đơn, tên, SĐT...", en: "Search order code, name, phone...", ja: "注文番号、名前、電話番号を検索..." },
  allOrderStatus: { vi: "Tất cả trạng thái đơn", en: "All order statuses", ja: "すべての注文状態" },
  allPaymentStatus: { vi: "Tất cả thanh toán", en: "All payment statuses", ja: "すべての支払い状態" },
  orderList: { vi: "Danh sách đơn hàng", en: "Order list", ja: "注文一覧" },
  orderFilterHint: { vi: "Dùng thanh lọc phía trên để xem chờ xử lý, đang giao, hoàn tất hoặc đã hủy.", en: "Use the filters above to view pending, shipping, completed, or cancelled orders.", ja: "上のフィルターで処理待ち、配送中、完了、キャンセルを確認できます。" },
  orderUnit: { vi: "đơn", en: "orders", ja: "件の注文" },
  pushToShipping: { vi: "Đẩy sang giao", en: "Move to shipping", ja: "配送へ進める" },
  qty: { vi: "SL", en: "Qty", ja: "数量" },
  noOrders: { vi: "Không có đơn nào khớp với bộ lọc hiện tại.", en: "No orders match the current filters.", ja: "現在のフィルターに一致する注文はありません。" },
  orderChat: { vi: "Chat với khách", en: "Customer chat", ja: "顧客チャット" },
  forum: { vi: "Diễn đàn", en: "Forum", ja: "フォーラム" },
  forumDesc: { vi: "Bài đăng cộng đồng đang đọc từ Supabase", en: "Community posts loaded from Supabase", ja: "Supabaseから読み込んだコミュニティ投稿" },
  comments: { vi: "bình luận", en: "comments", ja: "コメント" },
  points: { vi: "điểm", en: "points", ja: "点" },
  deletePost: { vi: "Xóa bài", en: "Delete post", ja: "投稿を削除" },
  pendingReports: { vi: "Report đang chờ", en: "Pending reports", ja: "保留中の報告" },
  moderationQueue: { vi: "Hàng đợi kiểm duyệt cho admin", en: "Moderation queue for admins", ja: "管理者用モデレーションキュー" },
  reviewing: { vi: "Đang xem", en: "Reviewing", ja: "確認中" },
  resolved: { vi: "Đã xử lý", en: "Resolved", ja: "対応済み" },
  dismissed: { vi: "Bỏ qua", en: "Dismissed", ja: "却下" },
  communitySystem: { vi: "Cộng đồng & hệ thống", en: "Community & system", ja: "コミュニティとシステム" },
  libraryPosts: { vi: "bài viết thư viện", en: "library articles", ja: "件のライブラリ記事" },
  userContentDesc: { vi: "Nguồn nội dung kiến thức đang hiển thị cho user", en: "Knowledge content currently visible to users", ja: "ユーザーに表示中の知識コンテンツ" },
  activeAuthors: { vi: "tác giả hoạt động", en: "active authors", ja: "人のアクティブ投稿者" },
  activeAuthorsDesc: { vi: "Ước tính từ các bài đăng gần đây", en: "Estimated from recent posts", ja: "最近の投稿から推定" },
  growthCycles: { vi: "chu kỳ sinh trưởng", en: "growth cycles", ja: "件の生育サイクル" },
  localGrowthDesc: { vi: "Vẫn giữ nguồn dữ liệu local hiện tại của app", en: "Still using the app's current local data source", ja: "現在のローカルデータソースを使用中" },
  postCount: { vi: "bài viết", en: "posts", ja: "件の投稿" },
  userControl: { vi: "User Control", en: "User Control", ja: "ユーザー管理" },
  userManagement: { vi: "Quản lý người dùng", en: "User management", ja: "ユーザー管理" },
  userManagementDesc: { vi: "Admin có thể rà tài khoản, bật/tắt hoạt động và cấp role admin trực tiếp từ bảng `profiles`.", en: "Admins can review accounts, enable or disable access, and assign admin roles directly from the `profiles` table.", ja: "管理者は `profiles` テーブルからアカウント確認、有効/無効化、adminロール付与ができます。" },
  totalUsers: { vi: "Tổng người dùng", en: "Total users", ja: "総ユーザー数" },
  readFromAdminOverview: { vi: "Đọc từ admin_user_overview", en: "Read from admin_user_overview", ja: "admin_user_overviewから読み込み" },
  adminAccounts: { vi: "Tài khoản quản trị", en: "Admin accounts", ja: "管理者アカウント" },
  active: { vi: "Đang hoạt động", en: "Active", ja: "有効" },
  inactive: { vi: "Tạm khóa", en: "Inactive", ja: "一時停止" },
  activeNote: { vi: "Có thể đăng nhập và thao tác", en: "Can sign in and operate", ja: "ログインして操作可能" },
  accountList: { vi: "Danh sách tài khoản", en: "Account list", ja: "アカウント一覧" },
  userSearchPlaceholder: { vi: "Tìm email, tên hoặc user id...", en: "Search email, name, or user id...", ja: "メール、名前、ユーザーIDを検索..." },
  unnamed: { vi: "Chưa đặt tên", en: "Unnamed", ja: "未設定" },
  quickLock: { vi: "Khóa nhanh", en: "Quick lock", ja: "クイック停止" },
  quickUnlock: { vi: "Mở nhanh", en: "Quick unlock", ja: "クイック解除" },
  noUsers: { vi: "Không tìm thấy tài khoản nào.", en: "No accounts found.", ja: "アカウントが見つかりません。" },
  usersAndRoles: { vi: "Users & roles", en: "Users & roles", ja: "ユーザーとロール" },
  userRole: { vi: "User", en: "User", ja: "ユーザー" },
  adminRole: { vi: "Admin", en: "Admin", ja: "管理者" },
  dashboardSourcePrefix: { vi: "Dashboard này đang đọc commerce từ", en: "This dashboard is reading commerce from", ja: "このダッシュボードはコマースデータを" },
  dashboardSourceSuffix: { vi: "phần cộng đồng/report/thông báo từ Supabase và phần chẩn đoán, tăng trưởng từ local DB hiện tại của app.", en: "community, reports, and notifications from Supabase, and diagnosis/growth data from the app's current local DB.", ja: "から読み込み、コミュニティ/報告/通知はSupabase、診断/生育は現在のローカルDBから読み込みます。" },
  supabaseEmpty: { vi: "Supabase rỗng", en: "empty Supabase", ja: "空のSupabase" },
  supabaseError: { vi: "Supabase lỗi", en: "Supabase error", ja: "Supabaseエラー" },
  localFallback: { vi: "local fallback", en: "local fallback", ja: "ローカル代替" },
  newOrderToast: { vi: "Có đơn hàng mới từ cửa hàng", en: "A new shop order arrived", ja: "ショップに新規注文があります" },
  viewOrder: { vi: "Xem đơn", en: "View order", ja: "注文を見る" },
  close: { vi: "Đóng", en: "Close", ja: "閉じる" },
  fieldName: { vi: "Tên sản phẩm", en: "Product name", ja: "商品名" },
  fieldCategory: { vi: "Danh mục", en: "Category", ja: "カテゴリ" },
  fieldPrice: { vi: "Giá bán", en: "Sale price", ja: "販売価格" },
  fieldOriginalPrice: { vi: "Giá gốc", en: "Original price", ja: "元価格" },
  fieldStock: { vi: "Tồn kho", en: "Stock", ja: "在庫" },
  fieldManufacturer: { vi: "Nhà sản xuất", en: "Manufacturer", ja: "メーカー" },
  fieldOrigin: { vi: "Xuất xứ", en: "Origin", ja: "原産地" },
  fieldImage: { vi: "URL hình ảnh", en: "Image URL", ja: "画像URL" },
  fieldShipping: { vi: "Chính sách giao hàng", en: "Shipping policy", ja: "配送ポリシー" },
  defaultCategory: { vi: "Thuốc sinh học", en: "Biological products", ja: "生物資材" },
  defaultShipping: { vi: "Giao tiêu chuẩn 1-3 ngày", en: "Standard delivery in 1-3 days", ja: "通常配送 1-3日" },
  reviewCount: { vi: "Số review", en: "Review count", ja: "レビュー数" },
  salesCount: { vi: "Số lượng bán", en: "Sales count", ja: "販売数" },
  shortDesc: { vi: "Mô tả ngắn", en: "Short description", ja: "短い説明" },
  detailDesc: { vi: "Mô tả chi tiết", en: "Detailed description", ja: "詳細説明" },
  tagsComma: { vi: "Tags, cách nhau bằng dấu phẩy", en: "Tags, separated by commas", ja: "タグ、カンマ区切り" },
  benefitsLines: { vi: "Mỗi dòng là một lợi ích", en: "One benefit per line", ja: "1行に1つの特典" },
  specsPlaceholder: { vi: "Thông số dạng Key: Value\nVí dụ: Liều dùng: 20ml/16L", en: "Specs as Key: Value\nExample: Dosage: 20ml/16L", ja: "仕様は Key: Value 形式\n例: 使用量: 20ml/16L" },
};

const statusTone: Record<ShopOrder["status"], string> = {
  pending: "border-amber-500/20 bg-amber-500/10 text-amber-200",
  confirmed: "border-sky-500/20 bg-sky-500/10 text-sky-200",
  shipping: "border-violet-500/20 bg-violet-500/10 text-violet-200",
  delivered: "border-emerald-500/20 bg-emerald-500/10 text-emerald-200",
  cancelled: "border-rose-500/20 bg-rose-500/10 text-rose-200",
};

const paymentTone: Record<ShopOrder["paymentStatus"], string> = {
  pending: "border-amber-500/20 bg-amber-500/10 text-amber-200",
  paid: "border-emerald-500/20 bg-emerald-500/10 text-emerald-200",
  failed: "border-rose-500/20 bg-rose-500/10 text-rose-200",
  refunded: "border-slate-500/20 bg-slate-500/10 text-slate-200",
};

const createFormState = (product?: ShopProduct): ProductFormState =>
  product
    ? {
        id: product.id,
        name: product.name,
        category: product.category,
        price: String(product.price),
        originalPrice: product.originalPrice ? String(product.originalPrice) : "",
        stock: String(product.stock),
        sku: product.sku,
        manufacturer: product.manufacturer,
        origin: product.origin,
        shortDescription: product.shortDescription,
        description: product.description,
        image: product.image,
        tags: product.tags.join(", "),
        badge: product.badge ?? "",
        rating: String(product.rating),
        reviewCount: String(product.reviewCount),
        salesCount: String(product.salesCount),
        featured: product.featured,
        bestSeller: product.bestSeller,
        shippingClass: product.shippingClass,
        benefits: product.benefits.join("\n"),
        specs: Object.entries(product.specs).map(([k, v]) => `${k}: ${v}`).join("\n"),
      }
    : defaultFormState;

const AdminView = ({ user, onLogin }: AdminViewProps) => {
  const { language } = useI18n();
  const tt = (key: string) => adminText[key]?.[language] ?? adminText[key]?.vi ?? key;
  const locale = language === "vi" ? "vi-VN" : language === "ja" ? "ja-JP" : "en-US";
  const statusLabel: Record<ShopOrder["status"], string> = {
    pending: tt("pending"),
    confirmed: tt("confirmed"),
    shipping: tt("shipping"),
    delivered: tt("delivered"),
    cancelled: tt("cancelled"),
  };
  const paymentStatusLabel: Record<ShopOrder["paymentStatus"], string> = {
    pending: tt("paymentPending"),
    paid: tt("paid"),
    failed: tt("failed"),
    refunded: tt("refunded"),
  };
  const defaultLocalizedForm = useMemo(
    () => ({
      ...defaultFormState,
      category: tt("defaultCategory"),
      shippingClass: tt("defaultShipping"),
    }),
    [language]
  );
  const [tab, setTab] = useState<AdminTab>("overview");
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [orders, setOrders] = useState<ShopOrder[]>([]);
  const [dataSource, setDataSource] = useState<"supabase" | "local" | "supabase-empty" | "supabase-error">("local");
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<ProductFormState>(defaultLocalizedForm);
  const [saving, setSaving] = useState(false);
  const [refreshingOrders, setRefreshingOrders] = useState(false);
  const [orderUpdatingId, setOrderUpdatingId] = useState<string | null>(null);
  const [orderSearch, setOrderSearch] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState<"all" | ShopOrder["status"]>("all");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<"all" | ShopOrder["paymentStatus"]>("all");
  const [orderNotification, setOrderNotification] = useState<{ code: string; customerName: string; total: number } | null>(null);
  const [diagnoses, setDiagnoses] = useState<Diagnosis[]>([]);
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [reports, setReports] = useState<CommunityReport[]>([]);
  const [cycles, setCycles] = useState<GrowthCycle[]>([]);
  const [libraryItems, setLibraryItems] = useState<LibraryArticle[]>([]);
  const [users, setUsers] = useState<AdminUserProfile[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [userUpdatingId, setUserUpdatingId] = useState<string | null>(null);
  const knownOrderIdsRef = useRef<string[]>([]);
  const hasPrimedOrdersRef = useRef(false);
  const isAdmin = isAdminUser(user);
  const dataSourceLabel =
    dataSource === "supabase" ? "Supabase" : dataSource === "supabase-empty" ? tt("supabaseEmpty") : dataSource === "supabase-error" ? tt("supabaseError") : tt("localFallback");

  useEffect(() => {
    if (!user || !isAdmin) return;

    const load = async () => {
      setLoading(true);
      const [data, libraryData, communityPosts, communityReports, adminUsers] = await Promise.all([
        getShopBootstrap(),
        loadLibraryArticles(),
        listCommunityPosts({ sort: "new" }),
        listCommunityReports(),
        listAdminUsers().catch(() => []),
      ]);
      setProducts(data.products);
      setOrders(data.orders);
      setDataSource(data.source);
      setLibraryItems(libraryData.articles);
      setPosts(communityPosts);
      setReports(communityReports);
      setUsers(adminUsers);
      knownOrderIdsRef.current = data.orders.map((order) => order.id);
      hasPrimedOrdersRef.current = true;
      setLoading(false);
    };

    void load();

    const unsubs = [
      subscribeToDiagnoses({
        take: 12,
        onData: setDiagnoses,
        onError: (err) => console.error("Admin diagnoses load error:", err),
      }),
      onSnapshot(query(collection(db, "growthCycles"), orderBy("lastUpdate", "desc"), limit(12)), (snapshot) =>
        setCycles(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as GrowthCycle)))
      ),
    ];

    return () => {
      unsubs.forEach((unsubscribe) => unsubscribe());
    };
  }, [isAdmin, user]);

  useEffect(() => {
    if (!user || !isAdmin) return;

    const intervalId = window.setInterval(() => {
      void refreshCommerceData({ silent: true, detectNewOrders: true });
    }, 15000);

    return () => window.clearInterval(intervalId);
  }, [isAdmin, user]);

  useEffect(() => {
    const handleFocusOrder = (event: Event) => {
      const customEvent = event as CustomEvent<{ orderCode?: string }>;
      if (!customEvent.detail?.orderCode) return;
      setTab("orders");
      setOrderSearch(customEvent.detail.orderCode);
      setOrderStatusFilter("all");
      setPaymentStatusFilter("all");
    };

    window.addEventListener("terraform-flora.order-support.focus-order", handleFocusOrder as EventListener);
    return () => {
      window.removeEventListener("terraform-flora.order-support.focus-order", handleFocusOrder as EventListener);
    };
  }, []);

  const analytics = useMemo(() => getShopAnalytics(products, orders), [orders, products]);
  const revenueChart = useMemo(() => {
    const series = analytics.revenueSeries;
    const maxRevenue = Math.max(...series.map((entry) => entry.revenue), 1);
    const width = 720;
    const height = 220;
    const paddingX = 28;
    const paddingTop = 24;
    const paddingBottom = 28;
    const chartHeight = height - paddingTop - paddingBottom;
    const step = series.length > 1 ? (width - paddingX * 2) / (series.length - 1) : 0;
    const points = series.map((entry, index) => {
      const x = paddingX + index * step;
      const y = paddingTop + chartHeight - (entry.revenue / maxRevenue) * chartHeight;
      return { ...entry, x, y };
    });
    const linePath = points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");
    const areaPath = points.length
      ? `${linePath} L ${points[points.length - 1].x} ${height - paddingBottom} L ${points[0].x} ${height - paddingBottom} Z`
      : "";
    const latestRevenueIndex = series.reduce((latestIndex, entry, index) => (entry.revenue > 0 ? index : latestIndex), -1);
    const activeMonthIndex = latestRevenueIndex >= 0 ? latestRevenueIndex : series.length - 1;
    const currentMonth = series[activeMonthIndex] ?? null;
    const previousMonth = activeMonthIndex > 0 ? series[activeMonthIndex - 1] : null;
    const growth =
      currentMonth && previousMonth
        ? previousMonth.revenue > 0
          ? ((currentMonth.revenue - previousMonth.revenue) / previousMonth.revenue) * 100
          : currentMonth.revenue > 0
            ? 100
            : 0
        : 0;

    return {
      series,
      maxRevenue,
      points,
      linePath,
      areaPath,
      currentMonth,
      previousMonth,
      growth,
    };
  }, [analytics.revenueSeries]);
  const recentOrders = useMemo(() => [...orders].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)).slice(0, 8), [orders]);
  const filteredOrders = useMemo(() => {
    const keyword = orderSearch.trim().toLowerCase();
    return [...orders]
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
      .filter((order) => {
        const matchesKeyword =
          keyword.length === 0 ||
          order.code.toLowerCase().includes(keyword) ||
          order.customerName.toLowerCase().includes(keyword) ||
          order.customerPhone.toLowerCase().includes(keyword) ||
          order.customerEmail.toLowerCase().includes(keyword);
        const matchesStatus = orderStatusFilter === "all" || order.status === orderStatusFilter;
        const matchesPayment = paymentStatusFilter === "all" || order.paymentStatus === paymentStatusFilter;
        return matchesKeyword && matchesStatus && matchesPayment;
      });
  }, [orderSearch, orderStatusFilter, orders, paymentStatusFilter]);
  const topProducts = useMemo(() => [...products].sort((a, b) => b.salesCount - a.salesCount).slice(0, 5), [products]);
  const lowStockProducts = useMemo(() => [...products].filter((product) => product.stock <= 20).sort((a, b) => a.stock - b.stock).slice(0, 5), [products]);
  const mostActiveAuthors = useMemo(() => {
    const map = new Map<string, number>();
    posts.forEach((post) => map.set(post.authorName, (map.get(post.authorName) ?? 0) + 1));
    return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4);
  }, [posts]);
  const recentOrderNotifications = useMemo(
    () =>
      [...orders]
        .filter((order) => order.status === "pending" || order.status === "confirmed")
        .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
        .slice(0, 5),
    [orders]
  );
  const filteredUsers = useMemo(() => {
    const keyword = userSearch.trim().toLowerCase();
    return users.filter((entry) => {
      if (keyword.length === 0) return true;
      return (
        entry.email?.toLowerCase().includes(keyword) ||
        entry.fullName?.toLowerCase().includes(keyword) ||
        entry.id.toLowerCase().includes(keyword)
      );
    });
  }, [userSearch, users]);

  const refreshCommerceData = async ({ silent = false, detectNewOrders = false }: { silent?: boolean; detectNewOrders?: boolean } = {}) => {
    if (!silent) {
      setRefreshingOrders(true);
    }
    const data = await getShopBootstrap();
    setProducts(data.products);
    setOrders(data.orders);
    setDataSource(data.source);
    if (detectNewOrders && hasPrimedOrdersRef.current) {
      const incoming = data.orders.find((order) => !knownOrderIdsRef.current.includes(order.id));
      if (incoming) {
        setOrderNotification({
          code: incoming.code,
          customerName: incoming.customerName,
          total: incoming.total,
        });
        setTab("orders");
      }
    }
    knownOrderIdsRef.current = data.orders.map((order) => order.id);
    if (!silent) {
      setRefreshingOrders(false);
    }
  };

  const refreshCommunityData = async () => {
    const [communityPosts, communityReports] = await Promise.all([listCommunityPosts({ sort: "new" }), listCommunityReports()]);
    setPosts(communityPosts);
    setReports(communityReports);
  };

  const refreshUsersData = async () => {
    const nextUsers = await listAdminUsers().catch(() => []);
    setUsers(nextUsers);
  };

  const handleEditProduct = (product: ShopProduct) => {
    setForm(createFormState(product));
    setTab("products");
  };

  const handleDeleteProduct = async (productId: string) => {
    const nextProducts = await deleteShopProduct(productId);
    setProducts(nextProducts);
  };

  const handleUpdateOrder = async (
    orderId: string,
    updates: { status?: ShopOrder["status"]; paymentStatus?: ShopOrder["paymentStatus"] }
  ) => {
    setOrderUpdatingId(orderId);
    try {
      await updateShopOrder({ orderId, ...updates });
      await refreshCommerceData({ silent: true });
    } finally {
      setOrderUpdatingId(null);
    }
  };

  const handleUpdateUser = async (
    userId: string,
    updates: { role?: AdminUserProfile["role"]; isActive?: boolean }
  ) => {
    setUserUpdatingId(userId);
    try {
      await updateAdminUserProfile({ id: userId, ...updates });
      await refreshUsersData();
    } finally {
      setUserUpdatingId(null);
    }
  };

  const handleDeleteCommunityPost = async (postId: string) => {
    await deleteCommunityPost(postId);
    await refreshCommunityData();
  };

  const handleUpdateReportStatus = async (reportId: string, status: CommunityReport["status"]) => {
    if (!user) return;
    await updateCommunityReportStatus({ reportId, status, reviewerId: user.uid });
    await refreshCommunityData();
  };

  const handleSubmitProduct = async () => {
    setSaving(true);
    try {
      await upsertShopProduct({
        id: form.id,
        name: form.name.trim(),
        category: form.category.trim(),
        price: Number(form.price || 0),
        originalPrice: form.originalPrice ? Number(form.originalPrice) : undefined,
        stock: Number(form.stock || 0),
        sku: form.sku.trim(),
        manufacturer: form.manufacturer.trim(),
        origin: form.origin.trim(),
        shortDescription: form.shortDescription.trim(),
        description: form.description.trim(),
        image: form.image.trim(),
        images: [form.image.trim()],
        tags: form.tags.split(",").map((item) => item.trim()).filter(Boolean),
        badge: form.badge.trim() || undefined,
        rating: Number(form.rating || 0),
        reviewCount: Number(form.reviewCount || 0),
        salesCount: Number(form.salesCount || 0),
        featured: form.featured,
        bestSeller: form.bestSeller,
        shippingClass: form.shippingClass.trim(),
        benefits: form.benefits.split("\n").map((item) => item.trim()).filter(Boolean),
        specs: Object.fromEntries(
          form.specs
            .split("\n")
            .map((line) => line.split(":"))
            .filter((parts) => parts.length >= 2)
            .map(([key, ...rest]) => [key.trim(), rest.join(":").trim()])
        ),
      });
      await refreshCommerceData();
      setForm(defaultLocalizedForm);
    } finally {
      setSaving(false);
    }
  };

  const adminEmails =
    typeof import.meta !== "undefined" && import.meta.env.VITE_ADMIN_EMAILS
      ? import.meta.env.VITE_ADMIN_EMAILS.split(",").map((item: string) => item.trim()).filter(Boolean)
      : [];

  if (!user) {
    return (
      <div className="min-h-screen bg-zinc-950 pt-32 pb-24">
        <div className="mx-auto max-w-5xl px-6">
          <div className="rounded-[40px] border border-white/8 bg-zinc-900 p-10 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-sky-500/10 text-sky-300">
              <ShieldCheck className="h-8 w-8" />
            </div>
            <h1 className="mt-6 text-4xl font-black tracking-tight text-white">{tt("adminDashboard")}</h1>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-white/55">
              {tt("loginRequiredDesc")}
            </p>
            <button onClick={() => void onLogin()} className="mt-8 inline-flex items-center gap-3 rounded-2xl bg-emerald-500 px-6 py-4 text-sm font-bold uppercase tracking-[0.22em] text-slate-950">
              <LogIn className="h-4 w-4" />
              {tt("login")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-zinc-950 pt-32 pb-24">
        <div className="mx-auto max-w-5xl px-6">
          <div className="rounded-[40px] border border-amber-500/15 bg-amber-500/8 p-10">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-amber-500/10 text-amber-300">
              <Lock className="h-8 w-8" />
            </div>
            <h1 className="mt-6 text-4xl font-black tracking-tight text-white">{tt("noAdminTitle")}</h1>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/60">
              {tt("noAdminDesc")}
            </p>
            <div className="mt-6 rounded-[24px] border border-white/8 bg-black/20 p-5 text-sm text-white/60">
              {adminEmails.length > 0
                ? `${tt("adminList")}: ${adminEmails.join(", ")}`
                : tt("noAdminConfig")}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 pt-32 pb-24">
      <div className="mx-auto max-w-7xl px-6">
        <section className="rounded-[40px] border border-sky-500/18 bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.18),transparent_28%),linear-gradient(135deg,rgba(6,13,24,0.96),rgba(8,22,31,0.92),rgba(4,7,12,0.98))] p-8">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-sky-200">{tt("systemControl")}</p>
              <h1 className="mt-4 text-4xl font-black tracking-tight text-white md:text-5xl">{tt("dashboardTitle")}</h1>
              <p className="mt-4 max-w-3xl text-white/60">
                {tt("dashboardDesc")}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => void refreshCommerceData()}
                className="inline-flex items-center gap-2 rounded-[22px] border border-white/8 bg-white/5 px-5 py-3 text-xs font-bold uppercase tracking-[0.22em] text-white/70"
              >
                <RefreshCw className={`h-4 w-4 ${refreshingOrders ? "animate-spin" : ""}`} />
                {tt("refreshOrders")}
              </button>
              {[
                { id: "overview" as const, label: tt("overview"), icon: LayoutDashboard },
                { id: "products" as const, label: tt("products"), icon: Boxes },
                { id: "orders" as const, label: tt("orders"), icon: ShoppingBag },
                { id: "community" as const, label: tt("community"), icon: MessageSquare },
                { id: "users" as const, label: tt("users"), icon: Users },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setTab(item.id)}
                  className={`inline-flex items-center gap-2 rounded-[22px] px-5 py-3 text-xs font-bold uppercase tracking-[0.22em] ${
                    tab === item.id ? "bg-sky-500 text-slate-950" : "border border-white/8 bg-white/5 text-white/60"
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[
              { label: tt("revenue"), value: formatCurrency(analytics.totalRevenue, locale), note: tt("totalGmv"), icon: DollarSign },
              { label: tt("orders"), value: String(analytics.totalOrders), note: tt("storefrontOrders"), icon: CreditCard },
              { label: tt("pending"), value: String(orders.filter((order) => order.status === "pending" || order.status === "confirmed").length), note: tt("pendingFollow"), icon: BellRing },
              { label: tt("forumPosts"), value: String(posts.length), note: tt("recentRecords"), icon: MessageSquare },
            ].map((item) => (
              <div key={item.label} className="rounded-[24px] border border-white/8 bg-black/25 p-5">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-500/10">
                  <item.icon className="h-5 w-5 text-sky-200" />
                </div>
                <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.22em] text-white/35">{item.label}</p>
                <p className="mt-2 text-3xl font-black text-white">{item.value}</p>
                <p className="mt-2 text-sm text-white/50">{item.note}</p>
              </div>
            ))}
          </div>
        </section>

        {loading ? <div className="mt-6 h-40 animate-pulse rounded-[32px] border border-white/8 bg-white/5" /> : null}

        {!loading && tab === "overview" && (
          <div className="mt-6 grid gap-6 xl:grid-cols-3">
            <div className="rounded-[32px] border border-red-200 bg-white p-7 shadow-2xl shadow-red-950/10 xl:col-span-3">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 text-red-600">
                    <BellRing className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-red-600">{tt("newOrderNotice")}</p>
                    <h2 className="text-2xl font-black text-zinc-950">{tt("newOrdersNeedAdmin")}</h2>
                  </div>
                </div>
                <button
                  onClick={() => setTab("orders")}
                  className="rounded-[18px] border border-zinc-200 bg-zinc-950 px-4 py-3 text-xs font-bold uppercase tracking-[0.18em] text-white transition hover:bg-red-600"
                >
                  {tt("openOrderCenter")}
                </button>
              </div>
              <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {recentOrderNotifications.map((order) => (
                  <div key={order.id} className="rounded-[24px] border border-zinc-200 bg-zinc-50 p-4 shadow-sm">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-bold text-zinc-950">{order.code}</p>
                      <span className={`rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] ${statusTone[order.status]}`}>
                        {statusLabel[order.status]}
                      </span>
                    </div>
                    <p className="mt-3 text-sm text-zinc-700">{order.customerName}</p>
                    <p className="mt-1 text-sm text-zinc-500">{new Date(order.createdAt).toLocaleString(locale)}</p>
                    <p className="mt-3 text-lg font-black text-emerald-600">{formatCurrency(order.total, locale)}</p>
                  </div>
                ))}
                {recentOrderNotifications.length === 0 ? (
                  <div className="rounded-[24px] border border-dashed border-zinc-200 bg-zinc-50 p-6 text-sm text-zinc-500 xl:col-span-3">
                    {tt("noPendingOrders")}
                  </div>
                ) : null}
              </div>
            </div>

            <div className="overflow-hidden rounded-[32px] border border-white/5 bg-[linear-gradient(180deg,rgba(24,24,27,0.98),rgba(9,9,11,0.98))] p-7 xl:col-span-2">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-300">
                    <BarChart3 className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/30">{tt("revenueGrowth")}</p>
                    <h2 className="text-2xl font-black text-white">{tt("monthlyRevenue")}</h2>
                    <p className="mt-2 max-w-xl text-sm leading-6 text-white/45">{tt("monthlyRevenueDesc")}</p>
                  </div>
                </div>

                <div className="grid min-w-[260px] grid-cols-2 gap-3">
                  <div className="rounded-[22px] border border-emerald-400/12 bg-emerald-500/8 p-4">
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-200/70">{tt("currentMonthRevenue")}</p>
                    <p className="mt-2 text-xl font-black text-white">{formatCurrency(revenueChart.currentMonth?.revenue ?? 0, locale)}</p>
                    {revenueChart.currentMonth ? (
                      <p className="mt-1 text-xs text-white/45">
                        {new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" }).format(
                          new Date(revenueChart.currentMonth.year, revenueChart.currentMonth.month - 1, 1)
                        )}
                      </p>
                    ) : null}
                    <p className={`mt-2 text-xs font-bold ${revenueChart.growth >= 0 ? "text-emerald-300" : "text-rose-300"}`}>
                      {revenueChart.growth >= 0 ? "+" : ""}{revenueChart.growth.toFixed(1)}% {tt("versusPreviousMonth")}
                    </p>
                  </div>
                  <div className="rounded-[22px] border border-white/8 bg-black/25 p-4">
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/35">{tt("monthlyOrders")}</p>
                    <p className="mt-2 text-xl font-black text-white">{revenueChart.currentMonth?.orders ?? 0}</p>
                    <p className="mt-2 text-xs text-white/45">{tt("previousMonthRevenue")}: {formatCurrency(revenueChart.previousMonth?.revenue ?? 0, locale)}</p>
                  </div>
                </div>
              </div>

              <div className="mt-7 rounded-[28px] border border-white/8 bg-black/25 p-4">
                <div className="relative h-[260px]">
                  {revenueChart.series.some((item) => item.revenue > 0) ? (
                    <svg className="h-full w-full overflow-visible" viewBox="0 0 720 220" preserveAspectRatio="none" role="img" aria-label={tt("monthlyRevenue")}>
                      <defs>
                        <linearGradient id="adminRevenueArea" x1="0" x2="0" y1="0" y2="1">
                          <stop offset="0%" stopColor="rgb(16,185,129)" stopOpacity="0.28" />
                          <stop offset="100%" stopColor="rgb(16,185,129)" stopOpacity="0.02" />
                        </linearGradient>
                        <linearGradient id="adminRevenueLine" x1="0" x2="1" y1="0" y2="0">
                          <stop offset="0%" stopColor="rgb(52,211,153)" />
                          <stop offset="55%" stopColor="rgb(56,189,248)" />
                          <stop offset="100%" stopColor="rgb(125,211,252)" />
                        </linearGradient>
                      </defs>
                      {[50, 100, 150, 200].map((y) => (
                        <line key={y} x1="28" x2="692" y1={y} y2={y} stroke="rgba(255,255,255,0.08)" strokeDasharray="5 8" />
                      ))}
                      <motion.path initial={{ opacity: 0 }} animate={{ opacity: 1 }} d={revenueChart.areaPath} fill="url(#adminRevenueArea)" />
                      <motion.path
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 0.9, ease: "easeOut" }}
                        d={revenueChart.linePath}
                        fill="none"
                        stroke="url(#adminRevenueLine)"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="4"
                      />
                      {revenueChart.points.map((point) => (
                        <g key={`${point.year}-${point.month}`}>
                          <circle cx={point.x} cy={point.y} r="5" fill="rgb(15,23,42)" stroke="rgb(125,211,252)" strokeWidth="3" />
                        </g>
                      ))}
                    </svg>
                  ) : (
                    <div className="flex h-full items-center justify-center rounded-[24px] border border-dashed border-white/8 text-sm font-semibold text-white/35">
                      {tt("noMonthlyRevenue")}
                    </div>
                  )}
                </div>

                <div className="mt-5 grid grid-cols-6 gap-2 lg:grid-cols-12">
                  {revenueChart.series.map((item) => {
                    const barHeight = `${Math.max((item.revenue / revenueChart.maxRevenue) * 76, item.revenue > 0 ? 12 : 3)}px`;
                    const monthLabel = new Intl.DateTimeFormat(locale, { month: "short" }).format(new Date(item.year, item.month - 1, 1));
                    return (
                      <div key={`${item.year}-${item.month}`} className="group min-w-0">
                        <div className="flex h-24 items-end rounded-2xl border border-white/8 bg-white/[0.03] p-1.5">
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: barHeight }}
                            className="w-full rounded-xl bg-gradient-to-t from-emerald-500 via-sky-400 to-cyan-200"
                            title={`${monthLabel} ${item.year}: ${formatCurrency(item.revenue, locale)} • ${item.orders} ${tt("orders")}`}
                          />
                        </div>
                        <p className="mt-2 truncate text-center text-[10px] font-bold uppercase tracking-[0.12em] text-white/35">{monthLabel}</p>
                        <p className="mt-1 truncate text-center text-[10px] text-white/50">{formatCurrency(item.revenue, locale)}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="rounded-[32px] border border-white/5 bg-zinc-900 p-7">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/30">{tt("system")}</p>
              <div className="mt-5 space-y-4">
                <div className="rounded-[22px] border border-emerald-500/15 bg-emerald-500/8 p-4">
                  <p className="font-bold text-white">{analytics.bestSeller?.name ?? tt("noBestSeller")}</p>
                  <p className="mt-2 text-sm text-white/55">{tt("currentBestSeller")} • {analytics.bestSeller?.salesCount ?? 0} {tt("sold")}</p>
                </div>
                <div className="rounded-[22px] border border-white/8 bg-black/25 p-4">
                  <p className="font-bold text-white">{libraryItems.length} {tt("libraryDocs")}</p>
                  <p className="mt-2 text-sm text-white/55">{tt("librarySourceDesc")}</p>
                </div>
                <div className="rounded-[22px] border border-white/8 bg-black/25 p-4">
                  <p className="font-bold text-white">{diagnoses.length} {tt("recentDiagnoses")}</p>
                  <p className="mt-2 text-sm text-white/55">{tt("diagnosisSignalDesc")}</p>
                </div>
              </div>
            </div>

            <div className="rounded-[32px] border border-white/5 bg-zinc-900 p-7">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/30">{tt("topProducts")}</p>
              <div className="mt-5 space-y-3">
                {topProducts.map((product) => (
                  <div key={product.id} className="flex items-center gap-3 rounded-[22px] border border-white/8 bg-black/25 p-3">
                    <img src={product.image} alt={product.name} className="h-16 w-16 rounded-2xl object-cover" referrerPolicy="no-referrer" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-bold text-white">{product.name}</p>
                      <p className="mt-1 text-sm text-white/50">{product.salesCount} {tt("sold")} • {product.stock} {tt("stock")}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[32px] border border-white/5 bg-zinc-900 p-7 xl:col-span-2">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/30">{tt("recentOrders")}</p>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                {recentOrders.map((order) => (
                  <div key={order.id} className="rounded-[24px] border border-white/8 bg-black/25 p-5">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-lg font-bold text-white">{order.code}</p>
                        <p className="mt-1 text-sm text-white/50">{order.customerName}</p>
                      </div>
                      <p className="text-sm font-bold text-emerald-300">{formatCurrency(order.total, locale)}</p>
                    </div>
                    <p className="mt-4 text-sm text-white/60">{statusLabel[order.status]} • {paymentStatusLabel[order.paymentStatus]}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[32px] border border-white/5 bg-zinc-900 p-7">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/30">{tt("lowStockAttention")}</p>
              <div className="mt-5 space-y-3">
                {lowStockProducts.map((product) => (
                  <div key={product.id} className="rounded-[22px] border border-amber-500/12 bg-amber-500/8 p-4">
                    <p className="font-bold text-white">{product.name}</p>
                    <p className="mt-2 text-sm text-white/55">{tt("stockLeft")} {product.stock} {tt("products")} • {product.category}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {!loading && tab === "products" && (
          <div className="mt-6 grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
            <div className="rounded-[32px] border border-white/5 bg-zinc-900 p-7">
              <div className="flex items-center gap-3">
                <PackagePlus className="h-5 w-5 text-sky-200" />
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/30">{tt("productEditor")}</p>
                  <h2 className="text-2xl font-black text-white">{form.id ? tt("updateProductTitle") : tt("createProductTitle")}</h2>
                </div>
              </div>

              <div className="mt-6 grid gap-4">
                {[
                  { key: "name", placeholder: tt("fieldName") },
                  { key: "category", placeholder: tt("fieldCategory") },
                  { key: "price", placeholder: tt("fieldPrice") },
                  { key: "originalPrice", placeholder: tt("fieldOriginalPrice") },
                  { key: "stock", placeholder: tt("fieldStock") },
                  { key: "sku", placeholder: tt("sku") },
                  { key: "manufacturer", placeholder: tt("fieldManufacturer") },
                  { key: "origin", placeholder: tt("fieldOrigin") },
                  { key: "image", placeholder: tt("fieldImage") },
                  { key: "shippingClass", placeholder: tt("fieldShipping") },
                  { key: "badge", placeholder: tt("badge") },
                  { key: "rating", placeholder: tt("rating") },
                  { key: "reviewCount", placeholder: tt("reviewCount") },
                  { key: "salesCount", placeholder: tt("salesCount") },
                ].map((field) => (
                  <input
                    key={field.key}
                    value={form[field.key as keyof ProductFormState] as string}
                    onChange={(event) => setForm((current) => ({ ...current, [field.key]: event.target.value }))}
                    placeholder={field.placeholder}
                    className="rounded-[22px] border border-white/10 bg-white/5 px-5 py-4 text-white outline-none placeholder:text-white/25 focus:border-sky-400"
                  />
                ))}

                <textarea value={form.shortDescription} onChange={(e) => setForm((c) => ({ ...c, shortDescription: e.target.value }))} placeholder={tt("shortDesc")} rows={3} className="rounded-[22px] border border-white/10 bg-white/5 px-5 py-4 text-white outline-none placeholder:text-white/25 focus:border-sky-400" />
                <textarea value={form.description} onChange={(e) => setForm((c) => ({ ...c, description: e.target.value }))} placeholder={tt("detailDesc")} rows={4} className="rounded-[22px] border border-white/10 bg-white/5 px-5 py-4 text-white outline-none placeholder:text-white/25 focus:border-sky-400" />
                <textarea value={form.tags} onChange={(e) => setForm((c) => ({ ...c, tags: e.target.value }))} placeholder={tt("tagsComma")} rows={3} className="rounded-[22px] border border-white/10 bg-white/5 px-5 py-4 text-white outline-none placeholder:text-white/25 focus:border-sky-400" />
                <textarea value={form.benefits} onChange={(e) => setForm((c) => ({ ...c, benefits: e.target.value }))} placeholder={tt("benefitsLines")} rows={4} className="rounded-[22px] border border-white/10 bg-white/5 px-5 py-4 text-white outline-none placeholder:text-white/25 focus:border-sky-400" />
                <textarea value={form.specs} onChange={(e) => setForm((c) => ({ ...c, specs: e.target.value }))} placeholder={tt("specsPlaceholder")} rows={4} className="rounded-[22px] border border-white/10 bg-white/5 px-5 py-4 text-white outline-none placeholder:text-white/25 focus:border-sky-400" />

                <label className="flex items-center gap-3 rounded-[22px] border border-white/10 bg-white/5 px-5 py-4 text-white/70">
                  <input type="checkbox" checked={form.featured} onChange={(e) => setForm((c) => ({ ...c, featured: e.target.checked }))} />
                  {tt("featuredProduct")}
                </label>
                <label className="flex items-center gap-3 rounded-[22px] border border-white/10 bg-white/5 px-5 py-4 text-white/70">
                  <input type="checkbox" checked={form.bestSeller} onChange={(e) => setForm((c) => ({ ...c, bestSeller: e.target.checked }))} />
                  {tt("bestSeller")}
                </label>

                <div className="flex gap-3">
                  <button onClick={() => void handleSubmitProduct()} disabled={saving || !form.name.trim() || !form.price.trim() || !form.image.trim()} className="flex-1 rounded-[24px] bg-sky-500 px-6 py-4 text-sm font-bold uppercase tracking-[0.22em] text-slate-950 disabled:cursor-not-allowed disabled:opacity-40">
                    {saving ? tt("saving") : form.id ? tt("updateProduct") : tt("createProduct")}
                  </button>
                  <button onClick={() => setForm(defaultLocalizedForm)} className="rounded-[24px] border border-white/10 bg-white/5 px-6 py-4 text-sm font-bold uppercase tracking-[0.22em] text-white">
                    {tt("reset")}
                  </button>
                </div>
              </div>
            </div>

            <div className="rounded-[32px] border border-white/5 bg-zinc-900 p-7">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/30">{tt("productWarehouse")}</p>
              <div className="mt-5 space-y-4">
                {products.map((product) => (
                  <div key={product.id} className="flex flex-col gap-4 rounded-[26px] border border-white/8 bg-black/20 p-4 md:flex-row md:items-center">
                    <img src={product.image} alt={product.name} className="h-24 w-full rounded-3xl object-cover md:w-28" referrerPolicy="no-referrer" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-lg font-bold text-white">{product.name}</p>
                        {product.badge && <span className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-emerald-200">{product.badge}</span>}
                      </div>
                      <p className="mt-2 text-sm text-white/50">{product.category} • SKU {product.sku}</p>
                      <div className="mt-3 flex flex-wrap gap-4 text-sm text-white/60">
                        <span>{formatCurrency(product.price, locale)}</span>
                        <span>{tt("stock")} {product.stock}</span>
                        <span>{tt("sold")} {product.salesCount}</span>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <button onClick={() => handleEditProduct(product)} className="rounded-2xl border border-white/10 bg-white/5 p-3 text-white"><Pencil className="h-4 w-4" /></button>
                      <button onClick={() => void handleDeleteProduct(product.id)} className="rounded-2xl border border-red-500/15 bg-red-500/10 p-3 text-red-200"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {!loading && tab === "orders" && (
          <div className="mt-6 rounded-[32px] border border-white/5 bg-zinc-900 p-7">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/30">{tt("orderCenter")}</p>
                <h2 className="mt-2 text-2xl font-black text-white">{tt("orderManagement")}</h2>
                <p className="mt-2 text-sm text-white/50">{tt("orderManagementDesc")}</p>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
                  <input
                    value={orderSearch}
                    onChange={(event) => setOrderSearch(event.target.value)}
                    placeholder={tt("orderSearchPlaceholder")}
                    className="w-full rounded-[18px] border border-white/10 bg-white/5 py-3 pl-11 pr-4 text-sm text-white outline-none placeholder:text-white/25"
                  />
                </div>
                <select
                  value={orderStatusFilter}
                  onChange={(event) => setOrderStatusFilter(event.target.value as "all" | ShopOrder["status"])}
                  className="rounded-[18px] border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none"
                >
                  <option value="all">{tt("allOrderStatus")}</option>
                  <option value="pending">{statusLabel.pending}</option>
                  <option value="confirmed">{statusLabel.confirmed}</option>
                  <option value="shipping">{statusLabel.shipping}</option>
                  <option value="delivered">{statusLabel.delivered}</option>
                  <option value="cancelled">{statusLabel.cancelled}</option>
                </select>
                <select
                  value={paymentStatusFilter}
                  onChange={(event) => setPaymentStatusFilter(event.target.value as "all" | ShopOrder["paymentStatus"])}
                  className="rounded-[18px] border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none"
                >
                  <option value="all">{tt("allPaymentStatus")}</option>
                  <option value="pending">{paymentStatusLabel.pending}</option>
                  <option value="paid">{paymentStatusLabel.paid}</option>
                  <option value="failed">{paymentStatusLabel.failed}</option>
                  <option value="refunded">{paymentStatusLabel.refunded}</option>
                </select>
              </div>
            </div>
            <div className="mt-5 rounded-[28px] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(0,0,0,0.12))] p-5">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-200">
                    <Clock3 className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-lg font-black text-white">{tt("orderList")}</p>
                    <p className="mt-1 text-sm text-white/45">{tt("orderFilterHint")}</p>
                  </div>
                </div>
                <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-white/60">
                  {filteredOrders.length} {tt("orderUnit")}
                </span>
              </div>
              <div className="mt-5 space-y-4">
                {filteredOrders.map((order) => (
                  <div key={order.id} className="rounded-[24px] border border-white/8 bg-zinc-950/55 p-4">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="text-lg font-bold text-white">{order.code}</p>
                        <p className="mt-1 text-sm text-white/50">{order.customerName} • {order.customerPhone}</p>
                        <p className="mt-1 text-sm text-white/40">{new Date(order.createdAt).toLocaleString(locale)}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <span className={`rounded-full border px-4 py-2 text-[10px] font-bold uppercase tracking-[0.22em] ${statusTone[order.status]}`}>{statusLabel[order.status]}</span>
                        <span className={`rounded-full border px-4 py-2 text-[10px] font-bold uppercase tracking-[0.22em] ${paymentTone[order.paymentStatus]}`}>{paymentStatusLabel[order.paymentStatus]}</span>
                      </div>
                    </div>
                    <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_1fr_auto]">
                      <select
                        value={order.status}
                        disabled={orderUpdatingId === order.id}
                        onChange={(event) => void handleUpdateOrder(order.id, { status: event.target.value as ShopOrder["status"] })}
                        className="rounded-[18px] border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none disabled:opacity-50"
                      >
                        <option value="pending">{statusLabel.pending}</option>
                        <option value="confirmed">{statusLabel.confirmed}</option>
                        <option value="shipping">{statusLabel.shipping}</option>
                        <option value="delivered">{statusLabel.delivered}</option>
                        <option value="cancelled">{statusLabel.cancelled}</option>
                      </select>
                      <select
                        value={order.paymentStatus}
                        disabled={orderUpdatingId === order.id}
                        onChange={(event) => void handleUpdateOrder(order.id, { paymentStatus: event.target.value as ShopOrder["paymentStatus"] })}
                        className="rounded-[18px] border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none disabled:opacity-50"
                      >
                        <option value="pending">{paymentStatusLabel.pending}</option>
                        <option value="paid">{paymentStatusLabel.paid}</option>
                        <option value="failed">{paymentStatusLabel.failed}</option>
                        <option value="refunded">{paymentStatusLabel.refunded}</option>
                      </select>
                      <button
                        onClick={() => void handleUpdateOrder(order.id, { status: "shipping", paymentStatus: order.paymentStatus === "pending" ? "paid" : order.paymentStatus })}
                        disabled={orderUpdatingId === order.id}
                        className="inline-flex items-center justify-center gap-2 rounded-[18px] border border-sky-500/20 bg-sky-500/10 px-4 py-3 text-sm font-bold text-sky-200 disabled:opacity-50"
                      >
                        <Truck className="h-4 w-4" />
                        {tt("pushToShipping")}
                      </button>
                    </div>
                    <div className="mt-4 grid gap-3">
                      {order.items.map((item) => (
                        <div key={`${order.id}-${item.productId}`} className="flex items-center gap-3 rounded-[18px] border border-white/8 bg-white/5 p-3">
                          <img src={item.productImage} alt={item.productName} className="h-14 w-14 rounded-2xl object-cover" referrerPolicy="no-referrer" />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-bold text-white">{item.productName}</p>
                            <p className="mt-1 text-xs text-white/45">{tt("qty")} {item.quantity} • {formatCurrency(item.unitPrice, locale)}</p>
                          </div>
                          <p className="text-sm font-bold text-emerald-300">{formatCurrency(item.lineTotal, locale)}</p>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 flex justify-end">
                      <button
                        onClick={() => openOrderSupportMessenger(order.id)}
                        className="inline-flex items-center gap-2 rounded-[18px] border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm font-bold text-emerald-200"
                      >
                        <MessageSquare className="h-4 w-4" />
                        {tt("orderChat")}
                      </button>
                    </div>
                    <div className="mt-4 flex flex-col gap-2 text-sm text-white/60">
                      <span>{order.customerEmail}</span>
                      <span>{order.shippingAddress}</span>
                      <span className="text-lg font-black text-white">{formatCurrency(order.total, locale)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {filteredOrders.length === 0 ? (
              <div className="mt-6 rounded-[26px] border border-white/8 bg-black/20 p-8 text-center text-sm text-white/50">
                {tt("noOrders")}
              </div>
            ) : null}
          </div>
        )}

        {!loading && tab === "community" && (
          <div className="mt-6 grid gap-6 xl:grid-cols-3">
            <div className="rounded-[32px] border border-white/5 bg-zinc-900 p-7">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/30">{tt("forum")}</p>
              <p className="mt-2 text-3xl font-black text-white">{posts.length}</p>
              <p className="mt-2 text-sm text-white/55">{tt("forumDesc")}</p>
              <div className="mt-5 space-y-3">
                {posts.slice(0, 5).map((post) => (
                  <div key={post.id} className="rounded-[22px] border border-white/8 bg-black/25 p-4">
                    <p className="font-bold text-white">{post.title}</p>
                    <p className="mt-2 text-sm text-white/50">{post.authorName} • {post.commentCount} {tt("comments")} • {post.voteScore} {tt("points")}</p>
                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={() => void handleDeleteCommunityPost(post.id)}
                        className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-red-200"
                      >
                        {tt("deletePost")}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[32px] border border-white/5 bg-zinc-900 p-7">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/30">{tt("pendingReports")}</p>
              <p className="mt-2 text-3xl font-black text-white">{reports.filter((report) => report.status === "open" || report.status === "reviewing").length}</p>
              <p className="mt-2 text-sm text-white/55">{tt("moderationQueue")}</p>
              <div className="mt-5 space-y-3">
                {reports.slice(0, 5).map((report) => (
                  <div key={report.id} className="rounded-[22px] border border-white/8 bg-black/25 p-4">
                    <p className="font-bold text-white">{report.postTitle}</p>
                    <p className="mt-2 text-sm text-white/50">{report.reporterName} • {report.reason}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button onClick={() => void handleUpdateReportStatus(report.id, "reviewing")} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-white/70">{tt("reviewing")}</button>
                      <button onClick={() => void handleUpdateReportStatus(report.id, "resolved")} className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-200">{tt("resolved")}</button>
                      <button onClick={() => void handleUpdateReportStatus(report.id, "dismissed")} className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-amber-200">{tt("dismissed")}</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[32px] border border-white/5 bg-zinc-900 p-7">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/30">{tt("communitySystem")}</p>
              <div className="mt-5 space-y-4">
                <div className="rounded-[22px] border border-white/8 bg-black/25 p-4">
                  <div className="flex items-center gap-3">
                    <BookOpen className="h-5 w-5 text-emerald-300" />
                    <div>
                      <p className="font-bold text-white">{libraryItems.length} {tt("libraryPosts")}</p>
                      <p className="text-sm text-white/50">{tt("userContentDesc")}</p>
                    </div>
                  </div>
                </div>
                <div className="rounded-[22px] border border-white/8 bg-black/25 p-4">
                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-sky-200" />
                    <div>
                      <p className="font-bold text-white">{mostActiveAuthors.length} {tt("activeAuthors")}</p>
                      <p className="text-sm text-white/50">{tt("activeAuthorsDesc")}</p>
                    </div>
                  </div>
                </div>
                <div className="rounded-[22px] border border-white/8 bg-black/25 p-4">
                  <div className="flex items-center gap-3">
                    <Sprout className="h-5 w-5 text-emerald-300" />
                    <div>
                      <p className="font-bold text-white">{cycles.length} {tt("growthCycles")}</p>
                      <p className="text-sm text-white/50">{tt("localGrowthDesc")}</p>
                    </div>
                  </div>
                </div>
                {mostActiveAuthors.map(([name, count]) => (
                  <div key={name} className="rounded-[22px] border border-white/8 bg-black/25 p-4">
                    <p className="font-bold text-white">{name}</p>
                    <p className="mt-2 text-sm text-white/50">{count} {tt("postCount")}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {!loading && tab === "users" && (
          <div className="mt-6 grid gap-6 xl:grid-cols-[0.7fr_1.3fr]">
            <div className="rounded-[32px] border border-white/5 bg-zinc-900 p-7">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/30">{tt("userControl")}</p>
              <h2 className="mt-2 text-2xl font-black text-white">{tt("userManagement")}</h2>
              <p className="mt-3 text-sm leading-relaxed text-white/55">
                {tt("userManagementDesc")}
              </p>
              <div className="mt-6 grid gap-4">
                {[
                  { label: tt("totalUsers"), value: String(users.length), note: tt("readFromAdminOverview") },
                  { label: tt("adminRole"), value: String(users.filter((entry) => entry.role === "admin").length), note: tt("adminAccounts") },
                  { label: tt("active"), value: String(users.filter((entry) => entry.isActive).length), note: tt("activeNote") },
                ].map((item) => (
                  <div key={item.label} className="rounded-[22px] border border-white/8 bg-black/25 p-4">
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/30">{item.label}</p>
                    <p className="mt-2 text-3xl font-black text-white">{item.value}</p>
                    <p className="mt-2 text-sm text-white/50">{item.note}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[32px] border border-white/5 bg-zinc-900 p-7">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/30">{tt("accountList")}</p>
                  <h3 className="mt-2 text-xl font-black text-white">{tt("usersAndRoles")}</h3>
                </div>
                <div className="relative w-full max-w-md">
                  <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
                  <input
                    value={userSearch}
                    onChange={(event) => setUserSearch(event.target.value)}
                    placeholder={tt("userSearchPlaceholder")}
                    className="w-full rounded-[18px] border border-white/10 bg-white/5 py-3 pl-11 pr-4 text-sm text-white outline-none placeholder:text-white/25"
                  />
                </div>
              </div>
              <div className="mt-5 space-y-4">
                {filteredUsers.map((entry) => (
                  <div key={entry.id} className="rounded-[24px] border border-white/8 bg-black/20 p-4">
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-lg font-bold text-white">{entry.fullName || entry.email || tt("unnamed")}</p>
                        <p className="mt-1 break-all text-sm text-white/50">{entry.email || entry.id}</p>
                        <p className="mt-1 text-xs text-white/35">ID: {entry.id}</p>
                      </div>
                      <div className="grid gap-3 md:grid-cols-3">
                        <select
                          value={entry.role}
                          disabled={userUpdatingId === entry.id}
                          onChange={(event) => void handleUpdateUser(entry.id, { role: event.target.value as AdminUserProfile["role"] })}
                          className="rounded-[18px] border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none disabled:opacity-50"
                        >
                          <option value="user">{tt("userRole")}</option>
                          <option value="admin">{tt("adminRole")}</option>
                        </select>
                        <select
                          value={entry.isActive ? "active" : "inactive"}
                          disabled={userUpdatingId === entry.id}
                          onChange={(event) => void handleUpdateUser(entry.id, { isActive: event.target.value === "active" })}
                          className="rounded-[18px] border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none disabled:opacity-50"
                        >
                          <option value="active">{tt("active")}</option>
                          <option value="inactive">{tt("inactive")}</option>
                        </select>
                        <button
                          onClick={() => void handleUpdateUser(entry.id, { isActive: !entry.isActive })}
                          disabled={userUpdatingId === entry.id}
                          className="rounded-[18px] border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-white/80 disabled:opacity-50"
                        >
                          {entry.isActive ? tt("quickLock") : tt("quickUnlock")}
                        </button>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className={`rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] ${entry.role === "admin" ? "border-sky-500/20 bg-sky-500/10 text-sky-200" : "border-white/10 bg-white/5 text-white/60"}`}>
                        {entry.role === "admin" ? tt("adminRole") : tt("userRole")}
                      </span>
                      <span className={`rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] ${entry.isActive ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-200" : "border-amber-500/20 bg-amber-500/10 text-amber-200"}`}>
                        {entry.isActive ? tt("active") : tt("inactive")}
                      </span>
                    </div>
                  </div>
                ))}
                {filteredUsers.length === 0 ? (
                  <div className="rounded-[24px] border border-white/8 bg-black/20 p-8 text-center text-sm text-white/50">
                    {tt("noUsers")}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        )}

        {!loading && (
          <div className="mt-6 rounded-[28px] border border-white/8 bg-zinc-900 px-6 py-4 text-sm text-white/55">
            {tt("dashboardSourcePrefix")} <span className="font-bold text-white">{dataSourceLabel}</span>, {tt("dashboardSourceSuffix")}
          </div>
        )}
      </div>

      {orderNotification ? (
        <div className="fixed bottom-6 right-6 z-[240] w-full max-w-md rounded-[28px] border border-emerald-400/20 bg-zinc-900/96 p-5 shadow-2xl shadow-black/30 backdrop-blur-xl">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-300">
              <BellRing className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-white">{tt("newOrderToast")}</p>
              <p className="mt-2 text-sm text-white/65">
                {orderNotification.code} • {orderNotification.customerName} • {formatCurrency(orderNotification.total, locale)}
              </p>
              <div className="mt-4 flex gap-3">
                <button
                  onClick={() => {
                    setTab("orders");
                    setOrderNotification(null);
                  }}
                  className="rounded-2xl bg-emerald-500 px-4 py-3 text-xs font-bold uppercase tracking-[0.18em] text-slate-950"
                >
                  {tt("viewOrder")}
                </button>
                <button
                  onClick={() => setOrderNotification(null)}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs font-bold uppercase tracking-[0.18em] text-white/70"
                >
                  {tt("close")}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default AdminView;
