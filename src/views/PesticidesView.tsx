import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  AlertTriangle,
  ArrowRight,
  Beaker,
  Bug,
  CheckCircle2,
  Filter,
  FlaskConical,
  Leaf,
  ImagePlus,
  MapPin,
  Pencil,
  Search,
  Shield,
  Sprout,
  Trash2,
  X,
} from "lucide-react";
import { AppUser, Pesticide, View } from "../types";
import {
  deletePesticideLibraryEntry,
  getPesticideLibrary,
  PesticideInput,
  uploadPesticideImage,
  upsertPesticideLibraryEntry,
} from "../services/pesticideLibraryService";
import heroPesticideMain from "../../anh/thuoc.jpg";
import heroPesticideAltOne from "../../anh/thuoc1.jpg";
import heroPesticideAltTwo from "../../anh/thuoc2.webp";
import { LocalizedDictionary, useI18n } from "../i18n";

interface PesticidesViewProps {
  user: AppUser | null;
  setView: (v: View) => void;
}

type TypeFilter = "all" | NonNullable<Pesticide["type"]>;

type FormState = {
  id?: string;
  name: string;
  image: string;
  tradeName: string;
  activeIngredient: string;
  type: NonNullable<Pesticide["type"]>;
  category: string;
  manufacturer: string;
  description: string;
  formulation: string;
  dosage: string;
  instructions: string;
  withdrawalPeriod: string;
  phi: string;
  safetyWarnings: string;
  suitableCrops: string;
  targetDiseases: string;
  tags: string;
  toxicityLevel: NonNullable<Pesticide["toxicityLevel"]>;
};

const defaultForm: FormState = {
  name: "",
  image: "",
  tradeName: "",
  activeIngredient: "",
  type: "fungicide",
  category: "Thuốc trừ nấm",
  manufacturer: "",
  description: "",
  formulation: "",
  dosage: "",
  instructions: "",
  withdrawalPeriod: "",
  phi: "",
  safetyWarnings: "",
  suitableCrops: "",
  targetDiseases: "",
  tags: "",
  toxicityLevel: "medium",
};

const pesticideText: LocalizedDictionary = {
  heroBadge: { vi: "Thư viện thuốc BVTV", en: "Crop protection library", ja: "農薬ライブラリ" },
  heroTitle: { vi: "Tra cứu thuốc bảo vệ thực vật", en: "Crop protection product lookup", ja: "農薬・防除資材検索" },
  heroDesc: {
    vi: "Tra cứu thông tin thuốc, tìm thuốc phù hợp theo cây trồng và bệnh, đọc hướng dẫn sử dụng an toàn và quản lý dữ liệu thuốc tập trung bằng Supabase.",
    en: "Look up product information, find suitable options by crop and disease, read safe-use guidance, and manage product data centrally with Supabase.",
    ja: "薬剤情報を検索し、作物や病害別に適した資材を探し、安全な使用方法を確認し、Supabaseでデータを一元管理できます。",
  },
  searchByName: { vi: "Tra cứu theo tên thuốc", en: "Search by product name", ja: "薬剤名で検索" },
  searchByIngredient: { vi: "Tra cứu theo hoạt chất", en: "Search by active ingredient", ja: "有効成分で検索" },
  filterCropDisease: { vi: "Lọc theo cây và bệnh", en: "Filter by crop and disease", ja: "作物・病害で絞り込み" },
  notMarketplace: { vi: "Không phải sàn bán hàng", en: "Not a marketplace", ja: "販売サイトではありません" },
  storesTitle: { vi: "Tiệm thuốc BVTV khắp Việt Nam", en: "Crop protection stores across Vietnam", ja: "ベトナム各地の農薬店" },
  openMap: { vi: "Mở bản đồ", en: "Open map", ja: "地図を開く" },
  mapTitle: { vi: "Bản đồ tiệm thuốc bảo vệ thực vật tại Việt Nam", en: "Map of crop protection stores in Vietnam", ja: "ベトナムの農薬店マップ" },
  quickRegion: { vi: "Mở nhanh theo khu vực", en: "Quick open by region", ja: "地域で素早く表示" },
  regionHint: { vi: "Chọn tỉnh/thành, bản đồ sẽ tự zoom vào khu vực đó.", en: "Choose a province or city and the map will zoom into that area.", ja: "省・都市を選ぶと地図がその地域へズームします。" },
  nationwide: { vi: "Toàn quốc", en: "Nationwide", ja: "全国" },
  deepLibrary: { vi: "Thư viện chuyên sâu", en: "Specialized library", ja: "専門ライブラリ" },
  deepLibraryDesc: {
    vi: "Hỗ trợ lựa chọn đúng thuốc theo cây trồng, bệnh và nguyên tắc sử dụng an toàn.",
    en: "Helps choose the right product by crop, disease, and safe-use principles.",
    ja: "作物、病害、安全使用原則に基づいて適切な薬剤選択を支援します。",
  },
  dataSource: { vi: "Nguồn dữ liệu", en: "Data source", ja: "データソース" },
  backendNote: { vi: "Đang dùng backend hiện tại", en: "Using current backend", ja: "現在のバックエンドを使用中" },
  productCount: { vi: "Số thuốc", en: "Products", ja: "薬剤数" },
  readySamples: { vi: "Mẫu thuốc sẵn sàng tra cứu", en: "Products ready to search", ja: "検索可能な薬剤データ" },
  crops: { vi: "Cây trồng", en: "Crops", ja: "作物" },
  cropCatalog: { vi: "Danh mục cây đã gán", en: "Assigned crop catalog", ja: "登録済み作物カテゴリ" },
  productGroups: { vi: "Nhóm thuốc", en: "Product groups", ja: "薬剤グループ" },
  productGroupsNote: { vi: "Trừ sâu, trừ nấm, trừ cỏ, sinh học, hóa học", en: "Insecticide, fungicide, herbicide, biological, chemical", ja: "殺虫剤、殺菌剤、除草剤、生物農薬、化学農薬" },
  searchPlaceholder: { vi: "Tìm theo tên thuốc, hoạt chất, bệnh hoặc cây trồng", en: "Search by product name, active ingredient, disease, or crop", ja: "薬剤名、有効成分、病害、作物で検索" },
  allCrops: { vi: "Tất cả cây", en: "All crops", ja: "すべての作物" },
  allDiseases: { vi: "Tất cả bệnh", en: "All diseases", ja: "すべての病害" },
  matchingResults: { vi: "kết quả phù hợp", en: "matching results", ja: "件一致" },
  applicableCrops: { vi: "Cây áp dụng", en: "Applicable crops", ja: "対象作物" },
  withdrawal: { vi: "Cách ly", en: "Withdrawal", ja: "収穫前日数" },
  updating: { vi: "Đang cập nhật", en: "Updating", ja: "更新中" },
  day: { vi: "ngày", en: "days", ja: "日" },
  viewDetails: { vi: "Xem chi tiết", en: "View details", ja: "詳細を見る" },
  noResults: { vi: "Không có thuốc phù hợp với bộ lọc hiện tại.", en: "No products match the current filters.", ja: "現在のフィルターに一致する薬剤はありません。" },
  safetyGuide: { vi: "Hướng dẫn an toàn", en: "Safety guidance", ja: "安全ガイド" },
  useCorrectly: { vi: "Sử dụng đúng cách", en: "Use correctly", ja: "正しく使用" },
  adminData: { vi: "Admin quản lý dữ liệu", en: "Admin data management", ja: "管理者データ管理" },
  manageProducts: { vi: "Thêm / sửa / xóa thuốc", en: "Add / edit / delete products", ja: "薬剤の追加・編集・削除" },
  productImage: { vi: "Ảnh thuốc", en: "Product image", ja: "薬剤画像" },
  noImage: { vi: "Chưa có ảnh", en: "No image yet", ja: "画像なし" },
  uploadingImage: { vi: "Đang tải ảnh...", en: "Uploading image...", ja: "画像アップロード中..." },
  uploadImage: { vi: "Tải ảnh từ máy", en: "Upload image", ja: "画像をアップロード" },
  imageUrl: { vi: "Hoặc dán URL ảnh", en: "Or paste image URL", ja: "または画像URLを貼り付け" },
  tradeName: { vi: "Tên thương mại", en: "Trade name", ja: "商品名" },
  displayName: { vi: "Tên hiển thị / trade name", en: "Display name / trade name", ja: "表示名 / 商品名" },
  activeIngredient: { vi: "Hoạt chất", en: "Active ingredient", ja: "有効成分" },
  displayGroup: { vi: "Nhóm hiển thị", en: "Display group", ja: "表示グループ" },
  description: { vi: "Mô tả / bệnh phòng trừ", en: "Description / target diseases", ja: "説明 / 対象病害" },
  safeUse: { vi: "Cách sử dụng an toàn", en: "Safe-use instructions", ja: "安全な使用方法" },
  dosage: { vi: "Liều lượng", en: "Dosage", ja: "使用量" },
  withdrawalPeriod: { vi: "Thời gian cách ly", en: "Withdrawal period", ja: "収穫前日数" },
  cropsComma: { vi: "Cây áp dụng, cách nhau dấu phẩy", en: "Applicable crops, comma-separated", ja: "対象作物、カンマ区切り" },
  diseasesComma: { vi: "Bệnh phòng trừ, cách nhau dấu phẩy", en: "Target diseases, comma-separated", ja: "対象病害、カンマ区切り" },
  saving: { vi: "Đang lưu...", en: "Saving...", ja: "保存中..." },
  updateProduct: { vi: "Cập nhật thuốc", en: "Update product", ja: "薬剤を更新" },
  addProduct: { vi: "Thêm thuốc mới", en: "Add new product", ja: "新しい薬剤を追加" },
  reset: { vi: "Làm mới", en: "Reset", ja: "リセット" },
  targetDiseases: { vi: "Bệnh phòng trừ", en: "Target diseases", ja: "対象病害" },
  useDosage: { vi: "Liều lượng sử dụng", en: "Use dosage", ja: "使用量" },
  instructions: { vi: "Cách sử dụng", en: "Instructions", ja: "使用方法" },
  safetyWarning: { vi: "Cảnh báo an toàn", en: "Safety warning", ja: "安全警告" },
  defaultSafety: { vi: "Luôn mang đồ bảo hộ và tuân thủ đúng nhãn thuốc.", en: "Always wear protective gear and follow the product label.", ja: "必ず防護具を着用し、ラベル表示に従ってください。" },
  relatedProducts: { vi: "Thuốc liên quan", en: "Related products", ja: "関連薬剤" },
  requiredFields: { vi: "Vui lòng nhập đủ tên thuốc, hoạt chất, liều lượng và hướng dẫn sử dụng.", en: "Please enter product name, active ingredient, dosage, and instructions.", ja: "薬剤名、有効成分、使用量、使用方法を入力してください。" },
  saveSuccess: { vi: "Cập nhật thuốc thành công trên Supabase.", en: "Product updated successfully on Supabase.", ja: "Supabaseで薬剤を更新しました。" },
  addSuccess: { vi: "Thêm thuốc thành công trên Supabase.", en: "Product added successfully on Supabase.", ja: "Supabaseに薬剤を追加しました。" },
  saveError: { vi: "Không lưu được thuốc vào Supabase.", en: "Could not save product to Supabase.", ja: "Supabaseへ薬剤を保存できません。" },
  deleteSuccess: { vi: "Xóa thuốc thành công trên Supabase.", en: "Product deleted successfully on Supabase.", ja: "Supabaseから薬剤を削除しました。" },
  deleteError: { vi: "Không xóa được thuốc khỏi Supabase.", en: "Could not delete product from Supabase.", ja: "Supabaseから薬剤を削除できません。" },
  uploadSuccess: { vi: "Tải ảnh thuốc thành công.", en: "Product image uploaded successfully.", ja: "薬剤画像をアップロードしました。" },
  uploadError: { vi: "Không tải được ảnh lên Supabase Storage.", en: "Could not upload image to Supabase Storage.", ja: "Supabase Storageへ画像をアップロードできません。" },
};

