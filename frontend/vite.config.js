import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';

export default defineConfig({
  plugins: [
    react(),
    svgr(), // Enable SVG as React components
  ],
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true, // Zatrzymaj, jeśli port 5000 jest zajęty
    proxy: {
      '/api': {
        target: 'http://49.13.68.62:5000/api', // Dopasuj do portu Twojego backendu
        changeOrigin: true,
        secure: false,
      },
    },
  },
  preview: {
    host: 'youuneed.com.pl',
    port: 4173, // Domyślny port dla vite preview
    strictPort: true,
  },
  build: {
    outDir: 'dist', // Folder wyjściowy (zgodny z Twoimi logami)
    chunkSizeWarningLimit: 1000, // Zwiększ limit ostrzeżeń o dużych chunkach
  },
});
