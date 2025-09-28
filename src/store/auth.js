// 认证状态管理
import { reactive, computed } from 'vue'
import * as authAPI from '../api/auth'
import { resetCancelToken } from '../api/http'
import { usePolling } from '../utils/polling'
// Cookie 单会话模式：支持记住登录状态功能

// 本地存储键名
const REMEMBER_USER_KEY = 'remembered_user'
const REMEMBER_LOGIN_KEY = 'remember_login'
const REMEMBER_EXPIRE_KEY = 'remember_expire'

// 七天的毫秒数
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000

// 本地存储辅助函数
const storage = {
  // 保存记住的用户信息（七天有效期）
  saveRememberedUser(user) {
    try {
      const expireTime = Date.now() + SEVEN_DAYS_MS
      localStorage.setItem(REMEMBER_USER_KEY, JSON.stringify(user))
      localStorage.setItem(REMEMBER_LOGIN_KEY, 'true')
      localStorage.setItem(REMEMBER_EXPIRE_KEY, expireTime.toString())
    } catch (error) {
      console.error('保存用户登录状态失败:', error)
    }
  },
  
  // 获取记住的用户信息（检查七天有效期）
  getRememberedUser() {
    try {
      const rememberLogin = localStorage.getItem(REMEMBER_LOGIN_KEY)
      if (rememberLogin !== 'true') {
        return null
      }
      
      // 检查过期时间
      const expireTimeStr = localStorage.getItem(REMEMBER_EXPIRE_KEY)
      if (expireTimeStr) {
        const expireTime = parseInt(expireTimeStr)
        const now = Date.now()
        
        if (now > expireTime) {
          storage.clearRememberedUser()
          return null
        }
        
        const remainingDays = Math.ceil((expireTime - now) / (24 * 60 * 60 * 1000))
      }
      
      const userStr = localStorage.getItem(REMEMBER_USER_KEY)
      if (userStr) {
        const user = JSON.parse(userStr)
        return user
      }
    } catch (error) {
      console.error('获取记住的用户信息失败:', error)
      // 清除损坏的数据
      storage.clearRememberedUser()
    }
    return null
  },
  
  // 清除记住的用户信息
  clearRememberedUser() {
    try {
      localStorage.removeItem(REMEMBER_USER_KEY)
      localStorage.removeItem(REMEMBER_LOGIN_KEY)
      localStorage.removeItem(REMEMBER_EXPIRE_KEY)
    } catch (error) {
      console.error('清除用户登录状态失败:', error)
    }
  },
  
  // 检查是否有记住的登录状态
  hasRememberedLogin() {
    return localStorage.getItem(REMEMBER_LOGIN_KEY) === 'true'
  }
}

// 创建响应式状态（Session认证模式）
const state = reactive({
  user: null,
  // Session认证：移除token相关状态，认证完全依赖后端Session和Cookie
  isLoading: false,
  error: null,
  isLogoutInProgress: false, // 标记是否正在登出
  lastLogoutTime: 0, // 最后一次登出的时间戳
  rememberLogin: false // 是否记住登录状态
})

// 计算属性
const getters = {
  // 是否已登录（Cookie 模式：仅基于用户信息）
  isAuthenticated: computed(() => !!state.user),
  
  // 当前用户信息
  currentUser: computed(() => state.user),
  
  // 用户角色
  userRole: computed(() => state.user?.role || 'guest'),
  
  // 是否是管理员
  isAdmin: computed(() => state.user?.role === 'ADMIN'),
  
  // 加载状态
  isLoading: computed(() => state.isLoading),
  
  // 错误信息
  error: computed(() => state.error)
}

