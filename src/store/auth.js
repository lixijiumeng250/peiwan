// 认证状态管理
import { reactive, computed } from 'vue'
import * as authAPI from '../api/auth'
import { resetCancelToken } from '../api/http'

// 创建响应式状态
const state = reactive({
  user: null,
  accessToken: sessionStorage.getItem('accessToken'),
  refreshToken: sessionStorage.getItem('refreshToken'),
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
      sessionStorage.setItem('user_info', JSON.stringify(user))
    } else {
      sessionStorage.removeItem('user_info')
    }
  },
  
  // 设置令牌
  setTokens(accessToken, refreshToken) {
    state.accessToken = accessToken
    state.refreshToken = refreshToken
    
    if (accessToken) {
      sessionStorage.setItem('accessToken', accessToken)
    } else {
      sessionStorage.removeItem('accessToken')
    }
    
    if (refreshToken) {
      sessionStorage.setItem('refreshToken', refreshToken)
    } else {
      sessionStorage.removeItem('refreshToken')
    }
  },
  
  // 初始化认证状态（从sessionStorage恢复）
  initAuth() {
    try {
      const userInfo = sessionStorage.getItem('user_info')
      if (userInfo) {
        state.user = JSON.parse(userInfo)
      }
      
      state.accessToken = sessionStorage.getItem('accessToken')
      state.refreshToken = sessionStorage.getItem('refreshToken')
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
      
      // 成功判定：兼容 code === 0 或 code === 200
      const isSuccessCode = response && (response.code === 0 || response.code === 200)
      if (isSuccessCode && response.data) {
        // 先保存用户信息，再保存令牌，确保isAuthenticated状态正确
        this.setUser(response.data.user)
        this.setTokens(response.data.accessToken, response.data.refreshToken)
        
        return {
          success: true,
          message: response.message || '登录成功',
          user: response.data.user
        }
      } else {
        // 登录失败，返回具体的错误信息
        const errorMessage = response.message || '登录失败，请检查用户名和密码'
        throw new Error(errorMessage)
      }
    } catch (error) {
      const apiMessage = error?.response?.data?.message
      const message = apiMessage || error.message || '登录失败，请稍后重试'
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
      this.setLoading(true)
      
      // 先清除本地认证状态，防止新的请求使用过期token
      this.clearAuth()
      
      // 然后调用后端登出接口（使用临时token）
      const tempToken = sessionStorage.getItem('accessToken')
      if (tempToken) {
        try {
          await authAPI.logout()
        } catch (error) {
          console.error('登出API调用失败:', error)
          // 即使API调用失败，本地状态已经清除，不影响退出登录
        }
      }
    } catch (error) {
      console.error('登出过程发生错误:', error)
      // 确保本地状态被清除
      this.clearAuth()
    } finally {
      this.setLoading(false)
    }
  },
  
  // 修改密码
  async changePassword(changePasswordData) {
    try {
      this.setLoading(true)
      this.clearError()
      
      console.log('Auth Store - 开始修改密码')
      const response = await authAPI.changePassword(changePasswordData)
      
      // 根据API文档，成功响应的code应该为0或200
      if (response.code === 0 || response.code === 200) {
        console.log('Auth Store - 密码修改成功:', {
          code: response.code,
          message: response.message,
          timestamp: response.timestamp,
          requestId: response.requestId
        })
        
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
  
  // 清除认证状态
  clearAuth() {
    state.user = null
    state.accessToken = null
    state.refreshToken = null
    state.error = null
    
    // 清除sessionStorage
    sessionStorage.removeItem('accessToken')
    sessionStorage.removeItem('refreshToken')
    sessionStorage.removeItem('user_info')
    
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
      if (!state.accessToken) {
        return false
      }
      
      const response = await authAPI.getCurrentUser()
      
      // 成功判定：兼容 code === 0 或 code === 200
      const isSuccessCode = response && (response.code === 0 || response.code === 200)
      if (isSuccessCode && response.data) {
        this.setUser(response.data)
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
      return response.data || false
    } catch (error) {
      console.error('检查用户名可用性失败:', error)
      return false
    }
  },
  
}

// 导出认证store
export default {
  state,
  getters,
  actions
}
