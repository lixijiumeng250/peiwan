// Mock API服务 - 用于前端独立开发
import config from '../config'

// 模拟延迟
const delay = (ms = 800) => new Promise(resolve => setTimeout(resolve, ms))

// 模拟用户数据
const mockUsers = [
  {
    id: 1,
    username: 'admin',
    email: 'admin@example.com',
    phone: '13800138000',
    password: 'admin123',
    avatar: 'https://picsum.photos/100/100?random=1',
    role: 'admin',
    created_at: '2023-01-01T00:00:00Z',
    last_login: '2023-12-01T12:00:00Z'
  },
  {
    id: 2,
    username: 'testuser',
    email: 'test@example.com',
    phone: '13800138001',
    password: 'test123',
    avatar: 'https://picsum.photos/100/100?random=2',
    role: 'user',
    created_at: '2023-06-01T00:00:00Z',
    last_login: '2023-12-01T10:00:00Z'
  },
  {
    id: 3,
    username: 'kefu01',
    email: 'kefu01@example.com',
    phone: '13800138002',
    password: 'kefu123',
    avatar: 'https://picsum.photos/100/100?random=3',
    role: 'customer-service',
    created_at: '2023-03-01T00:00:00Z',
    last_login: '2023-12-01T09:00:00Z'
  }
]

// 存储当前登录用户
let currentUser = null

// 初始化时从localStorage恢复用户状态
const initCurrentUser = () => {
  try {
    const userInfo = localStorage.getItem('user_info')
    if (userInfo) {
      currentUser = JSON.parse(userInfo)
    }
  } catch (error) {
    console.error('恢复用户状态失败:', error)
    currentUser = null
  }
}

// 初始化用户状态
initCurrentUser()

// 模拟员工数据
const mockEmployees = [
  {
    id: 1,
    name: '梦之追忆',
    avatar: 'https://picsum.photos/100/100?random=11',
    status: 'working',
    game: '王者荣耀',
    level: '王者50星',
    orderWillingness: 85,
    todayOrders: 3,
    totalOrders: 156,
    rating: 4.8,
    personalInfo: {
      gender: '男',
      age: 25,
      games: ['王者荣耀', '和平精英'],
      specialties: ['技术陪练', '娱乐陪玩'],
      maxRank: '王者50星'
    },
    workStatus: {
      orderWillingness: 85,
      currentOrders: 2,
      todayWorkHours: 6.5,
      weeklyWorkHours: 42,
      lastActiveTime: '2023-12-01T14:30:00Z'
    }
  },
  {
    id: 2,
    name: '竞学弟',
    avatar: 'https://picsum.photos/100/100?random=12',
    status: 'idle',
    game: '英雄联盟',
    level: '钻石1',
    orderWillingness: 92,
    todayOrders: 1,
    totalOrders: 89,
    rating: 4.6,
    personalInfo: {
      gender: '男',
      age: 22,
      games: ['英雄联盟', '三角洲'],
      specialties: ['技术陪练', '代练上分'],
      maxRank: '钻石1'
    },
    workStatus: {
      orderWillingness: 92,
      currentOrders: 0,
      todayWorkHours: 2.5,
      weeklyWorkHours: 28,
      lastActiveTime: '2023-12-01T13:45:00Z'
    }
  },
  {
    id: 3,
    name: '清水健',
    avatar: 'https://picsum.photos/100/100?random=13',
    status: 'idle',
    game: '和平精英',
    level: '战神',
    orderWillingness: 78,
    todayOrders: 2,
    totalOrders: 234,
    rating: 4.9,
    personalInfo: {
      gender: '男',
      age: 28,
      games: ['和平精英', '王者荣耀'],
      specialties: ['娱乐陪玩', '技术陪练'],
      maxRank: '战神'
    },
    workStatus: {
      orderWillingness: 78,
      currentOrders: 1,
      todayWorkHours: 4.0,
      weeklyWorkHours: 35,
      lastActiveTime: '2023-12-01T12:20:00Z'
    }
  }
]

