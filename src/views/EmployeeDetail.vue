<template>
  <div class="employee-detail">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <el-button
          :icon="ArrowLeft"
          @click="goBack"
          class="back-btn"
        >
          返回
        </el-button>
        <div class="employee-info" v-if="currentEmployee">
          <el-avatar
            :src="currentEmployee.avatar"
            :size="60"
            class="employee-avatar"
          >
            {{ currentEmployee.name?.charAt(0) }}
          </el-avatar>
          <div class="info-text">
            <h2 class="employee-name">{{ currentEmployee.name }}</h2>
            <div class="employee-meta">
              <el-tag
                :type="getStatusTagType(currentEmployee.status)"
                size="small"
              >
                {{ getStatusText(currentEmployee.status) }}
              </el-tag>
              <span class="game-info">{{ currentEmployee.game }}</span>
            </div>
          </div>
        </div>
      </div>
      <div class="header-actions">
        <el-button
          v-if="userRole === 'customer-service'"
          type="success"
          :icon="DocumentAdd"
          @click="showAssignOrderDialog"
          :disabled="!currentEmployee || currentEmployee.status === 'offline'"
        >
          发派工单
        </el-button>
        <el-button
          :icon="Refresh"
          @click="refreshData"
          :loading="isRefreshing"
        >
          刷新
        </el-button>
      </div>
    </div>

    <!-- 主要内容区域 -->
    <div class="content-area">
      <el-tabs
        v-model="activeTab"
        type="card"
        class="detail-tabs"
        @tab-change="handleTabChange"
      >
        <!-- 个人状态标签页 -->
        <el-tab-pane label="个人状态" name="status">
          <EmployeeStatus
            :employee-id="employeeId"
            :employee="currentEmployee"
            :user-role="userRole"
            @refresh="refreshEmployeeStatus"
          />
        </el-tab-pane>

        <!-- 工作记录标签页 -->
        <el-tab-pane label="工作记录" name="records">
          <WorkRecords
            :employee-id="employeeId"
            :employee="currentEmployee"
            :user-role="userRole"
            @refresh="refreshWorkRecords"
            @assign-order="showAssignOrderDialog"
          />
        </el-tab-pane>
      </el-tabs>
    </div>

    <!-- 发派工单对话框 -->
    <el-dialog
      v-model="assignOrderVisible"
      title="发派工单"
      width="500px"
      :before-close="handleCloseAssignDialog"
    >
      <el-form
        ref="assignOrderForm"
        :model="assignOrderData"
        :rules="assignOrderRules"
        label-width="100px"
      >
        <el-form-item label="员工" prop="employeeName">
          <el-input v-model="assignOrderData.employeeName" disabled />
        </el-form-item>
        <el-form-item label="客户姓名" prop="customerName">
          <el-input
            v-model="assignOrderData.customerName"
            placeholder="请输入客户姓名"
          />
        </el-form-item>
        <el-form-item label="游戏类型" prop="game">
          <el-select
            v-model="assignOrderData.game"
            placeholder="请选择或输入游戏类型"
            filterable
            allow-create
            default-first-option
            style="width: 100%"
          >
            <el-option label="王者荣耀" value="王者荣耀" />
            <el-option label="和平精英" value="和平精英" />
            <el-option label="英雄联盟" value="英雄联盟" />
            <el-option label="三角洲" value="三角洲" />
            <el-option label="原神" value="原神" />
            <el-option label="崩坏：星穹铁道" value="崩坏：星穹铁道" />
            <el-option label="永劫无间" value="永劫无间" />
            <el-option label="CSGO" value="CSGO" />
            <el-option label="DOTA2" value="DOTA2" />
            <el-option label="穿越火线" value="穿越火线" />
            <el-option label="QQ飞车" value="QQ飞车" />
            <el-option label="炉石传说" value="炉石传说" />
          </el-select>
        </el-form-item>
        <el-form-item label="服务类型" prop="serviceType">
          <el-select
            v-model="assignOrderData.serviceType"
            placeholder="请选择或输入服务类型"
            filterable
            allow-create
            default-first-option
            style="width: 100%"
          >
            <el-option label="技术陪练" value="技术陪练" />
            <el-option label="娱乐陪玩" value="娱乐陪玩" />
            <el-option label="代练上分" value="代练上分" />
            <el-option label="语音陪聊" value="语音陪聊" />
            <el-option label="游戏教学" value="游戏教学" />
            <el-option label="竞技陪练" value="竞技陪练" />
            <el-option label="休闲娱乐" value="休闲娱乐" />
          </el-select>
        </el-form-item>
        <el-form-item label="游戏水平" prop="gameLevel">
          <el-input
            v-model="assignOrderData.gameLevel"
            placeholder="请输入游戏水平，如：王者50星"
          />
        </el-form-item>
        <el-form-item label="派单截图" prop="screenshot">
          <el-upload
            ref="uploadRef"
            :auto-upload="false"
            :show-file-list="false"
            accept="image/*"
            :on-change="handleScreenshotChange"
          >
            <el-button :icon="Upload">上传截图</el-button>
          </el-upload>
          <div v-if="assignOrderData.screenshotFile" class="upload-preview">
            <span>{{ assignOrderData.screenshotFile.name }}</span>
            <el-button
              type="danger"
              size="small"
              text
              @click="removeScreenshot"
            >
              删除
            </el-button>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="assignOrderVisible = false">取消</el-button>
        <el-button
          type="primary"
          @click="handleAssignOrder"
          :loading="submitting"
        >
          发派工单
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, computed, onMounted, reactive, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  ArrowLeft,
  DocumentAdd,
  Refresh,
  Upload
} from '@element-plus/icons-vue'
import customerServiceStore from '../store/customerService'
import authStore from '../store/auth'
import EmployeeStatus from '../components/EmployeeStatus.vue'
import WorkRecords from '../components/WorkRecords.vue'

