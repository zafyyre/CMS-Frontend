import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The React dev server runs on 5173 and proxies API calls to the Express
// backend on 4000, so the whole app is reachable from a single origin.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
});
