import { IntensiveDisease, TreatmentProtocol } from "../types.js";
import { isSupabaseConfigured, supabase } from "../lib/supabase.js";

export type SymptomOption =
  | "Lá vàng"
  | "Héo rũ"
  | "Đốm nâu"
  | "Thối rễ"
  | "Lá cuốn"
  | "Mốc trắng"
  | "Cháy mép lá"
  | "Thối thân"
  | "Vàng lá gân xanh"
  | "Rụng hoa"
  | "Nứt thân"
  | "Sâu ăn lá";

export type RecommendationDiseaseProfile = IntensiveDisease & {
  quickAction: string;
  confidenceBase: number;
  immediateActions: string[];
  stagePlans: {
    immediate: string[];
    next24h: string[];
    followUp: string[];
  };
  symptomOptions: SymptomOption[];
};

type SupabaseDiseaseRow = {
  id: string;
  name: string;
  crop_id?: string;
  crop_type?: string;
  cropType?: string;
  type: IntensiveDisease["type"];
  description: string;
  symptoms: string | string[];
  impact_level?: string;
  impactLevel?: string;
  causes: string;
  protocols: TreatmentProtocol[];
  alternatives: TreatmentProtocol[] | null;
  usage_notes?: IntensiveDisease["usageNotes"];
  usageNotes?: IntensiveDisease["usageNotes"];
  references: string[] | null;
  reference_sources?: string[] | null;
  quick_action?: string;
  quickAction?: string;
  confidence_base?: number;
  confidenceBase?: number;
  immediate_actions?: string[];
  immediateActions?: string[];
  stage_plans?: RecommendationDiseaseProfile["stagePlans"];
  stagePlans?: RecommendationDiseaseProfile["stagePlans"];
  symptom_options?: SymptomOption[];
  symptomOptions?: SymptomOption[];
};

const cropIdLabelMap: Record<string, string> = {
  tomato: "Cà chua",
  rice: "Lúa",
  pepper: "Ớt",
  cucumber: "Dưa leo",
  orange: "Cam",
  pomelo: "Bưởi",
  mango: "Xoài",
  durian: "Sầu riêng",
  coffee: "Cà phê",
  dragon_fruit: "Thanh long",
  dragonfruit: "Thanh long",
  "dragon-fruit": "Thanh long",
};

