import React, { useEffect, useRef, useState } from "react";
import { 
  Camera, 
  Upload, 
  ChevronRight, 
  AlertCircle, 
  CheckCircle2, 
  Info, 
  ArrowRight, 
  Loader2, 
  Stethoscope,
  Microscope,
  Sparkles,
  ShieldCheck,
  ScanSearch,
  ImagePlus,
  RefreshCcw,
  TriangleAlert,
  X,
  Activity,
  Bug,
  Leaf,
  ListChecks
} from "lucide-react";

import decorative1 from "../../anh/1.jpg";
import decorative2 from "../../anh/2.jpg";
import decorative3 from "../../anh/3.jpg";
import heroDiagnosisVideo from "../../anh/video2.mp4";
import { motion, AnimatePresence } from "motion/react";
import { analyzeDisease } from "../services/aiService";
import { createDiagnosis, subscribeToDiagnoses } from "../services/diagnosisService";
import { AppUser, Diagnosis, View } from "../types";
import { LocalizedDictionary, useI18n } from "../i18n";

interface DiagnosisViewProps {
  user: AppUser | null;
  setView: (v: View) => void;
  onOpenProtocol: (diagnosis: Diagnosis) => void;
}

const diagnosisText: LocalizedDictionary = {
  heroBadge: { vi: "Chẩn đoán bệnh bằng AI", en: "AI disease diagnosis", ja: "AI病害診断" },
  heroTitleA: { vi: "Phân tích lá bệnh nhanh,", en: "Analyze diseased leaves fast,", ja: "病葉をすばやく分析し、" },
  heroTitleB: { vi: "trả về hướng xử lý rõ ràng", en: "with clear treatment guidance", ja: "明確な対処方針を返します" },
  heroCopy: {
    vi: "Tải ảnh lá cây trước, sau đó xác nhận loại cây để AI nạp mô hình chuyên biệt. Mỗi nhóm cây dùng model riêng nhằm tăng độ chính xác nhận diện bệnh và gợi ý xử lý thực địa.",
    en: "Upload the leaf image first, then confirm the crop so AI can load its specialized model. Each crop group uses its own model to improve disease recognition accuracy and field guidance.",
    ja: "まず葉の画像をアップロードし、その後作物を確認して専用AIモデルを読み込みます。作物ごとに専用モデルを使うことで、病害認識精度と現場提案を高めます。",
  },
  clearPhoto: { vi: "Ảnh rõ, nền gọn", en: "Clear image, simple background", ja: "鮮明な写真とシンプルな背景" },
  clearPhotoDesc: {
    vi: "Ưu tiên chụp cận vùng bệnh, đủ sáng tự nhiên và tránh rung mờ.",
    en: "Capture the affected area close-up with natural light and minimal blur.",
    ja: "病斑部を近くから自然光で撮り、手ブレを避けます。",
  },
  multipleAngles: { vi: "Chụp nhiều vị trí", en: "Capture several spots", ja: "複数箇所を撮影" },
  multipleAnglesDesc: {
    vi: "So sánh lá non, lá già, mặt dưới lá và cả phần thân nếu có dấu hiệu lạ.",
    en: "Compare young leaves, older leaves, leaf undersides, and stems when symptoms appear.",
    ja: "若葉、古葉、葉裏、茎も比較して異常を確認します。",
  },
  aiScreening: { vi: "AI là bước sàng lọc", en: "AI is a screening step", ja: "AIは一次スクリーニング" },
  aiScreeningDesc: {
    vi: "Nên đối chiếu thực địa trước khi dùng thuốc hoặc xử lý trên diện rộng.",
    en: "Confirm in the field before applying chemicals or treating a large area.",
    ja: "薬剤使用や広範囲処理の前に現場で確認してください。",
  },
  texture: { vi: "Kết cấu", en: "Texture", ja: "質感" },
  color: { vi: "Màu sắc", en: "Color", ja: "色" },
  shape: { vi: "Hình thái", en: "Shape", ja: "形状" },
  crop: { vi: "Cây trồng", en: "Crop", ja: "作物" },
  unknown: { vi: "Chưa rõ", en: "Unknown", ja: "不明" },
  severity: { vi: "Mức độ", en: "Severity", ja: "重症度" },
  waiting: { vi: "Đang chờ", en: "Waiting", ja: "待機中" },
  pathogen: { vi: "Tác nhân", en: "Pathogen", ja: "病原" },
  needsCheck: { vi: "Cần xác minh thêm", en: "Needs verification", ja: "追加確認が必要" },
  spread: { vi: "Tốc độ lây lan", en: "Spread speed", ja: "拡大速度" },
  evaluating: { vi: "Đang đánh giá", en: "Evaluating", ja: "評価中" },
  invalidImage: { vi: "Vui lòng chọn đúng tệp hình ảnh JPG, PNG hoặc WEBP.", en: "Please choose a valid JPG, PNG, or WEBP image.", ja: "JPG、PNG、WEBP形式の画像を選択してください。" },
  imageTooLarge: { vi: "Ảnh vượt quá 10MB. Hãy nén ảnh hoặc chọn ảnh khác nhẹ hơn.", en: "The image is larger than 10MB. Compress it or choose a smaller file.", ja: "画像が10MBを超えています。圧縮するか小さい画像を選んでください。" },
  noAIResponse: { vi: "Không nhận được phản hồi chẩn đoán từ AI. Hãy thử lại với ảnh rõ hơn.", en: "No diagnosis response from AI. Try again with a clearer image.", ja: "AI診断の応答がありません。より鮮明な画像で再試行してください。" },
  analyzeError: { vi: "Không thể phân tích ảnh lúc này.", en: "Unable to analyze the image right now.", ja: "現在画像を分析できません。" },
  cropSpecificModelsBadge: { vi: "AI chuyên biệt theo cây", en: "Crop-specific AI models", ja: "作物別AIモデル" },
  processTitleA: { vi: "Quy trình nhận diện", en: "Recognition workflow", ja: "認識ワークフロー" },
  processTitleB: { vi: "theo mô hình chuyên biệt", en: "with specialized models", ja: "専用モデルで診断" },
  processCopy: {
    vi: "Bạn chọn cây để hệ thống nạp đúng mô hình bệnh chuyên biệt, trích đặc trưng trong phạm vi cây đó và trả về độ tin cậy, triệu chứng, hướng xử lý.",
    en: "Choose a crop so the correct specialized disease model is loaded, features are read within that crop scope, and confidence, symptoms, and actions are returned.",
    ja: "作物を選ぶことで専用病害モデルを読み込み、その作物範囲で特徴を抽出し、信頼度・症状・対処を返します。",
  },
  newAnalysis: { vi: "Phân tích mới", en: "New analysis", ja: "新規分析" },
  history: { vi: "Lịch sử", en: "History", ja: "履歴" },
  choosePlant: { vi: "Chọn loại cây để tối ưu độ chính xác AI", en: "Choose crop to optimize AI accuracy", ja: "AI精度を最適化する作物を選択" },
  choosePlantDesc: {
    vi: "Mỗi loại cây sử dụng mô hình AI riêng nhằm tăng độ chính xác nhận diện bệnh. Hãy chọn cây trước để hệ thống nạp đúng model chuyên biệt.",
    en: "Each crop uses its own AI model to improve disease recognition accuracy. Choose the crop first so the system loads the right specialized model.",
    ja: "各作物は専用AIモデルを使用して病害認識精度を高めます。先に作物を選択すると、適切な専用モデルを読み込みます。",
  },
  confirmPlantTitle: { vi: "Xác nhận loại cây để tối ưu độ chính xác AI", en: "Confirm crop to optimize AI accuracy", ja: "AI精度を最適化する作物を確認" },
  confirmPlantDesc: {
    vi: "Vui lòng xác nhận loại cây để AI nạp đúng mô hình chuyên biệt trước khi phân tích bệnh.",
    en: "Confirm the crop so AI can load the right specialized model before disease analysis.",
    ja: "病害分析の前に、AIが適切な専用モデルを読み込めるよう作物を確認してください。",
  },
  validImage: { vi: "Ảnh hợp lệ", en: "Valid image", ja: "有効な画像" },
  leafDetected: { vi: "Đã phát hiện lá cây", en: "Leaf area detected", ja: "葉領域を検出" },
  waitingCropConfirm: { vi: "Chờ xác nhận loại cây", en: "Waiting for crop confirmation", ja: "作物確認待ち" },
  readySpecializedModel: { vi: "Model chuyên biệt đã sẵn sàng", en: "Specialized model is ready", ja: "専用モデル準備完了" },
  readyOriginalCassavaModel: { vi: "Model sắn gốc đã sẵn sàng", en: "Original cassava model is ready", ja: "キャッサバ元モデル準備完了" },
  readyCloudVision: { vi: "AI cloud đã sẵn sàng", en: "Cloud vision AI is ready", ja: "クラウド画像AI準備完了" },
  uploadFirstTitle: { vi: "AI phân tích bệnh cây", en: "AI plant disease analysis", ja: "AI植物病害分析" },
  uploadFirstDesc: {
    vi: "Tải ảnh lá cây trước. Sau đó hệ thống sẽ yêu cầu xác nhận loại cây để phân tích chính xác hơn.",
    en: "Upload the leaf image first. The system will then ask you to confirm the crop for better accuracy.",
    ja: "先に葉の画像をアップロードしてください。その後、精度向上のため作物確認を行います。",
  },
  selectCropFirst: { vi: "Vui lòng xác nhận loại cây trước khi bắt đầu phân tích AI.", en: "Please confirm the crop before starting AI analysis.", ja: "AI分析を開始する前に作物を確認してください。" },
  classLabel: { vi: "nhãn bệnh", en: "disease classes", ja: "病害クラス" },
  cropProfile: { vi: "Mô hình chuyên biệt", en: "Specialized model", ja: "専用モデル" },
  imageStandard: { vi: "Chuẩn ảnh đầu vào", en: "Input image standard", ja: "入力画像基準" },
  recognitionScope: { vi: "Phạm vi bệnh của model", en: "Model disease scope", ja: "モデル病害範囲" },
  commonSignals: { vi: "Dấu hiệu thường gặp", en: "Common signals", ja: "よくある兆候" },
  readyForAnalysis: { vi: "Sẵn sàng phân tích", en: "Ready for analysis", ja: "分析準備完了" },
  chooseCropHint: {
    vi: "Sau khi chọn đúng cây, hãy tải ảnh cận vùng lá hoặc thân có dấu hiệu bất thường để model chuyên biệt phân tích.",
    en: "After choosing the correct crop, upload a close-up of the leaf or stem area so the specialized model can analyze it.",
    ja: "正しい作物を選んだ後、葉や茎の異常部位の近接写真をアップロードすると専用モデルが分析します。",
  },
  cloudCropHint: {
    vi: "Xoài dùng AI cloud Gemini/Groq/OpenAI để chẩn đoán theo ảnh.",
    en: "Mango uses Gemini/Groq/OpenAI cloud vision for image diagnosis.",
    ja: "マンゴーはGemini/Groq/OpenAIのクラウド画像AIで画像診断します。",
  },
  moreConditions: { vi: "tình trạng khác", en: "more conditions", ja: "他の状態" },
  imageSelected: { vi: "Ảnh đã chọn", en: "Selected image", ja: "選択済み画像" },
  changeImage: { vi: "Thay đổi ảnh", en: "Change image", ja: "画像を変更" },
  analyzeNow: { vi: "Phân tích ngay", en: "Analyze now", ja: "今すぐ分析" },
  dropImage: { vi: "Kéo thả hoặc chọn ảnh lá cây", en: "Drag or choose a leaf image", ja: "葉の画像をドラッグまたは選択" },
  dropImageDesc: {
    vi: "Kéo thả hoặc chọn ảnh lá cây. Ưu tiên ảnh rõ vùng có đốm, cháy mép, vàng lá hoặc mốc.",
    en: "Drag or choose a leaf image. Prefer a clear photo of spots, burnt edges, yellowing, or mold.",
    ja: "葉の画像をドラッグまたは選択してください。斑点、葉縁枯れ、黄化、カビが鮮明な写真を推奨します。",
  },
  supported: { vi: "Hỗ trợ JPG, PNG, WEBP • Tối đa 10MB", en: "Supports JPG, PNG, WEBP • Max 10MB", ja: "JPG、PNG、WEBP対応 • 最大10MB" },
  tapUpload: { vi: "Chạm để tải lên", en: "Tap to upload", ja: "タップしてアップロード" },
  diagnosisErrorTitle: { vi: "Có lỗi trong quá trình chẩn đoán", en: "Diagnosis error", ja: "診断エラー" },
  analyzing: { vi: "Đang phân tích dữ liệu...", en: "Analyzing data...", ja: "データ分析中..." },
  startDiagnosis: { vi: "Bắt đầu phân tích AI", en: "Start AI analysis", ja: "AI分析を開始" },
  justNow: { vi: "Vừa xong", en: "Just now", ja: "たった今" },
  openResultHint: { vi: "Mở lại kết quả để xem hướng xử lý chi tiết.", en: "Open the result again to view detailed treatment guidance.", ja: "結果を再度開くと詳細な対処方針を確認できます。" },
  noHistoryTitle: { vi: "Chưa có lịch sử chẩn đoán", en: "No diagnosis history yet", ja: "診断履歴はまだありません" },
  noHistoryDesc: {
    vi: "Sau khi phân tích xong, kết quả sẽ được lưu ở đây để bạn mở lại, đối chiếu triệu chứng và theo dõi quá trình xử lý bệnh theo thời gian.",
    en: "After analysis, results are saved here so you can reopen them, compare symptoms, and track treatment over time.",
    ja: "分析後、結果はここに保存され、再確認や症状比較、対処経過の追跡ができます。",
  },
  aiResult: { vi: "Kết quả model", en: "Model result", ja: "モデル結果" },
  originalModelBadge: { vi: "Model gốc", en: "Original model", ja: "元モデル" },
  cassavaApiBlocked: {
    vi: "Sắn bắt buộc dùng model gốc đã train. Server vừa trả kết quả API, nên hệ thống đã chặn kết quả này. Hãy restart backend bằng npm run dev rồi thử lại.",
    en: "Cassava must use the trained original model. The server returned an API result, so this result was blocked. Restart the backend with npm run dev and try again.",
    ja: "キャッサバは学習済み元モデルのみを使用します。サーバーがAPI結果を返したため、この結果をブロックしました。npm run devでバックエンドを再起動して再試行してください。",
  },
  confidence: { vi: "Độ tin cậy", en: "Confidence", ja: "信頼度" },
  lowConfidence: { vi: "Độ tin cậy thấp, cần kiểm tra thêm", en: "Low confidence, needs more checking", ja: "信頼度が低いため追加確認が必要" },
  rawModelLabel: { vi: "Nhãn gốc model", en: "Raw model label", ja: "モデル元ラベル" },
  viewProtocol: { vi: "Xem phác đồ", en: "View protocol", ja: "対処プロトコルを見る" },
  resultFallback: {
    vi: "Hệ thống đã phân loại được tình trạng bệnh. Hãy mở chi tiết bên dưới để xem triệu chứng, hướng xử lý và checklist theo dõi.",
    en: "The system classified the disease condition. Check details below for symptoms, treatment guidance, and follow-up checklist.",
    ja: "病害状態を分類しました。下の詳細で症状、対処方針、フォローアップチェックリストを確認してください。",
  },
  confidenceDetails: { vi: "Chi tiết độ tin cậy", en: "Confidence details", ja: "信頼度の詳細" },
  modelClassProb: { vi: "Xác suất class của model", en: "Model class probabilities", ja: "モデルクラス確率" },
  identifiedSymptoms: { vi: "Triệu chứng nhận diện", en: "Identified symptoms", ja: "識別された症状" },
  noSymptomDetails: { vi: "Chưa có mô tả triệu chứng chi tiết.", en: "No detailed symptom description yet.", ja: "詳細な症状説明はまだありません。" },
  immediateChecklist: { vi: "Checklist xử lý ngay", en: "Immediate checklist", ja: "即時対応チェックリスト" },
  treatmentSolution: { vi: "Giải pháp xử lý đề xuất", en: "Suggested treatment", ja: "推奨対処策" },
  noTreatment: { vi: "Chưa có hướng xử lý chi tiết từ hệ thống.", en: "No detailed treatment guidance from the system yet.", ja: "システムからの詳細な対処方針はまだありません。" },
  prevention: { vi: "Phòng ngừa tái phát", en: "Prevent recurrence", ja: "再発予防" },
  priority: { vi: "Mức ưu tiên xử lý", en: "Treatment priority", ja: "対応優先度" },
  priorityDesc: { vi: "Giá trị càng cao càng nên kiểm tra thực địa và can thiệp sớm để tránh lây lan.", en: "Higher values mean you should inspect the field and intervene earlier to prevent spread.", ja: "値が高いほど現場確認と早期対応で拡大を防ぐ必要があります。" },
  interventionGroup: { vi: "Nhóm thuốc / can thiệp", en: "Product / intervention group", ja: "薬剤・介入グループ" },
  verifyBeforeUse: { vi: "Ưu tiên xác minh trước khi dùng thuốc", en: "Verify before using chemicals", ja: "薬剤使用前に確認を優先" },
  safetyDesc: { vi: "Luôn đọc nhãn, mang bảo hộ và đối chiếu đúng tác nhân bệnh trước khi áp dụng.", en: "Always read labels, wear protection, and confirm the pathogen before applying.", ja: "使用前に必ずラベルを読み、防護具を着用し、病原を確認してください。" },
  resultPanel: { vi: "Bảng kết quả AI", en: "AI result panel", ja: "AI結果パネル" },
  noDataTitle: { vi: "Chưa có dữ liệu chẩn đoán", en: "No diagnosis data yet", ja: "診断データはまだありません" },
  noDataDesc: {
    vi: "Tải lên một ảnh bệnh rõ nét ở cột bên trái để hệ thống hiển thị tên bệnh, mức độ, nguyên nhân nghi ngờ và checklist xử lý theo từng trường hợp.",
    en: "Upload a clear disease image on the left so the system can show disease name, severity, suspected cause, and a case-specific checklist.",
    ja: "左側に鮮明な病害画像をアップロードすると、病名、重症度、推定原因、症例別チェックリストを表示します。",
  },
  panelCard1: { vi: "Tên bệnh và cây trồng", en: "Disease and crop name", ja: "病名と作物名" },
  panelCard2: { vi: "Độ tin cậy và mức độ", en: "Confidence and severity", ja: "信頼度と重症度" },
  panelCard3: { vi: "Triệu chứng, xử lý, phòng ngừa", en: "Symptoms, treatment, prevention", ja: "症状、対処、予防" },
};

const plantNameText: Record<string, LocalizedDictionary[string]> = {
  tomato: { vi: "Cà chua", en: "Tomato", ja: "トマト" },
  apple: { vi: "Táo", en: "Apple", ja: "リンゴ" },
  rice: { vi: "Lúa", en: "Rice", ja: "イネ" },
  potato: { vi: "Khoai tây", en: "Potato", ja: "ジャガイモ" },
  cassava: { vi: "Sắn", en: "Cassava", ja: "キャッサバ" },
  corn: { vi: "Ngô", en: "Corn", ja: "トウモロコシ" },
  mango: { vi: "Xoài", en: "Mango", ja: "マンゴー" },
  bean: { vi: "Đậu", en: "Bean", ja: "インゲン豆" },
  "Cà chua": { vi: "Cà chua", en: "Tomato", ja: "トマト" },
  "Táo": { vi: "Táo", en: "Apple", ja: "リンゴ" },
  "Lúa": { vi: "Lúa", en: "Rice", ja: "イネ" },
  "Khoai tây": { vi: "Khoai tây", en: "Potato", ja: "ジャガイモ" },
  "Sắn": { vi: "Sắn", en: "Cassava", ja: "キャッサバ" },
  "Ngô": { vi: "Ngô", en: "Corn", ja: "トウモロコシ" },
  "Xoài": { vi: "Xoài", en: "Mango", ja: "マンゴー" },
  "Đậu": { vi: "Đậu", en: "Bean", ja: "インゲン豆" },
};

