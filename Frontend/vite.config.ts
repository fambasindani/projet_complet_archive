import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Migration CRA -> Vite
// - base /archive/ (comme le déploiement existant, homepage "/archive")
// - sortie dans build/ (comme avant)
export default defineConfig({
  base: '/archive/',
  plugins: [react()],
  server: {
    host: true,
    port: 3000,
    strictPort: true,
  },
  preview: {
    port: 3000,
    strictPort: true,
  },
  build: {
    outDir: 'build',
    sourcemap: false,
  },
  optimizeDeps: {
    // Dynamic Web TWAIN (dwt) charge ses ressources globalement.
    exclude: ['dwt'],
  },
});
