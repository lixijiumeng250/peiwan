import { ref, onMounted, onUnmounted } from 'vue'
import notificationManager from '@/utils/notificationManager'
import { ElMessage } from 'element-plus'

/**
 * 员工工单通知组合式函数
 */
export function useOrderNotifications() {
  // 响应式数据
  const orderNotifications = ref([])
  const unreadOrderCount = ref(0)
  const isLoading = ref(false)

  /**
   * 获取所有工单派发通知
   */
  async function fetchOrderNotifications() {
    try {
      isLoading.value = true
      const notifications = await notificationManager.getOrderAssignmentNotifications()
      orderNotifications.value = notifications
      
      // 计算未读数量
      unreadOrderCount.value = notifications.filter(n => !n.isRead).length
      
      console.log(`获取到 ${notifications.length} 条工单通知，未读 ${unreadOrderCount.value} 条`)
      return notifications
    } catch (error) {
      console.error('获取工单通知失败:', error)
      ElMessage.error('获取工单通知失败')
      return []
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 标记工单通知为已读（带动画效果）
   */
  async function markOrderNotificationAsRead(notificationId) {
    const notification = orderNotifications.value.find(n => n.id === notificationId)
    if (!notification || notification.markingRead) return false
    
    notification.markingRead = true
    
    try {
      await notificationManager.markAsRead(notificationId)
      
      console.log(`开始淡出工单通知动画 - 通知ID: ${notificationId}`)
      
      // 立即开始向右淡出动画
      notification.fadeOut = true
      
      // 动画完成后从列表中移除
      setTimeout(() => {
        const index = orderNotifications.value.findIndex(n => n.id === notificationId)
        if (index > -1) {
          console.log(`从工单通知列表中移除: ${notificationId}`)
          orderNotifications.value.splice(index, 1)
          unreadOrderCount.value = Math.max(0, unreadOrderCount.value - 1)
        }
      }, 600) // 给足够时间完成动画
      
      // ElMessage.success('工单通知已标记为已读') // 不显示成功提示，动画效果已足够
      return true
    } catch (error) {
      console.error('标记工单通知已读失败:', error)
      ElMessage.error('标记已读失败')
      notification.markingRead = false
      notification.fadeOut = false
      return false
    }
  }

  /**
   * 批量标记工单通知为已读（带动画效果）
   */
  async function markAllOrderNotificationsAsRead() {
    try {
      const unreadNotifications = orderNotifications.value.filter(n => !n.isRead)
      if (unreadNotifications.length === 0) {
        ElMessage.info('没有未读的工单通知')
        return true
      }

      const unreadIds = unreadNotifications.map(n => n.id)
      await notificationManager.markBatchAsRead(unreadIds)
      
      // 立即开始淡出动画
      unreadNotifications.forEach(notification => {
        notification.markingRead = true
        notification.fadeOut = true
      })
      
      // 动画完成后从列表中移除
      setTimeout(() => {
        orderNotifications.value = orderNotifications.value.filter(n => 
          !unreadNotifications.includes(n)
        )
        unreadOrderCount.value = 0
      }, 600) // 给足够时间完成动画
      
      // ElMessage.success(`已标记 ${unreadIds.length} 条工单通知为已读`) // 不显示成功提示，动画效果已足够
      return true
    } catch (error) {
      console.error('批量标记工单通知已读失败:', error)
      ElMessage.error('批量标记已读失败')
      return false
    }
  }

  /**
   * 获取工单详细信息
   */
  function getOrderNotificationData(notification) {
    try {
      if (notification.data) {
        return JSON.parse(notification.data)
      }
      return null
    } catch (error) {
      console.error('解析工单通知数据失败:', error)
      return null
    }
  }

  /**
   * 处理新工单通知回调
   */
  function handleNewOrderNotification(payload) {
    const { notification, data } = payload
    
    // 添加到本地通知列表
    orderNotifications.value.unshift(notification)
    unreadOrderCount.value += 1
    
    console.log('收到新工单通知:', data)
  }

  /**
   * 处理未读数量变化回调
   */
  function handleUnreadCountChange(count) {
    // 可以在这里处理全局未读数量变化
    console.log('全局未读通知数量:', count)
  }

  // 组件挂载时的初始化
  onMounted(() => {
    // 注册工单通知回调
    notificationManager.on('orderAssignment', handleNewOrderNotification)
    notificationManager.on('unreadCountChange', handleUnreadCountChange)
    
    // 初始加载工单通知
    fetchOrderNotifications()
  })

  // 组件卸载时的清理
  onUnmounted(() => {
    notificationManager.off('orderAssignment', handleNewOrderNotification)
    notificationManager.off('unreadCountChange', handleUnreadCountChange)
  })

  return {
    // 响应式数据
    orderNotifications,
    unreadOrderCount,
    isLoading,
    
    // 方法
    fetchOrderNotifications,
    markOrderNotificationAsRead,
    markAllOrderNotificationsAsRead,
    getOrderNotificationData
  }
}
