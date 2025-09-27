<template>
  <el-dialog
    v-model="visible"
    width="480px"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    :show-close="false"
    :append-to-body="true"
    :top="computedTop"
    :left="computedLeft"
    draggable
    center
    class="employee-status-dialog compact draggable"
  >
    <div class="notification-content">
      <!-- 通知列表 -->
      <div class="notifications-list">
        <div 
          v-for="notification in notifications" 
          :key="notification.id"
          class="notification-item"
        >
          <div class="notification-main">
            <h4 class="notification-title">{{ notification.title }}</h4>
            <p class="notification-message">{{ notification.content }}</p>
            
            <!-- 员工状态详细信息 -->
            <div v-if="getEmployeeStatusData(notification)" class="status-details">
              <div class="detail-row">
                <span class="label">员工姓名:</span>
                <span class="value">{{ getEmployeeStatusData(notification).employeeName }}</span>
              </div>
              <div class="detail-row">
                <span class="label">目前状态:</span>
                <span class="value status-value">空闲</span>
              </div>
              <div class="detail-row">
                <span class="label">变更时间:</span>
                <span class="value">{{ formatTime(getEmployeeStatusData(notification).statusChangeTime) }}</span>
              </div>
            </div>
            
            <div class="notification-time">
              {{ formatTime(notification.createTime) }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部操作按钮 -->
    <template #footer>
      <div class="dialog-footer compact-footer">
        <el-button @click="markAllAsRead" type="success" size="small">
          标记已读
        </el-button>
        <el-button @click="goToEmployeeList" type="primary" size="small">
          查看员工
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script>
import { computed, watch } from 'vue'

export default {
  name: 'EmployeeStatusNotificationPopup',
  props: {
    modelValue: {
      type: Boolean,
      default: false
    },
    notifications: {
      type: Array,
      default: () => []
    },
    stackIndex: {
      type: Number,
      default: 0
    }
  },
  emits: ['update:modelValue', 'mark-as-read', 'go-to-employee-list'],
  setup(props, { emit }) {
    // 响应式数据
    const visible = computed({
      get: () => props.modelValue,
      set: (value) => emit('update:modelValue', value)
    })

    // 计算弹窗位置，支持多层叠加
    const computedTop = computed(() => {
      const baseTop = 15
      const offset = props.stackIndex * 8 // 减少垂直偏移，让叠加更紧凑
      return `${baseTop + offset}vh`
    })
    
    // 计算弹窗左侧位置，支持水平叠加
    const computedLeft = computed(() => {
      const baseLeft = 50 // 居中
      const offset = props.stackIndex * 5 // 水平偏移
      return `${baseLeft + offset}%`
    })

    // 获取员工状态数据
    const getEmployeeStatusData = (notification) => {
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

    // 格式化时间
    const formatTime = (timeString) => {
      if (!timeString) return ''
      return new Date(timeString).toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
    }

    // 标记所有通知为已读
    const markAllAsRead = () => {
      const notificationIds = props.notifications.map(n => n.id)
      emit('mark-as-read', notificationIds)
    }

    // 跳转到员工列表
    const goToEmployeeList = () => {
      emit('go-to-employee-list')
    }

    // 监听通知变化，如果没有通知了就关闭弹窗
    watch(() => props.notifications, (newNotifications) => {
      if (newNotifications.length === 0 && visible.value) {
        visible.value = false
      }
    })

    return {
      visible,
      computedTop,
      computedLeft,
      getEmployeeStatusData,
      formatTime,
      markAllAsRead,
      goToEmployeeList
    }
  }
}
</script>

<style scoped>
/* 小巧精致弹窗样式 */
.employee-status-dialog.compact {
  border-radius: 6px;
}

/* 拖拽功能样式 */
.employee-status-dialog.compact.draggable :deep(.el-dialog) {
  z-index: calc(3000 + var(--stack-index, 0)); /* 动态层级管理 */
  transition: all 0.2s ease;
  cursor: move; /* 整个弹窗都可以拖拽 */
}

.employee-status-dialog.compact.draggable :deep(.el-dialog):hover {
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
  transform: translateY(-1px);
}

/* 拖拽时的视觉反馈 */
.employee-status-dialog.compact.draggable :deep(.el-dialog):active {
  cursor: grabbing;
  transform: scale(1.01);
}

/* 叠加显示优化 */
.employee-status-dialog.compact.draggable:nth-child(n+2) {
  opacity: 0.96; /* 后面的弹窗稍微透明 */
}

.employee-status-dialog.compact.draggable:nth-child(n+3) {
  opacity: 0.92;
}

.employee-status-dialog.compact.draggable:nth-child(n+4) {
  opacity: 0.88;
}

/* 强制移除所有默认边距和内边距 */
.employee-status-dialog.compact :deep(.el-overlay-dialog) {
  padding: 0 !important;
}

.employee-status-dialog.compact :deep(.el-dialog__wrapper) {
  padding: 0 !important;
}

.employee-status-dialog.compact :deep(.el-dialog) {
  border-radius: 6px;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
  margin: 0 !important;
  padding: 0 !important;
}

.employee-status-dialog.compact :deep(.el-dialog__header) {
  display: none;
  padding: 0 !important;
  margin: 0 !important;
}

.employee-status-dialog.compact :deep(.el-dialog__body) {
  padding: 0 !important;
  margin: 0 !important;
  border-radius: 6px 6px 0 0; /* 恢复顶部圆角 */
}

.employee-status-dialog.compact :deep(.el-dialog__footer) {
  padding: 8px 12px !important;
  margin: 0 !important;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
  border-radius: 0 0 6px 6px;
}

.notification-content {
  max-height: 50vh;
  overflow-y: auto;
  padding: 12px;
  background: #fff;
}

.notifications-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.notification-item {
  background: #f8f9fa;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  padding: 10px;
  transition: all 0.15s ease;
}

.notification-item:hover {
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
  transform: translateY(-0.5px);
}

.notification-main {
  width: 100%;
}

.notification-title {
  margin: 0 0 4px 0;
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
  line-height: 1.2;
}

.notification-message {
  margin: 0 0 6px 0;
  font-size: 12px;
  color: #6b7280;
  line-height: 1.3;
}

.status-details {
  margin: 6px 0;
  padding: 8px;
  background: #ffffff;
  border-radius: 3px;
  border: 1px solid #e5e7eb;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
  font-size: 12px;
}

.detail-row:last-child {
  margin-bottom: 0;
}

.detail-row .label {
  color: #6b7280;
  font-weight: 500;
  min-width: 55px;
}

.detail-row .value {
  color: #1f2937;
  font-weight: 600;
  text-align: right;
  flex: 1;
}

.status-value {
  color: #10b981 !important;
  font-weight: 700;
  font-size: 12px;
}

.notification-time {
  margin-top: 4px;
  font-size: 10px;
  color: #9ca3af;
  text-align: right;
}

.dialog-footer.compact-footer {
  display: flex;
  justify-content: center;
  gap: 8px;
}

.compact-footer .el-button {
  min-width: 80px;
  height: 28px;
  font-size: 12px;
  font-weight: 500;
  padding: 4px 12px;
}

/* 滚动条样式 - 更细 */
.notification-content::-webkit-scrollbar {
  width: 4px;
}

.notification-content::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 2px;
}

.notification-content::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 2px;
}

