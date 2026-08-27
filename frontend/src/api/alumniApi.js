import axiosClient from './axiosClient';

export const alumniApi = {
  getDepartments: () => axiosClient.get('/departments'),
  getDepartmentById: (id) => axiosClient.get(`/departments/${id}`),
  createProfile: (profileData) => axiosClient.post('/alumni/profile', profileData),
  getMyProfile: () => axiosClient.get('/alumni/profile/me'),
  updateMyProfile: (profileData) => axiosClient.put('/alumni/profile/me', profileData),
  searchDirectory: (params) => axiosClient.get('/alumni/directory', { params }),
};
