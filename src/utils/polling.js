// 轮询刷新工具类
class PollingManager {
  constructor() {
    this.timers = new Map() // 存储不同组件的轮询定时器
    this.dataCache = new Map() // 存储每个轮询的数据缓存，用于比对
    this.defaultInterval = 10000 // 默认10秒轮询一次
    this.isPageVisible = true // 页面是否可见
    this.isShuttingDown = false // 是否正在关闭轮询系统
    this.setupVisibilityListener()
  }

  // 设置页面可见性监听
  setupVisibilityListener() {
    document.addEventListener('visibilitychange', () => {
      this.isPageVisible = !document.hidden
      if (this.isPageVisible) {
        // 页面重新可见时，立即刷新所有轮询
        this.refreshAllPolling()
      } else {
        // 页面隐藏时，暂停所有轮询
        this.pauseAllPolling()
      }
    })
  }

  // 开始轮询
  startPolling(key, callback, interval = this.defaultInterval) {
    // 如果已经存在，先清除
    this.stopPolling(key)
    
    const timer = setInterval(() => {
      if (this.isPageVisible) {
        try {
          callback()
        } catch (error) {
          console.warn(`轮询回调执行失败 ${key}:`, error)
        }
      }
    }, interval)
    
    this.timers.set(key, timer)
    console.log(`开始轮询: ${key}, 间隔: ${interval}ms`)
  }

  // 开始智能轮询（带数据比对）
  startSmartPolling(key, dataFetcher, onDataChange, interval = this.defaultInterval) {
    // 如果已经存在，先清除
    this.stopPolling(key)
    
    const timer = setInterval(async () => {
      if (this.isPageVisible) {
        try {
          const newData = await dataFetcher()
          const cachedData = this.dataCache.get(key)
          
          // 比对数据是否发生变化
          if (this.hasDataChanged(cachedData, newData)) {
            console.log(`检测到数据变化: ${key}`)
            
            // 详细记录变化内容
            let changes = []
            if (cachedData && newData) {
              changes = this.logDataChanges(key, cachedData, newData)
            }
            
            this.dataCache.set(key, this.cloneData(newData))
            onDataChange(newData, cachedData, changes)
          } else {
            console.log(`数据未变化: ${key}`)
          }
        } catch (error) {
          console.warn(`智能轮询出错 ${key}:`, error)
        }
      }
    }, interval)
    
    this.timers.set(key, timer)
    console.log(`开始智能轮询: ${key}, 间隔: ${interval}ms`)
    
    // 立即执行一次以获取初始数据
    if (this.isPageVisible) {
      dataFetcher().then(data => {
        this.dataCache.set(key, this.cloneData(data))
      }).catch(error => {
        console.warn(`获取初始数据失败 ${key}:`, error)
      })
    }
  }

  // 开始工单智能轮询（专门针对工单数据的轮询）
  startOrderSmartPolling(key, dataFetcher, onOrderChange, interval = this.defaultInterval) {
    // 如果已经存在，先清除
    this.stopPolling(key)
    
    const timer = setInterval(async () => {
      if (this.isPageVisible) {
        try {
          const newData = await dataFetcher()
          const cachedData = this.dataCache.get(key)
          
          // 比对数据是否发生变化
          if (this.hasDataChanged(cachedData, newData)) {
            console.log(`检测到工单数据变化: ${key}`)
            
            // 详细记录工单变化内容
            let changes = []
            if (cachedData && newData && Array.isArray(cachedData) && Array.isArray(newData)) {
              changes = this.logOrderListChanges(key, cachedData, newData)
            }
            
            this.dataCache.set(key, this.cloneData(newData))
            
            // 如果有变化，调用回调函数并传递变化详情
            if (changes.length > 0) {
              onOrderChange(newData, cachedData, changes)
            } else {
              // 即使没有详细变化记录，也可能有数据更新
              onOrderChange(newData, cachedData, [])
            }
          }
        } catch (error) {
          console.warn(`工单智能轮询出错 ${key}:`, error)
        }
      }
    }, interval)
    
    this.timers.set(key, timer)
    console.log(`开始工单智能轮询: ${key}, 间隔: ${interval}ms`)
    
    // 立即执行一次以获取初始数据
    if (this.isPageVisible) {
      dataFetcher().then(data => {
        this.dataCache.set(key, this.cloneData(data))
      }).catch(error => {
        console.warn(`获取工单初始数据失败 ${key}:`, error)
      })
    }
  }

  // 停止轮询
  stopPolling(key) {
    const timer = this.timers.get(key)
    if (timer) {
      clearInterval(timer)
      this.timers.delete(key)
      // 清除缓存数据
      this.dataCache.delete(key)
      console.log(`停止轮询: ${key}`)
    }
  }

