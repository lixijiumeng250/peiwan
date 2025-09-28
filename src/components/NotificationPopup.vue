<template>
  <!-- 员工状态变更通知弹窗 -->
  <el-dialog
    v-model="employeeStatusVisible"
    title="员工状态变更通知"
    width="500px"
    :before-close="handleEmployeeStatusClose"
    append-to-body
  >
    <div class="notification-content">
      <div class="notification-header">
        <el-icon class="status-icon" :class="getStatusIconClass(currentEmployeeNotification?.data?.currentStatus)">
          <User />
        </el-icon>
        <div class="employee-info">
          <h3>{{ currentEmployeeNotification?.data?.employeeName }}</h3>
          <p class="username">@{{ currentEmployeeNotification?.data?.employeeUsername }}</p>
        </div>
      </div>
      
      <div class="status-change">
        <div class="status-item">
          <span class="label">之前状态:</span>
          <el-tag :type="getStatusTagType(currentEmployeeNotification?.data?.previousStatus)">
            {{ getStatusText(currentEmployeeNotification?.data?.previousStatus) }}
          </el-tag>
        </div>
        <el-icon class="arrow-icon"><Right /></el-icon>
        <div class="status-item">
          <span class="label">当前状态:</span>
          <el-tag :type="getStatusTagType(currentEmployeeNotification?.data?.currentStatus)">
            {{ getStatusText(currentEmployeeNotification?.data?.currentStatus) }}
          </el-tag>
        </div>
      </div>
      
      <div class="notification-message">
        <p>{{ currentEmployeeNotification?.notification?.content }}</p>
      </div>
      
      <div class="notification-time">
        <el-icon><Clock /></el-icon>
        <span>{{ formatTime(currentEmployeeNotification?.data?.changeTime) }}</span>
      </div>
    </div>
    
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleEmployeeStatusClose">稍后处理</el-button>
        <el-button type="primary" @click="goToEmployee">查看员工详情</el-button>
      </div>
    </template>
  </el-dialog>

  <!-- 工单派发通知弹窗 -->
  <el-dialog
    v-model="orderAssignmentVisible"
    title="新工单派发"
    width="600px"
    :before-close="handleOrderAssignmentClose"
    append-to-body
  >
    <div class="notification-content">
      <div class="order-header">
        <el-icon class="order-icon"><Document /></el-icon>
        <div class="order-info">
          <h3>工单号: {{ currentOrderNotification?.data?.orderNumber }}</h3>
          <p class="client-info">委托人: {{ currentOrderNotification?.data?.clientInfo }}</p>
        </div>
      </div>
      
      <div class="assignment-info">
        <div class="info-row">
          <span class="label">派单客服:</span>
          <span class="value">{{ currentOrderNotification?.data?.csUserName }}</span>
        </div>
        <div class="info-row">
          <span class="label">派单时间:</span>
          <span class="value">{{ formatTime(currentOrderNotification?.data?.assignedTime) }}</span>
        </div>
      </div>
      
      <div class="order-screenshot" v-if="currentOrderNotification?.data?.orderInfoScreenshotUrl">
        <p class="label">派单信息截图:</p>
        <el-image
          :src="currentOrderNotification?.data?.orderInfoScreenshotUrl"
          :preview-src-list="[currentOrderNotification?.data?.orderInfoScreenshotUrl]"
          fit="cover"
          class="screenshot-image"
          preview-teleported
        />
      </div>
      
      <div class="notification-message">
        <p>{{ currentOrderNotification?.notification?.content }}</p>
      </div>
    </div>
    
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleOrderAssignmentClose">稍后处理</el-button>
        <el-button @click="confirmOrderRead">确认已读</el-button>
        <el-button type="primary" @click="goToOrder">查看工单详情</el-button>
      </div>
    </template>
  </el-dialog>


  <!-- 通知列表弹窗 -->
  <el-drawer
    v-model="notificationListVisible"
    title="通知中心"
    direction="rtl"
    size="400px"
  >
    <div class="notification-list">
      <div class="list-header">
        <div class="header-actions">
          <el-button 
            size="small" 
            @click="markAllAsRead"
            :disabled="unreadCount === 0"
            :loading="markingAllAsRead"
          >
            全部已读
          </el-button>
        </div>
      </div>
      
      <div class="list-content">
        <transition-group name="notification-fade" tag="div" class="notification-container">
          <div 
            v-for="notification in filteredNotificationList" 
            :key="notification.id"
            class="notification-item"
            :class="{ 
              'unread': !notification.isRead,
              'marking-read': notification.markingRead,
              'fade-out': notification.fadeOut
            }"
            @click="handleNotificationClick(notification)"
          >
            <div class="item-content">
              <h4>{{ notification.title }}</h4>
              <p>{{ notification.content }}</p>
              <span class="time">{{ formatTime(notification.createTime) }}</span>
            </div>
            <div class="item-actions" v-if="!notification.isRead">
              <el-button 
                size="small" 
                text
                :loading="notification.markingRead"
                @click.stop="markAsRead(notification.id)"
              >
                标为已读
              </el-button>
            </div>
          </div>
        </transition-group>
        
        <div v-if="notificationList.length === 0" class="empty-state">
          <el-empty description="暂无通知" />
        </div>
      </div>
    </div>
  </el-drawer>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Right, Clock, Document, Bell } from '@element-plus/icons-vue'
