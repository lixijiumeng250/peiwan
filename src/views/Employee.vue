<template>
  <div class="employee-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <div class="employee-info" v-if="currentUser">
          <el-avatar
            :src="currentUser.avatar"
            :size="60"
            class="employee-avatar"
          >
            {{ currentUser.name?.charAt(0) }}
          </el-avatar>
          <div class="info-text">
            <h2 class="employee-name">{{ currentUser.name }}</h2>
            <div class="employee-meta">
              <el-tag
                :type="getStatusTagType(employeeStatus)"
                size="small"
              >
                {{ getStatusText(employeeStatus) }}
              </el-tag>
              <span class="role-info">员工</span>
            </div>
          </div>
        </div>
        <div class="header-actions">
          <el-button
            :icon="Refresh"
            @click="refreshData"
            :loading="isRefreshing"
          >
            刷新
          </el-button>
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
            :employee-id="currentUser?.id"
            :employee="currentUser"
            @refresh="refreshWorkRecords"
          />
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Refresh } from '@element-plus/icons-vue'
import authStore from '../store/auth'
import EmployeePersonalStatus from '../components/EmployeePersonalStatus.vue'
import EmployeeWorkRecords from '../components/EmployeeWorkRecords.vue'

export default {
  name: 'Employee',
  components: {
    Refresh,
    EmployeePersonalStatus,
    EmployeeWorkRecords
  },
  setup() {
    // 响应式数据
    const activeTab = ref('status')
    const isRefreshing = ref(false)
    const employeeStatus = ref('idle')
    
    // 计算属性
    const currentUser = computed(() => authStore.getters.currentUser.value)
    
    // 方法
    const getStatusTagType = (status) => {
      const statusMap = {
        'working': 'success',
        'idle': 'info',
        'resting': 'warning',
        'offline': 'danger'
      }
      return statusMap[status] || 'info'
    }
    
    const getStatusText = (status) => {
      const statusMap = {
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
    
    const refreshData = async () => {
      isRefreshing.value = true
      try {
        await Promise.all([
          refreshEmployeeStatus(),
          refreshWorkRecords()
        ])
        ElMessage.success('数据刷新成功')
      } catch (error) {
        ElMessage.error('刷新失败')
      } finally {
        isRefreshing.value = false
      }
    }
    
    const refreshEmployeeStatus = async () => {
      // 刷新个人状态数据
      // 这里可以调用API获取最新的员工状态
    }
    
    const refreshWorkRecords = async () => {
      // 刷新工作记录数据
      // 这里可以调用API获取最新的工作记录
    }
    
    // 生命周期
    onMounted(() => {
      // 初始化数据
      refreshData()
    })
    
    return {
      // 响应式数据
      activeTab,
      isRefreshing,
      employeeStatus,
      
      // 计算属性
      currentUser,
      
      // 方法
      getStatusTagType,
      getStatusText,
      handleTabChange,
      refreshData,
      refreshEmployeeStatus,
      refreshWorkRecords
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
  padding: 20px;
  margin-bottom: 20px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1200px;
  margin: 0 auto;
}

.employee-info {
  display: flex;
  align-items: center;
  gap: 16px;
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
}

.role-info {
  color: #909399;
  font-size: 14px;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.content-area {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

.employee-tabs {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.employee-tabs :deep(.el-tabs__header) {
  margin-bottom: 20px;
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
    padding: 16px;
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
    justify-content: flex-end;
  }
  
  .content-area {
    padding: 0 16px;
  }
  
  .employee-tabs {
    padding: 16px;
  }
}
</style>
