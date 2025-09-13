// 管理员状态管理
import { reactive, computed } from 'vue'
import * as adminAPI from '../api/admin'

// 创建响应式状态
const state = reactive({
  // 用户管理
  users: [],
  currentUser: null,
  
  // 系统统计
  systemStats: null,
  
  // 工单管理
  orders: [],
  
  // 操作日志
  operationLogs: [],
  
  // 加载状态
  loading: {
    users: false,
    createUser: false,
    updateUser: false,
    deleteUser: false,
    systemStats: false,
    orders: false,
    operationLogs: false
  },
  
  // 分页信息
  pagination: {
    users: {
      page: 1,
      pageSize: 10,
      total: 0
    },
    orders: {
      page: 1,
      pageSize: 10,
      total: 0
    },
    operationLogs: {
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
  // 用户列表
  userList: computed(() => state.users),
  
  // 当前用户
  currentUser: computed(() => state.currentUser),
  
  // 系统统计
  systemStats: computed(() => state.systemStats),
  
  // 工单列表
  orderList: computed(() => state.orders),
  
  // 操作日志
  operationLogs: computed(() => state.operationLogs),
  
  // 加载状态
  isLoading: computed(() => (key) => state.loading[key] || false),
  
  // 分页信息
  usersPagination: computed(() => state.pagination.users),
  ordersPagination: computed(() => state.pagination.orders),
  operationLogsPagination: computed(() => state.pagination.operationLogs),
  
  // 用户统计
  userStats: computed(() => {
    const total = state.users.length
    const active = state.users.filter(user => user.isActive).length
    const admins = state.users.filter(user => user.role === 'ADMIN').length
    const cs = state.users.filter(user => user.role === 'CS').length
    const employees = state.users.filter(user => user.role === 'EMPLOYEE').length
    
    return { total, active, admins, cs, employees }
  }),
  
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
  
  // 获取用户列表
  async fetchUsers() {
    try {
      this.setLoading('users', true)
      this.clearError()
      
      const response = await adminAPI.getUsers()
      
      if ((response.code === 0 || response.code === 200) && response.data) {
        console.log('Admin Store - 获取用户列表成功:', response.data)
        state.users = response.data || []
        
        // 更新分页信息
        state.pagination.users = {
          page: 1,
          pageSize: response.data.length || 10,
          total: response.data.length || 0
        }
        
        return {
          success: true,
          data: response.data
        }
      } else {
        console.error('Admin Store - 获取用户列表失败:', response)
        throw new Error(response.message || '获取用户列表失败')
      }
    } catch (error) {
      this.setError(error.message || '获取用户列表失败，请稍后重试')
      return {
        success: false,
        message: error.message || '获取用户列表失败，请稍后重试'
      }
    } finally {
      this.setLoading('users', false)
    }
  },
  
  // 创建客服用户
  async createUser(userData) {
    try {
      this.setLoading('createUser', true)
      this.clearError()
      
      console.log('Admin Store - 开始创建客服用户:', userData)
      const response = await adminAPI.createUser(userData)
      
      // 根据API文档，成功响应的code应该为0或200
      if (response.code === 0 || response.code === 200) {
        console.log('Admin Store - 客服用户创建成功:', {
          code: response.code,
          message: response.message,
          data: response.data,
          timestamp: response.timestamp,
          requestId: response.requestId
        })
        
        // 创建成功后，刷新用户列表
        await this.fetchUsers()
        
        return {
          success: true,
          message: response.message || '客服用户创建成功，默认密码为123456，用户已激活',
          data: response.data,
          requestId: response.requestId
        }
      } else {
        console.error('Admin Store - 客服用户创建失败:', response)
        throw new Error(response.message || '客服用户创建失败')
      }
    } catch (error) {
      console.error('Admin Store - 客服用户创建错误:', error)
      
      // 处理特定错误类型
      let errorMessage = '客服用户创建失败，请稍后重试'
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message
      } else if (error.message) {
        errorMessage = error.message
      }
      
      // 处理常见错误类型
      if (errorMessage.includes('Duplicate entry') && errorMessage.includes('username')) {
        errorMessage = '游戏昵称已存在，请使用不同的昵称'
      } else if (errorMessage.includes('username') && errorMessage.includes('required')) {
        errorMessage = '游戏昵称为必填项'
      } else if (errorMessage.includes('realName') && errorMessage.includes('required')) {
        errorMessage = '真实姓名为必填项'
      }
      
      this.setError(errorMessage)
      return {
        success: false,
        message: errorMessage
      }
    } finally {
      this.setLoading('createUser', false)
    }
  },
  
  // 更新用户
  async updateUser(userId, userData) {
    try {
      this.setLoading('updateUser', true)
      this.clearError()
      
      const response = await adminAPI.updateUser(userId, userData)
      
      if (response.code === 200 || response.code === 0) {
        // 更新成功后，刷新用户列表
        await this.fetchUsers()
        
        // 如果当前有选中的用户，更新其信息
        if (state.currentUser && state.currentUser.id === userId) {
          state.currentUser = { ...state.currentUser, ...userData }
        }
        
        return {
          success: true,
          message: response.message || '用户更新成功',
          data: response.data
        }
      } else {
        throw new Error(response.message || '用户更新失败')
      }
    } catch (error) {
      this.setError(error.message || '用户更新失败，请稍后重试')
      return {
        success: false,
        message: error.message || '用户更新失败，请稍后重试'
      }
    } finally {
      this.setLoading('updateUser', false)
    }
  },
  
  // 删除用户
  async deleteUser(userId) {
    try {
      this.setLoading('deleteUser', true)
      this.clearError()
      
      const response = await adminAPI.deleteUser(userId)
      
      if (response.code === 200 || response.code === 0) {
        // 删除成功后，刷新用户列表
        await this.fetchUsers()
        
        // 如果当前有选中的用户，清除它
        if (state.currentUser && state.currentUser.id === userId) {
          state.currentUser = null
        }
        
        return {
          success: true,
          message: response.message || '用户删除成功',
          data: response.data
        }
      } else {
        throw new Error(response.message || '用户删除失败')
      }
    } catch (error) {
      this.setError(error.message || '用户删除失败，请稍后重试')
      return {
        success: false,
        message: error.message || '用户删除失败，请稍后重试'
      }
    } finally {
      this.setLoading('deleteUser', false)
    }
  },
  
  // 设置当前用户
  setCurrentUser(user) {
    state.currentUser = user
  },
  
  // 获取系统统计
  async fetchSystemStats() {
    try {
      this.setLoading('systemStats', true)
      this.clearError()
      
      const response = await adminAPI.getSystemStats()
      
      if (response.code === 200 && response.data) {
        state.systemStats = response.data
        return {
          success: true,
          data: response.data
        }
      } else {
        throw new Error(response.message || '获取系统统计失败')
      }
    } catch (error) {
      this.setError(error.message || '获取系统统计失败，请稍后重试')
      return {
        success: false,
        message: error.message || '获取系统统计失败，请稍后重试'
      }
    } finally {
      this.setLoading('systemStats', false)
    }
  },
  
  // 获取工单列表
  async fetchOrders() {
    try {
      this.setLoading('orders', true)
      this.clearError()
      
      const response = await adminAPI.getOrders()
      
      if (response.code === 200 && response.data) {
        state.orders = response.data || []
        
        // 更新分页信息
        state.pagination.orders = {
          page: 1,
          pageSize: response.data.length || 10,
          total: response.data.length || 0
        }
        
        return {
          success: true,
          data: response.data
        }
      } else {
        throw new Error(response.message || '获取工单列表失败')
      }
    } catch (error) {
      this.setError(error.message || '获取工单列表失败，请稍后重试')
      return {
        success: false,
        message: error.message || '获取工单列表失败，请稍后重试'
      }
    } finally {
      this.setLoading('orders', false)
    }
  },
  
  // 获取操作日志
  async fetchOperationLogs(params = {}) {
    try {
      this.setLoading('operationLogs', true)
      this.clearError()
      
      const response = await adminAPI.getOperationLogs(params)
      
      if (response.code === 200 && response.data) {
        state.operationLogs = response.data || []
        
        // 更新分页信息
        state.pagination.operationLogs = {
          page: params.page || 1,
          pageSize: params.pageSize || 10,
          total: response.data.length || 0
        }
        
        return {
          success: true,
          data: response.data
        }
      } else {
        throw new Error(response.message || '获取操作日志失败')
      }
    } catch (error) {
      this.setError(error.message || '获取操作日志失败，请稍后重试')
      return {
        success: false,
        message: error.message || '获取操作日志失败，请稍后重试'
      }
    } finally {
      this.setLoading('operationLogs', false)
    }
  },
  
  // 清除当前用户数据
  clearCurrentUser() {
    state.currentUser = null
  }
}

// 导出管理员store
export default {
  state,
  getters,
  actions
}