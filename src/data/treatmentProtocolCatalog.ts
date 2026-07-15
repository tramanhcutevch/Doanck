import { Diagnosis, TreatmentProtocol } from "../types.js";
import type { LocalizedDictionary } from "../i18n.js";
import {
  PlantDiseaseCatalogEntry,
  getPlantDiseaseCatalogEntry,
} from "./plantDiseaseCatalog.js";

export type ProtocolProduct = TreatmentProtocol["drugs"][number];

export type CatalogTreatmentProtocol = {
  source: "catalog";
  catalogEntry: PlantDiseaseCatalogEntry;
  immediate: string[];
  next24h: string[];
  followUp: string[];
  steps: string[];
  products: ProtocolProduct[];
  safety: string[];
};

const catalogTreatmentBaseText: LocalizedDictionary = {
  "Theo nhãn": { vi: "Theo nhãn", en: "Follow label", ja: "ラベルに従う" },
  "Đồng": { vi: "Đồng", en: "Copper", ja: "銅剤" },
  "Thuốc tiếp xúc phổ rộng": { vi: "Thuốc tiếp xúc phổ rộng", en: "Broad-spectrum contact fungicide", ja: "広範囲接触殺菌剤" },
  "Lưu huỳnh": { vi: "Lưu huỳnh", en: "Sulfur", ja: "硫黄" },
  "Đặc trị Phytophthora": { vi: "Đặc trị Phytophthora", en: "Phytophthora-specific treatment", ja: "フィトフトラ専用薬剤" },
  "Kháng sinh nông nghiệp được phép": { vi: "Kháng sinh nông nghiệp được phép", en: "Approved agricultural antibiotic", ja: "認可農業用抗生物質" },
  "Quản lý côn trùng môi giới": { vi: "Quản lý côn trùng môi giới", en: "Vector insect management", ja: "媒介昆虫管理" },
  "Quản lý côn trùng truyền virus": { vi: "Quản lý côn trùng truyền virus", en: "Virus-vector insect management", ja: "ウイルス媒介昆虫管理" },
  "Theo nguyên nhân xác minh": { vi: "Theo nguyên nhân xác minh", en: "Based on verified cause", ja: "確認した原因に基づく" },
  "Dinh dưỡng hỗ trợ": { vi: "Dinh dưỡng hỗ trợ", en: "Supportive nutrition", ja: "補助栄養" },
  "Tiếp xúc": { vi: "Tiếp xúc", en: "Contact fungicide", ja: "接触剤" },
  "Theo mật độ": { vi: "Theo mật độ", en: "Based on pest density", ja: "密度に応じる" },
  "Giám sát bọ phấn": { vi: "Giám sát bọ phấn", en: "Whitefly monitoring", ja: "コナジラミ監視" },
  "Vệ sinh cơ học": { vi: "Vệ sinh cơ học", en: "Mechanical sanitation", ja: "物理的衛生管理" },
  "Bảo vệ cơ học/sinh học": { vi: "Bảo vệ cơ học/sinh học", en: "Mechanical/biological protection", ja: "物理的・生物的保護" },

  "Dọn lá rụng dưới tán để giảm nguồn bào tử.": {
    vi: "Dọn lá rụng dưới tán để giảm nguồn bào tử.",
    en: "Remove fallen leaves under the canopy to reduce spore sources.",
    ja: "樹冠下の落葉を除去し、胞子源を減らします。",
  },
  "Giữ tán thông thoáng, hạn chế tưới ướt lá.": {
    vi: "Giữ tán thông thoáng, hạn chế tưới ướt lá.",
    en: "Keep the canopy airy and avoid wetting leaves during irrigation.",
    ja: "樹冠の通気を保ち、葉を濡らす灌水を控えます。",
  },
  "Luân phiên thuốc tiếp xúc và nội hấp theo nhãn.": {
    vi: "Luân phiên thuốc tiếp xúc và nội hấp theo nhãn.",
    en: "Rotate contact and systemic products according to the label.",
    ja: "ラベルに従い、接触剤と浸透移行性剤をローテーションします。",
  },
  "Thu gom lá/quả bệnh sau mỗi đợt mưa.": {
    vi: "Thu gom lá/quả bệnh sau mỗi đợt mưa.",
    en: "Collect diseased leaves or fruit after each rain event.",
    ja: "降雨後ごとに病葉や病果を回収します。",
  },
  "Tăng thông thoáng tán và tránh bón thừa đạm.": {
    vi: "Tăng thông thoáng tán và tránh bón thừa đạm.",
    en: "Improve canopy airflow and avoid excessive nitrogen.",
    ja: "樹冠の通気を高め、窒素過多を避けます。",
  },
  "Ngưng tưới phun lên lá trong vài ngày tới.": {
    vi: "Ngưng tưới phun lên lá trong vài ngày tới.",
    en: "Stop overhead leaf irrigation for the next few days.",
    ja: "数日間、葉への散水を停止します。",
  },
  "Phủ đều mặt trên và mặt dưới lá, nhất là lá non.": {
    vi: "Phủ đều mặt trên và mặt dưới lá, nhất là lá non.",
    en: "Cover both upper and lower leaf surfaces, especially young leaves.",
    ja: "特に若葉の葉表と葉裏を均一に覆います。",
  },
  "Khoanh vùng ruộng có mật độ vết bệnh cao.": {
    vi: "Khoanh vùng ruộng có mật độ vết bệnh cao.",
    en: "Mark field zones with high lesion density.",
    ja: "病斑密度が高い圃場区域を区分します。",
  },
  "Giữ cây khỏe bằng dinh dưỡng cân đối, tránh thừa đạm.": {
    vi: "Giữ cây khỏe bằng dinh dưỡng cân đối, tránh thừa đạm.",
    en: "Keep plants vigorous with balanced nutrition and avoid excess nitrogen.",
    ja: "バランスの良い栄養で株を健全に保ち、窒素過多を避けます。",
  },
  "Kiểm tra vết bệnh mới sau 5-7 ngày.": {
    vi: "Kiểm tra vết bệnh mới sau 5-7 ngày.",
    en: "Check for new lesions after 5-7 days.",
    ja: "5〜7日後に新しい病斑を確認します。",
  },
  "Khử khuẩn dụng cụ cắt sau mỗi cây.": {
    vi: "Khử khuẩn dụng cụ cắt sau mỗi cây.",
    en: "Disinfect cutting tools after each plant.",
    ja: "株ごとに剪定道具を消毒します。",
  },
  "Tạo thông thoáng quanh chùm và tán.": {
    vi: "Tạo thông thoáng quanh chùm và tán.",
    en: "Improve airflow around clusters and the canopy.",
    ja: "房と樹冠周辺の通気を改善します。",
  },
  "Tránh tưới phun vào chiều tối.": {
    vi: "Tránh tưới phun vào chiều tối.",
    en: "Avoid overhead irrigation late in the afternoon.",
    ja: "夕方遅くの散水を避けます。",
  },
  "Kiểm tra rầy chổng cánh trên lộc non.": {
    vi: "Kiểm tra rầy chổng cánh trên lộc non.",
    en: "Check citrus psyllids on new flushes.",
    ja: "新梢のミカンキジラミを確認します。",
  },
  "Không lấy mắt ghép/cành giống từ cây nghi bệnh.": {
    vi: "Không lấy mắt ghép/cành giống từ cây nghi bệnh.",
    en: "Do not take buds or cuttings from suspected diseased trees.",
    ja: "疑わしい病樹から芽や穂木を採取しません。",
  },
  "Ngưng tưới phun mưa, tránh thao tác khi tán còn ướt.": {
    vi: "Ngưng tưới phun mưa, tránh thao tác khi tán còn ướt.",
    en: "Stop overhead irrigation and avoid handling plants while the canopy is wet.",
    ja: "散水を止め、樹冠が濡れている間の作業を避けます。",
  },
  "Tập trung mặt dưới lá và vùng vết bệnh mới.": {
    vi: "Tập trung mặt dưới lá và vùng vết bệnh mới.",
    en: "Focus on leaf undersides and areas with new lesions.",
    ja: "葉裏と新しい病斑部を重点的に処理します。",
  },
  "Dọn tàn dư bệnh cuối vụ và luân canh cây không cùng ký chủ.": {
    vi: "Dọn tàn dư bệnh cuối vụ và luân canh cây không cùng ký chủ.",
    en: "Clean diseased residue at season end and rotate with non-host crops.",
    ja: "作期末に病残渣を片付け、非宿主作物で輪作します。",
  },
  "Dọn lá bệnh chạm đất và giảm ẩm quanh gốc.": {
    vi: "Dọn lá bệnh chạm đất và giảm ẩm quanh gốc.",
    en: "Remove diseased leaves touching soil and reduce moisture around the base.",
    ja: "地面に触れる病葉を除去し、株元の湿気を下げます。",
  },
  "Không tưới phun lên lá vào chiều tối.": {
    vi: "Không tưới phun lên lá vào chiều tối.",
    en: "Do not spray water on leaves in the late afternoon.",
    ja: "夕方遅くに葉へ散水しません。",
  },
  "Bổ sung dinh dưỡng cân đối, tránh cây suy.": {
    vi: "Bổ sung dinh dưỡng cân đối, tránh cây suy.",
    en: "Apply balanced nutrition to prevent plant weakening.",
    ja: "株の衰弱を避けるため、栄養をバランス良く補います。",
  },
  "Ngưng tưới phun, giảm ẩm tán ngay.": {
    vi: "Ngưng tưới phun, giảm ẩm tán ngay.",
    en: "Stop overhead irrigation and reduce canopy humidity immediately.",
    ja: "散水を止め、樹冠湿度をすぐに下げます。",
  },
  "Kiểm tra mặt dưới lá có mốc trắng trong sáng sớm.": {
    vi: "Kiểm tra mặt dưới lá có mốc trắng trong sáng sớm.",
    en: "Check leaf undersides for white mold early in the morning.",
    ja: "早朝に葉裏の白いかびを確認します。",
  },
  "Tái kiểm tra sau 48-72 giờ vì bệnh lan rất nhanh.": {
    vi: "Tái kiểm tra sau 48-72 giờ vì bệnh lan rất nhanh.",
    en: "Recheck after 48-72 hours because this disease spreads very quickly.",
    ja: "病勢が非常に速いため、48〜72時間後に再確認します。",
  },
  "Cách ly cây khoai tây nghi bệnh vi khuẩn và kiểm tra thân/củ.": {
    vi: "Cách ly cây khoai tây nghi bệnh vi khuẩn và kiểm tra thân/củ.",
    en: "Isolate potato plants suspected of bacterial disease and inspect stems/tubers.",
    ja: "細菌病が疑われるジャガイモを隔離し、茎と塊茎を確認します。",
  },
  "Loại bỏ cây thối mềm hoặc héo nặng khỏi ruộng.": {
    vi: "Loại bỏ cây thối mềm hoặc héo nặng khỏi ruộng.",
    en: "Remove soft-rotted or severely wilted plants from the field.",
    ja: "軟腐または重度萎凋株を圃場から除去します。",
  },
  "Giảm ẩm đất và cải thiện thoát nước.": {
    vi: "Giảm ẩm đất và cải thiện thoát nước.",
    en: "Reduce soil moisture and improve drainage.",
    ja: "土壌水分を下げ、排水を改善します。",
  },
  "Không dùng củ từ lô bệnh làm giống.": {
    vi: "Không dùng củ từ lô bệnh làm giống.",
    en: "Do not use tubers from diseased plots as seed.",
    ja: "病区の塊茎を種いもに使いません。",
  },
  "Kiểm tra dạng đốm nấm trên lá khoai tây và mức lan trong ruộng.": {
    vi: "Kiểm tra dạng đốm nấm trên lá khoai tây và mức lan trong ruộng.",
    en: "Check fungal spot patterns on potato leaves and the spread level in the field.",
    ja: "ジャガイモ葉の菌性斑点と圃場内の広がりを確認します。",
  },
  "Tỉa bỏ lá bệnh nặng sát mặt đất.": {
    vi: "Tỉa bỏ lá bệnh nặng sát mặt đất.",
    en: "Remove heavily diseased leaves near the soil surface.",
    ja: "地際付近の重症葉を除去します。",
  },
  "Đánh dấu cây có triệu chứng virus như khảm, xoăn lá hoặc còi cọc.": {
    vi: "Đánh dấu cây có triệu chứng virus như khảm, xoăn lá hoặc còi cọc.",
    en: "Mark plants with virus symptoms such as mosaic, leaf curl, or stunting.",
    ja: "モザイク、巻葉、矮化などのウイルス症状株に印を付けます。",
  },
  "Kiểm tra côn trùng môi giới trên lá non.": {
    vi: "Kiểm tra côn trùng môi giới trên lá non.",
    en: "Check vector insects on young leaves.",
    ja: "若葉の媒介昆虫を確認します。",
  },
  "Không dùng cây/hom/củ từ cây nghi bệnh làm giống.": {
    vi: "Không dùng cây/hom/củ từ cây nghi bệnh làm giống.",
    en: "Do not use plants, cuttings, or tubers from suspected plants as propagation material.",
    ja: "疑わしい株、挿し穂、塊茎を繁殖材料に使いません。",
  },
  "Không có thuốc phun chữa khỏi virus; tập trung loại nguồn bệnh và môi giới.": {
    vi: "Không có thuốc phun chữa khỏi virus; tập trung loại nguồn bệnh và môi giới.",
    en: "There is no spray cure for viruses; focus on removing infection sources and vectors.",
    ja: "ウイルスを治す散布薬はないため、感染源と媒介昆虫の除去を優先します。",
  },
  "Cắt bỏ lá/cành sắn cháy vi khuẩn nặng trong ngày khô ráo.": {
    vi: "Cắt bỏ lá/cành sắn cháy vi khuẩn nặng trong ngày khô ráo.",
    en: "Cut off severely blighted cassava leaves/branches on a dry day.",
    ja: "乾いた日に重度のキャッサバ細菌性葉枯れ葉・枝を切除します。",
  },
  "Khử khuẩn dao sau mỗi cây.": {
    vi: "Khử khuẩn dao sau mỗi cây.",
    en: "Disinfect knives after each plant.",
    ja: "株ごとに刃物を消毒します。",
  },
  "Không vận chuyển hom giống từ lô nghi bệnh.": {
    vi: "Không vận chuyển hom giống từ lô nghi bệnh.",
    en: "Do not move planting cuttings from suspected diseased plots.",
    ja: "疑わしい病区から挿し穂を移動しません。",
  },
  "Đối chiếu đốm xanh/khảm nhẹ trên lá sắn với thiếu dinh dưỡng.": {
    vi: "Đối chiếu đốm xanh/khảm nhẹ trên lá sắn với thiếu dinh dưỡng.",
    en: "Compare cassava green mottling/mild mosaic with nutrient deficiency symptoms.",
    ja: "キャッサバの緑斑・軽いモザイクを栄養不足症状と照合します。",
  },
  "Không phun thuốc nặng khi chưa xác minh; ưu tiên kiểm tra dinh dưỡng và môi giới.": {
    vi: "Không phun thuốc nặng khi chưa xác minh; ưu tiên kiểm tra dinh dưỡng và môi giới.",
    en: "Avoid heavy spraying before verification; prioritize nutrition and vector checks.",
    ja: "確認前の強い薬剤散布は避け、栄養と媒介昆虫の確認を優先します。",
  },
  "Kiểm tra cháy mép lá dâu tây và loại trừ nắng nóng/thiếu nước.": {
    vi: "Kiểm tra cháy mép lá dâu tây và loại trừ nắng nóng/thiếu nước.",
    en: "Check strawberry leaf scorch and rule out heat or water stress.",
    ja: "イチゴの葉縁枯れを確認し、高温・水分ストレスを除外します。",
  },
  "Điều chỉnh tưới giữ ẩm đều nhưng không úng.": {
    vi: "Điều chỉnh tưới giữ ẩm đều nhưng không úng.",
    en: "Adjust irrigation to keep moisture even without waterlogging.",
    ja: "過湿にせず均一な湿度を保つよう灌水を調整します。",
  },
  "Tỉa bớt lá cà chua bị mốc lá nặng, nhất là tầng dưới.": {
    vi: "Tỉa bớt lá cà chua bị mốc lá nặng, nhất là tầng dưới.",
    en: "Remove heavily leaf-molded tomato leaves, especially in the lower canopy.",
    ja: "特に下層部の葉かびが重いトマト葉を除去します。",
  },
  "Tăng thông gió nhà màng/luống, giảm ẩm ban đêm.": {
    vi: "Tăng thông gió nhà màng/luống, giảm ẩm ban đêm.",
    en: "Improve greenhouse/bed ventilation and reduce night humidity.",
    ja: "ハウスや畝の換気を高め、夜間湿度を下げます。",
  },
  "Tỉa lá cà chua có nhiều đốm nhỏ xám nâu ở tầng dưới.": {
    vi: "Tỉa lá cà chua có nhiều đốm nhỏ xám nâu ở tầng dưới.",
    en: "Remove lower tomato leaves with many small gray-brown spots.",
    ja: "下層の小さな灰褐色斑が多いトマト葉を除去します。",
  },
  "Tưới gốc, tránh bắn đất lên lá.": {
    vi: "Tưới gốc, tránh bắn đất lên lá.",
    en: "Water at the base and avoid soil splash onto leaves.",
    ja: "株元に灌水し、土の跳ね返りを葉に付けないようにします。",
  },
  "Kiểm tra mặt dưới lá cà chua có nhện đỏ, trứng và tơ mịn.": {
    vi: "Kiểm tra mặt dưới lá cà chua có nhện đỏ, trứng và tơ mịn.",
    en: "Check tomato leaf undersides for mites, eggs, and fine webbing.",
    ja: "トマト葉裏のハダニ、卵、細い糸を確認します。",
  },
  "Phun thuốc trừ nhện đúng nhóm, phủ kỹ mặt dưới lá.": {
    vi: "Phun thuốc trừ nhện đúng nhóm, phủ kỹ mặt dưới lá.",
    en: "Spray the correct miticide group and cover leaf undersides thoroughly.",
    ja: "適切な殺ダニ剤を使い、葉裏をしっかり覆います。",
  },
  "Tỉa lá cà chua có đốm vòng lan rộng.": {
    vi: "Tỉa lá cà chua có đốm vòng lan rộng.",
    en: "Remove tomato leaves with spreading target spots.",
    ja: "広がる輪紋斑のあるトマト葉を除去します。",
  },
  "Đánh dấu cây cà chua xoăn vàng lá, lùn ngọn hoặc giảm đậu trái.": {
    vi: "Đánh dấu cây cà chua xoăn vàng lá, lùn ngọn hoặc giảm đậu trái.",
    en: "Mark tomato plants with yellow leaf curl, stunting, or reduced fruit set.",
    ja: "黄化葉巻、矮化、着果低下のあるトマト株に印を付けます。",
  },
  "Kiểm tra bọ phấn trắng ở mặt dưới lá non.": {
    vi: "Kiểm tra bọ phấn trắng ở mặt dưới lá non.",
    en: "Check whiteflies on the underside of young leaves.",
    ja: "若葉の葉裏のコナジラミを確認します。",
  },
  "Dùng bẫy dính vàng để giám sát mật số.": {
    vi: "Dùng bẫy dính vàng để giám sát mật số.",
    en: "Use yellow sticky traps to monitor population density.",
    ja: "黄色粘着板で密度を監視します。",
  },
  "Đánh dấu cây cà chua có khảm xanh vàng, lá biến dạng.": {
    vi: "Đánh dấu cây cà chua có khảm xanh vàng, lá biến dạng.",
    en: "Mark tomato plants with green-yellow mosaic and distorted leaves.",
    ja: "緑黄色モザイクや葉の変形があるトマト株に印を付けます。",
  },
  "Khử khuẩn tay, dao, dây buộc khi thao tác.": {
    vi: "Khử khuẩn tay, dao, dây buộc khi thao tác.",
    en: "Disinfect hands, knives, and ties during handling.",
    ja: "作業時に手、刃物、誘引用資材を消毒します。",
  },
  "Chỉ dùng thuốc khi triệu chứng ngoài thực địa khớp với kết quả AI và đọc đúng nhãn sản phẩm.": {
    vi: "Chỉ dùng thuốc khi triệu chứng ngoài thực địa khớp với kết quả AI và đọc đúng nhãn sản phẩm.",
    en: "Use chemicals only when field symptoms match the AI result and the product label has been read.",
    ja: "現場症状がAI結果と一致し、製品ラベルを確認した場合のみ薬剤を使用します。",
  },
  "Không pha quá liều, mang bảo hộ và tuân thủ thời gian cách ly theo nhãn.": {
    vi: "Không pha quá liều, mang bảo hộ và tuân thủ thời gian cách ly theo nhãn.",
    en: "Do not overdose; wear protective gear and follow the label withdrawal interval.",
    ja: "過量調製を避け、防護具を着用し、ラベルの収穫前日数を守ります。",
  },
};

