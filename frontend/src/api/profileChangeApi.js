import axiosClient from './axiosClient';

export const profileChangeApi = {
  // Alumni endpoints
  createChangeRequest: (data) => axiosClient.post('/alumni/profile/change-requests', data),
  getMyChangeRequests: () => axiosClient.get('/alumni/profile/change-requests'),
  getChangeRequestById: (id) => axiosClient.get(`/alumni/profile/change-requests/${id}`),
  updateChangeRequest: (id, data) => axiosClient.put(`/alumni/profile/change-requests/${id}`, data),
  resubmitChangeRequest: (id) => axiosClient.post(`/alumni/profile/change-requests/${id}/resubmit`),

  // Admin endpoints
  searchAdminChangeRequests: (params) => axiosClient.get('/admin/profile-change-requests', { params }),
  getAdminChangeRequestDetail: (id) => axiosClient.get(`/admin/profile-change-requests/${id}`),
  approveChangeRequest: (id, comment) =>
    axiosClient.patch(`/admin/profile-change-requests/${id}/approve`, null, {
      params: comment ? { comment } : {},
    }),
  rejectChangeRequest: (id, data) =>
    axiosClient.patch(`/admin/profile-change-requests/${id}/reject`, data),
};
