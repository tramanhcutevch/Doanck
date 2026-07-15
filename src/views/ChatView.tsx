import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Bot,
  Check,
  ClipboardList,
  Copy,
  Leaf,
  Loader2,
  MessageSquareText,
  Microscope,
  RotateCcw,
  Send,
  ShieldCheck,
  Sparkles,
  Trash2,
  User,
  WandSparkles,
} from "lucide-react";
import { motion } from "motion/react";
import { AppUser, ProtocolBookmark, ShopCartItem, ShopOrder, ShopProduct } from "../types";
import { AIConversationMessage, ChatRagClientContext, getAIConsultationResult } from "../services/aiService";
import { listAdminUsers } from "../services/adminUserService";
import { listCommunityComments, listCommunityCommentsByAuthor, listCommunityPosts, listCommunityPostsByAuthor } from "../services/communityService";
import { listDiagnoses } from "../services/diagnosisService";
import { collection, db, getDocs, limit, orderBy, query, where } from "../lib/localDb";
import { listGrowthCycles, listGrowthPhotos, listGrowthTasks } from "../services/growthTrackingService";
import { getLibraryBookmarks, loadLibraryArticles } from "../services/libraryService";
import { listOrderSupportMessages } from "../services/orderSupportService";
import { getPesticideLibrary } from "../services/pesticideLibraryService";
import { getRecommendationProfiles } from "../services/recommendationDataService";
import { getShopBootstrap, getShopCart } from "../services/shopService";
import { LocalizedDictionary, useI18n } from "../i18n";

interface ChatViewProps {
  user?: AppUser | null;
}

interface ChatMessage extends AIConversationMessage {
  id: string;
  createdAt: string;
  isError?: boolean;
  provider?: string;
  model?: string;
  fallbackUsed?: boolean;
  rag?: {
    intent: string;
    sourceCount: number;
    sources: Array<{
      id: string;
      title: string;
      source: string;
      score: number;
      metadata?: Record<string, string | number | boolean | null>;
    }>;
  };
}

