// 客服相关API接口
import http from './http'
import { mockAPI, isMockEnabled } from './mock'

/**
 * 获取客服管理的员工列表
 * @returns {Promise} 员工列表
 */
export const getEmployees = async () => {
  try {
    // 如果启用了Mock模式，使用模拟API
    if (isMockEnabled()) {
      return await mockAPI.getEmployees()
    }
    
    const response = await http.get('/customer-service/employees')
    
    // 预期的后端响应格式
    // {
    //   code: 200,
    //   message: "获取员工列表成功",
    //   data: {
    //     employees: [
    //       {
    //         id: 1,
    //         name: "梦之追忆",
    //         avatar: "https://example.com/avatar1.jpg",
    //         status: "working", // working, idle, offline
    //         game: "王者荣耀",
    //         level: "王者50星",
    //         orderWillingness: 85, // 接单意愿度 0-100
    //         todayOrders: 3,
    //         totalOrders: 156,
    //         rating: 4.8
    //       }
    //     ]
    //   }
    // }
    
    return response
  } catch (error) {
    console.error('获取员工列表失败:', error)
    throw error
  }
}

/**
 * 获取员工个人状态详情
 * @param {number} employeeId - 员工ID
 * @returns {Promise} 员工状态详情
 */
export const getEmployeeStatus = async (employeeId) => {
  try {
    if (isMockEnabled()) {
      return await mockAPI.getEmployeeStatus(employeeId)
    }
    
    const response = await http.get(`/customer-service/employees/${employeeId}/status`)
    
    // 预期的后端响应格式
    // {
    //   code: 200,
    //   message: "获取员工状态成功",
    //   data: {
    //     employee: {
    //       id: 1,
    //       name: "梦之追忆",
    //       avatar: "https://example.com/avatar1.jpg",
    //       status: "working",
    //       personalInfo: {
    //         gender: "男",
    //         age: 25,
    //         games: ["王者荣耀", "和平精英"],
    //         specialties: ["技术陪练", "娱乐陪玩"],
    //         maxRank: "王者50星"
    //       },
    //       workStatus: {
    //         orderWillingness: 85,
    //         currentOrders: 2,
    //         todayWorkHours: 6.5,
    //         weeklyWorkHours: 42,
    //         lastActiveTime: "2023-12-01T14:30:00Z"
    //       }
    //     }
    //   }
    // }
    
    return response
  } catch (error) {
    console.error('获取员工状态失败:', error)
    throw error
  }
}

/**
 * 获取员工工作记录
 * @param {number} employeeId - 员工ID
 * @param {Object} params - 查询参数
 * @param {number} params.page - 页码
 * @param {number} params.pageSize - 每页数量
 * @param {string} params.status - 工单状态筛选
 * @returns {Promise} 工作记录列表
 */
export const getEmployeeWorkRecords = async (employeeId, params = {}) => {
  try {
    if (isMockEnabled()) {
      return await mockAPI.getEmployeeWorkRecords(employeeId, params)
    }
    
    const response = await http.get(`/customer-service/employees/${employeeId}/work-records`, {
      params: {
        page: params.page || 1,
        page_size: params.pageSize || 10,
        status: params.status
      }
    })
    
    return response
  } catch (error) {
    console.error('获取员工工作记录失败:', error)
    throw error
  }
}

/**
 * 发派工单给员工
 * @param {Object} orderData - 工单数据
 * @param {number} orderData.employeeId - 员工ID
 * @param {string} orderData.customerName - 客户姓名
 * @param {string} orderData.game - 游戏类型
 * @param {string} orderData.serviceType - 服务类型
 * @param {string} orderData.gameLevel - 游戏水平
 * @param {File} orderData.screenshot - 派单截图
 * @returns {Promise} 发派结果
 */
export const assignOrder = async (orderData) => {
  try {
    if (isMockEnabled()) {
      return await mockAPI.assignOrder(orderData)
    }
    
    const formData = new FormData()
    formData.append('employee_id', orderData.employeeId)
    formData.append('customer_name', orderData.customerName)
    formData.append('game', orderData.game)
    formData.append('service_type', orderData.serviceType)
    formData.append('game_level', orderData.gameLevel)
    if (orderData.screenshot) {
      formData.append('screenshot', orderData.screenshot)
    }
    
    const response = await http.post('/customer-service/orders/assign', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    
    return response
  } catch (error) {
    console.error('发派工单失败:', error)
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
    if (isMockEnabled()) {
      return await mockAPI.getOrderDetail(orderId)
    }
    
    const response = await http.get(`/customer-service/orders/${orderId}`)
    
    // 预期的后端响应格式
    // {
    //   code: 200,
    //   message: "获取工单详情成功",
    //   data: {
    //     order: {
    //       id: 1,
    //       orderNumber: "114514",
    //       employeeId: 1,
    //       employeeName: "梦之追忆",
    //       customerName: "浩二",
    //       game: "三角洲",
    //       serviceType: "技术陪练",
    //       gameLevel: "王者50星",
    //       status: "pending_audit", // pending_audit, approved, rejected
    //       screenshots: {
    //         assignment: "https://example.com/assignment.jpg",
    //         completion: "https://example.com/completion.jpg"
    //       },
    //       createdAt: "2023-12-01T10:00:00Z",
    //       completedAt: "2023-12-01T12:00:00Z",
    //       auditHistory: [
    //         {
    //           action: "submitted",
    //           time: "2023-12-01T12:00:00Z",
    //           note: "员工提交工单"
    //         }
    //       ]
    //     }
    //   }
    // }
    
    return response
  } catch (error) {
    console.error('获取工单详情失败:', error)
    throw error
  }
}

/**
 * 审核工单
 * @param {number} orderId - 工单ID
 * @param {Object} auditData - 审核数据
 * @param {string} auditData.action - 审核动作 approve/reject
 * @param {string} auditData.note - 审核备注
 * @returns {Promise} 审核结果
 */
export const auditOrder = async (orderId, auditData) => {
  try {
    if (isMockEnabled()) {
      return await mockAPI.auditOrder(orderId, auditData)
    }
    
    const response = await http.put(`/customer-service/orders/${orderId}/audit`, {
      action: auditData.action,
      note: auditData.note
    })
    
    return response
  } catch (error) {
    console.error('审核工单失败:', error)
    throw error
  }
}

/**
 * 上传图片文件
 * @param {File} file - 图片文件
 * @returns {Promise} 上传结果
 */
export const uploadImage = async (file) => {
  try {
    const formData = new FormData()
    formData.append('image', file)
    
    const response = await http.post('/upload/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    
    return response
  } catch (error) {
    console.error('上传图片失败:', error)
    throw error
  }
}
