<template>
  <div class="employee-page">
    <!-- 通知弹窗组件 -->
    <NotificationPopup />
    
    
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <!-- 员工信息区域 -->
        <div class="employee-info">
          <template v-if="isInitializing">
            <!-- 加载状态 -->
            <div class="loading-info">
              <el-skeleton animated>
                <template #template>
                  <el-skeleton-item variant="circle" style="width: 60px; height: 60px;" />
                  <div style="margin-left: 16px;">
                    <el-skeleton-item variant="text" style="width: 120px; margin-bottom: 8px;" />
                    <el-skeleton-item variant="text" style="width: 80px;" />
                  </div>
                </template>
              </el-skeleton>
            </div>
          </template>
          <template v-else-if="currentUser">
            <!-- 正常显示用户信息 -->
            <el-avatar
              :src="currentUser.avatar"
              :size="60"
              class="employee-avatar"
            >
              {{ currentUser.realName?.charAt(0) || currentUser.username?.charAt(0)?.toUpperCase() }}
            </el-avatar>
            <div class="info-text">
              <h2 class="employee-name">{{ currentUser.username }}</h2>
              <div class="employee-meta">
                <span class="realname-info">姓名: {{ currentUser.realName }}</span>
                <span class="role-info">员工</span>
              </div>
            </div>
          </template>
          <template v-else>
            <!-- 错误状态 -->
            <div class="error-info">
              <el-icon size="60" color="#f56c6c"><WarningFilled /></el-icon>
              <div class="info-text">
                <h2 class="employee-name">用户信息加载失败</h2>
                <div class="employee-meta">
                  <span class="error-text">请刷新页面重试</span>
                </div>
              </div>
            </div>
          </template>
        </div>
        
        <!-- 右侧操作区域 -->
        <div class="header-actions">
          <!-- 工作状态控制区域 -->
          <div class="status-control-prominent">
            <span class="status-label-prominent">工作状态</span>
            <el-select
              v-model="employeeStatus"
              placeholder="选择工作状态"
              size="default"
              @change="handleStatusChange"
              :loading="isUpdatingStatus || isInitializing"
              :disabled="isInitializing || !currentUser"
              class="status-select-prominent"
              :class="`status-select-${employeeStatus}`"
            >
              <el-option label="🟢 空闲中" value="IDLE" />
              <el-option label="🟡 工作中" value="BUSY" />
              <el-option label="🔵 休息中" value="RESTING" />
              <el-option label="🔴 离岗" value="OFF_DUTY" />
            </el-select>
          </div>
        </div>
      </div>
    </div>

    <!-- 主要内容区域 -->
    <div class="content-area">
      <el-tabs
        v-model="activeTab"
        type="card"
        class="employee-tabs"
        @tab-change="handleTabChange"
      >
        <!-- 个人状态标签页 -->
        <el-tab-pane label="个人状态" name="status">
          <EmployeePersonalStatus
            :employee="currentUser"
            :user-role="'user'"
            @refresh="refreshEmployeeStatus"
          />
        </el-tab-pane>

        <!-- 工作记录标签页 -->
        <el-tab-pane label="工作记录" name="records">
          <EmployeeWorkRecords
            ref="workRecordsRef"
            :employee-id="currentUser?.id"
            :employee="currentUser"
            @refresh="refreshWorkRecords"
          />
        </el-tab-pane>
      </el-tabs>
    </div>

    <!-- 通知弹窗 -->
    <NotificationPopup
      v-model="notificationVisible"
      :type="notificationData.type"
      :title="notificationData.title"
      :message-title="notificationData.messageTitle"
      :message="notificationData.message"
      :details="notificationData.details"
      :show-confirm-button="notificationData.showConfirmButton"
      confirm-button-text="查看工单"
      :auto-close="0"
      @confirm="activeTab = 'records'"
    />

    <!-- 工单分配弹窗 -->
    <!-- 叠加的工单分配弹窗队列 -->
    <OrderAssignmentPopup
      v-for="(stack, idx) in popupStacks"
      :key="stack.id"
      v-model="stack.visible"
      :notifications="stack.notifications"
      :stack-index="idx"
      @mark-as-read="(ids) => handleOrderAssignmentMarkAsRead(ids, stack.id)"
      @go-to-work-records="() => handleGoToWorkRecords(stack.id)"
    />

  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { WarningFilled } from '@element-plus/icons-vue'
