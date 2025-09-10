// src/api/apiClient.js
import axiosInstance from './axiosInstance';

export async function apiClient({ method = 'GET', url, data = {}, params = {}, headers = {} }) {
  try {
    const response = await axiosInstance({
      method,
      url,
      data,
      params,
      headers,
    });
    // return the body (axios returns {data, status, ...}, here we return response.data)
    return response.data;
  } catch (error) {
    // bubble up a useful error
    const payload = error?.response?.data || error?.message || error;
    throw payload;
  }
}