export default {
  name: 'EmployeeDetail',
  components: {
    ArrowLeft,
    DocumentAdd,
    Refresh,
    Upload,
    EmployeeStatus,
    WorkRecords
  },
  setup() {
    const route = useRoute()
    const router = useRouter()
    
    // 响应式数据
    const activeTab = ref('status')
    const isRefreshing = ref(false)
    const assignOrderVisible = ref(false)
    const submitting = ref(false)
    const assignOrderForm = ref(null)
    const uploadRef = ref(null)
    
    // 员工ID
    const employeeId = computed(() => parseInt(route.params.id))
    
    // 发派工单表单数据
    const assignOrderData = reactive({
      employeeId: null,
      employeeName: '',
      customerName: '',
      game: '',
      serviceType: '',
      gameLevel: '',
      screenshotFile: null
    })
    
    // 表单验证规则
    const assignOrderRules = {
      customerName: [
        { required: true, message: '请输入客户姓名', trigger: 'blur' }
      ],
      game: [
        { required: true, message: '请选择游戏类型', trigger: 'change' }
      ],
      serviceType: [
        { required: true, message: '请选择服务类型', trigger: 'change' }
      ],
      gameLevel: [
        { required: true, message: '请输入游戏水平', trigger: 'blur' }
      ]
    }
    
    // 计算属性
    const currentEmployee = computed(() => customerServiceStore.getters.currentEmployee.value)
    const userRole = computed(() => authStore.getters.userRole.value)
    
    // 监听路由参数变化
    watch(() => route.params.id, (newId) => {
      if (newId) {
        loadEmployeeData()
      }
    })
    
    // 方法
    const getStatusTagType = (status) => {
      const statusMap = {
        'working': 'success',
        'idle': 'info',
        'offline': 'danger'
      }
      return statusMap[status] || 'info'
    }
    
    const getStatusText = (status) => {
      const statusMap = {
        'working': '工作中',
        'idle': '空闲中',
        'offline': '离线'
      }
      return statusMap[status] || '未知'
    }
    
    const goBack = () => {
      router.push({ name: 'CustomerService' })
    }
    
    const handleTabChange = (tabName) => {
      activeTab.value = tabName
    }
    
    const loadEmployeeData = async () => {
      // 如果store中没有当前员工信息，尝试从员工列表中获取
      if (!currentEmployee.value || currentEmployee.value.id !== employeeId.value) {
        // 如果员工列表为空，先加载员工列表
        const employees = customerServiceStore.getters.employeeList.value
        if (employees.length === 0) {
          await customerServiceStore.actions.fetchEmployees()
        }
        
        // 从员工列表中找到当前员工
        const employee = customerServiceStore.getters.employeeList.value
          .find(emp => emp.id === employeeId.value)
        
        if (employee) {
          customerServiceStore.actions.setCurrentEmployee(employee)
        } else {
          ElMessage.error('员工不存在')
          goBack()
          return
        }
      }
      
      // 加载员工状态详情
      await refreshEmployeeStatus()
    }
    
    const refreshData = async () => {
      isRefreshing.value = true
      try {
        await Promise.all([
          refreshEmployeeStatus(),
          activeTab.value === 'records' ? refreshWorkRecords() : Promise.resolve()
        ])
        ElMessage.success('数据刷新成功')
      } catch (error) {
        ElMessage.error('数据刷新失败')
      } finally {
        isRefreshing.value = false
      }
    }
    
    const refreshEmployeeStatus = async () => {
      if (!employeeId.value) return
      
      const result = await customerServiceStore.actions.fetchEmployeeStatus(employeeId.value)
      if (!result.success) {
        ElMessage.error(result.message)
      }
    }
    
    const refreshWorkRecords = async () => {
      if (!employeeId.value) return
      
      const result = await customerServiceStore.actions.fetchWorkRecords(employeeId.value)
      if (!result.success) {
        ElMessage.error(result.message)
      }
    }
    
    const showAssignOrderDialog = () => {
      if (!currentEmployee.value) return
      
      assignOrderData.employeeId = currentEmployee.value.id
      assignOrderData.employeeName = currentEmployee.value.name
      assignOrderData.customerName = ''
      assignOrderData.game = ''
      assignOrderData.serviceType = ''
      assignOrderData.gameLevel = ''
      assignOrderData.screenshotFile = null
      assignOrderVisible.value = true
    }
    
    const handleScreenshotChange = (file) => {
      // 验证文件类型
      const isImage = file.raw.type.startsWith('image/')
      if (!isImage) {
        ElMessage.error('只能上传图片文件!')
        return
      }
      
      // 验证文件大小 (5MB)
      const isLt5M = file.raw.size / 1024 / 1024 < 5
      if (!isLt5M) {
        ElMessage.error('图片大小不能超过 5MB!')
        return
      }
      
      assignOrderData.screenshotFile = file.raw
    }
    
    const removeScreenshot = () => {
      assignOrderData.screenshotFile = null
    }
    
    const handleAssignOrder = async () => {
      try {
        await assignOrderForm.value.validate()
        
        submitting.value = true
        
        const orderData = {
          employeeId: assignOrderData.employeeId,
          customerName: assignOrderData.customerName,
          game: assignOrderData.game,
          serviceType: assignOrderData.serviceType,
          gameLevel: assignOrderData.gameLevel,
          screenshot: assignOrderData.screenshotFile
        }
        
        const result = await customerServiceStore.actions.assignOrder(orderData)
        
        if (result.success) {
          ElMessage.success(result.message)
          assignOrderVisible.value = false
          // 如果当前在工作记录标签页，刷新工作记录
          if (activeTab.value === 'records') {
            await refreshWorkRecords()
          }
        } else {
          ElMessage.error(result.message)
        }
      } catch (error) {
        console.error('表单验证失败:', error)
      } finally {
        submitting.value = false
      }
    }
    
    const handleCloseAssignDialog = (done) => {
      if (submitting.value) {
        ElMessageBox.confirm('正在发派工单，确定要关闭吗？')
          .then(() => done())
          .catch(() => {})
      } else {
        done()
      }
    }
    
    // 生命周期
    onMounted(() => {
      loadEmployeeData()
    })
    
    return {
      // 响应式数据
      activeTab,
      isRefreshing,
      assignOrderVisible,
      submitting,
      assignOrderForm,
      uploadRef,
      employeeId,
      assignOrderData,
      assignOrderRules,
      
      // 计算属性
      currentEmployee,
      userRole,
      
      // 方法
      getStatusTagType,
      getStatusText,
      goBack,
      handleTabChange,
      refreshData,
      refreshEmployeeStatus,
      refreshWorkRecords,
      showAssignOrderDialog,
      handleScreenshotChange,
      removeScreenshot,
      handleAssignOrder,
      handleCloseAssignDialog
    }
  }
}
</script>

<style scoped>
.employee-detail {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 20px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 20px;
}

.back-btn {
  margin-right: 10px;
}

.employee-info {
  display: flex;
  align-items: center;
  gap: 16px;
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

.game-info {
  font-size: 14px;
  color: #909399;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.content-area {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.detail-tabs {
  min-height: 600px;
}

.detail-tabs :deep(.el-tabs__header) {
  margin: 0;
  background: #f5f7fa;
  padding: 0 20px;
}

.detail-tabs :deep(.el-tabs__content) {
  padding: 20px;
}

.upload-preview {
  margin-top: 8px;
  padding: 8px;
  background: #f5f7fa;
  border-radius: 4px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }
  
  .header-left {
    flex-direction: column;
    gap: 12px;
  }
  
  .employee-info {
    justify-content: center;
  }
  
  .header-actions {
    justify-content: center;
  }
  
  .employee-name {
    font-size: 20px;
  }
}
</style>
