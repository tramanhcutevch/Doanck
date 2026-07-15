import { isSupabaseConfigured, supabase } from "../lib/supabase.js";
import {
  ShopCartItem,
  ShopAnalytics,
  ShopBootstrapPayload,
  ShopOrder,
  ShopOrderItem,
  ShopPaymentMethod,
  ShopPaymentStatus,
  ShopProduct,
  ShopOrderStatus,
} from "../types.js";

const PRODUCT_STORAGE_KEY = "terraform-flora.shop.products";
const ORDER_STORAGE_KEY = "terraform-flora.shop.orders";
const SHOP_SEED_VERSION_KEY = "terraform-flora.shop.seed-version";
const SHOP_SEED_VERSION = "2026-04-06-v3";

type ProductInput = Omit<ShopProduct, "id" | "slug" | "createdAt" | "updatedAt"> & {
  id?: string;
  slug?: string;
};

type OrderInput = {
  userId?: string | null;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: string;
  note?: string;
  items: ShopOrderItem[];
  subtotal: number;
  shippingFee: number;
  discount: number;
  total: number;
  paymentMethod: ShopPaymentMethod;
};

type UpdateOrderInput = {
  orderId: string;
  status?: ShopOrderStatus;
  paymentStatus?: ShopPaymentStatus;
};

type CreateVnpayPaymentInput = {
  orderId: string;
  orderCode: string;
  amount: number;
  customerName: string;
};

type CreateVnpayPaymentResponse = {
  paymentUrl: string;
};

type ProductRow = {
  id: string;
  slug: string;
  name: string;
  category: string;
  price: number;
  original_price: number | null;
  stock: number;
  sku: string;
  manufacturer: string;
  origin: string;
  short_description: string;
  description: string;
  image: string;
  images: string[] | null;
  tags: string[] | null;
  badge: string | null;
  rating: number;
  review_count: number;
  sales_count: number;
  featured: boolean;
  best_seller: boolean;
  shipping_class: string;
  benefits: string[] | null;
  specs: Record<string, string> | null;
  created_at: string;
  updated_at: string;
};

type OrderRow = {
  id: string;
  code: string;
  user_id: string | null;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  shipping_address: string;
  note: string | null;
  items: ShopOrderItem[] | null;
  subtotal: number;
  shipping_fee: number;
  discount: number;
  total: number;
  payment_method: ShopPaymentMethod;
  payment_status: ShopPaymentStatus;
  status: ShopOrderStatus;
  created_at: string;
};

type CartRow = {
  user_id: string;
  items: ShopCartItem[] | null;
  updated_at: string;
};

const nowIso = () => new Date().toISOString();

