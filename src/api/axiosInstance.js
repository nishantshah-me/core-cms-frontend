// src/utils/axiosInstance.js
import axios from 'axios';

const axiosInstance = axios.create({
  timeout: 50000,
});

// Request interceptor → Attach Bearer token to every request
axiosInstance.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const accessToken = localStorage.getItem('token');
      if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor → Handle errors globally
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // 🔹 If Unauthorized (401) → session expired
    if (error?.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // Remove token & user info from localStorage
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      // Optional: Show session expired message
      alert('Your session has expired. Please log in again.');

      // Redirect to sign-in page
      if (typeof window !== 'undefined') {
        window.location.href = '/auth/jwt/sign-in';
      }
    }

    // 🔹 Handle timeout error
    if (error.code === 'ECONNABORTED') {
      console.error('Request timed out');
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
