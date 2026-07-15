import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowDown,
  ArrowUp,
  BadgePlus,
  Clock3,
  Filter,
  Flame,
  MessageCircle,
  Pin,
  Search,
  Send,
  Sparkles,
  TrendingUp,
  Users,
  X,
} from "lucide-react";
import communityHeroImage from "../../anh/10.jpg";
import communitySupportImage from "../../anh/11.jpg";
import { isSupabaseConfigured } from "../lib/supabase";
import {
  createCommunityComment,
  createCommunityPost,
  createCommunityReport,
  deleteCommunityPost,
  listCommunityComments,
  listCommunityPosts,
  setCommunityVote,
  subscribeToCommunityChanges,
  unsubscribeFromCommunityChanges,
} from "../services/communityService";
import { isAdminUser } from "../services/roleService";
import { AppUser, CommunityCategory, CommunityComment, CommunityPost, CommunitySortMode } from "../types";
import { LocalizedDictionary, useI18n } from "../i18n";

interface ForumViewProps {
  user: AppUser | null;
  onLogin: () => void | Promise<void>;
}

const categories: CommunityCategory[] = ["Tất cả", "Kỹ thuật", "Sâu bệnh", "Thị trường", "Kinh nghiệm", "Hỏi đáp", "Thảo luận"];

const sortOptions: { value: CommunitySortMode; labelKey: string; icon: React.ElementType }[] = [
  { value: "hot", labelKey: "hot", icon: Flame },
  { value: "new", labelKey: "newest", icon: Clock3 },
  { value: "top", labelKey: "top", icon: TrendingUp },
];

