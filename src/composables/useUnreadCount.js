import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import authStore from '../store/auth'

// 全局未读数量管理
const unreadCount = ref(0)

export function useUnreadCount() {
  // 获取未读通知数量
  const fetchUnreadCount = async () => {
    try {
      const currentUser = authStore.getters.currentUser.value
      if (!currentUser?.id) {
        console.warn('用户未登录，无法获取未读数量')
        return 0
      }

      const response = await fetch('/api/api/notifications/unread/count', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
          'X-User-Id': currentUser.id.toString()
        }
      })

      if (response.ok) {
        const result = await response.json()
        const count = result.data || 0
        unreadCount.value = count
        console.log('未读通知数量获取成功:', count)
        return count
      } else if (response.status === 401) {
        console.log('认证失效，停止获取未读数量')
        authStore.actions.logout()
        throw new Error('认证失效')
      } else {
        console.warn('获取未读数量失败:', response.status)
        return 0
      }
    } catch (error) {
      console.error('获取未读数量失败:', error)
      if (error.message !== '认证失效') {
        unreadCount.value = 0
      }
      throw error
    }
  }

  // 更新未读数量
  const updateUnreadCount = (count) => {
    unreadCount.value = count
  }

  // 减少未读数量
  const decreaseUnreadCount = (amount = 1) => {
    unreadCount.value = Math.max(0, unreadCount.value - amount)
  }

  return {
    // 响应式数据
    unreadCount: computed(() => unreadCount.value),
    
    // 方法
    fetchUnreadCount,
    updateUnreadCount,
    decreaseUnreadCount
  }
}
