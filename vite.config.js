import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/uea-jas': {
        target: 'https://vhg.cmp.uea.ac.uk/tech/jas/vhg2017',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/uea-jas/, '')
      }
    }
  },
  preview: {
    proxy: {
      '/uea-jas': {
        target: 'https://vhg.cmp.uea.ac.uk/tech/jas/vhg2017',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/uea-jas/, '')
      }
    }
  },
  build: {
    rolldownOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('react-router-dom')) return 'vendor-router';
          if (id.includes('modulesData.json')) return 'sign-dictionary-data';
        }
      }
    }
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.js'],
    include: ['src/**/*.test.{js,jsx}', 'api/**/*.test.js']
  }
});
