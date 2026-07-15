import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Activity,
  Bot,
  CheckCircle2,
  ClipboardList,
  Copy,
  Loader2,
  MessageSquare,
  Printer,
  Send,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Target,
  TriangleAlert,
} from "lucide-react";
import { motion } from "motion/react";
import { AppUser, Diagnosis, TreatmentProtocol, View } from "../types";
import { getAIConsultation } from "../services/aiService";
import {
  RecommendationDiseaseProfile,
  getRecommendationProfiles,
} from "../services/recommendationDataService";
import { catalogTreatmentText, getCatalogTreatmentProtocol } from "../data/treatmentProtocolCatalog";
import { LocalizedDictionary, useI18n } from "../i18n";
import protocolImage from "../../anh/phacdo.jpg";
import protocolVideo from "../../anh/video1.mp4";

interface RecommendationsViewProps {
  user: AppUser | null;
  diagnosis: Diagnosis | null;
  setView: (view: View) => void;
  onClearDiagnosis: () => void;
}

type ChatMessage = {
  role: "user" | "assistant";
  text: string;
};

const text: LocalizedDictionary = {
  badge: { vi: "Phác đồ từ chẩn đoán", en: "Protocol from diagnosis", ja: "診断結果からの対処プロトコル" },
  title: { vi: "Phác đồ điều trị", en: "Treatment protocol", ja: "治療プロトコル" },
  subtitle: {
    vi: "Trang này chỉ nhận dữ liệu từ kết quả chẩn đoán. Sau khi AI xác định bệnh, hệ thống mở đúng phác đồ và cho phép hỏi thêm chatbot theo ca bệnh.",
    en: "This page is driven by diagnosis results. After AI identifies a disease, it opens the matching protocol and lets you ask the chatbot about that case.",
    ja: "このページは診断結果を元に表示します。AIが病害を判定した後、該当プロトコルを開き、この症例についてチャットで追加相談できます。",
  },
  noCaseTitle: { vi: "Chưa có ca chẩn đoán", en: "No diagnosis selected", ja: "診断ケースが未選択です" },
  noCaseDesc: {
    vi: "Hãy sang trang Chẩn đoán AI, phân tích ảnh bệnh xong rồi bấm “Xem phác đồ”.",
    en: "Go to AI Diagnosis, analyze a disease image, then choose “View protocol”.",
    ja: "AI診断ページで病害画像を分析し、「対処プロトコルを見る」を押してください。",
  },
  goDiagnosis: { vi: "Mở trang chẩn đoán", en: "Open diagnosis", ja: "診断ページを開く" },
  backDiagnosis: { vi: "Quay lại chẩn đoán", en: "Back to diagnosis", ja: "診断へ戻る" },
  protocolLibraryPage: { vi: "Trang phác đồ", en: "Protocol page", ja: "プロトコルページ" },
  confidence: { vi: "Độ tin cậy", en: "Confidence", ja: "信頼度" },
  crop: { vi: "Cây trồng", en: "Crop", ja: "作物" },
  severity: { vi: "Mức độ", en: "Severity", ja: "重症度" },
  pathogen: { vi: "Tác nhân", en: "Pathogen", ja: "病原" },
  matchedProfile: { vi: "Đã khớp hồ sơ bệnh", en: "Matched disease profile", ja: "病害プロファイル一致" },
  fallbackProfile: { vi: "Dùng phác đồ từ kết quả chẩn đoán", en: "Using protocol from diagnosis result", ja: "診断結果からプロトコルを作成" },
  immediate: { vi: "Làm ngay", en: "Do now", ja: "すぐ実施" },
  next24h: { vi: "Trong 24 giờ", en: "Within 24 hours", ja: "24時間以内" },
  followUp: { vi: "Theo dõi tiếp", en: "Follow up", ja: "継続確認" },
  treatmentSteps: { vi: "Các bước xử lý", en: "Treatment steps", ja: "対処手順" },
  products: { vi: "Thuốc / hoạt chất gợi ý", en: "Suggested products / actives", ja: "推奨薬剤・有効成分" },
  safety: { vi: "An toàn và lưu ý", en: "Safety notes", ja: "安全上の注意" },
  symptoms: { vi: "Triệu chứng", en: "Symptoms", ja: "症状" },
  prevention: { vi: "Phòng ngừa", en: "Prevention", ja: "予防" },
  aiBox: { vi: "Chatbot tư vấn phác đồ", en: "Protocol chatbot", ja: "プロトコル相談チャット" },
  aiIntro: {
    vi: "Hỏi AI về liều dùng, thứ tự xử lý, cách theo dõi hoặc cách xác minh thêm. AI sẽ bám theo bệnh vừa chẩn đoán.",
    en: "Ask AI about dosage, action order, monitoring, or extra verification. AI will stay grounded in the diagnosed disease.",
    ja: "用量、作業順、観察方法、追加確認についてAIに質問できます。AIは診断された病害に沿って回答します。",
  },
  aiPlaceholder: { vi: "Ví dụ: Tôi nên xử lý trong 24 giờ tới như thế nào?", en: "Example: What should I do in the next 24 hours?", ja: "例：今後24時間で何をすべきですか？" },
  ask: { vi: "Gửi", en: "Send", ja: "送信" },
  aiLoading: { vi: "AI đang soạn gợi ý...", en: "AI is drafting advice...", ja: "AIが提案を作成中..." },
  functionPanel: { vi: "Chức năng nhanh", en: "Quick actions", ja: "クイック操作" },
  quickToolsTitle: { vi: "Công cụ phác đồ", en: "Protocol tools", ja: "プロトコルツール" },
  askPriority: { vi: "AI tóm tắt ưu tiên", en: "AI priority summary", ja: "AI優先要約" },
  askSafety: { vi: "AI kiểm tra an toàn", en: "AI safety check", ja: "AI安全確認" },
  askMonitoring: { vi: "AI lập lịch theo dõi", en: "AI monitoring plan", ja: "AI観察計画" },
  copyProtocol: { vi: "Sao chép phác đồ", en: "Copy protocol", ja: "プロトコルをコピー" },
  copied: { vi: "Đã sao chép", en: "Copied", ja: "コピー済み" },
  printProtocol: { vi: "In phác đồ", en: "Print protocol", ja: "印刷" },
  autoQuestion: {
    vi: "Tóm tắt phác đồ điều trị ưu tiên cho ca bệnh này trong 5 gạch đầu dòng.",
    en: "Summarize the priority treatment protocol for this case in 5 bullets.",
    ja: "この症例の優先対処プロトコルを5つの箇条書きで要約してください。",
  },
  lowConfidence: { vi: "Cần xác minh thêm trước khi dùng thuốc", en: "Verify before chemical use", ja: "薬剤使用前に追加確認" },
  noProtocolTitle: { vi: "Không tạo phác đồ điều trị", en: "No treatment protocol generated", ja: "治療プロトコルは生成されません" },
  noProtocolDesc: {
    vi: "Ảnh hoặc kết quả nhận diện chưa đủ chắc để kết luận bệnh. Hệ thống sẽ không đề xuất thuốc/phác đồ điều trị cho đến khi có ảnh rõ hơn hoặc xác minh thực địa.",
    en: "The image or diagnosis is not reliable enough to identify a disease. The system will not suggest chemicals or treatment protocols until a clearer image or field verification is available.",
    ja: "画像または診断結果の信頼性が十分でないため、病害を確定できません。より鮮明な画像または現場確認があるまで、薬剤や治療プロトコルは提示しません。",
  },
  verifyOnly: { vi: "Chỉ hướng dẫn xác minh", en: "Verification only", ja: "確認のみ" },
  retakePhoto: { vi: "Chụp lại ảnh rõ vùng bệnh, đủ sáng, nền gọn và lấy thêm 2-3 góc khác nhau.", en: "Retake a clear, well-lit photo of the affected area with a clean background and 2-3 extra angles.", ja: "病斑部を明るく背景を整理して撮り直し、さらに2〜3方向から撮影してください。" },
  fieldCheck: { vi: "Đối chiếu triệu chứng trên nhiều lá/thân/quả trước khi quyết định xử lý.", en: "Compare symptoms across several leaves, stems, or fruit before deciding treatment.", ja: "処理を決める前に、複数の葉・茎・果実で症状を照合してください。" },
  noItems: { vi: "Chưa có dữ liệu chi tiết.", en: "No detailed data yet.", ja: "詳細データはまだありません。" },
  standaloneTitle: { vi: "Trung tâm khuyến nghị", en: "Recommendation center", ja: "推奨センター" },
  standaloneSubtitle: {
    vi: "Trang này vẫn có chức năng riêng: xem thư viện phác đồ mẫu, chạy mô hình phân tích mô phỏng và hỏi AI theo từng hồ sơ bệnh.",
    en: "This page has its own tools: browse protocol templates, run the live analysis model, and ask AI about each disease profile.",
    ja: "このページ単体でも、プロトコルテンプレート閲覧、ライブ分析モデル、病害プロファイル別AI相談が使えます。",
  },
  profileLibrary: { vi: "Thư viện phác đồ", en: "Protocol library", ja: "プロトコルライブラリ" },
  chooseProfile: { vi: "Chọn hồ sơ bệnh", en: "Choose disease profile", ja: "病害プロファイルを選択" },
  openDiagnosisFlow: { vi: "Chẩn đoán ảnh bệnh", en: "Diagnose disease image", ja: "病害画像を診断" },
  askProfileAI: { vi: "Hỏi AI về hồ sơ này", en: "Ask AI about this profile", ja: "このプロファイルをAIに相談" },
  standaloneBadge: { vi: "Trung tâm khuyến nghị", en: "Recommendation center", ja: "推奨センター" },
  chatUser: { vi: "Bạn", en: "You", ja: "あなた" },
  chatAI: { vi: "AI", en: "AI", ja: "AI" },
  profileQuestion: {
    vi: "Tóm tắt phác đồ mẫu và các điểm cần xác minh ngoài thực địa.",
    en: "Summarize the template protocol and field checks needed.",
    ja: "テンプレートプロトコルと現場確認ポイントを要約してください。",
  },
  growthVisualTitle: { vi: "Sinh trưởng phục hồi", en: "Recovery growth", ja: "回復成長" },
  growthVisualSubtitle: { vi: "Hạt giống → cây khỏe", en: "Seed → healthy plant", ja: "種 → 健康な株" },
  growthSeed: { vi: "Nảy mầm", en: "Sprout", ja: "発芽" },
  growthStem: { vi: "Vươn thân", en: "Stem rise", ja: "茎伸長" },
  growthHealthy: { vi: "Khỏe mạnh", en: "Healthy", ja: "健全" },
};