const diseaseText: Record<string, LocalizedDictionary[string]> = {
  "Đốm vi khuẩn": { vi: "Đốm vi khuẩn", en: "Bacterial spot", ja: "細菌斑点病" },
  "Cháy lá sớm": { vi: "Cháy lá sớm", en: "Early blight", ja: "早疫病" },
  "Sương mai": { vi: "Sương mai", en: "Late blight / downy mildew", ja: "疫病 / べと病" },
  "Mốc lá": { vi: "Mốc lá", en: "Leaf mold", ja: "葉かび病" },
  "Đốm lá Septoria": { vi: "Đốm lá Septoria", en: "Septoria leaf spot", ja: "セプトリア葉斑病" },
  "Nhện đỏ hai chấm": { vi: "Nhện đỏ hai chấm", en: "Two-spotted spider mite", ja: "ナミハダニ" },
  "Đốm vòng": { vi: "Đốm vòng", en: "Target spot", ja: "輪紋病" },
  "Virus xoăn vàng lá cà chua": { vi: "Virus xoăn vàng lá cà chua", en: "Tomato yellow leaf curl virus", ja: "トマト黄化葉巻ウイルス" },
  "Virus khảm cà chua": { vi: "Virus khảm cà chua", en: "Tomato mosaic virus", ja: "トマトモザイクウイルス" },
  "Cây khỏe mạnh": { vi: "Cây khỏe mạnh", en: "Healthy plant", ja: "健全株" },
  "Cây táo khỏe mạnh": { vi: "Cây táo khỏe mạnh", en: "Healthy apple tree", ja: "健全なリンゴ" },
  "Phấn trắng": { vi: "Phấn trắng", en: "Powdery mildew", ja: "うどんこ病" },
  "Rỉ sắt táo": { vi: "Rỉ sắt táo", en: "Apple rust", ja: "リンゴさび病" },
  "Ghẻ táo": { vi: "Ghẻ táo", en: "Apple scab", ja: "リンゴ黒星病" },
  "Bạc lá lúa": { vi: "Bạc lá lúa", en: "Rice bacterial blight", ja: "イネ白葉枯病" },
  "Đạo ôn lúa": { vi: "Đạo ôn lúa", en: "Rice blast", ja: "いもち病" },
  "Đốm nâu lúa": { vi: "Đốm nâu lúa", en: "Rice brown spot", ja: "ごま葉枯病" },
  "Virus Tungro": { vi: "Virus Tungro", en: "Tungro virus", ja: "ツングロウイルス" },
  "Virus vàng lùn xoắn lá Tungro": { vi: "Virus vàng lùn xoắn lá Tungro", en: "Rice tungro disease", ja: "イネツングロ病" },
  "Bệnh vi khuẩn khoai tây": { vi: "Bệnh vi khuẩn khoai tây", en: "Potato bacterial disease", ja: "ジャガイモ細菌病" },
  "Bệnh nấm khoai tây": { vi: "Bệnh nấm khoai tây", en: "Potato fungal disease", ja: "ジャガイモ菌病" },
  "Bệnh Phytophthora khoai tây": { vi: "Bệnh Phytophthora khoai tây", en: "Potato Phytophthora disease", ja: "ジャガイモ疫病" },
  "Bệnh virus khoai tây": { vi: "Bệnh virus khoai tây", en: "Potato viral disease", ja: "ジャガイモウイルス病" },
  "Cây khoai tây khỏe mạnh": { vi: "Cây khoai tây khỏe mạnh", en: "Healthy potato plant", ja: "健全なジャガイモ" },
  "Cháy lá vi khuẩn sắn": { vi: "Cháy lá vi khuẩn sắn", en: "Cassava bacterial blight", ja: "キャッサバ細菌性葉枯病" },
  "Bệnh sọc nâu sắn": { vi: "Bệnh sọc nâu sắn", en: "Cassava brown streak disease", ja: "キャッサバ褐条病" },
  "Đốm xanh lá sắn": { vi: "Đốm xanh lá sắn", en: "Cassava green mottle", ja: "キャッサバ緑斑病" },
  "Bệnh khảm lá sắn": { vi: "Bệnh khảm lá sắn", en: "Cassava mosaic disease", ja: "キャッサバモザイク病" },
  "Cây sắn khỏe mạnh": { vi: "Cây sắn khỏe mạnh", en: "Healthy cassava plant", ja: "健全なキャッサバ" },
  "Đốm lá xám Cercospora": { vi: "Đốm lá xám Cercospora", en: "Cercospora gray leaf spot", ja: "セルコスポラ灰色斑点病" },
  "Rỉ sắt thường": { vi: "Rỉ sắt thường", en: "Common rust", ja: "普通さび病" },
  "Cháy lá phương bắc": { vi: "Cháy lá phương bắc", en: "Northern leaf blight", ja: "北方葉枯病" },
  "Cây ngô khỏe mạnh": { vi: "Cây ngô khỏe mạnh", en: "Healthy corn plant", ja: "健全なトウモロコシ" },
  "Ảnh ngoài phạm vi": { vi: "Ảnh ngoài phạm vi", en: "Out-of-scope image", ja: "対象外画像" },
  "Thán thư": { vi: "Thán thư", en: "Anthracnose", ja: "炭疽病" },
  "Thán thư xoài": { vi: "Thán thư xoài", en: "Mango anthracnose", ja: "マンゴー炭疽病" },
  "Loét vi khuẩn": { vi: "Loét vi khuẩn", en: "Bacterial canker", ja: "細菌性かいよう病" },
  "Loét vi khuẩn xoài": { vi: "Loét vi khuẩn xoài", en: "Mango bacterial canker", ja: "マンゴー細菌性かいよう病" },
  "Sâu đục/chích hại cành non": { vi: "Sâu đục/chích hại cành non", en: "Shoot borer / young shoot pest", ja: "新梢穿孔・吸汁害虫" },
  "Sâu đục/chích hại cành non xoài": { vi: "Sâu đục/chích hại cành non xoài", en: "Mango shoot borer / young shoot pest", ja: "マンゴー新梢穿孔・吸汁害虫" },
  "Khô cành chết ngọn": { vi: "Khô cành chết ngọn", en: "Dieback", ja: "枝枯れ" },
  "Khô cành chết ngọn xoài": { vi: "Khô cành chết ngọn xoài", en: "Mango dieback", ja: "マンゴー枝枯れ" },
  "Muỗi gây u sưng lá": { vi: "Muỗi gây u sưng lá", en: "Leaf gall midge", ja: "葉こぶタマバエ" },
  "Muỗi gây u sưng lá xoài": { vi: "Muỗi gây u sưng lá xoài", en: "Mango leaf gall midge", ja: "マンゴー葉こぶタマバエ" },
  "Cây xoài khỏe mạnh": { vi: "Cây xoài khỏe mạnh", en: "Healthy mango tree", ja: "健全なマンゴー" },
  "Phấn trắng xoài": { vi: "Phấn trắng xoài", en: "Mango powdery mildew", ja: "マンゴーうどんこ病" },
  "Nấm bồ hóng": { vi: "Nấm bồ hóng", en: "Sooty mold", ja: "すす病" },
  "Nấm bồ hóng xoài": { vi: "Nấm bồ hóng xoài", en: "Mango sooty mold", ja: "マンゴーすす病" },
  "Đốm góc lá đậu": { vi: "Đốm góc lá đậu", en: "Bean angular leaf spot", ja: "インゲン豆角斑病" },
  "Rỉ sắt đậu": { vi: "Rỉ sắt đậu", en: "Bean rust", ja: "インゲン豆さび病" },
  "Cây đậu khỏe mạnh": { vi: "Cây đậu khỏe mạnh", en: "Healthy bean plant", ja: "健全なインゲン豆" },
  "Ảnh có thể ngoài phạm vi nhận diện hoặc chưa đủ rõ": { vi: "Ảnh có thể ngoài phạm vi nhận diện hoặc chưa đủ rõ", en: "Image may be out of scope or unclear", ja: "画像が対象外または不鮮明の可能性があります" },
};

