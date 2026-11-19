import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// In dev, /api is proxied to the Spring Boot service. If it is not running,
// the app automatically falls back to the in-browser demo repository.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: { '/api': { target: process.env.API_TARGET || 'http://localhost:8080', changeOrigin: true } },
  },
});