const dictionary: Record<string, LocalizedDictionary[string]> = {
  "Cà chua": { vi: "Cà chua", en: "Tomato", ja: "トマト" },
  "Lúa": { vi: "Lúa", en: "Rice", ja: "イネ" },
  "Ớt": { vi: "Ớt", en: "Chili pepper", ja: "トウガラシ" },
  "Dưa leo": { vi: "Dưa leo", en: "Cucumber", ja: "キュウリ" },
  "Bưởi": { vi: "Bưởi", en: "Pomelo", ja: "ザボン" },
  "Cam": { vi: "Cam", en: "Orange", ja: "オレンジ" },
  "Cà phê": { vi: "Cà phê", en: "Coffee", ja: "コーヒー" },
  "Xoài": { vi: "Xoài", en: "Mango", ja: "マンゴー" },
  "Thanh long": { vi: "Thanh long", en: "Dragon fruit", ja: "ドラゴンフルーツ" },
  "Nhẹ": { vi: "Nhẹ", en: "Mild", ja: "軽度" },
  "Trung bình": { vi: "Trung bình", en: "Moderate", ja: "中程度" },
  "Nặng": { vi: "Nặng", en: "Severe", ja: "重度" },
  "Cao": { vi: "Cao", en: "High", ja: "高" },
  "Rất cao": { vi: "Rất cao", en: "Very high", ja: "非常に高い" },
  "Vi khuẩn": { vi: "Vi khuẩn", en: "Bacteria", ja: "細菌" },
  "Nấm": { vi: "Nấm", en: "Fungus", ja: "菌類" },
  "Không phát hiện": { vi: "Không phát hiện", en: "Not detected", ja: "未検出" },
  "Chưa rõ": { vi: "Chưa rõ", en: "Unknown", ja: "不明" },
  "Trung bình đến cao": { vi: "Trung bình đến cao", en: "Moderate to high", ja: "中〜高" },
  "Đốm dầu trên bưởi": { vi: "Đốm dầu trên bưởi", en: "Oil spot on pomelo", ja: "ザボンの油斑病" },
  "Đạo ôn lá": { vi: "Đạo ôn lá", en: "Rice blast", ja: "いもち病" },
  "Rỉ sắt cà phê": { vi: "Rỉ sắt cà phê", en: "Coffee leaf rust", ja: "コーヒーさび病" },
  "Vàng lá gân xanh": { vi: "Vàng lá gân xanh", en: "Citrus greening", ja: "柑橘グリーニング病" },
  "Thối rễ do nấm": { vi: "Thối rễ do nấm", en: "Fungal root rot", ja: "菌性根腐れ" },
  "Héo xanh vi khuẩn": { vi: "Héo xanh vi khuẩn", en: "Bacterial wilt", ja: "青枯病" },
  "Sương mai dưa leo": { vi: "Sương mai dưa leo", en: "Cucumber downy mildew", ja: "キュウリべと病" },
  "Đốm nâu lá lúa": { vi: "Đốm nâu lá lúa", en: "Rice brown spot", ja: "イネごま葉枯病" },
  "Khô vằn": { vi: "Khô vằn", en: "Rice sheath blight", ja: "紋枯病" },
  "Sương mai sớm cà chua": { vi: "Sương mai sớm cà chua", en: "Tomato early blight", ja: "トマト早疫病" },
  "Đốm vi khuẩn trên cà chua": { vi: "Đốm vi khuẩn trên cà chua", en: "Tomato bacterial spot", ja: "トマト細菌斑点病" },
  "Thán thư ớt": { vi: "Thán thư ớt", en: "Chili anthracnose", ja: "トウガラシ炭疽病" },
  "Nhện đỏ hại ớt": { vi: "Nhện đỏ hại ớt", en: "Red mite on chili", ja: "トウガラシのハダニ被害" },
  "Thối gốc rễ dưa leo": { vi: "Thối gốc rễ dưa leo", en: "Cucumber crown and root rot", ja: "キュウリ株元根腐れ" },
  "Khảm lá dưa leo": { vi: "Khảm lá dưa leo", en: "Cucumber mosaic", ja: "キュウリモザイク病" },
  "Mốc trắng cành thanh long": { vi: "Mốc trắng cành thanh long", en: "White mold on dragon fruit branches", ja: "ドラゴンフルーツ枝白かび" },
  "Đốm nâu thối cành thanh long": { vi: "Đốm nâu thối cành thanh long", en: "Brown spot and branch rot on dragon fruit", ja: "ドラゴンフルーツ褐斑枝腐れ" },
  "Thán thư xoài": { vi: "Thán thư xoài", en: "Mango anthracnose", ja: "マンゴー炭疽病" },
  "Xì mủ thân cành": { vi: "Xì mủ thân cành", en: "Stem and branch gummosis", ja: "幹枝ガム病" },
  "Lá vàng": { vi: "Lá vàng", en: "Yellow leaves", ja: "葉の黄化" },
  "Đốm nâu": { vi: "Đốm nâu", en: "Brown spots", ja: "褐色斑点" },
  "Héo rũ": { vi: "Héo rũ", en: "Wilting", ja: "萎れ" },
  "Thối rễ": { vi: "Thối rễ", en: "Root rot", ja: "根腐れ" },
  "Rụng hoa": { vi: "Rụng hoa", en: "Flower drop", ja: "落花" },
  "Mã trái xấu": { vi: "Mã trái xấu", en: "Poor fruit appearance", ja: "果実外観不良" },
  "Đốm nâu trên vỏ": { vi: "Đốm nâu trên vỏ", en: "Brown spots on peel", ja: "果皮の褐色斑" },
  "Lá có chấm nâu nhỏ": { vi: "Lá có chấm nâu nhỏ", en: "Small brown spots on leaves", ja: "葉の小さな褐色斑" },
  "Trái có vết nhám sần màu nâu": { vi: "Trái có vết nhám sần màu nâu", en: "Fruit has rough brown scabby marks", ja: "果実に褐色のざらついた斑がある" },
  "Bông bị cháy nâu đen": { vi: "Bông bị cháy nâu đen", en: "Flower panicles turn dark brown to black", ja: "花房が黒褐色に枯れる" },
  "Trái có đốm đen lõm": { vi: "Trái có đốm đen lõm", en: "Fruit has sunken black spots", ja: "果実に陥没した黒斑がある" },
  "Lá có vết nâu cháy": { vi: "Lá có vết nâu cháy", en: "Leaves have brown blighted lesions", ja: "葉に褐色の枯れ斑がある" },
  "Thối thân": { vi: "Thối thân", en: "Stem rot", ja: "茎腐れ" },
  "Lá cuốn": { vi: "Lá cuốn", en: "Leaf rolling", ja: "葉巻き" },
  "Cháy mép lá": { vi: "Cháy mép lá", en: "Leaf edge burn", ja: "葉縁枯れ" },
  "Mốc trắng": { vi: "Mốc trắng", en: "White mold", ja: "白かび" },
  "Bệnh thường xuất hiện ở vùng rễ khi đất ẩm kéo dài, làm cây suy yếu nhanh và dễ chết rũ từng cụm.": {
    vi: "Bệnh thường xuất hiện ở vùng rễ khi đất ẩm kéo dài, làm cây suy yếu nhanh và dễ chết rũ từng cụm.",
    en: "This disease usually starts around the roots when soil stays wet for too long, weakening plants quickly and causing patchy wilt.",
    ja: "土壌の過湿が続くと根域で発生しやすく、株を急速に弱らせ、まとまって萎れやすくなります。",
  },
  "Lá vàng từ gốc lên, cây héo ban ngày, rễ nâu đen và có mùi thối.": {
    vi: "Lá vàng từ gốc lên, cây héo ban ngày, rễ nâu đen và có mùi thối.",
    en: "Leaves yellow from the base upward, plants wilt during the day, and roots turn dark brown with a rotten smell.",
    ja: "下葉から黄化し、日中に萎れ、根は黒褐色になり腐敗臭が出ます。",
  },
  "Bệnh phổ biến trên lúa trong điều kiện ẩm cao, có thể làm cháy lá và ảnh hưởng mạnh đến năng suất.": {
    vi: "Bệnh phổ biến trên lúa trong điều kiện ẩm cao, có thể làm cháy lá và ảnh hưởng mạnh đến năng suất.",
    en: "A common rice disease under high humidity that can scorch leaves and significantly reduce yield.",
    ja: "高湿度条件で発生しやすいイネの一般的な病害で、葉枯れを起こし収量に大きく影響します。",
  },
  "Vết bệnh hình thoi, tâm xám trắng, rìa nâu, lá cháy từng mảng.": {
    vi: "Vết bệnh hình thoi, tâm xám trắng, rìa nâu, lá cháy từng mảng.",
    en: "Diamond-shaped lesions with gray-white centers and brown margins; leaves may scorch in patches.",
    ja: "紡錘形の病斑で中心は灰白色、縁は褐色となり、葉が部分的に枯れます。",
  },
  "Bệnh làm cây héo đột ngột dù lá còn xanh, rất khó hồi phục nếu phát hiện muộn.": {
    vi: "Bệnh làm cây héo đột ngột dù lá còn xanh, rất khó hồi phục nếu phát hiện muộn.",
    en: "Plants wilt suddenly even while leaves remain green, and recovery is difficult if detected late.",
    ja: "葉がまだ緑のまま突然萎れ、発見が遅れると回復が難しくなります。",
  },
  "Cây héo nhanh, cắt thân thấy mạch nâu, có dịch vi khuẩn trắng đục.": {
    vi: "Cây héo nhanh, cắt thân thấy mạch nâu, có dịch vi khuẩn trắng đục.",
    en: "Plants wilt rapidly; cut stems show brown vascular tissue and cloudy bacterial ooze.",
    ja: "急速に萎れ、茎を切ると維管束が褐変し、白濁した細菌液が見られます。",
  },
  "Bệnh phát triển nhanh khi ẩm cao, làm lá vàng loang và giảm quang hợp mạnh.": {
    vi: "Bệnh phát triển nhanh khi ẩm cao, làm lá vàng loang và giảm quang hợp mạnh.",
    en: "The disease spreads quickly in high humidity, causing yellow patches and a major drop in photosynthesis.",
    ja: "高湿度で急速に進展し、葉に黄斑を作り光合成を大きく低下させます。",
  },
  "Mặt lá có đốm vàng góc cạnh, mặt dưới có lớp mốc xám tím.": {
    vi: "Mặt lá có đốm vàng góc cạnh, mặt dưới có lớp mốc xám tím.",
    en: "Angular yellow spots appear on the upper leaf surface, with gray-purple mold underneath.",
    ja: "葉表に角ばった黄色斑が出て、葉裏に灰紫色のかびが見られます。",
  },
  "Bệnh làm lá xuất hiện nhiều chấm nâu, ảnh hưởng quang hợp khi ruộng thiếu dinh dưỡng hoặc thời tiết thất thường.": {
    vi: "Bệnh làm lá xuất hiện nhiều chấm nâu, ảnh hưởng quang hợp khi ruộng thiếu dinh dưỡng hoặc thời tiết thất thường.",
    en: "Many brown spots develop on leaves, reducing photosynthesis especially in nutrient-stressed fields or unstable weather.",
    ja: "葉に多数の褐色斑が出て、栄養不足や不安定な天候下で光合成を低下させます。",
  },
  "Lá có nhiều đốm tròn nâu, tâm xám, viền nâu đậm.": {
    vi: "Lá có nhiều đốm tròn nâu, tâm xám, viền nâu đậm.",
    en: "Leaves show many round brown spots with gray centers and dark brown margins.",
    ja: "葉に灰色中心と濃褐色縁を持つ丸い褐色斑が多数出ます。",
  },
  "Bệnh tạo vết loang dạng vằn trên bẹ lá, thường bùng mạnh ở ruộng dày và ẩm nóng.": {
    vi: "Bệnh tạo vết loang dạng vằn trên bẹ lá, thường bùng mạnh ở ruộng dày và ẩm nóng.",
    en: "Blotchy banded lesions form on leaf sheaths, often flaring in dense, hot, humid fields.",
    ja: "葉鞘にしま状の病斑を作り、密植で高温多湿の圃場で多発します。",
  },
  "Bẹ lá có vết loang màu lục xám rồi nâu, dạng vằn da hổ, lá úa dần từ gốc.": {
    vi: "Bẹ lá có vết loang màu lục xám rồi nâu, dạng vằn da hổ, lá úa dần từ gốc.",
    en: "Leaf sheaths develop gray-green to brown tiger-stripe lesions, and leaves yellow upward from the base.",
    ja: "葉鞘に灰緑色から褐色の虎斑状病斑が出て、株元から葉が黄化します。",
  },
  "Bệnh xuất hiện trên lá già trước, tạo vết nâu đồng tâm và làm cây rụng lá nhanh khi ẩm cao.": {
    vi: "Bệnh xuất hiện trên lá già trước, tạo vết nâu đồng tâm và làm cây rụng lá nhanh khi ẩm cao.",
    en: "It appears first on older leaves, forming concentric brown spots and causing rapid leaf drop in humid conditions.",
    ja: "古葉から発生し、同心円状の褐色斑を作り、高湿度では急速な落葉を招きます。",
  },
  "Lá có đốm nâu tròn với vòng đồng tâm rõ, mép lá cháy và lá vàng rụng dần.": {
    vi: "Lá có đốm nâu tròn với vòng đồng tâm rõ, mép lá cháy và lá vàng rụng dần.",
    en: "Leaves show round brown spots with clear concentric rings, scorched edges, yellowing, and gradual drop.",
    ja: "葉に同心円状の丸い褐色斑が出て、葉縁が枯れ、黄化して落葉します。",
  },
  "Tạo các chấm nâu đen nhỏ trên lá và trái, dễ lây lan khi mưa hoặc tưới văng bắn.": {
    vi: "Tạo các chấm nâu đen nhỏ trên lá và trái, dễ lây lan khi mưa hoặc tưới văng bắn.",
    en: "Small dark brown spots form on leaves and fruit and spread easily through rain splash or overhead irrigation.",
    ja: "葉や果実に小さな黒褐色斑ができ、雨や散水の跳ね返りで広がりやすくなります。",
  },
  "Lá có nhiều chấm nâu nhỏ, quanh vết có quầng vàng, trái có chấm đen sần.": {
    vi: "Lá có nhiều chấm nâu nhỏ, quanh vết có quầng vàng, trái có chấm đen sần.",
    en: "Leaves have many small brown spots with yellow halos; fruit shows rough black specks.",
    ja: "葉に黄色い縁を伴う小さな褐色斑が多数出て、果実にはざらついた黒点ができます。",
  },
  "Bệnh gây thối lõm trên quả và có thể lan nhanh trong điều kiện mưa ẩm.": {
    vi: "Bệnh gây thối lõm trên quả và có thể lan nhanh trong điều kiện mưa ẩm.",
    en: "It causes sunken fruit rot and can spread quickly in wet, rainy conditions.",
    ja: "果実に陥没した腐敗を起こし、雨や湿潤条件で急速に広がります。",
  },
  "Quả có vết thối lõm tròn, màu nâu đen, có vòng đồng tâm.": {
    vi: "Quả có vết thối lõm tròn, màu nâu đen, có vòng đồng tâm.",
    en: "Fruit has round sunken dark-brown lesions with concentric rings.",
    ja: "果実に丸く陥没した黒褐色病斑ができ、同心円状になります。",
  },
  "Nhện đỏ chích hút làm lá xoăn, vàng và cây suy nhanh trong thời tiết khô nóng.": {
    vi: "Nhện đỏ chích hút làm lá xoăn, vàng và cây suy nhanh trong thời tiết khô nóng.",
    en: "Red mites feed on leaves, causing curling, yellowing, and rapid decline in hot, dry weather.",
    ja: "ハダニの吸汁により葉が巻き、黄化し、高温乾燥時に株が急速に弱ります。",
  },
  "Lá vàng, cong xoăn, mặt dưới lá có chấm li ti và tơ mỏng.": {
    vi: "Lá vàng, cong xoăn, mặt dưới lá có chấm li ti và tơ mỏng.",
    en: "Leaves yellow and curl; tiny specks and fine webbing appear underneath.",
    ja: "葉が黄化して巻き、葉裏に小さな点や細い糸が見られます。",
  },
  "Cây sinh trưởng chậm, gốc thâm nâu và rễ tơ bị hư trong điều kiện ẩm kéo dài.": {
    vi: "Cây sinh trưởng chậm, gốc thâm nâu và rễ tơ bị hư trong điều kiện ẩm kéo dài.",
    en: "Plants grow slowly, crowns darken, and fine roots are damaged under prolonged wetness.",
    ja: "過湿が続くと生育が遅れ、株元が褐変し、細根が傷みます。",
  },
  "Gốc thân thâm nâu, cây héo buổi trưa, rễ ít và dễ đứt.": {
    vi: "Gốc thân thâm nâu, cây héo buổi trưa, rễ ít và dễ đứt.",
    en: "The stem base turns dark brown, plants wilt at midday, and roots become sparse and brittle.",
    ja: "株元が暗褐色になり、昼に萎れ、根量が少なく切れやすくなります。",
  },
  "Lá bị loang xanh vàng, biến dạng và cây phát triển kém do virus gây ra.": {
    vi: "Lá bị loang xanh vàng, biến dạng và cây phát triển kém do virus gây ra.",
    en: "Virus infection causes green-yellow mottling, leaf distortion, and poor growth.",
    ja: "ウイルスにより葉が緑黄色のまだらになり、変形し、生育が悪くなります。",
  },
  "Lá loang xanh vàng, nhăn, biến dạng và trái phát triển lệch.": {
    vi: "Lá loang xanh vàng, nhăn, biến dạng và trái phát triển lệch.",
    en: "Leaves show green-yellow mottling, wrinkling, distortion, and uneven fruit development.",
    ja: "葉が緑黄色にまだらとなり、しわや変形が出て、果実の発育が偏ります。",
  },
  "Bệnh xuất hiện thành từng mảng tơ nấm trắng trên cành non hoặc vết thương, gặp nhiều khi vườn ẩm và bí tán.": {
    vi: "Bệnh xuất hiện thành từng mảng tơ nấm trắng trên cành non hoặc vết thương, gặp nhiều khi vườn ẩm và bí tán.",
    en: "White fungal mycelium appears on young branches or wounds, especially in humid, poorly ventilated orchards.",
    ja: "若い枝や傷口に白い菌糸が現れ、湿度が高く通気の悪い園で多発します。",
  },
  "Cành có lớp mốc trắng như bông, mô bị mềm nhũn tại điểm nhiễm và dễ lan rộng sau mưa đêm.": {
    vi: "Cành có lớp mốc trắng như bông, mô bị mềm nhũn tại điểm nhiễm và dễ lan rộng sau mưa đêm.",
    en: "Branches develop cottony white mold, infected tissue softens, and spread is common after rainy nights.",
    ja: "枝に綿状の白かびが出て、感染部が軟化し、夜間の雨後に広がりやすくなります。",
  },
  "Bệnh gây đốm nâu lõm trên cành, sau đó lan rộng làm mô bị thối và khô cành nếu xử lý chậm.": {
    vi: "Bệnh gây đốm nâu lõm trên cành, sau đó lan rộng làm mô bị thối và khô cành nếu xử lý chậm.",
    en: "Sunken brown spots develop on branches, then expand into rot and branch dieback if treatment is delayed.",
    ja: "枝に陥没した褐色斑ができ、対応が遅れると腐敗や枝枯れへ広がります。",
  },
  "Cành có vết nâu lõm, mô bị sần rồi thối khô dần, vết bệnh lan dọc theo thân cành.": {
    vi: "Cành có vết nâu lõm, mô bị sần rồi thối khô dần, vết bệnh lan dọc theo thân cành.",
    en: "Branches show sunken brown lesions; tissue roughens, dries, rots, and lesions spread along the branch.",
    ja: "枝に陥没した褐色病斑が出て、組織が粗くなり乾腐し、枝に沿って広がります。",
  },
  "Bệnh làm lá và trái có nhiều đốm nâu sần, ảnh hưởng mã trái và chất lượng thương phẩm.": {
    vi: "Bệnh làm lá và trái có nhiều đốm nâu sần, ảnh hưởng mã trái và chất lượng thương phẩm.",
    en: "Leaves and fruit develop many rough brown spots, reducing fruit appearance and market quality.",
    ja: "葉や果実にざらついた褐色斑が多く発生し、果実外観と商品品質を低下させます。",
  },
  "Bệnh gây cháy bông, đốm lá và thối đen trên trái, đặc biệt nặng trong mùa mưa ẩm.": {
    vi: "Bệnh gây cháy bông, đốm lá và thối đen trên trái, đặc biệt nặng trong mùa mưa ẩm.",
    en: "The disease causes flower blight, leaf spots, and black fruit rot, especially during wet rainy periods.",
    ja: "花房枯れ、葉斑、果実の黒腐れを起こし、湿った雨季に特に重くなります。",
  },
  "Lá, chồi hoặc trái có đốm nâu đen lõm, dễ lan trong thời tiết ẩm.": {
    vi: "Lá, chồi hoặc trái có đốm nâu đen lõm, dễ lan trong thời tiết ẩm.",
    en: "Leaves, shoots, or fruit show sunken dark-brown spots that spread easily in humid weather.",
    ja: "葉、芽、果実に陥没した黒褐色斑が出て、湿潤時に広がりやすくなります。",
  },
  "Trái có thể bị thối đen sau thu hoạch hoặc khi mưa kéo dài.": {
    vi: "Trái có thể bị thối đen sau thu hoạch hoặc khi mưa kéo dài.",
    en: "Fruit may develop black rot after harvest or during prolonged rain.",
    ja: "収穫後や長雨の時期に果実が黒く腐ることがあります。",
  },
  "Tỉa bỏ cành, lá, trái bệnh nặng và thu gom khỏi vườn.": {
    vi: "Tỉa bỏ cành, lá, trái bệnh nặng và thu gom khỏi vườn.",
    en: "Prune heavily diseased branches, leaves, and fruit and remove them from the orchard.",
    ja: "重症の枝、葉、果実を剪除し、園外へ持ち出します。",
  },
  "Tạo tán thông thoáng, hạn chế nước đọng trên lá và trái.": {
    vi: "Tạo tán thông thoáng, hạn chế nước đọng trên lá và trái.",
    en: "Open the canopy and reduce water staying on leaves and fruit.",
    ja: "樹冠の通気を良くし、葉や果実に水が残らないようにします。",
  },
  "Phun thuốc trừ nấm đúng nhãn khi bệnh lan hoặc thời tiết ẩm kéo dài.": {
    vi: "Phun thuốc trừ nấm đúng nhãn khi bệnh lan hoặc thời tiết ẩm kéo dài.",
    en: "Apply fungicide according to the label when disease spreads or humid weather persists.",
    ja: "病害が広がる時や湿潤が続く時は、ラベル通りに殺菌剤を散布します。",
  },
  "Ngừng tưới mạnh": { vi: "Ngừng tưới mạnh", en: "Stop heavy watering", ja: "強い灌水を止める" },
  "Giảm nước tưới": { vi: "Giảm nước tưới", en: "Reduce irrigation", ja: "灌水量を減らす" },
  "Kiểm tra gốc": { vi: "Kiểm tra gốc", en: "Check the crown/root base", ja: "株元を確認" },
  "Thoát nước nhanh": { vi: "Thoát nước nhanh", en: "Drain water quickly", ja: "速やかに排水" },
  "Tưới xử lý vùng gốc": { vi: "Tưới xử lý vùng gốc", en: "Treat the root zone by drenching", ja: "株元を灌注処理" },
  "Bổ sung vi sinh": { vi: "Bổ sung vi sinh", en: "Add beneficial microbes", ja: "有用微生物を補う" },
  "Loại bỏ cây hỏng nặng": { vi: "Loại bỏ cây hỏng nặng", en: "Remove severely damaged plants", ja: "重症株を除去" },
  "Theo dõi cây cạnh bên": { vi: "Theo dõi cây cạnh bên", en: "Monitor neighboring plants", ja: "隣接株を観察" },
  "Điều chỉnh lịch tưới": { vi: "Điều chỉnh lịch tưới", en: "Adjust irrigation schedule", ja: "灌水スケジュールを調整" },
  "Giữ giá thể thông thoáng": { vi: "Giữ giá thể thông thoáng", en: "Keep the substrate airy", ja: "培地の通気性を保つ" },
  "Giảm lượng nước mỗi lần tưới.": { vi: "Giảm lượng nước mỗi lần tưới.", en: "Reduce the amount of water per irrigation.", ja: "1回あたりの灌水量を減らします。" },
  "Xử lý gốc bằng thuốc phù hợp.": { vi: "Xử lý gốc bằng thuốc phù hợp.", en: "Treat the crown/root zone with a suitable product.", ja: "適切な薬剤で株元を処理します。" },
  "Bổ sung hữu cơ hoai mục và vi sinh.": { vi: "Bổ sung hữu cơ hoai mục và vi sinh.", en: "Add well-composted organic matter and beneficial microbes.", ja: "完熟有機物と有用微生物を補います。" },
  "Tách cây bệnh nặng": { vi: "Tách cây bệnh nặng", en: "Separate severely diseased plants", ja: "重症株を分ける" },
  "Mở rãnh thoát nước": { vi: "Mở rãnh thoát nước", en: "Open drainage channels", ja: "排水溝を開ける" },
  "Tưới gốc bằng thuốc phù hợp": { vi: "Tưới gốc bằng thuốc phù hợp", en: "Drench roots with a suitable product", ja: "適切な薬剤で株元処理" },
  "Khử khuẩn dụng cụ": { vi: "Khử khuẩn dụng cụ", en: "Disinfect tools", ja: "道具を消毒" },
  "Bổ sung giá thể thoáng khí": { vi: "Bổ sung giá thể thoáng khí", en: "Add airy growing medium", ja: "通気性のある培地を補う" },
  "Theo dõi cây lân cận 3 ngày": { vi: "Theo dõi cây lân cận 3 ngày", en: "Monitor nearby plants for 3 days", ja: "周辺株を3日観察" },
  "Giảm mật độ ẩm vùng gốc": { vi: "Giảm mật độ ẩm vùng gốc", en: "Reduce moisture around roots", ja: "根域の湿度を下げる" },
  "Điều chỉnh lịch tưới cố định": { vi: "Điều chỉnh lịch tưới cố định", en: "Adjust the fixed irrigation schedule", ja: "定期灌水を調整" },
  "Khoanh ổ bệnh": { vi: "Khoanh ổ bệnh", en: "Mark the infection area", ja: "発病箇所を区分" },
  "Ngưng đạm": { vi: "Ngưng đạm", en: "Pause nitrogen", ja: "窒素施用を止める" },
  "Giữ mực nước ổn định": { vi: "Giữ mực nước ổn định", en: "Keep water level stable", ja: "水位を安定させる" },
  "Phun thuốc đúng liều": { vi: "Phun thuốc đúng liều", en: "Spray at the correct dose", ja: "適量で散布" },
  "Ghi nhận vùng nặng": { vi: "Ghi nhận vùng nặng", en: "Record severe zones", ja: "重症区域を記録" },
  "So sánh lá mới nhiễm": { vi: "So sánh lá mới nhiễm", en: "Compare newly infected leaves", ja: "新規感染葉を比較" },
  "Tái kiểm tra sau 5-7 ngày": { vi: "Tái kiểm tra sau 5-7 ngày", en: "Recheck after 5-7 days", ja: "5〜7日後に再確認" },
  "Điều chỉnh dinh dưỡng": { vi: "Điều chỉnh dinh dưỡng", en: "Adjust nutrition", ja: "栄養を調整" },
  "Theo dõi cổ bông khi gần trổ": { vi: "Theo dõi cổ bông khi gần trổ", en: "Monitor panicle neck near heading", ja: "出穂期の穂首を観察" },
  "Nhổ cây bệnh": { vi: "Nhổ cây bệnh", en: "Remove diseased plants", ja: "病株を抜き取る" },
  "Ngăn dòng nước lây bệnh": { vi: "Ngăn dòng nước lây bệnh", en: "Block contaminated water flow", ja: "伝染水流を遮断" },
  "Kiểm tra thêm cây cạnh bên": { vi: "Kiểm tra thêm cây cạnh bên", en: "Check neighboring plants", ja: "隣接株を確認" },
  "Xử lý cục bộ vùng gốc": { vi: "Xử lý cục bộ vùng gốc", en: "Treat the root zone locally", ja: "株元を局所処理" },
  "Giảm ẩm đất": { vi: "Giảm ẩm đất", en: "Reduce soil moisture", ja: "土壌水分を下げる" },
  "Xem lại luân canh": { vi: "Xem lại luân canh", en: "Review crop rotation", ja: "輪作を見直す" },
  "Bổ sung vi sinh đất": { vi: "Bổ sung vi sinh đất", en: "Add beneficial soil microbes", ja: "土壌微生物を補う" },
  "Theo dõi cây mới héo": { vi: "Theo dõi cây mới héo", en: "Watch for new wilting plants", ja: "新たな萎れを観察" },
  "Tỉa lá nặng": { vi: "Tỉa lá nặng", en: "Prune heavily affected leaves", ja: "重症葉を除去" },
  "Giảm ẩm lá": { vi: "Giảm ẩm lá", en: "Reduce leaf moisture", ja: "葉面湿度を下げる" },
  "Mở thông gió": { vi: "Mở thông gió", en: "Improve ventilation", ja: "換気を改善" },
  "Phun xử lý nếu bệnh lan": { vi: "Phun xử lý nếu bệnh lan", en: "Spray if disease spreads", ja: "拡大時に散布" },
  "Kiểm tra mặt dưới lá": { vi: "Kiểm tra mặt dưới lá", en: "Check leaf undersides", ja: "葉裏を確認" },
  "Theo dõi đốm mới": { vi: "Theo dõi đốm mới", en: "Monitor new spots", ja: "新しい斑点を観察" },
  "Duy trì tưới sáng": { vi: "Duy trì tưới sáng", en: "Keep morning irrigation", ja: "朝灌水を維持" },
  "Giãn tán lá": { vi: "Giãn tán lá", en: "Open the canopy", ja: "葉群を広げる" },
  "Kiểm tra lô kế bên": { vi: "Kiểm tra lô kế bên", en: "Check adjacent plots", ja: "隣接区画を確認" },
  "Kiểm tra dinh dưỡng": { vi: "Kiểm tra dinh dưỡng", en: "Check nutrition", ja: "栄養状態を確認" },
  "Đánh giá mật độ đốm": { vi: "Đánh giá mật độ đốm", en: "Assess spot density", ja: "斑点密度を評価" },
  "Khoanh vùng nặng": { vi: "Khoanh vùng nặng", en: "Mark severe areas", ja: "重症区域を区分" },
  "Phun xử lý nếu cần": { vi: "Phun xử lý nếu cần", en: "Spray if needed", ja: "必要時に散布" },
  "Giảm áp lực ẩm lá": { vi: "Giảm áp lực ẩm lá", en: "Reduce leaf wetness pressure", ja: "葉の濡れを減らす" },
  "Ghi nhận phản ứng ruộng": { vi: "Ghi nhận phản ứng ruộng", en: "Record field response", ja: "圃場反応を記録" },
  "Theo dõi lá mới": { vi: "Theo dõi lá mới", en: "Monitor new leaves", ja: "新葉を観察" },
  "Cân đối lại phân": { vi: "Cân đối lại phân", en: "Rebalance fertilizer", ja: "施肥を再調整" },
  "So sánh vùng đã xử lý": { vi: "So sánh vùng đã xử lý", en: "Compare treated areas", ja: "処理済み区域を比較" },
  "Vệ sinh vườn": { vi: "Vệ sinh vườn", en: "Clean the orchard", ja: "園地を清掃" },
  "Tỉa cành": { vi: "Tỉa cành", en: "Prune branches", ja: "剪定" },
  "Giảm ẩm tán": { vi: "Giảm ẩm tán", en: "Reduce canopy humidity", ja: "樹冠湿度を下げる" },
  "Phun phòng trị": { vi: "Phun phòng trị", en: "Apply preventive/control spray", ja: "予防・防除散布" },
  "Đánh giá trái non": { vi: "Đánh giá trái non", en: "Assess young fruit", ja: "幼果を評価" },
  "Lặp lại sau mưa": { vi: "Lặp lại sau mưa", en: "Repeat after rain", ja: "雨後に再処理" },
  "Duy trì thông thoáng": { vi: "Duy trì thông thoáng", en: "Maintain airflow", ja: "通気を維持" },
  "Kiểm tra mã trái": { vi: "Kiểm tra mã trái", en: "Check fruit appearance", ja: "果実外観を確認" },
  "Tỉa bỏ ổ bệnh": { vi: "Tỉa bỏ ổ bệnh", en: "Prune disease foci", ja: "病斑部を剪除" },
  "Vệ sinh trái rụng": { vi: "Vệ sinh trái rụng", en: "Clean fallen fruit", ja: "落果を清掃" },
  "Mở thông tán": { vi: "Mở thông tán", en: "Open the canopy", ja: "樹冠を開く" },
  "Theo dõi bông và trái non": { vi: "Theo dõi bông và trái non", en: "Monitor flowers and young fruit", ja: "花房と幼果を観察" },
  "Duy trì tán thoáng": { vi: "Duy trì tán thoáng", en: "Keep the canopy airy", ja: "樹冠の通気を維持" },
  "Tỉa cành cho tán thông thoáng.": { vi: "Tỉa cành cho tán thông thoáng.", en: "Prune branches to keep the canopy airy.", ja: "樹冠の通気を良くするため剪定します。" },
  "Thu gom lá cành bệnh rụng dưới gốc.": { vi: "Thu gom lá cành bệnh rụng dưới gốc.", en: "Collect diseased fallen leaves and branches under the tree.", ja: "樹下に落ちた病葉や枝を回収します。" },
  "Phun thuốc phòng trị vào giai đoạn lá non và trái non.": { vi: "Phun thuốc phòng trị vào giai đoạn lá non và trái non.", en: "Apply preventive/control spray during young leaf and young fruit stages.", ja: "若葉・幼果期に予防防除散布を行います。" },
  "Theo dõi lại sau các đợt mưa lớn.": { vi: "Theo dõi lại sau các đợt mưa lớn.", en: "Recheck after heavy rain events.", ja: "大雨の後に再確認します。" },
  "Tỉa bỏ chùm bông hoặc cành bệnh nặng.": { vi: "Tỉa bỏ chùm bông hoặc cành bệnh nặng.", en: "Prune heavily diseased flower clusters or branches.", ja: "重症の花房や枝を剪除します。" },
  "Phun thuốc phòng trị vào giai đoạn trổ bông và đậu trái non.": { vi: "Phun thuốc phòng trị vào giai đoạn trổ bông và đậu trái non.", en: "Apply preventive/control spray during flowering and young fruit set.", ja: "開花期と幼果着果期に予防防除散布を行います。" },
  "Vệ sinh tán cây và thu gom trái bệnh.": { vi: "Vệ sinh tán cây và thu gom trái bệnh.", en: "Clean the canopy and collect diseased fruit.", ja: "樹冠を清掃し、病果を回収します。" },
  "Theo dõi lại sau mưa.": { vi: "Theo dõi lại sau mưa.", en: "Recheck after rain.", ja: "雨後に再確認します。" },
};

