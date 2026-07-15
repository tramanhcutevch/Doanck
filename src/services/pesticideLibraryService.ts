import { isSupabaseConfigured, supabase } from "../lib/supabase.js";
import { Pesticide } from "../types.js";

type PesticideRow = {
  id: string;
  name: string;
  image_url: string | null;
  trade_name: string | null;
  active_ingredient: string | null;
  type: Pesticide["type"] | null;
  category: string;
  manufacturer: string | null;
  description: string | null;
  formulation: string | null;
  dosage: string | null;
  usage_instructions: string | null;
  withdrawal_period: string | null;
  phi_days: number | null;
  safety_warnings: string | null;
  target_crops: string[] | null;
  target_diseases: string[] | null;
  tags: string[] | null;
  toxicity_level: Pesticide["toxicityLevel"] | null;
  created_at: string | null;
  updated_at: string | null;
};

export type PesticideLibraryPayload = {
  pesticides: Pesticide[];
  source: "supabase" | "local";
};

export type PesticideInput = {
  id?: string;
  name: string;
  image?: string;
  tradeName?: string;
  activeIngredient?: string;
  type?: Pesticide["type"];
  category: string;
  manufacturer?: string;
  purpose?: string;
  description?: string;
  formulation?: string;
  dosage: string;
  instructions: string;
  withdrawalPeriod?: string;
  phi?: number;
  safetyWarnings?: string;
  suitableCrops: string[];
  targetDiseases: string[];
  tags: string[];
  toxicityLevel?: Pesticide["toxicityLevel"];
};

const STORAGE_KEY = "terraformflora.pesticide-library";

