// 认证相关API接口
import http from './http'
import { mockAPI, isMockEnabled } from './mock'

/**
 * 用户登录
 * @param {Object} loginData - 登录数据
 * @param {string} loginData.username - 用户名
 * @param {string} loginData.password - 密码
 * @param {boolean} loginData.rememberMe - 是否记住登录状态
 * @returns {Promise} 登录结果
 */
export const login = async (loginData) => {
  try {
    // 如果启用了Mock模式，使用模拟API
    if (isMockEnabled()) {
      return await mockAPI.login(loginData)
    }
    
    const response = await http.post('/auth/login', {
      username: loginData.username,
      password: loginData.password,
      remember_me: loginData.rememberMe
    })
    
    // 预期的后端响应格式
    // {
    //   code: 200,
    //   message: "登录成功",
    //   data: {
    //     access_token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    //     refresh_token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    //     expires_in: 7200,
    //     user: {
    //       id: 1,
    //       username: "admin",
    //       email: "admin@example.com",
    //       phone: "13800138000",
    //       avatar: "https://example.com/avatar.jpg",
    //       role: "admin",
    //       created_at: "2023-01-01T00:00:00Z"
    //     }
    //   }
    // }
    
    return response
  } catch (error) {
    console.error('登录API调用失败:', error)
    throw error
  }
}

/**
 * 用户注册
 * @param {Object} registerData - 注册数据
 * @param {string} registerData.username - 用户名
 * @param {string} registerData.email - 邮箱
 * @param {string} registerData.phone - 手机号
 * @param {string} registerData.password - 密码
 * @returns {Promise} 注册结果
 */
export const register = async (registerData) => {
  try {
    // 如果启用了Mock模式，使用模拟API
    if (isMockEnabled()) {
      return await mockAPI.register(registerData)
    }
    
    const response = await http.post('/auth/register', {
      username: registerData.username,
      email: registerData.email,
      phone: registerData.phone,
      password: registerData.password
    })
    
    // 预期的后端响应格式
    // {
    //   code: 200,
    //   message: "注册成功",
    //   data: {
    //     user: {
    //       id: 2,
    //       username: "newuser",
    //       email: "newuser@example.com",
    //       phone: "13800138001",
    //       avatar: null,
    //       role: "user",
    //       created_at: "2023-01-01T00:00:00Z"
    //     }
    //   }
    // }
    
    return response
  } catch (error) {
    console.error('注册API调用失败:', error)
    throw error
  }
}

/**
 * 刷新访问令牌
 * @param {string} refreshToken - 刷新令牌
 * @returns {Promise} 新的访问令牌
 */
export const refreshAccessToken = async (refreshToken) => {
  try {
    const response = await http.post('/auth/refresh', {
      refresh_token: refreshToken
    })
    
    // 预期的后端响应格式
    // {
    //   code: 200,
    //   message: "令牌刷新成功",
    //   data: {
    //     access_token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    //     expires_in: 7200
    //   }
    // }
    
    return response
  } catch (error) {
    console.error('令牌刷新失败:', error)
    throw error
  }
}

/**
 * 用户登出
 * @returns {Promise} 登出结果
 */
export const logout = async () => {
  try {
    const response = await http.post('/auth/logout')
    
    // 预期的后端响应格式
    // {
    //   code: 200,
    //   message: "登出成功"
    // }
    
    return response
  } catch (error) {
    console.error('登出API调用失败:', error)
    throw error
  }
}

/**
 * 获取当前用户信息
 * @returns {Promise} 用户信息
 */
export const getCurrentUser = async () => {
  try {
    const response = await http.get('/auth/me')
    
    // 预期的后端响应格式
    // {
    //   code: 200,
    //   message: "获取用户信息成功",
    //   data: {
    //     user: {
    //       id: 1,
    //       username: "admin",
    //       email: "admin@example.com",
    //       phone: "13800138000",
    //       avatar: "https://example.com/avatar.jpg",
    //       role: "admin",
    //       created_at: "2023-01-01T00:00:00Z",
    //       last_login: "2023-01-01T12:00:00Z"
    //     }
    //   }
    // }
    
    return response
  } catch (error) {
    console.error('获取用户信息失败:', error)
    throw error
  }
}

/**
 * 修改密码
 * @param {Object} passwordData - 密码数据
 * @param {string} passwordData.oldPassword - 旧密码
 * @param {string} passwordData.newPassword - 新密码
 * @returns {Promise} 修改结果
 */
export const changePassword = async (passwordData) => {
  try {
    const response = await http.post('/auth/change-password', {
      old_password: passwordData.oldPassword,
      new_password: passwordData.newPassword
    })
    
    return response
  } catch (error) {
    console.error('修改密码失败:', error)
    throw error
  }
}

/**
 * 忘记密码 - 发送重置邮件
 * @param {string} email - 邮箱地址
 * @returns {Promise} 发送结果
 */
export const forgotPassword = async (email) => {
  try {
    const response = await http.post('/auth/forgot-password', {
      email: email
    })
    
    return response
  } catch (error) {
    console.error('发送重置邮件失败:', error)
    throw error
  }
}

/**
 * 重置密码
 * @param {Object} resetData - 重置数据
 * @param {string} resetData.token - 重置令牌
 * @param {string} resetData.newPassword - 新密码
 * @returns {Promise} 重置结果
 */
export const resetPassword = async (resetData) => {
  try {
    const response = await http.post('/auth/reset-password', {
      token: resetData.token,
      new_password: resetData.newPassword
    })
    
    return response
  } catch (error) {
    console.error('重置密码失败:', error)
    throw error
  }
}

/**
 * 验证用户名是否可用
 * @param {string} username - 用户名
 * @returns {Promise} 验证结果
 */
export const checkUsernameAvailability = async (username) => {
  try {
    // 如果启用了Mock模式，使用模拟API
    if (isMockEnabled()) {
      return await mockAPI.checkUsernameAvailability(username)
    }
    
    const response = await http.get(`/auth/check-username/${encodeURIComponent(username)}`)
    
    // 预期的后端响应格式
    // {
    //   code: 200,
    //   message: "用户名可用",
    //   data: {
    //     available: true
    //   }
    // }
    
    return response
  } catch (error) {
    console.error('检查用户名可用性失败:', error)
    throw error
  }
}

/**
 * 验证邮箱是否可用
 * @param {string} email - 邮箱地址
 * @returns {Promise} 验证结果
 */
export const checkEmailAvailability = async (email) => {
  try {
    // 如果启用了Mock模式，使用模拟API
    if (isMockEnabled()) {
      return await mockAPI.checkEmailAvailability(email)
    }
    
    const response = await http.get(`/auth/check-email/${encodeURIComponent(email)}`)
    
    return response
  } catch (error) {
    console.error('检查邮箱可用性失败:', error)
    throw error
  }
}