const catalogTreatmentExtraText: LocalizedDictionary = {
  "Táo": { vi: "Táo", en: "Apple", ja: "リンゴ" },
  "Anh đào": { vi: "Anh đào", en: "Cherry", ja: "サクランボ" },
  "Ngô": { vi: "Ngô", en: "Corn", ja: "トウモロコシ" },
  "Nho": { vi: "Nho", en: "Grape", ja: "ブドウ" },
  "Cam quýt": { vi: "Cam quýt", en: "Citrus", ja: "柑橘" },
  "Đào": { vi: "Đào", en: "Peach", ja: "モモ" },
  "Ớt chuông": { vi: "Ớt chuông", en: "Bell pepper", ja: "ピーマン" },
  "Khoai tây": { vi: "Khoai tây", en: "Potato", ja: "ジャガイモ" },
  "Sắn": { vi: "Sắn", en: "Cassava", ja: "キャッサバ" },
  "Bí": { vi: "Bí", en: "Squash", ja: "カボチャ" },
  "Dâu tây": { vi: "Dâu tây", en: "Strawberry", ja: "イチゴ" },
  "Cà chua": { vi: "Cà chua", en: "Tomato", ja: "トマト" },

  "Ghẻ táo": { vi: "Ghẻ táo", en: "apple scab", ja: "リンゴ黒星病" },
  "Thối đen": { vi: "Thối đen", en: "black rot", ja: "黒腐病" },
  "Rỉ sắt táo": { vi: "Rỉ sắt táo", en: "cedar apple rust", ja: "リンゴ赤星病" },
  "Phấn trắng": { vi: "Phấn trắng", en: "powdery mildew", ja: "うどんこ病" },
  "Đốm lá xám Cercospora": { vi: "Đốm lá xám Cercospora", en: "Cercospora gray leaf spot", ja: "セルコスポラ灰色斑点病" },
  "Rỉ sắt thường": { vi: "Rỉ sắt thường", en: "common rust", ja: "普通さび病" },
  "Cháy lá phương bắc": { vi: "Cháy lá phương bắc", en: "northern leaf blight", ja: "北方葉枯病" },
  "Esca (đốm đen)": { vi: "Esca (đốm đen)", en: "Esca black measles", ja: "エスカ黒斑病" },
  "Cháy lá Isariopsis": { vi: "Cháy lá Isariopsis", en: "Isariopsis leaf blight", ja: "イサリオプシス葉枯病" },
  "Vàng lá gân xanh (HLB)": { vi: "Vàng lá gân xanh (HLB)", en: "citrus greening (HLB)", ja: "柑橘グリーニング病（HLB）" },
  "Đốm vi khuẩn": { vi: "Đốm vi khuẩn", en: "bacterial spot", ja: "細菌斑点病" },
  "Cháy lá sớm": { vi: "Cháy lá sớm", en: "early blight", ja: "早疫病" },
  "Sương mai": { vi: "Sương mai", en: "late blight", ja: "疫病" },
  "Bệnh vi khuẩn khoai tây": { vi: "Bệnh vi khuẩn khoai tây", en: "potato bacterial disease", ja: "ジャガイモ細菌病" },
  "Bệnh nấm khoai tây": { vi: "Bệnh nấm khoai tây", en: "potato fungal disease", ja: "ジャガイモ菌性病害" },
  "Bệnh Phytophthora khoai tây": { vi: "Bệnh Phytophthora khoai tây", en: "potato Phytophthora disease", ja: "ジャガイモフィトフトラ病" },
  "Bệnh virus khoai tây": { vi: "Bệnh virus khoai tây", en: "potato virus disease", ja: "ジャガイモウイルス病" },
  "Cháy lá vi khuẩn sắn": { vi: "Cháy lá vi khuẩn sắn", en: "cassava bacterial blight", ja: "キャッサバ細菌性葉枯病" },
  "Bệnh sọc nâu sắn": { vi: "Bệnh sọc nâu sắn", en: "cassava brown streak disease", ja: "キャッサバ褐色条斑病" },
  "Đốm xanh lá sắn": { vi: "Đốm xanh lá sắn", en: "cassava green mottle", ja: "キャッサバ緑斑病" },
  "Bệnh khảm lá sắn": { vi: "Bệnh khảm lá sắn", en: "cassava mosaic disease", ja: "キャッサバモザイク病" },
  "Cháy lá": { vi: "Cháy lá", en: "leaf scorch", ja: "葉焼け" },
  "Mốc lá": { vi: "Mốc lá", en: "leaf mold", ja: "葉かび病" },
  "Đốm lá Septoria": { vi: "Đốm lá Septoria", en: "Septoria leaf spot", ja: "セプトリア葉斑病" },
  "Nhện đỏ hai chấm": { vi: "Nhện đỏ hai chấm", en: "two-spotted spider mite", ja: "ナミハダニ" },
  "Đốm vòng": { vi: "Đốm vòng", en: "target spot", ja: "輪紋病" },
  "Virus xoăn vàng lá cà chua": { vi: "Virus xoăn vàng lá cà chua", en: "tomato yellow leaf curl virus", ja: "トマト黄化葉巻ウイルス" },
  "Virus khảm cà chua": { vi: "Virus khảm cà chua", en: "tomato mosaic virus", ja: "トマトモザイクウイルス" },

  "Bệnh ghẻ táo gây đốm sẫm màu trên lá và quả, làm giảm chất lượng thương phẩm.": {
    vi: "Bệnh ghẻ táo gây đốm sẫm màu trên lá và quả, làm giảm chất lượng thương phẩm.",
    en: "Apple scab creates dark lesions on leaves and fruit, reducing market quality.",
    ja: "リンゴ黒星病は葉や果実に暗色病斑を作り、商品品質を低下させます。",
  },
  "Bệnh thối đen trên táo có thể xuất hiện trên lá, cành và quả với mô hoại tử sẫm màu.": {
    vi: "Bệnh thối đen trên táo có thể xuất hiện trên lá, cành và quả với mô hoại tử sẫm màu.",
    en: "Apple black rot can affect leaves, branches, and fruit with dark necrotic tissue.",
    ja: "リンゴ黒腐病は葉、枝、果実に暗色の壊死組織を生じます。",
  },
  "Bệnh tạo đốm vàng cam trên lá táo và thường liên quan cây ký chủ phụ gần vườn.": {
    vi: "Bệnh tạo đốm vàng cam trên lá táo và thường liên quan cây ký chủ phụ gần vườn.",
    en: "The disease forms orange-yellow spots on apple leaves and is often linked to alternate hosts near the orchard.",
    ja: "葉に橙黄色の斑点を作り、園地周辺の中間宿主と関係することが多い病害です。",
  },
  "Bệnh phấn trắng phủ lớp bột trắng xám trên lá non và làm giảm sinh trưởng của cây.": {
    vi: "Bệnh phấn trắng phủ lớp bột trắng xám trên lá non và làm giảm sinh trưởng của cây.",
    en: "Powdery mildew coats young leaves with gray-white powder and slows plant growth.",
    ja: "うどんこ病は若葉に灰白色の粉状菌層を作り、生育を低下させます。",
  },
  "Bệnh đốm lá xám trên ngô tạo các vết dài xám nâu dọc theo gân lá.": {
    vi: "Bệnh đốm lá xám trên ngô tạo các vết dài xám nâu dọc theo gân lá.",
    en: "Gray leaf spot on corn forms long gray-brown lesions along leaf veins.",
    ja: "トウモロコシ灰色斑点病は葉脈に沿って長い灰褐色病斑を作ります。",
  },
  "Rỉ sắt thường gây các ổ bào tử nâu đỏ trên lá ngô và làm giảm hiệu suất quang hợp.": {
    vi: "Rỉ sắt thường gây các ổ bào tử nâu đỏ trên lá ngô và làm giảm hiệu suất quang hợp.",
    en: "Common rust creates reddish-brown pustules on corn leaves and reduces photosynthesis.",
    ja: "普通さび病は葉に赤褐色の胞子堆を作り、光合成を低下させます。",
  },
  "Bệnh tạo vết cháy dài hình thuyền trên lá ngô, nặng hơn trong điều kiện ẩm mát.": {
    vi: "Bệnh tạo vết cháy dài hình thuyền trên lá ngô, nặng hơn trong điều kiện ẩm mát.",
    en: "Northern leaf blight creates long boat-shaped lesions and worsens in cool, humid conditions.",
    ja: "北方葉枯病は舟形の長い病斑を作り、低温多湿で悪化します。",
  },
  "Thối đen trên nho có thể gây đốm lá và làm quả khô đen, ảnh hưởng lớn đến chất lượng.": {
    vi: "Thối đen trên nho có thể gây đốm lá và làm quả khô đen, ảnh hưởng lớn đến chất lượng.",
    en: "Grape black rot causes leaf spots and black shriveled fruit, strongly affecting quality.",
    ja: "ブドウ黒腐病は葉斑と黒く萎縮した果実を生じ、品質に大きく影響します。",
  },
  "Esca là nhóm bệnh nghiêm trọng trên nho, liên quan bệnh gỗ và suy kiệt toàn cây.": {
    vi: "Esca là nhóm bệnh nghiêm trọng trên nho, liên quan bệnh gỗ và suy kiệt toàn cây.",
    en: "Esca is a serious grapevine trunk disease complex associated with whole-plant decline.",
    ja: "エスカはブドウの重大な樹幹病害群で、株全体の衰弱に関係します。",
  },
  "Bệnh gây cháy lá trên nho, làm giảm diện tích quang hợp và sức sống của tán.": {
    vi: "Bệnh gây cháy lá trên nho, làm giảm diện tích quang hợp và sức sống của tán.",
    en: "This grape leaf blight reduces photosynthetic area and canopy vigor.",
    ja: "このブドウ葉枯病は光合成面積と樹冠の活力を低下させます。",
  },
  "HLB là bệnh nguy hiểm trên cây có múi, gây vàng lá lệch và suy giảm năng suất nghiêm trọng.": {
    vi: "HLB là bệnh nguy hiểm trên cây có múi, gây vàng lá lệch và suy giảm năng suất nghiêm trọng.",
    en: "HLB is a dangerous citrus disease that causes asymmetric yellowing and severe yield decline.",
    ja: "HLBは柑橘の危険な病害で、左右非対称の黄化と深刻な収量低下を起こします。",
  },
  "Đốm vi khuẩn trên đào gây tổn thương lá và quả, lan mạnh khi ẩm độ cao.": {
    vi: "Đốm vi khuẩn trên đào gây tổn thương lá và quả, lan mạnh khi ẩm độ cao.",
    en: "Bacterial spot on peach damages leaves and fruit and spreads rapidly in high humidity.",
    ja: "モモ細菌斑点病は葉と果実を傷め、高湿度で急速に広がります。",
  },
  "Đốm vi khuẩn trên ớt chuông gây vết sẫm màu trên lá và có thể lan nhanh khi thời tiết ẩm.": {
    vi: "Đốm vi khuẩn trên ớt chuông gây vết sẫm màu trên lá và có thể lan nhanh khi thời tiết ẩm.",
    en: "Bacterial spot on bell pepper creates dark leaf lesions and can spread quickly in humid weather.",
    ja: "ピーマン細菌斑点病は葉に暗色病斑を作り、湿潤時に急速に広がります。",
  },
  "Cháy lá sớm trên khoai tây tạo các đốm nâu có vòng đồng tâm và làm lá già khô nhanh.": {
    vi: "Cháy lá sớm trên khoai tây tạo các đốm nâu có vòng đồng tâm và làm lá già khô nhanh.",
    en: "Potato early blight forms brown concentric-ring spots and dries older leaves quickly.",
    ja: "ジャガイモ早疫病は同心円状の褐色斑を作り、古葉を早く枯らします。",
  },
  "Sương mai khoai tây là bệnh rất nguy hiểm, lan nhanh trong điều kiện mát ẩm.": {
    vi: "Sương mai khoai tây là bệnh rất nguy hiểm, lan nhanh trong điều kiện mát ẩm.",
    en: "Potato late blight is highly dangerous and spreads quickly in cool, wet conditions.",
    ja: "ジャガイモ疫病は非常に危険で、低温多湿条件で急速に広がります。",
  },
  "Model potato phân loại ảnh vào nhóm bệnh vi khuẩn; cần đối chiếu thêm triệu chứng trên lá, thân và củ.": {
    vi: "Model potato phân loại ảnh vào nhóm bệnh vi khuẩn; cần đối chiếu thêm triệu chứng trên lá, thân và củ.",
    en: "The potato model classified the image as a bacterial disease group; verify symptoms on leaves, stems, and tubers.",
    ja: "ジャガイモ専用モデルは画像を細菌病グループに分類しました。葉、茎、塊茎の症状を追加確認してください。",
  },
  "Model potato phân loại ảnh vào nhóm bệnh nấm; cần xác minh thêm dạng đốm, cháy lá hoặc lớp mốc.": {
    vi: "Model potato phân loại ảnh vào nhóm bệnh nấm; cần xác minh thêm dạng đốm, cháy lá hoặc lớp mốc.",
    en: "The potato model classified the image as a fungal disease group; verify spot pattern, blight, or mold.",
    ja: "ジャガイモ専用モデルは画像を菌性病害グループに分類しました。斑点型、葉枯れ、かびを追加確認してください。",
  },
  "Model potato phân loại ảnh vào nhóm Phytophthora, cần đặc biệt kiểm tra sương mai/cháy muộn trên khoai tây.": {
    vi: "Model potato phân loại ảnh vào nhóm Phytophthora, cần đặc biệt kiểm tra sương mai/cháy muộn trên khoai tây.",
    en: "The potato model classified the image as Phytophthora; carefully verify late blight symptoms on potato.",
    ja: "ジャガイモ専用モデルは画像をフィトフトラグループに分類しました。疫病・晩疫症状を重点確認してください。",
  },
  "Model potato phân loại ảnh vào nhóm virus; cần kiểm tra thêm triệu chứng khảm, xoăn lá hoặc cây còi cọc.": {
    vi: "Model potato phân loại ảnh vào nhóm virus; cần kiểm tra thêm triệu chứng khảm, xoăn lá hoặc cây còi cọc.",
    en: "The potato model classified the image as a virus group; check for mosaic, leaf curl, or stunting.",
    ja: "ジャガイモ専用モデルは画像をウイルスグループに分類しました。モザイク、巻葉、矮化を確認してください。",
  },
  "Cháy lá vi khuẩn sắn gây đốm úng nước, cháy lá, thâm gân và có thể lan nhanh sau mưa gió.": {
    vi: "Cháy lá vi khuẩn sắn gây đốm úng nước, cháy lá, thâm gân và có thể lan nhanh sau mưa gió.",
    en: "Cassava bacterial blight causes water-soaked spots, leaf blight, vein darkening, and rapid spread after wind-driven rain.",
    ja: "キャッサバ細菌性葉枯病は水浸状斑、葉枯れ、葉脈の黒変を起こし、風雨後に急速に広がります。",
  },
  "Bệnh sọc nâu sắn có thể làm lá loang vàng, thân có vệt nâu và củ hoại tử nâu, gây mất năng suất lớn.": {
    vi: "Bệnh sọc nâu sắn có thể làm lá loang vàng, thân có vệt nâu và củ hoại tử nâu, gây mất năng suất lớn.",
    en: "Cassava brown streak can cause yellow leaf mottling, brown stem streaks, brown root necrosis, and major yield loss.",
    ja: "キャッサバ褐色条斑病は葉の黄斑、茎の褐色条斑、根の褐色壊死を起こし、大きな減収につながります。",
  },
  "Đốm xanh lá sắn gây mảng xanh loang hoặc khảm nhẹ trên lá, cần phân biệt với stress dinh dưỡng.": {
    vi: "Đốm xanh lá sắn gây mảng xanh loang hoặc khảm nhẹ trên lá, cần phân biệt với stress dinh dưỡng.",
    en: "Cassava green mottle causes green mottling or mild mosaic on leaves and should be separated from nutrient stress.",
    ja: "キャッサバ緑斑病は葉に緑色の斑や軽いモザイクを生じ、栄養ストレスとの判別が必要です。",
  },
  "Bệnh khảm lá sắn gây khảm xanh vàng, xoăn biến dạng lá và có thể làm cây còi cọc.": {
    vi: "Bệnh khảm lá sắn gây khảm xanh vàng, xoăn biến dạng lá và có thể làm cây còi cọc.",
    en: "Cassava mosaic disease causes green-yellow mosaic, curled distorted leaves, and stunting.",
    ja: "キャッサバモザイク病は緑黄色モザイク、巻葉・変形、矮化を起こします。",
  },
  "Cháy lá dâu tây gây khô mép lá, cần phân biệt với stress môi trường hoặc dinh dưỡng.": {
    vi: "Cháy lá dâu tây gây khô mép lá, cần phân biệt với stress môi trường hoặc dinh dưỡng.",
    en: "Strawberry leaf scorch dries leaf edges and should be separated from environmental or nutritional stress.",
    ja: "イチゴ葉焼けは葉縁を乾かし、環境・栄養ストレスとの判別が必要です。",
  },
  "Mốc lá cà chua gây vàng mặt trên lá và lớp mốc ở mặt dưới trong điều kiện ẩm cao.": {
    vi: "Mốc lá cà chua gây vàng mặt trên lá và lớp mốc ở mặt dưới trong điều kiện ẩm cao.",
    en: "Tomato leaf mold yellows the upper leaf surface and forms mold underneath in humid conditions.",
    ja: "トマト葉かび病は高湿度で葉表を黄化させ、葉裏にかびを形成します。",
  },
  "Đốm lá Septoria tạo nhiều chấm nhỏ xám nâu, có thể làm rụng lá hàng loạt.": {
    vi: "Đốm lá Septoria tạo nhiều chấm nhỏ xám nâu, có thể làm rụng lá hàng loạt.",
    en: "Septoria leaf spot creates many small gray-brown spots and can cause heavy defoliation.",
    ja: "セプトリア葉斑病は小さな灰褐色斑を多数作り、大量落葉を起こすことがあります。",
  },
  "Nhện đỏ hai chấm làm lá có chấm vàng li ti, bạc lá và có thể xuất hiện tơ mịn.": {
    vi: "Nhện đỏ hai chấm làm lá có chấm vàng li ti, bạc lá và có thể xuất hiện tơ mịn.",
    en: "Two-spotted spider mites cause tiny yellow specks, leaf bronzing, and fine webbing.",
    ja: "ナミハダニは葉に細かな黄点、白化・褐変、細い糸を発生させます。",
  },
  "Đốm vòng cà chua gây tổn thương tròn hoặc bất định, làm vàng và rụng lá.": {
    vi: "Đốm vòng cà chua gây tổn thương tròn hoặc bất định, làm vàng và rụng lá.",
    en: "Tomato target spot causes round or irregular lesions, yellowing, and leaf drop.",
    ja: "トマト輪紋病は円形または不整形病斑、黄化、落葉を起こします。",
  },
  "Virus xoăn vàng lá làm lá non vàng xoăn, cây còi cọc và giảm đậu trái mạnh.": {
    vi: "Virus xoăn vàng lá làm lá non vàng xoăn, cây còi cọc và giảm đậu trái mạnh.",
    en: "Yellow leaf curl virus curls and yellows young leaves, stunts plants, and greatly reduces fruit set.",
    ja: "黄化葉巻ウイルスは若葉を黄化・巻葉させ、矮化と着果低下を引き起こします。",
  },
  "Virus khảm tạo vân xanh vàng loang lổ, lá biến dạng và làm giảm năng suất.": {
    vi: "Virus khảm tạo vân xanh vàng loang lổ, lá biến dạng và làm giảm năng suất.",
    en: "Mosaic virus causes green-yellow mottling, leaf distortion, and yield loss.",
    ja: "モザイクウイルスは緑黄色の斑、葉の変形、収量低下を起こします。",
  },

  "Tỉa bỏ lá và quả có vết ghẻ nặng": { vi: "Tỉa bỏ lá và quả có vết ghẻ nặng", en: "Prune leaves and fruit with severe scab", ja: "重度の黒星病斑がある葉と果実を除去" },
  "Cắt bỏ lá, quả hoặc cành có mô thối đen": { vi: "Cắt bỏ lá, quả hoặc cành có mô thối đen", en: "Cut off leaves, fruit, or branches with black rot tissue", ja: "黒腐れ組織のある葉・果実・枝を切除" },
  "Tỉa bỏ lá phủ phấn trắng nặng": { vi: "Tỉa bỏ lá phủ phấn trắng nặng", en: "Remove leaves heavily covered with powdery mildew", ja: "うどんこ病が重い葉を除去" },
  "Loại bỏ lá hoặc quả có đốm vi khuẩn nặng": { vi: "Loại bỏ lá hoặc quả có đốm vi khuẩn nặng", en: "Remove leaves or fruit with severe bacterial spots", ja: "細菌斑点が重い葉や果実を除去" },
  "Tỉa bỏ lá già có đốm vòng đồng tâm": { vi: "Tỉa bỏ lá già có đốm vòng đồng tâm", en: "Remove older leaves with concentric ring spots", ja: "同心円状斑のある古葉を除去" },
  "Cách ly và loại bỏ lá/thân bị sương mai nặng": { vi: "Cách ly và loại bỏ lá/thân bị sương mai nặng", en: "Isolate and remove leaves/stems severely affected by late blight", ja: "疫病が重い葉・茎を隔離して除去" },

  "Thu gom toàn bộ tàn dư bệnh ra khỏi vườn.": { vi: "Thu gom toàn bộ tàn dư bệnh ra khỏi vườn.", en: "Remove all diseased residue from the orchard.", ja: "病残渣をすべて園外へ持ち出します。" },
  "Đánh dấu các cây có vết bệnh lan nhanh để theo dõi riêng.": { vi: "Đánh dấu các cây có vết bệnh lan nhanh để theo dõi riêng.", en: "Mark plants with rapidly spreading lesions for separate monitoring.", ja: "病斑が急速に広がる株に印を付け、個別に観察します。" },
  "Tránh tưới phun mưa và giảm ẩm trên bề mặt lá/quả.": { vi: "Tránh tưới phun mưa và giảm ẩm trên bề mặt lá/quả.", en: "Avoid overhead irrigation and reduce moisture on leaf/fruit surfaces.", ja: "散水を避け、葉や果実表面の湿りを減らします。" },
  "Khử khuẩn kéo cắt sau khi xử lý từng cây bệnh.": { vi: "Khử khuẩn kéo cắt sau khi xử lý từng cây bệnh.", en: "Disinfect pruning shears after each diseased plant.", ja: "病株ごとに剪定ばさみを消毒します。" },
  "Kiểm tra vết mới sau mưa hoặc sương kéo dài.": { vi: "Kiểm tra vết mới sau mưa hoặc sương kéo dài.", en: "Check for new lesions after rain or prolonged dew.", ja: "雨や長時間の露の後に新しい病斑を確認します。" },
  "Tỉa tán và loại bỏ quả khô, cành chết còn treo trên cây.": { vi: "Tỉa tán và loại bỏ quả khô, cành chết còn treo trên cây.", en: "Prune the canopy and remove dried fruit and dead branches still hanging on the plant.", ja: "樹冠を剪定し、樹上に残る乾いた果実や枯れ枝を除去します。" },
  "Luân phiên hoạt chất nếu cần phun lặp lại.": { vi: "Luân phiên hoạt chất nếu cần phun lặp lại.", en: "Rotate active ingredients if repeat spraying is needed.", ja: "再散布が必要な場合は有効成分をローテーションします。" },
  "Loại bỏ nguồn bệnh nhìn thấy trước khi phun.": { vi: "Loại bỏ nguồn bệnh nhìn thấy trước khi phun.", en: "Remove visible infection sources before spraying.", ja: "散布前に目に見える感染源を除去します。" },
  "Dùng thuốc nấm theo nhãn, ưu tiên phun phòng trước giai đoạn ẩm kéo dài.": { vi: "Dùng thuốc nấm theo nhãn, ưu tiên phun phòng trước giai đoạn ẩm kéo dài.", en: "Use fungicide according to the label, prioritizing preventive sprays before prolonged wet periods.", ja: "ラベル通りに殺菌剤を使用し、長い湿潤期の前に予防散布を優先します。" },
  "Theo dõi quả non/lá non vì đây là nơi dễ phát sinh vết mới.": { vi: "Theo dõi quả non/lá non vì đây là nơi dễ phát sinh vết mới.", en: "Monitor young fruit and leaves because new lesions often start there.", ja: "新病斑が出やすい若い果実と葉を観察します。" },

  "Phun thuốc phòng trị ghẻ táo khi lá còn khô và không có mưa gần.": { vi: "Phun thuốc phòng trị ghẻ táo khi lá còn khô và không có mưa gần.", en: "Spray apple scab control while leaves are dry and no rain is expected soon.", ja: "葉が乾き、近い雨がない時にリンゴ黒星病防除剤を散布します。" },
  "Ghi lại khu vực có vết bệnh mới để so sánh sau 5-7 ngày.": { vi: "Ghi lại khu vực có vết bệnh mới để so sánh sau 5-7 ngày.", en: "Record zones with new lesions for comparison after 5-7 days.", ja: "新しい病斑のある区域を記録し、5〜7日後に比較します。" },
  "Lặp lại theo nhãn nếu còn lá non mới nhiễm.": { vi: "Lặp lại theo nhãn nếu còn lá non mới nhiễm.", en: "Repeat according to the label if newly infected young leaves remain.", ja: "若葉の新規感染が残る場合はラベルに従い再処理します。" },
  "Tỉa cành sau vụ để giảm ẩm trong tán.": { vi: "Tỉa cành sau vụ để giảm ẩm trong tán.", en: "Prune after the season to reduce humidity inside the canopy.", ja: "作期後に剪定し、樹冠内湿度を下げます。" },
  "Xác nhận vết ghẻ dạng mảng sẫm, nhám trên lá hoặc quả táo.": { vi: "Xác nhận vết ghẻ dạng mảng sẫm, nhám trên lá hoặc quả táo.", en: "Confirm dark, rough scab patches on apple leaves or fruit.", ja: "リンゴの葉や果実に暗色でざらつく黒星病斑があるか確認します。" },
  "Loại bỏ phần bệnh nặng và vệ sinh nền vườn.": { vi: "Loại bỏ phần bệnh nặng và vệ sinh nền vườn.", en: "Remove heavily diseased parts and clean the orchard floor.", ja: "重症部位を除去し、園地の地表を清掃します。" },
  "Phun thuốc trị nấm phù hợp, phủ đều tán nhưng tránh chảy rửa.": { vi: "Phun thuốc trị nấm phù hợp, phủ đều tán nhưng tránh chảy rửa.", en: "Apply a suitable fungicide with even canopy coverage while avoiding runoff.", ja: "適切な殺菌剤を樹冠に均一散布し、流亡を避けます。" },
  "Luân phiên hoạt chất ở lần xử lý sau để giảm kháng thuốc.": { vi: "Luân phiên hoạt chất ở lần xử lý sau để giảm kháng thuốc.", en: "Rotate the active ingredient at the next treatment to reduce resistance risk.", ja: "次回処理では有効成分を変え、耐性リスクを下げます。" },

  "Xác nhận đốm vàng cam trên lá táo và kiểm tra cây ký chủ phụ gần vườn.": { vi: "Xác nhận đốm vàng cam trên lá táo và kiểm tra cây ký chủ phụ gần vườn.", en: "Confirm orange-yellow apple leaf spots and check alternate hosts near the orchard.", ja: "リンゴ葉の橙黄色斑を確認し、園地周辺の中間宿主を調べます。" },
  "Tỉa lá/cành nhiễm nặng nếu mật độ còn thấp.": { vi: "Tỉa lá/cành nhiễm nặng nếu mật độ còn thấp.", en: "Prune heavily infected leaves/branches if incidence is still low.", ja: "発生が少ないうちに重症の葉や枝を剪除します。" },
  "Không tưới ướt tán trong giai đoạn bệnh đang lan.": { vi: "Không tưới ướt tán trong giai đoạn bệnh đang lan.", en: "Do not wet the canopy while the disease is spreading.", ja: "病害が広がっている間は樹冠を濡らさないようにします。" },
  "Phun thuốc trị gỉ sắt cho táo theo nhãn, ưu tiên sáng sớm khô ráo.": { vi: "Phun thuốc trị gỉ sắt cho táo theo nhãn, ưu tiên sáng sớm khô ráo.", en: "Spray apple rust control according to the label, preferably during a dry early morning.", ja: "乾いた早朝を優先し、ラベル通りにリンゴ赤星病防除剤を散布します。" },
  "Khảo sát cây bách/xù gần vườn vì có thể là nguồn bệnh.": { vi: "Khảo sát cây bách/xù gần vườn vì có thể là nguồn bệnh.", en: "Inspect cedar/juniper near the orchard because they may be infection sources.", ja: "感染源となる可能性がある園地周辺のヒノキ・ビャクシン類を調査します。" },
  "Ghi nhận tỷ lệ lá nhiễm ở từng cây.": { vi: "Ghi nhận tỷ lệ lá nhiễm ở từng cây.", en: "Record the infected leaf percentage on each tree.", ja: "各樹の感染葉率を記録します。" },
  "Theo dõi lá non sau 5-7 ngày.": { vi: "Theo dõi lá non sau 5-7 ngày.", en: "Check young leaves after 5-7 days.", ja: "5〜7日後に若葉を確認します。" },
  "Tỉa thông thoáng tán táo sau đợt bệnh.": { vi: "Tỉa thông thoáng tán táo sau đợt bệnh.", en: "Open the apple canopy after the disease wave.", ja: "発病後にリンゴ樹冠を剪定して通気を改善します。" },
  "Lập kế hoạch phun phòng vào mùa bệnh năm sau nếu vườn có lịch sử gỉ sắt.": { vi: "Lập kế hoạch phun phòng vào mùa bệnh năm sau nếu vườn có lịch sử gỉ sắt.", en: "Plan preventive spraying next disease season if the orchard has rust history.", ja: "赤星病履歴がある園では翌年の発病期に予防散布を計画します。" },

  "Đánh dấu cây nho nghi Esca và kiểm tra triệu chứng trên thân/cành.": { vi: "Đánh dấu cây nho nghi Esca và kiểm tra triệu chứng trên thân/cành.", en: "Mark grapevines suspected of Esca and inspect trunk/branch symptoms.", ja: "エスカ疑いのブドウに印を付け、幹や枝の症状を確認します。" },
  "Không cắt tỉa mạnh khi dụng cụ chưa được khử khuẩn.": { vi: "Không cắt tỉa mạnh khi dụng cụ chưa được khử khuẩn.", en: "Do not prune heavily before tools are disinfected.", ja: "道具を消毒する前に強い剪定を行いません。" },
  "Loại bỏ cành chết nặng theo từng cây và thu gom ra khỏi vườn.": { vi: "Loại bỏ cành chết nặng theo từng cây và thu gom ra khỏi vườn.", en: "Remove severely dead branches plant by plant and take them out of the vineyard.", ja: "株ごとに重度の枯れ枝を除去し、園外へ持ち出します。" },
  "Che/bảo vệ vết cắt lớn theo khuyến cáo địa phương.": { vi: "Che/bảo vệ vết cắt lớn theo khuyến cáo địa phương.", en: "Cover or protect large cuts according to local recommendations.", ja: "地域推奨に従い、大きな切り口を保護します。" },
  "Không kỳ vọng thuốc lá chữa được mô gỗ đã nhiễm nặng.": { vi: "Không kỳ vọng thuốc lá chữa được mô gỗ đã nhiễm nặng.", en: "Do not expect foliar sprays to cure severely infected woody tissue.", ja: "重症の木質部感染が葉面散布で治るとは考えないでください。" },
  "Theo dõi cây suy kiệt, cân nhắc loại bỏ cây nặng.": { vi: "Theo dõi cây suy kiệt, cân nhắc loại bỏ cây nặng.", en: "Monitor declining vines and consider removing severe plants.", ja: "衰弱株を観察し、重症株の除去を検討します。" },
  "Tỉa vào thời điểm khô ráo và quản lý vết thương.": { vi: "Tỉa vào thời điểm khô ráo và quản lý vết thương.", en: "Prune during dry weather and manage wounds.", ja: "乾燥した時期に剪定し、傷口を管理します。" },
  "Ghi hồ sơ cây bệnh để quyết định cải tạo vườn.": { vi: "Ghi hồ sơ cây bệnh để quyết định cải tạo vườn.", en: "Keep records of diseased vines to guide vineyard renovation decisions.", ja: "病株記録を残し、園地更新の判断に使います。" },

  "Tỉa bỏ lá nho cháy nặng và dọn lá rụng.": { vi: "Tỉa bỏ lá nho cháy nặng và dọn lá rụng.", en: "Remove severely blighted grape leaves and clean fallen leaves.", ja: "重度に枯れたブドウ葉を除去し、落葉を片付けます。" },
  "Phun thuốc trị nấm lá nho nếu vết cháy tiếp tục lan.": { vi: "Phun thuốc trị nấm lá nho nếu vết cháy tiếp tục lan.", en: "Spray grape leaf fungicide if blight lesions continue spreading.", ja: "葉枯れが広がる場合はブドウ葉用殺菌剤を散布します。" },
  "Phủ đều tán dưới vì mầm bệnh thường tồn trên lá rụng.": { vi: "Phủ đều tán dưới vì mầm bệnh thường tồn trên lá rụng.", en: "Cover the lower canopy well because pathogens often persist on fallen leaves.", ja: "病原菌は落葉に残りやすいため、下層樹冠を均一に処理します。" },
  "Ghi lại vị trí vườn bị cháy lá nhiều.": { vi: "Ghi lại vị trí vườn bị cháy lá nhiều.", en: "Record vineyard zones with heavy leaf blight.", ja: "葉枯れが多い園内区域を記録します。" },
  "Kiểm tra lá mới sau 5 ngày.": { vi: "Kiểm tra lá mới sau 5 ngày.", en: "Check new leaves after 5 days.", ja: "5日後に新葉を確認します。" },
  "Thu gom lá rụng định kỳ.": { vi: "Thu gom lá rụng định kỳ.", en: "Collect fallen leaves regularly.", ja: "落葉を定期的に回収します。" },
  "Luân phiên hoạt chất ở lần xử lý tiếp theo.": { vi: "Luân phiên hoạt chất ở lần xử lý tiếp theo.", en: "Rotate active ingredients at the next treatment.", ja: "次回処理では有効成分をローテーションします。" },

  "Báo kỹ thuật viên hoặc cơ quan BVTV địa phương nếu nghi HLB nặng.": { vi: "Báo kỹ thuật viên hoặc cơ quan BVTV địa phương nếu nghi HLB nặng.", en: "Notify a technician or local plant protection office if severe HLB is suspected.", ja: "重度HLBが疑われる場合は技術者または地域の植物防疫機関へ連絡します。" },
  "Quản lý rầy chổng cánh theo nhãn và bảo vệ thiên địch.": { vi: "Quản lý rầy chổng cánh theo nhãn và bảo vệ thiên địch.", en: "Manage citrus psyllids according to the label while protecting beneficial insects.", ja: "ラベルに従ってミカンキジラミを管理し、天敵を保護します。" },
  "Cách ly dụng cụ, không di chuyển vật liệu cây bệnh.": { vi: "Cách ly dụng cụ, không di chuyển vật liệu cây bệnh.", en: "Isolate tools and do not move diseased plant material.", ja: "道具を分け、病植物材料を移動しません。" },
  "Loại bỏ cây nhiễm nặng theo hướng dẫn địa phương.": { vi: "Loại bỏ cây nhiễm nặng theo hướng dẫn địa phương.", en: "Remove severely infected trees according to local guidance.", ja: "地域指導に従い重症樹を除去します。" },
  "Dùng cây giống sạch bệnh cho trồng mới.": { vi: "Dùng cây giống sạch bệnh cho trồng mới.", en: "Use disease-free nursery stock for replanting.", ja: "新植には無病苗を使用します。" },

  "Khử khuẩn tay và dụng cụ khi chuyển giữa cây bệnh và cây khỏe.": { vi: "Khử khuẩn tay và dụng cụ khi chuyển giữa cây bệnh và cây khỏe.", en: "Disinfect hands and tools when moving between diseased and healthy plants.", ja: "病株と健全株の間を移動する際は手と道具を消毒します。" },
  "Kiểm tra nguồn nước/tàn dư vì vi khuẩn lây mạnh qua giọt bắn.": { vi: "Kiểm tra nguồn nước/tàn dư vì vi khuẩn lây mạnh qua giọt bắn.", en: "Check water sources and residue because bacteria spread strongly through splash.", ja: "細菌は水はねで広がりやすいため、水源と残渣を確認します。" },
  "Theo dõi đốm mới sau mưa.": { vi: "Theo dõi đốm mới sau mưa.", en: "Monitor new spots after rain.", ja: "雨後に新しい斑点を観察します。" },
  "Luân phiên hoặc phối hợp theo nhãn để giảm kháng đồng.": { vi: "Luân phiên hoặc phối hợp theo nhãn để giảm kháng đồng.", en: "Rotate or combine products according to the label to reduce copper resistance.", ja: "銅剤耐性を下げるため、ラベルに従ってローテーションまたは組み合わせます。" },

  "Phủ đều lá tầng dưới vì bệnh thường bắt đầu từ lá già.": { vi: "Phủ đều lá tầng dưới vì bệnh thường bắt đầu từ lá già.", en: "Cover lower leaves well because the disease usually starts on older leaves.", ja: "病害は古葉から始まりやすいため、下層葉を均一に処理します。" },
  "Luân phiên nhóm thuốc nếu cần lặp lại.": { vi: "Luân phiên nhóm thuốc nếu cần lặp lại.", en: "Rotate chemical groups if repeat treatment is needed.", ja: "再処理が必要な場合は薬剤グループをローテーションします。" },
  "Dọn tàn dư sau vụ và luân canh cây khác họ.": { vi: "Dọn tàn dư sau vụ và luân canh cây khác họ.", en: "Clean residue after the season and rotate with crops from another family.", ja: "作期後に残渣を片付け、別科作物で輪作します。" },

  "Không để tàn dư bệnh tiếp xúc cây khỏe.": { vi: "Không để tàn dư bệnh tiếp xúc cây khỏe.", en: "Do not let diseased residue touch healthy plants.", ja: "病残渣を健全株に触れさせません。" },
  "Theo dõi dự báo mưa, sương và nhiệt độ mát.": { vi: "Theo dõi dự báo mưa, sương và nhiệt độ mát.", en: "Monitor forecasts for rain, dew, and cool temperatures.", ja: "雨、露、低温の予報を確認します。" },
  "Luân phiên hoạt chất chống Phytophthora theo nhãn.": { vi: "Luân phiên hoạt chất chống Phytophthora theo nhãn.", en: "Rotate Phytophthora-targeting actives according to the label.", ja: "ラベルに従いフィトフトラ向け有効成分をローテーションします。" },
  "Tiêu hủy cây/bộ phận nhiễm nặng, không ủ tươi trong vườn.": { vi: "Tiêu hủy cây/bộ phận nhiễm nặng, không ủ tươi trong vườn.", en: "Destroy severely infected plants/parts and do not fresh-compost them in the garden.", ja: "重症株・部位を処分し、園内で生のまま堆肥化しません。" },

  "Khử khuẩn dụng cụ, tránh làm lan qua nước tưới.": { vi: "Khử khuẩn dụng cụ, tránh làm lan qua nước tưới.", en: "Disinfect tools and avoid spread through irrigation water.", ja: "道具を消毒し、灌水で広がらないようにします。" },
  "Xử lý cục bộ bằng sản phẩm vi khuẩn được phép nếu triệu chứng còn sớm.": { vi: "Xử lý cục bộ bằng sản phẩm vi khuẩn được phép nếu triệu chứng còn sớm.", en: "Treat locally with an approved bactericide if symptoms are still early.", ja: "初期症状なら認可された細菌病対策資材で局所処理します。" },
  "Kiểm tra củ giống, loại bỏ củ có mùi thối hoặc dịch nhớt.": { vi: "Kiểm tra củ giống, loại bỏ củ có mùi thối hoặc dịch nhớt.", en: "Inspect seed tubers and discard any with rot odor or slimy ooze.", ja: "種いもを確認し、腐敗臭や粘液のあるものを除去します。" },

  "Giảm ẩm tán, không tưới phun cuối ngày.": { vi: "Giảm ẩm tán, không tưới phun cuối ngày.", en: "Reduce canopy humidity and avoid overhead irrigation late in the day.", ja: "樹冠湿度を下げ、夕方以降の散水を避けます。" },
  "Bảo vệ lá non và lá quanh tán giữa.": { vi: "Bảo vệ lá non và lá quanh tán giữa.", en: "Protect young leaves and leaves in the middle canopy.", ja: "若葉と中層の葉を保護します。" },
  "Ghi nhận thời tiết ẩm/mưa gần đây.": { vi: "Ghi nhận thời tiết ẩm/mưa gần đây.", en: "Record recent humid or rainy weather.", ja: "最近の湿潤・降雨条件を記録します。" },
  "Tái kiểm tra sau 5 ngày.": { vi: "Tái kiểm tra sau 5 ngày.", en: "Recheck after 5 days.", ja: "5日後に再確認します。" },
  "Luân phiên thuốc tiếp xúc và nội hấp nếu cần.": { vi: "Luân phiên thuốc tiếp xúc và nội hấp nếu cần.", en: "Rotate contact and systemic products if needed.", ja: "必要に応じて接触剤と浸透移行性剤をローテーションします。" },
  "Dọn tàn dư sau vụ.": { vi: "Dọn tàn dư sau vụ.", en: "Clean residue after the season.", ja: "作期後に残渣を片付けます。" },

  "Loại bỏ cây nhiễm nặng nếu tỷ lệ thấp và còn sớm.": { vi: "Loại bỏ cây nhiễm nặng nếu tỷ lệ thấp và còn sớm.", en: "Remove severely infected plants if incidence is low and early.", ja: "発生が少なく初期なら重症株を除去します。" },
  "Quản lý côn trùng môi giới theo nhãn.": { vi: "Quản lý côn trùng môi giới theo nhãn.", en: "Manage vector insects according to the label.", ja: "ラベルに従い媒介昆虫を管理します。" },
  "Vệ sinh dụng cụ và cỏ dại/ký chủ phụ quanh lô.": { vi: "Vệ sinh dụng cụ và cỏ dại/ký chủ phụ quanh lô.", en: "Sanitize tools and manage weeds/alternate hosts around the plot.", ja: "道具を衛生管理し、圃場周辺の雑草・副宿主を管理します。" },
  "Theo dõi cây lân cận trong 7-10 ngày.": { vi: "Theo dõi cây lân cận trong 7-10 ngày.", en: "Monitor neighboring plants for 7-10 days.", ja: "周辺株を7〜10日間観察します。" },
  "Sử dụng giống sạch bệnh hoặc chống chịu ở vụ sau.": { vi: "Sử dụng giống sạch bệnh hoặc chống chịu ở vụ sau.", en: "Use disease-free or tolerant varieties next season.", ja: "次作では無病または抵抗性品種を使用します。" },
  "Không vận chuyển vật liệu giống từ lô bệnh sang lô sạch.": { vi: "Không vận chuyển vật liệu giống từ lô bệnh sang lô sạch.", en: "Do not move propagation material from diseased plots to clean plots.", ja: "病区から健全区へ繁殖材料を移動しません。" },

  "Phun sản phẩm gốc đồng nếu bệnh còn ở tán lá và điều kiện cho phép.": { vi: "Phun sản phẩm gốc đồng nếu bệnh còn ở tán lá và điều kiện cho phép.", en: "Spray a copper product if disease is still in the canopy and conditions allow.", ja: "病害がまだ葉群にあり条件が許せば銅剤を散布します。" },
  "Giảm lây lan qua nước mưa, dọn tàn dư bệnh.": { vi: "Giảm lây lan qua nước mưa, dọn tàn dư bệnh.", en: "Reduce rain-splash spread and remove diseased residue.", ja: "雨水による拡散を減らし、病残渣を除去します。" },
  "Kiểm tra vết thâm gân, cháy lá sau mưa gió.": { vi: "Kiểm tra vết thâm gân, cháy lá sau mưa gió.", en: "Check vein darkening and leaf blight after windy rain.", ja: "風雨後に葉脈黒変と葉枯れを確認します。" },
  "Theo dõi lộc mới trong 7 ngày.": { vi: "Theo dõi lộc mới trong 7 ngày.", en: "Monitor new shoots for 7 days.", ja: "新梢を7日間観察します。" },
  "Dùng hom giống sạch bệnh cho vụ sau.": { vi: "Dùng hom giống sạch bệnh cho vụ sau.", en: "Use disease-free cuttings next season.", ja: "次作では無病の挿し穂を使用します。" },
  "Luân canh và vệ sinh đồng ruộng.": { vi: "Luân canh và vệ sinh đồng ruộng.", en: "Rotate crops and sanitize the field.", ja: "輪作し、圃場を衛生管理します。" },

  "Đánh dấu cây biểu hiện rõ để theo dõi.": { vi: "Đánh dấu cây biểu hiện rõ để theo dõi.", en: "Mark clearly symptomatic plants for monitoring.", ja: "明確な症状株に印を付けて観察します。" },
  "Kiểm tra côn trùng chích hút quanh lô.": { vi: "Kiểm tra côn trùng chích hút quanh lô.", en: "Check sucking insects around the plot.", ja: "圃場周辺の吸汁性昆虫を確認します。" },
  "Vệ sinh cỏ dại quanh lô sắn.": { vi: "Vệ sinh cỏ dại quanh lô sắn.", en: "Clear weeds around the cassava plot.", ja: "キャッサバ圃場周辺の雑草を除去します。" },
  "Ghi nhận khu vực lặp lại triệu chứng để điều tra nguồn giống.": { vi: "Ghi nhận khu vực lặp lại triệu chứng để điều tra nguồn giống.", en: "Record recurring symptom zones to investigate planting material sources.", ja: "症状が繰り返す区域を記録し、種苗由来を調査します。" },

  "Tỉa lá cháy nặng, tránh để lá bệnh chạm quả.": { vi: "Tỉa lá cháy nặng, tránh để lá bệnh chạm quả.", en: "Remove severely scorched leaves and keep diseased leaves from touching fruit.", ja: "重度の葉焼け葉を除去し、病葉が果実に触れないようにします。" },
  "Phun thuốc nấm nếu có đốm/cháy lan trong điều kiện ẩm.": { vi: "Phun thuốc nấm nếu có đốm/cháy lan trong điều kiện ẩm.", en: "Spray fungicide if spots/blight spread under humid conditions.", ja: "湿潤条件で斑点や葉枯れが広がる場合は殺菌剤を散布します。" },
  "Bổ sung che nhẹ nếu cháy do stress nắng.": { vi: "Bổ sung che nhẹ nếu cháy do stress nắng.", en: "Add light shading if scorch is caused by sun stress.", ja: "日射ストレスによる葉焼けなら軽い遮光を追加します。" },
  "Kiểm tra EC/pH giá thể hoặc đất.": { vi: "Kiểm tra EC/pH giá thể hoặc đất.", en: "Check EC/pH of the substrate or soil.", ja: "培地または土壌のEC/pHを確認します。" },
  "Ổn định tưới và dinh dưỡng canxi-kali.": { vi: "Ổn định tưới và dinh dưỡng canxi-kali.", en: "Stabilize irrigation and calcium-potassium nutrition.", ja: "灌水とカルシウム・カリウム栄養を安定させます。" },

  "Không tưới phun lên lá.": { vi: "Không tưới phun lên lá.", en: "Do not spray water onto leaves.", ja: "葉に散水しません。" },
  "Phun thuốc trị mốc lá khi mặt dưới lá còn có lớp mốc đang lan.": { vi: "Phun thuốc trị mốc lá khi mặt dưới lá còn có lớp mốc đang lan.", en: "Spray leaf mold treatment while mold is still spreading on leaf undersides.", ja: "葉裏のかびが広がっている間に葉かび病防除剤を散布します。" },
  "Tập trung mặt dưới lá và khu vực tán rậm.": { vi: "Tập trung mặt dưới lá và khu vực tán rậm.", en: "Focus on leaf undersides and dense canopy zones.", ja: "葉裏と込み合った葉群を重点処理します。" },
  "Giảm mật độ lá bằng tỉa hợp lý.": { vi: "Giảm mật độ lá bằng tỉa hợp lý.", en: "Reduce leaf density with proper pruning.", ja: "適切な剪葉で葉の密度を下げます。" },
  "Duy trì ẩm độ thấp hơn trong nhà màng.": { vi: "Duy trì ẩm độ thấp hơn trong nhà màng.", en: "Keep humidity lower inside the greenhouse.", ja: "ハウス内湿度を低めに維持します。" },

  "Dọn lá rụng và tàn dư quanh gốc.": { vi: "Dọn lá rụng và tàn dư quanh gốc.", en: "Remove fallen leaves and residue around the base.", ja: "株元の落葉と残渣を除去します。" },
  "Phun thuốc trị Septoria nếu đốm lan nhanh sau mưa.": { vi: "Phun thuốc trị Septoria nếu đốm lan nhanh sau mưa.", en: "Spray Septoria treatment if spots spread quickly after rain.", ja: "雨後に斑点が急速に広がる場合はセプトリア防除剤を散布します。" },
  "Phủ đều lá tầng dưới và giữa.": { vi: "Phủ đều lá tầng dưới và giữa.", en: "Cover lower and middle leaves evenly.", ja: "下層と中層の葉を均一に処理します。" },
  "Bổ sung lớp phủ gốc để giảm bắn đất.": { vi: "Bổ sung lớp phủ gốc để giảm bắn đất.", en: "Add mulch at the base to reduce soil splash.", ja: "土の跳ね返りを減らすため株元にマルチを追加します。" },
  "Tỉa lá già định kỳ.": { vi: "Tỉa lá già định kỳ.", en: "Remove old leaves regularly.", ja: "古葉を定期的に除去します。" },
  "Luân canh cây khác họ cà ở vụ sau.": { vi: "Luân canh cây khác họ cà ở vụ sau.", en: "Rotate with non-solanaceous crops next season.", ja: "次作はナス科以外の作物で輪作します。" },

  "Tách cây nhiễm nặng, cắt bỏ lá bạc vàng nhiều.": { vi: "Tách cây nhiễm nặng, cắt bỏ lá bạc vàng nhiều.", en: "Separate heavily infested plants and remove heavily bronzed/yellowed leaves.", ja: "重度被害株を分け、白化・黄化の強い葉を除去します。" },
  "Tăng ẩm không khí hợp lý nhưng tránh làm bùng bệnh nấm.": { vi: "Tăng ẩm không khí hợp lý nhưng tránh làm bùng bệnh nấm.", en: "Increase air humidity moderately while avoiding fungal flare-ups.", ja: "菌病を助長しない範囲で空中湿度を適度に上げます。" },
  "Không dùng thuốc trừ sâu phổ rộng làm chết thiên địch nếu không cần.": { vi: "Không dùng thuốc trừ sâu phổ rộng làm chết thiên địch nếu không cần.", en: "Avoid broad-spectrum insecticides that kill beneficials unless necessary.", ja: "必要がなければ天敵を殺す広範囲殺虫剤を避けます。" },
  "Lặp kiểm tra sau 48 giờ vì trứng có thể nở tiếp.": { vi: "Lặp kiểm tra sau 48 giờ vì trứng có thể nở tiếp.", en: "Recheck after 48 hours because eggs may continue hatching.", ja: "卵が続けて孵化する可能性があるため48時間後に再確認します。" },
  "Luân phiên nhóm thuốc trừ nhện để tránh kháng.": { vi: "Luân phiên nhóm thuốc trừ nhện để tránh kháng.", en: "Rotate miticide groups to avoid resistance.", ja: "抵抗性回避のため殺ダニ剤グループをローテーションします。" },
  "Theo dõi điểm nóng ở mép luống/nhà màng.": { vi: "Theo dõi điểm nóng ở mép luống/nhà màng.", en: "Monitor hotspots at bed or greenhouse edges.", ja: "畝端やハウス端の発生集中部を観察します。" },
  "Dọn cỏ ký chủ quanh vườn.": { vi: "Dọn cỏ ký chủ quanh vườn.", en: "Remove host weeds around the garden.", ja: "園地周辺の宿主雑草を除去します。" },

  "Giảm ẩm tán và dọn lá bệnh rụng.": { vi: "Giảm ẩm tán và dọn lá bệnh rụng.", en: "Reduce canopy humidity and clean fallen diseased leaves.", ja: "樹冠湿度を下げ、落ちた病葉を片付けます。" },
  "Tránh tưới phun mưa trong thời gian bệnh đang phát triển.": { vi: "Tránh tưới phun mưa trong thời gian bệnh đang phát triển.", en: "Avoid overhead irrigation while the disease is developing.", ja: "病害進展中は散水を避けます。" },
  "Phun thuốc trị nấm đốm vòng khi bệnh lan ở tầng lá giữa.": { vi: "Phun thuốc trị nấm đốm vòng khi bệnh lan ở tầng lá giữa.", en: "Spray target spot fungicide when disease spreads in the middle canopy.", ja: "中層葉で輪紋病が広がる場合は殺菌剤を散布します。" },
  "Ghi nhận tỷ lệ lá nhiễm để quyết định lần xử lý sau.": { vi: "Ghi nhận tỷ lệ lá nhiễm để quyết định lần xử lý sau.", en: "Record infected leaf percentage to decide the next treatment.", ja: "次回処理判断のため感染葉率を記録します。" },
  "Tăng khoảng cách thông thoáng ở vụ sau.": { vi: "Tăng khoảng cách thông thoáng ở vụ sau.", en: "Increase spacing and airflow next season.", ja: "次作では株間と通気を改善します。" },

  "Tách hoặc loại bỏ cây nhiễm nặng nếu tỷ lệ còn thấp.": { vi: "Tách hoặc loại bỏ cây nhiễm nặng nếu tỷ lệ còn thấp.", en: "Separate or remove heavily infected plants if incidence remains low.", ja: "発生率が低いうちに重症株を隔離または除去します。" },
  "Quản lý bọ phấn theo nhãn, ưu tiên điểm nóng trong nhà màng/luống.": { vi: "Quản lý bọ phấn theo nhãn, ưu tiên điểm nóng trong nhà màng/luống.", en: "Manage whiteflies according to the label, prioritizing greenhouse/bed hotspots.", ja: "ラベルに従いコナジラミを管理し、ハウスや畝の発生集中部を優先します。" },
  "Không nhân giống hoặc giữ cây bệnh làm nguồn lây.": { vi: "Không nhân giống hoặc giữ cây bệnh làm nguồn lây.", en: "Do not propagate or keep diseased plants as infection sources.", ja: "病株を繁殖に使ったり感染源として残したりしません。" },
  "Theo dõi cây non lân cận trong 7 ngày.": { vi: "Theo dõi cây non lân cận trong 7 ngày.", en: "Monitor nearby young plants for 7 days.", ja: "周辺の若い株を7日間観察します。" },
  "Vệ sinh cỏ dại ký chủ phụ.": { vi: "Vệ sinh cỏ dại ký chủ phụ.", en: "Remove alternate-host weeds.", ja: "副宿主となる雑草を除去します。" },
  "Dùng giống chống chịu và lưới chắn côn trùng ở vụ sau.": { vi: "Dùng giống chống chịu và lưới chắn côn trùng ở vụ sau.", en: "Use tolerant varieties and insect netting next season.", ja: "次作では抵抗性品種と防虫ネットを使用します。" },

  "Không tiếp xúc cây khỏe ngay sau khi chạm cây nghi virus.": { vi: "Không tiếp xúc cây khỏe ngay sau khi chạm cây nghi virus.", en: "Do not touch healthy plants immediately after handling suspected virus plants.", ja: "ウイルス疑い株に触れた直後に健全株へ触れません。" },
  "Loại bỏ cây nhiễm nặng nếu nguồn lây còn khu trú.": { vi: "Loại bỏ cây nhiễm nặng nếu nguồn lây còn khu trú.", en: "Remove heavily infected plants if the infection source is still localized.", ja: "感染源が局所的なうちに重症株を除去します。" },
  "Vệ sinh khay, cọc, dây và dụng cụ.": { vi: "Vệ sinh khay, cọc, dây và dụng cụ.", en: "Sanitize trays, stakes, ties, and tools.", ja: "トレイ、支柱、紐、道具を衛生管理します。" },
  "Không dùng hạt/giống từ cây nghi bệnh.": { vi: "Không dùng hạt/giống từ cây nghi bệnh.", en: "Do not use seed or planting material from suspected plants.", ja: "疑わしい株の種子や苗を使いません。" },
  "Quản lý tàn dư và cỏ dại họ cà.": { vi: "Quản lý tàn dư và cỏ dại họ cà.", en: "Manage residue and solanaceous weeds.", ja: "残渣とナス科雑草を管理します。" },
  "Dùng giống sạch bệnh và quy trình vệ sinh tay/dụng cụ.": { vi: "Dùng giống sạch bệnh và quy trình vệ sinh tay/dụng cụ.", en: "Use disease-free seed and hand/tool sanitation procedures.", ja: "無病種苗と手・道具の衛生手順を使います。" },

  "Theo dõi riêng lô": { vi: "Theo dõi riêng lô", en: "Monitor this", ja: "この" },
  "này để tránh nhầm với cây trồng hoặc bệnh khác.": { vi: "này để tránh nhầm với cây trồng hoặc bệnh khác.", en: "plot separately to avoid confusing it with another crop or disease.", ja: "区画を別に観察し、別作物や別病害との混同を避けます。" },
  " cho ": { vi: " cho ", en: " for ", ja: "：対象 " },
  " bị ": { vi: " bị ", en: " with ", ja: "、病害 " },
};