export const fallbackRecommendationProfiles: RecommendationDiseaseProfile[] = [
  {
    id: "tomato-root-rot",
    name: "Thối rễ do nấm",
    cropType: "Cà chua",
    type: "fungal",
    description: "Bệnh thường xuất hiện ở vùng rễ khi đất ẩm kéo dài, làm cây suy yếu nhanh và dễ chết rũ từng cụm.",
    symptoms: "Lá vàng từ gốc lên, cây héo ban ngày, rễ nâu đen và có mùi thối.",
    impactLevel: "Cao",
    causes: "Ẩm độ đất cao kéo dài, giá thể bí chặt, nấm đất tồn lưu và tưới quá dày.",
    protocols: [
      {
        id: "trr-moderate",
        severity: "moderate",
        steps: [
          "Ngừng tưới đẫm trong 1-2 ngày và mở thoáng gốc.",
          "Loại bỏ cây hư nặng để giảm nguồn bệnh trong luống.",
          "Tưới gốc bằng thuốc phù hợp theo khuyến cáo trên nhãn.",
          "Bổ sung vi sinh hoặc hữu cơ hoai để phục hồi vùng rễ."
        ],
        drugs: [
          { name: "Ridomil Gold", activeIngredient: "Metalaxyl + Mancozeb", dosage: "25g/16L" },
          { name: "Aliette", activeIngredient: "Fosetyl-Al", dosage: "30g/16L" }
        ],
        usage: "Ưu tiên tưới vùng gốc, kết hợp cải thiện thoát nước.",
        frequency: "2-3 lần",
        interval: "5-7 ngày",
        notes: "Không tưới vào cuối chiều khi đất còn ẩm nặng."
      }
    ],
    usageNotes: {
      timing: "Xử lý ngay khi thấy héo rũ đi kèm vàng lá và rễ có dấu hiệu nâu đen.",
      weather: "Ưu tiên xử lý lúc sáng sớm, tránh mưa kéo dài sau khi tưới thuốc.",
      safety: "Đeo găng, khẩu trang và tránh để thuốc đọng ở nguồn nước sinh hoạt.",
      withdrawal: "7 ngày tùy sản phẩm."
    },
    quickAction: "Ngừng tưới đẫm, kiểm tra vùng rễ và mở thoáng gốc ngay hôm nay.",
    confidenceBase: 76,
    immediateActions: [
      "Dừng tưới dồn trong 24 giờ tới.",
      "Bới kiểm tra rễ ở 3-5 cây đại diện.",
      "Đánh dấu và cách ly cây đã héo nặng."
    ],
    stagePlans: {
      immediate: ["Ngừng tưới mạnh", "Tách cây bệnh nặng", "Mở rãnh thoát nước"],
      next24h: ["Tưới gốc bằng thuốc phù hợp", "Khử khuẩn dụng cụ", "Bổ sung giá thể thoáng khí"],
      followUp: ["Theo dõi cây lân cận 3 ngày", "Giảm mật độ ẩm vùng gốc", "Điều chỉnh lịch tưới cố định"]
    },
    symptomOptions: ["Lá vàng", "Héo rũ", "Thối rễ", "Thối thân"]
  },
  {
    id: "rice-blast",
    name: "Đạo ôn lá",
    cropType: "Lúa",
    type: "fungal",
    description: "Bệnh phổ biến trên lúa trong điều kiện ẩm cao, có thể làm cháy lá và ảnh hưởng mạnh đến năng suất.",
    symptoms: "Vết bệnh hình thoi, tâm xám trắng, rìa nâu, lá cháy từng mảng.",
    impactLevel: "Cao",
    causes: "Ẩm độ cao, bón thừa đạm, ruộng rậm và sương mù kéo dài.",
    protocols: [
      {
        id: "rb-moderate",
        severity: "moderate",
        steps: [
          "Ngưng bón thêm đạm trong ngắn hạn.",
          "Giữ mực nước ổn định thay vì thay đổi đột ngột.",
          "Phun thuốc đặc trị theo nhãn vào sáng sớm hoặc chiều mát.",
          "Kiểm tra lại sau 5 ngày để đánh giá vết bệnh mới."
        ],
        drugs: [
          { name: "Beam 75WP", activeIngredient: "Tricyclazole", dosage: "20g/16L" },
          { name: "Filia 525SE", activeIngredient: "Tricyclazole + Propiconazole", dosage: "20ml/16L" }
        ],
        usage: "Phun đều hai mặt lá, tập trung ổ bệnh trước.",
        frequency: "2 lần",
        interval: "5-7 ngày",
        notes: "Không phun khi gió mạnh hoặc trước mưa."
      }
    ],
    usageNotes: {
      timing: "Xử lý khi vết bệnh mới xuất hiện hoặc khi thời tiết thuận lợi cho bệnh bùng phát.",
      weather: "Tránh mưa trong vài giờ sau phun.",
      safety: "Mang bảo hộ đầy đủ, tuân thủ đúng liều trên nhãn.",
      withdrawal: "7-14 ngày."
    },
    quickAction: "Ngưng đạm, khoanh vùng ổ bệnh và phun xử lý sớm.",
    confidenceBase: 74,
    immediateActions: [
      "Dừng bón đạm thêm.",
      "Khảo sát mật độ vết bệnh theo từng đám ruộng.",
      "Chuẩn bị thuốc xử lý trước khi trời tiếp tục ẩm."
    ],
    stagePlans: {
      immediate: ["Khoanh ổ bệnh", "Ngưng đạm", "Giữ mực nước ổn định"],
      next24h: ["Phun thuốc đúng liều", "Ghi nhận vùng nặng", "So sánh lá mới nhiễm"],
      followUp: ["Tái kiểm tra sau 5-7 ngày", "Điều chỉnh dinh dưỡng", "Theo dõi cổ bông khi gần trổ"]
    },
    symptomOptions: ["Đốm nâu", "Lá cuốn", "Cháy mép lá", "Lá vàng"]
  },
  {
    id: "pepper-bacterial-wilt",
    name: "Héo xanh vi khuẩn",
    cropType: "Ớt",
    type: "bacterial",
    description: "Bệnh làm cây héo đột ngột dù lá còn xanh, rất khó hồi phục nếu phát hiện muộn.",
    symptoms: "Cây héo nhanh, cắt thân thấy mạch nâu, có dịch vi khuẩn trắng đục.",
    impactLevel: "Rất cao",
    causes: "Vi khuẩn tồn trong đất, nước tưới nhiễm khuẩn, luân canh kém và nhiệt độ đất cao.",
    protocols: [
      {
        id: "pbw-severe",
        severity: "severe",
        steps: [
          "Nhổ bỏ cây bệnh và mang ra khỏi khu canh tác.",
          "Khử khuẩn hố trồng và dụng cụ tiếp xúc.",
          "Giảm di chuyển nước từ khu bệnh sang khu khỏe.",
          "Bổ sung vi sinh và cải tạo đất cho vụ sau."
        ],
        drugs: [{ name: "Kasumin", activeIngredient: "Kasugamycin", dosage: "20ml/16L" }],
        usage: "Xử lý kết hợp tiêu hủy cây bệnh và vệ sinh vùng trồng.",
        frequency: "2 lần",
        interval: "5 ngày",
        notes: "Hiệu quả phụ thuộc phát hiện sớm và vệ sinh đồng ruộng."
      }
    ],
    usageNotes: {
      timing: "Can thiệp ngay khi phát hiện cây héo đột ngột.",
      weather: "Hạn chế thao tác khi ruộng ướt sũng làm lây lan qua nước.",
      safety: "Vệ sinh tay, dụng cụ, giày dép sau khi xử lý vùng bệnh.",
      withdrawal: "Theo nhãn sản phẩm sử dụng."
    },
    quickAction: "Nhổ bỏ cây héo đột ngột và khử khuẩn khu vực quanh gốc.",
    confidenceBase: 78,
    immediateActions: [
      "Đánh dấu cây héo đột ngột.",
      "Nhổ bỏ và tiêu hủy cây nặng.",
      "Không để nước chảy từ khu bệnh sang khu khỏe."
    ],
    stagePlans: {
      immediate: ["Nhổ cây bệnh", "Khử khuẩn dụng cụ", "Ngăn dòng nước lây bệnh"],
      next24h: ["Kiểm tra thêm cây cạnh bên", "Xử lý cục bộ vùng gốc", "Giảm ẩm đất"],
      followUp: ["Xem lại luân canh", "Bổ sung vi sinh đất", "Theo dõi cây mới héo"]
    },
    symptomOptions: ["Héo rũ", "Lá vàng", "Thối thân"]
  },
  {
    id: "cucumber-downy-mildew",
    name: "Sương mai dưa leo",
    cropType: "Dưa leo",
    type: "fungal",
    description: "Bệnh phát triển nhanh khi ẩm cao, làm lá vàng loang và giảm quang hợp mạnh.",
    symptoms: "Mặt lá có đốm vàng góc cạnh, mặt dưới có lớp mốc xám tím.",
    impactLevel: "Trung bình đến cao",
    causes: "Ẩm độ cao, tưới chiều muộn, tán lá rậm và nhà màng kém thông thoáng.",
    protocols: [
      {
        id: "cdm-moderate",
        severity: "moderate",
        steps: [
          "Tỉa lá bệnh nặng và tăng thông thoáng tán.",
          "Giảm tưới chiều tối, ưu tiên tưới sáng.",
          "Phun thuốc phù hợp khi bệnh mới chớm lan.",
          "Theo dõi lá non trong 48 giờ tiếp theo."
        ],
        drugs: [{ name: "Revus Opti", activeIngredient: "Mandipropamid + Chlorothalonil", dosage: "25ml/16L" }],
        usage: "Phun phủ đều hai mặt lá, ưu tiên tầng lá thấp.",
        frequency: "2-3 lần",
        interval: "5 ngày",
        notes: "Kết hợp thông gió nhà lưới hoặc giàn leo."
      }
    ],
    usageNotes: {
      timing: "Xử lý sớm khi mới xuất hiện đốm vàng góc cạnh.",
      weather: "Tránh phun sát cơn mưa hoặc khi lá còn ướt đẫm.",
      safety: "Mặc đồ bảo hộ và rửa sạch bình phun sau dùng.",
      withdrawal: "5-7 ngày."
    },
    quickAction: "Giảm ẩm lá, tỉa lá bệnh và tăng thông gió ngay.",
    confidenceBase: 72,
    immediateActions: ["Tỉa bỏ lá bị nặng.", "Ngừng tưới chiều tối.", "Mở giàn cho tán thoáng."],
    stagePlans: {
      immediate: ["Tỉa lá nặng", "Giảm ẩm lá", "Mở thông gió"],
      next24h: ["Phun xử lý nếu bệnh lan", "Kiểm tra mặt dưới lá", "Theo dõi đốm mới"],
      followUp: ["Duy trì tưới sáng", "Giãn tán lá", "Kiểm tra lô kế bên"]
    },
    symptomOptions: ["Lá vàng", "Đốm nâu", "Mốc trắng", "Cháy mép lá"]
  },
  {
    id: "rice-brown-spot",
    name: "Đốm nâu lá lúa",
    cropType: "Lúa",
    type: "fungal",
    description: "Bệnh làm lá xuất hiện nhiều chấm nâu, ảnh hưởng quang hợp khi ruộng thiếu dinh dưỡng hoặc thời tiết thất thường.",
    symptoms: "Lá có nhiều đốm tròn nâu, tâm xám, viền nâu đậm.",
    impactLevel: "Trung bình",
    causes: "Ruộng thiếu kali, cây suy yếu, ẩm độ cao kéo dài.",
    protocols: [
      {
        id: "rbs-mild",
        severity: "mild",
        steps: ["Bổ sung kali cân đối.", "Giữ ruộng thông thoáng.", "Theo dõi đốm mới sau 3 ngày."],
        drugs: [{ name: "Anvil", activeIngredient: "Hexaconazole", dosage: "15ml/16L" }],
        usage: "Phun sớm khi tỷ lệ lá bệnh còn thấp.",
        frequency: "1-2 lần",
        interval: "5-7 ngày",
        notes: "Kết hợp cân đối phân bón."
      }
    ],
    usageNotes: {
      timing: "Xử lý khi bệnh mới xuất hiện rải rác.",
      weather: "Phun lúc trời khô ráo.",
      safety: "Mang găng tay và kính bảo hộ.",
      withdrawal: "7 ngày."
    },
    quickAction: "Kiểm tra lại dinh dưỡng ruộng và xử lý sớm các lá có nhiều đốm nâu.",
    confidenceBase: 68,
    immediateActions: ["Khảo sát mật độ lá bệnh.", "Bổ sung kali nếu ruộng đang yếu.", "Đánh dấu vùng bệnh tăng nhanh."],
    stagePlans: {
      immediate: ["Kiểm tra dinh dưỡng", "Đánh giá mật độ đốm", "Khoanh vùng nặng"],
      next24h: ["Phun xử lý nếu cần", "Giảm áp lực ẩm lá", "Ghi nhận phản ứng ruộng"],
      followUp: ["Theo dõi lá mới", "Cân đối lại phân", "So sánh vùng đã xử lý"]
    },
    symptomOptions: ["Đốm nâu", "Lá vàng"]
  },
  {
    id: "rice-sheath-blight",
    name: "Khô vằn",
    cropType: "Lúa",
    type: "fungal",
    description: "Bệnh tạo vết loang dạng vằn trên bẹ lá, thường bùng mạnh ở ruộng dày và ẩm nóng.",
    symptoms: "Bẹ lá có vết loang màu lục xám rồi nâu, dạng vằn da hổ, lá úa dần từ gốc.",
    impactLevel: "Cao",
    causes: "Mật độ dày, bón thừa đạm, nước ruộng giữ lâu và ẩm độ cao.",
    protocols: [
      {
        id: "rsb-moderate",
        severity: "moderate",
        steps: ["Giảm bón đạm.", "Giữ nước hợp lý.", "Phun thuốc vào vùng bẹ lá bị bệnh.", "Theo dõi lại sau 5 ngày."],
        drugs: [{ name: "Tilt Super", activeIngredient: "Propiconazole + Difenoconazole", dosage: "15ml/16L" }],
        usage: "Phun vào gốc và bẹ lá, nơi bệnh khởi phát nhiều.",
        frequency: "2 lần",
        interval: "5-7 ngày",
        notes: "Xử lý sớm ở đám ruộng mới nhiễm."
      }
    ],
    usageNotes: {
      timing: "Can thiệp khi thấy vết vằn đầu tiên trên bẹ lá.",
      weather: "Đặc biệt chú ý giai đoạn ẩm nóng liên tục.",
      safety: "Mang bảo hộ và pha đúng liều.",
      withdrawal: "7 ngày."
    },
    quickAction: "Giảm đạm và khoanh ngay vùng có bẹ lá xuất hiện vết vằn.",
    confidenceBase: 73,
    immediateActions: ["Kiểm tra bẹ lá gần mặt nước.", "Giảm đạm.", "Đánh dấu đám ruộng nhiễm sớm."],
    stagePlans: {
      immediate: ["Khoanh ổ bệnh", "Giảm đạm", "Điều chỉnh nước ruộng"],
      next24h: ["Phun xử lý bẹ lá", "Theo dõi vùng nặng", "Đánh giá mật độ bệnh"],
      followUp: ["Kiểm tra lại sau 5 ngày", "Giữ ruộng thông thoáng", "Điều chỉnh dinh dưỡng"]
    },
    symptomOptions: ["Đốm nâu", "Cháy mép lá", "Lá vàng"]
  },
  {
    id: "tomato-early-blight",
    name: "Sương mai sớm cà chua",
    cropType: "Cà chua",
    type: "fungal",
    description: "Bệnh xuất hiện trên lá già trước, tạo vết nâu đồng tâm và làm cây rụng lá nhanh khi ẩm cao.",
    symptoms: "Lá có đốm nâu tròn với vòng đồng tâm rõ, mép lá cháy và lá vàng rụng dần.",
    impactLevel: "Trung bình đến cao",
    causes: "Ẩm độ cao kéo dài, tán lá rậm và tưới làm ướt lá thường xuyên.",
    protocols: [
      {
        id: "teb-moderate",
        severity: "moderate",
        steps: ["Tỉa bỏ lá già bị bệnh nặng.", "Giảm tưới trực tiếp lên lá.", "Phun thuốc luân phiên theo nhãn.", "Theo dõi lá non sau 3-5 ngày."],
        drugs: [{ name: "Daconil", activeIngredient: "Chlorothalonil", dosage: "20ml/16L" }],
        usage: "Phun đều tán lá, tập trung tầng lá gốc.",
        frequency: "2 lần",
        interval: "5-7 ngày",
        notes: "Kết hợp tỉa tán để giảm ẩm."
      }
    ],
    usageNotes: {
      timing: "Xử lý sớm khi thấy đốm nâu đồng tâm đầu tiên.",
      weather: "Tránh phun sát mưa hoặc khi lá còn quá ướt.",
      safety: "Đeo khẩu trang và găng tay khi pha phun.",
      withdrawal: "7 ngày."
    },
    quickAction: "Tỉa lá già có vết nâu đồng tâm và giảm ẩm tán ngay.",
    confidenceBase: 72,
    immediateActions: ["Tỉa lá bệnh nặng.", "Ngừng tưới làm ướt lá.", "Mở thông tán bên trong luống."],
    stagePlans: {
      immediate: ["Tỉa lá già bệnh", "Giảm ẩm lá", "Khoanh vùng ổ bệnh"],
      next24h: ["Phun xử lý phù hợp", "Theo dõi lá non", "Kiểm tra lô cạnh bên"],
      followUp: ["Tái kiểm tra sau 5 ngày", "Luân phiên hoạt chất", "Duy trì tán thông thoáng"]
    },
    symptomOptions: ["Đốm nâu", "Lá vàng", "Cháy mép lá"]
  },
  {
    id: "tomato-bacterial-speck",
    name: "Đốm vi khuẩn trên cà chua",
    cropType: "Cà chua",
    type: "bacterial",
    description: "Tạo các chấm nâu đen nhỏ trên lá và trái, dễ lây lan khi mưa hoặc tưới văng bắn.",
    symptoms: "Lá có nhiều chấm nâu nhỏ, quanh vết có quầng vàng, trái có chấm đen sần.",
    impactLevel: "Trung bình",
    causes: "Ẩm lá kéo dài, vi khuẩn lây qua nước bắn và tàn dư cây bệnh.",
    protocols: [
      {
        id: "tbs-moderate",
        severity: "moderate",
        steps: ["Tỉa lá nhiễm nặng.", "Giảm tưới phun mưa.", "Phun thuốc gốc đồng đúng nhãn."],
        drugs: [{ name: "Kocide", activeIngredient: "Copper Hydroxide", dosage: "20g/16L" }],
        usage: "Phun sớm, phủ đều tán lá.",
        frequency: "2 lần",
        interval: "5 ngày",
        notes: "Tránh pha chung bừa bãi với phân bón lá."
      }
    ],
    usageNotes: {
      timing: "Nên xử lý khi mới thấy quầng vàng quanh vết bệnh.",
      weather: "Tránh phun khi sắp mưa.",
      safety: "Đeo khẩu trang và rửa tay sau khi pha thuốc.",
      withdrawal: "7 ngày."
    },
    quickAction: "Giảm tưới làm ướt lá và tỉa bỏ lá có nhiều vết chấm nâu ngay.",
    confidenceBase: 70,
    immediateActions: ["Loại bỏ lá bệnh nặng.", "Không tưới phun mưa.", "Kiểm tra trái non có vết đen hay không."],
    stagePlans: {
      immediate: ["Tỉa lá bệnh", "Giảm ẩm lá", "Khoanh ổ lây"],
      next24h: ["Phun xử lý gốc đồng", "Khử khuẩn kéo cắt", "Theo dõi lá non"],
      followUp: ["Giữ tán thông thoáng", "Theo dõi quầng vàng mới", "Xem lại nguồn nước tưới"]
    },
    symptomOptions: ["Đốm nâu", "Lá vàng", "Mốc trắng"]
  },
  {
    id: "pepper-anthracnose",
    name: "Thán thư ớt",
    cropType: "Ớt",
    type: "fungal",
    description: "Bệnh gây thối lõm trên quả và có thể lan nhanh trong điều kiện mưa ẩm.",
    symptoms: "Quả có vết thối lõm tròn, màu nâu đen, có vòng đồng tâm.",
    impactLevel: "Cao",
    causes: "Ẩm độ cao, quả chạm đất, vệ sinh tàn dư kém.",
    protocols: [
      {
        id: "pa-moderate",
        severity: "moderate",
        steps: ["Thu gom quả bệnh.", "Tỉa cho giàn thoáng.", "Phun thuốc luân phiên hoạt chất phù hợp."],
        drugs: [{ name: "Amistar Top", activeIngredient: "Azoxystrobin + Difenoconazole", dosage: "15ml/16L" }],
        usage: "Phun kỹ vùng có quả và tán dưới.",
        frequency: "2-3 lần",
        interval: "5-7 ngày",
        notes: "Luân phiên hoạt chất để giảm kháng thuốc."
      }
    ],
    usageNotes: {
      timing: "Xử lý sớm khi thấy vết lõm đầu tiên trên quả.",
      weather: "Tăng theo dõi sau những ngày mưa liên tục.",
      safety: "Mang bảo hộ và tuân thủ thời gian cách ly.",
      withdrawal: "7 ngày."
    },
    quickAction: "Thu gom ngay quả bị thối lõm và làm thông thoáng tán ớt.",
    confidenceBase: 73,
    immediateActions: ["Loại bỏ quả bệnh.", "Không để quả chạm đất.", "Khảo sát lô sau mưa."],
    stagePlans: {
      immediate: ["Thu gom quả bệnh", "Tăng thoáng tán", "Đánh dấu vùng nặng"],
      next24h: ["Phun luân phiên hoạt chất", "Kiểm tra quả mới", "Giảm ẩm vườn"],
      followUp: ["Theo dõi lứa quả tiếp theo", "Vệ sinh tàn dư", "Điều chỉnh nhịp thu hái"]
    },
    symptomOptions: ["Đốm nâu", "Thối thân", "Lá vàng"]
  },
  {
    id: "pepper-mites-damage",
    name: "Nhện đỏ hại ớt",
    cropType: "Ớt",
    type: "insect",
    description: "Nhện đỏ chích hút làm lá xoăn, vàng và cây suy nhanh trong thời tiết khô nóng.",
    symptoms: "Lá vàng, cong xoăn, mặt dưới lá có chấm li ti và tơ mỏng.",
    impactLevel: "Trung bình",
    causes: "Thời tiết khô nóng, ít mưa và tán cây rậm.",
    protocols: [
      {
        id: "pmd-mild",
        severity: "mild",
        steps: ["Kiểm tra kỹ mặt dưới lá.", "Tỉa lá bị hại nặng.", "Phun thuốc đặc trị nhện theo đúng nhãn.", "Theo dõi lại sau 3 ngày."],
        drugs: [{ name: "Ortus", activeIngredient: "Fenpyroximate", dosage: "10ml/16L" }],
        usage: "Phun kỹ mặt dưới lá, nơi nhện tập trung nhiều.",
        frequency: "2 lần",
        interval: "3-5 ngày",
        notes: "Không lạm dụng một hoạt chất liên tục."
      }
    ],
    usageNotes: {
      timing: "Xử lý sớm khi thấy lá bắt đầu vàng xoăn không đều.",
      weather: "Theo dõi sát những ngày nắng nóng kéo dài.",
      safety: "Mang bảo hộ và tránh phun lúc gió mạnh.",
      withdrawal: "Theo nhãn sản phẩm."
    },
    quickAction: "Lật mặt dưới lá kiểm tra nhện đỏ và xử lý sớm trước khi lan rộng.",
    confidenceBase: 69,
    immediateActions: ["Kiểm tra mặt dưới lá.", "Tỉa lá hại nặng.", "Giảm khô nóng cục bộ nếu có thể."],
    stagePlans: {
      immediate: ["Khảo sát nhện", "Tỉa lá hại", "Khoanh ổ nóng"],
      next24h: ["Phun thuốc đặc trị", "Kiểm tra lá non", "Đánh giá mức lan"],
      followUp: ["Tái kiểm tra sau 3-5 ngày", "Luân phiên hoạt chất", "Giữ tán thông thoáng"]
    },
    symptomOptions: ["Lá vàng", "Lá cuốn", "Cháy mép lá", "Sâu ăn lá"]
  },
  {
    id: "cucumber-root-rot",
    name: "Thối gốc rễ dưa leo",
    cropType: "Dưa leo",
    type: "fungal",
    description: "Cây sinh trưởng chậm, gốc thâm nâu và rễ tơ bị hư trong điều kiện ẩm kéo dài.",
    symptoms: "Gốc thân thâm nâu, cây héo buổi trưa, rễ ít và dễ đứt.",
    impactLevel: "Cao",
    causes: "Giá thể ướt lâu, thoát nước kém và đất nhiễm nấm.",
    protocols: [
      {
        id: "crr-moderate",
        severity: "moderate",
        steps: ["Giảm lượng nước mỗi lần tưới.", "Xử lý gốc bằng thuốc phù hợp.", "Bổ sung hữu cơ hoai mục và vi sinh."],
        drugs: [{ name: "Aliette", activeIngredient: "Fosetyl-Al", dosage: "30g/16L" }],
        usage: "Tưới quanh gốc kết hợp cải tạo đất.",
        frequency: "2 lần",
        interval: "5 ngày",
        notes: "Không tưới lúc chiều muộn."
      }
    ],
    usageNotes: {
      timing: "Can thiệp khi cây có dấu hiệu héo nắng kèm gốc thâm.",
      weather: "Theo dõi sát sau mưa hoặc giai đoạn ẩm kéo dài.",
      safety: "Mang găng tay khi pha và tưới thuốc.",
      withdrawal: "5-7 ngày."
    },
    quickAction: "Giảm tưới và kiểm tra ngay vùng gốc, rễ của cây có biểu hiện héo.",
    confidenceBase: 71,
    immediateActions: ["Kiểm tra gốc 3-5 cây.", "Ngừng tưới đẫm.", "Mở rãnh thoát nước."],
    stagePlans: {
      immediate: ["Giảm nước tưới", "Kiểm tra gốc", "Thoát nước nhanh"],
      next24h: ["Tưới xử lý vùng gốc", "Bổ sung vi sinh", "Loại bỏ cây hỏng nặng"],
      followUp: ["Theo dõi cây cạnh bên", "Điều chỉnh lịch tưới", "Giữ giá thể thông thoáng"]
    },
    symptomOptions: ["Héo rũ", "Thối rễ", "Thối thân", "Lá vàng"]
  },
  {
    id: "cucumber-mosaic-virus",
    name: "Khảm lá dưa leo",
    cropType: "Dưa leo",
    type: "physiological",
    description: "Lá bị loang xanh vàng, biến dạng và cây phát triển kém do virus gây ra.",
    symptoms: "Lá loang xanh vàng, nhăn, biến dạng và trái phát triển lệch.",
    impactLevel: "Trung bình đến cao",
    causes: "Virus lây qua côn trùng chích hút, cây giống nhiễm và dụng cụ canh tác.",
    protocols: [
      {
        id: "cmv-moderate",
        severity: "moderate",
        steps: ["Loại bỏ cây biểu hiện nặng.", "Quản lý rầy mềm và bọ phấn.", "Khử khuẩn dụng cụ cắt tỉa.", "Giữ vườn sạch cỏ dại ký chủ."],
        drugs: [{ name: "Confidor", activeIngredient: "Imidacloprid", dosage: "10ml/16L" }],
        usage: "Tập trung quản lý côn trùng môi giới truyền virus.",
        frequency: "2 lần",
        interval: "5 ngày",
        notes: "Virus không có thuốc chữa trực tiếp, ưu tiên loại bỏ nguồn lây."
      }
    ],
    usageNotes: {
      timing: "Can thiệp sớm khi thấy lá loang màu và biến dạng bất thường.",
      weather: "Tăng kiểm tra vào thời kỳ côn trùng chích hút phát sinh mạnh.",
      safety: "Tuân thủ bảo hộ và thời gian cách ly theo nhãn.",
      withdrawal: "Theo nhãn sản phẩm."
    },
    quickAction: "Loại bỏ cây bị khảm nặng và kiểm soát ngay côn trùng chích hút trong luống.",
    confidenceBase: 68,
    immediateActions: ["Đánh dấu cây khảm nặng.", "Khảo sát rầy mềm, bọ phấn.", "Nhổ bỏ cây biến dạng nặng."],
    stagePlans: {
      immediate: ["Khoanh nguồn lây", "Nhổ cây nặng", "Kiểm soát côn trùng"],
      next24h: ["Khử khuẩn dụng cụ", "Vệ sinh cỏ dại", "Theo dõi cây cạnh bên"],
      followUp: ["Theo dõi lá non", "Quản lý môi giới định kỳ", "Chọn cây giống sạch bệnh"]
    },
    symptomOptions: ["Lá vàng", "Lá cuốn", "Rụng hoa"]
  },
  {
    id: "dragon-fruit-white-mold",
    name: "Mốc trắng cành thanh long",
    cropType: "Thanh long",
    type: "fungal",
    description: "Bệnh xuất hiện thành từng mảng tơ nấm trắng trên cành non hoặc vết thương, gặp nhiều khi vườn ẩm và bí tán.",
    symptoms: "Cành có lớp mốc trắng như bông, mô bị mềm nhũn tại điểm nhiễm và dễ lan rộng sau mưa đêm.",
    impactLevel: "Trung bình đến cao",
    causes: "Ẩm độ cao kéo dài, cành giao tán dày, vết thương cơ giới không được xử lý và tưới làm ướt cành thường xuyên.",
    protocols: [
      {
        id: "dfwm-moderate",
        severity: "moderate",
        steps: [
          "Cắt bỏ ngay đoạn cành có mốc trắng dày.",
          "Khử khuẩn kéo cắt sau từng trụ bệnh.",
          "Rải tán cho trụ thanh long thoáng hơn và giảm tưới lên cành.",
          "Phun thuốc phù hợp lên toàn bộ vùng cành quanh ổ bệnh."
        ],
        drugs: [{ name: "Antracol", activeIngredient: "Propineb", dosage: "20g/16L" }],
        usage: "Phun tập trung lên cành và vết cắt sau khi vệ sinh ổ bệnh.",
        frequency: "2 lần",
        interval: "5 ngày",
        notes: "Ưu tiên xử lý sớm khi mốc còn khu trú ở một vài cành."
      }
    ],
    usageNotes: {
      timing: "Xử lý ngay khi thấy mốc trắng bám thành mảng trên cành.",
      weather: "Tăng kiểm tra vào giai đoạn sương đêm dày hoặc mưa kéo dài.",
      safety: "Đeo găng tay và khẩu trang khi cắt tỉa, tránh để bào tử bám sang trụ khác.",
      withdrawal: "7 ngày."
    },
    quickAction: "Cắt sạch vùng có mốc trắng, khử khuẩn dụng cụ và giảm ẩm quanh trụ ngay.",
    confidenceBase: 78,
    immediateActions: [
      "Đánh dấu trụ có mốc trắng rõ.",
      "Cắt bỏ cành bị mốc nặng và mang ra khỏi vườn.",
      "Ngừng tưới phun trực tiếp lên cành trong 24 giờ tới."
    ],
    stagePlans: {
      immediate: ["Cắt cành có mốc", "Khử khuẩn dụng cụ", "Giảm ẩm quanh trụ"],
      next24h: ["Phun xử lý quanh ổ bệnh", "Tỉa cành cho thoáng", "Theo dõi mảng mốc mới"],
      followUp: ["Kiểm tra sau mỗi trận mưa", "Duy trì trụ thông thoáng", "Theo dõi cành non mới bật"]
    },
    symptomOptions: ["Mốc trắng", "Thối thân"]
  },
  {
    id: "dragon-fruit-stem-rot",
    name: "Đốm nâu thối cành thanh long",
    cropType: "Thanh long",
    type: "fungal",
    description: "Bệnh gây đốm nâu lõm trên cành, sau đó lan rộng làm mô bị thối và khô cành nếu xử lý chậm.",
    symptoms: "Cành có vết nâu lõm, mô bị sần rồi thối khô dần, vết bệnh lan dọc theo thân cành.",
    impactLevel: "Trung bình đến cao",
    causes: "Ẩm độ cao, cành dày, vườn thiếu thông thoáng và mưa kéo dài.",
    protocols: [
      {
        id: "dfs-moderate",
        severity: "moderate",
        steps: [
          "Cắt bỏ cành bệnh nặng khỏi trụ.",
          "Thu gom và tiêu hủy mô bệnh.",
          "Phun thuốc phù hợp lên toàn bộ trụ bị ảnh hưởng.",
          "Giảm mật độ cành rậm."
        ],
        drugs: [{ name: "Nativo", activeIngredient: "Tebuconazole + Trifloxystrobin", dosage: "10g/16L" }],
        usage: "Phun đều cành và vị trí vết bệnh sau khi cắt tỉa.",
        frequency: "2 lần",
        interval: "5-7 ngày",
        notes: "Vệ sinh kéo cắt sau mỗi trụ bệnh."
      }
    ],
    usageNotes: {
      timing: "Can thiệp ngay khi vết nâu còn nhỏ và chưa lan rộng.",
      weather: "Tăng kiểm tra sau mưa kéo dài hoặc sương đêm nhiều.",
      safety: "Đeo găng tay, khẩu trang và tránh tiếp xúc trực tiếp với thuốc.",
      withdrawal: "7 ngày."
    },
    quickAction: "Cắt bỏ cành có đốm nâu sớm và giữ trụ thanh long luôn thông thoáng.",
    confidenceBase: 76,
    immediateActions: [
      "Đánh dấu trụ có cành xuất hiện vết nâu.",
      "Cắt bỏ cành bệnh nặng.",
      "Thu gom mô bệnh ra khỏi vườn."
    ],
    stagePlans: {
      immediate: ["Cắt cành bệnh", "Thu gom tiêu hủy", "Khử khuẩn dụng cụ"],
      next24h: ["Phun xử lý toàn trụ", "Giảm mật độ cành", "Theo dõi vết mới"],
      followUp: ["Kiểm tra sau mưa", "Duy trì trụ thông thoáng", "Theo dõi cành non"]
    },
    symptomOptions: ["Đốm nâu", "Thối thân", "Nứt thân"]
  }
];

