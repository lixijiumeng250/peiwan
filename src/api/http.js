// HTTP客户端配置
import axios from 'axios'
import config from '../config'
import { handleError } from '../utils/errorHandler'
import authStore from '../store/auth'
import { usePolling } from '../utils/polling'

// 用于取消请求的控制器
let cancelTokenSource = null

// 重置取消令牌
export const resetCancelToken = () => {
  if (cancelTokenSource) {
    // console.log('🚫 取消所有正在进行的HTTP请求')
    cancelTokenSource.cancel('用户退出登录，取消所有请求')
  }
  cancelTokenSource = axios.CancelToken.source()
  // console.log('🔄 已重置HTTP取消令牌')
}

// 创建axios实例（基于 Cookie 的单会话鉴权）
const http = axios.create({
  baseURL: config.api.baseURL,
  timeout: config.api.timeout,
  withCredentials: true, // 关键：跨标签页共享 Cookie，会话由后端管理
  maxRedirects: 0, // 禁用自动重定向，防止意外的GET请求
  headers: {
    'Content-Type': 'application/json'
  }
})

// 初始化取消令牌
resetCancelToken()

// 请求拦截器
http.interceptors.request.use(
  (config) => {
    // 检查登出状态，如果正在登出或刚刚登出，阻止认证相关请求
    const { isLogoutInProgress, lastLogoutTime } = authStore.state
    const timeSinceLogout = Date.now() - lastLogoutTime
    
    // 阻止登出期间的所有认证请求
    const authUrls = ['/auth/me', '/auth/login']
    const isAuthUrl = authUrls.some(url => config.url === url)
    
    if ((isLogoutInProgress || timeSinceLogout < 100) && isAuthUrl) {
      // console.log('🚫 阻止登出期间的认证请求:', config.url, config.method?.toUpperCase())
      const error = new Error('用户正在登出，取消认证请求')
      error.isAuthCancel = true // 标记为认证取消错误，避免错误提示
      return Promise.reject(error)
    }
    
    // 强制阻止任何GET方法访问/auth/login的请求（无论何时）
    if (config.url === '/auth/login' && config.method?.toLowerCase() === 'get') {
      console.error('🚨 强制阻止错误的 GET /auth/login 请求')
      console.trace('🚨 GET /auth/login 请求调用堆栈:')
      const error = new Error('错误的请求方法: login接口应该使用POST方法')
      error.isMethodError = true
      return Promise.reject(error)
    }
    
    // 记录所有请求
    // console.log(`📤 HTTP请求: ${config.method?.toUpperCase()} ${config.url}`)
    
    // 添加取消令牌到每个请求
    if (cancelTokenSource) {
      config.cancelToken = cancelTokenSource.token
    }
    
    // 自动添加X-User-Id请求头（如果未显式指定且用户已认证）
    const currentUser = authStore.getters.currentUser.value
    const isAuthenticated = authStore.getters.isAuthenticated.value
    
    // 确保headers存在
    config.headers = config.headers || {}
    // 如果调用方已经显式传入了X-User-Id（大小写兼容），则尊重调用方，不覆盖
    const hasExplicitXUserId =
      typeof config.headers['X-User-Id'] !== 'undefined' ||
      typeof config.headers['x-user-id'] !== 'undefined'
    
    // 只在用户已认证且有用户信息时才添加X-User-Id
    if (!hasExplicitXUserId && isAuthenticated && currentUser && currentUser.id) {
      config.headers['X-User-Id'] = currentUser.id
      // console.log(`📋 自动添加X-User-Id: ${currentUser.id} (${currentUser.username}, ${currentUser.role})`)
    } else if (hasExplicitXUserId) {
      // 记录但不覆盖，便于排查"代查员工"的场景
      const effective = config.headers['X-User-Id'] ?? config.headers['x-user-id']
      // console.log(`🔐 保留请求自带X-User-Id: ${effective}`)
    } else if (!isAuthenticated) {
      // console.log(`🚫 用户未认证，跳过X-User-Id添加`)
    }
    
    // 基于 Cookie 的会话，不再附加 Authorization 头
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
    // 记录所有响应
    // console.log(`📥 HTTP响应: ${response.config.method?.toUpperCase()} ${response.config.url} - 状态: ${response.status}`)
    
    // 检查是否是登出接口的成功响应
    if (response.config.url && response.config.url.includes('/auth/logout') && 
        response.config.method === 'post') {
      // console.log('🚪 检测到登出接口成功响应，立即停止所有轮询')
      try {
        const { forceStopAllPolling, getActivePollingKeys } = usePolling()
        const activePolling = getActivePollingKeys()
        // console.log('📊 登出响应时活跃轮询:', activePolling)
        
        if (activePolling.length > 0) {
          // console.log('🚨 立即强制停止所有轮询')
          forceStopAllPolling()
        } else {
          // console.log('✅ 无活跃轮询需要清理')
        }
      } catch (e) {
        console.warn('⚠️ 登出响应时清理轮询失败:', e)
      }
    }
    
    // 统一处理响应数据格式
    if (response.data && typeof response.data === 'object') {
      return response.data
    }
    
    return response
  },
  (error) => {
    // 记录错误响应
    // console.log(`❌ HTTP错误: ${error.config?.method?.toUpperCase()} ${error.config?.url} - 状态: ${error.response?.status || 'Network Error'}`)
    
    // 如果是请求被取消，不显示错误信息
    if (axios.isCancel(error)) {
      // console.log('请求被取消:', error.message)
      return Promise.reject(error)
    }
    
    // 如果是认证取消错误，不显示错误信息
    if (error.isAuthCancel) {
      // console.log('认证取消:', error.message)
      return Promise.reject(error)
    }
    
    // 处理重定向错误（3xx状态码）
    if (error.response?.status >= 300 && error.response?.status < 400) {
      console.warn(`🔄 收到重定向响应 ${error.response.status}，已禁用自动跟随`)
      console.warn('重定向目标:', error.response.headers?.location)
    }
    
    // 401 统一视为未登录/登录过期，由各页面触发跳转
    if (error.response?.status === 401) {
      console.warn('未认证或会话过期（401）')
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
