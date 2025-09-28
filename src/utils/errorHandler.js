// 全局错误处理工具
import { ElMessage, ElNotification } from 'element-plus'
import authStore from '../store/auth'
import router from '../router'
import config from '../config'

// 错误类型枚举
export const ErrorTypes = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  AUTH_ERROR: 'AUTH_ERROR',
  PERMISSION_ERROR: 'PERMISSION_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  SERVER_ERROR: 'SERVER_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR'
}

// 错误处理器类
class ErrorHandler {
  constructor() {
    this.errorCount = 0
    this.lastErrorTime = 0
    this.maxErrorsPerMinute = 10
  }

  // 主要错误处理方法
  handle(error, context = {}) {
    console.error('🚨 错误处理:', error, context)
    
    // 如果是认证取消错误，不处理
    if (error.isAuthCancel) {
      // console.log('忽略认证取消错误')
      return
    }
    
    // 防止错误频繁弹出
    if (this.shouldThrottle()) {
      return
    }

    const errorInfo = this.parseError(error)
    
    switch (errorInfo.type) {
      case ErrorTypes.AUTH_ERROR:
        this.handleAuthError(errorInfo, context)
        break
      case ErrorTypes.PERMISSION_ERROR:
        this.handlePermissionError(errorInfo, context)
        break
      case ErrorTypes.NETWORK_ERROR:
        this.handleNetworkError(errorInfo, context)
        break
      case ErrorTypes.VALIDATION_ERROR:
        this.handleValidationError(errorInfo, context)
        break
      case ErrorTypes.SERVER_ERROR:
        this.handleServerError(errorInfo, context)
        break
      default:
        this.handleUnknownError(errorInfo, context)
    }
  }

  // 解析错误信息
  parseError(error) {
    let type = ErrorTypes.UNKNOWN_ERROR
    let message = '发生未知错误'
    let code = null
    let details = null

    if (error.response) {
      // HTTP 响应错误
      code = error.response.status
      const data = error.response.data

      if (code === 401) {
        type = ErrorTypes.AUTH_ERROR
        message = data?.message || '登录已过期，请重新登录'
      } else if (code === 403) {
        type = ErrorTypes.PERMISSION_ERROR
        message = data?.message || '没有权限执行此操作'
      } else if (code >= 400 && code < 500) {
        type = ErrorTypes.VALIDATION_ERROR
        message = data?.message || '请求参数错误'
        details = data?.errors || data?.data
      } else if (code >= 500) {
        type = ErrorTypes.SERVER_ERROR
        message = data?.message || '服务器内部错误'
      }
    } else if (error.request) {
      // 网络错误
      type = ErrorTypes.NETWORK_ERROR
      message = '网络连接失败，请检查网络设置'
    } else if (error.code) {
      // 自定义错误
      code = error.code
      message = error.message || '操作失败'
      
      if (code === 401) {
        type = ErrorTypes.AUTH_ERROR
      } else if (code === 403) {
        type = ErrorTypes.PERMISSION_ERROR
      } else if (code >= 400 && code < 500) {
        type = ErrorTypes.VALIDATION_ERROR
      } else if (code >= 500) {
        type = ErrorTypes.SERVER_ERROR
      }
    } else if (error.message) {
      message = error.message
    }

    return { type, message, code, details, originalError: error }
  }

  // 认证错误处理
  handleAuthError(errorInfo, context) {
    // 检查是否是登出期间的认证错误，如果是则不显示错误提示
    const { isLogoutInProgress, lastLogoutTime } = authStore.state
    const timeSinceLogout = Date.now() - lastLogoutTime
    
    if (isLogoutInProgress || timeSinceLogout < 100) {
      // console.log('🚪 登出期间的认证错误，不显示错误提示')
    } else {
      ElMessage.error(errorInfo.message)
    }
    
    // 清除认证状态和轮询
    authStore.actions.clearAuth()
    
    // 清除所有轮询定时器
    try {
      const { usePolling } = require('./polling')
      const { clearAllPolling } = usePolling()
      clearAllPolling()
      // console.log('认证错误：已清除所有轮询定时器')
    } catch (e) {
      console.warn('清除轮询失败', e)
    }
    
    // 重定向到登录页（但在登出期间不重定向）
    if (!(isLogoutInProgress || timeSinceLogout < 5000)) {
      const currentRoute = router.currentRoute.value
      if (currentRoute.name !== 'Login') {
        router.push({
          name: 'Login',
          query: { redirect: currentRoute.fullPath }
        })
      }
    }
  }

