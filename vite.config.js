import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  server: {
    port: 8000,
    proxy: {
      '/api': {
        target: 'http://122.152.220.69:8080',
        changeOrigin: true,
        secure: false
      }
    }
  }
})