const catalogTreatmentPatchText: LocalizedDictionary = {
  "Nấm Venturia": { vi: "Nấm Venturia", en: "Venturia fungus", ja: "ベンチュリア菌" },
  "Nấm": { vi: "Nấm", en: "Fungus", ja: "菌類" },
  "Nấm gỉ sắt": { vi: "Nấm gỉ sắt", en: "Rust fungus", ja: "さび病菌" },
  "Nấm phấn trắng": { vi: "Nấm phấn trắng", en: "Powdery mildew fungus", ja: "うどんこ病菌" },
  "Nấm Cercospora": { vi: "Nấm Cercospora", en: "Cercospora fungus", ja: "セルコスポラ菌" },
  "Tổ hợp nấm thân cành": { vi: "Tổ hợp nấm thân cành", en: "Trunk/branch fungal complex", ja: "幹枝病害菌群" },
  "Vi khuẩn và côn trùng môi giới": { vi: "Vi khuẩn và côn trùng môi giới", en: "Bacteria and vector insects", ja: "細菌と媒介昆虫" },
  "Vi khuẩn": { vi: "Vi khuẩn", en: "Bacteria", ja: "細菌" },
  "Nấm Alternaria": { vi: "Nấm Alternaria", en: "Alternaria fungus", ja: "アルタナリア菌" },
  "Giả nấm Phytophthora": { vi: "Giả nấm Phytophthora", en: "Phytophthora oomycete", ja: "フィトフトラ類" },
  "Virus và côn trùng môi giới": { vi: "Virus và côn trùng môi giới", en: "Virus and vector insects", ja: "ウイルスと媒介昆虫" },
  "Vi khuẩn Xanthomonas": { vi: "Vi khuẩn Xanthomonas", en: "Xanthomonas bacteria", ja: "キサントモナス細菌" },
  "Virus hoặc tác nhân gây khảm": { vi: "Virus hoặc tác nhân gây khảm", en: "Virus or mosaic-causing agent", ja: "ウイルスまたはモザイク原因因子" },
  "Virus khảm lá sắn": { vi: "Virus khảm lá sắn", en: "Cassava mosaic virus", ja: "キャッサバモザイクウイルス" },
  "Nấm hoặc stress sinh lý": { vi: "Nấm hoặc stress sinh lý", en: "Fungus or physiological stress", ja: "菌類または生理ストレス" },
  "Nấm Septoria": { vi: "Nấm Septoria", en: "Septoria fungus", ja: "セプトリア菌" },
  "Nhện hại": { vi: "Nhện hại", en: "Mite pest", ja: "ダニ害虫" },
  "Virus và bọ phấn trắng môi giới": { vi: "Virus và bọ phấn trắng môi giới", en: "Virus and whitefly vector", ja: "ウイルスとコナジラミ媒介" },
  "Virus khảm": { vi: "Virus khảm", en: "Mosaic virus", ja: "モザイクウイルス" },
  "Keo bảo vệ vết cắt": { vi: "Keo bảo vệ vết cắt", en: "Pruning wound sealant", ja: "剪定傷保護剤" },
  "Dầu khoáng / thuốc quản lý rầy": { vi: "Dầu khoáng / thuốc quản lý rầy", en: "Mineral oil / psyllid control product", ja: "マシン油／キジラミ管理剤" },
  "Dầu khoáng / thuốc quản lý môi giới": { vi: "Dầu khoáng / thuốc quản lý môi giới", en: "Mineral oil / vector management product", ja: "マシン油／媒介昆虫管理剤" },
  "Dinh dưỡng vi lượng / quản lý môi giới": { vi: "Dinh dưỡng vi lượng / quản lý môi giới", en: "Micronutrients / vector management", ja: "微量要素／媒介昆虫管理" },
  "Bẫy dính vàng": { vi: "Bẫy dính vàng", en: "Yellow sticky trap", ja: "黄色粘着板" },
  "Dầu khoáng / thuốc quản lý bọ phấn": { vi: "Dầu khoáng / thuốc quản lý bọ phấn", en: "Mineral oil / whitefly management product", ja: "マシン油／コナジラミ管理剤" },
  "Quản lý môi giới virus": { vi: "Quản lý môi giới virus", en: "Virus vector management", ja: "ウイルス媒介昆虫管理" },
  "Dung dịch khử khuẩn dụng cụ": { vi: "Dung dịch khử khuẩn dụng cụ", en: "Tool disinfectant solution", ja: "道具消毒液" },

  "Phun thuốc trị nấm cho Táo, tập trung vùng tán có vết bệnh mới.": { vi: "Phun thuốc trị nấm cho Táo, tập trung vùng tán có vết bệnh mới.", en: "Spray apple fungicide, focusing on canopy zones with new lesions.", ja: "リンゴに殺菌剤を散布し、新しい病斑がある樹冠部を重点処理します。" },
  "Phun thuốc trị nấm cho Nho, tập trung vùng tán có vết bệnh mới.": { vi: "Phun thuốc trị nấm cho Nho, tập trung vùng tán có vết bệnh mới.", en: "Spray grape fungicide, focusing on canopy zones with new lesions.", ja: "ブドウに殺菌剤を散布し、新しい病斑がある樹冠部を重点処理します。" },
  "Phân biệt thối đen trên Táo với cháy nắng hoặc tổn thương cơ học.": { vi: "Phân biệt thối đen trên Táo với cháy nắng hoặc tổn thương cơ học.", en: "Differentiate apple black rot from sunburn or mechanical injury.", ja: "リンゴ黒腐病を日焼けや機械的傷害と区別します。" },
  "Phân biệt thối đen trên Nho với cháy nắng hoặc tổn thương cơ học.": { vi: "Phân biệt thối đen trên Nho với cháy nắng hoặc tổn thương cơ học.", en: "Differentiate grape black rot from sunburn or mechanical injury.", ja: "ブドウ黒腐病を日焼けや機械的傷害と区別します。" },
  "Đối chiếu triệu chứng gỉ sắt táo trước khi dùng thuốc.": { vi: "Đối chiếu triệu chứng gỉ sắt táo trước khi dùng thuốc.", en: "Confirm apple rust symptoms before using chemicals.", ja: "薬剤使用前にリンゴ赤星病の症状を照合します。" },
  "Giảm nguồn bệnh và ẩm độ tán.": { vi: "Giảm nguồn bệnh và ẩm độ tán.", en: "Reduce infection sources and canopy humidity.", ja: "感染源と樹冠湿度を減らします。" },
  "Phun thuốc trị nấm gỉ sắt đúng liều.": { vi: "Phun thuốc trị nấm gỉ sắt đúng liều.", en: "Apply rust fungicide at the correct dose.", ja: "さび病用殺菌剤を適正量で散布します。" },
  "Theo dõi cây ký chủ phụ quanh vườn để giảm tái nhiễm.": { vi: "Theo dõi cây ký chủ phụ quanh vườn để giảm tái nhiễm.", en: "Monitor alternate hosts around the orchard to reduce reinfection.", ja: "再感染を減らすため、園地周辺の中間宿主を観察します。" },
  "Phun thuốc/phương án trị phấn trắng phù hợp cho Anh đào.": { vi: "Phun thuốc/phương án trị phấn trắng phù hợp cho Anh đào.", en: "Apply a suitable powdery mildew control option for cherry.", ja: "サクランボに適したうどんこ病対策を実施します。" },
  "Phun thuốc/phương án trị phấn trắng phù hợp cho Bí.": { vi: "Phun thuốc/phương án trị phấn trắng phù hợp cho Bí.", en: "Apply a suitable powdery mildew control option for squash.", ja: "カボチャに適したうどんこ病対策を実施します。" },
  "Đánh dấu lô có mật độ phấn trắng cao để tái kiểm tra.": { vi: "Đánh dấu lô có mật độ phấn trắng cao để tái kiểm tra.", en: "Mark plots with high powdery mildew density for rechecking.", ja: "うどんこ病密度が高い区画に印を付け、再確認します。" },
  "Kiểm tra lớp phấn trắng mới sau 3-5 ngày.": { vi: "Kiểm tra lớp phấn trắng mới sau 3-5 ngày.", en: "Check for new powdery mildew growth after 3-5 days.", ja: "3〜5日後に新しいうどんこ病の発生を確認します。" },
  "Luân phiên hoạt chất nếu phải xử lý nhiều lần.": { vi: "Luân phiên hoạt chất nếu phải xử lý nhiều lần.", en: "Rotate active ingredients if multiple treatments are needed.", ja: "複数回処理が必要な場合は有効成分をローテーションします。" },
  "Duy trì khoảng cách tán và dinh dưỡng cân đối.": { vi: "Duy trì khoảng cách tán và dinh dưỡng cân đối.", en: "Maintain canopy spacing and balanced nutrition.", ja: "樹冠間隔と栄養バランスを維持します。" },
  "Xác nhận lớp bột trắng xám trên Anh đào, không nhầm với bụi/thuốc tồn dư.": { vi: "Xác nhận lớp bột trắng xám trên Anh đào, không nhầm với bụi/thuốc tồn dư.", en: "Confirm gray-white powder on cherry and avoid confusing it with dust or spray residue.", ja: "サクランボの灰白色粉状病斑を確認し、ほこりや薬剤残りと混同しないようにします。" },
  "Xác nhận lớp bột trắng xám trên Bí, không nhầm với bụi/thuốc tồn dư.": { vi: "Xác nhận lớp bột trắng xám trên Bí, không nhầm với bụi/thuốc tồn dư.", en: "Confirm gray-white powder on squash and avoid confusing it with dust or spray residue.", ja: "カボチャの灰白色粉状病斑を確認し、ほこりや薬剤残りと混同しないようにします。" },
  "Loại bỏ lá bệnh nặng và cải thiện thông gió.": { vi: "Loại bỏ lá bệnh nặng và cải thiện thông gió.", en: "Remove heavily diseased leaves and improve ventilation.", ja: "重症葉を除去し、通気を改善します。" },
  "Dùng lưu huỳnh, dầu khoáng hoặc thuốc đặc trị theo đúng nhãn và thời tiết.": { vi: "Dùng lưu huỳnh, dầu khoáng hoặc thuốc đặc trị theo đúng nhãn và thời tiết.", en: "Use sulfur, mineral oil, or a specific product according to the label and weather.", ja: "ラベルと天候に従い、硫黄、マシン油、または専用剤を使用します。" },
  "Không phun lưu huỳnh khi trời quá nóng hoặc gần lần dùng dầu khoáng.": { vi: "Không phun lưu huỳnh khi trời quá nóng hoặc gần lần dùng dầu khoáng.", en: "Do not apply sulfur in extreme heat or close to a mineral oil application.", ja: "高温時やマシン油散布の前後には硫黄を散布しません。" },

  "Khảo sát ruộng Ngô, ghi tỷ lệ lá có triệu chứng Đốm lá xám Cercospora.": { vi: "Khảo sát ruộng Ngô, ghi tỷ lệ lá có triệu chứng Đốm lá xám Cercospora.", en: "Survey the corn field and record leaves showing Cercospora gray leaf spot symptoms.", ja: "トウモロコシ圃場を調査し、セルコスポラ灰色斑点病の症状葉率を記録します。" },
  "Khảo sát ruộng Ngô, ghi tỷ lệ lá có triệu chứng Rỉ sắt thường.": { vi: "Khảo sát ruộng Ngô, ghi tỷ lệ lá có triệu chứng Rỉ sắt thường.", en: "Survey the corn field and record leaves showing common rust symptoms.", ja: "トウモロコシ圃場を調査し、普通さび病の症状葉率を記録します。" },
  "Khảo sát ruộng Ngô, ghi tỷ lệ lá có triệu chứng Cháy lá phương bắc.": { vi: "Khảo sát ruộng Ngô, ghi tỷ lệ lá có triệu chứng Cháy lá phương bắc.", en: "Survey the corn field and record leaves showing northern leaf blight symptoms.", ja: "トウモロコシ圃場を調査し、北方葉枯病の症状葉率を記録します。" },
  "Phun thuốc trị nấm cho Ngô nếu bệnh lan nhanh ở giai đoạn sinh trưởng quan trọng.": { vi: "Phun thuốc trị nấm cho Ngô nếu bệnh lan nhanh ở giai đoạn sinh trưởng quan trọng.", en: "Spray corn fungicide if disease spreads quickly during a critical growth stage.", ja: "重要な生育段階で病害が急速に広がる場合、トウモロコシに殺菌剤を散布します。" },
  "Ưu tiên bảo vệ lá phía trên bắp.": { vi: "Ưu tiên bảo vệ lá phía trên bắp.", en: "Prioritize protecting leaves above the ear.", ja: "雌穂より上の葉の保護を優先します。" },
  "Theo dõi thời tiết mát ẩm vì bệnh dễ bùng phát.": { vi: "Theo dõi thời tiết mát ẩm vì bệnh dễ bùng phát.", en: "Monitor cool, humid weather because disease can flare up.", ja: "病害が拡大しやすいため、低温多湿の天候を監視します。" },
  "Ghi nhận giống mẫn cảm để thay đổi mùa sau.": { vi: "Ghi nhận giống mẫn cảm để thay đổi mùa sau.", en: "Record susceptible varieties for adjustment next season.", ja: "次作で変更できるよう感受性品種を記録します。" },
  "Dọn hoặc vùi tàn dư sau thu hoạch.": { vi: "Dọn hoặc vùi tàn dư sau thu hoạch.", en: "Remove or incorporate residue after harvest.", ja: "収穫後に残渣を除去またはすき込みます。" },
  "Xác nhận Đốm lá xám Cercospora trên Ngô bằng đúng dạng vết bệnh ngoài ruộng.": { vi: "Xác nhận Đốm lá xám Cercospora trên Ngô bằng đúng dạng vết bệnh ngoài ruộng.", en: "Confirm Cercospora gray leaf spot on corn using field lesion patterns.", ja: "圃場の病斑型でトウモロコシのセルコスポラ灰色斑点病を確認します。" },
  "Xác nhận Rỉ sắt thường trên Ngô bằng đúng dạng vết bệnh ngoài ruộng.": { vi: "Xác nhận Rỉ sắt thường trên Ngô bằng đúng dạng vết bệnh ngoài ruộng.", en: "Confirm common rust on corn using field lesion patterns.", ja: "圃場の病斑型でトウモロコシの普通さび病を確認します。" },
  "Xác nhận Cháy lá phương bắc trên Ngô bằng đúng dạng vết bệnh ngoài ruộng.": { vi: "Xác nhận Cháy lá phương bắc trên Ngô bằng đúng dạng vết bệnh ngoài ruộng.", en: "Confirm northern leaf blight on corn using field lesion patterns.", ja: "圃場の病斑型でトウモロコシの北方葉枯病を確認します。" },
  "Đánh giá mức độ lan trên ruộng trước khi phun.": { vi: "Đánh giá mức độ lan trên ruộng trước khi phun.", en: "Assess field spread before spraying.", ja: "散布前に圃場での広がりを評価します。" },
  "Dùng thuốc nấm theo nhãn nếu bệnh vượt ngưỡng can thiệp.": { vi: "Dùng thuốc nấm theo nhãn nếu bệnh vượt ngưỡng can thiệp.", en: "Use fungicide according to the label if disease exceeds the action threshold.", ja: "病害が防除基準を超える場合、ラベル通りに殺菌剤を使用します。" },
  "Theo dõi lá mới và luân phiên hoạt chất khi cần.": { vi: "Theo dõi lá mới và luân phiên hoạt chất khi cần.", en: "Monitor new leaves and rotate active ingredients when needed.", ja: "新葉を観察し、必要に応じて有効成分をローテーションします。" },

  "Xác nhận Esca bằng triệu chứng lá và dấu hiệu bệnh gỗ trên nho.": { vi: "Xác nhận Esca bằng triệu chứng lá và dấu hiệu bệnh gỗ trên nho.", en: "Confirm Esca using leaf symptoms and grapevine wood disease signs.", ja: "葉の症状とブドウ木質部の病徴でエスカを確認します。" },
  "Tập trung vệ sinh, cắt tỉa đúng thời điểm và bảo vệ vết thương.": { vi: "Tập trung vệ sinh, cắt tỉa đúng thời điểm và bảo vệ vết thương.", en: "Focus on sanitation, timely pruning, and wound protection.", ja: "衛生管理、適期剪定、傷口保護を重点にします。" },
  "Loại bỏ nguồn bệnh gỗ nặng, không dùng thuốc như phác đồ nấm lá thông thường.": { vi: "Loại bỏ nguồn bệnh gỗ nặng, không dùng thuốc như phác đồ nấm lá thông thường.", en: "Remove severe wood infection sources; do not treat it like a normal foliar fungal disease.", ja: "重い木質部感染源を除去し、通常の葉病害と同じ薬剤処理にしません。" },
  "Theo dõi dài hạn vì Esca là bệnh thân cành khó phục hồi.": { vi: "Theo dõi dài hạn vì Esca là bệnh thân cành khó phục hồi.", en: "Monitor long term because Esca is a difficult-to-recover trunk/branch disease.", ja: "エスカは回復が難しい幹枝病害のため、長期観察します。" },
  "Xác nhận cháy lá Isariopsis trên nho.": { vi: "Xác nhận cháy lá Isariopsis trên nho.", en: "Confirm Isariopsis leaf blight on grape.", ja: "ブドウのイサリオプシス葉枯病を確認します。" },
  "Loại bỏ lá bệnh và giảm ẩm trong tán.": { vi: "Loại bỏ lá bệnh và giảm ẩm trong tán.", en: "Remove diseased leaves and reduce canopy humidity.", ja: "病葉を除去し、樹冠内湿度を下げます。" },
  "Phun thuốc trị nấm theo nhãn khi bệnh đang lan.": { vi: "Phun thuốc trị nấm theo nhãn khi bệnh đang lan.", en: "Spray fungicide according to the label while disease is spreading.", ja: "病害が広がっている間はラベル通りに殺菌剤を散布します。" },
  "Kết hợp vệ sinh vườn để giảm tái nhiễm.": { vi: "Kết hợp vệ sinh vườn để giảm tái nhiễm.", en: "Combine orchard sanitation to reduce reinfection.", ja: "再感染を減らすため園地衛生を組み合わせます。" },

  "Đánh dấu cây cam quýt nghi HLB và kiểm tra vàng lá lệch, quả méo, rễ suy.": { vi: "Đánh dấu cây cam quýt nghi HLB và kiểm tra vàng lá lệch, quả méo, rễ suy.", en: "Mark citrus trees suspected of HLB and check asymmetric yellowing, misshapen fruit, and root decline.", ja: "HLB疑いの柑橘に印を付け、非対称黄化、奇形果、根の衰弱を確認します。" },
  "Theo dõi cây lân cận và lộc non.": { vi: "Theo dõi cây lân cận và lộc non.", en: "Monitor neighboring trees and new flushes.", ja: "周辺樹と新梢を観察します。" },
  "Xác minh HLB bằng triệu chứng đặc trưng và, nếu có thể, xét nghiệm.": { vi: "Xác minh HLB bằng triệu chứng đặc trưng và, nếu có thể, xét nghiệm.", en: "Verify HLB by characteristic symptoms and testing if available.", ja: "特徴的症状と可能なら検査でHLBを確認します。" },
  "Không xem HLB là bệnh có thể chữa khỏi bằng phun thuốc lá.": { vi: "Không xem HLB là bệnh có thể chữa khỏi bằng phun thuốc lá.", en: "Do not treat HLB as a disease curable by foliar sprays.", ja: "HLBを葉面散布で治る病害として扱わないでください。" },
  "Quản lý rầy môi giới và cây nguồn bệnh.": { vi: "Quản lý rầy môi giới và cây nguồn bệnh.", en: "Manage psyllid vectors and source trees.", ja: "媒介キジラミと感染源樹を管理します。" },
  "Lập kế hoạch phục hồi vườn bằng giống sạch bệnh.": { vi: "Lập kế hoạch phục hồi vườn bằng giống sạch bệnh.", en: "Plan orchard recovery using disease-free nursery stock.", ja: "無病苗で園地回復計画を立てます。" },

  "Phun sản phẩm gốc đồng hoặc thuốc vi khuẩn được phép cho Đào.": { vi: "Phun sản phẩm gốc đồng hoặc thuốc vi khuẩn được phép cho Đào.", en: "Spray a copper product or approved bactericide for peach.", ja: "モモに銅剤または認可細菌病防除剤を散布します。" },
  "Phun sản phẩm gốc đồng hoặc thuốc vi khuẩn được phép cho Ớt chuông.": { vi: "Phun sản phẩm gốc đồng hoặc thuốc vi khuẩn được phép cho Ớt chuông.", en: "Spray a copper product or approved bactericide for bell pepper.", ja: "ピーマンに銅剤または認可細菌病防除剤を散布します。" },
  "Phun sản phẩm gốc đồng hoặc thuốc vi khuẩn được phép cho Cà chua.": { vi: "Phun sản phẩm gốc đồng hoặc thuốc vi khuẩn được phép cho Cà chua.", en: "Spray a copper product or approved bactericide for tomato.", ja: "トマトに銅剤または認可細菌病防除剤を散布します。" },
  "Xác nhận đốm vi khuẩn trên Đào; không nhầm với đốm nấm khô có vòng đồng tâm.": { vi: "Xác nhận đốm vi khuẩn trên Đào; không nhầm với đốm nấm khô có vòng đồng tâm.", en: "Confirm bacterial spot on peach and do not confuse it with dry concentric fungal spots.", ja: "モモの細菌斑点病を確認し、乾いた同心円状の菌性斑点と混同しないようにします。" },
  "Xác nhận đốm vi khuẩn trên Ớt chuông; không nhầm với đốm nấm khô có vòng đồng tâm.": { vi: "Xác nhận đốm vi khuẩn trên Ớt chuông; không nhầm với đốm nấm khô có vòng đồng tâm.", en: "Confirm bacterial spot on bell pepper and do not confuse it with dry concentric fungal spots.", ja: "ピーマンの細菌斑点病を確認し、乾いた同心円状の菌性斑点と混同しないようにします。" },
  "Xác nhận đốm vi khuẩn trên Cà chua; không nhầm với đốm nấm khô có vòng đồng tâm.": { vi: "Xác nhận đốm vi khuẩn trên Cà chua; không nhầm với đốm nấm khô có vòng đồng tâm.", en: "Confirm bacterial spot on tomato and do not confuse it with dry concentric fungal spots.", ja: "トマトの細菌斑点病を確認し、乾いた同心円状の菌性斑点と混同しないようにします。" },
  "Vệ sinh tán, giảm giọt bắn và loại bỏ bộ phận bệnh nặng.": { vi: "Vệ sinh tán, giảm giọt bắn và loại bỏ bộ phận bệnh nặng.", en: "Sanitize the canopy, reduce splash, and remove severely diseased parts.", ja: "樹冠を清掃し、水はねを減らし、重症部位を除去します。" },
  "Dùng thuốc vi khuẩn/gốc đồng theo nhãn, không phun khi trời sắp mưa.": { vi: "Dùng thuốc vi khuẩn/gốc đồng theo nhãn, không phun khi trời sắp mưa.", en: "Use bactericide/copper according to the label and do not spray before rain.", ja: "ラベル通りに細菌病防除剤・銅剤を使い、雨の直前は散布しません。" },
  "Theo dõi mưa, ẩm và vết mới trong 3-5 ngày.": { vi: "Theo dõi mưa, ẩm và vết mới trong 3-5 ngày.", en: "Monitor rain, humidity, and new lesions for 3-5 days.", ja: "3〜5日間、雨、湿度、新病斑を観察します。" },

  "Phun thuốc trị Alternaria phù hợp cho Khoai tây nếu bệnh đang lan.": { vi: "Phun thuốc trị Alternaria phù hợp cho Khoai tây nếu bệnh đang lan.", en: "Apply suitable Alternaria control for potato if disease is spreading.", ja: "病害が広がる場合、ジャガイモに適したアルタナリア防除を行います。" },
  "Phun thuốc trị Alternaria phù hợp cho Cà chua nếu bệnh đang lan.": { vi: "Phun thuốc trị Alternaria phù hợp cho Cà chua nếu bệnh đang lan.", en: "Apply suitable Alternaria control for tomato if disease is spreading.", ja: "病害が広がる場合、トマトに適したアルタナリア防除を行います。" },
  "Xác nhận cháy lá sớm trên Khoai tây qua đốm nâu có vòng đồng tâm.": { vi: "Xác nhận cháy lá sớm trên Khoai tây qua đốm nâu có vòng đồng tâm.", en: "Confirm potato early blight by brown spots with concentric rings.", ja: "同心円状の褐色斑でジャガイモ早疫病を確認します。" },
  "Xác nhận cháy lá sớm trên Cà chua qua đốm nâu có vòng đồng tâm.": { vi: "Xác nhận cháy lá sớm trên Cà chua qua đốm nâu có vòng đồng tâm.", en: "Confirm tomato early blight by brown spots with concentric rings.", ja: "同心円状の褐色斑でトマト早疫病を確認します。" },
  "Tỉa lá bệnh, giảm ẩm và vệ sinh luống.": { vi: "Tỉa lá bệnh, giảm ẩm và vệ sinh luống.", en: "Remove diseased leaves, reduce humidity, and clean the bed.", ja: "病葉を除去し、湿度を下げ、畝を清掃します。" },
  "Dùng thuốc nấm đúng nhãn khi bệnh vượt ngưỡng.": { vi: "Dùng thuốc nấm đúng nhãn khi bệnh vượt ngưỡng.", en: "Use fungicide according to the label when disease exceeds the threshold.", ja: "病害が基準を超える場合、ラベル通りに殺菌剤を使います。" },
  "Theo dõi lá tầng dưới và điều chỉnh tưới.": { vi: "Theo dõi lá tầng dưới và điều chỉnh tưới.", en: "Monitor lower leaves and adjust irrigation.", ja: "下層葉を観察し、灌水を調整します。" },

  "Phun thuốc đặc trị Phytophthora cho Khoai tây càng sớm càng tốt nếu triệu chứng khớp.": { vi: "Phun thuốc đặc trị Phytophthora cho Khoai tây càng sớm càng tốt nếu triệu chứng khớp.", en: "Apply Phytophthora-specific treatment for potato as soon as possible if symptoms match.", ja: "症状が一致する場合、できるだけ早くジャガイモにフィトフトラ専用剤を使います。" },
  "Phun thuốc đặc trị Phytophthora cho Cà chua càng sớm càng tốt nếu triệu chứng khớp.": { vi: "Phun thuốc đặc trị Phytophthora cho Cà chua càng sớm càng tốt nếu triệu chứng khớp.", en: "Apply Phytophthora-specific treatment for tomato as soon as possible if symptoms match.", ja: "症状が一致する場合、できるだけ早くトマトにフィトフトラ専用剤を使います。" },
  "Xác nhận sương mai/cháy muộn trên Khoai tây; ưu tiên kiểm tra trong điều kiện mát ẩm.": { vi: "Xác nhận sương mai/cháy muộn trên Khoai tây; ưu tiên kiểm tra trong điều kiện mát ẩm.", en: "Confirm potato late blight, preferably under cool, humid conditions.", ja: "低温多湿条件での確認を優先し、ジャガイモ疫病を確認します。" },
  "Xác nhận sương mai/cháy muộn trên Cà chua; ưu tiên kiểm tra trong điều kiện mát ẩm.": { vi: "Xác nhận sương mai/cháy muộn trên Cà chua; ưu tiên kiểm tra trong điều kiện mát ẩm.", en: "Confirm tomato late blight, preferably under cool, humid conditions.", ja: "低温多湿条件での確認を優先し、トマト疫病を確認します。" },
  "Loại bỏ nguồn bệnh nặng và giảm ẩm tức thì.": { vi: "Loại bỏ nguồn bệnh nặng và giảm ẩm tức thì.", en: "Remove severe infection sources and reduce humidity immediately.", ja: "重い感染源を除去し、すぐに湿度を下げます。" },
  "Dùng thuốc đặc trị Phytophthora đúng liều, đúng thời điểm.": { vi: "Dùng thuốc đặc trị Phytophthora đúng liều, đúng thời điểm.", en: "Use Phytophthora-specific products at the right dose and timing.", ja: "フィトフトラ専用剤を適正量・適期で使用します。" },
  "Theo dõi sát 2-3 ngày vì đây là bệnh có tốc độ lan cao.": { vi: "Theo dõi sát 2-3 ngày vì đây là bệnh có tốc độ lan cao.", en: "Monitor closely for 2-3 days because this disease spreads quickly.", ja: "広がりが速い病害のため、2〜3日間注意深く観察します。" },

  "Theo dõi cây cạnh bên trong 5-7 ngày.": { vi: "Theo dõi cây cạnh bên trong 5-7 ngày.", en: "Monitor neighboring plants for 5-7 days.", ja: "隣接株を5〜7日間観察します。" },
  "Luân canh và vệ sinh kho bảo quản.": { vi: "Luân canh và vệ sinh kho bảo quản.", en: "Rotate crops and sanitize storage areas.", ja: "輪作し、貯蔵庫を衛生管理します。" },
  "Xác minh nhóm bệnh vi khuẩn khoai tây qua lá, thân và củ.": { vi: "Xác minh nhóm bệnh vi khuẩn khoai tây qua lá, thân và củ.", en: "Verify the potato bacterial disease group using leaves, stems, and tubers.", ja: "葉、茎、塊茎でジャガイモ細菌病グループを確認します。" },
  "Loại bỏ cây/củ bệnh nặng trước khi xử lý.": { vi: "Loại bỏ cây/củ bệnh nặng trước khi xử lý.", en: "Remove severely diseased plants/tubers before treatment.", ja: "処理前に重症株や塊茎を除去します。" },
  "Giảm nước lan truyền và khử khuẩn dụng cụ.": { vi: "Giảm nước lan truyền và khử khuẩn dụng cụ.", en: "Reduce water-mediated spread and disinfect tools.", ja: "水による伝播を減らし、道具を消毒します。" },
  "Chỉ dùng thuốc theo nhãn khi bệnh còn ở giai đoạn có thể kiểm soát.": { vi: "Chỉ dùng thuốc theo nhãn khi bệnh còn ở giai đoạn có thể kiểm soát.", en: "Use products according to the label only while disease is still controllable.", ja: "病害がまだ管理可能な段階の場合のみ、ラベル通りに薬剤を使います。" },
  "Phun thuốc trị nấm khoai tây theo nhãn nếu bệnh đang lan.": { vi: "Phun thuốc trị nấm khoai tây theo nhãn nếu bệnh đang lan.", en: "Spray potato fungicide according to the label if disease is spreading.", ja: "病害が広がる場合、ラベル通りにジャガイモ用殺菌剤を散布します。" },
  "Xác minh nhóm bệnh nấm khoai tây qua dạng đốm và lớp mốc.": { vi: "Xác minh nhóm bệnh nấm khoai tây qua dạng đốm và lớp mốc.", en: "Verify the potato fungal disease group by spot pattern and mold layer.", ja: "斑点型とかび層でジャガイモ菌性病害グループを確認します。" },
  "Giảm nguồn bệnh trên lá và trong ruộng.": { vi: "Giảm nguồn bệnh trên lá và trong ruộng.", en: "Reduce infection sources on leaves and in the field.", ja: "葉上と圃場内の感染源を減らします。" },
  "Dùng thuốc nấm phù hợp theo nhãn.": { vi: "Dùng thuốc nấm phù hợp theo nhãn.", en: "Use a suitable fungicide according to the label.", ja: "適切な殺菌剤をラベル通りに使用します。" },
  "Theo dõi lá mới để đánh giá hiệu quả.": { vi: "Theo dõi lá mới để đánh giá hiệu quả.", en: "Monitor new leaves to evaluate effectiveness.", ja: "効果確認のため新葉を観察します。" },

  "Đánh dấu cây Khoai tây có triệu chứng virus như khảm, xoăn lá hoặc còi cọc.": { vi: "Đánh dấu cây Khoai tây có triệu chứng virus như khảm, xoăn lá hoặc còi cọc.", en: "Mark potato plants with virus symptoms such as mosaic, leaf curl, or stunting.", ja: "モザイク、巻葉、矮化などのウイルス症状があるジャガイモに印を付けます。" },
  "Đánh dấu cây Sắn có triệu chứng virus như khảm, xoăn lá hoặc còi cọc.": { vi: "Đánh dấu cây Sắn có triệu chứng virus như khảm, xoăn lá hoặc còi cọc.", en: "Mark cassava plants with virus symptoms such as mosaic, leaf curl, or stunting.", ja: "モザイク、巻葉、矮化などのウイルス症状があるキャッサバに印を付けます。" },
  "Xác minh Bệnh virus khoai tây bằng triệu chứng đặc trưng trên Khoai tây.": { vi: "Xác minh Bệnh virus khoai tây bằng triệu chứng đặc trưng trên Khoai tây.", en: "Verify potato virus disease by characteristic symptoms on potato.", ja: "ジャガイモ上の特徴的症状でウイルス病を確認します。" },
  "Xác minh Bệnh sọc nâu sắn bằng triệu chứng đặc trưng trên Sắn.": { vi: "Xác minh Bệnh sọc nâu sắn bằng triệu chứng đặc trưng trên Sắn.", en: "Verify cassava brown streak disease by characteristic symptoms on cassava.", ja: "キャッサバ上の特徴的症状で褐色条斑病を確認します。" },
  "Xác minh Bệnh khảm lá sắn bằng triệu chứng đặc trưng trên Sắn.": { vi: "Xác minh Bệnh khảm lá sắn bằng triệu chứng đặc trưng trên Sắn.", en: "Verify cassava mosaic disease by characteristic symptoms on cassava.", ja: "キャッサバ上の特徴的症状でモザイク病を確認します。" },
  "Quản lý côn trùng chích hút theo nhãn.": { vi: "Quản lý côn trùng chích hút theo nhãn.", en: "Manage sucking insects according to the label.", ja: "ラベルに従い吸汁性昆虫を管理します。" },
  "Lập kế hoạch giống sạch bệnh cho vụ sau.": { vi: "Lập kế hoạch giống sạch bệnh cho vụ sau.", en: "Plan disease-free planting material for the next season.", ja: "次作に向けて無病種苗を計画します。" },

  "Xác nhận cháy lá vi khuẩn sắn qua đốm úng, thâm gân và cháy lá.": { vi: "Xác nhận cháy lá vi khuẩn sắn qua đốm úng, thâm gân và cháy lá.", en: "Confirm cassava bacterial blight by water-soaked spots, vein darkening, and leaf blight.", ja: "水浸状斑、葉脈黒変、葉枯れでキャッサバ細菌性葉枯病を確認します。" },
  "Cắt bỏ nguồn bệnh và khử khuẩn dụng cụ.": { vi: "Cắt bỏ nguồn bệnh và khử khuẩn dụng cụ.", en: "Cut out infection sources and disinfect tools.", ja: "感染源を切除し、道具を消毒します。" },
  "Dùng gốc đồng theo nhãn nếu bệnh đang ở tán lá.": { vi: "Dùng gốc đồng theo nhãn nếu bệnh đang ở tán lá.", en: "Use copper according to the label if disease remains in the canopy.", ja: "病害が葉群にある場合はラベル通りに銅剤を使います。" },
  "Ngăn dùng hom bệnh làm giống.": { vi: "Ngăn dùng hom bệnh làm giống.", en: "Prevent diseased cuttings from being used as planting material.", ja: "病気の挿し穂を種苗に使わないようにします。" },
  "Loại bỏ cây biểu hiện nặng nếu tỷ lệ thấp.": { vi: "Loại bỏ cây biểu hiện nặng nếu tỷ lệ thấp.", en: "Remove severely symptomatic plants if incidence is low.", ja: "発生率が低い場合は重症株を除去します。" },
  "Theo dõi lá non mới trong 7 ngày.": { vi: "Theo dõi lá non mới trong 7 ngày.", en: "Monitor new young leaves for 7 days.", ja: "新しい若葉を7日間観察します。" },
  "Dùng hom giống sạch bệnh.": { vi: "Dùng hom giống sạch bệnh.", en: "Use disease-free cuttings.", ja: "無病の挿し穂を使用します。" },
  "Xác minh đốm xanh lá sắn và loại trừ stress dinh dưỡng.": { vi: "Xác minh đốm xanh lá sắn và loại trừ stress dinh dưỡng.", en: "Verify cassava green mottle and rule out nutrient stress.", ja: "キャッサバ緑斑を確認し、栄養ストレスを除外します。" },
  "Theo dõi tiến triển trên lá non.": { vi: "Theo dõi tiến triển trên lá non.", en: "Monitor progression on young leaves.", ja: "若葉での進行を観察します。" },
  "Quản lý côn trùng môi giới nếu xuất hiện.": { vi: "Quản lý côn trùng môi giới nếu xuất hiện.", en: "Manage vector insects if present.", ja: "媒介昆虫が見られる場合は管理します。" },
  "Không dùng hom từ cây có triệu chứng bất thường.": { vi: "Không dùng hom từ cây có triệu chứng bất thường.", en: "Do not use cuttings from plants with abnormal symptoms.", ja: "異常症状のある株から挿し穂を取らないでください。" },

  "Bệnh phấn trắng trên bí làm lá phủ lớp bột trắng xám và suy giảm sinh trưởng.": { vi: "Bệnh phấn trắng trên bí làm lá phủ lớp bột trắng xám và suy giảm sinh trưởng.", en: "Powdery mildew on squash coats leaves with gray-white powder and reduces growth.", ja: "カボチャうどんこ病は葉に灰白色の粉を作り、生育を低下させます。" },
  "Theo dõi lá mới sau 5 ngày.": { vi: "Theo dõi lá mới sau 5 ngày.", en: "Monitor new leaves after 5 days.", ja: "5日後に新葉を観察します。" },
  "Theo dõi lá non mới sau 5 ngày.": { vi: "Theo dõi lá non mới sau 5 ngày.", en: "Monitor new young leaves after 5 days.", ja: "5日後に新しい若葉を観察します。" },
  "Dọn lá già định kỳ.": { vi: "Dọn lá già định kỳ.", en: "Remove old leaves regularly.", ja: "古葉を定期的に除去します。" },
  "Phân biệt cháy lá dâu tây do bệnh nấm với stress môi trường.": { vi: "Phân biệt cháy lá dâu tây do bệnh nấm với stress môi trường.", en: "Differentiate fungal strawberry leaf scorch from environmental stress.", ja: "イチゴ葉焼けが菌性か環境ストレスかを判別します。" },
  "Loại bỏ lá nặng và chỉnh nước/dinh dưỡng.": { vi: "Loại bỏ lá nặng và chỉnh nước/dinh dưỡng.", en: "Remove severely affected leaves and adjust water/nutrition.", ja: "重症葉を除去し、水分と栄養を調整します。" },
  "Chỉ dùng thuốc nấm khi có dấu hiệu bệnh lan.": { vi: "Chỉ dùng thuốc nấm khi có dấu hiệu bệnh lan.", en: "Use fungicide only when there are signs of disease spread.", ja: "病害拡大の兆候がある場合のみ殺菌剤を使います。" },
  "Theo dõi lá mới để xác nhận nguyên nhân.": { vi: "Theo dõi lá mới để xác nhận nguyên nhân.", en: "Monitor new leaves to confirm the cause.", ja: "原因確認のため新葉を観察します。" },

  "Đốm vi khuẩn trên cà chua tạo vết nhỏ sẫm màu và dễ lan khi mưa nhiều.": { vi: "Đốm vi khuẩn trên cà chua tạo vết nhỏ sẫm màu và dễ lan khi mưa nhiều.", en: "Tomato bacterial spot creates small dark lesions and spreads easily during heavy rain.", ja: "トマト細菌斑点病は小さな暗色斑を作り、雨が多い時に広がりやすくなります。" },
  "Cháy lá sớm trên cà chua có vòng đồng tâm đặc trưng, thường xuất hiện ở lá già.": { vi: "Cháy lá sớm trên cà chua có vòng đồng tâm đặc trưng, thường xuất hiện ở lá già.", en: "Tomato early blight has characteristic concentric rings and often appears on older leaves.", ja: "トマト早疫病は特徴的な同心円紋を持ち、古葉に出やすい病害です。" },
  "Sương mai cà chua lan nhanh trong điều kiện ẩm mát và có thể làm tàn lá rất nhanh.": { vi: "Sương mai cà chua lan nhanh trong điều kiện ẩm mát và có thể làm tàn lá rất nhanh.", en: "Tomato late blight spreads quickly in cool, humid conditions and can destroy foliage rapidly.", ja: "トマト疫病は低温多湿で急速に広がり、葉を急速に枯らすことがあります。" },
  "Luân phiên hoạt chất nếu phải phun lặp lại.": { vi: "Luân phiên hoạt chất nếu phải phun lặp lại.", en: "Rotate active ingredients if repeat spraying is required.", ja: "再散布が必要な場合は有効成分をローテーションします。" },
  "Xác nhận mốc lá cà chua bằng vàng mặt trên và mốc mặt dưới lá.": { vi: "Xác nhận mốc lá cà chua bằng vàng mặt trên và mốc mặt dưới lá.", en: "Confirm tomato leaf mold by upper yellowing and mold on leaf undersides.", ja: "葉表の黄化と葉裏のかびでトマト葉かび病を確認します。" },
  "Giảm ẩm và tăng lưu thông khí trước khi phun.": { vi: "Giảm ẩm và tăng lưu thông khí trước khi phun.", en: "Reduce humidity and improve airflow before spraying.", ja: "散布前に湿度を下げ、空気の流れを改善します。" },
  "Dùng thuốc trị nấm theo nhãn, phủ mặt dưới lá.": { vi: "Dùng thuốc trị nấm theo nhãn, phủ mặt dưới lá.", en: "Use fungicide according to the label and cover leaf undersides.", ja: "ラベル通りに殺菌剤を使い、葉裏を覆います。" },
  "Theo dõi ẩm độ ban đêm để tránh tái phát.": { vi: "Theo dõi ẩm độ ban đêm để tránh tái phát.", en: "Monitor nighttime humidity to prevent recurrence.", ja: "再発防止のため夜間湿度を監視します。" },
  "Kiểm tra lá mới sau 5-7 ngày.": { vi: "Kiểm tra lá mới sau 5-7 ngày.", en: "Check new leaves after 5-7 days.", ja: "5〜7日後に新葉を確認します。" },
  "Xác nhận đốm lá Septoria bằng nhiều chấm nhỏ có tâm xám.": { vi: "Xác nhận đốm lá Septoria bằng nhiều chấm nhỏ có tâm xám.", en: "Confirm Septoria leaf spot by many small spots with gray centers.", ja: "灰色中心の小斑点が多数あることでセプトリア葉斑病を確認します。" },
  "Loại bỏ lá nguồn bệnh và giảm bắn đất.": { vi: "Loại bỏ lá nguồn bệnh và giảm bắn đất.", en: "Remove infected source leaves and reduce soil splash.", ja: "感染源となる葉を除去し、土の跳ね返りを減らします。" },
  "Dùng thuốc nấm theo nhãn khi bệnh còn lan.": { vi: "Dùng thuốc nấm theo nhãn khi bệnh còn lan.", en: "Use fungicide according to the label while disease is still spreading.", ja: "病害がまだ広がる場合はラベル通りに殺菌剤を使います。" },
  "Theo dõi lá tầng dưới sau mưa.": { vi: "Theo dõi lá tầng dưới sau mưa.", en: "Monitor lower leaves after rain.", ja: "雨後に下層葉を観察します。" },

  "Xác nhận nhện đỏ hai chấm trên cà chua bằng chấm vàng li ti và tơ.": { vi: "Xác nhận nhện đỏ hai chấm trên cà chua bằng chấm vàng li ti và tơ.", en: "Confirm two-spotted spider mites on tomato by tiny yellow specks and webbing.", ja: "細かな黄点と糸でトマトのナミハダニを確認します。" },
  "Cắt lá nhiễm nặng và giảm bụi/khô nóng.": { vi: "Cắt lá nhiễm nặng và giảm bụi/khô nóng.", en: "Remove heavily infested leaves and reduce dust, dryness, and heat.", ja: "重度被害葉を除去し、ほこり・乾燥・高温を抑えます。" },
  "Dùng thuốc trừ nhện phủ mặt dưới lá theo nhãn.": { vi: "Dùng thuốc trừ nhện phủ mặt dưới lá theo nhãn.", en: "Apply miticide to leaf undersides according to the label.", ja: "ラベル通りに殺ダニ剤を葉裏へ散布します。" },
  "Theo dõi trứng và nhện non sau 2-3 ngày.": { vi: "Theo dõi trứng và nhện non sau 2-3 ngày.", en: "Monitor eggs and young mites after 2-3 days.", ja: "2〜3日後に卵と若ダニを確認します。" },
  "Phủ đều mặt dưới lá và vùng tán rậm.": { vi: "Phủ đều mặt dưới lá và vùng tán rậm.", en: "Cover leaf undersides and dense canopy zones evenly.", ja: "葉裏と込み合った葉群を均一に処理します。" },
  "Kiểm tra vết mới sau 5 ngày.": { vi: "Kiểm tra vết mới sau 5 ngày.", en: "Check for new lesions after 5 days.", ja: "5日後に新しい病斑を確認します。" },
  "Luân phiên hoạt chất nếu cần phun lặp.": { vi: "Luân phiên hoạt chất nếu cần phun lặp.", en: "Rotate active ingredients if repeat spraying is needed.", ja: "再散布が必要なら有効成分をローテーションします。" },
  "Xác nhận đốm vòng cà chua và phân biệt với cháy lá sớm.": { vi: "Xác nhận đốm vòng cà chua và phân biệt với cháy lá sớm.", en: "Confirm tomato target spot and differentiate it from early blight.", ja: "トマト輪紋病を確認し、早疫病と区別します。" },
  "Dùng thuốc nấm theo nhãn nếu bệnh tiếp tục lan.": { vi: "Dùng thuốc nấm theo nhãn nếu bệnh tiếp tục lan.", en: "Use fungicide according to the label if disease continues spreading.", ja: "病害が広がり続ける場合はラベル通りに殺菌剤を使います。" },
  "Theo dõi tầng lá giữa và lá non.": { vi: "Theo dõi tầng lá giữa và lá non.", en: "Monitor middle canopy leaves and young leaves.", ja: "中層葉と若葉を観察します。" },

  "Xác nhận virus xoăn vàng lá cà chua bằng lá non vàng xoăn và cây còi.": { vi: "Xác nhận virus xoăn vàng lá cà chua bằng lá non vàng xoăn và cây còi.", en: "Confirm tomato yellow leaf curl virus by yellow curled young leaves and stunting.", ja: "黄化・巻葉した若葉と矮化でトマト黄化葉巻ウイルスを確認します。" },
  "Không có thuốc chữa virus; loại nguồn bệnh và quản lý bọ phấn.": { vi: "Không có thuốc chữa virus; loại nguồn bệnh và quản lý bọ phấn.", en: "There is no curative virus spray; remove infection sources and manage whiteflies.", ja: "ウイルスを治す薬剤はないため、感染源を除去しコナジラミを管理します。" },
  "Theo dõi bằng bẫy dính và kiểm tra lá non.": { vi: "Theo dõi bằng bẫy dính và kiểm tra lá non.", en: "Monitor with sticky traps and inspect young leaves.", ja: "粘着板で監視し、若葉を確認します。" },
  "Dùng giống sạch/chống chịu cho lứa sau.": { vi: "Dùng giống sạch/chống chịu cho lứa sau.", en: "Use clean or tolerant varieties for the next crop cycle.", ja: "次作では無病または抵抗性品種を使用します。" },
  "Theo dõi cây lân cận trong 7 ngày.": { vi: "Theo dõi cây lân cận trong 7 ngày.", en: "Monitor neighboring plants for 7 days.", ja: "周辺株を7日間観察します。" },
  "Xác nhận virus khảm cà chua bằng vân xanh vàng loang và biến dạng lá.": { vi: "Xác nhận virus khảm cà chua bằng vân xanh vàng loang và biến dạng lá.", en: "Confirm tomato mosaic virus by green-yellow mottling and leaf distortion.", ja: "緑黄色のまだらと葉の変形でトマトモザイクウイルスを確認します。" },
  "Không phun thuốc để chữa virus; tập trung vệ sinh và loại nguồn bệnh.": { vi: "Không phun thuốc để chữa virus; tập trung vệ sinh và loại nguồn bệnh.", en: "Do not spray to cure viruses; focus on sanitation and removing infection sources.", ja: "ウイルス治療目的の散布はせず、衛生管理と感染源除去に集中します。" },
  "Khử khuẩn dụng cụ, hạn chế lây cơ học.": { vi: "Khử khuẩn dụng cụ, hạn chế lây cơ học.", en: "Disinfect tools and reduce mechanical transmission.", ja: "道具を消毒し、機械的伝染を抑えます。" },
  "Theo dõi cây lân cận và loại bỏ nguồn lây nặng.": { vi: "Theo dõi cây lân cận và loại bỏ nguồn lây nặng.", en: "Monitor neighboring plants and remove severe infection sources.", ja: "周辺株を観察し、重い感染源を除去します。" },
};