  // 权限错误处理
  handlePermissionError(errorInfo, context) {
    ElNotification({
      title: '权限不足',
      message: errorInfo.message,
      type: 'warning',
      duration: 5000
    })
    
    // 可以选择重定向到首页
    if (context.redirectOnPermissionError !== false) {
      setTimeout(() => {
        router.push({ name: 'Home' })
      }, 2000)
    }
  }

  // 网络错误处理
  handleNetworkError(errorInfo, context) {
    // 检查配置是否允许显示网络错误
    if (!config.errorHandling?.showNetworkErrors) {
      // console.log('网络错误已被配置隐藏:', errorInfo.message)
      return
    }
    
    ElNotification({
      title: '网络错误',
      message: errorInfo.message,
      type: 'error',
      duration: 8000
    })
  }

  // 验证错误处理
  handleValidationError(errorInfo, context) {
    if (errorInfo.details && typeof errorInfo.details === 'object') {
      // 处理表单验证错误
      const errors = this.formatValidationErrors(errorInfo.details)
      ElMessage({
        message: errors.join('; '),
        type: 'error',
        duration: 5000
      })
    } else {
      ElMessage.error(errorInfo.message)
    }
  }

  // 服务器错误处理
  handleServerError(errorInfo, context) {
    ElNotification({
      title: '服务器错误',
      message: errorInfo.message + '，请稍后重试',
      type: 'error',
      duration: 8000
    })
  }

  // 未知错误处理
  handleUnknownError(errorInfo, context) {
    ElMessage.error(errorInfo.message)
  }

  // 格式化验证错误
  formatValidationErrors(errors) {
    const messages = []
    
    if (Array.isArray(errors)) {
      messages.push(...errors)
    } else if (typeof errors === 'object') {
      Object.keys(errors).forEach(field => {
        const fieldErrors = errors[field]
        if (Array.isArray(fieldErrors)) {
          messages.push(...fieldErrors)
        } else {
          messages.push(fieldErrors)
        }
      })
    }
    
    return messages
  }

  // 错误限流
  shouldThrottle() {
    const now = Date.now()
    const oneMinute = 60 * 1000
    
    // 重置计数器
    if (now - this.lastErrorTime > oneMinute) {
      this.errorCount = 0
    }
    
    this.lastErrorTime = now
    this.errorCount++
    
    if (this.errorCount > this.maxErrorsPerMinute) {
      if (this.errorCount === this.maxErrorsPerMinute + 1) {
        ElMessage.warning('错误过于频繁，已暂时停止显示错误提示')
      }
      return true
    }
    
    return false
  }

  // 重置错误计数
  resetErrorCount() {
    this.errorCount = 0
    this.lastErrorTime = 0
  }
}

// 创建全局错误处理实例
const errorHandler = new ErrorHandler()

// 导出错误处理方法
export const handleError = (error, context) => {
  errorHandler.handle(error, context)
}

// 静默处理API错误（用于组件中的错误处理）
export const handleApiError = (error, context = {}) => {
  // 如果是认证取消错误，静默处理
  if (error.isAuthCancel || (error.message && error.message.includes('用户未认证'))) {
    // console.log('静默处理认证错误:', error.message)
    return false // 返回false表示错误已被静默处理
  }
  
  // 如果是axios取消错误，静默处理
  if (error.code === 'ERR_CANCELED' || error.message?.includes('canceled')) {
    // console.log('静默处理取消错误:', error.message)
    return false
  }
  
  // 其他错误正常处理
  handleError(error, context)
  return true // 返回true表示错误需要正常处理
}

// 导出错误处理器实例
export default errorHandler

// Vue 全局错误处理
export const setupGlobalErrorHandler = (app) => {
  app.config.errorHandler = (error, instance, info) => {
    console.error('Vue Global Error:', error, info)
    handleError(error, { 
      component: instance?.$options?.name || 'Unknown',
      errorInfo: info 
    })
  }
  
  // 处理未捕获的Promise拒绝
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled Promise Rejection:', event.reason)
    handleError(event.reason, { type: 'unhandledPromise' })
    event.preventDefault()
  })
}