const communityText: LocalizedDictionary = {
  communityHub: { vi: "Community Hub", en: "Community Hub", ja: "コミュニティハブ" },
  heroTitle: {
    vi: "Cộng đồng trao đổi mùa vụ, sâu bệnh và kinh nghiệm canh tác thực tế.",
    en: "A community for crop seasons, pest issues, and real farming experience.",
    ja: "作期、病害虫、実践的な栽培経験を共有するコミュニティ。",
  },
  heroDesc: {
    vi: "Đặt câu hỏi nhanh, chia sẻ tình huống ngoài ruộng và theo dõi các chủ đề đang được cộng đồng quan tâm nhiều nhất.",
    en: "Ask quick questions, share field situations, and follow topics the community cares about most.",
    ja: "質問を投稿し、現場の状況を共有し、注目されているトピックを追えます。",
  },
  postsShowing: { vi: "bài viết đang hiển thị", en: "posts shown", ja: "件の投稿を表示" },
  discussions: { vi: "lượt thảo luận", en: "discussions", ja: "件の議論" },
  topicGroups: { vi: "nhóm chủ đề", en: "topic groups", ja: "トピックグループ" },
  featuredThread: { vi: "Thread nổi bật", en: "Featured thread", ja: "注目スレッド" },
  featuredFallbackTitle: {
    vi: "Hỏi đúng vấn đề để nhận phản hồi nhanh và sát thực tế hơn.",
    en: "Ask the right question to get faster, more practical responses.",
    ja: "的確に質問すると、より早く実用的な回答が得られます。",
  },
  featuredFallbackBody: {
    vi: "Mô tả rõ bối cảnh ruộng, giống cây hoặc dấu hiệu bệnh để cộng đồng hỗ trợ hiệu quả hơn.",
    en: "Describe field context, crop variety, or symptoms clearly so the community can help effectively.",
    ja: "圃場状況、品種、症状を明確に書くと、より効果的に支援を受けられます。",
  },
  createPost: { vi: "Tạo bài viết", en: "Create post", ja: "投稿作成" },
  newThread: { vi: "Mở một thread mới", en: "Start a new thread", ja: "新しいスレッドを開始" },
  titlePlaceholder: {
    vi: "Ví dụ: Phòng sâu cuốn lá giai đoạn lúa 25 ngày như thế nào?",
    en: "Example: How should I prevent leaf folders at 25 days after rice planting?",
    ja: "例: 田植え後25日の稲で葉巻虫を防ぐには？",
  },
  bodyPlaceholder: {
    vi: "Viết rõ bối cảnh ruộng, giống cây, triệu chứng hoặc kinh nghiệm để cộng đồng dễ hỗ trợ hơn.",
    en: "Describe the field context, crop variety, symptoms, or experience so the community can help.",
    ja: "圃場状況、品種、症状、経験を具体的に書くと支援を受けやすくなります。",
  },
  tagPlaceholder: { vi: "Tags: lua, st25, huu-co", en: "Tags: rice, st25, organic", ja: "タグ: rice, st25, organic" },
  posting: { vi: "Đang đăng...", en: "Posting...", ja: "投稿中..." },
  submitPost: { vi: "Đăng bài mới", en: "Post thread", ja: "投稿する" },
  loginToPost: { vi: "Đăng nhập để đăng bài", en: "Sign in to post", ja: "ログインして投稿" },
  tip: {
    vi: "Mẹo: bài viết có chủ đề rõ ràng, mô tả đầy đủ và gắn tag cụ thể sẽ dễ nhận được phản hồi hữu ích hơn.",
    en: "Tip: clear topics, complete context, and specific tags make useful responses more likely.",
    ja: "ヒント: 明確なテーマ、十分な状況説明、具体的なタグがあると有用な返信が増えます。",
  },
  searchPlaceholder: {
    vi: "Tìm theo tiêu đề, nội dung, tag hoặc tên người đăng",
    en: "Search by title, content, tag, or author",
    ja: "タイトル、本文、タグ、投稿者で検索",
  },
  loadingCommunity: { vi: "Đang tải cộng đồng...", en: "Loading community...", ja: "コミュニティを読み込み中..." },
  noPosts: {
    vi: "Chưa có bài viết phù hợp với bộ lọc hiện tại.",
    en: "No posts match the current filters.",
    ja: "現在のフィルターに一致する投稿はありません。",
  },
  pinned: { vi: "Ghim", en: "Pinned", ja: "固定" },
  points: { vi: "điểm", en: "points", ja: "点" },
  comments: { vi: "bình luận", en: "comments", ja: "コメント" },
  items: { vi: "mục", en: "items", ja: "件" },
  deleting: { vi: "Đang xóa...", en: "Deleting...", ja: "削除中..." },
  deletingShort: { vi: "Đang xóa", en: "Deleting", ja: "削除中" },
  deletePost: { vi: "Xóa bài", en: "Delete post", ja: "投稿を削除" },
  relatedPosts: { vi: "Bài viết liên quan", en: "Related posts", ja: "関連投稿" },
  relatedDesc: {
    vi: "Cột phải giờ chỉ dùng để gợi ý thêm nội dung cùng chủ đề.",
    en: "The right column suggests more content on the same topic.",
    ja: "右側には同じテーマの関連コンテンツを表示します。",
  },
  relatedToThread: { vi: "Liên quan đến thread đang xem", en: "Related to the current thread", ja: "表示中スレッドに関連" },
  noRelated: {
    vi: "Chưa có nhiều bài liên quan trong bộ lọc hiện tại.",
    en: "There are not many related posts in the current filter.",
    ja: "現在のフィルターでは関連投稿がまだ少ないです。",
  },
  pickPostForRelated: {
    vi: "Bấm vào một bài viết hoặc icon bình luận để mở chi tiết và xem bài liên quan tại đây.",
    en: "Open a post or comment icon to view details and related posts here.",
    ja: "投稿またはコメントアイコンを開くと、詳細と関連投稿をここで確認できます。",
  },
  trendingTags: { vi: "Tag nổi bật", en: "Trending tags", ja: "注目タグ" },
  noTags: {
    vi: "Khi có bài viết và tag mới, khu vực này sẽ giúp người dùng tìm nhanh hơn.",
    en: "When posts and tags appear, this area helps users discover them faster.",
    ja: "投稿やタグが増えると、ここから素早く探せます。",
  },
  report: { vi: "Report", en: "Report", ja: "報告" },
  reportPost: { vi: "Report bài viết", en: "Report post", ja: "投稿を報告" },
  reportDetailsPlaceholder: { vi: "Ghi chú thêm cho admin nếu cần", en: "Add notes for admins if needed", ja: "必要なら管理者向けメモを追加" },
  sending: { vi: "Đang gửi...", en: "Sending...", ja: "送信中..." },
  sendReport: { vi: "Gửi report", en: "Send report", ja: "報告を送信" },
  login: { vi: "Đăng nhập", en: "Sign in", ja: "ログイン" },
  commentPost: { vi: "Bình luận bài viết", en: "Comment on post", ja: "投稿にコメント" },
  commentPlaceholder: { vi: "Viết bình luận của bạn tại đây...", en: "Write your comment here...", ja: "コメントを入力..." },
  sendComment: { vi: "Gửi bình luận", en: "Send comment", ja: "コメント送信" },
  loginToComment: { vi: "Đăng nhập để bình luận", en: "Sign in to comment", ja: "ログインしてコメント" },
  loadingComments: { vi: "Đang tải bình luận...", en: "Loading comments...", ja: "コメントを読み込み中..." },
  noComments: {
    vi: "Chưa có bình luận. Hãy mở đầu cuộc thảo luận đầu tiên cho bài viết này.",
    en: "No comments yet. Start the first discussion for this post.",
    ja: "まだコメントはありません。最初の議論を始めましょう。",
  },
  reply: { vi: "Trả lời", en: "Reply", ja: "返信" },
  replyTo: { vi: "Trả lời", en: "Reply to", ja: "返信先" },
  sendReply: { vi: "Gửi trả lời", en: "Send reply", ja: "返信を送信" },
  cancel: { vi: "Hủy", en: "Cancel", ja: "キャンセル" },
  now: { vi: "Vừa xong", en: "Just now", ja: "たった今" },
  discussing: { vi: "Đang thảo luận", en: "Discussing", ja: "議論中" },
  inlineCommentHint: {
    vi: "Bình luận ngay bên dưới bài viết này, giống luồng đọc quen thuộc của Facebook hoặc Threads.",
    en: "Comment directly below this post, similar to familiar Facebook or Threads flows.",
    ja: "FacebookやThreadsのように、この投稿の下で直接コメントできます。",
  },
  closePost: { vi: "Đóng bài viết", en: "Close post", ja: "投稿を閉じる" },
  sameTopic: {
    vi: "Các chủ đề cùng nhóm hoặc có tag trùng với bài đang đọc.",
    en: "Topics in the same group or sharing tags with the current post.",
    ja: "同じカテゴリまたは共通タグを持つトピックです。",
  },
  hot: { vi: "Hot", en: "Hot", ja: "人気" },
  newest: { vi: "Mới nhất", en: "Newest", ja: "新着" },
  top: { vi: "Top", en: "Top", ja: "トップ" },
  supabaseMissing: {
    vi: "Chưa cấu hình Supabase. Hãy thêm VITE_SUPABASE_URL và VITE_SUPABASE_ANON_KEY.",
    en: "Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.",
    ja: "Supabaseが未設定です。VITE_SUPABASE_URL と VITE_SUPABASE_ANON_KEY を追加してください。",
  },
  loadPostsError: {
    vi: "Không tải được bài viết cộng đồng. Kiểm tra schema Supabase và thử lại.",
    en: "Could not load community posts. Check the Supabase schema and try again.",
    ja: "コミュニティ投稿を読み込めません。Supabaseスキーマを確認して再試行してください。",
  },
  loadCommentsError: { vi: "Không tải được bình luận cho bài viết đang chọn.", en: "Could not load comments for the selected post.", ja: "選択中の投稿のコメントを読み込めません。" },
  loginBeforePost: { vi: "Bạn cần đăng nhập trước khi đăng bài.", en: "Please sign in before posting.", ja: "投稿する前にログインしてください。" },
  titleTooShort: { vi: "Tiêu đề cần ít nhất 8 ký tự.", en: "Title must be at least 8 characters.", ja: "タイトルは8文字以上必要です。" },
  bodyTooShort: { vi: "Nội dung bài viết cần ít nhất 20 ký tự để cộng đồng dễ hỗ trợ.", en: "Post content needs at least 20 characters so the community can help.", ja: "本文は20文字以上入力してください。" },
  anonymousFarmer: { vi: "Nông dân ẩn danh", en: "Anonymous farmer", ja: "匿名農家" },
  postSuccess: { vi: "Đăng bài thành công.", en: "Post created successfully.", ja: "投稿しました。" },
  createPostError: { vi: "Không thể đăng bài lúc này. Hãy chắc rằng bạn đã chạy file SQL của cộng đồng trên Supabase.", en: "Could not post right now. Make sure the community SQL file has been run on Supabase.", ja: "現在投稿できません。SupabaseでコミュニティSQLを実行済みか確認してください。" },
  voteError: { vi: "Không cập nhật được vote. Vui lòng thử lại.", en: "Could not update vote. Please try again.", ja: "投票を更新できません。再試行してください。" },
  loginBeforeComment: { vi: "Bạn cần đăng nhập trước khi bình luận.", en: "Please sign in before commenting.", ja: "コメントする前にログインしてください。" },
  commentTooShort: { vi: "Bình luận cần ít nhất 2 ký tự.", en: "Comment must be at least 2 characters.", ja: "コメントは2文字以上必要です。" },
  userFallback: { vi: "Người dùng", en: "User", ja: "ユーザー" },
  commentSuccess: { vi: "Gửi bình luận thành công.", en: "Comment sent successfully.", ja: "コメントを送信しました。" },
  commentError: { vi: "Không thể gửi bình luận. Vui lòng thử lại.", en: "Could not send comment. Please try again.", ja: "コメントを送信できません。再試行してください。" },
  loginBeforeReply: { vi: "Bạn cần đăng nhập trước khi trả lời bình luận.", en: "Please sign in before replying.", ja: "返信する前にログインしてください。" },
  replyTooShort: { vi: "Nội dung trả lời cần ít nhất 2 ký tự.", en: "Reply must be at least 2 characters.", ja: "返信は2文字以上必要です。" },
  replySuccess: { vi: "Đã gửi trả lời.", en: "Reply sent.", ja: "返信を送信しました。" },
  replyError: { vi: "Không thể gửi trả lời bình luận. Vui lòng thử lại.", en: "Could not send reply. Please try again.", ja: "返信を送信できません。再試行してください。" },
  reportError: { vi: "Không gửi được report. Vui lòng thử lại.", en: "Could not send report. Please try again.", ja: "報告を送信できません。再試行してください。" },
  deleteError: { vi: "Admin chưa thể xóa bài viết này. Hãy kiểm tra quyền RLS và thử lại.", en: "Admin cannot delete this post yet. Check RLS permissions and try again.", ja: "管理者がこの投稿を削除できません。RLS権限を確認してください。" },
};

