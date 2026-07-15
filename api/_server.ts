import dotenv from "dotenv";
import express from "express";
import { GoogleGenAI } from "@google/genai";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { plantDiseaseCatalogList } from "../src/data/plantDiseaseCatalog.js";
import { getCatalogTreatmentProtocol } from "../src/data/treatmentProtocolCatalog.js";
import { listAdminUsers, type AdminUserProfile } from "../src/services/adminUserService.js";
import { loadLibraryArticles, type LibraryArticle } from "../src/services/libraryService.js";
import { getPesticideLibrary } from "../src/services/pesticideLibraryService.js";
import { getRecommendationProfiles, type RecommendationDiseaseProfile } from "../src/services/recommendationDataService.js";
import { getShopAnalytics, getShopBootstrap } from "../src/services/shopService.js";
import type {
  AppUser,
  CommunityComment,
  CommunityPost,
  Diagnosis,
  GrowthCycle,
  GrowthPhoto,
  GrowthTask,
  Pesticide,
  ProtocolBookmark,
  ShopCartItem,
  ShopOrder,
  ShopProduct,
} from "../src/types.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DEFAULT_PORT = Number(process.env.PORT || 3001);
const AI_PROVIDER_ENV = process.env.AI_PROVIDER?.trim().toLowerCase() || "";
const AI_CHAT_PROVIDER_ENV = process.env.AI_CHAT_PROVIDER?.trim().toLowerCase() || "";
const DEFAULT_PROVIDER = AI_PROVIDER_ENV || "gemini";
const DEFAULT_GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const GEMINI_CHAT_FALLBACK_MODELS = process.env.GEMINI_CHAT_FALLBACK_MODELS || "gemini-2.0-flash,gemini-2.0-flash-lite,gemini-1.5-flash";
const DEFAULT_OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4.1-mini";
const DEFAULT_GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
const GROQ_CHAT_FALLBACK_MODELS =
  process.env.GROQ_CHAT_FALLBACK_MODELS || "llama-3.1-8b-instant,gemma2-9b-it";
const DEFAULT_GROQ_DIAGNOSIS_MODEL =
  process.env.GROQ_DIAGNOSIS_MODEL || "meta-llama/llama-4-scout-17b-16e-instruct";
const DEFAULT_OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini";
const DEFAULT_OPENROUTER_DIAGNOSIS_MODEL =
  process.env.OPENROUTER_DIAGNOSIS_MODEL || DEFAULT_OPENROUTER_MODEL;
const TOMATO_MODEL_PATH = path.join(process.cwd(), "AI", "model.onnx");
const TOMATO_CLASS_NAMES_PATH = path.join(process.cwd(), "AI", "tomato_onnx_class_names.json");
const APPLE_MODEL_PATH =
  process.env.AI_APPLE_MODEL_PATH || path.join(process.cwd(), "AI", "apple_disease_3class.onnx");
const APPLE_CLASS_NAMES_PATH =
  process.env.AI_APPLE_CLASS_NAMES_PATH || path.join(process.cwd(), "AI", "apple_onnx_class_names.json");
const RICE_MODEL_PATH =
  process.env.AI_RICE_MODEL_PATH || path.join(process.cwd(), "AI", "rice", "rice_leaf_disease.onnx");
const RICE_CLASS_NAMES_PATH =
  process.env.AI_RICE_CLASS_NAMES_PATH || path.join(process.cwd(), "AI", "rice", "rice_classes.json");
const POTATO_MODEL_PATH =
  process.env.AI_POTATO_MODEL_PATH || path.join(process.cwd(), "AI", "potato", "potato_effv2b1_best.onnx");
const POTATO_CLASS_NAMES_PATH =
  process.env.AI_POTATO_CLASS_NAMES_PATH || path.join(process.cwd(), "AI", "potato", "class_info.json");
const CASSAVA_MODEL_PATH =
  process.env.AI_CASSAVA_MODEL_PATH || path.join(process.cwd(), "AI", "cassava", "cassava_best_efficientnetv2b3_acc819.keras");
const CASSAVA_CLASS_NAMES_PATH =
  process.env.AI_CASSAVA_CLASS_NAMES_PATH || path.join(process.cwd(), "AI", "cassava", "label_num_to_disease_map.json");
const MAIZE_MODEL_PATH =
  process.env.AI_MAIZE_MODEL_PATH || path.join(process.cwd(), "AI", "ngô", "agribot_models.pkl");
const MAIZE_CLASS_NAMES_PATH = process.env.AI_MAIZE_CLASS_NAMES_PATH || MAIZE_MODEL_PATH;
const MAIZE_INFERENCE_SCRIPT =
  process.env.AI_MAIZE_INFERENCE_SCRIPT || path.join(process.cwd(), "AI", "ngô", "predict_maize.py");
const BEAN_MODEL_PATH = process.env.AI_BEAN_MODEL_PATH || path.join(process.cwd(), "AI", "đậu");
const BEAN_CLASS_NAMES_PATH = process.env.AI_BEAN_CLASS_NAMES_PATH || path.join(process.cwd(), "AI", "đậu", "config.json");
const BEAN_INFERENCE_SCRIPT =
  process.env.AI_BEAN_INFERENCE_SCRIPT || path.join(process.cwd(), "AI", "predict_bean_vit.py");
const LOCAL_MODEL_PATH = process.env.AI_MODEL_PATH || TOMATO_MODEL_PATH;
const LOCAL_CLASS_NAMES_PATH = process.env.AI_CLASS_NAMES_PATH || TOMATO_CLASS_NAMES_PATH;
const LOCAL_INFERENCE_SCRIPT =
  process.env.AI_INFERENCE_SCRIPT || path.join(process.cwd(), "AI", "predict_disease_onnx.py");
const KERAS_INFERENCE_SCRIPT =
  process.env.AI_KERAS_INFERENCE_SCRIPT || path.join(process.cwd(), "AI", "predict_disease_keras.py");
const LOCAL_IMAGE_SIZE = Number(process.env.AI_IMAGE_SIZE || 32);
const VNPAY_TMN_CODE = process.env.VNPAY_TMN_CODE?.trim() || process.env.vnp_TmnCode?.trim() || "";
const VNPAY_HASH_SECRET = process.env.VNPAY_HASH_SECRET?.trim() || process.env.vnp_HashSecret?.trim() || "";
const VNPAY_PAYMENT_URL =
  process.env.VNPAY_PAYMENT_URL?.trim() ||
  process.env.vnp_Url?.trim() ||
  "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";
const VNPAY_RETURN_URL = process.env.VNPAY_RETURN_URL?.trim() || "";
const SUPABASE_SERVER_URL =
  process.env.VITE_SUPABASE_URL?.trim() ||
  process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
  "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || "";
const serverSupabase =
  SUPABASE_SERVER_URL && SUPABASE_SERVICE_ROLE_KEY
    ? createClient(SUPABASE_SERVER_URL, SUPABASE_SERVICE_ROLE_KEY, {
        auth: { persistSession: false },
      })
    : null;

const firstExistingPath = (candidates: string[]) =>
  candidates.find((candidate) => fs.existsSync(candidate)) || candidates[0];

const PLANT_MODEL_REGISTRY = {
  tomato: {
    id: "tomato",
    cropName: "Cà chua",
    modelPath: LOCAL_MODEL_PATH,
    classNamesPath: LOCAL_CLASS_NAMES_PATH,
    inferenceScript: LOCAL_INFERENCE_SCRIPT,
    imageSize: LOCAL_IMAGE_SIZE,
    runtime: "onnx",
    normalization: "signed",
  },
  apple: {
    id: "apple",
    cropName: "Táo",
    modelPath: APPLE_MODEL_PATH,
    classNamesPath: APPLE_CLASS_NAMES_PATH,
    inferenceScript: LOCAL_INFERENCE_SCRIPT,
    imageSize: Number(process.env.AI_APPLE_IMAGE_SIZE || 300),
    runtime: "onnx",
    normalization: "raw",
  },
  rice: {
    id: "rice",
    cropName: "Lúa",
    modelPath: RICE_MODEL_PATH,
    classNamesPath: RICE_CLASS_NAMES_PATH,
    inferenceScript: LOCAL_INFERENCE_SCRIPT,
    imageSize: Number(process.env.AI_RICE_IMAGE_SIZE || 260),
    runtime: "onnx",
    normalization: "raw",
  },
  potato: {
    id: "potato",
    cropName: "Khoai tây",
    modelPath: POTATO_MODEL_PATH,
    classNamesPath: POTATO_CLASS_NAMES_PATH,
    inferenceScript: LOCAL_INFERENCE_SCRIPT,
    imageSize: Number(process.env.AI_POTATO_IMAGE_SIZE || 240),
    runtime: "onnx",
    normalization: process.env.AI_POTATO_NORMALIZATION || "raw",
  },
  cassava: {
    id: "cassava",
    cropName: "Sắn",
    modelPath: CASSAVA_MODEL_PATH,
    classNamesPath: CASSAVA_CLASS_NAMES_PATH,
    inferenceScript: KERAS_INFERENCE_SCRIPT,
    imageSize: Number(process.env.AI_CASSAVA_IMAGE_SIZE || 300),
    runtime: "keras",
    normalization: process.env.AI_CASSAVA_NORMALIZATION || "raw",
  },
  corn: {
    id: "corn",
    cropName: "Ngô",
    modelPath: MAIZE_MODEL_PATH,
    classNamesPath: MAIZE_CLASS_NAMES_PATH,
    inferenceScript: MAIZE_INFERENCE_SCRIPT,
    imageSize: Number(process.env.AI_MAIZE_IMAGE_SIZE || 224),
    runtime: "sklearn-mobilenet",
    normalization: "imagenet",
  },
  bean: {
    id: "bean",
    cropName: "Đậu",
    modelPath: BEAN_MODEL_PATH,
    classNamesPath: BEAN_CLASS_NAMES_PATH,
    inferenceScript: BEAN_INFERENCE_SCRIPT,
    imageSize: Number(process.env.AI_BEAN_IMAGE_SIZE || 224),
    runtime: "transformers-vit",
    normalization: "mean-std-0.5",
  },
} as const;

type CropId = keyof typeof PLANT_MODEL_REGISTRY;
const CLOUD_DIAGNOSIS_CROP_IDS = new Set<CropId>();
const LOCAL_ONLY_DIAGNOSIS_CROP_IDS = new Set<CropId>(["cassava", "corn"]);

type Provider = "gemini" | "openai" | "local";
type RemoteProvider = "gemini" | "groq" | "openai" | "openrouter";
type ChatProvider = RemoteProvider | "fallback";
type ChatMessage = {
  role: "user" | "model";
  text: string;
};

type ChatProviderResult = {
  text: string;
  provider: ChatProvider;
  model: string;
  fallbackModelUsed?: boolean;
};

type RagIntent =
  | "out_of_scope"
  | "order_status"
  | "return_policy"
  | "product_advice"
  | "crop_disease"
  | "care_guide"
  | "data_inventory"
  | "pesticide_lookup"
  | "library_lookup"
  | "recommendation_lookup"
  | "growth_tracking"
  | "community_lookup"
  | "diagnosis_history"
  | "general";

type RagDocument = {
  id: string;
  title: string;
  source:
    | "shop_product"
    | "shop_order"
    | "plant_disease"
    | "treatment_protocol"
    | "care_guide"
    | "business_policy"
    | "data_inventory"
    | "pesticide"
    | "library_article"
    | "recommendation_profile"
    | "growth_cycle"
    | "growth_task"
    | "growth_photo"
    | "community_post"
    | "community_comment"
    | "diagnosis_history"
    | "order_support_message"
    | "user_profile"
    | "admin_user"
    | "shop_cart"
    | "shop_favorite"
    | "library_bookmark"
    | "protocol_bookmark"
    | "chat_history"
    | "module_manifest"
    | "admin_dashboard";
  intent: RagIntent[];
  text: string;
  metadata?: Record<string, string | number | boolean | null>;
};

type RetrievedRagDocument = RagDocument & {
  score: number;
  keywordScore?: number;
  vectorScore?: number;
  rerankScore?: number;
};

type RagResult = {
  intent: RagIntent;
  documents: RetrievedRagDocument[];
  contextText: string;
  normalizedQuery: string;
  rewrittenQuery: string;
  corpusCount: number;
  enoughData: boolean;
};

type IndexedRagDocument = {
  searchText: string;
  tokens: string[];
  vector: Map<string, number>;
  norm: number;
};

type ChatRagClientContext = {
  orders?: ShopOrder[];
  products?: ShopProduct[];
  pesticides?: Pesticide[];
  libraryArticles?: LibraryArticle[];
  recommendationProfiles?: RecommendationDiseaseProfile[];
  diagnoses?: Diagnosis[];
  growthCycles?: GrowthCycle[];
  growthTasks?: GrowthTask[];
  growthPhotos?: GrowthPhoto[];
  communityPosts?: CommunityPost[];
  communityComments?: CommunityComment[];
  orderSupportMessages?: Array<{
    id: string;
    orderId: string;
    orderCode: string;
    customerName: string;
    customerEmail?: string | null;
    sender: string;
    body: string;
    createdAt: string;
  }>;
  currentUser?: AppUser | null;
  adminUsers?: AdminUserProfile[];
  cartItems?: ShopCartItem[];
  favoriteProductIds?: string[];
  libraryBookmarkIds?: string[];
  protocolBookmarks?: ProtocolBookmark[];
  chatMessages?: ChatMessage[];
};

type LocalRuntimeStatus = {
  pythonAvailable: boolean;
  onnxRuntimeAvailable?: boolean;
  pythonVersion?: string;
  onnxRuntimeVersion?: string;
  error?: string;
};

const consultationInstruction = [
  "Bạn là một chuyên gia nông nghiệp AI giàu kinh nghiệm thực địa.",
  "Chỉ trả lời các câu hỏi thuộc lĩnh vực nông nghiệp hoặc dữ liệu RAG của hệ thống: trồng trọt, chăn nuôi, thủy sản, bệnh cây, sâu bệnh, phân bón, thuốc BVTV, giống cây trồng/vật nuôi, kỹ thuật canh tác, đất đai, thời tiết phục vụ sản xuất, máy móc nông nghiệp, chính sách và kinh tế nông nghiệp.",
  "Nếu câu hỏi ngoài phạm vi nông nghiệp, không trả lời nội dung đó; hãy lịch sự nói rằng bạn chỉ hỗ trợ vấn đề nông nghiệp và mời người dùng hỏi về nông nghiệp.",
  "Luôn trả lời bằng tiếng Việt rõ ràng, thực tế và dễ áp dụng.",
  "Trả lời đúng độ dài người dùng yêu cầu. Nếu người dùng yêu cầu ngắn, hãy thật ngắn. Nếu câu hỏi cần phân tích hoặc người dùng yêu cầu chi tiết, hãy trình bày sâu hơn.",
  "Không kéo dài câu trả lời bằng phần mở đầu xã giao. Không dừng giữa chừng, không kết thúc dang dở.",
  "Ưu tiên an toàn cho người, cây trồng, cộng đồng và môi trường.",
  "Khi phù hợp, hãy tổ chức câu trả lời thành các mục rõ như: Đánh giá nhanh, Nguyên nhân có thể, Phân tích chi tiết, Việc nên làm ngay, Kế hoạch theo dõi, Cần tránh, Khi nào cần can thiệp mạnh hơn.",
  "Nếu người dùng hỏi cách xử lý, hãy nêu từng bước cụ thể, giải thích vì sao làm như vậy và ưu tiên thứ tự hành động.",
  "Nếu người dùng hỏi về thuốc BVTV hoặc thao tác có rủi ro, luôn nhắc đồ bảo hộ, liều lượng theo nhãn, thời gian cách ly và nguyên tắc an toàn.",
  "Nếu thiếu dữ kiện, hãy nêu rõ còn thiếu gì và vẫn đưa ra câu trả lời tạm thời dựa trên giả định hợp lý, thay vì từ chối ngắn gọn.",
  "Với câu hỏi kỹ thuật, hãy cố gắng nêu dấu hiệu nhận biết, nguyên nhân, hướng xử lý trước mắt, hướng xử lý tiếp theo và cách theo dõi hiệu quả.",
  "Nếu có nhiều khả năng, hãy xếp theo mức độ thường gặp hoặc mức độ đáng lo trước.",
  "Tránh các câu xã giao dài dòng. Tập trung vào nội dung hữu ích, chắc ý và có cấu trúc.",
].join(" ");

const formatChatPrompt = (message: string) => [
  message.trim(),
  "",
  "Yêu cầu cách trả lời:",
  "- Ưu tiên ngắn gọn, đúng trọng tâm nếu người dùng không yêu cầu phân tích sâu.",
  "- Nếu cần phân tích, trình bày theo từng mục rõ ràng.",
  "- Giải thích nguyên nhân, dấu hiệu, mức độ rủi ro và cách xử lý.",
  "- Nếu phù hợp, cho checklist hoặc các bước hành động cụ thể.",
  "- Nếu thông tin còn thiếu, ghi rõ giả định và nói cần kiểm tra thêm gì.",
  "- Kết thúc bằng khuyến nghị thực tế dễ áp dụng, không lan man.",
].join("\n");

const normalizeSearchText = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const RAG_STOP_WORDS = new Set([
  "toi",
  "tui",
  "ban",
  "minh",
  "em",
  "anh",
  "chi",
  "la",
  "co",
  "cua",
  "va",
  "hay",
  "cho",
  "voi",
  "ve",
  "duoc",
  "khong",
  "nhu",
  "nao",
  "gi",
  "can",
  "hoi",
  "tu",
  "the",
  "nay",
  "kia",
  "mot",
  "cac",
  "nhung",
  "trong",
  "neu",
]);

const tokenizeForRetrieval = (value: string) =>
  normalizeSearchText(value)
    .split(" ")
    .map((token) => token.trim())
    .filter((token) => token.length >= 2 && !RAG_STOP_WORDS.has(token));

const uniqueTokens = (value: string) =>
  tokenizeForRetrieval(value).filter((token, index, tokens) => tokens.indexOf(token) === index);

const RAG_QUERY_EXPANSIONS: Partial<Record<RagIntent, string[]>> = {
  data_inventory: [
    "module",
    "nguoi dung",
    "user",
    "admin",
    "dashboard",
    "don hang",
    "cua hang",
    "san pham",
    "thu vien",
    "bai viet",
    "phac do",
    "thuoc bvtv",
    "sinh truong",
    "cong dong",
    "chan doan",
    "khuyen nghi",
    "bookmark",
    "gio hang",
  ],
  order_status: ["don hang", "ma don", "thanh toan", "van chuyen", "giao hang", "khach hang"],
  product_advice: ["cua hang", "san pham", "gia", "ton kho", "sku", "vat tu", "cay giong", "phan bon"],
  pesticide_lookup: ["thuoc bvtv", "hoat chat", "lieu dung", "phun", "cach ly", "doc tinh", "benh hai"],
  library_lookup: ["thu vien", "bai viet", "tai lieu", "huong dan", "pdf", "nguon"],
  recommendation_lookup: ["khuyen nghi", "phac do", "trieu chung", "nguyen nhan", "xu ly", "ke hoach"],
  diagnosis_history: ["lich su chan doan", "ket qua chan doan", "benh", "do tin cay", "anh"],
  growth_tracking: ["sinh truong", "chu ky", "giai doan", "nhiem vu", "lich cham soc", "anh theo doi"],
  community_lookup: ["cong dong", "forum", "bai dang", "binh luan", "thao luan"],
  crop_disease: ["benh cay", "sau benh", "nam", "vi khuan", "virus", "trieu chung", "phac do"],
  care_guide: ["cham soc", "tuoi", "bon phan", "cat tia", "theo doi", "checklist"],
};

const RAG_PHRASE_REWRITES: Array<[RegExp, string]> = [
  [/\bfull\b/g, "toan bo"],
  [/\bdata\b/g, "du lieu"],
  [/\brag\b/g, "truy xuat du lieu noi bo"],
  [/\bshop\b/g, "cua hang san pham don hang"],
  [/\buser\b/g, "nguoi dung"],
  [/\busers\b/g, "nguoi dung"],
  [/\badmin\b/g, "quan tri admin dashboard"],
  [/\border\b/g, "don hang"],
  [/\borders\b/g, "don hang"],
  [/\blibrary\b/g, "thu vien bai viet tai lieu"],
  [/\bpesticide\b/g, "thuoc bvtv"],
  [/\bpesticides\b/g, "thuoc bvtv"],
  [/\bprotocol\b/g, "phac do"],
  [/\bprotocols\b/g, "phac do"],
];

const rewriteRagQuery = (message: string, intent: RagIntent) => {
  const normalized = normalizeSearchText(message);
  const rewritten = RAG_PHRASE_REWRITES.reduce(
    (result, [pattern, replacement]) => result.replace(pattern, replacement),
    normalized
  );
  const expandedText = [rewritten, ...(RAG_QUERY_EXPANSIONS[intent] || [])].join(" ");

  return {
    normalized,
    rewritten,
    tokens: uniqueTokens(expandedText),
  };
};

const isFullCorpusRequest = (message: string) =>
  /(full data|full web|full app|full rag|toan bo|tat ca|quet het|lay het|scan het|du lieu cua toi|du lieu he thong|toan he thong|toan ung dung|full chuc nang|tat ca cac muc)/.test(
    normalizeSearchText(message)
  );

const isAgricultureScopedMessage = (message: string) => {
  const normalized = normalizeSearchText(message);
  const systemDataSignals =
    /(rag|du lieu|he thong|module|nguoi dung|user|admin|dashboard|don hang|ma don|thanh toan|van chuyen|giao hang|san pham|cua hang|thu vien|bai viet|phac do|bookmark|gio hang|cong dong)/;
  const agricultureSignals =
    /(nong nghiep|trong trot|chan nuoi|thuy san|cay|cay trong|lua|ca chua|xoai|\bsan\b|ngo|dau|rau|vuon|trang trai|vat nuoi|gia suc|gia cam|\bbo\b|heo|lon|\bga\b|vit|\bca\b|tom|ao nuoi|benh cay|sau benh|nam|vi khuan|virus|\bsau\b|ray|\bre\b|\bla\b|trai cay|hoa|dat|dat dai|tuoi|bon|phan bon|phan|thuoc|bvtv|giong|giong cay|giong vat nuoi|canh tac|mua vu|thu hoach|may moc nong nghiep|may cay|may gat|kinh te nong nghiep|chinh sach nong nghiep)/;
  const weatherSignals = /(thoi tiet|mua|nang|nhiet do|do am|gio|bao|ret|han|ngap|xam nhap man)/;
  const productionContextSignals =
    /(san xuat|mua vu|nong nghiep|trong|nuoi|cay|lua|rau|vuon|trang trai|vat nuoi|gia suc|gia cam|ao nuoi|ca|tom)/;

  return systemDataSignals.test(normalized) || agricultureSignals.test(normalized) || (weatherSignals.test(normalized) && productionContextSignals.test(normalized));
};

const buildOutOfScopeChatResponse = (message: string) => {
  const normalized = normalizeSearchText(message);
  if (/(thoi tiet|mua|nang|nhiet do|do am|gio|bao)/.test(normalized)) {
    return "Tôi chỉ hỗ trợ các nội dung liên quan đến nông nghiệp. Nếu bạn muốn biết thời tiết để phục vụ sản xuất nông nghiệp, vui lòng cho biết địa phương và loại cây trồng hoặc vật nuôi.";
  }

  if (/(ke chuyen|chuyen cuoi|truyen cuoi|joke|cuoi)/.test(normalized)) {
    return "Xin lỗi, tôi chỉ hỗ trợ các câu hỏi liên quan đến nông nghiệp. Bạn có thể hỏi về kỹ thuật canh tác, chăm sóc cây trồng, chăn nuôi hoặc các chủ đề nông nghiệp khác.";
  }

  return "Xin lỗi, tôi là trợ lý AI chuyên hỗ trợ về lĩnh vực nông nghiệp nên không thể hỗ trợ các chủ đề ngoài phạm vi này. Nếu bạn cần tư vấn về trồng trọt, chăn nuôi, sâu bệnh, phân bón hoặc các vấn đề nông nghiệp khác, tôi rất sẵn lòng hỗ trợ.";
};