.notification-content::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* 响应式设计 - 小巧精致版本 */
@media (max-width: 768px) {
  .employee-status-dialog.compact {
    width: 90vw !important;
  }
  
  .notification-content {
    padding: 8px;
    max-height: 45vh;
  }
  
  .notification-item {
    padding: 8px;
  }
  
  .notification-title {
    font-size: 13px;
    margin-bottom: 3px;
  }
  
  .notification-message {
    font-size: 11px;
    margin-bottom: 5px;
  }
  
  .detail-row {
    font-size: 11px;
    margin-bottom: 3px;
  }
  
  .detail-row .label {
    min-width: 50px;
  }
  
  .notification-time {
    font-size: 9px;
    margin-top: 3px;
  }
  
  .compact-footer {
    flex-direction: row;
    gap: 6px;
  }
  
  .compact-footer .el-button {
    flex: 1;
    min-width: auto;
    height: 26px;
    font-size: 11px;
    padding: 3px 8px;
  }
}

/* 超小屏幕优化 */
@media (max-width: 480px) {
  .employee-status-dialog.compact {
    width: 95vw !important;
  }
  
  .notification-content {
    padding: 6px;
    max-height: 40vh;
  }
  
  .notification-item {
    padding: 6px;
  }
  
  .status-details {
    padding: 6px;
    margin: 4px 0;
  }
}

/* 超紧凑模式 - 低屏幕高度适配 */
@media (max-height: 600px) {
  .notification-content {
    max-height: 35vh;
    padding: 8px;
  }
  
  .notification-item {
    padding: 6px;
  }
  
  .status-details {
    padding: 6px;
    margin: 4px 0;
  }
  
  .detail-row {
    margin-bottom: 3px;
  }
  
  .notification-title {
    margin-bottom: 3px;
    font-size: 13px;
  }
  
  .notification-message {
    margin-bottom: 4px;
    font-size: 11px;
  }
  
  .compact-footer .el-button {
    height: 26px;
    font-size: 11px;
  }
}

/* 极低屏幕高度适配 */
@media (max-height: 500px) {
  .notification-content {
    max-height: 30vh;
    padding: 6px;
  }
  
  .notification-item {
    padding: 5px;
  }
  
  .status-details {
    padding: 5px;
    margin: 3px 0;
  }
  
  .detail-row {
    margin-bottom: 2px;
    font-size: 11px;
  }
  
  .notification-title {
    margin-bottom: 2px;
    font-size: 12px;
  }
  
  .notification-message {
    margin-bottom: 3px;
    font-size: 10px;
  }
  
  .notification-time {
    font-size: 9px;
    margin-top: 2px;
  }
  
  .compact-footer .el-button {
    height: 24px;
    font-size: 10px;
    padding: 2px 6px;
  }
}
</style>