import notificationManager from '@/utils/notificationManager'

const router = useRouter()

// 响应式数据
const employeeStatusVisible = ref(false)
const orderAssignmentVisible = ref(false)
const notificationListVisible = ref(false)
const currentEmployeeNotification = ref(null)
const currentOrderNotification = ref(null)
const unreadCount = ref(0)
const notificationList = ref([])
const showBadge = ref(true)
const markingAllAsRead = ref(false)

// 显示所有消息，包括正在淡出的消息
const filteredNotificationList = computed(() => {
  return notificationList.value
})

// 组件挂载时注册事件监听
onMounted(() => {
  // 监听员工状态变更通知
  notificationManager.on('employeeStatusChange', handleEmployeeStatusChange)
  
  // 监听工单派发通知
  notificationManager.on('orderAssignment', handleOrderAssignment)
  
  // 监听未读数量变化
  notificationManager.on('unreadCountChange', handleUnreadCountChange)
  
  // 启动通知管理器
  notificationManager.startPolling()
  
  // 初始化未读数量
  unreadCount.value = notificationManager.getUnreadCount()
})

// 组件卸载时清理事件监听
onUnmounted(() => {
  notificationManager.off('employeeStatusChange', handleEmployeeStatusChange)
  notificationManager.off('orderAssignment', handleOrderAssignment)
  notificationManager.off('unreadCountChange', handleUnreadCountChange)
})

// 处理员工状态变更通知
function handleEmployeeStatusChange(payload) {
  currentEmployeeNotification.value = payload
  employeeStatusVisible.value = true
}

// 处理工单派发通知
function handleOrderAssignment(payload) {
  currentOrderNotification.value = payload
  orderAssignmentVisible.value = true
}

// 处理未读数量变化
function handleUnreadCountChange(count) {
  unreadCount.value = count
}

// 关闭员工状态通知弹窗
function handleEmployeeStatusClose() {
  employeeStatusVisible.value = false
  // 标记为已读
  if (currentEmployeeNotification.value?.notification?.id) {
    notificationManager.markAsRead(currentEmployeeNotification.value.notification.id)
  }
  currentEmployeeNotification.value = null
}

// 关闭工单派发通知弹窗
function handleOrderAssignmentClose() {
  orderAssignmentVisible.value = false
  // 标记为已读
  if (currentOrderNotification.value?.notification?.id) {
    notificationManager.markAsRead(currentOrderNotification.value.notification.id)
  }
  currentOrderNotification.value = null
}

// 跳转到员工详情页面
function goToEmployee() {
  if (currentEmployeeNotification.value?.data?.employeeId) {
    router.push(`/employee/${currentEmployeeNotification.value.data.employeeId}`)
  }
  handleEmployeeStatusClose()
}

// 跳转到工单详情页面
function goToOrder() {
  if (currentOrderNotification.value?.data?.orderId) {
    router.push(`/order/${currentOrderNotification.value.data.orderId}`)
  }
  handleOrderAssignmentClose()
}

// 确认工单已读
function confirmOrderRead() {
  if (currentOrderNotification.value?.notification?.id) {
    notificationManager.markAsRead(currentOrderNotification.value.notification.id)
    ElMessage.success('已确认工单消息')
  }
  handleOrderAssignmentClose()
}

