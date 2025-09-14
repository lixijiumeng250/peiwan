// 管理员相关API接口
import http from './http'

/**
 * 创建客服用户
 * @param {Object} userData - 用户数据
 * @param {string} userData.username - 用户名（必填）
 * @param {string} userData.realName - 真实姓名（必填）
 * @param {string} userData.phone - 电话号码（可选）
 * @param {string} userData.role - 角色（可选值：ADMIN,CS,EMPLOYEE，默认为CS）
 * @param {boolean} userData.isActive - 是否激活（可选，管理员创建的用户默认为true）
 * @param {string} userData.lastLogin - 最后登录时间（可选）
 * @param {string} userData.createdAt - 创建时间（可选）
 * @param {string} userData.updatedAt - 更新时间（可选）
 * @param {number} userData.deleted - 删除标记（可选，默认为0）
 * @returns {Promise<ApiResponseUser>} 创建结果，包含code、message、data、timestamp、requestId
 */
export const createUser = async (userData) => {
  try {
    // 构建符合API文档要求的请求体
    const userPayload = {
      id: 0, // 新建用户时ID为0
      username: userData.username,
      realName: userData.realName,
      phone: userData.phone || "", // 电话号码（可选）
      role: userData.role || 'CS', // 默认角色为客服
      isActive: userData.isActive !== undefined ? userData.isActive : true, // 管理员创建的用户默认激活
      lastLogin: userData.lastLogin || "", // 新建用户时为空
      createdAt: userData.createdAt || "", // 后端自动生成
      updatedAt: userData.updatedAt || "", // 后端自动生成
      deleted: userData.deleted !== undefined ? userData.deleted : 0 // 默认为0（未删除）
    }
    
    console.log('Admin API - 发送创建客服用户请求:', {
      url: '/api/admin/users',
      method: 'POST',
      payload: userPayload
    })
    
    const response = await http.post('/admin/users', userPayload)
    
    console.log('Admin API - 创建客服用户响应:', response)
    
    // 验证响应格式是否符合API文档
    if (response && typeof response.code === 'number') {
      return response
    } else {
      console.warn('API响应格式不符合预期:', response)
      return response
    }
  } catch (error) {
    console.error('创建客服用户失败:', error)
    
    // 增强错误处理
    if (error.response?.data) {
      console.error('服务器响应错误:', error.response.data)
      throw new Error(error.response.data.message || '创建客服用户失败')
    }
    
    throw error
  }
}

/**
 * 获取用户列表（包含员工状态信息）
 * @returns {Promise} 用户列表，包含workStatus和gender字段
 */
export const getUsers = async () => {
  try {
    const response = await http.get('/admin/users')
    // 预期的后端响应格式
    // {
    //   code: 0,
    //   message: "",
    //   data: [
    //     {
    //       id: 0,
    //       username: "",
    //       realName: "",
    //       phone: "",
    //       role: "ADMIN|CS|EMPLOYEE",
    //       isActive: true,
    //       lastLogin: "",
    //       createdAt: "",
    //       updatedAt: "",
    //       deleted: 0,
    //       workStatus: "IDLE|BUSY|RESTING|OFF_DUTY",
    //       gender: "MALE|FEMALE"
    //     }
    //   ],
    //   timestamp: "",
    //   requestId: ""
    // }
    return response
  } catch (error) {
    console.error('获取用户列表失败:', error)
    throw error
  }
}

/**
 * 更新用户信息
 * @param {number} userId - 用户ID
 * @param {Object} userData - 更新数据
 * @param {string} userData.username - 用户名（必填）
 * @param {string} userData.realName - 真实姓名（必填）
 * @param {string} userData.phone - 电话号码（可选）
 * @param {string} userData.role - 角色（可选值：ADMIN,CS,EMPLOYEE）
 * @param {boolean} userData.isActive - 是否激活（可选）
 * @param {string} userData.workStatus - 工作状态（可选值：IDLE,BUSY,RESTING,OFF_DUTY）
 * @param {string} userData.gender - 性别（可选值：MALE,FEMALE）
 * @param {string} userData.lastLogin - 最后登录时间（可选）
 * @param {string} userData.createdAt - 创建时间（可选）
 * @param {string} userData.updatedAt - 更新时间（可选）
 * @param {number} userData.deleted - 删除标记（可选）
 * @returns {Promise} 更新结果
 */
export const updateUser = async (userId, userData) => {
  try {
    const response = await http.put(`/admin/users/${userId}`, userData)
    return response
  } catch (error) {
    console.error('更新用户失败:', error)
    throw error
  }
}

/**
 * 删除用户
 * @param {number} userId - 用户ID
 * @returns {Promise} 删除结果
 */
export const deleteUser = async (userId) => {
  try {
    const response = await http.delete(`/admin/users/${userId}`)
    return response
  } catch (error) {
    console.error('删除用户失败:', error)
    throw error
  }
}


/**
 * 获取所有工单
 * @returns {Promise} 工单列表
 */
export const getOrders = async () => {
  try {
    const response = await http.get('/admin/orders')
    return response
  } catch (error) {
    console.error('获取工单列表失败:', error)
    throw error
  }
}


