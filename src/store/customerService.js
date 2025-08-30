// 客服状态管理
import { reactive, computed } from 'vue'
import * as customerServiceAPI from '../api/customerService'

// 创建响应式状态
const state = reactive({
  // 员工相关
  employees: [],
  currentEmployee: null,
  employeeStatus: null,
  workRecords: [],
  
  // 工单相关
  currentOrder: null,
  
  // 加载状态
  loading: {
    employees: false,
    employeeStatus: false,
    workRecords: false,
    orderDetail: false,
    audit: false
  },
  
  // 分页信息
  pagination: {
    workRecords: {
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
  employeeList: computed(() => state.employees),
  
  // 当前员工信息
  currentEmployee: computed(() => state.currentEmployee),
  
  // 员工状态详情
  employeeStatus: computed(() => state.employeeStatus),
  
  // 工作记录列表
  workRecordList: computed(() => state.workRecords),
  
  // 当前工单详情
  currentOrderDetail: computed(() => state.currentOrder),
  
  // 加载状态
  isLoading: computed(() => (key) => state.loading[key] || false),
  
  // 工作记录分页信息
  workRecordsPagination: computed(() => state.pagination.workRecords),
  
  // 在线员工数量
  onlineEmployeeCount: computed(() => 
    state.employees.filter(emp => emp.status !== 'offline').length
  ),
  
  // 工作中员工数量
  workingEmployeeCount: computed(() => 
    state.employees.filter(emp => emp.status === 'working').length
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
      
      const response = await customerServiceAPI.getEmployees()
      
      if (response.code === 200 && response.data) {
        state.employees = response.data.employees || []
        return {
          success: true,
          data: response.data.employees
        }
      } else {
        throw new Error(response.message || '获取员工列表失败')
      }
    } catch (error) {
      this.setError(error.message || '获取员工列表失败，请稍后重试')
      return {
        success: false,
        message: error.message || '获取员工列表失败，请稍后重试'
      }
    } finally {
      this.setLoading('employees', false)
    }
  },
  
  // 设置当前员工
  setCurrentEmployee(employee) {
    state.currentEmployee = employee
  },
  
  // 获取员工状态详情
  async fetchEmployeeStatus(employeeId) {
    try {
      this.setLoading('employeeStatus', true)
      this.clearError()
      
      const response = await customerServiceAPI.getEmployeeStatus(employeeId)
      
      if (response.code === 200 && response.data) {
        state.employeeStatus = response.data.employee
        return {
          success: true,
          data: response.data.employee
        }
      } else {
        throw new Error(response.message || '获取员工状态失败')
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
  
  // 获取员工工作记录
  async fetchWorkRecords(employeeId, params = {}) {
    try {
      this.setLoading('workRecords', true)
      this.clearError()
      
      const response = await customerServiceAPI.getEmployeeWorkRecords(employeeId, params)
      
      if (response.code === 200 && response.data) {
        state.workRecords = response.data.records || []
        
        // 更新分页信息
        if (response.data.pagination) {
          state.pagination.workRecords = {
            page: response.data.pagination.page || 1,
            pageSize: response.data.pagination.pageSize || 10,
            total: response.data.pagination.total || 0
          }
        }
        
        return {
          success: true,
          data: response.data.records
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
      
      const response = await customerServiceAPI.assignOrder(orderData)
      
      if (response.code === 200) {
        // 发派成功后，刷新工作记录
        if (orderData.employeeId) {
          await this.fetchWorkRecords(orderData.employeeId)
        }
        
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
  
  // 获取工单详情
  async fetchOrderDetail(orderId) {
    try {
      this.setLoading('orderDetail', true)
      this.clearError()
      
      const response = await customerServiceAPI.getOrderDetail(orderId)
      
      if (response.code === 200 && response.data) {
        state.currentOrder = response.data.order
        return {
          success: true,
          data: response.data.order
        }
      } else {
        throw new Error(response.message || '获取工单详情失败')
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
          state.currentOrder.status = auditData.action === 'approve' ? 'approved' : 'rejected'
        }
        
        // 刷新工作记录列表
        if (state.currentEmployee) {
          await this.fetchWorkRecords(state.currentEmployee.id)
        }
        
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
      employee.status = newStatus
    }
    
    if (state.currentEmployee && state.currentEmployee.id === employeeId) {
      state.currentEmployee.status = newStatus
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
  }
}

// 导出客服store
export default {
  state,
  getters,
  actions
}
