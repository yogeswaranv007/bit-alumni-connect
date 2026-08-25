import axiosClient from './axiosClient';

export const virtualIdApi = {
  getMyVirtualId: () => axiosClient.get('/alumni/virtual-id/me'),
  regenerateMyQr: () => axiosClient.post('/alumni/virtual-id/regenerate-qr'),
  verifyPublicToken: (token) => axiosClient.get(`/verify/${token}`),
};