export const catalogTreatmentText: LocalizedDictionary = {
  ...catalogTreatmentBaseText,
  ...catalogTreatmentExtraText,
  ...catalogTreatmentPatchText,
};

type ProtocolSeed = Omit<CatalogTreatmentProtocol, "source" | "catalogEntry" | "safety">;

const product = (name: string, activeIngredient: string, dosage = "Theo nhãn"): ProtocolProduct => ({
  name,
  activeIngredient,
  dosage,
});

const withCrop = (entry: PlantDiseaseCatalogEntry, action: string) =>
  `${action} cho ${entry.cropName} bị ${entry.diseaseName}.`;

const baseProducts = {
  copper: product("Copper Hydroxide / Copper Oxychloride", "Đồng"),
  fungal: product("Mancozeb / Chlorothalonil", "Thuốc tiếp xúc phổ rộng"),
  phosphonate: product("Fosetyl-Al / Phosphonate", "Phosphonate"),
  strobilurinTriazole: product("Azoxystrobin + Difenoconazole", "Strobilurin + Triazole"),
};

const makeProtocolSeed = (entry: PlantDiseaseCatalogEntry): ProtocolSeed | null => {
  const crop = entry.cropName;
  const disease = entry.diseaseName;

  switch (entry.diseaseKey) {
    case "apple_scab":
      return {
        immediate: [withCrop(entry, "Tỉa bỏ lá và quả có vết ghẻ nặng"), "Dọn lá rụng dưới tán để giảm nguồn bào tử.", "Giữ tán thông thoáng, hạn chế tưới ướt lá."],
        next24h: ["Phun thuốc phòng trị ghẻ táo khi lá còn khô và không có mưa gần.", "Luân phiên thuốc tiếp xúc và nội hấp theo nhãn.", "Ghi lại khu vực có vết bệnh mới để so sánh sau 5-7 ngày."],
        followUp: ["Lặp lại theo nhãn nếu còn lá non mới nhiễm.", "Thu gom lá/quả bệnh sau mỗi đợt mưa.", "Tỉa cành sau vụ để giảm ẩm trong tán."],
        steps: ["Xác nhận vết ghẻ dạng mảng sẫm, nhám trên lá hoặc quả táo.", "Loại bỏ phần bệnh nặng và vệ sinh nền vườn.", "Phun thuốc trị nấm phù hợp, phủ đều tán nhưng tránh chảy rửa.", "Luân phiên hoạt chất ở lần xử lý sau để giảm kháng thuốc."],
        products: [baseProducts.fungal, product("Difenoconazole", "Triazole")],
      };
    case "black_rot":
      return {
        immediate: [withCrop(entry, "Cắt bỏ lá, quả hoặc cành có mô thối đen"), "Thu gom toàn bộ tàn dư bệnh ra khỏi vườn.", "Đánh dấu các cây có vết bệnh lan nhanh để theo dõi riêng."],
        next24h: [`Phun thuốc trị nấm cho ${crop}, tập trung vùng tán có vết bệnh mới.`, "Tránh tưới phun mưa và giảm ẩm trên bề mặt lá/quả.", "Khử khuẩn kéo cắt sau khi xử lý từng cây bệnh."],
        followUp: ["Kiểm tra vết mới sau mưa hoặc sương kéo dài.", "Tỉa tán và loại bỏ quả khô, cành chết còn treo trên cây.", "Luân phiên hoạt chất nếu cần phun lặp lại."],
        steps: [`Phân biệt thối đen trên ${crop} với cháy nắng hoặc tổn thương cơ học.`, "Loại bỏ nguồn bệnh nhìn thấy trước khi phun.", "Dùng thuốc nấm theo nhãn, ưu tiên phun phòng trước giai đoạn ẩm kéo dài.", "Theo dõi quả non/lá non vì đây là nơi dễ phát sinh vết mới."],
        products: [baseProducts.fungal, baseProducts.strobilurinTriazole],
      };
    case "cedar_apple_rust":
      return {
        immediate: ["Xác nhận đốm vàng cam trên lá táo và kiểm tra cây ký chủ phụ gần vườn.", "Tỉa lá/cành nhiễm nặng nếu mật độ còn thấp.", "Không tưới ướt tán trong giai đoạn bệnh đang lan."],
        next24h: ["Phun thuốc trị gỉ sắt cho táo theo nhãn, ưu tiên sáng sớm khô ráo.", "Khảo sát cây bách/xù gần vườn vì có thể là nguồn bệnh.", "Ghi nhận tỷ lệ lá nhiễm ở từng cây."],
        followUp: ["Theo dõi lá non sau 5-7 ngày.", "Tỉa thông thoáng tán táo sau đợt bệnh.", "Lập kế hoạch phun phòng vào mùa bệnh năm sau nếu vườn có lịch sử gỉ sắt."],
        steps: ["Đối chiếu triệu chứng gỉ sắt táo trước khi dùng thuốc.", "Giảm nguồn bệnh và ẩm độ tán.", "Phun thuốc trị nấm gỉ sắt đúng liều.", "Theo dõi cây ký chủ phụ quanh vườn để giảm tái nhiễm."],
        products: [product("Myclobutanil", "Triazole"), product("Mancozeb", "Dithiocarbamate")],
      };
    case "powdery_mildew":
      return {
        immediate: [withCrop(entry, "Tỉa bỏ lá phủ phấn trắng nặng"), "Tăng thông thoáng tán và tránh bón thừa đạm.", "Ngưng tưới phun lên lá trong vài ngày tới."],
        next24h: [`Phun thuốc/phương án trị phấn trắng phù hợp cho ${crop}.`, "Phủ đều mặt trên và mặt dưới lá, nhất là lá non.", "Đánh dấu lô có mật độ phấn trắng cao để tái kiểm tra."],
        followUp: ["Kiểm tra lớp phấn trắng mới sau 3-5 ngày.", "Luân phiên hoạt chất nếu phải xử lý nhiều lần.", "Duy trì khoảng cách tán và dinh dưỡng cân đối."],
        steps: [`Xác nhận lớp bột trắng xám trên ${crop}, không nhầm với bụi/thuốc tồn dư.`, "Loại bỏ lá bệnh nặng và cải thiện thông gió.", "Dùng lưu huỳnh, dầu khoáng hoặc thuốc đặc trị theo đúng nhãn và thời tiết.", "Không phun lưu huỳnh khi trời quá nóng hoặc gần lần dùng dầu khoáng."],
        products: [product("Sulfur", "Lưu huỳnh"), product("Hexaconazole / Tebuconazole", "Triazole")],
      };
    case "gray_leaf_spot":
    case "common_rust":
    case "northern_leaf_blight":
      return {
        immediate: [`Khảo sát ruộng ${crop}, ghi tỷ lệ lá có triệu chứng ${disease}.`, "Khoanh vùng ruộng có mật độ vết bệnh cao.", "Giữ cây khỏe bằng dinh dưỡng cân đối, tránh thừa đạm."],
        next24h: [`Phun thuốc trị nấm cho ${crop} nếu bệnh lan nhanh ở giai đoạn sinh trưởng quan trọng.`, "Ưu tiên bảo vệ lá phía trên bắp.", "Theo dõi thời tiết mát ẩm vì bệnh dễ bùng phát."],
        followUp: ["Kiểm tra vết bệnh mới sau 5-7 ngày.", "Ghi nhận giống mẫn cảm để thay đổi mùa sau.", "Dọn hoặc vùi tàn dư sau thu hoạch."],
        steps: [`Xác nhận ${entry.diseaseName} trên ${crop} bằng đúng dạng vết bệnh ngoài ruộng.`, "Đánh giá mức độ lan trên ruộng trước khi phun.", "Dùng thuốc nấm theo nhãn nếu bệnh vượt ngưỡng can thiệp.", "Theo dõi lá mới và luân phiên hoạt chất khi cần."],
        products: [product("Azoxystrobin + Propiconazole", "Strobilurin + Triazole")],
      };
    case "esca":
      return {
        immediate: ["Đánh dấu cây nho nghi Esca và kiểm tra triệu chứng trên thân/cành.", "Không cắt tỉa mạnh khi dụng cụ chưa được khử khuẩn.", "Loại bỏ cành chết nặng theo từng cây và thu gom ra khỏi vườn."],
        next24h: ["Khử khuẩn dụng cụ cắt sau mỗi cây.", "Che/bảo vệ vết cắt lớn theo khuyến cáo địa phương.", "Không kỳ vọng thuốc lá chữa được mô gỗ đã nhiễm nặng."],
        followUp: ["Theo dõi cây suy kiệt, cân nhắc loại bỏ cây nặng.", "Tỉa vào thời điểm khô ráo và quản lý vết thương.", "Ghi hồ sơ cây bệnh để quyết định cải tạo vườn."],
        steps: ["Xác nhận Esca bằng triệu chứng lá và dấu hiệu bệnh gỗ trên nho.", "Tập trung vệ sinh, cắt tỉa đúng thời điểm và bảo vệ vết thương.", "Loại bỏ nguồn bệnh gỗ nặng, không dùng thuốc như phác đồ nấm lá thông thường.", "Theo dõi dài hạn vì Esca là bệnh thân cành khó phục hồi."],
        products: [product("Keo bảo vệ vết cắt", "Bảo vệ cơ học/sinh học")],
      };
    case "grape_leaf_blight":
      return {
        immediate: ["Tỉa bỏ lá nho cháy nặng và dọn lá rụng.", "Tạo thông thoáng quanh chùm và tán.", "Tránh tưới phun vào chiều tối."],
        next24h: ["Phun thuốc trị nấm lá nho nếu vết cháy tiếp tục lan.", "Phủ đều tán dưới vì mầm bệnh thường tồn trên lá rụng.", "Ghi lại vị trí vườn bị cháy lá nhiều."],
        followUp: ["Kiểm tra lá mới sau 5 ngày.", "Thu gom lá rụng định kỳ.", "Luân phiên hoạt chất ở lần xử lý tiếp theo."],
        steps: ["Xác nhận cháy lá Isariopsis trên nho.", "Loại bỏ lá bệnh và giảm ẩm trong tán.", "Phun thuốc trị nấm theo nhãn khi bệnh đang lan.", "Kết hợp vệ sinh vườn để giảm tái nhiễm."],
        products: [baseProducts.fungal, product("Difenoconazole", "Triazole")],
      };
    case "huanglongbing":
      return {
        immediate: ["Đánh dấu cây cam quýt nghi HLB và kiểm tra vàng lá lệch, quả méo, rễ suy.", "Kiểm tra rầy chổng cánh trên lộc non.", "Không lấy mắt ghép/cành giống từ cây nghi bệnh."],
        next24h: ["Báo kỹ thuật viên hoặc cơ quan BVTV địa phương nếu nghi HLB nặng.", "Quản lý rầy chổng cánh theo nhãn và bảo vệ thiên địch.", "Cách ly dụng cụ, không di chuyển vật liệu cây bệnh."],
        followUp: ["Theo dõi cây lân cận và lộc non.", "Loại bỏ cây nhiễm nặng theo hướng dẫn địa phương.", "Dùng cây giống sạch bệnh cho trồng mới."],
        steps: ["Xác minh HLB bằng triệu chứng đặc trưng và, nếu có thể, xét nghiệm.", "Không xem HLB là bệnh có thể chữa khỏi bằng phun thuốc lá.", "Quản lý rầy môi giới và cây nguồn bệnh.", "Lập kế hoạch phục hồi vườn bằng giống sạch bệnh."],
        products: [product("Dầu khoáng / thuốc quản lý rầy", "Quản lý côn trùng môi giới")],
      };
    case "bacterial_spot":
      return {
        immediate: [withCrop(entry, "Loại bỏ lá hoặc quả có đốm vi khuẩn nặng"), "Ngưng tưới phun mưa, tránh thao tác khi tán còn ướt.", "Khử khuẩn tay và dụng cụ khi chuyển giữa cây bệnh và cây khỏe."],
        next24h: [`Phun sản phẩm gốc đồng hoặc thuốc vi khuẩn được phép cho ${crop}.`, "Tập trung mặt dưới lá và vùng vết bệnh mới.", "Kiểm tra nguồn nước/tàn dư vì vi khuẩn lây mạnh qua giọt bắn."],
        followUp: ["Theo dõi đốm mới sau mưa.", "Luân phiên hoặc phối hợp theo nhãn để giảm kháng đồng.", "Dọn tàn dư bệnh cuối vụ và luân canh cây không cùng ký chủ."],
        steps: [`Xác nhận đốm vi khuẩn trên ${crop}; không nhầm với đốm nấm khô có vòng đồng tâm.`, "Vệ sinh tán, giảm giọt bắn và loại bỏ bộ phận bệnh nặng.", "Dùng thuốc vi khuẩn/gốc đồng theo nhãn, không phun khi trời sắp mưa.", "Theo dõi mưa, ẩm và vết mới trong 3-5 ngày."],
        products: [baseProducts.copper, product("Kasugamycin", "Kháng sinh nông nghiệp được phép")],
      };
    case "early_blight":
      return {
        immediate: [withCrop(entry, "Tỉa bỏ lá già có đốm vòng đồng tâm"), "Dọn lá bệnh chạm đất và giảm ẩm quanh gốc.", "Không tưới phun lên lá vào chiều tối."],
        next24h: [`Phun thuốc trị Alternaria phù hợp cho ${crop} nếu bệnh đang lan.`, "Phủ đều lá tầng dưới vì bệnh thường bắt đầu từ lá già.", "Bổ sung dinh dưỡng cân đối, tránh cây suy."],
        followUp: ["Kiểm tra lá mới sau 5 ngày.", "Luân phiên nhóm thuốc nếu cần lặp lại.", "Dọn tàn dư sau vụ và luân canh cây khác họ."],
        steps: [`Xác nhận cháy lá sớm trên ${crop} qua đốm nâu có vòng đồng tâm.`, "Tỉa lá bệnh, giảm ẩm và vệ sinh luống.", "Dùng thuốc nấm đúng nhãn khi bệnh vượt ngưỡng.", "Theo dõi lá tầng dưới và điều chỉnh tưới."],
        products: [baseProducts.fungal, baseProducts.strobilurinTriazole],
      };
    case "late_blight":
    case "potato_phytophthora":
      return {
        immediate: [withCrop(entry, "Cách ly và loại bỏ lá/thân bị sương mai nặng"), "Ngưng tưới phun, giảm ẩm tán ngay.", "Kiểm tra mặt dưới lá có mốc trắng trong sáng sớm."],
        next24h: [`Phun thuốc đặc trị Phytophthora cho ${crop} càng sớm càng tốt nếu triệu chứng khớp.`, "Không để tàn dư bệnh tiếp xúc cây khỏe.", "Theo dõi dự báo mưa, sương và nhiệt độ mát."],
        followUp: ["Tái kiểm tra sau 48-72 giờ vì bệnh lan rất nhanh.", "Luân phiên hoạt chất chống Phytophthora theo nhãn.", "Tiêu hủy cây/bộ phận nhiễm nặng, không ủ tươi trong vườn."],
        steps: [`Xác nhận sương mai/cháy muộn trên ${crop}; ưu tiên kiểm tra trong điều kiện mát ẩm.`, "Loại bỏ nguồn bệnh nặng và giảm ẩm tức thì.", "Dùng thuốc đặc trị Phytophthora đúng liều, đúng thời điểm.", "Theo dõi sát 2-3 ngày vì đây là bệnh có tốc độ lan cao."],
        products: [baseProducts.phosphonate, product("Mandipropamid / Cymoxanil", "Đặc trị Phytophthora")],
      };
    case "potato_bacteria":
      return {
        immediate: ["Cách ly cây khoai tây nghi bệnh vi khuẩn và kiểm tra thân/củ.", "Loại bỏ cây thối mềm hoặc héo nặng khỏi ruộng.", "Khử khuẩn dụng cụ, tránh làm lan qua nước tưới."],
        next24h: ["Xử lý cục bộ bằng sản phẩm vi khuẩn được phép nếu triệu chứng còn sớm.", "Giảm ẩm đất và cải thiện thoát nước.", "Kiểm tra củ giống, loại bỏ củ có mùi thối hoặc dịch nhớt."],
        followUp: ["Theo dõi cây cạnh bên trong 5-7 ngày.", "Không dùng củ từ lô bệnh làm giống.", "Luân canh và vệ sinh kho bảo quản."],
        steps: ["Xác minh nhóm bệnh vi khuẩn khoai tây qua lá, thân và củ.", "Loại bỏ cây/củ bệnh nặng trước khi xử lý.", "Giảm nước lan truyền và khử khuẩn dụng cụ.", "Chỉ dùng thuốc theo nhãn khi bệnh còn ở giai đoạn có thể kiểm soát."],
        products: [baseProducts.copper, product("Kasugamycin", "Kháng sinh nông nghiệp được phép")],
      };
    case "potato_fungi":
      return {
        immediate: ["Kiểm tra dạng đốm nấm trên lá khoai tây và mức lan trong ruộng.", "Tỉa bỏ lá bệnh nặng sát mặt đất.", "Giảm ẩm tán, không tưới phun cuối ngày."],
        next24h: ["Phun thuốc trị nấm khoai tây theo nhãn nếu bệnh đang lan.", "Bảo vệ lá non và lá quanh tán giữa.", "Ghi nhận thời tiết ẩm/mưa gần đây."],
        followUp: ["Tái kiểm tra sau 5 ngày.", "Luân phiên thuốc tiếp xúc và nội hấp nếu cần.", "Dọn tàn dư sau vụ."],
        steps: ["Xác minh nhóm bệnh nấm khoai tây qua dạng đốm và lớp mốc.", "Giảm nguồn bệnh trên lá và trong ruộng.", "Dùng thuốc nấm phù hợp theo nhãn.", "Theo dõi lá mới để đánh giá hiệu quả."],
        products: [baseProducts.fungal, product("Difenoconazole", "Triazole")],
      };
    case "potato_virus":
    case "cassava_brown_streak":
    case "cassava_mosaic":
      return {
        immediate: [`Đánh dấu cây ${crop} có triệu chứng virus như khảm, xoăn lá hoặc còi cọc.`, "Kiểm tra côn trùng môi giới trên lá non.", "Không dùng cây/hom/củ từ cây nghi bệnh làm giống."],
        next24h: ["Loại bỏ cây nhiễm nặng nếu tỷ lệ thấp và còn sớm.", "Quản lý côn trùng môi giới theo nhãn.", "Vệ sinh dụng cụ và cỏ dại/ký chủ phụ quanh lô."],
        followUp: ["Theo dõi cây lân cận trong 7-10 ngày.", "Sử dụng giống sạch bệnh hoặc chống chịu ở vụ sau.", "Không vận chuyển vật liệu giống từ lô bệnh sang lô sạch."],
        steps: [`Xác minh ${entry.diseaseName} bằng triệu chứng đặc trưng trên ${crop}.`, "Không có thuốc phun chữa khỏi virus; tập trung loại nguồn bệnh và môi giới.", "Quản lý côn trùng chích hút theo nhãn.", "Lập kế hoạch giống sạch bệnh cho vụ sau."],
        products: [product("Dầu khoáng / thuốc quản lý môi giới", "Quản lý côn trùng truyền virus")],
      };
    case "cassava_bacterial_blight":
      return {
        immediate: ["Cắt bỏ lá/cành sắn cháy vi khuẩn nặng trong ngày khô ráo.", "Khử khuẩn dao sau mỗi cây.", "Không vận chuyển hom giống từ lô nghi bệnh."],
        next24h: ["Phun sản phẩm gốc đồng nếu bệnh còn ở tán lá và điều kiện cho phép.", "Giảm lây lan qua nước mưa, dọn tàn dư bệnh.", "Kiểm tra vết thâm gân, cháy lá sau mưa gió."],
        followUp: ["Theo dõi lộc mới trong 7 ngày.", "Dùng hom giống sạch bệnh cho vụ sau.", "Luân canh và vệ sinh đồng ruộng."],
        steps: ["Xác nhận cháy lá vi khuẩn sắn qua đốm úng, thâm gân và cháy lá.", "Cắt bỏ nguồn bệnh và khử khuẩn dụng cụ.", "Dùng gốc đồng theo nhãn nếu bệnh đang ở tán lá.", "Ngăn dùng hom bệnh làm giống."],
        products: [baseProducts.copper],
      };
    case "cassava_green_mottle":
      return {
        immediate: ["Đối chiếu đốm xanh/khảm nhẹ trên lá sắn với thiếu dinh dưỡng.", "Đánh dấu cây biểu hiện rõ để theo dõi.", "Kiểm tra côn trùng chích hút quanh lô."],
        next24h: ["Không phun thuốc nặng khi chưa xác minh; ưu tiên kiểm tra dinh dưỡng và môi giới.", "Loại bỏ cây biểu hiện nặng nếu tỷ lệ thấp.", "Vệ sinh cỏ dại quanh lô sắn."],
        followUp: ["Theo dõi lá non mới trong 7 ngày.", "Dùng hom giống sạch bệnh.", "Ghi nhận khu vực lặp lại triệu chứng để điều tra nguồn giống."],
        steps: ["Xác minh đốm xanh lá sắn và loại trừ stress dinh dưỡng.", "Theo dõi tiến triển trên lá non.", "Quản lý côn trùng môi giới nếu xuất hiện.", "Không dùng hom từ cây có triệu chứng bất thường."],
        products: [product("Dinh dưỡng vi lượng / quản lý môi giới", "Theo nguyên nhân xác minh")],
      };
    case "leaf_scorch":
      return {
        immediate: ["Kiểm tra cháy mép lá dâu tây và loại trừ nắng nóng/thiếu nước.", "Tỉa lá cháy nặng, tránh để lá bệnh chạm quả.", "Điều chỉnh tưới giữ ẩm đều nhưng không úng."],
        next24h: ["Phun thuốc nấm nếu có đốm/cháy lan trong điều kiện ẩm.", "Bổ sung che nhẹ nếu cháy do stress nắng.", "Kiểm tra EC/pH giá thể hoặc đất."],
        followUp: ["Theo dõi lá non mới sau 5 ngày.", "Dọn lá già định kỳ.", "Ổn định tưới và dinh dưỡng canxi-kali."],
        steps: ["Phân biệt cháy lá dâu tây do bệnh nấm với stress môi trường.", "Loại bỏ lá nặng và chỉnh nước/dinh dưỡng.", "Chỉ dùng thuốc nấm khi có dấu hiệu bệnh lan.", "Theo dõi lá mới để xác nhận nguyên nhân."],
        products: [baseProducts.fungal, product("Canxi-Bo / Kali", "Dinh dưỡng hỗ trợ")],
      };
    case "leaf_mold":
      return {
        immediate: ["Tỉa bớt lá cà chua bị mốc lá nặng, nhất là tầng dưới.", "Tăng thông gió nhà màng/luống, giảm ẩm ban đêm.", "Không tưới phun lên lá."],
        next24h: ["Phun thuốc trị mốc lá khi mặt dưới lá còn có lớp mốc đang lan.", "Tập trung mặt dưới lá và khu vực tán rậm.", "Giảm mật độ lá bằng tỉa hợp lý."],
        followUp: ["Theo dõi lá mới sau 5 ngày.", "Duy trì ẩm độ thấp hơn trong nhà màng.", "Luân phiên hoạt chất nếu phải phun lặp lại."],
        steps: ["Xác nhận mốc lá cà chua bằng vàng mặt trên và mốc mặt dưới lá.", "Giảm ẩm và tăng lưu thông khí trước khi phun.", "Dùng thuốc trị nấm theo nhãn, phủ mặt dưới lá.", "Theo dõi ẩm độ ban đêm để tránh tái phát."],
        products: [product("Difenoconazole", "Triazole"), product("Chlorothalonil", "Tiếp xúc")],
      };
    case "septoria_leaf_spot":
      return {
        immediate: ["Tỉa lá cà chua có nhiều đốm nhỏ xám nâu ở tầng dưới.", "Dọn lá rụng và tàn dư quanh gốc.", "Tưới gốc, tránh bắn đất lên lá."],
        next24h: ["Phun thuốc trị Septoria nếu đốm lan nhanh sau mưa.", "Phủ đều lá tầng dưới và giữa.", "Bổ sung lớp phủ gốc để giảm bắn đất."],
        followUp: ["Kiểm tra lá mới sau 5-7 ngày.", "Tỉa lá già định kỳ.", "Luân canh cây khác họ cà ở vụ sau."],
        steps: ["Xác nhận đốm lá Septoria bằng nhiều chấm nhỏ có tâm xám.", "Loại bỏ lá nguồn bệnh và giảm bắn đất.", "Dùng thuốc nấm theo nhãn khi bệnh còn lan.", "Theo dõi lá tầng dưới sau mưa."],
        products: [baseProducts.fungal, product("Azoxystrobin", "Strobilurin")],
      };
    case "spider_mites":
      return {
        immediate: ["Kiểm tra mặt dưới lá cà chua có nhện đỏ, trứng và tơ mịn.", "Tách cây nhiễm nặng, cắt bỏ lá bạc vàng nhiều.", "Tăng ẩm không khí hợp lý nhưng tránh làm bùng bệnh nấm."],
        next24h: ["Phun thuốc trừ nhện đúng nhóm, phủ kỹ mặt dưới lá.", "Không dùng thuốc trừ sâu phổ rộng làm chết thiên địch nếu không cần.", "Lặp kiểm tra sau 48 giờ vì trứng có thể nở tiếp."],
        followUp: ["Luân phiên nhóm thuốc trừ nhện để tránh kháng.", "Theo dõi điểm nóng ở mép luống/nhà màng.", "Dọn cỏ ký chủ quanh vườn."],
        steps: ["Xác nhận nhện đỏ hai chấm trên cà chua bằng chấm vàng li ti và tơ.", "Cắt lá nhiễm nặng và giảm bụi/khô nóng.", "Dùng thuốc trừ nhện phủ mặt dưới lá theo nhãn.", "Theo dõi trứng và nhện non sau 2-3 ngày."],
        products: [product("Abamectin", "Avermectin"), product("Fenpyroximate", "METI acaricide")],
      };
    case "target_spot":
      return {
        immediate: ["Tỉa lá cà chua có đốm vòng lan rộng.", "Giảm ẩm tán và dọn lá bệnh rụng.", "Tránh tưới phun mưa trong thời gian bệnh đang phát triển."],
        next24h: ["Phun thuốc trị nấm đốm vòng khi bệnh lan ở tầng lá giữa.", "Phủ đều mặt dưới lá và vùng tán rậm.", "Ghi nhận tỷ lệ lá nhiễm để quyết định lần xử lý sau."],
        followUp: ["Kiểm tra vết mới sau 5 ngày.", "Luân phiên hoạt chất nếu cần phun lặp.", "Tăng khoảng cách thông thoáng ở vụ sau."],
        steps: ["Xác nhận đốm vòng cà chua và phân biệt với cháy lá sớm.", "Tỉa lá bệnh, giảm ẩm và vệ sinh luống.", "Dùng thuốc nấm theo nhãn nếu bệnh tiếp tục lan.", "Theo dõi tầng lá giữa và lá non."],
        products: [baseProducts.strobilurinTriazole, baseProducts.fungal],
      };
    case "yellow_leaf_curl_virus":
      return {
        immediate: ["Đánh dấu cây cà chua xoăn vàng lá, lùn ngọn hoặc giảm đậu trái.", "Kiểm tra bọ phấn trắng ở mặt dưới lá non.", "Tách hoặc loại bỏ cây nhiễm nặng nếu tỷ lệ còn thấp."],
        next24h: ["Quản lý bọ phấn theo nhãn, ưu tiên điểm nóng trong nhà màng/luống.", "Dùng bẫy dính vàng để giám sát mật số.", "Không nhân giống hoặc giữ cây bệnh làm nguồn lây."],
        followUp: ["Theo dõi cây non lân cận trong 7 ngày.", "Vệ sinh cỏ dại ký chủ phụ.", "Dùng giống chống chịu và lưới chắn côn trùng ở vụ sau."],
        steps: ["Xác nhận virus xoăn vàng lá cà chua bằng lá non vàng xoăn và cây còi.", "Không có thuốc chữa virus; loại nguồn bệnh và quản lý bọ phấn.", "Theo dõi bằng bẫy dính và kiểm tra lá non.", "Dùng giống sạch/chống chịu cho lứa sau."],
        products: [product("Bẫy dính vàng", "Giám sát bọ phấn", "Theo mật độ"), product("Dầu khoáng / thuốc quản lý bọ phấn", "Quản lý môi giới virus")],
      };
    case "tomato_mosaic_virus":
      return {
        immediate: ["Đánh dấu cây cà chua có khảm xanh vàng, lá biến dạng.", "Khử khuẩn tay, dao, dây buộc khi thao tác.", "Không tiếp xúc cây khỏe ngay sau khi chạm cây nghi virus."],
        next24h: ["Loại bỏ cây nhiễm nặng nếu nguồn lây còn khu trú.", "Vệ sinh khay, cọc, dây và dụng cụ.", "Không dùng hạt/giống từ cây nghi bệnh."],
        followUp: ["Theo dõi cây lân cận trong 7 ngày.", "Quản lý tàn dư và cỏ dại họ cà.", "Dùng giống sạch bệnh và quy trình vệ sinh tay/dụng cụ."],
        steps: ["Xác nhận virus khảm cà chua bằng vân xanh vàng loang và biến dạng lá.", "Không phun thuốc để chữa virus; tập trung vệ sinh và loại nguồn bệnh.", "Khử khuẩn dụng cụ, hạn chế lây cơ học.", "Theo dõi cây lân cận và loại bỏ nguồn lây nặng."],
        products: [product("Dung dịch khử khuẩn dụng cụ", "Vệ sinh cơ học")],
      };
    default:
      return null;
  }
};

export const getCatalogTreatmentProtocol = (diagnosis: Diagnosis | null): CatalogTreatmentProtocol | null => {
  if (!diagnosis?.rawLabel) return null;
  const entry = getPlantDiseaseCatalogEntry(diagnosis.rawLabel);
  if (!entry || entry.healthy || entry.diseaseKey === "healthy") return null;
  const seed = makeProtocolSeed(entry);
  if (!seed) return null;

  return {
    source: "catalog",
    catalogEntry: entry,
    ...seed,
    safety: [
      "Chỉ dùng thuốc khi triệu chứng ngoài thực địa khớp với kết quả AI và đọc đúng nhãn sản phẩm.",
      "Không pha quá liều, mang bảo hộ và tuân thủ thời gian cách ly theo nhãn.",
      `Theo dõi riêng lô ${entry.cropName} này để tránh nhầm với cây trồng hoặc bệnh khác.`,
    ],
  };
};