const formatCurrencyVnd = (value: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(value);

const orderStatusText: Record<ShopOrder["status"], string> = {
  pending: "Chờ xác nhận",
  confirmed: "Đã xác nhận",
  shipping: "Đang giao",
  delivered: "Đã giao",
  cancelled: "Đã hủy",
};

const paymentStatusText: Record<ShopOrder["paymentStatus"], string> = {
  pending: "Chưa thanh toán",
  paid: "Đã thanh toán",
  failed: "Thanh toán thất bại",
  refunded: "Đã hoàn tiền",
};

const detectChatIntent = (message: string): RagIntent => {
  const normalized = normalizeSearchText(message);
  if (!isAgricultureScopedMessage(message)) {
    return "out_of_scope";
  }
  if (/(nguon du lieu|rag|index|quyet|quet|scan|full app|toan ung dung)/.test(normalized)) {
    return "data_inventory";
  }
  if (/(module|nguoi dung|user|admin|dashboard|gio hang|yeu thich|bookmark|workspace)/.test(normalized)) {
    return "data_inventory";
  }
  if (/(danh sach|liet ke|co nhung|bao nhieu|tat ca).*(cay|cay trong|crop|du lieu|data|catalog|model)/.test(normalized)) {
    return "data_inventory";
  }
  if (/(cay|cay trong|crop).*(trong data|trong du lieu|trong catalog|model nao|ho tro nhung)/.test(normalized)) {
    return "data_inventory";
  }
  if (/\b0\d{8,10}\b/.test(normalized) || /\S+@\S+\.\S+/.test(message)) {
    return "order_status";
  }
  if (/(ma don|don hang|van chuyen|giao hang|trang thai|thanh toan|ship|tracking|tf-\d+)/.test(normalized)) {
    return "order_status";
  }
  if (/(doi tra|hoan tien|tra hang|huy don|bao hanh|khieu nai)/.test(normalized)) {
    return "return_policy";
  }
  if (/(thuoc|bvtv|hoat chat|lieu dung|lieu luong|phun|cach ly|phi|doc tinh|ridomil|confidor|kocide|pesticide)/.test(normalized)) {
    return "pesticide_lookup";
  }
  if (/(tai lieu|bai viet|thu vien|nghien cuu|pdf|vietgap|huong dan|quy trinh)/.test(normalized)) {
    return "library_lookup";
  }
  if (/(khuyen nghi|goi y|chan doan trieu chung|ho so benh|muc do tac dong|quick action)/.test(normalized)) {
    return "recommendation_lookup";
  }
  if (/(lich su chan doan|ket qua chan doan|lan chan doan|anh chan doan)/.test(normalized)) {
    return "diagnosis_history";
  }
  if (/(chu ky|sinh truong|nhiem vu|lich cham soc|growth|giai doan|tien do)/.test(normalized)) {
    return "growth_tracking";
  }
  if (/(cong dong|forum|bai dang|binh luan|thao luan|hoi dap)/.test(normalized)) {
    return "community_lookup";
  }
  if (/(san pham|mua|gia|phan bon|hat giong|cay giong|vat tu|combo|ton kho|sku|hang nao)/.test(normalized)) {
    return "product_advice";
  }
  if (/(benh|sau|nam|vi khuan|virus|dom|vang la|heo|xoan la|ri sat|suong mai|thuoc bvtv|phun)/.test(normalized)) {
    return "crop_disease";
  }
  if (/(cham soc|lich|tuoi|bon|cat tia|theo doi|sau mua|ra hoa|dau trai|thu hoach|gia the)/.test(normalized)) {
    return "care_guide";
  }
  return "general";
};

const productToRagDocument = (product: ShopProduct): RagDocument => ({
  id: `product:${product.id}`,
  title: product.name,
  source: "shop_product",
  intent: ["product_advice", "care_guide"],
  metadata: {
    productId: product.id,
    sku: product.sku,
    category: product.category,
    stock: product.stock,
    price: product.price,
  },
  text: [
    `Sản phẩm: ${product.name}.`,
    `Danh mục: ${product.category}. SKU: ${product.sku}.`,
    `Giá: ${formatCurrencyVnd(product.price)}. Tồn kho: ${product.stock}.`,
    `Nhà sản xuất: ${product.manufacturer}. Xuất xứ: ${product.origin}.`,
    `Mô tả ngắn: ${product.shortDescription}`,
    `Mô tả: ${product.description}`,
    product.benefits.length ? `Lợi ích: ${product.benefits.join(", ")}.` : "",
    Object.keys(product.specs).length
      ? `Thông số: ${Object.entries(product.specs)
          .map(([key, value]) => `${key}: ${value}`)
          .join("; ")}.`
      : "",
    product.tags.length ? `Từ khóa: ${product.tags.join(", ")}.` : "",
    `Giao hàng: ${product.shippingClass}.`,
  ].filter(Boolean).join("\n"),
});

const orderToRagDocument = (order: ShopOrder): RagDocument => ({
  id: `order:${order.id}`,
  title: `Đơn hàng ${order.code}`,
  source: "shop_order",
  intent: ["order_status"],
  metadata: {
    orderId: order.id,
    orderCode: order.code,
    customerEmail: order.customerEmail,
    status: order.status,
    paymentStatus: order.paymentStatus,
  },
  text: [
    `Đơn hàng: ${order.code}.`,
    `Khách hàng: ${order.customerName}. Email: ${order.customerEmail}. SĐT: ${order.customerPhone}.`,
    `Địa chỉ giao: ${order.shippingAddress}.`,
    `Trạng thái xử lý: ${orderStatusText[order.status]}. Trạng thái thanh toán: ${paymentStatusText[order.paymentStatus]}.`,
    `Tổng tiền: ${formatCurrencyVnd(order.total)}. Phí vận chuyển: ${formatCurrencyVnd(order.shippingFee)}. Giảm giá: ${formatCurrencyVnd(order.discount)}.`,
    `Ngày tạo: ${new Date(order.createdAt).toLocaleString("vi-VN")}.`,
    `Sản phẩm trong đơn: ${order.items
      .map((item) => `${item.productName} x${item.quantity} (${formatCurrencyVnd(item.lineTotal)})`)
      .join("; ")}.`,
    order.note ? `Ghi chú: ${order.note}.` : "",
  ].filter(Boolean).join("\n"),
});

const pesticideToRagDocument = (pesticide: Pesticide): RagDocument => ({
  id: `pesticide:${pesticide.id}`,
  title: pesticide.tradeName || pesticide.name,
  source: "pesticide",
  intent: ["pesticide_lookup", "crop_disease", "care_guide"],
  metadata: {
    pesticideId: pesticide.id,
    name: pesticide.name,
    activeIngredient: pesticide.activeIngredient || pesticide.ingredients,
    category: pesticide.category,
    toxicityLevel: pesticide.toxicityLevel ?? null,
    phi: pesticide.phi ?? null,
  },
  text: [
    `Thuốc/Vật tư BVTV: ${pesticide.tradeName || pesticide.name}.`,
    `Hoạt chất/thành phần: ${pesticide.activeIngredient || pesticide.ingredients || "Chưa rõ"}.`,
    `Nhóm: ${pesticide.category}. Loại: ${pesticide.type || "Chưa phân loại"}. Dạng: ${pesticide.formulation || "Chưa rõ"}.`,
    `Mục đích: ${pesticide.purpose}`,
    `Liều dùng: ${pesticide.dosage}. Cách dùng: ${pesticide.instructions || pesticide.usage || "Theo nhãn"}.`,
    `Cây phù hợp: ${(pesticide.suitableCrops || []).join(", ") || "Chưa khai báo"}.`,
    `Đối tượng/bệnh hại: ${(pesticide.targetDiseases || []).join(", ") || "Chưa khai báo"}.`,
    `An toàn: ${pesticide.safetyWarnings || "Đọc kỹ nhãn, mang bảo hộ và tuân thủ thời gian cách ly."}`,
    `Thời gian cách ly: ${pesticide.withdrawalPeriod || (pesticide.phi ? `${pesticide.phi} ngày` : "Theo nhãn")}.`,
    pesticide.manufacturer ? `Nhà sản xuất: ${pesticide.manufacturer}.` : "",
    pesticide.tags?.length ? `Từ khóa: ${pesticide.tags.join(", ")}.` : "",
  ].filter(Boolean).join("\n"),
});

const libraryArticleToRagDocument = (article: LibraryArticle): RagDocument => ({
  id: `library:${article.id}`,
  title: article.title,
  source: "library_article",
  intent: ["library_lookup", "care_guide", "crop_disease"],
  metadata: {
    articleId: article.id,
    category: article.category,
    type: article.type,
    crop: article.crop ?? null,
    disease: article.disease ?? null,
    sourceName: article.sourceName ?? null,
  },
  text: [
    `Tài liệu: ${article.title}.`,
    `Danh mục: ${article.category}. Loại: ${article.type}. Dạng tài liệu: ${article.docType}.`,
    article.crop ? `Cây trồng: ${article.crop}.` : "",
    article.disease ? `Bệnh/đối tượng: ${article.disease}.` : "",
    article.symptom ? `Triệu chứng: ${article.symptom}.` : "",
    `Tóm tắt: ${article.excerpt}`,
    article.contentHtml ? `Nội dung: ${article.contentHtml.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").slice(0, 2500)}` : "",
    article.tags.length ? `Từ khóa: ${article.tags.join(", ")}.` : "",
    `Nguồn: ${article.sourceName || "Terraform Flora"}. Ngày: ${article.date}.`,
  ].filter(Boolean).join("\n"),
});

const recommendationProfileToRagDocument = (profile: RecommendationDiseaseProfile): RagDocument => ({
  id: `recommendation:${profile.id}`,
  title: `${profile.cropType} - ${profile.name}`,
  source: "recommendation_profile",
  intent: ["recommendation_lookup", "crop_disease", "care_guide"],
  metadata: {
    profileId: profile.id,
    cropType: profile.cropType,
    diseaseName: profile.name,
    diseaseType: profile.type,
    confidenceBase: profile.confidenceBase,
  },
  text: [
    `Hồ sơ khuyến nghị: ${profile.name} trên ${profile.cropType}.`,
    `Loại: ${profile.type}. Mức tác động: ${profile.impactLevel}. Độ tin cậy nền: ${profile.confidenceBase}.`,
    `Mô tả: ${profile.description}`,
    `Triệu chứng: ${profile.symptoms}`,
    `Nguyên nhân: ${profile.causes}`,
    `Hành động nhanh: ${profile.quickAction}`,
    profile.immediateActions.length ? `Việc làm ngay: ${profile.immediateActions.join("; ")}.` : "",
    `Kế hoạch: ngay: ${profile.stagePlans.immediate.join("; ")}; 24h: ${profile.stagePlans.next24h.join("; ")}; theo dõi: ${profile.stagePlans.followUp.join("; ")}.`,
    profile.protocols.length
      ? `Phác đồ: ${profile.protocols
          .map((protocol) => `${protocol.severity}: ${protocol.steps.join("; ")}; thuốc: ${protocol.drugs.map((drug) => `${drug.name} ${drug.activeIngredient} ${drug.dosage}`).join(", ")}`)
          .join(" | ")}.`
      : "",
    `Ghi chú sử dụng: thời điểm ${profile.usageNotes.timing}; thời tiết ${profile.usageNotes.weather}; an toàn ${profile.usageNotes.safety}; cách ly ${profile.usageNotes.withdrawal}.`,
    profile.symptomOptions.length ? `Triệu chứng chọn nhanh: ${profile.symptomOptions.join(", ")}.` : "",
  ].filter(Boolean).join("\n"),
});

const diagnosisToRagDocument = (diagnosis: Diagnosis): RagDocument => ({
  id: `diagnosis:${diagnosis.id}`,
  title: `Lịch sử chẩn đoán ${diagnosis.cropName} - ${diagnosis.diseaseName}`,
  source: "diagnosis_history",
  intent: ["diagnosis_history", "crop_disease", "care_guide"],
  metadata: {
    diagnosisId: diagnosis.id,
    cropName: diagnosis.cropName,
    diseaseName: diagnosis.diseaseName,
    confidence: diagnosis.confidence,
    severity: diagnosis.severity,
    provider: diagnosis.provider ?? null,
  },
  text: [
    `Kết quả chẩn đoán: ${diagnosis.diseaseName} trên ${diagnosis.cropName}.`,
    `Độ tin cậy: ${diagnosis.confidence}%. Mức độ: ${diagnosis.severity}.`,
    `Triệu chứng: ${(diagnosis.symptoms || []).join("; ")}.`,
    diagnosis.pathogen ? `Tác nhân: ${diagnosis.pathogen}.` : "",
    diagnosis.pesticideType ? `Nhóm thuốc/hoạt chất gợi ý: ${diagnosis.pesticideType}.` : "",
    `Khuyến nghị: ${diagnosis.recommendation}`,
    diagnosis.treatment?.length ? `Điều trị: ${diagnosis.treatment.join("; ")}.` : "",
    diagnosis.prevention?.length ? `Phòng ngừa: ${diagnosis.prevention.join("; ")}.` : "",
    diagnosis.treatmentChecklist?.length ? `Checklist: ${diagnosis.treatmentChecklist.join("; ")}.` : "",
    `Thời gian: ${String(diagnosis.createdAt || diagnosis.timestamp || "Không rõ")}.`,
  ].filter(Boolean).join("\n"),
});

const growthCycleToRagDocument = (cycle: GrowthCycle): RagDocument => ({
  id: `growth-cycle:${cycle.id}`,
  title: `Chu kỳ sinh trưởng ${cycle.cropName}`,
  source: "growth_cycle",
  intent: ["growth_tracking", "care_guide"],
  metadata: {
    cycleId: cycle.id,
    cropName: cycle.cropName,
    status: cycle.status,
    currentStage: cycle.currentStage,
    progress: cycle.progress,
  },
  text: [
    `Chu kỳ sinh trưởng: ${cycle.cropName}.`,
    `Ngày bắt đầu: ${cycle.startDate}. Thời lượng: ${cycle.duration} ngày.`,
    `Giai đoạn hiện tại: ${cycle.currentStage}. Trạng thái: ${cycle.status}. Tiến độ: ${cycle.progress}%.`,
    cycle.notes ? `Ghi chú: ${cycle.notes}.` : "",
    `Cập nhật cuối: ${String(cycle.lastUpdate)}.`,
  ].filter(Boolean).join("\n"),
});

const growthTaskToRagDocument = (task: GrowthTask): RagDocument => ({
  id: `growth-task:${task.id}`,
  title: `Nhiệm vụ chăm sóc ${task.title}`,
  source: "growth_task",
  intent: ["growth_tracking", "care_guide"],
  metadata: {
    taskId: task.id,
    cycleId: task.cycleId,
    type: task.type,
    completed: task.completed,
  },
  text: `Nhiệm vụ chăm sóc: ${task.title}. Loại: ${task.type}. Hạn: ${task.dueDate}. Trạng thái: ${task.completed ? "Đã xong" : "Chưa xong"}.`,
});

const growthPhotoToRagDocument = (photo: GrowthPhoto): RagDocument => ({
  id: `growth-photo:${photo.id}`,
  title: `Ảnh theo dõi sinh trưởng ${photo.date}`,
  source: "growth_photo",
  intent: ["growth_tracking", "care_guide"],
  metadata: {
    photoId: photo.id,
    cycleId: photo.cycleId,
    date: photo.date,
  },
  text: `Ảnh theo dõi sinh trưởng ngày ${photo.date}. Ghi chú: ${photo.note || "Không có ghi chú"}.`,
});

const communityPostToRagDocument = (post: CommunityPost): RagDocument => ({
  id: `community-post:${post.id}`,
  title: post.title,
  source: "community_post",
  intent: ["community_lookup", "crop_disease", "care_guide"],
  metadata: {
    postId: post.id,
    category: post.category,
    authorName: post.authorName,
    voteScore: post.voteScore,
    commentCount: post.commentCount,
    isPinned: post.isPinned,
  },
  text: [
    `Bài cộng đồng: ${post.title}.`,
    `Tác giả: ${post.authorName}. Danh mục: ${post.category}.`,
    `Nội dung: ${post.body}`,
    post.tags.length ? `Từ khóa: ${post.tags.join(", ")}.` : "",
    `Điểm vote: ${post.voteScore}. Bình luận: ${post.commentCount}. Ngày tạo: ${post.createdAt}.`,
  ].filter(Boolean).join("\n"),
});

const communityCommentToRagDocument = (comment: CommunityComment): RagDocument => ({
  id: `community-comment:${comment.id}`,
  title: `Bình luận cộng đồng của ${comment.authorName}`,
  source: "community_comment",
  intent: ["community_lookup"],
  metadata: {
    commentId: comment.id,
    postId: comment.postId,
    authorName: comment.authorName,
  },
  text: `Bình luận cộng đồng bởi ${comment.authorName}: ${comment.body}. Ngày tạo: ${comment.createdAt}.`,
});

const orderSupportMessageToRagDocument = (message: NonNullable<ChatRagClientContext["orderSupportMessages"]>[number]): RagDocument => ({
  id: `order-support:${message.id}`,
  title: `Tin nhắn hỗ trợ đơn ${message.orderCode}`,
  source: "order_support_message",
  intent: ["order_status", "return_policy"],
  metadata: {
    messageId: message.id,
    orderId: message.orderId,
    orderCode: message.orderCode,
    sender: message.sender,
    customerEmail: message.customerEmail ?? null,
  },
  text: [
    `Tin nhắn hỗ trợ đơn ${message.orderCode}.`,
    `Khách: ${message.customerName}. Email: ${message.customerEmail || "Không có"}. Người gửi: ${message.sender}.`,
    `Nội dung: ${message.body}`,
    `Thời gian: ${message.createdAt}.`,
  ].join("\n"),
});

const currentUserToRagDocument = (user: AppUser): RagDocument => ({
  id: `user-profile:${user.uid}`,
  title: `Hồ sơ người dùng ${user.displayName || user.email || user.uid}`,
  source: "user_profile",
  intent: ["data_inventory", "general"],
  metadata: {
    userId: user.uid,
    email: user.email,
    role: user.role,
    isActive: user.isActive ?? true,
  },
  text: [
    `Người dùng hiện tại: ${user.displayName || "Chưa có tên"}.`,
    `Email: ${user.email || "Không có"}. Vai trò: ${user.role}. Trạng thái: ${user.isActive === false ? "Không hoạt động" : "Đang hoạt động"}.`,
  ].join("\n"),
});

const adminUserToRagDocument = (user: AdminUserProfile): RagDocument => ({
  id: `admin-user:${user.id}`,
  title: `Tài khoản hệ thống ${user.fullName || user.email || user.id}`,
  source: "admin_user",
  intent: ["data_inventory", "general"],
  metadata: {
    userId: user.id,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
  },
  text: [
    `Tài khoản hệ thống: ${user.fullName || "Chưa có tên"}.`,
    `Email: ${user.email || "Không có"}. Vai trò: ${user.role}. Trạng thái: ${user.isActive ? "Đang hoạt động" : "Đã khóa"}.`,
    `Tạo lúc: ${user.createdAt}. Cập nhật: ${user.updatedAt}.`,
  ].join("\n"),
});

const cartItemToRagDocument = (item: ShopCartItem, product?: ShopProduct): RagDocument => ({
  id: `shop-cart:${item.productId}`,
  title: `Giỏ hàng ${product?.name || item.productId}`,
  source: "shop_cart",
  intent: ["product_advice", "order_status", "data_inventory"],
  metadata: {
    productId: item.productId,
    quantity: item.quantity,
    productName: product?.name ?? null,
    price: product?.price ?? null,
  },
  text: [
    `Sản phẩm trong giỏ: ${product?.name || item.productId}.`,
    `Số lượng: ${item.quantity}.`,
    product ? `Giá hiện tại: ${formatCurrencyVnd(product.price)}. Tồn kho: ${product.stock}. SKU: ${product.sku}.` : "",
  ].filter(Boolean).join("\n"),
});

const favoriteProductToRagDocument = (productId: string, product?: ShopProduct): RagDocument => ({
  id: `shop-favorite:${productId}`,
  title: `Sản phẩm yêu thích ${product?.name || productId}`,
  source: "shop_favorite",
  intent: ["product_advice", "data_inventory"],
  metadata: {
    productId,
    productName: product?.name ?? null,
  },
  text: product
    ? `Sản phẩm yêu thích: ${product.name}. Danh mục: ${product.category}. Giá: ${formatCurrencyVnd(product.price)}. Tồn kho: ${product.stock}.`
    : `Sản phẩm yêu thích có mã ${productId}.`,
});

const libraryBookmarkToRagDocument = (articleId: string, article?: LibraryArticle): RagDocument => ({
  id: `library-bookmark:${articleId}`,
  title: `Bookmark thư viện ${article?.title || articleId}`,
  source: "library_bookmark",
  intent: ["library_lookup", "data_inventory"],
  metadata: {
    articleId,
    title: article?.title ?? null,
  },
  text: article
    ? `Tài liệu đã bookmark: ${article.title}. Danh mục: ${article.category}. Tóm tắt: ${article.excerpt}`
    : `Tài liệu đã bookmark có mã ${articleId}.`,
});

const protocolBookmarkToRagDocument = (bookmark: ProtocolBookmark): RagDocument => ({
  id: `protocol-bookmark:${bookmark.id}`,
  title: `Bookmark phác đồ ${bookmark.diseaseId}`,
  source: "protocol_bookmark",
  intent: ["recommendation_lookup", "crop_disease", "data_inventory"],
  metadata: {
    bookmarkId: bookmark.id,
    diseaseId: bookmark.diseaseId,
    userId: bookmark.userId,
  },
  text: `Người dùng đã lưu phác đồ/bệnh có mã ${bookmark.diseaseId}. Thời gian: ${String(bookmark.timestamp)}.`,
});

const chatMessageToRagDocument = (message: ChatMessage, index: number): RagDocument => ({
  id: `chat-history:${index}`,
  title: `Tin nhắn chat ${index + 1}`,
  source: "chat_history",
  intent: ["general", "data_inventory"],
  metadata: {
    role: message.role,
  },
  text: `Lịch sử chat (${message.role}): ${message.text}`,
});

const buildModuleManifestDocuments = (): RagDocument[] => [
  {
    id: "module:user-workspace",
    title: "Module Người dùng",
    source: "module_manifest",
    intent: ["data_inventory", "general"],
    text: "Module Người dùng bao gồm hồ sơ user, đơn hàng của user, lịch sử chẩn đoán, chu kỳ sinh trưởng, bookmark phác đồ, bookmark thư viện, bài viết/bình luận cộng đồng của user và tin nhắn hỗ trợ đơn.",
  },
  {
    id: "module:admin-dashboard",
    title: "Module Admin",
    source: "module_manifest",
    intent: ["data_inventory", "general"],
    text: "Module Admin bao gồm dashboard doanh thu/đơn hàng, quản lý sản phẩm, quản lý đơn, báo cáo cộng đồng, danh sách user/admin, tín hiệu chẩn đoán và dữ liệu vận hành.",
  },
  {
    id: "module:diagnosis-ai",
    title: "Module Chẩn đoán AI",
    source: "module_manifest",
    intent: ["data_inventory", "diagnosis_history", "crop_disease"],
    text: "Module Chẩn đoán AI bao gồm model nhận diện ảnh cây trồng, lịch sử chẩn đoán, catalog bệnh cây, top predictions, mức độ bệnh, triệu chứng, khuyến nghị, checklist xử lý và provider/model đã dùng.",
  },
  {
    id: "module:ai-advisor",
    title: "Module Cố vấn AI",
    source: "module_manifest",
    intent: ["data_inventory", "general"],
    text: "Module Cố vấn AI là chatbot RAG, sử dụng intent detection, full app corpus, client context, prompt ràng buộc và metadata nguồn để trả lời theo dữ liệu nội bộ.",
  },
  {
    id: "module:growth",
    title: "Module Sinh trưởng",
    source: "module_manifest",
    intent: ["data_inventory", "growth_tracking", "care_guide"],
    text: "Module Sinh trưởng bao gồm chu kỳ trồng, giai đoạn, tiến độ, nhiệm vụ chăm sóc, ảnh theo dõi và ghi chú sinh trưởng.",
  },
  {
    id: "module:recommendations",
    title: "Module Khuyến nghị",
    source: "module_manifest",
    intent: ["data_inventory", "recommendation_lookup"],
    text: "Module Khuyến nghị bao gồm hồ sơ bệnh chuyên sâu, triệu chứng, nguyên nhân, mức tác động, phác đồ, hành động nhanh, kế hoạch 24h và theo dõi.",
  },
  {
    id: "module:pesticides",
    title: "Module Thuốc BVTV",
    source: "module_manifest",
    intent: ["data_inventory", "pesticide_lookup"],
    text: "Module Thuốc BVTV bao gồm tên thuốc, hoạt chất, nhóm thuốc, liều dùng, cách dùng, cây phù hợp, đối tượng bệnh/hại, độc tính, thời gian cách ly và cảnh báo an toàn.",
  },
  {
    id: "module:community",
    title: "Module Cộng đồng",
    source: "module_manifest",
    intent: ["data_inventory", "community_lookup"],
    text: "Module Cộng đồng bao gồm bài đăng, bình luận, vote, report, thông báo và hàng đợi kiểm duyệt.",
  },
  {
    id: "module:library",
    title: "Module Thư viện",
    source: "module_manifest",
    intent: ["data_inventory", "library_lookup"],
    text: "Module Thư viện bao gồm bài viết/tài liệu, crop, disease, symptom, tags, PDF/source URL, nội dung HTML, nguồn xuất bản và bookmark tài liệu.",
  },
  {
    id: "module:shop",
    title: "Module Cửa hàng",
    source: "module_manifest",
    intent: ["data_inventory", "product_advice", "order_status"],
    text: "Module Cửa hàng bao gồm sản phẩm, tồn kho, giá, SKU, giỏ hàng, yêu thích, đơn hàng, thanh toán, vận chuyển, hỗ trợ đơn và analytics bán hàng.",
  },
];

const buildAdminDashboardDocument = (products: ShopProduct[], orders: ShopOrder[]): RagDocument => {
  const analytics = getShopAnalytics(products, orders);
  const pendingOrders = orders.filter((order) => order.status === "pending" || order.status === "confirmed").length;
  const lowStockProducts = products.filter((product) => product.stock <= 20).length;

  return {
    id: "admin-dashboard:commerce-summary",
    title: "Tổng quan dashboard admin",
    source: "admin_dashboard",
    intent: ["data_inventory", "order_status", "product_advice"],
    metadata: {
      totalProducts: products.length,
      totalOrders: analytics.totalOrders,
      totalRevenue: analytics.totalRevenue,
      pendingOrders,
      lowStockProducts,
    },
    text: [
      `Dashboard admin commerce: ${products.length} sản phẩm, ${analytics.totalOrders} đơn, doanh thu ${formatCurrencyVnd(analytics.totalRevenue)}.`,
      `Đơn cần theo dõi: ${pendingOrders}. Sản phẩm sắp hết hàng: ${lowStockProducts}.`,
      analytics.bestSeller ? `Best seller: ${analytics.bestSeller.name}, đã bán ${analytics.bestSeller.salesCount}.` : "Chưa có best seller.",
      `Nguồn dữ liệu dashboard: shop products/orders, cộng đồng/report/thông báo, chẩn đoán, tăng trưởng và user management.`,
    ].join("\n"),
  };
};

const diseaseToRagDocuments = (): RagDocument[] =>
  plantDiseaseCatalogList.flatMap((entry) => {
    const baseDiagnosis: Diagnosis = {
      id: entry.rawLabel,
      rawLabel: entry.rawLabel,
      diseaseName: entry.diseaseName,
      cropName: entry.cropName,
      confidence: 0,
      severity: entry.severityDefault,
      symptoms: [],
      treatment: [],
      recommendation: "",
      timestamp: new Date(0).toISOString(),
      imageUrl: "",
    };
    const protocol = getCatalogTreatmentProtocol(baseDiagnosis);
    const diseaseDoc: RagDocument = {
      id: `disease:${entry.rawLabel}`,
      title: `${entry.cropName} - ${entry.diseaseName}`,
      source: "plant_disease",
      intent: ["crop_disease", "care_guide"],
      metadata: {
        cropName: entry.cropName,
        diseaseName: entry.diseaseName,
        diseaseKey: entry.diseaseKey,
        healthy: Boolean(entry.healthy),
      },
      text: [
        `Cây trồng: ${entry.cropName}.`,
        `Bệnh/tình trạng: ${entry.diseaseName}.`,
        `Tác nhân: ${entry.pathogen}. Mức độ mặc định: ${entry.severityDefault}.`,
        `Tóm tắt: ${entry.summary}`,
      ].join("\n"),
    };

    if (!protocol) return [diseaseDoc];

    const protocolDoc: RagDocument = {
      id: `protocol:${entry.rawLabel}`,
      title: `Phác đồ xử lý ${entry.cropName} - ${entry.diseaseName}`,
      source: "treatment_protocol",
      intent: ["crop_disease", "care_guide"],
      metadata: {
        cropName: entry.cropName,
        diseaseName: entry.diseaseName,
        diseaseKey: entry.diseaseKey,
      },
      text: [
        `Phác đồ nội bộ cho ${entry.cropName} - ${entry.diseaseName}.`,
        `Làm ngay: ${protocol.immediate.join("; ")}.`,
        `Trong 24 giờ: ${protocol.next24h.join("; ")}.`,
        `Theo dõi: ${protocol.followUp.join("; ")}.`,
        `Các bước: ${protocol.steps.join("; ")}.`,
        protocol.products.length
          ? `Sản phẩm/nhóm hoạt chất gợi ý: ${protocol.products
              .map((item) => `${item.name} (${item.activeIngredient}, liều ${item.dosage})`)
              .join("; ")}.`
          : "",
        `An toàn: ${protocol.safety.join("; ")}.`,
      ].filter(Boolean).join("\n"),
    };

    return [diseaseDoc, protocolDoc];
  });

const buildDataInventoryDocuments = (): RagDocument[] => {
  const catalogCrops = Array.from(new Set(plantDiseaseCatalogList.map((entry) => entry.cropName))).sort((left, right) =>
    left.localeCompare(right, "vi")
  );
  const modelCrops = Object.values(PLANT_MODEL_REGISTRY)
    .map((entry) => entry.cropName)
    .filter((cropName, index, list) => list.indexOf(cropName) === index)
    .sort((left, right) => left.localeCompare(right, "vi"));
  const diseasesByCrop = plantDiseaseCatalogList.reduce<Record<string, string[]>>((result, entry) => {
    if (!result[entry.cropName]) result[entry.cropName] = [];
    if (!result[entry.cropName].includes(entry.diseaseName)) {
      result[entry.cropName].push(entry.diseaseName);
    }
    return result;
  }, {});

  Object.values(diseasesByCrop).forEach((diseases) => diseases.sort((left, right) => left.localeCompare(right, "vi")));

  return [
    {
      id: "inventory:plant-disease-crops",
      title: "Danh sách cây trong catalog bệnh cây",
      source: "data_inventory",
      intent: ["data_inventory", "crop_disease"],
      metadata: {
        cropCount: catalogCrops.length,
        entryCount: plantDiseaseCatalogList.length,
      },
      text: [
        `Catalog bệnh cây hiện có ${catalogCrops.length} nhóm cây/cây trồng: ${catalogCrops.join(", ")}.`,
        "Bệnh/tình trạng theo từng cây:",
        ...catalogCrops.map((cropName) => `- ${cropName}: ${(diseasesByCrop[cropName] || []).join(", ")}.`),
      ].join("\n"),
    },
    {
      id: "inventory:diagnosis-model-crops",
      title: "Danh sách cây có model chẩn đoán ảnh",
      source: "data_inventory",
      intent: ["data_inventory", "crop_disease"],
      metadata: {
        modelCropCount: modelCrops.length,
      },
      text: [
        `Các cây có model chẩn đoán ảnh trong hệ thống: ${modelCrops.join(", ")}.`,
        `Chi tiết model: ${Object.values(PLANT_MODEL_REGISTRY)
          .map((entry) => `${entry.cropName} (${entry.id}, runtime ${entry.runtime})`)
          .join("; ")}.`,
      ].join("\n"),
    },
  ];
};

const buildAppInventoryDocument = (documents: RagDocument[]): RagDocument => {
  const sourceCounts = documents.reduce<Record<string, number>>((result, document) => {
    result[document.source] = (result[document.source] || 0) + 1;
    return result;
  }, {});
  const cropNames = Array.from(
    new Set(
      documents
        .flatMap((document) => [
          document.metadata?.cropName,
          document.metadata?.crop,
          document.metadata?.cropType,
          document.metadata?.category === "Cây giống" ? document.title : null,
        ])
        .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    )
  ).sort((left, right) => left.localeCompare(right, "vi"));

  return {
    id: "inventory:full-app-rag",
    title: "Bản đồ dữ liệu RAG toàn ứng dụng",
    source: "data_inventory",
    intent: ["data_inventory", "general"],
    metadata: {
      documentCount: documents.length,
      sourceCount: Object.keys(sourceCounts).length,
    },
    text: [
      `RAG index toàn ứng dụng hiện có ${documents.length} tài liệu từ ${Object.keys(sourceCounts).length} nguồn.`,
      `Nguồn dữ liệu và số lượng: ${Object.entries(sourceCounts)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([source, count]) => `${source}: ${count}`)
        .join("; ")}.`,
      cropNames.length ? `Cây/cây trồng xuất hiện trong index: ${cropNames.join(", ")}.` : "",
      "Module giao diện được bao phủ: Người dùng, Admin, Chẩn đoán AI, Cố vấn AI, Sinh trưởng, Khuyến nghị, Thuốc BVTV, Cộng đồng, Thư viện, Cửa hàng.",
      "Các nhóm nguồn server/public: sản phẩm shop, đơn hàng, thuốc BVTV, thư viện bài viết, catalog bệnh cây, phác đồ xử lý, hồ sơ khuyến nghị và hướng dẫn chăm sóc.",
      "Các nhóm nguồn local/user sẽ được thêm vào index khi frontend gửi context: lịch sử chẩn đoán, chu kỳ sinh trưởng, nhiệm vụ chăm sóc, ảnh theo dõi, cộng đồng, bình luận và tin nhắn hỗ trợ đơn.",
    ].filter(Boolean).join("\n"),
  };
};

const careGuideDocuments: RagDocument[] = [
  {
    id: "guide:care-after-rain",
    title: "Chăm sóc cây sau mưa kéo dài",
    source: "care_guide",
    intent: ["care_guide", "crop_disease"],
    text: [
      "Sau mưa kéo dài cần ưu tiên thoát nước, giảm ẩm tán và kiểm tra nấm bệnh.",
      "Việc nên làm: khơi rãnh thoát nước, ngưng tưới phun, tỉa lá sát đất bị bệnh, kiểm tra mặt dưới lá vào sáng sớm.",
      "Theo dõi 48-72 giờ với bệnh lan nhanh như sương mai; không phun thuốc khi lá còn ướt hoặc trời sắp mưa.",
    ].join("\n"),
  },
  {
    id: "guide:spray-safety",
    title: "Nguyên tắc an toàn khi dùng thuốc BVTV",
    source: "care_guide",
    intent: ["crop_disease", "care_guide"],
    text: [
      "Khi dùng thuốc BVTV phải đọc nhãn, đúng cây trồng, đúng đối tượng, đúng liều và đúng thời gian cách ly.",
      "Cần mang găng tay, khẩu trang, kính, áo dài tay; không pha quá liều và không phun ngược chiều gió.",
      "Ưu tiên biện pháp canh tác, vệ sinh đồng ruộng và sinh học trước khi can thiệp hóa học nếu mật độ bệnh/hại còn thấp.",
    ].join("\n"),
  },
  {
    id: "guide:daily-checklist",
    title: "Checklist theo dõi vườn hằng ngày",
    source: "care_guide",
    intent: ["care_guide"],
    text: [
      "Theo dõi hằng ngày gồm: ẩm đất, màu lá non, lá già, mặt dưới lá, điểm héo cục bộ, dấu phân/côn trùng và tình trạng thoát nước.",
      "Ghi lại thời tiết 3 ngày gần nhất, lần tưới, lần bón phân và thuốc đã sử dụng để đối chiếu khi cây có triệu chứng.",
      "Nếu có triệu chứng mới, khoanh vùng cây/lô bị nặng và chụp ảnh rõ trước khi xử lý.",
    ].join("\n"),
  },
  {
    id: "policy:return-order",
    title: "Chính sách hỗ trợ đổi trả đơn hàng",
    source: "business_policy",
    intent: ["return_policy", "order_status"],
    text: [
      "Hỗ trợ đổi trả khi sản phẩm giao sai, hư hỏng do vận chuyển hoặc không đúng mô tả trong thông tin đơn hàng.",
      "Người mua cần cung cấp mã đơn, ảnh sản phẩm, tình trạng bao bì và thời điểm nhận hàng.",
      "Với cây giống/vật tư nông nghiệp, hệ thống cần kiểm tra điều kiện bảo quản sau nhận hàng trước khi xác nhận đổi trả.",
    ].join("\n"),
  },
];

const buildClientContextDocuments = (clientContext?: ChatRagClientContext): RagDocument[] => [
  ...(clientContext?.currentUser ? [currentUserToRagDocument(clientContext.currentUser)] : []),
  ...(Array.isArray(clientContext?.adminUsers) ? clientContext.adminUsers.map(adminUserToRagDocument) : []),
  ...(Array.isArray(clientContext?.orders) ? clientContext.orders.map(orderToRagDocument) : []),
  ...(Array.isArray(clientContext?.products) ? clientContext.products.map(productToRagDocument) : []),
  ...(Array.isArray(clientContext?.pesticides) ? clientContext.pesticides.map(pesticideToRagDocument) : []),
  ...(Array.isArray(clientContext?.libraryArticles) ? clientContext.libraryArticles.map(libraryArticleToRagDocument) : []),
  ...(Array.isArray(clientContext?.recommendationProfiles) ? clientContext.recommendationProfiles.map(recommendationProfileToRagDocument) : []),
  ...(Array.isArray(clientContext?.diagnoses) ? clientContext.diagnoses.map(diagnosisToRagDocument) : []),
  ...(Array.isArray(clientContext?.growthCycles) ? clientContext.growthCycles.map(growthCycleToRagDocument) : []),
  ...(Array.isArray(clientContext?.growthTasks) ? clientContext.growthTasks.map(growthTaskToRagDocument) : []),
  ...(Array.isArray(clientContext?.growthPhotos) ? clientContext.growthPhotos.map(growthPhotoToRagDocument) : []),
  ...(Array.isArray(clientContext?.communityPosts) ? clientContext.communityPosts.map(communityPostToRagDocument) : []),
  ...(Array.isArray(clientContext?.communityComments) ? clientContext.communityComments.map(communityCommentToRagDocument) : []),
  ...(Array.isArray(clientContext?.orderSupportMessages)
    ? clientContext.orderSupportMessages.map(orderSupportMessageToRagDocument)
    : []),
  ...(Array.isArray(clientContext?.cartItems)
    ? clientContext.cartItems.map((item) => cartItemToRagDocument(item, clientContext.products?.find((product) => product.id === item.productId)))
    : []),
  ...(Array.isArray(clientContext?.favoriteProductIds)
    ? clientContext.favoriteProductIds.map((productId) =>
        favoriteProductToRagDocument(productId, clientContext.products?.find((product) => product.id === productId))
      )
    : []),
  ...(Array.isArray(clientContext?.libraryBookmarkIds)
    ? clientContext.libraryBookmarkIds.map((articleId) =>
        libraryBookmarkToRagDocument(articleId, clientContext.libraryArticles?.find((article) => article.id === articleId))
      )
    : []),
  ...(Array.isArray(clientContext?.protocolBookmarks) ? clientContext.protocolBookmarks.map(protocolBookmarkToRagDocument) : []),
  ...(Array.isArray(clientContext?.chatMessages)
    ? clientContext.chatMessages.slice(-16).map((message, index) => chatMessageToRagDocument(message, index))
    : []),
];

const RAG_PUBLIC_CORPUS_TTL_MS = 3 * 60 * 1000;
let ragPublicCorpusCache: { expiresAt: number; documents: RagDocument[] } | null = null;
let ragPublicCorpusPromise: Promise<RagDocument[]> | null = null;

const buildPublicRagCorpus = async () => {
  const [shop, pesticideLibrary, library, recommendationProfiles, adminUsers] = await Promise.all([
    getShopBootstrap(),
    getPesticideLibrary().catch(() => ({ pesticides: [] as Pesticide[], source: "local" as const })),
    loadLibraryArticles().catch(() => ({ articles: [] as LibraryArticle[], source: "local" as const })),
    getRecommendationProfiles().catch(() => ({ data: [] as RecommendationDiseaseProfile[], source: "fallback" as const })),
    listAdminUsers().catch(() => [] as AdminUserProfile[]),
  ]);
  const corpusWithoutInventory = [
    ...buildModuleManifestDocuments(),
    buildAdminDashboardDocument(shop.products, shop.orders),
    ...adminUsers.map(adminUserToRagDocument),
    ...shop.products.map(productToRagDocument),
    ...shop.orders.map(orderToRagDocument),
    ...pesticideLibrary.pesticides.map(pesticideToRagDocument),
    ...library.articles.map(libraryArticleToRagDocument),
    ...recommendationProfiles.data.map(recommendationProfileToRagDocument),
    ...buildDataInventoryDocuments(),
    ...diseaseToRagDocuments(),
    ...careGuideDocuments,
  ];

  const deduped = corpusWithoutInventory.filter(
    (document, index, documents) => documents.findIndex((item) => item.id === document.id) === index
  );

  return [buildAppInventoryDocument(deduped), ...deduped];
};

const getPublicRagCorpus = async () => {
  const now = Date.now();
  if (ragPublicCorpusCache && ragPublicCorpusCache.expiresAt > now) {
    return ragPublicCorpusCache.documents;
  }

  if (!ragPublicCorpusPromise) {
    ragPublicCorpusPromise = buildPublicRagCorpus()
      .then((documents) => {
        ragPublicCorpusCache = { documents, expiresAt: Date.now() + RAG_PUBLIC_CORPUS_TTL_MS };
        return documents;
      })
      .finally(() => {
        ragPublicCorpusPromise = null;
      });
  }

  return ragPublicCorpusPromise;
};

const buildRagCorpus = async (clientContext?: ChatRagClientContext) => {
  const [publicCorpus, clientDocuments] = await Promise.all([
    getPublicRagCorpus(),
    Promise.resolve(buildClientContextDocuments(clientContext)),
  ]);

  return [...clientDocuments, ...publicCorpus].filter(
    (document, index, documents) => documents.findIndex((item) => item.id === document.id) === index
  );
};

const ragDocumentIndexCache = new WeakMap<RagDocument, IndexedRagDocument>();

const getRagDocumentSearchText = (document: RagDocument) =>
  normalizeSearchText(
    [
      document.title,
      document.source,
      document.intent.join(" "),
      document.text,
      document.metadata
        ? Object.entries(document.metadata)
            .map(([key, value]) => `${key} ${String(value ?? "")}`)
            .join(" ")
        : "",
    ].join("\n")
  );

const getRagDocumentIndex = (document: RagDocument): IndexedRagDocument => {
  const cached = ragDocumentIndexCache.get(document);
  if (cached) return cached;

  const searchText = getRagDocumentSearchText(document);
  const tokens = tokenizeForRetrieval(searchText);
  const vector = new Map<string, number>();
  tokens.forEach((token) => vector.set(token, (vector.get(token) || 0) + 1));
  const norm = Math.sqrt(Array.from(vector.values()).reduce((sum, count) => sum + count * count, 0));
  const indexed = { searchText, tokens, vector, norm };
  ragDocumentIndexCache.set(document, indexed);
  return indexed;
};


const getRagSourceBoost = (document: RagDocument, intent: RagIntent) =>
  intent === "order_status" && document.source === "shop_order"
    ? 10
    : intent === "product_advice" && document.source === "shop_product"
      ? 10
      : intent === "crop_disease" && (document.source === "plant_disease" || document.source === "treatment_protocol")
      ? 8
      : intent === "care_guide" && document.source === "care_guide"
        ? 8
        : intent === "data_inventory" && document.source === "data_inventory"
          ? 20
          : intent === "pesticide_lookup" && document.source === "pesticide"
            ? 12
            : intent === "library_lookup" && document.source === "library_article"
              ? 12
              : intent === "recommendation_lookup" && document.source === "recommendation_profile"
                ? 12
                : intent === "diagnosis_history" && document.source === "diagnosis_history"
                  ? 12
                  : intent === "growth_tracking" && ["growth_cycle", "growth_task", "growth_photo"].includes(document.source)
                    ? 12
                    : intent === "community_lookup" && ["community_post", "community_comment"].includes(document.source)
                      ? 12
                      : intent === "data_inventory" &&
                          [
                            "module_manifest",
                            "admin_dashboard",
                            "user_profile",
                            "admin_user",
                            "shop_cart",
                            "shop_favorite",
                            "library_bookmark",
                            "protocol_bookmark",
                            "chat_history",
                          ].includes(document.source)
                        ? 10
          : 0;

const scoreKeywordMatch = (document: RagDocument, queryTokens: string[], normalizedQuery: string) => {
  const { searchText: haystack, tokens } = getRagDocumentIndex(document);
  const haystackTokens = new Set(tokens);
  const tokenScore = queryTokens.reduce((score, token) => {
    if (haystackTokens.has(token)) return score + 4;
    if (haystack.includes(token)) return score + 1;
    return score;
  }, 0);
  const phraseScore = normalizedQuery.length >= 4 && haystack.includes(normalizedQuery) ? 12 : 0;

  return tokenScore + phraseScore;
};

const scoreVectorMatch = (document: RagDocument, queryTokens: string[]) => {
  if (!queryTokens.length) return 0;
  const documentIndex = getRagDocumentIndex(document);
  if (!documentIndex.tokens.length) return 0;

  const queryVector = new Map<string, number>();

  queryTokens.forEach((token) => queryVector.set(token, (queryVector.get(token) || 0) + 1));

  let dot = 0;
  queryVector.forEach((count, token) => {
    dot += count * (documentIndex.vector.get(token) || 0);
  });

  const queryNorm = Math.sqrt(Array.from(queryVector.values()).reduce((sum, count) => sum + count * count, 0));

  return queryNorm && documentIndex.norm ? dot / (queryNorm * documentIndex.norm) : 0;
};

const rerankRagDocument = (
  document: RagDocument,
  queryTokens: string[],
  normalizedQuery: string,
  intent: RagIntent
): RetrievedRagDocument => {
  const keywordScore = scoreKeywordMatch(document, queryTokens, normalizedQuery);
  const vectorScore = scoreVectorMatch(document, queryTokens);
  const intentScore = document.intent.includes(intent) ? 8 : document.intent.includes("general") ? 2 : 0;
  const sourceScore = getRagSourceBoost(document, intent);
  const rerankScore = keywordScore + vectorScore * 45 + intentScore + sourceScore;

  return {
    ...document,
    keywordScore,
    vectorScore: Number(vectorScore.toFixed(4)),
    rerankScore: Number(rerankScore.toFixed(2)),
    score: Number(rerankScore.toFixed(2)),
  };
};

const scoreRagDocument = (document: RagDocument, queryTokens: string[], normalizedQuery: string, intent: RagIntent) =>
  rerankRagDocument(document, queryTokens, normalizedQuery, intent).score;

const retrieveRagDocuments = (message: string, documents: RagDocument[], intent: RagIntent): RetrievedRagDocument[] => {
  const rewrittenQuery = rewriteRagQuery(message, intent);
  const normalizedQuery = rewrittenQuery.rewritten;
  const queryTokens = rewrittenQuery.tokens;
  const fullCorpusRequested = isFullCorpusRequest(message);
  const orderCode = normalizedQuery.match(/\btf-\d{4}-\d+\b/)?.[0];
  const phoneMatches = normalizedQuery.match(/\b0\d{8,10}\b/g) ?? [];
  const emailMatches = message.toLowerCase().match(/\S+@\S+\.\S+/g) ?? [];
  const hasOrderIdentifier = Boolean(orderCode) || phoneMatches.length > 0 || emailMatches.length > 0;
  const searchableDocuments =
    fullCorpusRequested || intent === "data_inventory"
      ? documents
      : intent === "order_status"
        ? documents.filter((document) => {
          if (document.source !== "shop_order" && document.source !== "business_policy") return false;
          if (document.source !== "shop_order") return true;
          if (!hasOrderIdentifier) return false;
          const orderText = normalizeSearchText(`${document.title}\n${document.text}`);
          if (orderCode) return orderText.includes(orderCode);
          if (phoneMatches.length > 0) return phoneMatches.some((phone) => orderText.includes(phone));
          if (emailMatches.length > 0) return emailMatches.some((email) => orderText.includes(email));
          return scoreRagDocument(document, queryTokens, normalizedQuery, intent) > 18;
        })
        : documents;

  const keywordCandidates = searchableDocuments
    .map((document) => ({ document, keywordScore: scoreKeywordMatch(document, queryTokens, normalizedQuery) }))
    .filter((item) => item.keywordScore > 0)
    .sort((left, right) => right.keywordScore - left.keywordScore)
    .slice(0, fullCorpusRequested ? 80 : 32)
    .map((item) => item.document);

  const vectorCandidates = searchableDocuments
    .map((document) => ({ document, vectorScore: scoreVectorMatch(document, queryTokens) }))
    .filter((item) => item.vectorScore >= (fullCorpusRequested || intent === "data_inventory" ? 0.01 : 0.035))
    .sort((left, right) => right.vectorScore - left.vectorScore)
    .slice(0, fullCorpusRequested ? 80 : 32)
    .map((item) => item.document);

  const candidates = [...keywordCandidates, ...vectorCandidates].filter(
    (document, index, list) => list.findIndex((item) => item.id === document.id) === index
  );

  const ranked = candidates
    .map((document) => rerankRagDocument(document, queryTokens, normalizedQuery, intent))
    .filter((document) => document.score > 0)
    .sort((left, right) => right.score - left.score);

  if (fullCorpusRequested) {
    const sourceRepresentatives = Array.from(
      searchableDocuments
        .reduce<Map<RagDocument["source"], RagDocument>>((result, document) => {
          if (!result.has(document.source)) result.set(document.source, document);
          return result;
        }, new Map())
        .values()
    ).map((document) => ({
      ...rerankRagDocument(document, queryTokens, normalizedQuery, intent),
      score: Math.max(1, scoreRagDocument(document, queryTokens, normalizedQuery, intent)),
    } satisfies RetrievedRagDocument));

    const representativeIds = new Set(sourceRepresentatives.map((document) => document.id));
    const remainingRanked = ranked.filter((document) => !representativeIds.has(document.id));

    return [...sourceRepresentatives.sort((left, right) => right.score - left.score), ...remainingRanked]
      .filter((document, index, list) => list.findIndex((item) => item.id === document.id) === index)
      .slice(0, 56);
  }

  const minimumDocsByIntent = searchableDocuments
    .filter((document) => document.intent.includes(intent))
    .slice(0, intent === "general" ? 2 : 4)
    .map((document) => rerankRagDocument(document, queryTokens, normalizedQuery, intent));

  const merged = [...ranked, ...minimumDocsByIntent].filter(
    (document, index, list) => list.findIndex((item) => item.id === document.id) === index
  );

  const limitByIntent: Partial<Record<RagIntent, number>> = {
    data_inventory: 18,
    order_status: 8,
    pesticide_lookup: 10,
    product_advice: 10,
    library_lookup: 12,
    crop_disease: 12,
    care_guide: 12,
    recommendation_lookup: 10,
    diagnosis_history: 10,
    growth_tracking: 10,
    community_lookup: 10,
    general: 8,
  };

  return merged.slice(0, limitByIntent[intent] ?? 4);
};

const isStrongRagMatch = (intent: RagIntent, documents: RetrievedRagDocument[]) => {
  if (!documents.length) return false;
  const bestScore = documents[0]?.score ?? 0;
  const hasSource = (...sources: RagDocument["source"][]) =>
    documents.some((document) => sources.includes(document.source));

  if (intent === "data_inventory") return bestScore >= 20 && hasSource("data_inventory", "module_manifest", "admin_dashboard");
  if (intent === "order_status") return bestScore >= 20 && hasSource("shop_order", "business_policy", "order_support_message");
  if (intent === "product_advice") return bestScore >= 16 && hasSource("shop_product", "shop_cart", "shop_favorite", "shop_order");
  if (intent === "pesticide_lookup") return bestScore >= 18 && hasSource("pesticide");
  if (intent === "library_lookup") return bestScore >= 18 && hasSource("library_article");
  if (intent === "recommendation_lookup") return bestScore >= 18 && hasSource("recommendation_profile");
  if (intent === "diagnosis_history") return bestScore >= 18 && hasSource("diagnosis_history");
  if (intent === "growth_tracking") return bestScore >= 18 && hasSource("growth_cycle", "growth_task", "growth_photo");
  if (intent === "community_lookup") return bestScore >= 18 && hasSource("community_post", "community_comment");
  if (intent === "crop_disease") return bestScore >= 18 && hasSource("plant_disease", "treatment_protocol", "care_guide", "library_article", "recommendation_profile");
  if (intent === "care_guide") return bestScore >= 18 && hasSource("care_guide", "treatment_protocol", "library_article", "recommendation_profile");
  return bestScore >= 24;
};

const compactRagText = (text: string, maxLength = 900) => {
  const compacted = text.replace(/\s+/g, " ").trim();
  return compacted.length > maxLength ? `${compacted.slice(0, maxLength).trim()}...` : compacted;
};

const getRagPromptBudget = (intent: RagIntent, fullCorpusRequested: boolean) => {
  if (fullCorpusRequested) return { documentLimit: 28, textLimit: 760 };
  if (intent === "order_status") return { documentLimit: 4, textLimit: 620 };
  if (intent === "product_advice" || intent === "pesticide_lookup") return { documentLimit: 5, textLimit: 620 };
  if (intent === "data_inventory") return { documentLimit: 8, textLimit: 680 };
  return { documentLimit: 6, textLimit: 620 };
};

const buildRagContext = async (message: string, clientContext?: ChatRagClientContext): Promise<RagResult> => {
  const intent = detectChatIntent(message);
  const rewrittenQuery = rewriteRagQuery(message, intent);
  const fullCorpusRequested = isFullCorpusRequest(message);
  const corpus = await buildRagCorpus(clientContext);
  const retrievedDocuments = retrieveRagDocuments(message, corpus, intent);
  const enoughData = fullCorpusRequested || isStrongRagMatch(intent, retrievedDocuments);
  const documents = enoughData ? retrievedDocuments : [];
  const promptBudget = getRagPromptBudget(intent, fullCorpusRequested);
  const promptDocuments = documents.slice(0, promptBudget.documentLimit);
  const contextText = documents.length
    ? promptDocuments
        .map(
          (document, index) =>
            `[${index + 1}] ${document.title}\nNguồn: ${document.source}. Điểm rerank: ${document.score}. Keyword: ${document.keywordScore ?? 0}. Vector: ${document.vectorScore ?? 0}.\n${compactRagText(document.text, promptBudget.textLimit)}`
        )
        .join("\n\n")
    : "Không tìm thấy tài liệu nội bộ phù hợp.";

  return {
    intent,
    documents,
    contextText,
    normalizedQuery: rewrittenQuery.normalized,
    rewrittenQuery: rewrittenQuery.rewritten,
    corpusCount: corpus.length,
    enoughData,
  };
};

const buildGeneralModelPrompt = (message: string, rag: RagResult) => [
  "NHIỆM VỤ CỐ VẤN AI:",
  "Pipeline RAG đã chạy: normalize/rewrite query → hybrid search keyword + vector → rerank → kiểm tra đủ dữ liệu.",
  "Kết luận pipeline: chưa đủ dữ liệu nội bộ mạnh cho câu hỏi này. Hãy trả lời bằng kiến thức chung của model, rõ ràng và thực tế.",
  "Nếu câu hỏi hỏi dữ liệu riêng của hệ thống như đơn hàng, tài khoản, giỏ hàng, giá, tồn kho, sản phẩm cụ thể, admin, lịch sử chẩn đoán hoặc dữ liệu cộng đồng, không được bịa. Hãy nói cần mã định danh hoặc dữ liệu nội bộ phù hợp.",
  "Nếu câu hỏi là kỹ thuật canh tác, sâu bệnh, chăm sóc cây hoặc giải thích khái niệm chung, có thể trả lời như cố vấn nông nghiệp tổng quát và nhắc người dùng kiểm tra thực địa.",
  "Không tự nhận là đã tra được dữ liệu nội bộ nếu phần RAG báo không có tài liệu phù hợp.",
  "",
  `Intent được phân loại: ${rag.intent}`,
  `Query sau chuẩn hóa: ${rag.normalizedQuery}`,
  `Query sau rewrite: ${rag.rewrittenQuery}`,
  `Số tài liệu trong corpus: ${rag.corpusCount}`,
  "",
  "TRẠNG THÁI RAG:",
  rag.contextText,
  "",
  "CÂU HỎI NGƯỜI DÙNG:",
  message.trim(),
].join("\n");

const buildRagAugmentedPrompt = (message: string, rag: RagResult) => [
  "NHIỆM VỤ RAG NỘI BỘ:",
  "Pipeline đã chạy: normalize/rewrite query → keyword search → vector search → rerank kết quả → kiểm tra đủ dữ liệu.",
  "Kết luận pipeline: đủ dữ liệu nội bộ để trả lời. Phải dùng dữ liệu RAG bên dưới làm nguồn chính.",
  "Bạn phải trả lời dựa trên dữ liệu nội bộ được truy xuất bên dưới. API/model chỉ dùng để diễn đạt, tổng hợp và suy luận trong phạm vi dữ liệu.",
  "Nếu dữ liệu nội bộ không đủ để kết luận, hãy nói rõ thiếu dữ liệu nào và đề xuất bước kiểm tra tiếp theo. Không bịa mã đơn, trạng thái đơn, giá, tồn kho, liều lượng hoặc bệnh không có trong ngữ cảnh.",
  "Với đơn hàng: chỉ dùng trạng thái, thanh toán, phương thức thanh toán, sản phẩm, khách hàng và ngày tạo trong ngữ cảnh. Không tự suy rằng khách phải thanh toán thêm nếu ngữ cảnh chỉ ghi thanh toán pending/COD. Nếu không thấy mã đơn phù hợp, yêu cầu người dùng cung cấp mã đơn/email/SĐT.",
  "Với sản phẩm: chỉ nêu giá, tồn kho, SKU, thông số và lợi ích có trong ngữ cảnh.",
  "Với sâu bệnh/chăm sóc: ưu tiên phác đồ nội bộ, nhắc kiểm tra thực địa và an toàn thuốc BVTV khi có xử lý rủi ro.",
  "Với câu hỏi danh sách/thống kê dữ liệu: chỉ trả lời theo tài liệu source=data_inventory. Phân biệt rõ catalog bệnh cây và cây có model chẩn đoán ảnh nếu câu hỏi có thể hiểu theo cả hai.",
  "Với thuốc BVTV: chỉ nêu hoạt chất, liều, cây phù hợp, đối tượng, độc tính và thời gian cách ly nếu có trong source=pesticide; luôn nhắc đọc nhãn.",
  "Với thư viện/tài liệu: trả lời theo source=library_article và nêu tên bài liên quan nếu phù hợp.",
  "Với dữ liệu người dùng như lịch sử chẩn đoán, chu kỳ sinh trưởng, cộng đồng hoặc tin nhắn hỗ trợ: chỉ dùng dữ liệu trong ngữ cảnh, không suy ra dữ liệu riêng tư không được cung cấp.",
  "",
  `Intent được phân loại: ${rag.intent}`,
  `Query sau chuẩn hóa: ${rag.normalizedQuery}`,
  `Query sau rewrite: ${rag.rewrittenQuery}`,
  `Số tài liệu trong corpus: ${rag.corpusCount}`,
  "",
  "DỮ LIỆU NỘI BỘ TRUY XUẤT:",
  rag.contextText,
  "",
  "CÂU HỎI NGƯỜI DÙNG:",
  message.trim(),
].join("\n");

const buildRagOnlyFallbackAnswer = (rag: RagResult) => {
  if (!rag.documents.length) return "";

  if (rag.intent === "data_inventory") {
    return [
      "Dựa trên RAG index nội bộ, hệ thống tìm được các nguồn dữ liệu sau:",
      "",
      "Dữ liệu truy xuất được:",
      ...rag.documents.slice(0, 8).map((document) => `- ${document.title} (${document.source}): ${compactRagText(document.text, 700)}`),
    ].join("\n");
  }

  if (rag.intent === "order_status") {
    return [
      "Dựa trên dữ liệu đơn hàng/hỗ trợ đã truy xuất, hệ thống tìm được:",
      "",
      ...rag.documents.slice(0, 4).map((document) => `- ${document.title}: ${compactRagText(document.text, 700)}`),
    ].join("\n");
  }

  if (rag.intent === "pesticide_lookup" || rag.intent === "product_advice" || rag.intent === "library_lookup") {
    return [
      "Dựa trên nguồn RAG phù hợp nhất, hệ thống tìm được:",
      "",
      ...rag.documents.slice(0, 5).map((document) => `- ${document.title} (${document.source}): ${compactRagText(document.text, 700)}`),
    ].join("\n");
  }

  return [
    "Dựa trên dữ liệu RAG đã truy xuất, hệ thống tìm được:",
    "",
    ...rag.documents.slice(0, 5).map((document) => `- ${document.title} (${document.source}): ${compactRagText(document.text, 700)}`),
  ].join("\n");
};

const diagnosisInstruction = `Bạn là một chuyên gia nông nghiệp AI cấp cao. Hãy phân tích hình ảnh cây trồng này một cách chi tiết và:
1. Xác định tên bệnh hoặc tình trạng cây.
2. Xác định loại cây trồng nếu có thể.
3. Đánh giá độ tin cậy theo thang 0-100.
4. Phân loại mức độ: Nhẹ, Trung bình hoặc Nặng.
5. Liệt kê triệu chứng dưới dạng mảng chuỗi.
6. Đề xuất các bước xử lý dưới dạng mảng chuỗi.
7. Viết tóm tắt khuyến nghị điều trị ngắn gọn.
8. Trả thêm pathogen, pesticideType, riskLevel, spreadSpeed, prevention, treatmentChecklist, confidenceBreakdown nếu suy ra được.

Chỉ trả về JSON hợp lệ theo cấu trúc:
{
  "diseaseName": "Tên bệnh hoặc tình trạng",
  "cropName": "Tên cây trồng",
  "confidence": 95,
  "severity": "Trung bình",
  "symptoms": ["..."],
  "treatment": ["..."],
  "recommendation": "Tóm tắt điều trị",
  "pesticideType": "Hoạt chất hoặc nhóm thuốc phù hợp",
  "pathogen": "Tác nhân",
  "riskLevel": 3,
  "spreadSpeed": "Chậm|Trung bình|Nhanh",
  "prevention": ["..."],
  "treatmentChecklist": ["..."],
  "confidenceBreakdown": { "texture": 0.9, "color": 0.85, "shape": 0.88 }
}`;

const getProvider = (): Provider => {
  if (DEFAULT_PROVIDER === "openai") return "openai";
  if (DEFAULT_PROVIDER === "local") return "local";
  return "gemini";
};

const hasOpenAIKey = () => Boolean(process.env.OPENAI_API_KEY?.trim());
const hasGroqKey = () => Boolean(process.env.GROQ_API_KEY?.trim());
const hasGeminiKey = () => Boolean(process.env.GEMINI_API_KEY?.trim());
const hasOpenRouterKey = () => Boolean(process.env.OPENROUTER_API_KEY?.trim());

const uniqueProviders = (providers: RemoteProvider[]) =>
  providers.filter((provider, index) => providers.indexOf(provider) === index);

const uniqueStrings = (items: string[]) =>
  items
    .map((item) => item.trim())
    .filter(Boolean)
    .filter((item, index, list) => list.indexOf(item) === index);

const getGeminiChatModelChain = () =>
  uniqueStrings([DEFAULT_GEMINI_MODEL, ...GEMINI_CHAT_FALLBACK_MODELS.split(",")]);

const getGroqChatModelChain = () =>
  uniqueStrings([DEFAULT_GROQ_MODEL, ...GROQ_CHAT_FALLBACK_MODELS.split(",")]);

const buildOfflineChatFallback = (message: string, errors: string[]) => {
  return [
    "Chưa tìm thấy đủ dữ liệu nội bộ phù hợp để trả lời chắc chắn câu hỏi này.",
    "",
    "Bạn có thể bổ sung dữ liệu để hệ thống truy xuất chính xác hơn:",
    "1. Hỏi hẹp hơn theo module cụ thể: Đơn hàng, Cửa hàng, Admin, Thư viện, Thuốc BVTV, Sinh trưởng hoặc Cộng đồng.",
    "2. Cung cấp mã định danh rõ hơn nếu hỏi dữ liệu riêng, ví dụ mã đơn, số điện thoại, email, tên sản phẩm hoặc tên cây.",
    "3. Nếu hỏi kỹ thuật cây trồng, hãy nêu cây trồng, giai đoạn, triệu chứng và dữ liệu quan sát thực tế.",
  ].join("\n");
};

const getChatProviderPreference = (): RemoteProvider => {
  if (AI_CHAT_PROVIDER_ENV === "gemini") return "gemini";
  if (AI_CHAT_PROVIDER_ENV === "groq" || AI_CHAT_PROVIDER_ENV === "grok") return "groq";
  if (AI_CHAT_PROVIDER_ENV === "openai") return "openai";
  if (AI_PROVIDER_ENV === "gemini") return "gemini";
  return "openai";
};

const getChatProviderChain = () => {
  const preferred = getChatProviderPreference();
  const ordered = uniqueProviders([preferred, "groq", "gemini", "openai", "openrouter"]);
  const configured = ordered.filter((provider) =>
    provider === "openai"
      ? hasOpenAIKey()
      : provider === "groq"
        ? hasGroqKey()
        : provider === "openrouter"
          ? hasOpenRouterKey()
          : hasGeminiKey()
  );

  return configured.length > 0 ? configured : ordered;
};

const getChatProviderLabel = () => getChatProviderChain().join(" -> ");

const getDiagnosisProviderChain = () => {
  const preferred = getDiagnosisProvider();
  const remoteProviders = uniqueProviders([
    preferred === "local" ? "gemini" : preferred,
    "gemini",
    "groq",
    "openai",
    "openrouter",
  ] as RemoteProvider[]);
  const configured = remoteProviders.filter((provider) =>
    provider === "openai"
      ? hasOpenAIKey()
      : provider === "groq"
        ? hasGroqKey()
        : provider === "openrouter"
          ? hasOpenRouterKey()
          : hasGeminiKey()
  );

  return configured.length > 0 ? configured : remoteProviders;
};

const hasLocalDiagnosisAssets = () =>
  fs.existsSync(LOCAL_MODEL_PATH) &&
  fs.existsSync(LOCAL_CLASS_NAMES_PATH) &&
  fs.existsSync(LOCAL_INFERENCE_SCRIPT);

const resolvePlantModel = (cropId?: string) => {
  const normalized = cropId?.trim().toLowerCase() as CropId | undefined;
  if (normalized && normalized in PLANT_MODEL_REGISTRY) {
    return PLANT_MODEL_REGISTRY[normalized];
  }

  return PLANT_MODEL_REGISTRY.tomato;
};

const isSupportedCropId = (cropId?: string): cropId is CropId => {
  const normalized = cropId?.trim().toLowerCase();
  return Boolean(normalized && normalized in PLANT_MODEL_REGISTRY);
};

const hasPlantModelAssets = (cropId?: string) => {
  const plantModel = resolvePlantModel(cropId);
  return (
    fs.existsSync(plantModel.modelPath) &&
    fs.existsSync(plantModel.classNamesPath) &&
    fs.existsSync(plantModel.inferenceScript)
  );
};

const usesCloudDiagnosis = (cropId?: string) => CLOUD_DIAGNOSIS_CROP_IDS.has(resolvePlantModel(cropId).id);
const usesLocalOnlyDiagnosis = (cropId?: string) => LOCAL_ONLY_DIAGNOSIS_CROP_IDS.has(resolvePlantModel(cropId).id);
const canRunLocalPython = () => process.env.VERCEL !== "1";

const shouldUseLocalDiagnosis = (cropId?: string) => {
  const plantModel = resolvePlantModel(cropId);
  return canRunLocalPython() && !usesCloudDiagnosis(plantModel.id) && hasPlantModelAssets(plantModel.id);
};

const getDiagnosisProvider = (): Provider => {
  if (AI_PROVIDER_ENV) {
    return getProvider();
  }

  if (hasPlantModelAssets()) {
    return "local";
  }

  return getProvider();
};

const jsonError = (res: express.Response, status: number, error: string) => {
  res.status(status).json({ error });
};

const buildDiagnosisPrompt = (cropId?: string) => {
  const plantModel = resolvePlantModel(cropId);

  return [
    diagnosisInstruction,
    "",
    `Cây người dùng đã chọn: ${plantModel.cropName} (cropId: ${plantModel.id}).`,
    "Ưu tiên đối chiếu bệnh thường gặp trên đúng cây người dùng đã chọn; không tự đổi sang cây khác nếu ảnh vẫn có thể là cây này.",
    "",
    "Quan trọng: Chỉ trả về một object JSON thuần. Không dùng markdown, không dùng ```json, không thêm giải thích ngoài JSON.",
    "Giữ nội dung ngắn gọn: mỗi mảng tối đa 4 mục, mỗi mục tối đa 120 ký tự để JSON không bị cắt giữa chừng.",
  ].join("\n");
};

const getRequestBaseUrl = (req: express.Request) => {
  const protocol = String(req.headers["x-forwarded-proto"] || req.protocol || "http").split(",")[0];
  const host = req.headers["x-forwarded-host"] || req.get("host");
  return `${protocol}://${host}`;
};

const formatVnpayDate = (date: Date) => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    hourCycle: "h23",
  }).formatToParts(date);

  const value = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value || "00";
  return `${value("year")}${value("month")}${value("day")}${value("hour")}${value("minute")}${value("second")}`;
};

