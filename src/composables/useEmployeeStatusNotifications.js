import { ref, computed, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import authStore from '../store/auth'

// 员工状态通知管理
const employeeStatusNotifications = ref([])
const unreadEmployeeStatusCount = ref(0)

export function useEmployeeStatusNotifications() {
  // 获取员工状态通知数据
  const fetchEmployeeStatusNotifications = async () => {
    try {
      const currentUser = authStore.getters.currentUser.value
      if (!currentUser?.id) {
        console.warn('用户未登录，无法获取员工状态通知')
        return
      }

      const response = await fetch('/api/api/notifications/type/EMPLOYEE_STATUS_CHANGE', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
          'X-User-Id': currentUser.id.toString()
        }
      })

      if (response.ok) {
        const result = await response.json()
        if (result.code === 200 && Array.isArray(result.data)) {
          // 按创建时间倒序排列，最新的在前面
          const sortedNotifications = result.data.sort((a, b) => 
            new Date(b.createTime) - new Date(a.createTime)
          )
          
          employeeStatusNotifications.value = sortedNotifications
          unreadEmployeeStatusCount.value = sortedNotifications.filter(n => !n.isRead).length
          
          // console.log('员工状态通知获取成功:', {
          //   total: sortedNotifications.length,
          //   unread: unreadEmployeeStatusCount.value
          // })
        } else {
          console.warn('员工状态通知接口返回异常:', result)
          employeeStatusNotifications.value = []
          unreadEmployeeStatusCount.value = 0
        }
      } else if (response.status === 401) {
        // console.log('认证失效，停止获取员工状态通知')
        authStore.actions.logout()
        throw new Error('认证失效')
      } else {
        console.warn('获取员工状态通知失败:', response.status)
        employeeStatusNotifications.value = []
        unreadEmployeeStatusCount.value = 0
      }
    } catch (error) {
      console.error('获取员工状态通知失败:', error)
      if (error.message !== '认证失效') {
        employeeStatusNotifications.value = []
        unreadEmployeeStatusCount.value = 0
      }
      throw error
    }
  }

  // 标记单个通知为已读（带动画效果）
  const markEmployeeStatusNotificationAsRead = async (notificationId) => {
    const notification = employeeStatusNotifications.value.find(n => n.id === notificationId)
    if (!notification || notification.markingRead) return false
    
    notification.markingRead = true
    
    try {
      const currentUser = authStore.getters.currentUser.value
      if (!currentUser?.id) {
        ElMessage.error('用户未登录')
        notification.markingRead = false
        return false
      }

      const response = await fetch(`/api/api/notifications/${notificationId}/read`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
          'X-User-Id': currentUser.id.toString()
        }
      })

      if (response.ok) {
        // console.log(`开始淡出员工状态通知动画 - 通知ID: ${notificationId}`)
        
        // 立即开始向右淡出动画
        notification.fadeOut = true
        
        // 动画完成后从列表中移除
        setTimeout(() => {
          const index = employeeStatusNotifications.value.findIndex(n => n.id === notificationId)
          if (index > -1) {
            // console.log(`从员工状态通知列表中移除: ${notificationId}`)
            employeeStatusNotifications.value.splice(index, 1)
            unreadEmployeeStatusCount.value = Math.max(0, unreadEmployeeStatusCount.value - 1)
          }
        }, 600) // 给足够时间完成动画
        
        // ElMessage.success('员工状态通知已标记为已读') // 客服页面不显示成功提示
        return true
      } else {
        console.error('标记员工状态通知为已读失败:', response.status)
        ElMessage.error('标记为已读失败')
        notification.markingRead = false
        notification.fadeOut = false
        return false
      }
    } catch (error) {
      console.error('标记员工状态通知为已读失败:', error)
      ElMessage.error('标记为已读失败')
      notification.markingRead = false
      notification.fadeOut = false
      return false
    }
  }

  // 标记所有通知为已读（带动画效果）
  const markAllEmployeeStatusNotificationsAsRead = async () => {
    try {
      const currentUser = authStore.getters.currentUser.value
      if (!currentUser?.id) {
        ElMessage.error('用户未登录')
        return false
      }

      const unreadNotifications = employeeStatusNotifications.value.filter(n => !n.isRead)
      if (unreadNotifications.length === 0) {
        ElMessage.info('没有未读通知')
        return true
      }

      const notificationIds = unreadNotifications.map(n => n.id)

      const response = await fetch('/api/api/notifications/batch-read', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
          'X-User-Id': currentUser.id.toString()
        },
        body: JSON.stringify(notificationIds)
      })

      if (response.ok) {
        // 立即开始淡出动画
        unreadNotifications.forEach(notification => {
          notification.markingRead = true
          notification.fadeOut = true
        })
        
        // 动画完成后从列表中移除
        setTimeout(() => {
          employeeStatusNotifications.value = employeeStatusNotifications.value.filter(n => 
            !unreadNotifications.includes(n)
          )
          unreadEmployeeStatusCount.value = 0
        }, 600) // 给足够时间完成动画
        
        // ElMessage.success(`已标记 ${unreadNotifications.length} 条通知为已读`) // 客服页面不显示成功提示
        // console.log('所有员工状态通知已标记为已读')
        return true
      } else {
        console.error('标记所有员工状态通知为已读失败:', response.status)
        ElMessage.error('批量标记为已读失败')
        return false
      }
    } catch (error) {
      console.error('标记所有员工状态通知为已读失败:', error)
      ElMessage.error('批量标记为已读失败')
      return false
    }
  }

  // 解析员工状态通知数据
  const getEmployeeStatusNotificationData = (notification) => {
    try {
      if (!notification?.data) {
        return null
      }

      let parsedData = null
      if (typeof notification.data === 'string') {
        parsedData = JSON.parse(notification.data)
      } else {
        parsedData = notification.data
      }

      return {
        employeeId: parsedData.employeeId,
        employeeName: parsedData.employeeName || parsedData.employeeUsername,
        employeeRealName: parsedData.employeeRealName,
        oldStatus: parsedData.oldStatus,
        newStatus: parsedData.newStatus,
        statusChangeTime: parsedData.statusChangeTime || notification.createTime
      }
    } catch (error) {
      console.error('解析员工状态通知数据失败:', error, notification)
      return null
    }
  }

  // 获取状态文本
  const getStatusText = (status) => {
    const statusMap = {
      'BUSY': '工作中',
      'IDLE': '空闲中',
      'RESTING': '休息中',
      'OFF_DUTY': '离岗'
    }
    return statusMap[status] || status
  }

  // 获取状态颜色
  const getStatusColor = (status) => {
    const colorMap = {
      'BUSY': '#faad14',     // 工作中 - 黄色
      'IDLE': '#52c41a',     // 空闲中 - 绿色
      'RESTING': '#1890ff',  // 休息中 - 蓝色
      'OFF_DUTY': '#ff4d4f'  // 离岗 - 红色
    }
    return colorMap[status] || '#909399'
  }

  // 获取状态图标
  const getStatusIcon = (status) => {
    const iconMap = {
      'BUSY': '🟡',
      'IDLE': '🟢',
      'RESTING': '🔵',
      'OFF_DUTY': '🔴'
    }
    return iconMap[status] || '⚪'
  }

  // 直接更新通知数据的方法（供轮询使用）
  const updateEmployeeStatusNotifications = (notifications) => {
    if (Array.isArray(notifications)) {
      // 按创建时间倒序排列
      const sortedNotifications = notifications.sort((a, b) => 
        new Date(b.createTime) - new Date(a.createTime)
      )
      
      employeeStatusNotifications.value = sortedNotifications
      unreadEmployeeStatusCount.value = sortedNotifications.filter(n => !n.isRead).length
      
      // console.log('员工状态通知数据已更新:', {
      //   total: sortedNotifications.length,
      //   unread: unreadEmployeeStatusCount.value
      // })
    }
  }

  // 轮询定时器
  let pollingTimer = null
  
  // 开始轮询
  const startPolling = () => {
    // 立即获取一次
    fetchEmployeeStatusNotifications()
    
    // 设置定时轮询（每30秒）
    pollingTimer = setInterval(() => {
      fetchEmployeeStatusNotifications()
    }, 30000)
    
    // console.log('员工状态通知轮询已启动')
  }
  
  // 停止轮询
  const stopPolling = () => {
    if (pollingTimer) {
      clearInterval(pollingTimer)
      pollingTimer = null
      // console.log('员工状态通知轮询已停止')
    }
  }
  
  // 组件挂载时自动开始轮询
  onMounted(() => {
    // console.log('useEmployeeStatusNotifications onMounted - 开始轮询')
    startPolling()
  })
  
  // 组件卸载时停止轮询
  onUnmounted(() => {
    // console.log('useEmployeeStatusNotifications onUnmounted - 停止轮询')
    stopPolling()
  })

  return {
    // 响应式数据
    employeeStatusNotifications: computed(() => employeeStatusNotifications.value),
    unreadEmployeeStatusCount: computed(() => unreadEmployeeStatusCount.value),
    
    // 方法
    fetchEmployeeStatusNotifications,
    markEmployeeStatusNotificationAsRead,
    markAllEmployeeStatusNotificationsAsRead,
    getEmployeeStatusNotificationData,
    getStatusText,
    getStatusColor,
    getStatusIcon,
    updateEmployeeStatusNotifications,
    startPolling,
    stopPolling
  }
}
