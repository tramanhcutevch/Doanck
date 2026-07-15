export interface AIConversationMessage {
  role: "user" | "model";
  text: string;
}

export interface ChatRagClientContext {
  orders?: unknown[];
  products?: unknown[];
  pesticides?: unknown[];
  libraryArticles?: unknown[];
  recommendationProfiles?: unknown[];
  diagnoses?: unknown[];
  growthCycles?: unknown[];
  growthTasks?: unknown[];
  growthPhotos?: unknown[];
  communityPosts?: unknown[];
  communityComments?: unknown[];
  orderSupportMessages?: unknown[];
  currentUser?: unknown;
  adminUsers?: unknown[];
  cartItems?: unknown[];
  favoriteProductIds?: string[];
  libraryBookmarkIds?: string[];
  protocolBookmarks?: unknown[];
  chatMessages?: AIConversationMessage[];
}

interface ChatApiResponse {
  text: string;
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
  error?: string;
}

type LooseRecord = Record<string, unknown>;

interface DiagnosisApiResponse {
  diseaseName: string;
  cropName: string;
  confidence: number;
  severity: string;
  symptoms: string[];
  treatment: string[];
  recommendation: string;
  pesticideType?: string;
  pathogen?: string;
  riskLevel?: number;
  spreadSpeed?: string;
  prevention?: string[];
  treatmentChecklist?: string[];
  rawLabel?: string;
  topPredictions?: Array<{
    rawLabel: string;
    diseaseName: string;
    cropName: string;
    confidence: number;
  }>;
  confidenceBreakdown?: { texture: number; color: number; shape: number };
  provider?: string;
  model?: string;
  error?: string;
}

export interface AIStatusResponse {
  status: string;
  configuredProvider: string;
  diagnosisProvider: string;
  chatProvider: string;
  local: {
    assetsPresent: boolean;
    modelPath: string;
    classNamesPath: string;
    inferenceScript: string;
    imageSize: number;
    modelFamily?: string;
    runtime?: string;
    normalization?: string;
    pythonAvailable: boolean;
    onnxRuntimeAvailable?: boolean;
    pythonVersion?: string;
    onnxRuntimeVersion?: string;
    error?: string;
  };
  plantModels?: Array<{
    id: string;
    cropName: string;
    model: string;
    classNames: string;
    inferenceScript?: string;
    runtime?: string;
    normalization?: string;
    assetsPresent: boolean;
  }>;
  supabaseEnv: {
    usesLegacyCompatibleNames: boolean;
  };
}

const getApiBaseUrl = () => {
  const envBase = import.meta.env.VITE_AI_API_BASE_URL?.trim();
  if (envBase) return envBase.replace(/\/$/, "");

  if (typeof window !== "undefined") {
    const { protocol, hostname, port } = window.location;
    // When the frontend is opened with the standalone Vite dev server
    // (often 3000/5173/4173, including LAN IPs for projector demos),
    // route API calls to the Express backend on the same host at 3001.
    if (port && port !== "3001") {
      return `${protocol}//${hostname}:3001`;
    }
  }

  return "";
};

const getApiBaseUrlCandidates = () => {
  const envBase = import.meta.env.VITE_AI_API_BASE_URL?.trim();
  if (envBase) return [envBase.replace(/\/$/, "")];

  const candidates = new Set<string>();
  const primaryBase = getApiBaseUrl();
  candidates.add(primaryBase);

  if (typeof window !== "undefined") {
    const { protocol, hostname } = window.location;
    candidates.add(`${protocol}//${hostname}:3001`);
    candidates.add(`${protocol}//localhost:3001`);
    candidates.add(`${protocol}//127.0.0.1:3001`);
  }

  return [...candidates];
};

const asRecord = (value: unknown): LooseRecord =>
  typeof value === "object" && value !== null ? (value as LooseRecord) : {};

const getString = (value: LooseRecord, key: string) =>
  typeof value[key] === "string" ? String(value[key]) : "";

const getNumber = (value: LooseRecord, key: string) =>
  typeof value[key] === "number" ? Number(value[key]) : 0;

const getArray = (value: LooseRecord, key: string): unknown[] =>
  Array.isArray(value[key]) ? (value[key] as unknown[]) : [];

