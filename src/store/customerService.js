// 客服状态管理
import { reactive, computed } from 'vue'
import * as customerServiceAPI from '../api/customerService'
import * as csEmployeeMappingsAPI from '../api/csEmployeeMappings'

// 创建响应式状态
const state = reactive({
  // 员工相关
  employees: [], // 确保初始化为空数组
  currentEmployee: null,
  employeeStatus: null,
  workRecords: [],
  
  // 工单相关
  currentOrder: null,
  dispatchedOrders: [],
  
  // 加载状态
  loading: {
    employees: false,
    employeeStatus: false,
    workRecords: false,
    orderDetail: false,
    audit: false,
    dispatchedOrders: false,
    createOrder: false,
    updateOrder: false,
    deleteOrder: false
  },
  
  // 分页信息
  pagination: {
    workRecords: {
      page: 1,
      pageSize: 10,
      total: 0
    },
    dispatchedOrders: {
      page: 1,
      pageSize: 10,
      total: 0
    }
  },
  
  // 错误信息
  error: null
})

// 计算属性
const getters = {
  // 员工列表
  employeeList: computed(() => {
    console.log('employeeList getter 被调用，state.employees:', state.employees, '类型:', typeof state.employees, '是否数组:', Array.isArray(state.employees))
    return Array.isArray(state.employees) ? state.employees : []
  }),
  
  // 当前员工信息
  currentEmployee: computed(() => state.currentEmployee),
  
  // 员工状态详情
  employeeStatus: computed(() => state.employeeStatus),
  
  // 工作记录列表
  workRecordList: computed(() => state.workRecords),
  
  // 当前工单详情
  currentOrderDetail: computed(() => state.currentOrder),
  
  // 派发工单列表
  dispatchedOrderList: computed(() => state.dispatchedOrders),
  
  // 加载状态
  isLoading: computed(() => (key) => state.loading[key] || false),
  
  // 工作记录分页信息
  workRecordsPagination: computed(() => state.pagination.workRecords),
  
  // 派发工单分页信息
  dispatchedOrdersPagination: computed(() => state.pagination.dispatchedOrders),
  
  // 在线员工数量 (包括 BUSY, IDLE, RESTING，不包括 OFF_DUTY)
  onlineEmployeeCount: computed(() => 
    Array.isArray(state.employees) ? state.employees.filter(emp => emp.workStatus && emp.workStatus !== 'OFF_DUTY').length : 0
  ),
  
  // 工作中员工数量
  workingEmployeeCount: computed(() => 
    Array.isArray(state.employees) ? state.employees.filter(emp => emp.workStatus && emp.workStatus === 'BUSY').length : 0
  ),
  
  // 错误信息
  error: computed(() => state.error)
}

