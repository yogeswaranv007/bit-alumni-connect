import axiosClient from './axiosClient';

/**
 * REST API client for BIT Connect Private Messaging & Device Key Management.
 * All endpoints derive the authenticated sender from the JWT token.
 */
export const messageApi = {
  // ── Device Public Keys ────────────────────────────────────────────────────

  /**
   * Register or update client device public key.
   * @param {{ deviceId: string, publicKeyData?: string, publicKey?: string, algorithm?: string, keyAlgorithm?: string }} payload
   */
  registerDeviceKey: (payload) => {
    const body = {
      deviceId: payload.deviceId,
      publicKeyData: payload.publicKeyData || payload.publicKey,
      publicKey: payload.publicKey || payload.publicKeyData,
      algorithm: payload.algorithm || payload.keyAlgorithm || 'ECDH-P256',
    };
    return axiosClient.post('/messages/keys', body);
  },

  /**
   * Retrieve active public keys for target user.
   * @param {string} targetUserId UUID
   */
  getDeviceKeys: (targetUserId) => {
    return axiosClient.get(`/messages/keys/${targetUserId}`);
  },

  // ── Conversations ─────────────────────────────────────────────────────────

  /**
   * Start or retrieve existing 1-to-1 conversation with canonical participant ordering.
   * @param {string} recipientId UUID
   */
  createOrGetConversation: (recipientId) => {
    return axiosClient.post('/messages/conversations', {
      recipientUserId: recipientId,
      recipientId: recipientId,
    });
  },

  /**
   * List paginated conversations for current user with unread counts.
   * @param {number} [page=0]
   * @param {number} [size=20]
   */
  getMyConversations: (page = 0, size = 20) => {
    return axiosClient.get('/messages/conversations', {
      params: { page, size },
    });
  },

  /**
   * Get single conversation details.
   * @param {string} conversationId UUID
   */
  getConversationDetails: (conversationId) => {
    return axiosClient.get(`/messages/conversations/${conversationId}`);
  },

  // ── Encrypted Messages ────────────────────────────────────────────────────

  /**
   * Fetch paginated chronological message history for a conversation.
   * @param {string} conversationId UUID
   * @param {number} [page=0]
   * @param {number} [size=50]
   */
  getMessages: (conversationId, page = 0, size = 50) => {
    return axiosClient.get(`/messages/conversations/${conversationId}/messages`, {
      params: { page, size },
    });
  },

  /**
   * Send encrypted message payload + IV. Server never receives plaintext.
   * @param {string} conversationId UUID
   * @param {{ encryptedPayload: string, iv: string }} payload
   */
  sendMessage: (conversationId, payload) => {
    return axiosClient.post(`/messages/conversations/${conversationId}/messages`, payload);
  },

  /**
   * Mark all unread messages in a conversation as read.
   * @param {string} conversationId UUID
   */
  markAsRead: (conversationId) => {
    return axiosClient.patch(`/messages/conversations/${conversationId}/read`);
  },

  // ── Blocking & Abuse Prevention ───────────────────────────────────────────

  /**
   * Block participant in conversation.
   * @param {string} conversationId UUID
   * @param {string} [reason]
   */
  blockUser: (conversationId, reason = '') => {
    return axiosClient.post(`/messages/conversations/${conversationId}/block`, { reason });
  },

  /**
   * Unblock participant in conversation.
   * @param {string} conversationId UUID
   */
  unblockUser: (conversationId) => {
    return axiosClient.post(`/messages/conversations/${conversationId}/unblock`);
  },
};