// 操作方法
const actions = {
  // 设置加载状态
  setLoading(loading) {
    state.isLoading = loading
  },
  
  // 设置错误信息
  setError(error) {
    state.error = error
  },
  
  // 清除错误信息
  clearError() {
    state.error = null
  },
  
  // 设置用户信息
  setUser(user) {
    state.user = user
  },
  
  // Session认证：设置认证状态（只处理用户信息和记住登录）
  setAuthState(user, rememberMe = false) {
    this.setUser(user)
    state.rememberLogin = rememberMe
    
    
    // 如果选择记住登录状态，保存到本地存储
    if (rememberMe && user) {
      storage.saveRememberedUser(user)
    } else if (!rememberMe) {
      // 如果不记住登录状态，清除本地存储
      storage.clearRememberedUser()
    }
    
    // Session认证：认证状态完全依赖后端Session和Cookie
    // 前端只需要保存用户信息用于UI显示和业务逻辑
  },
  
  // 检查是否有登录迹象（避免不必要的API调用）
  hasLoginIndicators() {
    try {
      // 1. 检查是否有记住的用户信息（已在initAuth中处理，这里是双重保险）
      const rememberedUser = storage.getRememberedUser()
      if (rememberedUser) {
        return true
      }
      
      // 2. 检查是否有会话相关的Cookie（Session模式的主要指标）
      const cookies = document.cookie
      if (cookies.includes('JSESSIONID') || 
          cookies.includes('SESSION') ||
          cookies.includes('session') ||
          cookies.includes('connect.sid') ||
          cookies.includes('sessionid')) {
        return true
      }
      
      // 3. 检查是否刚刚完成登录（通过URL hash或state）
      const hash = window.location.hash
      const search = window.location.search
      if (hash.includes('login-success') || search.includes('login-success')) {
        return true
      }
      
      // 4. 检查是否从登录相关页面跳转过来（限制时间窗口）
      const referrer = document.referrer
      if (referrer && (referrer.includes('/login') || referrer.includes('/register'))) {
        // 只在最近5分钟内的跳转才认为有效
        const sessionStartTime = sessionStorage.getItem('session_start_time')
        const now = Date.now()
        if (!sessionStartTime || (now - parseInt(sessionStartTime)) < 5 * 60 * 1000) {
          return true
        }
      }
      
      // 5. 检查是否有其他认证相关的存储
      if (localStorage.getItem('auth_timestamp') || 
          sessionStorage.getItem('temp_auth') ||
          sessionStorage.getItem('login_redirect')) {
        return true
      }
      
      return false
    } catch (error) {
      console.error('检查登录迹象时发生错误:', error)
      // 发生错误时保守处理，返回false避免不必要的API调用
      return false
    }
  },
  
  // 初始化认证状态（Cookie 模式，支持记住登录状态）
  async initAuth() {
    try {
      
      // 首先检查本地存储是否有记住的用户信息
      const rememberedUser = storage.getRememberedUser()
      if (rememberedUser) {
        state.rememberLogin = true
        
        // 先设置用户信息到内存，然后验证后端会话
        this.setUser(rememberedUser)
        
        // 验证后端会话是否仍然有效
        const success = await this.fetchCurrentUser()
        if (success) {
          return
        } else {
          storage.clearRememberedUser()
          this.clearAuth()
        }
      }
      
      // 如果没有记住的用户信息，检查是否有其他登录迹象
      // 只有在有合理理由相信用户可能已登录时才检查会话状态
      const hasLoginIndicators = this.hasLoginIndicators()
      if (hasLoginIndicators) {
        const success = await this.fetchCurrentUser()
        if (success) {
        } else {
        }
      } else {
      }
    } catch (error) {
      console.error('初始化认证状态失败:', error)
      // 清除可能损坏的本地存储
      storage.clearRememberedUser()
      this.clearAuth()
    }
  },
  
  // 用户登录
  async login(loginData, retryCount = 0) {
    try {
      this.setLoading(true)
      this.clearError()
      
      const response = await authAPI.login(loginData)
      
      // 成功判定：兼容 code === 0 或 code === 200
      const isSuccessCode = response && (response.code === 0 || response.code === 200)
      if (isSuccessCode && response.data && response.data.user) {
        // Session认证：后端设置Session Cookie，前端只需保存用户信息
        this.setAuthState(response.data.user, loginData.rememberMe)
        
        
        // 设置会话开始时间戳，用于后续的登录迹象检测
        sessionStorage.setItem('session_start_time', Date.now().toString())
        
        return {
          success: true,
          message: response.message || '登录成功',
          user: response.data.user
        }
      } else {
        // 登录失败，返回具体的错误信息
        const errorMessage = response.message || '登录失败，请检查用户名和密码'
        
        // 如果是"未找到用户信息"且重试次数少于2次，则等待后重试
        if (errorMessage.includes('未找到用户') && retryCount < 2) {
          await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)))
          return this.login(loginData, retryCount + 1)
        }
        
        throw new Error(errorMessage)
      }
    } catch (error) {
      const apiMessage = error?.response?.data?.message
      const message = apiMessage || error.message || '登录失败，请稍后重试'
      
      // 如果是"未找到用户信息"且重试次数少于2次，则等待后重试
      if (message.includes('未找到用户') && retryCount < 2) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)))
        return this.login(loginData, retryCount + 1)
      }
      
      this.setError(message)
      return {
        success: false,
        message
      }
    } finally {
      this.setLoading(false)
    }
  },
  
  // 用户注册
  async register(registerData) {
    try {
      this.setLoading(true)
      this.clearError()
      
      const response = await authAPI.register(registerData)
      
      // 成功判定：兼容 code === 0 或 code === 200
      const isSuccessCode = response && (response.code === 0 || response.code === 200)
      if (isSuccessCode) {
        return {
          success: true,
          message: response.message || '注册成功',
          user: response.data
        }
      } else {
        throw new Error(response.message || '注册失败')
      }
    } catch (error) {
      this.setError(error.message || '注册失败，请稍后重试')
      return {
        success: false,
        message: error.message || '注册失败，请稍后重试'
      }
    } finally {
      this.setLoading(false)
    }
  },
  
  // 用户登出
  async logout() {
    try {
      
      // 设置登出进行中标志
      state.isLogoutInProgress = true
      this.setLoading(true)
      
      // 立即停止所有轮询，不等待API响应
      const { forceStopAllPolling, getActivePollingKeys } = usePolling()
      const activePolling = getActivePollingKeys()
      
      // 强制停止所有轮询（使用最暴力的方法）
      forceStopAllPolling()
      
      // 延迟再次检查和清理（多重保险）
      setTimeout(() => {
        const stillActive = getActivePollingKeys()
        if (stillActive.length > 0) {
          forceStopAllPolling()
        }
      }, 50)
      
      setTimeout(() => {
        const finalCheck = getActivePollingKeys()
        if (finalCheck.length > 0) {
          forceStopAllPolling()
        }
      }, 200)
      
      // 调用退出登录API
      try {
        await authAPI.logout()
      } catch (error) {
        console.error('❌ 退出登录API调用失败:', error)
        // 即使API调用失败，也要清除本地状态
      }
      
      this.clearAuth()
      
    } catch (error) {
      console.error('❌ 登出过程发生错误:', error)
      // 确保本地状态被清除
      this.clearAuth()
      // 确保轮询被清除
      try {
        const { forceStopAllPolling } = usePolling()
        forceStopAllPolling()
      } catch (e) {
        console.warn('清除轮询失败', e)
      }
    } finally {
      // 清除登出进行中标志，设置登出时间戳
      state.isLogoutInProgress = false
      state.lastLogoutTime = Date.now()
      this.setLoading(false)
    }
  },
  
  // 修改密码
  async changePassword(changePasswordData) {
    try {
      this.setLoading(true)
      this.clearError()
      
      const response = await authAPI.changePassword(changePasswordData)
      
      // 根据API文档，成功响应的code应该为0或200
      if (response.code === 0 || response.code === 200) {
        
        return {
          success: true,
          message: response.message || '密码修改成功',
          requestId: response.requestId
        }
      } else {
        console.error('Auth Store - 密码修改失败:', response)
        throw new Error(response.message || '密码修改失败')
      }
    } catch (error) {
      console.error('Auth Store - 密码修改错误:', error)
      
      // 处理特定错误类型
      let errorMessage = '密码修改失败，请稍后重试'
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message
      } else if (error.message) {
        errorMessage = error.message
      }
      
      // 处理常见错误类型
      if (errorMessage.includes('current password') || errorMessage.includes('当前密码')) {
        errorMessage = '当前密码不正确'
      } else if (errorMessage.includes('password mismatch') || errorMessage.includes('密码不匹配')) {
        errorMessage = '新密码和确认密码不匹配'
      } else if (errorMessage.includes('password strength') || errorMessage.includes('密码强度')) {
        errorMessage = '新密码强度不足，请使用更强的密码'
      } else if (errorMessage.includes('same password') || errorMessage.includes('相同密码')) {
        errorMessage = '新密码不能与当前密码相同'
      }
      
      this.setError(errorMessage)
      return {
        success: false,
        message: errorMessage
      }
    } finally {
      this.setLoading(false)
    }
  },
  
  // 清除认证状态（Session认证模式）
  clearAuth() {
    
    // 清除内存状态（Session认证模式）
    state.user = null
    // Session认证：移除token相关状态，认证完全依赖后端Session Cookie
    state.error = null
    state.rememberLogin = false
    
    // 清除本地存储的记住登录状态
    storage.clearRememberedUser()
    
    // 清除会话相关的存储
    sessionStorage.removeItem('session_start_time')
    sessionStorage.removeItem('temp_auth')
    sessionStorage.removeItem('login_redirect')
    
    // 确保清除所有轮询（额外保险 - 强制清理模式）
    try {
      const { clearAllPolling, forceStopAllPolling, getActivePollingKeys } = usePolling()
      
      const activePolling = getActivePollingKeys()
      if (activePolling.length > 0) {
        clearAllPolling()
        
        // 双重保险：强制清理
        setTimeout(() => {
          const stillActive = getActivePollingKeys()
          if (stillActive.length > 0) {
            forceStopAllPolling()
          }
        }, 100)
      }
      
    } catch (e) {
      console.warn('⚠️ 认证状态清除时轮询清理失败', e)
    }
    
    // Cookie 模式：不需要广播，其他标签页会通过后端会话自然同步
    
    // 取消所有正在进行的请求
    resetCancelToken()
  },
  
  // 刷新访问令牌 (暂时注释掉，等后端提供接口)
  // async refreshToken() {
  //   try {
  //     if (!state.refreshToken) {
  //       throw new Error('没有刷新令牌')
  //     }
  //     
  //     const response = await authAPI.refreshAccessToken(state.refreshToken)
  //     
  //     if (response.code === 0 && response.data) {
  //       // 更新访问令牌
  //       this.setTokens(response.data.accessToken, state.refreshToken)
  //       return true
  //     } else {
  //       throw new Error('令牌刷新失败')
  //     }
  //   } catch (error) {
  //     console.error('刷新令牌失败:', error)
  //     // 刷新失败，清除认证状态
  //     this.clearAuth()
  //     return false
  //   }
  // },
  
  // 获取当前用户信息
  async fetchCurrentUser() {
    try {
      // 如果正在登出过程中，直接返回false
      if (state.isLogoutInProgress) {
        return false
      }
      
      // 如果刚刚登出（立即允许重新登录），避免立即调用认证检查
      const timeSinceLogout = Date.now() - state.lastLogoutTime
      if (timeSinceLogout < 100) {
        return false
      }
      
      // 双重检查：再次确认不在登出状态
      if (state.isLogoutInProgress) {
        return false
      }
      
      const response = await authAPI.getCurrentUser()
      
      // 成功判定：兼容 code === 0 或 code === 200
      const isSuccessCode = response && (response.code === 0 || response.code === 200)
      if (isSuccessCode && response.data) {
        this.setUser(response.data)
        return true
      } else {
        this.clearAuth()
        return false
      }
    } catch (error) {
      // 401/403 表示未登录或无权限，这是正常情况
      if (error.response?.status === 401 || error.response?.status === 403) {
        this.clearAuth()
        return false
      }
      
      // 其他错误才记录为错误
      console.error('获取用户信息时发生错误:', error)
      this.clearAuth()
      return false
    }
  },
  
  // 检查用户名可用性
  async checkUsername(username) {
    try {
      const response = await authAPI.checkUsernameAvailability(username)
      return response.data || false
    } catch (error) {
      console.error('检查用户名可用性失败:', error)
      return false
    }
  }
}

// 导出认证store
export default {
  state,
  getters,
  actions
}
