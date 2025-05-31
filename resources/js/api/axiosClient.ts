// src/api/axiosClient.ts
import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    Accept: 'application/json',
  },
});
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      console.warn('Sesión expirada. Redirigiendo al login...');
    }
    return Promise.reject(error);
  }
);

export default api;