const typeMeta: Array<{ id: TypeFilter; label: LocalizedDictionary[string]; icon: React.ElementType }> = [
  { id: "all", label: { vi: "Tất cả", en: "All", ja: "すべて" }, icon: Shield },
  { id: "insecticide", label: { vi: "Thuốc trừ sâu", en: "Insecticide", ja: "殺虫剤" }, icon: Bug },
  { id: "fungicide", label: { vi: "Thuốc trừ nấm", en: "Fungicide", ja: "殺菌剤" }, icon: FlaskConical },
  { id: "herbicide", label: { vi: "Thuốc trừ cỏ", en: "Herbicide", ja: "除草剤" }, icon: Leaf },
  { id: "biological", label: { vi: "Thuốc sinh học", en: "Biological product", ja: "生物農薬" }, icon: Sprout },
  { id: "chemical", label: { vi: "Thuốc hóa học", en: "Chemical product", ja: "化学農薬" }, icon: Beaker },
];

const safetyChecklist = [
  { vi: "Đọc kỹ nhãn thuốc, đúng cây trồng, đúng bệnh và đúng liều lượng.", en: "Read the label carefully and use the right crop, disease, and dose.", ja: "ラベルをよく読み、対象作物・病害・用量を守ってください。" },
  { vi: "Mang găng tay, khẩu trang, kính và quần áo bảo hộ khi pha, phun.", en: "Wear gloves, mask, goggles, and protective clothing when mixing or spraying.", ja: "調製・散布時は手袋、マスク、保護眼鏡、防護服を着用してください。" },
  { vi: "Không pha thuốc gần ao hồ, nguồn nước sinh hoạt hoặc khu chăn nuôi.", en: "Do not mix products near ponds, drinking water sources, or livestock areas.", ja: "池、生活用水、畜舎の近くで薬剤を調製しないでください。" },
  { vi: "Tuân thủ thời gian cách ly trước khi thu hoạch và luân phiên hoạt chất.", en: "Respect pre-harvest intervals and rotate active ingredients.", ja: "収穫前日数を守り、有効成分をローテーションしてください。" },
];

const pesticideStoreRegions = [
  "Hà Nội",
  "TP Hồ Chí Minh",
  "Đà Nẵng",
  "Cần Thơ",
  "Hải Phòng",
  "Bắc Giang",
  "Hưng Yên",
  "Hải Dương",
  "Thái Bình",
  "Nam Định",
  "Thanh Hóa",
  "Nghệ An",
  "Hà Tĩnh",
  "Quảng Bình",
  "Quảng Trị",
  "Thừa Thiên Huế",
  "Quảng Nam",
  "Quảng Ngãi",
  "Bình Định",
  "Phú Yên",
  "Khánh Hòa",
  "Ninh Thuận",
  "Bình Thuận",
  "Lâm Đồng",
  "Đắk Lắk",
  "Đắk Nông",
  "Gia Lai",
  "Kon Tum",
  "Bình Phước",
  "Tây Ninh",
  "Đồng Nai",
  "Bình Dương",
  "Long An",
  "Tiền Giang",
  "Bến Tre",
  "Đồng Tháp",
  "An Giang",
  "Kiên Giang",
  "Vĩnh Long",
  "Trà Vinh",
  "Sóc Trăng",
  "Hậu Giang",
  "Bạc Liêu",
  "Cà Mau",
];

