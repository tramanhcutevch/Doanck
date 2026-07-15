import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  BadgePercent,
  CheckCircle2,
  ChevronRight,
  Clipboard,
  Filter,
  Grid2X2,
  Heart,
  List,
  LockKeyhole,
  MapPin,
  Minus,
  Package,
  Plus,
  QrCode,
  ReceiptText,
  Search,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Star,
  Store,
  Tag,
  Trash2,
  Truck,
  X,
} from "lucide-react";
import heroImage7 from "../../anh/7.jpg";
import heroImage8 from "../../anh/8.webp";
import heroImage9 from "../../anh/9.webp";
import paymentQrImage from "../../anh/qr.jpeg";
import { AppUser, ShopCartItem, ShopOrder, ShopPaymentMethod, ShopProduct } from "../types";
import { clearShopCart, createShopOrder, createVnpayPayment, getShopBootstrap, getShopCart, saveShopCart, updateShopOrder } from "../services/shopService";
import { LocalizedDictionary, useI18n } from "../i18n";

interface ShopViewProps {
  user: AppUser | null;
}

type QuickFilter = "all" | "featured" | "bestseller" | "low-stock" | "favorites";
type CartViewMode = "compact" | "detailed";

const CART_STORAGE_KEY = "terraform-flora.shop.cart";
const FAVORITES_STORAGE_KEY = "terraform-flora.shop.favorites";
const CATALOG_PREVIEW_LIMIT = 8;

const shopText: LocalizedDictionary = {
  authentic: { vi: "Cam Kết Chính Hãng", en: "Genuine Guarantee", ja: "正規品保証" },
  heroTitle1: { vi: "Trang bán hàng", en: "A shop experience", ja: "ショップ体験" },
  heroTitle2: { vi: "phù hợp cho", en: "built for", ja: "に最適" },
  heroTitle3: { vi: "nhà vườn và farm nhỏ", en: "gardens and small farms", ja: "農園と小規模ファーム" },
  heroDesc: {
    vi: "Tập trung vào sản phẩm dễ mua, thông tin rõ ràng, giá dễ so sánh và luồng quản trị đủ để admin theo dõi đơn, tồn kho, best seller và xử lý vận hành nhanh.",
    en: "Focused on easy purchasing, clear product details, comparable prices, and an admin flow for orders, stock, best sellers, and fast operations.",
    ja: "購入しやすさ、明確な商品情報、比較しやすい価格、注文・在庫・売れ筋を素早く管理できる運用導線に集中しています。",
  },
  seedlings: { vi: "Cây giống", en: "Seedlings", ja: "苗" },
  fertilizer: { vi: "Phân bón", en: "Fertilizer", ja: "肥料" },
  supplies: { vi: "Vật tư", en: "Supplies", ja: "資材" },
  starterCombo: { vi: "Combo khởi động", en: "Starter combo", ja: "開始セット" },
  storefrontStatus: { vi: "Trạng thái storefront", en: "Storefront status", ja: "ストア状態" },
  productsSelling: { vi: "sản phẩm đang bán", en: "products on sale", ja: "件の商品を販売中" },
  dataSource: { vi: "Nguồn dữ liệu", en: "Data source", ja: "データソース" },
  shopTitle: { vi: "Cửa hàng nông nghiệp", en: "Agriculture shop", ja: "農業ショップ" },
  shopAccent: { vi: "đủ thông tin để chốt đơn nhanh", en: "with enough detail to order fast", ja: "すばやく注文できる十分な情報" },
  groups: { vi: "nhóm", en: "groups", ja: "グループ" },
  prioritized: { vi: "Được ưu tiên hiển thị", en: "Prioritized in display", ja: "優先表示" },
  offer: { vi: "Ưu đãi", en: "Offer", ja: "特典" },
  applying: { vi: "Đang áp dụng", en: "Applied", ja: "適用中" },
  from500k: { vi: "Từ 500K", en: "From 500K", ja: "500Kから" },
  freeShipOrDiscount: { vi: "Miễn ship hoặc giảm đơn", en: "Free shipping or order discount", ja: "送料無料または割引" },
  account: { vi: "Tài khoản", en: "Account", ja: "アカウント" },
  orders: { vi: "đơn", en: "orders", ja: "件の注文" },
  guest: { vi: "Khách", en: "Guest", ja: "ゲスト" },
  syncedOrders: { vi: "Đơn hàng đã đồng bộ", en: "Orders synced", ja: "注文同期済み" },
  canBuyNow: { vi: "Có thể mua ngay", en: "Can buy immediately", ja: "すぐ購入可能" },
  recommendedFirst: { vi: "Sản phẩm nên mua trước", en: "Recommended first", ja: "先におすすめの商品" },
  bestGroup: { vi: "Nhóm bán chạy", en: "Best-selling group", ja: "売れ筋グループ" },
  sold: { vi: "lượt bán", en: "sold", ja: "販売" },
  buy: { vi: "Mua", en: "Buy", ja: "購入" },
  nationwideShipping: { vi: "Giao hàng toàn quốc", en: "Nationwide shipping", ja: "全国配送" },
  freeShipFrom500k: { vi: "Miễn phí ship từ 500K", en: "Free shipping from 500K", ja: "500K以上で送料無料" },
  genuineCommitment: { vi: "Cam kết chính hãng", en: "Genuine commitment", ja: "正規品保証" },
  clearInfo: { vi: "Thông tin rõ nhóm hàng và mục đích dùng", en: "Clear category and usage details", ja: "分類と用途が明確" },
  searchPlaceholder: { vi: "Tìm cây giống, phân bón, vật tư...", en: "Search seedlings, fertilizer, supplies...", ja: "苗、肥料、資材を検索..." },
  featured: { vi: "Nổi bật", en: "Featured", ja: "注目" },
  bestSeller: { vi: "Bán chạy", en: "Best seller", ja: "売れ筋" },
  priceAsc: { vi: "Giá tăng dần", en: "Price low to high", ja: "価格の安い順" },
  priceDesc: { vi: "Giá giảm dần", en: "Price high to low", ja: "価格の高い順" },
  newest: { vi: "Mới cập nhật", en: "Newest", ja: "新着" },
  cart: { vi: "Giỏ hàng", en: "Cart", ja: "カート" },
  all: { vi: "Tất cả", en: "All", ja: "すべて" },
  lowStock: { vi: "Sắp hết hàng", en: "Low stock", ja: "残りわずか" },
  favorites: { vi: "Yêu thích", en: "Favorites", ja: "お気に入り" },
  checkoutOffer: { vi: "Ưu đãi checkout", en: "Checkout offer", ja: "決済特典" },
  orderFrom500k: { vi: "Đơn từ 500K giảm phí", en: "Orders from 500K reduce fees", ja: "500K以上で手数料割引" },
  offerAuto: { vi: "Tự áp dụng ưu đãi khi giỏ hàng đạt điều kiện.", en: "Offers apply automatically when the cart qualifies.", ja: "条件を満たすと特典が自動適用されます。" },
  catalogTitle: { vi: "Gợi ý nổi bật", en: "Featured suggestions", ja: "注目のおすすめ" },
  catalogDesc: {
    vi: "Chọn lọc những sản phẩm phù hợp nhất để xem nhanh, so sánh dễ hơn và mở rộng toàn bộ danh mục khi cần.",
    en: "Curated products for quick review, easier comparison, and full catalog expansion when needed.",
    ja: "すばやく確認し、比較しやすく、必要に応じて全カタログを展開できます。",
  },
  showing: { vi: "Đang hiện", en: "Showing", ja: "表示中" },
  products: { vi: "sản phẩm", en: "products", ja: "商品" },
  collapse: { vi: "Thu gọn", en: "Collapse", ja: "閉じる" },
  viewMore: { vi: "Xem thêm", en: "View more", ja: "さらに表示" },
  noShopData: { vi: "Chưa có dữ liệu shop_products", en: "No shop_products data yet", ja: "shop_productsデータがまだありません" },
  noProduct: { vi: "Không tìm thấy sản phẩm phù hợp", en: "No matching products found", ja: "一致する商品がありません" },
  seedShop: { vi: "Hãy seed bảng shop_products trên Supabase rồi tải lại trang.", en: "Seed the shop_products table on Supabase, then reload the page.", ja: "Supabaseのshop_productsを投入してから再読み込みしてください。" },
  broadenSearch: { vi: "Thử đổi từ khóa, danh mục hoặc quick filter để mở rộng kết quả.", en: "Try changing keywords, categories, or quick filters to broaden results.", ja: "キーワード、カテゴリ、クイックフィルターを変えて検索範囲を広げてください。" },
  hot: { vi: "Hot", en: "Hot", ja: "人気" },
  outOfStock: { vi: "Tạm hết hàng", en: "Out of stock", ja: "在庫切れ" },
  stock: { vi: "Kho", en: "Stock", ja: "在庫" },
  view: { vi: "Xem", en: "View", ja: "表示" },
  addToCartTitle: { vi: "Thêm vào giỏ", en: "Add to cart", ja: "カートに追加" },
  viewAllProducts: { vi: "Xem toàn bộ", en: "View all", ja: "すべて表示" },
  topProductsTitle: { vi: "Nhóm sản phẩm bán tốt", en: "Best-selling products", ja: "売れ筋商品" },
  reviews: { vi: "đánh giá", en: "reviews", ja: "レビュー" },
  user: { vi: "Người dùng", en: "User", ja: "ユーザー" },
  recentOrders: { vi: "Đơn hàng gần đây của bạn", en: "Your recent orders", ja: "最近の注文" },
  suggestions: { vi: "Gợi ý", en: "Suggestions", ja: "おすすめ" },
  wishlist: { vi: "Danh sách quan tâm", en: "Wishlist", ja: "気になる商品" },
  featuredProduct: { vi: "Sản phẩm nổi bật", en: "Featured product", ja: "注目商品" },
  ratingFrom: { vi: "từ", en: "from", ja: "件中" },
  category: { vi: "Danh mục", en: "Category", ja: "カテゴリ" },
  manufacturer: { vi: "Nhà sản xuất", en: "Manufacturer", ja: "メーカー" },
  origin: { vi: "Xuất xứ", en: "Origin", ja: "原産地" },
  purchaseBenefits: { vi: "Quyền lợi khi mua", en: "Purchase benefits", ja: "購入特典" },
  fastDelivery: { vi: "Giao nhanh", en: "Fast delivery", ja: "迅速配送" },
  rightSource: { vi: "Đúng nguồn", en: "Verified source", ja: "正規供給元" },
  returnSupport: { vi: "Đổi trả", en: "Returns", ja: "返品" },
  packingIssueSupport: { vi: "Hỗ trợ khi lỗi đóng gói", en: "Support for packing issues", ja: "梱包不備をサポート" },
  quantity: { vi: "Số lượng mua", en: "Quantity", ja: "数量" },
  currentStock: { vi: "Tồn kho hiện tại", en: "Current stock", ja: "現在庫" },
  addToCart: { vi: "Thêm vào giỏ", en: "Add to cart", ja: "カートに追加" },
  buyNow: { vi: "Mua ngay", en: "Buy now", ja: "今すぐ購入" },
  detailed: { vi: "Chi tiết", en: "Detailed", ja: "詳細" },
  compact: { vi: "Gọn", en: "Compact", ja: "簡易" },
  emptyCart: { vi: "Giỏ hàng đang trống", en: "Your cart is empty", ja: "カートは空です" },
  emptyCartDesc: { vi: "Chọn một vài sản phẩm để tiếp tục checkout.", en: "Choose a few products to continue checkout.", ja: "決済に進む商品を選んでください。" },
  subtotal: { vi: "Tạm tính", en: "Subtotal", ja: "小計" },
  shippingFee: { vi: "Phí vận chuyển", en: "Shipping fee", ja: "送料" },
  free: { vi: "Miễn phí", en: "Free", ja: "無料" },
  discount: { vi: "Ưu đãi", en: "Discount", ja: "割引" },
  totalPayment: { vi: "Tổng thanh toán", en: "Total payment", ja: "支払総額" },
  checkoutAction: { vi: "Tiến hành thanh toán", en: "Proceed to checkout", ja: "決済へ進む" },
  checkoutInfo: { vi: "Thông tin thanh toán", en: "Checkout information", ja: "決済情報" },
  shippingInfo: { vi: "Thông tin nhận hàng", en: "Shipping information", ja: "配送情報" },
  shippingInfoDesc: { vi: "Điền đủ địa chỉ để hệ thống tính và lưu đơn rõ ràng hơn.", en: "Enter the full address so the system can calculate and save the order clearly.", ja: "住所を入力すると注文を正確に保存できます。" },
  fullName: { vi: "Họ và tên", en: "Full name", ja: "氏名" },
  phone: { vi: "Số điện thoại", en: "Phone number", ja: "電話番号" },
  invoiceEmail: { vi: "Email nhận hóa đơn", en: "Invoice email", ja: "請求書メール" },
  province: { vi: "Tỉnh / thành phố", en: "Province / city", ja: "都道府県 / 市区町村" },
  district: { vi: "Quận / huyện", en: "District", ja: "区 / 郡" },
  ward: { vi: "Phường / xã", en: "Ward", ja: "町 / 村" },
  addressLine: { vi: "Số nhà, tên đường, thôn/xóm", en: "House number, street, village", ja: "番地、通り、地区" },
  notePlaceholder: { vi: "Ghi chú đơn hàng, thời gian nhận, yêu cầu đóng gói...", en: "Order note, receiving time, packing requests...", ja: "注文メモ、受取時間、梱包希望..." },
  savedAddress: { vi: "Địa chỉ lưu vào đơn", en: "Address saved to order", ja: "注文に保存する住所" },
  addressMissing: { vi: "Chưa đủ thông tin địa chỉ", en: "Address information is incomplete", ja: "住所情報が不足しています" },
  paymentMethod: { vi: "Phương thức thanh toán", en: "Payment method", ja: "支払い方法" },
  cod: { vi: "Thanh toán khi nhận hàng", en: "Cash on delivery", ja: "代金引換" },
  codNote: { vi: "Trả tiền sau khi kiểm hàng", en: "Pay after checking the package", ja: "商品確認後に支払い" },
  bankTransfer: { vi: "Chuyển khoản ngân hàng", en: "Bank transfer", ja: "銀行振込" },
  bankNote: { vi: "Có mã QR và nội dung CK", en: "QR and transfer content included", ja: "QRと振込内容あり" },
  momoNote: { vi: "Quét QR ví điện tử", en: "Scan e-wallet QR", ja: "電子ウォレットQRをスキャン" },
  vnpayNote: { vi: "Chuyển sang cổng VNPay", en: "Redirect to VNPay gateway", ja: "VNPayゲートウェイへ移動" },
  card: { vi: "Thẻ quốc tế", en: "International card", ja: "国際カード" },
  cardNote: { vi: "Visa / Mastercard / JCB", en: "Visa / Mastercard / JCB", ja: "Visa / Mastercard / JCB" },
  orderSummary: { vi: "Tóm tắt đơn hàng", en: "Order summary", ja: "注文概要" },
  itemQty: { vi: "SL", en: "Qty", ja: "数量" },
  payment: { vi: "Thanh toán", en: "Payment", ja: "支払い" },
  provider: { vi: "Đơn vị", en: "Provider", ja: "提供元" },
  accountNumber: { vi: "Tài khoản", en: "Account", ja: "口座" },
  content: { vi: "Nội dung", en: "Content", ja: "内容" },
  copyInfo: { vi: "Sao chép thông tin", en: "Copy information", ja: "情報をコピー" },
  vnpaySafety: { vi: "VNPay sẽ xác thực giao dịch và trả kết quả về cửa hàng sau thanh toán.", en: "VNPay will verify the transaction and return the result after payment.", ja: "VNPayが取引を確認し、支払い後に結果を返します。" },
  demoPayment: { vi: "Thông tin demo được lưu trong đơn hàng; chưa trừ tiền thật nếu chưa nối cổng thanh toán.", en: "Demo information is saved in the order; no real charge happens until a payment gateway is connected.", ja: "デモ情報は注文に保存されます。決済ゲートウェイ接続前は実課金されません。" },
  processing: { vi: "Đang xử lý...", en: "Processing...", ja: "処理中..." },
  goVnpay: { vi: "Sang trang VNPay thật", en: "Go to VNPay", ja: "VNPayへ進む" },
  confirmPayment: { vi: "Xác nhận thanh toán", en: "Confirm payment", ja: "支払いを確定" },
  close: { vi: "Đóng", en: "Close", ja: "閉じる" },
  orderSuccess: { vi: "Đặt hàng thành công", en: "Order placed successfully", ja: "注文が完了しました" },
  orderSuccessDesc: { vi: "đã được tạo. Admin và người dùng đều thấy đơn mới trong dữ liệu commerce.", en: "has been created. Admin and user can both see the new commerce order.", ja: "が作成されました。管理者とユーザーの両方が新しい注文を確認できます。" },
  vnpayPaid: { vi: "Thanh toán VNPay thành công", en: "VNPay payment successful", ja: "VNPay決済が成功しました" },
  vnpayIncomplete: { vi: "Thanh toán VNPay chưa hoàn tất", en: "VNPay payment incomplete", ja: "VNPay決済が未完了です" },
  paymentFailedTitle: { vi: "Không xử lý được thanh toán", en: "Could not process payment", ja: "支払いを処理できませんでした" },
  paymentFailedDesc: { vi: "Có lỗi khi tạo đơn hoặc kết nối cổng thanh toán.", en: "An error occurred while creating the order or connecting to the payment gateway.", ja: "注文作成または決済ゲートウェイ接続でエラーが発生しました。" },
  supabaseEmpty: { vi: "Supabase rỗng", en: "Empty Supabase", ja: "Supabase空" },
  supabaseError: { vi: "Supabase lỗi", en: "Supabase error", ja: "Supabaseエラー" },
};