const mapSupabaseRow = (row: SupabaseDiseaseRow): RecommendationDiseaseProfile => ({
  id: row.id,
  name: row.name,
  cropType:
    row.crop_type ||
    row.cropType ||
    (row.crop_id ? cropIdLabelMap[row.crop_id] || row.crop_id : "") ||
    "Chưa phân loại",
  type: row.type,
  description: row.description,
  symptoms: Array.isArray(row.symptoms) ? row.symptoms.join(", ") : row.symptoms,
  impactLevel: row.impact_level || row.impactLevel || "Chưa rõ",
  causes: row.causes,
  protocols: row.protocols,
  alternatives: row.alternatives || undefined,
  usageNotes: row.usage_notes || row.usageNotes || {
    timing: "",
    weather: "",
    safety: "",
    withdrawal: "",
  },
  references: row.references || row.reference_sources || undefined,
  quickAction: row.quick_action || row.quickAction || "Kiểm tra thêm ngoài thực địa trước khi xử lý mạnh.",
  confidenceBase: row.confidence_base || row.confidenceBase || 70,
  immediateActions: row.immediate_actions || row.immediateActions || [],
  stagePlans: row.stage_plans || row.stagePlans || {
    immediate: [],
    next24h: [],
    followUp: [],
  },
  symptomOptions: row.symptom_options || row.symptomOptions || [],
});