const communityTermText: LocalizedDictionary = {
  "Tất cả": { vi: "Tất cả", en: "All", ja: "すべて" },
  "Kỹ thuật": { vi: "Kỹ thuật", en: "Technique", ja: "技術" },
  "Sâu bệnh": { vi: "Sâu bệnh", en: "Pests and diseases", ja: "病害虫" },
  "Thị trường": { vi: "Thị trường", en: "Market", ja: "市場" },
  "Kinh nghiệm": { vi: "Kinh nghiệm", en: "Experience", ja: "経験" },
  "Hỏi đáp": { vi: "Hỏi đáp", en: "Q&A", ja: "Q&A" },
  "Thảo luận": { vi: "Thảo luận", en: "Discussion", ja: "議論" },
  "Spam / không liên quan": { vi: "Spam / không liên quan", en: "Spam / unrelated", ja: "スパム / 無関係" },
  "Nội dung sai lệch": { vi: "Nội dung sai lệch", en: "Misleading content", ja: "誤解を招く内容" },
  "Ngôn từ công kích": { vi: "Ngôn từ công kích", en: "Abusive language", ja: "攻撃的な表現" },
  "Lừa đảo / quảng cáo": { vi: "Lừa đảo / quảng cáo", en: "Scam / advertising", ja: "詐欺 / 広告" },
  "Khác": { vi: "Khác", en: "Other", ja: "その他" },
};

const reportReasons = ["Spam / không liên quan", "Nội dung sai lệch", "Ngôn từ công kích", "Lừa đảo / quảng cáo", "Khác"];

const formatRelativeTime = (value: string, language: "en" | "ja" | "vi", nowText: string) => {
  const target = new Date(value).getTime();
  if (Number.isNaN(target)) return nowText;

  const diffMinutes = Math.round((target - Date.now()) / 60000);
  const locale = language === "vi" ? "vi" : language === "ja" ? "ja" : "en";
  const formatter = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });

  if (Math.abs(diffMinutes) < 60) return formatter.format(diffMinutes, "minute");

  const diffHours = Math.round(diffMinutes / 60);
  if (Math.abs(diffHours) < 24) return formatter.format(diffHours, "hour");

  const diffDays = Math.round(diffHours / 24);
  if (Math.abs(diffDays) < 30) return formatter.format(diffDays, "day");

  return new Date(value).toLocaleDateString(language === "vi" ? "vi-VN" : language === "ja" ? "ja-JP" : "en-US");
};

const formatThreadTitle = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return "";
  const letters = trimmed.replace(/[^A-Za-zÀ-ỹ]/g, "");
  const isMostlyUppercase = letters.length > 0 && letters === letters.toLocaleUpperCase("vi-VN");
  if (!isMostlyUppercase) return trimmed;

  const normalized = trimmed.toLocaleLowerCase("vi-VN");
  return normalized.charAt(0).toLocaleUpperCase("vi-VN") + normalized.slice(1);
};