  // 暂停所有轮询
  pauseAllPolling() {
    console.log('页面隐藏，暂停所有轮询')
  }

  // 刷新所有轮询
  refreshAllPolling() {
    console.log('页面可见，刷新所有轮询')
  }

  // 清除所有轮询
  clearAllPolling() {
    console.log(`🧹 开始清除所有轮询，当前活跃轮询数量: ${this.timers.size}`)
    console.log(`🧹 活跃轮询键列表:`, Array.from(this.timers.keys()))
    
    this.timers.forEach((timer, key) => {
      try {
        clearInterval(timer)
        console.log(`✅ 已清除轮询: ${key}`)
      } catch (e) {
        console.warn(`⚠️ 清除轮询失败 ${key}:`, e)
      }
    })
    this.timers.clear()
    
    // 清除所有缓存数据
    this.dataCache.clear()
    console.log(`🧹 轮询清理完成，剩余轮询数量: ${this.timers.size}`)
    
    // 额外保险：延迟检查是否有残留轮询
    setTimeout(() => {
      if (this.timers.size > 0) {
        console.warn(`🚨 发现残留轮询，重新清理:`, Array.from(this.timers.keys()))
        this.timers.forEach((timer, key) => {
          try {
            clearInterval(timer)
            console.log(`🔄 重新清除轮询: ${key}`)
          } catch (e) {
            console.warn(`⚠️ 重新清除轮询失败 ${key}:`, e)
          }
        })
        this.timers.clear()
      }
    }, 100)
  }

  // 检查是否有活跃的轮询
  hasActivePolling(key) {
    return this.timers.has(key)
  }

  // 获取所有活跃的轮询键
  getActivePollingKeys() {
    return Array.from(this.timers.keys())
  }

  // 数据比对方法
  hasDataChanged(oldData, newData) {
    if (!oldData && !newData) return false
    if (!oldData || !newData) return true
    
    // 使用JSON序列化进行深度比较
    try {
      const oldStr = JSON.stringify(this.sortObjectKeys(oldData))
      const newStr = JSON.stringify(this.sortObjectKeys(newData))
      return oldStr !== newStr
    } catch (error) {
      console.warn('数据比对失败:', error)
      return true // 比对失败时默认认为数据有变化
    }
  }

  // 深度克隆数据
  cloneData(data) {
    try {
      return JSON.parse(JSON.stringify(data))
    } catch (error) {
      console.warn('数据克隆失败:', error)
      return data
    }
  }

  // 对象键排序，确保比较的一致性
  sortObjectKeys(obj) {
    if (obj === null || typeof obj !== 'object') {
      return obj
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.sortObjectKeys(item))
    }
    
    const sortedKeys = Object.keys(obj).sort()
    const sortedObj = {}
    
    sortedKeys.forEach(key => {
      sortedObj[key] = this.sortObjectKeys(obj[key])
    })
    
