import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-core': ['react', 'react-dom'],
          'framer': ['framer-motion'],
          'markdown': ['react-markdown', 'remark-gfm', 'rehype-highlight'],
        },
      },
    },
  },
});