const fallbackPesticides: Pesticide[] = [
  {
    id: "pesticide-ridomil-gold",
    name: "Ridomil Gold",
    image: "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&w=1200&q=80",
    tradeName: "Ridomil Gold 68WG",
    activeIngredient: "Metalaxyl-M + Mancozeb",
    ingredients: "Metalaxyl-M + Mancozeb",
    purpose: "Phòng trừ nấm bệnh và giả nấm trên rau màu, cây ăn trái, lúa.",
    dosage: "20-25g/bình 16L",
    instructions: "Phun khi bệnh chớm xuất hiện, lặp lại sau 5-7 ngày nếu áp lực bệnh cao.",
    usage: "Phun đều hai mặt lá vào sáng sớm hoặc chiều mát.",
    price: 0,
    category: "Thuốc trừ nấm",
    type: "fungicide",
    formulation: "WG",
    safetyWarnings: "Mang đầy đủ bảo hộ, không pha gần nguồn nước sinh hoạt.",
    manufacturer: "Syngenta",
    toxicityLevel: "medium",
    withdrawalPeriod: "7 ngày",
    phi: 7,
    suitableCrops: ["Lúa", "Cà chua", "Dưa leo", "Ớt"],
    targetDiseases: ["Sương mai", "Thối rễ", "Thối gốc", "Đạo ôn"],
    tags: ["nội hấp", "trừ nấm", "rau màu"],
  },
  {
    id: "pesticide-confidor",
    name: "Confidor",
    image: "https://images.unsplash.com/photo-1589923188900-85dae523342b?auto=format&fit=crop&w=1200&q=80",
    tradeName: "Confidor 100SL",
    activeIngredient: "Imidacloprid",
    ingredients: "Imidacloprid",
    purpose: "Kiểm soát rầy, rệp, bọ trĩ và côn trùng chích hút.",
    dosage: "8-12ml/bình 16L",
    instructions: "Phun khi mật độ sâu vượt ngưỡng, luân phiên hoạt chất để tránh kháng thuốc.",
    usage: "Phun tập trung mặt dưới lá và đọt non.",
    price: 0,
    category: "Thuốc trừ sâu",
    type: "insecticide",
    formulation: "SL",
    safetyWarnings: "Không phun lúc ong hoạt động mạnh, tránh hít hơi thuốc.",
    manufacturer: "Bayer",
    toxicityLevel: "medium",
    withdrawalPeriod: "14 ngày",
    phi: 14,
    suitableCrops: ["Lúa", "Ớt", "Cam", "Xoài"],
    targetDiseases: ["Rầy nâu", "Rệp sáp", "Bọ trĩ", "Rệp mềm"],
    tags: ["chích hút", "lưu dẫn", "trừ sâu"],
  },
  {
    id: "pesticide-kocide",
    name: "Kocide",
    image: "https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=1200&q=80",
    tradeName: "Kocide 53.8DF",
    activeIngredient: "Copper Hydroxide",
    ingredients: "Copper Hydroxide",
    purpose: "Phòng trừ bệnh vi khuẩn và nấm trên cây ăn trái, rau, cây công nghiệp.",
    dosage: "20-30g/bình 16L",
    instructions: "Phun phòng hoặc phun sớm khi bệnh mới chớm, không pha chung với thuốc có tính kiềm mạnh.",
    usage: "Phun đều tán lá, ưu tiên sau mưa hoặc khi độ ẩm cao.",
    price: 0,
    category: "Thuốc hóa học",
    type: "chemical",
    formulation: "DF",
    safetyWarnings: "Mang khẩu trang và găng tay, không đổ tồn dư xuống ao hồ.",
    manufacturer: "Corteva",
    toxicityLevel: "low",
    withdrawalPeriod: "7 ngày",
    phi: 7,
    suitableCrops: ["Cà chua", "Cam", "Quýt", "Sầu riêng"],
    targetDiseases: ["Loét vi khuẩn", "Thán thư", "Đốm lá", "Xì mủ"],
    tags: ["gốc đồng", "vi khuẩn", "phòng bệnh"],
  },
  {
    id: "pesticide-bio-bacillus",
    name: "Bio Bacillus",
    image: "https://images.unsplash.com/photo-1523741543316-beb7fc7023d8?auto=format&fit=crop&w=1200&q=80",
    tradeName: "Bio Bacillus WP",
    activeIngredient: "Bacillus subtilis",
    ingredients: "Bacillus subtilis",
    purpose: "Hỗ trợ ức chế nấm bệnh, phù hợp canh tác an toàn và hữu cơ.",
    dosage: "30g/bình 16L",
    instructions: "Phun định kỳ 5-7 ngày/lần, hiệu quả tốt khi dùng sớm.",
    usage: "Phun mát trời, kết hợp vệ sinh đồng ruộng và giảm ẩm tán lá.",
    price: 0,
    category: "Thuốc sinh học",
    type: "biological",
    formulation: "WP",
    safetyWarnings: "Bảo quản nơi khô ráo, tránh nắng nóng trực tiếp.",
    manufacturer: "BioAgri",
    toxicityLevel: "low",
    withdrawalPeriod: "3 ngày",
    phi: 3,
    suitableCrops: ["Dưa leo", "Xà lách", "Cà chua", "Dâu tây"],
    targetDiseases: ["Phấn trắng", "Sương mai", "Đốm lá", "Thối nhũn"],
    tags: ["sinh học", "an toàn", "hữu cơ"],
  },
];

const nowIso = () => new Date().toISOString();
const createId = () => `pesticide-${Math.random().toString(36).slice(2, 10)}`;

const readLocal = (): Pesticide[] => {
  if (typeof window === "undefined") {
    return fallbackPesticides;
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return fallbackPesticides;

  try {
    const parsed = JSON.parse(raw) as Pesticide[];
    return parsed.length > 0 ? parsed : fallbackPesticides;
  } catch {
    return fallbackPesticides;
  }
};

const writeLocal = (pesticides: Pesticide[]) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(pesticides));
};