const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .replace(/[^a-zA-Z0-9]/g, "")
    .toLowerCase();

const AnimatedPlantGrowth = ({ title, subtitle, stages }: { title: string; subtitle: string; stages: string[] }) => (
  <div className="relative min-h-[260px] overflow-hidden rounded-[32px] border border-emerald-400/15 bg-[radial-gradient(circle_at_50%_22%,rgba(52,211,153,0.18),transparent_34%),linear-gradient(180deg,rgba(3,15,11,0.86),rgba(4,7,6,0.94))] p-5">
    <div className="relative z-10 flex items-start justify-between gap-4">
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-300">{title}</p>
        <p className="mt-2 text-sm font-bold text-white/64">{subtitle}</p>
      </div>
      <motion.div
        className="h-3 w-3 rounded-full bg-emerald-300 shadow-[0_0_24px_rgba(52,211,153,0.9)]"
        animate={{ scale: [1, 1.8, 1], opacity: [0.9, 0.35, 0.9] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
    </div>

    <div className="relative mx-auto mt-7 h-36 w-full max-w-[280px]">
      <motion.div
        className="absolute left-1/2 top-[92px] h-10 w-10 -translate-x-1/2 rounded-full bg-amber-700/80 shadow-[inset_0_-8px_14px_rgba(0,0,0,0.35)]"
        animate={{ scale: [1, 0.82, 0.72, 0.8], y: [0, 8, 14, 14], opacity: [1, 0.8, 0.35, 0] }}
        transition={{ duration: 5.8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-9 left-1/2 h-24 w-3 origin-bottom -translate-x-1/2 rounded-full bg-gradient-to-t from-emerald-700 to-emerald-300"
        initial={{ scaleY: 0.05 }}
        animate={{ scaleY: [0.05, 0.18, 0.72, 1, 1] }}
        transition={{ duration: 5.8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-[84px] left-1/2 h-12 w-20 origin-right -translate-x-[96%] rounded-[100%_0_100%_0] bg-gradient-to-br from-emerald-300 to-emerald-700"
        animate={{ scale: [0, 0, 0.72, 1, 1], rotate: [-18, -18, -32, -36, -36], opacity: [0, 0, 0.8, 1, 1] }}
        transition={{ duration: 5.8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-[95px] left-1/2 h-12 w-20 origin-left translate-x-[8%] rounded-[0_100%_0_100%] bg-gradient-to-bl from-lime-300 to-emerald-700"
        animate={{ scale: [0, 0, 0.65, 1, 1], rotate: [18, 18, 30, 34, 34], opacity: [0, 0, 0.8, 1, 1] }}
        transition={{ duration: 5.8, repeat: Infinity, ease: "easeInOut", delay: 0.1 }}
      />
      <motion.div
        className="absolute bottom-[126px] left-1/2 h-10 w-14 origin-bottom -translate-x-1/2 rounded-[80%_80%_40%_40%] bg-gradient-to-t from-emerald-500 to-lime-200"
        animate={{ scale: [0, 0, 0.2, 0.9, 1], opacity: [0, 0, 0.35, 0.95, 1] }}
        transition={{ duration: 5.8, repeat: Infinity, ease: "easeInOut", delay: 0.15 }}
      />
      <motion.div
        className="absolute bottom-6 left-1/2 h-5 w-64 -translate-x-1/2 rounded-full bg-gradient-to-r from-transparent via-emerald-950 to-transparent"
        animate={{ opacity: [0.45, 0.75, 0.55, 0.75, 0.45] }}
        transition={{ duration: 5.8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-5 left-1/2 h-28 w-28 -translate-x-1/2 rounded-full border border-emerald-300/25"
        animate={{ scale: [0.65, 0.7, 1.18, 1.38, 0.65], opacity: [0, 0.2, 0.45, 0, 0] }}
        transition={{ duration: 5.8, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>

    <div className="relative z-10 mt-3 grid grid-cols-3 gap-2">
      {stages.map((stage, index) => (
        <motion.div
          key={stage}
          className="rounded-2xl border border-white/8 bg-black/25 px-3 py-2 text-center text-[10px] font-black uppercase tracking-[0.14em] text-white/54"
          animate={{ borderColor: ["rgba(255,255,255,0.08)", "rgba(52,211,153,0.42)", "rgba(255,255,255,0.08)"], color: ["rgba(255,255,255,0.54)", "rgba(167,243,208,1)", "rgba(255,255,255,0.54)"] }}
          transition={{ duration: 5.8, repeat: Infinity, delay: index * 1.1 }}
        >
          {stage}
        </motion.div>
      ))}
    </div>
  </div>
);

const ProtocolMediaShowcase = () => (
  <div className="overflow-hidden rounded-[36px] border border-emerald-500/16 bg-[linear-gradient(135deg,rgba(5,16,13,0.98),rgba(8,10,12,0.98))] p-6">
    <div className="grid gap-4 md:grid-cols-[1.12fr_0.88fr]">
      <motion.figure
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="group relative min-h-[260px] overflow-hidden rounded-[28px] border border-white/8 bg-black/35"
      >
        <img
          src={protocolImage}
          alt="Ảnh minh họa trang"
          className="h-full min-h-[260px] w-full object-cover transition duration-700 group-hover:scale-105"
        />
      </motion.figure>

      <motion.figure
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.12 }}
        className="group relative min-h-[260px] overflow-hidden rounded-[28px] border border-white/8 bg-black/35"
      >
        <video
          src={protocolVideo}
          className="h-full min-h-[260px] w-full object-cover transition duration-700 group-hover:scale-105"
          autoPlay
          muted
          loop
          playsInline
          aria-label="Video minh họa trang"
        />
      </motion.figure>
    </div>
  </div>
);

const severityToProtocol = (severity?: string): TreatmentProtocol["severity"] => {
  const normalized = normalize(severity || "");
  if (normalized.includes("nang") || normalized.includes("cao") || normalized.includes("severe")) return "severe";
  if (normalized.includes("nhe") || normalized.includes("mild")) return "mild";
  return "moderate";
};

const getLanguageInstruction = (language: "en" | "ja" | "vi") =>
  language === "ja" ? "Trả lời bằng tiếng Nhật." : language === "en" ? "Answer in English." : "Trả lời bằng tiếng Việt.";

const buildDiagnosisStagePlans = (diagnosis: Diagnosis | null) => {
  const treatment = diagnosis?.treatment?.filter(Boolean) || [];
  const checklist = diagnosis?.treatmentChecklist?.filter(Boolean) || [];
  const prevention = diagnosis?.prevention?.filter(Boolean) || [];
  const recommendation = diagnosis?.recommendation ? [diagnosis.recommendation] : [];
  const pesticide = diagnosis?.pesticideType ? [diagnosis.pesticideType] : [];

  const immediate = treatment.length
    ? treatment.slice(0, 2)
    : checklist.slice(0, 2);
  const next24h = [
    ...treatment.slice(2, 4),
    ...pesticide,
    ...recommendation,
  ].slice(0, 3);
  const followUp = prevention.length
    ? prevention.slice(0, 3)
    : checklist.slice(2, 5);

  return {
    immediate,
    next24h,
    followUp,
  };
};

const shouldCreateTreatmentProtocol = (diagnosis: Diagnosis | null, hasCatalogProtocol = false) => {
  if (!diagnosis) return false;
  const disease = normalize(diagnosis.diseaseName);
  const severity = normalize(diagnosis.severity || "");
  const pathogen = normalize(diagnosis.pathogen || "");
  const pesticideType = normalize(diagnosis.pesticideType || "");
  const hasSpecificTreatment = hasCatalogProtocol || Boolean(diagnosis.treatment?.some((item) => item.trim()));

  if (diagnosis.confidence < 40) return false;
  if (severity.includes("cankiemtratham") || disease.includes("ngoaiphamvi") || disease.includes("chuadur")) return false;
  if (pathogen.includes("chuaduchacchan") || pesticideType.includes("chuanen")) return false;
  if (disease.includes("khoemanh") || disease.includes("healthy")) return false;
  return hasSpecificTreatment;
};

const RecommendationsView = ({ diagnosis, setView, onClearDiagnosis }: RecommendationsViewProps) => {
  const { language } = useI18n();
  const tt = (key: string) => text[key]?.[language] ?? text[key]?.vi ?? key;
  const td = (value?: string | null) => {
    if (!value) return "";
    const exact = catalogTreatmentText[value]?.[language] ?? dictionary[value]?.[language] ?? catalogTreatmentText[value]?.vi ?? dictionary[value]?.vi;
    if (exact) return exact;
    return Object.entries({ ...catalogTreatmentText, ...dictionary })
      .sort((left, right) => right[0].length - left[0].length)
      .reduce((current, [source, target]) => current.replaceAll(source, target[language] ?? target.vi), value);
  };

  const [profiles, setProfiles] = useState<RecommendationDiseaseProfile[]>([]);
  const [isLoadingProfiles, setIsLoadingProfiles] = useState(true);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setIsLoadingProfiles(true);
    void getRecommendationProfiles()
      .then((result) => {
        if (mounted) setProfiles(result.data);
      })
      .finally(() => {
        if (mounted) setIsLoadingProfiles(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const matchedProfile = useMemo(() => {
    if (!diagnosis) return null;
    const diseaseKey = normalize(diagnosis.diseaseName);
    const cropKey = normalize(diagnosis.cropName);

    return (
      profiles.find((profile) => normalize(profile.name) === diseaseKey && normalize(profile.cropType) === cropKey) ||
      profiles.find((profile) => diseaseKey.includes(normalize(profile.name)) || normalize(profile.name).includes(diseaseKey)) ||
      null
    );
  }, [diagnosis, profiles]);

  const selectedProtocol = useMemo(() => {
    if (!diagnosis || !matchedProfile) return null;
    const severity = severityToProtocol(diagnosis.severity);
    return (
      matchedProfile.protocols.find((protocol) => protocol.severity === severity) ||
      matchedProfile.protocols.find((protocol) => protocol.severity === "moderate") ||
      matchedProfile.protocols[0] ||
      null
    );
  }, [diagnosis, matchedProfile]);

  const catalogProtocol = useMemo(() => getCatalogTreatmentProtocol(diagnosis), [diagnosis]);
  const canCreateProtocol = shouldCreateTreatmentProtocol(diagnosis, Boolean(catalogProtocol));

  const stagePlans = useMemo(() => {
    if (!canCreateProtocol) return { immediate: [], next24h: [], followUp: [] };
    if (catalogProtocol) {
      return {
        immediate: catalogProtocol.immediate,
        next24h: catalogProtocol.next24h,
        followUp: catalogProtocol.followUp,
      };
    }
    if (matchedProfile?.stagePlans) return matchedProfile.stagePlans;
    return buildDiagnosisStagePlans(diagnosis);
  }, [diagnosis, matchedProfile, canCreateProtocol, catalogProtocol]);

  const treatmentSteps = !canCreateProtocol
    ? []
    : catalogProtocol?.steps?.length
    ? catalogProtocol.steps
    : diagnosis?.treatment?.length
      ? diagnosis.treatment
    : selectedProtocol?.steps?.length
      ? selectedProtocol.steps
      : diagnosis?.treatmentChecklist || [];

  const products = canCreateProtocol ? catalogProtocol?.products || selectedProtocol?.drugs || [] : [];
  const symptoms = diagnosis?.symptoms?.length ? diagnosis.symptoms : matchedProfile?.symptoms ? [matchedProfile.symptoms] : [];
  const prevention = catalogProtocol?.safety || diagnosis?.prevention || [];
  const standaloneProfile = useMemo(
    () => profiles.find((profile) => profile.id === selectedProfileId) || profiles[0] || null,
    [profiles, selectedProfileId]
  );

  useEffect(() => {
    if (!selectedProfileId && profiles[0]) {
      setSelectedProfileId(profiles[0].id);
    }
  }, [profiles, selectedProfileId]);

  const protocolText = useMemo(() => {
    if (!diagnosis) return "";
    return [
      `${tt("title")}: ${td(diagnosis.diseaseName)}`,
      `${tt("crop")}: ${td(diagnosis.cropName)}`,
      `${tt("confidence")}: ${diagnosis.confidence}%`,
      `${tt("severity")}: ${td(diagnosis.severity) || "--"}`,
      "",
      `${tt("treatmentSteps")}:`,
      ...(treatmentSteps.length ? treatmentSteps : [tt("noItems")]).map((item, index) => `${index + 1}. ${td(item)}`),
      "",
      `${tt("prevention")}:`,
      ...(prevention.length ? prevention : [diagnosis.recommendation || tt("noItems")]).map((item) => `- ${td(item)}`),
    ].join("\n");
  }, [diagnosis, language, treatmentSteps, prevention]);

  const copyProtocol = async () => {
    if (!protocolText) return;
    await navigator.clipboard.writeText(protocolText);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  const askAI = async (question: string) => {
    if (!diagnosis || !question.trim() || isChatLoading) return;
    const userMessage: ChatMessage = { role: "user", text: question.trim() };
    setChatMessages((current) => [...current, userMessage]);
    setChatInput("");
    setIsChatLoading(true);

    try {
      const prompt = [
        getLanguageInstruction(language),
        "Bạn là cố vấn nông nghiệp. Chỉ tư vấn dựa trên ca bệnh và nhắc người dùng xác minh thực địa trước khi dùng thuốc.",
        `Cây trồng: ${diagnosis.cropName}`,
        `Bệnh: ${diagnosis.diseaseName}`,
        `Độ tin cậy: ${diagnosis.confidence}%`,
        `Mức độ: ${diagnosis.severity || "chưa rõ"}`,
        `Triệu chứng: ${(diagnosis.symptoms || []).join("; ") || "chưa có"}`,
        `Phác đồ hiện có: ${treatmentSteps.join("; ") || "chưa có"}`,
        `Câu hỏi người dùng: ${question.trim()}`,
      ].join("\n");
      const answer = await getAIConsultation(prompt);
      setChatMessages((current) => [...current, { role: "assistant", text: answer }]);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Không thể lấy gợi ý AI lúc này.";
      setChatMessages((current) => [...current, { role: "assistant", text: message }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const askProfileAI = async (question: string) => {
    if (!standaloneProfile || !question.trim() || isChatLoading) return;
    const userMessage: ChatMessage = { role: "user", text: question.trim() };
    setChatMessages((current) => [...current, userMessage]);
    setChatInput("");
    setIsChatLoading(true);

    try {
      const prompt = [
        getLanguageInstruction(language),
        "Bạn là cố vấn nông nghiệp. Tư vấn theo hồ sơ bệnh mẫu và nhắc người dùng xác minh thực địa trước khi dùng thuốc.",
        `Cây trồng: ${standaloneProfile.cropType}`,
        `Bệnh: ${standaloneProfile.name}`,
        `Mô tả: ${standaloneProfile.description}`,
        `Triệu chứng: ${standaloneProfile.symptoms}`,
        `Phác đồ: ${standaloneProfile.protocols.flatMap((protocol) => protocol.steps).join("; ")}`,
        `Câu hỏi người dùng: ${question.trim()}`,
      ].join("\n");
      const answer = await getAIConsultation(prompt);
      setChatMessages((current) => [...current, { role: "assistant", text: answer }]);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Không thể lấy gợi ý AI lúc này.";
      setChatMessages((current) => [...current, { role: "assistant", text: message }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  useEffect(() => {
    setChatMessages([]);
    setChatInput("");
  }, [diagnosis?.id, language]);

  useEffect(() => {
    if (!diagnosis || chatMessages.length > 0 || isLoadingProfiles) return;
    void askAI(tt("autoQuestion"));
  }, [diagnosis?.id, isLoadingProfiles, language]);

  if (!diagnosis) {
    const templateProtocol = standaloneProfile?.protocols[0] || null;
    const templateSteps = templateProtocol?.steps || [];

    return (
      <div className="min-h-screen bg-zinc-950 px-6 pb-24 pt-32">
        <div className="mx-auto max-w-7xl">
          <section className="rounded-[44px] border border-emerald-500/18 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.18),transparent_30%),linear-gradient(135deg,rgba(12,20,17,0.98),rgba(6,8,7,0.98))] p-8 md:p-10">
            <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.24em] text-emerald-300">
                  <Sparkles className="h-3.5 w-3.5" /> {tt("standaloneBadge")}
                </div>
                <h1 className="mt-6 text-5xl font-black tracking-tight text-white md:text-7xl">{tt("standaloneTitle")}</h1>
                <p className="mt-5 max-w-3xl text-base leading-8 text-white/58">{tt("standaloneSubtitle")}</p>
              </div>
              <div className="space-y-4">
                <AnimatedPlantGrowth
                  title={tt("growthVisualTitle")}
                  subtitle={tt("growthVisualSubtitle")}
                  stages={[tt("growthSeed"), tt("growthStem"), tt("growthHealthy")]}
                />
                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    onClick={() => setView("diagnosis")}
                    className="inline-flex min-h-20 items-center justify-center gap-3 rounded-[26px] bg-emerald-500 px-5 py-4 text-sm font-black uppercase tracking-[0.16em] text-slate-950 transition hover:bg-emerald-400"
                  >
                    <Stethoscope className="h-5 w-5" /> {tt("openDiagnosisFlow")}
                  </button>
                  <button
                    onClick={() => void askProfileAI(tt("profileQuestion"))}
                    disabled={!standaloneProfile || isChatLoading}
                    className="inline-flex min-h-20 items-center justify-center gap-3 rounded-[26px] border border-white/10 bg-black/25 px-5 py-4 text-sm font-black uppercase tracking-[0.16em] text-white/75 transition hover:border-emerald-400/30 hover:text-emerald-200 disabled:opacity-50"
                  >
                    <Bot className="h-5 w-5" /> {tt("askProfileAI")}
                  </button>
                </div>
              </div>
            </div>
          </section>

          <section className="mt-8 grid gap-8 xl:grid-cols-[0.72fr_1.28fr]">
            <div className="rounded-[36px] border border-white/8 bg-zinc-900 p-6">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-300">{tt("profileLibrary")}</p>
                  <h2 className="mt-2 text-2xl font-black text-white">{tt("chooseProfile")}</h2>
                </div>
                {isLoadingProfiles ? <Loader2 className="h-5 w-5 animate-spin text-white/40" /> : <ClipboardList className="h-6 w-6 text-emerald-300" />}
              </div>
              <div className="space-y-3">
                {profiles.slice(0, 10).map((profile) => {
                  const active = standaloneProfile?.id === profile.id;
                  return (
                    <button
                      key={profile.id}
                      onClick={() => {
                        setSelectedProfileId(profile.id);
                        setChatMessages([]);
                      }}
                      className={`w-full rounded-[24px] border p-4 text-left transition ${
                        active ? "border-emerald-400/35 bg-emerald-500/12" : "border-white/8 bg-black/25 hover:border-white/18"
                      }`}
                    >
                      <p className="font-black text-white">{td(profile.name)}</p>
                      <p className="mt-2 text-sm text-white/45">{td(profile.cropType)} • {td(profile.impactLevel)}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-8">
              <ProtocolMediaShowcase />

              <div className="grid gap-8 lg:grid-cols-[1fr_0.82fr]">
                <div className="rounded-[36px] border border-white/8 bg-zinc-900 p-7">
                  <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-300">{standaloneProfile ? td(standaloneProfile.cropType) : tt("profileLibrary")}</p>
                  <h2 className="mt-3 text-3xl font-black text-white">{standaloneProfile ? td(standaloneProfile.name) : tt("noItems")}</h2>
                  <p className="mt-4 text-sm leading-7 text-white/55">{td(standaloneProfile?.description) || tt("noItems")}</p>
                  <div className="mt-6 grid gap-4 md:grid-cols-3">
                    {[
                      { title: tt("immediate"), items: standaloneProfile?.stagePlans.immediate || [] },
                      { title: tt("next24h"), items: standaloneProfile?.stagePlans.next24h || [] },
                      { title: tt("followUp"), items: standaloneProfile?.stagePlans.followUp || [] },
                    ].map((group) => (
                      <div key={group.title} className="rounded-[24px] border border-white/7 bg-black/25 p-4">
                        <p className="text-sm font-black text-white">{group.title}</p>
                        <div className="mt-3 space-y-3">
                          {(group.items.length ? group.items : [tt("noItems")]).map((item) => (
                            <div key={item} className="flex items-start gap-2 text-sm leading-6 text-white/62">
                              <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-emerald-400" />
                              {td(item)}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 rounded-[28px] border border-white/8 bg-black/25 p-5">
                    <p className="text-xs font-bold uppercase tracking-[0.22em] text-white/30">{tt("treatmentSteps")}</p>
                    <div className="mt-4 space-y-3">
                      {(templateSteps.length ? templateSteps : [tt("noItems")]).map((step, index) => (
                        <div key={`${step}-${index}`} className="flex gap-3 text-sm leading-7 text-white/68">
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-[10px] font-black text-emerald-300">
                            {index + 1}
                          </span>
                          {td(step)}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <aside className="rounded-[36px] border border-emerald-500/16 bg-emerald-500/7 p-6">
                  <div className="mb-5 flex items-start gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-300">
                      <Bot className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-black text-white">{tt("aiBox")}</h2>
                      <p className="mt-1 text-sm leading-6 text-white/50">{tt("aiIntro")}</p>
                    </div>
                  </div>
                  <div className="custom-scrollbar max-h-[420px] space-y-4 overflow-y-auto pr-1">
                    {chatMessages.map((message, index) => (
                      <div key={`${message.role}-${index}`} className={`rounded-[22px] border p-4 text-sm leading-7 ${message.role === "user" ? "border-sky-400/20 bg-sky-400/10 text-sky-50" : "border-white/8 bg-black/25 text-white/72"}`}>
                        <p className="whitespace-pre-line">{td(message.text)}</p>
                      </div>
                    ))}
                    {isChatLoading ? (
                      <div className="flex items-center gap-3 rounded-[22px] border border-white/8 bg-black/25 p-4 text-sm text-white/50">
                        <Loader2 className="h-4 w-4 animate-spin" /> {tt("aiLoading")}
                      </div>
                    ) : null}
                  </div>
                  <form
                    onSubmit={(event) => {
                      event.preventDefault();
                      void askProfileAI(chatInput);
                    }}
                    className="mt-5 flex gap-3"
                  >
                    <input
                      value={chatInput}
                      onChange={(event) => setChatInput(event.target.value)}
                      placeholder={tt("aiPlaceholder")}
                      className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/28 focus:border-emerald-400"
                    />
                    <button
                      type="submit"
                      disabled={!chatInput.trim() || isChatLoading}
                      className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-emerald-500 disabled:opacity-50"
                    >
                      <Send className="h-4 w-4" />
                      {tt("ask")}
                    </button>
                  </form>
                </aside>
              </div>
            </div>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 px-6 pb-24 pt-32">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-wrap gap-3">
          <button
            onClick={() => setView("diagnosis")}
            className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs font-bold uppercase tracking-widest text-white/60 transition hover:border-emerald-400/30 hover:text-emerald-300"
          >
            <ArrowLeft className="h-4 w-4" /> {tt("backDiagnosis")}
          </button>
          <button
            onClick={onClearDiagnosis}
            className="inline-flex items-center gap-2 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-xs font-bold uppercase tracking-widest text-emerald-200 transition hover:border-emerald-300/45 hover:bg-emerald-500/15"
          >
            <ClipboardList className="h-4 w-4" /> {tt("protocolLibraryPage")}
          </button>
        </div>

        <section className="rounded-[44px] border border-emerald-500/18 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.2),transparent_30%),linear-gradient(135deg,rgba(12,20,17,0.98),rgba(6,8,7,0.98))] p-8 md:p-10">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.24em] text-emerald-300">
                <Sparkles className="h-3.5 w-3.5" /> {tt("badge")}
              </div>
              <h1 className="mt-6 text-5xl font-black tracking-tight text-white md:text-7xl">{td(diagnosis.diseaseName)}</h1>
              <p className="mt-5 max-w-3xl text-base leading-8 text-white/58">{tt("subtitle")}</p>
              {diagnosis.confidence < 45 ? (
                <p className="mt-5 inline-flex items-center gap-2 rounded-full border border-amber-400/20 bg-amber-400/10 px-4 py-2 text-xs font-bold text-amber-100">
                  <TriangleAlert className="h-4 w-4" /> {tt("lowConfidence")}
                </p>
              ) : null}
            </div>

            <div className="space-y-4">
              <AnimatedPlantGrowth
                title={tt("growthVisualTitle")}
                subtitle={tt("growthVisualSubtitle")}
                stages={[tt("growthSeed"), tt("growthStem"), tt("growthHealthy")]}
              />
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  { label: tt("crop"), value: td(diagnosis.cropName), icon: Target },
                  { label: tt("confidence"), value: `${diagnosis.confidence}%`, icon: CheckCircle2 },
                  { label: tt("severity"), value: td(diagnosis.severity), icon: TriangleAlert },
                  { label: tt("pathogen"), value: td(diagnosis.pathogen || ""), icon: ShieldCheck },
                ].map(({ label, value, icon: Icon }) => (
                  <div key={label} className="rounded-[26px] border border-white/8 bg-black/25 p-5">
                    <Icon className="h-5 w-5 text-emerald-300" />
                    <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.22em] text-white/30">{label}</p>
                    <p className="mt-2 text-lg font-black text-white">{value || "--"}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8">
          <div className="rounded-[36px] border border-white/8 bg-zinc-900 p-6">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-300">{tt("functionPanel")}</p>
                <h2 className="mt-2 text-2xl font-black text-white">{tt("quickToolsTitle")}</h2>
              </div>
              <Activity className="h-6 w-6 text-emerald-300" />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                {
                  label: canCreateProtocol ? tt("askPriority") : tt("verifyOnly"),
                  icon: Sparkles,
                  action: () =>
                    askAI(
                      canCreateProtocol
                        ? tt("autoQuestion")
                        : "Chỉ hướng dẫn cách xác minh lại ảnh và triệu chứng, không đưa phác đồ điều trị hoặc thuốc."
                    ),
                  primary: true,
                },
                { label: tt("askSafety"), icon: ShieldCheck, action: () => askAI("Kiểm tra các rủi ro an toàn và thời gian cách ly cần lưu ý cho ca bệnh này.") },
                { label: tt("askMonitoring"), icon: ClipboardList, action: () => askAI("Lập lịch theo dõi 7 ngày sau xử lý cho ca bệnh này.") },
                { label: copied ? tt("copied") : tt("copyProtocol"), icon: Copy, action: copyProtocol },
                { label: tt("printProtocol"), icon: Printer, action: () => window.print() },
                { label: tt("backDiagnosis"), icon: ArrowLeft, action: () => setView("diagnosis") },
                { label: tt("protocolLibraryPage"), icon: ClipboardList, action: onClearDiagnosis },
              ].map(({ label, icon: Icon, action, primary }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => void action()}
                  disabled={isChatLoading && label !== tt("copyProtocol")}
                  className={`inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-xs font-black uppercase tracking-[0.16em] transition ${
                    primary
                      ? "border-emerald-400/25 bg-emerald-500 text-slate-950 hover:bg-emerald-400"
                      : "border-white/10 bg-black/25 text-white/65 hover:border-emerald-400/30 hover:text-emerald-200"
                  } disabled:cursor-not-allowed disabled:opacity-55`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              ))}
            </div>
          </div>
        </section>

        <div className="mt-8 grid gap-8 xl:grid-cols-[1fr_0.86fr]">
          <main className="space-y-8">
            {canCreateProtocol ? (
              <>
            <section className="rounded-[36px] border border-white/8 bg-zinc-900 p-7">
              <div className="mb-6 flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-300">
                    {matchedProfile ? tt("matchedProfile") : tt("fallbackProfile")}
                  </p>
                  <h2 className="mt-3 text-2xl font-black text-white">{tt("title")}</h2>
                </div>
                {isLoadingProfiles ? <Loader2 className="h-5 w-5 animate-spin text-white/40" /> : <ClipboardList className="h-6 w-6 text-emerald-300" />}
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                {[
                  { title: tt("immediate"), items: stagePlans.immediate },
                  { title: tt("next24h"), items: stagePlans.next24h },
                  { title: tt("followUp"), items: stagePlans.followUp },
                ].map((group) => (
                  <div key={group.title} className="rounded-[28px] border border-white/7 bg-black/25 p-5">
                    <p className="text-sm font-black text-white">{group.title}</p>
                    <div className="mt-4 space-y-3">
                      {(group.items.length ? group.items : [tt("noItems")]).map((item) => (
                        <div key={item} className="flex items-start gap-3 text-sm leading-6 text-white/65">
                          <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-emerald-400" />
                          <span>{td(item)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="grid gap-8 lg:grid-cols-2">
              <div className="rounded-[36px] border border-white/8 bg-zinc-900 p-7">
                <h3 className="text-xs font-bold uppercase tracking-[0.22em] text-white/30">{tt("treatmentSteps")}</h3>
                <div className="mt-6 space-y-4">
                  {(treatmentSteps.length ? treatmentSteps : [tt("noItems")]).map((step, index) => (
                    <div key={`${step}-${index}`} className="flex gap-4 rounded-[22px] border border-white/6 bg-black/25 p-4 text-sm leading-7 text-white/70">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-[10px] font-black text-emerald-300">
                        {index + 1}
                      </span>
                      {td(step)}
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-8">
                <div className="rounded-[36px] border border-white/8 bg-zinc-900 p-7">
                  <h3 className="text-xs font-bold uppercase tracking-[0.22em] text-white/30">{tt("symptoms")}</h3>
                  <div className="mt-5 flex flex-wrap gap-2">
                    {(symptoms.length ? symptoms : [tt("noItems")]).map((item) => (
                      <span key={item} className="rounded-full border border-sky-400/20 bg-sky-400/10 px-4 py-2 text-sm font-bold text-sky-100">
                        {td(item)}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="rounded-[36px] border border-white/8 bg-zinc-900 p-7">
                  <h3 className="text-xs font-bold uppercase tracking-[0.22em] text-white/30">{tt("products")}</h3>
                  <div className="mt-5 space-y-3">
                    {products.length ? (
                      products.map((drug) => (
                        <div key={drug.name} className="rounded-[22px] border border-white/6 bg-black/25 p-4">
                          <p className="font-bold text-white">{drug.name}</p>
                          <p className="mt-2 text-sm text-white/50">{drug.activeIngredient} • {drug.dosage}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm leading-7 text-white/55">{td(diagnosis.pesticideType || diagnosis.recommendation || tt("noItems"))}</p>
                    )}
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-[36px] border border-amber-400/12 bg-amber-500/6 p-7">
              <h3 className="text-xs font-bold uppercase tracking-[0.22em] text-amber-200">{tt("safety")}</h3>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                {(prevention.length ? prevention : [diagnosis.recommendation]).filter(Boolean).map((item) => (
                  <div key={item} className="flex items-start gap-3 text-sm leading-7 text-white/68">
                    <ShieldCheck className="mt-1 h-4 w-4 shrink-0 text-amber-200" />
                    {td(item)}
                  </div>
                ))}
              </div>
            </section>
              </>
            ) : (
              <section className="rounded-[36px] border border-amber-400/18 bg-amber-500/8 p-8">
                <div className="flex flex-col gap-6 md:flex-row md:items-start">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-amber-400/12 text-amber-200">
                    <TriangleAlert className="h-7 w-7" />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.22em] text-amber-200">{tt("verifyOnly")}</p>
                    <h2 className="mt-3 text-3xl font-black text-white">{tt("noProtocolTitle")}</h2>
                    <p className="mt-4 max-w-3xl text-sm leading-7 text-white/62">{tt("noProtocolDesc")}</p>
                    <div className="mt-7 grid gap-4 md:grid-cols-2">
                      {[tt("retakePhoto"), tt("fieldCheck")].map((item) => (
                        <div key={item} className="flex items-start gap-3 rounded-[24px] border border-white/8 bg-black/25 p-5 text-sm leading-7 text-white/70">
                          <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-amber-200" />
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </section>
            )}
          </main>

          <aside className="rounded-[36px] border border-emerald-500/16 bg-emerald-500/7 p-7 xl:sticky xl:top-28 xl:max-h-[calc(100vh-8rem)]">
            <div className="mb-6 flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-300">
                <Bot className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-black text-white">{tt("aiBox")}</h2>
                <p className="mt-2 text-sm leading-6 text-white/52">{tt("aiIntro")}</p>
              </div>
            </div>

            <div className="custom-scrollbar max-h-[54vh] space-y-4 overflow-y-auto pr-1">
              {chatMessages.map((message, index) => (
                <div
                  key={`${message.role}-${index}`}
                  className={`rounded-[24px] border p-4 text-sm leading-7 ${
                    message.role === "user"
                      ? "border-sky-400/20 bg-sky-400/10 text-sky-50"
                      : "border-white/8 bg-black/25 text-white/72"
                  }`}
                >
                  <div className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-white/35">
                    {message.role === "user" ? <MessageSquare className="h-3.5 w-3.5" /> : <Sparkles className="h-3.5 w-3.5" />}
                    {message.role === "user" ? tt("chatUser") : tt("chatAI")}
                  </div>
                  <p className="whitespace-pre-line">{td(message.text)}</p>
                </div>
              ))}
              {isChatLoading ? (
                <div className="flex items-center gap-3 rounded-[24px] border border-white/8 bg-black/25 p-4 text-sm text-white/50">
                  <Loader2 className="h-4 w-4 animate-spin" /> {tt("aiLoading")}
                </div>
              ) : null}
            </div>

            <form
              onSubmit={(event) => {
                event.preventDefault();
                void askAI(chatInput);
              }}
              className="mt-6 flex gap-3"
            >
              <input
                value={chatInput}
                onChange={(event) => setChatInput(event.target.value)}
                placeholder={tt("aiPlaceholder")}
                className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/28 focus:border-emerald-400"
              />
              <button
                type="submit"
                disabled={!chatInput.trim() || isChatLoading}
                className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
                {tt("ask")}
              </button>
            </form>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default RecommendationsView;