    return sortedObj
  }

  // 记录数据变化详情
  logDataChanges(key, oldData, newData) {
    try {
      // 如果是数组数据，根据key判断是员工还是工单数据
      if (Array.isArray(oldData) && Array.isArray(newData)) {
        if (key.includes('order') || key.includes('work-record')) {
          // 工单相关数据
          return this.logOrderListChanges(key, oldData, newData)
        } else {
          // 员工列表数据
          this.logEmployeeListChanges(key, oldData, newData)
        }
      } else {
        console.log(`${key} 数据结构发生变化`)
      }
    } catch (error) {
      console.warn('记录数据变化失败:', error)
    }
    return []
  }

  // 记录员工列表的具体变化
  logEmployeeListChanges(key, oldList, newList) {
    const changes = []
    
    // 创建员工ID映射
    const oldMap = new Map(oldList.map(emp => [emp.id, emp]))
    const newMap = new Map(newList.map(emp => [emp.id, emp]))
    
    // 检查新增的员工
    newList.forEach(newEmp => {
      if (!oldMap.has(newEmp.id)) {
        changes.push(`➕ 新增员工: ${newEmp.name || newEmp.username} (ID: ${newEmp.id})`)
      }
    })
    
    // 检查删除的员工
    oldList.forEach(oldEmp => {
      if (!newMap.has(oldEmp.id)) {
        changes.push(`➖ 删除员工: ${oldEmp.name || oldEmp.username} (ID: ${oldEmp.id})`)
      }
    })
    
    // 检查修改的员工
    newList.forEach(newEmp => {
      const oldEmp = oldMap.get(newEmp.id)
      if (oldEmp) {
        const empChanges = this.getEmployeeChanges(oldEmp, newEmp)
        if (empChanges.length > 0) {
          changes.push(`🔄 ${newEmp.name || newEmp.username} (ID: ${newEmp.id}): ${empChanges.join(', ')}`)
        }
      }
    })
    
    if (changes.length > 0) {
      console.log(`📋 ${key} 变化详情:`)
      changes.forEach(change => console.log(`  ${change}`))
    }
  }

  // 记录工单列表的具体变化
  logOrderListChanges(key, oldList, newList) {
    const changes = []
    
    // 创建工单ID映射
    const oldMap = new Map(oldList.map(order => [order.id || order.orderNumber, order]))
    const newMap = new Map(newList.map(order => [order.id || order.orderNumber, order]))
    
    // 检查新增的工单
    newList.forEach(newOrder => {
      const orderId = newOrder.id || newOrder.orderNumber
      if (!oldMap.has(orderId)) {
        changes.push(`➕ 新增工单: ${newOrder.orderNumber || orderId} - ${newOrder.customerName || '未知客户'}`)
      }
    })
    
    // 检查删除的工单
    oldList.forEach(oldOrder => {
      const orderId = oldOrder.id || oldOrder.orderNumber
      if (!newMap.has(orderId)) {
        changes.push(`➖ 删除工单: ${oldOrder.orderNumber || orderId} - ${oldOrder.customerName || '未知客户'}`)
      }
    })
    
    // 检查修改的工单
    newList.forEach(newOrder => {
      const orderId = newOrder.id || newOrder.orderNumber
      const oldOrder = oldMap.get(orderId)
      if (oldOrder) {
        const orderChanges = this.getOrderChanges(oldOrder, newOrder)
        if (orderChanges.length > 0) {
          changes.push(`🔄 工单 ${newOrder.orderNumber || orderId}: ${orderChanges.join(', ')}`)
        }
      }
    })
    
    if (changes.length > 0) {
      console.log(`📋 ${key} 工单变化详情:`)
      changes.forEach(change => console.log(`  ${change}`))
      return changes
    }
    
    return []
  }

  // 获取单个工单的变化详情
  getOrderChanges(oldOrder, newOrder) {
    const changes = []
    const fieldsToCheck = ['status', 'customerName', 'game', 'playStyle', 'serviceType', 'createdAt', 'completedAt', 'auditComments']
    
    fieldsToCheck.forEach(field => {
      if (oldOrder[field] !== newOrder[field]) {
        const fieldNames = {
          status: '状态',
          customerName: '客户姓名',
          game: '游戏类型',
          playStyle: '陪玩类型',
          serviceType: '服务类型',
          createdAt: '创建时间',
          completedAt: '完成时间',
          auditComments: '审核备注'
        }
        
        const fieldName = fieldNames[field] || field
        const oldValue = this.formatOrderFieldValue(field, oldOrder[field])
        const newValue = this.formatOrderFieldValue(field, newOrder[field])
        
        changes.push(`${fieldName}: ${oldValue} → ${newValue}`)
      }
    })
    
    return changes
  }

  // 格式化工单字段值显示
  formatOrderFieldValue(field, value) {
    if (value === null || value === undefined) return '未设置'
    
    switch (field) {
      case 'status':
        const statusMap = {
          'PENDING_ACCEPTANCE': '待接单',
          'IN_PROGRESS': '进行中',
          'PENDING_AUDIT': '待审核',
          'COMPLETED': '已结单',
          'REJECTED': '未通过',
          'REJECTED_TO_SUBMIT': '重新审核中',
          'RESUBMITTING': '重新审核中'
        }
        return statusMap[value] || value
      
      case 'playStyle':
        const playStyleMap = {
          'TECHNICAL': '技术型',
          'ENTERTAINMENT': '娱乐型'
        }
        return playStyleMap[value] || value
      
      case 'serviceType':
        const serviceTypeMap = {
          'RANKED': '排位赛',
          'CASUAL': '娱乐赛'
        }
        return serviceTypeMap[value] || value
      
      case 'createdAt':
      case 'completedAt':
        if (!value) return '未设置'
        try {
          return new Date(value).toLocaleString('zh-CN')
        } catch {
          return String(value)
        }
      
      default:
        return String(value)
    }
  }

  // 获取单个员工的变化详情
  getEmployeeChanges(oldEmp, newEmp) {
    const changes = []
    const fieldsToCheck = ['workStatus', 'gender', 'name', 'username', 'realName', 'avatar', 'game', 'level']
    
    fieldsToCheck.forEach(field => {
      if (oldEmp[field] !== newEmp[field]) {
        const fieldNames = {
          workStatus: '工作状态',
          gender: '性别',
          name: '姓名',
          username: '用户名',
          realName: '真实姓名',
          avatar: '头像',
          game: '游戏',
          level: '等级'
        }
        
        const fieldName = fieldNames[field] || field
        const oldValue = this.formatFieldValue(field, oldEmp[field])
        const newValue = this.formatFieldValue(field, newEmp[field])
        
        changes.push(`${fieldName}: ${oldValue} → ${newValue}`)
      }
    })
    
    return changes
  }

  // 格式化字段值显示
  formatFieldValue(field, value) {
    if (value === null || value === undefined) return '未设置'
    
    switch (field) {
      case 'workStatus':
        const statusMap = {
          'BUSY': '工作中',
          'IDLE': '空闲中',
          'RESTING': '休息中',
          'OFF_DUTY': '离线'
        }
        return statusMap[value] || value
      
      case 'gender':
        const genderMap = {
          'MALE': '男',
          'FEMALE': '女'
        }
        return genderMap[value] || value
      
      default:
        return String(value)
    }
  }
}