const sortVnpayParams = (params: Record<string, string | number>) =>
  Object.keys(params)
    .sort()
    .reduce<Record<string, string>>((result, key) => {
      result[encodeURIComponent(key)] = encodeURIComponent(String(params[key])).replace(/%20/g, "+");
      return result;
    }, {});

const stringifyVnpayParams = (params: Record<string, string>) =>
  Object.entries(params)
    .map(([key, value]) => `${key}=${value}`)
    .join("&");

const signVnpayParams = (params: Record<string, string>) =>
  crypto.createHmac("sha512", VNPAY_HASH_SECRET).update(Buffer.from(stringifyVnpayParams(params), "utf-8")).digest("hex");

const buildClientVnpayRedirect = (req: express.Request, params: Record<string, string>) => {
  const redirectUrl = new URL(getRequestBaseUrl(req));
  redirectUrl.searchParams.set("view", "shop");
  Object.entries(params).forEach(([key, value]) => redirectUrl.searchParams.set(key, value));
  return redirectUrl.toString();
};

type ShopOrderPaymentRecord = {
  id: string;
  total: number;
  payment_status: "pending" | "paid" | "failed" | "refunded";
  status: "pending" | "confirmed" | "shipping" | "delivered" | "cancelled";
};

const getServerShopOrder = async (orderId: string) => {
  if (!serverSupabase) return null;

  const { data, error } = await serverSupabase
    .from("shop_orders")
    .select("id,total,payment_status,status")
    .eq("id", orderId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data as ShopOrderPaymentRecord | null;
};

const updateServerShopOrderPayment = async (
  orderId: string,
  paymentStatus: "paid" | "failed",
  status: "pending" | "confirmed"
) => {
  if (!serverSupabase) return;

  const { error } = await serverSupabase
    .from("shop_orders")
    .update({
      payment_status: paymentStatus,
      status,
    })
    .eq("id", orderId);

  if (error) {
    throw error;
  }
};

const readVnpayQueryParams = (req: express.Request) =>
  Object.fromEntries(
    Object.entries(req.query)
      .filter(([, value]) => typeof value === "string")
      .map(([key, value]) => [key, String(value)])
  );

const verifyVnpayQuery = (params: Record<string, string>) => {
  const secureHash = params.vnp_SecureHash;
  const signedSource = { ...params };

  delete signedSource.vnp_SecureHash;
  delete signedSource.vnp_SecureHashType;

  if (!secureHash || !VNPAY_HASH_SECRET) {
    return { valid: false, params: signedSource };
  }

  return {
    valid: secureHash === signVnpayParams(sortVnpayParams(signedSource)),
    params: signedSource,
  };
};

const inspectLocalRuntime = async (): Promise<LocalRuntimeStatus> =>
  await new Promise<LocalRuntimeStatus>((resolve) => {
    const child = spawn("python3", [
      "-c",
      [
        "import json, platform",
        "status = {'pythonAvailable': True, 'onnxRuntimeAvailable': False, 'pythonVersion': platform.python_version()}",
        "try:",
        "    import onnxruntime as ort",
        "    status['onnxRuntimeAvailable'] = True",
        "    status['onnxRuntimeVersion'] = ort.__version__",
        "except Exception as exc:",
        "    status['onnxRuntimeError'] = str(exc)",
        "if not status['onnxRuntimeAvailable']:",
        "    status['error'] = status.get('onnxRuntimeError') or 'Thieu onnxruntime'",
        "print(json.dumps(status))",
      ].join("\n"),
    ]);

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", (error) => {
      resolve({
        pythonAvailable: false,
        error: error.message,
      });
    });

    child.on("close", (code) => {
      if (code !== 0) {
        resolve({
          pythonAvailable: false,
          error: stderr.trim() || "Không thể chạy python3.",
        });
        return;
      }

      try {
        resolve(JSON.parse(stdout) as LocalRuntimeStatus);
      } catch {
        resolve({
          pythonAvailable: true,
          error: "Không đọc được trạng thái ONNX Runtime từ python3.",
        });
      }
    });
  });

