// @ts-nocheck
// Instance Axios centralisée — lit API_BASE_URL depuis config.ts (qui vient de .env)
import axios from 'axios';
import { API_BASE_URL } from '../config';

export { API_BASE_URL };

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  timeout: 30000,
});

// Request : injecte le token Bearer
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response : 401 global → nettoyage + redirect login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const path = window.location.pathname;
      const isLogin = path.includes('/login') || path === '/' || path === '/archive';
      if (!isLogin) {
        localStorage.removeItem('token');
        localStorage.removeItem('utilisateur');
        const base = (window as any).__BASENAME__ || '/archive';
        window.location.href = `${base}/`;
      }
    }
    return Promise.reject(error);
  }
);

export default api;