const shopTermText: LocalizedDictionary = {
  "Tất cả": { vi: "Tất cả", en: "All", ja: "すべて" },
  "Cây giống": { vi: "Cây giống", en: "Seedlings", ja: "苗" },
  "Cây Giống": { vi: "Cây giống", en: "Seedlings", ja: "苗" },
  "Hạt giống hoa": { vi: "Hạt giống hoa", en: "Flower seeds", ja: "花の種" },
  "Hạt Giống Hoa": { vi: "Hạt giống hoa", en: "Flower seeds", ja: "花の種" },
  "Phân bón": { vi: "Phân bón", en: "Fertilizer", ja: "肥料" },
  "Phân Bón": { vi: "Phân bón", en: "Fertilizer", ja: "肥料" },
  "Vật tư": { vi: "Vật tư", en: "Supplies", ja: "資材" },
  "Vật Tư": { vi: "Vật tư", en: "Supplies", ja: "資材" },
  "Nông cụ": { vi: "Nông cụ", en: "Farm tools", ja: "農具" },
  "Nông Cụ": { vi: "Nông cụ", en: "Farm tools", ja: "農具" },
  Combo: { vi: "Combo", en: "Combo", ja: "セット" },
  "Rau quả": { vi: "Rau quả", en: "Vegetables", ja: "野菜" },
  "Vi lượng": { vi: "Vi lượng", en: "Micronutrients", ja: "微量要素" },
  "Phục hồi": { vi: "Phục hồi", en: "Recovery", ja: "回復" },
  "Kích rễ": { vi: "Kích rễ", en: "Root boost", ja: "発根促進" },
  "Tưới nhỏ giọt": { vi: "Tưới nhỏ giọt", en: "Drip irrigation", ja: "点滴灌漑" },
  "Nhà màng": { vi: "Nhà màng", en: "Greenhouse", ja: "温室" },
  "Ớt": { vi: "Ớt", en: "Chili", ja: "唐辛子" },
  "Ghép khỏe": { vi: "Ghép khỏe", en: "Strong graft", ja: "丈夫な接ぎ木" },
  "Tiết kiệm nước": { vi: "Tiết kiệm nước", en: "Water saving", ja: "節水" },
  "Nhà vườn": { vi: "Nhà vườn", en: "Home garden", ja: "家庭菜園" },
  "Trái đẹp": { vi: "Trái đẹp", en: "Fruit quality", ja: "果実品質" },
  "Lên màu": { vi: "Lên màu", en: "Coloring", ja: "着色" },
  "Vi sinh": { vi: "Vi sinh", en: "Microbial", ja: "微生物" },
  "Phục hồi đất": { vi: "Phục hồi đất", en: "Soil recovery", ja: "土壌回復" },
  "Giá thể": { vi: "Giá thể", en: "Growing media", ja: "培地" },
  "Ươm hạt": { vi: "Ươm hạt", en: "Seed starting", ja: "育苗" },
  "Sạch bệnh": { vi: "Sạch bệnh", en: "Disease-free", ja: "病害なし" },
  "Phân cá": { vi: "Phân cá", en: "Fish fertilizer", ja: "魚由来肥料" },
  "Hữu cơ": { vi: "Hữu cơ", en: "Organic", ja: "有機" },
  "Nuôi lá": { vi: "Nuôi lá", en: "Leaf growth", ja: "葉の生育" },
  "Dưa leo": { vi: "Dưa leo", en: "Cucumber", ja: "キュウリ" },
  "Kháng bệnh": { vi: "Kháng bệnh", en: "Disease resistant", ja: "耐病性" },
  "Người mới": { vi: "Người mới", en: "Beginner", ja: "初心者" },
  "Vườn rau": { vi: "Vườn rau", en: "Vegetable garden", ja: "菜園" },
  "Best Seller": { vi: "Best Seller", en: "Best Seller", ja: "売れ筋" },
  "Flash Deal": { vi: "Flash Deal", en: "Flash Deal", ja: "限定セール" },
  Premium: { vi: "Premium", en: "Premium", ja: "プレミアム" },
  "Low Stock": { vi: "Sắp hết hàng", en: "Low Stock", ja: "残りわずか" },
  Starter: { vi: "Starter", en: "Starter", ja: "スターター" },
  "Mới về": { vi: "Mới về", en: "New arrival", ja: "新入荷" },
  "Combo tiết kiệm": { vi: "Combo tiết kiệm", en: "Value combo", ja: "お得セット" },
};

const formatCurrency = (value: number, locale = "vi-VN") => `${value.toLocaleString(locale)}đ`;
const formatDateTime = (value: string, locale = "vi-VN") => new Date(value).toLocaleString(locale);
const normalizePhoneNumber = (value: string) => value.replace(/\D/g, "").slice(0, 10);
const isVietnamPhoneNumber = (value: string) => /^0(3|5|7|8|9)\d{8}$/.test(value);

type DeliveryWard = { code: string; name: string };
type DeliveryDistrict = { code: string; name: string; wards: DeliveryWard[] };
type DeliveryProvince = { code: string; name: string; districts: DeliveryDistrict[] };

