// 认证状态管理
import { reactive, computed } from 'vue'
import * as authAPI from '../api/auth'

// 创建响应式状态
const state = reactive({
  user: null,
  accessToken: localStorage.getItem('access_token'),
  refreshToken: localStorage.getItem('refresh_token'),
  isLoading: false,
  error: null
})

// 计算属性
const getters = {
  // 是否已登录
  isAuthenticated: computed(() => !!state.accessToken && !!state.user),
  
  // 当前用户信息
  currentUser: computed(() => state.user),
  
  // 用户角色
  userRole: computed(() => state.user?.role || 'guest'),
  
  // 是否是管理员
  isAdmin: computed(() => state.user?.role === 'admin'),
  
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
    if (user) {
      localStorage.setItem('user_info', JSON.stringify(user))
    } else {
      localStorage.removeItem('user_info')
    }
  },
  
  // 设置令牌
  setTokens(accessToken, refreshToken) {
    state.accessToken = accessToken
    state.refreshToken = refreshToken
    
    if (accessToken) {
      localStorage.setItem('access_token', accessToken)
    } else {
      localStorage.removeItem('access_token')
    }
    
    if (refreshToken) {
      localStorage.setItem('refresh_token', refreshToken)
    } else {
      localStorage.removeItem('refresh_token')
    }
  },
  
  // 初始化认证状态（从localStorage恢复）
  initAuth() {
    try {
      const userInfo = localStorage.getItem('user_info')
      if (userInfo) {
        state.user = JSON.parse(userInfo)
      }
      
      state.accessToken = localStorage.getItem('access_token')
      state.refreshToken = localStorage.getItem('refresh_token')
    } catch (error) {
      console.error('初始化认证状态失败:', error)
      this.clearAuth()
    }
  },
  
  // 用户登录
  async login(loginData) {
    try {
      this.setLoading(true)
      this.clearError()
      
      const response = await authAPI.login(loginData)
      
      if (response.code === 200 && response.data) {
        // 保存令牌
        this.setTokens(response.data.access_token, response.data.refresh_token)
        
        // 保存用户信息
        this.setUser(response.data.user)
        
        return {
          success: true,
          message: response.message || '登录成功',
          user: response.data.user
        }
      } else {
        throw new Error(response.message || '登录失败')
      }
    } catch (error) {
      this.setError(error.message || '登录失败，请稍后重试')
      return {
        success: false,
        message: error.message || '登录失败，请稍后重试'
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
      
      if (response.code === 200) {
        return {
          success: true,
          message: response.message || '注册成功',
          user: response.data?.user
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
      this.setLoading(true)
      
      // 调用后端登出接口
      await authAPI.logout()
    } catch (error) {
      console.error('登出API调用失败:', error)
      // 即使API调用失败，也要清除本地状态
    } finally {
      // 清除本地认证状态
      this.clearAuth()
      this.setLoading(false)
    }
  },
  
  // 清除认证状态
  clearAuth() {
    state.user = null
    state.accessToken = null
    state.refreshToken = null
    state.error = null
    
    // 清除localStorage
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('user_info')
  },
  
  // 刷新访问令牌
  async refreshToken() {
    try {
      if (!state.refreshToken) {
        throw new Error('没有刷新令牌')
      }
      
      const response = await authAPI.refreshAccessToken(state.refreshToken)
      
      if (response.code === 200 && response.data) {
        // 更新访问令牌
        this.setTokens(response.data.access_token, state.refreshToken)
        return true
      } else {
        throw new Error('令牌刷新失败')
      }
    } catch (error) {
      console.error('刷新令牌失败:', error)
      // 刷新失败，清除认证状态
      this.clearAuth()
      return false
    }
  },
  
  // 获取当前用户信息
  async fetchCurrentUser() {
    try {
      if (!state.accessToken) {
        return false
      }
      
      const response = await authAPI.getCurrentUser()
      
      if (response.code === 200 && response.data?.user) {
        this.setUser(response.data.user)
        return true
      } else {
        throw new Error('获取用户信息失败')
      }
    } catch (error) {
      console.error('获取用户信息失败:', error)
      // 如果是401错误，清除认证状态
      if (error.code === 401) {
        this.clearAuth()
      }
      return false
    }
  },
  
  // 检查用户名可用性
  async checkUsername(username) {
    try {
      const response = await authAPI.checkUsernameAvailability(username)
      return response.data?.available || false
    } catch (error) {
      console.error('检查用户名可用性失败:', error)
      return false
    }
  },
  
  // 检查邮箱可用性
  async checkEmail(email) {
    try {
      const response = await authAPI.checkEmailAvailability(email)
      return response.data?.available || false
    } catch (error) {
      console.error('检查邮箱可用性失败:', error)
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
