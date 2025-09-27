import http from './http'

/**
 * 通知相关API
 */
export default {
  /**
   * 获取未读通知列表
   * @param {number} limit - 限制返回数量，默认50
   */
  getUnreadNotifications(limit = 50) {
    return http.get('/api/notifications/unread', {
      params: { limit }
    })
  },

  /**
   * 获取未读通知数量
   */
  getUnreadCount() {
    return http.get('/api/notifications/unread/count')
  },

  /**
   * 获取通知列表（分页）
   * @param {boolean} isRead - 是否只获取已读/未读通知
   * @param {number} page - 页码，从1开始
   * @param {number} size - 每页大小
   */
  getNotifications(isRead = null, page = 1, size = 20) {
    const params = { page, size }
    if (isRead !== null) {
      params.isRead = isRead
    }
    return http.get('/api/notifications', { params })
  },

  /**
   * 根据类型获取未读通知
   * @param {string} type - 通知类型
   * @param {number} limit - 限制返回数量，不传则不限制
   */
  getUnreadNotificationsByType(type, limit = null) {
    const params = {}
    if (limit) {
      params.limit = limit
    }
    return http.get(`/api/notifications/type/${type}`, { params })
  },

  /**
   * 获取员工的工单派发通知（不限制数量）
   */
  getOrderAssignmentNotifications() {
    return http.get('/api/notifications/type/ORDER_ASSIGNMENT')
  },

  /**
   * 标记通知为已读
   * @param {number} notificationId - 通知ID
   */
  markAsRead(notificationId) {
    return http.post(`/api/notifications/${notificationId}/read`)
  },

  /**
   * 批量标记通知为已读
   * @param {number[]} notificationIds - 通知ID列表
   */
  markBatchAsRead(notificationIds) {
    return http.post('/api/notifications/batch-read', notificationIds)
  },

  /**
   * 标记所有通知为已读
   */
  markAllAsRead() {
    return http.post('/api/notifications/read-all')
  }
}
