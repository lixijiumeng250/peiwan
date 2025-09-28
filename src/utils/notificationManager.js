import { ElMessage, ElNotification } from 'element-plus'

/**
 * 通知管理器
 * 负责轮询后端通知接口，处理各种类型的通知
 */
class NotificationManager {
  constructor() {
    this.pollingInterval = 5000 // 5秒轮询间隔
    this.isPolling = false
    this.pollingTimer = null
    this.unreadCount = 0
    this.lastNotificationId = 0
    this.callbacks = {
      employeeStatusChange: [],
      orderAssignment: [],
      unreadCountChange: []
    }
  }

  /**
   * 启动轮询
   */
  startPolling() {
    if (this.isPolling) return
    
    // console.log('启动通知轮询')
    this.isPolling = true
    this.poll()
  }

  /**
   * 停止轮询
   */
  stopPolling() {
    // console.log('停止通知轮询')
    this.isPolling = false
    if (this.pollingTimer) {
      clearTimeout(this.pollingTimer)
      this.pollingTimer = null
    }
  }

  /**
   * 执行轮询
   */
  async poll() {
    if (!this.isPolling) return

    try {
      // 检查用户是否已登录
      const token = localStorage.getItem('token')
      if (!token) {
        // console.log('用户未登录，暂停轮询')
        this.scheduleNextPoll()
        return
      }

      // 获取未读通知数量
      const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
      const userId = userInfo.id
      
      const countResponse = await fetch('/api/api/notifications/unread/count', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-User-Id': userId?.toString() || ''
        }
      })
      