const mapRegionCenters: Record<string, { lat: number; lng: number; zoom: number }> = {
  "Việt Nam": { lat: 16.4637, lng: 107.5909, zoom: 5 },
  "Hà Nội": { lat: 21.0285, lng: 105.8542, zoom: 11 },
  "TP Hồ Chí Minh": { lat: 10.7769, lng: 106.7009, zoom: 11 },
  "Đà Nẵng": { lat: 16.0544, lng: 108.2022, zoom: 11 },
  "Cần Thơ": { lat: 10.0452, lng: 105.7469, zoom: 11 },
  "Hải Phòng": { lat: 20.8449, lng: 106.6881, zoom: 11 },
  "Bắc Giang": { lat: 21.2731, lng: 106.1946, zoom: 10 },
  "Hưng Yên": { lat: 20.6464, lng: 106.0511, zoom: 11 },
  "Hải Dương": { lat: 20.9373, lng: 106.3146, zoom: 10 },
  "Thái Bình": { lat: 20.4463, lng: 106.3366, zoom: 10 },
  "Nam Định": { lat: 20.4388, lng: 106.1621, zoom: 10 },
  "Thanh Hóa": { lat: 19.8067, lng: 105.7852, zoom: 9 },
  "Nghệ An": { lat: 19.2342, lng: 104.9200, zoom: 8 },
  "Hà Tĩnh": { lat: 18.3559, lng: 105.8877, zoom: 9 },
  "Quảng Bình": { lat: 17.6103, lng: 106.3487, zoom: 9 },
  "Quảng Trị": { lat: 16.7943, lng: 106.9634, zoom: 9 },
  "Thừa Thiên Huế": { lat: 16.4674, lng: 107.5905, zoom: 10 },
  "Quảng Nam": { lat: 15.5394, lng: 108.0191, zoom: 9 },
  "Quảng Ngãi": { lat: 15.1214, lng: 108.8044, zoom: 9 },
  "Bình Định": { lat: 13.7820, lng: 109.2197, zoom: 9 },
  "Phú Yên": { lat: 13.0882, lng: 109.0929, zoom: 9 },
  "Khánh Hòa": { lat: 12.2585, lng: 109.0526, zoom: 9 },
  "Ninh Thuận": { lat: 11.6739, lng: 108.8620, zoom: 9 },
  "Bình Thuận": { lat: 10.9805, lng: 108.2615, zoom: 9 },
  "Lâm Đồng": { lat: 11.5753, lng: 108.1429, zoom: 9 },
  "Đắk Lắk": { lat: 12.7100, lng: 108.2378, zoom: 9 },
  "Đắk Nông": { lat: 12.2646, lng: 107.6098, zoom: 9 },
  "Gia Lai": { lat: 13.9833, lng: 108.0000, zoom: 8 },
  "Kon Tum": { lat: 14.3497, lng: 108.0005, zoom: 9 },
  "Bình Phước": { lat: 11.7512, lng: 106.7235, zoom: 9 },
  "Tây Ninh": { lat: 11.3352, lng: 106.1099, zoom: 9 },
  "Đồng Nai": { lat: 11.0686, lng: 107.1676, zoom: 9 },
  "Bình Dương": { lat: 11.3254, lng: 106.4770, zoom: 10 },
  "Long An": { lat: 10.6956, lng: 106.2431, zoom: 9 },
  "Tiền Giang": { lat: 10.4493, lng: 106.3421, zoom: 10 },
  "Bến Tre": { lat: 10.1082, lng: 106.4406, zoom: 10 },
  "Đồng Tháp": { lat: 10.4938, lng: 105.6882, zoom: 10 },
  "An Giang": { lat: 10.5216, lng: 105.1259, zoom: 10 },
  "Kiên Giang": { lat: 10.0125, lng: 105.0809, zoom: 9 },
  "Vĩnh Long": { lat: 10.2537, lng: 105.9722, zoom: 10 },
  "Trà Vinh": { lat: 9.8127, lng: 106.2993, zoom: 10 },
  "Sóc Trăng": { lat: 9.6025, lng: 105.9739, zoom: 10 },
  "Hậu Giang": { lat: 9.7845, lng: 105.4701, zoom: 10 },
  "Bạc Liêu": { lat: 9.2940, lng: 105.7216, zoom: 10 },
  "Cà Mau": { lat: 9.1768, lng: 105.1524, zoom: 10 },
};

const mapsSearchUrl = (location: string) =>
  `https://www.google.com/maps/search/${encodeURIComponent(`tiệm thuốc bảo vệ thực vật ${location}`)}`;

const mapsEmbedUrl = (location: string) => {
  const center = mapRegionCenters[location] ?? mapRegionCenters["Việt Nam"];
  const query = encodeURIComponent(`tiệm thuốc bảo vệ thực vật ${location}`);
  return `https://maps.google.com/maps?hl=vi&ll=${center.lat},${center.lng}&z=${center.zoom}&q=${query}&output=embed`;
};

const splitCsv = (value: string) =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const adminFieldClass =
  "w-full rounded-[16px] border border-[#e4dece] bg-[#faf7f1] px-4 text-sm text-[#24352a] placeholder:text-[#b2aa96] outline-none transition focus:border-[#c2b48d] focus:bg-white";

const adminTextAreaClass =
  "w-full rounded-[16px] border border-[#e4dece] bg-[#faf7f1] px-4 py-3 text-sm text-[#24352a] placeholder:text-[#b2aa96] outline-none transition focus:border-[#c2b48d] focus:bg-white";

const formFromPesticide = (item: Pesticide): FormState => ({
  id: item.id,
  name: item.name,
  image: item.image ?? "",
  tradeName: item.tradeName ?? item.name,
  activeIngredient: item.activeIngredient ?? item.ingredients ?? "",
  type: item.type ?? "other",
  category: item.category,
  manufacturer: item.manufacturer ?? "",
  description: item.purpose ?? "",
  formulation: item.formulation ?? "",
  dosage: item.dosage,
  instructions: item.instructions ?? item.usage ?? "",
  withdrawalPeriod: item.withdrawalPeriod ?? "",
  phi: item.phi ? String(item.phi) : "",
  safetyWarnings: item.safetyWarnings ?? "",
  suitableCrops: (item.suitableCrops ?? []).join(", "),
  targetDiseases: (item.targetDiseases ?? []).join(", "),
  tags: (item.tags ?? []).join(", "),
  toxicityLevel: item.toxicityLevel ?? "medium",
});

