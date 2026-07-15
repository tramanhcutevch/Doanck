import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

export type Language = "en" | "ja" | "vi";
export type LocalizedText = Record<Language, string>;
export type LocalizedDictionary = Record<string, LocalizedText>;

type Dictionary = LocalizedDictionary;

const STORAGE_KEY = "terraform-flora-language";

export const languages: { code: Language; label: string; shortLabel: string }[] = [
  { code: "en", label: "English", shortLabel: "EN" },
  { code: "ja", label: "日本語", shortLabel: "JP" },
  { code: "vi", label: "Tiếng Việt", shortLabel: "VI" },
];

const dictionary: Dictionary = {
  "nav.diagnosis": { vi: "Chẩn đoán AI", en: "AI Diagnosis", ja: "AI診断" },
  "nav.chat": { vi: "Cố vấn AI", en: "AI Advisor", ja: "AIアドバイザー" },
  "nav.growth": { vi: "Sinh trưởng", en: "Growth", ja: "生育管理" },
  "nav.recommendations": { vi: "Khuyến nghị", en: "Recommendations", ja: "推奨" },
  "nav.pesticides": { vi: "Thuốc BVTV", en: "Crop Protection", ja: "農薬管理" },
  "nav.forum": { vi: "Cộng đồng", en: "Community", ja: "コミュニティ" },
  "nav.library": { vi: "Thư viện", en: "Library", ja: "ライブラリ" },
  "nav.shop": { vi: "Cửa hàng", en: "Shop", ja: "ショップ" },
  "nav.user": { vi: "Người dùng", en: "User", ja: "ユーザー" },
  "nav.admin": { vi: "Admin", en: "Admin", ja: "管理者" },
  "nav.navigation": { vi: "Điều hướng", en: "Navigation", ja: "ナビゲーション" },
  "nav.subtitle": {
    vi: "Nền tảng vận hành nông nghiệp với AI điều phối xuyên suốt mùa vụ",
    en: "AI-powered agriculture operations across the whole crop cycle",
    ja: "作期全体をAIで支える農業運用プラットフォーム",
  },
  "nav.aiStatus": { vi: "AI trạng thái", en: "AI status", ja: "AIステータス" },
  "nav.ready": { vi: "Sẵn sàng phân tích", en: "Ready to analyze", ja: "分析準備完了" },
  "nav.notifications": { vi: "Thông báo", en: "Notifications", ja: "通知" },
  "nav.unread": { vi: "chưa đọc", en: "unread", ja: "未読" },
  "nav.markAllRead": { vi: "Đọc hết", en: "Mark all read", ja: "すべて既読" },
  "nav.noNotifications": { vi: "Chưa có thông báo mới.", en: "No new notifications.", ja: "新しい通知はありません。" },
  "nav.workspaceActive": { vi: "Workspace đang hoạt động", en: "Workspace Active", ja: "ワークスペース稼働中" },
  "nav.loginSignup": { vi: "Đăng nhập / Đăng ký", en: "Sign in / Sign up", ja: "ログイン / 登録" },
  "nav.oneGateway": { vi: "Một cổng truy cập", en: "One gateway", ja: "共通ゲートウェイ" },
  "nav.open": { vi: "Mở", en: "Open", ja: "開く" },
  "nav.module": { vi: "Module", en: "Module", ja: "モジュール" },
  "nav.restricted": { vi: "Giới hạn", en: "Restricted", ja: "制限あり" },
  "nav.language": { vi: "Ngôn ngữ", en: "Language", ja: "言語" },
  "nav.menu": { vi: "Menu", en: "Menu", ja: "メニュー" },
  "nav.workspace": { vi: "Workspace", en: "Workspace", ja: "ワークスペース" },
  "nav.dashboard": { vi: "Dashboard", en: "Dashboard", ja: "ダッシュボード" },

  "auth.title": { vi: "Đăng nhập / đăng ký", en: "Sign in / sign up", ja: "ログイン / 登録" },
  "auth.description": {
    vi: "Chỉ cần đăng nhập một lần. Hệ thống sẽ tự đưa bạn tới đúng trang theo quyền tài khoản.",
    en: "Sign in once. The system will route you to the right workspace for your account role.",
    ja: "一度ログインすれば、権限に応じたワークスペースへ自動的に移動します。",
  },
  "auth.signin": { vi: "Đăng nhập", en: "Sign in", ja: "ログイン" },
  "auth.signup": { vi: "Đăng ký", en: "Sign up", ja: "登録" },
  "auth.fullName": { vi: "Tên hiển thị", en: "Display name", ja: "表示名" },
  "auth.fullNamePlaceholder": { vi: "Nhập tên của bạn", en: "Enter your name", ja: "名前を入力" },
  "auth.password": { vi: "Mật khẩu", en: "Password", ja: "パスワード" },
  "auth.passwordPlaceholder": { vi: "Tối thiểu 6 ký tự", en: "At least 6 characters", ja: "6文字以上" },
  "auth.createAccount": { vi: "Tạo tài khoản", en: "Create account", ja: "アカウント作成" },
  "auth.missingEmailPassword": { vi: "Bạn cần nhập email và mật khẩu.", en: "Please enter email and password.", ja: "メールアドレスとパスワードを入力してください。" },
  "auth.missingName": { vi: "Bạn cần nhập tên hiển thị.", en: "Please enter a display name.", ja: "表示名を入力してください。" },
  "auth.genericError": { vi: "Không thể xác thực lúc này.", en: "Unable to authenticate right now.", ja: "現在認証できません。" },

  "app.newUser": { vi: "Người dùng mới", en: "New user", ja: "新規ユーザー" },
  "footer.description": {
    vi: "Hệ sinh thái nông nghiệp thông minh, kết hợp sức mạnh của AI và cộng đồng để kiến tạo tương lai xanh bền vững.",
    en: "A smart agriculture ecosystem combining AI and community knowledge to build a sustainable green future.",
    ja: "AIとコミュニティの知見を組み合わせ、持続可能な緑の未来をつくるスマート農業エコシステムです。",
  },
  "footer.products": { vi: "Sản phẩm", en: "Products", ja: "製品" },
  "footer.support": { vi: "Hỗ trợ", en: "Support", ja: "サポート" },
  "footer.pesticideManagement": { vi: "Quản lý thuốc", en: "Pesticide management", ja: "農薬管理" },
  "footer.growthCycle": { vi: "Chu kỳ sinh trưởng", en: "Growth cycle", ja: "生育サイクル" },
  "footer.knowledgeLibrary": { vi: "Thư viện tri thức", en: "Knowledge library", ja: "ナレッジライブラリ" },
  "footer.helpCenter": { vi: "Trung tâm trợ giúp", en: "Help center", ja: "ヘルプセンター" },
  "footer.contact": { vi: "Liên hệ", en: "Contact", ja: "お問い合わせ" },
  "footer.terms": { vi: "Điều khoản", en: "Terms", ja: "利用規約" },
  "footer.rights": { vi: "© 2026 Terraform Flora. All rights reserved.", en: "© 2026 Terraform Flora. All rights reserved.", ja: "© 2026 Terraform Flora. All rights reserved." },
  "footer.privacy": { vi: "Chính sách riêng tư", en: "Privacy Policy", ja: "プライバシーポリシー" },
  "footer.termsService": { vi: "Điều khoản dịch vụ", en: "Terms of Service", ja: "利用規約" },

  "home.heroAlt": { vi: "Cánh đồng nông nghiệp công nghệ cao", en: "High-tech agriculture field", ja: "先端農業の畑" },
  "home.heroEyebrow": { vi: "AI Operating System For Agriculture", en: "AI Operating System For Agriculture", ja: "農業向けAIオペレーティングシステム" },
  "home.heroTitleA": { vi: "Nền tảng AI", en: "AI platform", ja: "AIプラットフォーム" },
  "home.heroTitleB": { vi: " cho vận hành nông nghiệp hiện đại.", en: " for modern agriculture operations.", ja: "で現代農業を運用。" },
  "home.heroCopy": {
    vi: "Ảnh hiện trường ở trên, dữ liệu và dashboard ở dưới. AI là lớp điều phối xuyên suốt toàn bộ quy trình.",
    en: "Field images, data, and dashboards in one flow. AI coordinates the entire operation.",
    ja: "現場写真、データ、ダッシュボードを一つの流れに。AIが全体の運用を調整します。",
  },
  "home.launchVision": { vi: "Khởi chạy AI Vision", en: "Launch AI Vision", ja: "AI Visionを起動" },
  "home.openAdvisor": { vi: "Mở cố vấn AI", en: "Open AI Advisor", ja: "AIアドバイザーを開く" },
  "home.openUserPortal": { vi: "Vào trang người dùng", en: "Open user portal", ja: "ユーザーページへ" },
  "home.openAdmin": { vi: "Mở admin", en: "Open admin", ja: "管理画面を開く" },
  "home.liveSignal": { vi: "Live AI Signal", en: "Live AI Signal", ja: "ライブAIシグナル" },
  "home.analysisRunning": { vi: "Mạch phân tích đang hoạt động", en: "Analysis pipeline is active", ja: "分析パイプライン稼働中" },
  "home.accuracyBand": { vi: "Dải độ chính xác", en: "Accuracy band", ja: "精度帯" },
  "home.responseLoop": { vi: "Vòng phản hồi", en: "Response loop", ja: "応答ループ" },
  "home.aiWorkflow": { vi: "Luồng AI", en: "AI Workflow", ja: "AIワークフロー" },
  "home.modules": { vi: "Module", en: "Modules", ja: "モジュール" },
  "home.accuracyCopy": {
    vi: "Chẩn đoán và đối chiếu triệu chứng qua hình ảnh cây trồng.",
    en: "Diagnose and compare symptoms through crop imagery.",
    ja: "作物画像から症状を診断・照合します。",
  },
  "home.responseCopy": {
    vi: "AI phản hồi nhanh để hỗ trợ thao tác trực tiếp tại hiện trường.",
    en: "Fast AI responses support decisions directly in the field.",
    ja: "現場判断を支える高速なAI応答。",
  },
  "home.workflowTitle": {
    vi: "AI không đứng riêng một trang, mà đi xuyên qua toàn bộ sản phẩm",
    en: "AI is not a separate page. It runs through the whole product.",
    ja: "AIは単独ページではなく、製品全体を横断します。",
  },
  "home.workflowCopy": {
    vi: "Từ chẩn đoán, hội thoại, khuyến nghị đến vận hành mùa vụ, giao diện được tổ chức để AI luôn hiện diện ở đúng nơi cần quyết định.",
    en: "From diagnosis and chat to recommendations and crop operations, the interface keeps AI where decisions happen.",
    ja: "診断、会話、推奨、生育運用まで、判断が必要な場所にAIを配置します。",
  },
  "home.step": { vi: "Bước", en: "Step", ja: "ステップ" },
  "home.modulesTitle": {
    vi: "Hệ sinh thái nhiều thành phần hơn, đủ cảm giác một nền tảng thực thụ",
    en: "A richer multi-module ecosystem that feels like a real platform",
    ja: "実用的なプラットフォームとして機能する多機能エコシステム",
  },
  "home.modulesCopy": {
    vi: "Mỗi module được thiết kế như một khối tác vụ chuyên biệt nhưng vẫn bám cùng ngôn ngữ AI-first.",
    en: "Each module is specialized, while sharing the same AI-first product language.",
    ja: "各モジュールは専門的でありながら、AIファーストの設計思想を共有します。",
  },
  "home.decisionStream": { vi: "Decision stream", en: "Decision stream", ja: "意思決定ストリーム" },
  "home.dailyFlow": { vi: "Luồng vận hành trong ngày", en: "Daily operations flow", ja: "日次運用フロー" },
  "home.feature.diagnosis.desc": {
    vi: "Nhận diện bệnh trên lá, thân và trái với gợi ý nguyên nhân theo hình ảnh.",
    en: "Identify disease on leaves, stems, and fruit with image-based cause suggestions.",
    ja: "画像から葉・茎・果実の病害を識別し、原因候補を提示します。",
  },
  "home.feature.chat.desc": {
    vi: "Trao đổi kỹ thuật canh tác, hỏi đáp sâu bệnh và tối ưu xử lý theo bối cảnh.",
    en: "Discuss cultivation techniques, pest issues, and context-aware treatments.",
    ja: "栽培技術、病害虫、状況に応じた対策を相談できます。",
  },
  "home.feature.growth.desc": {
    vi: "Theo dõi chu kỳ, nhiệm vụ, hình ảnh và rủi ro xuyên suốt một mùa vụ.",
    en: "Track cycles, tasks, images, and risks across the whole crop season.",
    ja: "作期全体のサイクル、タスク、画像、リスクを追跡します。",
  },
  "home.feature.recommendations.desc": {
    vi: "Đề xuất xử lý sau chẩn đoán, ưu tiên giải pháp phù hợp với tình trạng cây.",
    en: "Recommend post-diagnosis actions that fit the plant condition.",
    ja: "診断後、作物の状態に合う対策を推奨します。",
  },
  "home.feature.pesticides.desc": {
    vi: "Quản lý tồn kho, tra cứu thuốc và giảm sai sót khi thao tác ngoài thực địa.",
    en: "Manage inventory, look up products, and reduce field operation mistakes.",
    ja: "在庫管理、薬剤検索、現場作業ミスの削減を支援します。",
  },
  "home.feature.forum.desc": {
    vi: "Kết nối kỹ sư, nông hộ và người vận hành để học nhanh từ ca thực tế.",
    en: "Connect agronomists, growers, and operators to learn from real cases.",
    ja: "技術者、生産者、運用者をつなぎ、実例から学べます。",
  },
  "home.feature.library.desc": {
    vi: "Tập trung tài liệu kỹ thuật, kiến thức cây trồng và quy trình tham khảo.",
    en: "Centralize technical documents, crop knowledge, and reference workflows.",
    ja: "技術資料、作物知識、参考プロセスを集約します。",
  },
  "home.feature.shop.desc": {
    vi: "Mở rộng sang luồng mua vật tư và thương mại hóa đầu ra trong cùng hệ sinh thái.",
    en: "Add supplies purchasing and commerce flows inside the same ecosystem.",
    ja: "同じエコシステム内で資材購入と商流を拡張します。",
  },
  "home.feature.user.desc": {
    vi: "Xem hồ sơ, lịch sử hoạt động và các dữ liệu cá nhân trong workspace.",
    en: "View profile, activity history, and personal workspace data.",
    ja: "プロフィール、活動履歴、個人ワークスペースデータを確認します。",
  },
  "home.feature.admin.desc": {
    vi: "Theo dõi dữ liệu hệ thống, hoạt động cộng đồng và tín hiệu vận hành tổng quan.",
    en: "Monitor system data, community activity, and operational signals.",
    ja: "システムデータ、コミュニティ活動、運用シグナルを監視します。",
  },
  "home.flow.collect.title": { vi: "Thu nhận dữ liệu", en: "Collect data", ja: "データ収集" },
  "home.flow.collect.desc": {
    vi: "Ảnh bệnh, giai đoạn sinh trưởng, mô tả hiện trường và lịch sử công việc.",
    en: "Disease images, growth stage, field notes, and work history.",
    ja: "病害画像、生育段階、現場メモ、作業履歴。",
  },
  "home.flow.analyze.title": { vi: "AI phân tích", en: "AI analysis", ja: "AI分析" },
  "home.flow.analyze.desc": {
    vi: "Nhận diện triệu chứng, suy luận ngữ cảnh và sinh ra khuyến nghị hành động.",
    en: "Detect symptoms, reason over context, and generate action recommendations.",
    ja: "症状を検出し、文脈を推論して行動推奨を生成します。",
  },
  "home.flow.decide.title": { vi: "Ra quyết định", en: "Make decisions", ja: "意思決定" },
  "home.flow.decide.desc": {
    vi: "Ưu tiên việc cần làm hôm nay, nhắc cảnh báo và lưu vết cho cả mùa vụ.",
    en: "Prioritize today's work, trigger alerts, and preserve season records.",
    ja: "今日の作業を優先し、アラートを出し、作期の記録を残します。",
  },
  "home.stat.diagnoses": { vi: "Lượt chẩn đoán", en: "Diagnoses", ja: "診断回数" },
  "home.stat.seasons": { vi: "Mùa vụ vận hành", en: "Active seasons", ja: "運用中の作期" },
  "home.stat.teams": { vi: "Đội ngũ sử dụng", en: "Teams using it", ja: "利用チーム" },
  "home.signal.early": { vi: "AI phát hiện sớm lá có dấu hiệu bệnh", en: "AI detects early disease signs on leaves", ja: "AIが葉の病害兆候を早期検出" },
  "home.signal.moisture": {
    vi: "Hệ thống gợi ý kiểm tra ẩm độ và dinh dưỡng",
    en: "The system suggests checking moisture and nutrition",
    ja: "システムが湿度と栄養状態の確認を提案",
  },
  "home.signal.log": {
    vi: "Nhật ký mùa vụ được cập nhật để so sánh về sau",
    en: "Season logs are updated for later comparison",
    ja: "後で比較できるよう作期ログを更新",
  },
  "home.userPortal.desc": {
    vi: "Đi tới khu vực cá nhân để xem hồ sơ, chẩn đoán gần đây, chu kỳ và bài đăng của bạn.",
    en: "Go to your personal area to view profile, recent diagnoses, cycles, and posts.",
    ja: "個人エリアでプロフィール、最近の診断、サイクル、投稿を確認します。",
  },
  "home.admin.desc": {
    vi: "Mở màn hình quản trị để xem dữ liệu tổng quan hệ thống và các tín hiệu cần theo dõi.",
    en: "Open the admin screen to review system overview data and signals to monitor.",
    ja: "管理画面でシステム概要データと監視すべきシグナルを確認します。",
  },
  "home.why": { vi: "Vì sao tốt hơn", en: "Why It Feels Better", ja: "より良く感じる理由" },
  "home.whyTitle": {
    vi: "Tăng độ chuyên nghiệp bằng bố cục dashboard, tầng dữ liệu và nhịp điều hướng rõ ràng",
    en: "A more professional feel through dashboard layout, data layers, and clear navigation rhythm",
    ja: "ダッシュボード構成、データ階層、明確なナビゲーションでよりプロらしく",
  },
  "home.polish.visual.title": { vi: "Thị giác có lớp", en: "Layered visual system", ja: "階層化された視覚設計" },
  "home.polish.visual.text": {
    vi: "Nền, panel, nhãn trạng thái và vùng AI tách bạch hơn.",
    en: "Backgrounds, panels, status labels, and AI areas are more distinct.",
    ja: "背景、パネル、状態ラベル、AI領域を明確に分離します。",
  },
  "home.polish.info.title": { vi: "Thông tin nhiều chiều", en: "Multi-dimensional information", ja: "多面的な情報" },
  "home.polish.info.text": {
    vi: "Không chỉ card tính năng mà có metrics, luồng xử lý và tín hiệu hệ thống.",
    en: "Beyond feature cards: metrics, process flows, and system signals.",
    ja: "機能カードだけでなく、指標、処理フロー、システム信号を表示します。",
  },
  "home.polish.ai.title": { vi: "Điểm nhấn AI", en: "AI emphasis", ja: "AIの存在感" },
  "home.polish.ai.text": {
    vi: "AI xuất hiện như một năng lực vận hành, không còn là slogan trang trí.",
    en: "AI appears as an operational capability, not decorative copy.",
    ja: "AIを飾り文句ではなく運用能力として見せます。",
  },
  "home.metric.users": { vi: "Người dùng hoạt động", en: "Active users", ja: "アクティブユーザー" },
  "home.metric.aiTasks": { vi: "Tác vụ gắn AI hỗ trợ", en: "AI-assisted tasks", ja: "AI支援タスク" },
  "home.metric.advisor": { vi: "Cố vấn AI trực tuyến", en: "Online AI advisor", ja: "オンラインAIアドバイザー" },
  "home.metric.platformValue": { vi: "1 nền tảng", en: "1 platform", ja: "1つの基盤" },
  "home.metric.platform": { vi: "Dữ liệu, tri thức, quyết định", en: "Data, knowledge, decisions", ja: "データ、知識、意思決定" },
};

type I18nContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

const getInitialLanguage = (): Language => {
  if (typeof window === "undefined") return "vi";
  const savedLanguage = window.localStorage.getItem(STORAGE_KEY) as Language | null;
  return savedLanguage && languages.some((item) => item.code === savedLanguage) ? savedLanguage : "vi";
};

export const I18nProvider = ({ children }: { children: React.ReactNode }) => {
  const [language, setLanguageState] = useState<Language>(getInitialLanguage);

  const setLanguage = (nextLanguage: Language) => {
    setLanguageState(nextLanguage);
    window.localStorage.setItem(STORAGE_KEY, nextLanguage);
  };

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const value = useMemo<I18nContextValue>(
    () => ({
      language,
      setLanguage,
      t: (key: string) => dictionary[key]?.[language] ?? dictionary[key]?.vi ?? key,
    }),
    [language]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export const useI18n = () => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used inside I18nProvider");
  }
  return context;
};

export const pickLocalizedText = (value: LocalizedText, language: Language) => value[language] ?? value.vi;
