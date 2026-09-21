import axiosClient from './axiosClient';

export const virtualIdApi = {
  getMyVirtualId: () => axiosClient.get('/alumni/virtual-id/me'),
  verifyPublicToken: (token) => axiosClient.get(`/verify/${token}`),
};
