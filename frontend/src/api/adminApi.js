import axiosClient from './axiosClient';

export const adminApi = {
  getAlumniProfiles: (params) => axiosClient.get('/admin/alumni', { params }),
  getAlumniProfileById: (id) => axiosClient.get(`/admin/alumni/${id}`),
  verifyAlumniProfile: (id) => axiosClient.patch(`/admin/alumni/${id}/verify`),
  rejectAlumniProfile: (id, reason) => axiosClient.patch(`/admin/alumni/${id}/reject`, { reason }),
  getVirtualIdByAlumniId: (alumniProfileId) => axiosClient.get(`/admin/virtual-ids/${alumniProfileId}`),
  updateVirtualIdStatus: (id, status) => axiosClient.patch(`/admin/virtual-ids/${id}/status`, { status }),
  regenerateVirtualIdQr: (id) => axiosClient.post(`/admin/virtual-ids/${id}/regenerate-qr`),
};
