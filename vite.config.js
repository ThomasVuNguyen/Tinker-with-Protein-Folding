import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 1306,
    proxy: {
      '/api/iedb': {
        target: 'http://tools-cluster-interface.iedb.org',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/iedb/, ''),
      },
    },
  },
})
