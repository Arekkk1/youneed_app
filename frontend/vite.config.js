import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';

export default defineConfig({
  plugins: [
    react(),
    svgr(), // Enable SVG as React components
  ],
   server: {
    proxy: {
      '/api': 'https://api.youneed.com.pl/api',
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
