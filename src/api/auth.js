// 认证相关API接口
import http from './http'

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
    const response = await http.post('/auth/login', {
      username: loginData.username,
      password: loginData.password,
      rememberMe: loginData.rememberMe || false
    })
    
    // 预期的后端响应格式
    // {
    //   code: 0,
    //   message: "",
    //   data: {
    //     accessToken: "",
    //     refreshToken: "",
    //     expiresIn: 0,
    //     user: {
    //       id: 0,
    //       username: "",
    //       realName: "",
    //       role: "",
    //       roleDescription: "",
    //       createdAt: "",
    //       lastLogin: ""
    //     }
    //   },
    //   timestamp: "",
    //   requestId: ""
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
 * @param {string} registerData.realName - 真实姓名
 * @param {string} registerData.password - 密码
 * @param {string} registerData.confirmPassword - 确认密码
 * @returns {Promise} 注册结果
 */
export const register = async (registerData) => {
  try {
    const response = await http.post('/auth/register', {
      username: registerData.username,
      realName: registerData.realName,
      password: registerData.password,
      confirmPassword: registerData.confirmPassword
    })
    
    // 预期的后端响应格式
    // {
    //   code: 0,
    //   message: "",
    //   data: {
    //     id: 0,
    //     username: "",
    //     realName: "",
    //     role: "",
    //     isActive: true,
    //     lastLogin: "",
    //     createdAt: "",
    //     updatedAt: "",
    //     deleted: 0
    //   },
    //   timestamp: "",
    //   requestId: ""
    // }
    
    return response
  } catch (error) {
    console.error('注册API调用失败:', error)
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
    //   code: 0,
    //   message: "",
    //   data: {},
    //   timestamp: "",
    //   requestId: ""
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
    //   code: 0,
    //   message: "",
    //   data: {
    //     id: 0,
    //     username: "",
    //     realName: "",
    //     role: "",
    //     isActive: true,
    //     lastLogin: "",
    //     createdAt: "",
    //     updatedAt: "",
    //     deleted: 0
    //   },
    //   timestamp: "",
    //   requestId: ""
    // }
    
    return response
  } catch (error) {
    console.error('获取用户信息失败:', error)
    throw error
  }
}


/**
 * 检查用户名可用性
 * @param {string} username - 用户名
 * @returns {Promise} 验证结果
 */
export const checkUsernameAvailability = async (username) => {
  try {
    const response = await http.get(`/auth/check-username/${encodeURIComponent(username)}`)
    
    // 预期的后端响应格式
    // {
    //   code: 0,
    //   message: "",
    //   data: true,
    //   timestamp: "",
    //   requestId: ""
    // }
    
    return response
  } catch (error) {
    console.error('检查用户名可用性失败:', error)
    throw error
  }
}

/**
 * 修改用户密码
 * @param {Object} changePasswordData - 修改密码数据
 * @param {string} changePasswordData.currentPassword - 当前密码（必填）
 * @param {string} changePasswordData.newPassword - 新密码（必填）
 * @param {string} changePasswordData.confirmPassword - 确认新密码（必填）
 * @returns {Promise<ApiResponseVoid>} 修改结果，包含code、message、data、timestamp、requestId
 */
export const changePassword = async (changePasswordData) => {
  try {
    const requestPayload = {
      currentPassword: changePasswordData.currentPassword,
      newPassword: changePasswordData.newPassword,
      confirmPassword: changePasswordData.confirmPassword
    }
    
    console.log('Auth API - 发送修改密码请求:', {
      url: '/api/auth/change-password',
      method: 'POST',
      payload: { ...requestPayload, currentPassword: '***', newPassword: '***', confirmPassword: '***' }
    })
    
    const response = await http.post('/auth/change-password', requestPayload)
    
    console.log('Auth API - 修改密码响应:', {
      code: response.code,
      message: response.message,
      timestamp: response.timestamp,
      requestId: response.requestId
    })
    
    // 验证响应格式是否符合API文档
    if (response && typeof response.code === 'number') {
      return response
    } else {
      console.warn('修改密码API响应格式不符合预期:', response)
      return response
    }
  } catch (error) {
    console.error('修改密码失败:', error)
    
    // 增强错误处理
    if (error.response?.data) {
      console.error('服务器响应错误:', error.response.data)
      throw new Error(error.response.data.message || '修改密码失败')
    }
    
    throw error
  }
}
