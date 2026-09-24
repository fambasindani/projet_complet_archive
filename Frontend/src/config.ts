// @ts-nocheck
// Configuration centralisée (Vite). Les valeurs viennent des fichiers .env
// (.env.development pour `npm run dev`, .env.production pour `npm run build`).

export const API_BASE_URL: string = import.meta.env.VITE_API_URL;

export const SCANNER_URL: string =
  import.meta.env.VITE_SCANNER_URL || 'http://localhost:8081';

export const SCANNER_SERVICE_URL: string =
  import.meta.env.VITE_SCANNER_SERVICE_URL || 'http://localhost:9000';

export const OCR_URL: string =
  import.meta.env.VITE_OCR_URL || 'http://localhost:5000';

console.log('🔗 API_BASE_URL (config.ts):', API_BASE_URL);
