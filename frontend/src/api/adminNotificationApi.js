import axiosClient from './axiosClient';

export const adminNotificationApi = {
  getPendingSummary: () => axiosClient.get('/admin/pending-summary'),
};

export default adminNotificationApi;