const diagnosisDynamicText: Record<string, LocalizedDictionary[string]> = {
  "Nhẹ": { vi: "Nhẹ", en: "Mild", ja: "軽度" },
  "Trung bình": { vi: "Trung bình", en: "Moderate", ja: "中程度" },
  "Nặng": { vi: "Nặng", en: "Severe", ja: "重度" },
  "Cao": { vi: "Cao", en: "High", ja: "高" },
  "Thấp": { vi: "Thấp", en: "Low", ja: "低" },
  "Nhanh": { vi: "Nhanh", en: "Fast", ja: "速い" },
  "Chậm": { vi: "Chậm", en: "Slow", ja: "遅い" },
  "Cần kiểm tra thêm": { vi: "Cần kiểm tra thêm", en: "Needs more checking", ja: "追加確認が必要" },
  "Chưa xác định": { vi: "Chưa xác định", en: "Unknown", ja: "未特定" },
  "Chưa đủ chắc chắn": { vi: "Chưa đủ chắc chắn", en: "Not certain enough", ja: "確信度不足" },
  "Không phát hiện": { vi: "Không phát hiện", en: "Not detected", ja: "検出なし" },
  "Không phát hiện tác nhân bệnh rõ ràng": { vi: "Không phát hiện tác nhân bệnh rõ ràng", en: "No clear disease agent detected", ja: "明確な病原は検出されていません" },
  "Nấm": { vi: "Nấm", en: "Fungus", ja: "糸状菌" },
  "Nấm Magnaporthe oryzae": { vi: "Nấm Magnaporthe oryzae", en: "Magnaporthe oryzae fungus", ja: "Magnaporthe oryzae菌" },
  "Nấm Bipolaris/Helminthosporium oryzae": { vi: "Nấm Bipolaris/Helminthosporium oryzae", en: "Bipolaris/Helminthosporium oryzae fungus", ja: "Bipolaris/Helminthosporium oryzae菌" },
  "Virus Tungro, thường lây qua rầy xanh": { vi: "Virus Tungro, thường lây qua rầy xanh", en: "Tungro virus, commonly spread by green leafhoppers", ja: "ツングロウイルス、主にツマグロヨコバイが媒介" },
  "Nấm gỉ sắt": { vi: "Nấm gỉ sắt", en: "Rust fungus", ja: "さび病菌" },
  "Nấm Venturia": { vi: "Nấm Venturia", en: "Venturia fungus", ja: "Venturia菌" },
  "Nấm Alternaria": { vi: "Nấm Alternaria", en: "Alternaria fungus", ja: "Alternaria菌" },
  "Nấm Septoria": { vi: "Nấm Septoria", en: "Septoria fungus", ja: "Septoria菌" },
  "Nấm phấn trắng": { vi: "Nấm phấn trắng", en: "Powdery mildew fungus", ja: "うどんこ病菌" },
  "Giả nấm Phytophthora": { vi: "Giả nấm Phytophthora", en: "Phytophthora oomycete", ja: "Phytophthora卵菌" },
  "Vi khuẩn": { vi: "Vi khuẩn", en: "Bacteria", ja: "細菌" },
  "Vi khuẩn Xanthomonas oryzae pv. oryzae": { vi: "Vi khuẩn Xanthomonas oryzae pv. oryzae", en: "Xanthomonas oryzae pv. oryzae bacteria", ja: "Xanthomonas oryzae pv. oryzae細菌" },
  "Vi khuẩn Xanthomonas phaseoli pv. manihotis": { vi: "Vi khuẩn Xanthomonas phaseoli pv. manihotis", en: "Xanthomonas phaseoli pv. manihotis bacteria", ja: "Xanthomonas phaseoli pv. manihotis細菌" },
  "Vi khuẩn gây loét": { vi: "Vi khuẩn gây loét", en: "Canker-causing bacteria", ja: "かいよう病を起こす細菌" },
  "Vi khuẩn HLB và côn trùng môi giới": { vi: "Vi khuẩn HLB và côn trùng môi giới", en: "HLB bacteria and insect vectors", ja: "HLB細菌と媒介昆虫" },
  "Virus và côn trùng môi giới": { vi: "Virus và côn trùng môi giới", en: "Virus and insect vectors", ja: "ウイルスと媒介昆虫" },
  "Virus gây sọc nâu sắn, thường liên quan bọ phấn môi giới": { vi: "Virus gây sọc nâu sắn, thường liên quan bọ phấn môi giới", en: "Cassava brown streak virus, often associated with whitefly vectors", ja: "キャッサバ褐条病ウイルス、主にコナジラミ媒介に関連" },
  "Virus hoặc tác nhân gây khảm/đốm xanh cần xác minh thêm": { vi: "Virus hoặc tác nhân gây khảm/đốm xanh cần xác minh thêm", en: "Virus or green-mottle/mosaic agent needing confirmation", ja: "確認が必要なウイルスまたは緑斑・モザイク原因" },
  "Virus khảm lá sắn, thường lây qua bọ phấn và hom giống": { vi: "Virus khảm lá sắn, thường lây qua bọ phấn và hom giống", en: "Cassava mosaic virus, commonly spread by whiteflies and planting cuttings", ja: "キャッサバモザイクウイルス、主にコナジラミと挿し穂で伝染" },
  "Virus khảm": { vi: "Virus khảm", en: "Mosaic virus", ja: "モザイクウイルス" },
  "Virus, thường lây qua bọ phấn trắng": { vi: "Virus, thường lây qua bọ phấn trắng", en: "Virus, commonly spread by whiteflies", ja: "ウイルス、主にコナジラミが媒介" },
  "Virus và bọ phấn trắng môi giới": { vi: "Virus và bọ phấn trắng môi giới", en: "Virus transmitted by whiteflies", ja: "コナジラミ媒介ウイルス" },
  "Nhện hại": { vi: "Nhện hại", en: "Mite pest", ja: "ダニ害虫" },
  "Nấm Colletotrichum spp.": { vi: "Nấm Colletotrichum spp.", en: "Colletotrichum spp. fungus", ja: "Colletotrichum属菌" },
  "Côn trùng hại đọt/cành non": { vi: "Côn trùng hại đọt/cành non", en: "Young shoot pest", ja: "新梢害虫" },
  "Nấm gây khô cành/chết ngọn": { vi: "Nấm gây khô cành/chết ngọn", en: "Dieback-causing fungus", ja: "枝枯れを起こす菌" },
  "Muỗi gây u sưng": { vi: "Muỗi gây u sưng", en: "Gall midge", ja: "こぶ形成タマバエ" },
  "Nấm bồ hóng phát triển trên mật ngọt do rầy/rệp": { vi: "Nấm bồ hóng phát triển trên mật ngọt do rầy/rệp", en: "Sooty mold growing on honeydew from hoppers or aphids", ja: "ヨコバイやアブラムシの甘露に発生するすす病菌" },
  "Nấm Pseudocercospora griseola": { vi: "Nấm Pseudocercospora griseola", en: "Pseudocercospora griseola fungus", ja: "Pseudocercospora griseola菌" },
  "Nấm Uromyces appendiculatus": { vi: "Nấm Uromyces appendiculatus", en: "Uromyces appendiculatus fungus", ja: "Uromyces appendiculatus菌" },
  "Nhện đỏ hai chấm": { vi: "Nhện đỏ hai chấm", en: "Two-spotted spider mite", ja: "ナミハダニ" },
  "Nấm Corynespora hoặc nhóm tương tự": { vi: "Nấm Corynespora hoặc nhóm tương tự", en: "Corynespora or a similar fungal group", ja: "Corynesporaまたは類似の菌群" },
  "Nấm gây thối đen": { vi: "Nấm gây thối đen", en: "Black rot fungus", ja: "黒腐病菌" },
  "Nấm Cercospora": { vi: "Nấm Cercospora", en: "Cercospora fungus", ja: "Cercospora菌" },
  "Nấm cháy lá ngô": { vi: "Nấm cháy lá ngô", en: "Corn leaf blight fungus", ja: "トウモロコシ葉枯病菌" },
  "Tổ hợp nấm thân cành nho": { vi: "Tổ hợp nấm thân cành nho", en: "Grapevine trunk fungal complex", ja: "ブドウ幹枝病菌複合体" },
  "Nấm cháy lá nho": { vi: "Nấm cháy lá nho", en: "Grape leaf blight fungus", ja: "ブドウ葉枯病菌" },
  "Nấm hoặc stress sinh lý cần đối chiếu thêm": { vi: "Nấm hoặc stress sinh lý cần đối chiếu thêm", en: "Fungal issue or physiological stress needing confirmation", ja: "菌害または生理ストレス、追加確認が必要" },
  "Ưu tiên giống/chăm sóc và quản lý nước; cân nhắc thuốc gốc đồng hoặc sản phẩm vi khuẩn theo nhãn khi cần": { vi: "Ưu tiên giống/chăm sóc và quản lý nước; cân nhắc thuốc gốc đồng hoặc sản phẩm vi khuẩn theo nhãn khi cần", en: "Prioritize resistant seed, care, and water management; consider copper or bacterial-disease products by label when needed", ja: "抵抗性品種、栽培管理、水管理を優先し、必要時はラベルに従って銅剤や細菌病用資材を検討してください" },
  "Thuốc trừ nấm đạo ôn theo nhãn, luân phiên hoạt chất khi cần": { vi: "Thuốc trừ nấm đạo ôn theo nhãn, luân phiên hoạt chất khi cần", en: "Rice blast fungicide by label, rotating active ingredients when needed", ja: "ラベルに従ったいもち病用殺菌剤、必要に応じて有効成分をローテーション" },
  "Thuốc trừ nấm đốm lá theo nhãn; ưu tiên cải thiện dinh dưỡng và điều kiện ruộng": { vi: "Thuốc trừ nấm đốm lá theo nhãn; ưu tiên cải thiện dinh dưỡng và điều kiện ruộng", en: "Leaf spot fungicide by label; prioritize nutrition and field-condition improvement", ja: "ラベルに従った葉斑病用殺菌剤。栄養と圃場条件の改善を優先" },
  "Không có thuốc trị virus trực tiếp; cần quản lý rầy xanh và nguồn bệnh": { vi: "Không có thuốc trị virus trực tiếp; cần quản lý rầy xanh và nguồn bệnh", en: "No direct virus cure; manage green leafhoppers and infection sources", ja: "ウイルスを直接治す薬剤はありません。ツマグロヨコバイと感染源を管理してください" },
  "Thuốc trừ nấm cho thán thư, ưu tiên luân phiên hoạt chất theo nhãn": { vi: "Thuốc trừ nấm cho thán thư, ưu tiên luân phiên hoạt chất theo nhãn", en: "Anthracnose fungicide, preferably rotating active ingredients by label", ja: "炭疽病用殺菌剤。ラベルに従い有効成分のローテーションを優先" },
  "Thuốc gốc đồng hoặc nhóm quản lý bệnh vi khuẩn theo nhãn": { vi: "Thuốc gốc đồng hoặc nhóm quản lý bệnh vi khuẩn theo nhãn", en: "Copper-based or bacterial-disease management products by label", ja: "ラベルに従った銅剤または細菌病管理剤" },
  "Ưu tiên giống sạch bệnh, vệ sinh đồng ruộng; cân nhắc sản phẩm phù hợp bệnh vi khuẩn theo nhãn": { vi: "Ưu tiên giống sạch bệnh, vệ sinh đồng ruộng; cân nhắc sản phẩm phù hợp bệnh vi khuẩn theo nhãn", en: "Prioritize disease-free planting material and field sanitation; consider labeled bacterial-disease products when needed", ja: "無病の植え付け材料と圃場衛生を優先し、必要時はラベルに従って細菌病用資材を検討してください" },
  "Không có thuốc trị virus trực tiếp; cần quản lý hom giống và bọ phấn": { vi: "Không có thuốc trị virus trực tiếp; cần quản lý hom giống và bọ phấn", en: "No direct virus cure; manage planting cuttings and whiteflies", ja: "ウイルスを直接治す薬剤はありません。挿し穂とコナジラミを管理してください" },
  "Không có thuốc trị virus trực tiếp; ưu tiên xác minh nguồn giống và côn trùng môi giới": { vi: "Không có thuốc trị virus trực tiếp; ưu tiên xác minh nguồn giống và côn trùng môi giới", en: "No direct virus cure; prioritize confirming planting source and insect vectors", ja: "ウイルスを直接治す薬剤はありません。植え付け材料と媒介昆虫の確認を優先してください" },
  "Không có thuốc trị virus trực tiếp; cần quản lý bọ phấn và nguồn hom": { vi: "Không có thuốc trị virus trực tiếp; cần quản lý bọ phấn và nguồn hom", en: "No direct virus cure; manage whiteflies and cutting sources", ja: "ウイルスを直接治す薬剤はありません。コナジラミと挿し穂の供給源を管理してください" },
  "Ưu tiên biện pháp IPM; dùng thuốc trừ sâu đúng nhãn khi mật độ cao": { vi: "Ưu tiên biện pháp IPM; dùng thuốc trừ sâu đúng nhãn khi mật độ cao", en: "Prioritize IPM; use labeled insecticide only at high pest density", ja: "IPMを優先し、密度が高い場合のみラベル通り殺虫剤を使用" },
  "Thuốc trừ nấm phù hợp bệnh khô cành, kết hợp cắt tỉa vệ sinh": { vi: "Thuốc trừ nấm phù hợp bệnh khô cành, kết hợp cắt tỉa vệ sinh", en: "Suitable dieback fungicide combined with sanitary pruning", ja: "枝枯れに適した殺菌剤と衛生的な剪定を組み合わせる" },
  "Quản lý côn trùng hại lá/đọt theo IPM": { vi: "Quản lý côn trùng hại lá/đọt theo IPM", en: "Manage leaf/shoot pests with IPM", ja: "IPMで葉・新梢害虫を管理" },
  "Ưu tiên quản lý rầy rệp; rửa tán và dùng thuốc đúng nhãn khi cần": { vi: "Ưu tiên quản lý rầy rệp; rửa tán và dùng thuốc đúng nhãn khi cần", en: "Prioritize hopper/aphid management; wash canopy and use labeled products when needed", ja: "ヨコバイ・アブラムシ管理を優先し、樹冠洗浄と必要時のラベル通りの薬剤使用を行う" },
  "Thuốc gốc đồng hoặc hoạt chất chuyên trị vi khuẩn": { vi: "Thuốc gốc đồng hoặc hoạt chất chuyên trị vi khuẩn", en: "Copper-based or bacteria-targeted active ingredient", ja: "銅剤または細菌病向け有効成分" },
  "Thuốc trừ nấm phổ rộng, luân phiên hoạt chất": { vi: "Thuốc trừ nấm phổ rộng, luân phiên hoạt chất", en: "Broad-spectrum fungicide with active ingredient rotation", ja: "広範囲殺菌剤、有効成分をローテーション" },
  "Thuốc trừ sương mai/chết nhanh phù hợp giai đoạn bệnh": { vi: "Thuốc trừ sương mai/chết nhanh phù hợp giai đoạn bệnh", en: "Late blight/downy mildew product suitable for the disease stage", ja: "病期に適した疫病・べと病用薬剤" },
  "Thuốc trừ nấm cho bệnh mốc lá": { vi: "Thuốc trừ nấm cho bệnh mốc lá", en: "Fungicide for leaf mold", ja: "葉かび病用殺菌剤" },
  "Thuốc trừ nấm tiếp xúc hoặc nội hấp phù hợp": { vi: "Thuốc trừ nấm tiếp xúc hoặc nội hấp phù hợp", en: "Suitable contact or systemic fungicide", ja: "適切な接触型または浸透移行性殺菌剤" },
  "Thuốc đặc trị nhện hoặc giải pháp sinh học phù hợp": { vi: "Thuốc đặc trị nhện hoặc giải pháp sinh học phù hợp", en: "Specific miticide or suitable biological solution", ja: "専用殺ダニ剤または適切な生物的対策" },
  "Thuốc trừ nấm phổ phù hợp bệnh đốm lá": { vi: "Thuốc trừ nấm phổ phù hợp bệnh đốm lá", en: "Fungicide spectrum suitable for leaf spot disease", ja: "葉斑病に適した殺菌剤" },
  "Không có thuốc trị virus trực tiếp; cần quản lý côn trùng môi giới": { vi: "Không có thuốc trị virus trực tiếp; cần quản lý côn trùng môi giới", en: "No direct virus cure; manage insect vectors", ja: "ウイルスを直接治す薬剤はありません。媒介昆虫を管理してください" },
  "Không có thuốc trị virus trực tiếp": { vi: "Không có thuốc trị virus trực tiếp", en: "No direct virus cure", ja: "ウイルスを直接治す薬剤はありません" },
  "Thuốc trừ nấm gỉ sắt phù hợp": { vi: "Thuốc trừ nấm gỉ sắt phù hợp", en: "Suitable rust fungicide", ja: "適切なさび病用殺菌剤" },
  "Thuốc trừ nấm cho bệnh ghẻ táo": { vi: "Thuốc trừ nấm cho bệnh ghẻ táo", en: "Fungicide for apple scab", ja: "リンゴ黒星病用殺菌剤" },
  "Thuốc trừ nấm cho phấn trắng hoặc biện pháp sinh học phù hợp": { vi: "Thuốc trừ nấm cho phấn trắng hoặc biện pháp sinh học phù hợp", en: "Powdery mildew fungicide or suitable biological measure", ja: "うどんこ病用殺菌剤または適切な生物的対策" },
  "Thuốc trừ nấm phù hợp": { vi: "Thuốc trừ nấm phù hợp", en: "Suitable fungicide", ja: "適切な殺菌剤" },
  "Thuốc trừ vi khuẩn phù hợp": { vi: "Thuốc trừ vi khuẩn phù hợp", en: "Suitable bactericide", ja: "適切な細菌病用薬剤" },
  "Thuốc trừ sâu/nhện phù hợp": { vi: "Thuốc trừ sâu/nhện phù hợp", en: "Suitable insecticide/miticide", ja: "適切な殺虫・殺ダニ剤" },
  "Không cần dùng thuốc": { vi: "Không cần dùng thuốc", en: "No chemical treatment needed", ja: "薬剤処理は不要" },
  "Thuốc trừ nấm phổ phù hợp": { vi: "Thuốc trừ nấm phổ phù hợp", en: "Suitable broad-spectrum fungicide", ja: "適切な広範囲殺菌剤" },
  "Thuốc trừ nấm cho đốm lá ngô": { vi: "Thuốc trừ nấm cho đốm lá ngô", en: "Fungicide for corn gray leaf spot", ja: "トウモロコシ斑点病用殺菌剤" },
  "Thuốc trừ nấm cho cháy lá ngô": { vi: "Thuốc trừ nấm cho cháy lá ngô", en: "Fungicide for corn leaf blight", ja: "トウモロコシ葉枯病用殺菌剤" },
  "Thuốc trừ nấm đốm lá phù hợp cho cây họ đậu, luân phiên hoạt chất theo nhãn": { vi: "Thuốc trừ nấm đốm lá phù hợp cho cây họ đậu, luân phiên hoạt chất theo nhãn", en: "Leaf-spot fungicide suitable for legumes, rotating active ingredients by label", ja: "マメ科に適した葉斑病用殺菌剤をラベル通り有効成分ローテーションで使用" },
  "Thuốc trừ nấm gỉ sắt phù hợp cho cây họ đậu, dùng đúng nhãn": { vi: "Thuốc trừ nấm gỉ sắt phù hợp cho cây họ đậu, dùng đúng nhãn", en: "Rust fungicide suitable for legumes, used according to label", ja: "マメ科に適したさび病用殺菌剤をラベル通り使用" },
  "Ưu tiên cắt tỉa vệ sinh và quản lý vườn": { vi: "Ưu tiên cắt tỉa vệ sinh và quản lý vườn", en: "Prioritize sanitary pruning and orchard management", ja: "衛生的な剪定と園地管理を優先" },
  "Thuốc trừ nấm phù hợp bệnh cháy lá": { vi: "Thuốc trừ nấm phù hợp bệnh cháy lá", en: "Suitable fungicide for leaf blight", ja: "葉枯病に適した殺菌剤" },
  "Không có thuốc trị dứt điểm; cần quản lý cây bệnh và côn trùng môi giới": { vi: "Không có thuốc trị dứt điểm; cần quản lý cây bệnh và côn trùng môi giới", en: "No curative treatment; manage diseased trees and insect vectors", ja: "根治薬はありません。病株と媒介昆虫を管理してください" },
  "Ưu tiên kiểm tra nguyên nhân trước khi dùng thuốc": { vi: "Ưu tiên kiểm tra nguyên nhân trước khi dùng thuốc", en: "Prioritize confirming the cause before using chemicals", ja: "薬剤使用前に原因確認を優先してください" },
  "Cần kiểm tra thực địa trước khi dùng thuốc": { vi: "Cần kiểm tra thực địa trước khi dùng thuốc", en: "Field checking is needed before using chemicals", ja: "薬剤使用前に現場確認が必要です" },
  "Chưa nên khuyến nghị thuốc khi độ tin cậy thấp": { vi: "Chưa nên khuyến nghị thuốc khi độ tin cậy thấp", en: "Do not recommend chemicals while confidence is low", ja: "信頼度が低い間は薬剤推奨を控えてください" },
  "Chưa cần can thiệp thuốc": { vi: "Chưa cần can thiệp thuốc", en: "No chemical intervention needed yet", ja: "現時点で薬剤介入は不要です" },
  "Đốm vàng cam nổi bật trên lá, có thể xuất hiện cấu trúc dạng gai ở mặt dưới.": {
    vi: "Đốm vàng cam nổi bật trên lá, có thể xuất hiện cấu trúc dạng gai ở mặt dưới.",
    en: "Bright yellow-orange spots appear on leaves; spike-like structures may form on the underside.",
    ja: "葉に目立つ黄橙色の斑点が現れ、葉裏に突起状の構造が出ることがあります。",
  },
  "Đốm sẫm màu trên lá và quả, bề mặt sần hoặc nứt về sau.": {
    vi: "Đốm sẫm màu trên lá và quả, bề mặt sần hoặc nứt về sau.",
    en: "Dark spots appear on leaves and fruit; the surface may become rough or cracked later.",
    ja: "葉や果実に暗色斑が出て、後に表面がざらついたり割れたりすることがあります。",
  },
  "Cắt tỉa cho tán thông thoáng và thu gom lá bệnh rụng.": {
    vi: "Cắt tỉa cho tán thông thoáng và thu gom lá bệnh rụng.",
    en: "Prune for better canopy airflow and collect fallen diseased leaves.",
    ja: "樹冠の通気を良くするため剪定し、落ちた病葉を回収してください。",
  },
  "Luân phiên thuốc trừ nấm phù hợp theo nhãn nếu bệnh lan rộng.": {
    vi: "Luân phiên thuốc trừ nấm phù hợp theo nhãn nếu bệnh lan rộng.",
    en: "Rotate suitable fungicides according to the label if the disease spreads.",
    ja: "病害が広がる場合は、ラベルに従って適切な殺菌剤をローテーションしてください。",
  },
  "Vệ sinh tàn dư cuối vụ và giảm ẩm trong tán cây.": {
    vi: "Vệ sinh tàn dư cuối vụ và giảm ẩm trong tán cây.",
    en: "Clean crop residue at season end and reduce humidity inside the canopy.",
    ja: "作期末に残渣を整理し、樹冠内の湿度を下げてください。",
  },
  "Đối chiếu ít nhất 2-3 lá hoặc vị trí khác nhau trên cây.": {
    vi: "Đối chiếu ít nhất 2-3 lá hoặc vị trí khác nhau trên cây.",
    en: "Compare at least 2-3 leaves or different positions on the plant.",
    ja: "少なくとも2〜3枚の葉、または株内の異なる部位を比較してください。",
  },
  "Kiểm tra điều kiện ẩm độ, mưa, côn trùng môi giới trong 3-7 ngày gần đây.": {
    vi: "Kiểm tra điều kiện ẩm độ, mưa, côn trùng môi giới trong 3-7 ngày gần đây.",
    en: "Check humidity, rainfall, and vector insect pressure over the last 3-7 days.",
    ja: "直近3〜7日の湿度、降雨、媒介昆虫の状況を確認してください。",
  },
  "Chỉ dùng thuốc khi đã xác nhận triệu chứng ngoài thực địa và tuân thủ nhãn.": {
    vi: "Chỉ dùng thuốc khi đã xác nhận triệu chứng ngoài thực địa và tuân thủ nhãn.",
    en: "Use chemicals only after field symptoms are confirmed and label directions are followed.",
    ja: "現場で症状を確認し、ラベル指示を守れる場合のみ薬剤を使用してください。",
  },
  "Loại bỏ lá nhiễm nặng và theo dõi cây ký chủ gần đó.": {
    vi: "Loại bỏ lá nhiễm nặng và theo dõi cây ký chủ gần đó.",
    en: "Remove heavily infected leaves and monitor nearby host plants.",
    ja: "重度感染した葉を除去し、近くの宿主植物を観察してください。",
  },
  "Phun thuốc phù hợp theo nhãn nếu bệnh lan rộng.": {
    vi: "Phun thuốc phù hợp theo nhãn nếu bệnh lan rộng.",
    en: "Apply an appropriate product according to the label if the disease spreads.",
    ja: "病害が広がる場合は、ラベルに従って適切な薬剤を散布してください。",
  },
  "Giảm nguồn bệnh từ cây ký chủ phụ quanh vườn nếu có thể.": {
    vi: "Giảm nguồn bệnh từ cây ký chủ phụ quanh vườn nếu có thể.",
    en: "Reduce disease sources from alternate host plants around the orchard when possible.",
    ja: "可能であれば園地周辺の中間宿主からの感染源を減らしてください。",
  },
  "Lá có vệt cháy vàng nhạt đến trắng bạc, thường bắt đầu từ chóp hoặc mép lá rồi lan dọc theo gân.": {
    vi: "Lá có vệt cháy vàng nhạt đến trắng bạc, thường bắt đầu từ chóp hoặc mép lá rồi lan dọc theo gân.",
    en: "Leaves show pale yellow to silvery-white blighted streaks, often starting at the tip or edge and spreading along the veins.",
    ja: "葉に淡黄色から銀白色の枯れ筋が出て、先端や葉縁から始まり葉脈に沿って広がることがよくあります。",
  },
  "Ruộng ẩm, mưa gió, bón thừa đạm hoặc vết thương cơ giới có thể làm bệnh lan nhanh.": {
    vi: "Ruộng ẩm, mưa gió, bón thừa đạm hoặc vết thương cơ giới có thể làm bệnh lan nhanh.",
    en: "Wet fields, wind-driven rain, excess nitrogen, or mechanical wounds can make the disease spread quickly.",
    ja: "湿った圃場、風雨、窒素過多、機械的な傷により病害が急速に広がることがあります。",
  },
  "Ngưng bón thêm đạm khi bệnh đang lan và giữ mực nước ruộng hợp lý.": {
    vi: "Ngưng bón thêm đạm khi bệnh đang lan và giữ mực nước ruộng hợp lý.",
    en: "Stop adding nitrogen while the disease is spreading and keep field water at an appropriate level.",
    ja: "病害が広がっている間は窒素追肥を止め、圃場水位を適切に保ってください。",
  },
  "Loại bỏ lá/cây bệnh nặng ở diện tích nhỏ và hạn chế đi lại khi ruộng ướt.": {
    vi: "Loại bỏ lá/cây bệnh nặng ở diện tích nhỏ và hạn chế đi lại khi ruộng ướt.",
    en: "Remove heavily diseased leaves or plants in small areas and limit movement through the field when it is wet.",
    ja: "小面積では重症の葉や株を除去し、圃場が濡れている時の移動を控えてください。",
  },
  "Dùng thuốc hoặc chế phẩm phù hợp bệnh vi khuẩn theo nhãn nếu bệnh vượt ngưỡng quản lý.": {
    vi: "Dùng thuốc hoặc chế phẩm phù hợp bệnh vi khuẩn theo nhãn nếu bệnh vượt ngưỡng quản lý.",
    en: "Use a labeled product suitable for bacterial disease if the outbreak exceeds the management threshold.",
    ja: "管理基準を超える場合は、細菌病に適した資材をラベルに従って使用してください。",
  },
  "Dùng giống sạch bệnh/chống chịu, gieo sạ mật độ vừa phải và bón NPK cân đối.": {
    vi: "Dùng giống sạch bệnh/chống chịu, gieo sạ mật độ vừa phải và bón NPK cân đối.",
    en: "Use clean or resistant seed, sow at moderate density, and apply balanced NPK nutrition.",
    ja: "健全または抵抗性の種子を使い、適正密度で播種し、NPKをバランス良く施用してください。",
  },
  "Vệ sinh đồng ruộng, quản lý nước tốt và theo dõi sát sau mưa bão.": {
    vi: "Vệ sinh đồng ruộng, quản lý nước tốt và theo dõi sát sau mưa bão.",
    en: "Keep fields clean, manage water well, and monitor closely after storms.",
    ja: "圃場を清潔に保ち、水管理を徹底し、暴風雨後は注意深く観察してください。",
  },
  "Lá có vết hình thoi, tâm xám trắng, viền nâu; bệnh nặng làm cháy từng mảng lá.": {
    vi: "Lá có vết hình thoi, tâm xám trắng, viền nâu; bệnh nặng làm cháy từng mảng lá.",
    en: "Leaves have diamond-shaped lesions with gray-white centers and brown margins; severe infection burns patches of leaf tissue.",
    ja: "葉に灰白色の中心と褐色の縁を持つ紡錘形病斑が出て、重症では葉が部分的に枯れます。",
  },
  "Có thể gây đạo ôn cổ bông làm lép hạt nếu xuất hiện giai đoạn làm đòng trổ.": {
    vi: "Có thể gây đạo ôn cổ bông làm lép hạt nếu xuất hiện giai đoạn làm đòng trổ.",
    en: "If it appears around booting to heading, it can cause neck blast and empty grains.",
    ja: "幼穂形成期から出穂期に発生すると穂首いもちとなり、不稔粒を生じることがあります。",
  },
  "Giảm bón đạm, giữ ruộng thông thoáng và kiểm tra thêm cổ lá/cổ bông.": {
    vi: "Giảm bón đạm, giữ ruộng thông thoáng và kiểm tra thêm cổ lá/cổ bông.",
    en: "Reduce nitrogen, keep the field airy, and check leaf collars and panicle necks.",
    ja: "窒素施用を抑え、圃場の通気を保ち、葉耳部や穂首も確認してください。",
  },
  "Phun thuốc đặc trị đạo ôn đúng thời điểm và đúng nhãn nếu bệnh tăng nhanh.": {
    vi: "Phun thuốc đặc trị đạo ôn đúng thời điểm và đúng nhãn nếu bệnh tăng nhanh.",
    en: "Apply a labeled rice blast fungicide at the right timing if the disease increases quickly.",
    ja: "病勢が急速に強まる場合は、適期にラベル通りいもち病用殺菌剤を散布してください。",
  },
  "Theo dõi lại sau 3-5 ngày, nhất là khi trời âm u, sương nhiều hoặc ruộng rậm.": {
    vi: "Theo dõi lại sau 3-5 ngày, nhất là khi trời âm u, sương nhiều hoặc ruộng rậm.",
    en: "Recheck after 3-5 days, especially in cloudy, dewy, or dense-field conditions.",
    ja: "曇天、露が多い、または株が込み合う条件では、3〜5日後に再確認してください。",
  },
  "Chọn giống chống chịu và xử lý hạt giống khi phù hợp quy trình địa phương.": {
    vi: "Chọn giống chống chịu và xử lý hạt giống khi phù hợp quy trình địa phương.",
    en: "Choose resistant varieties and treat seed when it fits local practice.",
    ja: "抵抗性品種を選び、地域の栽培基準に合う場合は種子処理を行ってください。",
  },
  "Bón phân cân đối, tránh sạ quá dày và theo dõi sớm ở giai đoạn đẻ nhánh đến trổ.": {
    vi: "Bón phân cân đối, tránh sạ quá dày và theo dõi sớm ở giai đoạn đẻ nhánh đến trổ.",
    en: "Fertilize evenly, avoid overly dense sowing, and monitor early from tillering to heading.",
    ja: "施肥をバランス良く行い、過密播種を避け、分げつ期から出穂期まで早めに観察してください。",
  },
  "Lá có đốm nâu tròn hoặc bầu dục, tâm xám nâu, nhiều vết có thể làm lá vàng và khô.": {
    vi: "Lá có đốm nâu tròn hoặc bầu dục, tâm xám nâu, nhiều vết có thể làm lá vàng và khô.",
    en: "Leaves show round or oval brown spots with gray-brown centers; many lesions can yellow and dry the leaf.",
    ja: "葉に円形または楕円形の褐色斑が出て、中心は灰褐色になり、多発すると黄化・乾燥します。",
  },
  "Bệnh thường nặng hơn khi cây suy dinh dưỡng, đất nghèo kali/silic hoặc gặp stress nước.": {
    vi: "Bệnh thường nặng hơn khi cây suy dinh dưỡng, đất nghèo kali/silic hoặc gặp stress nước.",
    en: "The disease is often worse when plants are nutrient-stressed, soil is low in potassium or silicon, or water stress occurs.",
    ja: "栄養不足、カリウム・ケイ酸不足、水ストレスがあると悪化しやすくなります。",
  },
  "Kiểm tra dinh dưỡng ruộng, bổ sung cân đối kali/silic theo khuyến cáo nếu thiếu.": {
    vi: "Kiểm tra dinh dưỡng ruộng, bổ sung cân đối kali/silic theo khuyến cáo nếu thiếu.",
    en: "Check field nutrition and supplement potassium or silicon as recommended if deficient.",
    ja: "圃場の栄養状態を確認し、不足があれば推奨に従ってカリウムやケイ酸を補ってください。",
  },
  "Giữ nước và chăm sóc để giảm stress cho cây lúa.": {
    vi: "Giữ nước và chăm sóc để giảm stress cho cây lúa.",
    en: "Maintain water and care practices to reduce stress on rice plants.",
    ja: "水管理と栽培管理を整え、イネのストレスを減らしてください。",
  },
  "Dùng thuốc trừ nấm đúng nhãn nếu vết bệnh lan nhanh lên tầng lá quan trọng.": {
    vi: "Dùng thuốc trừ nấm đúng nhãn nếu vết bệnh lan nhanh lên tầng lá quan trọng.",
    en: "Use a labeled fungicide if lesions spread quickly to important upper leaves.",
    ja: "重要な上位葉へ病斑が急速に広がる場合は、ラベルに従って殺菌剤を使用してください。",
  },
  "Dùng hạt giống khỏe, xử lý giống khi cần và không để cây thiếu dinh dưỡng kéo dài.": {
    vi: "Dùng hạt giống khỏe, xử lý giống khi cần và không để cây thiếu dinh dưỡng kéo dài.",
    en: "Use healthy seed, treat seed when needed, and avoid prolonged nutrient deficiency.",
    ja: "健全な種子を使い、必要に応じて種子処理を行い、長期の栄養不足を避けてください。",
  },
  "Quản lý rơm rạ/tàn dư bệnh và bón phân cân đối theo giai đoạn sinh trưởng.": {
    vi: "Quản lý rơm rạ/tàn dư bệnh và bón phân cân đối theo giai đoạn sinh trưởng.",
    en: "Manage straw and diseased residue, and fertilize according to growth stage.",
    ja: "稲わらや病残渣を管理し、生育段階に合わせてバランス良く施肥してください。",
  },
  "Cây lúa vàng cam, lùn, đẻ nhánh kém; lá có thể xoắn nhẹ và sinh trưởng chậm.": {
    vi: "Cây lúa vàng cam, lùn, đẻ nhánh kém; lá có thể xoắn nhẹ và sinh trưởng chậm.",
    en: "Rice plants turn orange-yellow, become stunted, tiller poorly, and leaves may curl slightly with slow growth.",
    ja: "イネは橙黄色になり、萎縮し、分げつが少なく、葉が軽く巻いて生育が遅れることがあります。",
  },
  "Bệnh thường xuất hiện thành chòm và lan theo mật độ rầy xanh môi giới.": {
    vi: "Bệnh thường xuất hiện thành chòm và lan theo mật độ rầy xanh môi giới.",
    en: "The disease often appears in patches and spreads with green leafhopper vector density.",
    ja: "病害は群落状に現れ、媒介するツマグロヨコバイの密度に応じて広がります。",
  },
  "Kiểm tra mật độ rầy xanh và loại bỏ cây bệnh nặng nếu diện tích còn nhỏ.": {
    vi: "Kiểm tra mật độ rầy xanh và loại bỏ cây bệnh nặng nếu diện tích còn nhỏ.",
    en: "Check green leafhopper density and remove severely diseased plants if the area is still small.",
    ja: "ツマグロヨコバイの密度を確認し、発生面積が小さい場合は重症株を除去してください。",
  },
  "Không giữ nguồn lúa chét/cỏ ký chủ quanh ruộng làm nơi lưu tồn virus và rầy.": {
    vi: "Không giữ nguồn lúa chét/cỏ ký chủ quanh ruộng làm nơi lưu tồn virus và rầy.",
    en: "Do not leave volunteer rice or host weeds around fields as reservoirs for the virus and leafhoppers.",
    ja: "ウイルスやヨコバイの温床になるひこばえや宿主雑草を圃場周辺に残さないでください。",
  },
  "Quản lý rầy xanh theo IPM, chỉ dùng thuốc đúng nhãn khi mật độ vượt ngưỡng.": {
    vi: "Quản lý rầy xanh theo IPM, chỉ dùng thuốc đúng nhãn khi mật độ vượt ngưỡng.",
    en: "Manage green leafhoppers with IPM and use labeled insecticide only when density exceeds the threshold.",
    ja: "IPMでツマグロヨコバイを管理し、密度が基準を超える場合のみラベル通り薬剤を使用してください。",
  },
  "Gieo sạ đồng loạt, dùng giống chống chịu nếu vùng có tiền sử Tungro.": {
    vi: "Gieo sạ đồng loạt, dùng giống chống chịu nếu vùng có tiền sử Tungro.",
    en: "Synchronize planting and use resistant varieties in areas with a tungro history.",
    ja: "ツングロの発生歴がある地域では一斉播種を行い、抵抗性品種を使ってください。",
  },
  "Vệ sinh đồng ruộng, né rầy và theo dõi rầy xanh từ đầu vụ.": {
    vi: "Vệ sinh đồng ruộng, né rầy và theo dõi rầy xanh từ đầu vụ.",
    en: "Keep fields clean, avoid leafhopper peaks, and monitor green leafhoppers from early season.",
    ja: "圃場を清潔にし、ヨコバイの多発期を避け、作期初めから密度を観察してください。",
  },
  "Lá, chồi hoặc trái có đốm nâu đen lõm, dễ lan trong thời tiết ẩm.": { vi: "Lá, chồi hoặc trái có đốm nâu đen lõm, dễ lan trong thời tiết ẩm.", en: "Leaves, shoots, or fruit show sunken dark-brown to black spots that spread easily in humid weather.", ja: "葉、芽、果実に陥没した黒褐色斑が出て、湿潤時に広がりやすくなります。" },
  "Trái có thể bị thối đen sau thu hoạch hoặc khi mưa kéo dài.": { vi: "Trái có thể bị thối đen sau thu hoạch hoặc khi mưa kéo dài.", en: "Fruit may develop black rot after harvest or during prolonged rain.", ja: "収穫後や長雨の時期に果実が黒く腐ることがあります。" },
  "Tỉa bỏ cành, lá, trái bệnh nặng và thu gom khỏi vườn.": { vi: "Tỉa bỏ cành, lá, trái bệnh nặng và thu gom khỏi vườn.", en: "Prune heavily diseased branches, leaves, and fruit and remove them from the orchard.", ja: "重症の枝、葉、果実を剪除し、園外へ持ち出してください。" },
  "Tạo tán thông thoáng, hạn chế nước đọng trên lá và trái.": { vi: "Tạo tán thông thoáng, hạn chế nước đọng trên lá và trái.", en: "Open the canopy and limit water remaining on leaves and fruit.", ja: "樹冠の通気を良くし、葉や果実に水が残らないようにしてください。" },
  "Phun thuốc trừ nấm đúng nhãn khi bệnh lan hoặc thời tiết ẩm kéo dài.": { vi: "Phun thuốc trừ nấm đúng nhãn khi bệnh lan hoặc thời tiết ẩm kéo dài.", en: "Apply labeled fungicide when the disease spreads or humid weather persists.", ja: "病害が広がる、または湿潤な天候が続く場合はラベル通り殺菌剤を散布してください。" },
  "Tỉa cành sau thu hoạch và vệ sinh tàn dư bệnh.": { vi: "Tỉa cành sau thu hoạch và vệ sinh tàn dư bệnh.", en: "Prune after harvest and clean up diseased residue.", ja: "収穫後に剪定し、病残渣を片付けてください。" },
  "Theo dõi chặt giai đoạn ra đọt non, ra hoa, đậu trái và trước thu hoạch.": { vi: "Theo dõi chặt giai đoạn ra đọt non, ra hoa, đậu trái và trước thu hoạch.", en: "Monitor closely during flushing, flowering, fruit set, and pre-harvest stages.", ja: "新梢発生、開花、着果、収穫前の時期を注意深く観察してください。" },
  "Vết loét nâu đen trên lá, cành hoặc trái; có thể nứt và rỉ dịch.": { vi: "Vết loét nâu đen trên lá, cành hoặc trái; có thể nứt và rỉ dịch.", en: "Dark brown cankers appear on leaves, branches, or fruit and may crack or ooze.", ja: "葉、枝、果実に黒褐色のかいよう斑が出て、割れたり滲出したりすることがあります。" },
  "Bệnh dễ nặng hơn sau mưa gió, vết thương cơ giới hoặc vườn rậm ẩm.": { vi: "Bệnh dễ nặng hơn sau mưa gió, vết thương cơ giới hoặc vườn rậm ẩm.", en: "Disease can worsen after wind-driven rain, mechanical wounds, or in dense humid orchards.", ja: "風雨、機械的な傷、湿った密植園では悪化しやすくなります。" },
  "Cắt bỏ mô bệnh nặng và sát trùng dụng cụ sau mỗi cây.": { vi: "Cắt bỏ mô bệnh nặng và sát trùng dụng cụ sau mỗi cây.", en: "Cut out heavily diseased tissue and disinfect tools after each tree.", ja: "重症部位を切除し、樹ごとに道具を消毒してください。" },
  "Giảm tán rậm, tránh tưới phun mạnh làm bắn nguồn bệnh.": { vi: "Giảm tán rậm, tránh tưới phun mạnh làm bắn nguồn bệnh.", en: "Thin dense canopy and avoid strong overhead irrigation that splashes inoculum.", ja: "樹冠の込み合いを減らし、病原を飛散させる強い散水を避けてください。" },
  "Dùng sản phẩm phù hợp bệnh vi khuẩn theo nhãn nếu bệnh còn lan.": { vi: "Dùng sản phẩm phù hợp bệnh vi khuẩn theo nhãn nếu bệnh còn lan.", en: "Use a labeled product suitable for bacterial disease if spread continues.", ja: "病害が続く場合は、細菌病に適した資材をラベルに従って使用してください。" },
  "Hạn chế tạo vết thương khi cắt tỉa hoặc thu hoạch.": { vi: "Hạn chế tạo vết thương khi cắt tỉa hoặc thu hoạch.", en: "Limit wounds during pruning or harvest.", ja: "剪定や収穫時の傷をできるだけ減らしてください。" },
  "Giữ vườn thông thoáng và theo dõi sau mưa bão.": { vi: "Giữ vườn thông thoáng và theo dõi sau mưa bão.", en: "Keep the orchard airy and monitor after storms.", ja: "園地の通気を保ち、暴風雨後に観察してください。" },
  "Đọt non, cuống hoặc cành non bị cắn, héo gãy hoặc có vết đục.": { vi: "Đọt non, cuống hoặc cành non bị cắn, héo gãy hoặc có vết đục.", en: "Young shoots, petioles, or branches are bitten, wilted, broken, or bored.", ja: "新梢、葉柄、若枝が食害され、萎れたり折れたり穿孔跡が出たりします。" },
  "Có thể thấy mô non khô nhanh, sinh trưởng chậm và vết hại tập trung ở lộc non.": { vi: "Có thể thấy mô non khô nhanh, sinh trưởng chậm và vết hại tập trung ở lộc non.", en: "Young tissue may dry quickly, growth slows, and damage clusters on new flushes.", ja: "若い組織が早く乾き、生育が遅れ、被害が新梢に集中することがあります。" },
  "Cắt bỏ phần bị hại và kiểm tra ổ sâu hoặc côn trùng còn lại.": { vi: "Cắt bỏ phần bị hại và kiểm tra ổ sâu hoặc côn trùng còn lại.", en: "Cut off damaged parts and check for larvae or remaining insects.", ja: "被害部を切除し、幼虫や残った昆虫を確認してください。" },
  "Theo dõi đợt ra lộc non để can thiệp sớm nếu mật độ tăng.": { vi: "Theo dõi đợt ra lộc non để can thiệp sớm nếu mật độ tăng.", en: "Monitor new flushes and intervene early if pest density rises.", ja: "新梢発生期を観察し、密度が上がれば早めに対応してください。" },
  "Áp dụng bẫy, vệ sinh vườn và thuốc đúng nhãn khi vượt ngưỡng.": { vi: "Áp dụng bẫy, vệ sinh vườn và thuốc đúng nhãn khi vượt ngưỡng.", en: "Use traps, orchard sanitation, and labeled products when thresholds are exceeded.", ja: "基準を超えた場合は、トラップ、園地衛生、ラベル通りの薬剤を使ってください。" },
  "Vệ sinh vườn, cắt tỉa tán rậm và theo dõi lộc non định kỳ.": { vi: "Vệ sinh vườn, cắt tỉa tán rậm và theo dõi lộc non định kỳ.", en: "Clean the orchard, prune dense canopy, and inspect new flushes regularly.", ja: "園地を清潔にし、込み合った樹冠を剪定し、新梢を定期確認してください。" },
  "Không phun thuốc phổ rộng khi chưa xác nhận mật độ gây hại.": { vi: "Không phun thuốc phổ rộng khi chưa xác nhận mật độ gây hại.", en: "Do not use broad-spectrum chemicals before confirming damaging pest density.", ja: "被害密度を確認する前に広範囲薬剤を散布しないでください。" },
  "Đầu cành khô dần từ ngọn vào trong, lá héo nâu và cành suy kiệt.": { vi: "Đầu cành khô dần từ ngọn vào trong, lá héo nâu và cành suy kiệt.", en: "Branch tips dry back inward, leaves wilt brown, and branches decline.", ja: "枝先から内側へ枯れ込み、葉が褐変して萎れ、枝が衰弱します。" },
  "Vết bệnh thường nặng hơn ở cây stress, tán rậm hoặc sau giai đoạn mưa ẩm.": { vi: "Vết bệnh thường nặng hơn ở cây stress, tán rậm hoặc sau giai đoạn mưa ẩm.", en: "Symptoms are often worse on stressed trees, dense canopies, or after wet periods.", ja: "ストレス株、込み合った樹冠、雨湿期の後に悪化しやすくなります。" },
  "Cắt sâu dưới vùng mô bệnh và tiêu hủy cành bị hại.": { vi: "Cắt sâu dưới vùng mô bệnh và tiêu hủy cành bị hại.", en: "Cut well below diseased tissue and destroy affected branches.", ja: "病変部より十分下で切り、被害枝を処分してください。" },
  "Bôi/sát trùng vết cắt theo quy trình canh tác an toàn.": { vi: "Bôi/sát trùng vết cắt theo quy trình canh tác an toàn.", en: "Treat or disinfect cuts according to safe farming practice.", ja: "安全な栽培手順に従って切り口を処理・消毒してください。" },
  "Cải thiện dinh dưỡng, thoát nước và dùng thuốc trừ nấm đúng nhãn nếu cần.": { vi: "Cải thiện dinh dưỡng, thoát nước và dùng thuốc trừ nấm đúng nhãn nếu cần.", en: "Improve nutrition and drainage, and use labeled fungicide if needed.", ja: "栄養と排水を改善し、必要ならラベル通り殺菌剤を使用してください。" },
  "Tỉa tán thông thoáng sau thu hoạch và tránh để cây suy kiệt.": { vi: "Tỉa tán thông thoáng sau thu hoạch và tránh để cây suy kiệt.", en: "Prune for airflow after harvest and avoid tree exhaustion.", ja: "収穫後に通気を良くする剪定を行い、樹を衰弱させないでください。" },
  "Khử trùng dụng cụ cắt tỉa giữa các cây.": { vi: "Khử trùng dụng cụ cắt tỉa giữa các cây.", en: "Disinfect pruning tools between trees.", ja: "樹ごとに剪定道具を消毒してください。" },
  "Lá có nốt u/sưng nhỏ, mô lá biến dạng hoặc chấm nâu quanh vị trí hại.": { vi: "Lá có nốt u/sưng nhỏ, mô lá biến dạng hoặc chấm nâu quanh vị trí hại.", en: "Leaves have small galls or swellings, distorted tissue, or brown dots around feeding sites.", ja: "葉に小さなこぶや膨らみ、変形、加害部周辺の褐点が見られます。" },
  "Đọt non có thể phát triển kém nếu mật độ gây hại cao.": { vi: "Đọt non có thể phát triển kém nếu mật độ gây hại cao.", en: "Young shoots may develop poorly when pest density is high.", ja: "害虫密度が高いと新梢の発育が悪くなることがあります。" },
  "Tỉa bỏ lá, đọt bị hại nặng và theo dõi đợt lộc non.": { vi: "Tỉa bỏ lá, đọt bị hại nặng và theo dõi đợt lộc non.", en: "Remove heavily damaged leaves or shoots and monitor new flushes.", ja: "重度被害の葉や新梢を除去し、新梢発生を観察してください。" },
  "Quản lý cỏ dại, tàn dư và nơi trú ẩn quanh vườn.": { vi: "Quản lý cỏ dại, tàn dư và nơi trú ẩn quanh vườn.", en: "Manage weeds, residue, and shelter sites around the orchard.", ja: "園地周辺の雑草、残渣、隠れ場所を管理してください。" },
  "Chỉ dùng thuốc khi mật độ cao và cần tuân thủ nhãn.": { vi: "Chỉ dùng thuốc khi mật độ cao và cần tuân thủ nhãn.", en: "Use chemicals only at high density and follow the label.", ja: "密度が高い場合のみ、ラベルに従って薬剤を使用してください。" },
  "Theo dõi sớm ở giai đoạn ra lá non.": { vi: "Theo dõi sớm ở giai đoạn ra lá non.", en: "Monitor early during new leaf flush.", ja: "新葉発生期の早い段階から観察してください。" },
  "Giữ vườn thông thoáng và hạn chế nguồn trú ẩn của côn trùng.": { vi: "Giữ vườn thông thoáng và hạn chế nguồn trú ẩn của côn trùng.", en: "Keep the orchard airy and reduce insect shelter sources.", ja: "園地の通気を保ち、昆虫の隠れ場所を減らしてください。" },
  "Bề mặt lá hoặc trái phủ lớp đen như muội than, dễ lau khi còn nhẹ.": { vi: "Bề mặt lá hoặc trái phủ lớp đen như muội than, dễ lau khi còn nhẹ.", en: "Leaves or fruit are covered with a soot-like black layer that wipes off when light.", ja: "葉や果実表面にすす状の黒い層が付き、軽い場合は拭き取れます。" },
  "Thường đi kèm rầy mềm, rệp sáp, bọ phấn hoặc côn trùng tiết mật.": { vi: "Thường đi kèm rầy mềm, rệp sáp, bọ phấn hoặc côn trùng tiết mật.", en: "Often occurs with aphids, mealybugs, whiteflies, or other honeydew-producing insects.", ja: "アブラムシ、カイガラムシ、コナジラミなど甘露を出す昆虫と併発しやすいです。" },
  "Kiểm tra và quản lý nhóm côn trùng tiết mật trên tán.": { vi: "Kiểm tra và quản lý nhóm côn trùng tiết mật trên tán.", en: "Check and manage honeydew-producing insects in the canopy.", ja: "樹冠内の甘露を出す昆虫を確認し管理してください。" },
  "Tỉa thông thoáng, rửa lớp bồ hóng nhẹ nếu phù hợp quy mô vườn.": { vi: "Tỉa thông thoáng, rửa lớp bồ hóng nhẹ nếu phù hợp quy mô vườn.", en: "Prune for airflow and wash light sooty mold where practical for the orchard scale.", ja: "通気を良くする剪定を行い、規模に応じて軽いすすを洗い流してください。" },
  "Dùng giải pháp quản lý côn trùng đúng nhãn, tránh lạm dụng thuốc phổ rộng.": { vi: "Dùng giải pháp quản lý côn trùng đúng nhãn, tránh lạm dụng thuốc phổ rộng.", en: "Use labeled insect-management options and avoid overusing broad-spectrum chemicals.", ja: "ラベル通りの害虫管理を行い、広範囲薬剤の乱用を避けてください。" },
  "Theo dõi rệp sáp, rầy mềm, bọ phấn trước khi bồ hóng phủ dày.": { vi: "Theo dõi rệp sáp, rầy mềm, bọ phấn trước khi bồ hóng phủ dày.", en: "Monitor mealybugs, aphids, and whiteflies before sooty mold becomes heavy.", ja: "すす病が厚くなる前にカイガラムシ、アブラムシ、コナジラミを観察してください。" },
  "Bảo vệ thiên địch và giữ tán cây thông thoáng.": { vi: "Bảo vệ thiên địch và giữ tán cây thông thoáng.", en: "Protect natural enemies and keep the canopy airy.", ja: "天敵を保護し、樹冠の通気を保ってください。" },
  "Nấm Alternaria spp.": { vi: "Nấm Alternaria spp.", en: "Alternaria spp. fungus", ja: "Alternaria属菌" },
  "Giả nấm Phytophthora infestans": { vi: "Giả nấm Phytophthora infestans", en: "Phytophthora infestans oomycete", ja: "Phytophthora infestans卵菌" },
  "Nấm gây mốc lá": { vi: "Nấm gây mốc lá", en: "Leaf mold fungus", ja: "葉かび病菌" },
  "Xuất hiện đốm nhỏ sẫm màu, có thể viền vàng trên lá.": { vi: "Xuất hiện đốm nhỏ sẫm màu, có thể viền vàng trên lá.", en: "Small dark spots appear on leaves, sometimes with yellow halos.", ja: "葉に小さな暗色斑が出て、黄色い縁を伴うことがあります。" },
  "Vết bệnh dễ lan mạnh khi mưa nhiều, tưới phun hoặc ẩm độ cao.": { vi: "Vết bệnh dễ lan mạnh khi mưa nhiều, tưới phun hoặc ẩm độ cao.", en: "Lesions spread easily during heavy rain, overhead irrigation, or high humidity.", ja: "多雨、頭上灌水、高湿度で病斑が広がりやすくなります。" },
  "Tỉa bỏ lá bị nặng và tiêu hủy khỏi khu vực canh tác.": { vi: "Tỉa bỏ lá bị nặng và tiêu hủy khỏi khu vực canh tác.", en: "Remove heavily affected leaves and destroy them away from the growing area.", ja: "重症葉を取り除き、栽培区域外で処分してください。" },
  "Giảm tưới phun lên tán, ưu tiên tưới gốc để hạn chế lây lan.": { vi: "Giảm tưới phun lên tán, ưu tiên tưới gốc để hạn chế lây lan.", en: "Reduce overhead irrigation and prefer root-zone watering to limit spread.", ja: "樹冠への散水を減らし、拡散を抑えるため株元灌水を優先してください。" },
  "Cân nhắc thuốc phù hợp theo nhãn cho bệnh vi khuẩn và luân phiên hoạt chất.": { vi: "Cân nhắc thuốc phù hợp theo nhãn cho bệnh vi khuẩn và luân phiên hoạt chất.", en: "Consider labeled products for bacterial disease and rotate active ingredients.", ja: "細菌病に適した薬剤をラベルに従って検討し、有効成分をローテーションしてください。" },
  "Dùng cây giống sạch bệnh và khử trùng dụng cụ cắt tỉa.": { vi: "Dùng cây giống sạch bệnh và khử trùng dụng cụ cắt tỉa.", en: "Use disease-free seedlings and disinfect pruning tools.", ja: "無病苗を使い、剪定道具を消毒してください。" },
  "Giữ tán lá thông thoáng để lá khô nhanh sau mưa hoặc tưới.": { vi: "Giữ tán lá thông thoáng để lá khô nhanh sau mưa hoặc tưới.", en: "Keep foliage airy so leaves dry quickly after rain or irrigation.", ja: "雨や灌水後に葉が早く乾くよう、葉群の通気を保ってください。" },
  "Lá già có đốm nâu với vòng đồng tâm đặc trưng.": { vi: "Lá già có đốm nâu với vòng đồng tâm đặc trưng.", en: "Older leaves show brown spots with characteristic concentric rings.", ja: "古い葉に特徴的な同心円状の褐色斑が出ます。" },
  "Lá vàng dần quanh vết bệnh rồi khô cháy từ dưới lên.": { vi: "Lá vàng dần quanh vết bệnh rồi khô cháy từ dưới lên.", en: "Leaves yellow around lesions and then dry from the lower canopy upward.", ja: "病斑周辺が黄化し、下葉から上へ乾いて枯れ上がります。" },
  "Loại bỏ lá bệnh nặng để giảm nguồn nấm lưu tồn.": { vi: "Loại bỏ lá bệnh nặng để giảm nguồn nấm lưu tồn.", en: "Remove heavily diseased leaves to reduce fungal carryover.", ja: "重症葉を除去し、残存する菌源を減らしてください。" },
  "Bón cân đối, bổ sung dinh dưỡng giúp cây phục hồi sức sinh trưởng.": { vi: "Bón cân đối, bổ sung dinh dưỡng giúp cây phục hồi sức sinh trưởng.", en: "Fertilize evenly and supplement nutrition to help plants recover growth.", ja: "バランス良く施肥し、栄養を補って生育回復を助けてください。" },
  "Phun thuốc trừ nấm đúng nhãn và luân phiên nhóm hoạt chất.": { vi: "Phun thuốc trừ nấm đúng nhãn và luân phiên nhóm hoạt chất.", en: "Apply fungicide by label and rotate active ingredient groups.", ja: "ラベルに従って殺菌剤を散布し、有効成分群をローテーションしてください。" },
  "Không để ruộng quá ẩm kéo dài và tránh bón thừa đạm.": { vi: "Không để ruộng quá ẩm kéo dài và tránh bón thừa đạm.", en: "Avoid prolonged field wetness and excess nitrogen.", ja: "圃場の過湿が続かないようにし、窒素過多を避けてください。" },
  "Luân canh cây trồng, dọn sạch tàn dư sau vụ.": { vi: "Luân canh cây trồng, dọn sạch tàn dư sau vụ.", en: "Rotate crops and clean residue after the season.", ja: "輪作を行い、作後の残渣を片付けてください。" },
  "Vết bệnh úng nước rồi nâu đen, lan rất nhanh khi ẩm mát.": { vi: "Vết bệnh úng nước rồi nâu đen, lan rất nhanh khi ẩm mát.", en: "Water-soaked lesions turn dark brown to black and spread very fast in cool humid conditions.", ja: "水浸状病斑が黒褐色になり、冷涼多湿条件で非常に速く広がります。" },
  "Mặt dưới lá có thể xuất hiện lớp mốc trắng ở rìa vết bệnh.": { vi: "Mặt dưới lá có thể xuất hiện lớp mốc trắng ở rìa vết bệnh.", en: "White mold may appear on the underside of leaves at lesion margins.", ja: "葉裏の病斑縁に白いカビが出ることがあります。" },
  "Cách ly khu vực bệnh nặng và loại bỏ mô bị hại nhiều.": { vi: "Cách ly khu vực bệnh nặng và loại bỏ mô bị hại nhiều.", en: "Isolate heavily affected areas and remove badly damaged tissue.", ja: "重症区域を隔離し、被害の大きい組織を取り除いてください。" },
  "Giảm tưới chiều muộn, giữ ruộng thông thoáng để hạ ẩm.": { vi: "Giảm tưới chiều muộn, giữ ruộng thông thoáng để hạ ẩm.", en: "Reduce late-afternoon irrigation and keep the field airy to lower humidity.", ja: "夕方遅い灌水を減らし、通気を保って湿度を下げてください。" },
  "Can thiệp sớm bằng thuốc chuyên trị sương mai theo đúng nhãn.": { vi: "Can thiệp sớm bằng thuốc chuyên trị sương mai theo đúng nhãn.", en: "Intervene early with a labeled late blight/downy mildew product.", ja: "疫病・べと病用薬剤をラベルに従って早めに使用してください。" },
  "Theo dõi sát sau mưa, sương đêm hoặc giai đoạn thời tiết mát ẩm.": { vi: "Theo dõi sát sau mưa, sương đêm hoặc giai đoạn thời tiết mát ẩm.", en: "Monitor closely after rain, night dew, or cool humid weather.", ja: "雨後、夜露、冷涼多湿期には注意深く観察してください。" },
  "Không để tán quá rậm, tăng thoát nước chân ruộng.": { vi: "Không để tán quá rậm, tăng thoát nước chân ruộng.", en: "Avoid overly dense canopy and improve field drainage.", ja: "葉群を込み合わせすぎず、圃場排水を改善してください。" },
  "Mặt trên lá vàng loang, mặt dưới có lớp mốc ô liu hoặc xám.": { vi: "Mặt trên lá vàng loang, mặt dưới có lớp mốc ô liu hoặc xám.", en: "Upper leaf surfaces show yellow patches, with olive or gray mold underneath.", ja: "葉表に黄色い斑が出て、葉裏にオリーブ色または灰色のカビが見られます。" },
  "Bệnh mạnh trong nhà màng hoặc nơi ẩm cao, ít thông thoáng.": { vi: "Bệnh mạnh trong nhà màng hoặc nơi ẩm cao, ít thông thoáng.", en: "Disease is severe in greenhouses or high-humidity, poorly ventilated areas.", ja: "ハウス内や高湿度で通気の悪い場所で強く発生します。" },
  "Tỉa bớt lá già và tăng thông gió cho vườn hoặc nhà màng.": { vi: "Tỉa bớt lá già và tăng thông gió cho vườn hoặc nhà màng.", en: "Remove older leaves and improve ventilation in the field or greenhouse.", ja: "古葉を減らし、圃場やハウスの換気を高めてください。" },
  "Điều chỉnh tưới và ẩm độ để bề mặt lá khô nhanh hơn.": { vi: "Điều chỉnh tưới và ẩm độ để bề mặt lá khô nhanh hơn.", en: "Adjust irrigation and humidity so leaf surfaces dry faster.", ja: "灌水と湿度を調整し、葉面が早く乾くようにしてください。" },
  "Phun thuốc trừ nấm phù hợp, luân phiên hoạt chất.": { vi: "Phun thuốc trừ nấm phù hợp, luân phiên hoạt chất.", en: "Apply suitable fungicide and rotate active ingredients.", ja: "適切な殺菌剤を散布し、有効成分をローテーションしてください。" },
  "Duy trì thông thoáng và khoảng cách cây hợp lý.": { vi: "Duy trì thông thoáng và khoảng cách cây hợp lý.", en: "Maintain airflow and proper plant spacing.", ja: "通気と適切な株間を保ってください。" },
  "Tránh để ẩm độ không khí cao kéo dài qua đêm.": { vi: "Tránh để ẩm độ không khí cao kéo dài qua đêm.", en: "Avoid high air humidity persisting overnight.", ja: "夜間に高湿度が続かないようにしてください。" },
  "Nhiều đốm tròn nhỏ màu xám nâu, viền sẫm trên lá.": { vi: "Nhiều đốm tròn nhỏ màu xám nâu, viền sẫm trên lá.", en: "Many small round gray-brown spots with dark margins appear on leaves.", ja: "葉に暗い縁を持つ小さな灰褐色の円形斑が多数出ます。" },
  "Lá bệnh nặng sẽ vàng rồi rụng, làm cây suy yếu nhanh.": { vi: "Lá bệnh nặng sẽ vàng rồi rụng, làm cây suy yếu nhanh.", en: "Severely affected leaves yellow and fall, weakening the plant quickly.", ja: "重症葉は黄化して落葉し、株を急速に弱らせます。" },
  "Thu gom lá rụng và lá bệnh để giảm nguồn lây.": { vi: "Thu gom lá rụng và lá bệnh để giảm nguồn lây.", en: "Collect fallen and diseased leaves to reduce inoculum.", ja: "落葉や病葉を回収して感染源を減らしてください。" },
  "Tưới gốc thay vì tưới phun lên lá.": { vi: "Tưới gốc thay vì tưới phun lên lá.", en: "Water at the base instead of spraying leaves.", ja: "葉に散水せず株元灌水を行ってください。" },
  "Phun thuốc trừ nấm theo nhãn nếu bệnh lan rộng.": { vi: "Phun thuốc trừ nấm theo nhãn nếu bệnh lan rộng.", en: "Apply fungicide according to the label if disease spreads.", ja: "病害が広がる場合はラベルに従って殺菌剤を散布してください。" },
  "Vệ sinh tàn dư sau vụ và hạn chế nước bắn từ đất lên lá.": { vi: "Vệ sinh tàn dư sau vụ và hạn chế nước bắn từ đất lên lá.", en: "Clean residue after the season and reduce soil splash onto leaves.", ja: "作後残渣を片付け、土から葉への泥はねを減らしてください。" },
  "Luân canh, giữ tán lá khô ráo hơn sau tưới.": { vi: "Luân canh, giữ tán lá khô ráo hơn sau tưới.", en: "Rotate crops and keep foliage drier after irrigation.", ja: "輪作し、灌水後に葉群が乾きやすい状態を保ってください。" },
  "Lá có chấm vàng li ti, bạc lá hoặc khô mép.": { vi: "Lá có chấm vàng li ti, bạc lá hoặc khô mép.", en: "Leaves show tiny yellow speckles, silvery discoloration, or dry edges.", ja: "葉に細かな黄斑、銀白化、または葉縁の乾燥が見られます。" },
  "Mặt dưới lá có thể thấy nhện nhỏ và tơ mịn.": { vi: "Mặt dưới lá có thể thấy nhện nhỏ và tơ mịn.", en: "Small mites and fine webbing may be visible on leaf undersides.", ja: "葉裏に小さなダニや細い糸が見えることがあります。" },
  "Kiểm tra kỹ mặt dưới lá và cắt bỏ lá bị hại nặng.": { vi: "Kiểm tra kỹ mặt dưới lá và cắt bỏ lá bị hại nặng.", en: "Check leaf undersides carefully and remove heavily damaged leaves.", ja: "葉裏をよく確認し、重度被害葉を取り除いてください。" },
  "Tăng ẩm hợp lý nếu điều kiện quá khô nóng kéo dài.": { vi: "Tăng ẩm hợp lý nếu điều kiện quá khô nóng kéo dài.", en: "Increase humidity appropriately if conditions remain too hot and dry.", ja: "高温乾燥が続く場合は、適切に湿度を上げてください。" },
  "Sử dụng thuốc đặc trị nhện đúng nhãn và luân phiên hoạt chất.": { vi: "Sử dụng thuốc đặc trị nhện đúng nhãn và luân phiên hoạt chất.", en: "Use a labeled miticide and rotate active ingredients.", ja: "ラベル通り殺ダニ剤を使用し、有効成分をローテーションしてください。" },
  "Theo dõi sớm ở thời kỳ nắng nóng, khô hạn.": { vi: "Theo dõi sớm ở thời kỳ nắng nóng, khô hạn.", en: "Monitor early during hot, dry periods.", ja: "高温乾燥期は早めに観察してください。" },
  "Hạn chế lạm dụng thuốc phổ rộng làm giảm thiên địch.": { vi: "Hạn chế lạm dụng thuốc phổ rộng làm giảm thiên địch.", en: "Avoid overusing broad-spectrum chemicals that reduce natural enemies.", ja: "天敵を減らす広範囲薬剤の乱用を避けてください。" },
  "Xuất hiện đốm tròn hoặc bất định, tâm đậm màu hơn xung quanh.": { vi: "Xuất hiện đốm tròn hoặc bất định, tâm đậm màu hơn xung quanh.", en: "Round or irregular spots appear with centers darker than surrounding tissue.", ja: "円形または不整形の斑点が現れ、中心部が周囲より濃くなります。" },
  "Lá có thể vàng và rụng nếu bệnh phát triển kéo dài.": { vi: "Lá có thể vàng và rụng nếu bệnh phát triển kéo dài.", en: "Leaves may yellow and drop if disease development continues.", ja: "病勢が続くと葉が黄化して落葉することがあります。" },
  "Tỉa bỏ bộ lá bị nhiễm nặng để giảm áp lực bệnh.": { vi: "Tỉa bỏ bộ lá bị nhiễm nặng để giảm áp lực bệnh.", en: "Remove heavily infected foliage to reduce disease pressure.", ja: "重度感染葉を取り除き、病圧を下げてください。" },
  "Giữ ruộng thông thoáng và hạn chế đọng nước trên lá.": { vi: "Giữ ruộng thông thoáng và hạn chế đọng nước trên lá.", en: "Keep the field airy and limit water staying on leaves.", ja: "圃場の通気を保ち、葉に水が残らないようにしてください。" },
  "Luân phiên thuốc trừ nấm theo khuyến cáo trên nhãn.": { vi: "Luân phiên thuốc trừ nấm theo khuyến cáo trên nhãn.", en: "Rotate fungicides according to label recommendations.", ja: "ラベルの推奨に従って殺菌剤をローテーションしてください。" },
  "Dọn sạch tàn dư bệnh và tránh mật độ trồng quá dày.": { vi: "Dọn sạch tàn dư bệnh và tránh mật độ trồng quá dày.", en: "Clean diseased residue and avoid overly dense planting.", ja: "病残渣を片付け、過密植を避けてください。" },
  "Theo dõi ruộng sau mưa hoặc thời kỳ ẩm kéo dài.": { vi: "Theo dõi ruộng sau mưa hoặc thời kỳ ẩm kéo dài.", en: "Monitor fields after rain or prolonged humid periods.", ja: "雨後や湿潤期が続く時は圃場を観察してください。" },
  "Lá non vàng, cong xoăn, biến dạng và cây còi cọc.": { vi: "Lá non vàng, cong xoăn, biến dạng và cây còi cọc.", en: "Young leaves turn yellow, curl, distort, and plants become stunted.", ja: "若葉が黄化・巻葉・変形し、株が萎縮します。" },
  "Sinh trưởng chậm, giảm đậu trái và năng suất rõ rệt.": { vi: "Sinh trưởng chậm, giảm đậu trái và năng suất rõ rệt.", en: "Growth slows with clear reductions in fruit set and yield.", ja: "生育が遅れ、着果と収量が明らかに低下します。" },
  "Nhổ bỏ cây bệnh nặng để tránh lan sang cây khỏe.": { vi: "Nhổ bỏ cây bệnh nặng để tránh lan sang cây khỏe.", en: "Remove severely diseased plants to prevent spread to healthy plants.", ja: "健全株への拡散を防ぐため、重症株を抜き取ってください。" },
  "Kiểm soát bọ phấn trắng bằng biện pháp tổng hợp và đúng nhãn thuốc.": { vi: "Kiểm soát bọ phấn trắng bằng biện pháp tổng hợp và đúng nhãn thuốc.", en: "Control whiteflies with integrated measures and labeled products.", ja: "総合的対策とラベル通りの薬剤でコナジラミを管理してください。" },
  "Bổ sung chăm sóc để giảm stress cho những cây còn lại.": { vi: "Bổ sung chăm sóc để giảm stress cho những cây còn lại.", en: "Improve care to reduce stress on remaining plants.", ja: "残った株のストレスを減らすため管理を補強してください。" },
  "Dùng cây giống sạch bệnh và kiểm soát bọ phấn ngay từ đầu vụ.": { vi: "Dùng cây giống sạch bệnh và kiểm soát bọ phấn ngay từ đầu vụ.", en: "Use disease-free seedlings and manage whiteflies from the start of the season.", ja: "無病苗を使い、作期初めからコナジラミを管理してください。" },
  "Vệ sinh cỏ dại, cây ký chủ phụ quanh ruộng.": { vi: "Vệ sinh cỏ dại, cây ký chủ phụ quanh ruộng.", en: "Clean weeds and alternate host plants around the field.", ja: "圃場周辺の雑草や代替宿主植物を整理してください。" },
  "Lá loang lổ xanh vàng kiểu khảm, có thể nhăn và biến dạng.": { vi: "Lá loang lổ xanh vàng kiểu khảm, có thể nhăn và biến dạng.", en: "Leaves show green-yellow mosaic mottling and may wrinkle or distort.", ja: "葉に緑黄のモザイク状まだらが出て、しわや変形を伴うことがあります。" },
  "Cây sinh trưởng kém, trái nhỏ hoặc chất lượng giảm.": { vi: "Cây sinh trưởng kém, trái nhỏ hoặc chất lượng giảm.", en: "Plants grow poorly, with smaller fruit or reduced quality.", ja: "生育が悪くなり、果実が小さくなったり品質が低下したりします。" },
  "Loại bỏ cây bị nặng và tránh thao tác lây cơ giới sang cây khỏe.": { vi: "Loại bỏ cây bị nặng và tránh thao tác lây cơ giới sang cây khỏe.", en: "Remove severely affected plants and avoid mechanically spreading the virus to healthy plants.", ja: "重症株を除去し、作業で健全株へ機械的に広げないようにしてください。" },
  "Khử trùng tay, dụng cụ và hạn chế chạm cây khi cây ướt.": { vi: "Khử trùng tay, dụng cụ và hạn chế chạm cây khi cây ướt.", en: "Disinfect hands and tools, and limit handling plants when wet.", ja: "手と道具を消毒し、株が濡れている時の接触を控えてください。" },
  "Duy trì dinh dưỡng, tưới và vệ sinh tốt để giảm áp lực bệnh.": { vi: "Duy trì dinh dưỡng, tưới và vệ sinh tốt để giảm áp lực bệnh.", en: "Maintain good nutrition, irrigation, and sanitation to reduce disease pressure.", ja: "栄養、灌水、衛生管理を保ち、病圧を下げてください。" },
  "Sử dụng nguồn giống sạch bệnh và vệ sinh dụng cụ thường xuyên.": { vi: "Sử dụng nguồn giống sạch bệnh và vệ sinh dụng cụ thường xuyên.", en: "Use disease-free planting material and sanitize tools regularly.", ja: "無病の苗・種子を使い、道具を定期的に消毒してください。" },
  "Không hút thuốc hay xử lý cây bệnh rồi chạm sang cây khỏe mà không vệ sinh.": { vi: "Không hút thuốc hay xử lý cây bệnh rồi chạm sang cây khỏe mà không vệ sinh.", en: "Do not smoke or handle diseased plants and then touch healthy ones without sanitation.", ja: "喫煙後や病株作業後に、消毒せず健全株へ触れないでください。" },
  "Bề mặt lá có lớp phấn trắng xám, lá có thể cong hoặc kém phát triển.": { vi: "Bề mặt lá có lớp phấn trắng xám, lá có thể cong hoặc kém phát triển.", en: "Leaf surfaces have a gray-white powdery layer; leaves may curl or develop poorly.", ja: "葉面に灰白色の粉状層が出て、葉が巻いたり発育不良になることがあります。" },
  "Tăng thông thoáng, giảm độ ẩm kéo dài quanh tán.": { vi: "Tăng thông thoáng, giảm độ ẩm kéo dài quanh tán.", en: "Improve airflow and reduce prolonged humidity around the canopy.", ja: "通気を高め、樹冠周辺の湿度が長く続かないようにしてください。" },
  "Loại bỏ lá nhiễm nặng và xử lý sớm nếu bệnh lan.": { vi: "Loại bỏ lá nhiễm nặng và xử lý sớm nếu bệnh lan.", en: "Remove heavily infected leaves and treat early if the disease spreads.", ja: "重度感染葉を除去し、病害が広がる場合は早めに処理してください。" },
  "Giữ mật độ trồng hợp lý và theo dõi giai đoạn thời tiết thuận lợi cho nấm.": { vi: "Giữ mật độ trồng hợp lý và theo dõi giai đoạn thời tiết thuận lợi cho nấm.", en: "Keep planting density reasonable and monitor during weather favorable to fungi.", ja: "適切な栽植密度を保ち、菌に好適な天候時期を観察してください。" },
  "Đốm nâu đen hoặc mô thối sẫm màu trên lá, cành hay quả.": { vi: "Đốm nâu đen hoặc mô thối sẫm màu trên lá, cành hay quả.", en: "Dark brown to black spots or rotted tissue appear on leaves, branches, or fruit.", ja: "葉、枝、果実に黒褐色斑や暗色の腐敗組織が見られます。" },
  "Có thể lan nhanh hơn khi ẩm độ cao và mô cây bị tổn thương.": { vi: "Có thể lan nhanh hơn khi ẩm độ cao và mô cây bị tổn thương.", en: "It can spread faster under high humidity and when plant tissue is wounded.", ja: "高湿度や植物組織に傷がある場合、より速く広がることがあります。" },
  "Loại bỏ bộ phận bệnh nặng và thu gom tiêu hủy.": { vi: "Loại bỏ bộ phận bệnh nặng và thu gom tiêu hủy.", en: "Remove severely diseased parts and collect them for disposal.", ja: "重症部位を取り除き、回収して処分してください。" },
  "Giữ vườn thông thoáng, hạn chế ẩm kéo dài.": { vi: "Giữ vườn thông thoáng, hạn chế ẩm kéo dài.", en: "Keep the orchard airy and limit prolonged moisture.", ja: "園地の通気を保ち、湿った状態が長引かないようにしてください。" },
  "Sử dụng thuốc trừ nấm phù hợp khi cần.": { vi: "Sử dụng thuốc trừ nấm phù hợp khi cần.", en: "Use a suitable fungicide when needed.", ja: "必要に応じて適切な殺菌剤を使用してください。" },
  "Vệ sinh tàn dư bệnh và tránh gây vết thương cơ giới không cần thiết.": { vi: "Vệ sinh tàn dư bệnh và tránh gây vết thương cơ giới không cần thiết.", en: "Clean diseased residue and avoid unnecessary mechanical wounds.", ja: "病残渣を片付け、不要な機械的傷を避けてください。" },
  "Đốm lá dài xám nâu, thường chạy dọc gân lá.": { vi: "Đốm lá dài xám nâu, thường chạy dọc gân lá.", en: "Long gray-brown leaf spots often run along the veins.", ja: "灰褐色の長い葉斑が葉脈に沿って出ることがよくあります。" },
  "Theo dõi ruộng sau mưa và loại bỏ lá bệnh nặng nếu có thể.": { vi: "Theo dõi ruộng sau mưa và loại bỏ lá bệnh nặng nếu có thể.", en: "Monitor fields after rain and remove heavily diseased leaves if possible.", ja: "雨後に圃場を観察し、可能なら重症葉を除去してください。" },
  "Luân phiên thuốc phù hợp theo nhãn khi áp lực bệnh cao.": { vi: "Luân phiên thuốc phù hợp theo nhãn khi áp lực bệnh cao.", en: "Rotate suitable products by label when disease pressure is high.", ja: "病圧が高い場合は、ラベルに従って適切な薬剤をローテーションしてください。" },
  "Luân canh và xử lý tàn dư sau vụ.": { vi: "Luân canh và xử lý tàn dư sau vụ.", en: "Rotate crops and manage residue after the season.", ja: "輪作し、作後残渣を処理してください。" },
  "Mụn gỉ nhỏ màu nâu đỏ trên lá, dễ vỡ và phát tán bào tử.": { vi: "Mụn gỉ nhỏ màu nâu đỏ trên lá, dễ vỡ và phát tán bào tử.", en: "Small reddish-brown rust pustules on leaves break easily and release spores.", ja: "葉に小さな赤褐色のさび胞子堆ができ、壊れやすく胞子を飛散します。" },
  "Theo dõi giai đoạn phát triển và xử lý khi mật độ vết bệnh tăng nhanh.": { vi: "Theo dõi giai đoạn phát triển và xử lý khi mật độ vết bệnh tăng nhanh.", en: "Monitor growth stage and treat when lesion density rises quickly.", ja: "生育段階を見ながら、病斑密度が急増したら処理してください。" },
  "Chọn giống chống chịu và quản lý đồng ruộng thông thoáng.": { vi: "Chọn giống chống chịu và quản lý đồng ruộng thông thoáng.", en: "Choose resistant varieties and keep the field well ventilated.", ja: "抵抗性品種を選び、圃場の通気を良く保ってください。" },
  "Vết cháy dài hình thuyền, xám nâu trên lá ngô.": { vi: "Vết cháy dài hình thuyền, xám nâu trên lá ngô.", en: "Long boat-shaped gray-brown blight lesions appear on corn leaves.", ja: "トウモロコシ葉に舟形の長い灰褐色枯れ斑が出ます。" },
  "Theo dõi mức độ lan và xử lý nếu bệnh lan lên tầng lá quan trọng.": { vi: "Theo dõi mức độ lan và xử lý nếu bệnh lan lên tầng lá quan trọng.", en: "Monitor spread and treat if disease reaches important upper leaves.", ja: "拡大状況を観察し、重要な上位葉へ広がる場合は処理してください。" },
  "Luân canh và giảm nguồn tàn dư mang bệnh.": { vi: "Luân canh và giảm nguồn tàn dư mang bệnh.", en: "Rotate crops and reduce infected residue sources.", ja: "輪作し、病原を持つ残渣の発生源を減らしてください。" },
  "Lá loang màu và cây suy kiệt dần, có thể liên quan bệnh gỗ.": { vi: "Lá loang màu và cây suy kiệt dần, có thể liên quan bệnh gỗ.", en: "Leaves become mottled and the vine gradually declines, possibly related to trunk disease.", ja: "葉がまだらになり樹勢が徐々に低下し、幹枝病に関連する可能性があります。" },
  "Cắt bỏ cành bệnh và vệ sinh dụng cụ kỹ.": { vi: "Cắt bỏ cành bệnh và vệ sinh dụng cụ kỹ.", en: "Cut out diseased branches and sanitize tools thoroughly.", ja: "病枝を切除し、道具を十分に消毒してください。" },
  "Theo dõi sức sinh trưởng toàn cây và đánh giá vết bệnh trên cành/thân.": { vi: "Theo dõi sức sinh trưởng toàn cây và đánh giá vết bệnh trên cành/thân.", en: "Monitor whole-plant vigor and assess lesions on branches and trunks.", ja: "株全体の樹勢を観察し、枝や幹の病斑を評価してください。" },
  "Tránh tạo vết cắt lớn khi điều kiện ẩm thuận lợi cho nấm xâm nhập.": { vi: "Tránh tạo vết cắt lớn khi điều kiện ẩm thuận lợi cho nấm xâm nhập.", en: "Avoid large cuts when humid conditions favor fungal entry.", ja: "湿度が高く菌が侵入しやすい条件では大きな切り口を作らないでください。" },
  "Đốm nâu hoặc vùng cháy trên lá nho, làm giảm diện tích quang hợp.": { vi: "Đốm nâu hoặc vùng cháy trên lá nho, làm giảm diện tích quang hợp.", en: "Brown spots or blighted areas on grape leaves reduce photosynthetic area.", ja: "ブドウ葉に褐色斑や枯れ込みが出て、光合成面積を減らします。" },
  "Tỉa tán và vệ sinh lá bệnh.": { vi: "Tỉa tán và vệ sinh lá bệnh.", en: "Prune the canopy and clean diseased leaves.", ja: "樹冠を剪定し、病葉を片付けてください。" },
  "Phun thuốc phù hợp khi bệnh lan rộng.": { vi: "Phun thuốc phù hợp khi bệnh lan rộng.", en: "Apply a suitable product when disease spreads widely.", ja: "病害が広がる場合は適切な薬剤を散布してください。" },
  "Giữ tán nho thông thoáng và giảm ẩm đọng trên lá.": { vi: "Giữ tán nho thông thoáng và giảm ẩm đọng trên lá.", en: "Keep the grape canopy airy and reduce moisture on leaves.", ja: "ブドウの樹冠の通気を保ち、葉に残る湿気を減らしてください。" },
  "Lá vàng không đối xứng, cây suy yếu và trái kém chất lượng.": { vi: "Lá vàng không đối xứng, cây suy yếu và trái kém chất lượng.", en: "Leaves yellow asymmetrically, trees weaken, and fruit quality declines.", ja: "葉が左右非対称に黄化し、樹が弱り、果実品質が低下します。" },
  "Kiểm tra thêm trên nhiều cành và cân nhắc loại bỏ cây bệnh nặng.": { vi: "Kiểm tra thêm trên nhiều cành và cân nhắc loại bỏ cây bệnh nặng.", en: "Check multiple branches and consider removing severely diseased trees.", ja: "複数の枝を確認し、重症樹の除去を検討してください。" },
  "Quản lý côn trùng môi giới và nguồn giống sạch bệnh.": { vi: "Quản lý côn trùng môi giới và nguồn giống sạch bệnh.", en: "Manage insect vectors and use disease-free planting material.", ja: "媒介昆虫を管理し、無病苗を使用してください。" },
  "Kiểm soát rầy chổng cánh và dùng cây giống sạch bệnh.": { vi: "Kiểm soát rầy chổng cánh và dùng cây giống sạch bệnh.", en: "Control citrus psyllids and use disease-free seedlings.", ja: "ミカンキジラミを管理し、無病苗を使ってください。" },
  "Lá cháy mép hoặc cháy đầu lá, màu nâu sẫm tăng dần.": { vi: "Lá cháy mép hoặc cháy đầu lá, màu nâu sẫm tăng dần.", en: "Leaf edges or tips scorch and dark brown color increases over time.", ja: "葉縁や葉先が焼け、濃褐色が徐々に広がります。" },
  "Cần phân biệt với thiếu dinh dưỡng, cháy nắng hoặc tồn dư thuốc.": { vi: "Cần phân biệt với thiếu dinh dưỡng, cháy nắng hoặc tồn dư thuốc.", en: "Differentiate from nutrient deficiency, sunburn, or chemical residue injury.", ja: "栄養不足、日焼け、薬害残留との区別が必要です。" },
  "Kiểm tra chế độ tưới, phân bón và điều kiện thời tiết gần đây.": { vi: "Kiểm tra chế độ tưới, phân bón và điều kiện thời tiết gần đây.", en: "Check irrigation, fertilization, and recent weather conditions.", ja: "灌水、施肥、最近の気象条件を確認してください。" },
  "Loại bỏ lá cháy nặng và theo dõi lá non mới ra.": { vi: "Loại bỏ lá cháy nặng và theo dõi lá non mới ra.", en: "Remove severely scorched leaves and monitor new young leaves.", ja: "重度の焼け葉を除去し、新しく出る若葉を観察してください。" },
  "Chỉ dùng thuốc khi có thêm bằng chứng rõ về tác nhân gây bệnh.": { vi: "Chỉ dùng thuốc khi có thêm bằng chứng rõ về tác nhân gây bệnh.", en: "Use chemicals only when there is clearer evidence of a disease agent.", ja: "病原の明確な追加証拠がある場合のみ薬剤を使用してください。" },
  "Duy trì tưới và dinh dưỡng cân đối.": { vi: "Duy trì tưới và dinh dưỡng cân đối.", en: "Maintain balanced irrigation and nutrition.", ja: "灌水と栄養をバランス良く維持してください。" },
  "Giảm stress nhiệt và tránh phun thuốc đậm đặc lúc nắng gắt.": { vi: "Giảm stress nhiệt và tránh phun thuốc đậm đặc lúc nắng gắt.", en: "Reduce heat stress and avoid concentrated sprays in harsh sun.", ja: "高温ストレスを減らし、強い日差しの中で濃い薬液散布を避けてください。" },
  "Model đã nhận diện được một nhãn nhưng chưa có cấu hình mô tả chi tiết.": { vi: "Model đã nhận diện được một nhãn nhưng chưa có cấu hình mô tả chi tiết.", en: "The model identified a label, but no detailed description is configured yet.", ja: "モデルはラベルを識別しましたが、詳細説明はまだ設定されていません。" },
  "Kiểm tra thêm triệu chứng ngoài đồng, mặt dưới lá, thân và điều kiện thời tiết gần đây.": { vi: "Kiểm tra thêm triệu chứng ngoài đồng, mặt dưới lá, thân và điều kiện thời tiết gần đây.", en: "Check field symptoms, leaf undersides, stems, and recent weather conditions.", ja: "現場症状、葉裏、茎、最近の気象条件を追加確認してください。" },
  "Theo dõi thêm nhiều vị trí trên cây trước khi quyết định xử lý.": { vi: "Theo dõi thêm nhiều vị trí trên cây trước khi quyết định xử lý.", en: "Inspect more positions on the plant before deciding treatment.", ja: "処理を決める前に、株の複数箇所をさらに観察してください。" },
  "Model nhận diện được vài mẫu gần giống nhưng chưa đủ chắc để kết luận một bệnh cụ thể.": { vi: "Model nhận diện được vài mẫu gần giống nhưng chưa đủ chắc để kết luận một bệnh cụ thể.", en: "The model found several similar patterns but is not certain enough to conclude one specific disease.", ja: "モデルはいくつか近いパターンを検出しましたが、特定の病害と断定するには確信度が不足しています。" },
  "Ảnh có thể chưa đủ rõ, không phải cây thuộc bộ dữ liệu huấn luyện, hoặc triệu chứng đang ở giai đoạn khó phân biệt.": { vi: "Ảnh có thể chưa đủ rõ, không phải cây thuộc bộ dữ liệu huấn luyện, hoặc triệu chứng đang ở giai đoạn khó phân biệt.", en: "The image may be unclear, the crop may be outside the training data, or symptoms may be at a hard-to-distinguish stage.", ja: "画像が不鮮明、作物が学習データ外、または症状が判別しにくい段階の可能性があります。" },
  "Nếu top dự đoán trải trên nhiều cây khác nhau, đây là dấu hiệu ảnh có thể ngoài phạm vi nhận diện.": { vi: "Nếu top dự đoán trải trên nhiều cây khác nhau, đây là dấu hiệu ảnh có thể ngoài phạm vi nhận diện.", en: "If top predictions span multiple crops, the image may be outside the model's recognition scope.", ja: "上位予測が複数作物にまたがる場合、画像が認識範囲外の可能性があります。" },
  "Chụp lại ảnh cận vùng bệnh, đủ sáng và giảm bớt nền thừa.": { vi: "Chụp lại ảnh cận vùng bệnh, đủ sáng và giảm bớt nền thừa.", en: "Retake a close-up of the diseased area with good light and less background clutter.", ja: "病斑部を明るく近接撮影し、余分な背景を減らして撮り直してください。" },
  "Đối chiếu thêm nhiều lá, mặt dưới lá và tình trạng ngoài đồng trước khi xử lý.": { vi: "Đối chiếu thêm nhiều lá, mặt dưới lá và tình trạng ngoài đồng trước khi xử lý.", en: "Compare more leaves, leaf undersides, and field conditions before treating.", ja: "処理前に複数の葉、葉裏、現場状況を照合してください。" },
  "Không nên quyết định phun thuốc chỉ dựa trên kết quả AI có độ tin cậy thấp hoặc biên phân tách thấp.": { vi: "Không nên quyết định phun thuốc chỉ dựa trên kết quả AI có độ tin cậy thấp hoặc biên phân tách thấp.", en: "Do not decide to spray based only on a low-confidence AI result or a narrow prediction margin.", ja: "低信頼度または判定差が小さいAI結果だけで散布を決めないでください。" },
  "Hệ thống đang xem ảnh này là chưa đủ an toàn để kết luận chắc một bệnh cụ thể. Hãy xem top dự đoán bên dưới, đối chiếu cây trồng thật và chụp lại ảnh rõ hơn trước khi xử lý.": { vi: "Hệ thống đang xem ảnh này là chưa đủ an toàn để kết luận chắc một bệnh cụ thể. Hãy xem top dự đoán bên dưới, đối chiếu cây trồng thật và chụp lại ảnh rõ hơn trước khi xử lý.", en: "The system does not consider this image safe enough to conclude one specific disease. Review the top predictions, verify the actual crop, and retake a clearer image before treatment.", ja: "この画像は特定の病害を確定するには十分安全ではありません。下の上位予測を確認し、実際の作物と照合し、処理前により鮮明な画像を撮り直してください。" },
  "Chụp thêm 2-3 ảnh ở các góc khác nhau với nền gọn hơn.": { vi: "Chụp thêm 2-3 ảnh ở các góc khác nhau với nền gọn hơn.", en: "Take 2-3 more photos from different angles with a cleaner background.", ja: "背景を整理して、別角度からさらに2〜3枚撮影してください。" },
  "Nếu có thể, đối chiếu với ảnh mẫu bệnh chuẩn trong dataset huấn luyện.": { vi: "Nếu có thể, đối chiếu với ảnh mẫu bệnh chuẩn trong dataset huấn luyện.", en: "If possible, compare with standard disease sample images from the training dataset.", ja: "可能であれば、学習データセット内の標準病害画像と照合してください。" },
  "Xác nhận cây trồng thật có nằm trong phạm vi bộ dữ liệu model không.": { vi: "Xác nhận cây trồng thật có nằm trong phạm vi bộ dữ liệu model không.", en: "Confirm whether the actual crop is within the model dataset scope.", ja: "実際の作物がモデルのデータセット範囲内か確認してください。" },
  "Kiểm tra triệu chứng trên nhiều lá và vị trí khác nhau.": { vi: "Kiểm tra triệu chứng trên nhiều lá và vị trí khác nhau.", en: "Check symptoms on multiple leaves and positions.", ja: "複数の葉や部位で症状を確認してください。" },
  "Chụp lại ảnh rõ hơn trước khi tin vào dự đoán của AI.": { vi: "Chụp lại ảnh rõ hơn trước khi tin vào dự đoán của AI.", en: "Retake a clearer image before relying on the AI prediction.", ja: "AI予測を信頼する前に、より鮮明な画像を撮り直してください。" },
  "Màu lá tương đối đồng đều, chưa thấy dấu hiệu tổn thương nổi bật.": { vi: "Màu lá tương đối đồng đều, chưa thấy dấu hiệu tổn thương nổi bật.", en: "Leaf color is relatively even with no prominent damage signs.", ja: "葉色は比較的均一で、目立つ損傷は見られません。" },
  "Chưa phát hiện rõ các mảng cháy, đốm bệnh hoặc biến dạng đặc trưng.": { vi: "Chưa phát hiện rõ các mảng cháy, đốm bệnh hoặc biến dạng đặc trưng.", en: "No clear scorch patches, disease spots, or characteristic distortion were detected.", ja: "明確な枯れ込み、病斑、特徴的な変形は検出されていません。" },
  "Tiếp tục chăm sóc theo quy trình hiện tại và theo dõi vườn định kỳ.": { vi: "Tiếp tục chăm sóc theo quy trình hiện tại và theo dõi vườn định kỳ.", en: "Continue current care practices and monitor the garden or field regularly.", ja: "現在の管理を続け、園地や圃場を定期的に観察してください。" },
  "Duy trì thông thoáng tán lá, tưới hợp lý và vệ sinh đồng ruộng.": { vi: "Duy trì thông thoáng tán lá, tưới hợp lý và vệ sinh đồng ruộng.", en: "Maintain canopy airflow, proper irrigation, and field sanitation.", ja: "葉群の通気、適切な灌水、圃場衛生を維持してください。" },
  "Ảnh được model nhận diện là cây khỏe mạnh. Dù vậy vẫn nên quan sát thực địa thêm vì mô hình có thể tự tin quá mức với ảnh ngoài phân bố huấn luyện.": { vi: "Ảnh được model nhận diện là cây khỏe mạnh. Dù vậy vẫn nên quan sát thực địa thêm vì mô hình có thể tự tin quá mức với ảnh ngoài phân bố huấn luyện.", en: "The model identified the image as a healthy plant. Still, observe the field because the model may be overconfident on images outside its training distribution.", ja: "モデルはこの画像を健全株と判定しました。ただし、学習分布外の画像では過信する場合があるため、現場観察も行ってください。" },
  "Theo dõi mặt trên và mặt dưới lá mỗi 3-5 ngày.": { vi: "Theo dõi mặt trên và mặt dưới lá mỗi 3-5 ngày.", en: "Check upper and lower leaf surfaces every 3-5 days.", ja: "3〜5日ごとに葉表と葉裏を確認してください。" },
  "Giữ độ ẩm và mật độ trồng ổn định để hạn chế áp lực sâu bệnh.": { vi: "Giữ độ ẩm và mật độ trồng ổn định để hạn chế áp lực sâu bệnh.", en: "Keep moisture and planting density stable to limit pest and disease pressure.", ja: "湿度と栽植密度を安定させ、病害虫圧を抑えてください。" },
  "Kiểm tra các lá non và lá già ở nhiều vị trí.": { vi: "Kiểm tra các lá non và lá già ở nhiều vị trí.", en: "Check young and old leaves in multiple positions.", ja: "複数箇所で若葉と古葉を確認してください。" },
  "Theo dõi thêm nếu thời tiết ẩm hoặc xuất hiện côn trùng môi giới.": { vi: "Theo dõi thêm nếu thời tiết ẩm hoặc xuất hiện côn trùng môi giới.", en: "Monitor more closely if weather is humid or vector insects appear.", ja: "湿潤な天候や媒介昆虫が見られる場合は、さらに注意して観察してください。" },
  "Lá có đốm úng nước hoặc cháy nâu, gân lá có thể thâm đen và lá héo rũ.": { vi: "Lá có đốm úng nước hoặc cháy nâu, gân lá có thể thâm đen và lá héo rũ.", en: "Leaves show water-soaked spots or brown blight; veins may darken and leaves may wilt.", ja: "葉に水浸状斑や褐色の枯れ込みが出て、葉脈が黒ずみ、葉がしおれることがあります。" },
  "Bệnh dễ lan sau mưa gió, qua hom giống nhiễm bệnh, nước bắn và dụng cụ canh tác.": { vi: "Bệnh dễ lan sau mưa gió, qua hom giống nhiễm bệnh, nước bắn và dụng cụ canh tác.", en: "The disease spreads easily after rain and wind, through infected cuttings, splashing water, and farming tools.", ja: "雨風の後、感染した挿し穂、水はね、農具を通じて広がりやすい病気です。" },
  "Loại bỏ lá/cành bệnh nặng và hạn chế đi lại, cắt tỉa khi cây đang ướt.": { vi: "Loại bỏ lá/cành bệnh nặng và hạn chế đi lại, cắt tỉa khi cây đang ướt.", en: "Remove heavily diseased leaves or branches and limit movement or pruning while plants are wet.", ja: "重症の葉や枝を除去し、株が濡れている時の移動や剪定を控えてください。" },
  "Kiểm tra hom giống, thân và các cây kế bên để đánh giá mức lan.": { vi: "Kiểm tra hom giống, thân và các cây kế bên để đánh giá mức lan.", en: "Check planting cuttings, stems, and neighboring plants to assess spread.", ja: "挿し穂、茎、隣接株を確認して広がり具合を評価してください。" },
  "Vệ sinh dụng cụ và chỉ dùng sản phẩm phù hợp bệnh vi khuẩn theo nhãn khi thật cần.": { vi: "Vệ sinh dụng cụ và chỉ dùng sản phẩm phù hợp bệnh vi khuẩn theo nhãn khi thật cần.", en: "Sanitize tools and use labeled bacterial-disease products only when truly needed.", ja: "道具を消毒し、本当に必要な場合のみラベルに従って細菌病用資材を使用してください。" },
  "Dùng hom giống sạch bệnh, không lấy hom từ ruộng đã có triệu chứng.": { vi: "Dùng hom giống sạch bệnh, không lấy hom từ ruộng đã có triệu chứng.", en: "Use disease-free cuttings and do not take cuttings from fields showing symptoms.", ja: "無病の挿し穂を使い、症状が出た圃場から挿し穂を取らないでください。" },
  "Dọn tàn dư bệnh và bố trí mật độ trồng thông thoáng.": { vi: "Dọn tàn dư bệnh và bố trí mật độ trồng thông thoáng.", en: "Remove diseased residue and keep planting density airy.", ja: "病残渣を片付け、栽植密度を通気よく保ってください。" },
  "Lá có mảng vàng hoặc vệt loang, thân có thể có vệt nâu; củ có hoại tử nâu làm giảm chất lượng mạnh.": { vi: "Lá có mảng vàng hoặc vệt loang, thân có thể có vệt nâu; củ có hoại tử nâu làm giảm chất lượng mạnh.", en: "Leaves may show yellow patches or mottling, stems may have brown streaks, and roots can develop brown necrosis that greatly reduces quality.", ja: "葉に黄斑やまだらが出て、茎に褐色条斑が現れ、塊根に褐色壊死が生じ品質を大きく低下させることがあります。" },
  "Triệu chứng trên lá đôi khi nhẹ nhưng củ đã bị ảnh hưởng, nên cần kiểm tra thêm phần củ nếu nghi ngờ.": { vi: "Triệu chứng trên lá đôi khi nhẹ nhưng củ đã bị ảnh hưởng, nên cần kiểm tra thêm phần củ nếu nghi ngờ.", en: "Leaf symptoms can be mild even when roots are affected, so check roots when suspicion remains.", ja: "葉の症状が軽くても塊根が影響を受けている場合があるため、疑わしい時は塊根も確認してください。" },
  "Đánh dấu cây nghi bệnh và kiểm tra thêm thân, củ nếu có thể.": { vi: "Đánh dấu cây nghi bệnh và kiểm tra thêm thân, củ nếu có thể.", en: "Mark suspected plants and inspect stems and roots if possible.", ja: "疑わしい株に印を付け、可能なら茎と塊根を追加確認してください。" },
  "Không dùng hom từ cây nghi nhiễm để nhân giống.": { vi: "Không dùng hom từ cây nghi nhiễm để nhân giống.", en: "Do not use cuttings from suspected infected plants for propagation.", ja: "感染が疑われる株の挿し穂を増殖に使わないでください。" },
  "Quản lý bọ phấn theo IPM và loại bỏ cây bệnh nặng khi ổ bệnh còn nhỏ.": { vi: "Quản lý bọ phấn theo IPM và loại bỏ cây bệnh nặng khi ổ bệnh còn nhỏ.", en: "Manage whiteflies with IPM and remove severely diseased plants while infection patches are still small.", ja: "IPMでコナジラミを管理し、発生が小さいうちに重症株を除去してください。" },
  "Dùng giống sạch bệnh/chống chịu và kiểm tra nguồn hom trước khi trồng.": { vi: "Dùng giống sạch bệnh/chống chịu và kiểm tra nguồn hom trước khi trồng.", en: "Use disease-free or tolerant varieties and check cutting sources before planting.", ja: "無病または耐病性品種を使い、植え付け前に挿し穂の供給源を確認してください。" },
  "Theo dõi bọ phấn và cây ký chủ phụ quanh ruộng.": { vi: "Theo dõi bọ phấn và cây ký chủ phụ quanh ruộng.", en: "Monitor whiteflies and alternate host plants around the field.", ja: "圃場周辺のコナジラミと代替宿主植物を観察してください。" },
  "Lá xuất hiện đốm xanh loang hoặc khảm nhẹ, màu lá không đồng đều.": { vi: "Lá xuất hiện đốm xanh loang hoặc khảm nhẹ, màu lá không đồng đều.", en: "Leaves show green mottling or mild mosaic with uneven leaf color.", ja: "葉に緑色のまだらや軽いモザイクが現れ、葉色が不均一になります。" },
  "Cần phân biệt với thiếu dinh dưỡng, stress môi trường hoặc ảnh chụp thiếu sáng.": { vi: "Cần phân biệt với thiếu dinh dưỡng, stress môi trường hoặc ảnh chụp thiếu sáng.", en: "Differentiate this from nutrient deficiency, environmental stress, or poorly lit photos.", ja: "栄養不足、環境ストレス、暗い写真による見え方と区別する必要があります。" },
  "Chụp thêm lá non và lá già ở nhiều vị trí để xác nhận triệu chứng có lặp lại không.": { vi: "Chụp thêm lá non và lá già ở nhiều vị trí để xác nhận triệu chứng có lặp lại không.", en: "Photograph young and older leaves in several positions to confirm whether symptoms repeat.", ja: "若葉と古葉を複数箇所で撮影し、症状が繰り返し出ているか確認してください。" },
  "Theo dõi cây nghi bệnh trong 5-7 ngày và kiểm tra côn trùng môi giới.": { vi: "Theo dõi cây nghi bệnh trong 5-7 ngày và kiểm tra côn trùng môi giới.", en: "Monitor suspected plants for 5-7 days and check for insect vectors.", ja: "疑わしい株を5〜7日観察し、媒介昆虫を確認してください。" },
  "Không dùng hom từ cây có triệu chứng bất thường để nhân giống.": { vi: "Không dùng hom từ cây có triệu chứng bất thường để nhân giống.", en: "Do not propagate cuttings from plants with abnormal symptoms.", ja: "異常症状のある株の挿し穂を増殖に使わないでください。" },
  "Duy trì nguồn hom sạch bệnh và loại bỏ cây tự mọc/cây ký chủ phụ quanh ruộng.": { vi: "Duy trì nguồn hom sạch bệnh và loại bỏ cây tự mọc/cây ký chủ phụ quanh ruộng.", en: "Maintain disease-free cutting sources and remove volunteer or alternate host plants around fields.", ja: "無病の挿し穂供給源を維持し、圃場周辺の自生株や代替宿主を除去してください。" },
  "Bón phân cân đối để giảm nhầm lẫn với stress sinh lý.": { vi: "Bón phân cân đối để giảm nhầm lẫn với stress sinh lý.", en: "Apply balanced fertilization to reduce confusion with physiological stress.", ja: "生理ストレスとの混同を減らすため、施肥をバランスよく行ってください。" },
  "Lá khảm xanh vàng rõ, biến dạng, xoăn hoặc nhỏ lại; cây có thể còi cọc.": { vi: "Lá khảm xanh vàng rõ, biến dạng, xoăn hoặc nhỏ lại; cây có thể còi cọc.", en: "Leaves show clear yellow-green mosaic, distortion, curling, or reduced size; plants may become stunted.", ja: "葉に明瞭な黄緑色モザイク、変形、巻き、小型化が見られ、株が矮化することがあります。" },
  "Bệnh lan mạnh qua hom giống nhiễm bệnh và bọ phấn môi giới.": { vi: "Bệnh lan mạnh qua hom giống nhiễm bệnh và bọ phấn môi giới.", en: "The disease spreads strongly through infected cuttings and whitefly vectors.", ja: "感染した挿し穂とコナジラミ媒介により強く広がります。" },
  "Loại bỏ cây bệnh nặng sớm nếu mật độ còn thấp để giảm nguồn virus.": { vi: "Loại bỏ cây bệnh nặng sớm nếu mật độ còn thấp để giảm nguồn virus.", en: "Remove severely diseased plants early while incidence is low to reduce virus sources.", ja: "発生密度が低いうちに重症株を早期除去し、ウイルス源を減らしてください。" },
  "Không lấy hom giống từ cây hoặc ruộng có triệu chứng khảm.": { vi: "Không lấy hom giống từ cây hoặc ruộng có triệu chứng khảm.", en: "Do not take planting cuttings from plants or fields showing mosaic symptoms.", ja: "モザイク症状のある株や圃場から挿し穂を取らないでください。" },
  "Quản lý bọ phấn theo IPM, ưu tiên kiểm tra mặt dưới lá non.": { vi: "Quản lý bọ phấn theo IPM, ưu tiên kiểm tra mặt dưới lá non.", en: "Manage whiteflies with IPM, prioritizing checks on the underside of young leaves.", ja: "IPMでコナジラミを管理し、若葉の葉裏確認を優先してください。" },
  "Dùng giống sạch bệnh/chống chịu CMD và trồng nguồn hom đã kiểm tra.": { vi: "Dùng giống sạch bệnh/chống chịu CMD và trồng nguồn hom đã kiểm tra.", en: "Use disease-free or CMD-tolerant varieties and plant verified cuttings.", ja: "無病またはCMD耐性品種を使い、確認済みの挿し穂を植えてください。" },
  "Vệ sinh ruộng, loại bỏ cây ký chủ phụ và theo dõi bọ phấn đầu vụ.": { vi: "Vệ sinh ruộng, loại bỏ cây ký chủ phụ và theo dõi bọ phấn đầu vụ.", en: "Sanitize fields, remove alternate host plants, and monitor whiteflies early in the season.", ja: "圃場を清潔にし、代替宿主植物を除去し、作期初めからコナジラミを観察してください。" },
};