const deliveryLocations: DeliveryProvince[] = [
  {
    code: "hcm",
    name: "TP. Hồ Chí Minh",
    districts: [
      { code: "q1", name: "Quận 1", wards: ["Phường Bến Nghé", "Phường Bến Thành", "Phường Cầu Kho"].map((name) => ({ code: name, name })) },
      { code: "q3", name: "Quận 3", wards: ["Phường Võ Thị Sáu", "Phường 9", "Phường 11"].map((name) => ({ code: name, name })) },
      { code: "tp-thu-duc", name: "TP. Thủ Đức", wards: ["Phường Thảo Điền", "Phường Linh Trung", "Phường Hiệp Bình Chánh"].map((name) => ({ code: name, name })) },
    ],
  },
  {
    code: "hn",
    name: "Hà Nội",
    districts: [
      { code: "ba-dinh", name: "Quận Ba Đình", wards: ["Phường Ngọc Hà", "Phường Kim Mã", "Phường Điện Biên"].map((name) => ({ code: name, name })) },
      { code: "hoan-kiem", name: "Quận Hoàn Kiếm", wards: ["Phường Hàng Bạc", "Phường Tràng Tiền", "Phường Hàng Trống"].map((name) => ({ code: name, name })) },
      { code: "cau-giay", name: "Quận Cầu Giấy", wards: ["Phường Dịch Vọng", "Phường Nghĩa Tân", "Phường Yên Hòa"].map((name) => ({ code: name, name })) },
    ],
  },
  {
    code: "dn",
    name: "Đà Nẵng",
    districts: [
      { code: "hai-chau", name: "Quận Hải Châu", wards: ["Phường Hải Châu I", "Phường Bình Hiên", "Phường Hòa Cường Bắc"].map((name) => ({ code: name, name })) },
      { code: "son-tra", name: "Quận Sơn Trà", wards: ["Phường An Hải Bắc", "Phường Thọ Quang", "Phường Nại Hiên Đông"].map((name) => ({ code: name, name })) },
      { code: "ngu-hanh-son", name: "Quận Ngũ Hành Sơn", wards: ["Phường Mỹ An", "Phường Khuê Mỹ", "Phường Hòa Hải"].map((name) => ({ code: name, name })) },
    ],
  },
  {
    code: "ct",
    name: "Cần Thơ",
    districts: [
      { code: "ninh-kieu", name: "Quận Ninh Kiều", wards: ["Phường An Khánh", "Phường Cái Khế", "Phường Tân An"].map((name) => ({ code: name, name })) },
      { code: "binh-thuy", name: "Quận Bình Thủy", wards: ["Phường Bình Thủy", "Phường Long Hòa", "Phường Trà An"].map((name) => ({ code: name, name })) },
    ],
  },
  {
    code: "dong-nai",
    name: "Đồng Nai",
    districts: [
      { code: "bien-hoa", name: "TP. Biên Hòa", wards: ["Phường Tân Phong", "Phường Thống Nhất", "Phường Long Bình"].map((name) => ({ code: name, name })) },
      { code: "long-khanh", name: "TP. Long Khánh", wards: ["Phường Xuân An", "Phường Xuân Bình", "Phường Bàu Sen"].map((name) => ({ code: name, name })) },
    ],
  },
  {
    code: "lam-dong",
    name: "Lâm Đồng",
    districts: [
      { code: "da-lat", name: "TP. Đà Lạt", wards: ["Phường 1", "Phường 3", "Phường 8"].map((name) => ({ code: name, name })) },
      { code: "bao-loc", name: "TP. Bảo Lộc", wards: ["Phường 1", "Phường Lộc Phát", "Phường B'Lao"].map((name) => ({ code: name, name })) },
    ],
  },
];

