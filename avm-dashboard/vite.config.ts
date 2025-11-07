import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  appType: 'spa',
  server: {
    port: 5173,
    host: '0.0.0.0',
    strictPort: true,
    proxy: {
      // Use context array to match paths
      '/avm': {
        target: 'http://api:8000',
        changeOrigin: true,
        secure: false,
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('❌ proxy error /avm', err);
          });
          proxy.on('proxyReq', (_proxyReq, req, _res) => {
            console.log('🔄 Proxying /avm request:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('✅ Proxy response /avm:', req.url, proxyRes.statusCode);
          });
        },
      },
      '/api': {
        target: 'http://api:8000',
        changeOrigin: true,
        secure: false,
      },
      '/mirror-pairs': {
        target: 'http://api:8000',
        changeOrigin: true,
      },
      '/lookups': {
        target: 'http://api:8000',
        changeOrigin: true,
      },
    },
  },
  build: {
    target: 'esnext',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          three: ['three', '@react-three/fiber', '@react-three/drei'],
          ui: ['framer-motion', 'lucide-react'],
        },
      },
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'three'],
  },
})
