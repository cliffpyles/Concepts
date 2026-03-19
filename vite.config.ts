import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      // 1. The Dual-Entry Architecture
      input: {
        main: resolve(__dirname, 'index.html'),
        sandbox: resolve(__dirname, 'sandbox.html')
      },
      // 2. The Advanced Code Splitting Strategy
      output: {
        manualChunks(id) {
          // Chunk 1: Core React & Router (Highly cacheable, used by both entries)
          if (id.includes('node_modules/react') || id.includes('node_modules/react-router')) {
            return 'vendor-react';
          }
          // Chunk 2: Framer Motion (Heavy physics library)
          if (id.includes('node_modules/motion') || id.includes('node_modules/framer-motion')) {
            return 'vendor-motion';
          }
          // Chunk 3: Lucide Icons
          if (id.includes('node_modules/lucide-react')) {
            return 'vendor-icons';
          }
        }
      }
    }
  }
})