import axiosClient from './axiosClient';

export const studentApi = {
  // Student profile
  createProfile:  (data) => axiosClient.post('/student/profile', data),
  getMyProfile:   ()     => axiosClient.get('/student/profile/me'),
  updateMyProfile:(data) => axiosClient.put('/student/profile/me', data),

  // Digital ID (available after approval only)
  getMyDigitalId:   ()   => axiosClient.get('/student/virtual-id/me'),
  regenerateQrToken:()   => axiosClient.post('/student/virtual-id/regenerate-qr'),

  // Public verification (unauthenticated)
  verifyToken: (token) => axiosClient.get(`/verify/student/${token}`),
};

export const adminStudentApi = {
  // Admin: student registration management
  getStudentRegistrations: (params) => axiosClient.get('/admin/student-registrations', { params }),
  getStudentRegistrationById: (id)  => axiosClient.get(`/admin/student-registrations/${id}`),
  approveStudentRegistration: (id)  => axiosClient.patch(`/admin/student-registrations/${id}/approve`),
  rejectStudentRegistration:  (id, reason) => axiosClient.patch(`/admin/student-registrations/${id}/reject`, { reason }),
};