const chatText: LocalizedDictionary = {
  starterMessage: {
    vi: "Xin chào, tôi có thể hỗ trợ chẩn đoán sâu bệnh, kỹ thuật canh tác, lịch chăm sóc và gợi ý xử lý an toàn cho cây trồng của bạn.",
    en: "Hello, I can help diagnose pests and diseases, advise on cultivation techniques, plan care schedules, and suggest safe crop treatments.",
    ja: "こんにちは。病害虫診断、栽培技術、管理スケジュール、安全な対処提案をサポートできます。",
  },
  noAiResponse: { vi: "Không có phản hồi từ AI.", en: "No response from AI.", ja: "AIからの応答がありません。" },
  aiError: {
    vi: "Xin lỗi, tôi gặp sự cố khi kết nối với hệ thống AI. Vui lòng thử lại sau.",
    en: "Sorry, I had trouble connecting to the AI system. Please try again later.",
    ja: "申し訳ありません。AIシステムへの接続で問題が発生しました。後でもう一度お試しください。",
  },
  extraRequest: { vi: "Yêu cầu thêm", en: "Additional request", ja: "追加依頼" },
  clearMessage: {
    vi: "Cuộc trò chuyện đã được làm mới. Bạn có thể bắt đầu bằng câu hỏi mới về cây trồng, sâu bệnh hoặc lịch chăm sóc.",
    en: "The conversation has been refreshed. You can start with a new question about crops, pests, diseases, or care schedules.",
    ja: "会話を更新しました。作物、病害虫、管理スケジュールについて新しい質問から始められます。",
  },
  heroBadge: { vi: "Cố vấn nông nghiệp AI", en: "AI agriculture advisor", ja: "AI農業アドバイザー" },
  heroTitle: { vi: "Trợ lý AI nông nghiệp", en: "AI agriculture assistant", ja: "AI農業アシスタント" },
  heroTitleAccent: {
    vi: " luôn sẵn sàng hỗ trợ mùa vụ của bạn.",
    en: " ready to support your growing season.",
    ja: " が栽培シーズンをいつでも支援します。",
  },
  heroDesc: {
    vi: "Dùng như một bàn điều khiển tư vấn nông nghiệp: hỏi nhanh, bám ngữ cảnh, tái sử dụng prompt, sao chép kết quả và chuyển hội thoại thành checklist hành động.",
    en: "Use it like an agriculture advisory workspace: ask quickly, keep context, reuse prompts, copy results, and turn conversations into action checklists.",
    ja: "農業相談のワークスペースとして、素早く質問し、文脈を保ち、プロンプトを再利用し、結果をコピーして会話を行動チェックリストにできます。",
  },
  sessionHistory: { vi: "Lịch sử phiên", en: "Session history", ja: "セッション履歴" },
  questionsSent: { vi: "Lượt hỏi đã gửi", en: "Questions sent", ja: "送信した質問" },
  aiReplies: { vi: "Phản hồi AI", en: "AI replies", ja: "AI応答" },
  validReplies: { vi: "Phản hồi hợp lệ", en: "Valid replies", ja: "有効な応答" },
  status: { vi: "Trạng thái", en: "Status", ja: "状態" },
  processing: { vi: "Đang xử lý", en: "Processing", ja: "処理中" },
  ready: { vi: "Sẵn sàng", en: "Ready", ja: "準備完了" },
  realtimeReply: { vi: "Phản hồi thời gian thực", en: "Real-time reply", ja: "リアルタイム応答" },
  quickTools: { vi: "Công cụ nhanh", en: "Quick tools", ja: "クイックツール" },
  speedUpChat: { vi: "Tăng tốc hội thoại", en: "Speed up the conversation", ja: "会話を素早く進める" },
  usageTips: { vi: "Gợi ý sử dụng", en: "Usage tip", ja: "使い方のヒント" },
  usageTipDesc: {
    vi: "Càng mô tả rõ cây trồng, giai đoạn, triệu chứng, thời tiết và lịch chăm sóc gần đây thì phản hồi AI càng hữu ích.",
    en: "The clearer you describe the crop, stage, symptoms, weather, and recent care history, the more useful the AI response will be.",
    ja: "作物、成長段階、症状、天候、最近の管理履歴を詳しく書くほど、AIの回答は役立ちます。",
  },
  promptLibrary: { vi: "Prompt Library", en: "Prompt Library", ja: "プロンプト集" },
  aiCapabilities: { vi: "Năng lực AI", en: "AI capabilities", ja: "AI機能" },
  workspaceTitle: { vi: "AgroPro AI Workspace", en: "AgroPro AI Workspace", ja: "AgroPro AI Workspace" },
  workspaceDesc: {
    vi: "Tư vấn theo ngữ cảnh canh tác, sâu bệnh và thao tác mùa vụ",
    en: "Context-aware advice for cultivation, pests, diseases, and seasonal tasks",
    ja: "栽培、病害虫、季節作業に合わせた文脈対応アドバイス",
  },
  askAgain: { vi: "Hỏi lại", en: "Ask again", ja: "もう一度質問" },
  clearChat: { vi: "Xóa chat", en: "Clear chat", ja: "チャット削除" },
  quickStart: { vi: "Khởi động nhanh", en: "Quick start", ja: "クイック開始" },
  quickStartTitle: {
    vi: "Chọn một hướng hỏi để bắt đầu nhanh hơn",
    en: "Choose a question direction to start faster",
    ja: "質問の方向を選んで素早く始めましょう",
  },
  you: { vi: "Bạn", en: "You", ja: "あなた" },
  errorReply: { vi: "Phản hồi lỗi", en: "Error reply", ja: "エラー応答" },
  aiReply: { vi: "Phản hồi AI", en: "AI reply", ja: "AI応答" },
  fallbackUsed: { vi: "Đã tự chuyển model", en: "Auto-switched model", ja: "モデル自動切替" },
  ragSource: { vi: "Nguồn RAG", en: "RAG sources", ja: "RAGソース" },
  copied: { vi: "Đã chép", en: "Copied", ja: "コピー済み" },
  copy: { vi: "Sao chép", en: "Copy", ja: "コピー" },
  thinking: { vi: "AgroPro AI đang suy luận", en: "AgroPro AI is thinking", ja: "AgroPro AIが推論中" },
  inputPlaceholder: {
    vi: "Mô tả cây trồng, giai đoạn, triệu chứng, thời tiết hoặc mục tiêu bạn muốn AI hỗ trợ...",
    en: "Describe the crop, stage, symptoms, weather, or goal you want AI to help with...",
    ja: "作物、成長段階、症状、天候、AIに支援してほしい目的を入力してください...",
  },
  enterHint: { vi: "`Enter` để gửi, `Shift + Enter` để xuống dòng.", en: "`Enter` to send, `Shift + Enter` for a new line.", ja: "`Enter`で送信、`Shift + Enter`で改行。" },
  questionCountSuffix: { vi: "câu hỏi trong phiên này", en: "questions in this session", ja: "件の質問があります" },
};

