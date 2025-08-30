<template>
  <div class="customer-service">
    <div class="page-header">
      <h1>客服管理</h1>
      <div class="stats-bar">
        <el-statistic
          title="在线员工"
          :value="onlineEmployeeCount"
          suffix="人"
          class="stat-item"
        >
          <template #prefix>
            <el-icon><UserFilled /></el-icon>
          </template>
        </el-statistic>
        <el-statistic
          title="工作中"
          :value="workingEmployeeCount"
          suffix="人"
          class="stat-item"
        >
          <template #prefix>
            <el-icon><Clock /></el-icon>
          </template>
        </el-statistic>
        <el-statistic
          title="今日工单"
          :value="todayOrderCount"
          suffix="单"
          class="stat-item"
        >
          <template #prefix>
            <el-icon><DocumentChecked /></el-icon>
          </template>
        </el-statistic>
      </div>
    </div>

    <div class="employee-section">
      <div class="section-header">
        <h3>员工列表</h3>
        <div class="filter-controls">
          <el-select
            v-model="statusFilter"
            placeholder="筛选状态"
            clearable
            @change="handleStatusFilter"
            style="width: 120px; margin-right: 10px;"
          >
            <el-option label="全部" value="" />
            <el-option label="工作中" value="working" />
            <el-option label="空闲中" value="idle" />
            <el-option label="离线" value="offline" />
          </el-select>
          <el-button
            :icon="Refresh"
            @click="refreshEmployeeList"
            :loading="isLoading('employees')"
          >
            刷新
          </el-button>
        </div>
      </div>

      <!-- 员工卡片网格 -->
      <div class="employee-grid" v-loading="isLoading('employees')">
        <div
          v-for="employee in filteredEmployees"
          :key="employee.id"
          class="employee-card"
          @click="viewEmployeeDetail(employee)"
        >
          <div class="card-header">
            <el-avatar
              :src="employee.avatar"
              :size="50"
              class="employee-avatar"
            >
              {{ employee.name.charAt(0) }}
            </el-avatar>
            <div class="employee-info">
              <h4 class="employee-name">{{ employee.name }}</h4>
              <div class="employee-meta">
                <el-tag
                  :type="getStatusTagType(employee.status)"
                  size="small"
                  class="status-tag"
                >
                  {{ getStatusText(employee.status) }}
                </el-tag>
                <span class="game-info">{{ employee.game }}</span>
              </div>
            </div>
          </div>

          <div class="card-body">
            <div class="info-row">
              <span class="label">等级:</span>
              <span class="value">{{ employee.level }}</span>
            </div>

            <div class="info-row">
              <span class="label">今日工单:</span>
              <span class="value highlight">{{ employee.todayOrders }}</span>
              <span class="label">总工单:</span>
              <span class="value">{{ employee.totalOrders }}</span>
            </div>
            <div class="info-row">
              <span class="label">评分:</span>
              <el-rate
                v-model="employee.rating"
                disabled
                show-score
                text-color="#ff9900"
                score-template="{value}"
                size="small"
              />
            </div>
          </div>

          <div class="card-footer">
            <el-button
              type="primary"
              size="small"
              @click.stop="viewEmployeeDetail(employee)"
            >
              查看详情
            </el-button>
            <el-button
              type="success"
              size="small"
              @click.stop="showAssignOrderDialog(employee)"
              :disabled="employee.status === 'offline'"
            >
              发派工单
            </el-button>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <el-empty
        v-if="!isLoading('employees') && employees.length === 0"
        description="暂无员工数据"
      />
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
import { ref, computed, onMounted, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  UserFilled,
  Clock,
  DocumentChecked,
  Refresh,
  Upload
} from '@element-plus/icons-vue'
import customerServiceStore from '../store/customerService'

