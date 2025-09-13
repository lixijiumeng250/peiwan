// HTTP客户端配置
import axios from 'axios'
import config from '../config'
import { handleError } from '../utils/errorHandler'

// 用于取消请求的控制器
let cancelTokenSource = null

// 重置取消令牌
export const resetCancelToken = () => {
  if (cancelTokenSource) {
    cancelTokenSource.cancel('用户退出登录，取消所有请求')
  }
  cancelTokenSource = axios.CancelToken.source()
}

// 创建axios实例
const http = axios.create({
  baseURL: config.api.baseURL,
  timeout: config.api.timeout,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 初始化取消令牌
resetCancelToken()

// 请求拦截器
http.interceptors.request.use(
  (config) => {
    // 添加取消令牌到每个请求
    if (cancelTokenSource) {
      config.cancelToken = cancelTokenSource.token
    }
    
    // 检查认证状态，如果用户未认证则取消请求
    const token = sessionStorage.getItem(config.auth?.tokenKey || 'accessToken')
    const userInfo = sessionStorage.getItem('user_info')
    
    // 如果是认证相关的请求，允许通过
    const authPaths = ['/auth/login', '/auth/register', '/auth/check-username']
    const isAuthRequest = authPaths.some(path => config.url?.includes(path))
    
    if (!isAuthRequest && (!token || !userInfo)) {
      // 非认证请求但没有有效的认证信息，静默取消请求
      console.log('用户未认证，静默取消请求:', config.url)
      // 创建一个特殊的取消错误，不会触发错误提示
      const cancelError = new Error('用户未认证')
      cancelError.isAuthCancel = true
      return Promise.reject(cancelError)
    }
    
    // 添加认证token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    // 添加用户ID请求头（只有在没有设置时才添加）
    if (!config.headers['X-User-Id'] && userInfo) {
      try {
        const user = JSON.parse(userInfo)
        if (user.id) {
          config.headers['X-User-Id'] = user.id
        }
      } catch (error) {
        // 尝试清理损坏的用户信息
        sessionStorage.removeItem('user_info')
        if (!isAuthRequest) {
          return Promise.reject(new Error('用户信息损坏'))
        }
      }
    }
    
    // 添加请求时间戳
    config.headers['X-Request-Time'] = Date.now()
    
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
    // 统一处理响应数据格式
    if (response.data && typeof response.data === 'object') {
      return response.data
    }
    
    return response
  },
  (error) => {
    // 如果是请求被取消，不显示错误信息
    if (axios.isCancel(error)) {
      console.log('请求被取消:', error.message)
      return Promise.reject(error)
    }
    
    // 如果是认证取消错误，不显示错误信息
    if (error.isAuthCancel) {
      console.log('认证取消:', error.message)
      return Promise.reject(error)
    }
    
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