const ForumView = ({ user, onLogin }: ForumViewProps) => {
  const { language } = useI18n();
  const tt = (key: string) => communityText[key]?.[language] ?? communityText[key]?.vi ?? key;
  const displayTerm = (value: string) => communityTermText[value]?.[language] ?? value;
  const relativeTime = (value: string) => formatRelativeTime(value, language, tt("now"));
  const isSuccessMessage = (value: string) =>
    [tt("postSuccess"), tt("commentSuccess"), tt("replySuccess")].includes(value);
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [commentsByPost, setCommentsByPost] = useState<Record<string, CommunityComment[]>>({});
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [loadingComments, setLoadingComments] = useState(false);
  const [posting, setPosting] = useState(false);
  const [commenting, setCommenting] = useState(false);
  const [activeCategory, setActiveCategory] = useState<CommunityCategory>("Tất cả");
  const [sortMode, setSortMode] = useState<CommunitySortMode>("hot");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [postForm, setPostForm] = useState({
    title: "",
    body: "",
    category: "Thảo luận" as CommunityPost["category"],
    tags: "",
  });
  const [commentForm, setCommentForm] = useState("");
  const [postFormMessage, setPostFormMessage] = useState<string | null>(null);
  const [commentFormMessage, setCommentFormMessage] = useState<string | null>(null);
  const [replyTargetCommentId, setReplyTargetCommentId] = useState<string | null>(null);
  const [replyBody, setReplyBody] = useState("");
  const [replyMessage, setReplyMessage] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState("Spam / không liên quan");
  const [reportDetails, setReportDetails] = useState("");
  const [reporting, setReporting] = useState(false);
  const [reportPanelOpen, setReportPanelOpen] = useState(false);
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null);
  const isAdmin = isAdminUser(user);
  const commentInputRef = useRef<HTMLTextAreaElement | null>(null);
  const replyInputRef = useRef<HTMLTextAreaElement | null>(null);

  const visiblePosts = posts.filter((post) => {
    const matchCategory = activeCategory === "Tất cả" || post.category === activeCategory;
    const search = searchTerm.trim().toLowerCase();
    const matchSearch =
      search.length === 0 ||
      post.title.toLowerCase().includes(search) ||
      post.body.toLowerCase().includes(search) ||
      post.authorName.toLowerCase().includes(search) ||
      post.tags.some((tag) => tag.toLowerCase().includes(search));
    return matchCategory && matchSearch;
  });

  const selectedPost = visiblePosts.find((post) => post.id === selectedPostId) ?? null;
  const selectedComments = selectedPost ? commentsByPost[selectedPost.id] ?? [] : [];
  const rootComments = selectedComments.filter((comment) => !comment.parentCommentId);
  const repliesByParentId = selectedComments.reduce<Record<string, CommunityComment[]>>((acc, comment) => {
    if (comment.parentCommentId) {
      acc[comment.parentCommentId] = [...(acc[comment.parentCommentId] ?? []), comment];
    }
    return acc;
  }, {});
  const totalComments = posts.reduce((total, post) => total + post.commentCount, 0);
  const highlightedTags = Array.from(new Set(posts.flatMap((post) => post.tags))).slice(0, 6);
  const relatedPosts = selectedPost
    ? visiblePosts.filter((post) => post.id !== selectedPost.id).filter((post) => post.category === selectedPost.category || post.tags.some((tag) => selectedPost.tags.includes(tag))).slice(0, 4)
    : visiblePosts.slice(0, 4);

  const loadPosts = async () => {
    if (!isSupabaseConfigured) {
      setErrorMessage(tt("supabaseMissing"));
      setLoadingPosts(false);
      return;
    }

    setLoadingPosts(true);
    setErrorMessage(null);

    try {
      const nextPosts = await listCommunityPosts({ userId: user?.uid, sort: sortMode });
      setPosts(nextPosts);
      setSelectedPostId((current) => (current && nextPosts.some((post) => post.id === current) ? current : null));
    } catch (error) {
      console.error("Failed to load community posts:", error);
      setErrorMessage(tt("loadPostsError"));
    } finally {
      setLoadingPosts(false);
    }
  };

  const loadComments = async (postId: string) => {
    if (!isSupabaseConfigured) return;

    setLoadingComments(true);
    try {
      const nextComments = await listCommunityComments(postId);
      setCommentsByPost((current) => ({ ...current, [postId]: nextComments }));
    } catch (error) {
      console.error("Failed to load community comments:", error);
      setErrorMessage(tt("loadCommentsError"));
    } finally {
      setLoadingComments(false);
    }
  };

  useEffect(() => {
    void loadPosts();
  }, [user?.uid, sortMode]);

  useEffect(() => {
    if (!selectedPost?.id) return;
    if (commentsByPost[selectedPost.id]) return;
    void loadComments(selectedPost.id);
  }, [selectedPost?.id]);

  useEffect(() => {
    if (!isSupabaseConfigured) return;

    const channel = subscribeToCommunityChanges(() => {
      void loadPosts();
      if (selectedPostId) {
        void loadComments(selectedPostId);
      }
    });

    return () => {
      void unsubscribeFromCommunityChanges(channel);
    };
  }, [user?.uid, sortMode, selectedPostId]);

  const handleCreatePost = async (event: React.FormEvent) => {
    event.preventDefault();
    setPostFormMessage(null);

    if (!user) {
      void onLogin();
      setPostFormMessage(tt("loginBeforePost"));
      return;
    }

    if (postForm.title.trim().length < 8) {
      setPostFormMessage(tt("titleTooShort"));
      return;
    }

    if (postForm.body.trim().length < 20) {
      setPostFormMessage(tt("bodyTooShort"));
      return;
    }

    setPosting(true);
    setErrorMessage(null);

    try {
      const tags = postForm.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean)
        .slice(0, 5);

      await createCommunityPost({
        authorId: user.uid,
        authorName: user.displayName || user.email?.split("@")[0] || tt("anonymousFarmer"),
        title: postForm.title,
        body: postForm.body,
        category: postForm.category,
        tags,
      });

      setPostForm({
        title: "",
        body: "",
        category: "Thảo luận",
        tags: "",
      });
      setPostFormMessage(tt("postSuccess"));

      await loadPosts();
    } catch (error) {
      console.error("Failed to create community post:", error);
      setErrorMessage(tt("createPostError"));
    } finally {
      setPosting(false);
    }
  };

  const handleVote = async (post: CommunityPost, nextValue: -1 | 1) => {
    if (!user) return;

    const appliedValue = post.userVote === nextValue ? 0 : nextValue;

    try {
      await setCommunityVote({
        postId: post.id,
        userId: user.uid,
        value: appliedValue,
      });

      await loadPosts();
    } catch (error) {
      console.error("Failed to vote on post:", error);
      setErrorMessage(tt("voteError"));
    }
  };

  const handleCreateComment = async (event: React.FormEvent) => {
    event.preventDefault();
    setCommentFormMessage(null);
    if (!selectedPost) return;

    if (!user) {
      void onLogin();
      setCommentFormMessage(tt("loginBeforeComment"));
      return;
    }

    if (commentForm.trim().length < 2) {
      setCommentFormMessage(tt("commentTooShort"));
      commentInputRef.current?.focus();
      return;
    }

    setCommenting(true);
    setErrorMessage(null);

    try {
      await createCommunityComment({
        postId: selectedPost.id,
        parentCommentId: null,
        authorId: user.uid,
        authorName: user.displayName || user.email?.split("@")[0] || tt("anonymousFarmer"),
        body: commentForm,
      });

      setCommentForm("");
      setCommentFormMessage(tt("commentSuccess"));
      await Promise.all([loadPosts(), loadComments(selectedPost.id)]);
    } catch (error) {
      console.error("Failed to create comment:", error);
      setErrorMessage(tt("commentError"));
    } finally {
      setCommenting(false);
    }
  };

  const handleOpenCommentComposer = async (postId: string) => {
    setSelectedPostId(postId);
    setCommentFormMessage(null);
    setReportPanelOpen(false);
    setReplyTargetCommentId(null);
    setReplyBody("");
    setReplyMessage(null);

    if (!commentsByPost[postId]) {
      await loadComments(postId);
    }

    requestAnimationFrame(() => {
      commentInputRef.current?.focus();
    });
  };

  const handleTogglePost = async (postId: string) => {
    const nextSelectedId = postId;
    setSelectedPostId(nextSelectedId);
    setCommentFormMessage(null);
    setReportPanelOpen(false);
    setReplyTargetCommentId(null);
    setReplyBody("");
    setReplyMessage(null);

    if (!commentsByPost[nextSelectedId]) {
      await loadComments(nextSelectedId);
    }
  };

  const handleReplySubmit = async (parentCommentId: string) => {
    setReplyMessage(null);
    if (!selectedPost) return;

    if (!user) {
      void onLogin();
      setReplyMessage(tt("loginBeforeReply"));
      return;
    }

    if (replyBody.trim().length < 2) {
      setReplyMessage(tt("replyTooShort"));
      replyInputRef.current?.focus();
      return;
    }

    setCommenting(true);
    setErrorMessage(null);

    try {
      await createCommunityComment({
        postId: selectedPost.id,
        parentCommentId,
        authorId: user.uid,
        authorName: user.displayName || user.email?.split("@")[0] || tt("anonymousFarmer"),
        body: replyBody,
      });

      setReplyBody("");
      setReplyTargetCommentId(null);
      setReplyMessage(tt("replySuccess"));
      await Promise.all([loadPosts(), loadComments(selectedPost.id)]);
    } catch (error) {
      console.error("Failed to create reply:", error);
      setErrorMessage(tt("replyError"));
    } finally {
      setCommenting(false);
    }
  };

  const handleOpenReplyBox = (commentId: string) => {
    setReplyTargetCommentId((current) => (current === commentId ? null : commentId));
    setReplyBody("");
    setReplyMessage(null);

    requestAnimationFrame(() => {
      replyInputRef.current?.focus();
    });
  };

  const handleReportPost = async () => {
    if (!user || !selectedPost) return;

    setReporting(true);
    setErrorMessage(null);

    try {
      await createCommunityReport({
        postId: selectedPost.id,
        postTitle: selectedPost.title,
        reporterId: user.uid,
        reporterName: user.displayName || user.email?.split("@")[0] || tt("userFallback"),
        reason: reportReason,
        details: reportDetails,
      });

      setReportDetails("");
      setReportReason("Spam / không liên quan");
    } catch (error) {
      console.error("Failed to create report:", error);
      setErrorMessage(tt("reportError"));
    } finally {
      setReporting(false);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!isAdmin) return;

    setDeletingPostId(postId);
    setErrorMessage(null);

    try {
      await deleteCommunityPost(postId);
      setCommentsByPost((current) => {
        const nextState = { ...current };
        delete nextState[postId];
        return nextState;
      });
      if (selectedPostId === postId) {
        setSelectedPostId(null);
      }
      await loadPosts();
    } catch (error) {
      console.error("Failed to delete post:", error);
      setErrorMessage(tt("deleteError"));
    } finally {
      setDeletingPostId(null);
    }
  };

  const renderCommentThread = (comment: CommunityComment, depth = 0): React.ReactNode => {
    const childReplies = repliesByParentId[comment.id] ?? [];
    const isReplying = replyTargetCommentId === comment.id;
    const isNested = depth > 0;

    return (
      <div
        key={comment.id}
        className={`rounded-[20px] border border-stone-200 px-4 py-4 ${
          isNested ? "bg-white" : "bg-stone-50"
        }`}
      >
        <div className="mb-2 flex items-center justify-between gap-3">
          <p className="text-sm font-bold text-slate-900">u/{comment.authorName}</p>
          <p className="text-[11px] text-slate-500">{relativeTime(comment.createdAt)}</p>
        </div>
        <p className={`${isNested ? "text-sm leading-6" : "text-sm leading-7"} text-slate-600`}>{comment.body}</p>
        <div className="mt-3">
          <button
            type="button"
            onClick={() => handleOpenReplyBox(comment.id)}
            className="rounded-full border border-sky-200 bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-sky-700"
          >
            {tt("reply")}
          </button>
        </div>

        {isReplying && (
          <div className="mt-3 rounded-2xl border border-stone-200 bg-white p-3">
            <textarea
              ref={replyInputRef}
              value={replyBody}
              onChange={(event) => setReplyBody(event.target.value)}
              rows={2}
              placeholder={`${tt("replyTo")} ${comment.authorName}...`}
              className="w-full resize-none rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-slate-900 outline-none"
            />
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => void handleReplySubmit(comment.id)}
                disabled={commenting}
                className="rounded-full bg-sky-500 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.12em] text-white disabled:cursor-not-allowed disabled:bg-stone-200 disabled:text-slate-400"
              >
                {commenting ? tt("sending") : tt("sendReply")}
              </button>
              <button
                type="button"
                onClick={() => {
                  setReplyTargetCommentId(null);
                  setReplyBody("");
                  setReplyMessage(null);
                }}
                className="rounded-full border border-stone-200 bg-stone-50 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-600"
              >
                {tt("cancel")}
              </button>
            </div>
            {replyMessage && (
              <div className={`mt-2 rounded-xl px-3 py-2 text-xs ${isSuccessMessage(replyMessage) ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                {replyMessage}
              </div>
            )}
          </div>
        )}

        {childReplies.length > 0 && (
          <div className="mt-4 space-y-3 border-l-2 border-stone-200 pl-4">
            {childReplies.map((reply) => renderCommentThread(reply, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,_#f4fbf4_0%,_#f8f3ea_48%,_#fffdf8_100%)] pt-28 pb-24 text-slate-900">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-8 grid gap-6 lg:grid-cols-[1.05fr_1.05fr] xl:grid-cols-[0.96fr_1.04fr]">
          <div className="overflow-hidden rounded-[36px] border border-emerald-200 bg-white shadow-[0_24px_80px_rgba(21,128,61,0.10)]">
            <div className="grid h-full gap-0 lg:grid-cols-[1.15fr_0.85fr]">
              <div className="p-7 md:p-8">
                <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.24em] text-emerald-700">
                  <Users className="h-3.5 w-3.5" /> {tt("communityHub")}
                </div>
                <h1 className="max-w-2xl font-[var(--font-headline)] text-3xl font-black leading-tight tracking-tight text-slate-900 md:text-5xl">
                  {tt("heroTitle")}
                </h1>
                <p className="mt-4 max-w-xl text-sm leading-7 text-slate-600 md:text-base">
                  {tt("heroDesc")}
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-2.5 text-sm text-slate-700">
                    <span className="font-bold text-slate-900">{posts.length}</span> {tt("postsShowing")}
                  </div>
                  <div className="rounded-2xl border border-orange-100 bg-orange-50 px-4 py-2.5 text-sm text-slate-700">
                    <span className="font-bold text-slate-900">{totalComments}</span> {tt("discussions")}
                  </div>
                  <div className="rounded-2xl border border-sky-100 bg-sky-50 px-4 py-2.5 text-sm text-slate-700">
                    <span className="font-bold text-slate-900">{categories.length - 1}</span> {tt("topicGroups")}
                  </div>
                </div>
              </div>

              <div className="relative min-h-[280px] bg-emerald-100">
                <img src={communityHeroImage} alt={tt("heroTitle")} className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/45 via-emerald-900/10 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 rounded-[24px] border border-white/35 bg-white/84 p-4 backdrop-blur-md">
                  <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-emerald-700">{tt("featuredThread")}</p>
                  <p className="mt-2 text-base font-black text-slate-900 md:text-lg">
                    {visiblePosts[0]?.title || tt("featuredFallbackTitle")}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {visiblePosts[0]?.body.slice(0, 110) || tt("featuredFallbackBody")}
                    {visiblePosts[0]?.body && visiblePosts[0].body.length > 120 ? "..." : ""}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={handleCreatePost} className="rounded-[36px] border border-stone-200 bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate-400">{tt("createPost")}</p>
                <h2 className="mt-2 text-2xl font-bold text-slate-900">{tt("newThread")}</h2>
              </div>
              <BadgePlus className="h-6 w-6 text-emerald-600" />
            </div>

            <div className="mb-5 overflow-hidden rounded-[28px] border border-stone-200">
              <img src={communitySupportImage} alt={tt("communityHub")} className="h-40 w-full object-cover" />
            </div>

            <div className="space-y-4">
              <input
                value={postForm.title}
                onChange={(event) => setPostForm((current) => ({ ...current, title: event.target.value }))}
                placeholder={tt("titlePlaceholder")}
                className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-400 focus:bg-white"
              />
              <textarea
                value={postForm.body}
                onChange={(event) => setPostForm((current) => ({ ...current, body: event.target.value }))}
                rows={5}
                placeholder={tt("bodyPlaceholder")}
                className="w-full resize-none rounded-[24px] border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-400 focus:bg-white"
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <select
                  value={postForm.category}
                  onChange={(event) =>
                    setPostForm((current) => ({ ...current, category: event.target.value as CommunityPost["category"] }))
                  }
                  className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-400 focus:bg-white"
                >
                  {categories.filter((category) => category !== "Tất cả").map((category) => (
                    <option key={category} value={category}>
                      {displayTerm(category)}
                    </option>
                  ))}
                </select>
                <input
                  value={postForm.tags}
                  onChange={(event) => setPostForm((current) => ({ ...current, tags: event.target.value }))}
                  placeholder={tt("tagPlaceholder")}
                  className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-400 focus:bg-white"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={posting}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-5 py-4 text-sm font-black uppercase tracking-[0.22em] text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:bg-stone-200 disabled:text-slate-400"
            >
              <Sparkles className="h-4 w-4" />
              {posting ? tt("posting") : user ? tt("submitPost") : tt("loginToPost")}
            </button>

            {postFormMessage && (
              <div className={`mt-3 rounded-2xl px-4 py-3 text-sm ${isSuccessMessage(postFormMessage) ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                {postFormMessage}
              </div>
            )}

            <div className="mt-4 rounded-2xl bg-stone-50 px-4 py-3 text-sm leading-6 text-slate-600">
              {tt("tip")}
            </div>
          </form>
        </div>

        <div className="mb-8 grid gap-4 rounded-[32px] border border-stone-200 bg-white p-4 shadow-[0_18px_50px_rgba(15,23,42,0.06)] lg:grid-cols-[1fr_auto_auto]">
          <label className="flex items-center gap-3 rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder={tt("searchPlaceholder")}
              className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
            />
          </label>

          <div className="flex items-center gap-2 overflow-x-auto rounded-2xl border border-stone-200 bg-stone-50 px-3 py-2">
            <Filter className="h-4 w-4 shrink-0 text-slate-400" />
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`shrink-0 rounded-xl px-3 py-2 text-xs font-bold uppercase tracking-[0.18em] transition ${
                  activeCategory === category ? "bg-emerald-500 text-white" : "text-slate-500 hover:bg-white hover:text-slate-900"
                }`}
              >
                {displayTerm(category)}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 rounded-2xl border border-stone-200 bg-stone-50 p-2">
            {sortOptions.map((option) => {
              const Icon = option.icon;
              return (
                <button
                  key={option.value}
                  onClick={() => setSortMode(option.value)}
                  className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold uppercase tracking-[0.18em] transition ${
                    sortMode === option.value ? "bg-orange-500 text-white" : "text-slate-500 hover:bg-white hover:text-slate-900"
                  }`}
                >
                  <Icon className="h-4 w-4" /> {tt(option.labelKey)}
                </button>
              );
            })}
          </div>
        </div>

        {errorMessage && (
          <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {errorMessage}
          </div>
        )}

        <div className="grid gap-8 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-5">
            {loadingPosts ? (
              <div className="rounded-[32px] border border-stone-200 bg-white p-8 text-slate-500">{tt("loadingCommunity")}</div>
            ) : visiblePosts.length === 0 ? (
              <div className="rounded-[32px] border border-stone-200 bg-white p-8 text-slate-500">
                {tt("noPosts")}
              </div>
            ) : (
              visiblePosts.map((post) => (
                <motion.div
                  key={post.id}
                  layout
                  className={`w-full rounded-[32px] border p-5 text-left transition ${
                    selectedPost?.id === post.id
                      ? "border-emerald-300 bg-emerald-50 shadow-[0_18px_50px_rgba(16,185,129,0.14)]"
                      : "border-stone-200 bg-white hover:border-emerald-200 hover:bg-emerald-50/40"
                  }`}
                >
                  <button onClick={() => void handleTogglePost(post.id)} className="flex w-full gap-4 text-left">
                    <div className="flex min-w-[74px] flex-col items-center rounded-[24px] border border-stone-200 bg-stone-50 px-3 py-4">
                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          void handleVote(post, 1);
                        }}
                        className={`rounded-xl p-2 transition ${post.userVote === 1 ? "bg-emerald-500 text-white" : "text-slate-500 hover:bg-white hover:text-slate-900"}`}
                      >
                        <ArrowUp className="h-4 w-4" />
                      </button>
                      <p className="my-2 text-lg font-black text-slate-900">{post.voteScore}</p>
                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          void handleVote(post, -1);
                        }}
                        className={`rounded-xl p-2 transition ${post.userVote === -1 ? "bg-rose-500 text-white" : "text-slate-500 hover:bg-white hover:text-slate-900"}`}
                      >
                        <ArrowDown className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="mb-3 flex flex-wrap items-center gap-2">
                        {post.isPinned && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-amber-700">
                            <Pin className="h-3 w-3" /> {tt("pinned")}
                          </span>
                        )}
                        <span className="rounded-full border border-stone-200 bg-stone-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-600">
                          {displayTerm(post.category)}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          u/{post.authorName} • {relativeTime(post.createdAt)}
                        </span>
                      </div>

                      <h2 className="text-2xl font-black leading-tight text-slate-900">{post.title}</h2>
                      <p className="mt-3 line-clamp-3 text-sm leading-7 text-slate-600">{post.body}</p>

                      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex flex-wrap gap-2">
                          {post.tags.map((tag) => (
                            <span key={tag} className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700">
                              #{tag}
                            </span>
                          ))}
                        </div>
                        <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                          <span>{post.upvoteCount} up</span>
                          <span>{post.downvoteCount} down</span>
                          <button
                            onClick={(event) => {
                              event.stopPropagation();
                              void handleOpenCommentComposer(post.id);
                            }}
                            className="inline-flex items-center gap-1 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-[10px] text-sky-700"
                          >
                            <MessageCircle className="h-4 w-4" /> {post.commentCount}
                          </button>
                          {isAdmin && (
                            <button
                              onClick={(event) => {
                                event.stopPropagation();
                                void handleDeletePost(post.id);
                              }}
                              className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-[10px] text-rose-700"
                            >
                              {deletingPostId === post.id ? tt("deletingShort") : tt("deletePost")}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>

                  {false && selectedPost?.id === post.id && (
                    <div className="mt-6 border-t border-stone-200 pt-6">
                      <div className="rounded-[28px] border border-stone-200 bg-white p-5">
                        <div className="mb-4 flex flex-wrap items-center gap-2">
                          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-700">
                            {tt("discussing")}
                          </span>
                          <span className="text-xs text-slate-500">
                            u/{post.authorName} • {relativeTime(post.createdAt)}
                          </span>
                        </div>

                        <h3 className="text-2xl font-black leading-tight text-slate-900">{post.title}</h3>
                        <p className="mt-4 text-sm leading-8 text-slate-600">{post.body}</p>

                        <div className="mt-4 flex flex-wrap gap-2">
                          {post.tags.map((tag) => (
                            <span key={tag} className="rounded-full border border-stone-200 bg-stone-50 px-2.5 py-0.5 text-[11px] text-slate-600">
                              #{tag}
                            </span>
                          ))}
                        </div>

                        <div className="mt-4 flex flex-wrap items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
                          <span className="rounded-full border border-stone-200 bg-stone-50 px-2.5 py-1">
                            {post.voteScore} {tt("points")}
                          </span>
                          <span className="rounded-full border border-stone-200 bg-stone-50 px-2.5 py-1">
                            {post.commentCount} {tt("comments")}
                          </span>
                          <span className="rounded-full border border-stone-200 bg-stone-50 px-2.5 py-1">
                            {post.upvoteCount} upvote
                          </span>
                        </div>

                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setReportPanelOpen((current) => !current)}
                            className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.1em] text-amber-800 transition hover:bg-amber-100"
                          >
                            {tt("report")}
                          </button>

                          {isAdmin && (
                            <button
                              type="button"
                              onClick={() => void handleDeletePost(post.id)}
                              disabled={deletingPostId === post.id}
                              className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.1em] text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {deletingPostId === post.id ? tt("deleting") : tt("deletePost")}
                            </button>
                          )}
                        </div>

                        {reportPanelOpen && (
                          <div className="mt-3 rounded-2xl border border-stone-200 bg-stone-50 p-3">
                            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">{tt("reportPost")}</p>
                            <div className="mt-2 grid gap-2 md:grid-cols-[0.9fr_1.1fr_auto]">
                              <select
                                value={reportReason}
                                onChange={(event) => setReportReason(event.target.value)}
                                className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs text-slate-900 outline-none"
                              >
                                {reportReasons.map((reason) => (
                                  <option key={reason} value={reason}>
                                    {displayTerm(reason)}
                                  </option>
                                ))}
                              </select>
                              <input
                                value={reportDetails}
                                onChange={(event) => setReportDetails(event.target.value)}
                                placeholder={tt("reportDetailsPlaceholder")}
                                className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs text-slate-900 outline-none"
                              />
                              <button
                                type="button"
                                onClick={() => void handleReportPost()}
                                disabled={!user || reporting}
                                className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {user ? (reporting ? tt("sending") : tt("sendReport")) : tt("login")}
                              </button>
                            </div>
                          </div>
                        )}

                        <div className="mt-4 rounded-2xl border border-sky-200 bg-sky-50 px-3 py-2 text-[11px] text-sky-800">
                          {tt("inlineCommentHint")}
                        </div>

                        <form onSubmit={handleCreateComment} className="mt-4">
                          <textarea
                            ref={commentInputRef}
                            value={commentForm}
                            onChange={(event) => setCommentForm(event.target.value)}
                            rows={2}
                            placeholder={tt("commentPlaceholder")}
                            className="w-full resize-none rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-emerald-400 focus:bg-white"
                          />
                          <button
                            type="submit"
                            disabled={commenting}
                            className="mt-2 inline-flex w-auto min-w-[140px] items-center justify-center gap-2 rounded-full bg-orange-500 px-4 py-2 text-[10px] font-black uppercase tracking-[0.12em] text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-stone-200 disabled:text-slate-400"
                          >
                            <Send className="h-4 w-4" />
                            {commenting ? tt("sending") : user ? tt("sendComment") : tt("loginToComment")}
                          </button>

                          {commentFormMessage && (
                            <div className={`mt-3 rounded-2xl px-4 py-3 text-sm ${isSuccessMessage(commentFormMessage) ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                              {commentFormMessage}
                            </div>
                          )}
                        </form>

                        <div className="mt-6 border-t border-stone-200 pt-6">
                          <div className="mb-4 flex items-center justify-between">
                            <h4 className="text-sm font-bold uppercase tracking-[0.18em] text-slate-600">{tt("comments")}</h4>
                            <span className="text-xs text-slate-500">{selectedComments.length} {tt("items")}</span>
                          </div>

                          <div className="space-y-3">
                            {loadingComments ? (
                              <div className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-4 text-sm text-slate-500">
                                {tt("loadingComments")}
                              </div>
                            ) : selectedComments.length === 0 ? (
                              <div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50 px-4 py-4 text-sm text-slate-500">
                                {tt("noComments")}
                              </div>
                            ) : (
                              rootComments.map((comment) => renderCommentThread(comment))
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              ))
            )}
          </div>

          <div className="space-y-6">
            <div className="overflow-hidden rounded-[36px] border border-stone-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
              <div className="relative h-40">
                <img src={communitySupportImage} alt={tt("communityHub")} className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-r from-slate-950/55 to-slate-900/10" />
                <div className="absolute inset-x-5 bottom-5 rounded-[24px] bg-white/85 px-4 py-3 backdrop-blur-md">
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-700">{tt("relatedPosts")}</p>
                  <p className="mt-1 text-sm text-slate-600">{tt("relatedDesc")}</p>
                </div>
              </div>

              <div className="p-6">
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-400">{tt("relatedToThread")}</p>
                <div className="mt-4 space-y-3">
                  {relatedPosts.length > 0 ? (
                    relatedPosts.map((post) => (
                      <button
                        key={post.id}
                        onClick={() => void handleTogglePost(post.id)}
                        className="w-full rounded-[24px] border border-stone-200 bg-stone-50 p-4 text-left transition hover:border-emerald-200 hover:bg-emerald-50/50"
                      >
                        <div className="mb-2 flex items-center gap-2">
                          <span className="rounded-full border border-stone-200 bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-600">
                            {displayTerm(post.category)}
                          </span>
                          <span className="text-[11px] text-slate-500">{relativeTime(post.createdAt)}</span>
                        </div>
                        <p className="text-base font-bold leading-6 text-slate-900">{post.title}</p>
                        <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">{post.body}</p>
                        <div className="mt-3 flex items-center gap-3 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
                          <span>{post.commentCount} {tt("comments")}</span>
                          <span>{post.voteScore} {tt("points")}</span>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="rounded-[24px] border border-dashed border-stone-300 bg-stone-50 p-4 text-sm text-slate-500">
                      {selectedPost ? tt("noRelated") : tt("pickPostForRelated")}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-[32px] border border-stone-200 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-400">{tt("trendingTags")}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {highlightedTags.length > 0 ? (
                  highlightedTags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => setSearchTerm(tag)}
                      className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
                    >
                      #{tag}
                    </button>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">{tt("noTags")}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {selectedPost && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[220] overflow-y-auto bg-slate-950/70 p-3 backdrop-blur-md md:p-5"
              onClick={(event) => {
                if (event.target === event.currentTarget) {
                  setSelectedPostId(null);
                  setReportPanelOpen(false);
                  setReplyTargetCommentId(null);
                }
              }}
            >
              <motion.div
                initial={{ y: 24, scale: 0.96 }}
                animate={{ y: 0, scale: 1 }}
                exit={{ y: 18, scale: 0.96 }}
                transition={{ type: "spring", damping: 26, stiffness: 280 }}
                className="mx-auto my-3 grid max-w-6xl overflow-hidden rounded-[28px] border border-white/10 bg-[#f5f6f3] shadow-[0_35px_110px_rgba(0,0,0,0.34)] lg:grid-cols-[minmax(0,1fr)_340px]"
                onClick={(event) => event.stopPropagation()}
              >
                <section className="min-w-0">
                  <div className="sticky top-0 z-10 flex items-start justify-between gap-4 bg-[#12251d] px-5 py-5 text-white md:px-7">
                    <div className="min-w-0">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <span className="rounded-full border border-white/12 bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-100">
                          {displayTerm(selectedPost.category)}
                        </span>
                        {selectedPost.isPinned && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-white/12 bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-amber-100">
                            <Pin className="h-3 w-3" /> {tt("pinned")}
                          </span>
                        )}
                        <span className="text-xs text-white/55">u/{selectedPost.authorName} • {relativeTime(selectedPost.createdAt)}</span>
                      </div>
                      <h2 className="line-clamp-2 max-w-3xl text-2xl font-black leading-tight tracking-normal text-white md:text-3xl">{formatThreadTitle(selectedPost.title)}</h2>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedPostId(null);
                        setReportPanelOpen(false);
                        setReplyTargetCommentId(null);
                      }}
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-white/76 transition hover:bg-white/16"
                      aria-label={tt("closePost")}
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="px-4 py-5 md:px-6">
                    <article className="overflow-hidden rounded-[24px] border border-stone-200 bg-white shadow-sm">
                      <div className="px-5 py-6 md:px-7">
                        <p className="whitespace-pre-line text-[16px] leading-9 text-slate-800">{selectedPost.body}</p>

                        <div className="mt-6 flex flex-wrap gap-2">
                          {selectedPost.tags.map((tag) => (
                            <span key={tag} className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-stone-200 bg-stone-50 px-5 py-3 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500 md:px-7">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 ring-1 ring-stone-200">{selectedPost.voteScore} {tt("points")}</span>
                          <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 ring-1 ring-stone-200">
                            <MessageCircle className="h-3.5 w-3.5" /> {selectedPost.commentCount} {tt("comments")}
                          </span>
                          <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 ring-1 ring-stone-200">
                            <ArrowUp className="h-3.5 w-3.5" /> {selectedPost.upvoteCount} upvote
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setReportPanelOpen((current) => !current)}
                            className="rounded-full border border-stone-200 bg-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.1em] text-slate-600 transition hover:bg-stone-100"
                          >
                            {tt("report")}
                          </button>

                          {isAdmin && (
                            <button
                              type="button"
                              onClick={() => void handleDeletePost(selectedPost.id)}
                              disabled={deletingPostId === selectedPost.id}
                              className="rounded-full border border-rose-200 bg-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.1em] text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {deletingPostId === selectedPost.id ? tt("deleting") : tt("deletePost")}
                            </button>
                          )}
                        </div>
                      </div>

                      {reportPanelOpen && (
                        <div className="m-5 rounded-2xl border border-stone-200 bg-stone-50 p-3 md:m-7">
                          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">{tt("reportPost")}</p>
                          <div className="mt-2 grid gap-2 md:grid-cols-[0.9fr_1.1fr_auto]">
                            <select
                              value={reportReason}
                              onChange={(event) => setReportReason(event.target.value)}
                              className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs text-slate-900 outline-none"
                            >
                              {reportReasons.map((reason) => (
                                <option key={reason} value={reason}>
                                  {displayTerm(reason)}
                                </option>
                              ))}
                            </select>
                            <input
                              value={reportDetails}
                              onChange={(event) => setReportDetails(event.target.value)}
                              placeholder={tt("reportDetailsPlaceholder")}
                              className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs text-slate-900 outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => void handleReportPost()}
                              disabled={!user || reporting}
                              className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {user ? (reporting ? tt("sending") : tt("sendReport")) : tt("login")}
                            </button>
                          </div>
                        </div>
                      )}
                    </article>

                    <form onSubmit={handleCreateComment} className="mt-5 rounded-[24px] border border-stone-200 bg-white p-4 shadow-sm">
                      <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-slate-500">{tt("commentPost")}</p>
                      <textarea
                        ref={commentInputRef}
                        value={commentForm}
                        onChange={(event) => setCommentForm(event.target.value)}
                        rows={3}
                        placeholder={tt("commentPlaceholder")}
                        className="w-full resize-none rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-400 focus:bg-white"
                      />
                      <button
                        type="submit"
                        disabled={commenting}
                        className="mt-3 inline-flex min-w-[150px] items-center justify-center gap-2 rounded-full bg-[#1f4d3a] px-5 py-2.5 text-[10px] font-black uppercase tracking-[0.12em] text-white transition hover:bg-[#183c2e] disabled:cursor-not-allowed disabled:bg-stone-200 disabled:text-slate-400"
                      >
                        <Send className="h-4 w-4" />
                        {commenting ? tt("sending") : user ? tt("sendComment") : tt("loginToComment")}
                      </button>
                      {commentFormMessage && (
                        <div className={`mt-3 rounded-2xl px-4 py-3 text-sm ${isSuccessMessage(commentFormMessage) ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                          {commentFormMessage}
                        </div>
                      )}
                    </form>

                    <div className="mt-5 rounded-[24px] border border-stone-200 bg-white p-5 shadow-sm">
                      <div className="mb-4 flex items-center justify-between">
                        <h3 className="text-sm font-bold uppercase tracking-[0.18em] text-slate-600">{tt("comments")}</h3>
                        <span className="text-xs text-slate-500">{selectedComments.length} {tt("items")}</span>
                      </div>
                      <div className="space-y-3">
                        {loadingComments ? (
                          <div className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-4 text-sm text-slate-500">{tt("loadingComments")}</div>
                        ) : selectedComments.length === 0 ? (
                          <div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50 px-4 py-4 text-sm text-slate-500">
                            {tt("noComments")}
                          </div>
                        ) : (
                          rootComments.map((comment) => renderCommentThread(comment))
                        )}
                      </div>
                    </div>
                  </div>
                </section>

                <aside className="border-t border-stone-200 bg-white p-5 lg:border-l lg:border-t-0">
                  <div className="rounded-[24px] border border-stone-200 bg-stone-50 p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-500">{tt("relatedPosts")}</p>
                    <p className="mt-2 text-xs leading-5 text-slate-500">{tt("sameTopic")}</p>
                  </div>
                  <div className="mt-4 space-y-3">
                    {relatedPosts.length > 0 ? (
                      relatedPosts.map((post) => (
                        <button
                          key={post.id}
                          onClick={() => void handleTogglePost(post.id)}
                          className="group w-full overflow-hidden rounded-[22px] border border-stone-200 bg-white text-left shadow-sm transition hover:border-emerald-200 hover:shadow-[0_14px_34px_rgba(15,23,42,0.08)]"
                        >
                          <div className="border-b border-stone-100 px-4 py-3">
                            <div className="flex items-center justify-between gap-3">
                              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.16em] text-emerald-700">{displayTerm(post.category)}</span>
                              <span className="text-[11px] text-slate-400">{relativeTime(post.createdAt)}</span>
                            </div>
                            <p className="mt-3 line-clamp-2 text-sm font-black leading-6 text-slate-900 group-hover:text-emerald-800">{formatThreadTitle(post.title)}</p>
                          </div>
                          <div className="flex items-center justify-between px-4 py-3 text-xs text-slate-500">
                            <span className="inline-flex items-center gap-1">
                              <MessageCircle className="h-3.5 w-3.5" /> {post.commentCount}
                            </span>
                            <span>{post.voteScore} {tt("points")}</span>
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="rounded-[22px] border border-dashed border-stone-300 bg-white p-4 text-sm text-slate-500">
                        {tt("noRelated")}
                      </div>
                    )}
                  </div>
                </aside>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ForumView;