// 创建全局实例
const pollingManager = new PollingManager()

// 全局强制清理函数（用于紧急情况）
export const forceStopAllPolling = () => {
  console.log('🚨 强制停止所有轮询 - 紧急清理模式')
  
  // 清理轮询管理器中的定时器
  pollingManager.clearAllPolling()
  
  // 额外保险：清理所有可能的定时器ID（暴力清理）
  console.log('🚨 开始暴力清理所有定时器...')
  const maxTimerId = setTimeout(() => {}, 0)
  let clearedCount = 0
  
  for (let i = 1; i <= maxTimerId; i++) {
    try {
      clearInterval(i)
      clearTimeout(i)
      clearedCount++
    } catch (e) {
      // 忽略清理错误
    }
  }
  clearTimeout(maxTimerId)
  
  console.log(`🚨 强制清理完成，共清理了 ${clearedCount} 个定时器`)
  
  // 最终检查
  setTimeout(() => {
    const remainingPolling = pollingManager.getActivePollingKeys()
    if (remainingPolling.length > 0) {
      console.error('🚨 警告：强制清理后仍有残留轮询:', remainingPolling)
    } else {
      console.log('✅ 确认：所有轮询已彻底清理')
    }
  }, 200)
}

// 导出工具函数
export const usePolling = () => {
  return {
    // 开始轮询
    startPolling: (key, callback, interval) => {
      pollingManager.startPolling(key, callback, interval)
    },
    
    // 开始智能轮询（带数据比对）
    startSmartPolling: (key, dataFetcher, onDataChange, interval) => {
      pollingManager.startSmartPolling(key, dataFetcher, onDataChange, interval)
    },
    
    // 开始工单智能轮询（专门针对工单数据的轮询）
    startOrderSmartPolling: (key, dataFetcher, onOrderChange, interval) => {
      pollingManager.startOrderSmartPolling(key, dataFetcher, onOrderChange, interval)
    },
    
    // 停止轮询
    stopPolling: (key) => {
      pollingManager.stopPolling(key)
    },
    
    // 清除所有轮询
    clearAllPolling: () => {
      pollingManager.clearAllPolling()
    },
    
    // 强制清除所有轮询
    forceStopAllPolling: () => {
      forceStopAllPolling()
    },
    
    // 检查轮询状态
    hasActivePolling: (key) => {
      return pollingManager.hasActivePolling(key)
    },
    
    // 获取活跃轮询列表
    getActivePollingKeys: () => {
      return pollingManager.getActivePollingKeys()
    }
  }
}

// 智能轮询配置
export const POLLING_CONFIG = {
  // 员工工单列表轮询间隔（秒）
  EMPLOYEE_ORDERS: 5,
  
  // 客服员工列表轮询间隔（秒）
  CS_EMPLOYEES: 5,
  
  // 管理员用户列表轮询间隔（秒）
  ADMIN_USERS: 5,
  
  // 工单详情轮询间隔（秒）
  ORDER_DETAIL: 5,
  
  // 员工状态轮询间隔（秒）
  EMPLOYEE_STATUS: 5
}

// 开发环境下添加全局调试函数
if (import.meta.env.DEV) {
  window.debugPolling = {
    getActivePolling: () => pollingManager.getActivePollingKeys(),
    clearAllPolling: () => pollingManager.clearAllPolling(),
    forceStopAll: () => forceStopAllPolling(),
    getTimersCount: () => pollingManager.timers.size,
    showStatus: () => {
      console.log('🔍 轮询状态检查:')
      console.log('活跃轮询数量:', pollingManager.timers.size)
      console.log('活跃轮询列表:', pollingManager.getActivePollingKeys())
      console.log('缓存数据数量:', pollingManager.dataCache.size)
    }
  }
  console.log('🛠️ 开发模式：全局轮询调试工具已加载 (window.debugPolling)')
}

export default pollingManager
