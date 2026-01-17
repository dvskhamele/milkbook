import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      // Add any additional rollup options here
    }
  },
  server: {
    open: true,
    port: 5173
  },
  publicDir: 'public' // Include public directory in build
});