const promptGroups = [
  {
    key: "diagnosis",
    title: { vi: "Chẩn đoán nhanh", en: "Quick diagnosis", ja: "クイック診断" },
    icon: Microscope,
    prompts: [
      { vi: "Lá lúa bị vàng đầu lá và có đốm nâu, nên kiểm tra gì trước?", en: "Rice leaves have yellow tips and brown spots. What should I check first?", ja: "イネの葉先が黄色く、褐色斑があります。まず何を確認すべきですか？" },
      { vi: "Cây cà chua xoăn lá, nguyên nhân nào thường gặp nhất?", en: "Tomato leaves are curling. What are the most common causes?", ja: "トマトの葉が巻いています。よくある原因は何ですか？" },
      { vi: "Giúp tôi phân biệt nấm bệnh và thiếu dinh dưỡng trên lá.", en: "Help me distinguish leaf fungal disease from nutrient deficiency.", ja: "葉の糸状菌病と栄養不足の違いを見分ける方法を教えてください。" },
    ],
  },
  {
    key: "planning",
    title: { vi: "Lập kế hoạch chăm sóc", en: "Care planning", ja: "管理計画" },
    icon: ClipboardList,
    prompts: [
      { vi: "Lập kế hoạch chăm sóc 7 ngày cho dưa leo giai đoạn ra hoa.", en: "Create a 7-day care plan for cucumber during flowering.", ja: "開花期のキュウリの7日間管理計画を作ってください。" },
      { vi: "Những việc cần kiểm tra hàng ngày cho vườn rau thủy canh?", en: "What should I check daily in a hydroponic vegetable garden?", ja: "水耕野菜園で毎日確認すべきことは何ですか？" },
      { vi: "Tạo checklist chăm sóc xoài non sau mưa kéo dài.", en: "Create a care checklist for young mango trees after prolonged rain.", ja: "長雨後の若いマンゴーの管理チェックリストを作ってください。" },
    ],
  },
  {
    key: "safety",
    title: { vi: "An toàn và xử lý", en: "Safety and treatment", ja: "安全と対処" },
    icon: ShieldCheck,
    prompts: [
      { vi: "Nếu phun thuốc BVTV thì cần lưu ý an toàn gì?", en: "What safety precautions matter when spraying crop protection products?", ja: "農薬を散布する時に重要な安全注意点は何ですか？" },
      { vi: "Khi nào nên ưu tiên biện pháp sinh học thay vì hóa học?", en: "When should biological control be prioritized over chemical treatment?", ja: "化学的処理より生物的対策を優先すべき時はいつですか？" },
      { vi: "Hướng dẫn xử lý khi cây có dấu hiệu sốc nước.", en: "Guide me on handling plants showing water-stress symptoms.", ja: "水ストレスの兆候がある植物への対処を教えてください。" },
    ],
  },
];

const quickActions = [
  { vi: "Tóm tắt ngắn gọn", en: "Summarize briefly", ja: "短く要約" },
  { vi: "Cho checklist thao tác", en: "Make an action checklist", ja: "作業チェックリスト化" },
  { vi: "Gợi ý theo từng bước", en: "Suggest step by step", ja: "手順ごとに提案" },
  { vi: "Nêu rủi ro cần tránh", en: "List risks to avoid", ja: "避けるリスクを列挙" },
];

const capabilityCards = [
  {
    icon: Leaf,
    title: { vi: "Canh tác theo giai đoạn", en: "Stage-based cultivation", ja: "成長段階別の栽培" },
    text: { vi: "Gợi ý bám theo sinh trưởng, ra hoa, đậu trái và thu hoạch.", en: "Advice aligned with growth, flowering, fruit set, and harvest.", ja: "生育、開花、着果、収穫に合わせた提案を行います。" },
  },
  {
    icon: Microscope,
    title: { vi: "Đọc triệu chứng bệnh", en: "Symptom interpretation", ja: "症状の読み取り" },
    text: { vi: "Hỗ trợ phân tích dấu hiệu sâu bệnh từ mô tả thực tế.", en: "Helps analyze pest and disease signs from real field descriptions.", ja: "現場説明から病害虫の兆候分析を支援します。" },
  },
  {
    icon: MessageSquareText,
    title: { vi: "Hội thoại liên tục", en: "Continuous conversation", ja: "継続会話" },
    text: { vi: "Ghi nhớ ngữ cảnh phiên chat để trả lời tiếp nối tốt hơn.", en: "Keeps session context for better follow-up answers.", ja: "セッション文脈を保ち、続きの回答を改善します。" },
  },
];

const createMessage = (
  role: ChatMessage["role"],
  text: string,
  extra?: Partial<ChatMessage>
): ChatMessage => ({
  id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  role,
  text,
  createdAt: new Date().toISOString(),
  ...extra,
});

const getStorageKey = (userId?: string | null) => `terraform-flora-chat:${userId || "guest"}`;
const SHOP_CART_STORAGE_KEY = "terraform-flora.shop.cart";
const SHOP_FAVORITES_STORAGE_KEY = "terraform-flora.shop.favorites";
const LEGACY_AI_FALLBACK_PATTERN =
  /Hệ thống AI đang chuyển tuyến|Chụp lại ảnh rõ mặt trên|Khi có OpenAI key hợp lệ|Trong lúc chờ|API AI đang trả về HTML thay vì JSON|AI_API_HTML_RESPONSE/i;

const isLegacyAiFallbackMessage = (message: ChatMessage) =>
  message.role === "model" && LEGACY_AI_FALLBACK_PATTERN.test(message.text);

const normalizeLookupText = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9@\s.-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const getLookupTokens = (value: string) =>
  normalizeLookupText(value)
    .split(" ")
    .filter((token) => token.length >= 3);

const buildOrderLookupText = (order: ShopOrder) =>
  normalizeLookupText(
    [
      order.id,
      order.code,
      order.customerName,
      order.customerEmail,
      order.customerPhone,
      order.shippingAddress,
      order.status,
      order.paymentStatus,
      ...order.items.map((item) => item.productName),
    ].join(" ")
  );