// 显示通知列表
async function showNotificationList() {
  notificationListVisible.value = true
  await loadNotificationList()
}

// 加载通知列表
async function loadNotificationList() {
  try {
    const token = localStorage.getItem('token')
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
    const userId = userInfo.id
    
    const response = await fetch('/api/api/notifications?page=1&size=20', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-User-Id': userId?.toString() || ''
      }
    })
    
    if (response.ok) {
      const result = await response.json()
      notificationList.value = result.data.notifications || []
    }
  } catch (error) {
    console.error('加载通知列表失败:', error)
    ElMessage.error('加载通知列表失败')
  }
}

// 标记所有为已读（带动画）
async function markAllAsRead() {
  if (markingAllAsRead.value) return
  
  markingAllAsRead.value = true
  
  try {
    // 获取所有未读消息
    const unreadNotifications = notificationList.value.filter(n => !n.isRead)
    if (unreadNotifications.length === 0) {
      markingAllAsRead.value = false
      return
    }
    
    // 调用API标记所有为已读
    await notificationManager.markAllAsRead()
    
    // 立即开始淡出动画
    unreadNotifications.forEach(notification => {
      notification.markingRead = true
      notification.fadeOut = true
    })
    
    // 动画完成后从列表中移除
    setTimeout(() => {
      notificationList.value = notificationList.value.filter(n => 
        !unreadNotifications.includes(n)
      )
    }, 600) // 给足够时间完成动画
    
  } catch (error) {
    console.error('标记所有已读失败:', error)
  } finally {
    markingAllAsRead.value = false
  }
}

// 标记单个为已读（带动画）
async function markAsRead(notificationId) {
  const notification = notificationList.value.find(n => n.id === notificationId)
  if (!notification || notification.markingRead) return
  
  notification.markingRead = true
  
  try {
    // 调用API标记为已读
    await notificationManager.markAsRead(notificationId)
    
    // console.log(`开始淡出动画 - 通知ID: ${notificationId}`)
    
    // 立即开始向右淡出动画
    notification.fadeOut = true
    
    // 动画完成后从列表中移除
    setTimeout(() => {
      const index = notificationList.value.findIndex(n => n.id === notificationId)
      if (index > -1) {
        // console.log(`从列表中移除通知: ${notificationId}`)
        notificationList.value.splice(index, 1)
      }
    }, 600) // 给足够时间完成动画
    
  } catch (error) {
    console.error('标记已读失败:', error)
    notification.markingRead = false
    notification.fadeOut = false
  }
}

// 处理通知项点击
function handleNotificationClick(notification) {
  // 对于工单通知，只标记为已读，不跳转页面
  if (notification.type === 'ORDER_ASSIGNMENT') {
    if (!notification.isRead) {
      markAsRead(notification.id)
    }
    return
  }
  
  // 对于员工状态通知，跳转到员工详情页面
  if (notification.type === 'EMPLOYEE_STATUS_CHANGE') {
    try {
      const data = JSON.parse(notification.data)
      router.push(`/employee/${data.employeeId}`)
    } catch (error) {
      console.error('解析通知数据失败:', error)
    }
    
    if (!notification.isRead) {
      markAsRead(notification.id)
    }
    
    notificationListVisible.value = false
  }
}

// 获取状态文本
function getStatusText(status) {
  const statusMap = {
    'IDLE': '空闲',
    'BUSY': '忙碌',
    'RESTING': '休息',
    'OFF_DUTY': '离岗'
  }
  return statusMap[status] || status
}

// 获取状态标签类型
function getStatusTagType(status) {
  const typeMap = {
    'IDLE': 'success',
    'BUSY': 'warning',
    'RESTING': 'info',
    'OFF_DUTY': 'danger'
  }
  return typeMap[status] || 'info'
}

// 获取状态图标类名
function getStatusIconClass(status) {
  const classMap = {
    'IDLE': 'status-idle',
    'BUSY': 'status-busy',
    'RESTING': 'status-resting',
    'OFF_DUTY': 'status-off'
  }
  return classMap[status] || 'status-default'
}

