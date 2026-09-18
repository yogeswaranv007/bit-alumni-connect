import axiosClient from './axiosClient';

export const campusVisitApi = {
  // Alumni endpoints
  createVisit: (data) =>
    axiosClient.post('/alumni/campus-visits', data),

  getMyVisits: (params) =>
    axiosClient.get('/alumni/campus-visits', { params }),

  getVisitById: (id) =>
    axiosClient.get(`/alumni/campus-visits/${id}`),

  updateVisit: (id, data) =>
    axiosClient.put(`/alumni/campus-visits/${id}`, data),

  cancelVisit: (id, reason) =>
    axiosClient.patch(`/alumni/campus-visits/${id}/cancel`, { reason }),

  getAvailableEvents: () =>
    axiosClient.get('/alumni/campus-visits/available-events'),

  checkInAtGate: (gate) =>
    axiosClient.post('/alumni/campus-visits/gate-checkin', { gate: gate || 'Main Gate' }),

  // Faculty endpoints
  getFacultyVisits: (params) =>
    axiosClient.get('/faculty/campus-visits', { params }),

  getFacultyPendingVisits: () =>
    axiosClient.get('/faculty/campus-visits/pending'),

  getFacultyVisitById: (id) =>
    axiosClient.get(`/faculty/campus-visits/${id}`),

  approveFacultyVisit: (id, data) =>
    axiosClient.patch(`/faculty/campus-visits/${id}/approve`, data),

  rejectFacultyVisit: (id, data) =>
    axiosClient.patch(`/faculty/campus-visits/${id}/reject`, data),

  // Admin endpoints
  getAdminVisits: (params) =>
    axiosClient.get('/admin/campus-visits', { params }),

  getAdminVisitStats: () =>
    axiosClient.get('/admin/campus-visits/stats'),

  getAdminVisitById: (id) =>
    axiosClient.get(`/admin/campus-visits/${id}`),

  approveAdminVisit: (id, data) =>
    axiosClient.patch(`/admin/campus-visits/${id}/approve`, data),

  rejectAdminVisit: (id, data) =>
    axiosClient.patch(`/admin/campus-visits/${id}/reject`, data),

  updateAdminVisitStatus: (id, data) =>
    axiosClient.patch(`/admin/campus-visits/${id}/status`, data),

  scheduleAdminVisit: (id, data) =>
    axiosClient.patch(`/admin/campus-visits/${id}/schedule`, data),

  getDepartments: () =>
    axiosClient.get('/departments'),

  // Admin Entry Logs
  getAdminEntryLogs: (params) =>
    axiosClient.get('/admin/campus-entry-logs', { params }),

  getAdminEntryLogDetail: (id) =>
    axiosClient.get(`/admin/campus-entry-logs/${id}`),

  // Admin RFID Mappings
  getAdminRfidMappings: (params) =>
    axiosClient.get('/admin/rfid-mappings', { params }),

  createAdminRfidMapping: (data) =>
    axiosClient.post('/admin/rfid-mappings', data),

  updateAdminRfidStatus: (id, data) =>
    axiosClient.patch(`/admin/rfid-mappings/${id}/status`, data),
};
