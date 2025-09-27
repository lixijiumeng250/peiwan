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
    class="order-assignment-dialog compact draggable"
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
            
            <!-- 工单详细信息 -->
            <div v-if="getOrderData(notification)" class="order-details">
              <div class="detail-row">
                <span class="label">工单号:</span>
                <span class="value">{{ getOrderData(notification).orderNumber }}</span>
              </div>
              <div class="detail-row">
                <span class="label">派单客服:</span>
                <span class="value">{{ getOrderData(notification).csUserName }}</span>
              </div>
              <div class="detail-row">
                <span class="label">派单时间:</span>
                <span class="value">{{ formatTime(getOrderData(notification).assignedTime) }}</span>
              </div>
              
              <!-- 工单截图 -->
              <div v-if="getOrderData(notification).orderInfoScreenshotUrl" class="screenshot-section">
                <span class="label">派单截图:</span>
                <el-image
                  :src="getOrderData(notification).orderInfoScreenshotUrl"
                  :preview-src-list="[getOrderData(notification).orderInfoScreenshotUrl]"
                  fit="cover"
                  class="order-screenshot"
                  preview-teleported
                />
              </div>
              
              <!-- 委托信息（移动到最后并美化） -->
              <div v-if="getOrderData(notification).clientInfo && getOrderData(notification).clientInfo.trim()" class="client-info-section">
                <h4 class="section-title">委托信息</h4>
                <div class="client-info-content">
                  {{ getOrderData(notification).clientInfo }}
                </div>
              </div>
            </div>
            
            <div class="notification-time">
              <el-icon><Clock /></el-icon>
              <span>{{ formatTime(notification.createTime) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 操作按钮 -->
    <template #footer>
      <div class="dialog-footer compact-footer">
        <el-button 
          type="primary" 
          size="small"
          :loading="isMarkingRead"
          @click="markAllAsReadAndClose"
          class="mark-read-btn"
        >
          <el-icon><Check /></el-icon>
          标记已读
        </el-button>
        <el-button 
          size="small"
          @click="goToWorkRecords"
          class="view-orders-btn"
        >
          <el-icon><List /></el-icon>
          查看工单
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script>
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Document, Clock, Check, List } from '@element-plus/icons-vue'

export default {
  name: 'OrderAssignmentPopup',
  components: {
    Document,
    Clock,
    Check,
    List
  },
  props: {
    modelValue: {
      type: Boolean,
      default: false
    },
    notifications: {
      type: Array,
      default: () => []
    },
    // 用于多弹窗叠加定位（根据索引错落摆放）
    stackIndex: {
      type: Number,
      default: 0
    }
  },
  emits: ['update:modelValue', 'mark-as-read', 'go-to-work-records'],
  setup(props, { emit }) {
    const isMarkingRead = ref(false)
    
    const visible = computed({
      get: () => props.modelValue,
      set: (value) => emit('update:modelValue', value)
    })

    // 叠加定位：每个弹窗在顶部向下错开 20px
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

    // 监听通知列表变化，如果没有未读通知则自动关闭
    watch(() => props.notifications, (newNotifications) => {
      if (newNotifications.length === 0 && visible.value) {
        visible.value = false
      }
    })

    const getOrderData = (notification) => {
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

    const markAllAsReadAndClose = async () => {
      if (props.notifications.length === 0) {
        visible.value = false
        return
      }

      isMarkingRead.value = true
      try {
        // 发送标记已读事件
        emit('mark-as-read', props.notifications.map(n => n.id))
        
        // 延迟关闭弹窗，给用户反馈时间
        setTimeout(() => {
          visible.value = false
          ElMessage.success(`已标记 ${props.notifications.length} 条工单通知为已读`)
        }, 500)
      } catch (error) {
        console.error('标记已读失败:', error)
        ElMessage.error('标记已读失败，请稍后重试')
      } finally {
        isMarkingRead.value = false
      }
    }

    const goToWorkRecords = () => {
      emit('go-to-work-records')
      visible.value = false
    }

    return {
      visible,
      isMarkingRead,
      getOrderData,
      formatTime,
      markAllAsReadAndClose,
      goToWorkRecords,
      computedTop,
      computedLeft
    }
  }
}
</script>

<style scoped>
.order-assignment-dialog {
  --el-dialog-border-radius: 16px;
}

.order-assignment-dialog :deep(.el-dialog) {
  border-radius: 16px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  border: 3px solid #409eff;
  animation: popupEntrance 0.4s ease-out;
}

@keyframes popupEntrance {
  0% {
    opacity: 0;
    transform: scale(0.8) translateY(-20px);
  }
  100% {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.order-assignment-dialog :deep(.el-dialog__header) { display: none; }

.order-assignment-dialog :deep(.el-dialog__title) {
  font-size: 20px;
  font-weight: 600;
  color: white;
}

.order-assignment-dialog :deep(.el-dialog__body) {
  padding: 0;
  max-height: 70vh;
  overflow-y: auto;
}

.notification-content {
  padding: 16px;
}

.notification-header { display: none; }

.icon-wrapper {
  flex-shrink: 0;
  width: 60px;
  height: 60px;
  background: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.2);
}

.header-text h3 { display: none; }
.subtitle { display: none; }

.notifications-list {
  max-height: 60vh;
  overflow-y: auto;
}

.notification-item {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.notification-item:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  transform: translateY(-1px);
}

.notification-item:last-child {
  margin-bottom: 0;
}

.notification-title {
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
}

.notification-message {
  margin: 0 0 12px 0;
  color: #4b5563;
  line-height: 1.5;
}

.order-details {
  background: #f9fafb;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 12px;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  font-size: 14px;
}

.detail-row:last-child {
  margin-bottom: 0;
}

.detail-row .label {
  color: #6b7280;
  font-weight: 500;
  min-width: 80px;
}

.detail-row .value {
  color: #1f2937;
  font-weight: 600;
  text-align: right;
  flex: 1;
}

.screenshot-section {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #e5e7eb;
}

.screenshot-section .label {
  display: block;
  margin-bottom: 8px;
  color: #6b7280;
  font-weight: 500;
  font-size: 14px;
}

.order-screenshot {
  width: 100%;
  max-height: 120px;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
  cursor: pointer;
}

.notification-time {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #9ca3af;
  font-size: 12px;
}

/* 委托信息区域样式（参考工单详情样式进行美化） */
.client-info-section {
  margin-top: 8px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
}

.section-title {
  margin: 0 0 8px 0;
  font-size: 15px;
  font-weight: 700;
  color: #1f2937;
  padding-bottom: 4px;
  border-bottom: 2px solid #409eff;
}

.client-info-content {
  white-space: pre-wrap;
  line-height: 1.6;
  color: #374151;
  background: #ffffff;
  border-radius: 8px;
  padding: 10px;
  border-left: 4px solid #67c23a;
}

.dialog-footer {
  display: flex;
  justify-content: center;
  gap: 20px;
  padding: 8px 16px;
  background: #f9fafb;
  border-radius: 0 0 16px 16px;
  margin-top: 0;
}

.mark-read-btn {
  background: linear-gradient(135deg, #10b981, #059669);
  border: none;
  font-weight: 600;
  padding: 12px 24px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
  transition: all 0.3s ease;
  flex: 0 0 auto;
}

.mark-read-btn:hover {
  background: linear-gradient(135deg, #059669, #047857);
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(16, 185, 129, 0.4);
}

.view-orders-btn {
  background: linear-gradient(135deg, #6366f1, #4f46e5);
  color: white;
  border: none;
  font-weight: 600;
  padding: 12px 24px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
  transition: all 0.3s ease;
  flex: 0 0 auto;
}

.view-orders-btn:hover {
  background: linear-gradient(135deg, #4f46e5, #4338ca);
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(99, 102, 241, 0.4);
}

/* 滚动条样式 */
.notifications-list::-webkit-scrollbar,
.order-assignment-dialog :deep(.el-dialog__body)::-webkit-scrollbar {
  width: 6px;
}

.notifications-list::-webkit-scrollbar-track,
.order-assignment-dialog :deep(.el-dialog__body)::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 3px;
}

.notifications-list::-webkit-scrollbar-thumb,
.order-assignment-dialog :deep(.el-dialog__body)::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

.notifications-list::-webkit-scrollbar-thumb:hover,
.order-assignment-dialog :deep(.el-dialog__body)::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .order-assignment-dialog :deep(.el-dialog) {
    width: 95vw !important;
  }
}

@media (max-width: 768px) {
  .order-assignment-dialog :deep(.el-dialog) {
    width: 98vw !important;
    margin: 0 auto;
  }
  
  .order-assignment-dialog :deep(.el-dialog__body) {
    max-height: 75vh;
  }
  
  .notifications-list {
    max-height: 65vh;
  }
  
  .notification-content {
    padding: 12px;
  }
  
  .notification-item {
    padding: 16px;
    margin-bottom: 12px;
  }
  
  .notification-header {
    flex-direction: column;
    text-align: center;
  }
  
  .detail-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
  
  .detail-row .value {
    text-align: left;
  }
  
  .dialog-footer {
    flex-direction: column;
    padding: 8px 12px;
    gap: 12px;
  }
  
  .mark-read-btn,
  .view-orders-btn {
    width: 100%;
  }
}
</style>
