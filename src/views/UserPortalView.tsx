import React, { startTransition, useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BookMarked,
  Camera,
  CheckCircle2,
  ClipboardList,
  Library,
  LogIn,
  MessageSquare,
  ShoppingBag,
  Sprout,
  Truck,
  UserRound,
  XCircle,
} from "lucide-react";
import { collection, db, limit, onSnapshot, orderBy, query, where } from "../lib/localDb";
import { listCommunityCommentsByAuthor, listCommunityPostsByAuthor } from "../services/communityService";
import { subscribeToDiagnoses } from "../services/diagnosisService";
import { handleFirestoreError, OperationType } from "../services/firestoreService";
import { getLibraryBookmarks, LibraryArticle, loadLibraryArticles } from "../services/libraryService";
import {
  openOrderSupportMessenger,
} from "../services/orderSupportService";
import { getShopBootstrap, updateShopOrder } from "../services/shopService";
import portalHeroImage from "../../anh/sinhtruong4.jpg";
import {
  AppUser,
  CommunityCommentActivity,
  CommunityPost,
  Diagnosis,
  GrowthCycle,
  ProtocolBookmark,
  ShopOrder,
  View,
} from "../types";
import { LocalizedDictionary, useI18n } from "../i18n";

interface UserPortalViewProps {
  user: AppUser | null;
  onLogin: () => void | Promise<void>;
  setView: (view: View) => void;
}

type PortalTab = "overview" | "orders" | "growth" | "community" | "library";

