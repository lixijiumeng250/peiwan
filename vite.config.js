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
  define: {
    global: 'globalThis',
  },
  server: {
    port: 8000,
    proxy: {
      '/api': {
        target: 'http://122.152.220.69:8080',
        changeOrigin: true,
        secure: false,
        // 确保Cookie正确转发
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            // 转发Cookie
            if (req.headers.cookie) {
              proxyReq.setHeader('Cookie', req.headers.cookie)
            }
          })
          proxy.on('proxyRes', (proxyRes, req, res) => {
            // 强制转发所有Set-Cookie头
            const setCookieHeaders = proxyRes.headers['set-cookie']
            if (setCookieHeaders) {
              res.setHeader('Set-Cookie', setCookieHeaders)
            }
            
            // 设置CORS相关头部确保Cookie能被设置
            res.setHeader('Access-Control-Allow-Credentials', 'true')
            res.setHeader('Access-Control-Allow-Origin', req.headers.origin || 'http://localhost:8000')
          })
        }
      },
      '/api/ws': {
        target: 'http://122.152.220.69:8080',
        changeOrigin: true,
        secure: false,
        ws: true,
        // WebSocket代理也需要Cookie支持
        configure: (proxy, options) => {
          proxy.on('proxyReqWs', (proxyReq, req, socket, options, head) => {
            // WebSocket升级时转发Cookie
            if (req.headers.cookie) {
              proxyReq.setHeader('Cookie', req.headers.cookie)
            }
          })
        }
      }
    }
  }
})