import { onBeforeRouteLeave } from 'vue-router'
import authStore from '../store/auth'
import { getProfile, getAssignedOrders, updateProfile } from '../api/employee'
import EmployeePersonalStatus from '../components/EmployeePersonalStatus.vue'
import EmployeeWorkRecords from '../components/EmployeeWorkRecords.vue'
import { usePolling, POLLING_CONFIG } from '../utils/polling'
import NotificationPopup from '../components/NotificationPopup.vue'
import OrderAssignmentPopup from '../components/OrderAssignmentPopup.vue'
import { useUnreadCount } from '../composables/useUnreadCount'

export default {
  name: 'Employee',
  components: {
    EmployeePersonalStatus,
    EmployeeWorkRecords,
    WarningFilled,
    NotificationPopup,
    OrderAssignmentPopup
  },
  setup() {
    // 轮询管理
    const { stopPolling, clearAllPolling, forceStopAllPolling, getActivePollingKeys, startOrderSmartPolling } = usePolling()
    
    // 未读数量管理
    const {
      unreadCount,
      fetchUnreadCount,
      updateUnreadCount,
      decreaseUnreadCount
    } = useUnreadCount()
    
    // 响应式数据
    const activeTab = ref('status')
    const employeeStatus = ref('IDLE')
    const workRecordsRef = ref(null)
    const isUpdatingStatus = ref(false)
    const isInitializing = ref(true)
    
    // 通知弹窗相关
    const notificationVisible = ref(false)
    const notificationData = reactive({
      type: 'info',
      title: '通知',
      messageTitle: '',
      message: '',
      details: null,
      showConfirmButton: false
    })
    
    
    // 工单分配弹窗相关：支持多弹窗叠加
    const orderAssignmentPopupVisible = ref(false) // 兼容保留
    const pendingOrderNotifications = ref([])
    const popupStacks = ref([]) // [{id, notifications}]
    
    // 工单通知相关变量（用于订单分配通知轮询）
    const orderNotifications = ref([])
    const unreadOrderCount = ref(0)
    
    // 订单分配通知轮询相关
    const startOrderNotificationPolling = () => {
      const pollingKey = `order-assignment-notifications-${currentUser.value?.id || 'employee'}`
      const interval = POLLING_CONFIG.EMPLOYEE_ORDERS * 1000 // 使用与工单相同的轮询间隔
      
      console.log(`开始订单分配通知轮询，间隔: ${POLLING_CONFIG.EMPLOYEE_ORDERS}秒`)
      
      // 数据获取函数
      const dataFetcher = async () => {
        // 检查用户是否已登出
        const isAuthenticated = authStore.getters.isAuthenticated.value
        const isLogoutInProgress = authStore.state.isLogoutInProgress
        
        if (!isAuthenticated || isLogoutInProgress) {
          console.log('🚫 用户已登出或登出进行中，停止订单分配通知轮询')
          stopOrderNotificationPolling()
          throw new Error('用户已登出，停止轮询')
        }
        
        console.log('轮询获取订单分配通知数据...')
        
        try {
          // 调用订单分配通知接口
          const response = await fetch('/api/api/notifications/type/ORDER_ASSIGNMENT', {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
              'Content-Type': 'application/json',
              'X-User-Id': currentUser.value?.id?.toString() || ''
            }
          })
          
          if (response.ok) {
            const result = await response.json()
            return result.data || []
          } else if (response.status === 401) {
            console.log('认证失效，停止订单分配通知轮询')
            authStore.actions.logout()
            throw new Error('认证失效')
          } else {
            console.warn('获取订单分配通知失败:', response.status)
            return []
          }
        } catch (error) {
          console.error('订单分配通知轮询出错:', error)
          throw error
        }
      }
      
      // 数据变化处理函数
      const onNotificationChange = (newData, oldData, changes) => {
        console.log('检测到订单分配通知数据变化:', changes)
        
        // 更新本地通知数据
        if (newData && Array.isArray(newData)) {
          // 合并新通知到现有列表
          const existingIds = new Set(orderNotifications.value.map(n => n.id))
          const newNotifications = newData.filter(n => !existingIds.has(n.id))
          
          if (newNotifications.length > 0) {
            console.log(`发现 ${newNotifications.length} 条新的订单分配通知`)
            
            // 添加新通知到列表头部
            orderNotifications.value.unshift(...newNotifications)
            
            // 筛选出未读的新通知
            const unreadNewNotifications = newNotifications.filter(n => !n.isRead)
            
            if (unreadNewNotifications.length > 0) {
              // 为每批未读通知创建一个叠加弹窗栈条目
              popupStacks.value.push({
                id: Date.now() + Math.random(),
                notifications: unreadNewNotifications,
                visible: true
              })
              console.log(`显示工单分配弹窗(叠加)，本批 ${unreadNewNotifications.length} 条`)
            }
          }
          
          // 更新现有通知的状态
          orderNotifications.value.forEach(notification => {
            const updatedNotification = newData.find(n => n.id === notification.id)
            if (updatedNotification) {
              // 更新通知状态
              notification.isRead = updatedNotification.isRead
              notification.readTime = updatedNotification.readTime
            }
          })
          
          // 重新计算未读数量
          unreadOrderCount.value = orderNotifications.value.filter(n => !n.isRead).length
        }
      }
      
      // 开始智能轮询
      startOrderSmartPolling(pollingKey, dataFetcher, onNotificationChange, interval)
    }
    
    // 停止订单分配通知轮询
    const stopOrderNotificationPolling = () => {
      const pollingKey = `order-assignment-notifications-${currentUser.value?.id || 'employee'}`
      console.log('🛑 停止订单分配通知轮询')
      
      try {
        stopPolling(pollingKey)
        console.log('✅ 订单分配通知轮询已停止:', pollingKey)
      } catch (e) {
        console.warn('⚠️ 停止订单分配通知轮询失败:', e)
      }
    }
    
    // 计算属性
    const currentUser = computed(() => authStore.getters.currentUser.value)
    
    // 方法
    const getStatusTagType = (status) => {
      const statusMap = {
        'BUSY': 'warning',        // 工作中 - 黄色 (与客服页面一致)
        'IDLE': 'success',        // 空闲中 - 绿色 (与客服页面一致)
        'RESTING': 'primary',     // 休息中 - 蓝色 (与客服页面一致)
        'OFF_DUTY': 'danger',     // 离岗 - 红色 (与客服页面一致)
        // 兼容小写格式
        'working': 'warning',
        'idle': 'success',
        'resting': 'primary',
        'offline': 'danger'
      }
      return statusMap[status] || 'info'
    }
    
    const getStatusText = (status) => {
      const statusMap = {
        'BUSY': '工作中',
        'IDLE': '空闲中',
        'RESTING': '休息中',
        'OFF_DUTY': '离岗',
        // 兼容小写格式
        'working': '工作中',
        'idle': '空闲中',
        'resting': '休息中',
        'offline': '离岗'
      }
      return statusMap[status] || '未知'
    }
    
    const handleTabChange = (tabName) => {
      activeTab.value = tabName
    }
    
    const handleStatusChange = async (newStatus) => {
      if (!currentUser.value?.id) {
        ElMessage.error('无法获取用户信息')
        return
      }
      
      isUpdatingStatus.value = true
      try {
        // 调用API更新工作状态
        const updateData = {
          userId: currentUser.value.id,
          workStatus: newStatus
        }
        
        const response = await updateProfile(updateData)
        
        if (response.code === 200 || response.code === 0) {
          ElMessage.success(`工作状态已更新为：${getStatusText(newStatus)}`)
          // 刷新个人状态数据
          await refreshEmployeeStatus()
        } else {
          ElMessage.error(response.message || '更新工作状态失败')
          // 恢复原状态
          await refreshEmployeeStatus()
        }
      } catch (error) {
        console.error('更新工作状态失败:', error)
        ElMessage.error('更新工作状态失败，请稍后重试')
        // 恢复原状态
        await refreshEmployeeStatus()
      } finally {
        isUpdatingStatus.value = false
      }
    }
    
    const initializeData = async () => {
      try {
        // 确保用户信息已加载
        if (!currentUser.value) {
          await authStore.actions.fetchCurrentUser()
        }
        
        await Promise.all([
          refreshEmployeeStatus(),
          refreshWorkRecords()
        ])
      } catch (error) {
        console.error('初始化数据失败:', error)
      } finally {
        isInitializing.value = false
      }
    }
    
    const refreshEmployeeStatus = async () => {
      try {
        const response = await getProfile()
        let profileData = null
        
        // 兼容不同的API响应格式
        if (response.code === 200 || response.code === 0) {
          profileData = response.data
        } else if (response.data) {
          profileData = response.data
        } else {
          profileData = response
        }
        
        if (profileData) {
          employeeStatus.value = profileData.workStatus || 'IDLE'
        } else {
          employeeStatus.value = 'IDLE'
        }
      } catch (error) {
        console.error('刷新员工状态失败:', error)
        employeeStatus.value = 'IDLE'
      }
    }
    
    const refreshWorkRecords = async () => {
      try {
        // 调用子组件的刷新方法
        if (workRecordsRef.value) {
          await workRecordsRef.value.refreshData()
        }
      } catch (error) {
        console.error('刷新工单记录失败:', error)
      }
    }
    
    // 开始未读数量轮询
    const startUnreadCountPolling = () => {
      const pollingKey = `unread-count-${currentUser.value?.id || 'employee'}`
      const interval = POLLING_CONFIG.EMPLOYEE_ORDERS * 1000 // 使用与工单相同的轮询间隔
      
      console.log(`开始未读数量轮询，间隔: ${POLLING_CONFIG.EMPLOYEE_ORDERS}秒`)
      
      // 数据获取函数
      const dataFetcher = async () => {
        // 检查用户是否已登出
        const isAuthenticated = authStore.getters.isAuthenticated.value
        const isLogoutInProgress = authStore.state.isLogoutInProgress
        
        if (!isAuthenticated || isLogoutInProgress) {
          console.log('🚫 用户已登出或登出进行中，停止未读数量轮询')
          stopUnreadCountPolling()
          throw new Error('用户已登出，停止轮询')
        }
        
        console.log('轮询获取未读数量...')
        
        try {
          // 调用未读数量接口
          const response = await fetch('/api/api/notifications/unread/count', {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
              'Content-Type': 'application/json',
              'X-User-Id': currentUser.value?.id?.toString() || ''
            }
          })
          
          if (response.ok) {
            const result = await response.json()
            return result.data || 0
          } else if (response.status === 401) {
            console.log('认证失效，停止未读数量轮询')
            authStore.actions.logout()
            throw new Error('认证失效')
          } else {
            console.warn('获取未读数量失败:', response.status)
            return unreadCount.value // 返回当前值，避免重置
          }
        } catch (error) {
          console.error('未读数量轮询出错:', error)
          throw error
        }
      }
      
      // 数据变化处理函数
      const onUnreadCountChange = (newCount, oldCount, changes) => {
        console.log('检测到未读数量变化:', { oldCount, newCount })
        
        if (typeof newCount === 'number' && newCount !== oldCount) {
          updateUnreadCount(newCount)
          console.log(`未读数量已更新: ${newCount}`)
        }
      }
      
      // 开始智能轮询
      startOrderSmartPolling(pollingKey, dataFetcher, onUnreadCountChange, interval)
    }
    
    // 停止未读数量轮询
    const stopUnreadCountPolling = () => {
      const pollingKey = `unread-count-${currentUser.value?.id || 'employee'}`
      console.log('🛑 停止未读数量轮询')
      
      try {
        stopPolling(pollingKey)
        console.log('✅ 未读数量轮询已停止:', pollingKey)
      } catch (e) {
        console.warn('⚠️ 停止未读数量轮询失败:', e)
      }
    }
    
    
    // 生命周期
    onMounted(async () => {
      // 初始化数据
      await initializeData()
      
      // 延迟启动订单分配通知轮询，避免与初始加载冲突
      setTimeout(() => {
        startOrderNotificationPolling()
        startUnreadCountPolling()
      }, 1500)
    })
    
    // 停止所有轮询的方法
    const stopAllPolling = () => {
      console.log('🚨 Employee 停止所有轮询')
      
      // 1. 先停止订单分配通知轮询
      try {
        stopOrderNotificationPolling()
      } catch (e) {
        console.warn('⚠️ 订单分配通知轮询停止失败:', e)
      }
      
      // 1.5. 停止未读数量轮询
      try {
        stopUnreadCountPolling()
      } catch (e) {
        console.warn('⚠️ 未读数量轮询停止失败:', e)
      }
      
      // 2. 通知子组件停止轮询（优先级最高）
      if (workRecordsRef.value && workRecordsRef.value.stopPollingData) {
        console.log('📢 通知 EmployeeWorkRecords 组件停止轮询')
        try {
          workRecordsRef.value.stopPollingData()
        } catch (e) {
          console.warn('⚠️ 子组件轮询停止失败:', e)
        }
      }
      
      // 3. 获取当前活跃轮询
      const activePolling = getActivePollingKeys()
      console.log('📊 Employee 活跃轮询列表:', activePolling)
      
      // 4. 强制清除所有轮询（使用最强力的方法）
      console.log('🧹 强制清除所有轮询（暴力模式）')
      forceStopAllPolling()
      
      // 5. 延迟检查并再次强制清理（双重保险）
      setTimeout(() => {
        const stillActive = getActivePollingKeys()
        if (stillActive.length > 0) {
          console.log('🚨 发现残留轮询，再次强制清理:', stillActive)
          forceStopAllPolling()
        } else {
          console.log('✅ 确认所有轮询已停止')
        }
      }, 100)
      
      console.log('✅ Employee 轮询停止完成')
    }
    
    // 路由离开守卫 - 确保离开页面时停止轮询
    onBeforeRouteLeave((to, from, next) => {
      console.log('Employee onBeforeRouteLeave, 停止所有轮询')
      stopAllPolling()
      next()
    })
    
    // 组件卸载时确保停止所有轮询
    onUnmounted(() => {
      console.log('Employee onUnmounted, 确保停止所有轮询')
      stopAllPolling()
    })
    
    
    // 工单分配弹窗事件处理
    const handleOrderAssignmentMarkAsRead = async (notificationIds, stackId = null) => {
      try {
        // 从叠加栈中移除该弹窗
        if (stackId) {
          popupStacks.value = popupStacks.value.filter(p => p.id !== stackId)
        } else {
          pendingOrderNotifications.value = []
          orderAssignmentPopupVisible.value = false
        }
        
        console.log(`已处理 ${notificationIds.length} 条工单分配通知`)
      } catch (error) {
        console.error('处理工单分配通知失败:', error)
      }
    }
    
    const handleGoToWorkRecords = (stackId = null) => {
      // 切换到工作记录标签页
      activeTab.value = 'records'
      // 若来自叠加弹窗，关闭对应弹窗
      if (stackId) {
        popupStacks.value = popupStacks.value.filter(p => p.id !== stackId)
      }
      console.log('跳转到工作记录页面')
    }
    
    return {
      // 响应式数据
      activeTab,
      employeeStatus,
      workRecordsRef,
      isUpdatingStatus,
      isInitializing,
      notificationVisible,
      notificationData,
      
      // 工单分配弹窗相关
      orderAssignmentPopupVisible,
      pendingOrderNotifications,
      popupStacks,
      
      // 计算属性
      currentUser,
      
      // 方法
      getStatusTagType,
      getStatusText,
      handleTabChange,
      handleStatusChange,
      refreshEmployeeStatus,
      refreshWorkRecords,
      stopAllPolling,
      
      // 订单分配通知轮询方法
      startOrderNotificationPolling,
      stopOrderNotificationPolling,
      
      // 未读数量相关
      unreadCount,
      fetchUnreadCount,
      updateUnreadCount,
      decreaseUnreadCount,
      startUnreadCountPolling,
      stopUnreadCountPolling,
      
      // 工单分配弹窗事件处理
      handleOrderAssignmentMarkAsRead,
      handleGoToWorkRecords
    }
  }
}
</script>

