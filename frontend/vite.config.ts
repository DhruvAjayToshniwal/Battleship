import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/game': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/rooms': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/games': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/players': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/ws': {
        target: 'ws://localhost:8000',
        ws: true,
      },
    },
  },
})