const translateExact = (value: string, language: "en" | "ja" | "vi") =>
  diagnosisDynamicText[value]?.[language] ?? diseaseText[value]?.[language] ?? plantNameText[value]?.[language] ?? value;

const plantModelOptions = [
  {
    id: "tomato",
    name: "Cà chua",
    modelName: "model.onnx",
    imageSize: 32,
    diseases: [
      "Đốm vi khuẩn",
      "Cháy lá sớm",
      "Sương mai",
      "Mốc lá",
      "Đốm lá Septoria",
      "Nhện đỏ hai chấm",
      "Đốm vòng",
      "Virus xoăn vàng lá cà chua",
      "Virus khảm cà chua",
      "Cây khỏe mạnh",
      "Phấn trắng",
    ],
  },
  {
    id: "apple",
    name: "Táo",
    modelName: "apple_disease_3class.onnx",
    imageSize: 300,
    diseases: [
      "Cây khỏe mạnh",
      "Rỉ sắt táo",
      "Ghẻ táo",
    ],
  },
  {
    id: "rice",
    name: "Lúa",
    modelName: "rice_leaf_disease.onnx",
    imageSize: 260,
    diseases: [
      "Bạc lá lúa",
      "Đạo ôn lúa",
      "Đốm nâu lúa",
      "Virus Tungro",
    ],
  },
  {
    id: "potato",
    name: "Khoai tây",
    modelName: "potato_effv2b1_best.onnx",
    imageSize: 240,
    diseases: [
      "Bệnh vi khuẩn khoai tây",
      "Bệnh nấm khoai tây",
      "Bệnh Phytophthora khoai tây",
      "Bệnh virus khoai tây",
      "Cây khoai tây khỏe mạnh",
    ],
  },
  {
    id: "cassava",
    name: "Sắn",
    modelName: "cassava_best_efficientnetv2b3_acc819.keras",
    imageSize: 300,
    diseases: [
      "Cháy lá vi khuẩn sắn",
      "Bệnh sọc nâu sắn",
      "Đốm xanh lá sắn",
      "Bệnh khảm lá sắn",
      "Cây sắn khỏe mạnh",
    ],
  },
  {
    id: "corn",
    name: "Ngô",
    modelName: "agribot_models.pkl",
    imageSize: 224,
    diseases: [
      "Cercospora Leaf Spot (Gray Leaf Spot)",
      "Common Rust",
      "Northern Leaf Blight",
      "Healthy",
      "Other",
    ],
  },
  {
    id: "bean",
    name: "Đậu",
    modelName: "ViT bean v1 • transformers 4.33.2",
    imageSize: 224,
    diseases: [
      "Đốm góc lá đậu",
      "Rỉ sắt đậu",
      "Cây đậu khỏe mạnh",
    ],
  },
];