const parseJsonObject = (text: string) => {
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();

  const candidates = [cleaned];
  const firstBrace = cleaned.indexOf("{");

  if (firstBrace >= 0) {
    let inString = false;
    let escaped = false;
    let depth = 0;

    for (let index = firstBrace; index < cleaned.length; index += 1) {
      const char = cleaned[index];

      if (escaped) {
        escaped = false;
        continue;
      }

      if (char === "\\") {
        escaped = true;
        continue;
      }

      if (char === "\"") {
        inString = !inString;
        continue;
      }

      if (inString) continue;

      if (char === "{") depth += 1;
      if (char === "}") depth -= 1;

      if (depth === 0) {
        candidates.push(cleaned.slice(firstBrace, index + 1));
        break;
      }
    }
  }

  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate) as unknown;
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
    } catch {
      // Try the next candidate.
    }
  }

  return null;
};

const normalizeDiagnosis = (raw: Record<string, unknown>) => {
  const rawSymptoms = raw.symptoms;
  const rawTreatment = raw.treatment;
  const rawChecklist = raw.treatmentChecklist;
  const rawRecommendation = raw.recommendation;
  const rawTopPredictions = raw.topPredictions;

  const symptoms = Array.isArray(rawSymptoms)
    ? rawSymptoms.map((item) => String(item))
    : typeof rawSymptoms === "string"
      ? rawSymptoms.split(/\n|•|-/).map((item) => item.trim()).filter(Boolean)
      : [];

  const treatment = Array.isArray(rawTreatment)
    ? rawTreatment.map((item) => String(item))
    : Array.isArray(rawChecklist)
      ? rawChecklist.map((item) => String(item))
      : typeof rawRecommendation === "string"
        ? rawRecommendation.split(/\n|•|-/).map((item) => item.trim()).filter(Boolean)
        : [];

  return {
    diseaseName: String(raw.diseaseName || "Chưa xác định"),
    cropName: String(raw.cropName || "Chưa xác định"),
    confidence: Number(raw.confidence || 0),
    severity: String(raw.severity || "Trung bình"),
    symptoms,
    treatment,
    recommendation: String(rawRecommendation || treatment.join(". ") || "Chưa có khuyến nghị cụ thể."),
    pesticideType: raw.pesticideType ? String(raw.pesticideType) : undefined,
    pathogen: raw.pathogen ? String(raw.pathogen) : undefined,
    riskLevel: typeof raw.riskLevel === "number" ? raw.riskLevel : undefined,
    spreadSpeed: raw.spreadSpeed ? String(raw.spreadSpeed) : undefined,
    prevention: Array.isArray(raw.prevention) ? raw.prevention.map((item) => String(item)) : undefined,
    treatmentChecklist: Array.isArray(rawChecklist) ? rawChecklist.map((item) => String(item)) : treatment,
    rawLabel: raw.rawLabel ? String(raw.rawLabel) : undefined,
    topPredictions: Array.isArray(rawTopPredictions)
      ? rawTopPredictions
          .filter((item) => item && typeof item === "object")
          .map((item) => {
            const record = item as Record<string, unknown>;
            return {
              rawLabel: String(record.rawLabel || record.label || "unknown"),
              diseaseName: String(record.diseaseName || record.rawLabel || record.label || "Chưa xác định"),
              cropName: String(record.cropName || "Chưa xác định"),
              confidence: Number(record.confidence || 0),
            };
          })
      : undefined,
    confidenceBreakdown:
      raw.confidenceBreakdown && typeof raw.confidenceBreakdown === "object"
        ? raw.confidenceBreakdown
        : undefined,
  };
};

