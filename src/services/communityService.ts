import { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import {
  CommunityComment,
  CommunityCommentActivity,
  CommunityNotification,
  CommunityNotificationType,
  CommunityPost,
  CommunityReport,
  CommunityReportStatus,
  CommunitySortMode,
} from "../types";

type PostRow = {
  id: string;
  author_id: string;
  author_name: string;
  title: string;
  body: string;
  category: CommunityPost["category"];
  tags: string[] | null;
  created_at: string;
  updated_at: string;
  vote_score: number | null;
  upvote_count: number | null;
  downvote_count: number | null;
  comment_count: number | null;
  is_pinned: boolean | null;
};

type CommentRow = {
  id: string;
  post_id: string;
  parent_comment_id: string | null;
  author_id: string;
  author_name: string;
  body: string;
  created_at: string;
};

type VoteRow = {
  post_id: string;
  value: -1 | 1;
};

type ReportRow = {
  id: string;
  post_id: string;
  post_title: string;
  reporter_id: string;
  reporter_name: string;
  reason: string;
  details: string | null;
  status: CommunityReportStatus;
  created_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
};

type NotificationRow = {
  id: string;
  user_id: string;
  type: CommunityNotificationType;
  title: string;
  message: string;
  post_id: string | null;
  comment_id: string | null;
  is_read: boolean | null;
  created_at: string;
};

const requireSupabase = () => {
  if (!supabase) {
    throw new Error("Supabase chưa được cấu hình.");
  }

  return supabase;
};

const mapPost = (post: PostRow, userVote = 0): CommunityPost => ({
  id: post.id,
  authorId: post.author_id,
  authorName: post.author_name,
  title: post.title,
  body: post.body,
  category: post.category,
  tags: post.tags ?? [],
  createdAt: post.created_at,
  updatedAt: post.updated_at,
  voteScore: post.vote_score ?? 0,
  upvoteCount: post.upvote_count ?? 0,
  downvoteCount: post.downvote_count ?? 0,
  commentCount: post.comment_count ?? 0,
  userVote: userVote as -1 | 0 | 1,
  isPinned: Boolean(post.is_pinned),
});

const mapComment = (comment: CommentRow): CommunityComment => ({
  id: comment.id,
  postId: comment.post_id,
  parentCommentId: comment.parent_comment_id,
  authorId: comment.author_id,
  authorName: comment.author_name,
  body: comment.body,
  createdAt: comment.created_at,
});

const mapReport = (report: ReportRow): CommunityReport => ({
  id: report.id,
  postId: report.post_id,
  postTitle: report.post_title,
  reporterId: report.reporter_id,
  reporterName: report.reporter_name,
  reason: report.reason,
  details: report.details,
  status: report.status,
  createdAt: report.created_at,
  reviewedAt: report.reviewed_at,
  reviewedBy: report.reviewed_by,
});

const mapNotification = (notification: NotificationRow): CommunityNotification => ({
  id: notification.id,
  userId: notification.user_id,
  type: notification.type,
  title: notification.title,
  message: notification.message,
  postId: notification.post_id,
  commentId: notification.comment_id,
  isRead: Boolean(notification.is_read),
  createdAt: notification.created_at,
});

export const listCommunityPosts = async ({
  userId,
  sort = "hot",
}: {
  userId?: string;
  sort?: CommunitySortMode;
} = {}) => {
  const client = requireSupabase();

  const postQuery =
    sort === "new"
      ? client
          .from("community_posts")
          .select("id, author_id, author_name, title, body, category, tags, created_at, updated_at, vote_score, upvote_count, downvote_count, comment_count, is_pinned")
          .order("is_pinned", { ascending: false })
          .order("created_at", { ascending: false })
      : sort === "top"
        ? client
            .from("community_posts")
            .select("id, author_id, author_name, title, body, category, tags, created_at, updated_at, vote_score, upvote_count, downvote_count, comment_count, is_pinned")
            .order("is_pinned", { ascending: false })
            .order("vote_score", { ascending: false })
            .order("comment_count", { ascending: false })
            .order("created_at", { ascending: false })
        : client
            .from("community_posts")
            .select("id, author_id, author_name, title, body, category, tags, created_at, updated_at, vote_score, upvote_count, downvote_count, comment_count, is_pinned")
            .order("is_pinned", { ascending: false })
            .order("vote_score", { ascending: false })
            .order("created_at", { ascending: false });

  const votesQuery = userId
    ? client.from("community_votes").select("post_id, value").eq("user_id", userId)
    : Promise.resolve({ data: [] as VoteRow[], error: null });

  const [{ data: posts, error: postsError }, { data: votes, error: votesError }] = await Promise.all([postQuery.returns<PostRow[]>(), votesQuery]);

  if (postsError) throw postsError;
  if (votesError) throw votesError;

  const votesMap = new Map((votes ?? []).map((vote) => [vote.post_id, vote.value]));
  return (posts ?? []).map((post) => mapPost(post, (votesMap.get(post.id) ?? 0) as -1 | 0 | 1));
};

export const listCommunityComments = async (postId: string) => {
  const client = requireSupabase();
  const { data, error } = await client
    .from("community_comments")
    .select("id, post_id, parent_comment_id, author_id, author_name, body, created_at")
    .eq("post_id", postId)
    .order("created_at", { ascending: true })
    .returns<CommentRow[]>();

  if (error) throw error;
  return (data ?? []).map(mapComment);
};

export const listCommunityPostsByAuthor = async (authorId: string) => {
  const client = requireSupabase();
  const { data, error } = await client
    .from("community_posts")
    .select("id, author_id, author_name, title, body, category, tags, created_at, updated_at, vote_score, upvote_count, downvote_count, comment_count, is_pinned")
    .eq("author_id", authorId)
    .order("created_at", { ascending: false })
    .returns<PostRow[]>();

  if (error) throw error;
  return (data ?? []).map((post) => mapPost(post));
};

export const listCommunityCommentsByAuthor = async (authorId: string): Promise<CommunityCommentActivity[]> => {
  const client = requireSupabase();
  const { data: comments, error: commentsError } = await client
    .from("community_comments")
    .select("id, post_id, parent_comment_id, author_id, author_name, body, created_at")
    .eq("author_id", authorId)
    .order("created_at", { ascending: false })
    .returns<CommentRow[]>();

  if (commentsError) throw commentsError;

  const postIds = Array.from(new Set((comments ?? []).map((comment) => comment.post_id)));

  if (postIds.length === 0) {
    return [];
  }

  const { data: posts, error: postsError } = await client
    .from("community_posts")
    .select("id, title, author_name")
    .in("id", postIds)
    .returns<Array<Pick<PostRow, "id" | "title" | "author_name">>>();

  if (postsError) throw postsError;

  const postsMap = new Map((posts ?? []).map((post) => [post.id, post]));

  return (comments ?? []).map((comment) => {
    const post = postsMap.get(comment.post_id);
    return {
      ...mapComment(comment),
      postTitle: post?.title ?? "Bài viết không còn tồn tại",
      postAuthorName: post?.author_name ?? "Ẩn danh",
    };
  });
};

export const createCommunityPost = async ({
  authorId,
  authorName,
  title,
  body,
  category,
  tags,
}: {
  authorId: string;
  authorName: string;
  title: string;
  body: string;
  category: CommunityPost["category"];
  tags: string[];
}) => {
  const client = requireSupabase();
  const { error } = await client.from("community_posts").insert({
    author_id: authorId,
    author_name: authorName,
    title: title.trim(),
    body: body.trim(),
    category,
    tags,
  });

  if (error) throw error;
};

export const createCommunityComment = async ({
  postId,
  parentCommentId,
  authorId,
  authorName,
  body,
}: {
  postId: string;
  parentCommentId?: string | null;
  authorId: string;
  authorName: string;
  body: string;
}) => {
  const client = requireSupabase();
  const { error } = await client.from("community_comments").insert({
    post_id: postId,
    parent_comment_id: parentCommentId ?? null,
    author_id: authorId,
    author_name: authorName,
    body: body.trim(),
  });

  if (error) throw error;
};

export const deleteCommunityPost = async (postId: string) => {
  const client = requireSupabase();
  const { error } = await client.from("community_posts").delete().eq("id", postId);
  if (error) throw error;
};

export const setCommunityVote = async ({
  postId,
  userId,
  value,
}: {
  postId: string;
  userId: string;
  value: -1 | 0 | 1;
}) => {
  const client = requireSupabase();

  if (value === 0) {
    const { error } = await client.from("community_votes").delete().eq("post_id", postId).eq("user_id", userId);
    if (error) throw error;
    return;
  }

  const { error } = await client.from("community_votes").upsert(
    {
      post_id: postId,
      user_id: userId,
      value,
    },
    { onConflict: "post_id,user_id" }
  );

  if (error) throw error;
};

export const createCommunityReport = async ({
  postId,
  postTitle,
  reporterId,
  reporterName,
  reason,
  details,
}: {
  postId: string;
  postTitle: string;
  reporterId: string;
  reporterName: string;
  reason: string;
  details?: string;
}) => {
  const client = requireSupabase();
  const { error } = await client.from("community_reports").insert({
    post_id: postId,
    post_title: postTitle,
    reporter_id: reporterId,
    reporter_name: reporterName,
    reason: reason.trim(),
    details: details?.trim() || null,
  });

  if (error) throw error;
};

export const listCommunityReports = async () => {
  const client = requireSupabase();
  const { data, error } = await client
    .from("community_reports")
    .select("id, post_id, post_title, reporter_id, reporter_name, reason, details, status, created_at, reviewed_at, reviewed_by")
    .order("created_at", { ascending: false })
    .returns<ReportRow[]>();

  if (error) throw error;
  return (data ?? []).map(mapReport);
};

export const updateCommunityReportStatus = async ({
  reportId,
  status,
  reviewerId,
}: {
  reportId: string;
  status: CommunityReportStatus;
  reviewerId: string;
}) => {
  const client = requireSupabase();
  const { error } = await client
    .from("community_reports")
    .update({
      status,
      reviewed_at: new Date().toISOString(),
      reviewed_by: reviewerId,
    })
    .eq("id", reportId);

  if (error) throw error;
};

export const listCommunityNotifications = async (userId: string) => {
  const client = requireSupabase();
  const { data, error } = await client
    .from("community_notifications")
    .select("id, user_id, type, title, message, post_id, comment_id, is_read, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(20)
    .returns<NotificationRow[]>();

  if (error) throw error;
  return (data ?? []).map(mapNotification);
};

export const markCommunityNotificationRead = async (notificationId: string) => {
  const client = requireSupabase();
  const { error } = await client.from("community_notifications").update({ is_read: true }).eq("id", notificationId);
  if (error) throw error;
};

export const markAllCommunityNotificationsRead = async (userId: string) => {
  const client = requireSupabase();
  const { error } = await client.from("community_notifications").update({ is_read: true }).eq("user_id", userId).eq("is_read", false);
  if (error) throw error;
};

export const subscribeToCommunityChanges = (onChange: () => void): RealtimeChannel => {
  const client = requireSupabase();

  return client
    .channel(`community-feed-${Math.random().toString(36).slice(2)}`)
    .on("postgres_changes", { event: "*", schema: "public", table: "community_posts" }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "community_comments" }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "community_votes" }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "community_reports" }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "community_notifications" }, onChange)
    .subscribe();
};

export const subscribeToUserNotifications = (userId: string, onChange: () => void): RealtimeChannel => {
  const client = requireSupabase();

  return client
    .channel(`community-notifications-${userId}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "community_notifications", filter: `user_id=eq.${userId}` },
      onChange
    )
    .subscribe();
};

export const unsubscribeFromCommunityChanges = async (channel: RealtimeChannel) => {
  const client = requireSupabase();
  await client.removeChannel(channel);
};
