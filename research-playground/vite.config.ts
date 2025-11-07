import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: 'http://api:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      '/playground': {
        target: 'http://api:8000',
        changeOrigin: true,
      },
      '/mirror-pairs': {
        target: 'http://api:8000',
        changeOrigin: true,
      },
      '/analytics': {
        target: 'http://api:8000',
        changeOrigin: true,
      },
      '/admin': {
        target: 'http://api:8000',
        changeOrigin: true,
      },
      '/health': {
        target: 'http://api:8000',
        changeOrigin: true,
      },
      '/avm': {
        target: 'http://api:8000',
        changeOrigin: true,
      },
    },
  },
})
