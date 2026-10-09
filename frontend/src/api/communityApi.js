import axiosClient from './axiosClient';

/**
 * API client for the BIT Connect Community Forum.
 * All endpoints require an authenticated session.
 * Base path: /api/v1/community
 */
export const communityApi = {
  // ─── Posts ─────────────────────────────────────────────────────────────────

  /** Create a new community post */
  createPost: (data) =>
    axiosClient.post('/community/posts', data),

  /** List posts with optional filters: contentType, departmentId, keyword, page, size */
  getPosts: (params) =>
    axiosClient.get('/community/posts', { params }),

  /** Get a single post by ID (increments view count) */
  getPostById: (postId) =>
    axiosClient.get(`/community/posts/${postId}`),

  /** Update own post */
  updatePost: (postId, data) =>
    axiosClient.put(`/community/posts/${postId}`, data),

  /** Soft-delete own post */
  deletePost: (postId) =>
    axiosClient.delete(`/community/posts/${postId}`),

  /** Toggle upvote on a post */
  togglePostUpvote: (postId) =>
    axiosClient.post(`/community/posts/${postId}/upvote`),

  // ─── Replies ───────────────────────────────────────────────────────────────

  /** Add a reply to a post */
  createReply: (postId, data) =>
    axiosClient.post(`/community/posts/${postId}/replies`, data),

  /** Get top-level replies for a post */
  getReplies: (postId, params) =>
    axiosClient.get(`/community/posts/${postId}/replies`, { params }),

  /** Update own reply body */
  updateReply: (replyId, body) =>
    axiosClient.put(`/community/replies/${replyId}`, body, {
      headers: { 'Content-Type': 'text/plain' },
    }),

  /** Soft-delete own reply */
  deleteReply: (replyId) =>
    axiosClient.delete(`/community/replies/${replyId}`),

  /** Toggle upvote on a reply */
  toggleReplyUpvote: (replyId) =>
    axiosClient.post(`/community/replies/${replyId}/upvote`),

  // ─── Question resolution ────────────────────────────────────────────────────

  /** Accept a reply as the best answer (question author only) */
  acceptReply: (postId, replyId) =>
    axiosClient.post(`/community/posts/${postId}/accept-reply/${replyId}`),

  // ─── Admin moderation ──────────────────────────────────────────────────────

  pinPost: (postId) =>
    axiosClient.patch(`/community/posts/${postId}/pin`),

  unpinPost: (postId) =>
    axiosClient.patch(`/community/posts/${postId}/unpin`),

  hidePost: (postId, reason) =>
    axiosClient.patch(`/community/posts/${postId}/hide`, null, { params: { reason } }),

  hideReply: (replyId, reason) =>
    axiosClient.patch(`/community/replies/${replyId}/hide`, null, { params: { reason } }),

  verifyOpportunity: (postId) =>
    axiosClient.patch(`/community/posts/${postId}/verify-opportunity`),

  unverifyOpportunity: (postId) =>
    axiosClient.patch(`/community/posts/${postId}/unverify-opportunity`),
};
