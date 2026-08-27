// @ts-nocheck
// Config centralisée - priorité REACT_APP_API_URL > hostname fallback
export const API_BASE_URL: string =
  (typeof process !== 'undefined' && (process.env as any).REACT_APP_API_URL) ||
  (() => {
    const h = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
    if (h === '192.168.1.102') return 'http://192.168.1.102:8190/api';
    if (h === 'localhost' || h === '127.0.0.1') return 'http://127.0.0.1:8000/api';
    return 'http://127.0.0.1:8000/api';
  })();
