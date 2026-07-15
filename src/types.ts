export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
  }
}

export interface IntensiveDisease {
  id: string;
  name: string;
  cropType: string;
  type: 'fungal' | 'bacterial' | 'insect' | 'physiological';
  description: string;
  symptoms: string;
  impactLevel: string;
  causes: string;
  protocols: TreatmentProtocol[];
  alternatives?: TreatmentProtocol[];
  usageNotes: {
    timing: string;
    weather: string;
    safety: string;
    withdrawal: string;
  };
  references?: string[];
}

export interface TreatmentProtocol {
  id: string;
  severity: 'mild' | 'moderate' | 'severe';
  steps: string[];
  drugs: {
    name: string;
    activeIngredient: string;
    dosage: string;
  }[];
  usage: string;
  frequency: string;
  interval: string;
  notes: string;
}

export interface ProtocolBookmark {
  id: string;
  userId: string;
  diseaseId: string;
  timestamp: any;
}

export interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role: 'user' | 'admin';
  isActive?: boolean;
}

export type View =
  | 'home'
  | 'diagnosis'
  | 'pesticides'
  | 'recommendations'
  | 'growth'
  | 'forum'
  | 'chat'
  | 'library'
  | 'shop'
  | 'userPortal'
  | 'admin';

export interface Crop {
  id: string;
  name: string;
  scientificName: string;
  description: string;
  growthStages: string[];
  commonDiseases: string[];
  careInstructions: string;
}

export interface Pesticide {
  id: string;
  name: string;
  tradeName?: string;
  activeIngredient?: string;
  ingredients: string;
  purpose: string;
  dosage: string;
  instructions: string;
  usage?: string;
  price: number;
  category: string;
  type?: 'insecticide' | 'fungicide' | 'herbicide' | 'biological' | 'chemical' | 'other';
  formulation?: string;
  safetyWarnings?: string;
  compatibility?: string;
  manufacturer?: string;
  expiryMonths?: number;
  image?: string;
  toxicityLevel?: 'low' | 'medium' | 'high';
  withdrawalPeriod?: string;
  phi?: number;
  suitableCrops?: string[];
  targetDiseases?: string[];
  tags?: string[];
}

export interface Disease {
  id: string;
  name: string;
  symptoms: string[];
  causes: string;
  prevention: string;
  crops: string[];
  pesticideIds: string[];
  image?: string;
}

export interface UserInventory {
  id: string;
  userId: string;
  pesticideId: string;
  pesticideName: string;
  quantity: number;
  unit: string;
  expiryDate: string;
  purchaseDate: string;
  notes?: string;
}

export interface PesticideUsageLog {
  id: string;
  userId: string;
  inventoryId?: string;
  pesticideId?: string;
  pesticideName: string;
  amount: number;
  unit: string;
  date?: string;
  area?: number;
  crop: string;
  purpose: string;
  timestamp?: any;
}

export interface SearchHistory {
  id: string;
  userId: string;
  query: string;
  type: 'symptom' | 'pesticide' | 'diagnosis';
  result?: any;
  timestamp: any;
}

export interface Bookmark {
  id: string;
  userId: string;
  pesticideId: string;
  timestamp: any;
}

export interface ForumPost {
  id: string;
  userId: string;
  userName: string;
  title: string;
  content: string;
  createdAt: any;
  likesCount?: number;
  tags: string[];
}

export type CommunityCategory =
  | "Tất cả"
  | "Kỹ thuật"
  | "Sâu bệnh"
  | "Thị trường"
  | "Kinh nghiệm"
  | "Hỏi đáp"
  | "Thảo luận";

export type CommunitySortMode = "hot" | "new" | "top";

export interface CommunityPost {
  id: string;
  authorId: string;
  authorName: string;
  title: string;
  body: string;
  category: Exclude<CommunityCategory, "Tất cả">;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  voteScore: number;
  upvoteCount: number;
  downvoteCount: number;
  commentCount: number;
  userVote: -1 | 0 | 1;
  isPinned: boolean;
}

