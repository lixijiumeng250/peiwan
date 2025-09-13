// 客服相关API接口
import http from './http'

/**
 * 获取派发的工单
 * @param {Object} params - 查询参数
 * @param {number} params.assignedEmployeeId - 分配员工ID（可选，用于过滤特定员工的工单）
 * @returns {Promise} 工单列表
 */
export const getOrders = async (params = {}) => {
  try {
    const response = await http.get('/cs/orders', { params })
    return response
  } catch (error) {
    console.error('获取派发工单失败:', error)
    throw error
  }
}

/**
 * 创建工单
 * @param {Object} orderData - 工单数据
 * @param {number} orderData.assignedEmployeeId - 分配员工ID（必填）
 * @param {string} orderData.clientInfo - 客户信息（必填）
 * @param {string} orderData.orderInfoScreenshotUrl - 工单信息截图URL（可选）
 * @returns {Promise} 创建结果
 */
export const createOrder = async (orderData) => {
  try {
    const response = await http.post('/cs/orders', orderData)
    return response
  } catch (error) {
    console.error('创建工单失败:', error)
    throw error
  }
}

/**
 * 审核工单
 * @param {number} orderId - 工单ID
 * @param {Object} auditData - 审核数据
 * @param {string} auditData.action - 审核动作（可选值：APPROVE/REJECT）（必填）
 * @param {string} auditData.comments - 审核意见（可选）
 * @returns {Promise} 审核结果
 */
export const auditOrder = async (orderId, auditData) => {
  try {
    const response = await http.post(`/cs/orders/${orderId}/audit`, auditData)
    return response
  } catch (error) {
    console.error('审核工单失败:', error)
    throw error
  }
}

/**
 * 获取管理的员工列表
 * @returns {Promise} 员工列表
 */
export const getEmployees = async () => {
  try {
    const response = await http.get('/cs/employees')
    return response
  } catch (error) {
    console.error('获取员工列表失败:', error)
    throw error
  }
}

/**
 * 获取员工个人资料
 * @param {number} employeeId - 员工ID
 * @returns {Promise} 员工个人资料
 */
export const getEmployeeProfile = async (employeeId) => {
  try {
    const response = await http.get(`/employee/profile?userId=${employeeId}`)
    return response
  } catch (error) {
    console.error('获取员工个人资料失败:', error)
    throw error
  }
}

/**
 * 获取员工游戏技能
 * @param {number} employeeId - 员工ID
 * @returns {Promise} 员工游戏技能列表
 */
export const getEmployeeGameSkills = async (employeeId) => {
  try {
    // 首先需要获取员工的profileId
    const profileResponse = await getEmployeeProfile(employeeId)
    if (profileResponse.code === 0 && profileResponse.data) {
      const profileId = profileResponse.data.id
      const response = await http.get(`/game-skills/profile/${profileId}`)
      return response
    } else {
      throw new Error('无法获取员工资料ID')
    }
  } catch (error) {
    console.error('获取员工游戏技能失败:', error)
    throw error
  }
}