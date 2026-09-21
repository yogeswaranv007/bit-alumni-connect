import axiosClient from './axiosClient';

export const notificationApi = {
  getNotifications: ({ page = 0, size = 20, isRead = null } = {}) => {
    const params = { page, size };
    if (isRead !== null && isRead !== undefined) {
      params.isRead = isRead;
    }
    return axiosClient.get('/notifications', { params });
  },

  getRecentNotifications: (limit = 8) =>
    axiosClient.get('/notifications/recent', { params: { limit } }),

  getUnreadCount: () =>
    axiosClient.get('/notifications/unread-count'),

  markAsRead: (id) =>
    axiosClient.patch(`/notifications/${id}/read`),

  markAllAsRead: () =>
    axiosClient.patch('/notifications/read-all'),
};

export default notificationApi;