// 模拟工作记录数据
const mockWorkRecords = [
  {
    id: 1,
    orderNumber: '114514',
    employeeId: 1,
    employeeName: '梦之追忆',
    customerName: '浩二',
    game: '三角洲',
    serviceType: '技术陪练',
    gameLevel: '王者50星',
    status: 'pending_audit',
    screenshots: {
      assignment: 'https://picsum.photos/400/300?random=21',
      completion: 'https://picsum.photos/400/300?random=22'
    },
    createdAt: '2023-12-01T10:00:00Z',
    completedAt: '2023-12-01T12:00:00Z',
    auditHistory: [
      {
        action: 'submitted',
        time: '2023-12-01T12:00:00Z',
        note: '员工提交工单'
      }
    ]
  },
  {
    id: 2,
    orderNumber: '666',
    employeeId: 2,
    employeeName: '竞学弟',
    customerName: '少梦',
    game: '英雄联盟',
    serviceType: '代练上分',
    gameLevel: '黄金3',
    status: 'approved',
    screenshots: {
      assignment: 'https://picsum.photos/400/300?random=23',
      completion: 'https://picsum.photos/400/300?random=24'
    },
    createdAt: '2023-11-30T09:00:00Z',
    completedAt: '2023-11-30T15:00:00Z',
    auditHistory: [
      {
        action: 'submitted',
        time: '2023-11-30T15:00:00Z',
        note: '员工提交工单'
      },
      {
        action: 'approved',
        time: '2023-11-30T15:30:00Z',
        note: '客服审核通过'
      }
    ]
  },
  {
    id: 3,
    orderNumber: '2233',
    employeeId: 3,
    employeeName: '清水健',
    customerName: '国际猪',
    game: '王者荣耀',
    serviceType: '娱乐陪玩',
    gameLevel: '星耀2',
    status: 'rejected',
    screenshots: {
      assignment: 'https://picsum.photos/400/300?random=25',
      completion: 'https://picsum.photos/400/300?random=26'
    },
    createdAt: '2023-11-29T14:00:00Z',
    completedAt: '2023-11-29T18:00:00Z',
    auditHistory: [
      {
        action: 'submitted',
        time: '2023-11-29T18:00:00Z',
        note: '员工提交工单'
      },
      {
        action: 'rejected',
        time: '2023-11-29T18:15:00Z',
        note: '截图不清晰，请重新提交'
      }
    ]
  }
]

// Mock API响应格式
const createResponse = (data, message = '操作成功', code = 200) => ({
  code,
  message,
  data,
  timestamp: new Date().toISOString()
})