const portalText: LocalizedDictionary = {
  orderStats: { vi: "Đơn hàng", en: "Orders", ja: "注文" },
  diagnosisStats: { vi: "Chẩn đoán", en: "Diagnoses", ja: "診断" },
  growthStats: { vi: "Mùa vụ", en: "Seasons", ja: "作期" },
  postStats: { vi: "Bài đăng", en: "Posts", ja: "投稿" },
  overview: { vi: "Tổng quan", en: "Overview", ja: "概要" },
  recentWork: { vi: "Việc gần đây", en: "Recent work", ja: "最近の活動" },
  orders: { vi: "Đơn hàng", en: "Orders", ja: "注文" },
  purchaseHistory: { vi: "Lịch sử mua", en: "Purchase history", ja: "購入履歴" },
  growth: { vi: "Mùa vụ", en: "Growth", ja: "生育" },
  cropTracking: { vi: "Theo dõi cây", en: "Crop tracking", ja: "作物追跡" },
  community: { vi: "Cộng đồng", en: "Community", ja: "コミュニティ" },
  postsComments: { vi: "Bài và bình luận", en: "Posts and comments", ja: "投稿とコメント" },
  library: { vi: "Thư viện", en: "Library", ja: "ライブラリ" },
  savedDocs: { vi: "Tài liệu đã lưu", en: "Saved documents", ja: "保存済み資料" },
  diagnoseImage: { vi: "Chẩn đoán ảnh", en: "Diagnose image", ja: "画像診断" },
  trackSeason: { vi: "Theo dõi mùa vụ", en: "Track season", ja: "作期を追跡" },
  openLibrary: { vi: "Mở thư viện", en: "Open library", ja: "ライブラリを開く" },
  buySupplies: { vi: "Mua vật tư", en: "Buy supplies", ja: "資材を購入" },
  userPortal: { vi: "Trang người dùng", en: "User portal", ja: "ユーザーポータル" },
  loginPrompt: {
    vi: "Đăng nhập để xem đơn hàng, lịch sử chẩn đoán, mùa vụ, hoạt động cộng đồng và tài liệu đã lưu.",
    en: "Sign in to view orders, diagnosis history, seasons, community activity, and saved documents.",
    ja: "ログインすると、注文、診断履歴、作期、コミュニティ活動、保存資料を確認できます。",
  },
  login: { vi: "Đăng nhập", en: "Sign in", ja: "ログイン" },
  personalWorkspace: { vi: "Workspace cá nhân", en: "Personal workspace", ja: "個人ワークスペース" },
  memberName: { vi: "Thành viên Terraform Flora", en: "Terraform Flora member", ja: "Terraform Floraメンバー" },
  personalSummary: {
    vi: "Tổng hợp nhanh hoạt động cá nhân: đơn hàng, chẩn đoán, mùa vụ, cộng đồng và tài liệu đã lưu.",
    en: "A quick summary of your personal activity: orders, diagnoses, seasons, community, and saved documents.",
    ja: "注文、診断、作期、コミュニティ、保存資料など個人活動をすばやく確認できます。",
  },
  userRole: { vi: "Người dùng", en: "User", ja: "ユーザー" },
  comments: { vi: "bình luận", en: "comments", ja: "コメント" },
  active: { vi: "Đang hoạt động", en: "Active", ja: "アクティブ" },
  heroAlt: { vi: "Không gian nông nghiệp", en: "Agriculture workspace", ja: "農業ワークスペース" },
  opsProfile: { vi: "Hồ sơ vận hành", en: "Operations profile", ja: "運用プロフィール" },
  manageData: { vi: "Quản lý dữ liệu nông nghiệp cá nhân", en: "Manage personal agriculture data", ja: "個人農業データを管理" },
  shortcuts: { vi: "Lối tắt", en: "Shortcuts", ja: "ショートカット" },
  frequentWork: { vi: "Việc thường dùng", en: "Frequent actions", ja: "よく使う操作" },
  recentOrders: { vi: "Đơn hàng gần đây", en: "Recent orders", ja: "最近の注文" },
  noOrders: { vi: "Chưa có đơn hàng nào.", en: "No orders yet.", ja: "注文はまだありません。" },
  recentDiagnoses: { vi: "Chẩn đoán gần đây", en: "Recent diagnoses", ja: "最近の診断" },
  noDiagnoses: { vi: "Chưa có lịch sử chẩn đoán nào.", en: "No diagnosis history yet.", ja: "診断履歴はまだありません。" },
  shoppingHistory: { vi: "Lịch sử mua hàng", en: "Shopping history", ja: "購入履歴" },
  yourOrders: { vi: "Đơn hàng của bạn", en: "Your orders", ja: "あなたの注文" },
  openShop: { vi: "Mở shop", en: "Open shop", ja: "ショップを開く" },
  quantity: { vi: "SL", en: "Qty", ja: "数量" },
  noUserOrders: { vi: "Bạn chưa có đơn hàng nào.", en: "You do not have any orders yet.", ja: "注文はまだありません。" },
  status: { vi: "Trạng thái", en: "Status", ja: "状態" },
  paymentStatus: { vi: "Thanh toán", en: "Payment", ja: "支払い" },
  pending: { vi: "Chờ xử lý", en: "Pending", ja: "処理待ち" },
  confirmed: { vi: "Đã xác nhận", en: "Confirmed", ja: "確認済み" },
  shipping: { vi: "Đang giao", en: "Shipping", ja: "配送中" },
  delivered: { vi: "Hoàn tất", en: "Delivered", ja: "完了" },
  cancelled: { vi: "Đã hủy", en: "Cancelled", ja: "キャンセル" },
  paymentPending: { vi: "Chờ thanh toán", en: "Payment pending", ja: "支払い待ち" },
  paid: { vi: "Đã thanh toán", en: "Paid", ja: "支払い済み" },
  failed: { vi: "Thanh toán lỗi", en: "Payment failed", ja: "支払い失敗" },
  refunded: { vi: "Đã hoàn tiền", en: "Refunded", ja: "返金済み" },
  deliveryAddress: { vi: "Địa chỉ giao hàng", en: "Delivery address", ja: "配送先" },
  cancelOrder: { vi: "Hủy đơn", en: "Cancel order", ja: "注文をキャンセル" },
  cancelling: { vi: "Đang hủy...", en: "Cancelling...", ja: "キャンセル中..." },
  cannotCancel: { vi: "Đơn đã giao hoặc đang giao không thể hủy tại đây.", en: "Delivered or shipping orders cannot be cancelled here.", ja: "配送中または完了済みの注文はここでキャンセルできません。" },
  chatAdmin: { vi: "Chat với admin", en: "Chat with admin", ja: "管理者にチャット" },
  yourSeasons: { vi: "Mùa vụ của bạn", en: "Your seasons", ja: "あなたの作期" },
  growthCycle: { vi: "Chu kỳ sinh trưởng", en: "Growth cycle", ja: "生育サイクル" },
  openModule: { vi: "Mở module", en: "Open module", ja: "モジュールを開く" },
  noCycles: { vi: "Chưa có chu kỳ nào được tạo.", en: "No cycles have been created yet.", ja: "作成されたサイクルはまだありません。" },
  savedProtocols: { vi: "Phác đồ đã lưu", en: "Saved protocols", ja: "保存済みプロトコル" },
  noProtocols: { vi: "Bạn chưa lưu protocol nào.", en: "You have not saved any protocols yet.", ja: "保存済みプロトコルはまだありません。" },
  protocolBookmark: { vi: "Bookmark protocol", en: "Protocol bookmark", ja: "プロトコルブックマーク" },
  postedArticles: { vi: "Bài viết đã đăng", en: "Published posts", ja: "投稿済み記事" },
  yourCommunity: { vi: "Cộng đồng của bạn", en: "Your community", ja: "あなたのコミュニティ" },
  openForum: { vi: "Mở diễn đàn", en: "Open forum", ja: "フォーラムを開く" },
  noPosts: { vi: "Bạn chưa đăng bài nào trong cộng đồng.", en: "You have not posted in the community yet.", ja: "コミュニティ投稿はまだありません。" },
  points: { vi: "điểm", en: "points", ja: "点" },
  commentActivity: { vi: "Hoạt động bình luận", en: "Comment activity", ja: "コメント活動" },
  noComments: { vi: "Bạn chưa viết bình luận nào trong cộng đồng.", en: "You have not written any community comments yet.", ja: "コミュニティコメントはまだありません。" },
  replyComment: { vi: "Trả lời bình luận", en: "Comment reply", ja: "コメント返信" },
  postComment: { vi: "Bình luận bài viết", en: "Post comment", ja: "投稿コメント" },
  postBy: { vi: "Bài của", en: "Post by", ja: "投稿者" },
  documentBookmarks: { vi: "Bookmark tài liệu", en: "Document bookmarks", ja: "資料ブックマーク" },
  savedLibrary: { vi: "Thư viện đã lưu", en: "Saved library", ja: "保存済みライブラリ" },
  noLibraryBookmarks: { vi: "Bạn chưa bookmark tài liệu nào trong thư viện.", en: "You have not bookmarked any library documents yet.", ja: "ライブラリ資料のブックマークはまだありません。" },
  knowledgeBase: { vi: "Kho tri thức", en: "Knowledge base", ja: "ナレッジベース" },
  featuredDocs: { vi: "Tài liệu nổi bật", en: "Featured documents", ja: "注目資料" },
};

