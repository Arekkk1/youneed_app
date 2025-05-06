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
      '/api': 'http://49.13.68.62:5000',
    },
  },
});