// 格式化时间
function formatTime(timeString) {
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
</script>

<style scoped>
.notification-content {
  padding: 20px 0;
}

.notification-header {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
}

.status-icon {
  font-size: 48px;
  margin-right: 15px;
  padding: 10px;
  border-radius: 50%;
  background-color: #f5f5f5;
}

.status-idle {
  color: #67c23a;
  background-color: #f0f9ff;
}

.status-busy {
  color: #e6a23c;
  background-color: #fdf6ec;
}

.status-resting {
  color: #909399;
  background-color: #f4f4f5;
}

.status-off {
  color: #f56c6c;
  background-color: #fef0f0;
}

.employee-info h3 {
  margin: 0 0 5px 0;
  font-size: 18px;
  font-weight: 600;
}

.username {
  margin: 0;
  color: #909399;
  font-size: 14px;
}

.status-change {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 8px;
}

.status-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
}

.status-item .label {
  font-size: 12px;
  color: #909399;
  margin-bottom: 5px;
}

.arrow-icon {
  font-size: 20px;
  color: #409eff;
  margin: 0 20px;
}

.notification-message {
  margin-bottom: 15px;
  padding: 15px;
  background-color: #ecf5ff;
  border-radius: 8px;
  border-left: 4px solid #409eff;
}

.notification-message p {
  margin: 0;
  line-height: 1.6;
}

.notification-time {
  display: flex;
  align-items: center;
  color: #909399;
  font-size: 14px;
}

.notification-time .el-icon {
  margin-right: 5px;
}

.order-header {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
}

.order-icon {
  font-size: 48px;
  color: #409eff;
  margin-right: 15px;
  padding: 10px;
  border-radius: 50%;
  background-color: #ecf5ff;
}

.order-info h3 {
  margin: 0 0 5px 0;
  font-size: 18px;
  font-weight: 600;
}

.client-info {
  margin: 0;
  color: #909399;
  font-size: 14px;
}

.assignment-info {
  margin-bottom: 20px;
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 8px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.info-row:last-child {
  margin-bottom: 0;
}

.info-row .label {
  color: #909399;
  font-weight: 500;
}

.order-screenshot {
  margin-bottom: 20px;
}

.order-screenshot .label {
  display: block;
  margin-bottom: 10px;
  font-weight: 500;
}

.screenshot-image {
  width: 100%;
  max-height: 200px;
  border-radius: 8px;
  border: 1px solid #dcdfe6;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}


.notification-list {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.list-header {
  padding: 0 0 20px 0;
  border-bottom: 1px solid #ebeef5;
}

.header-actions {
  display: flex;
  justify-content: flex-end;
}

.list-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px 0;
}

.notification-item {
  padding: 15px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background-color 0.3s;
}

.notification-item:hover {
  background-color: #f8f9fa;
}

.notification-item.unread {
  background-color: #ecf5ff;
  border-left: 4px solid #409eff;
}

.item-content h4 {
  margin: 0 0 8px 0;
  font-size: 14px;
  font-weight: 600;
}

.item-content p {
  margin: 0 0 8px 0;
  font-size: 13px;
  color: #606266;
  line-height: 1.4;
}

.item-content .time {
  font-size: 12px;
  color: #909399;
}

.item-actions {
  margin-top: 10px;
  display: flex;
  justify-content: flex-end;
}

.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
}

/* 通知列表容器 */
.notification-container {
  position: relative;
}

/* 通知项动画状态 */
.notification-item.marking-read {
  background-color: #f0f9ff;
  border-left: 4px solid #10b981;
  transform: scale(0.98);
  transition: all 0.2s ease;
}

.notification-item.fade-out {
  opacity: 0;
  transform: translateX(120%) scale(0.9);
  transition: all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  pointer-events: none;
  z-index: -1;
}

/* Vue transition-group 动画 */
.notification-fade-enter-active {
  transition: all 0.4s ease;
}

.notification-fade-leave-active {
  transition: all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  position: absolute;
  width: 100%;
}

.notification-fade-enter-from {
  opacity: 0;
  transform: translateX(-50px) scale(0.95);
}

.notification-fade-leave-to {
  opacity: 0;
  transform: translateX(120%) scale(0.9);
}

.notification-fade-move {
  transition: transform 0.4s ease;
}

/* 标记已读时的按钮状态 */
.item-actions .el-button.is-loading {
  color: #10b981;
  border-color: #10b981;
}

/* 已读状态优化 */
.notification-item:not(.unread) {
  opacity: 0.7;
  background-color: #f8f9fa;
}

.notification-item:not(.unread):hover {
  opacity: 0.9;
  background-color: #f0f0f0;
}
</style>