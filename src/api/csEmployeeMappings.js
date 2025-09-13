// 客服员工关系管理API接口
import http from './http'

/**
 * 根据ID获取客服员工关系
 * @param {number} id - 关系ID
 * @returns {Promise} 关系详情
 */
export const getCSEmployeeMappingById = async (id) => {
  try {
    const response = await http.get(`/cs-employee-mappings/${id}`)
    // 预期的后端响应格式
    // {
    //   code: 0,
    //   message: "",
    //   data: {
    //     id: 0,
    //     csUserId: 0,
    //     csUsername: "",
    //     csRealName: "",
    //     employeeUserId: 0,
    //     employeeUsername: "",
    //     employeeRealName: "",
    //     createdAt: "",
    //     updatedAt: ""
    //   },
    //   timestamp: "",
    //   requestId: ""
    // }
    return response
  } catch (error) {
    console.error('获取客服员工关系详情失败:', error)
    throw error
  }
}

/**
 * 更新客服员工关系
 * @param {number} id - 关系ID
 * @param {Object} mappingData - 更新数据
 * @param {number} mappingData.csUserId - 客服用户ID
 * @param {number} mappingData.employeeUserId - 员工用户ID
 * @returns {Promise} 更新结果
 */
export const updateCSEmployeeMapping = async (id, mappingData) => {
  try {
    const response = await http.put(`/cs-employee-mappings/${id}`, mappingData)
    return response
  } catch (error) {
    console.error('更新客服员工关系失败:', error)
    throw error
  }
}

/**
 * 删除客服员工关系
 * @param {number} id - 关系ID
 * @returns {Promise} 删除结果
 */
export const deleteCSEmployeeMapping = async (id) => {
  try {
    const response = await http.delete(`/cs-employee-mappings/${id}`)
    return response
  } catch (error) {
    console.error('删除客服员工关系失败:', error)
    throw error
  }
}

/**
 * 获取所有客服员工关系
 * @returns {Promise} 关系列表
 */
export const getAllCSEmployeeMappings = async () => {
  try {
    const response = await http.get('/cs-employee-mappings')
    return response
  } catch (error) {
    console.error('获取所有客服员工关系失败:', error)
    throw error
  }
}

/**
 * 创建客服员工关系
 * @param {Object} mappingData - 关系数据
 * @param {number} mappingData.csUserId - 客服用户ID
 * @param {number} mappingData.employeeUserId - 员工用户ID
 * @returns {Promise} 创建结果
 */
export const createCSEmployeeMapping = async (mappingData) => {
  try {
    const response = await http.post('/cs-employee-mappings', mappingData)
    return response
  } catch (error) {
    console.error('创建客服员工关系失败:', error)
    throw error
  }
}

/**
 * 批量创建客服员工关系
 * @param {Object} batchData - 批量数据
 * @param {number} batchData.csUserId - 客服用户ID
 * @param {Array<number>} batchData.employeeUserIds - 员工用户ID列表
 * @returns {Promise} 创建结果
 */
export const batchCreateCSEmployeeMappings = async (batchData) => {
  try {
    const response = await http.post('/cs-employee-mappings/batch', batchData)
    return response
  } catch (error) {
    console.error('批量创建客服员工关系失败:', error)
    throw error
  }
}


/**
 * 重新分配员工
 * @param {Object} reassignData - 重新分配数据
 * @param {number} reassignData.employeeUserId - 员工用户ID
 * @param {number} reassignData.newCsUserId - 新客服用户ID
 * @returns {Promise} 重新分配结果
 */
export const reassignEmployee = async (reassignData) => {
  try {
    const response = await http.post('/cs-employee-mappings/reassign', reassignData)
    return response
  } catch (error) {
    console.error('重新分配员工失败:', error)
    throw error
  }
}

/**
 * 获取当前客服管理的员工
 * @returns {Promise} 员工关系列表
 */
export const getMyEmployees = async () => {
  try {
    const response = await http.get('/cs-employee-mappings/my-employees')
    return response
  } catch (error) {
    console.error('获取我的员工失败:', error)
    throw error
  }
}

/**
 * 获取员工的客服关系
 * @param {number} employeeUserId - 员工用户ID
 * @returns {Promise} 客服关系列表
 */
export const getEmployeeCsMappings = async (employeeUserId) => {
  try {
    const response = await http.get(`/cs-employee-mappings/employee/${employeeUserId}`)
    return response
  } catch (error) {
    console.error('获取员工客服关系失败:', error)
    throw error
  }
}

/**
 * 删除员工的所有关系
 * @param {number} employeeUserId - 员工用户ID
 * @returns {Promise} 删除结果
 */
export const deleteEmployeeMappings = async (employeeUserId) => {
  try {
    const response = await http.delete(`/cs-employee-mappings/employee/${employeeUserId}`)
    return response
  } catch (error) {
    console.error('删除员工关系失败:', error)
    throw error
  }
}

/**
 * 获取客服管理的员工关系
 * @param {number} csUserId - 客服用户ID
 * @returns {Promise} 员工关系列表
 */
export const getCsEmployeeMappings = async (csUserId) => {
  try {
    const response = await http.get(`/cs-employee-mappings/cs/${csUserId}`)
    return response
  } catch (error) {
    console.error('获取客服员工关系失败:', error)
    throw error
  }
}

/**
 * 删除客服的所有员工关系
 * @param {number} csUserId - 客服用户ID
 * @returns {Promise} 删除结果
 */
export const deleteCsMappings = async (csUserId) => {
  try {
    const response = await http.delete(`/cs-employee-mappings/cs/${csUserId}`)
    return response
  } catch (error) {
    console.error('删除客服关系失败:', error)
    throw error
  }
}

/**
 * 检查客服员工关系
 * @param {number} csUserId - 客服用户ID
 * @param {number} employeeUserId - 员工用户ID
 * @returns {Promise} 检查结果
 */
export const checkCsEmployeeMapping = async (csUserId, employeeUserId) => {
  try {
    const response = await http.get('/cs-employee-mappings/check', {
      params: {
        csUserId,
        employeeUserId
      }
    })
    return response
  } catch (error) {
    console.error('检查客服员工关系失败:', error)
    throw error
  }
}

/**
 * 检查多个客服员工关系是否存在
 * @param {Array} mappings - 关系数组
 * @param {number} mappings[].csUserId - 客服用户ID
 * @param {number} mappings[].employeeUserId - 员工用户ID
 * @returns {Promise} 检查结果
 */
export const checkMultipleCsEmployeeMappings = async (mappings) => {
  try {
    const response = await http.post('/cs-employee-mappings/check-multiple', mappings)
    return response
  } catch (error) {
    console.error('检查多个客服员工关系失败:', error)
    throw error
  }
}