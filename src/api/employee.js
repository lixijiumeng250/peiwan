// 员工相关API接口
import http from './http'

/**
 * 获取个人资料
 * @returns {Promise} 个人资料
 */
export const getProfile = async () => {
  try {
    const response = await http.get('/employee/profile')
    return response
  } catch (error) {
    console.error('获取个人资料失败:', error)
    throw error
  }
}

/**
 * 为管理员/客服按用户ID获取员工资料
 * 通过覆盖请求头 X-User-Id 实现
 * @param {number} userId - 目标员工用户ID
 * @returns {Promise} 个人资料
 */
export const getProfileForUser = async (userId) => {
  try {
    if (!userId) throw new Error('缺少 userId')
    const response = await http.get('/employee/profile', {
      headers: {
        'X-User-Id': userId
      }
    })
    return response
  } catch (error) {
    console.error('按用户ID获取个人资料失败:', error)
    throw error
  }
}

/**
 * 更新员工状态（更新个人资料）
 * @param {Object} profileData - 个人资料数据
 * @param {number} profileData.userId - 用户ID（必填）
 * @param {string} profileData.gender - 性别（可选值：MALE/FEMALE）
 * @param {string} profileData.workStatus - 工作状态（可选值：IDLE/BUSY/RESTING/OFF_DUTY）
 * @param {string} profileData.createdAt - 创建时间（可选）
 * @param {string} profileData.updatedAt - 更新时间（可选）
 * @param {number} profileData.deleted - 删除标记（可选）
 * @returns {Promise} 更新结果
 */
export const updateProfile = async (profileData) => {
  try {
    const response = await http.put('/employee/profile', profileData)
    return response
  } catch (error) {
    console.error('更新个人资料失败:', error)
    throw error
  }
}

/**
 * 获取我的游戏技能
 * @returns {Promise} 游戏技能列表
 */
export const getGameSkills = async () => {
  try {
    const response = await http.get('/employee/game-skills')
    return response
  } catch (error) {
    console.error('获取游戏技能失败:', error)
    throw error
  }
}

/**
 * 客服获取指定员工的游戏技能
 * @param {number} userId - 员工的用户ID
 * @returns {Promise} 游戏技能列表
 */
export const getEmployeeGameSkillsForCS = async (userId) => {
  try {
    console.log('客服获取员工游戏技能，设置X-User-Id为:', userId)
    const response = await http.get('/employee/game-skills', {
      headers: {
        'X-User-Id': userId
      }
    })
    console.log('游戏技能API响应:', response)
    return response
  } catch (error) {
    console.error('客服获取员工游戏技能失败:', error)
    throw error
  }
}

/**
 * 客服获取指定员工的工单列表
 * @param {number} userId - 员工的用户ID
 * @returns {Promise} 工单列表
 */
export const getEmployeeOrdersForCS = async (userId) => {
  try {
    console.log('客服获取员工工单列表，设置X-User-Id为:', userId)
    const response = await http.get('/employee/orders', {
      headers: {
        'X-User-Id': userId
      }
    })
    console.log('员工工单API响应:', response)
    return response
  } catch (error) {
    console.error('客服获取员工工单失败:', error)
    throw error
  }
}

/**
 * 更新我的游戏技能
 * @param {Array} gameSkills - 游戏技能数组
 * @param {number} gameSkills[].profileId - 员工资料ID（必填）
 * @param {string} gameSkills[].gameName - 游戏名称（必填）
 * @param {string} gameSkills[].playStyle - 游戏风格（可选值：TECHNICAL/ENTERTAINMENT）
 * @param {string} gameSkills[].serviceType - 服务类型（可选值：RANKED/CASUAL）
 * @param {string} gameSkills[].highestRank - 最高段位（可选）
 * @returns {Promise} 更新后的游戏技能列表
 */
export const updateGameSkills = async (gameSkills) => {
  try {
    const response = await http.put('/employee/game-skills', gameSkills)
    return response
  } catch (error) {
    console.error('更新游戏技能失败:', error)
    throw error
  }
}

/**
 * 获取分配的工单列表
 * @returns {Promise} 工单列表
 */
export const getAssignedOrders = async () => {
  try {
    const response = await http.get('/employee/orders')
    return response
  } catch (error) {
    console.error('获取分配工单失败:', error)
    throw error
  }
}

/**
 * 接单
 * @param {number} orderId - 工单ID
 * @param {Object} acceptData - 接单数据
 * @param {string} acceptData.imageUrl - 接单截图URL（必填）
 * @returns {Promise} 接单结果
 */
export const acceptOrder = async (orderId, acceptData) => {
  try {
    console.log('调用接单API - orderId:', orderId, '类型:', typeof orderId)
    console.log('调用接单API - acceptData:', acceptData)
    console.log('请求URL:', `/employee/orders/${orderId}/accept`)
    
    const response = await http.post(`/employee/orders/${orderId}/accept`, acceptData)
    console.log('接单API响应:', response)
    return response
  } catch (error) {
    console.error('接单失败:', error)
    throw error
  }
}

/**
 * 完成订单
 * @param {number} orderId - 工单ID
 * @param {Object} completeData - 完成数据
 * @param {string} completeData.imageUrl - 完成截图URL（必填）
 * @returns {Promise} 完成结果
 */
export const completeOrder = async (orderId, completeData) => {
  try {
    const response = await http.post(`/employee/orders/${orderId}/complete`, completeData)
    return response
  } catch (error) {
    console.error('完成订单失败:', error)
    throw error
  }
}

/**
 * 重新提交工单
 * 当工单被拒绝后，员工可以重新提交完成截图
 * @param {number} orderId - 工单ID
 * @param {Object} resubmitData - 重新提交数据
 * @param {string} resubmitData.imageUrl - 重新提交的完成截图URL（必填）
 * @returns {Promise} 重新提交结果
 */
export const resubmitOrder = async (orderId, resubmitData) => {
  try {
    console.log('调用重新提交API - orderId:', orderId, '类型:', typeof orderId)
    console.log('调用重新提交API - resubmitData:', resubmitData)
    console.log('请求URL:', `/employee/orders/${orderId}/reSubmit`)
    
    // 使用专门的重新提交接口
    const response = await http.post(`/employee/orders/${orderId}/reSubmit`, resubmitData)
    console.log('重新提交API响应:', response)
    return response
  } catch (error) {
    console.error('重新提交工单失败:', error)
    throw error
  }
}

/**
 * 续单
 * @param {number} orderId - 工单ID
 * @returns {Promise} 续单结果
 */
export const renewOrder = async (orderId) => {
  try {
    const response = await http.post(`/employee/orders/${orderId}/renew`)
    return response
  } catch (error) {
    console.error('续单失败:', error)
    throw error
  }
}

/**
 * 获取工单详情
 * @param {number} orderId - 工单ID
 * @returns {Promise} 工单详情
 */
export const getOrderDetail = async (orderId) => {
  try {
    const response = await http.get(`/employee/orders/${orderId}`)
    return response
  } catch (error) {
    console.error('获取工单详情失败:', error)
    throw error
  }
}