type LocalDiagnosisPrediction = {
  label: string;
  confidence: number;
  outputCount?: number;
  selectedModel?: string;
  modelCount?: number;
  topPredictions?: Array<{ label: string; confidence: number }>;
};

type LabelProfile = {
  cropName: string;
  diseaseName: string;
  diseaseKey: string;
  healthy?: boolean;
};

const LOW_CONFIDENCE_THRESHOLD = Number(process.env.AI_LOW_CONFIDENCE_THRESHOLD || 0.4);
const LOW_MARGIN_THRESHOLD = Number(process.env.AI_LOW_MARGIN_THRESHOLD || 0.12);
const CROP_SCOPE_THRESHOLDS: Partial<Record<CropId, { confidence: number; margin: number }>> = {
  corn: {
    confidence: Number(process.env.AI_MAIZE_LOW_CONFIDENCE_THRESHOLD || 0.65),
    margin: Number(process.env.AI_MAIZE_LOW_MARGIN_THRESHOLD || 0.25),
  },
  potato: {
    confidence: Number(process.env.AI_POTATO_LOW_CONFIDENCE_THRESHOLD || 0.25),
    margin: Number(process.env.AI_POTATO_LOW_MARGIN_THRESHOLD || 0.03),
  },
  bean: {
    confidence: Number(process.env.AI_BEAN_LOW_CONFIDENCE_THRESHOLD || 0.55),
    margin: Number(process.env.AI_BEAN_LOW_MARGIN_THRESHOLD || 0.12),
  },
};

const normalizeModelLabel = (label: string) =>
  label
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

const CLASS_LABEL_PROFILES: Record<string, LabelProfile> = {
  tomato_bacterial_spot: { cropName: "Cà chua", diseaseName: "Đốm vi khuẩn", diseaseKey: "bacterial_spot" },
  tomato_early_blight: { cropName: "Cà chua", diseaseName: "Cháy lá sớm", diseaseKey: "early_blight" },
  tomato_late_blight: { cropName: "Cà chua", diseaseName: "Sương mai", diseaseKey: "late_blight" },
  tomato_leaf_mold: { cropName: "Cà chua", diseaseName: "Mốc lá", diseaseKey: "leaf_mold" },
  tomato_septoria_leaf_spot: { cropName: "Cà chua", diseaseName: "Đốm lá Septoria", diseaseKey: "septoria_leaf_spot" },
  tomato_spider_mites_two_spotted_spider_mite: { cropName: "Cà chua", diseaseName: "Nhện đỏ hai chấm", diseaseKey: "spider_mites" },
  tomato_target_spot: { cropName: "Cà chua", diseaseName: "Đốm vòng", diseaseKey: "target_spot" },
  tomato_tomato_yellow_leaf_curl_virus: { cropName: "Cà chua", diseaseName: "Virus xoăn vàng lá cà chua", diseaseKey: "yellow_leaf_curl_virus" },
  tomato_tomato_mosaic_virus: { cropName: "Cà chua", diseaseName: "Virus khảm cà chua", diseaseKey: "tomato_mosaic_virus" },
  tomato_healthy: { cropName: "Cà chua", diseaseName: "Cây khỏe mạnh", diseaseKey: "healthy", healthy: true },
  tomato_powdery_mildew: { cropName: "Cà chua", diseaseName: "Phấn trắng", diseaseKey: "powdery_mildew" },
  scab: { cropName: "Táo", diseaseName: "Ghẻ táo", diseaseKey: "apple_scab" },
  apple_apple_scab: { cropName: "Táo", diseaseName: "Ghẻ táo", diseaseKey: "apple_scab" },
  apple_scab: { cropName: "Táo", diseaseName: "Ghẻ táo", diseaseKey: "apple_scab" },
  rust: { cropName: "Táo", diseaseName: "Rỉ sắt táo", diseaseKey: "cedar_apple_rust" },
  apple_cedar_apple_rust: { cropName: "Táo", diseaseName: "Rỉ sắt táo", diseaseKey: "cedar_apple_rust" },
  cedar_apple_rust: { cropName: "Táo", diseaseName: "Rỉ sắt táo", diseaseKey: "cedar_apple_rust" },
  apple_rust: { cropName: "Táo", diseaseName: "Rỉ sắt táo", diseaseKey: "cedar_apple_rust" },
  apple_healthy: { cropName: "Táo", diseaseName: "Cây táo khỏe mạnh", diseaseKey: "healthy", healthy: true },
  rice_bacterialblight: { cropName: "Lúa", diseaseName: "Bạc lá lúa", diseaseKey: "rice_bacterial_blight" },
  bacterialblight: { cropName: "Lúa", diseaseName: "Bạc lá lúa", diseaseKey: "rice_bacterial_blight" },
  rice_bacterial_blight: { cropName: "Lúa", diseaseName: "Bạc lá lúa", diseaseKey: "rice_bacterial_blight" },
  bacterial_blight: { cropName: "Lúa", diseaseName: "Bạc lá lúa", diseaseKey: "rice_bacterial_blight" },
  rice_blast: { cropName: "Lúa", diseaseName: "Đạo ôn lúa", diseaseKey: "rice_blast" },
  blast: { cropName: "Lúa", diseaseName: "Đạo ôn lúa", diseaseKey: "rice_blast" },
  rice_brownspot: { cropName: "Lúa", diseaseName: "Đốm nâu lúa", diseaseKey: "rice_brown_spot" },
  brownspot: { cropName: "Lúa", diseaseName: "Đốm nâu lúa", diseaseKey: "rice_brown_spot" },
  rice_brown_spot: { cropName: "Lúa", diseaseName: "Đốm nâu lúa", diseaseKey: "rice_brown_spot" },
  brown_spot: { cropName: "Lúa", diseaseName: "Đốm nâu lúa", diseaseKey: "rice_brown_spot" },
  rice_tungro: { cropName: "Lúa", diseaseName: "Virus vàng lùn xoắn lá Tungro", diseaseKey: "rice_tungro" },
  tungro: { cropName: "Lúa", diseaseName: "Virus vàng lùn xoắn lá Tungro", diseaseKey: "rice_tungro" },
  potato_bacteria: { cropName: "Khoai tây", diseaseName: "Bệnh vi khuẩn khoai tây", diseaseKey: "potato_bacteria" },
  potato_fungi: { cropName: "Khoai tây", diseaseName: "Bệnh nấm khoai tây", diseaseKey: "potato_fungi" },
  potato_phytopthora: { cropName: "Khoai tây", diseaseName: "Bệnh Phytophthora khoai tây", diseaseKey: "potato_phytophthora" },
  potato_phytophthora: { cropName: "Khoai tây", diseaseName: "Bệnh Phytophthora khoai tây", diseaseKey: "potato_phytophthora" },
  potato_virus: { cropName: "Khoai tây", diseaseName: "Bệnh virus khoai tây", diseaseKey: "potato_virus" },
  potato_healthy: { cropName: "Khoai tây", diseaseName: "Cây khoai tây khỏe mạnh", diseaseKey: "healthy", healthy: true },
  cassava_cassava_bacterial_blight_cbb: { cropName: "Sắn", diseaseName: "Cháy lá vi khuẩn sắn", diseaseKey: "cassava_bacterial_blight" },
  cassava_cassava_brown_streak_disease_cbsd: { cropName: "Sắn", diseaseName: "Bệnh sọc nâu sắn", diseaseKey: "cassava_brown_streak" },
  cassava_cassava_green_mottle_cgm: { cropName: "Sắn", diseaseName: "Đốm xanh lá sắn", diseaseKey: "cassava_green_mottle" },
  cassava_cassava_mosaic_disease_cmd: { cropName: "Sắn", diseaseName: "Bệnh khảm lá sắn", diseaseKey: "cassava_mosaic" },
  cassava_healthy: { cropName: "Sắn", diseaseName: "Cây sắn khỏe mạnh", diseaseKey: "healthy", healthy: true },
  corn_cercospora_leaf_spot_gray_leaf_spot: { cropName: "Ngô", diseaseName: "Cercospora Leaf Spot (Gray Leaf Spot)", diseaseKey: "gray_leaf_spot" },
  corn_maize_cercospora_leaf_spot_gray_leaf_spot: { cropName: "Ngô", diseaseName: "Cercospora Leaf Spot (Gray Leaf Spot)", diseaseKey: "gray_leaf_spot" },
  cercospora_leaf_spot_gray_leaf_spot: { cropName: "Ngô", diseaseName: "Cercospora Leaf Spot (Gray Leaf Spot)", diseaseKey: "gray_leaf_spot" },
  corn_common_rust: { cropName: "Ngô", diseaseName: "Common Rust", diseaseKey: "common_rust" },
  corn_maize_common_rust: { cropName: "Ngô", diseaseName: "Common Rust", diseaseKey: "common_rust" },
  common_rust: { cropName: "Ngô", diseaseName: "Common Rust", diseaseKey: "common_rust" },
  corn_northern_leaf_blight: { cropName: "Ngô", diseaseName: "Northern Leaf Blight", diseaseKey: "northern_leaf_blight" },
  corn_maize_northern_leaf_blight: { cropName: "Ngô", diseaseName: "Northern Leaf Blight", diseaseKey: "northern_leaf_blight" },
  northern_leaf_blight: { cropName: "Ngô", diseaseName: "Northern Leaf Blight", diseaseKey: "northern_leaf_blight" },
  corn_healthy: { cropName: "Ngô", diseaseName: "Healthy", diseaseKey: "healthy", healthy: true },
  corn_maize_healthy: { cropName: "Ngô", diseaseName: "Healthy", diseaseKey: "healthy", healthy: true },
  corn_other: { cropName: "Ngô", diseaseName: "Other", diseaseKey: "unknown" },
  mango_anthracnose: { cropName: "Xoài", diseaseName: "Thán thư xoài", diseaseKey: "mango_anthracnose" },
  anthracnose: { cropName: "Xoài", diseaseName: "Thán thư xoài", diseaseKey: "mango_anthracnose" },
  mango_bacterial_canker: { cropName: "Xoài", diseaseName: "Loét vi khuẩn xoài", diseaseKey: "mango_bacterial_canker" },
  bacterial_canker: { cropName: "Xoài", diseaseName: "Loét vi khuẩn xoài", diseaseKey: "mango_bacterial_canker" },
  mango_cutting_weevil: { cropName: "Xoài", diseaseName: "Sâu đục/chích hại cành non xoài", diseaseKey: "mango_cutting_weevil" },
  cutting_weevil: { cropName: "Xoài", diseaseName: "Sâu đục/chích hại cành non xoài", diseaseKey: "mango_cutting_weevil" },
  mango_die_back: { cropName: "Xoài", diseaseName: "Khô cành chết ngọn xoài", diseaseKey: "mango_die_back" },
  die_back: { cropName: "Xoài", diseaseName: "Khô cành chết ngọn xoài", diseaseKey: "mango_die_back" },
  dieback: { cropName: "Xoài", diseaseName: "Khô cành chết ngọn xoài", diseaseKey: "mango_die_back" },
  mango_gall_midge: { cropName: "Xoài", diseaseName: "Muỗi gây u sưng lá xoài", diseaseKey: "mango_gall_midge" },
  gall_midge: { cropName: "Xoài", diseaseName: "Muỗi gây u sưng lá xoài", diseaseKey: "mango_gall_midge" },
  mango_healthy: { cropName: "Xoài", diseaseName: "Cây xoài khỏe mạnh", diseaseKey: "healthy", healthy: true },
  healthy: { cropName: "Xoài", diseaseName: "Cây xoài khỏe mạnh", diseaseKey: "healthy", healthy: true },
  mango_powdery_mildew: { cropName: "Xoài", diseaseName: "Phấn trắng xoài", diseaseKey: "powdery_mildew" },
  powdery_mildew: { cropName: "Xoài", diseaseName: "Phấn trắng xoài", diseaseKey: "powdery_mildew" },
  mango_sooty_mould: { cropName: "Xoài", diseaseName: "Nấm bồ hóng xoài", diseaseKey: "mango_sooty_mould" },
  mango_sooty_mold: { cropName: "Xoài", diseaseName: "Nấm bồ hóng xoài", diseaseKey: "mango_sooty_mould" },
  sooty_mould: { cropName: "Xoài", diseaseName: "Nấm bồ hóng xoài", diseaseKey: "mango_sooty_mould" },
  sooty_mold: { cropName: "Xoài", diseaseName: "Nấm bồ hóng xoài", diseaseKey: "mango_sooty_mould" },
  bean_angular_leaf_spot: { cropName: "Đậu", diseaseName: "Đốm góc lá đậu", diseaseKey: "bean_angular_leaf_spot" },
  angular_leaf_spot: { cropName: "Đậu", diseaseName: "Đốm góc lá đậu", diseaseKey: "bean_angular_leaf_spot" },
  bean_bean_rust: { cropName: "Đậu", diseaseName: "Rỉ sắt đậu", diseaseKey: "bean_rust" },
  bean_rust: { cropName: "Đậu", diseaseName: "Rỉ sắt đậu", diseaseKey: "bean_rust" },
  bean_healthy: { cropName: "Đậu", diseaseName: "Cây đậu khỏe mạnh", diseaseKey: "healthy", healthy: true },
};

const getLabelProfile = (label: string, cropId: string = "tomato"): LabelProfile | undefined => {
  const normalized = normalizeModelLabel(label);
  const normalizedCropId = normalizeModelLabel(cropId);
  return CLASS_LABEL_PROFILES[`${normalizedCropId}_${normalized}`] || CLASS_LABEL_PROFILES[normalized];
};