const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const createId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const createOrderCode = () => `TF-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;

const readLocal = <T,>(key: string, fallback: T): T => {
  if (typeof localStorage === "undefined") return fallback;

  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

const writeLocal = <T,>(key: string, data: T) => {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(key, JSON.stringify(data));
};

const productSeed = (
  product: Omit<ShopProduct, "createdAt" | "updatedAt">
): ShopProduct => ({
  ...product,
  createdAt: nowIso(),
  updatedAt: nowIso(),
});

const mockProducts: ShopProduct[] = [
  productSeed({
    id: "shop-1",
    slug: "giong-ca-chua-bi-f1",
    name: "Cây Giống Cà Chua Bi F1",
    category: "Cây giống",
    price: 259000,
    originalPrice: 319000,
    stock: 46,
    sku: "TF-SEED-001",
    manufacturer: "Terraform Nursery",
    origin: "Việt Nam",
    shortDescription: "Khay cây giống khỏe, đồng đều, dễ hồi phục sau trồng cho mô hình nhà màng và sân vườn.",
    description:
      "Lô cây giống cà chua bi F1 được tuyển chọn đồng đều, thân mập, lá dày và phù hợp xuống giống nhanh cho các vườn thương phẩm hoặc mô hình trồng thử nghiệm.",
    image: "https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?auto=format&fit=crop&w=900&q=80",
    images: [
      "https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=900&q=80",
    ],
    tags: ["Cây giống", "F1", "Rau quả"],
    badge: "Best Seller",
    rating: 4.9,
    reviewCount: 184,
    salesCount: 412,
    featured: true,
    bestSeller: true,
    shippingClass: "Giao nhanh 2H nội thành",
    benefits: ["Cây đồng đều", "Tỷ lệ sống cao", "Đóng khay an toàn"],
    specs: {
      "Quy cách": "Khay 50 cây",
      "Chiều cao cây": "12-18cm",
      "Thời gian trồng": "Xuống giống ngay",
    },
  }),
  productSeed({
    id: "shop-2",
    slug: "phan-bon-la-vi-luong-nano-green",
    name: "Phân Bón Lá Vi Lượng Nano Green",
    category: "Phân bón",
    price: 189000,
    originalPrice: 229000,
    stock: 72,
    sku: "TF-FER-002",
    manufacturer: "GreenTech",
    origin: "Việt Nam",
    shortDescription: "Phân bón lá chuyên xanh lá, dày tán và phục hồi cây sau mưa kéo dài hoặc thiếu dinh dưỡng.",
    description:
      "Công thức nano NPK kết hợp vi lượng hỗ trợ cây tăng tốc sinh trưởng, bung đọt khỏe và hạn chế sốc dinh dưỡng sau thời tiết bất lợi.",
    image: "https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?auto=format&fit=crop&w=900&q=80",
    images: [
      "https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?auto=format&fit=crop&w=900&q=80",
    ],
    tags: ["Phân bón", "Vi lượng", "Phục hồi"],
    badge: "Flash Deal",
    rating: 4.8,
    reviewCount: 121,
    salesCount: 295,
    featured: true,
    bestSeller: true,
    shippingClass: "Miễn phí ship đơn từ 499K",
    benefits: ["Hấp thụ nhanh", "Xanh lá dày", "Dễ pha"],
    specs: {
      "Thành phần": "NPK + Zn + B + Mn",
      "Liều dùng": "25ml/16L",
      "Chu kỳ": "7-10 ngày/lần",
    },
  }),
  productSeed({
    id: "shop-3",
    slug: "phan-huu-co-kich-re-root-boost",
    name: "Phân Hữu Cơ Kích Rễ Root Boost",
    category: "Phân bón",
    price: 329000,
    stock: 28,
    sku: "TF-ROOT-003",
    manufacturer: "RootMaster",
    origin: "Thái Lan",
    shortDescription: "Phân kích rễ chuyên dùng đầu vụ, giúp cây nhanh bén rễ và phục hồi sau sang chậu hoặc úng nước.",
    description:
      "Root Boost Elite bổ sung humic và fulvic acid giúp bật rễ tơ, cải thiện cấu trúc đất và hỗ trợ cây hồi sức nhanh ở giai đoạn đầu vụ.",
    image: "https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=900&q=80",
    images: [
      "https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?auto=format&fit=crop&w=900&q=80",
    ],
    tags: ["Phân bón", "Humic", "Kích rễ"],
    rating: 4.7,
    reviewCount: 86,
    salesCount: 173,
    featured: false,
    bestSeller: false,
    shippingClass: "Giao tiêu chuẩn 1-3 ngày",
    benefits: ["Bật rễ tơ", "Giảm nghẹt rễ", "Phù hợp nhiều cây"],
    specs: {
      "Thành phần": "Humic + Fulvic Acid",
      "Liều dùng": "50ml/20L",
      "Cách dùng": "Tưới gốc hoặc phun lá",
    },
  }),
  productSeed({
    id: "shop-4",
    slug: "bo-loc-tuoi-aqua-pure",
    name: "Bộ Lọc Tưới Aqua Pure",
    category: "Vật tư",
    price: 1249000,
    originalPrice: 1499000,
    stock: 16,
    sku: "TF-IRR-004",
    manufacturer: "AquaTech Solutions",
    origin: "Hàn Quốc",
    shortDescription: "Bộ lọc nguồn nước đầu vào cho hệ thống tưới nhỏ giọt và phun mưa.",
    description:
      "Thiết bị lọc nước chuyên cho nhà màng và vườn cây ăn trái, giúp hạn chế cặn bẩn, kéo dài tuổi thọ béc tưới và ổn định lưu lượng.",
    image: "https://images.unsplash.com/photo-1502741338009-cac2772e18bc?auto=format&fit=crop&w=900&q=80",
    images: [
      "https://images.unsplash.com/photo-1502741338009-cac2772e18bc?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1471193945509-9ad0617afabf?auto=format&fit=crop&w=900&q=80",
    ],
    tags: ["Vật tư", "Tưới nhỏ giọt", "Nhà màng"],
    badge: "Premium",
    rating: 4.9,
    reviewCount: 64,
    salesCount: 92,
    featured: true,
    bestSeller: false,
    shippingClass: "Lắp đặt theo khu vực",
    benefits: ["Ổn định áp lực", "Giảm nghẹt béc", "Độ bền cao"],
    specs: {
      "Công suất": "2m3/h",
      "Chất liệu": "Than hoạt tính + nano bạc",
      "Ứng dụng": "Nhà màng, vườn cây ăn trái",
    },
  }),
  productSeed({
    id: "shop-5",
    slug: "cay-giong-ot-hiem-ghep",
    name: "Cây Giống Ớt Hiểm Ghép",
    category: "Cây giống",
    price: 219000,
    stock: 58,
    sku: "TF-SEED-005",
    manufacturer: "Terraform Nursery",
    origin: "Việt Nam",
    shortDescription: "Cây giống ớt ghép sinh trưởng khỏe, đồng đều và phù hợp xuống luống thương phẩm.",
    description:
      "Cây giống ớt hiểm ghép được tuyển lựa theo tiêu chí rễ khỏe, thân cứng, lá xanh và thích hợp cho mô hình trồng chuyên canh lẫn vườn hộ.",
    image: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=900&q=80",
    images: [
      "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=900&q=80",
    ],
    tags: ["Cây giống", "Ớt", "Ghép khỏe"],
    rating: 4.6,
    reviewCount: 97,
    salesCount: 201,
    featured: false,
    bestSeller: true,
    shippingClass: "Giao nhanh toàn quốc",
    benefits: ["Cây khỏe", "Ra rễ nhanh", "Đồng đều lô hàng"],
    specs: {
      "Quy cách": "Khay 50 cây",
      "Chiều cao cây": "14-20cm",
      "Khuyến nghị": "Trồng ngay sau khi nhận",
    },
  }),
  productSeed({
    id: "shop-6",
    slug: "bo-day-tuoi-drip-flex",
    name: "Bộ Dây Tưới Drip Flex",
    category: "Vật tư",
    price: 579000,
    stock: 34,
    sku: "TF-IRR-006",
    manufacturer: "IrriFlow",
    origin: "Trung Quốc",
    shortDescription: "Bộ tưới nhỏ giọt linh hoạt cho vườn rau, ban công và luống cây ngắn ngày.",
    description:
      "Bộ kit cắm là chạy, tối ưu cho người trồng tại nhà hoặc farm nhỏ, giúp tiết kiệm nước và đồng đều độ ẩm vùng rễ.",
    image: "https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=900&q=80",
    images: [
      "https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1471193945509-9ad0617afabf?auto=format&fit=crop&w=900&q=80",
    ],
    tags: ["Vật tư", "Tiết kiệm nước", "Nhà vườn"],
    rating: 4.5,
    reviewCount: 55,
    salesCount: 138,
    featured: false,
    bestSeller: false,
    shippingClass: "Giao tiêu chuẩn 1-3 ngày",
    benefits: ["Lắp nhanh", "Linh hoạt", "Bền ngoài trời"],
    specs: {
      "Chiều dài dây": "30m",
      "Phụ kiện": "Đầy đủ đầu nối",
      "Ứng dụng": "Rau ăn lá, luống cây nhỏ",
    },
  }),
  productSeed({
    id: "shop-7",
    slug: "phan-bon-trai-fruit-sweet",
    name: "Phân Bón Nuôi Trái Fruit Sweet",
    category: "Phân bón",
    price: 269000,
    stock: 43,
    sku: "TF-FER-007",
    manufacturer: "AgriNova",
    origin: "Malaysia",
    shortDescription: "Tăng độ bóng trái, hỗ trợ vào đường và nâng màu sắc giai đoạn trước thu hoạch.",
    description:
      "Fruit Sweet Booster được dùng nhiều ở cây ăn trái và dưa lưới, tập trung cải thiện độ đồng đều trái và cảm quan thương phẩm.",
    image: "https://images.unsplash.com/photo-1471193945509-9ad0617afabf?auto=format&fit=crop&w=900&q=80",
    images: [
      "https://images.unsplash.com/photo-1471193945509-9ad0617afabf?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?auto=format&fit=crop&w=900&q=80",
    ],
    tags: ["Phân bón", "Trái đẹp", "Lên màu"],
    rating: 4.8,
    reviewCount: 73,
    salesCount: 149,
    featured: true,
    bestSeller: false,
    shippingClass: "Miễn phí ship đơn từ 499K",
    benefits: ["Trái bóng", "Màu đẹp", "Tăng đồng đều"],
    specs: {
      "Thành phần": "Kali hữu cơ + amino",
      "Liều dùng": "20ml/16L",
      "Thời điểm": "10-20 ngày trước thu hoạch",
    },
  }),
  productSeed({
    id: "shop-8",
    slug: "phan-cai-tao-dat-soil-revive",
    name: "Phân Cải Tạo Đất Soil Revive",
    category: "Phân bón",
    price: 349000,
    stock: 19,
    sku: "TF-SOIL-008",
    manufacturer: "TerraCycle",
    origin: "Việt Nam",
    shortDescription: "Hỗn hợp vi sinh cải tạo đất, giảm nén chặt và tăng hoạt tính hữu cơ vùng rễ.",
    description:
      "Soil Revive Mix phù hợp cho đất trồng canh tác dài vụ, giúp tái tạo hệ vi sinh có lợi và cải thiện độ tơi xốp sau nhiều lần bón hóa học.",
    image: "https://images.unsplash.com/photo-1516253593875-bd7ba052fbc5?auto=format&fit=crop&w=900&q=80",
    images: [
      "https://images.unsplash.com/photo-1516253593875-bd7ba052fbc5?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=900&q=80",
    ],
    tags: ["Phân bón", "Vi sinh", "Phục hồi đất"],
    badge: "Low Stock",
    rating: 4.7,
    reviewCount: 44,
    salesCount: 88,
    featured: false,
    bestSeller: false,
    shippingClass: "Giao tiêu chuẩn 1-3 ngày",
    benefits: ["Tăng tơi xốp", "Giảm bí đất", "Phù hợp nhiều nền đất"],
    specs: {
      "Thành phần": "Vi sinh + hữu cơ khoáng",
      "Liều dùng": "1kg/100m2",
      "Tần suất": "15-20 ngày/lần",
    },
  }),
  productSeed({
    id: "shop-9",
    slug: "gia-the-uom-hat-clean-start",
    name: "Giá Thể Ươm Hạt Clean Start",
    category: "Vật tư",
    price: 149000,
    originalPrice: 169000,
    stock: 61,
    sku: "TF-MED-009",
    manufacturer: "BioSubstrate",
    origin: "Việt Nam",
    shortDescription: "Giá thể sạch, tơi xốp, thoát nước tốt cho ươm hạt và giâm cành.",
    description:
      "Hỗn hợp mụn dừa xử lý, trấu hun và hữu cơ vi sinh giúp bộ rễ non phát triển ổn định, hạn chế nấm nền ở giai đoạn đầu.",
    image: "https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=900&q=80",
    images: [
      "https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1516253593875-bd7ba052fbc5?auto=format&fit=crop&w=900&q=80",
    ],
    tags: ["Giá thể", "Ươm hạt", "Sạch bệnh"],
    badge: "Starter",
    rating: 4.8,
    reviewCount: 66,
    salesCount: 154,
    featured: true,
    bestSeller: false,
    shippingClass: "Giao tiêu chuẩn 1-3 ngày",
    benefits: ["Tơi xốp", "Giữ ẩm tốt", "Ít nấm nền"],
    specs: {
      "Quy cách": "Bao 20L",
      "Thành phần": "Mụn dừa + trấu hun + hữu cơ vi sinh",
      "Ứng dụng": "Ươm hạt, giâm cành, phối trộn đất",
    },
  }),
  productSeed({
    id: "shop-10",
    slug: "phan-ca-huu-co-fish-plus",
    name: "Phân Cá Hữu Cơ Fish Plus",
    category: "Phân bón",
    price: 239000,
    stock: 52,
    sku: "TF-ORG-010",
    manufacturer: "Ocean Harvest",
    origin: "Việt Nam",
    shortDescription: "Dinh dưỡng hữu cơ đậm đặc cho giai đoạn hồi cây, nuôi lá và giữ bộ rễ khỏe.",
    description:
      "Fish Plus là phân cá thủy phân dùng được cho cả phun lá và tưới gốc, phù hợp hộ trồng rau, cây ăn trái và canh tác hữu cơ.",
    image: "https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=900&q=80",
    images: [
      "https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?auto=format&fit=crop&w=900&q=80",
    ],
    tags: ["Phân cá", "Hữu cơ", "Nuôi lá"],
    rating: 4.7,
    reviewCount: 81,
    salesCount: 196,
    featured: true,
    bestSeller: true,
    shippingClass: "Miễn phí ship đơn từ 499K",
    benefits: ["Đậm đặc", "Ít mùi hơn", "Dễ phối trộn"],
    specs: {
      "Quy cách": "Can 1L",
      "Liều dùng": "20-30ml/16L",
      "Ứng dụng": "Tưới gốc, phun lá",
    },
  }),
  productSeed({
    id: "shop-11",
    slug: "cay-giong-dua-leo-ghep-khang-benh",
    name: "Cây Giống Dưa Leo Ghép Kháng Bệnh",
    category: "Cây giống",
    price: 289000,
    originalPrice: 329000,
    stock: 31,
    sku: "TF-SEED-011",
    manufacturer: "Terraform Nursery",
    origin: "Việt Nam",
    shortDescription: "Cây ghép khỏe, đồng đều, phù hợp nhà màng và canh tác thương phẩm vụ ngắn.",
    description:
      "Lô dưa leo ghép kháng bệnh nền giúp vườn xuống giống nhanh, tăng sức sống đầu vụ và dễ quản lý đồng đều giữa các luống.",
    image: "https://images.unsplash.com/photo-1471193945509-9ad0617afabf?auto=format&fit=crop&w=900&q=80",
    images: [
      "https://images.unsplash.com/photo-1471193945509-9ad0617afabf?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?auto=format&fit=crop&w=900&q=80",
    ],
    tags: ["Cây giống", "Dưa leo", "Kháng bệnh"],
    badge: "Mới về",
    rating: 4.9,
    reviewCount: 34,
    salesCount: 77,
    featured: true,
    bestSeller: false,
    shippingClass: "Giao nhanh toàn quốc",
    benefits: ["Khỏe đầu vụ", "Đồng đều", "Dễ chăm sóc"],
    specs: {
      "Quy cách": "Khay 40 cây",
      "Tuổi cây": "16-18 ngày",
      "Khuyến nghị": "Xuống giống trong 24h",
    },
  }),
  productSeed({
    id: "shop-12",
    slug: "combo-khoi-dong-vuon-rau-mini",
    name: "Combo Khởi Động Vườn Rau Mini",
    category: "Combo",
    price: 499000,
    originalPrice: 579000,
    stock: 24,
    sku: "TF-COMBO-012",
    manufacturer: "Terraform Flora",
    origin: "Việt Nam",
    shortDescription: "Combo dành cho người mới bắt đầu gồm giống, giá thể và dinh dưỡng nền cơ bản.",
    description:
      "Bộ combo gói gọn các vật tư cần thiết để lên một vườn rau nhỏ tại nhà, phù hợp ban công, sân thượng hoặc khu thử nghiệm.",
    image: "https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=900&q=80",
    images: [
      "https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?auto=format&fit=crop&w=900&q=80",
    ],
    tags: ["Combo", "Người mới", "Vườn rau"],
    badge: "Combo tiết kiệm",
    rating: 4.8,
    reviewCount: 58,
    salesCount: 111,
    featured: true,
    bestSeller: false,
    shippingClass: "Miễn phí ship",
    benefits: ["Dễ bắt đầu", "Đủ vật tư cơ bản", "Chi phí tối ưu"],
    specs: {
      "Thành phần": "Giống + giá thể + phân cá + dụng cụ",
      "Phù hợp": "Ban công, sân thượng",
      "Quy mô": "4-6 khay trồng nhỏ",
    },
  }),
];

const mockOrders: ShopOrder[] = [
  {
    id: "order-1",
    code: "TF-2026-120531",
    userId: null,
    customerName: "Nguyen Minh Khoa",
    customerEmail: "khoa@example.com",
    customerPhone: "0908000111",
    shippingAddress: "Quận 9, TP. HCM",
    items: [
      {
        productId: "shop-1",
        productName: "Cây Giống Cà Chua Bi F1",
        productImage: mockProducts[0].image,
        unitPrice: 259000,
        quantity: 2,
        lineTotal: 518000,
      },
      {
        productId: "shop-2",
        productName: "Phân Bón Lá Vi Lượng Nano Green",
        productImage: mockProducts[1].image,
        unitPrice: 189000,
        quantity: 1,
        lineTotal: 189000,
      },
    ],
    subtotal: 707000,
    shippingFee: 0,
    discount: 30000,
    total: 677000,
    paymentMethod: "momo",
    paymentStatus: "paid",
    status: "delivered",
    createdAt: "2026-03-30T08:15:00.000Z",
  },
  {
    id: "order-2",
    code: "TF-2026-120892",
    userId: null,
    customerName: "Tran Le Ha",
    customerEmail: "hale@example.com",
    customerPhone: "0911222333",
    shippingAddress: "Cần Thơ",
    items: [
      {
        productId: "shop-4",
        productName: "Bộ Lọc Tưới Aqua Pure",
        productImage: mockProducts[3].image,
        unitPrice: 1249000,
        quantity: 1,
        lineTotal: 1249000,
      },
    ],
    subtotal: 1249000,
    shippingFee: 35000,
    discount: 0,
    total: 1284000,
    paymentMethod: "bank_transfer",
    paymentStatus: "paid",
    status: "shipping",
    createdAt: "2026-03-31T04:20:00.000Z",
  },
  {
    id: "order-3",
    code: "TF-2026-121136",
    userId: null,
    customerName: "Pham Quoc Dung",
    customerEmail: "dung@example.com",
    customerPhone: "0933444555",
    shippingAddress: "Đồng Nai",
    items: [
      {
        productId: "shop-7",
        productName: "Phân Bón Nuôi Trái Fruit Sweet",
        productImage: mockProducts[6].image,
        unitPrice: 269000,
        quantity: 3,
        lineTotal: 807000,
      },
    ],
    subtotal: 807000,
    shippingFee: 0,
    discount: 25000,
    total: 782000,
    paymentMethod: "cod",
    paymentStatus: "pending",
    status: "confirmed",
    createdAt: "2026-04-01T10:45:00.000Z",
  },
  {
    id: "order-4",
    code: "TF-2026-121420",
    userId: null,
    customerName: "Vo Thi Nhu",
    customerEmail: "nhu@example.com",
    customerPhone: "0988555666",
    shippingAddress: "Lâm Đồng",
    items: [
      {
        productId: "shop-8",
        productName: "Phân Cải Tạo Đất Soil Revive",
        productImage: mockProducts[7].image,
        unitPrice: 349000,
        quantity: 2,
        lineTotal: 698000,
      },
      {
        productId: "shop-3",
        productName: "Phân Hữu Cơ Kích Rễ Root Boost",
        productImage: mockProducts[2].image,
        unitPrice: 329000,
        quantity: 1,
        lineTotal: 329000,
      },
    ],
    subtotal: 1027000,
    shippingFee: 35000,
    discount: 50000,
    total: 1012000,
    paymentMethod: "card",
    paymentStatus: "paid",
    status: "delivered",
    createdAt: "2026-04-02T06:55:00.000Z",
  },
  {
    id: "order-5",
    code: "TF-2026-121864",
    userId: null,
    customerName: "Le Thi Hanh",
    customerEmail: "hanh@example.com",
    customerPhone: "0979555222",
    shippingAddress: "Bảo Lộc, Lâm Đồng",
    items: [
      {
        productId: "shop-10",
        productName: "Phân Cá Hữu Cơ Fish Plus",
        productImage: mockProducts[9].image,
        unitPrice: 239000,
        quantity: 2,
        lineTotal: 478000,
      },
      {
        productId: "shop-9",
        productName: "Giá Thể Ươm Hạt Clean Start",
        productImage: mockProducts[8].image,
        unitPrice: 149000,
        quantity: 1,
        lineTotal: 149000,
      },
    ],
    subtotal: 627000,
    shippingFee: 0,
    discount: 25000,
    total: 602000,
    paymentMethod: "cod",
    paymentStatus: "pending",
    status: "pending",
    createdAt: "2026-04-03T03:12:00.000Z",
  },
  {
    id: "order-6",
    code: "TF-2026-122190",
    userId: null,
    customerName: "Do Van Loc",
    customerEmail: "loc@example.com",
    customerPhone: "0909555333",
    shippingAddress: "Long Xuyên, An Giang",
    items: [
      {
        productId: "shop-12",
        productName: "Combo Khởi Động Vườn Rau Mini",
        productImage: mockProducts[11].image,
        unitPrice: 499000,
        quantity: 1,
        lineTotal: 499000,
      },
      {
        productId: "shop-5",
        productName: "Cây Giống Ớt Hiểm Ghép",
        productImage: mockProducts[4].image,
        unitPrice: 219000,
        quantity: 1,
        lineTotal: 219000,
      },
    ],
    subtotal: 718000,
    shippingFee: 0,
    discount: 25000,
    total: 693000,
    paymentMethod: "bank_transfer",
    paymentStatus: "paid",
    status: "confirmed",
    createdAt: "2026-04-04T09:40:00.000Z",
  },
];

const ensureLocalState = () => {
  const currentSeedVersion = readLocal<string | null>(SHOP_SEED_VERSION_KEY, null);
  if (currentSeedVersion !== SHOP_SEED_VERSION) {
    writeLocal(PRODUCT_STORAGE_KEY, mockProducts);
    writeLocal(ORDER_STORAGE_KEY, mockOrders);
    writeLocal(SHOP_SEED_VERSION_KEY, SHOP_SEED_VERSION);
    return {
      products: mockProducts,
      orders: mockOrders,
    };
  }

  const products = readLocal<ShopProduct[]>(PRODUCT_STORAGE_KEY, []);
  const orders = readLocal<ShopOrder[]>(ORDER_STORAGE_KEY, []);

  if (products.length === 0) {
    writeLocal(PRODUCT_STORAGE_KEY, mockProducts);
  }

  if (orders.length === 0) {
    writeLocal(ORDER_STORAGE_KEY, mockOrders);
  }

  writeLocal(SHOP_SEED_VERSION_KEY, SHOP_SEED_VERSION);

  return {
    products: products.length === 0 ? mockProducts : products,
    orders: orders.length === 0 ? mockOrders : orders,
  };
};

const mapProductRow = (row: ProductRow): ShopProduct => ({
  id: row.id,
  slug: row.slug,
  name: row.name,
  category: row.category,
  price: row.price,
  originalPrice: row.original_price ?? undefined,
  stock: row.stock,
  sku: row.sku,
  manufacturer: row.manufacturer,
  origin: row.origin,
  shortDescription: row.short_description,
  description: row.description,
  image: row.image,
  images: row.images ?? [row.image],
  tags: row.tags ?? [],
  badge: row.badge ?? undefined,
  rating: row.rating,
  reviewCount: row.review_count,
  salesCount: row.sales_count,
  featured: row.featured,
  bestSeller: row.best_seller,
  shippingClass: row.shipping_class,
  benefits: row.benefits ?? [],
  specs: row.specs ?? {},
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const mapOrderRow = (row: OrderRow): ShopOrder => ({
  id: row.id,
  code: row.code,
  userId: row.user_id,
  customerName: row.customer_name,
  customerEmail: row.customer_email,
  customerPhone: row.customer_phone,
  shippingAddress: row.shipping_address,
  note: row.note ?? undefined,
  items: row.items ?? [],
  subtotal: row.subtotal,
  shippingFee: row.shipping_fee,
  discount: row.discount,
  total: row.total,
  paymentMethod: row.payment_method,
  paymentStatus: row.payment_status,
  status: row.status,
  createdAt: row.created_at,
});

const toProductRow = (product: ShopProduct): ProductRow => ({
  id: product.id,
  slug: product.slug,
  name: product.name,
  category: product.category,
  price: product.price,
  original_price: product.originalPrice ?? null,
  stock: product.stock,
  sku: product.sku,
  manufacturer: product.manufacturer,
  origin: product.origin,
  short_description: product.shortDescription,
  description: product.description,
  image: product.image,
  images: product.images,
  tags: product.tags,
  badge: product.badge ?? null,
  rating: product.rating,
  review_count: product.reviewCount,
  sales_count: product.salesCount,
  featured: product.featured,
  best_seller: product.bestSeller,
  shipping_class: product.shippingClass,
  benefits: product.benefits,
  specs: product.specs,
  created_at: product.createdAt,
  updated_at: product.updatedAt,
});

const toOrderRow = (order: ShopOrder): OrderRow => ({
  id: order.id,
  code: order.code,
  user_id: order.userId ?? null,
  customer_name: order.customerName,
  customer_email: order.customerEmail,
  customer_phone: order.customerPhone,
  shipping_address: order.shippingAddress,
  note: order.note ?? null,
  items: order.items,
  subtotal: order.subtotal,
  shipping_fee: order.shippingFee,
  discount: order.discount,
  total: order.total,
  payment_method: order.paymentMethod,
  payment_status: order.paymentStatus,
  status: order.status,
  created_at: order.createdAt,
});

export const getShopBootstrap = async (): Promise<ShopBootstrapPayload> => {
  const local = ensureLocalState();

  if (!isSupabaseConfigured || !supabase) {
    return { ...local, source: "local", message: "Chưa cấu hình Supabase, đang dùng dữ liệu local." };
  }

  try {
    const [productsRes, ordersRes] = await Promise.all([
      supabase.from("shop_products").select("*").order("updated_at", { ascending: false }),
      supabase.from("shop_orders").select("*").order("created_at", { ascending: false }),
    ]);

    if (productsRes.error || !productsRes.data) {
      return {
        ...local,
        source: "supabase-error",
        message: `Không đọc được shop_products từ Supabase${productsRes.error?.message ? `: ${productsRes.error.message}` : "."}`,
      };
    }

    const products = (productsRes.data as ProductRow[]).map(mapProductRow);
    const orders = ordersRes.error || !ordersRes.data ? local.orders : (ordersRes.data as OrderRow[]).map(mapOrderRow);

    if (products.length === 0) {
      return {
        products: [],
        orders,
        source: "supabase-empty",
        message: "Chưa có dữ liệu shop_products trên Supabase.",
      };
    }

    writeLocal(PRODUCT_STORAGE_KEY, products);
    writeLocal(ORDER_STORAGE_KEY, orders);
    return { products, orders, source: "supabase", message: "Đang đọc dữ liệu commerce từ Supabase." };
  } catch {
    return {
      ...local,
      source: "supabase-error",
      message: "Có lỗi khi kết nối Supabase, đang hiển thị dữ liệu local gần nhất.",
    };
  }
};

export const upsertShopProduct = async (input: ProductInput) => {
  const local = ensureLocalState();
  const timestamp = nowIso();
  const normalized: ShopProduct = {
    ...input,
    id: input.id ?? createId(),
    slug: input.slug?.trim() || slugify(input.name),
    originalPrice: input.originalPrice || undefined,
    images: input.images.length > 0 ? input.images : [input.image],
    tags: input.tags,
    benefits: input.benefits,
    specs: input.specs,
    createdAt: input.id
      ? local.products.find((product) => product.id === input.id)?.createdAt ?? timestamp
      : timestamp,
    updatedAt: timestamp,
  };

  const nextProducts = local.products.some((product) => product.id === normalized.id)
    ? local.products.map((product) => (product.id === normalized.id ? normalized : product))
    : [normalized, ...local.products];

  writeLocal(PRODUCT_STORAGE_KEY, nextProducts);

  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from("shop_products").upsert(toProductRow(normalized), { onConflict: "id" }).throwOnError();
    } catch {
      // Fall back to local data when commerce tables are not created yet.
    }
  }

  return normalized;
};

export const deleteShopProduct = async (productId: string) => {
  const local = ensureLocalState();
  const nextProducts = local.products.filter((product) => product.id !== productId);
  writeLocal(PRODUCT_STORAGE_KEY, nextProducts);

  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from("shop_products").delete().eq("id", productId).throwOnError();
    } catch {
      // Local state remains the source of truth until Supabase commerce tables exist.
    }
  }

  return nextProducts;
};

export const getShopCart = async (userId?: string | null): Promise<ShopCartItem[] | null> => {
  if (!userId || !isSupabaseConfigured || !supabase) {
    return null;
  }

  const { data, error } = await supabase.from("shop_carts").select("user_id, items, updated_at").eq("user_id", userId).maybeSingle();
  if (error) {
    throw error;
  }

  return ((data as CartRow | null)?.items ?? []) as ShopCartItem[];
};

export const saveShopCart = async (userId: string | null | undefined, items: ShopCartItem[]) => {
  if (!userId || !isSupabaseConfigured || !supabase) {
    return;
  }

  const { error } = await supabase
    .from("shop_carts")
    .upsert(
      {
        user_id: userId,
        items,
        updated_at: nowIso(),
      },
      { onConflict: "user_id" }
    );

  if (error) {
    throw error;
  }
};

export const clearShopCart = async (userId?: string | null) => {
  await saveShopCart(userId, []);
};

export const createShopOrder = async (input: OrderInput) => {
  const local = ensureLocalState();
  const order: ShopOrder = {
    id: createId(),
    code: createOrderCode(),
    userId: input.userId ?? null,
    customerName: input.customerName,
    customerEmail: input.customerEmail,
    customerPhone: input.customerPhone,
    shippingAddress: input.shippingAddress,
    note: input.note,
    items: input.items,
    subtotal: input.subtotal,
    shippingFee: input.shippingFee,
    discount: input.discount,
    total: input.total,
    paymentMethod: input.paymentMethod,
    paymentStatus: input.paymentMethod === "cod" || input.paymentMethod === "vnpay" ? "pending" : "paid",
    status: input.paymentMethod === "cod" ? "confirmed" : "pending",
    createdAt: nowIso(),
  };

  const nextOrders = [order, ...local.orders];
  const nextProducts = local.products.map((product) => {
    const orderedItem = input.items.find((item) => item.productId === product.id);
    if (!orderedItem) return product;

    const nextSales = product.salesCount + orderedItem.quantity;
    return {
      ...product,
      stock: Math.max(product.stock - orderedItem.quantity, 0),
      salesCount: nextSales,
      bestSeller: nextSales >= 180 || product.bestSeller,
      updatedAt: nowIso(),
    };
  });

  writeLocal(ORDER_STORAGE_KEY, nextOrders);
  writeLocal(PRODUCT_STORAGE_KEY, nextProducts);

  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from("shop_orders").insert(toOrderRow(order)).throwOnError();
      await Promise.all(
        nextProducts.map((product) =>
          supabase.from("shop_products").upsert(toProductRow(product), { onConflict: "id" }).throwOnError()
        )
      );
    } catch {
      // If remote sync is unavailable, keep the local storefront responsive.
    }
  }

  return order;
};

export const createVnpayPayment = async (input: CreateVnpayPaymentInput) => {
  const response = await fetch("/api/payments/vnpay/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(payload?.error || "Không tạo được liên kết thanh toán VNPay.");
  }

  const payload = (await response.json()) as CreateVnpayPaymentResponse;
  if (!payload.paymentUrl) {
    throw new Error("VNPay không trả về liên kết thanh toán.");
  }

  return payload.paymentUrl;
};

export const updateShopOrder = async ({ orderId, status, paymentStatus }: UpdateOrderInput) => {
  const local = ensureLocalState();
  const target = local.orders.find((order) => order.id === orderId);
  if (!target) return null;

  const nextOrder: ShopOrder = {
    ...target,
    status: status ?? target.status,
    paymentStatus: paymentStatus ?? target.paymentStatus,
  };

  const nextOrders = local.orders.map((order) => (order.id === orderId ? nextOrder : order));
  writeLocal(ORDER_STORAGE_KEY, nextOrders);

  if (isSupabaseConfigured && supabase) {
    try {
      await supabase
        .from("shop_orders")
        .update({
          status: nextOrder.status,
          payment_status: nextOrder.paymentStatus,
        })
        .eq("id", orderId)
        .throwOnError();
    } catch {
      // Keep local state so admin can continue working even without remote write access.
    }
  }

  return nextOrder;
};

export const getShopAnalytics = (products: ShopProduct[], orders: ShopOrder[]): ShopAnalytics => {
  const validOrders = orders.filter((order) => order.status !== "cancelled" && order.paymentStatus !== "failed");
  const totalRevenue = validOrders.reduce((sum, order) => sum + order.total, 0);
  const totalOrders = orders.length;
  const totalUnitsSold = validOrders.reduce(
    (sum, order) => sum + order.items.reduce((itemSum, item) => itemSum + item.quantity, 0),
    0
  );
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const lowStockProducts = products.filter((product) => product.stock <= 20).length;
  const bestSeller = [...products].sort((left, right) => right.salesCount - left.salesCount)[0] ?? null;

  const categoryMap = new Map<string, { category: string; revenue: number; units: number }>();
  validOrders.forEach((order) => {
    order.items.forEach((item) => {
      const product = products.find((entry) => entry.id === item.productId);
      const category = product?.category ?? "Khác";
      const current = categoryMap.get(category) ?? { category, revenue: 0, units: 0 };
      current.revenue += item.lineTotal;
      current.units += item.quantity;
      categoryMap.set(category, current);
    });
  });

  const revenueMap = new Map<
    string,
    { label: string; revenue: number; orders: number; units: number; month: number; year: number }
  >();
  const currentMonth = new Date();
  for (let monthOffset = 11; monthOffset >= 0; monthOffset -= 1) {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - monthOffset, 1);
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    const key = `${year}-${String(month).padStart(2, "0")}`;
    revenueMap.set(key, {
      label: `${month}/${String(year).slice(-2)}`,
      revenue: 0,
      orders: 0,
      units: 0,
      month,
      year,
    });
  }

  validOrders.forEach((order) => {
    const date = new Date(order.createdAt);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const current = revenueMap.get(key);
    if (current) {
      current.revenue += order.total;
      current.orders += 1;
      current.units += order.items.reduce((sum, item) => sum + item.quantity, 0);
    }
  });

  return {
    totalRevenue,
    totalOrders,
    averageOrderValue,
    totalUnitsSold,
    activeProducts: products.length,
    lowStockProducts,
    conversionNote:
      totalOrders > 8 ? "Đơn hàng đang tăng đều, nên giữ nhịp upsell combo và best seller." : "Nên đẩy traffic vào nhóm best seller để tăng chuyển đổi.",
    bestSeller,
    topCategories: [...categoryMap.values()].sort((left, right) => right.revenue - left.revenue).slice(0, 4),
    revenueSeries: [...revenueMap.values()],
  };
};
