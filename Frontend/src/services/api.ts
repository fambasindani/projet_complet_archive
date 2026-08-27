/**
 * Instance Axios centralisée - remplace tous les `axios` + `API_BASE_URL` dispersés
 * - baseURL depuis VITE_API_URL (Vite) ou fallback hostname (compat CRA)
 * - Intercepteur Authorization Bearer automatique
 * - Intercepteur 401 → clear storage + redirect /login
 */
import axios from 'axios';

// Résolution baseURL : Vite env > CRA env > hostname sniffing (legacy)
function resolveBaseURL(): string {
  // Vite
  // @ts-ignore
  const viteUrl = typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_URL;
  if (viteUrl) return viteUrl as string;

  // CRA (process.env)
  // @ts-ignore
  if (typeof process !== 'undefined' && (process as any).env?.REACT_APP_API_URL) {
    // @ts-ignore
    return (process as any).env.REACT_APP_API_URL as string;
  }

  const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
  if (hostname === '192.168.1.102') return 'http://192.168.1.102:8190/api';
  if (hostname === 'localhost' || hostname === '127.0.0.1') return 'http://127.0.0.1:8000/api';
  return 'http://127.0.0.1:8000/api';
}

export const API_BASE_URL = resolveBaseURL();

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  timeout: 30000,
});

// Request : injecte token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response : 401 global handler
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Éviter boucle si déjà sur login
      const isLogin = window.location.pathname.includes('/login') || window.location.pathname === '/' || window.location.pathname === '/archive';
      if (!isLogin) {
        localStorage.removeItem('token');
        localStorage.removeItem('utilisateur');
        // CRA basename /archive
        const base = (window as any).__BASENAME__ || '/archive';
        window.location.href = `${base}/`;
      }
    }
    return Promise.reject(error);
  }
);

export default api;