const diseaseDetailsByKey = {
  rice_bacterial_blight: {
    severity: "Nặng",
    pathogen: "Vi khuẩn Xanthomonas oryzae pv. oryzae",
    pesticideType: "Ưu tiên giống/chăm sóc và quản lý nước; cân nhắc thuốc gốc đồng hoặc sản phẩm vi khuẩn theo nhãn khi cần",
    riskLevel: 4,
    spreadSpeed: "Nhanh",
    symptoms: [
      "Lá có vệt cháy vàng nhạt đến trắng bạc, thường bắt đầu từ chóp hoặc mép lá rồi lan dọc theo gân.",
      "Ruộng ẩm, mưa gió, bón thừa đạm hoặc vết thương cơ giới có thể làm bệnh lan nhanh.",
    ],
    treatment: [
      "Ngưng bón thêm đạm khi bệnh đang lan và giữ mực nước ruộng hợp lý.",
      "Loại bỏ lá/cây bệnh nặng ở diện tích nhỏ và hạn chế đi lại khi ruộng ướt.",
      "Dùng thuốc hoặc chế phẩm phù hợp bệnh vi khuẩn theo nhãn nếu bệnh vượt ngưỡng quản lý.",
    ],
    prevention: [
      "Dùng giống sạch bệnh/chống chịu, gieo sạ mật độ vừa phải và bón NPK cân đối.",
      "Vệ sinh đồng ruộng, quản lý nước tốt và theo dõi sát sau mưa bão.",
    ],
  },
  rice_blast: {
    severity: "Nặng",
    pathogen: "Nấm Magnaporthe oryzae",
    pesticideType: "Thuốc trừ nấm đạo ôn theo nhãn, luân phiên hoạt chất khi cần",
    riskLevel: 5,
    spreadSpeed: "Nhanh",
    symptoms: [
      "Lá có vết hình thoi, tâm xám trắng, viền nâu; bệnh nặng làm cháy từng mảng lá.",
      "Có thể gây đạo ôn cổ bông làm lép hạt nếu xuất hiện giai đoạn làm đòng trổ.",
    ],
    treatment: [
      "Giảm bón đạm, giữ ruộng thông thoáng và kiểm tra thêm cổ lá/cổ bông.",
      "Phun thuốc đặc trị đạo ôn đúng thời điểm và đúng nhãn nếu bệnh tăng nhanh.",
      "Theo dõi lại sau 3-5 ngày, nhất là khi trời âm u, sương nhiều hoặc ruộng rậm.",
    ],
    prevention: [
      "Chọn giống chống chịu và xử lý hạt giống khi phù hợp quy trình địa phương.",
      "Bón phân cân đối, tránh sạ quá dày và theo dõi sớm ở giai đoạn đẻ nhánh đến trổ.",
    ],
  },
  rice_brown_spot: {
    severity: "Trung bình",
    pathogen: "Nấm Bipolaris/Helminthosporium oryzae",
    pesticideType: "Thuốc trừ nấm đốm lá theo nhãn; ưu tiên cải thiện dinh dưỡng và điều kiện ruộng",
    riskLevel: 3,
    spreadSpeed: "Trung bình",
    symptoms: [
      "Lá có đốm nâu tròn hoặc bầu dục, tâm xám nâu, nhiều vết có thể làm lá vàng và khô.",
      "Bệnh thường nặng hơn khi cây suy dinh dưỡng, đất nghèo kali/silic hoặc gặp stress nước.",
    ],
    treatment: [
      "Kiểm tra dinh dưỡng ruộng, bổ sung cân đối kali/silic theo khuyến cáo nếu thiếu.",
      "Giữ nước và chăm sóc để giảm stress cho cây lúa.",
      "Dùng thuốc trừ nấm đúng nhãn nếu vết bệnh lan nhanh lên tầng lá quan trọng.",
    ],
    prevention: [
      "Dùng hạt giống khỏe, xử lý giống khi cần và không để cây thiếu dinh dưỡng kéo dài.",
      "Quản lý rơm rạ/tàn dư bệnh và bón phân cân đối theo giai đoạn sinh trưởng.",
    ],
  },
  rice_tungro: {
    severity: "Nặng",
    pathogen: "Virus Tungro, thường lây qua rầy xanh",
    pesticideType: "Không có thuốc trị virus trực tiếp; cần quản lý rầy xanh và nguồn bệnh",
    riskLevel: 5,
    spreadSpeed: "Nhanh",
    symptoms: [
      "Cây lúa vàng cam, lùn, đẻ nhánh kém; lá có thể xoắn nhẹ và sinh trưởng chậm.",
      "Bệnh thường xuất hiện thành chòm và lan theo mật độ rầy xanh môi giới.",
    ],
    treatment: [
      "Kiểm tra mật độ rầy xanh và loại bỏ cây bệnh nặng nếu diện tích còn nhỏ.",
      "Không giữ nguồn lúa chét/cỏ ký chủ quanh ruộng làm nơi lưu tồn virus và rầy.",
      "Quản lý rầy xanh theo IPM, chỉ dùng thuốc đúng nhãn khi mật độ vượt ngưỡng.",
    ],
    prevention: [
      "Gieo sạ đồng loạt, dùng giống chống chịu nếu vùng có tiền sử Tungro.",
      "Vệ sinh đồng ruộng, né rầy và theo dõi rầy xanh từ đầu vụ.",
    ],
  },
  potato_bacteria: {
    severity: "Trung bình",
    pathogen: "Vi khuẩn",
    pesticideType: "Thuốc gốc đồng hoặc nhóm quản lý bệnh vi khuẩn theo nhãn",
    riskLevel: 4,
    spreadSpeed: "Trung bình",
    symptoms: [
      "Model potato đang phân loại ảnh vào nhóm bệnh do vi khuẩn; cần đối chiếu thêm vết đốm, mô thối ướt hoặc tổn thương trên thân/củ.",
      "Bệnh vi khuẩn trên khoai tây thường nặng hơn khi ẩm cao, vườn thoát nước kém hoặc có vết thương cơ giới.",
    ],
    treatment: [
      "Cách ly cây nghi bệnh nặng và hạn chế thao tác khi lá đang ướt.",
      "Kiểm tra thêm thân, gốc và củ để phân biệt đốm vi khuẩn với thối nhũn hoặc héo vi khuẩn.",
      "Chỉ cân nhắc sản phẩm phù hợp bệnh vi khuẩn theo nhãn sau khi xác nhận triệu chứng ngoài ruộng.",
    ],
    prevention: [
      "Dùng củ giống sạch bệnh, vệ sinh dụng cụ và cải thiện thoát nước luống.",
      "Không tưới phun mạnh lên tán khi ruộng đang có ổ bệnh nghi vi khuẩn.",
    ],
  },
  potato_fungi: {
    severity: "Trung bình",
    pathogen: "Nấm",
    pesticideType: "Thuốc trừ nấm phù hợp, luân phiên hoạt chất theo nhãn",
    riskLevel: 3,
    spreadSpeed: "Trung bình",
    symptoms: [
      "Model potato đang phân loại ảnh vào nhóm bệnh nấm; cần tìm thêm đốm nâu, vòng đồng tâm, cháy mép hoặc lớp mốc trên lá.",
      "Nhóm nấm trên khoai tây thường phát triển nhanh hơn khi tán rậm, ẩm kéo dài hoặc cây suy dinh dưỡng.",
    ],
    treatment: [
      "Tỉa bỏ lá bệnh nặng nếu diện tích nhỏ và thu gom khỏi ruộng.",
      "Giảm ẩm tán, tưới vào gốc và theo dõi tốc độ lan trong 2-3 ngày.",
      "Dùng thuốc trừ nấm đúng nhãn khi bệnh lan lên tầng lá quan trọng.",
    ],
    prevention: [
      "Luân canh, dọn tàn dư vụ trước và giữ mật độ trồng thông thoáng.",
      "Bón cân đối để cây không suy, đặc biệt trong giai đoạn phát triển thân lá.",
    ],
  },
  potato_phytophthora: {
    severity: "Nặng",
    pathogen: "Giả nấm Phytophthora infestans",
    pesticideType: "Thuốc trừ sương mai/chết nhanh phù hợp giai đoạn bệnh",
    riskLevel: 5,
    spreadSpeed: "Nhanh",
    symptoms: [
      "Model potato đang phân loại ảnh vào nhóm Phytophthora; trên khoai tây cần đặc biệt nghi sương mai/cháy muộn.",
      "Vết bệnh thường úng nước rồi nâu đen, lan nhanh khi thời tiết mát ẩm; mặt dưới lá có thể có mốc trắng ở rìa vết bệnh.",
    ],
    treatment: [
      "Kiểm tra ngay nhiều vị trí trong ruộng vì bệnh có thể lan rất nhanh.",
      "Loại bỏ mô bệnh nặng, giảm tưới chiều muộn và tăng thông thoáng.",
      "Can thiệp sớm bằng thuốc chuyên trị sương mai theo đúng nhãn nếu triệu chứng thực địa khớp.",
    ],
    prevention: [
      "Theo dõi sát sau mưa, sương đêm hoặc giai đoạn nhiệt độ mát và ẩm cao.",
      "Tăng thoát nước luống, không để tán quá rậm và tránh nguồn củ giống nhiễm bệnh.",
    ],
  },
  potato_virus: {
    severity: "Nặng",
    pathogen: "Virus và côn trùng môi giới",
    pesticideType: "Không có thuốc trị virus trực tiếp; cần quản lý côn trùng môi giới",
    riskLevel: 4,
    spreadSpeed: "Trung bình",
    symptoms: [
      "Model potato đang phân loại ảnh vào nhóm virus; cần kiểm tra thêm lá khảm xanh vàng, xoăn, biến dạng hoặc cây còi cọc.",
      "Virus trên khoai tây thường lan qua củ giống nhiễm bệnh hoặc côn trùng môi giới như rệp.",
    ],
    treatment: [
      "Đánh dấu và theo dõi cây nghi bệnh, loại bỏ cây bệnh nặng nếu ổ bệnh còn nhỏ.",
      "Không dùng củ từ cây nghi nhiễm virus làm giống.",
      "Quản lý rệp và côn trùng môi giới theo IPM, chỉ dùng thuốc đúng nhãn khi vượt ngưỡng.",
    ],
    prevention: [
      "Dùng củ giống sạch bệnh và loại bỏ cây tự mọc từ vụ trước.",
      "Theo dõi rệp sớm, vệ sinh ruộng và tránh thao tác làm lan cơ giới.",
    ],
  },
  cassava_bacterial_blight: {
    severity: "Nặng",
    pathogen: "Vi khuẩn Xanthomonas phaseoli pv. manihotis",
    pesticideType: "Ưu tiên giống sạch bệnh, vệ sinh đồng ruộng; cân nhắc sản phẩm phù hợp bệnh vi khuẩn theo nhãn",
    riskLevel: 4,
    spreadSpeed: "Nhanh",
    symptoms: [
      "Lá có đốm úng nước hoặc cháy nâu, gân lá có thể thâm đen và lá héo rũ.",
      "Bệnh dễ lan sau mưa gió, qua hom giống nhiễm bệnh, nước bắn và dụng cụ canh tác.",
    ],
    treatment: [
      "Loại bỏ lá/cành bệnh nặng và hạn chế đi lại, cắt tỉa khi cây đang ướt.",
      "Kiểm tra hom giống, thân và các cây kế bên để đánh giá mức lan.",
      "Vệ sinh dụng cụ và chỉ dùng sản phẩm phù hợp bệnh vi khuẩn theo nhãn khi thật cần.",
    ],
    prevention: [
      "Dùng hom giống sạch bệnh, không lấy hom từ ruộng đã có triệu chứng.",
      "Dọn tàn dư bệnh và bố trí mật độ trồng thông thoáng.",
    ],
  },
  cassava_brown_streak: {
    severity: "Nặng",
    pathogen: "Virus gây sọc nâu sắn, thường liên quan bọ phấn môi giới",
    pesticideType: "Không có thuốc trị virus trực tiếp; cần quản lý hom giống và bọ phấn",
    riskLevel: 5,
    spreadSpeed: "Trung bình",
    symptoms: [
      "Lá có mảng vàng hoặc vệt loang, thân có thể có vệt nâu; củ có hoại tử nâu làm giảm chất lượng mạnh.",
      "Triệu chứng trên lá đôi khi nhẹ nhưng củ đã bị ảnh hưởng, nên cần kiểm tra thêm phần củ nếu nghi ngờ.",
    ],
    treatment: [
      "Đánh dấu cây nghi bệnh và kiểm tra thêm thân, củ nếu có thể.",
      "Không dùng hom từ cây nghi nhiễm để nhân giống.",
      "Quản lý bọ phấn theo IPM và loại bỏ cây bệnh nặng khi ổ bệnh còn nhỏ.",
    ],
    prevention: [
      "Dùng giống sạch bệnh/chống chịu và kiểm tra nguồn hom trước khi trồng.",
      "Theo dõi bọ phấn và cây ký chủ phụ quanh ruộng.",
    ],
  },
  cassava_green_mottle: {
    severity: "Trung bình",
    pathogen: "Virus hoặc tác nhân gây khảm/đốm xanh cần xác minh thêm",
    pesticideType: "Không có thuốc trị virus trực tiếp; ưu tiên xác minh nguồn giống và côn trùng môi giới",
    riskLevel: 3,
    spreadSpeed: "Trung bình",
    symptoms: [
      "Lá xuất hiện đốm xanh loang hoặc khảm nhẹ, màu lá không đồng đều.",
      "Cần phân biệt với thiếu dinh dưỡng, stress môi trường hoặc ảnh chụp thiếu sáng.",
    ],
    treatment: [
      "Chụp thêm lá non và lá già ở nhiều vị trí để xác nhận triệu chứng có lặp lại không.",
      "Theo dõi cây nghi bệnh trong 5-7 ngày và kiểm tra côn trùng môi giới.",
      "Không dùng hom từ cây có triệu chứng bất thường để nhân giống.",
    ],
    prevention: [
      "Duy trì nguồn hom sạch bệnh và loại bỏ cây tự mọc/cây ký chủ phụ quanh ruộng.",
      "Bón phân cân đối để giảm nhầm lẫn với stress sinh lý.",
    ],
  },
  cassava_mosaic: {
    severity: "Nặng",
    pathogen: "Virus khảm lá sắn, thường lây qua bọ phấn và hom giống",
    pesticideType: "Không có thuốc trị virus trực tiếp; cần quản lý bọ phấn và nguồn hom",
    riskLevel: 5,
    spreadSpeed: "Nhanh",
    symptoms: [
      "Lá khảm xanh vàng rõ, biến dạng, xoăn hoặc nhỏ lại; cây có thể còi cọc.",
      "Bệnh lan mạnh qua hom giống nhiễm bệnh và bọ phấn môi giới.",
    ],
    treatment: [
      "Loại bỏ cây bệnh nặng sớm nếu mật độ còn thấp để giảm nguồn virus.",
      "Không lấy hom giống từ cây hoặc ruộng có triệu chứng khảm.",
      "Quản lý bọ phấn theo IPM, ưu tiên kiểm tra mặt dưới lá non.",
    ],
    prevention: [
      "Dùng giống sạch bệnh/chống chịu CMD và trồng nguồn hom đã kiểm tra.",
      "Vệ sinh ruộng, loại bỏ cây ký chủ phụ và theo dõi bọ phấn đầu vụ.",
    ],
  },
  mango_anthracnose: {
    severity: "Trung bình",
    pathogen: "Nấm Colletotrichum spp.",
    pesticideType: "Thuốc trừ nấm cho thán thư, ưu tiên luân phiên hoạt chất theo nhãn",
    riskLevel: 4,
    spreadSpeed: "Nhanh",
    symptoms: [
      "Lá, chồi hoặc trái có đốm nâu đen lõm, dễ lan trong thời tiết ẩm.",
      "Trái có thể bị thối đen sau thu hoạch hoặc khi mưa kéo dài.",
    ],
    treatment: [
      "Tỉa bỏ cành, lá, trái bệnh nặng và thu gom khỏi vườn.",
      "Tạo tán thông thoáng, hạn chế nước đọng trên lá và trái.",
      "Phun thuốc trừ nấm đúng nhãn khi bệnh lan hoặc thời tiết ẩm kéo dài.",
    ],
    prevention: [
      "Tỉa cành sau thu hoạch và vệ sinh tàn dư bệnh.",
      "Theo dõi chặt giai đoạn ra đọt non, ra hoa, đậu trái và trước thu hoạch.",
    ],
  },
  mango_bacterial_canker: {
    severity: "Nặng",
    pathogen: "Vi khuẩn gây loét",
    pesticideType: "Thuốc gốc đồng hoặc nhóm quản lý bệnh vi khuẩn theo nhãn",
    riskLevel: 4,
    spreadSpeed: "Trung bình",
    symptoms: [
      "Vết loét nâu đen trên lá, cành hoặc trái; có thể nứt và rỉ dịch.",
      "Bệnh dễ nặng hơn sau mưa gió, vết thương cơ giới hoặc vườn rậm ẩm.",
    ],
    treatment: [
      "Cắt bỏ mô bệnh nặng và sát trùng dụng cụ sau mỗi cây.",
      "Giảm tán rậm, tránh tưới phun mạnh làm bắn nguồn bệnh.",
      "Dùng sản phẩm phù hợp bệnh vi khuẩn theo nhãn nếu bệnh còn lan.",
    ],
    prevention: [
      "Hạn chế tạo vết thương khi cắt tỉa hoặc thu hoạch.",
      "Giữ vườn thông thoáng và theo dõi sau mưa bão.",
    ],
  },
  mango_cutting_weevil: {
    severity: "Trung bình",
    pathogen: "Côn trùng hại đọt/cành non",
    pesticideType: "Ưu tiên biện pháp IPM; dùng thuốc trừ sâu đúng nhãn khi mật độ cao",
    riskLevel: 3,
    spreadSpeed: "Trung bình",
    symptoms: [
      "Đọt non, cuống hoặc cành non bị cắn, héo gãy hoặc có vết đục.",
      "Có thể thấy mô non khô nhanh, sinh trưởng chậm và vết hại tập trung ở lộc non.",
    ],
    treatment: [
      "Cắt bỏ phần bị hại và kiểm tra ổ sâu hoặc côn trùng còn lại.",
      "Theo dõi đợt ra lộc non để can thiệp sớm nếu mật độ tăng.",
      "Áp dụng bẫy, vệ sinh vườn và thuốc đúng nhãn khi vượt ngưỡng.",
    ],
    prevention: [
      "Vệ sinh vườn, cắt tỉa tán rậm và theo dõi lộc non định kỳ.",
      "Không phun thuốc phổ rộng khi chưa xác nhận mật độ gây hại.",
    ],
  },
  mango_die_back: {
    severity: "Nặng",
    pathogen: "Nấm gây khô cành/chết ngọn",
    pesticideType: "Thuốc trừ nấm phù hợp bệnh khô cành, kết hợp cắt tỉa vệ sinh",
    riskLevel: 4,
    spreadSpeed: "Trung bình",
    symptoms: [
      "Đầu cành khô dần từ ngọn vào trong, lá héo nâu và cành suy kiệt.",
      "Vết bệnh thường nặng hơn ở cây stress, tán rậm hoặc sau giai đoạn mưa ẩm.",
    ],
    treatment: [
      "Cắt sâu dưới vùng mô bệnh và tiêu hủy cành bị hại.",
      "Bôi/sát trùng vết cắt theo quy trình canh tác an toàn.",
      "Cải thiện dinh dưỡng, thoát nước và dùng thuốc trừ nấm đúng nhãn nếu cần.",
    ],
    prevention: [
      "Tỉa tán thông thoáng sau thu hoạch và tránh để cây suy kiệt.",
      "Khử trùng dụng cụ cắt tỉa giữa các cây.",
    ],
  },
  mango_gall_midge: {
    severity: "Trung bình",
    pathogen: "Muỗi gây u sưng",
    pesticideType: "Quản lý côn trùng hại lá/đọt theo IPM",
    riskLevel: 3,
    spreadSpeed: "Trung bình",
    symptoms: [
      "Lá có nốt u/sưng nhỏ, mô lá biến dạng hoặc chấm nâu quanh vị trí hại.",
      "Đọt non có thể phát triển kém nếu mật độ gây hại cao.",
    ],
    treatment: [
      "Tỉa bỏ lá, đọt bị hại nặng và theo dõi đợt lộc non.",
      "Quản lý cỏ dại, tàn dư và nơi trú ẩn quanh vườn.",
      "Chỉ dùng thuốc khi mật độ cao và cần tuân thủ nhãn.",
    ],
    prevention: [
      "Theo dõi sớm ở giai đoạn ra lá non.",
      "Giữ vườn thông thoáng và hạn chế nguồn trú ẩn của côn trùng.",
    ],
  },
  mango_sooty_mould: {
    severity: "Trung bình",
    pathogen: "Nấm bồ hóng phát triển trên mật ngọt do rầy/rệp",
    pesticideType: "Ưu tiên quản lý rầy rệp; rửa tán và dùng thuốc đúng nhãn khi cần",
    riskLevel: 3,
    spreadSpeed: "Trung bình",
    symptoms: [
      "Bề mặt lá hoặc trái phủ lớp đen như muội than, dễ lau khi còn nhẹ.",
      "Thường đi kèm rầy mềm, rệp sáp, bọ phấn hoặc côn trùng tiết mật.",
    ],
    treatment: [
      "Kiểm tra và quản lý nhóm côn trùng tiết mật trên tán.",
      "Tỉa thông thoáng, rửa lớp bồ hóng nhẹ nếu phù hợp quy mô vườn.",
      "Dùng giải pháp quản lý côn trùng đúng nhãn, tránh lạm dụng thuốc phổ rộng.",
    ],
    prevention: [
      "Theo dõi rệp sáp, rầy mềm, bọ phấn trước khi bồ hóng phủ dày.",
      "Bảo vệ thiên địch và giữ tán cây thông thoáng.",
    ],
  },
  bean_angular_leaf_spot: {
    severity: "Trung bình",
    pathogen: "Nấm Pseudocercospora griseola",
    pesticideType: "Thuốc trừ nấm đốm lá phù hợp cho cây họ đậu, luân phiên hoạt chất theo nhãn",
    riskLevel: 3,
    spreadSpeed: "Trung bình",
    symptoms: [
      "Lá có đốm nâu xám dạng góc cạnh, thường bị giới hạn bởi gân lá.",
      "Vết bệnh nặng có thể khô rách, làm giảm diện tích quang hợp và sức sinh trưởng.",
    ],
    treatment: [
      "Tỉa bỏ lá bệnh nặng và thu gom tàn dư để giảm nguồn nấm.",
      "Giữ tán thông thoáng, hạn chế tưới phun lên lá vào chiều tối.",
      "Dùng thuốc trừ nấm đúng nhãn nếu bệnh lan nhanh sau mưa ẩm.",
    ],
    prevention: [
      "Dùng hạt giống sạch bệnh và luân canh với cây không cùng ký chủ.",
      "Không để ruộng quá rậm, ưu tiên thoát nước tốt sau mưa.",
    ],
  },
  bean_rust: {
    severity: "Trung bình",
    pathogen: "Nấm Uromyces appendiculatus",
    pesticideType: "Thuốc trừ nấm gỉ sắt phù hợp cho cây họ đậu, dùng đúng nhãn",
    riskLevel: 3,
    spreadSpeed: "Trung bình",
    symptoms: [
      "Mặt lá xuất hiện ổ bào tử màu nâu cam hoặc nâu gỉ, thường nổi rõ ở mặt dưới lá.",
      "Lá bệnh nặng vàng nhanh, khô sớm và làm giảm năng suất nếu lan rộng.",
    ],
    treatment: [
      "Loại bỏ lá bị bệnh nặng, tránh làm rơi vãi tàn dư trong ruộng.",
      "Tăng thông thoáng tán và hạn chế ẩm kéo dài trên mặt lá.",
      "Can thiệp thuốc trừ nấm gỉ sắt theo nhãn khi ổ bệnh lan nhanh.",
    ],
    prevention: [
      "Theo dõi sớm sau các đợt mưa, sương hoặc ruộng có mật độ dày.",
      "Luân canh và vệ sinh tàn dư sau vụ để giảm nguồn bào tử.",
    ],
  },
  nutrient_deficiency: {
    severity: "Trung bình",
    pathogen: "Mất cân đối dinh dưỡng",
    pesticideType: "Không dùng thuốc BVTV; ưu tiên kiểm tra đất, pH và phân bón",
    riskLevel: 2,
    spreadSpeed: "Chậm",
    symptoms: [
      "Lá vàng, nhạt màu, cháy mép hoặc phát triển kém tùy nguyên tố thiếu.",
      "Triệu chứng thường lặp lại theo tầng lá hoặc toàn cây, không tạo ổ bệnh lây lan rõ.",
    ],
    treatment: [
      "Kiểm tra pH, EC, độ ẩm và lịch bón phân gần đây.",
      "Bổ sung dinh dưỡng cân đối theo kết quả kiểm tra hoặc khuyến cáo địa phương.",
    ],
    prevention: ["Bón phân theo giai đoạn sinh trưởng.", "Theo dõi màu lá và sinh trưởng định kỳ để chỉnh sớm."],
  },
  bacterial_spot: {
    severity: "Trung bình",
    pathogen: "Vi khuẩn",
    pesticideType: "Thuốc gốc đồng hoặc hoạt chất chuyên trị vi khuẩn",
    riskLevel: 3,
    spreadSpeed: "Trung bình",
    symptoms: [
      "Xuất hiện đốm nhỏ sẫm màu, có thể viền vàng trên lá.",
      "Vết bệnh dễ lan mạnh khi mưa nhiều, tưới phun hoặc ẩm độ cao.",
    ],
    treatment: [
      "Tỉa bỏ lá bị nặng và tiêu hủy khỏi khu vực canh tác.",
      "Giảm tưới phun lên tán, ưu tiên tưới gốc để hạn chế lây lan.",
      "Cân nhắc thuốc phù hợp theo nhãn cho bệnh vi khuẩn và luân phiên hoạt chất.",
    ],
    prevention: [
      "Dùng cây giống sạch bệnh và khử trùng dụng cụ cắt tỉa.",
      "Giữ tán lá thông thoáng để lá khô nhanh sau mưa hoặc tưới.",
    ],
  },
  early_blight: {
    severity: "Trung bình",
    pathogen: "Nấm Alternaria spp.",
    pesticideType: "Thuốc trừ nấm phổ rộng, luân phiên hoạt chất",
    riskLevel: 3,
    spreadSpeed: "Trung bình",
    symptoms: [
      "Lá già có đốm nâu với vòng đồng tâm đặc trưng.",
      "Lá vàng dần quanh vết bệnh rồi khô cháy từ dưới lên.",
    ],
    treatment: [
      "Loại bỏ lá bệnh nặng để giảm nguồn nấm lưu tồn.",
      "Bón cân đối, bổ sung dinh dưỡng giúp cây phục hồi sức sinh trưởng.",
      "Phun thuốc trừ nấm đúng nhãn và luân phiên nhóm hoạt chất.",
    ],
    prevention: [
      "Không để ruộng quá ẩm kéo dài và tránh bón thừa đạm.",
      "Luân canh cây trồng, dọn sạch tàn dư sau vụ.",
    ],
  },
  late_blight: {
    severity: "Nặng",
    pathogen: "Giả nấm Phytophthora infestans",
    pesticideType: "Thuốc trừ sương mai/chết nhanh phù hợp giai đoạn bệnh",
    riskLevel: 5,
    spreadSpeed: "Nhanh",
    symptoms: [
      "Vết bệnh úng nước rồi nâu đen, lan rất nhanh khi ẩm mát.",
      "Mặt dưới lá có thể xuất hiện lớp mốc trắng ở rìa vết bệnh.",
    ],
    treatment: [
      "Cách ly khu vực bệnh nặng và loại bỏ mô bị hại nhiều.",
      "Giảm tưới chiều muộn, giữ ruộng thông thoáng để hạ ẩm.",
      "Can thiệp sớm bằng thuốc chuyên trị sương mai theo đúng nhãn.",
    ],
    prevention: [
      "Theo dõi sát sau mưa, sương đêm hoặc giai đoạn thời tiết mát ẩm.",
      "Không để tán quá rậm, tăng thoát nước chân ruộng.",
    ],
  },
  leaf_mold: {
    severity: "Trung bình",
    pathogen: "Nấm gây mốc lá",
    pesticideType: "Thuốc trừ nấm cho bệnh mốc lá",
    riskLevel: 3,
    spreadSpeed: "Trung bình",
    symptoms: [
      "Mặt trên lá vàng loang, mặt dưới có lớp mốc ô liu hoặc xám.",
      "Bệnh mạnh trong nhà màng hoặc nơi ẩm cao, ít thông thoáng.",
    ],
    treatment: [
      "Tỉa bớt lá già và tăng thông gió cho vườn hoặc nhà màng.",
      "Điều chỉnh tưới và ẩm độ để bề mặt lá khô nhanh hơn.",
      "Phun thuốc trừ nấm phù hợp, luân phiên hoạt chất.",
    ],
    prevention: [
      "Duy trì thông thoáng và khoảng cách cây hợp lý.",
      "Tránh để ẩm độ không khí cao kéo dài qua đêm.",
    ],
  },
  septoria_leaf_spot: {
    severity: "Trung bình",
    pathogen: "Nấm Septoria",
    pesticideType: "Thuốc trừ nấm tiếp xúc hoặc nội hấp phù hợp",
    riskLevel: 3,
    spreadSpeed: "Trung bình",
    symptoms: [
      "Nhiều đốm tròn nhỏ màu xám nâu, viền sẫm trên lá.",
      "Lá bệnh nặng sẽ vàng rồi rụng, làm cây suy yếu nhanh.",
    ],
    treatment: [
      "Thu gom lá rụng và lá bệnh để giảm nguồn lây.",
      "Tưới gốc thay vì tưới phun lên lá.",
      "Phun thuốc trừ nấm theo nhãn nếu bệnh lan rộng.",
    ],
    prevention: [
      "Vệ sinh tàn dư sau vụ và hạn chế nước bắn từ đất lên lá.",
      "Luân canh, giữ tán lá khô ráo hơn sau tưới.",
    ],
  },
  spider_mites: {
    severity: "Trung bình",
    pathogen: "Nhện đỏ hai chấm",
    pesticideType: "Thuốc đặc trị nhện hoặc giải pháp sinh học phù hợp",
    riskLevel: 4,
    spreadSpeed: "Nhanh",
    symptoms: [
      "Lá có chấm vàng li ti, bạc lá hoặc khô mép.",
      "Mặt dưới lá có thể thấy nhện nhỏ và tơ mịn.",
    ],
    treatment: [
      "Kiểm tra kỹ mặt dưới lá và cắt bỏ lá bị hại nặng.",
      "Tăng ẩm hợp lý nếu điều kiện quá khô nóng kéo dài.",
      "Sử dụng thuốc đặc trị nhện đúng nhãn và luân phiên hoạt chất.",
    ],
    prevention: [
      "Theo dõi sớm ở thời kỳ nắng nóng, khô hạn.",
      "Hạn chế lạm dụng thuốc phổ rộng làm giảm thiên địch.",
    ],
  },
  target_spot: {
    severity: "Trung bình",
    pathogen: "Nấm Corynespora hoặc nhóm tương tự",
    pesticideType: "Thuốc trừ nấm phổ phù hợp bệnh đốm lá",
    riskLevel: 3,
    spreadSpeed: "Trung bình",
    symptoms: [
      "Xuất hiện đốm tròn hoặc bất định, tâm đậm màu hơn xung quanh.",
      "Lá có thể vàng và rụng nếu bệnh phát triển kéo dài.",
    ],
    treatment: [
      "Tỉa bỏ bộ lá bị nhiễm nặng để giảm áp lực bệnh.",
      "Giữ ruộng thông thoáng và hạn chế đọng nước trên lá.",
      "Luân phiên thuốc trừ nấm theo khuyến cáo trên nhãn.",
    ],
    prevention: [
      "Dọn sạch tàn dư bệnh và tránh mật độ trồng quá dày.",
      "Theo dõi ruộng sau mưa hoặc thời kỳ ẩm kéo dài.",
    ],
  },
  yellow_leaf_curl_virus: {
    severity: "Nặng",
    pathogen: "Virus, thường lây qua bọ phấn trắng",
    pesticideType: "Không có thuốc trị virus trực tiếp; cần quản lý côn trùng môi giới",
    riskLevel: 5,
    spreadSpeed: "Nhanh",
    symptoms: [
      "Lá non vàng, cong xoăn, biến dạng và cây còi cọc.",
      "Sinh trưởng chậm, giảm đậu trái và năng suất rõ rệt.",
    ],
    treatment: [
      "Nhổ bỏ cây bệnh nặng để tránh lan sang cây khỏe.",
      "Kiểm soát bọ phấn trắng bằng biện pháp tổng hợp và đúng nhãn thuốc.",
      "Bổ sung chăm sóc để giảm stress cho những cây còn lại.",
    ],
    prevention: [
      "Dùng cây giống sạch bệnh và kiểm soát bọ phấn ngay từ đầu vụ.",
      "Vệ sinh cỏ dại, cây ký chủ phụ quanh ruộng.",
    ],
  },
  tomato_mosaic_virus: {
    severity: "Nặng",
    pathogen: "Virus khảm",
    pesticideType: "Không có thuốc trị virus trực tiếp",
    riskLevel: 4,
    spreadSpeed: "Trung bình",
    symptoms: [
      "Lá loang lổ xanh vàng kiểu khảm, có thể nhăn và biến dạng.",
      "Cây sinh trưởng kém, trái nhỏ hoặc chất lượng giảm.",
    ],
    treatment: [
      "Loại bỏ cây bị nặng và tránh thao tác lây cơ giới sang cây khỏe.",
      "Khử trùng tay, dụng cụ và hạn chế chạm cây khi cây ướt.",
      "Duy trì dinh dưỡng, tưới và vệ sinh tốt để giảm áp lực bệnh.",
    ],
    prevention: [
      "Sử dụng nguồn giống sạch bệnh và vệ sinh dụng cụ thường xuyên.",
      "Không hút thuốc hay xử lý cây bệnh rồi chạm sang cây khỏe mà không vệ sinh.",
    ],
  },
  powdery_mildew: {
    severity: "Trung bình",
    pathogen: "Nấm phấn trắng",
    pesticideType: "Thuốc trừ nấm cho phấn trắng hoặc biện pháp sinh học phù hợp",
    riskLevel: 3,
    spreadSpeed: "Trung bình",
    symptoms: ["Bề mặt lá có lớp phấn trắng xám, lá có thể cong hoặc kém phát triển."],
    treatment: [
      "Tăng thông thoáng, giảm độ ẩm kéo dài quanh tán.",
      "Loại bỏ lá nhiễm nặng và xử lý sớm nếu bệnh lan.",
    ],
    prevention: ["Giữ mật độ trồng hợp lý và theo dõi giai đoạn thời tiết thuận lợi cho nấm."],
  },
  black_rot: {
    severity: "Trung bình",
    pathogen: "Nấm gây thối đen",
    pesticideType: "Thuốc trừ nấm phổ phù hợp",
    riskLevel: 3,
    spreadSpeed: "Trung bình",
    symptoms: [
      "Đốm nâu đen hoặc mô thối sẫm màu trên lá, cành hay quả.",
      "Có thể lan nhanh hơn khi ẩm độ cao và mô cây bị tổn thương.",
    ],
    treatment: [
      "Loại bỏ bộ phận bệnh nặng và thu gom tiêu hủy.",
      "Giữ vườn thông thoáng, hạn chế ẩm kéo dài.",
      "Sử dụng thuốc trừ nấm phù hợp khi cần.",
    ],
    prevention: ["Vệ sinh tàn dư bệnh và tránh gây vết thương cơ giới không cần thiết."],
  },
  apple_scab: {
    severity: "Trung bình",
    pathogen: "Nấm Venturia",
    pesticideType: "Thuốc trừ nấm cho bệnh ghẻ táo",
    riskLevel: 3,
    spreadSpeed: "Trung bình",
    symptoms: ["Đốm sẫm màu trên lá và quả, bề mặt sần hoặc nứt về sau."],
    treatment: [
      "Cắt tỉa cho tán thông thoáng và thu gom lá bệnh rụng.",
      "Luân phiên thuốc trừ nấm phù hợp theo nhãn nếu bệnh lan rộng.",
    ],
    prevention: ["Vệ sinh tàn dư cuối vụ và giảm ẩm trong tán cây."],
  },
  cedar_apple_rust: {
    severity: "Trung bình",
    pathogen: "Nấm gỉ sắt",
    pesticideType: "Thuốc trừ nấm gỉ sắt phù hợp",
    riskLevel: 3,
    spreadSpeed: "Trung bình",
    symptoms: ["Đốm vàng cam nổi bật trên lá, có thể xuất hiện cấu trúc dạng gai ở mặt dưới."],
    treatment: [
      "Loại bỏ lá nhiễm nặng và theo dõi cây ký chủ gần đó.",
      "Phun thuốc phù hợp theo nhãn nếu bệnh lan rộng.",
    ],
    prevention: ["Giảm nguồn bệnh từ cây ký chủ phụ quanh vườn nếu có thể."],
  },
  gray_leaf_spot: {
    severity: "Trung bình",
    pathogen: "Nấm Cercospora",
    pesticideType: "Thuốc trừ nấm cho đốm lá ngô",
    riskLevel: 3,
    spreadSpeed: "Trung bình",
    symptoms: ["Đốm lá dài xám nâu, thường chạy dọc gân lá."],
    treatment: [
      "Theo dõi ruộng sau mưa và loại bỏ lá bệnh nặng nếu có thể.",
      "Luân phiên thuốc phù hợp theo nhãn khi áp lực bệnh cao.",
    ],
    prevention: ["Luân canh và xử lý tàn dư sau vụ."],
  },
  common_rust: {
    severity: "Trung bình",
    pathogen: "Nấm gỉ sắt",
    pesticideType: "Thuốc trừ nấm gỉ sắt phù hợp",
    riskLevel: 3,
    spreadSpeed: "Trung bình",
    symptoms: ["Mụn gỉ nhỏ màu nâu đỏ trên lá, dễ vỡ và phát tán bào tử."],
    treatment: ["Theo dõi giai đoạn phát triển và xử lý khi mật độ vết bệnh tăng nhanh."],
    prevention: ["Chọn giống chống chịu và quản lý đồng ruộng thông thoáng."],
  },
  northern_leaf_blight: {
    severity: "Trung bình",
    pathogen: "Nấm cháy lá ngô",
    pesticideType: "Thuốc trừ nấm cho cháy lá ngô",
    riskLevel: 3,
    spreadSpeed: "Trung bình",
    symptoms: ["Vết cháy dài hình thuyền, xám nâu trên lá ngô."],
    treatment: ["Theo dõi mức độ lan và xử lý nếu bệnh lan lên tầng lá quan trọng."],
    prevention: ["Luân canh và giảm nguồn tàn dư mang bệnh."],
  },
  esca: {
    severity: "Nặng",
    pathogen: "Tổ hợp nấm thân cành nho",
    pesticideType: "Ưu tiên cắt tỉa vệ sinh và quản lý vườn",
    riskLevel: 4,
    spreadSpeed: "Trung bình",
    symptoms: ["Lá loang màu và cây suy kiệt dần, có thể liên quan bệnh gỗ."],
    treatment: [
      "Cắt bỏ cành bệnh và vệ sinh dụng cụ kỹ.",
      "Theo dõi sức sinh trưởng toàn cây và đánh giá vết bệnh trên cành/thân.",
    ],
    prevention: ["Tránh tạo vết cắt lớn khi điều kiện ẩm thuận lợi cho nấm xâm nhập."],
  },
  grape_leaf_blight: {
    severity: "Trung bình",
    pathogen: "Nấm cháy lá nho",
    pesticideType: "Thuốc trừ nấm phù hợp bệnh cháy lá",
    riskLevel: 3,
    spreadSpeed: "Trung bình",
    symptoms: ["Đốm nâu hoặc vùng cháy trên lá nho, làm giảm diện tích quang hợp."],
    treatment: [
      "Tỉa tán và vệ sinh lá bệnh.",
      "Phun thuốc phù hợp khi bệnh lan rộng.",
    ],
    prevention: ["Giữ tán nho thông thoáng và giảm ẩm đọng trên lá."],
  },
  huanglongbing: {
    severity: "Nặng",
    pathogen: "Vi khuẩn HLB và côn trùng môi giới",
    pesticideType: "Không có thuốc trị dứt điểm; cần quản lý cây bệnh và côn trùng môi giới",
    riskLevel: 5,
    spreadSpeed: "Nhanh",
    symptoms: ["Lá vàng không đối xứng, cây suy yếu và trái kém chất lượng."],
    treatment: [
      "Kiểm tra thêm trên nhiều cành và cân nhắc loại bỏ cây bệnh nặng.",
      "Quản lý côn trùng môi giới và nguồn giống sạch bệnh.",
    ],
    prevention: ["Kiểm soát rầy chổng cánh và dùng cây giống sạch bệnh."],
  },
  leaf_scorch: {
    severity: "Trung bình",
    pathogen: "Nấm hoặc stress sinh lý cần đối chiếu thêm",
    pesticideType: "Ưu tiên kiểm tra nguyên nhân trước khi dùng thuốc",
    riskLevel: 3,
    spreadSpeed: "Trung bình",
    symptoms: [
      "Lá cháy mép hoặc cháy đầu lá, màu nâu sẫm tăng dần.",
      "Cần phân biệt với thiếu dinh dưỡng, cháy nắng hoặc tồn dư thuốc.",
    ],
    treatment: [
      "Kiểm tra chế độ tưới, phân bón và điều kiện thời tiết gần đây.",
      "Loại bỏ lá cháy nặng và theo dõi lá non mới ra.",
      "Chỉ dùng thuốc khi có thêm bằng chứng rõ về tác nhân gây bệnh.",
    ],
    prevention: ["Duy trì tưới và dinh dưỡng cân đối.", "Giảm stress nhiệt và tránh phun thuốc đậm đặc lúc nắng gắt."],
  },
  unknown: {
    severity: "Trung bình",
    pathogen: "Chưa xác định",
    pesticideType: "Cần kiểm tra thực địa trước khi dùng thuốc",
    riskLevel: 2,
    spreadSpeed: "Trung bình",
    symptoms: ["Model đã nhận diện được một nhãn nhưng chưa có cấu hình mô tả chi tiết."],
    treatment: ["Kiểm tra thêm triệu chứng ngoài đồng, mặt dưới lá, thân và điều kiện thời tiết gần đây."],
    prevention: ["Theo dõi thêm nhiều vị trí trên cây trước khi quyết định xử lý."],
  },
} as const;