const normalizeLookupText = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9@\s.-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const isAgricultureScopedMessage = (message: string) => {
  const normalized = normalizeLookupText(message);
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
  const normalized = normalizeLookupText(message);
  if (/(thoi tiet|mua|nang|nhiet do|do am|gio|bao)/.test(normalized)) {
    return "Tôi chỉ hỗ trợ các nội dung liên quan đến nông nghiệp. Nếu bạn muốn biết thời tiết để phục vụ sản xuất nông nghiệp, vui lòng cho biết địa phương và loại cây trồng hoặc vật nuôi.";
  }

  if (/(ke chuyen|chuyen cuoi|truyen cuoi|joke|cuoi)/.test(normalized)) {
    return "Xin lỗi, tôi chỉ hỗ trợ các câu hỏi liên quan đến nông nghiệp. Bạn có thể hỏi về kỹ thuật canh tác, chăm sóc cây trồng, chăn nuôi hoặc các chủ đề nông nghiệp khác.";
  }

  return "Xin lỗi, tôi là trợ lý AI chuyên hỗ trợ về lĩnh vực nông nghiệp nên không thể hỗ trợ các chủ đề ngoài phạm vi này. Nếu bạn cần tư vấn về trồng trọt, chăn nuôi, sâu bệnh, phân bón hoặc các vấn đề nông nghiệp khác, tôi rất sẵn lòng hỗ trợ.";
};

const formatCurrencyVnd = (value: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value : 0);

const orderStatusText: Record<string, string> = {
  pending: "Chờ xác nhận",
  confirmed: "Đã xác nhận",
  shipping: "Đang giao",
  delivered: "Đã giao",
  cancelled: "Đã hủy",
};

const paymentStatusText: Record<string, string> = {
  pending: "Chờ thanh toán",
  paid: "Đã thanh toán",
  failed: "Thanh toán lỗi",
  refunded: "Đã hoàn tiền",
};

const getOrderLookupText = (order: LooseRecord) =>
  normalizeLookupText(
    [
      getString(order, "id"),
      getString(order, "code"),
      getString(order, "customerName"),
      getString(order, "customerEmail"),
      getString(order, "customerPhone"),
      getString(order, "shippingAddress"),
      getString(order, "status"),
      getString(order, "paymentStatus"),
      ...getArray(order, "items").map((item) => getString(asRecord(item), "productName")),
    ].join(" ")
  );

const findMatchingOrders = (message: string, orders: unknown[]) => {
  const normalizedMessage = normalizeLookupText(message);
  const orderCode = normalizedMessage.match(/\btf-\d{4}-\d+\b/)?.[0] || "";
  const phones = normalizedMessage.match(/\b0\d{8,10}\b/g) ?? [];
  const emails = message.toLowerCase().match(/\S+@\S+\.\S+/g) ?? [];
  const hasIdentifier = Boolean(orderCode || phones.length || emails.length);

  if (!hasIdentifier) return [];

  return orders
    .map(asRecord)
    .filter((order) => {
      const lookup = getOrderLookupText(order);
      if (orderCode && lookup.includes(orderCode)) return true;
      if (phones.some((phone) => lookup.includes(phone))) return true;
      return emails.some((email) => lookup.includes(email));
    })
    .slice(0, 5);
};

const formatOrderSummary = (order: LooseRecord) => {
  const items = getArray(order, "items")
    .map((item) => {
      const row = asRecord(item);
      const name = getString(row, "productName") || "Sản phẩm";
      const quantity = getNumber(row, "quantity") || 1;
      const lineTotal = getNumber(row, "lineTotal");
      return `${name} x${quantity}${lineTotal ? ` (${formatCurrencyVnd(lineTotal)})` : ""}`;
    })
    .join("; ");

  const status = getString(order, "status");
  const paymentStatus = getString(order, "paymentStatus");
  const createdAt = getString(order, "createdAt");

  return [
    `Mã đơn: ${getString(order, "code") || getString(order, "id") || "Chưa có mã"}.`,
    `Khách hàng: ${getString(order, "customerName") || "Chưa có tên"}${getString(order, "customerPhone") ? ` - ${getString(order, "customerPhone")}` : ""}.`,
    `Trạng thái: ${orderStatusText[status] || status || "Chưa cập nhật"}. Thanh toán: ${paymentStatusText[paymentStatus] || paymentStatus || "Chưa cập nhật"}.`,
    `Tổng tiền: ${formatCurrencyVnd(getNumber(order, "total"))}.`,
    getString(order, "shippingAddress") ? `Địa chỉ giao: ${getString(order, "shippingAddress")}.` : "",
    createdAt ? `Ngày tạo: ${new Date(createdAt).toLocaleString("vi-VN")}.` : "",
    items ? `Sản phẩm: ${items}.` : "",
  ].filter(Boolean).join("\n");
};