const getLocale = (language: string) => (language === "vi" ? "vi-VN" : language === "ja" ? "ja-JP" : "en-US");

const panelClass = "rounded-[28px] border border-emerald-950/10 bg-white/92 p-5 shadow-[0_18px_55px_rgba(24,50,37,0.08)] backdrop-blur";
const labelClass = "text-[11px] font-black uppercase tracking-[0.2em] text-slate-500";
const listItemClass = "rounded-[20px] border border-emerald-950/10 bg-white px-4 py-3 shadow-[0_8px_24px_rgba(24,50,37,0.04)]";
const orderStatusTone: Record<ShopOrder["status"], string> = {
  pending: "border-amber-200 bg-amber-50 text-amber-800",
  confirmed: "border-sky-200 bg-sky-50 text-sky-800",
  shipping: "border-violet-200 bg-violet-50 text-violet-800",
  delivered: "border-emerald-200 bg-emerald-50 text-emerald-800",
  cancelled: "border-rose-200 bg-rose-50 text-rose-800",
};
const paymentStatusTone: Record<ShopOrder["paymentStatus"], string> = {
  pending: "border-amber-200 bg-amber-50 text-amber-800",
  paid: "border-emerald-200 bg-emerald-50 text-emerald-800",
  failed: "border-rose-200 bg-rose-50 text-rose-800",
  refunded: "border-slate-200 bg-slate-50 text-slate-700",
};