export const getRecommendationProfiles = async () => {
  if (!isSupabaseConfigured || !supabase) {
    return {
      data: fallbackRecommendationProfiles,
      source: "fallback" as const,
    };
  }

  const { data, error } = await supabase
    .from("disease_assistant_profiles")
    .select("*")
    .order("name", { ascending: true });

  if (error || !data) {
    console.error("Supabase recommendation fetch error:", error);
    return {
      data: fallbackRecommendationProfiles,
      source: "fallback" as const,
      error: error?.message || "Không đọc được dữ liệu từ Supabase.",
    };
  }

  const supabaseProfiles = (data as SupabaseDiseaseRow[])
    .map(mapSupabaseRow)
    .filter((item) => item.cropType && item.cropType !== "Chưa phân loại");

  if (supabaseProfiles.length === 0) {
    return {
      data: fallbackRecommendationProfiles,
      source: "fallback" as const,
      error: "Supabase có dữ liệu nhưng không đọc được tên cây hợp lệ.",
    };
  }

  return {
    data: supabaseProfiles
      .sort((a, b) => a.cropType.localeCompare(b.cropType, "vi") || a.name.localeCompare(b.name, "vi")),
    source: "supabase" as const,
  };
};

export const getCropOptionsFromProfiles = (profiles: RecommendationDiseaseProfile[]) =>
  Array.from(new Set(profiles.map((item) => item.cropType).filter((item) => item && item !== "Chưa phân loại"))).sort();

export const getSymptomMapFromProfiles = (profiles: RecommendationDiseaseProfile[]) =>
  profiles.reduce<Record<string, SymptomOption[]>>((acc, item) => {
    const current = new Set(acc[item.cropType] || []);
    item.symptomOptions.forEach((symptom) => current.add(symptom));
    acc[item.cropType] = Array.from(current).sort() as SymptomOption[];
    return acc;
  }, {});