export interface CommunityComment {
  id: string;
  postId: string;
  parentCommentId: string | null;
  authorId: string;
  authorName: string;
  body: string;
  createdAt: string;
}

export interface CommunityCommentActivity extends CommunityComment {
  postTitle: string;
  postAuthorName: string;
}

export type CommunityReportStatus = "open" | "reviewing" | "resolved" | "dismissed";

export type CommunityNotificationType = "comment" | "report_status" | "post_removed";

export interface CommunityReport {
  id: string;
  postId: string;
  postTitle: string;
  reporterId: string;
  reporterName: string;
  reason: string;
  details: string | null;
  status: CommunityReportStatus;
  createdAt: string;
  reviewedAt: string | null;
  reviewedBy: string | null;
}

export interface CommunityNotification {
  id: string;
  userId: string;
  type: CommunityNotificationType;
  title: string;
  message: string;
  postId: string | null;
  commentId: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface Diagnosis {
  id: string;
  diseaseName: string;
  cropName: string;
  confidence: number;
  severity: string;
  treatment: string[];
  recommendation: string;
  symptoms: string[];
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
  confidenceBreakdown?: { texture: number, color: number, shape: number };
  provider?: string;
  model?: string;
  timestamp: any;
  imageUrl: string;
  userId?: string;
  createdAt?: any;
}

export interface GrowthCycle {
  id: string;
  userId: string;
  cropName: string;
  startDate: string;
  duration: number;
  currentStage: 'Gieo trồng' | 'Sinh trưởng' | 'Ra hoa' | 'Thu hoạch';
  status: 'active' | 'harvested' | 'failed';
  notes?: string;
  progress: number;
  lastUpdate: any;
}

export interface GrowthTask {
  id: string;
  cycleId: string;
  userId: string;
  title: string;
  dueDate: string;
  completed: boolean;
  type: 'water' | 'fertilize' | 'check' | 'other';
}

export interface GrowthPhoto {
  id: string;
  cycleId: string;
  userId: string;
  url: string;
  date: string;
  note?: string;
}

export type ShopPaymentMethod = "cod" | "bank_transfer" | "momo" | "card" | "vnpay";

export type ShopOrderStatus = "pending" | "confirmed" | "shipping" | "delivered" | "cancelled";

export type ShopPaymentStatus = "pending" | "paid" | "failed" | "refunded";

export interface ShopProduct {
  id: string;
  slug: string;
  name: string;
  category: string;
  price: number;
  originalPrice?: number;
  stock: number;
  sku: string;
  manufacturer: string;
  origin: string;
  shortDescription: string;
  description: string;
  image: string;
  images: string[];
  tags: string[];
  badge?: string;
  rating: number;
  reviewCount: number;
  salesCount: number;
  featured: boolean;
  bestSeller: boolean;
  shippingClass: string;
  benefits: string[];
  specs: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}

export interface ShopCartItem {
  productId: string;
  quantity: number;
}

export interface ShopOrderItem {
  productId: string;
  productName: string;
  productImage: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface ShopOrder {
  id: string;
  code: string;
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
  paymentStatus: ShopPaymentStatus;
  status: ShopOrderStatus;
  createdAt: string;
}

export interface ShopBootstrapPayload {
  products: ShopProduct[];
  orders: ShopOrder[];
  source: "supabase" | "local" | "supabase-empty" | "supabase-error";
  message?: string;
}

export interface ShopAnalytics {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  totalUnitsSold: number;
  activeProducts: number;
  lowStockProducts: number;
  conversionNote: string;
  bestSeller: ShopProduct | null;
  topCategories: Array<{ category: string; revenue: number; units: number }>;
  revenueSeries: Array<{
    label: string;
    revenue: number;
    orders: number;
    units: number;
    month: number;
    year: number;
  }>;
}
