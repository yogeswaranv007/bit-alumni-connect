import axiosClient from './axiosClient';

export const authApi = {
  // General login — Admin, Watchman, Faculty internal routes
  login: (credentials) => axiosClient.post('/auth/login', credentials),

  // Role-scoped portal logins
  loginStudent: (credentials) => axiosClient.post('/auth/login/student', credentials),
  loginAlumni: (credentials) => axiosClient.post('/auth/login/alumni', credentials),

  // Registration with institutional verification
  registerAlumni: (userData) => axiosClient.post('/auth/register', userData),
  registerStudent: (userData) => axiosClient.post('/auth/register/student', userData),

  getCurrentUser: () => axiosClient.get('/auth/me'),
};