// 操作方法
const actions = {
  // 设置加载状态
  setLoading(key, loading) {
    state.loading[key] = loading
  },
  
  // 设置错误信息
  setError(error) {
    state.error = error
  },
  
  // 清除错误信息
  clearError() {
    state.error = null
  },
  
  // 获取员工列表
  async fetchEmployees() {
    try {
      this.setLoading('employees', true)
      this.clearError()
      
      // 获取当前用户ID
      const userInfo = sessionStorage.getItem('user_info')
      if (!userInfo) {
        throw new Error('用户信息不存在，请重新登录')
      }
      
      const user = JSON.parse(userInfo)
      const csUserId = user.id
      
      if (!csUserId) {
        throw new Error('无法获取客服用户ID')
      }
      
      console.log('获取客服员工关系，客服ID:', csUserId)
      
      // 使用客服员工关系API获取对应的员工
      const response = await csEmployeeMappingsAPI.getCsEmployeeMappings(csUserId)
      
      console.log('客服员工关系API响应:', response, '响应类型:', typeof response)
      
      // 兼容不同的API响应格式 - 处理客服员工关系数据
      let mappingsData = []
      if (response.code === 200 && response.data) {
        mappingsData = response.data
      } else if (response.code === 200 && response.data) {
        mappingsData = response.data
      } else if (Array.isArray(response)) {
        mappingsData = response
      } else if (response.data && Array.isArray(response.data)) {
        mappingsData = response.data
      }
      
      // 确保mappingsData是数组
      if (!Array.isArray(mappingsData)) {
        console.warn('mappingsData 不是数组，使用空数组:', mappingsData)
        mappingsData = []
      }
      
      console.log('客服员工关系数据:', mappingsData)
      
      // 从关系数据中提取员工信息，并构建员工列表
      state.employees = mappingsData.map(mapping => ({
        id: mapping.employeeUserId || mapping.employeeId || 0,
        name: mapping.employeeRealName || mapping.employeeUsername || '未知员工',
        avatar: '', // 关系数据中可能没有头像信息
        workStatus: 'OFF_DUTY', // 默认状态，需要后续调用员工状态API获取
        gender: 'MALE',
        game: '未设置',
        level: '未设置',
        todayOrders: 0,
        totalOrders: 0,
        rating: 0,
        // 保留关系信息
        mappingId: mapping.id,
        csUserId: mapping.csUserId,
        csUsername: mapping.csUsername,
        csRealName: mapping.csRealName,
        employeeUserId: mapping.employeeUserId,
        employeeUsername: mapping.employeeUsername,
        employeeRealName: mapping.employeeRealName,
        createdAt: mapping.createdAt,
        updatedAt: mapping.updatedAt
      }))
      
      console.log('处理后的员工数据:', state.employees, '数量:', state.employees.length, '类型:', typeof state.employees)
      
      // 获取员工的实时状态信息
      await this.enrichEmployeeStatesFromCS()
      
      return {
        success: true,
        data: state.employees
      }
    } catch (error) {
      console.error('获取员工列表失败:', error)
      this.setError(error.message || '获取员工列表失败，请稍后重试')
      return {
        success: false,
        message: error.message || '获取员工列表失败，请稍后重试'
      }
    } finally {
      this.setLoading('employees', false)
    }
  },
  
  // 从CS API获取员工状态信息
  async enrichEmployeeStatesFromCS() {
    try {
      console.log('开始从CS API获取员工状态信息...')
      
      // 调用 /cs/employees 获取员工状态
      const response = await customerServiceAPI.getEmployees()
      console.log('CS员工API响应:', response)
      
      let csEmployeesData = []
      if (response.code === 200 && response.data) {
        csEmployeesData = response.data
      } else if (response.code === 200 && response.data) {
        csEmployeesData = response.data
      } else if (Array.isArray(response)) {
        csEmployeesData = response
      } else if (response.data && Array.isArray(response.data)) {
        csEmployeesData = response.data
      }
      
      console.log('CS员工状态数据:', csEmployeesData)
      
      // 检查第一个员工的性别字段
      if (csEmployeesData.length > 0) {
        console.log('第一个CS员工的详细信息:', csEmployeesData[0])
        console.log('第一个CS员工的性别字段:', csEmployeesData[0].gender)
      }
      
      // 将CS API的员工状态信息合并到现有员工数据中
      if (Array.isArray(csEmployeesData)) {
        state.employees.forEach((employee, index) => {
          // 根据员工ID匹配CS API中的员工数据
          const csEmployee = csEmployeesData.find(cs => 
            cs.id === employee.id || 
            cs.userId === employee.id || 
            cs.userId === employee.employeeUserId
          )
          
          if (csEmployee) {
            console.log(`匹配到员工 ${employee.name} 的状态信息:`, csEmployee)
            console.log(`员工 ${employee.name} 的性别信息 - CS API: ${csEmployee.gender}, 当前: ${employee.gender}`)
            
            // 更新员工信息
            state.employees[index] = {
              ...state.employees[index],
              workStatus: csEmployee.workStatus || csEmployee.status || 'OFF_DUTY',
              avatar: csEmployee.avatar || state.employees[index].avatar,
              gender: csEmployee.gender || state.employees[index].gender,
              game: csEmployee.game || csEmployee.games?.[0] || state.employees[index].game,
              level: csEmployee.level || csEmployee.maxRank || state.employees[index].level,
              todayOrders: csEmployee.todayOrders || 0,
              totalOrders: csEmployee.totalOrders || 0,
              rating: csEmployee.rating || 0,
              // 保存CS API返回的userId，用于游戏技能接口的X-User-Id请求头
              csEmployeeUserId: csEmployee.userId
            }
            console.log(`更新后员工 ${employee.name} 的性别:`, state.employees[index].gender)
          } else {
            console.warn(`未找到员工 ${employee.name} (ID: ${employee.id}) 的状态信息`)
          }
        })
      }
      
      console.log('合并状态信息后的员工数据:', state.employees)
    } catch (error) {
      console.warn('从CS API获取员工状态失败:', error)
    }
  },
  
  // 异步丰富员工详细信息
  async enrichEmployeeDetails() {
    try {
      // 并行获取所有员工的详细信息
      const enrichPromises = state.employees.map(async (employee) => {
        try {
          // 获取员工个人资料
          const profileResponse = await customerServiceAPI.getEmployeeProfile(employee.id)
          if (profileResponse.code === 0 && profileResponse.data) {
            // 更新员工信息
            const index = state.employees.findIndex(emp => emp.id === employee.id)
            if (index !== -1) {
              Object.assign(state.employees[index], {
                avatar: profileResponse.data.avatar || '',
                gender: profileResponse.data.gender || 'MALE',
                // 可以添加更多字段
              })
            }
          }
          
          // 获取员工游戏技能
          const skillsResponse = await customerServiceAPI.getEmployeeGameSkills(employee.id)
          if (skillsResponse.code === 0 && skillsResponse.data && skillsResponse.data.length > 0) {
            const index = state.employees.findIndex(emp => emp.id === employee.id)
            if (index !== -1) {
              const firstSkill = skillsResponse.data[0]
              Object.assign(state.employees[index], {
                game: firstSkill.gameName || '未设置',
                level: firstSkill.maxRank || '未设置',
                workStatus: firstSkill.workStatus || 'OFF_DUTY'
              })
            }
          }
        } catch (error) {
          console.warn(`获取员工 ${employee.name} 详细信息失败:`, error)
        }
      })
      
      await Promise.allSettled(enrichPromises)
      console.log('员工详细信息获取完成:', state.employees)
    } catch (error) {
      console.warn('丰富员工详细信息失败:', error)
    }
  },
  
  // 设置当前员工
  setCurrentEmployee(employee) {
    state.currentEmployee = employee
  },

  // 从轮询更新员工列表（避免不必要的副作用）
  updateEmployeeListFromPolling(employeeData) {
    console.log('从轮询更新员工列表:', employeeData)
    
    if (!Array.isArray(employeeData)) {
      console.warn('轮询数据不是数组，忽略更新')
      return
    }
    
    // 直接更新员工数据，不触发额外的API调用
    state.employees = employeeData.map(emp => ({
      ...emp,
      avatar: emp.avatar || '',
      workStatus: emp.workStatus || 'OFF_DUTY',
      gender: emp.gender || 'MALE',
      game: emp.game || '未设置',
      level: emp.level || '未设置',
      todayOrders: emp.todayOrders || 0,
      totalOrders: emp.totalOrders || 0,
      rating: emp.rating || 0
    }))
    
    console.log('员工列表已从轮询更新，数量:', state.employees.length)
  },

  // 获取员工个人资料
  async fetchEmployeeProfile(employeeId) {
    try {
      this.setLoading('employeeStatus', true)
      this.clearError()
      
      // 通过员工API获取个人资料
      const response = await customerServiceAPI.getEmployeeProfile(employeeId)
      
      if (response.code === 200 && response.data) {
        // 将个人资料信息合并到当前员工信息中
        if (state.currentEmployee && state.currentEmployee.id === employeeId) {
          state.currentEmployee = {
            ...state.currentEmployee,
            profile: response.data
          }
        }
        
        return {
          success: true,
          data: response.data
        }
      } else {
        throw new Error(response.message || '获取员工个人资料失败')
      }
    } catch (error) {
      this.setError(error.message || '获取员工个人资料失败，请稍后重试')
      return {
        success: false,
        message: error.message || '获取员工个人资料失败，请稍后重试'
      }
    } finally {
      this.setLoading('employeeStatus', false)
    }
  },

  // 获取员工游戏技能
  async fetchEmployeeGameSkills(employeeId) {
    try {
      this.setLoading('employeeStatus', true)
      this.clearError()
      
      // 通过游戏技能API获取员工技能
      const response = await customerServiceAPI.getEmployeeGameSkills(employeeId)
      
      if (response.code === 200 && response.data) {
        // 将游戏技能信息合并到当前员工信息中
        if (state.currentEmployee && state.currentEmployee.id === employeeId) {
          state.currentEmployee = {
            ...state.currentEmployee,
            gameSkills: response.data
          }
        }
        
        return {
          success: true,
          data: response.data
        }
      } else {
        throw new Error(response.message || '获取员工游戏技能失败')
      }
    } catch (error) {
      this.setError(error.message || '获取员工游戏技能失败，请稍后重试')
      return {
        success: false,
        message: error.message || '获取员工游戏技能失败，请稍后重试'
      }
    } finally {
      this.setLoading('employeeStatus', false)
    }
  },
  
  // 获取员工状态详情 - 仅获取基本资料，游戏技能由页面组件单独处理
  async fetchEmployeeStatus(employeeId) {
    try {
      this.setLoading('employeeStatus', true)
      this.clearError()
      
      // 只获取员工个人资料
      await this.fetchEmployeeProfile(employeeId)
      
      return {
        success: true,
        data: state.currentEmployee
      }
    } catch (error) {
      this.setError(error.message || '获取员工状态失败，请稍后重试')
      return {
        success: false,
        message: error.message || '获取员工状态失败，请稍后重试'
      }
    } finally {
      this.setLoading('employeeStatus', false)
    }
  },
  
  // 获取员工工作记录 - 由员工API直接提供
  async fetchWorkRecords(employeeId, params = {}) {
    try {
      this.setLoading('workRecords', true)
      this.clearError()
      
      // 直接使用员工API获取工作记录，不需要特殊的客服API
      const { getAssignedOrders } = await import('../api/employee')
      const response = await getAssignedOrders()
      
      if (response.code === 200 && response.data) {
        state.workRecords = response.data || []
        
        // 更新分页信息
        state.pagination.workRecords = {
          page: 1,
          pageSize: response.data.length || 10,
          total: response.data.length || 0
        }
        
        return {
          success: true,
          data: response.data
        }
      } else {
        throw new Error(response.message || '获取工作记录失败')
      }
    } catch (error) {
      this.setError(error.message || '获取工作记录失败，请稍后重试')
      return {
        success: false,
        message: error.message || '获取工作记录失败，请稍后重试'
      }
    } finally {
      this.setLoading('workRecords', false)
    }
  },
  
  // 发派工单
  async assignOrder(orderData) {
    try {
      this.clearError()
      
      console.log('发派工单接收到的数据:', orderData)
      
      // 检查字段是否存在
      const playStyleText = orderData.playStyle === 'TECHNICAL' ? '技术型' : 
                           orderData.playStyle === 'ENTERTAINMENT' ? '娱乐型' : '未设置'
      const serviceTypeText = orderData.serviceType === 'RANKED' ? '排位赛' : 
                             orderData.serviceType === 'CASUAL' ? '娱乐赛' : '未设置'
      
      // 转换数据格式以匹配API要求
      const apiData = {
        assignedEmployeeId: orderData.employeeId,
        clientInfo: `客户: ${orderData.customerName}, 游戏: ${orderData.game}, 陪玩类型: ${playStyleText}, 服务类型: ${serviceTypeText}, 等级: ${orderData.gameLevel}`,
        orderInfoScreenshotUrl: orderData.screenshot || null
      }
      
      console.log('发送给API的数据:', apiData)
      
      const response = await customerServiceAPI.createOrder(apiData)
      
      if (response.code === 200 || response.code === 200) {
        // 发派成功后，刷新员工列表以更新工单数量
        await this.fetchEmployees()
        
        return {
          success: true,
          message: response.message || '工单发派成功',
          data: response.data
        }
      } else {
        throw new Error(response.message || '工单发派失败')
      }
    } catch (error) {
      this.setError(error.message || '工单发派失败，请稍后重试')
      return {
        success: false,
        message: error.message || '工单发派失败，请稍后重试'
      }
    }
  },
  
  // 获取工单详情 - 简化版本，使用现有数据
  async fetchOrderDetail(orderId) {
    try {
      this.setLoading('orderDetail', true)
      this.clearError()
      
      // 从已有的派发工单列表中查找
      const order = state.dispatchedOrders.find(o => o.id === orderId)
      if (order) {
        state.currentOrder = order
        return {
          success: true,
          data: order
        }
      } else {
        throw new Error('工单不存在')
      }
    } catch (error) {
      this.setError(error.message || '获取工单详情失败，请稍后重试')
      return {
        success: false,
        message: error.message || '获取工单详情失败，请稍后重试'
      }
    } finally {
      this.setLoading('orderDetail', false)
    }
  },
  
  // 审核工单
  async auditOrder(orderId, auditData) {
    try {
      this.setLoading('audit', true)
      this.clearError()
      
      const response = await customerServiceAPI.auditOrder(orderId, auditData)
      
      if (response.code === 200) {
        // 审核成功后，更新当前工单状态
        if (state.currentOrder && state.currentOrder.id === orderId) {
          if (auditData.action === 'APPROVE') {
            state.currentOrder.status = 'COMPLETED'
          } else if (auditData.action === 'REJECT') {
            // 拒绝后设置为REJECTED，始终可以重新提交
            state.currentOrder.status = 'REJECTED'
          }
        }
        
        // 更新派发工单列表中对应的工单状态
        const orderIndex = state.dispatchedOrders.findIndex(o => o.id === orderId)
        if (orderIndex !== -1) {
          if (auditData.action === 'APPROVE') {
            state.dispatchedOrders[orderIndex].status = 'COMPLETED'
          } else if (auditData.action === 'REJECT') {
            // 拒绝后设置为REJECTED，始终可以重新提交
            state.dispatchedOrders[orderIndex].status = 'REJECTED'
          }
        }
        
        // 刷新工作记录列表
        if (state.currentEmployee) {
          await this.fetchWorkRecords(state.currentEmployee.id)
        }
        
        // 刷新派发工单列表
        await this.fetchDispatchedOrders()
        
        return {
          success: true,
          message: response.message || '工单审核成功',
          data: response.data
        }
      } else {
        throw new Error(response.message || '工单审核失败')
      }
    } catch (error) {
      this.setError(error.message || '工单审核失败，请稍后重试')
      return {
        success: false,
        message: error.message || '工单审核失败，请稍后重试'
      }
    } finally {
      this.setLoading('audit', false)
    }
  },
  
  // 清除当前员工数据
  clearCurrentEmployee() {
    state.currentEmployee = null
    state.employeeStatus = null
    state.workRecords = []
    state.currentOrder = null
  },
  
  // 更新员工状态
  updateEmployeeStatus(employeeId, newStatus) {
    const employee = state.employees.find(emp => emp.id === employeeId)
    if (employee) {
      employee.workStatus = newStatus
    }
    
    if (state.currentEmployee && state.currentEmployee.id === employeeId) {
      state.currentEmployee.workStatus = newStatus
    }
  },
  
  // 上传图片
  async uploadImage(file) {
    try {
      const response = await customerServiceAPI.uploadImage(file)
      
      if (response.code === 200 && response.data) {
        return {
          success: true,
          data: response.data
        }
      } else {
        throw new Error(response.message || '图片上传失败')
      }
    } catch (error) {
      return {
        success: false,
        message: error.message || '图片上传失败，请稍后重试'
      }
    }
  },

  // 获取派发工单列表
  async fetchDispatchedOrders(employeeId = null) {
    try {
      this.setLoading('dispatchedOrders', true)
      this.clearError()
      
      // 如果提供了employeeId，则过滤特定员工的工单
      const params = employeeId ? { assignedEmployeeId: employeeId } : {}
      const response = await customerServiceAPI.getOrders(params)
      
      if (response.code === 200 && response.data) {
        state.dispatchedOrders = response.data || []
        
        // 更新分页信息
        state.pagination.dispatchedOrders = {
          page: 1,
          pageSize: response.data.length || 10,
          total: response.data.length || 0
        }
        
        return {
          success: true,
          data: response.data
        }
      } else {
        throw new Error(response.message || '获取派发工单失败')
      }
    } catch (error) {
      this.setError(error.message || '获取派发工单失败，请稍后重试')
      return {
        success: false,
        message: error.message || '获取派发工单失败，请稍后重试'
      }
    } finally {
      this.setLoading('dispatchedOrders', false)
    }
  },

  // 其他工单管理方法已被实际的API接口替代
  // createOrder, updateOrderStatus, deleteOrder 等方法现在由具体的API直接调用
}

// 导出客服store
export default {
  state,
  getters,
  actions
}


