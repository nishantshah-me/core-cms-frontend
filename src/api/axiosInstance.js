import axios from 'axios';
import { refreshAccessToken, signOut } from 'src/auth/services/authService';

const axiosInstance = axios.create({
  timeout: 50000,
});

// Request interceptor → Attach Bearer token
axiosInstance.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const accessToken = localStorage.getItem('access_token'); // updated key
      if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor → Handle 401
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // 🔹 If Unauthorized (401) → try refresh
    if (error?.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const newAccessToken = await refreshAccessToken();

        if (newAccessToken) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return axiosInstance(originalRequest); // retry original request
        }
      } catch (refreshError) {
        console.error('Refresh token failed:', refreshError);

        // Cleanup + redirect to login
        signOut();
        if (typeof window !== 'undefined') {
          window.location.href = '/auth/jwt/sign-in';
        }
      }
    }

    if (error.code === 'ECONNABORTED') {
      console.error('Request timed out');
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
