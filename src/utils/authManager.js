// 全局认证管理器 - 解决多标签页身份混淆问题
// 这个管理器负责协调所有store的认证状态，确保完全隔离

import tabStorage from './tabStorage'

class AuthManager {
  constructor() {
    this.tabId = tabStorage.getTabId()
    this.listeners = new Set()
    this.isInitialized = false
    
    // 监听认证状态变化
    this.setupAuthListeners()
    
    console.log(`AuthManager 初始化 - 标签页ID: ${this.tabId}`)
  }

  /**
   * 设置认证状态监听器
   */
  setupAuthListeners() {
    // 监听自定义认证事件
    window.addEventListener('authStateChanged', (event) => {
      if (event.detail.tabId === this.tabId) {
        this.notifyListeners(event.detail)
      }
    })

    // 监听存储变化（虽然sessionStorage不跨标签页，但用于调试）
    window.addEventListener('storage', (event) => {
      console.log('存储变化检测 (localStorage):', event)
    })
  }

  /**
   * 注册认证状态监听器
   */
  addAuthListener(callback) {
    this.listeners.add(callback)
    return () => this.listeners.delete(callback)
  }

  /**
   * 通知所有监听器
   */
  notifyListeners(data) {
    this.listeners.forEach(callback => {
      try {
        callback(data)
      } catch (error) {
        console.error('认证监听器执行失败:', error)
      }
    })
  }

  /**
   * 获取当前认证状态
   */
  getCurrentAuthState() {
    const token = tabStorage.getItem('accessToken')
    const userInfo = tabStorage.getItem('user_info')
    
    let user = null
    if (userInfo) {
      try {
        user = JSON.parse(userInfo)
      } catch (error) {
        console.error('用户信息解析失败:', error)
        return null
      }
    }

    const authState = {
      tabId: this.tabId,
      isAuthenticated: !!(token && user),
      token,
      user,
      timestamp: Date.now()
    }

    console.log(`获取认证状态 - 标签页ID: ${this.tabId}`, authState)
    return authState
  }

  /**
   * 设置认证状态
   */
  setAuthState(token, refreshToken, user) {
    console.log(`设置认证状态 - 标签页ID: ${this.tabId}`, {
      hasToken: !!token,
      hasUser: !!user,
      userRole: user?.role,
      userId: user?.id
    })

    // 原子性操作：要么全部设置，要么全部清除
    if (token && user) {
      tabStorage.setItem('accessToken', token)
      if (refreshToken) {
        tabStorage.setItem('refreshToken', refreshToken)
      }
      tabStorage.setItem('user_info', JSON.stringify(user))
    } else {
      this.clearAuthState()
      return
    }

    // 通知认证状态变化
    this.broadcastAuthChange('SET', { token, user })
  }

  /**
   * 清除认证状态
   */
  clearAuthState() {
    console.log(`清除认证状态 - 标签页ID: ${this.tabId}`)

    tabStorage.removeItem('accessToken')
    tabStorage.removeItem('refreshToken')
    tabStorage.removeItem('user_info')

    // 通知认证状态变化
    this.broadcastAuthChange('CLEAR', null)
  }

  /**
   * 验证认证状态完整性
   */
  validateAuthState() {
    const token = tabStorage.getItem('accessToken')
    const userInfo = tabStorage.getItem('user_info')

    // 检查数据完整性
    if ((token && !userInfo) || (!token && userInfo)) {
      console.warn(`认证数据不完整，清理状态 - 标签页ID: ${this.tabId}`)
      this.clearAuthState()
      return false
    }

    // 检查用户信息格式
    if (userInfo) {
      try {
        const user = JSON.parse(userInfo)
        if (!user.id || !user.role) {
          console.warn(`用户信息格式错误，清理状态 - 标签页ID: ${this.tabId}`)
          this.clearAuthState()
          return false
        }
      } catch (error) {
        console.warn(`用户信息解析失败，清理状态 - 标签页ID: ${this.tabId}`)
        this.clearAuthState()
        return false
      }
    }

    return !!(token && userInfo)
  }

  /**
   * 广播认证状态变化
   */
  broadcastAuthChange(action, data) {
    const event = new CustomEvent('authStateChanged', {
      detail: {
        tabId: this.tabId,
        action,
        data,
        timestamp: Date.now()
      }
    })
    
    window.dispatchEvent(event)
  }

  /**
   * 强制同步认证状态
   */
  forceSyncAuth() {
    console.log(`强制同步认证状态 - 标签页ID: ${this.tabId}`)
    
    const authState = this.getCurrentAuthState()
    if (authState.isAuthenticated) {
      this.broadcastAuthChange('SYNC', authState)
    } else {
      this.broadcastAuthChange('CLEAR', null)
    }
  }

  /**
   * 检查是否可以发送请求
   */
  canMakeRequest(url) {
    // 认证相关的请求总是允许
    const authPaths = ['/auth/login', '/auth/register', '/auth/check-username', '/auth/check-phone']
    const isAuthRequest = authPaths.some(path => url?.includes(path))
    
    if (isAuthRequest) {
      return true
    }

    // 非认证请求需要验证状态
    return this.validateAuthState()
  }

  /**
   * 获取请求头
   */
  getRequestHeaders() {
    const authState = this.getCurrentAuthState()
    const headers = {}

    if (authState.isAuthenticated) {
      headers['Authorization'] = `Bearer ${authState.token}`
      headers['X-User-Id'] = authState.user.id
      headers['X-User-Role'] = authState.user.role
      headers['X-Tab-Id'] = this.tabId
    }

    headers['X-Request-Time'] = Date.now()
    
    return headers
  }

  /**
   * 处理认证错误
   */
  handleAuthError(error) {
    console.error(`认证错误处理 - 标签页ID: ${this.tabId}`, error)
    
    // 如果是401错误，清除认证状态
    if (error.response?.status === 401) {
      console.log('收到401错误，清除认证状态')
      this.clearAuthState()
      return true
    }
    
    return false
  }

  /**
   * 获取调试信息
   */
  getDebugInfo() {
    const authState = this.getCurrentAuthState()
    return {
      tabId: this.tabId,
      authState,
      storageItems: tabStorage.getAllItems(),
      listenersCount: this.listeners.size,
      isInitialized: this.isInitialized
    }
  }
}

// 创建全局单例
const authManager = new AuthManager()

// 开发环境调试
if (import.meta.env.DEV) {
  window.__authManager = authManager
  
  window.__debugAuth = () => {
    console.log('=== 认证管理器调试信息 ===')
    console.log(authManager.getDebugInfo())
  }
}

export default authManager