const plantModelIcons: Record<string, string> = {
  tomato: "🍅",
  apple: "🍎",
  rice: "🌾",
  potato: "🥔",
  cassava: "🌿",
  corn: "🌽",
  bean: "🫘",
};

const DiagnosisView = ({ user, setView, onOpenProtocol }: DiagnosisViewProps) => {
  const { language } = useI18n();
  const tt = (key: string) => diagnosisText[key]?.[language] ?? diagnosisText[key]?.vi ?? key;
  const translatePlant = (idOrName: string) =>
    plantNameText[idOrName]?.[language] ??
    Object.entries(plantNameText).find(([, value]) => value.vi.toLowerCase() === idOrName.toLowerCase())?.[1][language] ??
    idOrName;
  const translateDiagnosisText = (value?: string | null) => {
    if (!value) return "";

    const exact = translateExact(value, language);
    if (exact !== value) return exact;

    const localModelMatch = value.match(/Model cục bộ nhận diện ảnh có khả năng cao là "([^"]+)" trên ([^.]+)\. Dù kết quả khả quan, vẫn nên đối chiếu triệu chứng thực địa vì model có thể tự tin quá mức với ảnh ngoài phân bố huấn luyện\./);
    if (localModelMatch) {
      const disease = translateExact(localModelMatch[1], language);
      const crop = translatePlant(localModelMatch[2].trim());
      if (language === "en") {
        return `The local model identified this image as likely "${disease}" on ${crop}. Although the result is promising, you should still compare field symptoms because the model may be overconfident on images outside its training distribution.`;
      }
      if (language === "ja") {
        return `ローカルモデルは、この画像を${crop}の「${disease}」である可能性が高いと判定しました。結果は有望ですが、学習分布外の画像ではモデルが過信する場合があるため、現場症状との照合を行ってください。`;
      }
    }

    return value;
  };
  const translateDisease = (value: string) => translateDiagnosisText(value);
  const locale = language === "vi" ? "vi-VN" : language === "ja" ? "ja-JP" : "en-US";
  const [image, setImage] = useState<string | null>(null);
  const [imageName, setImageName] = useState<string | null>(null);
  const [selectedPlantId, setSelectedPlantId] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<Diagnosis | null>(null);
  const [history, setHistory] = useState<Diagnosis[]>([]);
  const [activeTab, setActiveTab] = useState<'upload' | 'history'>('upload');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const selectedPlant = plantModelOptions.find((item) => item.id === selectedPlantId);
  const resultProviderLabel = result?.provider
    ? result.provider === "local"
      ? `${tt("originalModelBadge")}${result.model ? ` • ${result.model}` : ""}`
      : `${result.provider}${result.model ? ` • ${result.model}` : ""}`
    : "";

  const decorativeImages = [
    decorative1,
    decorative2,
    decorative3,
  ];
  const confidenceBreakdown = result?.confidenceBreakdown
    ? [
        { label: tt("texture"), value: Math.round(result.confidenceBreakdown.texture * 100) },
        { label: tt("color"), value: Math.round(result.confidenceBreakdown.color * 100) },
        { label: tt("shape"), value: Math.round(result.confidenceBreakdown.shape * 100) },
      ]
    : [];

  const diagnosisMeta = [
    {
      label: tt("crop"),
      value: result?.cropName ? translatePlant(result.cropName) : tt("unknown"),
      icon: Leaf,
      tone: "text-lime-300 bg-lime-500/10 border-lime-400/20",
    },
    {
      label: tt("severity"),
      value: result?.severity ? translateDiagnosisText(result.severity) : tt("waiting"),
      icon: Activity,
      tone: "text-orange-200 bg-orange-500/10 border-orange-400/20",
    },
    {
      label: tt("pathogen"),
      value: result?.pathogen ? translateDiagnosisText(result.pathogen) : tt("needsCheck"),
      icon: Bug,
      tone: "text-sky-200 bg-sky-500/10 border-sky-400/20",
    },
    {
      label: tt("spread"),
      value: result?.spreadSpeed ? translateDiagnosisText(result.spreadSpeed) : tt("evaluating"),
      icon: AlertCircle,
      tone: "text-rose-200 bg-rose-500/10 border-rose-400/20",
    },
  ];

  const insightCards = [
    {
      title: tt("clearPhoto"),
      description: tt("clearPhotoDesc"),
      icon: ScanSearch,
    },
    {
      title: tt("multipleAngles"),
      description: tt("multipleAnglesDesc"),
      icon: Camera,
    },
    {
      title: tt("aiScreening"),
      description: tt("aiScreeningDesc"),
      icon: ShieldCheck,
    },
  ];

  useEffect(() => {
    if (!user) return;
    return subscribeToDiagnoses({
      userId: user.uid,
      take: 10,
      onData: setHistory,
      onError: (err) => console.error("Diagnosis history load error:", err),
    });
  }, [user]);

  const loadFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setErrorMessage(tt("invalidImage"));
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage(tt("imageTooLarge"));
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImage(reader.result as string);
      setImageName(file.name);
      setErrorMessage(null);
      setResult(null);
      setSelectedPlantId(null);
    };
    reader.readAsDataURL(file);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      loadFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      loadFile(file);
    }
  };

  const resetImage = () => {
    setImage(null);
    setImageName(null);
    setErrorMessage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleAnalyze = async () => {
    if (!image) return;
    if (!selectedPlantId) {
      setErrorMessage(tt("selectCropFirst"));
      return;
    }
    setIsAnalyzing(true);
    setErrorMessage(null);
    try {
      const analysis = await analyzeDisease(image, selectedPlantId);
      if (analysis) {
        if (selectedPlantId === "cassava" && analysis.provider !== "local") {
          setErrorMessage(tt("cassavaApiBlocked"));
          setResult(null);
          return;
        }

        const diagnosisData = await createDiagnosis({
          ...analysis,
          userId: user?.uid || 'anonymous',
          imageUrl: image,
        });
        setResult(diagnosisData);
      } else {
        setErrorMessage(tt("noAIResponse"));
      }
    } catch (e) {
      console.error(e);
      if (e instanceof Error) {
        setErrorMessage(e.message);
      } else if (typeof e === "object" && e !== null && "message" in e) {
        setErrorMessage(String((e as { message?: unknown }).message || tt("analyzeError")));
      } else {
        setErrorMessage(tt("analyzeError"));
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="pt-28 pb-24 min-h-screen bg-zinc-950">
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-10 rounded-[40px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.18),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.12),transparent_22%),linear-gradient(135deg,rgba(10,15,13,0.96),rgba(6,8,7,0.98))] p-8 md:p-10">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-stretch lg:justify-between">
            <div className="max-w-3xl lg:flex-1">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.25em] text-emerald-300">
                <Sparkles className="h-3.5 w-3.5" />
                {tt("heroBadge")}
              </div>
              <h1 className="font-headline text-4xl font-black tracking-tight text-white md:text-6xl">
                {tt("heroTitleA")}
                <span className="block text-gradient-ai">{tt("heroTitleB")}</span>
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-8 text-white/55 md:text-lg">
                {tt("heroCopy")}
              </p>
            </div>

            <div className="flex min-w-0 flex-col gap-4 lg:w-[52%] lg:max-w-3xl lg:justify-between">
              <div className="group relative min-h-[210px] overflow-hidden rounded-[32px] border border-white/10 bg-black/35 shadow-2xl shadow-black/30">
                <video
                  src={heroDiagnosisVideo}
                  className="h-full min-h-[210px] w-full object-cover opacity-90 transition duration-700 group-hover:scale-105 group-hover:opacity-100"
                  autoPlay
                  muted
                  loop
                  playsInline
                  aria-label="Video minh họa chẩn đoán bệnh cây"
                />
                <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.02),rgba(0,0,0,0.35)),radial-gradient(circle_at_top_left,rgba(52,211,153,0.18),transparent_34%)]" />
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {insightCards.map(({ title, description, icon: Icon }) => (
                  <div key={title} className="rounded-[28px] border border-white/8 bg-white/[0.04] p-4 backdrop-blur-xl">
                    <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-300">
                      <Icon className="h-5 w-5" />
                    </div>
                    <p className="text-sm font-bold text-white">{title}</p>
                    <p className="mt-2 text-sm leading-6 text-white/45">{description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 mb-8 md:grid-cols-3">
          {decorativeImages.map((src, idx) => (
            <div key={idx} className="overflow-hidden rounded-3xl border border-white/10 shadow-xl shadow-black/20">
              <img src={src} alt={`Decorative ${idx + 1}`} className="w-full h-32 md:h-40 object-cover transition-transform duration-700 hover:scale-110" />
            </div>
          ))}
        </div>

        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
          <div className="space-y-8">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-widest mb-6">
                <Camera className="w-3 h-3" /> {tt("cropSpecificModelsBadge")}
              </div>
              <h2 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tighter">
                {tt("processTitleA")}
                <span className="block text-emerald-500">{tt("processTitleB")}</span>
              </h2>
              <p className="text-base md:text-lg text-white/40 leading-relaxed">
                {tt("processCopy")}
              </p>
            </div>

            <div className="flex gap-4 p-1.5 bg-white/5 rounded-2xl w-fit">
              <button 
                onClick={() => setActiveTab('upload')}
                className={`px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'upload' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20' : 'text-white/40 hover:text-white'}`}
              >
                {tt("newAnalysis")}
              </button>
              <button 
                onClick={() => setActiveTab('history')}
                className={`px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'history' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20' : 'text-white/40 hover:text-white'}`}
              >
                {tt("history")} ({history.length})
              </button>
            </div>

            <AnimatePresence mode="wait">
              {activeTab === 'upload' ? (
                <motion.div 
                  key="upload"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-8"
                >
                  <div className="relative aspect-video rounded-[40px] bg-zinc-900 border-2 border-dashed border-white/10 overflow-hidden group">
                    {image ? (
                      <>
                        <img src={image} alt="Upload" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.02),rgba(0,0,0,0.7))] p-5 flex flex-col justify-between">
                          <div className="flex justify-between gap-3">
                            <span className="inline-flex items-center gap-2 rounded-full bg-black/45 px-3 py-2 text-xs font-bold text-white/80 backdrop-blur">
                              <ImagePlus className="h-4 w-4 text-emerald-400" />
                              {imageName || tt("imageSelected")}
                            </span>
                            <button
                              type="button"
                              onClick={resetImage}
                              className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-black/50 text-white/75 transition hover:bg-white hover:text-black"
                            >
                              <X className="h-5 w-5" />
                            </button>
                          </div>
                          <div className="flex flex-wrap gap-3">
                            <label className="cursor-pointer px-5 py-3 bg-white text-black rounded-2xl font-bold text-sm">
                              {tt("changeImage")}
                              <input
                                ref={fileInputRef}
                                type="file"
                                className="hidden"
                                accept="image/*"
                                onChange={handleImageUpload}
                              />
                            </label>
                          </div>
                        </div>
                      </>
                    ) : (
                      <label
                        onDragOver={(e) => {
                          e.preventDefault();
                          setIsDragging(true);
                        }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={handleDrop}
                        className={`absolute inset-0 cursor-pointer flex flex-col items-center justify-center gap-5 transition-colors ${
                          isDragging ? "bg-emerald-500/10" : "hover:bg-white/5"
                        }`}
                      >
                        <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 flex items-center justify-center">
                          <Upload className="text-emerald-500 w-8 h-8" />
                        </div>
                        <div className="text-center">
                          <p className="text-white font-bold text-lg">{tt("dropImage")}</p>
                          <p className="mt-2 text-sm text-white/45 max-w-sm">
                            {tt("dropImageDesc")}
                          </p>
                          <p className="text-xs text-white/30 uppercase tracking-widest mt-3">{tt("supported")}</p>
                        </div>
                        <div className="rounded-full border border-emerald-400/25 bg-emerald-400/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-emerald-300">
                          {tt("tapUpload")}
                        </div>
                        <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                      </label>
                    )}
                  </div>

                  {errorMessage ? (
                    <div className="rounded-[28px] border border-rose-500/20 bg-rose-500/10 p-5 text-sm leading-7 text-rose-100">
                      <div className="mb-2 flex items-center gap-2 font-bold">
                        <TriangleAlert className="h-4 w-4" />
                        {tt("diagnosisErrorTitle")}
                      </div>
                      <p>{errorMessage}</p>
                    </div>
                  ) : null}

                  <div className="grid gap-4 md:grid-cols-3">
                    {insightCards.map(({ title, description, icon: Icon }) => (
                      <div key={title} className="rounded-[28px] border border-white/8 bg-white/[0.03] p-5">
                        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-white/5 text-emerald-300">
                          <Icon className="h-5 w-5" />
                        </div>
                        <p className="text-sm font-bold text-white">{title}</p>
                        <p className="mt-2 text-sm leading-6 text-white/45">{description}</p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              ) : (
                <motion.div 
                  key="history"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-4"
                >
                  {history.length > 0 ? history.map(item => (
                    <div key={item.id} className="p-6 rounded-3xl bg-zinc-900 border border-white/5 flex items-center gap-6 group hover:border-emerald-500/30 transition-all">
                      <img src={item.imageUrl} className="w-20 h-20 rounded-2xl object-cover" alt="Diagnosis" />
                      <div className="flex-1 min-w-0">
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          <h4 className="text-white font-bold text-lg">{translateDisease(item.diseaseName)}</h4>
                          <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-300">
                            {item.confidence}%
                          </span>
                        </div>
                        <p className="text-xs text-white/30 uppercase tracking-widest font-bold">
                          {translatePlant(item.cropName)} • {item.createdAt?.toDate ? item.createdAt.toDate().toLocaleDateString(locale) : tt("justNow")}
                        </p>
                        <p className="mt-2 line-clamp-2 text-sm text-white/45">
                          {translateDiagnosisText(item.recommendation) || tt("openResultHint")}
                        </p>
                      </div>
                      <button onClick={() => setResult(item)} className="p-4 rounded-2xl bg-white/5 text-white/40 group-hover:text-emerald-500 transition-colors shrink-0">
                        <ChevronRight className="w-6 h-6" />
                      </button>
                    </div>
                  )) : (
                    <div className="rounded-[32px] border border-dashed border-white/8 bg-white/[0.02] p-8 text-center">
                      <RefreshCcw className="mx-auto mb-4 h-10 w-10 text-white/15" />
                      <h3 className="text-xl font-bold text-white/80">{tt("noHistoryTitle")}</h3>
                      <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-white/40">
                        {tt("noHistoryDesc")}
                      </p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="lg:sticky lg:top-28 self-start">
            <AnimatePresence mode="wait">
              {result ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="overflow-hidden rounded-[40px] border border-white/10 bg-[linear-gradient(180deg,rgba(18,24,22,0.96),rgba(10,12,11,0.98))] shadow-3xl"
                >
                  <div className="border-b border-white/8 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.16),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.01))] p-8 md:p-10">
                    <div className="mb-7 flex flex-wrap items-start justify-between gap-6">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-3xl bg-emerald-500/20 flex items-center justify-center">
                          <CheckCircle2 className="text-emerald-500 w-7 h-7" />
                        </div>
                        <div>
                          <div className="mb-2 flex flex-wrap items-center gap-2">
                            <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-300">
                              {tt("aiResult")}
                            </span>
                            {result.provider ? (
                              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-white/55">
                                {resultProviderLabel}
                              </span>
                            ) : null}
                          </div>
                          <h3 className="text-3xl font-black text-white tracking-tight md:text-4xl">{translateDisease(result.diseaseName)}</h3>
                          <p className="mt-2 text-sm font-bold uppercase tracking-[0.2em] text-emerald-400">
                            {tt("confidence")}: {result.confidence}%
                          </p>
                          {result.confidence < 40 ? (
                            <p className="mt-3 inline-flex items-center gap-2 rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1 text-xs font-bold text-amber-200">
                              <TriangleAlert className="h-3.5 w-3.5" />
                              {tt("lowConfidence")}
                            </p>
                          ) : null}
                          {result.rawLabel ? (
                            <p className="mt-3 text-xs font-semibold tracking-[0.12em] text-white/45">
                              {tt("rawModelLabel")}: <span className="font-mono text-emerald-300">{result.rawLabel}</span>
                            </p>
                          ) : null}
                        </div>
                      </div>

                      <button 
                        onClick={() => onOpenProtocol(result)}
                        className="flex items-center gap-2 px-6 py-3 bg-emerald-600/10 border border-emerald-500/20 text-emerald-500 rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all"
                      >
                        <Stethoscope className="w-4 h-4" /> {tt("viewProtocol")}
                      </button>
                    </div>

                    <p className="max-w-3xl text-sm leading-7 text-white/60">
                      {translateDiagnosisText(result.recommendation) || tt("resultFallback")}
                    </p>
                  </div>

                  <div className="p-8 md:p-10 space-y-8">
                    <div className="grid gap-4 md:grid-cols-2">
                      {diagnosisMeta.map(({ label, value, icon: Icon, tone }) => (
                        <div key={label} className={`rounded-[28px] border p-5 ${tone}`}>
                          <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-black/20">
                            <Icon className="h-5 w-5" />
                          </div>
                          <p className="text-[11px] font-black uppercase tracking-[0.24em] text-white/45">{label}</p>
                          <p className="mt-2 text-lg font-bold text-white">{value}</p>
                        </div>
                      ))}
                    </div>

                    {confidenceBreakdown.length > 0 ? (
                      <section className="rounded-[32px] border border-white/8 bg-white/[0.03] p-6">
                        <div className="mb-5 flex items-center gap-3">
                          <Info className="h-5 w-5 text-sky-300" />
                          <h4 className="text-xs font-bold text-white/40 uppercase tracking-[0.2em]">{tt("confidenceDetails")}</h4>
                        </div>
                        <div className="space-y-4">
                          {confidenceBreakdown.map((item) => (
                            <div key={item.label}>
                              <div className="mb-2 flex items-center justify-between text-sm">
                                <span className="text-white/70">{item.label}</span>
                                <span className="font-bold text-white">{item.value}%</span>
                              </div>
                              <div className="h-2 overflow-hidden rounded-full bg-white/8">
                                <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-lime-300 to-sky-300" style={{ width: `${item.value}%` }} />
                              </div>
                            </div>
                          ))}
                        </div>
                      </section>
                    ) : null}

                    {result.topPredictions?.length ? (
                      <section className="rounded-[32px] border border-white/8 bg-white/[0.03] p-6">
                        <div className="mb-5 flex items-center gap-3">
                          <Sparkles className="h-5 w-5 text-amber-300" />
                          <h4 className="text-xs font-bold text-white/40 uppercase tracking-[0.2em]">{tt("modelClassProb")}</h4>
                        </div>
                        <div className="space-y-3">
                          {result.topPredictions.map((item) => (
                            <div key={item.rawLabel} className="rounded-2xl border border-white/8 bg-black/20 p-4">
                              <div className="flex flex-wrap items-center justify-between gap-3">
                                <div>
                                  <p className="font-bold text-white">{translateDisease(item.diseaseName)}</p>
                                  <p className="mt-1 text-sm text-white/45">
                                    {translatePlant(item.cropName)} • <span className="font-mono">{item.rawLabel}</span>
                                  </p>
                                </div>
                                <div className="rounded-full bg-emerald-500/10 px-3 py-1 text-sm font-bold text-emerald-300">
                                  {item.confidence}%
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </section>
                    ) : null}

                    <div className="grid gap-6 xl:grid-cols-2">
                      <section className="rounded-[32px] border border-white/8 bg-white/[0.03] p-6">
                        <h4 className="mb-4 text-xs font-bold text-white/30 uppercase tracking-[0.2em]">{tt("identifiedSymptoms")}</h4>
                        <ul className="space-y-3">
                          {(result.symptoms?.length ? result.symptoms : [tt("noSymptomDetails")]).map((s, i) => (
                            <li key={i} className="flex items-start gap-3 text-white/70 leading-relaxed">
                              <div className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                              {translateDiagnosisText(s)}
                            </li>
                          ))}
                        </ul>
                      </section>

                      <section className="rounded-[32px] border border-emerald-500/10 bg-emerald-500/5 p-6">
                        <div className="mb-4 flex items-center gap-3">
                          <ListChecks className="h-5 w-5 text-emerald-400" />
                          <h4 className="text-xs font-bold text-white/30 uppercase tracking-[0.2em]">{tt("immediateChecklist")}</h4>
                        </div>
                        <ul className="space-y-3">
                          {(result.treatmentChecklist?.length ? result.treatmentChecklist : result.treatment).map((t, i) => (
                            <li key={i} className="flex items-start gap-3 text-emerald-100/80 leading-relaxed">
                              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                              {translateDiagnosisText(t)}
                            </li>
                          ))}
                        </ul>
                      </section>
                    </div>

                    <section className="rounded-[32px] border border-white/8 bg-black/25 p-6">
                      <h4 className="mb-4 text-xs font-bold text-white/30 uppercase tracking-[0.2em]">{tt("treatmentSolution")}</h4>
                      <ul className="space-y-3">
                        {(result.treatment?.length ? result.treatment : [tt("noTreatment")]).map((t, i) => (
                          <li key={i} className="flex items-start gap-3 text-white/75 leading-relaxed">
                            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
                            {translateDiagnosisText(t)}
                          </li>
                        ))}
                      </ul>
                    </section>

                    {result.prevention?.length ? (
                      <section className="rounded-[32px] border border-sky-500/12 bg-sky-500/5 p-6">
                        <div className="mb-4 flex items-center gap-3">
                          <ShieldCheck className="h-5 w-5 text-sky-300" />
                          <h4 className="text-xs font-bold text-white/30 uppercase tracking-[0.2em]">{tt("prevention")}</h4>
                        </div>
                        <ul className="space-y-3">
                          {result.prevention.map((item, index) => (
                            <li key={index} className="flex items-start gap-3 text-white/70 leading-relaxed">
                              <div className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-300" />
                              {translateDiagnosisText(item)}
                            </li>
                          ))}
                        </ul>
                      </section>
                    ) : null}

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="rounded-[28px] border border-white/8 bg-white/[0.03] p-5">
                        <p className="text-[11px] font-black uppercase tracking-[0.24em] text-white/35">{tt("priority")}</p>
                        <p className="mt-3 text-3xl font-black text-white">{result.riskLevel ?? "--"}/5</p>
                        <p className="mt-2 text-sm leading-6 text-white/45">
                          {tt("priorityDesc")}
                        </p>
                      </div>
                      <div className="rounded-[28px] border border-white/8 bg-white/[0.03] p-5">
                        <p className="text-[11px] font-black uppercase tracking-[0.24em] text-white/35">{tt("interventionGroup")}</p>
                        <p className="mt-3 text-lg font-bold text-white">{result.pesticideType ? translateDiagnosisText(result.pesticideType) : tt("verifyBeforeUse")}</p>
                        <p className="mt-2 text-sm leading-6 text-white/45">
                          {tt("safetyDesc")}
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <div className="min-h-[760px] rounded-[40px] border border-white/8 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.14),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.015))] p-6 md:p-8">
                  {!image ? (
                    <div className="flex h-full min-h-[680px] flex-col items-center justify-center text-center">
                      <div className="mb-8 flex h-28 w-28 items-center justify-center rounded-[36px] bg-white/5 shadow-[0_30px_100px_rgba(0,0,0,0.32)]">
                        <Microscope className="h-14 w-14 text-white/15" />
                      </div>
                      <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/5 px-4 py-2 text-[11px] font-black uppercase tracking-[0.24em] text-white/45">
                        <Sparkles className="h-3.5 w-3.5" />
                        {tt("resultPanel")}
                      </div>
                      <h3 className="text-3xl font-black text-white/85 md:text-4xl">{tt("uploadFirstTitle")}</h3>
                      <p className="mt-4 max-w-md text-base leading-8 text-white/40">
                        {tt("uploadFirstDesc")}
                      </p>
                      <div className="mt-8 grid w-full max-w-2xl gap-4 md:grid-cols-3">
                        {[tt("panelCard1"), tt("panelCard2"), tt("panelCard3")].map((item) => (
                          <div key={item} className="rounded-[26px] border border-white/8 bg-white/[0.03] p-4 text-sm font-semibold text-white/55">
                            {item}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div>
                        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.24em] text-emerald-300">
                          <ScanSearch className="h-3.5 w-3.5" />
                          {tt("cropSpecificModelsBadge")}
                        </div>
                        <h3 className="text-3xl font-black tracking-tight text-white md:text-4xl">{tt("confirmPlantTitle")}</h3>
                        <p className="mt-4 text-base leading-8 text-white/45">
                          {tt("confirmPlantDesc")}
                        </p>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-3">
                        {[
                          { label: tt("validImage"), ready: true },
                          { label: tt("leafDetected"), ready: true },
                          {
                            label: selectedPlantId
                              ? selectedPlantId === "cassava"
                                  ? tt("readyOriginalCassavaModel")
                                : tt("readySpecializedModel")
                              : tt("waitingCropConfirm"),
                            ready: Boolean(selectedPlantId),
                          },
                        ].map((item) => (
                          <div key={item.label} className={`rounded-[24px] border p-4 ${item.ready ? "border-emerald-400/15 bg-emerald-400/10 text-emerald-100" : "border-white/8 bg-white/[0.03] text-white/45"}`}>
                            <CheckCircle2 className={`mb-3 h-5 w-5 ${item.ready ? "text-emerald-300" : "text-white/20"}`} />
                            <p className="text-sm font-bold leading-6">{item.label}</p>
                          </div>
                        ))}
                      </div>

                      <section className="rounded-[32px] border border-white/8 bg-black/20 p-5">
                        <p className="text-[11px] font-black uppercase tracking-[0.22em] text-white/35">{tt("choosePlant")}</p>
                        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                          {plantModelOptions.map((plant) => {
                            const isSelected = selectedPlantId === plant.id;
                            return (
                              <button
                                key={plant.id}
                                type="button"
                                onClick={() => {
                                  setSelectedPlantId(plant.id);
                                  setResult(null);
                                  setErrorMessage(null);
                                }}
                                className={`group min-h-[76px] rounded-[24px] border p-4 text-left transition ${
                                  isSelected
                                    ? "border-emerald-300 bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/15"
                                    : "border-white/10 bg-white/[0.035] text-white/70 hover:border-emerald-400/35 hover:bg-emerald-500/10 hover:text-white"
                                }`}
                              >
                                <span className="mb-3 block text-2xl">{plantModelIcons[plant.id] ?? "🌱"}</span>
                                <span className="block text-sm font-black">{translatePlant(plant.id)}</span>
                              </button>
                            );
                          })}
                        </div>
                      </section>

                      <button
                        onClick={handleAnalyze}
                        disabled={!selectedPlantId || isAnalyzing}
                        className="flex w-full items-center justify-center gap-3 rounded-[28px] bg-emerald-500 px-6 py-5 text-base font-black text-slate-950 shadow-2xl shadow-emerald-600/20 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-45"
                      >
                        {isAnalyzing ? (
                          <>
                            <Loader2 className="h-5 w-5 animate-spin" /> {tt("analyzing")}
                          </>
                        ) : (
                          <>
                            {tt("startDiagnosis")} <ArrowRight className="h-5 w-5" />
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiagnosisView;