const PesticidesView = ({ user, setView }: PesticidesViewProps) => {
  const { language } = useI18n();
  const tt = (key: string) => pesticideText[key]?.[language] ?? pesticideText[key]?.vi ?? key;
  const localizedValue: Record<string, LocalizedDictionary[string]> = {
    "Thuốc trừ sâu": { vi: "Thuốc trừ sâu", en: "Insecticide", ja: "殺虫剤" },
    "Thuốc trừ nấm": { vi: "Thuốc trừ nấm", en: "Fungicide", ja: "殺菌剤" },
    "Thuốc trừ cỏ": { vi: "Thuốc trừ cỏ", en: "Herbicide", ja: "除草剤" },
    "Thuốc sinh học": { vi: "Thuốc sinh học", en: "Biological product", ja: "生物農薬" },
    "Thuốc hóa học": { vi: "Thuốc hóa học", en: "Chemical product", ja: "化学農薬" },
    "Thuốc BVTV": { vi: "Thuốc BVTV", en: "Crop protection product", ja: "農薬・防除資材" },
    "Lúa": { vi: "Lúa", en: "Rice", ja: "イネ" },
    "Cà chua": { vi: "Cà chua", en: "Tomato", ja: "トマト" },
    "Dưa leo": { vi: "Dưa leo", en: "Cucumber", ja: "キュウリ" },
    "Ớt": { vi: "Ớt", en: "Chili pepper", ja: "トウガラシ" },
    "Cam": { vi: "Cam", en: "Orange", ja: "オレンジ" },
    "Xoài": { vi: "Xoài", en: "Mango", ja: "マンゴー" },
    "Quýt": { vi: "Quýt", en: "Mandarin", ja: "ミカン" },
    "Sầu riêng": { vi: "Sầu riêng", en: "Durian", ja: "ドリアン" },
    "Xà lách": { vi: "Xà lách", en: "Lettuce", ja: "レタス" },
    "Dâu tây": { vi: "Dâu tây", en: "Strawberry", ja: "イチゴ" },
    "Sương mai": { vi: "Sương mai", en: "Late blight / downy mildew", ja: "疫病 / べと病" },
    "Thối rễ": { vi: "Thối rễ", en: "Root rot", ja: "根腐れ" },
    "Thối gốc": { vi: "Thối gốc", en: "Stem/base rot", ja: "株元腐敗" },
    "Đạo ôn": { vi: "Đạo ôn", en: "Rice blast", ja: "いもち病" },
    "Rầy nâu": { vi: "Rầy nâu", en: "Brown planthopper", ja: "トビイロウンカ" },
    "Rệp sáp": { vi: "Rệp sáp", en: "Mealybug", ja: "カイガラムシ" },
    "Bọ trĩ": { vi: "Bọ trĩ", en: "Thrips", ja: "アザミウマ" },
    "Rệp mềm": { vi: "Rệp mềm", en: "Aphid", ja: "アブラムシ" },
    "Loét vi khuẩn": { vi: "Loét vi khuẩn", en: "Bacterial canker", ja: "細菌性かいよう病" },
    "Thán thư": { vi: "Thán thư", en: "Anthracnose", ja: "炭疽病" },
    "Đốm lá": { vi: "Đốm lá", en: "Leaf spot", ja: "葉斑病" },
    "Xì mủ": { vi: "Xì mủ", en: "Gummosis", ja: "樹脂病" },
    "Phấn trắng": { vi: "Phấn trắng", en: "Powdery mildew", ja: "うどんこ病" },
    "Thối nhũn": { vi: "Thối nhũn", en: "Soft rot", ja: "軟腐病" },
    "Phòng trừ nấm bệnh và giả nấm trên rau màu, cây ăn trái, lúa.": {
      vi: "Phòng trừ nấm bệnh và giả nấm trên rau màu, cây ăn trái, lúa.",
      en: "Controls fungal and oomycete diseases on vegetables, fruit trees, and rice.",
      ja: "野菜、果樹、イネの糸状菌病・卵菌病を防除します。",
    },
    "Kiểm soát rầy, rệp, bọ trĩ và côn trùng chích hút.": {
      vi: "Kiểm soát rầy, rệp, bọ trĩ và côn trùng chích hút.",
      en: "Controls planthoppers, aphids, thrips, and sucking insects.",
      ja: "ウンカ、アブラムシ、アザミウマ、吸汁性害虫を防除します。",
    },
    "Phòng trừ bệnh vi khuẩn và nấm trên cây ăn trái, rau, cây công nghiệp.": {
      vi: "Phòng trừ bệnh vi khuẩn và nấm trên cây ăn trái, rau, cây công nghiệp.",
      en: "Controls bacterial and fungal diseases on fruit trees, vegetables, and industrial crops.",
      ja: "果樹、野菜、工芸作物の細菌病・糸状菌病を防除します。",
    },
    "Hỗ trợ ức chế nấm bệnh, phù hợp canh tác an toàn và hữu cơ.": {
      vi: "Hỗ trợ ức chế nấm bệnh, phù hợp canh tác an toàn và hữu cơ.",
      en: "Helps suppress fungal diseases and suits safer or organic-oriented cultivation.",
      ja: "糸状菌病の抑制を助け、安全・有機志向の栽培に適しています。",
    },
    "Phun khi bệnh chớm xuất hiện, lặp lại sau 5-7 ngày nếu áp lực bệnh cao.": {
      vi: "Phun khi bệnh chớm xuất hiện, lặp lại sau 5-7 ngày nếu áp lực bệnh cao.",
      en: "Spray when disease first appears; repeat after 5-7 days if pressure is high.",
      ja: "発病初期に散布し、病圧が高い場合は5〜7日後に再散布してください。",
    },
    "Phun đều hai mặt lá vào sáng sớm hoặc chiều mát.": {
      vi: "Phun đều hai mặt lá vào sáng sớm hoặc chiều mát.",
      en: "Spray evenly on both leaf surfaces in early morning or late afternoon.",
      ja: "早朝または涼しい夕方に葉の両面へ均一に散布してください。",
    },
    "Phun khi mật độ sâu vượt ngưỡng, luân phiên hoạt chất để tránh kháng thuốc.": {
      vi: "Phun khi mật độ sâu vượt ngưỡng, luân phiên hoạt chất để tránh kháng thuốc.",
      en: "Spray when pest density exceeds the threshold and rotate active ingredients to avoid resistance.",
      ja: "害虫密度が基準を超えた時に散布し、抵抗性回避のため有効成分をローテーションしてください。",
    },
    "Phun tập trung mặt dưới lá và đọt non.": {
      vi: "Phun tập trung mặt dưới lá và đọt non.",
      en: "Focus spraying on leaf undersides and young shoots.",
      ja: "葉裏と新梢を中心に散布してください。",
    },
    "Phun phòng hoặc phun sớm khi bệnh mới chớm, không pha chung với thuốc có tính kiềm mạnh.": {
      vi: "Phun phòng hoặc phun sớm khi bệnh mới chớm, không pha chung với thuốc có tính kiềm mạnh.",
      en: "Use preventively or early at disease onset; do not mix with strongly alkaline products.",
      ja: "予防または発病初期に散布し、強アルカリ性資材とは混用しないでください。",
    },
    "Phun đều tán lá, ưu tiên sau mưa hoặc khi độ ẩm cao.": {
      vi: "Phun đều tán lá, ưu tiên sau mưa hoặc khi độ ẩm cao.",
      en: "Spray canopy evenly, especially after rain or during high humidity.",
      ja: "樹冠全体に均一散布し、雨後や高湿度時を優先してください。",
    },
    "Phun định kỳ 5-7 ngày/lần, hiệu quả tốt khi dùng sớm.": {
      vi: "Phun định kỳ 5-7 ngày/lần, hiệu quả tốt khi dùng sớm.",
      en: "Spray every 5-7 days; works best when used early.",
      ja: "5〜7日ごとに散布し、早期使用で効果が高まります。",
    },
    "Phun mát trời, kết hợp vệ sinh đồng ruộng và giảm ẩm tán lá.": {
      vi: "Phun mát trời, kết hợp vệ sinh đồng ruộng và giảm ẩm tán lá.",
      en: "Spray in cool conditions and combine with field sanitation and lower canopy humidity.",
      ja: "涼しい時間に散布し、圃場衛生と樹冠湿度の低減を組み合わせてください。",
    },
    "Mang đầy đủ bảo hộ, không pha gần nguồn nước sinh hoạt.": {
      vi: "Mang đầy đủ bảo hộ, không pha gần nguồn nước sinh hoạt.",
      en: "Wear full protective gear and do not mix near household water sources.",
      ja: "十分な防護具を着用し、生活用水の近くで調製しないでください。",
    },
    "Không phun lúc ong hoạt động mạnh, tránh hít hơi thuốc.": {
      vi: "Không phun lúc ong hoạt động mạnh, tránh hít hơi thuốc.",
      en: "Do not spray when bees are highly active and avoid inhaling spray mist.",
      ja: "ミツバチが活発な時間の散布を避け、薬液ミストを吸い込まないでください。",
    },
    "Mang khẩu trang và găng tay, không đổ tồn dư xuống ao hồ.": {
      vi: "Mang khẩu trang và găng tay, không đổ tồn dư xuống ao hồ.",
      en: "Wear a mask and gloves, and do not pour residues into ponds or lakes.",
      ja: "マスクと手袋を着用し、残液を池や湖へ流さないでください。",
    },
    "Bảo quản nơi khô ráo, tránh nắng nóng trực tiếp.": {
      vi: "Bảo quản nơi khô ráo, tránh nắng nóng trực tiếp.",
      en: "Store in a dry place away from direct heat and sunlight.",
      ja: "直射日光や高温を避け、乾燥した場所で保管してください。",
    },
  };
  const translateValue = (value?: string | null) => (value ? localizedValue[value]?.[language] ?? value : "");
  const translateList = (items?: string[]) => (items ?? []).map(translateValue);
  const formatWithdrawal = (item: Pesticide) =>
    item.withdrawalPeriod ? translateValue(item.withdrawalPeriod).replace("ngày", tt("day")) : item.phi ? `${item.phi} ${tt("day")}` : tt("updating");
  const [pesticides, setPesticides] = useState<Pesticide[]>([]);
  const [dataSource, setDataSource] = useState<"supabase" | "local">("local");
  const [searchTerm, setSearchTerm] = useState("");
  const [cropFilter, setCropFilter] = useState("__all_crops__");
  const [diseaseFilter, setDiseaseFilter] = useState("__all_diseases__");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [selectedPesticide, setSelectedPesticide] = useState<Pesticide | null>(null);
  const [mapRegion, setMapRegion] = useState("Việt Nam");
  const [form, setForm] = useState<FormState>(defaultForm);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const isAdmin = user?.role === "admin";

  useEffect(() => {
    void getPesticideLibrary().then((payload) => {
      setPesticides(payload.pesticides);
      setDataSource(payload.source);
    });
  }, []);

  const cropOptions = useMemo(
    () => ["__all_crops__", ...(Array.from(new Set(pesticides.flatMap((item) => item.suitableCrops ?? []))) as string[]).sort((a, b) => a.localeCompare(b, "vi"))],
    [pesticides]
  );

  const diseaseOptions = useMemo(
    () => ["__all_diseases__", ...(Array.from(new Set(pesticides.flatMap((item) => item.targetDiseases ?? []))) as string[]).sort((a, b) => a.localeCompare(b, "vi"))],
    [pesticides]
  );

  const filteredPesticides = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    return pesticides.filter((item) => {
      const matchesKeyword =
        keyword.length === 0 ||
        item.name.toLowerCase().includes(keyword) ||
        (item.tradeName ?? "").toLowerCase().includes(keyword) ||
        (item.activeIngredient ?? item.ingredients ?? "").toLowerCase().includes(keyword) ||
        (item.targetDiseases ?? []).some((disease) => disease.toLowerCase().includes(keyword)) ||
        (item.suitableCrops ?? []).some((crop) => crop.toLowerCase().includes(keyword));

      const matchesCrop = cropFilter === "__all_crops__" || (item.suitableCrops ?? []).includes(cropFilter);
      const matchesDisease = diseaseFilter === "__all_diseases__" || (item.targetDiseases ?? []).includes(diseaseFilter);
      const matchesType = typeFilter === "all" || item.type === typeFilter;

      return matchesKeyword && matchesCrop && matchesDisease && matchesType;
    });
  }, [cropFilter, diseaseFilter, pesticides, searchTerm, typeFilter]);

  const groupedCounts = useMemo(
    () =>
      typeMeta.map((entry) => ({
        ...entry,
        count: entry.id === "all" ? pesticides.length : pesticides.filter((item) => item.type === entry.id).length,
      })),
    [pesticides]
  );

  const relatedPesticides = useMemo(() => {
    if (!selectedPesticide) return [];
    return pesticides
      .filter(
        (item) =>
          item.id !== selectedPesticide.id &&
          ((item.suitableCrops ?? []).some((crop) => (selectedPesticide.suitableCrops ?? []).includes(crop)) ||
            (item.targetDiseases ?? []).some((disease) => (selectedPesticide.targetDiseases ?? []).includes(disease)))
      )
      .slice(0, 3);
  }, [pesticides, selectedPesticide]);

  const handleSave = async () => {
    if (!form.name.trim() || !form.activeIngredient.trim() || !form.dosage.trim() || !form.instructions.trim()) {
      setFeedback(tt("requiredFields"));
      return;
    }

    setIsSaving(true);
    setFeedback(null);

    const payload: PesticideInput = {
      id: form.id,
      name: form.name,
      image: form.image,
      tradeName: form.tradeName,
      activeIngredient: form.activeIngredient,
      type: form.type,
      category: form.category,
      manufacturer: form.manufacturer,
      description: form.description,
      formulation: form.formulation,
      dosage: form.dosage,
      instructions: form.instructions,
      withdrawalPeriod: form.withdrawalPeriod,
      phi: form.phi ? Number(form.phi) : undefined,
      safetyWarnings: form.safetyWarnings,
      suitableCrops: splitCsv(form.suitableCrops),
      targetDiseases: splitCsv(form.targetDiseases),
      tags: splitCsv(form.tags),
      toxicityLevel: form.toxicityLevel,
    };

    try {
      const saved = await upsertPesticideLibraryEntry(payload);
      setPesticides((current) => (current.some((item) => item.id === saved.id) ? current.map((item) => (item.id === saved.id ? saved : item)) : [saved, ...current]));
      setDataSource("supabase");
      setForm(defaultForm);
      setFeedback(form.id ? tt("saveSuccess") : tt("addSuccess"));
    } catch (error) {
      console.error("Failed to save pesticide entry:", error);
      setFeedback(error instanceof Error ? error.message : tt("saveError"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setFeedback(null);

    try {
      const next = await deletePesticideLibraryEntry(id);
      setPesticides(next);
      setDataSource("supabase");
      if (selectedPesticide?.id === id) {
        setSelectedPesticide(null);
      }
      if (form.id === id) {
        setForm(defaultForm);
      }
      setFeedback(tt("deleteSuccess"));
    } catch (error) {
      console.error("Failed to delete pesticide entry:", error);
      setFeedback(error instanceof Error ? error.message : tt("deleteError"));
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    setFeedback(null);

    try {
      const imageUrl = await uploadPesticideImage(file);
      setForm((current) => ({ ...current, image: imageUrl }));
      setFeedback(tt("uploadSuccess"));
    } catch (error) {
      console.error("Failed to upload pesticide image:", error);
      setFeedback(tt("uploadError"));
    } finally {
      setIsUploadingImage(false);
      event.target.value = "";
    }
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f7f4ed_0%,#f2eee5_48%,#ece7db_100%)] pt-28 pb-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <section className="overflow-hidden rounded-[40px] border border-[#ddd6c7] bg-[radial-gradient(circle_at_top_left,rgba(65,137,94,0.18),transparent_26%),radial-gradient(circle_at_bottom_right,rgba(194,177,126,0.16),transparent_24%),linear-gradient(160deg,#fffdf8_0%,#f8f3ea_58%,#f1ebde_100%)] p-6 shadow-[0_28px_80px_rgba(106,96,70,0.10)] sm:p-8">
          <div className="grid gap-8 xl:grid-cols-[1.02fr_0.98fr]">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.24em] text-[#386047]">
                <Shield className="h-3.5 w-3.5" />
                {tt("heroBadge")}
              </div>
              <h1 className="mt-5 text-4xl font-black tracking-tight text-[#203126] sm:text-6xl">
                {tt("heroTitle")}
              </h1>
              <p className="mt-5 max-w-3xl text-base leading-8 text-[#6f6858]">
                {tt("heroDesc")}
              </p>
              <div className="mt-8 flex flex-wrap gap-3 text-sm">
                <span className="rounded-full border border-[#ded6c6] bg-white/80 px-4 py-2 text-[#5f5a4c]">{tt("searchByName")}</span>
                <span className="rounded-full border border-[#ded6c6] bg-white/80 px-4 py-2 text-[#5f5a4c]">{tt("searchByIngredient")}</span>
                <span className="rounded-full border border-[#ded6c6] bg-white/80 px-4 py-2 text-[#5f5a4c]">{tt("filterCropDisease")}</span>
                <span className="rounded-full border border-[#ded6c6] bg-white/80 px-4 py-2 text-[#5f5a4c]">{tt("notMarketplace")}</span>
              </div>
              <div className="mt-8 overflow-hidden rounded-[28px] border border-[#ddd6c7] bg-white/82 shadow-[0_16px_42px_rgba(106,96,70,0.08)]">
                <div className="flex flex-col gap-3 border-b border-[#e8e0d2] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-[#356347]">
                      <MapPin className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#8d856f]">Google Maps</p>
                      <h2 className="text-lg font-black text-[#223428]">{tt("storesTitle")}</h2>
                    </div>
                  </div>
                  <a
                    href={mapsSearchUrl(mapRegion)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-full bg-[#224733] px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-white transition-colors hover:bg-[#1a3928]"
                  >
                    {tt("openMap")}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </a>
                </div>
                <div className="h-[210px] bg-[#f5efe4]">
                  <iframe
                    key={mapRegion}
                    title={tt("mapTitle")}
                    src={mapsEmbedUrl(mapRegion)}
                    className="h-full w-full border-0"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
                <div className="border-t border-[#e8e0d2] bg-[#fffdfa] px-5 py-3">
                  <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_260px] sm:items-center">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#8d856f]">{tt("quickRegion")}</p>
                      <p className="mt-1 text-sm leading-6 text-[#6f6858]">{tt("regionHint")}</p>
                    </div>
                    <select
                      value={mapRegion}
                      onChange={(event) => setMapRegion(event.target.value)}
                      className="h-11 rounded-[14px] border border-[#e4dece] bg-[#faf7f1] px-3 text-sm font-semibold text-[#5f5a4c] outline-none transition focus:border-[#315f45]"
                    >
                      <option value="Việt Nam">{tt("nationwide")}</option>
                      {pesticideStoreRegions.map((region) => (
                        <option key={region} value={region}>
                          {region}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="relative min-h-[420px] rounded-[32px] border border-[#e2dccd] bg-white/60 p-4 shadow-[0_12px_36px_rgba(106,96,70,0.06)]">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.32),transparent_42%)]" />
                <div className="relative grid h-full grid-cols-[1.15fr_0.85fr] gap-3">
                  <div className="overflow-hidden rounded-[26px]">
                    <img src={heroPesticideMain} alt={tt("heroTitle")} className="h-full min-h-[388px] w-full object-cover" />
                  </div>
                  <div className="flex flex-col gap-3">
                    <div className="overflow-hidden rounded-[22px] border border-white/60 bg-white/70">
                      <img src={heroPesticideAltOne} alt={`${tt("heroBadge")} 1`} className="h-[188px] w-full object-cover" />
                    </div>
                    <div className="overflow-hidden rounded-[22px] border border-white/60 bg-white/70">
                      <img src={heroPesticideAltTwo} alt={`${tt("heroBadge")} 2`} className="h-[188px] w-full object-cover" />
                    </div>
                  </div>
                </div>
                <div className="absolute bottom-5 left-5 rounded-[22px] border border-white/60 bg-[#fffdfa]/88 px-5 py-4 backdrop-blur-md">
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#8d856f]">{tt("deepLibrary")}</p>
                  <p className="mt-2 max-w-[240px] text-sm leading-6 text-[#5f5a4c]">
                    {tt("deepLibraryDesc")}
                  </p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                {[
                  { label: tt("dataSource"), value: dataSource === "supabase" ? "Supabase" : "Fallback local", note: tt("backendNote") },
                  { label: tt("productCount"), value: String(pesticides.length), note: tt("readySamples") },
                  { label: tt("crops"), value: String(Math.max(cropOptions.length - 1, 0)), note: tt("cropCatalog") },
                  { label: tt("productGroups"), value: "5+", note: tt("productGroupsNote") },
                ].map((item, index) => (
                  <div
                    key={item.label}
                    className={`rounded-[24px] border border-[#e2dccd] p-5 shadow-[0_12px_36px_rgba(106,96,70,0.06)] ${
                      index === 0 ? "bg-[#224733] text-white" : "bg-white/78"
                    }`}
                  >
                    <p className={`text-[10px] font-bold uppercase tracking-[0.22em] ${index === 0 ? "text-white/55" : "text-[#8d856f]"}`}>{item.label}</p>
                    <p className={`mt-3 text-3xl font-black ${index === 0 ? "text-white" : "text-[#203126]"}`}>{item.value}</p>
                    <p className={`mt-2 text-sm leading-6 ${index === 0 ? "text-white/72" : "text-[#756d5a]"}`}>{item.note}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-[30px] border border-[#ddd6c7] bg-white/82 p-5 shadow-[0_20px_60px_rgba(106,96,70,0.08)] backdrop-blur-xl sm:p-6">
          <div className="grid gap-4 xl:grid-cols-[1.4fr_repeat(3,0.7fr)]">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8d856f]" />
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder={tt("searchPlaceholder")}
                className="h-14 w-full rounded-[18px] border border-[#e4dece] bg-[#faf7f1] pl-12 pr-4 text-sm text-[#24352a] outline-none transition focus:border-[#c2b48d]"
              />
            </label>

            <select
              value={cropFilter}
              onChange={(event) => setCropFilter(event.target.value)}
              className="h-14 rounded-[18px] border border-[#e4dece] bg-[#faf7f1] px-4 text-sm text-[#24352a] outline-none"
            >
              {cropOptions.map((crop) => (
                <option key={crop} value={crop}>
                  {crop === "__all_crops__" ? tt("allCrops") : translateValue(crop)}
                </option>
              ))}
            </select>

            <select
              value={diseaseFilter}
              onChange={(event) => setDiseaseFilter(event.target.value)}
              className="h-14 rounded-[18px] border border-[#e4dece] bg-[#faf7f1] px-4 text-sm text-[#24352a] outline-none"
            >
              {diseaseOptions.map((disease) => (
                <option key={disease} value={disease}>
                  {disease === "__all_diseases__" ? tt("allDiseases") : translateValue(disease)}
                </option>
              ))}
            </select>

            <div className="flex h-14 items-center gap-3 rounded-[18px] border border-[#e4dece] bg-[#faf7f1] px-4 text-sm text-[#6a644f]">
              <Filter className="h-4 w-4 text-[#356347]" />
              <span>{filteredPesticides.length} {tt("matchingResults")}</span>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            {groupedCounts.map((item) => {
              const Icon = item.icon;
              const active = typeFilter === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setTypeFilter(item.id)}
                  className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${
                    active ? "border-[#315f45] bg-[#315f45] text-white" : "border-[#e4dece] bg-[#faf7f1] text-[#5d584a]"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label[language]}
                  <span className={`rounded-full px-2 py-0.5 text-xs ${active ? "bg-white/15" : "bg-white"}`}>{item.count}</span>
                </button>
              );
            })}
          </div>
        </section>

        <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_340px] 2xl:grid-cols-[minmax(0,1.65fr)_320px]">
          <section>
            <div className="grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
              {filteredPesticides.map((item) => (
                <motion.article
                  key={item.id}
                  whileHover={{ y: -4 }}
                  className="rounded-[28px] border border-[#e0daca] bg-white/86 p-6 shadow-[0_14px_40px_rgba(106,96,70,0.08)]"
                >
                  <div className="mb-5 overflow-hidden rounded-[22px] border border-[#e8e1d4] bg-[#f5efe4]">
                    {item.image ? (
                      <img src={item.image} alt={item.tradeName ?? item.name} className="h-48 w-full object-cover" />
                    ) : (
                      <div className="flex h-48 items-center justify-center bg-[linear-gradient(135deg,#eef6ef,#f6efe3)]">
                        <Shield className="h-12 w-12 text-[#356347]" />
                      </div>
                    )}
                  </div>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eef6ef]">
                      <Shield className="h-5 w-5 text-[#356347]" />
                    </div>
                    <span className="rounded-full border border-[#dfe8e1] bg-[#f4faf5] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#356347]">
                      {translateValue(item.category)}
                    </span>
                  </div>
                  <h3 className="mt-5 text-2xl font-black tracking-tight text-[#223428]">{item.tradeName ?? item.name}</h3>
                  <p className="mt-2 text-sm font-medium text-[#356347]">{item.activeIngredient ?? item.ingredients}</p>
                  <p className="mt-4 line-clamp-3 text-sm leading-7 text-[#6f6858]">{translateValue(item.purpose)}</p>
                  <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-2xl border border-[#ebe4d8] bg-[#fcfaf5] px-4 py-3">
                      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#8d856f]">{tt("applicableCrops")}</p>
                      <p className="mt-2 font-semibold text-[#24352a]">{translateList(item.suitableCrops).slice(0, 2).join(", ") || tt("updating")}</p>
                    </div>
                    <div className="rounded-2xl border border-[#ebe4d8] bg-[#fcfaf5] px-4 py-3">
                      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#8d856f]">{tt("withdrawal")}</p>
                      <p className="mt-2 font-semibold text-[#24352a]">{formatWithdrawal(item)}</p>
                    </div>
                  </div>
                  <div className="mt-5 flex flex-wrap gap-2">
                    {(item.targetDiseases ?? []).slice(0, 3).map((disease) => (
                      <span key={disease} className="rounded-full bg-[#f3eee4] px-3 py-1 text-xs text-[#6c6656]">
                        {translateValue(disease)}
                      </span>
                    ))}
                  </div>
                  <div className="mt-6 flex items-center justify-between gap-3">
                    <button
                      onClick={() => setSelectedPesticide(item)}
                      className="inline-flex items-center gap-2 rounded-full bg-[#224733] px-4 py-2.5 text-sm font-semibold text-white"
                    >
                      {tt("viewDetails")}
                      <ArrowRight className="h-4 w-4" />
                    </button>
                    {isAdmin && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => setForm(formFromPesticide(item))}
                          className="flex h-10 w-10 items-center justify-center rounded-full border border-[#e4dece] bg-white text-[#6f6858]"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => void handleDelete(item.id)}
                          className="flex h-10 w-10 items-center justify-center rounded-full border border-[#f1d7d7] bg-[#fff3f3] text-[#c04f4f]"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </motion.article>
              ))}
            </div>

            {filteredPesticides.length === 0 && (
              <div className="rounded-[28px] border border-dashed border-[#d8d1c1] bg-white/72 px-6 py-12 text-center text-[#6f6858]">
                {tt("noResults")}
              </div>
            )}
          </section>

          <aside className="space-y-6 xl:sticky xl:top-24 xl:self-start">
            <section className="rounded-[30px] border border-[#ddd6c7] bg-white/84 p-6 shadow-[0_18px_50px_rgba(106,96,70,0.08)]">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#fff3e8]">
                  <AlertTriangle className="h-5 w-5 text-[#cc7a26]" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#8d856f]">{tt("safetyGuide")}</p>
                  <h3 className="text-xl font-black text-[#223428]">{tt("useCorrectly")}</h3>
                </div>
              </div>
              <div className="mt-5 space-y-3">
                {safetyChecklist.map((item) => (
                  <div key={item.vi} className="flex items-start gap-3 rounded-[18px] border border-[#ece4d8] bg-[#fcfaf5] px-4 py-4 text-sm leading-7 text-[#6f6858]">
                    <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-[#356347]" />
                    <span>{item[language]}</span>
                  </div>
                ))}
              </div>
            </section>

            {isAdmin && (
              <section className="rounded-[30px] border border-[#ddd6c7] bg-white/84 p-6 shadow-[0_18px_50px_rgba(106,96,70,0.08)]">
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#8d856f]">{tt("adminData")}</p>
                <h3 className="mt-2 text-xl font-black text-[#223428]">{tt("manageProducts")}</h3>
                <div className="mt-5 space-y-3">
                  <div className="rounded-[18px] border border-dashed border-[#d9d1bf] bg-[#faf7f1] p-4">
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#8d856f]">{tt("productImage")}</p>
                    <div className="mt-3 overflow-hidden rounded-[16px] border border-[#e4dece] bg-white">
                      {form.image ? (
                        <img src={form.image} alt="Pesticide preview" className="h-40 w-full object-cover" />
                      ) : (
                        <div className="flex h-40 items-center justify-center bg-[linear-gradient(135deg,#eef6ef,#f6efe3)] text-[#7c755f]">
                          {tt("noImage")}
                        </div>
                      )}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-3">
                      <label className="inline-flex cursor-pointer items-center gap-2 rounded-[14px] bg-[#224733] px-4 py-3 text-sm font-semibold text-white">
                        <ImagePlus className="h-4 w-4" />
                        {isUploadingImage ? tt("uploadingImage") : tt("uploadImage")}
                        <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                      </label>
                      <input
                        value={form.image}
                        onChange={(e) => setForm({ ...form, image: e.target.value })}
                        placeholder={tt("imageUrl")}
                        className="h-12 min-w-[220px] flex-1 rounded-[14px] border border-[#e4dece] bg-white px-4 text-sm text-[#24352a] placeholder:text-[#b2aa96] outline-none"
                      />
                    </div>
                  </div>
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder={tt("tradeName")} className={`h-12 ${adminFieldClass}`} />
                  <input value={form.tradeName} onChange={(e) => setForm({ ...form, tradeName: e.target.value })} placeholder={tt("displayName")} className={`h-12 ${adminFieldClass}`} />
                  <input value={form.activeIngredient} onChange={(e) => setForm({ ...form, activeIngredient: e.target.value })} placeholder={tt("activeIngredient")} className={`h-12 ${adminFieldClass}`} />
                  <div className="grid grid-cols-2 gap-3">
                    <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as NonNullable<Pesticide["type"]> })} className={`h-12 ${adminFieldClass}`}>
                      {typeMeta.filter((item) => item.id !== "all").map((item) => (
                        <option key={item.id} value={item.id}>{item.label[language]}</option>
                      ))}
                    </select>
                    <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder={tt("displayGroup")} className={`h-12 ${adminFieldClass}`} />
                  </div>
                  <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder={tt("description")} rows={3} className={adminTextAreaClass} />
                  <textarea value={form.instructions} onChange={(e) => setForm({ ...form, instructions: e.target.value })} placeholder={tt("safeUse")} rows={3} className={adminTextAreaClass} />
                  <div className="grid grid-cols-2 gap-3">
                    <input value={form.dosage} onChange={(e) => setForm({ ...form, dosage: e.target.value })} placeholder={tt("dosage")} className={`h-12 ${adminFieldClass}`} />
                    <input value={form.withdrawalPeriod} onChange={(e) => setForm({ ...form, withdrawalPeriod: e.target.value })} placeholder={tt("withdrawalPeriod")} className={`h-12 ${adminFieldClass}`} />
                  </div>
                  <input value={form.suitableCrops} onChange={(e) => setForm({ ...form, suitableCrops: e.target.value })} placeholder={tt("cropsComma")} className={`h-12 ${adminFieldClass}`} />
                  <input value={form.targetDiseases} onChange={(e) => setForm({ ...form, targetDiseases: e.target.value })} placeholder={tt("diseasesComma")} className={`h-12 ${adminFieldClass}`} />
                  <div className="flex gap-3">
                    <button onClick={() => void handleSave()} disabled={isSaving} className="inline-flex flex-1 items-center justify-center rounded-[16px] bg-[#224733] px-4 py-3 text-sm font-semibold text-white">
                      {isSaving ? tt("saving") : form.id ? tt("updateProduct") : tt("addProduct")}
                    </button>
                    <button onClick={() => setForm(defaultForm)} className="rounded-[16px] border border-[#e4dece] bg-[#faf7f1] px-4 py-3 text-sm font-semibold text-[#5f5a4c]">
                      {tt("reset")}
                    </button>
                  </div>
                  {feedback && <p className="text-sm text-[#356347]">{feedback}</p>}
                </div>
              </section>
            )}
          </aside>
        </div>
      </div>

      <AnimatePresence>
        {selectedPesticide && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] bg-[#111111]/55 p-4 backdrop-blur-sm sm:p-8">
            <motion.div initial={{ y: 20, scale: 0.98 }} animate={{ y: 0, scale: 1 }} exit={{ y: 10, scale: 0.98 }} className="mx-auto max-w-5xl rounded-[32px] border border-[#ddd6c7] bg-[#fffdf8] shadow-[0_32px_90px_rgba(0,0,0,0.25)]">
              <div className="flex items-start justify-between gap-4 border-b border-[#ebe4d8] px-6 py-6 sm:px-8">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#8d856f]">{translateValue(selectedPesticide.category)}</p>
                  <h3 className="mt-2 text-3xl font-black tracking-tight text-[#223428]">{selectedPesticide.tradeName ?? selectedPesticide.name}</h3>
                  <p className="mt-2 text-sm font-semibold text-[#356347]">{selectedPesticide.activeIngredient ?? selectedPesticide.ingredients}</p>
                </div>
                <button onClick={() => setSelectedPesticide(null)} className="flex h-11 w-11 items-center justify-center rounded-full border border-[#e4dece] bg-white text-[#6f6858]">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="grid gap-8 px-6 py-6 sm:px-8 lg:grid-cols-[1.1fr_0.9fr]">
                <div className="space-y-6">
                  <div className="overflow-hidden rounded-[24px] border border-[#ebe4d8] bg-[#fcfaf5]">
                    {selectedPesticide.image ? (
                      <img src={selectedPesticide.image} alt={selectedPesticide.tradeName ?? selectedPesticide.name} className="h-64 w-full object-cover" />
                    ) : (
                      <div className="flex h-64 items-center justify-center bg-[linear-gradient(135deg,#eef6ef,#f6efe3)]">
                        <Shield className="h-16 w-16 text-[#356347]" />
                      </div>
                    )}
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                      {[
                        { label: tt("tradeName"), value: selectedPesticide.tradeName ?? selectedPesticide.name },
                        { label: tt("activeIngredient"), value: (selectedPesticide.activeIngredient ?? selectedPesticide.ingredients) || tt("updating") },
                        { label: tt("productGroups"), value: translateValue(selectedPesticide.category) || tt("updating") },
                        { label: tt("withdrawalPeriod"), value: formatWithdrawal(selectedPesticide) },
                      ].map((item) => (
                      <div key={item.label} className="rounded-[22px] border border-[#ebe4d8] bg-[#fcfaf5] px-5 py-4">
                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#8d856f]">{item.label}</p>
                        <p className="mt-2 text-sm font-semibold leading-7 text-[#24352a]">{item.value}</p>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-[24px] border border-[#ebe4d8] bg-[#fcfaf5] p-5">
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#8d856f]">{tt("targetDiseases")}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {(selectedPesticide.targetDiseases ?? []).map((item) => (
                        <span key={item} className="rounded-full bg-white px-3 py-1 text-sm text-[#5f5a4c]">{translateValue(item)}</span>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-[24px] border border-[#ebe4d8] bg-[#fcfaf5] p-5">
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#8d856f]">{tt("applicableCrops")}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {(selectedPesticide.suitableCrops ?? []).map((item) => (
                        <span key={item} className="rounded-full bg-white px-3 py-1 text-sm text-[#5f5a4c]">{translateValue(item)}</span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="rounded-[24px] border border-[#ebe4d8] bg-[#fcfaf5] p-5">
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#8d856f]">{tt("useDosage")}</p>
                    <p className="mt-3 text-sm leading-7 text-[#5f5a4c]">{translateValue(selectedPesticide.dosage) || selectedPesticide.dosage}</p>
                  </div>

                  <div className="rounded-[24px] border border-[#ebe4d8] bg-[#fcfaf5] p-5">
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#8d856f]">{tt("instructions")}</p>
                    <p className="mt-3 text-sm leading-7 text-[#5f5a4c]">{translateValue(selectedPesticide.instructions || selectedPesticide.usage)}</p>
                  </div>

                  <div className="rounded-[24px] border border-[#f4d7d7] bg-[#fff7f7] p-5">
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#b25656]">{tt("safetyWarning")}</p>
                    <p className="mt-3 text-sm leading-7 text-[#7a5f5f]">{translateValue(selectedPesticide.safetyWarnings) || tt("defaultSafety")}</p>
                  </div>
                </div>
              </div>

              {relatedPesticides.length > 0 && (
                <div className="border-t border-[#ebe4d8] px-6 py-6 sm:px-8">
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#8d856f]">{tt("relatedProducts")}</p>
                  <div className="mt-4 grid gap-4 md:grid-cols-3">
                    {relatedPesticides.map((item) => (
                      <button key={item.id} onClick={() => setSelectedPesticide(item)} className="rounded-[22px] border border-[#ebe4d8] bg-[#fcfaf5] px-4 py-4 text-left">
                        <p className="font-bold text-[#24352a]">{item.tradeName ?? item.name}</p>
                        <p className="mt-2 text-sm text-[#6f6858]">{item.activeIngredient ?? item.ingredients}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PesticidesView;
