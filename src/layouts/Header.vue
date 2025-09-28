<template>
  <header class="header">
    <div class="header-content">
      <div class="logo">
        <span class="site-name">陪玩管理系统</span>
      </div>
      <nav class="nav">
        <!-- 员工角色只显示员工主页 -->
        <template v-if="userRole?.toUpperCase() === 'EMPLOYEE'">
          <router-link to="/employee" class="nav-item">员工页面</router-link>
        </template>
        
        <!-- 客服角色只显示客服管理 -->
        <template v-else-if="userRole?.toUpperCase() === 'CS'">
          <router-link to="/customer-service" class="nav-item">客服页面</router-link>
        </template>
        
        <!-- 管理员角色只显示管理员页面 -->
        <template v-else-if="userRole?.toUpperCase() === 'ADMIN'">
          <router-link to="/admin" class="nav-item">管理员页面</router-link>
        </template>
        
        <!-- 其他情况（未登录或其他角色）显示基础导航 -->
        <template v-else>
          <router-link to="/" class="nav-item">首页</router-link>
          <router-link to="/about" class="nav-item">关于</router-link>
        </template>
      </nav>
      <div class="auth-nav">
        <!-- 未登录状态 -->
        <template v-if="!isAuthenticated">
          <router-link to="/login" class="auth-button login-btn">登录</router-link>
          <router-link to="/register" class="auth-button register-btn">注册</router-link>
        </template>
        
        <!-- 已登录状态 -->
        <template v-else>
          <!-- 用户信息下拉菜单 -->
          <el-dropdown @command="handleUserAction" trigger="hover">
            <div class="user-info">
              <el-avatar 
                :src="currentUser?.avatar" 
                :size="32"
                class="user-avatar"
              >
                {{ currentUser?.realName?.charAt(0) || currentUser?.username?.charAt(0)?.toUpperCase() }}
              </el-avatar>
              <div class="user-text">
                <span class="username">{{ currentUser?.username }}</span>
                <span class="real-name" v-if="currentUser?.realName">{{ currentUser?.realName }}</span>
              </div>
              <el-icon class="dropdown-icon"><ArrowDown /></el-icon>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="change-password">
                  <el-icon><Lock /></el-icon>
                  修改密码
                </el-dropdown-item>
                <el-dropdown-item divided command="logout">
                  <el-icon><SwitchButton /></el-icon>
                  退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          
          <!-- 消息通知图标（员工和客服可见，放在用户信息右侧） -->
          <div v-if="userRole?.toUpperCase() === 'EMPLOYEE' || userRole?.toUpperCase() === 'CS'" class="notification-icon-wrapper" @click="showNotifications">
            <el-badge :value="getUnreadNotificationCount" :max="99" class="notification-icon">
              <el-icon class="bell-icon">
                <Bell />
              </el-icon>
            </el-badge>
          </div>
        </template>
      </div>
    </div>
    
    <!-- 修改密码对话框 -->
    <ChangePassword 
      v-model="showChangePassword" 
      @success="handlePasswordChangeSuccess"
    />
    
    <!-- 通知抽屉（员工和客服可见） -->
    <el-drawer
      v-if="userRole?.toUpperCase() === 'EMPLOYEE' || userRole?.toUpperCase() === 'CS'"
      v-model="notificationDrawerVisible"
      :title="getNotificationDrawerTitle"
      direction="rtl"
      size="450px"
      :before-close="handleNotificationDrawerClose"
    >
      <div class="order-notifications-content">
        <!-- 操作按钮 -->
        <div class="notification-actions">
          <el-button 
            @click="refreshNotifications" 
            :loading="isLoadingNotifications"
            size="small"
          >
            <el-icon><Refresh /></el-icon>
            刷新
          </el-button>
          <el-button 
            @click="markAllNotificationsAsRead" 
            type="primary"
            size="small"
            :disabled="getUnreadNotificationCount === 0"
          >
            全部已读 ({{ getUnreadNotificationCount }})
          </el-button>
        </div>

        <!-- 通知列表 -->
        <div class="notifications-list">
          <div v-if="getCurrentNotifications.length === 0" class="empty-state">
            <el-empty :description="getEmptyStateDescription" />
          </div>
          
          <!-- 员工角色：工单通知 -->
          <template v-if="userRole?.toUpperCase() === 'EMPLOYEE'">
            <transition-group name="notification-fade" tag="div" class="notification-container">
              <div 
                v-for="notification in getCurrentNotifications" 
                :key="notification.id"
                class="notification-item"
                :class="{ 
                  'unread': !notification.isRead,
                  'marking-read': notification.markingRead,
                  'fade-out': notification.fadeOut
                }"
              >
            <div class="notification-header">
              <div class="notification-icon">
                <el-icon color="#409eff"><Document /></el-icon>
              </div>
              <div class="notification-content">
                <h4>{{ notification.title }}</h4>
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
                  
                  <!-- 委托信息 -->
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
            
              <!-- 操作按钮 -->
              <div class="notification-actions-item">
                <el-button 
                  v-if="!notification.isRead"
                  size="small" 
                  :loading="notification.markingRead"
                  @click="markOrderNotificationAsReadWithUpdate(notification.id)"
                >
                  标为已读
                </el-button>
              </div>
              </div>
            </transition-group>
          </template>
          
          <!-- 客服角色：员工状态通知 -->
          <template v-else-if="userRole?.toUpperCase() === 'CS'">
            <transition-group name="notification-fade" tag="div" class="notification-container">
              <div 
                v-for="notification in getCurrentNotifications" 
                :key="notification.id"
                class="notification-item"
                :class="{ 
                  'unread': !notification.isRead,
                  'marking-read': notification.markingRead,
                  'fade-out': notification.fadeOut
                }"
              >
              <div class="notification-header">
                <div class="notification-icon">
                  <el-icon color="#67c23a"><UserFilled /></el-icon>
                </div>
                <div class="notification-content">
                  <h4>{{ notification.title }}</h4>
                  <p class="notification-message">{{ notification.content }}</p>
                  
                  <!-- 员工状态变更详细信息 -->
                  <div v-if="getEmployeeStatusData(notification)" class="status-details">
                    <div class="detail-row">
                      <span class="label">员工姓名:</span>
                      <span class="value">{{ getEmployeeStatusData(notification).employeeName }}</span>
                    </div>
                    <div class="detail-row">
                      <span class="label">目前状态:</span>
                      <div class="status-change-text">
                        <span class="status-text">空闲</span>
                      </div>
                    </div>
                    <div class="detail-row">
                      <span class="label">变更时间:</span>
                      <span class="value">{{ formatTime(getEmployeeStatusData(notification).statusChangeTime) }}</span>
                    </div>
                  </div>
                  
                  <div class="notification-time">
                    <el-icon><Clock /></el-icon>
                    <span>{{ formatTime(notification.createTime) }}</span>
                  </div>
                </div>
              </div>
              
              <!-- 操作按钮 -->
              <div class="notification-actions-item">
                <el-button 
                  v-if="!notification.isRead"
                  size="small" 
                  :loading="notification.markingRead"
                  @click="markEmployeeStatusNotificationAsReadWithUpdate(notification.id)"
                >
                  标为已读
                </el-button>
                <el-button 
                  size="small" 
                  type="primary"
                  @click="goToEmployeeDetail(notification)"
                >
                  查看员工
                </el-button>
              </div>
              </div>
            </transition-group>
          </template>
        </div>
      </div>
    </el-drawer>
  </header>