const mapTopPredictions = (prediction: LocalDiagnosisPrediction, cropId: string) =>
  (prediction.topPredictions ?? []).map((item) => {
    const itemProfile = getLabelProfile(item.label, cropId);
    return {
      rawLabel: item.label,
      diseaseName: itemProfile?.diseaseName || item.label,
      cropName: itemProfile?.cropName || "Chưa xác định",
      confidence: Math.round(item.confidence * 100),
    };
  });

const getScopeAssessment = (prediction: LocalDiagnosisPrediction, cropId: string) => {
  const topPredictions = prediction.topPredictions ?? [];
  const top1 = topPredictions[0]?.confidence ?? prediction.confidence;
  const top2 = topPredictions[1]?.confidence ?? 0;
  const margin = top1 - top2;
  const normalizedCropId = cropId.trim().toLowerCase() as CropId;
  const thresholds = CROP_SCOPE_THRESHOLDS[normalizedCropId] || {
    confidence: LOW_CONFIDENCE_THRESHOLD,
    margin: LOW_MARGIN_THRESHOLD,
  };
  const cropVariety = new Set(
    topPredictions
      .slice(0, 3)
      .map((item) => getLabelProfile(item.label, cropId)?.cropName)
      .filter(Boolean)
  ).size;

  return {
    looksOutOfScope: top1 < thresholds.confidence || margin < thresholds.margin || cropVariety >= 2,
    margin,
  };
};

const buildLocalDiagnosis = (prediction: LocalDiagnosisPrediction, cropId: string) => {
  const profile = getLabelProfile(prediction.label, cropId) || {
    cropName: "Chưa xác định",
    diseaseName: prediction.label,
    diseaseKey: "unknown",
  };
  const confidence = Math.round(prediction.confidence * 100);
  const mappedTopPredictions = mapTopPredictions(prediction, cropId);
  const scopeAssessment = getScopeAssessment(prediction, cropId);

  if (scopeAssessment.looksOutOfScope) {
    const mostLikelyCrop = mappedTopPredictions[0]?.cropName || profile.cropName;
    const shouldKeepOriginalClassName = resolvePlantModel(cropId).id === "corn";
    return normalizeDiagnosis({
      diseaseName: shouldKeepOriginalClassName ? profile.diseaseName : "Ảnh có thể ngoài phạm vi nhận diện hoặc chưa đủ rõ",
      cropName: mostLikelyCrop,
      confidence,
      severity: "Cần kiểm tra thêm",
      symptoms: [
        "Model nhận diện được vài mẫu gần giống nhưng chưa đủ chắc để kết luận một bệnh cụ thể.",
        "Ảnh có thể chưa đủ rõ, không phải cây thuộc bộ dữ liệu huấn luyện, hoặc triệu chứng đang ở giai đoạn khó phân biệt.",
        "Nếu top dự đoán trải trên nhiều cây khác nhau, đây là dấu hiệu ảnh có thể ngoài phạm vi nhận diện.",
      ],
      treatment: [
        "Chụp lại ảnh cận vùng bệnh, đủ sáng và giảm bớt nền thừa.",
        "Đối chiếu thêm nhiều lá, mặt dưới lá và tình trạng ngoài đồng trước khi xử lý.",
        "Không nên quyết định phun thuốc chỉ dựa trên kết quả AI có độ tin cậy thấp hoặc biên phân tách thấp.",
      ],
      recommendation:
        "Hệ thống đang xem ảnh này là chưa đủ an toàn để kết luận chắc một bệnh cụ thể. Hãy xem top dự đoán bên dưới, đối chiếu cây trồng thật và chụp lại ảnh rõ hơn trước khi xử lý.",
      pathogen: "Chưa đủ chắc chắn",
      pesticideType: "Chưa nên khuyến nghị thuốc khi độ tin cậy thấp",
      riskLevel: 2,
      spreadSpeed: "Chưa xác định",
      prevention: [
        "Chụp thêm 2-3 ảnh ở các góc khác nhau với nền gọn hơn.",
        "Nếu có thể, đối chiếu với ảnh mẫu bệnh chuẩn trong dataset huấn luyện.",
      ],
      treatmentChecklist: [
        "Xác nhận cây trồng thật có nằm trong phạm vi bộ dữ liệu model không.",
        "Kiểm tra triệu chứng trên nhiều lá và vị trí khác nhau.",
        "Chụp lại ảnh rõ hơn trước khi tin vào dự đoán của AI.",
      ],
      rawLabel: prediction.label,
      topPredictions: mappedTopPredictions,
      confidenceBreakdown: {
        texture: Math.max(prediction.confidence, Math.min(1, scopeAssessment.margin + 0.2)),
        color: prediction.confidence,
        shape: Math.max(prediction.confidence, Math.min(1, scopeAssessment.margin + 0.15)),
      },
    });
  }

  if (profile.healthy) {
    return normalizeDiagnosis({
      diseaseName: profile.diseaseName,
      cropName: profile.cropName,
      confidence,
      severity: "Nhẹ",
      symptoms: [
        "Màu lá tương đối đồng đều, chưa thấy dấu hiệu tổn thương nổi bật.",
        "Chưa phát hiện rõ các mảng cháy, đốm bệnh hoặc biến dạng đặc trưng.",
      ],
      treatment: [
        "Tiếp tục chăm sóc theo quy trình hiện tại và theo dõi vườn định kỳ.",
        "Duy trì thông thoáng tán lá, tưới hợp lý và vệ sinh đồng ruộng.",
      ],
      recommendation:
        "Ảnh được model nhận diện là cây khỏe mạnh. Dù vậy vẫn nên quan sát thực địa thêm vì mô hình có thể tự tin quá mức với ảnh ngoài phân bố huấn luyện.",
      pathogen: "Không phát hiện tác nhân bệnh rõ ràng",
      pesticideType: "Chưa cần can thiệp thuốc",
      riskLevel: 1,
      spreadSpeed: "Chậm",
      prevention: [
        "Theo dõi mặt trên và mặt dưới lá mỗi 3-5 ngày.",
        "Giữ độ ẩm và mật độ trồng ổn định để hạn chế áp lực sâu bệnh.",
      ],
      treatmentChecklist: [
        "Kiểm tra các lá non và lá già ở nhiều vị trí.",
        "Theo dõi thêm nếu thời tiết ẩm hoặc xuất hiện côn trùng môi giới.",
      ],
      rawLabel: prediction.label,
      topPredictions: mappedTopPredictions,
      confidenceBreakdown: {
        texture: prediction.confidence,
        color: prediction.confidence,
        shape: prediction.confidence,
      },
    });
  }

  const diseaseDetails = diseaseDetailsByKey[profile.diseaseKey as keyof typeof diseaseDetailsByKey] || diseaseDetailsByKey.unknown;

  return normalizeDiagnosis({
    diseaseName: profile.diseaseName,
    cropName: profile.cropName,
    confidence,
    severity: diseaseDetails.severity,
    symptoms: diseaseDetails.symptoms,
    treatment: diseaseDetails.treatment,
    recommendation: `Model cục bộ nhận diện ảnh có khả năng cao là "${profile.diseaseName}" trên ${profile.cropName.toLowerCase()}. Dù kết quả khả quan, vẫn nên đối chiếu triệu chứng thực địa vì model có thể tự tin quá mức với ảnh ngoài phân bố huấn luyện.`,
    pesticideType: diseaseDetails.pesticideType,
    pathogen: diseaseDetails.pathogen,
    riskLevel: diseaseDetails.riskLevel,
    spreadSpeed: diseaseDetails.spreadSpeed,
    prevention: diseaseDetails.prevention,
    treatmentChecklist: [
      "Đối chiếu ít nhất 2-3 lá hoặc vị trí khác nhau trên cây.",
      "Kiểm tra điều kiện ẩm độ, mưa, côn trùng môi giới trong 3-7 ngày gần đây.",
      "Chỉ dùng thuốc khi đã xác nhận triệu chứng ngoài thực địa và tuân thủ nhãn.",
    ],
    rawLabel: prediction.label,
    topPredictions: mappedTopPredictions,
    confidenceBreakdown: {
      texture: prediction.confidence,
      color: prediction.confidence,
      shape: prediction.confidence,
    },
  });
};