const buildLocalChatFallback = (
  message: string,
  clientContext?: ChatRagClientContext,
  cause?: unknown
): ChatApiResponse => {
  if (!isAgricultureScopedMessage(message)) {
    return {
      text: buildOutOfScopeChatResponse(message),
      provider: "local",
      model: "agriculture-scope-guard",
      fallbackUsed: false,
      rag: { intent: "out_of_scope", sourceCount: 0, sources: [] },
    };
  }

  const normalizedMessage = normalizeLookupText(message);
  const orders = Array.isArray(clientContext?.orders) ? clientContext.orders : [];
  const products = Array.isArray(clientContext?.products) ? clientContext.products : [];
  const isOrderQuestion = /(don hang|ma don|trang thai|giao hang|van chuyen|thanh toan|tracking)/.test(normalizedMessage);

  if (isOrderQuestion) {
    const matchingOrders = findMatchingOrders(message, orders);
    const text = matchingOrders.length
      ? [
          "Mình tra được thông tin đơn hàng từ dữ liệu hiện có:",
          "",
          ...matchingOrders.map((order) => formatOrderSummary(order)),
        ].join("\n\n")
      : [
          "Mình sẵn sàng tra thông tin đơn hàng cho bạn.",
          "Bạn gửi giúp mình mã đơn hàng, email hoặc số điện thoại đặt hàng để mình đối chiếu chính xác nhé.",
          orders.length ? `Hiện hệ thống đang có ${orders.length} đơn hàng trong dữ liệu nội bộ.` : "",
        ].filter(Boolean).join("\n");

    return {
      text,
      provider: "local",
      model: "browser-rag-fallback",
      fallbackUsed: true,
      rag: {
        intent: "order_status",
        sourceCount: matchingOrders.length,
        sources: matchingOrders.map((order) => ({
          id: `order:${getString(order, "id") || getString(order, "code")}`,
          title: `Đơn hàng ${getString(order, "code") || getString(order, "id") || ""}`.trim(),
          source: "shop_order",
          score: 1,
          metadata: {
            status: getString(order, "status"),
            paymentStatus: getString(order, "paymentStatus"),
          },
        })),
      },
    };
  }

  if (/(san pham|gia|ton kho|thuoc|cay giong|shop|mua)/.test(normalizedMessage)) {
    const visibleProducts = products.map(asRecord).slice(0, 5);
    return {
      text: visibleProducts.length
        ? [
            "Mình có thể hỗ trợ thông tin sản phẩm từ dữ liệu hiện có. Một số sản phẩm đang có:",
            "",
            ...visibleProducts.map((product) =>
              `- ${getString(product, "name") || "Sản phẩm"}: ${formatCurrencyVnd(getNumber(product, "price"))}, tồn kho ${getNumber(product, "stock")}.`
            ),
          ].join("\n")
        : "Mình có thể tư vấn sản phẩm, giá và tồn kho. Bạn gửi tên sản phẩm hoặc nhu cầu canh tác cụ thể để mình lọc chính xác hơn nhé.",
      provider: "local",
      model: "browser-rag-fallback",
      fallbackUsed: true,
      rag: { intent: "product_advice", sourceCount: visibleProducts.length, sources: [] },
    };
  }

  const causeMessage = cause instanceof Error ? cause.message : "";
  console.warn("Using local chat fallback because AI API was unavailable:", causeMessage || cause);

  return {
    text: [
      "Mình vẫn nhận được câu hỏi của bạn.",
      "Bạn mô tả thêm cây trồng, giai đoạn, triệu chứng, thời tiết gần đây và mục tiêu cần hỗ trợ; mình sẽ hướng dẫn theo checklist thực tế.",
      "Nếu cần tra dữ liệu riêng như đơn hàng, hãy gửi mã đơn/email/SĐT để mình đối chiếu trong dữ liệu nội bộ.",
    ].join("\n"),
    provider: "local",
    model: "browser-rag-fallback",
    fallbackUsed: true,
    rag: { intent: "general", sourceCount: 0, sources: [] },
  };
};