export default {
  name: 'CustomerService',
  components: {
    UserFilled,
    Clock,
    DocumentChecked,
    Refresh,
    Upload
  },
  setup() {
    const router = useRouter()
    
    // 响应式数据
    const statusFilter = ref('')
    const assignOrderVisible = ref(false)
    const submitting = ref(false)
    const assignOrderForm = ref(null)
    const uploadRef = ref(null)
    
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
    const employees = computed(() => customerServiceStore.getters.employeeList.value)
    const isLoading = computed(() => customerServiceStore.getters.isLoading.value)
    const onlineEmployeeCount = computed(() => customerServiceStore.getters.onlineEmployeeCount.value)
    const workingEmployeeCount = computed(() => customerServiceStore.getters.workingEmployeeCount.value)
    
    // 筛选后的员工列表
    const filteredEmployees = computed(() => {
      if (!statusFilter.value) return employees.value
      return employees.value.filter(emp => emp.status === statusFilter.value)
    })
    
    // 今日工单总数
    const todayOrderCount = computed(() => {
      return employees.value.reduce((total, emp) => total + (emp.todayOrders || 0), 0)
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
    

    const handleStatusFilter = () => {
      // 状态筛选逻辑已通过计算属性实现
    }
    
    const refreshEmployeeList = async () => {
      const result = await customerServiceStore.actions.fetchEmployees()
      if (!result.success) {
        ElMessage.error(result.message)
      }
    }
    
    const viewEmployeeDetail = (employee) => {
      customerServiceStore.actions.setCurrentEmployee(employee)
      router.push({
        name: 'EmployeeDetail',
        params: { id: employee.id }
      })
    }
    
    const showAssignOrderDialog = (employee) => {
      assignOrderData.employeeId = employee.id
      assignOrderData.employeeName = employee.name
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
          // 刷新员工列表以更新工单数量
          await refreshEmployeeList()
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
      refreshEmployeeList()
    })
    
    return {
      // 响应式数据
      statusFilter,
      assignOrderVisible,
      submitting,
      assignOrderForm,
      uploadRef,
      assignOrderData,
      assignOrderRules,
      
      // 计算属性
      employees,
      filteredEmployees,
      isLoading,
      onlineEmployeeCount,
      workingEmployeeCount,
      todayOrderCount,
      
      // 方法
      getStatusTagType,
      getStatusText,

      handleStatusFilter,
      refreshEmployeeList,
      viewEmployeeDetail,
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
.customer-service {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding: 20px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.page-header h1 {
  margin: 0;
  color: #303133;
  font-size: 28px;
}

.stats-bar {
  display: flex;
  gap: 40px;
}

.stat-item {
  text-align: center;
}

.employee-section {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.section-header h3 {
  margin: 0;
  color: #303133;
  font-size: 20px;
}

.filter-controls {
  display: flex;
  align-items: center;
}

.employee-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
  min-height: 200px;
}

.employee-card {
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 16px;
  background: #fff;
  cursor: pointer;
  transition: all 0.3s ease;
}

.employee-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.card-header {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
}

.employee-avatar {
  margin-right: 12px;
}

.employee-info {
  flex: 1;
}

.employee-name {
  margin: 0 0 4px 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.employee-meta {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-tag {
  font-size: 12px;
}

.game-info {
  font-size: 12px;
  color: #909399;
}

.card-body {
  margin-bottom: 16px;
}

.info-row {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  font-size: 14px;
}

.info-row:last-child {
  margin-bottom: 0;
}

.label {
  color: #606266;
  margin-right: 8px;
  min-width: fit-content;
}

.value {
  color: #303133;
  margin-right: 16px;
}

.value.highlight {
  color: #409eff;
  font-weight: 600;
}


.card-footer {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
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
    gap: 20px;
    text-align: center;
  }
  
  .stats-bar {
    gap: 20px;
  }
  
  .employee-grid {
    grid-template-columns: 1fr;
  }
  
  .section-header {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }
  
  .filter-controls {
    justify-content: center;
  }
}
</style>