<style scoped>
.employee-page {
  min-height: 100vh;
  background: #f5f7fa;
}

.page-header {
  background: #fff;
  border-bottom: 1px solid #e4e7ed;
  padding: 12px;
  margin-bottom: 12px;
}


.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.employee-info {
  display: flex;
  align-items: center;
  gap: 16px;
  min-height: 76px; /* 确保高度一致，防止布局跳动 */
}

.loading-info,
.error-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.error-text {
  color: #f56c6c;
  font-size: 13px;
}

.employee-avatar {
  border: 2px solid #e4e7ed;
}

.info-text {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.employee-name {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: #303133;
}

.employee-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.username-info {
  color: #606266;
  font-size: 13px;
  background: #f5f7fa;
  padding: 2px 8px;
  border-radius: 4px;
}

.realname-info {
  color: #606266;
  font-size: 13px;
  background: #f5f7fa;
  padding: 2px 8px;
  border-radius: 4px;
}

.role-info {
  color: #909399;
  font-size: 14px;
}

.status-control-prominent {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.status-label-prominent {
  color: #303133;
  font-size: 14px;
  font-weight: 600;
  text-align: center;
}

.status-select-prominent {
  width: 140px;
}

/* 工作状态颜色样式 - 更鲜明的颜色 */
.status-select-IDLE :deep(.el-input__wrapper) {
  background: linear-gradient(135deg, #52c41a, #73d13d);
  border: 2px solid #52c41a;
  box-shadow: 0 2px 8px rgba(82, 196, 26, 0.3);
}

.status-select-IDLE :deep(.el-input__inner) {
  color: #ffffff;
  font-weight: 600;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.status-select-BUSY :deep(.el-input__wrapper) {
  background: linear-gradient(135deg, #faad14, #ffc53d);
  border: 2px solid #faad14;
  box-shadow: 0 2px 8px rgba(250, 173, 20, 0.3);
}

.status-select-BUSY :deep(.el-input__inner) {
  color: #ffffff;
  font-weight: 600;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.status-select-RESTING :deep(.el-input__wrapper) {
  background: linear-gradient(135deg, #1890ff, #40a9ff);
  border: 2px solid #1890ff;
  box-shadow: 0 2px 8px rgba(24, 144, 255, 0.3);
}

.status-select-RESTING :deep(.el-input__inner) {
  color: #ffffff;
  font-weight: 600;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.status-select-OFF_DUTY :deep(.el-input__wrapper) {
  background: linear-gradient(135deg, #ff4d4f, #ff7875);
  border: 2px solid #ff4d4f;
  box-shadow: 0 2px 8px rgba(255, 77, 79, 0.3);
}

.status-select-OFF_DUTY :deep(.el-input__inner) {
  color: #ffffff;
  font-weight: 600;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

/* 悬停效果 */
.status-select-prominent:hover :deep(.el-input__wrapper) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
}

/* 聚焦效果 */
.status-select-prominent :deep(.el-input__wrapper):focus-within {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2) !important;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.content-area {
  width: 100%;
  padding: 0 12px;
}

.employee-tabs {
  background: #fff;
  border-radius: 8px;
  padding: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.employee-tabs :deep(.el-tabs__header) {
  margin-bottom: 12px;
}

.employee-tabs :deep(.el-tabs__item) {
  font-size: 16px;
  font-weight: 500;
}

.employee-tabs :deep(.el-tabs__content) {
  padding: 0;
}


/* 响应式设计 */
@media (max-width: 768px) {
  .page-header {
    padding: 8px;
  }
  
  .header-content {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
  }
  
  .employee-info {
    width: 100%;
  }
  
  .header-actions {
    width: 100%;
    justify-content: center;
    flex-wrap: wrap;
    gap: 16px;
  }
  
  .status-control-prominent {
    margin-bottom: 0;
  }
  
  .content-area {
    padding: 0 8px;
  }
  
  .employee-tabs {
    padding: 8px;
  }
  
  .employee-meta {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
}
</style>