const readJsonResponse = async <T>(response: Response): Promise<T> => {
  const raw = await response.text();
  const trimmed = raw.trim();
  const isJsonLike = trimmed.startsWith("{") || trimmed.startsWith("[");
  const isHtmlLike = trimmed.startsWith("<!DOCTYPE html") || trimmed.startsWith("<html");

  if (!trimmed) {
    throw new Error("API AI không trả dữ liệu. Hãy kiểm tra server backend đang chạy bằng `npm run dev`.");
  }

  if (!isJsonLike) {
    if (isHtmlLike) {
      throw new Error("AI_API_HTML_RESPONSE");
    }

    throw new Error("API AI trả về dữ liệu không hợp lệ.");
  }

  const data = JSON.parse(trimmed) as T;

  if (!response.ok) {
    const message =
      typeof data === "object" && data && "error" in data && typeof data.error === "string"
        ? data.error
        : "Yêu cầu AI thất bại.";
    throw new Error(message);
  }

  return data;
};

const postJson = async <T>(url: string, body: unknown): Promise<T> => {
  const requestInit: RequestInit = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  };
  const apiBases = getApiBaseUrlCandidates();
  let lastError: unknown;

  for (const apiBase of apiBases) {
    try {
      const response = await fetch(`${apiBase}${url}`, requestInit);
      return await readJsonResponse<T>(response);
    } catch (error) {
      lastError = error;

      if (error instanceof Error && !error.message.includes("trả về HTML")) {
        throw error;
      }
    }
  }

  if (lastError instanceof TypeError) {
    throw new Error(
      "Không thể kết nối tới AI API. Hãy bảo đảm backend đang chạy bằng `npm run dev`, hoặc đặt `VITE_AI_API_BASE_URL=http://localhost:3001` nếu bạn đang mở frontend bằng Vite riêng."
    );
  }

  throw (
    lastError instanceof Error
      ? lastError
      : new Error("Không thể kết nối tới AI API. Hãy mở web ở `http://localhost:3001`.")
  );
};

const getJson = async <T>(url: string): Promise<T> => {
  const apiBases = getApiBaseUrlCandidates();
  let lastError: unknown;

  for (const apiBase of apiBases) {
    try {
      const response = await fetch(`${apiBase}${url}`);
      return await readJsonResponse<T>(response);
    } catch (error) {
      lastError = error;

      if (error instanceof Error && !error.message.includes("trả về HTML")) {
        throw error;
      }
    }
  }

  if (lastError instanceof TypeError) {
    throw new Error("Không thể kết nối tới backend AI.");
  }

  throw (
    lastError instanceof Error
      ? lastError
      : new Error("Không thể kết nối tới backend AI.")
  );
};

export const analyzeDisease = async (base64Image: string, cropId: string) => {
  try {
    return await postJson<DiagnosisApiResponse>("/api/ai/diagnose", {
      imageData: base64Image,
      cropId,
    });
  } catch (error) {
    console.error("AI Analysis Error:", error);
    throw error;
  }
};

export const getAIConsultation = async (
  message: string,
  history: AIConversationMessage[] = [],
  clientContext?: ChatRagClientContext
) => {
  const data = await getAIConsultationResult(message, history, clientContext);
  return data.text;
};

export const getAIConsultationResult = async (
  message: string,
  history: AIConversationMessage[] = [],
  clientContext?: ChatRagClientContext
) => {
  try {
    const data = await postJson<ChatApiResponse>("/api/ai/chat", {
      message,
      history,
      clientContext,
    });

    return {
      ...data,
      text: data.text?.trim() || "Tôi chưa tạo được phản hồi phù hợp. Bạn thử hỏi lại chi tiết hơn nhé.",
    };
  } catch (error) {
    console.error("AI Consultation Error:", error);
    return buildLocalChatFallback(message, clientContext, error);
  }
};

export const getAIStatus = async () => {
  try {
    return await getJson<AIStatusResponse>("/api/ai/status");
  } catch (error) {
    console.error("AI Status Error:", error);
    return null;
  }
};