</template>

<script>
import { computed, ref, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  ArrowDown, 
  SwitchButton,
  Lock,
  Bell,
  Document,
  Clock,
  Refresh,
  UserFilled,
  ArrowRight
} from '@element-plus/icons-vue'
import authStore from '../store/auth'
import ChangePassword from '../components/ChangePassword.vue'
import { useOrderNotifications } from '../composables/useOrderNotifications'
import { useEmployeeStatusNotifications } from '../composables/useEmployeeStatusNotifications'
import { useUnreadCount } from '../composables/useUnreadCount'

export default {
  name: 'Header',
  components: {
    ArrowDown,
    SwitchButton,
    Lock,
    Bell,
    Document,
    Clock,
    Refresh,
    UserFilled,
    ArrowRight,
    ChangePassword
  },
  setup() {
    const router = useRouter()
    
    // 响应式数据
    const showChangePassword = ref(false)
    const notificationDrawerVisible = ref(false)
    const isLoadingNotifications = ref(false)
    
    // 计算属性
    const isAuthenticated = computed(() => authStore.getters.isAuthenticated.value)
    const currentUser = computed(() => authStore.getters.currentUser.value)
    const userRole = computed(() => authStore.getters.userRole.value)
    
    // 使用工单通知组合式函数（员工角色）
    const {
      orderNotifications,
      unreadOrderCount,
      fetchOrderNotifications,
      markOrderNotificationAsRead,
      markAllOrderNotificationsAsRead,
      getOrderNotificationData
    } = useOrderNotifications()
    
    // 使用员工状态通知组合式函数（客服角色）
    const {
      employeeStatusNotifications,
      unreadEmployeeStatusCount,
      fetchEmployeeStatusNotifications,
      markEmployeeStatusNotificationAsRead,
      markAllEmployeeStatusNotificationsAsRead,
      getEmployeeStatusNotificationData,
      getStatusText: getNotificationStatusText,
      getStatusColor,
      getStatusIcon
    } = useEmployeeStatusNotifications()
    
    // 统一的未读数量管理
    const {
      unreadCount: globalUnreadCount
    } = useUnreadCount()
    
    // 新的计算属性
    const getUnreadNotificationCount = computed(() => {
      // 使用统一的未读数量接口
      return globalUnreadCount.value
    })
    
    const getCurrentNotifications = computed(() => {
      if (userRole.value?.toUpperCase() === 'EMPLOYEE') {
        return orderNotifications.value
      } else if (userRole.value?.toUpperCase() === 'CS') {
        return employeeStatusNotifications.value
      }
      return []
    })
    
    const getNotificationDrawerTitle = computed(() => {
      if (userRole.value?.toUpperCase() === 'EMPLOYEE') {
        return '工单通知'
      } else if (userRole.value?.toUpperCase() === 'CS') {
        return '员工状态通知'
      }
      return '通知'
    })
    
    const getEmptyStateDescription = computed(() => {
      if (userRole.value?.toUpperCase() === 'EMPLOYEE') {
        return '暂无工单通知'
      } else if (userRole.value?.toUpperCase() === 'CS') {
        return '暂无员工状态通知'
      }
      return '暂无通知'
    })
    
    // 处理用户操作
    const handleUserAction = async (command) => {
      switch (command) {
        case 'change-password':
          showChangePassword.value = true
          break
        case 'logout':
          try {
            const result = await ElMessageBox.confirm(
              '确定要退出登录吗？',
              '确认退出',
              {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning'
              }
            )
            
            if (result === 'confirm') {
              // 立即执行登出操作，不延迟
              await authStore.actions.logout()
              
              // 直接跳转到根路径
              router.push('/')
            }
          } catch (error) {
            if (error !== 'cancel') {
              console.error('退出登录失败:', error)
              ElMessage.error('退出登录失败')
            }
          }
          break
      }
    }
    
    // 处理密码修改成功
    const handlePasswordChangeSuccess = (result) => {
      // console.log('Header - 密码修改成功:', result)
      // 不需要显示额外的成功提示，ChangePassword组件已经显示了
    }
    
    // 通知相关方法
    const showNotifications = async () => {
      notificationDrawerVisible.value = true
      await refreshNotifications()
    }
    
    const refreshNotifications = async () => {
      isLoadingNotifications.value = true
      try {
        if (userRole.value?.toUpperCase() === 'EMPLOYEE') {
          await fetchOrderNotifications()
        } else if (userRole.value?.toUpperCase() === 'CS') {
          await fetchEmployeeStatusNotifications()
        }
      } catch (error) {
        console.error('刷新通知失败:', error)
        ElMessage.error('刷新通知失败')
      } finally {
        isLoadingNotifications.value = false
      }
    }
    
    // 包装的标记已读方法，包含全局未读数量更新
    const markOrderNotificationAsReadWithUpdate = async (notificationId) => {
      try {
        await markOrderNotificationAsRead(notificationId)
        // 更新全局未读数量
        await fetchUnreadCount()
        // console.log('Header工单通知标记已读后已更新全局未读数量')
      } catch (error) {
        console.error('标记工单通知已读或更新未读数量失败:', error)
      }
    }
    
    const markEmployeeStatusNotificationAsReadWithUpdate = async (notificationId) => {
      try {
        await markEmployeeStatusNotificationAsRead(notificationId)
        // 更新全局未读数量
        await fetchUnreadCount()
        // console.log('Header员工状态通知标记已读后已更新全局未读数量')
      } catch (error) {
        console.error('标记员工状态通知已读或更新未读数量失败:', error)
      }
    }

    const markAllNotificationsAsRead = async () => {
      try {
        if (userRole.value?.toUpperCase() === 'EMPLOYEE') {
          await markAllOrderNotificationsAsRead()
        } else if (userRole.value?.toUpperCase() === 'CS') {
          await markAllEmployeeStatusNotificationsAsRead()
        }
        // 更新全局未读数量
        await fetchUnreadCount()
        // console.log('Header全部标记已读后已更新全局未读数量')
      } catch (error) {
        console.error('标记所有通知为已读失败:', error)
      }
    }
    
    const handleNotificationDrawerClose = () => {
      notificationDrawerVisible.value = false
    }
    
    const getOrderData = (notification) => {
      return getOrderNotificationData(notification)
    }
    
    const getEmployeeStatusData = (notification) => {
      return getEmployeeStatusNotificationData(notification)
    }
    
    const goToOrderDetail = async (notification) => {
      const orderData = getOrderData(notification)
      if (orderData?.orderId) {
        // console.log('跳转到工单详情:', orderData.orderId)
        ElMessage.info(`工单详情功能待开发，工单号：${orderData.orderNumber}`)
        
        // 标记为已读
        if (!notification.isRead) {
          await markOrderNotificationAsRead(notification.id)
          // 更新全局未读数量
          try {
            await fetchUnreadCount()
            // console.log('Header工单通知标记已读后已更新全局未读数量')
          } catch (error) {
            console.error('更新全局未读数量失败:', error)
          }
        }
      }
    }
    
    const goToEmployeeDetail = async (notification) => {
      const statusData = getEmployeeStatusData(notification)
      if (statusData?.employeeId) {
        // console.log('跳转到员工详情:', statusData.employeeId)
        
        // 标记为已读
        if (!notification.isRead) {
          await markEmployeeStatusNotificationAsRead(notification.id)
          // 更新全局未读数量
          try {
            await fetchUnreadCount()
            // console.log('Header员工状态通知标记已读后已更新全局未读数量')
          } catch (error) {
            console.error('更新全局未读数量失败:', error)
          }
        }
        
        // 跳转到客服页面的员工详情
        router.push({
          name: 'CSEmployeeDetail',
          params: { id: statusData.employeeId }
        })
        
        // 关闭通知抽屉
        notificationDrawerVisible.value = false
      } else {
        ElMessage.warning('无法获取员工信息')
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
    
    return {
      isAuthenticated,
      currentUser,
      userRole,
      showChangePassword,
      notificationDrawerVisible,
      isLoadingNotifications,
      
      // 计算属性
      getUnreadNotificationCount,
      getCurrentNotifications,
      getNotificationDrawerTitle,
      getEmptyStateDescription,
      
      // 全局未读数量
      globalUnreadCount,
      
      // 通知相关方法
      showNotifications,
      refreshNotifications,
      markAllNotificationsAsRead,
      markOrderNotificationAsReadWithUpdate,
      markEmployeeStatusNotificationAsReadWithUpdate,
      handleNotificationDrawerClose,
      
      // 工单通知相关（员工角色）
      orderNotifications,
      unreadOrderCount,
      getOrderData,
      goToOrderDetail,
      markOrderNotificationAsRead,
      
      // 员工状态通知相关（客服角色）
      employeeStatusNotifications,
      unreadEmployeeStatusCount,
      getEmployeeStatusData,
      goToEmployeeDetail,
      markEmployeeStatusNotificationAsRead,
      getNotificationStatusText,
      getStatusColor,
      getStatusIcon,
      
      // 其他方法
      formatTime,
      handleUserAction,
      handlePasswordChangeSuccess
    }
  }
}
</script>

<style scoped>
.header {
  height: 60px;
  background-color: #fff;
  border-bottom: 1px solid #e4e7ed;
  position: sticky;
  top: 0;
  z-index: 1000;
}

.header-content {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 10px;
}


.site-name {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.nav {
  display: flex;
  gap: 30px;
}

.nav-item {
  color: #606266;
  text-decoration: none;
  font-size: 14px;
  transition: color 0.3s;
}

.nav-item:hover,
.nav-item.router-link-active {
  color: #409eff;
}

.auth-nav {
  display: flex;
  gap: 20px;
  align-items: center;
}

.notification-icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 40px; /* 与用户信息容器高度一致 */
  padding: 0 12px;
  border-radius: 20px;
  background: #f5f7fa;
  transition: all 0.3s;
  cursor: pointer;
}

.notification-icon-wrapper:hover {
  background: #e6f3ff;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.15);
}

.bell-icon {
  font-size: 20px;
  color: #409eff;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.bell-icon:hover {
  color: #66b1ff;
  transform: scale(1.1);
}

.auth-button {
  padding: 8px 16px;
  border-radius: 6px;
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s;
  border: 1px solid transparent;
}

.login-btn {
  color: #409eff;
  border-color: #409eff;
}

.login-btn:hover {
  background-color: #409eff;
  color: white;
}

.register-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.register-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 12px;
  border-radius: 20px;
  background: #f5f7fa;
  cursor: pointer;
  transition: all 0.3s;
}

.user-info:hover {
  background: #e6f3ff;
}

.user-avatar {
  flex-shrink: 0;
}

.user-text {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  line-height: 1.2;
}

.username {
  font-size: 12px;
  font-weight: 400;
  color: #909399;
  max-width: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.real-name {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
  max-width: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dropdown-icon {
  font-size: 12px;
  color: #909399;
  transition: transform 0.3s;
}

.user-info:hover .dropdown-icon {
  transform: rotate(180deg);
}

@media (max-width: 768px) {
  .header-content {
    padding: 0 15px;
  }
  
  .nav {
    gap: 20px;
  }
  
  .auth-nav {
    gap: 8px;
  }
  
  .auth-button {
    padding: 6px 12px;
    font-size: 13px;
  }
  
  .site-name {
    font-size: 16px;
  }
}

/* 工单通知相关样式 */
.order-notifications-content {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.notification-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 0 0 15px 0;
  border-bottom: 1px solid #ebeef5;
}

.notifications-list {
  flex: 1;
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

.notification-item.unread {
  background: #fafafa;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}

.notification-header {
  display: flex;
  align-items: flex-start;
  margin-bottom: 15px;
}

.notification-icon {
  margin-right: 12px;
  padding-top: 2px;
}

.notification-content {
  flex: 1;
}

.notification-content h4 {
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
}

.notification-message {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #4b5563;
  line-height: 1.5;
}

.order-details {
  margin: 12px 0;
  padding: 12px;
  background: #f9fafb;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
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
  /* border-bottom: 2px solid #67c23a; */
}

.client-info-content {
  white-space: pre-wrap;
  line-height: 1.6;
  color: #374151;
  background: #ffffff;
  border-radius: 8px;
  padding: 10px;
  border-left: 3px solid #67c23a;
}

.notification-time {
  display: flex;
  align-items: center;
  color: #909399;
  font-size: 12px;
  margin-top: 8px;
}

.notification-time .el-icon {
  margin-right: 4px;
}

/* 员工状态通知样式 */
.status-details {
  margin: 12px 0;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.status-change-text {
  display: flex;
  align-items: center;
}

.status-text {
  color: #409eff;
  font-weight: 600;
  font-size: 14px;
}

.notification-actions-item {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 12px;
}

.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
}

/* 通知列表动画样式 */
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

@media (max-width: 480px) {
  .header-content {
    flex-wrap: wrap;
    height: auto;
    min-height: 60px;
    padding: 10px 15px;
  }
  
  .logo {
    order: 1;
    flex: 1;
  }
  
  .auth-nav {
    order: 2;
  }
  
  .nav {
    order: 3;
    width: 100%;
    justify-content: center;
    margin-top: 10px;
    gap: 15px;
  }
  
  .site-name {
    font-size: 14px;
  }
  
  .user-text {
    display: none;
  }
  
  .user-info {
    padding: 4px 8px;
  }
}
</style>