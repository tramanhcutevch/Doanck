import React, { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  BarChart3,
  Calendar,
  Camera,
  CheckCircle2,
  ChevronRight,
  Clock,
  Cpu,
  Droplets,
  FlaskConical,
  ImagePlus,
  Leaf,
  LineChart,
  Plus,
  RefreshCw,
  Sprout,
  Square,
  SunMedium,
  Target,
  Trash2,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { getAIConsultation } from "../services/aiService";
import {
  createGrowthCycle,
  createGrowthPhoto,
  GrowthCatalogCrop,
  createGrowthTask,
  createGrowthTasks,
  deleteGrowthCycle,
  deleteGrowthPhoto,
  deleteGrowthTask,
  listGrowthCatalogCrops,
  listGrowthCycles,
  listGrowthPhotos,
  listGrowthTasks,
  updateGrowthCycle,
  updateGrowthTask,
} from "../services/growthTrackingService";
import { getCropOptionsFromProfiles, getRecommendationProfiles } from "../services/recommendationDataService";
import { AppUser, GrowthCycle, GrowthPhoto, GrowthTask } from "../types";
import growthVisual3 from "../../anh/sinhtruong2.jpg";
import growthVisual4 from "../../anh/sinhtruong4.jpg";
import growthVisual5 from "../../anh/sinhtruong5.jpg";
import growthHeroVideo from "../../anh/video3.mp4";
import { LocalizedDictionary, useI18n } from "../i18n";

interface GrowthViewProps {
  user: AppUser | null;
  onLogin: () => void | Promise<void>;
}

const growthText: LocalizedDictionary = {
  titleA: { vi: "Chu kỳ", en: "Growth", ja: "生育" },
  titleB: { vi: "Sinh trưởng", en: "Cycle", ja: "サイクル" },
  intro: {
    vi: "Quản lý trọn một vụ canh tác từ lúc xuống giống đến thu hoạch với nhịp vận hành rõ ràng: tạo chu kỳ, chia việc theo ngày, lưu nhật ký hiện trường và nhận gợi ý AI bám sát từng giai đoạn.",
    en: "Manage a complete crop season from planting to harvest with a clear operating rhythm: create cycles, schedule daily tasks, save field logs, and receive AI insights by stage.",
    ja: "定植から収穫までの作期を明確な運用リズムで管理します。サイクル作成、日次タスク、現場ログ、段階別AIインサイトをまとめます。",
  },
  createCycle: { vi: "Tạo chu kỳ mới", en: "Create new cycle", ja: "新しいサイクルを作成" },
  heroNote: { vi: "Theo dõi theo ngày, theo giai đoạn và theo tín hiệu AI từ nhật ký thực tế", en: "Track by day, stage, and AI signals from real field logs", ja: "日別、段階別、現場ログ由来のAIシグナルで追跡" },
  openCycles: { vi: "Chu kỳ đang mở", en: "Open cycles", ja: "進行中サイクル" },
  trackingCycles: { vi: "Chu kỳ đang theo dõi", en: "Tracked cycles", ja: "追跡中サイクル" },
  harvestSoonCycles: { vi: "Chu kỳ sắp thu hoạch", en: "Cycles near harvest", ja: "収穫間近サイクル" },
  averageProgress: { vi: "Tiến độ trung bình", en: "Average progress", ja: "平均進捗" },
  continuous: { vi: "Theo dõi liên tục", en: "Continuous tracking", ja: "継続追跡" },
  aiReadiness: { vi: "Mức sẵn sàng AI", en: "AI readiness", ja: "AI準備度" },
  basedInput: { vi: "Dựa trên dữ liệu nhập vào", en: "Based on entered data", ja: "入力データに基づく" },
  fieldLogs: { vi: "Nhật ký hiện trường", en: "Field logs", ja: "現場ログ" },
  photoNotes: { vi: "Ảnh và mô tả canh tác", en: "Photos and cultivation notes", ja: "写真と栽培メモ" },
  fieldImagesTitle: { vi: "Quan sát cây theo ảnh thực địa", en: "Observe crops through field images", ja: "現場写真で作物を観察" },
  fieldImagesDesc: { vi: "Ảnh giúp đối chiếu sinh trưởng, nhịp chăm sóc và dấu hiệu bất thường rõ hơn qua từng mốc trong chu kỳ.", en: "Photos make it easier to compare growth, care rhythm, and abnormal signs across cycle milestones.", ja: "写真により、生育、作業リズム、異常兆候を各マイルストーンで比較しやすくします。" },
  loginNeeded: { vi: "Cần đăng nhập", en: "Login required", ja: "ログインが必要" },
  loginDesc: { vi: "Bạn không cần dữ liệu có sẵn để tạo chu kỳ, nhưng cần đăng nhập để hệ thống lưu chu kỳ vào Supabase.", en: "You do not need preset data to create a cycle, but you must sign in so the system can save it to Supabase.", ja: "サイクル作成に事前データは不要ですが、Supabaseへ保存するにはログインが必要です。" },
  loginCreate: { vi: "Đăng nhập để tạo chu kỳ", en: "Sign in to create cycle", ja: "ログインして作成" },
  stageFramework: { vi: "Khung giai đoạn chuẩn", en: "Standard stage framework", ja: "標準ステージ構成" },
  seasonPage: { vi: "Một trang đủ để theo dõi cả mùa vụ", en: "One page to track the whole season", ja: "作期全体を追跡する1ページ" },
  stageDesc: { vi: "Mỗi chu kỳ có thể đi qua 4 bước lớn, kèm nhiệm vụ, mốc theo dõi và cảnh báo vận hành để bạn không bỏ sót việc quan trọng.", en: "Each cycle can move through four major stages with tasks, milestones, and operational alerts so important work is not missed.", ja: "各サイクルは4つの主要段階を通り、タスク、節目、運用アラートで重要作業の抜け漏れを防ぎます。" },
  stage: { vi: "Giai đoạn", en: "Stage", ja: "ステージ" },
  start: { vi: "Bắt đầu", en: "Start", ja: "開始" },
  days: { vi: "ngày", en: "days", ja: "日" },
  remaining: { vi: "Còn lại", en: "Remaining", ja: "残り" },
  notes: { vi: "Ghi chú", en: "Notes", ja: "メモ" },
  noNotes: { vi: "Chưa thêm ghi chú đầu vụ.", en: "No starting notes yet.", ja: "開始メモはまだありません。" },
  details: { vi: "Chi tiết", en: "Details", ja: "詳細" },
  quickCreate: { vi: "Khởi tạo nhanh", en: "Quick start", ja: "クイック作成" },
  readyStart: { vi: "Mục chu kỳ sinh trưởng đã sẵn sàng để bạn bắt đầu", en: "Growth cycle is ready for you to start", ja: "生育サイクルをすぐ開始できます" },
  quickDesc: { vi: "Hệ thống ưu tiên lấy cây trồng từ cơ sở dữ liệu để điền nhanh thông tin. Nếu chưa có cây này trong cơ sở dữ liệu, hệ thống sẽ tự tạo chu kỳ mới để bạn tự theo dõi.", en: "The system uses database crops first to prefill information. If a crop is not found, it creates a manual cycle for you to track.", ja: "まずデータベースの作物で情報を自動入力します。見つからない場合は手動追跡用のサイクルを作成します。" },
  fromDatabase: { vi: "Từ cơ sở dữ liệu", en: "From database", ja: "DBから" },
  fromCatalog: { vi: "Từ danh mục sẵn có", en: "From catalog", ja: "カタログから" },
  quickTemplate: { vi: "Mẫu nhanh", en: "Quick template", ja: "簡易テンプレート" },
  expectedCycle: { vi: "Chu kỳ dự kiến", en: "Expected cycle", ja: "想定サイクル" },
  setupCycle: { vi: "Thiết lập chu kỳ", en: "Cycle setup", ja: "サイクル設定" },
  createNew: { vi: "Tạo chu kỳ sinh trưởng mới", en: "Create a new growth cycle", ja: "新しい生育サイクルを作成" },
  setupDesc: { vi: "Chọn cây, ngày bắt đầu và thời lượng. Hệ thống tự tính giai đoạn, tiến độ và tạo checklist mẫu theo mốc thời gian.", en: "Choose crop, start date, and duration. The system calculates stage, progress, and sample checklist by timeline.", ja: "作物、開始日、期間を選ぶと、ステージ、進捗、チェックリストを自動計算します。" },
  loadingCatalog: { vi: "Đang tải cây trồng từ cơ sở dữ liệu...", en: "Loading crop catalog from database...", ja: "データベースから作物カタログを読込中..." },
  matchedTemplate: { vi: "Đã khớp cấu hình", en: "Matched template", ja: "テンプレート一致" },
  manualCycle: { vi: "Cây chưa có cấu hình sẵn vẫn tạo được chu kỳ thủ công.", en: "Manual cycle can still be created for crops without preset configuration.", ja: "事前設定がない作物でも手動サイクルを作成できます。" },
  cropName: { vi: "Tên cây trồng", en: "Crop name", ja: "作物名" },
  cropPlaceholder: { vi: "Ví dụ: Lúa ST25, Cà chua bi, Dưa leo...", en: "Example: ST25 rice, cherry tomato, cucumber...", ja: "例: ST25米、ミニトマト、キュウリ..." },
  startDate: { vi: "Ngày bắt đầu", en: "Start date", ja: "開始日" },
  duration: { vi: "Thời lượng", en: "Duration", ja: "期間" },
  currentStage: { vi: "Cây đang ở giai đoạn nào?", en: "Which stage is the crop in?", ja: "作物はどの段階ですか？" },
  currentStageDesc: { vi: "Chọn đúng tình trạng hiện tại để AI và checklist bám sát thực tế.", en: "Choose the current condition so AI and checklist stay close to reality.", ja: "現在の状態を選ぶとAIとチェックリストが実情に合います。" },
  quickTemplates: { vi: "Mẫu nhanh", en: "Quick templates", ja: "簡易テンプレート" },
  configs: { vi: "cấu hình", en: "configs", ja: "設定" },
  startNotes: { vi: "Ghi chú đầu vụ", en: "Starting notes", ja: "開始メモ" },
  notePlaceholder: { vi: "Mật độ trồng, giống, khu vực, mục tiêu năng suất, lưu ý sâu bệnh...", en: "Planting density, variety, area, yield target, pest notes...", ja: "栽植密度、品種、区画、収量目標、病害虫メモ..." },
  autoChecklist: { vi: "Tự tạo checklist theo giai đoạn", en: "Auto-create checklist by stage", ja: "段階別チェックリストを自動作成" },
  crop: { vi: "Cây", en: "Crop", ja: "作物" },
  noInput: { vi: "Chưa nhập", en: "Not entered", ja: "未入力" },
  expectedEnd: { vi: "Kết thúc dự kiến", en: "Expected end", ja: "終了予定" },
  tasks: { vi: "việc", en: "tasks", ja: "タスク" },
  off: { vi: "Tắt", en: "Off", ja: "オフ" },
  selectAll: { vi: "Chọn hết", en: "Select all", ja: "すべて選択" },
  clearAll: { vi: "Bỏ hết", en: "Clear all", ja: "すべて解除" },
  timeline: { vi: "Lịch trình dự kiến", en: "Expected timeline", ja: "想定タイムライン" },
  dayRange: { vi: "Ngày", en: "Day", ja: "日目" },
  firstTasks: { vi: "Việc đầu tiên", en: "First tasks", ja: "最初のタスク" },
  creating: { vi: "Đang tạo chu kỳ...", en: "Creating cycle...", ja: "サイクル作成中..." },
  create: { vi: "Tạo chu kỳ", en: "Create cycle", ja: "サイクル作成" },
  progress: { vi: "Tiến độ", en: "Progress", ja: "進捗" },
  elapsed: { vi: "Đã qua", en: "Elapsed", ja: "経過" },
  completed: { vi: "Hoàn tất", en: "Completed", ja: "完了" },
  cycleDetails: { vi: "Chi tiết chu kỳ sinh trưởng", en: "Growth cycle details", ja: "生育サイクル詳細" },
  noCycleNotes: {
    vi: "Chưa có ghi chú đầu vụ. Bạn có thể dùng khu vực công việc và nhật ký ảnh để bổ sung quá trình chăm sóc.",
    en: "No starting notes yet. Use tasks and photo logs to add cultivation updates.",
    ja: "開始メモはまだありません。作業と写真ログで栽培経過を追加できます。",
  },
  stageLabel: { vi: "Giai đoạn", en: "Stage", ja: "ステージ" },
  remainingExpected: { vi: "Còn {days} ngày dự kiến", en: "{days} expected days left", ja: "予定残り{days}日" },
  editClose: { vi: "Đóng chỉnh sửa", en: "Close editing", ja: "編集を閉じる" },
  editCycle: { vi: "Chỉnh sửa chu kỳ", en: "Edit cycle", ja: "サイクル編集" },
  deleteCycle: { vi: "Xóa chu kỳ", en: "Delete cycle", ja: "サイクル削除" },
  cycleConfig: { vi: "Cấu hình chu kỳ", en: "Cycle configuration", ja: "サイクル設定" },
  updateOps: { vi: "Cập nhật thông tin vận hành", en: "Update operation details", ja: "運用情報を更新" },
  opsNotes: { vi: "Ghi chú vận hành", en: "Operation notes", ja: "運用メモ" },
  saveUpdate: { vi: "Lưu cập nhật", en: "Save changes", ja: "更新を保存" },
  cancel: { vi: "Hủy", en: "Cancel", ja: "キャンセル" },
  stageRoadmap: { vi: "Lộ trình giai đoạn", en: "Stage roadmap", ja: "ステージロードマップ" },
  step: { vi: "Bước", en: "Step", ja: "ステップ" },
  priorityWork: { vi: "Việc nên ưu tiên", en: "Priority work", ja: "優先作業" },
  cautionPoints: { vi: "Điểm cần cảnh giác", en: "Caution points", ja: "注意ポイント" },
  taskList: { vi: "Danh sách công việc", en: "Task list", ja: "タスクリスト" },
  taskPlanDesc: { vi: "Lập việc theo ngày cho cả chu kỳ", en: "Plan day-by-day tasks for the whole cycle", ja: "サイクル全体の日別作業を計画" },
  loadTemplateTasks: { vi: "Nạp việc mẫu", en: "Load template tasks", ja: "テンプレート作業を追加" },
  aiPlanning: { vi: "AI đang lập kế hoạch...", en: "AI is planning...", ja: "AIが計画中..." },
  aiCreateTasks: { vi: "AI tạo việc", en: "AI creates tasks", ja: "AIで作業作成" },
  taskPlaceholder: { vi: "Ví dụ: Kiểm tra độ ẩm đất, bón kali, tỉa lá gốc...", en: "Example: Check soil moisture, apply potassium, prune lower leaves...", ja: "例: 土壌水分確認、カリ施肥、下葉整理..." },
  addTask: { vi: "Thêm việc", en: "Add task", ja: "作業を追加" },
  all: { vi: "Tất cả", en: "All", ja: "すべて" },
  open: { vi: "Đang mở", en: "Open", ja: "未完了" },
  done: { vi: "Hoàn tất", en: "Done", ja: "完了" },
  overdue: { vi: "Quá hạn", en: "Overdue", ja: "期限超過" },
  due: { vi: "Hạn", en: "Due", ja: "期限" },
  noMatchingTasks: { vi: "Không có công việc khớp bộ lọc hiện tại. Hãy thêm đầu việc mới hoặc đổi bộ lọc.", en: "No tasks match the current filter. Add a new task or change the filter.", ja: "現在のフィルターに一致する作業はありません。作業を追加するかフィルターを変更してください。" },
  photoJournal: { vi: "Nhật ký hình ảnh", en: "Photo journal", ja: "写真ログ" },
  photoJournalDesc: { vi: "Lưu ảnh quan sát trong suốt quá trình sinh trưởng", en: "Save observation photos throughout growth", ja: "生育期間中の観察写真を保存" },
  photoUrlPlaceholder: { vi: "Dán URL ảnh quan sát...", en: "Paste observation photo URL...", ja: "観察写真URLを貼り付け..." },
  photoNotePlaceholder: { vi: "Ghi chú quan sát: màu lá, chiều cao, biểu hiện sâu bệnh, độ đồng đều...", en: "Observation notes: leaf color, height, pest signs, uniformity...", ja: "観察メモ: 葉色、高さ、病害虫兆候、揃い..." },
  savePhotoLog: { vi: "Lưu nhật ký ảnh", en: "Save photo log", ja: "写真ログを保存" },
  noPhotoNote: { vi: "Chưa có ghi chú cho ảnh này.", en: "No note for this photo yet.", ja: "この写真のメモはまだありません。" },
  noPhotos: { vi: "Chưa có ảnh theo dõi, hãy thêm ảnh đầu tiên cho chu kỳ này.", en: "No tracking photos yet. Add the first photo for this cycle.", ja: "追跡写真はまだありません。このサイクルの最初の写真を追加してください。" },
  healthScore: { vi: "Điểm sức khỏe vận hành", en: "Operation health score", ja: "運用ヘルススコア" },
  aiInsightDesc: { vi: "Gợi ý theo đúng giai đoạn hiện tại", en: "Suggestions for the current stage", ja: "現在ステージに合わせた提案" },
  loadingAdvice: { vi: "Đang lấy tư vấn mới...", en: "Fetching new advice...", ja: "新しい助言を取得中..." },
  requestAdvice: { vi: "Yêu cầu tư vấn mới", en: "Request new advice", ja: "新しい助言を依頼" },
  cycleStats: { vi: "Thống kê chu kỳ", en: "Cycle statistics", ja: "サイクル統計" },
  overallProgress: { vi: "Tiến độ tổng thể", en: "Overall progress", ja: "全体進捗" },
  journalPhotos: { vi: "Ảnh nhật ký", en: "Journal photos", ja: "ログ写真" },
  upcomingWork: { vi: "Việc sắp tới", en: "Upcoming tasks", ja: "今後の作業" },
  overdueWork: { vi: "Việc quá hạn", en: "Overdue tasks", ja: "期限超過作業" },
  overdueIn: { vi: "Quá hạn {days} ngày", en: "{days} days overdue", ja: "{days}日超過" },
  dueToday: { vi: "Đến hạn hôm nay", en: "Due today", ja: "本日期限" },
  daysLeft: { vi: "Còn {days} ngày", en: "{days} days left", ja: "残り{days}日" },
  aiHealth: { vi: "Sức khỏe AI", en: "AI health", ja: "AIヘルス" },
  completionRate: { vi: "Tỷ lệ hoàn thành việc", en: "Task completion rate", ja: "作業完了率" },
  dueSoon: { vi: "Thông báo sắp đến hạn", en: "Due soon alerts", ja: "期限間近の通知" },
  noUrgentAlerts: { vi: "Chưa có thông báo gấp trong 48 giờ tới. Các việc tiếp theo vẫn được giữ trong danh sách công việc bên trái.", en: "No urgent alerts in the next 48 hours. Upcoming work remains in the task list on the left.", ja: "今後48時間の緊急通知はありません。次の作業は左側の一覧に残ります。" },
  operationTimeline: { vi: "Dòng thời gian vận hành", en: "Operation timeline", ja: "運用タイムライン" },
  emptyTimeline: { vi: "Dòng thời gian sẽ xuất hiện khi bạn bắt đầu thêm việc hoặc nhật ký ảnh.", en: "The timeline appears once you add tasks or photo logs.", ja: "作業または写真ログを追加するとタイムラインが表示されます。" },
  quickCheck: { vi: "Nhắc kiểm tra nhanh", en: "Quick checks", ja: "クイック確認" },
  quickCheckWater: { vi: "Kiểm tra độ ẩm đất và nhịp tưới theo thời tiết thực tế.", en: "Check soil moisture and watering rhythm based on actual weather.", ja: "実際の天候に合わせて土壌水分と灌水リズムを確認します。" },
  quickCheckLight: { vi: "Quan sát ánh sáng, nhiệt độ và độ thông thoáng tán lá.", en: "Observe light, temperature, and canopy ventilation.", ja: "光、温度、葉群の通気を観察します。" },
  quickCheckPhoto: { vi: "Ghi ảnh định kỳ cùng một góc chụp để dễ đối chiếu sự thay đổi.", en: "Take regular photos from the same angle to compare changes.", ja: "変化を比較しやすいよう同じ角度で定期撮影します。" },
  aiSignal: { vi: "Tín hiệu AI", en: "AI signal", ja: "AIシグナル" },
  updated: { vi: "Đã cập nhật", en: "Updated", ja: "更新済み" },
  waiting: { vi: "Đang chờ", en: "Waiting", ja: "待機中" },
  aiSignalNote: { vi: "Gợi ý được sinh theo giai đoạn hiện tại của cây.", en: "Suggestions are generated from the current crop stage.", ja: "現在の作物ステージに基づいて提案を生成します。" },
  executionRhythm: { vi: "Nhịp thực thi", en: "Execution rhythm", ja: "実行リズム" },
  completedTasksValue: { vi: "{done}/{total} việc", en: "{done}/{total} tasks", ja: "{done}/{total}件" },
  overdueTaskNote: { vi: "{count} việc đang quá hạn cần xử lý.", en: "{count} overdue tasks need attention.", ja: "{count}件の期限超過作業があります。" },
  noOverdueTaskNote: { vi: "Chưa có đầu việc quá hạn.", en: "No overdue tasks yet.", ja: "期限超過作業はありません。" },
  fieldPhotoSignal: { vi: "Ảnh hiện trường", en: "Field photos", ja: "現場写真" },
  noData: { vi: "Chưa có", en: "None yet", ja: "未登録" },
  photoSignalNote: { vi: "Có nhật ký ảnh để đối chiếu biến động thực tế.", en: "Photo logs are available to compare real changes.", ja: "実際の変化を比較する写真ログがあります。" },
  noPhotoSignalNote: { vi: "Nên thêm ảnh để AI và người vận hành quan sát tốt hơn.", en: "Add photos so AI and operators can observe better.", ja: "AIと作業者が確認しやすいよう写真を追加してください。" },
  taskDonePrefix: { vi: "Hoàn tất", en: "Completed", ja: "完了" },
  taskSchedulePrefix: { vi: "Lịch việc", en: "Scheduled task", ja: "予定作業" },
  photoUpdated: { vi: "Nhật ký hình ảnh được cập nhật", en: "Photo journal updated", ja: "写真ログを更新" },
  photoAddedNote: { vi: "Đã thêm ảnh theo dõi hiện trường.", en: "Added a field tracking photo.", ja: "現場追跡写真を追加しました。" },
  suggestedNote: { vi: "Sẽ dùng ghi chú gợi ý", en: "Suggested note will be used", ja: "提案メモを使用します" },
  autoChecklistOn: { vi: "{options} lựa chọn từ {stages} giai đoạn, sinh ra {tasks} việc.", en: "{options} options from {stages} stages, generating {tasks} tasks.", ja: "{stages}ステージから{options}件を選択し、{tasks}件の作業を作成します。" },
  autoChecklistOff: { vi: "Chu kỳ sẽ được tạo trống để bạn tự thêm việc.", en: "The cycle will be created empty so you can add tasks manually.", ja: "空のサイクルを作成し、作業は手動で追加します。" },
  currentStageShort: { vi: "Giai đoạn hiện tại", en: "Current stage", ja: "現在ステージ" },
  chooseStageOptions: { vi: "Chọn đầu việc theo giai đoạn", en: "Choose options by stage", ja: "ステージ別オプション選択" },
  chooseStageOptionsDesc: { vi: "Có thể chọn nhiều đầu việc từ nhiều giai đoạn khác nhau.", en: "You can choose multiple tasks from different stages.", ja: "複数ステージから複数の作業を選択できます。" },
  optionsSelected: { vi: "{selected}/{total} đầu việc đang chọn", en: "{selected}/{total} options selected", ja: "{selected}/{total}件選択中" },
  addStage: { vi: "Chọn giai đoạn", en: "Select stage", ja: "ステージ選択" },
  removeStage: { vi: "Bỏ giai đoạn", en: "Remove stage", ja: "ステージ解除" },
  repeatEvery: { vi: "lặp {days} ngày", en: "repeat every {days} days", ja: "{days}日ごとに繰り返し" },
  validationCropName: { vi: "Nhập tên cây trồng để tạo chu kỳ.", en: "Enter a crop name to create a cycle.", ja: "サイクル作成には作物名を入力してください。" },
  validationStartDate: { vi: "Chọn ngày bắt đầu hợp lệ.", en: "Choose a valid start date.", ja: "有効な開始日を選択してください。" },
  validationDuration: { vi: "Thời lượng phải từ {min} đến {max} ngày.", en: "Duration must be from {min} to {max} days.", ja: "期間は{min}〜{max}日で指定してください。" },
  validationTasks: { vi: "Chọn ít nhất một đầu việc, hoặc tắt tự tạo checklist.", en: "Choose at least one task, or turn off auto checklist.", ja: "少なくとも1件の作業を選ぶか、自動チェックリストをオフにしてください。" },
  genericError: { vi: "Có lỗi xảy ra. Vui lòng thử lại.", en: "Something went wrong. Please try again.", ja: "エラーが発生しました。もう一度お試しください。" },
  openingLogin: { vi: "Mở cổng đăng nhập Supabase để bạn xác thực tài khoản...", en: "Opening Supabase sign-in so you can authenticate...", ja: "Supabaseログインを開いて認証します..." },
  loginBeforeCreate: { vi: "Bạn cần đăng nhập bằng Supabase trước khi khởi tạo chu kỳ mới.", en: "Sign in with Supabase before creating a new cycle.", ja: "新しいサイクルを作成する前にSupabaseでログインしてください。" },
  missingCropName: { vi: "Bạn chưa nhập tên cây trồng.", en: "Crop name is missing.", ja: "作物名が未入力です。" },
  missingStartDate: { vi: "Bạn chưa chọn ngày bắt đầu.", en: "Start date is missing.", ja: "開始日が未選択です。" },
  invalidDurationRange: { vi: "Thời lượng chu kỳ cần nằm trong khoảng {min}-{max} ngày.", en: "Cycle duration must be between {min}-{max} days.", ja: "サイクル期間は{min}〜{max}日で指定してください。" },
  createdWithTemplateTasks: { vi: "Đã khởi tạo chu kỳ từ dữ liệu sẵn có cho {crop} và tạo sẵn {tasks} nhắc việc.", en: "Created a cycle from existing data for {crop} and generated {tasks} reminders.", ja: "{crop}の既存データからサイクルを作成し、{tasks}件のリマインダーを生成しました。" },
  createdManualTasks: { vi: "Không có cây này trong cơ sở dữ liệu, hệ thống sẽ tự tạo chu kỳ mới và {tasks} nhắc việc để bạn tự theo dõi.", en: "This crop is not in the database, so a manual cycle and {tasks} reminders were created.", ja: "この作物はデータベースにないため、手動サイクルと{tasks}件のリマインダーを作成しました。" },
  createdTaskWarning: { vi: "Chu kỳ đã được tạo, nhưng chưa tạo được việc mẫu. Bạn vẫn có thể thêm việc sau.", en: "The cycle was created, but template tasks could not be created. You can add tasks later.", ja: "サイクルは作成されましたが、テンプレート作業は作成できませんでした。後から追加できます。" },
  createdWithTemplate: { vi: "Đã khởi tạo chu kỳ từ dữ liệu sẵn có cho {crop}.", en: "Created a cycle from existing data for {crop}.", ja: "{crop}の既存データからサイクルを作成しました。" },
  createdManual: { vi: "Không có cây này trong cơ sở dữ liệu, hệ thống sẽ tự tạo chu kỳ mới để bạn tự theo dõi.", en: "This crop is not in the database, so a manual cycle was created for tracking.", ja: "この作物はデータベースにないため、手動追跡用サイクルを作成しました。" },
  confirmDeleteCycle: { vi: "Xóa chu kỳ \"{crop}\" cùng toàn bộ công việc và ảnh liên quan?", en: "Delete cycle \"{crop}\" with all related tasks and photos?", ja: "サイクル「{crop}」と関連する作業・写真をすべて削除しますか？" },
  duplicateSuggestions: { vi: "Các việc gợi ý đã tồn tại trong chu kỳ này rồi.", en: "Suggested tasks already exist in this cycle.", ja: "提案作業はこのサイクルに既に存在します。" },
  aiTasksCreated: { vi: "Đã tạo {count} việc gợi ý bằng AI cho chu kỳ này.", en: "Created {count} AI-suggested tasks for this cycle.", ja: "このサイクルにAI提案作業を{count}件作成しました。" },
  templateTasksLoaded: { vi: "Đã nạp {count} việc mẫu theo giai đoạn hiện tại.", en: "Loaded {count} template tasks for the current stage.", ja: "現在ステージのテンプレート作業を{count}件追加しました。" },
  aiAdviceError: { vi: "Hiện chưa lấy được tư vấn AI. Bạn vẫn có thể tiếp tục theo dõi công việc và nhật ký canh tác.", en: "AI advice is not available right now. You can still continue tracking tasks and field logs.", ja: "現在AI助言を取得できません。作業と栽培ログの追跡は続けられます。" },
};

const STAGES: GrowthCycle["currentStage"][] = ["Gieo trồng", "Sinh trưởng", "Ra hoa", "Thu hoạch"];
const growthDynamicText: Record<string, LocalizedDictionary[string]> = {
  "Lúa ST25": { vi: "Lúa ST25", en: "ST25 rice", ja: "ST25米" },
  "Cà chua bi": { vi: "Cà chua bi", en: "Cherry tomato", ja: "ミニトマト" },
  "Lúa": { vi: "Lúa", en: "Rice", ja: "米" },
  "Cà chua": { vi: "Cà chua", en: "Tomato", ja: "トマト" },
  "Ớt": { vi: "Ớt", en: "Chili pepper", ja: "トウガラシ" },
  "Dưa leo": { vi: "Dưa leo", en: "Cucumber", ja: "キュウリ" },
  "Cam": { vi: "Cam", en: "Orange", ja: "オレンジ" },
  "Bưởi": { vi: "Bưởi", en: "Pomelo", ja: "ザボン" },
  "Xoài": { vi: "Xoài", en: "Mango", ja: "マンゴー" },
  "Sầu riêng": { vi: "Sầu riêng", en: "Durian", ja: "ドリアン" },
  "Cà phê": { vi: "Cà phê", en: "Coffee", ja: "コーヒー" },
  "Thanh long": { vi: "Thanh long", en: "Dragon fruit", ja: "ドラゴンフルーツ" },
  "Gieo trồng": { vi: "Gieo trồng", en: "Planting", ja: "播種・定植" },
  "Sinh trưởng": { vi: "Sinh trưởng", en: "Vegetative growth", ja: "生育" },
  "Ra hoa": { vi: "Ra hoa", en: "Flowering", ja: "開花" },
  "Thu hoạch": { vi: "Thu hoạch", en: "Harvest", ja: "収穫" },
  "Khởi tạo nền sinh trưởng": { vi: "Khởi tạo nền sinh trưởng", en: "Build the growth foundation", ja: "生育基盤を整える" },
  "Tăng sinh khối và bộ lá": { vi: "Tăng sinh khối và bộ lá", en: "Increase biomass and foliage", ja: "草勢と葉量を増やす" },
  "Chuyển sang sinh sản": { vi: "Chuyển sang sinh sản", en: "Transition to reproduction", ja: "生殖成長へ移行" },
  "Ổn định chất lượng nông sản": { vi: "Ổn định chất lượng nông sản", en: "Stabilize crop quality", ja: "農産物品質を安定化" },
  "Ổn định giá thể, độ ẩm và mật độ để cây bén rễ đồng đều ngay từ đầu vụ.": { vi: "Ổn định giá thể, độ ẩm và mật độ để cây bén rễ đồng đều ngay từ đầu vụ.", en: "Stabilize substrate, moisture, and density so roots establish evenly from the start.", ja: "培地・水分・密度を整え、初期から均一に活着させます。" },
  "Đây là giai đoạn cần nước, dinh dưỡng và theo dõi sâu bệnh thường xuyên nhất.": { vi: "Đây là giai đoạn cần nước, dinh dưỡng và theo dõi sâu bệnh thường xuyên nhất.", en: "This stage needs the most consistent water, nutrition, and pest monitoring.", ja: "水分、養分、病害虫確認を最も継続的に行う段階です。" },
  "Ưu tiên cân bằng nước và trung vi lượng để tăng tỷ lệ đậu hoa, đậu trái.": { vi: "Ưu tiên cân bằng nước và trung vi lượng để tăng tỷ lệ đậu hoa, đậu trái.", en: "Prioritize water balance and micronutrients to improve flower and fruit set.", ja: "水分バランスと微量要素を優先し、着花・着果率を高めます。" },
  "Tập trung kiểm tra độ chín, thời gian cách ly và phân loại sau thu hoạch.": { vi: "Tập trung kiểm tra độ chín, thời gian cách ly và phân loại sau thu hoạch.", en: "Focus on maturity, pre-harvest interval, and post-harvest sorting.", ja: "熟度、使用後収穫間隔、収穫後選別を確認します。" },
  "Chuẩn bị đất hoặc giá thể tơi xốp": { vi: "Chuẩn bị đất hoặc giá thể tơi xốp", en: "Prepare loose soil or substrate", ja: "ふかふかの土・培地を準備" },
  "Giữ ẩm ổn định 2-3 ngày đầu": { vi: "Giữ ẩm ổn định 2-3 ngày đầu", en: "Keep moisture stable for the first 2-3 days", ja: "最初の2〜3日は水分を安定" },
  "Theo dõi tỷ lệ nảy mầm và dặm cây": { vi: "Theo dõi tỷ lệ nảy mầm và dặm cây", en: "Track germination and replant weak spots", ja: "発芽率を確認し欠株を補植" },
  "Bổ sung đạm, kali theo nhịp sinh trưởng": { vi: "Bổ sung đạm, kali theo nhịp sinh trưởng", en: "Supplement nitrogen and potassium by growth rhythm", ja: "生育に合わせ窒素・カリを補給" },
  "Tỉa lá già và giữ tán thông thoáng": { vi: "Tỉa lá già và giữ tán thông thoáng", en: "Prune older leaves and keep the canopy airy", ja: "古葉を整理し通気を確保" },
  "Theo dõi sâu ăn lá và nấm bệnh": { vi: "Theo dõi sâu ăn lá và nấm bệnh", en: "Monitor leaf-eating pests and fungal disease", ja: "食葉害虫とカビ病を確認" },
  "Theo dõi nhiệt độ và ẩm độ": { vi: "Theo dõi nhiệt độ và ẩm độ", en: "Monitor temperature and humidity", ja: "温度と湿度を確認" },
  "Bổ sung canxi, bo hoặc vi lượng phù hợp": { vi: "Bổ sung canxi, bo hoặc vi lượng phù hợp", en: "Add calcium, boron, or suitable micronutrients", ja: "カルシウム・ホウ素などを補給" },
  "Hạn chế rung lắc và sốc nước": { vi: "Hạn chế rung lắc và sốc nước", en: "Avoid shaking and water shock", ja: "振動と水ストレスを避ける" },
  "Kiểm tra chỉ số thu hoạch đúng lứa": { vi: "Kiểm tra chỉ số thu hoạch đúng lứa", en: "Check harvest indicators at the right window", ja: "適期の収穫指標を確認" },
  "Ghi nhận năng suất và chất lượng": { vi: "Ghi nhận năng suất và chất lượng", en: "Record yield and quality", ja: "収量と品質を記録" },
  "Chuẩn bị vệ sinh khu vực sau vụ": { vi: "Chuẩn bị vệ sinh khu vực sau vụ", en: "Prepare post-season sanitation", ja: "作後の清掃を準備" },
  "Không tưới quá mạnh gây xói gốc": { vi: "Không tưới quá mạnh gây xói gốc", en: "Do not water too strongly and erode the base", ja: "強すぎる灌水で株元を崩さない" },
  "Hạn chế bón phân đậm lúc cây còn non": { vi: "Hạn chế bón phân đậm lúc cây còn non", en: "Avoid strong fertilizer while plants are young", ja: "幼苗期の濃い施肥を控える" },
  "Tránh tưới chiều tối kéo dài": { vi: "Tránh tưới chiều tối kéo dài", en: "Avoid prolonged evening watering", ja: "夕方以降の長時間灌水を避ける" },
  "Không bón dồn lượng phân lớn trong một lần": { vi: "Không bón dồn lượng phân lớn trong một lần", en: "Do not apply a large fertilizer dose at once", ja: "一度に大量施肥しない" },
  "Không phun thuốc lúc hoa nở rộ nếu không cần thiết": { vi: "Không phun thuốc lúc hoa nở rộ nếu không cần thiết", en: "Avoid spraying during full bloom unless necessary", ja: "必要時以外は満開時の散布を避ける" },
  "Tránh bón thừa đạm gây rụng hoa": { vi: "Tránh bón thừa đạm gây rụng hoa", en: "Avoid excess nitrogen that can drop flowers", ja: "落花につながる窒素過多を避ける" },
  "Tuân thủ thời gian cách ly thuốc BVTV": { vi: "Tuân thủ thời gian cách ly thuốc BVTV", en: "Follow pesticide pre-harvest intervals", ja: "農薬の収穫前日数を守る" },
  "Thu hái đúng thời điểm để giảm hao hụt": { vi: "Thu hái đúng thời điểm để giảm hao hụt", en: "Harvest at the right time to reduce loss", ja: "適期収穫でロスを減らす" },
  "Tưới nước": { vi: "Tưới nước", en: "Watering", ja: "灌水" },
  "Bón phân": { vi: "Bón phân", en: "Fertilizing", ja: "施肥" },
  "Kiểm tra": { vi: "Kiểm tra", en: "Check", ja: "確認" },
  "Khác": { vi: "Khác", en: "Other", ja: "その他" },
  "Kiểm tra độ ẩm giá thể và tỷ lệ nảy mầm": { vi: "Kiểm tra độ ẩm giá thể và tỷ lệ nảy mầm", en: "Check substrate moisture and germination rate", ja: "培地水分と発芽率を確認" },
  "Tưới giữ ẩm nhẹ vào đầu ngày": { vi: "Tưới giữ ẩm nhẹ vào đầu ngày", en: "Lightly water early in the day", ja: "朝に軽く保湿灌水" },
  "Dặm cây yếu hoặc cây không lên đều": { vi: "Dặm cây yếu hoặc cây không lên đều", en: "Replant weak or uneven seedlings", ja: "弱い苗・欠株を補植" },
  "Dặm cây yếu hoặc cây không lên đều (Gieo trồng)": { vi: "Dặm cây yếu hoặc cây không lên đều (Gieo trồng)", en: "Replant weak or uneven seedlings (Planting)", ja: "弱い苗・欠株を補植（播種・定植）" },
  "Kiểm tra độ ẩm giá thể và tỷ lệ nảy mầm (Gieo trồng)": { vi: "Kiểm tra độ ẩm giá thể và tỷ lệ nảy mầm (Gieo trồng)", en: "Check substrate moisture and germination rate (Planting)", ja: "培地水分と発芽率を確認（播種・定植）" },
  "Tưới giữ ẩm nhẹ vào đầu ngày (Gieo trồng)": { vi: "Tưới giữ ẩm nhẹ vào đầu ngày (Gieo trồng)", en: "Lightly water early in the day (Planting)", ja: "朝に軽く保湿灌水（播種・定植）" },
  "Kiểm tra sâu ăn lá và nấm bệnh trên lá non": { vi: "Kiểm tra sâu ăn lá và nấm bệnh trên lá non", en: "Check young leaves for pests and fungal disease", ja: "若葉の害虫・病害を確認" },
  "Bón bổ sung dinh dưỡng theo nhịp sinh trưởng": { vi: "Bón bổ sung dinh dưỡng theo nhịp sinh trưởng", en: "Supplement nutrients by growth rhythm", ja: "生育に合わせ養分を補給" },
  "Điều chỉnh nhịp tưới theo độ ẩm đất thực tế": { vi: "Điều chỉnh nhịp tưới theo độ ẩm đất thực tế", en: "Adjust watering to actual soil moisture", ja: "実際の土壌水分に合わせ灌水調整" },
  "Kiểm tra sâu ăn lá và nấm bệnh trên lá non (Sinh trưởng)": { vi: "Kiểm tra sâu ăn lá và nấm bệnh trên lá non (Sinh trưởng)", en: "Check young leaves for pests and fungal disease (Vegetative growth)", ja: "若葉の害虫・病害を確認（生育）" },
  "Bón bổ sung dinh dưỡng theo nhịp sinh trưởng (Sinh trưởng)": { vi: "Bón bổ sung dinh dưỡng theo nhịp sinh trưởng (Sinh trưởng)", en: "Supplement nutrients by growth rhythm (Vegetative growth)", ja: "生育に合わせ養分を補給（生育）" },
  "Điều chỉnh nhịp tưới theo độ ẩm đất thực tế (Sinh trưởng)": { vi: "Điều chỉnh nhịp tưới theo độ ẩm đất thực tế (Sinh trưởng)", en: "Adjust watering to actual soil moisture (Vegetative growth)", ja: "実際の土壌水分に合わせ灌水調整（生育）" },
  "Theo dõi tỷ lệ ra hoa và hiện tượng rụng nụ": { vi: "Theo dõi tỷ lệ ra hoa và hiện tượng rụng nụ", en: "Monitor flowering rate and bud drop", ja: "開花率と落蕾を確認" },
  "Bổ sung vi lượng hỗ trợ đậu hoa, đậu trái": { vi: "Bổ sung vi lượng hỗ trợ đậu hoa, đậu trái", en: "Add micronutrients to support flower and fruit set", ja: "着花・着果を支える微量要素を補給" },
  "Kiểm tra ẩm độ và tránh sốc nước": { vi: "Kiểm tra ẩm độ và tránh sốc nước", en: "Check moisture and avoid water shock", ja: "水分を確認し水ストレスを避ける" },
  "Kiểm tra độ chín và lên lịch thu hái": { vi: "Kiểm tra độ chín và lên lịch thu hái", en: "Check maturity and schedule harvest", ja: "熟度を確認し収穫予定を組む" },
  "Vệ sinh khu vực và dụng cụ sau thu hoạch": { vi: "Vệ sinh khu vực và dụng cụ sau thu hoạch", en: "Clean area and tools after harvest", ja: "収穫後の場所と道具を清掃" },
  "Ghi nhận năng suất, chất lượng và hao hụt": { vi: "Ghi nhận năng suất, chất lượng và hao hụt", en: "Record yield, quality, and loss", ja: "収量・品質・ロスを記録" },
  "Ưu tiên quản lý nước mặt ruộng và theo dõi đạo ôn, rầy nâu theo từng thời điểm.": { vi: "Ưu tiên quản lý nước mặt ruộng và theo dõi đạo ôn, rầy nâu theo từng thời điểm.", en: "Prioritize field water management and monitor rice blast and brown planthopper by stage.", ja: "圃場水管理を優先し、いもち病とトビイロウンカを時期ごとに確認します。" },
  "Cần cắm giàn sớm, tỉa chồi định kỳ và theo dõi nấm lá, thối rễ.": { vi: "Cần cắm giàn sớm, tỉa chồi định kỳ và theo dõi nấm lá, thối rễ.", en: "Stake early, prune shoots regularly, and monitor leaf fungi and root rot.", ja: "早めに支柱を立て、定期的に芽かきし、葉の菌病と根腐れを確認します。" },
  "Giữ ẩm đều, bổ sung kali thời kỳ ra hoa đậu trái và theo dõi bọ trĩ.": { vi: "Giữ ẩm đều, bổ sung kali thời kỳ ra hoa đậu trái và theo dõi bọ trĩ.", en: "Keep moisture even, add potassium during flowering and fruit set, and monitor thrips.", ja: "水分を均一に保ち、開花・着果期にカリを補い、アザミウマを確認します。" },
  "Theo dõi nước ruộng, đẻ nhánh, đạo ôn và rầy nâu theo từng mốc sinh trưởng.": { vi: "Theo dõi nước ruộng, đẻ nhánh, đạo ôn và rầy nâu theo từng mốc sinh trưởng.", en: "Track field water, tillering, rice blast, and brown planthopper by growth milestone.", ja: "生育節目ごとに水管理、分げつ、いもち病、トビイロウンカを確認します。" },
  "Duy trì trụ thông thoáng, theo dõi đốm nâu cành và cân đối nước, kali trong giai đoạn mang trái.": { vi: "Duy trì trụ thông thoáng, theo dõi đốm nâu cành và cân đối nước, kali trong giai đoạn mang trái.", en: "Keep supports airy, monitor brown stem spots, and balance water and potassium during fruiting.", ja: "支柱周りの通気を保ち、枝の褐斑を確認し、着果期は水分とカリを調整します。" },
  "Đang theo dõi": { vi: "Đang theo dõi", en: "Tracking", ja: "追跡中" },
  "Đã thu hoạch": { vi: "Đã thu hoạch", en: "Harvested", ja: "収穫済み" },
  "Gián đoạn": { vi: "Gián đoạn", en: "Interrupted", ja: "中断" },
};
const STAGE_WEIGHTS: Record<GrowthCycle["currentStage"], number> = {
  "Gieo trồng": 0.2,
  "Sinh trưởng": 0.35,
  "Ra hoa": 0.25,
  "Thu hoạch": 0.2,
};

const stageContent: Record<
  GrowthCycle["currentStage"],
  {
    label: string;
    summary: string;
    focus: string[];
    alerts: string[];
  }
> = {
  "Gieo trồng": {
    label: "Khởi tạo nền sinh trưởng",
    summary: "Ổn định giá thể, độ ẩm và mật độ để cây bén rễ đồng đều ngay từ đầu vụ.",
    focus: ["Chuẩn bị đất hoặc giá thể tơi xốp", "Giữ ẩm ổn định 2-3 ngày đầu", "Theo dõi tỷ lệ nảy mầm và dặm cây"],
    alerts: ["Không tưới quá mạnh gây xói gốc", "Hạn chế bón phân đậm lúc cây còn non"],
  },
  "Sinh trưởng": {
    label: "Tăng sinh khối và bộ lá",
    summary: "Đây là giai đoạn cần nước, dinh dưỡng và theo dõi sâu bệnh thường xuyên nhất.",
    focus: ["Bổ sung đạm, kali theo nhịp sinh trưởng", "Tỉa lá già và giữ tán thông thoáng", "Theo dõi sâu ăn lá và nấm bệnh"],
    alerts: ["Tránh tưới chiều tối kéo dài", "Không bón dồn lượng phân lớn trong một lần"],
  },
  "Ra hoa": {
    label: "Chuyển sang sinh sản",
    summary: "Ưu tiên cân bằng nước và trung vi lượng để tăng tỷ lệ đậu hoa, đậu trái.",
    focus: ["Theo dõi nhiệt độ và ẩm độ", "Bổ sung canxi, bo hoặc vi lượng phù hợp", "Hạn chế rung lắc và sốc nước"],
    alerts: ["Không phun thuốc lúc hoa nở rộ nếu không cần thiết", "Tránh bón thừa đạm gây rụng hoa"],
  },
  "Thu hoạch": {
    label: "Ổn định chất lượng nông sản",
    summary: "Tập trung kiểm tra độ chín, thời gian cách ly và phân loại sau thu hoạch.",
    focus: ["Kiểm tra chỉ số thu hoạch đúng lứa", "Ghi nhận năng suất và chất lượng", "Chuẩn bị vệ sinh khu vực sau vụ"],
    alerts: ["Tuân thủ thời gian cách ly thuốc BVTV", "Thu hái đúng thời điểm để giảm hao hụt"],
  },
};

const DEFAULT_CUSTOM_CYCLE_DURATION = 90;
const MIN_CYCLE_DURATION = 7;
const MAX_CYCLE_DURATION = 730;

type CropTemplate = {
  cropName: string;
  duration: number;
  notes: string;
  source: "preset" | "database" | "fallback";
};

const presetCropTemplates: CropTemplate[] = [
  { cropName: "Lúa ST25", duration: 95, notes: "Ưu tiên quản lý nước mặt ruộng và theo dõi đạo ôn, rầy nâu theo từng thời điểm." },
  { cropName: "Cà chua bi", duration: 110, notes: "Cần cắm giàn sớm, tỉa chồi định kỳ và theo dõi nấm lá, thối rễ." },
  { cropName: "Dưa leo", duration: 75, notes: "Giữ ẩm đều, bổ sung kali thời kỳ ra hoa đậu trái và theo dõi bọ trĩ." },
].map((item) => ({ ...item, source: "preset" as const }));

const growthVisuals = [
  {
    src: growthVisual3,
    title: "Không gian canh tác",
    caption: "Theo dõi điều kiện ánh sáng, ẩm độ và nền sinh trưởng qua từng ngày.",
  },
  {
    src: growthVisual4,
    title: "Chăm sóc định kỳ",
    caption: "Nhắc việc tưới, bón, tỉa và kiểm tra cây theo từng giai đoạn.",
  },
  {
    src: growthVisual5,
    title: "Nhật ký hiện trường",
    caption: "Lưu ảnh để so sánh sức sống, tán lá, hoa và dấu hiệu bất thường.",
  },
];

const databaseCropDefaults: Record<string, Omit<CropTemplate, "source">> = {
  lua: {
    cropName: "Lúa",
    duration: 95,
    notes: "Theo dõi nước ruộng, đẻ nhánh, đạo ôn và rầy nâu theo từng mốc sinh trưởng.",
  },
  cachua: {
    cropName: "Cà chua",
    duration: 110,
    notes: "Cần tỉa chồi, cố định thân, giữ ẩm ổn định và quan sát nấm lá, thối rễ định kỳ.",
  },
  ot: {
    cropName: "Ớt",
    duration: 120,
    notes: "Ưu tiên bộ rễ khỏe, dinh dưỡng cân đối và kiểm tra héo xanh, bọ trĩ, thán thư thường xuyên.",
  },
  dualeo: {
    cropName: "Dưa leo",
    duration: 75,
    notes: "Giữ ẩm đều, làm giàn sớm, bổ sung kali khi chuẩn bị ra hoa và theo dõi sương mai, bọ trĩ.",
  },
  cam: {
    cropName: "Cam",
    duration: 180,
    notes: "Theo dõi đọt non, quản lý nước, dinh dưỡng và kiểm tra sâu vẽ bùa, nấm lá sau mưa.",
  },
  buoi: {
    cropName: "Bưởi",
    duration: 210,
    notes: "Ưu tiên cân bằng tán cây, ẩm độ đất và kiểm tra sâu bệnh trên lộc non, hoa và trái non.",
  },
  xoai: {
    cropName: "Xoài",
    duration: 160,
    notes: "Theo dõi ra đọt, xử lý ra hoa đúng nhịp và kiểm tra thán thư, bọ trĩ trên đọt và bông.",
  },
  saurieng: {
    cropName: "Sầu riêng",
    duration: 180,
    notes: "Quản lý ẩm độ đất chặt chẽ, tránh sốc nước và kiểm tra nấm rễ, xì mủ, sâu hại đọt non.",
  },
  caphe: {
    cropName: "Cà phê",
    duration: 240,
    notes: "Theo dõi đợt ra hoa, tưới giữ ẩm theo pha sinh trưởng và kiểm tra rệp sáp, nấm bệnh sau mưa.",
  },
  thanhlong: {
    cropName: "Thanh long",
    duration: 150,
    notes: "Duy trì trụ thông thoáng, theo dõi đốm nâu cành và cân đối nước, kali trong giai đoạn mang trái.",
  },
};

const normalizeCropKey = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .replace(/[^a-zA-Z0-9]/g, "")
    .toLowerCase();

const buildCustomCycleNote = (cropName: string) =>
  `Chu kỳ tự tạo cho ${cropName}. Bạn có thể tự theo dõi tiến độ, thêm việc định kỳ, nhật ký ảnh và ghi chú theo thực tế canh tác.`;

const buildCropTemplateFromName = (cropName: string, source: CropTemplate["source"]): CropTemplate => {
  const normalizedName = normalizeCropKey(cropName);
  const matchedDefault = Object.entries(databaseCropDefaults).find(([key]) => normalizedName.includes(key) || key.includes(normalizedName))?.[1];

  if (matchedDefault) {
    return {
      cropName: cropName.trim() || matchedDefault.cropName,
      duration: matchedDefault.duration,
      notes: matchedDefault.notes,
      source,
    };
  }

  return {
    cropName: cropName.trim(),
    duration: DEFAULT_CUSTOM_CYCLE_DURATION,
    notes: buildCustomCycleNote(cropName.trim()),
    source,
  };
};

const mergeCropTemplates = (templates: CropTemplate[]) => {
  const byName = new Map<string, CropTemplate>();

  templates.forEach((template) => {
    const key = normalizeCropKey(template.cropName);
    const existing = byName.get(key);

    if (!existing || (existing.source !== "database" && template.source === "database")) {
      byName.set(key, template);
    }
  });

  return Array.from(byName.values()).sort((left, right) => left.cropName.localeCompare(right.cropName, "vi"));
};

const findCropTemplate = (cropName: string, templates: CropTemplate[], options?: { fuzzy?: boolean }) => {
  const normalizedInput = normalizeCropKey(cropName);
  if (!normalizedInput) return null;

  const exactMatch = templates.find((template) => normalizeCropKey(template.cropName) === normalizedInput);
  if (exactMatch || options?.fuzzy === false) {
    return exactMatch || null;
  }

  return templates.find(
    (template) =>
      normalizedInput.includes(normalizeCropKey(template.cropName)) || normalizeCropKey(template.cropName).includes(normalizedInput)
  ) || null;
};

const createTemplatesFromCatalog = (catalog: GrowthCatalogCrop[]) =>
  catalog
    .map((item) => buildCropTemplateFromName(item.name, "database"))
    .filter((item) => item.cropName);

const taskTypeMeta: Record<
  GrowthTask["type"],
  { label: string; icon: typeof Droplets; tone: string }
> = {
  water: { label: "Tưới nước", icon: Droplets, tone: "text-sky-400 bg-sky-500/10 border-sky-500/20" },
  fertilize: { label: "Bón phân", icon: FlaskConical, tone: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
  check: { label: "Kiểm tra", icon: Target, tone: "text-violet-400 bg-violet-500/10 border-violet-500/20" },
  other: { label: "Khác", icon: Leaf, tone: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
};

type StageTaskTemplate = {
  title: string;
  type: GrowthTask["type"];
  offsetDays: number;
  repeatEveryDays?: number;
  maxOccurrences?: number;
};

const stageTaskTemplates: Record<GrowthCycle["currentStage"], StageTaskTemplate[]> = {
  "Gieo trồng": [
    { title: "Kiểm tra độ ẩm giá thể và tỷ lệ nảy mầm", type: "check", offsetDays: 0, repeatEveryDays: 4, maxOccurrences: 2 },
    { title: "Tưới giữ ẩm nhẹ vào đầu ngày", type: "water", offsetDays: 1, repeatEveryDays: 2, maxOccurrences: 4 },
    { title: "Dặm cây yếu hoặc cây không lên đều", type: "other", offsetDays: 3, maxOccurrences: 1 },
  ],
  "Sinh trưởng": [
    { title: "Kiểm tra sâu ăn lá và nấm bệnh trên lá non", type: "check", offsetDays: 0, repeatEveryDays: 6, maxOccurrences: 4 },
    { title: "Bón bổ sung dinh dưỡng theo nhịp sinh trưởng", type: "fertilize", offsetDays: 4, repeatEveryDays: 10, maxOccurrences: 3 },
    { title: "Điều chỉnh nhịp tưới theo độ ẩm đất thực tế", type: "water", offsetDays: 1, repeatEveryDays: 3, maxOccurrences: 5 },
  ],
  "Ra hoa": [
    { title: "Theo dõi tỷ lệ ra hoa và hiện tượng rụng nụ", type: "check", offsetDays: 0, repeatEveryDays: 5, maxOccurrences: 3 },
    { title: "Bổ sung vi lượng hỗ trợ đậu hoa, đậu trái", type: "fertilize", offsetDays: 3, repeatEveryDays: 8, maxOccurrences: 2 },
    { title: "Kiểm tra ẩm độ và tránh sốc nước", type: "water", offsetDays: 1, repeatEveryDays: 3, maxOccurrences: 4 },
  ],
  "Thu hoạch": [
    { title: "Kiểm tra độ chín và lên lịch thu hái", type: "check", offsetDays: 0, repeatEveryDays: 4, maxOccurrences: 3 },
    { title: "Vệ sinh khu vực và dụng cụ sau thu hoạch", type: "other", offsetDays: 2, repeatEveryDays: 7, maxOccurrences: 2 },
    { title: "Ghi nhận năng suất, chất lượng và hao hụt", type: "check", offsetDays: 1, repeatEveryDays: 5, maxOccurrences: 2 },
  ],
};

const getStageTaskKey = (stage: GrowthCycle["currentStage"], index: number) => `${stage}:${index}`;

const getDefaultSelectedTaskKeys = () =>
  STAGES.flatMap((stage) => stageTaskTemplates[stage].map((_template, index) => getStageTaskKey(stage, index)));

const statusMeta: Record<GrowthCycle["status"], { label: string; tone: string }> = {
  active: { label: "Đang theo dõi", tone: "border-emerald-500/20 bg-emerald-500/10 text-emerald-400" },
  harvested: { label: "Đã thu hoạch", tone: "border-sky-500/20 bg-sky-500/10 text-sky-300" },
  failed: { label: "Gián đoạn", tone: "border-red-500/20 bg-red-500/10 text-red-300" },
};

const getDaysUntil = (date: string) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
};

const formatDueLabel = (date: string, text?: { overdueIn: string; dueToday: string; daysLeft: string }) => {
  const days = getDaysUntil(date);
  if (days < 0) return (text?.overdueIn ?? "Quá hạn {days} ngày").replace("{days}", String(Math.abs(days)));
  if (days === 0) return text?.dueToday ?? "Đến hạn hôm nay";
  return (text?.daysLeft ?? "Còn {days} ngày").replace("{days}", String(days));
};

const parseAiTips = (tip: string | null) =>
  (tip || "")
    .split("\n")
    .map((item) => item.replace(/^[-*\d.\s]+/, "").trim())
    .filter(Boolean)
    .slice(0, 3);

const addDaysToDate = (date: Date, days: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const toDateInputValue = (date: Date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getSafeCycleDuration = (duration: number) => {
  if (!Number.isFinite(duration)) return DEFAULT_CUSTOM_CYCLE_DURATION;
  return Math.min(MAX_CYCLE_DURATION, Math.max(MIN_CYCLE_DURATION, Math.round(duration)));
};

const getSafeStartDate = (startDate: string) => {
  if (!startDate || Number.isNaN(new Date(startDate).getTime())) {
    return toDateInputValue(new Date());
  }

  return startDate;
};

type StageTimelineItem = {
  stage: GrowthCycle["currentStage"];
  index: number;
  startDate: string;
  endDate: string;
  days: number;
  startDay: number;
  endDay: number;
};

const buildStageTimeline = (startDate: string, totalDays: number): StageTimelineItem[] => {
  const duration = getSafeCycleDuration(totalDays);
  const stages = [...STAGES];
  const rawDays = stages.map((stage) => duration * STAGE_WEIGHTS[stage]);
  const baseDays = rawDays.map((value) => Math.max(1, Math.floor(value)));
  let assigned = baseDays.reduce((sum, value) => sum + value, 0);

  if (assigned > duration) {
    for (let index = baseDays.length - 1; index >= 0 && assigned > duration; index -= 1) {
      while (baseDays[index] > 1 && assigned > duration) {
        baseDays[index] -= 1;
        assigned -= 1;
      }
    }
  }

  if (assigned < duration) {
    const remainders = rawDays.map((value, index) => ({ index, remainder: value - Math.floor(value) }));
    remainders.sort((left, right) => right.remainder - left.remainder);
    let cursor = 0;

    while (assigned < duration) {
      baseDays[remainders[cursor % remainders.length].index] += 1;
      assigned += 1;
      cursor += 1;
    }
  }

  let dayCursor = 1;
  const cycleStart = new Date(getSafeStartDate(startDate));

  return stages.map((stage, index) => {
    const stageStart = addDaysToDate(cycleStart, dayCursor - 1);
    const stageEnd = addDaysToDate(stageStart, baseDays[index] - 1);
    const item: StageTimelineItem = {
      stage,
      index,
      startDate: toDateInputValue(stageStart),
      endDate: toDateInputValue(stageEnd),
      days: baseDays[index],
      startDay: dayCursor,
      endDay: dayCursor + baseDays[index] - 1,
    };

    dayCursor += baseDays[index];
    return item;
  });
};

const getDerivedStage = (cycle: Pick<GrowthCycle, "startDate" | "duration">) => {
  const timeline = buildStageTimeline(cycle.startDate, cycle.duration);
  const today = toDateInputValue(new Date());
  if (today < timeline[0].startDate) return timeline[0].stage;
  return timeline.find((item) => today >= item.startDate && today <= item.endDate)?.stage ?? timeline[timeline.length - 1].stage;
};

const getCycleStage = (cycle: Pick<GrowthCycle, "startDate" | "duration" | "currentStage"> & { status?: GrowthCycle["status"] }) => {
  if (cycle.status === "harvested") return "Thu hoạch";

  const derivedStage = getDerivedStage(cycle);
  const storedStage = cycle.currentStage;
  const derivedIndex = STAGES.indexOf(derivedStage);
  const storedIndex = STAGES.indexOf(storedStage);

  if (storedIndex < 0) return derivedStage;
  return STAGES[Math.max(storedIndex, derivedIndex)] ?? derivedStage;
};

const buildReminderTasksFromTimeline = (params: {
  userId: string;
  cycleId: string;
  startDate: string;
  duration: number;
  selectedTaskKeys?: string[];
}) => {
  const timeline = buildStageTimeline(params.startDate, params.duration);
  const selectedTaskKeys = new Set(params.selectedTaskKeys ?? getDefaultSelectedTaskKeys());

  return timeline.flatMap((item) => {
    const templates = stageTaskTemplates[item.stage];

    return templates.flatMap((template, templateIndex) => {
      if (!selectedTaskKeys.has(getStageTaskKey(item.stage, templateIndex))) {
        return [];
      }

      const reminders: Array<{
        cycleId: string;
        userId: string;
        title: string;
        dueDate: string;
        type: GrowthTask["type"];
      }> = [];

      const maxOccurrences = Math.max(1, template.maxOccurrences ?? 1);
      const repeatEveryDays = template.repeatEveryDays ?? item.days + 1;

      for (let occurrence = 0; occurrence < maxOccurrences; occurrence += 1) {
        const relativeDay = template.offsetDays + occurrence * repeatEveryDays;
        if (relativeDay >= item.days) break;

        const dueDate = toDateInputValue(addDaysToDate(new Date(item.startDate), relativeDay));
        reminders.push({
          cycleId: params.cycleId,
          userId: params.userId,
          title: `${template.title} (${item.stage})`,
          dueDate,
          type: template.type,
        });
      }

      return reminders;
    });
  });
};

const parseAiTaskSuggestions = (text: string) =>
  text
    .split("\n")
    .map((line) => line.replace(/^[-*\d.)\s]+/, "").trim())
    .filter(Boolean)
    .map((line) => {
      const [title, rawType, rawOffset] = line.split("|").map((part) => part.trim());
      const type = (["water", "fertilize", "check", "other"].includes(rawType) ? rawType : "check") as GrowthTask["type"];
      const offsetDays = Number(rawOffset);
      return {
        title: title || line,
        type,
        offsetDays: Number.isFinite(offsetDays) ? Math.max(0, offsetDays) : 0,
      };
    })
    .slice(0, 4);

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) {
    try {
      const parsed = JSON.parse(error.message) as { error?: string };
      if (parsed?.error) return parsed.error;
    } catch {
      return error.message;
    }
    return error.message;
  }

  return "GENERIC_ERROR";
};

const createCycleProgress = (cycle: Pick<GrowthCycle, "startDate" | "duration">) => {
  const start = new Date(getSafeStartDate(cycle.startDate)).getTime();
  const now = new Date().getTime();
  const elapsed = Math.max(0, Math.floor((now - start) / (1000 * 60 * 60 * 24)));
  return Math.min(100, Math.floor((elapsed / getSafeCycleDuration(cycle.duration)) * 100));
};

const GrowthView = ({ user, onLogin }: GrowthViewProps) => {
  const { language } = useI18n();
  const tt = (key: string) => growthText[key]?.[language] ?? growthText[key]?.vi ?? key;
  const td = (value?: string | null) => {
    if (!value) return "";
    const exact = growthDynamicText[value]?.[language] ?? growthDynamicText[value]?.vi;
    if (exact) return exact;
    return Object.entries(growthDynamicText)
      .sort((left, right) => right[0].length - left[0].length)
      .reduce((text, [source, target]) => text.replaceAll(source, target[language] ?? target.vi), value);
  };
  const formatTemplate = (key: string, values: Record<string, string | number>) =>
    Object.entries(values).reduce((text, [name, value]) => text.replaceAll(`{${name}}`, String(value)), tt(key));
  const dueLabel = (date: string) =>
    formatDueLabel(date, {
      overdueIn: tt("overdueIn"),
      dueToday: tt("dueToday"),
      daysLeft: tt("daysLeft"),
    });
  const errorText = (error: unknown) => {
    const message = getErrorMessage(error);
    return message === "GENERIC_ERROR" ? tt("genericError") : message;
  };
  const locale = language === "vi" ? "vi-VN" : language === "ja" ? "ja-JP" : "en-US";
  const localizedTaskTypeMeta = Object.fromEntries(
    Object.entries(taskTypeMeta).map(([key, meta]) => [key, { ...meta, label: td(meta.label) }])
  ) as typeof taskTypeMeta;
  const localizedStatusMeta = Object.fromEntries(
    Object.entries(statusMeta).map(([key, meta]) => [key, { ...meta, label: td(meta.label) }])
  ) as typeof statusMeta;
  const [cycles, setCycles] = useState<GrowthCycle[]>([]);
  const [selectedCycle, setSelectedCycle] = useState<GrowthCycle | null>(null);
  const [tasks, setTasks] = useState<GrowthTask[]>([]);
  const [photos, setPhotos] = useState<GrowthPhoto[]>([]);
  const [cropTemplates, setCropTemplates] = useState<CropTemplate[]>(presetCropTemplates);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditingCycle, setIsEditingCycle] = useState(false);
  const [aiTip, setAiTip] = useState<string | null>(null);
  const [isLoadingTip, setIsLoadingTip] = useState(false);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [isCreatingCycle, setIsCreatingCycle] = useState(false);
  const [isLoadingCropCatalog, setIsLoadingCropCatalog] = useState(false);
  const [taskFilter, setTaskFilter] = useState<"all" | "open" | "done" | "overdue">("all");
  const [planFeedback, setPlanFeedback] = useState<string | null>(null);
  const [createCycleFeedback, setCreateCycleFeedback] = useState<string | null>(null);
  const [newCycle, setNewCycle] = useState({
    cropName: "",
    startDate: new Date().toISOString().split("T")[0],
    duration: DEFAULT_CUSTOM_CYCLE_DURATION,
    notes: "",
    currentStage: "Gieo trồng" as GrowthCycle["currentStage"],
    status: "active" as GrowthCycle["status"],
    autoCreateTasks: true,
  });
  const [selectedNewCycleTaskKeys, setSelectedNewCycleTaskKeys] = useState<string[]>(getDefaultSelectedTaskKeys());
  const [newTask, setNewTask] = useState({
    title: "",
    dueDate: new Date().toISOString().split("T")[0],
    type: "check" as GrowthTask["type"],
  });
  const [newPhoto, setNewPhoto] = useState({
    url: "",
    date: new Date().toISOString().split("T")[0],
    note: "",
  });
  const [cycleDraft, setCycleDraft] = useState({
    cropName: "",
    startDate: new Date().toISOString().split("T")[0],
    duration: DEFAULT_CUSTOM_CYCLE_DURATION,
    notes: "",
    status: "active" as GrowthCycle["status"],
  });

  useEffect(() => {
    let isMounted = true;

    const loadCropCatalog = async () => {
      setIsLoadingCropCatalog(true);

      try {
        const [catalogResult, recommendationResult] = await Promise.allSettled([
          listGrowthCatalogCrops(),
          getRecommendationProfiles(),
        ]);

        const dbTemplates =
          catalogResult.status === "fulfilled"
            ? createTemplatesFromCatalog(catalogResult.value)
            : [];
        const fallbackTemplates =
          recommendationResult.status === "fulfilled"
            ? getCropOptionsFromProfiles(recommendationResult.value.data).map((cropName) =>
                buildCropTemplateFromName(cropName, "fallback")
              )
            : [];

        if (!isMounted) return;
        setCropTemplates(mergeCropTemplates([...dbTemplates, ...presetCropTemplates, ...fallbackTemplates]));
      } catch (error) {
        console.error("Load crop catalog failed:", error);
        if (!isMounted) return;
        setCropTemplates(presetCropTemplates);
      } finally {
        if (isMounted) {
          setIsLoadingCropCatalog(false);
        }
      }
    };

    void loadCropCatalog();

    return () => {
      isMounted = false;
    };
  }, []);

  const refreshCycles = async (preferredCycleId?: string) => {
    if (!user) return;
    const nextCycles = await listGrowthCycles(user.uid);
    setCycles(nextCycles);

    if (!preferredCycleId) return;
    const freshSelected = nextCycles.find((cycle) => cycle.id === preferredCycleId) ?? null;
    setSelectedCycle(freshSelected);
  };

  const refreshSelectedCycleDetails = async (cycleId: string) => {
    const [nextTasks, nextPhotos] = await Promise.all([listGrowthTasks(cycleId), listGrowthPhotos(cycleId)]);
    setTasks(nextTasks);
    setPhotos(nextPhotos);
  };

  const handleInlineLogin = async () => {
    setCreateCycleFeedback(tt("openingLogin"));
    void onLogin();
  };

  const applyTemplateToNewCycle = (template: CropTemplate) => {
    setNewCycle((current) => ({
      ...current,
      cropName: template.cropName,
      duration: template.duration,
      notes: template.notes,
      status: "active",
    }));
  };

  const handleNewCycleCropNameChange = (value: string) => {
    setNewCycle((current) => {
      const nextCropName = value;
      const matchedTemplate = findCropTemplate(nextCropName, cropTemplates, { fuzzy: false });

      return {
        ...current,
        cropName: matchedTemplate?.cropName || nextCropName,
        duration:
          matchedTemplate && (current.duration === DEFAULT_CUSTOM_CYCLE_DURATION || !Number.isFinite(current.duration) || current.duration < MIN_CYCLE_DURATION)
            ? matchedTemplate.duration
            : current.duration,
        notes: matchedTemplate && !current.notes.trim() ? matchedTemplate.notes : current.notes,
      };
    });
  };

  const toggleNewCycleTaskOption = (taskKey: string) => {
    setSelectedNewCycleTaskKeys((current) =>
      current.includes(taskKey) ? current.filter((item) => item !== taskKey) : [...current, taskKey]
    );
  };

  const setStageTaskOptions = (stage: GrowthCycle["currentStage"], checked: boolean) => {
    const stageKeys = stageTaskTemplates[stage].map((_template, index) => getStageTaskKey(stage, index));
    setSelectedNewCycleTaskKeys((current) => {
      const currentSet = new Set(current);
      stageKeys.forEach((key) => {
        if (checked) {
          currentSet.add(key);
        } else {
          currentSet.delete(key);
        }
      });
      return Array.from(currentSet);
    });
  };

  useEffect(() => {
    if (!user) {
      setCycles([]);
      setSelectedCycle(null);
      return;
    }

    void listGrowthCycles(user.uid)
      .then((data) => setCycles(data))
      .catch((error) => {
        console.error("Load growth cycles failed:", error);
        setCreateCycleFeedback(errorText(error));
      });
  }, [user]);

  useEffect(() => {
    if (!selectedCycle) return;
    const freshCycle = cycles.find((cycle) => cycle.id === selectedCycle.id);
    if (freshCycle) setSelectedCycle(freshCycle);
  }, [cycles, selectedCycle]);

  useEffect(() => {
    if (!selectedCycle) {
      setIsEditingCycle(false);
      setPlanFeedback(null);
      setAiTip(null);
      return;
    }

    setCycleDraft({
      cropName: selectedCycle.cropName,
      startDate: selectedCycle.startDate,
      duration: selectedCycle.duration,
      notes: selectedCycle.notes || "",
      status: selectedCycle.status,
    });
    setPlanFeedback(null);
  }, [selectedCycle]);

  useEffect(() => {
    const hasOverlayOpen = isCreating || Boolean(selectedCycle);
    const previousOverflow = document.body.style.overflow;

    if (hasOverlayOpen) {
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isCreating, selectedCycle]);

  const fetchAiTip = async (cycle: GrowthCycle) => {
    setIsLoadingTip(true);
    try {
      const effectiveStage = getCycleStage(cycle);
      const responseLanguage = language === "ja" ? "tiếng Nhật" : language === "en" ? "tiếng Anh" : "tiếng Việt";
      const tip = await getAIConsultation(
        `Hãy đưa ra 3 lời khuyên ngắn gọn, thực tế bằng ${responseLanguage} để chăm sóc cây ${td(cycle.cropName)} ở giai đoạn ${td(effectiveStage)}. Trình bày ngắn, dễ áp dụng.`
      );
      setAiTip(tip);
    } catch (error) {
      console.error(error);
      setAiTip(tt("aiAdviceError"));
    } finally {
      setIsLoadingTip(false);
    }
  };

  useEffect(() => {
    if (!selectedCycle || !user) return;

    void Promise.all([listGrowthTasks(selectedCycle.id), listGrowthPhotos(selectedCycle.id)])
      .then(([nextTasks, nextPhotos]) => {
        setTasks(nextTasks);
        setPhotos(nextPhotos);
      })
      .catch((error) => {
        console.error("Load growth details failed:", error);
        setPlanFeedback(errorText(error));
      });

    void fetchAiTip(selectedCycle);
  }, [selectedCycle, user, language]);

  const createCycle = async () => {
    const activeUser = user;
    const rawCropName = newCycle.cropName.trim();
    const matchedTemplate = findCropTemplate(rawCropName, cropTemplates);
    const effectiveCropName = matchedTemplate?.cropName || rawCropName;
    const effectiveDuration = getSafeCycleDuration(
      matchedTemplate && (newCycle.duration === DEFAULT_CUSTOM_CYCLE_DURATION || !Number.isFinite(newCycle.duration))
        ? matchedTemplate.duration
        : newCycle.duration
    );
    const effectiveStartDate = getSafeStartDate(newCycle.startDate);
    const effectiveNotes = newCycle.notes.trim() || matchedTemplate?.notes || buildCustomCycleNote(effectiveCropName);

    if (!activeUser) {
      setCreateCycleFeedback(tt("loginBeforeCreate"));
      void onLogin();
      return;
    }
    if (!rawCropName) {
      setCreateCycleFeedback(tt("missingCropName"));
      return;
    }
    if (!newCycle.startDate || Number.isNaN(new Date(newCycle.startDate).getTime())) {
      setCreateCycleFeedback(tt("missingStartDate"));
      return;
    }
    if (!Number.isFinite(newCycle.duration) || newCycle.duration < MIN_CYCLE_DURATION || newCycle.duration > MAX_CYCLE_DURATION) {
      setCreateCycleFeedback(formatTemplate("invalidDurationRange", { min: MIN_CYCLE_DURATION, max: MAX_CYCLE_DURATION }));
      return;
    }
    if (newCycle.autoCreateTasks && selectedNewCycleTaskKeys.length === 0) {
      setCreateCycleFeedback(tt("validationTasks"));
      return;
    }
    setIsCreatingCycle(true);
    setCreateCycleFeedback(null);
    try {
      const createdCycle = await createGrowthCycle({
        userId: activeUser.uid,
        cropName: effectiveCropName,
        startDate: effectiveStartDate,
        duration: effectiveDuration,
        notes: effectiveNotes,
        currentStage: newCycle.currentStage,
        status: "active",
      });

      if (newCycle.autoCreateTasks) {
        try {
          const generatedTasks = buildReminderTasksFromTimeline({
            cycleId: createdCycle.id,
            userId: activeUser.uid,
            startDate: effectiveStartDate,
            duration: effectiveDuration,
            selectedTaskKeys: selectedNewCycleTaskKeys,
          });
          await createGrowthTasks(generatedTasks);
          setCreateCycleFeedback(
            matchedTemplate
              ? formatTemplate("createdWithTemplateTasks", { crop: effectiveCropName, tasks: generatedTasks.length })
              : formatTemplate("createdManualTasks", { tasks: generatedTasks.length })
          );
        } catch (taskError) {
          console.error(taskError);
          setCreateCycleFeedback(tt("createdTaskWarning"));
        }
      } else {
        setCreateCycleFeedback(
          matchedTemplate
            ? formatTemplate("createdWithTemplate", { crop: effectiveCropName })
            : tt("createdManual")
        );
      }

      await refreshCycles(createdCycle.id);
      await refreshSelectedCycleDetails(createdCycle.id);
      setIsCreating(false);
      setNewCycle({
        cropName: "",
        startDate: new Date().toISOString().split("T")[0],
        duration: DEFAULT_CUSTOM_CYCLE_DURATION,
        notes: "",
        currentStage: "Gieo trồng",
        status: "active",
        autoCreateTasks: true,
      });
      setSelectedNewCycleTaskKeys(getDefaultSelectedTaskKeys());
    } catch (err) {
      console.error(err);
      setCreateCycleFeedback(errorText(err));
    } finally {
      setIsCreatingCycle(false);
    }
  };

  const handleCreateCycle = async (e: React.FormEvent) => {
    e.preventDefault();
    await createCycle();
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedCycle) return;
    try {
      await createGrowthTask({
        cycleId: selectedCycle.id,
        userId: user.uid,
        title: newTask.title,
        dueDate: newTask.dueDate,
        type: newTask.type,
      });
      setNewTask({
        title: "",
        dueDate: new Date().toISOString().split("T")[0],
        type: "check",
      });
      await updateGrowthCycle(selectedCycle.id, { progress: createCycleProgress(selectedCycle) });
      await refreshSelectedCycleDetails(selectedCycle.id);
      await refreshCycles(selectedCycle.id);
    } catch (err) {
      setPlanFeedback(errorText(err));
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await deleteGrowthTask(taskId);
      if (selectedCycle) {
        await refreshSelectedCycleDetails(selectedCycle.id);
        await refreshCycles(selectedCycle.id);
      }
    } catch (err) {
      setPlanFeedback(errorText(err));
    }
  };

  const handleUpdateCycle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCycle) return;
    try {
      await updateGrowthCycle(selectedCycle.id, {
        cropName: cycleDraft.cropName,
        startDate: cycleDraft.startDate,
        duration: cycleDraft.duration,
        currentStage:
          cycleDraft.status === "harvested"
            ? "Thu hoạch"
            : getCycleStage({
                startDate: cycleDraft.startDate,
                duration: cycleDraft.duration,
                currentStage: selectedCycle.currentStage,
                status: cycleDraft.status,
              }),
        notes: cycleDraft.notes,
        status: cycleDraft.status,
        progress: createCycleProgress({
          startDate: cycleDraft.startDate,
          duration: cycleDraft.duration,
        } as Pick<GrowthCycle, "startDate" | "duration">),
      });
      await refreshCycles(selectedCycle.id);
      setIsEditingCycle(false);
    } catch (err) {
      setPlanFeedback(errorText(err));
    }
  };

  const handleAddPhoto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedCycle) return;
    try {
      await createGrowthPhoto({
        cycleId: selectedCycle.id,
        userId: user.uid,
        url: newPhoto.url,
        date: newPhoto.date,
        note: newPhoto.note,
      });
      setNewPhoto({
        url: "",
        date: new Date().toISOString().split("T")[0],
        note: "",
      });
      await updateGrowthCycle(selectedCycle.id, { progress: createCycleProgress(selectedCycle) });
      await refreshSelectedCycleDetails(selectedCycle.id);
      await refreshCycles(selectedCycle.id);
    } catch (err) {
      setPlanFeedback(errorText(err));
    }
  };

  const handleDeletePhoto = async (photoId: string) => {
    try {
      await deleteGrowthPhoto(photoId);
      if (selectedCycle) {
        await refreshSelectedCycleDetails(selectedCycle.id);
        await refreshCycles(selectedCycle.id);
      }
    } catch (err) {
      setPlanFeedback(errorText(err));
    }
  };

  const handleDeleteCycle = async () => {
    if (!selectedCycle) return;
    const confirmed = window.confirm(formatTemplate("confirmDeleteCycle", { crop: selectedCycle.cropName }));
    if (!confirmed) return;

    try {
      await deleteGrowthCycle(selectedCycle.id);
      await refreshCycles();
      setSelectedCycle(null);
      setTasks([]);
      setPhotos([]);
    } catch (err) {
      setPlanFeedback(errorText(err));
    }
  };

  const toggleTask = async (task: GrowthTask) => {
    try {
      await updateGrowthTask(task.id, { completed: !task.completed });
      if (selectedCycle) {
        await updateGrowthCycle(selectedCycle.id, { progress: createCycleProgress(selectedCycle) });
        await refreshSelectedCycleDetails(selectedCycle.id);
        await refreshCycles(selectedCycle.id);
      }
    } catch (err) {
      setPlanFeedback(errorText(err));
    }
  };

  const seedStageTasks = async (mode: "template" | "ai") => {
    if (!selectedCycle || !user) return;
    setPlanFeedback(null);
    try {
      setIsGeneratingPlan(true);
      const today = new Date();
      const effectiveStage = getCycleStage(selectedCycle);
      let suggestions = stageTaskTemplates[effectiveStage];

      if (mode === "ai") {
        const aiText = await getAIConsultation(
          [
            `Hãy lập 4 công việc ngắn gọn cho cây ${selectedCycle.cropName} ở giai đoạn ${effectiveStage}.`,
            `Thông tin chu kỳ: bắt đầu ${selectedCycle.startDate}, thời lượng ${selectedCycle.duration} ngày.`,
            `Ghi chú hiện có: ${selectedCycle.notes || "chưa có ghi chú"}.`,
            "Chỉ trả về tối đa 4 dòng theo đúng định dạng:",
            "Tên công việc | water hoặc fertilize hoặc check hoặc other | số ngày từ hôm nay",
          ].join("\n")
        );

        const parsed = parseAiTaskSuggestions(aiText);
        if (parsed.length > 0) {
          suggestions = parsed;
        }
      }

      const existingTitles = new Set(tasks.map((task) => task.title.trim().toLowerCase()));
      const newSuggestions = suggestions.filter((task) => !existingTitles.has(task.title.trim().toLowerCase()));

      if (newSuggestions.length === 0) {
        setPlanFeedback(tt("duplicateSuggestions"));
        return;
      }

      await createGrowthTasks(
        newSuggestions.map((task) => ({
          cycleId: selectedCycle.id,
          userId: user.uid,
          title: task.title,
          dueDate: toDateInputValue(addDaysToDate(today, task.offsetDays)),
          type: task.type,
        }))
      );
      await updateGrowthCycle(selectedCycle.id, { progress: createCycleProgress(selectedCycle) });
      await refreshSelectedCycleDetails(selectedCycle.id);
      await refreshCycles(selectedCycle.id);
      setPlanFeedback(
        mode === "ai"
          ? formatTemplate("aiTasksCreated", { count: newSuggestions.length })
          : formatTemplate("templateTasksLoaded", { count: newSuggestions.length })
      );
    } catch (err) {
      setPlanFeedback(errorText(err));
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  const calculateProgress = (cycle: GrowthCycle) => {
    const start = new Date(cycle.startDate).getTime();
    const now = new Date().getTime();
    const elapsed = Math.max(0, Math.floor((now - start) / (1000 * 60 * 60 * 24)));
    const duration = getSafeCycleDuration(cycle.duration);
    const percent = Math.min(100, Math.floor((elapsed / duration) * 100));
    const remaining = Math.max(0, duration - elapsed);
    return { elapsed, percent, remaining };
  };

  const stats = useMemo(() => {
    const activeCycles = cycles.filter((cycle) => cycle.status === "active");
    const harvestingCycles = cycles.filter((cycle) => getCycleStage(cycle) === "Thu hoạch");
    const avgProgress = cycles.length
      ? Math.round(cycles.reduce((sum, cycle) => sum + calculateProgress(cycle).percent, 0) / cycles.length)
      : 0;

    return [
      { label: tt("trackingCycles"), value: activeCycles.length, icon: Sprout },
      { label: tt("harvestSoonCycles"), value: harvestingCycles.length, icon: SunMedium },
      { label: tt("averageProgress"), value: `${avgProgress}%`, icon: LineChart },
    ];
  }, [cycles, language]);

  const newCycleSafeDuration = getSafeCycleDuration(newCycle.duration);
  const newCycleSafeStartDate = getSafeStartDate(newCycle.startDate);
  const newCycleStageTimeline = useMemo(
    () => buildStageTimeline(newCycleSafeStartDate, newCycleSafeDuration),
    [newCycleSafeDuration, newCycleSafeStartDate]
  );
  const newCycleReminderPreview = useMemo(
    () =>
      buildReminderTasksFromTimeline({
        cycleId: "preview",
        userId: user?.uid || "preview",
        startDate: newCycleSafeStartDate,
        duration: newCycleSafeDuration,
        selectedTaskKeys: selectedNewCycleTaskKeys,
      }),
    [newCycleSafeDuration, newCycleSafeStartDate, selectedNewCycleTaskKeys, user?.uid]
  );
  const matchedNewCycleTemplate = useMemo(
    () => findCropTemplate(newCycle.cropName, cropTemplates, { fuzzy: false }),
    [cropTemplates, newCycle.cropName]
  );
  const newCycleEffectiveNotes = newCycle.notes.trim() || matchedNewCycleTemplate?.notes || (newCycle.cropName.trim() ? buildCustomCycleNote(newCycle.cropName.trim()) : "");
  const newCycleValidationMessage =
    !newCycle.cropName.trim()
      ? tt("validationCropName")
      : !newCycle.startDate || Number.isNaN(new Date(newCycle.startDate).getTime())
        ? tt("validationStartDate")
        : !Number.isFinite(newCycle.duration) || newCycle.duration < MIN_CYCLE_DURATION || newCycle.duration > MAX_CYCLE_DURATION
          ? formatTemplate("validationDuration", { min: MIN_CYCLE_DURATION, max: MAX_CYCLE_DURATION })
          : newCycle.autoCreateTasks && selectedNewCycleTaskKeys.length === 0
            ? tt("validationTasks")
          : null;
  const newCycleEndDate = newCycleStageTimeline[newCycleStageTimeline.length - 1]?.endDate ?? newCycleSafeStartDate;
  const selectedNewCycleTaskKeySet = new Set(selectedNewCycleTaskKeys);
  const selectedNewCycleStageCount = STAGES.filter((stage) =>
    stageTaskTemplates[stage].some((_template, index) => selectedNewCycleTaskKeySet.has(getStageTaskKey(stage, index)))
  ).length;

  const selectedStageTimeline = selectedCycle ? buildStageTimeline(selectedCycle.startDate, selectedCycle.duration) : [];
  const selectedDerivedStage = selectedCycle ? getCycleStage(selectedCycle) : null;
  const selectedProgress = selectedCycle ? calculateProgress(selectedCycle) : null;
  const selectedStageGuide = selectedDerivedStage ? stageContent[selectedDerivedStage] : null;
  const completedTasks = tasks.filter((task) => task.completed).length;
  const upcomingTasks = [...tasks]
    .filter((task) => !task.completed)
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 3);
  const alertTasks = [...tasks]
    .filter((task) => !task.completed && getDaysUntil(task.dueDate) <= 2)
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 4);
  const overdueTasks = tasks.filter((task) => !task.completed && getDaysUntil(task.dueDate) < 0).length;
  const filteredTasks = tasks
    .slice()
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .filter((task) => {
      if (taskFilter === "open") return !task.completed;
      if (taskFilter === "done") return task.completed;
      if (taskFilter === "overdue") return !task.completed && getDaysUntil(task.dueDate) < 0;
      return true;
    });
  const latestPhoto = photos
    .slice()
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
  const aiHighlights = parseAiTips(aiTip);
  const cycleHealthScore = selectedCycle
    ? Math.max(
        35,
        Math.min(
          99,
          Math.round(
            selectedProgress!.percent * 0.45 +
              (tasks.length ? (completedTasks / tasks.length) * 35 : 22) +
              (photos.length ? 12 : 0) -
              overdueTasks * 6
          )
        )
      )
    : 76;
  const operationalSignals = selectedCycle
    ? [
        {
          label: tt("aiSignal"),
          value: aiHighlights.length > 0 ? tt("updated") : tt("waiting"),
          note: tt("aiSignalNote"),
          tone: "text-emerald-400 border-emerald-500/20 bg-emerald-500/10",
        },
        {
          label: tt("executionRhythm"),
          value: formatTemplate("completedTasksValue", { done: completedTasks, total: tasks.length || 0 }),
          note: overdueTasks > 0 ? formatTemplate("overdueTaskNote", { count: overdueTasks }) : tt("noOverdueTaskNote"),
          tone: overdueTasks > 0 ? "text-orange-400 border-orange-500/20 bg-orange-500/10" : "text-sky-400 border-sky-500/20 bg-sky-500/10",
        },
        {
          label: tt("fieldPhotoSignal"),
          value: latestPhoto ? new Date(latestPhoto.date).toLocaleDateString(locale) : tt("noData"),
          note: latestPhoto ? tt("photoSignalNote") : tt("noPhotoSignalNote"),
          tone: "text-violet-400 border-violet-500/20 bg-violet-500/10",
        },
      ]
    : [];
  const taskCompletionRate = tasks.length ? Math.round((completedTasks / tasks.length) * 100) : 0;
  const taskTypeCounts = Object.entries(localizedTaskTypeMeta).map(([type, meta]) => ({
    type,
    label: meta.label,
    count: tasks.filter((task) => task.type === type).length,
  }));
  const activityFeed = [
    ...tasks.map((task) => ({
      id: `task-${task.id}`,
      date: task.dueDate,
      title: `${task.completed ? tt("taskDonePrefix") : tt("taskSchedulePrefix")}: ${td(task.title)}`,
      note: `${localizedTaskTypeMeta[task.type].label} • ${task.completed ? tt("completed") : dueLabel(task.dueDate)}`,
    })),
    ...photos.map((photo) => ({
      id: `photo-${photo.id}`,
      date: photo.date,
      title: tt("photoUpdated"),
      note: td(photo.note) || tt("photoAddedNote"),
    })),
  ]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 6);

  return (
    <div className="min-h-screen bg-zinc-950 pt-32 pb-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-16 grid gap-8 lg:grid-cols-[1.4fr_0.9fr]">
          <div className="tech-grid relative overflow-hidden rounded-[48px] border border-emerald-500/20 bg-gradient-to-br from-emerald-500/18 via-emerald-500/5 to-black p-10">
            <div className="absolute right-0 top-0 h-56 w-56 rounded-full bg-emerald-400/10 blur-3xl" />
            <div className="absolute bottom-0 left-10 h-40 w-40 rounded-full bg-sky-400/10 blur-3xl" />
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-emerald-400">
              <Cpu className="h-3 w-3" /> AI Growth Operations
            </div>
            <h2 className="mt-6 text-5xl font-black tracking-tighter text-white md:text-6xl">
              {tt("titleA")}
              <br />
              <span className="text-gradient-ai">{tt("titleB")}</span>
            </h2>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/55">
              {tt("intro")}
            </p>

            <div className="mt-10 flex flex-wrap gap-4">
              <button
                onClick={() => {
                  setCreateCycleFeedback(null);
                  setSelectedNewCycleTaskKeys(getDefaultSelectedTaskKeys());
                  setIsCreating(true);
                }}
                className="flex items-center gap-3 rounded-2xl bg-emerald-600 px-8 py-5 font-bold text-white shadow-2xl shadow-emerald-600/20 transition-all hover:bg-emerald-500"
              >
                <Plus className="h-6 w-6" /> {tt("createCycle")}
              </button>
              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/30 px-6 py-5 text-sm text-white/60">
                <Calendar className="h-5 w-5 text-emerald-500" />
                {tt("heroNote")}
              </div>
            </div>

            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {[
                { label: tt("openCycles"), value: stats[0].value, note: tt("continuous") },
                { label: tt("aiReadiness"), value: `${Math.min(99, 62 + photos.length * 6 + upcomingTasks.length * 3)}%`, note: tt("basedInput") },
                { label: tt("fieldLogs"), value: photos.length, note: tt("photoNotes") },
              ].map((item) => (
                <div key={item.label} className="rounded-[28px] border border-white/8 bg-black/25 p-5 backdrop-blur-xl">
                  <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-white/30">{item.label}</p>
                  <p className="mt-3 text-3xl font-black text-white">{item.value}</p>
                  <p className="mt-2 text-sm text-white/45">{item.note}</p>
                </div>
              ))}
            </div>

            <div className="group relative mt-10 min-h-[300px] overflow-hidden rounded-[36px] border border-white/10 bg-black/35 shadow-2xl shadow-black/30 md:min-h-[360px]">
              <video
                src={growthHeroVideo}
                className="h-full min-h-[300px] w-full object-cover opacity-90 transition duration-700 group-hover:scale-105 group-hover:opacity-100 md:min-h-[360px]"
                autoPlay
                muted
                loop
                playsInline
                aria-label="Video minh họa quá trình sinh trưởng cây trồng"
              />
              <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.02),rgba(0,0,0,0.46)),radial-gradient(circle_at_top_left,rgba(16,185,129,0.18),transparent_36%)]" />
            </div>
          </div>

          <div className="grid gap-5">
            <div className="relative min-h-[440px] overflow-hidden rounded-[40px] border border-white/8 bg-zinc-900 p-4">
              <img
                src={growthVisuals[0].src}
                alt={growthVisuals[0].title}
                className="h-[300px] w-full rounded-[30px] object-cover"
              />
              <div className="mt-4 grid grid-cols-2 gap-4">
                {growthVisuals.slice(1).map((visual) => (
                  <img
                    key={visual.title}
                    src={visual.src}
                    alt={visual.title}
                    className="h-36 w-full rounded-[24px] object-cover"
                  />
                ))}
              </div>
              <div className="absolute bottom-6 left-6 right-6 rounded-[28px] border border-white/10 bg-black/55 p-5 backdrop-blur-xl">
                <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-emerald-300">Visual Growth Log</p>
                <h3 className="mt-2 text-2xl font-black tracking-tight text-white">{tt("fieldImagesTitle")}</h3>
                <p className="mt-2 text-sm leading-6 text-white/60">
                  {tt("fieldImagesDesc")}
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
              {stats.map((stat) => {
                const Icon = stat.icon;
                return (
                  <div key={stat.label} className="rounded-[28px] border border-white/5 bg-zinc-900 p-6">
                    <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-white/5">
                      <Icon className="h-5 w-5 text-emerald-500" />
                    </div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/30">{stat.label}</p>
                    <p className="mt-2 text-3xl font-black tracking-tight text-white">{stat.value}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {!user && (
          <div className="mb-10 rounded-[32px] border border-amber-500/20 bg-amber-500/10 p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-amber-300">{tt("loginNeeded")}</p>
                <p className="mt-2 text-base text-white/80">
                  {tt("loginDesc")}
                </p>
              </div>
              <button
                onClick={() => void handleInlineLogin()}
                className="rounded-2xl bg-amber-400 px-5 py-3 text-sm font-bold text-slate-950 transition-all hover:bg-amber-300"
              >
                {tt("loginCreate")}
              </button>
            </div>
          </div>
        )}

        <div className="mb-16 rounded-[40px] border border-white/5 bg-zinc-900 p-8">
          <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-white/30">{tt("stageFramework")}</p>
              <h3 className="mt-3 text-3xl font-black tracking-tight text-white">{tt("seasonPage")}</h3>
            </div>
            <p className="max-w-2xl text-sm leading-relaxed text-white/45">
              {tt("stageDesc")}
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-4">
            {STAGES.map((stage, index) => (
              <div key={stage} className="rounded-[28px] border border-white/5 bg-black/30 p-6">
                <div className="mb-5 flex items-center justify-between">
                  <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-emerald-400">
                    {tt("stage")} {index + 1}
                  </span>
                  <ChevronRight className="h-4 w-4 text-white/15" />
                </div>
                <h4 className="text-xl font-bold text-white">{td(stage)}</h4>
                <p className="mt-3 text-sm leading-relaxed text-white/45">{td(stageContent[stage].summary)}</p>
                <div className="mt-6 space-y-3">
                  {stageContent[stage].focus.slice(0, 2).map((item) => (
                    <div key={item} className="flex items-start gap-3 text-sm leading-relaxed text-white/70">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                      {td(item)}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {cycles.length > 0 ? (
          <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
            {cycles.map((cycle) => {
              const { elapsed, percent, remaining } = calculateProgress(cycle);
              const effectiveStage = getCycleStage(cycle);
              const guide = stageContent[effectiveStage];
              return (
                <div
                  key={cycle.id}
                  onClick={() => setSelectedCycle(cycle)}
                  className="group cursor-pointer rounded-[40px] border border-white/5 bg-zinc-900 p-8 transition-all hover:border-emerald-500/30"
                >
                  <div className="mb-8 flex items-center justify-between">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 transition-transform group-hover:scale-110">
                      <Sprout className="h-7 w-7 text-emerald-500" />
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span
                        className={`rounded-full border px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest ${
                          effectiveStage === "Thu hoạch"
                            ? "border-orange-500/20 bg-orange-500/10 text-orange-400"
                            : "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                        }`}
                      >
                        {td(effectiveStage)}
                      </span>
                      <span className={`rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-widest ${localizedStatusMeta[cycle.status].tone}`}>
                        {localizedStatusMeta[cycle.status].label}
                      </span>
                    </div>
                  </div>

                  <h3 className="text-2xl font-bold text-white">{td(cycle.cropName)}</h3>
                  <p className="mt-3 min-h-[44px] text-sm leading-relaxed text-white/45">{td(guide.label)}</p>

                  <div className="mt-8 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white/30">
                    <Calendar className="h-4 w-4" /> {tt("start")}: {new Date(cycle.startDate).toLocaleDateString(locale)}
                  </div>

                  <div className="mt-8">
                    <div className="mb-2 flex justify-between text-sm">
                      <span className="text-white/40">
                        {elapsed}/{cycle.duration} {tt("days")}
                      </span>
                      <span className="font-bold text-emerald-500">{percent}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-white/5">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${percent}%` }} className="h-full bg-emerald-500" />
                    </div>
                  </div>

                  <div className="mt-8 grid grid-cols-2 gap-4">
                    <div className="rounded-2xl border border-white/5 bg-black/30 p-4">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">{tt("remaining")}</p>
                      <p className="mt-2 text-xl font-bold text-white">{remaining} {tt("days")}</p>
                    </div>
                    <div className="rounded-2xl border border-white/5 bg-black/30 p-4">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">{tt("notes")}</p>
                      <p className="mt-2 line-clamp-2 text-sm text-white/60">{cycle.notes || tt("noNotes")}</p>
                    </div>
                  </div>

                  <div className="mt-8 flex items-center justify-between border-t border-white/5 pt-8">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white/30">
                      <Leaf className="h-4 w-4 text-emerald-500" /> {td(guide.focus[0])}
                    </div>
                    <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-emerald-500 transition-transform group-hover:translate-x-1">
                      {tt("details")} <ArrowRight className="h-4 w-4" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-[48px] border border-dashed border-white/10 bg-zinc-900/60 p-10">
            <div className="mb-10 max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-400">{tt("quickCreate")}</p>
              <h3 className="mt-4 text-4xl font-black tracking-tight text-white">{tt("readyStart")}</h3>
              <p className="mt-4 text-white/45">
                {tt("quickDesc")}
              </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              {cropTemplates.map((template) => (
                <button
                  key={template.cropName}
                  onClick={() => {
                    setCreateCycleFeedback(null);
                    setNewCycle({
                      cropName: template.cropName,
                      duration: template.duration,
                      notes: template.notes,
                      startDate: new Date().toISOString().split("T")[0],
                      currentStage: "Gieo trồng",
                      status: "active",
                      autoCreateTasks: true,
                    });
                    setSelectedNewCycleTaskKeys(getDefaultSelectedTaskKeys());
                    setIsCreating(true);
                  }}
                  className="rounded-[32px] border border-white/5 bg-black/30 p-8 text-left transition-all hover:border-emerald-500/30 hover:bg-emerald-500/5"
                >
                  <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10">
                    <Sprout className="h-7 w-7 text-emerald-500" />
                  </div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-300">
                    {template.source === "database" ? tt("fromDatabase") : template.source === "fallback" ? tt("fromCatalog") : tt("quickTemplate")}
                  </p>
                  <h4 className="text-2xl font-bold text-white">{td(template.cropName)}</h4>
                  <p className="mt-3 text-sm uppercase tracking-widest text-white/30">{tt("expectedCycle")} {template.duration} {tt("days")}</p>
                  <p className="mt-5 text-sm leading-relaxed text-white/50">{td(template.notes)}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        <AnimatePresence>
          {isCreating && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[200] flex min-h-screen items-center justify-center overflow-y-auto bg-black/90 p-4 backdrop-blur-xl md:p-6"
            >
              <motion.div
                initial={{ scale: 0.94, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                className="my-auto max-h-[calc(100vh-3rem)] w-full max-w-7xl overflow-y-auto rounded-[32px] border border-white/10 bg-[#111714] p-5 shadow-3xl md:p-7"
              >
                <div className="mb-7 flex items-start justify-between gap-5">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-400">{tt("setupCycle")}</p>
                    <h3 className="mt-3 text-3xl font-black tracking-tight text-white">{tt("createNew")}</h3>
                    <p className="mt-3 max-w-2xl text-sm leading-6 text-white/50">
                      {tt("setupDesc")}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setCreateCycleFeedback(null);
                      setIsCreating(false);
                    }}
                    className="shrink-0 rounded-2xl bg-white/5 p-3 text-white transition-all hover:bg-red-500"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {createCycleFeedback && (
                  <div className="mb-5 rounded-2xl border border-white/10 bg-black/30 px-5 py-4 text-sm text-white/80">
                    {createCycleFeedback}
                  </div>
                )}

                <form onSubmit={handleCreateCycle} className="grid gap-6 lg:grid-cols-[minmax(0,0.92fr)_minmax(420px,1.08fr)]">
                  <section className="space-y-5">
                    <div className="relative overflow-hidden rounded-[28px] border border-white/8 bg-black/25">
                      <img
                        src={growthVisuals[2].src}
                        alt={tt("createNew")}
                        className="h-44 w-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                      <div className="absolute bottom-4 left-4 right-4">
                        <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-emerald-200">Growth setup</p>
                        <p className="mt-1 text-xl font-black tracking-tight text-white">{tt("createCycle")}</p>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-emerald-500/15 bg-emerald-500/5 px-5 py-4 text-sm text-white/75">
                      {isLoadingCropCatalog
                        ? tt("loadingCatalog")
                        : matchedNewCycleTemplate
                          ? `${tt("matchedTemplate")}: ${td(matchedNewCycleTemplate.cropName)} • ${matchedNewCycleTemplate.duration} ${tt("days")}.`
                          : tt("manualCycle")}
                    </div>

                    <div>
                      <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-white/35">{tt("cropName")}</label>
                      <input
                        required
                        type="text"
                        placeholder={tt("cropPlaceholder")}
                        className="w-full rounded-2xl border border-white/10 bg-black/40 px-5 py-4 text-white outline-none transition-all placeholder:text-white/25 focus:border-emerald-500"
                        value={newCycle.cropName}
                        onChange={(e) => handleNewCycleCropNameChange(e.target.value)}
                      />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-white/35">{tt("startDate")}</label>
                        <input
                          required
                          type="date"
                          className="w-full rounded-2xl border border-white/10 bg-black/40 px-5 py-4 text-white outline-none transition-all focus:border-emerald-500"
                          value={newCycle.startDate}
                          onChange={(e) => setNewCycle({ ...newCycle, startDate: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-white/35">{tt("duration")}</label>
                        <div className="flex overflow-hidden rounded-2xl border border-white/10 bg-black/40 focus-within:border-emerald-500">
                          <input
                            required
                            min={MIN_CYCLE_DURATION}
                            max={MAX_CYCLE_DURATION}
                            type="number"
                            className="min-w-0 flex-1 bg-transparent px-5 py-4 text-white outline-none"
                            value={newCycle.duration}
                            onChange={(e) => setNewCycle({ ...newCycle, duration: Number(e.target.value) })}
                          />
                          <span className="flex items-center border-l border-white/10 px-4 text-sm font-bold text-white/45">{tt("days")}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-white/35">{tt("currentStage")}</p>
                          <p className="mt-1 text-xs text-white/40">{tt("currentStageDesc")}</p>
                        </div>
                        <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-emerald-200">
                          {td(newCycle.currentStage)}
                        </span>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {STAGES.map((stage) => {
                          const selected = newCycle.currentStage === stage;
                          return (
                            <button
                              key={stage}
                              type="button"
                              onClick={() => setNewCycle({ ...newCycle, currentStage: stage })}
                              className={`rounded-2xl border p-4 text-left transition ${
                                selected
                                  ? "border-emerald-500/40 bg-emerald-500/12 text-white"
                                  : "border-white/8 bg-black/25 text-white/55 hover:border-white/18 hover:text-white"
                              }`}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="font-bold">{td(stage)}</p>
                                  <p className="mt-1 line-clamp-2 text-xs leading-5 text-white/45">{td(stageContent[stage].summary)}</p>
                                </div>
                                {selected ? <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-300" /> : <Square className="h-5 w-5 shrink-0 text-white/20" />}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-white/35">{tt("quickTemplates")}</p>
                        <p className="text-xs text-white/35">{cropTemplates.length} {tt("configs")}</p>
                      </div>
                      <div className="grid max-h-[260px] gap-3 overflow-y-auto pr-1 sm:grid-cols-2">
                        {cropTemplates.map((template) => (
                          <button
                            key={template.cropName}
                            type="button"
                            onClick={() => applyTemplateToNewCycle(template)}
                            className={`rounded-2xl border p-4 text-left transition-all ${
                              newCycle.cropName === template.cropName
                                ? "border-emerald-500/35 bg-emerald-500/10"
                                : "border-white/6 bg-black/25 hover:border-white/16"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-sm font-bold text-white">{td(template.cropName)}</p>
                                <p className="mt-1 text-xs text-white/40">{template.duration} {tt("days")}</p>
                              </div>
                              <span className="rounded-full border border-white/10 px-2 py-1 text-[9px] font-bold uppercase tracking-widest text-white/35">
                                {template.source === "database" ? tt("fromDatabase") : template.source === "fallback" ? tt("fromCatalog") : tt("quickTemplate")}
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-white/35">{tt("startNotes")}</label>
                      <textarea
                        placeholder={tt("notePlaceholder")}
                        rows={4}
                        className="w-full resize-none rounded-2xl border border-white/10 bg-black/40 px-5 py-4 text-white outline-none transition-all placeholder:text-white/25 focus:border-emerald-500"
                        value={newCycle.notes}
                        onChange={(e) => setNewCycle({ ...newCycle, notes: e.target.value })}
                      />
                      {!newCycle.notes.trim() && newCycleEffectiveNotes ? (
                        <p className="mt-2 text-xs leading-6 text-white/40">{tt("suggestedNote")}: {td(newCycleEffectiveNotes)}</p>
                      ) : null}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const nextAutoCreateTasks = !newCycle.autoCreateTasks;
                        setNewCycle({ ...newCycle, autoCreateTasks: nextAutoCreateTasks });
                        if (nextAutoCreateTasks && selectedNewCycleTaskKeys.length === 0) {
                          setSelectedNewCycleTaskKeys(getDefaultSelectedTaskKeys());
                        }
                      }}
                      className={`flex w-full items-center justify-between gap-4 rounded-2xl border px-5 py-4 text-left transition-all ${
                        newCycle.autoCreateTasks
                          ? "border-emerald-500/25 bg-emerald-500/10"
                          : "border-white/10 bg-black/30"
                      }`}
                    >
                      <span>
                        <span className="block text-sm font-bold text-white">{tt("autoChecklist")}</span>
                        <span className="mt-1 block text-xs leading-5 text-white/45">
                          {newCycle.autoCreateTasks
                            ? formatTemplate("autoChecklistOn", { options: selectedNewCycleTaskKeys.length, stages: selectedNewCycleStageCount, tasks: newCycleReminderPreview.length })
                            : tt("autoChecklistOff")}
                        </span>
                      </span>
                      <span className={`h-6 w-11 rounded-full p-1 transition-all ${newCycle.autoCreateTasks ? "bg-emerald-500" : "bg-white/10"}`}>
                        <span className={`block h-4 w-4 rounded-full bg-white transition-transform ${newCycle.autoCreateTasks ? "translate-x-5" : ""}`} />
                      </span>
                    </button>
                  </section>

                  <aside className="space-y-5 rounded-[28px] border border-white/8 bg-black/25 p-5">
                    <div className="grid grid-cols-[1.15fr_0.85fr] gap-3">
                      <img src={growthVisuals[0].src} alt={growthVisuals[0].title} className="h-32 w-full rounded-2xl object-cover" />
                      <img src={growthVisuals[1].src} alt={growthVisuals[1].title} className="h-32 w-full rounded-2xl object-cover" />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">{tt("crop")}</p>
                        <p className="mt-2 truncate font-bold text-white">{td(newCycle.cropName.trim()) || tt("noInput")}</p>
                      </div>
                      <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">{tt("expectedEnd")}</p>
                        <p className="mt-2 font-bold text-white">{new Date(newCycleEndDate).toLocaleDateString(locale)}</p>
                      </div>
                      <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">{tt("currentStageShort")}</p>
                        <p className="mt-2 font-bold text-white">{td(newCycle.currentStage)}</p>
                      </div>
                      <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">Checklist</p>
                        <p className="mt-2 font-bold text-white">{newCycle.autoCreateTasks ? `${newCycleReminderPreview.length} ${tt("tasks")}` : tt("off")}</p>
                      </div>
                    </div>

                    <div className={`rounded-[24px] border border-white/8 bg-[#0b0f0d] p-4 ${newCycle.autoCreateTasks ? "" : "opacity-45"}`}>
                      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-300">{tt("chooseStageOptions")}</p>
                          <p className="mt-1 text-xs text-white/45">{tt("chooseStageOptionsDesc")}</p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            disabled={!newCycle.autoCreateTasks}
                            onClick={() => setSelectedNewCycleTaskKeys(getDefaultSelectedTaskKeys())}
                            className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-emerald-200 disabled:cursor-not-allowed"
                          >
                            {tt("selectAll")}
                          </button>
                          <button
                            type="button"
                            disabled={!newCycle.autoCreateTasks}
                            onClick={() => setSelectedNewCycleTaskKeys([])}
                            className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-white/45 disabled:cursor-not-allowed"
                          >
                            {tt("clearAll")}
                          </button>
                        </div>
                      </div>

                      <div className="max-h-[360px] space-y-4 overflow-y-auto pr-1">
                        {STAGES.map((stage) => {
                          const stageKeys = stageTaskTemplates[stage].map((_template, index) => getStageTaskKey(stage, index));
                          const selectedInStage = stageKeys.filter((key) => selectedNewCycleTaskKeySet.has(key)).length;
                          const allStageSelected = selectedInStage === stageKeys.length;

                          return (
                            <div key={stage} className="rounded-2xl border border-white/8 bg-white/[0.03] p-3">
                              <div className="mb-3 flex items-center justify-between gap-3">
                                <div>
                                  <p className="font-bold text-white">{td(stage)}</p>
                                  <p className="mt-0.5 text-[11px] text-white/40">{formatTemplate("optionsSelected", { selected: selectedInStage, total: stageKeys.length })}</p>
                                </div>
                                <button
                                  type="button"
                                  disabled={!newCycle.autoCreateTasks}
                                  onClick={() => setStageTaskOptions(stage, !allStageSelected)}
                                  className="rounded-full border border-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white/45 transition hover:border-emerald-500/30 hover:text-emerald-200 disabled:cursor-not-allowed"
                                >
                                  {allStageSelected ? tt("removeStage") : tt("addStage")}
                                </button>
                              </div>

                              <div className="grid gap-2">
                                {stageTaskTemplates[stage].map((template, index) => {
                                  const taskKey = getStageTaskKey(stage, index);
                                  const selected = selectedNewCycleTaskKeySet.has(taskKey);
                                  const TypeIcon = taskTypeMeta[template.type].icon;

                                  return (
                                    <button
                                      key={taskKey}
                                      type="button"
                                      disabled={!newCycle.autoCreateTasks}
                                      onClick={() => toggleNewCycleTaskOption(taskKey)}
                                      className={`flex items-start gap-3 rounded-xl border p-3 text-left transition ${
                                        selected
                                          ? "border-emerald-500/35 bg-emerald-500/10 text-white"
                                          : "border-white/8 bg-black/25 text-white/55 hover:border-white/18"
                                      } disabled:cursor-not-allowed`}
                                    >
                                      <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md ${selected ? "text-emerald-300" : "text-white/25"}`}>
                                        {selected ? <CheckCircle2 className="h-4 w-4" /> : <Square className="h-4 w-4" />}
                                      </span>
                                      <span className="min-w-0 flex-1">
                                        <span className="block text-sm font-bold leading-5">{td(template.title)}</span>
                                        <span className="mt-1 inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-white/35">
                                          <TypeIcon className="h-3 w-3" />
                                          {localizedTaskTypeMeta[template.type].label}
                                          {template.repeatEveryDays ? ` • ${formatTemplate("repeatEvery", { days: template.repeatEveryDays })}` : ""}
                                        </span>
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div>
	                      <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-emerald-300">{tt("timeline")}</p>
                      <div className="space-y-3">
                        {newCycleStageTimeline.map((item) => (
                          <button
                            key={item.stage}
                            type="button"
                            onClick={() => setNewCycle({ ...newCycle, currentStage: item.stage })}
                            className={`w-full rounded-2xl border p-4 text-left transition ${
                              newCycle.currentStage === item.stage
                                ? "border-emerald-500/40 bg-emerald-500/10"
                                : "border-white/8 bg-black/25 hover:border-white/16"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-3">
                              <p className="font-bold text-white">{td(item.stage)}</p>
                              <span className="inline-flex items-center gap-2 text-xs font-bold text-emerald-300">
                                {newCycle.currentStage === item.stage ? <CheckCircle2 className="h-4 w-4" /> : null}
                                {item.days} {tt("days")}
                              </span>
                            </div>
                            <p className="mt-1 text-xs leading-5 text-white/45">
	                              {tt("dayRange")} {item.startDay}-{item.endDay} • {new Date(item.startDate).toLocaleDateString(locale)} - {new Date(item.endDate).toLocaleDateString(locale)}
                            </p>
                          </button>
                        ))}
                      </div>
                    </div>

                    {newCycle.autoCreateTasks ? (
                      <div>
	                        <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-white/35">{tt("firstTasks")}</p>
                        <div className="space-y-3">
                          {newCycleReminderPreview.slice(0, 5).map((task) => (
                            <div key={`${task.title}-${task.dueDate}`} className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
                              <p className="text-sm font-bold text-white">{td(task.title)}</p>
                              <p className="mt-1 text-[11px] font-bold uppercase tracking-widest text-white/35">
	                                {localizedTaskTypeMeta[task.type].label} • {new Date(task.dueDate).toLocaleDateString(locale)}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    {newCycleValidationMessage ? (
                      <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
                        {newCycleValidationMessage}
                      </div>
                    ) : null}

                    <button
                      type="submit"
                      disabled={isCreatingCycle || Boolean(newCycleValidationMessage)}
                      className="flex w-full items-center justify-center gap-3 rounded-2xl bg-emerald-600 px-5 py-5 text-base font-black text-white shadow-2xl shadow-emerald-600/20 transition-all hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isCreatingCycle ? (
                        <>
	                          <RefreshCw className="h-5 w-5 animate-spin" /> {tt("creating")}
                        </>
                      ) : (
                        <>
	                          {tt("create")} <ArrowRight className="h-5 w-5" />
                        </>
                      )}
                    </button>
                  </aside>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {selectedCycle && selectedProgress && selectedStageGuide && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[200] overflow-y-auto bg-black/92 p-3 backdrop-blur-2xl sm:p-4 lg:p-6"
            >
              <motion.div
                initial={{ scale: 0.94, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                className="mx-auto my-3 flex min-h-[calc(100vh-1.5rem)] w-full max-w-6xl flex-col overflow-hidden rounded-[28px] border border-emerald-500/10 bg-[#071411] shadow-[0_40px_120px_rgba(0,0,0,0.45)] sm:my-4 sm:min-h-[calc(100vh-2rem)] sm:rounded-[32px] lg:min-h-0 lg:max-h-[calc(100vh-3rem)] lg:rounded-[36px]"
              >
                <div className="shrink-0 border-b border-white/5 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.16),transparent_36%),linear-gradient(180deg,rgba(7,20,17,0.96),rgba(7,20,17,0.84))] px-5 py-5 sm:px-7 sm:py-6 lg:px-8 lg:py-7">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/15 ring-1 ring-emerald-500/15">
                          <Sprout className="h-5 w-5 text-emerald-400" />
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-emerald-400/90 sm:text-xs">{tt("cycleDetails")}</span>
                      </div>

                      <div className="mt-5 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
                        <div className="min-w-0">
                          <h3 className="truncate text-3xl font-black tracking-tighter text-white sm:text-4xl lg:text-5xl">
                            {td(selectedCycle.cropName)}
                          </h3>
                          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-white/55 sm:text-base">
                            {td(selectedCycle.notes) || tt("noCycleNotes")}
                          </p>
                        </div>

                        <div className="grid shrink-0 grid-cols-3 gap-3 xl:w-[430px]">
                          <div className="rounded-[22px] border border-white/6 bg-black/25 px-4 py-3">
                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">{tt("progress")}</p>
                            <p className="mt-2 text-2xl font-black text-white sm:text-3xl">{selectedProgress.percent}%</p>
                          </div>
                          <div className="rounded-[22px] border border-white/6 bg-black/25 px-4 py-3">
                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">{tt("elapsed")}</p>
                            <p className="mt-2 text-2xl font-black text-white sm:text-3xl">{selectedProgress.elapsed}</p>
                          </div>
                          <div className="rounded-[22px] border border-white/6 bg-black/25 px-4 py-3">
                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">{tt("completed")}</p>
                            <p className="mt-2 text-2xl font-black text-white sm:text-3xl">{completedTasks}/{tasks.length}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedCycle(null)}
                      className="shrink-0 rounded-2xl border border-white/8 bg-black/35 p-3 text-white/70 transition-all hover:border-red-500/20 hover:bg-red-500 hover:text-white"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="mt-5 flex flex-wrap items-center gap-3">
                    <span className="rounded-full border border-white/8 bg-black/30 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.22em] text-white/55">
                      {tt("start")}: {new Date(selectedCycle.startDate).toLocaleDateString(locale)}
                    </span>
                    <span className="rounded-full border border-emerald-500/20 bg-emerald-500/14 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.22em] text-emerald-300">
                      {tt("stageLabel")}: {td(selectedDerivedStage)}
                    </span>
                    <span className={`rounded-full border px-4 py-2 text-[10px] font-bold uppercase tracking-[0.22em] ${localizedStatusMeta[selectedCycle.status].tone}`}>
                      {localizedStatusMeta[selectedCycle.status].label}
                    </span>
                    <span className="rounded-full border border-white/8 bg-black/30 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.22em] text-white/55">
                      {formatTemplate("remainingExpected", { days: selectedProgress.remaining })}
                    </span>
                    <button
                      onClick={() => setIsEditingCycle((prev) => !prev)}
                      className="rounded-full border border-white/10 bg-black/25 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.22em] text-white transition-all hover:border-emerald-500/30 hover:text-emerald-300"
                    >
                      {isEditingCycle ? tt("editClose") : tt("editCycle")}
                    </button>
                    <button
                      onClick={handleDeleteCycle}
                      className="rounded-full border border-red-500/20 bg-red-500/10 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.22em] text-red-200 transition-all hover:bg-red-500/20"
                    >
                      {tt("deleteCycle")}
                    </button>
                  </div>
                </div>

                <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto bg-[linear-gradient(180deg,rgba(7,20,17,0.65),rgba(4,10,9,1))] px-5 py-5 sm:px-7 sm:py-6 lg:px-8 lg:py-8">
                  <div className="grid gap-8 xl:grid-cols-[minmax(0,1.35fr)_360px]">
                    <div className="space-y-8">
                      {isEditingCycle && (
                        <section className="rounded-[36px] border border-white/5 bg-zinc-900 p-8">
                          <div className="mb-8 flex items-center justify-between">
                            <div>
                              <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-white/30">{tt("cycleConfig")}</h4>
                              <p className="mt-3 text-2xl font-bold text-white">{tt("updateOps")}</p>
                            </div>
                            <BarChart3 className="h-5 w-5 text-emerald-400" />
                          </div>

                          <form onSubmit={handleUpdateCycle} className="space-y-6">
                            <div className="grid gap-4 md:grid-cols-2">
                              <input
                                required
                                type="text"
                                placeholder={tt("cropName")}
                                className="rounded-2xl border border-white/10 bg-black/40 px-5 py-4 text-white outline-none transition-all focus:border-emerald-500"
                                value={cycleDraft.cropName}
                                onChange={(e) => setCycleDraft({ ...cycleDraft, cropName: e.target.value })}
                              />
                              <select
                                className="rounded-2xl border border-white/10 bg-black/40 px-5 py-4 text-white outline-none transition-all focus:border-emerald-500"
                                value={cycleDraft.status}
                                onChange={(e) => setCycleDraft({ ...cycleDraft, status: e.target.value as GrowthCycle["status"] })}
                              >
                                <option value="active">{localizedStatusMeta.active.label}</option>
                                <option value="harvested">{localizedStatusMeta.harvested.label}</option>
                                <option value="failed">{localizedStatusMeta.failed.label}</option>
                              </select>
                              <input
                                required
                                type="date"
                                className="rounded-2xl border border-white/10 bg-black/40 px-5 py-4 text-white outline-none transition-all focus:border-emerald-500"
                                value={cycleDraft.startDate}
                                onChange={(e) => setCycleDraft({ ...cycleDraft, startDate: e.target.value })}
                              />
                              <input
                                required
                                min={1}
                                type="number"
                                className="rounded-2xl border border-white/10 bg-black/40 px-5 py-4 text-white outline-none transition-all focus:border-emerald-500"
                                value={cycleDraft.duration}
                                onChange={(e) => setCycleDraft({ ...cycleDraft, duration: Number(e.target.value) })}
                              />
                            </div>

                            <textarea
                              rows={4}
                              placeholder={tt("opsNotes")}
                              className="w-full resize-none rounded-2xl border border-white/10 bg-black/40 px-5 py-4 text-white outline-none transition-all focus:border-emerald-500"
                              value={cycleDraft.notes}
                              onChange={(e) => setCycleDraft({ ...cycleDraft, notes: e.target.value })}
                            />

                            <div className="flex flex-wrap gap-3">
                              <button
                                type="submit"
                                className="rounded-2xl bg-emerald-600 px-6 py-4 text-sm font-bold text-white transition-all hover:bg-emerald-500"
                              >
                                {tt("saveUpdate")}
                              </button>
                              <button
                                type="button"
                                onClick={() => setIsEditingCycle(false)}
                                className="rounded-2xl border border-white/10 bg-black/30 px-6 py-4 text-sm font-bold text-white/75 transition-all hover:border-white/20 hover:text-white"
                              >
                                {tt("cancel")}
                              </button>
                            </div>
                          </form>
                        </section>
                      )}

                      <section>
                        <div className="mb-8 flex items-center justify-between">
                          <div>
                            <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-white/30">{tt("stageRoadmap")}</h4>
                            <p className="mt-3 text-2xl font-bold text-white">{td(selectedStageGuide.label)}</p>
                          </div>
                        </div>

                        <div className="grid gap-5 lg:grid-cols-4">
                          {selectedStageTimeline.map((item, index) => {
                            const active = selectedDerivedStage === item.stage;
                            return (
                              <div
                                key={item.stage}
                                className={`rounded-[28px] border p-6 text-left transition-all ${
                                  active
                                    ? "border-emerald-500/30 bg-emerald-500/10"
                                    : "border-white/5 bg-black/30 hover:border-white/10"
                                }`}
                              >
                                <span className="text-[10px] font-bold uppercase tracking-widest text-white/30">{tt("step")} {index + 1}</span>
                                <p className={`mt-4 text-xl font-bold ${active ? "text-emerald-400" : "text-white"}`}>{td(item.stage)}</p>
                                <p className="mt-2 text-[11px] font-bold uppercase tracking-widest text-white/35">
                                  {tt("dayRange")} {item.startDay}-{item.endDay} • {new Date(item.startDate).toLocaleDateString(locale)} - {new Date(item.endDate).toLocaleDateString(locale)}
                                </p>
                                <p className="mt-3 text-sm leading-relaxed text-white/45">{td(stageContent[item.stage].summary)}</p>
                              </div>
                            );
                          })}
                        </div>
                      </section>

                      <section className="grid gap-6 lg:grid-cols-2">
                        <div className="rounded-[36px] border border-white/5 bg-zinc-900 p-8">
                          <div className="mb-6 flex items-center gap-3">
                            <Target className="h-5 w-5 text-emerald-500" />
                            <h4 className="text-sm font-bold uppercase tracking-[0.2em] text-white/40">{tt("priorityWork")}</h4>
                          </div>
                          <div className="space-y-4">
                            {selectedStageGuide.focus.map((item) => (
                              <div key={item} className="flex items-start gap-3 text-white/75">
                                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
                                <span className="leading-relaxed">{td(item)}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="rounded-[36px] border border-orange-500/10 bg-orange-500/5 p-8">
                          <div className="mb-6 flex items-center gap-3">
                            <AlertCircle className="h-5 w-5 text-orange-400" />
                            <h4 className="text-sm font-bold uppercase tracking-[0.2em] text-white/40">{tt("cautionPoints")}</h4>
                          </div>
                          <div className="space-y-4">
                            {selectedStageGuide.alerts.map((item) => (
                              <div key={item} className="flex items-start gap-3 text-white/75">
                                <div className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-orange-400" />
                                <span className="leading-relaxed">{td(item)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </section>

                      <section className="space-y-8">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                          <div>
                            <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-white/30">{tt("taskList")}</h4>
                            <p className="mt-3 text-2xl font-bold text-white">{tt("taskPlanDesc")}</p>
                          </div>
                          <div className="flex flex-wrap gap-3">
                            <button
                              type="button"
                              onClick={() => void seedStageTasks("template")}
                              className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-xs font-bold uppercase tracking-widest text-white transition-all hover:border-emerald-500/30 hover:text-emerald-300"
                            >
                              {tt("loadTemplateTasks")}
                            </button>
                            <button
                              type="button"
                              onClick={() => void seedStageTasks("ai")}
                              disabled={isGeneratingPlan}
                              className="rounded-2xl bg-sky-500 px-4 py-3 text-xs font-bold uppercase tracking-widest text-slate-950 transition-all hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {isGeneratingPlan ? tt("aiPlanning") : tt("aiCreateTasks")}
                            </button>
                          </div>
                        </div>

                        {planFeedback && (
                          <div className="rounded-[28px] border border-emerald-500/20 bg-emerald-500/10 px-5 py-4 text-sm text-emerald-100">
                            {planFeedback}
                          </div>
                        )}

                        <form onSubmit={handleAddTask} className="grid gap-4 rounded-[36px] border border-white/5 bg-black/30 p-6 md:grid-cols-[1.2fr_0.7fr_0.7fr_auto]">
                          <input
                            required
                            type="text"
                            placeholder={tt("taskPlaceholder")}
                            className="rounded-2xl border border-white/10 bg-black/40 px-5 py-4 text-white outline-none transition-all focus:border-emerald-500"
                            value={newTask.title}
                            onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                          />
                          <input
                            required
                            type="date"
                            className="rounded-2xl border border-white/10 bg-black/40 px-5 py-4 text-white outline-none transition-all focus:border-emerald-500"
                            value={newTask.dueDate}
                            onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                          />
                          <select
                            className="rounded-2xl border border-white/10 bg-black/40 px-5 py-4 text-white outline-none transition-all focus:border-emerald-500"
                            value={newTask.type}
                            onChange={(e) => setNewTask({ ...newTask, type: e.target.value as GrowthTask["type"] })}
                          >
                            {Object.entries(taskTypeMeta).map(([value, meta]) => (
                              <option key={value} value={value}>
                                {localizedTaskTypeMeta[value as GrowthTask["type"]].label}
                              </option>
                            ))}
                          </select>
                          <button
                            type="submit"
                            className="rounded-2xl bg-emerald-600 px-6 py-4 text-sm font-bold text-white transition-all hover:bg-emerald-500"
                          >
                            {tt("addTask")}
                          </button>
                        </form>

                        <div className="flex flex-wrap gap-3">
                          {[
                            { key: "all", label: `${tt("all")} (${tasks.length})` },
                            { key: "open", label: `${tt("open")} (${tasks.filter((task) => !task.completed).length})` },
                            { key: "done", label: `${tt("done")} (${completedTasks})` },
                            { key: "overdue", label: `${tt("overdue")} (${overdueTasks})` },
                          ].map((filter) => (
                            <button
                              key={filter.key}
                              type="button"
                              onClick={() => setTaskFilter(filter.key as "all" | "open" | "done" | "overdue")}
                              className={`rounded-full border px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-all ${
                                taskFilter === filter.key
                                  ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
                                  : "border-white/10 bg-black/20 text-white/45 hover:border-white/20 hover:text-white"
                              }`}
                            >
                              {filter.label}
                            </button>
                          ))}
                        </div>

                        <div className="space-y-4">
                          {filteredTasks.length > 0 ? (
                            filteredTasks.map((task) => {
                                const meta = localizedTaskTypeMeta[task.type];
                                const Icon = meta.icon;
                                return (
                                  <div
                                    key={task.id}
                                    className="group flex items-center gap-5 rounded-[32px] border border-white/5 bg-white/5 p-6 transition-all hover:border-emerald-500/20"
                                  >
                                    <button
                                      onClick={() => toggleTask(task)}
                                      className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all ${
                                        task.completed ? "bg-emerald-500 text-white" : "bg-black/40 text-white/20"
                                      }`}
                                    >
                                      {task.completed ? <CheckCircle2 className="h-5 w-5" /> : <Square className="h-5 w-5" />}
                                    </button>

                                    <div className="flex-1">
                                      <div className="flex flex-wrap items-center gap-3">
                                        <p className={`font-bold ${task.completed ? "text-white/35 line-through" : "text-white"}`}>{td(task.title)}</p>
                                        <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-widest ${meta.tone}`}>
                                          <Icon className="h-3.5 w-3.5" /> {meta.label}
                                        </span>
                                      </div>
                                      <div className="mt-2 flex flex-wrap gap-4 text-[11px] font-bold uppercase tracking-widest text-white/30">
                                        <span>{tt("due")}: {new Date(task.dueDate).toLocaleDateString(locale)}</span>
                                        <span>{dueLabel(task.dueDate)}</span>
                                      </div>
                                    </div>

                                    <button onClick={() => handleDeleteTask(task.id)} className="rounded-xl p-3 text-white/20 transition-colors hover:text-red-500">
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </div>
                                );
                              })
                          ) : (
                            <div className="rounded-[32px] border-2 border-dashed border-white/5 p-12 text-center">
                              <p className="font-bold text-white/30">{tt("noMatchingTasks")}</p>
                            </div>
                          )}
                        </div>
                      </section>

                      <section className="space-y-8">
                        <div>
                          <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-white/30">{tt("photoJournal")}</h4>
                          <p className="mt-3 text-2xl font-bold text-white">{tt("photoJournalDesc")}</p>
                        </div>

                        <form onSubmit={handleAddPhoto} className="grid gap-4 rounded-[36px] border border-white/5 bg-black/30 p-6 md:grid-cols-2">
                          <input
                            required
                            type="url"
                            placeholder={tt("photoUrlPlaceholder")}
                            className="rounded-2xl border border-white/10 bg-black/40 px-5 py-4 text-white outline-none transition-all focus:border-emerald-500"
                            value={newPhoto.url}
                            onChange={(e) => setNewPhoto({ ...newPhoto, url: e.target.value })}
                          />
                          <input
                            required
                            type="date"
                            className="rounded-2xl border border-white/10 bg-black/40 px-5 py-4 text-white outline-none transition-all focus:border-emerald-500"
                            value={newPhoto.date}
                            onChange={(e) => setNewPhoto({ ...newPhoto, date: e.target.value })}
                          />
                          <textarea
                            rows={3}
                            placeholder={tt("photoNotePlaceholder")}
                            className="md:col-span-2 resize-none rounded-2xl border border-white/10 bg-black/40 px-5 py-4 text-white outline-none transition-all focus:border-emerald-500"
                            value={newPhoto.note}
                            onChange={(e) => setNewPhoto({ ...newPhoto, note: e.target.value })}
                          />
                          <button
                            type="submit"
                            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-6 py-4 text-sm font-bold text-white transition-all hover:bg-emerald-500 md:col-span-2"
                          >
                            <ImagePlus className="h-4 w-4" /> {tt("savePhotoLog")}
                          </button>
                        </form>

                        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                          {photos
                            .slice()
                            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                            .map((photo) => (
                            <div key={photo.id} className="group overflow-hidden rounded-[28px] border border-white/5 bg-white/5">
                              <div className="relative aspect-square overflow-hidden">
                                <img src={photo.url} alt={tt("photoJournal")} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                <button
                                  onClick={() => handleDeletePhoto(photo.id)}
                                  className="absolute right-4 top-4 rounded-xl bg-black/60 p-3 text-white/70 opacity-0 transition-all hover:bg-red-500 group-hover:opacity-100"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                              <div className="p-5">
                                <p className="text-xs font-bold uppercase tracking-widest text-emerald-400">
                                  {new Date(photo.date).toLocaleDateString(locale)}
                                </p>
                                <p className="mt-3 text-sm leading-relaxed text-white/65">{td(photo.note) || tt("noPhotoNote")}</p>
                              </div>
                            </div>
                          ))}
                          {photos.length === 0 && (
                            <div className="flex aspect-square flex-col items-center justify-center rounded-[28px] border-2 border-dashed border-white/5 text-center text-white/25">
                              <Camera className="mb-4 h-10 w-10" />
                              <p className="max-w-[180px] text-sm font-bold">{tt("noPhotos")}</p>
                            </div>
                          )}
                        </div>
                      </section>
                    </div>

                    <div className="space-y-10">
                      <section className="rounded-[40px] border border-sky-500/15 bg-sky-500/5 p-8">
                        <div className="mb-6 flex items-center justify-between">
                          <div>
                            <p className="text-xs font-bold uppercase tracking-[0.2em] text-sky-300/80">AI Crop Pulse</p>
                            <h4 className="mt-3 text-2xl font-bold text-white">{tt("healthScore")}</h4>
                          </div>
                          <div className="flex h-16 w-16 items-center justify-center rounded-full border border-sky-400/20 bg-sky-400/10 text-xl font-black text-sky-200">
                            {cycleHealthScore}
                          </div>
                        </div>

                        <div className="h-3 overflow-hidden rounded-full bg-white/8">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-sky-400 to-cyan-300"
                            style={{ width: `${cycleHealthScore}%` }}
                          />
                        </div>

                        <div className="mt-6 grid gap-4">
                          {operationalSignals.map((signal) => (
                            <div key={signal.label} className={`rounded-[24px] border p-4 ${signal.tone}`}>
                              <div className="flex items-center justify-between gap-4">
                                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/50">{signal.label}</p>
                                <p className="text-sm font-bold text-white">{signal.value}</p>
                              </div>
                              <p className="mt-2 text-sm leading-relaxed text-white/70">{signal.note}</p>
                            </div>
                          ))}
                        </div>
                      </section>

                      <section className="rounded-[40px] border border-emerald-500/20 bg-emerald-600/10 p-8">
                        <div className="mb-8 flex items-center gap-4">
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/20">
                            <Cpu className="h-6 w-6 text-emerald-500" />
                          </div>
                          <div>
                            <h4 className="text-xl font-bold text-white">AgroPro AI Insights</h4>
                            <p className="text-sm text-white/45">{tt("aiInsightDesc")}</p>
                          </div>
                        </div>

                        {isLoadingTip ? (
                          <div className="flex items-center gap-3 text-sm text-white/45">
                            <RefreshCw className="h-4 w-4 animate-spin" /> {tt("loadingAdvice")}
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {aiHighlights.length > 0 ? (
                              aiHighlights.map((item) => (
                                <div key={item} className="rounded-[24px] border border-white/8 bg-black/25 p-4 text-sm leading-relaxed text-white/75">
                                  {td(item)}
                                </div>
                              ))
                            ) : (
                              <div className="whitespace-pre-line text-sm leading-relaxed text-white/75">{td(aiTip)}</div>
                            )}
                          </div>
                        )}

                        <button
                          onClick={() => void fetchAiTip(selectedCycle)}
                          className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-4 text-xs font-bold uppercase tracking-widest text-white transition-all hover:bg-emerald-500"
                        >
                          <RefreshCw className="h-4 w-4" /> {tt("requestAdvice")}
                        </button>
                      </section>

                      <section className="rounded-[40px] border border-white/5 bg-zinc-900 p-8">
                        <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-white/30">{tt("cycleStats")}</h4>
                        <div className="mt-8 space-y-6">
                          <div>
                            <div className="mb-2 flex justify-between text-xs font-bold uppercase tracking-widest">
                              <span className="text-white/40">{tt("overallProgress")}</span>
                              <span className="text-white">{selectedProgress.percent}%</span>
                            </div>
                            <div className="h-2 overflow-hidden rounded-full bg-white/5">
                              <div className="h-full bg-emerald-500" style={{ width: `${selectedProgress.percent}%` }} />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="rounded-2xl border border-white/5 bg-black/40 p-4">
                              <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">{tt("journalPhotos")}</p>
                              <p className="mt-2 text-xl font-bold text-white">{photos.length}</p>
                            </div>
                            <div className="rounded-2xl border border-white/5 bg-black/40 p-4">
                              <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">{tt("upcomingWork")}</p>
                              <p className="mt-2 text-xl font-bold text-white">{upcomingTasks.length}</p>
                            </div>
                            <div className="rounded-2xl border border-white/5 bg-black/40 p-4">
                              <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">{tt("overdueWork")}</p>
                              <p className="mt-2 text-xl font-bold text-white">{overdueTasks}</p>
                            </div>
                            <div className="rounded-2xl border border-white/5 bg-black/40 p-4">
                              <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">{tt("aiHealth")}</p>
                              <p className="mt-2 text-xl font-bold text-white">{cycleHealthScore}%</p>
                            </div>
                          </div>

                          <div>
                            <div className="mb-4 flex items-center justify-between text-xs font-bold uppercase tracking-widest">
                              <span className="text-white/40">{tt("completionRate")}</span>
                              <span className="text-white">{taskCompletionRate}%</span>
                            </div>
                            <div className="h-2 overflow-hidden rounded-full bg-white/5">
                              <div className="h-full bg-sky-400" style={{ width: `${taskCompletionRate}%` }} />
                            </div>
                          </div>

                          <div className="grid gap-3">
                            {taskTypeCounts.map((item) => (
                              <div key={item.type} className="flex items-center justify-between rounded-2xl border border-white/5 bg-black/30 px-4 py-3">
                                <span className="text-sm text-white/60">{item.label}</span>
                                <span className="text-sm font-bold text-white">{item.count}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </section>

                      <section className="rounded-[40px] border border-emerald-500/10 bg-emerald-500/5 p-8">
                        <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-300/80">{tt("dueSoon")}</h4>
                        <div className="mt-6 space-y-4">
                          {alertTasks.length > 0 ? (
                            alertTasks.map((task) => (
                              <div key={task.id} className="rounded-2xl border border-white/5 bg-black/30 p-4">
                                <p className="font-bold text-white">{td(task.title)}</p>
                                <p className="mt-2 text-[11px] font-bold uppercase tracking-widest text-emerald-300/80">
                                  {new Date(task.dueDate).toLocaleDateString(locale)} • {dueLabel(task.dueDate)}
                                </p>
                              </div>
                            ))
                          ) : (
                            <p className="text-sm leading-relaxed text-white/55">{tt("noUrgentAlerts")}</p>
                          )}
                        </div>
                      </section>

                      <section className="rounded-[40px] border border-white/5 bg-zinc-900 p-8">
                        <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-white/30">{tt("operationTimeline")}</h4>
                        <div className="mt-6 space-y-4">
                          {activityFeed.length > 0 ? (
                            activityFeed.map((item) => (
                              <div key={item.id} className="rounded-2xl border border-white/5 bg-black/30 p-4">
                                <p className="text-[11px] font-bold uppercase tracking-widest text-emerald-400">
                                  {new Date(item.date).toLocaleDateString(locale)}
                                </p>
                                <p className="mt-2 font-bold text-white">{td(item.title)}</p>
                                <p className="mt-2 text-sm leading-relaxed text-white/55">{td(item.note)}</p>
                              </div>
                            ))
                          ) : (
                            <p className="text-sm leading-relaxed text-white/45">{tt("emptyTimeline")}</p>
                          )}
                        </div>
                      </section>

                      <section className="rounded-[40px] border border-white/5 bg-zinc-900 p-8">
                        <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-white/30">{tt("quickCheck")}</h4>
                        <div className="mt-6 space-y-4">
                          <div className="flex items-start gap-3 text-sm text-white/65">
                            <Droplets className="mt-0.5 h-4 w-4 shrink-0 text-sky-400" />
                            {tt("quickCheckWater")}
                          </div>
                          <div className="flex items-start gap-3 text-sm text-white/65">
                            <SunMedium className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                            {tt("quickCheckLight")}
                          </div>
                          <div className="flex items-start gap-3 text-sm text-white/65">
                            <Clock className="mt-0.5 h-4 w-4 shrink-0 text-violet-400" />
                            {tt("quickCheckPhoto")}
                          </div>
                        </div>
                      </section>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default GrowthView;