const buildProductLookupText = (product: ShopProduct) =>
  normalizeLookupText(
    [
      product.id,
      product.slug,
      product.name,
      product.category,
      product.sku,
      product.shortDescription,
      product.description,
      product.manufacturer,
      product.origin,
      ...product.tags,
      ...product.benefits,
      ...Object.values(product.specs),
    ].join(" ")
  );

const rankByMessage = <T,>(
  items: T[],
  tokens: string[],
  buildText: (item: T) => string,
  limit: number
) =>
  items
    .map((item) => {
      const lookup = buildText(item);
      return {
        item,
        score: tokens.reduce((score, token) => (lookup.includes(token) ? score + 1 : score), 0),
      };
    })
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, limit)
    .map((entry) => entry.item);

const buildClientRagContext = async (
  message: string,
  user?: AppUser | null,
  chatMessages: AIConversationMessage[] = []
): Promise<ChatRagClientContext> => {
  const userId = user?.uid;
  const normalized = normalizeLookupText(message);
  const phoneMatches = normalized.match(/\b0\d{8,10}\b/g) ?? [];
  const emailMatches = normalized.match(/\S+@\S+\.\S+/g) ?? [];
  const orderMatches = normalized.match(/\btf-\d{4}-\d+\b/g) ?? [];
  const tokens = getLookupTokens(message);
  const [shop, pesticideLibrary, library, recommendations, diagnoses, cart, adminUsers, communityPosts, ownPosts, ownComments, supabaseGrowthCycles, growthSnapshot, bookmarkSnapshot] = await Promise.all([
    getShopBootstrap(),
    getPesticideLibrary().catch(() => ({ pesticides: [] })),
    loadLibraryArticles().catch(() => ({ articles: [] })),
    getRecommendationProfiles().catch(() => ({ data: [] })),
    listDiagnoses({ userId: userId || undefined, take: 200 }).catch(() => []),
    getShopCart(userId).catch(() => null),
    listAdminUsers().catch(() => []),
    listCommunityPosts({ sort: "hot" }).catch(() => []),
    userId ? listCommunityPostsByAuthor(userId).catch(() => []) : Promise.resolve([]),
    userId ? listCommunityCommentsByAuthor(userId).catch(() => []) : Promise.resolve([]),
    userId ? listGrowthCycles(userId).catch(() => []) : Promise.resolve([]),
    userId
      ? getDocs(query(collection(db, "growthCycles"), where("userId", "==", userId), orderBy("lastUpdate", "desc"), limit(12))).catch(() => ({ docs: [] }))
      : Promise.resolve({ docs: [] }),
    userId
      ? getDocs(query(collection(db, "protocolBookmarks"), where("userId", "==", userId), limit(16))).catch(() => ({ docs: [] }))
      : Promise.resolve({ docs: [] }),
  ]);
  const localCart = (() => {
    try {
      const raw = window.localStorage.getItem(SHOP_CART_STORAGE_KEY);
      return raw ? (JSON.parse(raw) as ShopCartItem[]) : [];
    } catch {
      return [];
    }
  })();
  const favoriteProductIds = (() => {
    try {
      const raw = window.localStorage.getItem(SHOP_FAVORITES_STORAGE_KEY);
      return raw ? (JSON.parse(raw) as string[]) : [];
    } catch {
      return [];
    }
  })();

  const matchedOrders = shop.orders.filter((order) => {
    const lookup = buildOrderLookupText(order);
    if (orderMatches.some((code) => lookup.includes(code))) return true;
    if (phoneMatches.some((phone) => lookup.includes(phone))) return true;
    if (emailMatches.some((email) => lookup.includes(email))) return true;
    return false;
  });

  const isProductQuestion = /(san pham|mua|gia|phan bon|hat giong|cay giong|vat tu|combo|ton kho|sku|hang nao|gio hang|yeu thich|cua hang)/.test(normalized);

  const matchedPesticides = rankByMessage(
    pesticideLibrary.pesticides || [],
    tokens,
    (item) =>
      normalizeLookupText(
        [
          item.name,
          item.tradeName,
          item.activeIngredient,
          item.ingredients,
          item.category,
          item.purpose,
          item.dosage,
          item.instructions,
          item.usage,
          item.manufacturer,
          ...(item.suitableCrops || []),
          ...(item.targetDiseases || []),
          ...(item.tags || []),
        ].join(" ")
      ),
    8
  );

  const matchedLibraryArticles = rankByMessage(
    library.articles || [],
    tokens,
    (item) =>
      normalizeLookupText(
        [
          item.title,
          item.category,
          item.type,
          item.crop,
          item.disease,
          item.symptom,
          item.excerpt,
          item.contentHtml,
          ...(item.tags || []),
        ].join(" ")
      ),
    8
  );

  const matchedRecommendationProfiles = rankByMessage(
    recommendations.data || [],
    tokens,
    (item) =>
      normalizeLookupText(
        [
          item.name,
          item.cropType,
          item.type,
          item.description,
          item.symptoms,
          item.causes,
          item.quickAction,
          item.impactLevel,
          ...(item.immediateActions || []),
          ...(item.symptomOptions || []),
        ].join(" ")
      ),
    10
  );

  const matchedOrderSupportMessages = listOrderSupportMessages()
    .filter((message) => {
      const lookup = normalizeLookupText(
        [message.orderCode, message.customerName, message.customerEmail, message.body, message.sender].join(" ")
      );
      if (orderMatches.some((code) => lookup.includes(code))) return true;
      if (phoneMatches.some((phone) => lookup.includes(phone))) return true;
      if (emailMatches.some((email) => lookup.includes(email))) return true;
      return tokens.some((token) => lookup.includes(token));
    })
    .slice(-20);

  const matchedDiagnoses = rankByMessage(
    diagnoses,
    tokens,
    (item) =>
      normalizeLookupText(
        [
          item.cropName,
          item.diseaseName,
          item.severity,
          item.recommendation,
          item.pathogen,
          item.pesticideType,
          ...(item.symptoms || []),
          ...(item.treatment || []),
          ...(item.prevention || []),
          ...(item.treatmentChecklist || []),
        ].join(" ")
      ),
    8
  );
  const localGrowthCycles = growthSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  const growthCycles = (supabaseGrowthCycles.length ? supabaseGrowthCycles : localGrowthCycles).slice(0, 100);
  const [growthTasks, growthPhotos] = await Promise.all([
    Promise.all(growthCycles.map((cycle) => listGrowthTasks(cycle.id).catch(() => []))).then((groups) => groups.flat()),
    Promise.all(growthCycles.map((cycle) => listGrowthPhotos(cycle.id).catch(() => []))).then((groups) => groups.flat()),
  ]);
  const communityComments = await Promise.all(
    communityPosts.slice(0, 100).map((post) => listCommunityComments(post.id).catch(() => []))
  ).then((groups) => groups.flat());
  const protocolBookmarks = bookmarkSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as ProtocolBookmark[];
  const libraryBookmarkIds = userId ? getLibraryBookmarks(userId) : getLibraryBookmarks();
  const cartItems = (cart || localCart).slice(0, 20);
  const relatedProductIds = new Set([
    ...cartItems.map((item) => item.productId),
    ...favoriteProductIds,
      ...matchedOrders.flatMap((order) => order.items.map((item) => item.productId)),
  ]);
  const productMatches = isProductQuestion ? rankByMessage(shop.products, tokens, buildProductLookupText, 8) : [];
  const relatedProducts = [
    ...productMatches,
    ...shop.products.filter((product) => relatedProductIds.has(product.id)),
  ].filter((product, index, list) => list.findIndex((item) => item.id === product.id) === index).slice(0, 16);
  const visibleCommunityPosts = [
    ...ownPosts,
    ...rankByMessage(
      communityPosts,
      tokens,
      (item) => normalizeLookupText([item.title, item.body, item.category, ...(item.tags || [])].join(" ")),
      8
    ),
  ].filter((post, index, list) => list.findIndex((item) => item.id === post.id) === index).slice(0, 12);
  const visibleOrders = (matchedOrders.length ? matchedOrders : shop.orders.slice(0, 12)).slice(0, 20);
  const visiblePesticides = matchedPesticides.slice(0, 8);
  const visibleLibraryArticles = matchedLibraryArticles.map((article) => ({
    ...article,
    contentHtml: article.contentHtml ? article.contentHtml.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").slice(0, 1400) : "",
  }));
  const visibleRecommendationProfiles = matchedRecommendationProfiles.slice(0, 10);
  const visibleDiagnoses = matchedDiagnoses.slice(0, 12);
  const visibleAdminUsers = adminUsers.slice(0, 30);
  const visibleGrowthTasks = growthTasks.slice(0, 80);
  const visibleGrowthPhotos = growthPhotos.slice(0, 40).map((photo) => ({
    ...photo,
    imageUrl: "",
  }));
  const visibleCommunityComments = [
    ...communityComments.slice(0, 80),
    ...ownComments,
  ].filter((comment, index, list) => list.findIndex((item) => item.id === comment.id) === index).slice(0, 100);

  return {
    currentUser: user || null,
    orders: visibleOrders,
    products: relatedProducts,
    pesticides: visiblePesticides,
    libraryArticles: visibleLibraryArticles,
    recommendationProfiles: visibleRecommendationProfiles,
    diagnoses: visibleDiagnoses,
    orderSupportMessages: matchedOrderSupportMessages,
    adminUsers: visibleAdminUsers,
    cartItems,
    favoriteProductIds,
    libraryBookmarkIds,
    protocolBookmarks,
    growthCycles,
    growthTasks: visibleGrowthTasks,
    growthPhotos: visibleGrowthPhotos,
    communityPosts: visibleCommunityPosts,
    communityComments: visibleCommunityComments,
    chatMessages,
  };
};