// Mock API方法
export const mockAPI = {
  // 用户登录
  async login(loginData) {
    await delay()
    
    console.log('🚀 Mock API: 登录请求', loginData)
    
    const user = mockUsers.find(u => 
      u.username === loginData.username && u.password === loginData.password
    )
    
    if (!user) {
      throw {
        code: 401,
        message: '用户名或密码错误',
        data: null
      }
    }
    
    // 生成模拟token
    const accessToken = `mock_access_token_${user.id}_${Date.now()}`
    const refreshToken = `mock_refresh_token_${user.id}_${Date.now()}`
    
    currentUser = { ...user }
    delete currentUser.password // 不返回密码
    
    return createResponse({
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_in: 7200,
      user: currentUser
    }, '登录成功')
  },
  
  // 用户注册
  async register(registerData) {
    await delay(1200)
    
    console.log('🚀 Mock API: 注册请求', registerData)
    
    // 检查用户名是否存在
    if (mockUsers.find(u => u.username === registerData.username)) {
      throw {
        code: 400,
        message: '注册失败',
        data: {
          errors: {
            username: ['用户名已存在']
          }
        }
      }
    }
    
    // 检查邮箱是否存在
    if (mockUsers.find(u => u.email === registerData.email)) {
      throw {
        code: 400,
        message: '注册失败',
        data: {
          errors: {
            email: ['邮箱已被注册']
          }
        }
      }
    }
    
    // 创建新用户
    const newUser = {
      id: mockUsers.length + 1,
      username: registerData.username,
      email: registerData.email,
      phone: registerData.phone,
      avatar: `https://picsum.photos/100/100?random=${mockUsers.length + 1}`,
      role: 'user',
      created_at: new Date().toISOString()
    }
    
    mockUsers.push({ ...newUser, password: registerData.password })
    
    return createResponse({
      user: newUser
    }, '注册成功')
  },
  
  // 刷新token
  async refreshToken(refreshToken) {
    await delay(300)
    
    console.log('🚀 Mock API: 刷新token', refreshToken)
    
    if (!currentUser) {
      throw {
        code: 401,
        message: '无效的刷新令牌'
      }
    }
    
    const newAccessToken = `mock_access_token_${currentUser.id}_${Date.now()}`
    
    return createResponse({
      access_token: newAccessToken,
      expires_in: 7200
    }, '令牌刷新成功')
  },
  
  // 用户登出
  async logout() {
    await delay(300)
    
    console.log('🚀 Mock API: 登出请求')
    
    currentUser = null
    
    return createResponse(null, '登出成功')
  },
  
  // 获取当前用户信息
  async getCurrentUser() {
    await delay(500)
    
    console.log('🚀 Mock API: 获取用户信息')
    
    if (!currentUser) {
      throw {
        code: 401,
        message: '未登录或登录已过期'
      }
    }
    
    return createResponse({
      user: { ...currentUser, last_login: new Date().toISOString() }
    }, '获取用户信息成功')
  },
  
  // 检查用户名可用性
  async checkUsernameAvailability(username) {
    await delay(400)
    
    console.log('🚀 Mock API: 检查用户名可用性', username)
    
    const exists = mockUsers.find(u => u.username === username)
    
    return createResponse({
      available: !exists
    }, exists ? '用户名已存在' : '用户名可用')
  },
  
  // 检查邮箱可用性
  async checkEmailAvailability(email) {
    await delay(400)
    
    console.log('🚀 Mock API: 检查邮箱可用性', email)
    
    const exists = mockUsers.find(u => u.email === email)
    
    return createResponse({
      available: !exists
    }, exists ? '邮箱已被注册' : '邮箱可用')
  },
  
  // 修改密码
  async changePassword(passwordData) {
    await delay(600)
    
    console.log('🚀 Mock API: 修改密码')
    
    if (!currentUser) {
      throw {
        code: 401,
        message: '未登录或登录已过期'
      }
    }
    
    const user = mockUsers.find(u => u.id === currentUser.id)
    if (!user || user.password !== passwordData.oldPassword) {
      throw {
        code: 400,
        message: '原密码错误'
      }
    }
    
    user.password = passwordData.newPassword
    
    return createResponse(null, '密码修改成功')
  },
  
  // 忘记密码
  async forgotPassword(email) {
    await delay(800)
    
    console.log('🚀 Mock API: 忘记密码', email)
    
    const user = mockUsers.find(u => u.email === email)
    if (!user) {
      throw {
        code: 404,
        message: '邮箱地址不存在'
      }
    }
    
    return createResponse(null, '重置密码邮件已发送')
  },
  
  // 重置密码
  async resetPassword(resetData) {
    await delay(600)
    
    console.log('🚀 Mock API: 重置密码', resetData)
    
    // 模拟token验证
    if (!resetData.token || resetData.token !== 'valid_reset_token') {
      throw {
        code: 400,
        message: '无效或已过期的重置令牌'
      }
    }
    
    return createResponse(null, '密码重置成功')
  },

  // === 客服相关API ===
  
  // 获取员工列表
  async getEmployees() {
    await delay(600)
    
    console.log('🚀 Mock API: 获取员工列表')
    
    // 如果currentUser为空，尝试从localStorage恢复
    if (!currentUser) {
      initCurrentUser()
    }
    
    console.log('🚀 Mock API: 当前用户', currentUser)
    
    if (!currentUser || !['customer-service', 'admin'].includes(currentUser.role)) {
      throw {
        code: 403,
        message: '没有权限访问'
      }
    }
    
    return createResponse({
      employees: mockEmployees
    }, '获取员工列表成功')
  },
  
  // 获取员工状态详情
  async getEmployeeStatus(employeeId) {
    await delay(500)
    
    console.log('🚀 Mock API: 获取员工状态详情', employeeId)
    
    // 如果currentUser为空，尝试从localStorage恢复
    if (!currentUser) {
      initCurrentUser()
    }
    
    if (!currentUser || !['customer-service', 'admin'].includes(currentUser.role)) {
      throw {
        code: 403,
        message: '没有权限访问'
      }
    }
    
    const employee = mockEmployees.find(emp => emp.id === parseInt(employeeId))
    if (!employee) {
      throw {
        code: 404,
        message: '员工不存在'
      }
    }
    
    return createResponse({
      employee: employee
    }, '获取员工状态成功')
  },
  
  // 获取员工工作记录
  async getEmployeeWorkRecords(employeeId, params = {}) {
    await delay(700)
    
    console.log('🚀 Mock API: 获取员工工作记录', employeeId, params)
    
    // 如果currentUser为空，尝试从localStorage恢复
    if (!currentUser) {
      initCurrentUser()
    }
    
    if (!currentUser || !['customer-service', 'admin'].includes(currentUser.role)) {
      throw {
        code: 403,
        message: '没有权限访问'
      }
    }
    
    let records = mockWorkRecords.filter(record => record.employeeId === parseInt(employeeId))
    
    // 状态筛选
    if (params.status) {
      records = records.filter(record => record.status === params.status)
    }
    
    // 日期筛选
    if (params.startDate && params.endDate) {
      records = records.filter(record => {
        const recordDate = new Date(record.createdAt).toDateString()
        const startDate = new Date(params.startDate).toDateString()
        const endDate = new Date(params.endDate).toDateString()
        return recordDate >= startDate && recordDate <= endDate
      })
    }
    
    // 排序
    if (params.sortBy) {
      records.sort((a, b) => {
        const aVal = a[params.sortBy]
        const bVal = b[params.sortBy]
        if (params.sortOrder === 'desc') {
          return bVal > aVal ? 1 : -1
        } else {
          return aVal > bVal ? 1 : -1
        }
      })
    }
    
    // 分页
    const page = parseInt(params.page) || 1
    const pageSize = parseInt(params.pageSize) || 10
    const start = (page - 1) * pageSize
    const end = start + pageSize
    const paginatedRecords = records.slice(start, end)
    
    return createResponse({
      records: paginatedRecords,
      pagination: {
        page: page,
        pageSize: pageSize,
        total: records.length
      }
    }, '获取工作记录成功')
  },
  
  // 发派工单
  async assignOrder(orderData) {
    await delay(800)
    
    console.log('🚀 Mock API: 发派工单', orderData)
    
    // 如果currentUser为空，尝试从localStorage恢复
    if (!currentUser) {
      initCurrentUser()
    }
    
    if (!currentUser || !['customer-service', 'admin'].includes(currentUser.role)) {
      throw {
        code: 403,
        message: '没有权限操作'
      }
    }
    
    const employee = mockEmployees.find(emp => emp.id === parseInt(orderData.employeeId))
    if (!employee) {
      throw {
        code: 404,
        message: '员工不存在'
      }
    }
    
    if (employee.status === 'offline') {
      throw {
        code: 400,
        message: '员工离线，无法发派工单'
      }
    }
    
    // 生成新工单
    const newOrder = {
      id: mockWorkRecords.length + 1,
      orderNumber: Math.floor(Math.random() * 900000) + 100000,
      employeeId: parseInt(orderData.employeeId),
      employeeName: employee.name,
      customerName: orderData.customerName,
      game: orderData.game,
      serviceType: orderData.serviceType,
      gameLevel: orderData.gameLevel,
      status: 'pending_audit',
      screenshots: {
        assignment: orderData.screenshot ? 'https://picsum.photos/400/300?random=' + (Date.now()) : null,
        completion: null
      },
      createdAt: new Date().toISOString(),
      completedAt: null,
      auditHistory: [
        {
          action: 'assigned',
          time: new Date().toISOString(),
          note: '客服发派工单给员工'
        }
      ]
    }
    
    mockWorkRecords.push(newOrder)
    
    // 更新员工今日工单数
    employee.todayOrders += 1
    employee.totalOrders += 1
    
    return createResponse({
      order: newOrder
    }, '工单发派成功')
  },
  
  // 获取工单详情
  async getOrderDetail(orderId) {
    await delay(400)
    
    console.log('🚀 Mock API: 获取工单详情', orderId)
    
    // 如果currentUser为空，尝试从localStorage恢复
    if (!currentUser) {
      initCurrentUser()
    }
    
    if (!currentUser || !['customer-service', 'admin'].includes(currentUser.role)) {
      throw {
        code: 403,
        message: '没有权限访问'
      }
    }
    
    const order = mockWorkRecords.find(record => record.id === parseInt(orderId))
    if (!order) {
      throw {
        code: 404,
        message: '工单不存在'
      }
    }
    
    return createResponse({
      order: order
    }, '获取工单详情成功')
  },
  
  // 审核工单
  async auditOrder(orderId, auditData) {
    await delay(600)
    
    console.log('🚀 Mock API: 审核工单', orderId, auditData)
    
    // 如果currentUser为空，尝试从localStorage恢复
    if (!currentUser) {
      initCurrentUser()
    }
    
    if (!currentUser || !['customer-service', 'admin'].includes(currentUser.role)) {
      throw {
        code: 403,
        message: '没有权限操作'
      }
    }
    
    const order = mockWorkRecords.find(record => record.id === parseInt(orderId))
    if (!order) {
      throw {
        code: 404,
        message: '工单不存在'
      }
    }
    
    if (order.status !== 'pending_audit') {
      throw {
        code: 400,
        message: '工单状态不允许审核'
      }
    }
    
    // 更新工单状态
    order.status = auditData.action === 'approve' ? 'approved' : 'rejected'
    
    // 添加审核历史
    order.auditHistory.push({
      action: auditData.action === 'approve' ? 'approved' : 'rejected',
      time: new Date().toISOString(),
      note: auditData.note || (auditData.action === 'approve' ? '客服审核通过' : '客服审核拒绝')
    })
    
    return createResponse({
      order: order
    }, auditData.action === 'approve' ? '工单审核通过' : '工单审核拒绝')
  }
}

// 导出是否启用Mock模式的判断
export const isMockEnabled = () => {
  return config.dev.enableMock && import.meta.env.DEV
}

export default mockAPI