const readStorage = <T,>(key: string, fallback: T): T => {
  if (typeof localStorage === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

const writeStorage = <T,>(key: string, value: T) => {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
};

const PaymentBrandMark = ({ method, compact = false }: { method: ShopPaymentMethod; compact?: boolean }) => {
  const baseClass = compact
    ? "flex h-10 w-16 shrink-0 items-center justify-center rounded-xl border bg-white text-[11px] font-black"
    : "flex h-32 w-32 shrink-0 items-center justify-center rounded-[22px] border bg-white p-3 text-center font-black";

  if (method === "vnpay") {
    return (
      <div className={`${baseClass} border-blue-100 shadow-[0_10px_30px_rgba(37,99,235,0.08)]`}>
        <span className={compact ? "text-base tracking-tight" : "text-2xl tracking-tight"}>
          <span className="text-blue-700">VN</span>
          <span className="text-red-500">Pay</span>
        </span>
      </div>
    );
  }

  if (method === "momo") {
    return (
      <div className={`${baseClass} border-pink-100 bg-pink-600 text-white shadow-[0_10px_30px_rgba(219,39,119,0.12)]`}>
        <span className={compact ? "text-sm tracking-tight" : "text-2xl tracking-tight"}>MoMo</span>
      </div>
    );
  }

  if (method === "bank_transfer") {
    return (
      <div className={`${baseClass} border-sky-100 text-sky-700 shadow-[0_10px_30px_rgba(2,132,199,0.08)]`}>
        <span className={compact ? "text-xs tracking-[0.12em]" : "text-lg tracking-[0.16em]"}>BANK</span>
      </div>
    );
  }

  if (method === "card") {
    return (
      <div className={`${baseClass} border-indigo-100 shadow-[0_10px_30px_rgba(79,70,229,0.08)]`}>
        <div className="flex items-center gap-1">
          <span className={`${compact ? "text-xs" : "text-lg"} text-blue-700`}>VISA</span>
          <span className={`${compact ? "h-4 w-4" : "h-7 w-7"} rounded-full bg-red-500`} />
          <span className={`${compact ? "h-4 w-4 -ml-2" : "h-7 w-7 -ml-3"} rounded-full bg-amber-400 opacity-90`} />
        </div>
      </div>
    );
  }

  return (
    <div className={`${baseClass} border-emerald-100 text-emerald-700 shadow-[0_10px_30px_rgba(16,185,129,0.08)]`}>
      <span className={compact ? "text-xs tracking-[0.14em]" : "text-xl tracking-[0.18em]"}>COD</span>
    </div>
  );
};

const buildCheckoutAddress = (form: {
  shippingAddress: string;
  ward: string;
  district: string;
  province: string;
}) =>
  [form.shippingAddress.trim(), form.ward.trim(), form.district.trim(), form.province.trim()]
    .filter(Boolean)
    .join(", ");

const ShopView = ({ user }: ShopViewProps) => {
  const { language } = useI18n();
  const tt = (key: string) => shopText[key]?.[language] ?? shopText[key]?.vi ?? key;
  const translateShopTerm = (value?: string | null) => (value ? shopTermText[value]?.[language] ?? value : "");
  const locale = language === "vi" ? "vi-VN" : language === "ja" ? "ja-JP" : "en-US";
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [orders, setOrders] = useState<ShopOrder[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<ShopProduct | null>(null);
  const [selectedProductQty, setSelectedProductQty] = useState(1);
  const [cart, setCart] = useState<ShopCartItem[]>([]);
  const [cartLoaded, setCartLoaded] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [dataSource, setDataSource] = useState<"supabase" | "local" | "supabase-empty" | "supabase-error">("local");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("Tất cả");
  const [sortBy, setSortBy] = useState<"featured" | "price-asc" | "price-desc" | "best-seller" | "newest">("featured");
  const [quickFilter, setQuickFilter] = useState<QuickFilter>("all");
  const [showAllCatalog, setShowAllCatalog] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [cartViewMode, setCartViewMode] = useState<CartViewMode>("detailed");
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [completedOrderCode, setCompletedOrderCode] = useState<string | null>(null);
  const [paymentNotice, setPaymentNotice] = useState<{ type: "success" | "failed"; title: string; message: string } | null>(null);
  const [checkoutForm, setCheckoutForm] = useState({
    customerName: user?.displayName ?? "",
    customerEmail: user?.email ?? "",
    customerPhone: "",
    shippingAddress: "",
    ward: "",
    district: "",
    province: "",
    note: "",
    paymentMethod: "cod" as ShopPaymentMethod,
  });
  const paymentMethodLabel: Record<ShopPaymentMethod, string> = {
    cod: tt("cod"),
    bank_transfer: tt("bankTransfer"),
    momo: "Ví MoMo",
    card: tt("card"),
    vnpay: "VNPay",
  };
  const orderStatusLabel: Record<ShopOrder["status"], string> = {
    pending: language === "en" ? "Pending" : language === "ja" ? "処理待ち" : "Chờ xử lý",
    confirmed: language === "en" ? "Confirmed" : language === "ja" ? "確認済み" : "Đã xác nhận",
    shipping: language === "en" ? "Shipping" : language === "ja" ? "配送中" : "Đang giao",
    delivered: language === "en" ? "Delivered" : language === "ja" ? "完了" : "Hoàn tất",
    cancelled: language === "en" ? "Cancelled" : language === "ja" ? "キャンセル" : "Đã hủy",
  };

  useEffect(() => {
    setCheckoutForm((current) => ({
      ...current,
      customerName: current.customerName || user?.displayName || "",
      customerEmail: current.customerEmail || user?.email || "",
    }));
  }, [user]);

  useEffect(() => {
    const bootstrap = async () => {
      setLoading(true);
      setCartLoaded(false);
      const data = await getShopBootstrap();
      const localCart = readStorage<ShopCartItem[]>(CART_STORAGE_KEY, []);
      let nextCart = localCart;

      if (user?.uid) {
        try {
          const remoteCart = await getShopCart(user.uid);
          nextCart = remoteCart && remoteCart.length > 0 ? remoteCart : localCart;
          if ((!remoteCart || remoteCart.length === 0) && localCart.length > 0) {
            await saveShopCart(user.uid, localCart);
          }
        } catch (error) {
          console.error("Failed to load shop cart:", error);
        }
      }

      setProducts(data.products);
      setOrders(data.orders);
      setDataSource(data.source);
      setCart(nextCart);
      setFavorites(readStorage<string[]>(FAVORITES_STORAGE_KEY, []));
      setCartLoaded(true);
      setLoading(false);
    };

    void bootstrap();
  }, [user?.uid]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const vnpayStatus = params.get("vnpay_status");
    const orderId = params.get("orderId");
    const responseCode = params.get("vnpay_code");

    if (!vnpayStatus || !orderId) return;

    const syncPayment = async () => {
      const paid = vnpayStatus === "success";
      const nextOrder = await updateShopOrder({
        orderId,
        paymentStatus: paid ? "paid" : "failed",
        status: paid ? "confirmed" : "pending",
      });
      const refreshed = await getShopBootstrap();
      setProducts(refreshed.products);
      setOrders(refreshed.orders);
      setDataSource(refreshed.source);
      setPaymentNotice({
        type: paid ? "success" : "failed",
        title: paid ? tt("vnpayPaid") : tt("vnpayIncomplete"),
        message: nextOrder
          ? `Đơn ${nextOrder.code} đã được cập nhật trạng thái ${paid ? "đã thanh toán" : "thanh toán thất bại"}${responseCode ? ` (mã ${responseCode})` : ""}.`
          : `Không tìm thấy đơn hàng cục bộ để cập nhật${responseCode ? ` (mã ${responseCode})` : ""}.`,
      });
      window.history.replaceState({}, "", window.location.pathname);
    };

    void syncPayment();
  }, [language]);

  useEffect(() => {
    if (!cartLoaded) return;
    writeStorage(CART_STORAGE_KEY, cart);
    if (user?.uid) {
      void saveShopCart(user.uid, cart).catch((error) => {
        console.error("Failed to sync shop cart:", error);
      });
    }
  }, [cart, cartLoaded, user?.uid]);

  useEffect(() => {
    writeStorage(FAVORITES_STORAGE_KEY, favorites);
  }, [favorites]);

  useEffect(() => {
    setShowAllCatalog(false);
  }, [activeCategory, quickFilter, searchTerm, sortBy]);

  const categories = useMemo(() => ["Tất cả", ...new Set(products.map((product) => product.category))], [products]);

  const featuredProducts = useMemo(
    () => [...products].filter((product) => product.featured).sort((a, b) => b.salesCount - a.salesCount).slice(0, 4),
    [products]
  );

  const bestSellerProducts = useMemo(
    () => [...products].filter((product) => product.bestSeller || product.featured).sort((a, b) => b.salesCount - a.salesCount).slice(0, 4),
    [products]
  );

  const favoriteProducts = useMemo(
    () => products.filter((product) => favorites.includes(product.id)).slice(0, 4),
    [favorites, products]
  );

  const userOrders = useMemo(() => {
    if (!user) return [];
    return orders
      .filter((order) => order.userId === user.uid || (!!user.email && order.customerEmail.toLowerCase() === user.email.toLowerCase()))
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  }, [orders, user]);

  const filteredProducts = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();

    const normalized = products.filter((product) => {
      const matchesCategory = activeCategory === "Tất cả" || product.category === activeCategory;
      const matchesSearch =
        keyword.length === 0 ||
        product.name.toLowerCase().includes(keyword) ||
        product.tags.some((tag) => tag.toLowerCase().includes(keyword)) ||
        product.shortDescription.toLowerCase().includes(keyword) ||
        product.manufacturer.toLowerCase().includes(keyword);

      const matchesQuickFilter =
        quickFilter === "all" ||
        (quickFilter === "featured" && product.featured) ||
        (quickFilter === "bestseller" && product.bestSeller) ||
        (quickFilter === "low-stock" && product.stock <= 20) ||
        (quickFilter === "favorites" && favorites.includes(product.id));

      return matchesCategory && matchesSearch && matchesQuickFilter;
    });

    const sorted = [...normalized];
    switch (sortBy) {
      case "price-asc":
        sorted.sort((left, right) => left.price - right.price);
        break;
      case "price-desc":
        sorted.sort((left, right) => right.price - left.price);
        break;
      case "best-seller":
        sorted.sort((left, right) => right.salesCount - left.salesCount);
        break;
      case "newest":
        sorted.sort((left, right) => Date.parse(right.updatedAt) - Date.parse(left.updatedAt));
        break;
      default:
        sorted.sort((left, right) => Number(right.featured) - Number(left.featured) || right.salesCount - left.salesCount);
        break;
    }

    return sorted;
  }, [activeCategory, favorites, products, quickFilter, searchTerm, sortBy]);

  const catalogProducts = showAllCatalog ? filteredProducts : filteredProducts.slice(0, CATALOG_PREVIEW_LIMIT);
  const hiddenCatalogCount = Math.max(filteredProducts.length - catalogProducts.length, 0);

  const cartDetails = useMemo(
    () =>
      cart
        .map((item) => {
          const product = products.find((entry) => entry.id === item.productId);
          if (!product) return null;
          const quantity = Math.min(item.quantity, Math.max(product.stock, item.quantity));
          return { product, quantity, lineTotal: product.price * quantity };
        })
        .filter(Boolean) as Array<{ product: ShopProduct; quantity: number; lineTotal: number }>,
    [cart, products]
  );

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cartDetails.reduce((sum, item) => sum + item.lineTotal, 0);
  const shippingFee = subtotal >= 500000 || subtotal === 0 ? 0 : 35000;
  const discount = subtotal >= 1200000 ? 70000 : subtotal >= 900000 ? 50000 : subtotal >= 500000 ? 25000 : 0;
  const total = Math.max(subtotal + shippingFee - discount, 0);
  const checkoutAddress = useMemo(() => buildCheckoutAddress(checkoutForm), [checkoutForm]);
  const selectedProvince = useMemo(
    () => deliveryLocations.find((province) => province.name === checkoutForm.province),
    [checkoutForm.province]
  );
  const selectedDistrict = useMemo(
    () => selectedProvince?.districts.find((district) => district.name === checkoutForm.district),
    [checkoutForm.district, selectedProvince]
  );
  const phoneReady = isVietnamPhoneNumber(checkoutForm.customerPhone);
  const phoneTouched = checkoutForm.customerPhone.length > 0;
  const checkoutReady = Boolean(
    checkoutForm.customerName.trim() &&
    phoneReady &&
    checkoutForm.shippingAddress.trim() &&
    checkoutForm.ward.trim() &&
    checkoutForm.district.trim() &&
    checkoutForm.province.trim()
  );
  const paymentGuide = useMemo(() => {
    const transferContent = `TF ${user?.displayName || "KHACH"} ${total}`;
    if (checkoutForm.paymentMethod === "bank_transfer") {
      return {
        title: tt("bankTransfer"),
        description: language === "en" ? "Scan the QR code or transfer manually using the content below. The order will stay pending confirmation." : language === "ja" ? "QRコードを読み取るか、下記内容で手動送金してください。注文は確認待ちになります。" : "Quét QR hoặc chuyển khoản thủ công theo nội dung bên dưới. Đơn sẽ được giữ ở trạng thái chờ xác nhận.",
        accountName: "CONG TY TERRAFORM FLORA",
        accountNumber: "9704 1800 1234 5678",
        provider: language === "en" ? "Vietcombank Bank" : language === "ja" ? "Vietcombank銀行" : "Ngân hàng Vietcombank",
        content: transferContent,
      };
    }
    if (checkoutForm.paymentMethod === "momo") {
      return {
        title: "Ví MoMo",
        description: language === "en" ? "Open MoMo, scan the QR code, and enter the exact payment amount." : language === "ja" ? "MoMoを開き、QRコードを読み取り、正しい支払金額を入力してください。" : "Mở MoMo, quét mã QR và nhập đúng số tiền thanh toán.",
        accountName: "Terraform Flora Store",
        accountNumber: "0909 688 688",
        provider: language === "en" ? "MoMo e-wallet" : language === "ja" ? "MoMo電子ウォレット" : "Ví điện tử MoMo",
        content: transferContent,
      };
    }
    if (checkoutForm.paymentMethod === "card") {
      return {
        title: tt("card"),
        description: language === "en" ? "This demo records the order first. After gateway integration, this step will redirect to card authentication." : language === "ja" ? "このデモでは先に注文を記録します。決済連携後はカード認証ページへ移動します。" : "Bản demo ghi nhận đơn trước. Khi tích hợp cổng thanh toán, bước này sẽ chuyển sang trang xác thực thẻ.",
        accountName: language === "en" ? "Secure payment gateway" : language === "ja" ? "安全な決済ゲートウェイ" : "Cổng thanh toán bảo mật",
        accountNumber: "Visa / Mastercard / JCB",
        provider: "Payment Gateway",
        content: language === "en" ? "Authenticate after order placement" : language === "ja" ? "注文後に認証" : "Xác thực sau khi đặt hàng",
      };
    }
    if (checkoutForm.paymentMethod === "vnpay") {
      return {
        title: "VNPay",
        description: language === "en" ? "After confirmation, the system redirects to VNPay for secure payment." : language === "ja" ? "確認後、安全な支払いのためVNPayへ移動します。" : "Sau khi xác nhận, hệ thống sẽ chuyển sang cổng VNPay để thanh toán an toàn.",
        accountName: "Terraform Flora Store",
        accountNumber: "Sandbox VNPay",
        provider: language === "en" ? "VNPay payment gateway" : language === "ja" ? "VNPay決済ゲートウェイ" : "Cổng thanh toán VNPay",
        content: language === "en" ? "Transaction code is created automatically after order placement" : language === "ja" ? "注文後に取引コードを自動生成" : "Tự động tạo mã giao dịch sau khi đặt hàng",
      };
    }
    return {
      title: tt("cod"),
      description: language === "en" ? "Pay the carrier directly after checking your package." : language === "ja" ? "商品確認後、配送担当者に直接お支払いください。" : "Bạn thanh toán trực tiếp cho đơn vị vận chuyển sau khi kiểm tra hàng.",
      accountName: "COD",
      accountNumber: language === "en" ? "No upfront transfer needed" : language === "ja" ? "事前振込不要" : "Không cần chuyển khoản trước",
      provider: language === "en" ? "Standard delivery" : language === "ja" ? "標準配送" : "Giao hàng tiêu chuẩn",
      content: language === "en" ? "Pay at delivery point" : language === "ja" ? "受取時に支払い" : "Thanh toán tại điểm nhận",
    };
  }, [checkoutForm.paymentMethod, language, total, user]);
  const showPaymentQr = checkoutForm.paymentMethod !== "cod";
  const dataSourceMeta = useMemo(() => {
    if (dataSource === "supabase") {
      return { label: "Supabase", tone: "border-emerald-200 bg-emerald-50 text-emerald-800" };
    }
    if (dataSource === "supabase-empty") {
      return { label: tt("supabaseEmpty"), tone: "border-amber-200 bg-amber-50 text-amber-800" };
    }
    if (dataSource === "supabase-error") {
      return { label: tt("supabaseError"), tone: "border-rose-200 bg-rose-50 text-rose-800" };
    }
    return { label: "Local fallback", tone: "border-slate-200 bg-slate-50 text-slate-700" };
  }, [dataSource, language]);

  const updateQuantity = (productId: string, delta: number) => {
    setCart((current) => {
      const existing = current.find((item) => item.productId === productId);
      const product = products.find((item) => item.id === productId);
      const maxStock = Math.max(product?.stock ?? 0, 0);
      if (!existing && delta > 0 && maxStock > 0) return [...current, { productId, quantity: 1 }];
      return current
        .map((item) =>
          item.productId === productId
            ? { ...item, quantity: Math.min(Math.max(item.quantity + delta, 0), maxStock || item.quantity + delta) }
            : item
        )
        .filter((item) => item.quantity > 0);
    });
  };

  const addToCart = (product: ShopProduct, quantity = 1) => {
    if (product.stock <= 0) return;
    setCart((current) => {
      const existing = current.find((item) => item.productId === product.id);
      if (existing) {
        return current.map((item) =>
          item.productId === product.id ? { ...item, quantity: Math.min(item.quantity + quantity, product.stock) } : item
        );
      }
      return [...current, { productId: product.id, quantity: Math.min(quantity, product.stock) }];
    });
    setCartOpen(true);
  };

  const toggleFavorite = (productId: string) => {
    setFavorites((current) => (current.includes(productId) ? current.filter((id) => id !== productId) : [...current, productId]));
  };

  const openProduct = (product: ShopProduct) => {
    setSelectedProduct(product);
    setSelectedProductQty(1);
  };

  const handleCheckout = async () => {
    if (cartDetails.length === 0 || !checkoutReady) return;
    setSubmitting(true);

    try {
      const order = await createShopOrder({
        userId: user?.uid ?? null,
        customerName: checkoutForm.customerName,
        customerEmail: checkoutForm.customerEmail,
        customerPhone: normalizePhoneNumber(checkoutForm.customerPhone),
        shippingAddress: checkoutAddress,
        note: checkoutForm.note,
        paymentMethod: checkoutForm.paymentMethod,
        items: cartDetails.map((item) => ({
          productId: item.product.id,
          productName: item.product.name,
          productImage: item.product.image,
          unitPrice: item.product.price,
          quantity: item.quantity,
          lineTotal: item.lineTotal,
        })),
        subtotal,
        shippingFee,
        discount,
        total,
      });

      if (checkoutForm.paymentMethod === "vnpay") {
        const paymentUrl = await createVnpayPayment({
          orderId: order.id,
          orderCode: order.code,
          amount: order.total,
          customerName: order.customerName,
        });
        await clearShopCart(user?.uid);
        setCart([]);
        window.location.href = paymentUrl;
        return;
      }

      const refreshed = await getShopBootstrap();
      setProducts(refreshed.products);
      setOrders(refreshed.orders);
      setDataSource(refreshed.source);
      await clearShopCart(user?.uid);
      setCart([]);
      setCheckoutOpen(false);
      setCartOpen(false);
      setCompletedOrderCode(order.code);
    } catch (error) {
      setPaymentNotice({
        type: "failed",
        title: tt("paymentFailedTitle"),
        message: error instanceof Error ? error.message : tt("paymentFailedDesc"),
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f6f2ea] pt-32 pb-24 text-slate-900">
      <div className="mx-auto max-w-7xl px-6">
        <section className="mb-6 overflow-hidden rounded-[44px] border border-[#e7dbc5] bg-white shadow-[0_20px_80px_rgba(99,69,35,0.08)]">
          <div className="grid lg:grid-cols-[1.05fr_1.15fr]">
            <div className="flex flex-col justify-center p-8 md:p-10">
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[#eadfcd] bg-[#fff8ee] px-4 py-2 text-[10px] font-bold uppercase tracking-[0.28em] text-amber-700">
                <ShieldCheck className="h-3.5 w-3.5" />
                {tt("authentic")}
              </div>
              <h1 className="mt-6 text-4xl font-black tracking-tight text-slate-900 md:text-6xl">
                {tt("heroTitle1")}
                <br />
                {tt("heroTitle2")}
                <br />
                {tt("heroTitle3")}
              </h1>
              <p className="mt-6 max-w-xl text-base leading-relaxed text-slate-600 md:text-lg">
                {tt("heroDesc")}
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                {[tt("seedlings"), tt("fertilizer"), tt("supplies"), tt("starterCombo")].map((item) => (
                  <div key={item} className="rounded-full border border-[#eadfcd] bg-[#fffdfa] px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-slate-600">
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="relative min-h-[320px] overflow-hidden bg-[#f4ecde] p-4 lg:min-h-[420px]">
              <div className="grid h-full gap-4 md:grid-cols-[1.05fr_0.95fr]">
                <div className="overflow-hidden rounded-[28px]">
                  <img src={heroImage7} alt="Cây giống trong cửa hàng" className="h-full w-full object-cover" />
                </div>
                <div className="grid gap-4">
                  <div className="overflow-hidden rounded-[28px]">
                    <img src={heroImage8} alt="Phân bón và vật tư nông nghiệp" className="h-full w-full object-cover" />
                  </div>
                  <div className="overflow-hidden rounded-[28px]">
                    <img src={heroImage9} alt="Không gian canh tác và vật tư" className="h-full w-full object-cover" />
                  </div>
                </div>
              </div>
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-white/6 via-transparent to-emerald-950/10" />
              <div className="absolute bottom-6 right-6 rounded-[28px] border border-white/40 bg-white/88 p-5 backdrop-blur-xl">
                <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-slate-400">{tt("storefrontStatus")}</p>
                <p className="mt-2 text-lg font-black text-slate-900">{products.length} {tt("productsSelling")}</p>
                <p className="mt-2 text-sm text-slate-500">{tt("dataSource")}: {dataSourceMeta.label}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
          <div className="rounded-[40px] border border-[#e7dbc5] bg-[radial-gradient(circle_at_top_left,rgba(34,197,94,0.14),transparent_28%),radial-gradient(circle_at_top_right,rgba(245,158,11,0.10),transparent_24%),linear-gradient(135deg,#fffdfa_0%,#f5efe4_100%)] p-8 shadow-[0_20px_80px_rgba(99,69,35,0.08)] md:p-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/85 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.28em] text-emerald-700">
              <Store className="h-3.5 w-3.5" />
              Terraform Agro Store
            </div>
            <h2 className="mt-6 text-4xl font-black tracking-tight text-slate-900 md:text-6xl">
              {tt("shopTitle")}
              <br />
              <span className="text-emerald-700">{tt("shopAccent")}</span>
            </h2>
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {[
                { label: "Best seller", value: `${bestSellerProducts.length} ${tt("groups")}`, note: tt("prioritized") },
                { label: tt("offer"), value: subtotal >= 500000 ? tt("applying") : tt("from500k"), note: tt("freeShipOrDiscount") },
                { label: tt("account"), value: user ? `${userOrders.length} ${tt("orders")}` : tt("guest"), note: user ? tt("syncedOrders") : tt("canBuyNow") },
              ].map((item) => (
                <div key={item.label} className="rounded-[26px] border border-[#eadfcd] bg-white/80 p-5">
                  <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-slate-400">{item.label}</p>
                  <p className="mt-3 text-3xl font-black text-slate-900">{item.value}</p>
                  <p className="mt-2 text-sm text-slate-500">{item.note}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4">
            <div className="rounded-[30px] border border-[#eadfcd] bg-white/80 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-slate-400">{tt("recommendedFirst")}</p>
                  <h2 className="mt-2 text-2xl font-black text-slate-900">{tt("bestGroup")}</h2>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50">
                  <Sparkles className="h-5 w-5 text-emerald-700" />
                </div>
              </div>
              <div className="mt-5 space-y-3">
                {bestSellerProducts.slice(0, 3).map((product) => (
                  <div key={product.id} className="flex items-center gap-3 rounded-[24px] border border-[#efe5d7] bg-[#fffdfa] p-3">
                    <img src={product.image} alt={product.name} className="h-16 w-16 rounded-2xl object-cover" referrerPolicy="no-referrer" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-slate-900">{product.name}</p>
                      <p className="mt-1 text-xs text-slate-500">{product.salesCount} {tt("sold")} • {translateShopTerm(product.category)}</p>
                    </div>
                    <button onClick={() => addToCart(product)} className="rounded-2xl bg-emerald-600 px-4 py-3 text-[10px] font-bold uppercase tracking-[0.24em] text-white">
                      {tt("buy")}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {[
                { icon: Truck, title: tt("nationwideShipping"), note: tt("freeShipFrom500k") },
                { icon: ShieldCheck, title: tt("genuineCommitment"), note: tt("clearInfo") },
              ].map((item) => (
                <div key={item.title} className="rounded-[26px] border border-[#eadfcd] bg-white/80 p-5">
                  <item.icon className="h-5 w-5 text-emerald-700" />
                  <p className="mt-4 text-sm font-bold text-slate-900">{item.title}</p>
                  <p className="mt-2 text-sm text-slate-500">{item.note}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-6 grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_270px]">
          <div className="self-start rounded-[28px] border border-[#eadfcd] bg-white/80 p-4">
            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_190px_210px]">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder={tt("searchPlaceholder")}
                  className="h-12 w-full rounded-[18px] border border-[#eadfcd] bg-[#fffdfa] pr-4 pl-11 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-emerald-500"
                />
              </div>
              <div className="flex h-12 items-center gap-2 rounded-[18px] border border-[#eadfcd] bg-[#fffdfa] px-4">
                <Filter className="h-4 w-4 text-slate-400" />
                <select value={sortBy} onChange={(event) => setSortBy(event.target.value as typeof sortBy)} className="w-full bg-transparent text-sm font-semibold text-slate-700 outline-none">
                  <option value="featured">{tt("featured")}</option>
                  <option value="best-seller">{tt("bestSeller")}</option>
                  <option value="price-asc">{tt("priceAsc")}</option>
                  <option value="price-desc">{tt("priceDesc")}</option>
                  <option value="newest">{tt("newest")}</option>
                </select>
              </div>
              <button onClick={() => setCartOpen(true)} className="relative inline-flex h-12 items-center justify-center gap-3 rounded-[18px] bg-slate-900 px-5 text-xs font-bold uppercase tracking-[0.22em] text-white">
                <ShoppingCart className="h-4 w-4" />
                {tt("cart")}
                <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-black text-white">{cartCount}</span>
              </button>
            </div>
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  className={`whitespace-nowrap rounded-full px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.18em] ${
                    activeCategory === category ? "bg-emerald-600 text-white" : "border border-[#eadfcd] bg-[#fffdfa] text-slate-500 hover:text-slate-900"
                  }`}
                >
                  {translateShopTerm(category)}
                </button>
              ))}
            </div>
            <div className="mt-2.5 flex flex-wrap gap-2">
              {[
                { id: "all" as const, label: tt("all") },
                { id: "featured" as const, label: tt("featured") },
                { id: "bestseller" as const, label: tt("bestSeller") },
                { id: "low-stock" as const, label: tt("lowStock") },
                { id: "favorites" as const, label: tt("favorites") },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setQuickFilter(item.id)}
                  className={`rounded-full px-3.5 py-2 text-[10px] font-bold uppercase tracking-[0.16em] ${
                    quickFilter === item.id ? "bg-slate-900 text-white" : "border border-[#eadfcd] bg-[#fffdfa] text-slate-500"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="self-start rounded-[28px] border border-amber-200 bg-amber-50/90 p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-100">
                <BadgePercent className="h-4 w-4 text-amber-700" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-amber-700/70">{tt("checkoutOffer")}</p>
                <h2 className="mt-1 text-xl font-black leading-tight text-slate-900">{tt("orderFrom500k")}</h2>
              </div>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              {tt("offerAuto")}
            </p>
          </div>
        </section>

        <section className="mt-8">
          <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-slate-400">Catalog</p>
              <h2 className="mt-2 text-3xl font-black text-slate-900">{tt("catalogTitle")}</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                {tt("catalogDesc")}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full border border-[#eadfcd] bg-white px-4 py-2 text-sm font-semibold text-slate-600">
                {tt("showing")} {catalogProducts.length}/{filteredProducts.length} {tt("products")}
              </span>
              {filteredProducts.length > CATALOG_PREVIEW_LIMIT ? (
                <button
                  onClick={() => setShowAllCatalog((current) => !current)}
                  className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2.5 text-xs font-black uppercase tracking-[0.18em] text-white transition-all hover:bg-emerald-700"
                >
                  {showAllCatalog ? tt("collapse") : `${tt("viewMore")} ${hiddenCatalogCount}`}
                  <ChevronRight className={`h-4 w-4 transition-transform ${showAllCatalog ? "-rotate-90" : "rotate-90"}`} />
                </button>
              ) : null}
            </div>
          </div>

          {loading ? (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-[420px] animate-pulse rounded-[36px] border border-[#eadfcd] bg-white" />)}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="rounded-[36px] border border-[#eadfcd] bg-white p-10 text-center">
              <Package className="mx-auto h-12 w-12 text-slate-300" />
              <p className="mt-4 text-xl font-bold text-slate-900">
                {dataSource === "supabase-empty" ? tt("noShopData") : tt("noProduct")}
              </p>
              <p className="mt-2 text-sm text-slate-500">
                {dataSource === "supabase-empty"
                  ? tt("seedShop")
                  : tt("broadenSearch")}
              </p>
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              {catalogProducts.map((product) => (
                <motion.div key={product.id} initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="group overflow-hidden rounded-[30px] border border-[#eadfcd] bg-white shadow-[0_18px_50px_rgba(112,106,72,0.07)] transition-all hover:-translate-y-1 hover:border-emerald-200 hover:shadow-[0_24px_70px_rgba(24,120,82,0.12)]">
                  <div className="relative h-56 overflow-hidden">
                    <img src={product.image} alt={product.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" referrerPolicy="no-referrer" />
                    <button onClick={() => toggleFavorite(product.id)} className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-white/90 text-slate-700">
                      <Heart className={`h-4 w-4 ${favorites.includes(product.id) ? "fill-current text-rose-500" : ""}`} />
                    </button>
                    <div className="absolute left-4 top-4 rounded-full border border-white/70 bg-white/90 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-slate-700">
                      {translateShopTerm(product.category)}
                    </div>
                    <div className="absolute bottom-4 left-4 flex gap-2">
                      {product.bestSeller ? (
                        <span className="rounded-full bg-amber-500 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-white">{tt("hot")}</span>
                      ) : null}
                      {product.stock <= 20 && product.stock > 0 ? (
                        <span className="rounded-full bg-slate-900/85 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-white">{tt("lowStock")}</span>
                      ) : null}
                    </div>
                    {product.stock <= 0 ? (
                      <div className="absolute inset-0 flex items-center justify-center bg-slate-900/50 text-sm font-bold uppercase tracking-[0.22em] text-white">{tt("outOfStock")}</div>
                    ) : null}
                  </div>
                  <div className="p-6">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <Tag className="h-3.5 w-3.5 text-emerald-600" />
                        <span className="text-[11px] text-slate-400">{product.salesCount} {tt("sold")}</span>
                      </div>
                      <div className="flex items-center gap-1 text-amber-500">
                        <Star className="h-3.5 w-3.5 fill-current" />
                        <span className="text-xs font-bold text-slate-600">{product.rating}</span>
                      </div>
                    </div>
                    <h3 className="mt-3 text-xl font-bold text-slate-900">{product.name}</h3>
                    <p className="mt-2 min-h-12 text-sm leading-relaxed text-slate-500">{product.shortDescription}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {product.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="rounded-full border border-[#eadfcd] bg-[#fffdfa] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
                          {translateShopTerm(tag)}
                        </span>
                      ))}
                    </div>
                    <div className="mt-5 flex items-end justify-between gap-4">
                      <div>
                        <p className="text-2xl font-black text-emerald-700">{formatCurrency(product.price, locale)}</p>
                        {product.originalPrice && <p className="text-sm text-slate-400 line-through">{formatCurrency(product.originalPrice, locale)}</p>}
                        <p className="text-sm text-slate-500">{tt("stock")} {product.stock} {tt("products")}</p>
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <button onClick={() => openProduct(product)} className="rounded-[18px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-700 transition-all hover:bg-emerald-600 hover:text-white">
                          {tt("view")}
                        </button>
                        <button
                          disabled={product.stock <= 0}
                          onClick={() => addToCart(product)}
                          className="flex h-11 w-11 items-center justify-center rounded-[18px] bg-slate-900 text-white disabled:cursor-not-allowed disabled:opacity-40"
                          title={tt("addToCartTitle")}
                        >
                          <ShoppingCart className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {!loading && filteredProducts.length > CATALOG_PREVIEW_LIMIT ? (
            <div className="mt-7 flex justify-center">
              <button
                onClick={() => setShowAllCatalog((current) => !current)}
                className="inline-flex items-center gap-3 rounded-full border border-emerald-200 bg-white px-7 py-4 text-sm font-black uppercase tracking-[0.18em] text-emerald-700 shadow-[0_16px_45px_rgba(24,120,82,0.08)] transition-all hover:border-emerald-600 hover:bg-emerald-600 hover:text-white"
              >
                {showAllCatalog ? tt("collapse") : `${tt("viewAllProducts")} ${filteredProducts.length} ${tt("products")}`}
                <ChevronRight className={`h-4 w-4 transition-transform ${showAllCatalog ? "-rotate-90" : "rotate-90"}`} />
              </button>
            </div>
          ) : null}
        </section>

        <section className="mt-10">
          <div className="mb-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-slate-400">Best Seller</p>
            <h2 className="mt-2 text-3xl font-black text-slate-900">{tt("topProductsTitle")}</h2>
          </div>
          <div className="grid gap-5 lg:grid-cols-4">
            {bestSellerProducts.map((product) => (
              <motion.button key={product.id} whileHover={{ y: -4 }} onClick={() => openProduct(product)} className="overflow-hidden rounded-[30px] border border-[#eadfcd] bg-white text-left">
                <div className="relative h-44 overflow-hidden">
                  <img src={product.image} alt={product.name} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                  <div className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-emerald-700">
                    {translateShopTerm(product.badge || "Best Seller")}
                  </div>
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-1 text-emerald-600">
                    {[1, 2, 3, 4, 5].map((item) => <Star key={item} className="h-3.5 w-3.5 fill-current" />)}
                    <span className="ml-2 text-[11px] text-slate-400">{product.reviewCount} {tt("reviews")}</span>
                  </div>
                  <h3 className="mt-3 text-lg font-bold text-slate-900">{product.name}</h3>
                  <p className="mt-2 text-sm text-slate-500">{product.shortDescription}</p>
                  <div className="mt-4 flex items-center justify-between">
                    <div>
                      <p className="text-xl font-black text-emerald-700">{formatCurrency(product.price, locale)}</p>
                      {product.originalPrice && <p className="text-sm text-slate-400 line-through">{formatCurrency(product.originalPrice, locale)}</p>}
                    </div>
                    <ChevronRight className="h-5 w-5 text-slate-400" />
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        </section>

        {user && userOrders.length > 0 ? (
          <section className="mt-10 grid gap-6 xl:grid-cols-[1fr_1fr]">
            <div className="rounded-[32px] border border-[#eadfcd] bg-white p-6 shadow-[0_18px_50px_rgba(112,106,72,0.06)]">
              <div className="flex items-center gap-3">
                <ShoppingBag className="h-5 w-5 text-emerald-700" />
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">{tt("user")}</p>
                  <h3 className="text-2xl font-black text-slate-900">{tt("recentOrders")}</h3>
                </div>
              </div>
              <div className="mt-5 space-y-3">
                {userOrders.slice(0, 3).map((order) => (
                  <div key={order.id} className="rounded-[24px] border border-[#eadfcd] bg-[#fffdfa] p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="font-bold text-slate-900">{order.code}</p>
                        <p className="mt-1 text-sm text-slate-500">{formatDateTime(order.createdAt, locale)}</p>
                      </div>
                      <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-700">
                        {orderStatusLabel[order.status]}
                      </span>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-sm text-slate-600">
                      <span>{order.items.length} {tt("products")} • {paymentMethodLabel[order.paymentMethod]}</span>
                      <span className="font-bold text-slate-900">{formatCurrency(order.total, locale)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[32px] border border-[#eadfcd] bg-white p-6 shadow-[0_18px_50px_rgba(112,106,72,0.06)]">
              <div className="flex items-center gap-3">
                <Heart className="h-5 w-5 text-rose-500" />
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">{tt("suggestions")}</p>
                  <h3 className="text-2xl font-black text-slate-900">{tt("wishlist")}</h3>
                </div>
              </div>
              <div className="mt-5 space-y-3">
                {(favoriteProducts.length > 0 ? favoriteProducts : featuredProducts).slice(0, 3).map((product) => (
                  <button key={product.id} onClick={() => openProduct(product)} className="flex w-full items-center gap-3 rounded-[24px] border border-[#eadfcd] bg-[#fffdfa] p-3 text-left">
                    <img src={product.image} alt={product.name} className="h-16 w-16 rounded-2xl object-cover" referrerPolicy="no-referrer" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-bold text-slate-900">{product.name}</p>
                      <p className="mt-1 text-sm text-slate-500">{translateShopTerm(product.category)}</p>
                    </div>
                    <span className="font-black text-emerald-700">{formatCurrency(product.price, locale)}</span>
                  </button>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        <AnimatePresence>
          {selectedProduct && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] bg-slate-900/35 p-4 backdrop-blur-md">
              <div className="flex h-full items-center justify-center">
                <motion.div initial={{ y: 16, scale: 0.98 }} animate={{ y: 0, scale: 1 }} className="max-h-[92vh] w-full max-w-6xl overflow-hidden rounded-[34px] border border-[#eadfcd] bg-[#fffdfa] shadow-2xl shadow-slate-950/20">
                  <div className="grid lg:grid-cols-[0.95fr_1.05fr]">
                    <div className="relative min-h-[320px] bg-white p-4">
                      <div className="h-full overflow-hidden rounded-[28px]">
                        <img src={selectedProduct.image} alt={selectedProduct.name} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                      <button onClick={() => setSelectedProduct(null)} className="absolute left-6 top-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/90 text-slate-900">
                        <X className="h-5 w-5" />
                      </button>
                      <div className="absolute bottom-6 left-6 right-6 grid grid-cols-4 gap-3">
                        {[selectedProduct.image, ...selectedProduct.images].slice(0, 4).map((image, index) => (
                          <div key={`${image}-${index}`} className="h-20 overflow-hidden rounded-2xl border border-white/70 bg-white/90 p-1 shadow-lg">
                            <img src={image} alt={`${selectedProduct.name} ${index + 1}`} className="h-full w-full rounded-xl object-cover" referrerPolicy="no-referrer" />
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="max-h-[92vh] overflow-y-auto p-8 md:p-10">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.22em] text-emerald-700">
                          <Sparkles className="h-3.5 w-3.5" />
                          {translateShopTerm(selectedProduct.badge) || tt("featuredProduct")}
                        </span>
                        <span className="rounded-full border border-[#eadfcd] bg-white px-4 py-2 text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">
                          SKU {selectedProduct.sku}
                        </span>
                      </div>
                      <h2 className="mt-4 text-4xl font-black tracking-tight text-slate-900">{selectedProduct.name}</h2>
                      <p className="mt-4 text-base leading-relaxed text-slate-600">{selectedProduct.description}</p>
                      <div className="mt-6 grid gap-4 rounded-[28px] border border-[#eadfcd] bg-white p-5 sm:grid-cols-[1fr_auto] sm:items-end">
                        <div>
                          <p className="text-4xl font-black text-emerald-700">{formatCurrency(selectedProduct.price, locale)}</p>
                          {selectedProduct.originalPrice && <p className="mt-1 text-sm text-slate-400 line-through">{formatCurrency(selectedProduct.originalPrice, locale)}</p>}
                        </div>
                        <div className="grid gap-2 text-right">
                          <div className="flex items-center justify-end gap-1 text-amber-500">
                            {[1, 2, 3, 4, 5].map((item) => <Star key={item} className="h-4 w-4 fill-current" />)}
                          </div>
                          <p className="text-sm font-bold text-slate-900">{selectedProduct.rating}/5 {tt("ratingFrom")} {selectedProduct.reviewCount} {tt("reviews")}</p>
                        </div>
                      </div>
                      <div className="mt-6 grid gap-3 sm:grid-cols-3">
                        {[
                          { label: tt("category"), value: translateShopTerm(selectedProduct.category) },
                          { label: tt("manufacturer"), value: selectedProduct.manufacturer },
                          { label: tt("origin"), value: selectedProduct.origin },
                        ].map((item) => (
                          <div key={item.label} className="rounded-[22px] border border-[#eadfcd] bg-white p-4">
                            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">{item.label}</p>
                            <p className="mt-2 text-sm font-semibold text-slate-900">{item.value}</p>
                          </div>
                        ))}
                      </div>
                      <div className="mt-8 grid gap-4 sm:grid-cols-2">
                        {Object.entries(selectedProduct.specs).map(([label, value]) => (
                          <div key={label} className="rounded-[24px] border border-[#eadfcd] bg-white p-4">
                            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">{label}</p>
                            <p className="mt-2 text-sm font-semibold text-slate-900">{value}</p>
                          </div>
                        ))}
                      </div>
                      <div className="mt-8 rounded-[28px] border border-[#eadfcd] bg-white p-5">
                        <div className="flex items-center gap-3">
                          <Package className="h-5 w-5 text-emerald-700" />
                          <div>
                            <p className="text-sm font-bold text-slate-900">{tt("purchaseBenefits")}</p>
                            <p className="text-sm text-slate-500">{selectedProduct.shippingClass}</p>
                          </div>
                        </div>
                        <div className="mt-4 grid gap-3">
                          {selectedProduct.benefits.map((benefit) => (
                            <div key={benefit} className="flex items-center gap-3 text-sm text-slate-600">
                              <CheckCircle2 className="h-4 w-4 text-emerald-700" />
                              {benefit}
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="mt-8 rounded-[28px] border border-[#eadfcd] bg-white p-4">
                        <div className="mb-4 grid gap-3 sm:grid-cols-3">
                          {[
                            { icon: Truck, title: tt("fastDelivery"), note: selectedProduct.shippingClass },
                            { icon: ShieldCheck, title: tt("rightSource"), note: selectedProduct.origin },
                            { icon: ReceiptText, title: tt("returnSupport"), note: tt("packingIssueSupport") },
                          ].map((item) => (
                            <div key={item.title} className="rounded-[20px] bg-[#fff8ee] p-3">
                              <item.icon className="h-4 w-4 text-emerald-700" />
                              <p className="mt-2 text-sm font-bold text-slate-900">{item.title}</p>
                              <p className="mt-1 text-xs text-slate-500">{item.note}</p>
                            </div>
                          ))}
                        </div>
                        <div className="flex items-center justify-between">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">{tt("quantity")}</p>
                          <p className="mt-1 text-sm text-slate-500">{tt("currentStock")} {selectedProduct.stock} {tt("products")}</p>
                        </div>
                        <div className="flex items-center gap-3 rounded-full border border-[#eadfcd] bg-[#fffdfa] px-3 py-2">
                          <button onClick={() => setSelectedProductQty((current) => Math.max(current - 1, 1))}><Minus className="h-4 w-4 text-slate-600" /></button>
                          <span className="min-w-8 text-center text-sm font-bold text-slate-900">{selectedProductQty}</span>
                          <button onClick={() => setSelectedProductQty((current) => Math.min(current + 1, Math.max(selectedProduct.stock, 1)))}><Plus className="h-4 w-4 text-slate-600" /></button>
                        </div>
                        </div>
                      </div>
                      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                        <button
                          disabled={selectedProduct.stock <= 0}
                          onClick={() => addToCart(selectedProduct, selectedProductQty)}
                          className="flex-1 rounded-[24px] bg-emerald-600 px-6 py-4 text-sm font-bold uppercase tracking-[0.22em] text-white disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          {tt("addToCart")}
                        </button>
                        <button
                          disabled={selectedProduct.stock <= 0}
                          onClick={() => {
                            addToCart(selectedProduct, selectedProductQty);
                            setCheckoutOpen(true);
                          }}
                          className="flex-1 rounded-[24px] border border-[#eadfcd] bg-white px-6 py-4 text-sm font-bold uppercase tracking-[0.22em] text-slate-900 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          {tt("buyNow")}
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {cartOpen && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[210] bg-slate-900/35 backdrop-blur-sm">
              <div className="flex h-full justify-end">
                <motion.div initial={{ x: 32 }} animate={{ x: 0 }} exit={{ x: 32 }} className="flex h-full w-full max-w-xl flex-col border-l border-[#eadfcd] bg-[#fffdfa]">
                  <div className="border-b border-[#eadfcd] px-6 py-5">
                    <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-slate-400">Cart</p>
                      <h2 className="mt-1 text-2xl font-black text-slate-900">{tt("cart")}</h2>
                    </div>
                    <button onClick={() => setCartOpen(false)} className="rounded-2xl border border-[#eadfcd] bg-white p-3 text-slate-900">
                      <X className="h-5 w-5" />
                    </button>
                    </div>
                    <div className="mt-5 grid grid-cols-2 gap-2 rounded-[20px] border border-[#eadfcd] bg-white p-1">
                      {[
                        { id: "detailed" as const, label: tt("detailed"), icon: List },
                        { id: "compact" as const, label: tt("compact"), icon: Grid2X2 },
                      ].map((mode) => (
                        <button
                          key={mode.id}
                          onClick={() => setCartViewMode(mode.id)}
                          className={`flex items-center justify-center gap-2 rounded-[16px] px-4 py-3 text-xs font-bold uppercase tracking-[0.18em] ${
                            cartViewMode === mode.id ? "bg-slate-900 text-white" : "text-slate-500"
                          }`}
                        >
                          <mode.icon className="h-4 w-4" />
                          {mode.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto px-6 py-5">
                    {cartDetails.length === 0 ? (
                      <div className="rounded-[28px] border border-[#eadfcd] bg-white p-8 text-center">
                        <ShoppingCart className="mx-auto h-10 w-10 text-slate-300" />
                        <p className="mt-4 text-lg font-bold text-slate-900">{tt("emptyCart")}</p>
                        <p className="mt-2 text-sm text-slate-500">{tt("emptyCartDesc")}</p>
                      </div>
                    ) : (
                      <div className={cartViewMode === "compact" ? "grid grid-cols-2 gap-3" : "space-y-4"}>
                        {cartDetails.map((item) => (
                          <div key={item.product.id} className={`rounded-[26px] border border-[#eadfcd] bg-white p-4 ${cartViewMode === "compact" ? "" : "shadow-[0_12px_36px_rgba(112,106,72,0.06)]"}`}>
                            {cartViewMode === "compact" ? (
                              <div>
                                <img src={item.product.image} alt={item.product.name} className="h-28 w-full rounded-[22px] object-cover" referrerPolicy="no-referrer" />
                                <p className="mt-3 line-clamp-2 text-sm font-bold text-slate-900">{item.product.name}</p>
                                <p className="mt-1 text-xs text-slate-500">{tt("itemQty")} {item.quantity}</p>
                                <div className="mt-3 flex items-center justify-between">
                                  <p className="text-sm font-black text-emerald-700">{formatCurrency(item.lineTotal, locale)}</p>
                                  <button onClick={() => updateQuantity(item.product.id, -item.quantity)} className="flex h-9 w-9 items-center justify-center rounded-2xl bg-rose-50 text-rose-500">
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex gap-4">
                                <img src={item.product.image} alt={item.product.name} className="h-24 w-24 rounded-3xl object-cover" referrerPolicy="no-referrer" />
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-start justify-between gap-4">
                                    <div>
                                      <p className="text-base font-bold text-slate-900">{item.product.name}</p>
                                      <p className="mt-1 text-sm text-slate-500">{translateShopTerm(item.product.category)} • {tt("stock")} {item.product.stock}</p>
                                    </div>
                                    <button onClick={() => updateQuantity(item.product.id, -item.quantity)} className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-50 text-rose-500">
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </div>
                                  <div className="mt-4 flex items-center justify-between">
                                    <div className="flex items-center gap-3 rounded-full border border-[#eadfcd] bg-[#fffdfa] px-3 py-2">
                                      <button onClick={() => updateQuantity(item.product.id, -1)}><Minus className="h-4 w-4 text-slate-600" /></button>
                                      <span className="min-w-6 text-center text-sm font-bold text-slate-900">{item.quantity}</span>
                                      <button onClick={() => updateQuantity(item.product.id, 1)}><Plus className="h-4 w-4 text-slate-600" /></button>
                                    </div>
                                    <p className="text-lg font-black text-emerald-700">{formatCurrency(item.lineTotal, locale)}</p>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="border-t border-[#eadfcd] px-6 py-5">
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between text-slate-600"><span>{tt("subtotal")}</span><span>{formatCurrency(subtotal, locale)}</span></div>
                      <div className="flex items-center justify-between text-slate-600"><span>{tt("shippingFee")}</span><span>{shippingFee === 0 ? tt("free") : formatCurrency(shippingFee, locale)}</span></div>
                      <div className="flex items-center justify-between text-emerald-700"><span>{tt("discount")}</span><span>-{formatCurrency(discount, locale)}</span></div>
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-sm font-bold uppercase tracking-[0.22em] text-slate-400">{tt("totalPayment")}</span>
                      <span className="text-3xl font-black text-slate-900">{formatCurrency(total, locale)}</span>
                    </div>
                    <button disabled={cartDetails.length === 0} onClick={() => setCheckoutOpen(true)} className="mt-5 w-full rounded-[24px] bg-slate-900 px-6 py-4 text-sm font-bold uppercase tracking-[0.22em] text-white disabled:cursor-not-allowed disabled:opacity-40">
                      {tt("checkoutAction")}
                    </button>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {checkoutOpen && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[220] bg-slate-900/35 p-4 backdrop-blur-md">
              <div className="flex h-full items-center justify-center">
                <motion.div initial={{ y: 16 }} animate={{ y: 0 }} exit={{ y: 16 }} className="max-h-[92vh] w-full max-w-6xl overflow-hidden rounded-[34px] border border-[#eadfcd] bg-[#fffdfa] shadow-2xl shadow-slate-950/20">
                  <div className="grid lg:grid-cols-[1.05fr_0.8fr]">
                    <div className="max-h-[92vh] overflow-y-auto p-8">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-slate-400">Checkout</p>
                          <h2 className="mt-2 text-3xl font-black text-slate-900">{tt("checkoutInfo")}</h2>
                        </div>
                        <button onClick={() => setCheckoutOpen(false)} className="rounded-2xl border border-[#eadfcd] bg-white p-3 text-slate-900">
                          <X className="h-5 w-5" />
                        </button>
                      </div>
                      <div className="mt-6 rounded-[28px] border border-[#eadfcd] bg-white p-5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50">
                            <MapPin className="h-5 w-5 text-emerald-700" />
                          </div>
                          <div>
                            <p className="text-sm font-black text-slate-900">{tt("shippingInfo")}</p>
                            <p className="text-xs text-slate-500">{tt("shippingInfoDesc")}</p>
                          </div>
                        </div>
                        <div className="mt-5 grid gap-4 md:grid-cols-2">
                          <input value={checkoutForm.customerName} onChange={(e) => setCheckoutForm((c) => ({ ...c, customerName: e.target.value }))} placeholder={tt("fullName")} className="rounded-[20px] border border-[#eadfcd] bg-[#fffdfa] px-5 py-4 text-slate-900 outline-none placeholder:text-slate-400 focus:border-emerald-500" />
                          <div>
                            <input
                              value={checkoutForm.customerPhone}
                              inputMode="numeric"
                              maxLength={10}
                              onChange={(e) => setCheckoutForm((c) => ({ ...c, customerPhone: normalizePhoneNumber(e.target.value) }))}
                              placeholder={tt("phone")}
                              className={`w-full rounded-[20px] border bg-[#fffdfa] px-5 py-4 text-slate-900 outline-none placeholder:text-slate-400 focus:border-emerald-500 ${
                                phoneTouched && !phoneReady ? "border-rose-300 focus:border-rose-500" : "border-[#eadfcd]"
                              }`}
                            />
                            {phoneTouched && !phoneReady ? (
                              <p className="mt-2 px-1 text-xs font-semibold text-rose-600">
                                Số điện thoại phải có 10 chữ số và bắt đầu bằng 03, 05, 07, 08 hoặc 09.
                              </p>
                            ) : null}
                          </div>
                          <input value={checkoutForm.customerEmail} onChange={(e) => setCheckoutForm((c) => ({ ...c, customerEmail: e.target.value }))} placeholder={tt("invoiceEmail")} className="rounded-[20px] border border-[#eadfcd] bg-[#fffdfa] px-5 py-4 text-slate-900 outline-none placeholder:text-slate-400 focus:border-emerald-500 md:col-span-2" />
                          <select
                            value={checkoutForm.province}
                            onChange={(e) =>
                              setCheckoutForm((c) => ({ ...c, province: e.target.value, district: "", ward: "" }))
                            }
                            className="rounded-[20px] border border-[#eadfcd] bg-[#fffdfa] px-5 py-4 text-slate-900 outline-none focus:border-emerald-500"
                          >
                            <option value="">{tt("province")}</option>
                            {deliveryLocations.map((province) => (
                              <option key={province.code} value={province.name}>{province.name}</option>
                            ))}
                          </select>
                          <select
                            value={checkoutForm.district}
                            disabled={!selectedProvince}
                            onChange={(e) => setCheckoutForm((c) => ({ ...c, district: e.target.value, ward: "" }))}
                            className="rounded-[20px] border border-[#eadfcd] bg-[#fffdfa] px-5 py-4 text-slate-900 outline-none focus:border-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <option value="">{tt("district")}</option>
                            {selectedProvince?.districts.map((district) => (
                              <option key={district.code} value={district.name}>{district.name}</option>
                            ))}
                          </select>
                          <select
                            value={checkoutForm.ward}
                            disabled={!selectedDistrict}
                            onChange={(e) => setCheckoutForm((c) => ({ ...c, ward: e.target.value }))}
                            className="rounded-[20px] border border-[#eadfcd] bg-[#fffdfa] px-5 py-4 text-slate-900 outline-none focus:border-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <option value="">{tt("ward")}</option>
                            {selectedDistrict?.wards.map((ward) => (
                              <option key={ward.code} value={ward.name}>{ward.name}</option>
                            ))}
                          </select>
                          <input value={checkoutForm.shippingAddress} onChange={(e) => setCheckoutForm((c) => ({ ...c, shippingAddress: e.target.value }))} placeholder={tt("addressLine")} className="rounded-[20px] border border-[#eadfcd] bg-[#fffdfa] px-5 py-4 text-slate-900 outline-none placeholder:text-slate-400 focus:border-emerald-500" />
                          <textarea value={checkoutForm.note} onChange={(e) => setCheckoutForm((c) => ({ ...c, note: e.target.value }))} placeholder={tt("notePlaceholder")} rows={3} className="rounded-[20px] border border-[#eadfcd] bg-[#fffdfa] px-5 py-4 text-slate-900 outline-none placeholder:text-slate-400 focus:border-emerald-500 md:col-span-2" />
                        </div>
                        <div className="mt-4 rounded-[20px] border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                          <span className="font-bold">{tt("savedAddress")}: </span>
                          {checkoutAddress || tt("addressMissing")}
                        </div>
                      </div>
                      <div className="mt-8">
                        <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-slate-400">{tt("paymentMethod")}</p>
                        <div className="mt-4 grid gap-3 md:grid-cols-2">
                          {[
                            { id: "cod" as const, label: tt("cod"), note: tt("codNote") },
                            { id: "bank_transfer" as const, label: tt("bankTransfer"), note: tt("bankNote") },
                            { id: "momo" as const, label: "Ví MoMo", note: tt("momoNote") },
                            { id: "vnpay" as const, label: "VNPay", note: tt("vnpayNote") },
                            { id: "card" as const, label: tt("card"), note: tt("cardNote") },
                          ].map((method) => (
                            <button key={method.id} onClick={() => setCheckoutForm((c) => ({ ...c, paymentMethod: method.id }))} className={`flex items-center gap-4 rounded-[24px] border p-4 text-left ${checkoutForm.paymentMethod === method.id ? "border-emerald-300 bg-emerald-50" : "border-[#eadfcd] bg-white"}`}>
                              <PaymentBrandMark method={method.id} compact />
                              <div className="min-w-0">
                                <p className="text-sm font-bold text-slate-900">{method.label}</p>
                                <p className="mt-1 text-xs text-slate-500">{method.note}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="max-h-[92vh] overflow-y-auto border-l border-[#eadfcd] bg-white p-8">
                      <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-slate-400">Order Summary</p>
                      <h3 className="mt-2 text-2xl font-black text-slate-900">{tt("orderSummary")}</h3>
                      <div className="mt-6 space-y-3">
                        {cartDetails.map((item) => (
                          <div key={item.product.id} className="flex items-center gap-3 rounded-[24px] border border-[#eadfcd] bg-[#fffdfa] p-3">
                            <img src={item.product.image} alt={item.product.name} className="h-16 w-16 rounded-2xl object-cover" referrerPolicy="no-referrer" />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-bold text-slate-900">{item.product.name}</p>
                              <p className="mt-1 text-xs text-slate-500">{tt("itemQty")} {item.quantity}</p>
                            </div>
                            <p className="text-sm font-bold text-emerald-700">{formatCurrency(item.lineTotal, locale)}</p>
                          </div>
                        ))}
                      </div>
                      <div className="mt-6 space-y-3 text-sm">
                        <div className="flex items-center justify-between text-slate-600"><span>{tt("subtotal")}</span><span>{formatCurrency(subtotal, locale)}</span></div>
                        <div className="flex items-center justify-between text-slate-600"><span>{tt("shippingFee")}</span><span>{shippingFee === 0 ? tt("free") : formatCurrency(shippingFee, locale)}</span></div>
                        <div className="flex items-center justify-between text-emerald-700"><span>{tt("discount")}</span><span>-{formatCurrency(discount, locale)}</span></div>
                      </div>
                      <div className="mt-5 border-t border-[#eadfcd] pt-5">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold uppercase tracking-[0.22em] text-slate-400">{tt("totalPayment")}</span>
                          <span className="text-3xl font-black text-slate-900">{formatCurrency(total, locale)}</span>
                        </div>
                      </div>
                      <div className="mt-6 rounded-[28px] border border-[#eadfcd] bg-[#fffdfa] p-5">
                        <div className="flex items-start gap-4">
                          {showPaymentQr ? (
                            <div className="shrink-0 overflow-hidden rounded-[22px] border border-[#eadfcd] bg-white p-2 shadow-[0_14px_36px_rgba(15,23,42,0.08)]">
                              <img src={paymentQrImage} alt="QR thanh toán MoMo VietQR Napas 247" className="h-32 w-32 object-contain" />
                            </div>
                          ) : (
                            <PaymentBrandMark method={checkoutForm.paymentMethod} />
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 text-emerald-700">
                              <QrCode className="h-4 w-4" />
                              <p className="text-[10px] font-bold uppercase tracking-[0.22em]">{tt("payment")}</p>
                            </div>
                            <h4 className="mt-2 text-lg font-black text-slate-900">{paymentGuide.title}</h4>
                            <p className="mt-2 text-sm leading-relaxed text-slate-500">{paymentGuide.description}</p>
                            <div className="mt-4 space-y-2 text-sm">
                              <div className="flex justify-between gap-3"><span className="text-slate-500">{tt("provider")}</span><span className="text-right font-bold text-slate-900">{paymentGuide.provider}</span></div>
                              <div className="flex justify-between gap-3"><span className="text-slate-500">{tt("accountNumber")}</span><span className="text-right font-bold text-slate-900">{paymentGuide.accountNumber}</span></div>
                              <div className="flex justify-between gap-3"><span className="text-slate-500">{tt("content")}</span><span className="text-right font-bold text-emerald-700">{paymentGuide.content}</span></div>
                            </div>
                            {showPaymentQr ? (
                              <div className="mt-4 flex items-center gap-3 rounded-[18px] border border-pink-100 bg-pink-50 px-4 py-3 text-xs font-bold text-pink-700">
                                <QrCode className="h-4 w-4" />
                                MoMo / VietQR / Napas 247
                              </div>
                            ) : null}
                            {checkoutForm.paymentMethod !== "vnpay" && (
                              <button
                                onClick={() =>
                                  navigator.clipboard?.writeText(
                                    `${paymentGuide.provider}\n${paymentGuide.accountName}\n${paymentGuide.accountNumber}\nAmount: ${formatCurrency(total, locale)}\nContent: ${paymentGuide.content}`
                                  )
                                }
                                className="mt-4 inline-flex items-center gap-2 rounded-2xl border border-[#eadfcd] bg-white px-4 py-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-600"
                              >
                                <Clipboard className="h-4 w-4" />
                                {tt("copyInfo")}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 flex items-center gap-2 rounded-[20px] bg-slate-50 px-4 py-3 text-xs text-slate-500">
                        <LockKeyhole className="h-4 w-4 text-emerald-700" />
                        {checkoutForm.paymentMethod === "vnpay"
                          ? tt("vnpaySafety")
                          : tt("demoPayment")}
                      </div>
                      <div className="sticky bottom-0 -mx-8 mt-6 border-t border-[#eadfcd] bg-white/95 px-8 pb-1 pt-4 backdrop-blur">
                        <button
                          disabled={submitting || !checkoutReady}
                          onClick={() => void handleCheckout()}
                          className="w-full rounded-[24px] bg-slate-900 px-6 py-4 text-sm font-bold uppercase tracking-[0.22em] text-white disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          {submitting ? tt("processing") : checkoutForm.paymentMethod === "vnpay" ? tt("goVnpay") : tt("confirmPayment")}
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {paymentNotice && (
            <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 18 }} className="fixed bottom-6 right-6 z-[230] max-w-md rounded-[28px] border border-[#eadfcd] bg-white p-5 shadow-2xl shadow-black/10">
              <div className="flex items-start gap-4">
                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${paymentNotice.type === "success" ? "bg-emerald-50" : "bg-rose-50"}`}>
                  {paymentNotice.type === "success" ? <CheckCircle2 className="h-6 w-6 text-emerald-700" /> : <X className="h-6 w-6 text-rose-700" />}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">{paymentNotice.title}</p>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{paymentNotice.message}</p>
                  <button onClick={() => setPaymentNotice(null)} className="mt-3 text-xs font-bold uppercase tracking-[0.22em] text-slate-500">{tt("close")}</button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {completedOrderCode && (
            <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 18 }} className="fixed bottom-6 right-6 z-[230] max-w-md rounded-[28px] border border-[#eadfcd] bg-white p-5 shadow-2xl shadow-black/10">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50"><CheckCircle2 className="h-6 w-6 text-emerald-700" /></div>
                <div>
                  <p className="text-sm font-bold text-slate-900">{tt("orderSuccess")}</p>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">
                    {language === "vi" ? "Mã đơn " : "Order "}
                    <span className="font-bold text-emerald-700">{completedOrderCode}</span> {tt("orderSuccessDesc")}
                  </p>
                  <button onClick={() => setCompletedOrderCode(null)} className="mt-3 text-xs font-bold uppercase tracking-[0.22em] text-slate-500">{tt("close")}</button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ShopView;