const UserPortalView = ({ user, onLogin, setView }: UserPortalViewProps) => {
  const { language } = useI18n();
  const tt = (key: string) => portalText[key]?.[language] ?? portalText[key]?.vi ?? key;
  const locale = getLocale(language);
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat(locale, { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(value);
  const formatDateTime = (value: string) => new Date(value).toLocaleString(locale);
  const orderStatusLabel: Record<ShopOrder["status"], string> = {
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
  const [diagnoses, setDiagnoses] = useState<Diagnosis[]>([]);
  const [cycles, setCycles] = useState<GrowthCycle[]>([]);
  const [bookmarks, setBookmarks] = useState<ProtocolBookmark[]>([]);
  const [communityPosts, setCommunityPosts] = useState<CommunityPost[]>([]);
  const [communityComments, setCommunityComments] = useState<CommunityCommentActivity[]>([]);
  const [orders, setOrders] = useState<ShopOrder[]>([]);
  const [orderUpdatingId, setOrderUpdatingId] = useState<string | null>(null);
  const [libraryBookmarks, setLibraryBookmarks] = useState<string[]>([]);
  const [libraryItems, setLibraryItems] = useState<LibraryArticle[]>([]);
  const [tab, setTab] = useState<PortalTab>("overview");

  useEffect(() => {
    if (!user) return;

    const unsubs = [
      subscribeToDiagnoses({
        userId: user.uid,
        take: 6,
        onData: setDiagnoses,
        onError: (err) => console.error("User diagnoses load error:", err),
      }),
      onSnapshot(
        query(collection(db, "growthCycles"), where("userId", "==", user.uid), orderBy("lastUpdate", "desc"), limit(6)),
        (snapshot) => setCycles(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as GrowthCycle))),
        (err) => handleFirestoreError(err, OperationType.LIST, "growthCycles")
      ),
      onSnapshot(
        query(collection(db, "protocolBookmarks"), where("userId", "==", user.uid), limit(8)),
        (snapshot) => setBookmarks(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as ProtocolBookmark))),
        (err) => handleFirestoreError(err, OperationType.LIST, "protocolBookmarks")
      ),
    ];

    void getShopBootstrap().then((data) => {
      setOrders(
        data.orders.filter(
          (order) => order.userId === user.uid || (!!user.email && order.customerEmail?.toLowerCase() === user.email.toLowerCase())
        )
      );
    });
    void loadLibraryArticles().then((result) => setLibraryItems(result.articles));
    void listCommunityPostsByAuthor(user.uid).then(setCommunityPosts).catch(() => setCommunityPosts([]));
    void listCommunityCommentsByAuthor(user.uid).then(setCommunityComments).catch(() => setCommunityComments([]));

    setLibraryBookmarks(getLibraryBookmarks(user.uid));

    return () => {
      unsubs.forEach((unsubscribe) => unsubscribe());
    };
  }, [user]);

  useEffect(() => {
    const handleFocusOrder = (event: Event) => {
      const customEvent = event as CustomEvent<{ orderId?: string; orderCode?: string }>;
      setTab("orders");
      if (customEvent.detail?.orderId) {
        const targetOrder = customEvent.detail.orderId;
        startTransition(() => {
          setOrders((current) => {
            const matched = current.find((order) => order.id === targetOrder);
            return matched ? [matched, ...current.filter((order) => order.id !== targetOrder)] : current;
          });
        });
      }
    };

    window.addEventListener("terraform-flora.order-support.focus-order", handleFocusOrder as EventListener);
    return () => {
      window.removeEventListener("terraform-flora.order-support.focus-order", handleFocusOrder as EventListener);
    };
  }, []);

  const savedArticles = useMemo(
    () => libraryItems.filter((article) => libraryBookmarks.includes(article.id)),
    [libraryBookmarks, libraryItems]
  );

  const stats = useMemo(
    () => [
      { label: tt("orderStats"), value: orders.length, icon: ShoppingBag },
      { label: tt("diagnosisStats"), value: diagnoses.length, icon: Camera },
      { label: tt("growthStats"), value: cycles.length, icon: Sprout },
      { label: tt("postStats"), value: communityPosts.length, icon: MessageSquare },
    ],
    [communityPosts.length, cycles.length, diagnoses.length, orders.length, language]
  );

  const tabs: { id: PortalTab; label: string; desc: string; icon: React.ElementType }[] = [
    { id: "overview", label: tt("overview"), desc: tt("recentWork"), icon: ClipboardList },
    { id: "orders", label: tt("orders"), desc: tt("purchaseHistory"), icon: ShoppingBag },
    { id: "growth", label: tt("growth"), desc: tt("cropTracking"), icon: Sprout },
    { id: "community", label: tt("community"), desc: tt("postsComments"), icon: MessageSquare },
    { id: "library", label: tt("library"), desc: tt("savedDocs"), icon: Library },
  ];

  const quickActions = [
    { title: tt("diagnoseImage"), view: "diagnosis" as View, icon: Camera },
    { title: tt("trackSeason"), view: "growth" as View, icon: Sprout },
    { title: tt("openLibrary"), view: "library" as View, icon: Library },
    { title: tt("buySupplies"), view: "shop" as View, icon: ShoppingBag },
  ];

  const refreshOrders = async () => {
    if (!user) return;
    const data = await getShopBootstrap();
    setOrders(
      data.orders.filter(
        (order) => order.userId === user.uid || (!!user.email && order.customerEmail?.toLowerCase() === user.email.toLowerCase())
      )
    );
  };

  const handleCancelOrder = async (order: ShopOrder) => {
    if (!["pending", "confirmed"].includes(order.status)) return;
    setOrderUpdatingId(order.id);
    try {
      const paymentStatus = order.paymentStatus === "paid" ? "refunded" : order.paymentStatus;
      const updated = await updateShopOrder({ orderId: order.id, status: "cancelled", paymentStatus });
      if (updated) {
        setOrders((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      } else {
        await refreshOrders();
      }
    } finally {
      setOrderUpdatingId(null);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[linear-gradient(180deg,#f7fbf5_0%,#eef6ed_48%,#f8f3ea_100%)] px-6 pb-24 pt-32 text-slate-900">
        <div className="mx-auto max-w-3xl rounded-[32px] border border-emerald-950/10 bg-white/92 p-8 text-center shadow-[0_22px_70px_rgba(24,50,37,0.10)] backdrop-blur">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 shadow-[0_14px_35px_rgba(16,185,129,0.14)]">
            <UserRound className="h-7 w-7" />
          </div>
          <h1 className="mt-5 text-3xl font-black tracking-tight">{tt("userPortal")}</h1>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-slate-600">
            {tt("loginPrompt")}
          </p>
          <button
            onClick={() => void onLogin()}
            className="mt-7 inline-flex items-center gap-3 rounded-xl bg-emerald-800 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-emerald-700"
          >
            <LogIn className="h-4 w-4" />
            {tt("login")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f3f5f0] pb-24 pt-28 text-slate-900">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-[linear-gradient(180deg,#e8efe8_0%,rgba(232,239,232,0)_100%)]" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <section className="relative overflow-hidden rounded-[32px] bg-[#10251c] text-white shadow-[0_28px_90px_rgba(8,24,17,0.24)]">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(52,211,153,0.20),transparent_28%),linear-gradient(135deg,rgba(255,255,255,0.08),transparent_42%)]" />
          <div className="relative grid min-h-[350px] gap-0 lg:grid-cols-[minmax(0,1fr)_430px]">
            <div className="flex flex-col justify-between p-6 sm:p-8 lg:p-10">
              <div className="flex min-w-0 flex-col gap-5 sm:flex-row sm:items-center">
                {user.photoURL ? (
                  <img src={user.photoURL} alt={user.displayName || "User"} className="h-20 w-20 rounded-[24px] border border-white/12 object-cover shadow-[0_18px_45px_rgba(0,0,0,0.22)]" />
                ) : (
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-[24px] border border-white/12 bg-white/10 text-2xl font-black text-emerald-100 shadow-[0_18px_45px_rgba(0,0,0,0.22)] backdrop-blur">
                    {(user.displayName || user.email || "U").charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-[11px] font-black uppercase tracking-[0.24em] text-emerald-200/70">{tt("personalWorkspace")}</p>
                  <h1 className="mt-2 break-words text-3xl font-black tracking-tight text-white sm:text-5xl">
                    {user.displayName || tt("memberName")}
                  </h1>
                  <p className="mt-2 break-all text-sm font-medium text-white/58">{user.email}</p>
                </div>
              </div>

              <div>
                <p className="mt-8 max-w-2xl text-sm leading-7 text-white/68">
                  {tt("personalSummary")}
                </p>

                <div className="mt-6 flex flex-wrap gap-2">
                  <span className="rounded-full border border-white/12 bg-white/10 px-4 py-2 text-xs font-bold text-white backdrop-blur">
                    {user.role === "admin" ? "Admin" : tt("userRole")}
                  </span>
                  <span className="rounded-full border border-white/12 bg-white/10 px-4 py-2 text-xs font-medium text-white/76 backdrop-blur">
                    {communityComments.length} {tt("comments")}
                  </span>
                  <span className="rounded-full border border-emerald-300/24 bg-emerald-300/12 px-4 py-2 text-xs font-medium text-emerald-100 backdrop-blur">
                    {tt("active")}
                  </span>
                </div>
              </div>
            </div>

            <div className="relative p-4 lg:p-5">
              <div className="relative h-full min-h-[260px] overflow-hidden rounded-[26px] border border-white/10 bg-white/8 shadow-[0_24px_65px_rgba(0,0,0,0.20)]">
                <img src={portalHeroImage} alt={tt("heroAlt")} className="h-full min-h-[260px] w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/58 via-black/8 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 rounded-[18px] border border-white/16 bg-black/28 p-4 text-white backdrop-blur-md">
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/58">{tt("opsProfile")}</p>
                  <p className="mt-1 text-lg font-black">{tt("manageData")}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="group rounded-[28px] border border-emerald-950/10 bg-white/92 p-5 shadow-[0_16px_45px_rgba(24,50,37,0.08)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(24,50,37,0.13)]">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className={labelClass}>{item.label}</p>
                    <p className="mt-2 text-3xl font-black">{item.value}</p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-[20px] bg-emerald-50 text-emerald-700 shadow-[0_12px_28px_rgba(16,185,129,0.12)] transition-transform duration-300 group-hover:scale-110">
                    <Icon className="h-5 w-5 transition-transform duration-300 group-hover:rotate-6" />
                  </div>
                </div>
              </div>
            );
          })}
        </section>

        <div className="mt-5 grid gap-5 lg:grid-cols-[260px_minmax(0,1fr)]">
          <aside className="h-fit rounded-[30px] border border-emerald-950/10 bg-white/92 p-3 shadow-[0_18px_55px_rgba(24,50,37,0.08)] backdrop-blur">
            <nav className="space-y-1">
              {tabs.map((item) => {
                const Icon = item.icon;
                const active = tab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setTab(item.id)}
                    className={`flex w-full items-center gap-3 rounded-[22px] px-3 py-3 text-left transition-all ${
                      active ? "bg-emerald-800 text-white shadow-[0_14px_30px_rgba(6,95,70,0.20)]" : "text-slate-700 hover:bg-emerald-50"
                    }`}
                  >
                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[16px] ${active ? "bg-white/15" : "bg-white text-emerald-700 shadow-sm"}`}>
                      <Icon className={`h-4 w-4 ${active ? "text-white" : "text-emerald-700"}`} />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-bold">{item.label}</span>
                      <span className={`block text-xs ${active ? "text-white/70" : "text-slate-500"}`}>{item.desc}</span>
                    </span>
                  </button>
                );
              })}
            </nav>
          </aside>

          <main className="space-y-5">
            {tab === "overview" && (
              <>
                <section className={panelClass}>
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className={labelClass}>{tt("shortcuts")}</p>
                      <h2 className="mt-1 text-xl font-black">{tt("frequentWork")}</h2>
                    </div>
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    {quickActions.map((item) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.title}
                          onClick={() => setView(item.view)}
                          className="group flex items-center justify-between rounded-[22px] border border-emerald-950/10 bg-slate-50 px-4 py-4 text-left transition-all hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-emerald-50 hover:shadow-[0_14px_35px_rgba(24,50,37,0.08)]"
                        >
                          <span className="flex items-center gap-3">
                            <span className="flex h-9 w-9 items-center justify-center rounded-[14px] bg-white text-emerald-700 shadow-sm transition-transform group-hover:scale-110">
                              <Icon className="h-4 w-4" />
                            </span>
                            <span className="text-sm font-bold">{item.title}</span>
                          </span>
                          <ArrowRight className="h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-1" />
                        </button>
                      );
                    })}
                  </div>
                </section>

                <div className="grid gap-5 xl:grid-cols-2">
                  <section className={panelClass}>
                    <p className={labelClass}>{tt("recentOrders")}</p>
                    <div className="mt-4 divide-y divide-slate-200 overflow-hidden rounded-[22px] border border-emerald-950/10">
                      {orders.length > 0 ? (
                        orders.slice(0, 4).map((order) => (
                          <div key={order.id} className="flex items-center justify-between gap-4 bg-white px-4 py-4 transition-colors hover:bg-emerald-50/50">
                            <div>
                              <p className="font-bold">{order.code}</p>
                              <p className="mt-1 text-sm text-slate-500">{orderStatusLabel[order.status]}</p>
                            </div>
                            <p className="font-black text-emerald-800">{formatCurrency(order.total)}</p>
                          </div>
                        ))
                      ) : (
                        <p className="px-4 py-5 text-sm text-slate-500">{tt("noOrders")}</p>
                      )}
                    </div>
                  </section>

                  <section className={panelClass}>
                    <p className={labelClass}>{tt("recentDiagnoses")}</p>
                    <div className="mt-4 divide-y divide-slate-200 overflow-hidden rounded-[22px] border border-emerald-950/10">
                      {diagnoses.length > 0 ? (
                        diagnoses.map((item) => (
                          <div key={item.id} className="bg-white px-4 py-4 transition-colors hover:bg-emerald-50/50">
                            <p className="font-bold">{item.diseaseName}</p>
                            <p className="mt-1 text-sm text-slate-500">{item.cropName} · {item.severity}</p>
                          </div>
                        ))
                      ) : (
                        <p className="px-4 py-5 text-sm text-slate-500">{tt("noDiagnoses")}</p>
                      )}
                    </div>
                  </section>
                </div>
              </>
            )}

            {tab === "orders" && (
              <section className={panelClass}>
                <Header title={tt("shoppingHistory")} label={tt("yourOrders")} action={tt("openShop")} onClick={() => setView("shop")} />
                <div className="mt-4 space-y-3">
                  {orders.length > 0 ? (
                    orders.map((order) => (
                      <div key={order.id} className="rounded-[24px] border border-emerald-950/10 bg-white p-5 shadow-[0_12px_34px_rgba(24,50,37,0.06)]">
                        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-lg font-black text-slate-900">{order.code}</p>
                              <span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${orderStatusTone[order.status]}`}>
                                {orderStatusLabel[order.status]}
                              </span>
                              <span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${paymentStatusTone[order.paymentStatus]}`}>
                                {paymentStatusLabel[order.paymentStatus]}
                              </span>
                            </div>
                            <p className="mt-2 text-sm text-slate-500">{formatDateTime(order.createdAt)}</p>
                            <p className="mt-3 text-sm leading-6 text-slate-600">
                              <span className="font-bold text-slate-900">{tt("deliveryAddress")}: </span>
                              {order.shippingAddress}
                            </p>
                          </div>
                          <div className="shrink-0 text-left xl:text-right">
                            <p className="text-2xl font-black text-emerald-800">{formatCurrency(order.total)}</p>
                            <div className="mt-3 flex flex-wrap gap-2 xl:justify-end">
                              <button
                                onClick={() => openOrderSupportMessenger(order.id)}
                                className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-emerald-800 transition hover:bg-emerald-100"
                              >
                                <MessageSquare className="h-4 w-4" />
                                {tt("chatAdmin")}
                              </button>
                              {["pending", "confirmed"].includes(order.status) ? (
                                <button
                                  onClick={() => void handleCancelOrder(order)}
                                  disabled={orderUpdatingId === order.id}
                                  className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  <XCircle className="h-4 w-4" />
                                  {orderUpdatingId === order.id ? tt("cancelling") : tt("cancelOrder")}
                                </button>
                              ) : null}
                            </div>
                          </div>
                        </div>
                        <OrderProgress order={order} labels={orderStatusLabel} />
                        <div className="mt-3 grid gap-2 md:grid-cols-2">
                          {order.items.map((item) => (
                            <div key={`${order.id}-${item.productId}`} className="flex items-center gap-3 rounded-[18px] bg-slate-50 p-3 text-sm">
                              <img src={item.productImage} alt={item.productName} className="h-12 w-12 rounded-2xl object-cover" referrerPolicy="no-referrer" />
                              <div className="min-w-0 flex-1">
                                <p className="truncate font-bold">{item.productName}</p>
                                <p className="mt-1 text-slate-500">{tt("quantity")} {item.quantity} · {formatCurrency(item.lineTotal)}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                        {!["pending", "confirmed"].includes(order.status) && order.status !== "cancelled" ? (
                          <div className="mt-3 rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold text-slate-500">
                            {tt("cannotCancel")}
                          </div>
                        ) : null}
                      </div>
                    ))
                  ) : (
                    <EmptyState text={tt("noUserOrders")} />
                  )}
                </div>
              </section>
            )}

            {tab === "growth" && (
              <div className="grid gap-5 xl:grid-cols-2">
                <section className={panelClass}>
                  <Header title={tt("yourSeasons")} label={tt("growthCycle")} action={tt("openModule")} onClick={() => setView("growth")} />
                  <ListOrEmpty empty={tt("noCycles")}>
                    {cycles.map((item) => (
                      <div key={item.id} className={listItemClass}>
                        <p className="font-bold">{item.cropName}</p>
                        <p className="mt-1 text-sm text-slate-500">{item.currentStage} · {item.status}</p>
                        <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                          <div className="h-full rounded-full bg-emerald-700" style={{ width: `${Math.max(0, Math.min(100, item.progress))}%` }} />
                        </div>
                      </div>
                    ))}
                  </ListOrEmpty>
                </section>

                <section className={panelClass}>
                  <p className={labelClass}>{tt("savedProtocols")}</p>
                  <ListOrEmpty empty={tt("noProtocols")}>
                    {bookmarks.map((item) => (
                      <div key={item.id} className={listItemClass}>
                        <p className="font-bold">{item.diseaseId}</p>
                        <p className="mt-1 text-sm text-slate-500">{tt("protocolBookmark")}</p>
                      </div>
                    ))}
                  </ListOrEmpty>
                </section>
              </div>
            )}

            {tab === "community" && (
              <div className="grid gap-5 xl:grid-cols-2">
                <section className={panelClass}>
                  <Header title={tt("postedArticles")} label={tt("yourCommunity")} action={tt("openForum")} onClick={() => setView("forum")} />
                  <ListOrEmpty empty={tt("noPosts")}>
                    {communityPosts.map((post) => (
                      <div key={post.id} className={listItemClass}>
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">{post.category} · {formatDateTime(post.createdAt)}</p>
                        <p className="mt-2 font-bold">{post.title}</p>
                        <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-500">{post.body}</p>
                        <p className="mt-2 text-xs text-slate-500">{post.voteScore} {tt("points")} · {post.commentCount} {tt("comments")}</p>
                      </div>
                    ))}
                  </ListOrEmpty>
                </section>

                <section className={panelClass}>
                  <p className={labelClass}>{tt("commentActivity")}</p>
                  <ListOrEmpty empty={tt("noComments")}>
                    {communityComments.map((comment) => (
                      <div key={comment.id} className={listItemClass}>
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">
                          {comment.parentCommentId ? tt("replyComment") : tt("postComment")}
                        </p>
                        <p className="mt-2 font-bold">{comment.postTitle}</p>
                        <p className="mt-1 text-sm text-slate-500">{tt("postBy")} {comment.postAuthorName} · {formatDateTime(comment.createdAt)}</p>
                        <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">{comment.body}</p>
                      </div>
                    ))}
                  </ListOrEmpty>
                </section>
              </div>
            )}

            {tab === "library" && (
              <div className="grid gap-5 xl:grid-cols-2">
                <section className={panelClass}>
                  <Header title={tt("documentBookmarks")} label={tt("savedLibrary")} action={tt("openLibrary")} onClick={() => setView("library")} />
                  <ListOrEmpty empty={tt("noLibraryBookmarks")}>
                    {savedArticles.map((article) => (
                      <div key={article.id} className={listItemClass}>
                        <p className="font-bold">{article.title}</p>
                        <p className="mt-1 text-sm text-slate-500">{article.category} · {article.readTime}</p>
                      </div>
                    ))}
                  </ListOrEmpty>
                </section>

                <section className={panelClass}>
                  <div className="flex items-center gap-3">
                    <BookMarked className="h-5 w-5 text-emerald-700" />
                    <div>
                      <p className={labelClass}>{tt("knowledgeBase")}</p>
                      <h3 className="text-xl font-black">{tt("featuredDocs")}</h3>
                    </div>
                  </div>
                  <div className="mt-4 space-y-3">
                    {libraryItems.slice(0, 4).map((article) => (
                      <div key={article.id} className={listItemClass}>
                        <p className="font-bold">{article.title}</p>
                        <p className="mt-1 text-sm text-slate-500">{article.category}</p>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

const Header = ({ title, label, action, onClick }: { title: string; label: string; action: string; onClick: () => void }) => (
  <div className="flex items-center justify-between gap-4">
    <div>
      <p className={labelClass}>{label}</p>
      <h3 className="mt-1 text-xl font-black">{title}</h3>
    </div>
    <button onClick={onClick} className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-800 transition-colors hover:bg-emerald-100 hover:text-emerald-700">
      {action}
      <ArrowRight className="h-4 w-4" />
    </button>
  </div>
);

const OrderProgress = ({ order, labels }: { order: ShopOrder; labels: Record<ShopOrder["status"], string> }) => {
  const steps: Array<{ id: ShopOrder["status"]; icon: React.ElementType }> = [
    { id: "pending", icon: ClipboardList },
    { id: "confirmed", icon: CheckCircle2 },
    { id: "shipping", icon: Truck },
    { id: "delivered", icon: CheckCircle2 },
  ];
  const currentIndex = order.status === "cancelled" ? -1 : steps.findIndex((step) => step.id === order.status);

  return (
    <div className="mt-5 rounded-[20px] border border-slate-200 bg-slate-50 p-4">
      <div className="grid gap-3 sm:grid-cols-4">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const active = currentIndex >= index;
          return (
            <div key={step.id} className="flex items-center gap-3">
              <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl ${active ? "bg-emerald-700 text-white" : "bg-white text-slate-400"}`}>
                <Icon className="h-4 w-4" />
              </span>
              <span className={`text-xs font-black uppercase tracking-[0.14em] ${active ? "text-emerald-800" : "text-slate-400"}`}>
                {labels[step.id]}
              </span>
            </div>
          );
        })}
      </div>
      {order.status === "cancelled" ? (
        <div className="mt-3 rounded-[16px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
          {labels.cancelled}
        </div>
      ) : null}
    </div>
  );
};

const EmptyState = ({ text }: { text: string }) => (
  <div className="rounded-[20px] border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm text-slate-500">{text}</div>
);

const ListOrEmpty = ({ children, empty }: { children: React.ReactNode[]; empty: string }) => (
  <div className="mt-4 space-y-3">{children.length > 0 ? children : <EmptyState text={empty} />}</div>
);

export default UserPortalView;