const runLocalDiagnosis = async (imageData: string, cropId?: string): Promise<LocalDiagnosisPrediction> => {
  const plantModel = resolvePlantModel(cropId);

  if (!hasPlantModelAssets(plantModel.id)) {
    throw new Error("Thiếu file model local hoặc script suy luận trong thư mục AI.");
  }

  return await new Promise<LocalDiagnosisPrediction>((resolve, reject) => {
    const child = spawn("python3", [plantModel.inferenceScript], {
      stdio: ["pipe", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.stdin.on("error", (error: NodeJS.ErrnoException) => {
      if (error.code !== "EPIPE") {
        stderr += error.message;
      }
    });

    child.on("error", (error) => {
      reject(new Error(`Không thể chạy Python để suy luận model local: ${error.message}`));
    });

    child.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(stderr.trim() || "Suy luận model local thất bại."));
        return;
      }

      try {
        const parsed = JSON.parse(stdout) as LocalDiagnosisPrediction;
        resolve(parsed);
      } catch {
        reject(new Error("Model local trả về dữ liệu không hợp lệ."));
      }
    });

    try {
      child.stdin.write(
        JSON.stringify({
          imageData,
          modelPath: plantModel.modelPath,
          classNamesPath: plantModel.classNamesPath,
          imageSize: plantModel.imageSize,
          runtime: plantModel.runtime,
          normalization: plantModel.normalization,
        })
      );
      child.stdin.end();
    } catch (error) {
      if (!(error instanceof Error) || !("code" in error) || error.code !== "EPIPE") {
        reject(error instanceof Error ? error : new Error("Không thể gửi ảnh tới Python inference."));
      }
    }
  });
};

const callGeminiChatModel = async (client: GoogleGenAI, model: string, message: string, history: ChatMessage[]) => {
  const contents = [
    ...history.map((item) => ({
      role: item.role,
      parts: [{ text: item.text }],
    })),
    {
      role: "user" as const,
      parts: [{ text: formatChatPrompt(message) }],
    },
  ];

  const result = await client.models.generateContent({
    model,
    contents,
    config: {
      temperature: 0.3,
      maxOutputTokens: 1600,
      systemInstruction: consultationInstruction,
    },
  });

  return result.text?.trim() || "";
};

const callGeminiChat = async (message: string, history: ChatMessage[]): Promise<ChatProviderResult> => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Thiếu GEMINI_API_KEY trong file .env.");
  }

  const client = new GoogleGenAI({ apiKey });
  const errors: string[] = [];

  for (const model of getGeminiChatModelChain()) {
    try {
      const text = await callGeminiChatModel(client, model, message, history);
      return {
        text,
        provider: "gemini",
        model,
        fallbackModelUsed: model !== DEFAULT_GEMINI_MODEL,
      };
    } catch (error) {
      const detail = error instanceof Error ? error.message : "Không rõ lỗi.";
      errors.push(`${model}: ${detail}`);
      console.error(`Gemini chat model failed (${model}):`, error);
    }
  }

  throw new Error(`Gemini đang quá tải hoặc không khả dụng trên toàn bộ model dự phòng. ${errors.join(" | ")}`);
};

const callGeminiDiagnosis = async (imageData: string, cropId?: string) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Thiếu GEMINI_API_KEY trong file .env.");
  }

  const client = new GoogleGenAI({ apiKey });
  const result = await client.models.generateContent({
    model: DEFAULT_GEMINI_MODEL,
    contents: {
      parts: [
        {
          text: buildDiagnosisPrompt(cropId),
        },
        {
          inlineData: {
            mimeType: imageData.match(/^data:(.*?);base64,/)?.[1] || "image/jpeg",
            data: imageData.split(",")[1],
          },
        },
      ],
    },
    config: {
      temperature: 0.2,
      maxOutputTokens: 3000,
      responseMimeType: "application/json",
    },
  });

  return result.text?.trim() || "";
};

const callOpenAIChat = async (message: string, history: ChatMessage[]): Promise<ChatProviderResult> => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("Thiếu OPENAI_API_KEY trong file .env.");
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: DEFAULT_OPENAI_MODEL,
      messages: [
        { role: "system", content: consultationInstruction },
        ...history.map((item) => ({
          role: item.role === "model" ? "assistant" : "user",
          content: item.text,
        })),
        { role: "user", content: formatChatPrompt(message) },
      ],
      temperature: 0.3,
      max_tokens: 1600,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI chat error: ${await response.text()}`);
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  return {
    text: data.choices?.[0]?.message?.content?.trim() || "",
    provider: "openai",
    model: DEFAULT_OPENAI_MODEL,
  };
};

const callGroqChatModel = async (apiKey: string, model: string, message: string, history: ChatMessage[]) => {
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: consultationInstruction },
        ...history.map((item) => ({
          role: item.role === "model" ? "assistant" : "user",
          content: item.text,
        })),
        { role: "user", content: formatChatPrompt(message) },
      ],
      temperature: 0.3,
      max_tokens: 1600,
    }),
  });

  if (!response.ok) {
    throw new Error(`Groq chat error: ${await response.text()}`);
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  return data.choices?.[0]?.message?.content?.trim() || "";
};

const callGroqChat = async (message: string, history: ChatMessage[]): Promise<ChatProviderResult> => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("Thiếu GROQ_API_KEY trong file .env.");
  }

  const errors: string[] = [];

  for (const model of getGroqChatModelChain()) {
    try {
      const text = await callGroqChatModel(apiKey, model, message, history);
      return {
        text,
        provider: "groq",
        model,
        fallbackModelUsed: model !== DEFAULT_GROQ_MODEL,
      };
    } catch (error) {
      const detail = error instanceof Error ? error.message : "Không rõ lỗi.";
      errors.push(`${model}: ${detail}`);
      console.error(`Groq chat model failed (${model}):`, error);
    }
  }

  throw new Error(`Groq đang quá tải hoặc không khả dụng trên toàn bộ model dự phòng. ${errors.join(" | ")}`);
};

const callOpenRouterChat = async (message: string, history: ChatMessage[]): Promise<ChatProviderResult> => {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("Thiếu OPENROUTER_API_KEY trong file .env.");
  }

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": process.env.APP_URL || "https://terraform-flora--agropro-ai.vercel.app",
      "X-Title": "Terraform Flora",
    },
    body: JSON.stringify({
      model: DEFAULT_OPENROUTER_MODEL,
      messages: [
        { role: "system", content: consultationInstruction },
        ...history.map((item) => ({
          role: item.role === "model" ? "assistant" : "user",
          content: item.text,
        })),
        { role: "user", content: formatChatPrompt(message) },
      ],
      temperature: 0.3,
      max_tokens: 1600,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenRouter chat error: ${await response.text()}`);
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  return {
    text: data.choices?.[0]?.message?.content?.trim() || "",
    provider: "openrouter",
    model: DEFAULT_OPENROUTER_MODEL,
  };
};

const callChatProvider = (provider: RemoteProvider, message: string, history: ChatMessage[]) =>
  provider === "openai"
    ? callOpenAIChat(message, history)
    : provider === "groq"
      ? callGroqChat(message, history)
      : provider === "openrouter"
        ? callOpenRouterChat(message, history)
      : callGeminiChat(message, history);

const callFlexibleChat = async (message: string, history: ChatMessage[]) => {
  const errors: string[] = [];

  for (const provider of getChatProviderChain()) {
    try {
      const result = await callChatProvider(provider, message, history);
      return {
        ...result,
        fallbackUsed: errors.length > 0 || Boolean(result.fallbackModelUsed),
      };
    } catch (error) {
      const detail = error instanceof Error ? error.message : "Không rõ lỗi.";
      errors.push(`${provider}: ${detail}`);
      console.error(`AI chat provider failed (${provider}):`, error);
    }
  }

  return {
    text: buildOfflineChatFallback(message, errors),
    provider: "fallback" as const,
    model: "offline-safety-fallback",
    fallbackUsed: true,
  };
};

const callOpenAIDiagnosis = async (imageData: string, cropId?: string) => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("Thiếu OPENAI_API_KEY trong file .env.");
  }

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: DEFAULT_OPENAI_MODEL,
      instructions: buildDiagnosisPrompt(cropId),
      input: [
        {
          role: "user",
          content: [
            { type: "input_text", text: "Phân tích ảnh cây trồng này và trả JSON đúng schema." },
            { type: "input_image", image_url: imageData },
          ],
        },
      ],
      max_output_tokens: 3000,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI diagnosis error: ${await response.text()}`);
  }

  const data = (await response.json()) as { output_text?: string };
  return data.output_text?.trim() || "";
};

const callGroqDiagnosis = async (imageData: string, cropId?: string) => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("Thiếu GROQ_API_KEY trong file .env.");
  }

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: DEFAULT_GROQ_DIAGNOSIS_MODEL,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: buildDiagnosisPrompt(cropId),
            },
            {
              type: "image_url",
              image_url: {
                url: imageData,
              },
            },
          ],
        },
      ],
      temperature: 0.2,
      max_completion_tokens: 3000,
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    throw new Error(`Groq diagnosis error: ${await response.text()}`);
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  return data.choices?.[0]?.message?.content?.trim() || "";
};

const callOpenRouterDiagnosis = async (imageData: string, cropId?: string) => {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("Thiếu OPENROUTER_API_KEY trong file .env.");
  }

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": process.env.APP_URL || "https://terraform-flora--agropro-ai.vercel.app",
      "X-Title": "Terraform Flora",
    },
    body: JSON.stringify({
      model: DEFAULT_OPENROUTER_DIAGNOSIS_MODEL,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: buildDiagnosisPrompt(cropId),
            },
            {
              type: "image_url",
              image_url: {
                url: imageData,
              },
            },
          ],
        },
      ],
      temperature: 0.2,
      max_tokens: 3000,
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenRouter diagnosis error: ${await response.text()}`);
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  return data.choices?.[0]?.message?.content?.trim() || "";
};

export async function createApp() {
  const app = express();

  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
    if (req.method === "OPTIONS") {
      return res.sendStatus(204);
    }
    next();
  });

  app.use(express.json({ limit: "50mb" }));

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", message: "Terraform Flora API is active" });
  });

  app.post("/api/payments/vnpay/create", (req, res) => {
    const { orderId, orderCode, amount } = req.body as {
      orderId?: string;
      orderCode?: string;
      amount?: number;
      customerName?: string;
    };

    if (!VNPAY_TMN_CODE || !VNPAY_HASH_SECRET) {
      return jsonError(res, 500, "Chưa cấu hình VNPAY_TMN_CODE hoặc VNPAY_HASH_SECRET.");
    }

    if (!orderId?.trim() || !orderCode?.trim() || !Number.isFinite(amount) || Number(amount) <= 0) {
      return jsonError(res, 400, "Thiếu thông tin đơn hàng hợp lệ để tạo thanh toán VNPay.");
    }

    const now = new Date();
    const ipAddr = String(
      req.headers["x-forwarded-for"] ||
        req.socket.remoteAddress ||
        req.ip ||
        "127.0.0.1"
    ).split(",")[0];
    const returnUrl = VNPAY_RETURN_URL || `${getRequestBaseUrl(req)}/api/payments/vnpay/return`;
    const txnRef = orderId.trim();

    const signedParams = sortVnpayParams({
      vnp_Version: "2.1.0",
      vnp_Command: "pay",
      vnp_TmnCode: VNPAY_TMN_CODE,
      vnp_Locale: "vn",
      vnp_CurrCode: "VND",
      vnp_TxnRef: txnRef,
      vnp_OrderInfo: `Thanh toan don hang ${orderCode.trim()}`,
      vnp_OrderType: "other",
      vnp_Amount: Math.round(Number(amount)) * 100,
      vnp_ReturnUrl: returnUrl,
      vnp_IpAddr: ipAddr,
      vnp_CreateDate: formatVnpayDate(now),
    });

    const paymentUrl = `${VNPAY_PAYMENT_URL}?${stringifyVnpayParams({
      ...signedParams,
      vnp_SecureHash: signVnpayParams(signedParams),
    })}`;

    return res.json({ paymentUrl });
  });

  app.get("/api/payments/vnpay/return", async (req, res) => {
    const { valid, params: queryParams } = verifyVnpayQuery(readVnpayQueryParams(req));

    if (!valid) {
      return res.redirect(
        buildClientVnpayRedirect(req, {
          vnpay_status: "failed",
          vnpay_code: "97",
        })
      );
    }

    const orderId = queryParams.vnp_TxnRef || "";
    const isPaid = queryParams.vnp_ResponseCode === "00" && queryParams.vnp_TransactionStatus === "00";

    try {
      if (orderId) {
        await updateServerShopOrderPayment(orderId, isPaid ? "paid" : "failed", isPaid ? "confirmed" : "pending");
      }
    } catch (error) {
      console.error("VNPay return order update error:", error);
    }

    return res.redirect(
      buildClientVnpayRedirect(req, {
        vnpay_status: isPaid ? "success" : "failed",
        vnpay_code: queryParams.vnp_ResponseCode || "unknown",
        orderId,
      })
    );
  });

  app.get("/api/payments/vnpay/ipn", async (req, res) => {
    const { valid, params: queryParams } = verifyVnpayQuery(readVnpayQueryParams(req));

    if (!valid) {
      return res.status(200).json({ RspCode: "97", Message: "Checksum failed" });
    }

    const orderId = queryParams.vnp_TxnRef || "";
    const responseCode = queryParams.vnp_ResponseCode || "";
    const transactionStatus = queryParams.vnp_TransactionStatus || "";
    const vnpayAmount = Number(queryParams.vnp_Amount || 0);

    if (!orderId) {
      return res.status(200).json({ RspCode: "01", Message: "Order not found" });
    }

    try {
      const order = await getServerShopOrder(orderId);

      if (!order) {
        return res.status(200).json({ RspCode: "01", Message: "Order not found" });
      }

      if (Math.round(Number(order.total)) * 100 !== vnpayAmount) {
        return res.status(200).json({ RspCode: "04", Message: "Amount invalid" });
      }

      if (order.payment_status !== "pending") {
        return res.status(200).json({ RspCode: "02", Message: "This order has been updated to the payment status" });
      }

      const isPaid = responseCode === "00" && transactionStatus === "00";
      await updateServerShopOrderPayment(orderId, isPaid ? "paid" : "failed", isPaid ? "confirmed" : "pending");

      return res.status(200).json({ RspCode: "00", Message: "Success" });
    } catch (error) {
      console.error("VNPay IPN error:", error);
      return res.status(200).json({ RspCode: "99", Message: "Unknown error" });
    }
  });

  app.get("/api/ai/status", async (_req, res) => {
    const diagnosisProvider = getDiagnosisProvider();
    const defaultPlantModel = resolvePlantModel();
    const runtime = diagnosisProvider === "local" || hasLocalDiagnosisAssets()
      ? await inspectLocalRuntime()
      : {
          pythonAvailable: false,
          onnxRuntimeAvailable: false,
        };

    res.json({
      status: "ok",
      configuredProvider: getProvider(),
      diagnosisProvider,
      chatProvider: getChatProviderLabel(),
      local: {
        assetsPresent: hasPlantModelAssets(defaultPlantModel.id),
        modelPath: defaultPlantModel.modelPath,
        classNamesPath: defaultPlantModel.classNamesPath,
        inferenceScript: defaultPlantModel.inferenceScript,
        imageSize: defaultPlantModel.imageSize,
        modelFamily: defaultPlantModel.id,
        runtime: defaultPlantModel.runtime,
        normalization: defaultPlantModel.normalization,
        ...runtime,
      },
      plantModels: Object.values(PLANT_MODEL_REGISTRY).map((item) => ({
        id: item.id,
        cropName: item.cropName,
        model: path.basename(item.modelPath),
        classNames: path.basename(item.classNamesPath),
        inferenceScript: path.basename(item.inferenceScript),
        runtime: item.runtime,
        normalization: item.normalization,
        assetsPresent: hasPlantModelAssets(item.id),
      })),
      supabaseEnv: {
        usesLegacyCompatibleNames: true,
      },
    });
  });

  app.post("/api/ai/chat", async (req, res) => {
    const { message, history = [], clientContext } = req.body as {
      message?: string;
      history?: ChatMessage[];
      clientContext?: ChatRagClientContext;
    };

    if (!message?.trim()) {
      return jsonError(res, 400, "Thiếu nội dung câu hỏi.");
    }

    try {
      if (!isAgricultureScopedMessage(message)) {
        return res.json({
          text: buildOutOfScopeChatResponse(message),
          provider: "local",
          model: "agriculture-scope-guard",
          fallbackUsed: false,
          rag: {
            intent: "out_of_scope",
            sourceCount: 0,
            corpusCount: 0,
            enoughData: false,
            normalizedQuery: normalizeSearchText(message),
            rewrittenQuery: normalizeSearchText(message),
            sources: [],
          },
        });
      }

      const rag = await buildRagContext(message, clientContext);
      const augmentedPrompt = rag.documents.length
        ? buildRagAugmentedPrompt(message, rag)
        : buildGeneralModelPrompt(message, rag);
      const recentHistory = Array.isArray(history) ? history.slice(-8) : [];
      const result = await callFlexibleChat(augmentedPrompt, recentHistory);
      const ragOnlyFallback = result.provider === "fallback" ? buildRagOnlyFallbackAnswer(rag) : "";

      return res.json({
        text: ragOnlyFallback || result.text || "Tôi chưa tạo được phản hồi phù hợp. Bạn thử hỏi chi tiết hơn nhé.",
        provider: result.provider,
        model: result.model,
        fallbackUsed: result.fallbackUsed,
        rag: {
          intent: rag.intent,
          sourceCount: rag.documents.length,
          corpusCount: rag.corpusCount,
          enoughData: rag.enoughData,
          normalizedQuery: rag.normalizedQuery,
          rewrittenQuery: rag.rewrittenQuery,
          sources: rag.documents.map((document) => ({
            id: document.id,
            title: document.title,
            source: document.source,
            score: document.score,
            metadata: document.metadata ?? {},
          })),
        },
      });
    } catch (error) {
      console.error("AI chat error:", error);
      return jsonError(
        res,
        500,
        error instanceof Error ? error.message : "Không thể kết nối tới dịch vụ AI."
      );
    }
  });

  app.post("/api/ai/diagnose", async (req, res) => {
    const { imageData, cropId } = req.body as { imageData?: string; cropId?: string };

    if (!imageData?.startsWith("data:image")) {
      return jsonError(res, 400, "Thiếu ảnh hợp lệ để phân tích.");
    }

    const requestedCropId = cropId?.trim().toLowerCase();
    if (!isSupportedCropId(requestedCropId)) {
      return jsonError(
        res,
        400,
        `Loại cây không được hỗ trợ hoặc chưa được chọn: ${cropId || "trống"}.`
      );
    }

    try {
      const provider = getDiagnosisProvider();
      const plantModel = resolvePlantModel(requestedCropId);

      if (usesLocalOnlyDiagnosis(plantModel.id) && !hasPlantModelAssets(plantModel.id)) {
        return jsonError(
          res,
          500,
          `Thiếu model gốc cho ${plantModel.cropName}. Kiểm tra ${path.basename(plantModel.modelPath)}, ${path.basename(plantModel.classNamesPath)} và ${path.basename(plantModel.inferenceScript)} trong thư mục AI.`
        );
      }

      if (shouldUseLocalDiagnosis(plantModel.id)) {
        const prediction = await runLocalDiagnosis(imageData, plantModel.id);
        return res.json({
          ...buildLocalDiagnosis(prediction, plantModel.id),
          provider: "local",
          model: prediction.selectedModel
            ? `${path.basename(plantModel.modelPath)} • ${prediction.selectedModel}`
            : path.basename(plantModel.modelPath),
        });
      }

      const errors: string[] = [];

      for (const remoteProvider of getDiagnosisProviderChain()) {
        try {
          const text = remoteProvider === "openai"
            ? await callOpenAIDiagnosis(imageData, plantModel.id)
            : remoteProvider === "groq"
              ? await callGroqDiagnosis(imageData, plantModel.id)
              : remoteProvider === "openrouter"
                ? await callOpenRouterDiagnosis(imageData, plantModel.id)
            : await callGeminiDiagnosis(imageData, plantModel.id);
          const parsed = parseJsonObject(text);

          if (parsed) {
            return res.json({
              ...normalizeDiagnosis(parsed),
              provider: remoteProvider,
              model:
                remoteProvider === "openai"
                  ? DEFAULT_OPENAI_MODEL
                  : remoteProvider === "groq"
                    ? DEFAULT_GROQ_DIAGNOSIS_MODEL
                    : remoteProvider === "openrouter"
                      ? DEFAULT_OPENROUTER_DIAGNOSIS_MODEL
                    : DEFAULT_GEMINI_MODEL,
              fallbackUsed: remoteProvider !== provider,
            });
          }

          const preview = text.replace(/\s+/g, " ").slice(0, 240);
          errors.push(`${remoteProvider}: invalid JSON (${preview || "empty response"})`);
          console.warn(`AI diagnosis provider returned invalid JSON (${remoteProvider}):`, preview);
        } catch (error) {
          const detail = error instanceof Error ? error.message : "Không rõ lỗi.";
          errors.push(`${remoteProvider}: ${detail}`);
          console.error(`AI diagnosis provider failed (${remoteProvider}):`, error);
        }
      }

      return jsonError(
        res,
        502,
        `AI trả về dữ liệu không đúng định dạng JSON. ${errors.join(" | ")}`
      );
    } catch (error) {
      console.error("AI diagnosis error:", error);
      return jsonError(
        res,
        500,
        error instanceof Error ? error.message : "Không thể phân tích ảnh lúc này."
      );
    }
  });

  app.use("/api", (req, res) => {
    res.status(404).json({
      error: `Không tìm thấy API endpoint ${req.method} ${req.originalUrl}.`,
    });
  });

  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  return app;
}

const isMainModule = process.argv[1] ? path.resolve(process.argv[1]) === __filename : false;

if (isMainModule) {
  createApp().then((app) => {
    app.listen(DEFAULT_PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${DEFAULT_PORT}`);
    });
  });
}