      if (countResponse.ok) {
        const result = await countResponse.json()
        const newCount = result.data || 0
        
        // 如果有新通知，获取详细信息
        if (newCount > this.unreadCount) {
          await this.fetchNewNotifications()
        }
        
        // 更新未读数量
        if (newCount !== this.unreadCount) {
          this.unreadCount = newCount
          this.triggerCallbacks('unreadCountChange', newCount)
        }
      } else if (countResponse.status === 401) {
        // console.log('认证失效，停止轮询')
        this.handleAuthError()
        return
      }
    } catch (error) {
      console.error('轮询通知失败:', error)
    }

    this.scheduleNextPoll()
  }

  /**
   * 安排下一次轮询
   */
  scheduleNextPoll() {
    if (this.isPolling) {
      this.pollingTimer = setTimeout(() => this.poll(), this.pollingInterval)
    }
  }

  /**
   * 获取新通知详情
   */
  async fetchNewNotifications() {
    try {
      const token = localStorage.getItem('token')
      const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
      const userId = userInfo.id
      
      const response = await fetch('/api/api/notifications/unread?limit=10', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-User-Id': userId?.toString() || ''
        }
      })
      
      if (response.ok) {
        const result = await response.json()
        const notifications = result.data || []
        
        // 过滤出新通知（ID大于上次记录的最大ID）
        const newNotifications = notifications.filter(n => n.id > this.lastNotificationId)
        
        if (newNotifications.length > 0) {
          // 更新最大通知ID
          this.lastNotificationId = Math.max(...notifications.map(n => n.id))
          
          // 处理新通知
          this.handleNewNotifications(newNotifications)
        }
      }
    } catch (error) {
      console.error('获取新通知失败:', error)
    }
  }

  /**
   * 处理新通知
   */
  handleNewNotifications(notifications) {
    notifications.forEach(notification => {
      // console.log('收到新通知:', notification)
      
      switch (notification.type) {
        case 'EMPLOYEE_STATUS_CHANGE':
          this.handleEmployeeStatusNotification(notification)
          break
        case 'ORDER_ASSIGNMENT':
          this.handleOrderAssignmentNotification(notification)
          break
        default:
          this.showGenericNotification(notification)
      }
    })
  }

  /**
   * 处理员工状态变更通知
   */
  handleEmployeeStatusNotification(notification) {
    try {
      const data = JSON.parse(notification.data)
      
      // 触发回调
      this.triggerCallbacks('employeeStatusChange', { notification, data })
      
      // 显示系统通知
      ElNotification({
        title: '员工状态变更',
        message: notification.content,
        type: 'info',
        duration: 6000,
        onClick: () => {
          this.markAsRead(notification.id)
        }
      })
      
      // console.log('员工状态变更通知:', data)
    } catch (error) {
      console.error('解析员工状态通知失败:', error)
    }
  }

  /**
   * 处理工单派发通知
   */
  handleOrderAssignmentNotification(notification) {
    try {
      const data = JSON.parse(notification.data)
      
      // 触发回调
      this.triggerCallbacks('orderAssignment', { notification, data })
      
      // 显示系统通知
      ElNotification({
        title: '新工单派发',
        message: notification.content,
        type: 'success',
        duration: 8000,
        onClick: () => {
          this.markAsRead(notification.id)
        }
      })
      
      // console.log('工单派发通知:', data)
    } catch (error) {
      console.error('解析工单通知失败:', error)
    }
  }

  /**
   * 显示通用通知
   */
  showGenericNotification(notification) {
    ElNotification({
      title: notification.title,
      message: notification.content,
      type: 'info',
      duration: 5000,
      onClick: () => {
        this.markAsRead(notification.id)
      }
    })
  }

  /**
   * 标记通知为已读
   */
  async markAsRead(notificationId) {
    try {
      const token = localStorage.getItem('token')
      const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
      const userId = userInfo.id
      
      const response = await fetch(`/api/api/notifications/${notificationId}/read`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-User-Id': userId?.toString() || ''
        }
      })
      
      if (response.ok) {
        this.unreadCount = Math.max(0, this.unreadCount - 1)
        this.triggerCallbacks('unreadCountChange', this.unreadCount)
        // console.log(`通知 ${notificationId} 已标记为已读`)
        return true
      } else {
        console.error('标记已读失败 - HTTP状态:', response.status)
        throw new Error(`HTTP ${response.status}`)
      }
    } catch (error) {
      console.error('标记已读失败:', error)
      throw error
    }
  }

  /**
   * 批量标记为已读
   */
  async markBatchAsRead(notificationIds) {
    if (!notificationIds || notificationIds.length === 0) return
    
    try {
      const token = localStorage.getItem('token')
      const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
      const userId = userInfo.id
      
      const response = await fetch('/api/api/notifications/batch-read', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-User-Id': userId?.toString() || ''
        },
        body: JSON.stringify(notificationIds)
      })
      
      if (response.ok) {
        this.unreadCount = Math.max(0, this.unreadCount - notificationIds.length)
        this.triggerCallbacks('unreadCountChange', this.unreadCount)
        // console.log(`批量标记 ${notificationIds.length} 个通知为已读`)
      }
    } catch (error) {
      console.error('批量标记已读失败:', error)
    }
  }

  /**
   * 标记所有为已读
   */
  async markAllAsRead() {
    try {
      const token = localStorage.getItem('token')
      const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
      const userId = userInfo.id
      
      const response = await fetch('/api/api/notifications/read-all', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-User-Id': userId?.toString() || ''
        }
      })
      
      if (response.ok) {
        this.unreadCount = 0
        this.triggerCallbacks('unreadCountChange', 0)
        // console.log('所有通知已标记为已读')
      }
    } catch (error) {
      console.error('标记所有已读失败:', error)
    }
  }

  /**
   * 处理认证错误
   */
  handleAuthError() {
    this.stopPolling()
    ElMessage.error('登录已过期，请重新登录')
    
    // 清除认证信息并跳转到登录页
    localStorage.removeItem('token')
    localStorage.removeItem('userInfo')
    window.location.href = '/login'
  }

  /**
   * 注册回调函数
   */
  on(event, callback) {
    if (this.callbacks[event]) {
      this.callbacks[event].push(callback)
    }
  }

  /**
   * 移除回调函数
   */
  off(event, callback) {
    if (this.callbacks[event]) {
      const index = this.callbacks[event].indexOf(callback)
      if (index > -1) {
        this.callbacks[event].splice(index, 1)
      }
    }
  }

  /**
   * 触发回调函数
   */
  triggerCallbacks(event, data) {
    if (this.callbacks[event]) {
      this.callbacks[event].forEach(callback => {
        try {
          callback(data)
        } catch (error) {
          console.error(`回调函数执行失败 [${event}]:`, error)
        }
      })
    }
  }

  /**
   * 调整轮询频率
   */
  setPollingInterval(interval) {
    this.pollingInterval = Math.max(1000, interval) // 最小1秒
    // console.log(`轮询间隔已调整为: ${this.pollingInterval}ms`)
  }

  /**
   * 获取当前未读数量
   */
  getUnreadCount() {
    return this.unreadCount
  }

  /**
   * 根据类型获取未读通知
   */
  async getUnreadNotificationsByType(type) {
    try {
      const token = localStorage.getItem('token')
      const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
      const userId = userInfo.id
      
      const response = await fetch(`/api/api/notifications/type/${type}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-User-Id': userId?.toString() || ''
        }
      })
      
      if (response.ok) {
        const result = await response.json()
        return result.data || []
      } else if (response.status === 401) {
        this.handleAuthError()
        return []
      }
    } catch (error) {
      console.error(`获取${type}类型通知失败:`, error)
      return []
    }
  }

  /**
   * 获取员工的工单派发通知
   */
  async getOrderAssignmentNotifications() {
    return this.getUnreadNotificationsByType('ORDER_ASSIGNMENT')
  }
}

// 创建全局实例
const notificationManager = new NotificationManager()

export default notificationManager