const ChatView = ({ user }: ChatViewProps) => {
  const { language } = useI18n();
  const tt = (key: string) => chatText[key]?.[language] ?? chatText[key]?.vi ?? key;
  const locale = language === "vi" ? "vi-VN" : language === "ja" ? "ja-JP" : "en-US";
  const formatTime = (createdAt: string) =>
    new Date(createdAt).toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [activePromptGroup, setActivePromptGroup] = useState(promptGroups[0].key);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lastPromptRef = useRef("");

  useEffect(() => {
    const storageKey = getStorageKey(user?.uid);
    const raw = window.localStorage.getItem(storageKey);

    if (!raw) {
      setMessages([createMessage("model", tt("starterMessage"))]);
      return;
    }

    try {
      const parsed = JSON.parse(raw) as ChatMessage[];
      const cleaned = parsed.filter((message) => !isLegacyAiFallbackMessage(message));
      const nextMessages = cleaned.length ? cleaned : [createMessage("model", tt("starterMessage"))];
      setMessages(nextMessages);

      if (cleaned.length !== parsed.length) {
        window.localStorage.setItem(storageKey, JSON.stringify(nextMessages));
      }
    } catch (error) {
      console.error("Chat history parse error:", error);
      setMessages([createMessage("model", tt("starterMessage"))]);
    }
  }, [user?.uid, language]);

  useEffect(() => {
    if (!messages.length) return;
    window.localStorage.setItem(getStorageKey(user?.uid), JSON.stringify(messages));
  }, [messages, user?.uid]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  useEffect(() => {
    if (!textareaRef.current) return;
    textareaRef.current.style.height = "0px";
    textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
  }, [input]);

  const userMessagesCount = useMemo(
    () => messages.filter((message) => message.role === "user").length,
    [messages]
  );

  const assistantMessagesCount = useMemo(
    () => messages.filter((message) => message.role === "model" && !message.isError).length,
    [messages]
  );

  const latestGroup = promptGroups.find((group) => group.key === activePromptGroup) || promptGroups[0];

  const handleSend = async (prompt?: string) => {
    const nextPrompt = (prompt ?? input).trim();
    if (!nextPrompt || isTyping) return;

    const history = messages
      .filter((message) => !message.isError)
      .map<AIConversationMessage>(({ role, text }) => ({ role, text }));

    const userMessage = createMessage("user", nextPrompt);
    lastPromptRef.current = nextPrompt;
    setInput("");
    setMessages((prev) => [...prev, userMessage]);
    setIsTyping(true);

    try {
      const clientContext = await buildClientRagContext(nextPrompt, user, history);
      const response = await getAIConsultationResult(nextPrompt, history, clientContext);
      setMessages((prev) => [
        ...prev,
        createMessage("model", response.text || tt("noAiResponse"), {
          provider: response.provider,
          model: response.model,
          fallbackUsed: response.fallbackUsed,
          rag: response.rag,
          isError: Boolean(response.error),
        }),
      ]);
    } catch (error) {
      console.error(error);
      setMessages((prev) => [
        ...prev,
        createMessage(
          "model",
          tt("aiError"),
          { isError: true }
        ),
      ]);
    } finally {
      setIsTyping(false);
      textareaRef.current?.focus();
    }
  };

  const handleUseAction = (action: string) => {
    const seed = lastPromptRef.current || input.trim();
    const nextPrompt = seed ? `${seed}\n\n${tt("extraRequest")}: ${action}.` : action;
    setInput(nextPrompt);
    textareaRef.current?.focus();
  };

  const handleClearChat = () => {
    setMessages([
      createMessage(
        "model",
        tt("clearMessage")
      ),
    ]);
    setInput("");
    lastPromptRef.current = "";
  };

  const handleCopy = async (message: ChatMessage) => {
    try {
      await navigator.clipboard.writeText(message.text);
      setCopiedMessageId(message.id);
      window.setTimeout(() => setCopiedMessageId(null), 1800);
    } catch (error) {
      console.error("Copy failed:", error);
    }
  };

  return (
    <div className="min-h-screen bg-black pb-10 pt-32">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-8 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="tech-grid relative overflow-hidden rounded-[40px] border border-emerald-500/20 bg-gradient-to-br from-emerald-500/18 via-emerald-500/5 to-black p-8">
            <div className="absolute -right-10 top-0 h-40 w-40 rounded-full bg-emerald-400/15 blur-3xl" />
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.28em] text-emerald-200">
              <Sparkles className="h-3.5 w-3.5" /> {tt("heroBadge")}
            </div>
            <h2 className="mt-6 font-[var(--font-headline)] text-4xl font-bold tracking-tight text-white md:text-5xl">
              {tt("heroTitle")}
              <span className="text-gradient-ai">{tt("heroTitleAccent")}</span>
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/60">
              {tt("heroDesc")}
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {[
                { label: tt("sessionHistory"), value: userMessagesCount, note: tt("questionsSent") },
                { label: tt("aiReplies"), value: assistantMessagesCount, note: tt("validReplies") },
                { label: tt("status"), value: isTyping ? tt("processing") : tt("ready"), note: tt("realtimeReply") },
              ].map((item) => (
                <div key={item.label} className="rounded-[28px] border border-white/8 bg-black/25 p-5">
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/30">{item.label}</p>
                  <p className="mt-3 text-3xl font-black text-white">{item.value}</p>
                  <p className="mt-2 text-sm text-white/45">{item.note}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="section-shell p-8">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5">
                <WandSparkles className="h-5 w-5 text-emerald-300" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/30">{tt("quickTools")}</p>
                <h3 className="text-2xl font-bold text-white">{tt("speedUpChat")}</h3>
              </div>
            </div>

            <div className="mt-6 grid gap-3">
              {quickActions.map((action) => (
                <button
                  key={action.vi}
                  onClick={() => handleUseAction(action[language])}
                  className="flex items-center justify-between rounded-[24px] border border-white/8 bg-black/25 px-5 py-4 text-left transition-all hover:border-emerald-400/20 hover:bg-emerald-400/8"
                >
                  <span className="text-sm font-semibold text-white">{action[language]}</span>
                  <Sparkles className="h-4 w-4 text-emerald-300" />
                </button>
              ))}
            </div>

            <div className="mt-6 rounded-[28px] border border-sky-500/15 bg-sky-500/5 p-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-sky-200/70">{tt("usageTips")}</p>
              <p className="mt-3 text-sm leading-relaxed text-white/65">
                {tt("usageTipDesc")}
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-8 xl:grid-cols-[0.34fr_1fr]">
          <aside className="space-y-6">
            <div className="section-shell p-6">
              <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-white/30">{tt("promptLibrary")}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                {promptGroups.map((group) => {
                  const Icon = group.icon;
                  const active = group.key === activePromptGroup;
                  return (
                    <button
                      key={group.key}
                      onClick={() => setActivePromptGroup(group.key)}
                      className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] transition-all ${
                        active
                          ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-200"
                          : "border-white/10 bg-white/5 text-white/45 hover:text-white"
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {group.title[language]}
                    </button>
                  );
                })}
              </div>

              <div className="mt-5 space-y-3">
                {latestGroup.prompts.map((prompt) => (
                  <button
                    key={prompt.vi}
                    onClick={() => handleSend(prompt[language])}
                    className="w-full rounded-[22px] border border-white/8 bg-black/25 p-4 text-left text-sm leading-relaxed text-white/70 transition-all hover:border-emerald-400/20 hover:bg-emerald-400/8 hover:text-white"
                  >
                    {prompt[language]}
                  </button>
                ))}
              </div>
            </div>

            <div className="section-shell p-6">
              <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-white/30">{tt("aiCapabilities")}</p>
              <div className="mt-5 space-y-4">
                {capabilityCards.map((item) => (
                  <div key={item.title.vi} className="rounded-[24px] border border-white/8 bg-black/20 p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/5">
                        <item.icon className="h-4 w-4 text-emerald-300" />
                      </div>
                      <div>
                        <p className="font-semibold text-white">{item.title[language]}</p>
                        <p className="mt-1 text-sm leading-relaxed text-white/45">{item.text[language]}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </aside>

          <section className="flex h-[calc(100vh-12rem)] min-h-[720px] flex-col overflow-hidden rounded-[36px] border border-black/10 bg-white shadow-[0_30px_120px_rgba(0,0,0,0.32)]">
            <div className="border-b border-slate-200 px-6 py-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100">
                    <Bot className="h-6 w-6 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-slate-900">{tt("workspaceTitle")}</h3>
                    <p className="text-sm text-slate-500">{tt("workspaceDesc")}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => lastPromptRef.current && handleSend(lastPromptRef.current)}
                    disabled={!lastPromptRef.current || isTyping}
                    className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-xs font-bold uppercase tracking-[0.22em] text-slate-500 transition-all hover:border-slate-300 hover:text-slate-900 disabled:opacity-40"
                  >
                    <span className="inline-flex items-center gap-2">
                      <RotateCcw className="h-4 w-4" /> {tt("askAgain")}
                    </span>
                  </button>
                  <button
                    onClick={handleClearChat}
                    className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-xs font-bold uppercase tracking-[0.22em] text-slate-500 transition-all hover:border-slate-300 hover:text-slate-900"
                  >
                    <span className="inline-flex items-center gap-2">
                      <Trash2 className="h-4 w-4" /> {tt("clearChat")}
                    </span>
                  </button>
                </div>
              </div>
            </div>

            <div ref={scrollRef} className="custom-scrollbar flex-1 space-y-6 overflow-y-auto bg-slate-50 px-6 py-6">
              {messages.length <= 1 && (
                <div className="flex min-h-[340px] flex-col items-center justify-center rounded-[32px] border border-dashed border-slate-200 bg-white px-6 py-12 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-[24px] bg-emerald-50">
                    <Sparkles className="h-8 w-8 text-emerald-500/70" />
                  </div>
                  <p className="mt-6 text-[10px] font-bold uppercase tracking-[0.24em] text-slate-400">{tt("quickStart")}</p>
                  <h4 className="mt-4 text-2xl font-bold text-slate-900">{tt("quickStartTitle")}</h4>
                  <div className="mt-6 flex max-w-2xl flex-wrap justify-center gap-3">
                    {promptGroups.flatMap((group) => group.prompts.slice(0, 1)).map((prompt) => (
                      <button
                        key={prompt.vi}
                        onClick={() => handleSend(prompt[language])}
                        className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm text-slate-600 transition-all hover:border-emerald-300 hover:bg-emerald-50 hover:text-slate-900"
                      >
                        {prompt[language]}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div className={`flex max-w-[88%] items-start gap-4 ${message.role === "user" ? "flex-row-reverse" : ""}`}>
                    <div
                      className={`mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${
                        message.role === "user" ? "bg-slate-200" : "bg-emerald-100"
                      }`}
                    >
                      {message.role === "user" ? (
                        <User className="h-5 w-5 text-slate-600" />
                      ) : (
                        <Bot className="h-5 w-5 text-emerald-600" />
                      )}
                    </div>

                    <div
                      className={`rounded-[28px] border p-5 md:p-6 ${
                        message.role === "user"
                          ? "rounded-tr-none border-emerald-200 bg-emerald-500 text-white shadow-lg shadow-emerald-500/15"
                          : message.isError
                            ? "rounded-tl-none border-red-200 bg-red-50 text-red-900"
                            : "rounded-tl-none border-slate-200 bg-white text-slate-800 shadow-sm"
                      }`}
                    >
                      <div className="mb-3 flex items-center justify-between gap-4">
                        <p className={`text-[10px] font-bold uppercase tracking-[0.22em] ${message.role === "user" ? "text-white/70" : "text-slate-400"}`}>
                          {message.role === "user" ? tt("you") : "AgroPro AI"}
                        </p>
                        <p className={`text-[10px] font-bold uppercase tracking-[0.22em] ${message.role === "user" ? "text-white/60" : "text-slate-400"}`}>{formatTime(message.createdAt)}</p>
                      </div>

                      <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.text}</p>

                      {message.role === "model" && message.rag && message.rag.sourceCount > 0 ? (
                        <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-xs text-emerald-900">
                          <p className="font-bold uppercase tracking-[0.16em] text-emerald-700">
                            {tt("ragSource")} · {message.rag.intent} · {message.rag.sourceCount}
                          </p>
                          {message.rag.sources.length > 0 ? (
                            <p className="mt-2 line-clamp-2 text-emerald-900/70">
                              {message.rag.sources.slice(0, 3).map((source) => source.title).join(" • ")}
                            </p>
                          ) : null}
                        </div>
                      ) : null}

                      {message.role === "model" && (
                        <div className="mt-5 flex justify-end border-t border-slate-200 pt-4 text-[10px] font-bold uppercase tracking-[0.22em]">
                          <button
                            onClick={() => handleCopy(message)}
                            className="inline-flex items-center gap-2 text-slate-500 transition-colors hover:text-slate-900"
                          >
                            {copiedMessageId === message.id ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                            {copiedMessageId === message.id ? tt("copied") : tt("copy")}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}

              {isTyping && (
                <div className="flex justify-start">
                  <div className="flex items-start gap-4">
                    <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100">
                      <Bot className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div className="rounded-[28px] rounded-tl-none border border-slate-200 bg-white p-5">
                      <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-500" />
                        {tt("thinking")}
                      </div>
                      <div className="flex gap-1.5">
                        <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-emerald-500" />
                        <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-emerald-500 [animation-delay:0.2s]" />
                        <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-emerald-500 [animation-delay:0.4s]" />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-slate-200 bg-white p-5">
              <div className="mb-4 flex flex-wrap gap-2">
                {quickActions.map((action) => (
                  <button
                    key={action.vi}
                    onClick={() => handleUseAction(action[language])}
                    className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500 transition-all hover:border-emerald-300 hover:text-slate-900"
                  >
                    {action[language]}
                  </button>
                ))}
              </div>

              <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-end gap-3">
                  <textarea
                    ref={textareaRef}
                    placeholder={tt("inputPlaceholder")}
                    className="min-h-[60px] max-h-[180px] flex-1 resize-none bg-transparent px-4 py-3 text-slate-900 outline-none placeholder:text-slate-400"
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && !event.shiftKey) {
                        event.preventDefault();
                        void handleSend();
                      }
                    }}
                  />
                  <button
                    onClick={() => void handleSend()}
                    disabled={!input.trim() || isTyping}
                    className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500 text-white transition-all hover:bg-emerald-600 disabled:opacity-50"
                  >
                    {isTyping ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                  </button>
                </div>

                <div className="mt-3 flex flex-col gap-2 px-2 text-[11px] text-slate-400 sm:flex-row sm:items-center sm:justify-between">
                  <p>{tt("enterHint")}</p>
                  <p>{userMessagesCount} {tt("questionCountSuffix")}</p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default ChatView;