const mapRow = (row: PesticideRow): Pesticide => ({
  id: row.id,
  name: row.name,
  image: row.image_url ?? undefined,
  tradeName: row.trade_name ?? row.name,
  activeIngredient: row.active_ingredient ?? "",
  ingredients: row.active_ingredient ?? "",
  purpose: row.description ?? "",
  dosage: row.dosage ?? "",
  instructions: row.usage_instructions ?? "",
  usage: row.usage_instructions ?? "",
  price: 0,
  category: row.category,
  type: row.type ?? "other",
  formulation: row.formulation ?? undefined,
  safetyWarnings: row.safety_warnings ?? "",
  manufacturer: row.manufacturer ?? "",
  toxicityLevel: row.toxicity_level ?? undefined,
  withdrawalPeriod: row.withdrawal_period ?? "",
  phi: row.phi_days ?? undefined,
  suitableCrops: row.target_crops ?? [],
  targetDiseases: row.target_diseases ?? [],
  tags: row.tags ?? [],
});

const toRow = (input: PesticideInput & { id: string }): PesticideRow => ({
  id: input.id,
  name: input.name.trim(),
  image_url: input.image?.trim() || null,
  trade_name: input.tradeName?.trim() || input.name.trim(),
  active_ingredient: input.activeIngredient?.trim() || "",
  type: input.type ?? "other",
  category: input.category.trim(),
  manufacturer: input.manufacturer?.trim() || "",
  description: input.description?.trim() || input.purpose?.trim() || "",
  formulation: input.formulation?.trim() || "",
  dosage: input.dosage.trim(),
  usage_instructions: input.instructions.trim(),
  withdrawal_period: input.withdrawalPeriod?.trim() || "",
  phi_days: input.phi ?? null,
  safety_warnings: input.safetyWarnings?.trim() || "",
  target_crops: input.suitableCrops,
  target_diseases: input.targetDiseases,
  tags: input.tags,
  toxicity_level: input.toxicityLevel ?? null,
  created_at: nowIso(),
  updated_at: nowIso(),
});

export const uploadPesticideImage = async (file: File) => {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error("Supabase chưa được cấu hình.");
  }

  const fileExt = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const fileName = `pesticides/${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${fileExt}`;

  const { error } = await supabase.storage.from("pesticide-images").upload(fileName, file, {
    cacheControl: "3600",
    upsert: false,
  });

  if (error) {
    throw error;
  }

  const { data } = supabase.storage.from("pesticide-images").getPublicUrl(fileName);
  return data.publicUrl;
};

export const getPesticideLibrary = async (): Promise<PesticideLibraryPayload> => {
  const local = readLocal();

  if (!isSupabaseConfigured || !supabase) {
    return { pesticides: local, source: "local" };
  }

  try {
    const { data, error } = await supabase.from("pesticide_library").select("*").order("updated_at", { ascending: false });
    if (error || !data) {
      return { pesticides: local, source: "local" };
    }

    const pesticides = (data as PesticideRow[]).map(mapRow);
    if (pesticides.length === 0) {
      return { pesticides: local, source: "local" };
    }

    writeLocal(pesticides);
    return { pesticides, source: "supabase" };
  } catch {
    return { pesticides: local, source: "local" };
  }
};

export const upsertPesticideLibraryEntry = async (input: PesticideInput) => {
  const local = readLocal();
  const id = input.id ?? createId();
  const row = toRow({ ...input, id });

  if (!isSupabaseConfigured || !supabase) {
    throw new Error("Supabase chưa được cấu hình nên không thể lưu thuốc BVTV.");
  }

  const { data, error } = await supabase.from("pesticide_library").upsert(row, { onConflict: "id" }).select("*").single();
  if (error) {
    throw error;
  }

  const normalized = mapRow((data as PesticideRow | null) ?? row);
  const next = local.some((item) => item.id === id) ? local.map((item) => (item.id === id ? normalized : item)) : [normalized, ...local];
  writeLocal(next);

  return normalized;
};

export const deletePesticideLibraryEntry = async (id: string) => {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error("Supabase chưa được cấu hình nên không thể xóa thuốc BVTV.");
  }

  const { error } = await supabase.from("pesticide_library").delete().eq("id", id);
  if (error) {
    throw error;
  }

  const local = readLocal();
  const next = local.filter((item) => item.id !== id);
  writeLocal(next);

  return next;
};
