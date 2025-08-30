// HTTP客户端配置
import axios from 'axios'
import config from '../config'
import { handleError } from '../utils/errorHandler'

// 创建axios实例
const http = axios.create({
  baseURL: config.api.baseURL,
  timeout: config.api.timeout,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
http.interceptors.request.use(
  (config) => {
    // 添加认证token
    const token = localStorage.getItem(config.auth?.tokenKey || 'access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    // 添加请求时间戳
    config.headers['X-Request-Time'] = Date.now()
    
    console.log('发送请求:', {
      url: config.url,
      method: config.method,
      data: config.data
    })
    
    return config
  },
  (error) => {
    console.error('请求配置错误:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
http.interceptors.response.use(
  (response) => {
    console.log('收到响应:', {
      url: response.config.url,
      status: response.status,
      data: response.data
    })
    
    // 统一处理响应数据格式
    if (response.data && typeof response.data === 'object') {
      return response.data
    }
    
    return response
  },
  (error) => {
    console.error('响应错误:', error)
    
    // 使用全局错误处理器
    handleError(error, { 
      source: 'http_interceptor',
      url: error.config?.url,
      method: error.config?.method
    })
    
    // 返回Promise拒绝，让调用方可以继续处理
    return Promise.reject(error)
  }
)

export default http
