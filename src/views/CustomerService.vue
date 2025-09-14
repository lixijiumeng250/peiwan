<template>
  <div class="customer-service">
    <div class="page-header">
      <h1>客服管理页面</h1>
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

    <!-- 主要内容区域 -->
    <div class="main-content">
      <el-tabs
        v-model="activeTab"
        type="card"
        class="main-tabs"
      >
        <!-- 员工列表标签页 -->
        <el-tab-pane label="员工列表" name="employees">
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
                  <el-option label="工作中" value="BUSY" />
                  <el-option label="空闲中" value="IDLE" />
                  <el-option label="休息中" value="RESTING" />
                  <el-option label="离线" value="OFF_DUTY" />
                </el-select>
              </div>
            </div>

      <!-- 员工卡片网格 -->
      <div class="employee-grid" v-loading="isLoading('employees') || isInitializing">
        <!-- 初始化加载状态 -->
        <template v-if="isInitializing">
          <div v-for="n in 6" :key="n" class="employee-card-skeleton">
            <el-skeleton animated>
              <template #template>
                <div class="skeleton-header">
                  <el-skeleton-item variant="circle" style="width: 50px; height: 50px;" />
                  <div class="skeleton-info">
                    <el-skeleton-item variant="text" style="width: 80px; margin-bottom: 8px;" />
                    <el-skeleton-item variant="text" style="width: 60px;" />
                  </div>
                </div>
                <div class="skeleton-body">
                  <el-skeleton-item variant="text" style="width: 100%; margin-bottom: 8px;" />
                </div>
                <div class="skeleton-footer">
                  <el-skeleton-item variant="button" style="width: 60px; height: 24px; margin-right: 8px;" />
                  <el-skeleton-item variant="button" style="width: 60px; height: 24px;" />
                </div>
              </template>
            </el-skeleton>
          </div>
        </template>
        
        <!-- 正常显示员工卡片 -->
        <template v-else>
          <div
            v-for="employee in filteredEmployees"
            :key="employee.id"
            class="employee-card"
            @click="viewEmployeeDetail(employee)"
          >
          <div class="card-header">
            <el-avatar
              :src="employee.avatar"
              :size="45"
              class="employee-avatar"
            >
              {{ (employee.employeeUsername || employee.username || employee.name || 'U').charAt(0).toUpperCase() }}
            </el-avatar>
            <div class="employee-info">
              <h4 class="employee-name">{{ employee.employeeUsername || employee.username || employee.name }}</h4>
              <div class="employee-meta">
                <span class="realname-info">姓名: {{ employee.employeeRealName || employee.realName || employee.name }}</span>
                <el-tag
                  :type="getStatusTagType(employee.workStatus)"
                  size="small"
                  class="status-tag"
                >
                  {{ getStatusText(employee.workStatus) }}
                </el-tag>
              </div>
            </div>
          </div>

          <div class="card-body">
            <div class="info-row">
              <span class="label">性别:</span>
              <span class="value">{{ getGenderText(employee.gender) }}</span>
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
              :disabled="employee.workStatus === 'OFF_DUTY'"
            >
              发派工单
            </el-button>
          </div>
        </div>
        </template>
      </div>

            <!-- 空状态 -->
            <el-empty
              v-if="!isLoading('employees') && !isInitializing && employees.length === 0"
              description="暂无员工数据"
            />
          </div>
        </el-tab-pane>

        <!-- 所有工单标签页 -->
        <el-tab-pane label="所有工单" name="orders">
          <div class="orders-section">
            <EmployeeWorkRecords
              :employee-id="null"
              :employee="null"
              @refresh="refreshOrders"
            />
          </div>
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
        <el-form-item label="客户姓名">
          <el-input
            v-model="assignOrderData.customerName"
            placeholder="请输入客户姓名（可选）"
          />
        </el-form-item>
        <el-form-item label="游戏类型">
          <el-select
            v-model="assignOrderData.game"
            placeholder="请选择或输入游戏类型（可选）"
            filterable
            allow-create
            default-first-option
            style="width: 100%"
            clearable
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
        <el-form-item label="陪玩类型">
          <el-select
            v-model="assignOrderData.playStyle"
            placeholder="请选择陪玩类型（可选）"
            style="width: 100%"
            clearable
          >
            <el-option label="技术型" value="TECHNICAL" />
            <el-option label="娱乐型" value="ENTERTAINMENT" />
          </el-select>
        </el-form-item>
        <el-form-item label="服务类型">
          <el-select
            v-model="assignOrderData.serviceType"
            placeholder="请选择服务类型（可选）"
            style="width: 100%"
            clearable
          >
            <el-option label="排位赛" value="RANKED" />
            <el-option label="娱乐赛" value="CASUAL" />
          </el-select>
        </el-form-item>
        <el-form-item label="游戏水平">
          <el-input
            v-model="assignOrderData.gameLevel"
            placeholder="请输入游戏水平，如：王者50星（可选）"
          />
        </el-form-item>
        <!-- 图片资料区域 -->
        <div class="screenshots-section">
          <h4 class="section-title">图片资料</h4>
          <div class="screenshot-grid">
            <!-- 派单图片 -->
            <div class="screenshot-container">
              <div class="screenshot-box">
                <div class="screenshot-title">派单图片</div>
                <div v-if="!assignOrderData.screenshotFile" class="screenshot-placeholder">
                  <el-upload
                    ref="uploadRef"
                    :auto-upload="false"
                    :limit="1"
                    accept="image/*"
                    :on-change="handleScreenshotChange"
                    :show-file-list="false"
                    class="screenshot-uploader"
                  >
                    <div 
                      class="upload-area enhanced-upload-area"
                      @dragover.prevent="handleDragOver"
                      @dragleave.prevent="handleDragLeave"
                      @drop.prevent="handleDrop"
                      @paste.prevent="handlePasteEvent"
                      @mouseenter="handleMouseEnter"
                      @mouseleave="handleMouseLeave"
                      :class="{ 'drag-over': isDragOver }"
                      ref="uploadArea"
                      tabindex="0"
                    >
                      <el-icon class="upload-icon"><Plus /></el-icon>
                      <div class="upload-text">
                        <p>点击上传派单图片</p>
                        <p class="upload-tip">支持：点击选择 | 拖拽上传 | 粘贴</p>
                        <p class="upload-tip">jpg/png文件，不超过2MB</p>
                      </div>
                    </div>
                  </el-upload>
                </div>
                <div v-else class="screenshot-uploaded">
                  <img 
                    :src="getPreviewUrl(assignOrderData.screenshotUrl)" 
                    alt="派单图片"
                    class="screenshot-image"
                    @click="previewScreenshot"
                  />
                  <div class="screenshot-actions">
                    <el-button 
                      type="primary" 
                      size="small" 
                      text
                      @click.stop="previewScreenshot"
                    >
                      预览
                    </el-button>
                    <el-button 
                      type="danger" 
                      size="small" 
                      text
                      @click.stop="removeScreenshot"
                    >
                      删除
                    </el-button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
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
import { ref, computed, onMounted, onUnmounted, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { handleApiError } from '../utils/errorHandler'
import {
  UserFilled,
  Clock,
  DocumentChecked,
  Refresh,
  Upload,
  Plus,
  View,
  Delete
} from '@element-plus/icons-vue'
import customerServiceStore from '../store/customerService'
import authStore from '../store/auth'
import * as csEmployeeMappingsAPI from '../api/csEmployeeMappings'
import * as customerServiceAPI from '../api/customerService'
import { showImagePreview, getPreviewUrl } from '../utils/imageViewer'
import { uploadImage, validateImageFile } from '../api/upload'
import { usePolling, POLLING_CONFIG } from '../utils/polling'
import EmployeeWorkRecords from '../components/EmployeeWorkRecords.vue'

// 包装上传函数以保持一致性
const uploadOrderInfoScreenshot = uploadImage

export default {
  name: 'CustomerService',
  components: {
    UserFilled,
    Clock,
    DocumentChecked,
    Refresh,
    Upload,
    Plus,
    EmployeeWorkRecords
  },
  setup() {
    const router = useRouter()
    
    // 轮询管理
    const { startPolling, stopPolling, startSmartPolling } = usePolling()
    
    // 响应式数据
    const activeTab = ref('employees')
    const statusFilter = ref('')
    const assignOrderVisible = ref(false)
    const submitting = ref(false)
    const assignOrderForm = ref(null)
    const uploadRef = ref(null)
    const uploadArea = ref(null)
    const isDragOver = ref(false)
    const isInitializing = ref(true)
    
    // 发派工单表单数据
    const assignOrderData = reactive({
      employeeId: null,
      employeeName: '',
      customerName: '',
      game: '',
      playStyle: '',
      serviceType: '',
      gameLevel: '',
      screenshotFile: null,
      screenshotUrl: null
    })
    
    // 表单验证规则
    const assignOrderRules = {
      // 当有截图时，其他字段变为可选
    }
    
    // 计算属性 - 直接使用 store 的 getter
    const employees = customerServiceStore.getters.employeeList
    const isLoading = customerServiceStore.getters.isLoading
    const onlineEmployeeCount = customerServiceStore.getters.onlineEmployeeCount
    const workingEmployeeCount = customerServiceStore.getters.workingEmployeeCount
    
    // 筛选后的员工列表
    const filteredEmployees = computed(() => {
      console.log('filteredEmployees computed 被调用，employees.value:', employees.value)
      const filtered = !statusFilter.value 
        ? employees.value 
        : employees.value.filter(emp => emp.workStatus === statusFilter.value)
      console.log('筛选后的员工列表:', filtered, '筛选条件:', statusFilter.value)
      return filtered
    })
    
    // 今日工单总数
    const todayOrderCount = computed(() => {
      return employees.value.reduce((total, emp) => total + (emp.todayOrders || 0), 0)
    })
    
    // 方法
    const getStatusTagType = (status) => {
      const statusMap = {
        'BUSY': 'warning',        // 工作中 - 黄色
        'IDLE': 'success',        // 空闲中 - 绿色  
        'RESTING': 'primary',     // 休息中 - 蓝色
        'OFF_DUTY': 'danger'      // 离岗 - 红色
      }
      return statusMap[status] || 'info'
    }
    
    const getStatusText = (status) => {
      const statusMap = {
        'BUSY': '工作中',
        'IDLE': '空闲中',
        'RESTING': '休息中',
        'OFF_DUTY': '离线'
      }
      return statusMap[status] || '未知'
    }
    
    const getGenderText = (gender) => {
      const genderMap = {
        'MALE': '男',
        'FEMALE': '女'
      }
      return genderMap[gender] || ''
    }

    const getSkillTagType = (playStyle) => {
      const typeMap = {
        'TECHNICAL': 'success',
        'ENTERTAINMENT': 'warning'
      }
      return typeMap[playStyle] || 'info'
    }

    const getPlayStyleLabel = (style) => {
      const map = {
        'TECHNICAL': '技术型',
        'ENTERTAINMENT': '娱乐型'
      }
      return map[style] || style
    }
    

    const handleStatusFilter = () => {
      // 状态筛选逻辑已通过计算属性实现
    }
    

    const initializeData = async () => {
      try {
        // 确保用户信息已加载
        const currentUser = authStore.getters.currentUser.value
        if (!currentUser) {
          // 检查是否正在登出或刚刚登出，避免无效的API调用
          const { isLogoutInProgress, lastLogoutTime } = authStore.state
          const timeSinceLogout = Date.now() - lastLogoutTime
          
          if (isLogoutInProgress || timeSinceLogout < 100) {
            console.log('🚪 正在登出或刚刚登出，跳过用户信息获取')
            return
          }
          
          await authStore.actions.fetchCurrentUser()
        }
        
        // 加载员工列表数据
        await refreshEmployeeList()
      } catch (error) {
        console.error('初始化数据失败:', error)
      } finally {
        isInitializing.value = false
      }
    }

    const refreshEmployeeList = async () => {
      console.log('开始刷新员工列表...')
      const result = await customerServiceStore.actions.fetchEmployees()
      console.log('刷新员工列表结果:', result)
      if (!result.success) {
        ElMessage.error(result.message)
      } else {
        console.log('员工列表刷新成功，员工数量:', result.data?.length || 0)
      }
    }
    
    const viewEmployeeDetail = (employee) => {
      // 设置当前员工到store中
      customerServiceStore.actions.setCurrentEmployee(employee)
      
      // 跳转到客服专用的员工详情页面
      router.push({
        name: 'CSEmployeeDetail',
        params: { id: employee.id }
      })
    }
    
    const showAssignOrderDialog = (employee) => {
      assignOrderData.employeeId = employee.id
      assignOrderData.employeeName = employee.name
      assignOrderData.customerName = ''
      assignOrderData.game = ''
      assignOrderData.playStyle = ''
      assignOrderData.serviceType = ''
      assignOrderData.gameLevel = ''
      assignOrderData.screenshotFile = null
      assignOrderVisible.value = true
    }
    
    const handleScreenshotChange = (file) => {
      const validation = validateImageFile(file.raw)
      if (!validation.valid) {
        ElMessage.error(validation.message)
        return
      }
      
      assignOrderData.screenshotFile = file.raw
      assignOrderData.screenshotUrl = URL.createObjectURL(file.raw)
    }
    
    const removeScreenshot = () => {
      if (assignOrderData.screenshotUrl) {
        URL.revokeObjectURL(assignOrderData.screenshotUrl)
      }
      assignOrderData.screenshotFile = null
      assignOrderData.screenshotUrl = null
    }
    
    const previewScreenshot = () => {
      if (assignOrderData.screenshotUrl) {
        showImagePreview(assignOrderData.screenshotUrl)
      }
    }

    // 拖拽处理
    const handleDragOver = (event) => {
      event.preventDefault()
      isDragOver.value = true
    }

    const handleDragLeave = (event) => {
      event.preventDefault()
      isDragOver.value = false
    }

    const handleDrop = (event) => {
      event.preventDefault()
      isDragOver.value = false
      
      const files = event.dataTransfer.files
      if (files.length === 0) return
      
      const file = files[0]
      if (!file.type.startsWith('image/')) {
        ElMessage.warning('只能上传图片文件')
        return
      }
      
      processImageFile(file)
    }

    // 粘贴处理
    const handlePasteEvent = (event) => {
      event.preventDefault()
      const clipboardData = event.clipboardData || window.clipboardData
      const items = clipboardData.items

      for (let i = 0; i < items.length; i++) {
        const item = items[i]
        if (item.type.indexOf('image') !== -1) {
          const file = item.getAsFile()
          processImageFile(file)
          break
        }
      }
    }

    // 处理图片文件
    const processImageFile = (file) => {
      const validation = validateImageFile(file)
      if (!validation.valid) {
        ElMessage.error(validation.message)
        return
      }
      
      // 清理之前的URL
      if (assignOrderData.screenshotUrl) {
        URL.revokeObjectURL(assignOrderData.screenshotUrl)
      }
      
      assignOrderData.screenshotFile = file
      assignOrderData.screenshotUrl = URL.createObjectURL(file)
    }

    // 鼠标进入上传区域时自动获取焦点
    const handleMouseEnter = () => {
      if (uploadArea.value) {
        uploadArea.value.focus()
      }
    }

    // 鼠标离开上传区域时移除焦点
    const handleMouseLeave = () => {
      if (uploadArea.value) {
        uploadArea.value.blur()
      }
    }
    
    const handleAssignOrder = async () => {
      try {
        // 检查是否至少有截图或者填写了一些信息
        const hasScreenshot = !!assignOrderData.screenshotFile
        const hasAnyInfo = !!(assignOrderData.customerName || assignOrderData.game || assignOrderData.playStyle || assignOrderData.serviceType || assignOrderData.gameLevel)
        
        if (!hasScreenshot && !hasAnyInfo) {
          ElMessage.warning('请至少上传截图或填写一些工单信息')
          return
        }
        
        submitting.value = true
        
        // 先上传截图（如果有）
        let screenshotUrl = null
        if (assignOrderData.screenshotFile) {
          const uploadResult = await uploadOrderInfoScreenshot(assignOrderData.screenshotFile)
          screenshotUrl = uploadResult.data
        }
        
        const orderData = {
          employeeId: assignOrderData.employeeId,
          customerName: assignOrderData.customerName || '未填写',
          game: assignOrderData.game || '未指定',
          playStyle: assignOrderData.playStyle || 'ENTERTAINMENT',
          serviceType: assignOrderData.serviceType || 'CASUAL',
          gameLevel: assignOrderData.gameLevel || '未指定',
          screenshot: screenshotUrl
        }
        
        const result = await customerServiceStore.actions.assignOrder(orderData)
        
        if (result.success) {
          ElMessage.success(result.message)
          assignOrderVisible.value = false
          // 刷新员工列表以更新工单数量
          await refreshEmployeeList()
          // 刷新工单列表以显示最新工单
          await refreshOrders()
        } else {
          ElMessage.error(result.message)
        }
      } catch (error) {
        console.error('发派工单失败:', error)
        const shouldShowError = handleApiError(error, { component: 'CustomerService', action: 'assignOrder' })
        if (shouldShowError) {
          ElMessage.error('发派工单失败：' + error.message)
        }
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
    
    const refreshOrders = async () => {
      const result = await customerServiceStore.actions.fetchDispatchedOrders()
      if (!result.success) {
        ElMessage.error(result.message)
      }
    }
    
    // 开始轮询员工列表
    const startPollingEmployees = () => {
      const interval = POLLING_CONFIG.CS_EMPLOYEES * 1000
      
      // 使用智能轮询，只有数据变化时才更新UI
      startSmartPolling(
        'cs-employees',
        // 数据获取函数 - 只获取员工状态信息，不获取工单数据
        async () => {
          console.log('轮询获取员工状态数据...')
          
          // 直接使用 /api/cs/employees 接口获取员工状态
          const response = await customerServiceAPI.getEmployees()
          
          if (response.code === 200 && Array.isArray(response.data)) {
            console.log('轮询获取到的员工状态数据:', response.data)
            return response.data
          } else {
            console.warn('员工状态接口返回异常:', response)
            return []
          }
        },
        // 数据变化时的回调 - 只有在检测到变化时才更新store
        (newData, oldData, changes) => {
          console.log('检测到员工状态数据变化，更新UI')
          if (changes && changes.length > 0) {
            console.log('员工状态变化详情:', changes)
            // 只在有实际变化时显示通知，避免过多提示
            if (changes.length <= 3) {
              ElMessage.info(`员工状态已更新`)
            }
          }
          
          // 直接调用store方法更新员工状态数据
          if (Array.isArray(newData)) {
            console.log('轮询获取到的新状态数据:', newData)
            customerServiceStore.actions.updateEmployeeStatusFromPolling(newData)
          }
        },
        interval
      )
      
      console.log(`开始智能轮询员工状态，间隔: ${POLLING_CONFIG.CS_EMPLOYEES}秒`)
    }
    
    // 停止轮询员工列表
    const stopPollingEmployees = () => {
      stopPolling('cs-employees')
      console.log('停止轮询员工列表')
    }
    
    
    // 生命周期
    onMounted(() => {
      initializeData()
      
      // 延迟开始轮询，避免与初始加载冲突
      setTimeout(() => {
        startPollingEmployees()
      }, 5000) // 延迟5秒，确保初始化完成
    })
    
    onUnmounted(() => {
      stopPollingEmployees()
    })
    
    return {
      // 响应式数据
      activeTab,
      statusFilter,
      assignOrderVisible,
      submitting,
      assignOrderForm,
      uploadRef,
      uploadArea,
      isDragOver,
      isInitializing,
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
      getGenderText,
      getSkillTagType,
      getPlayStyleLabel,
      handleStatusFilter,
      initializeData,
      refreshEmployeeList,
      viewEmployeeDetail,
      showAssignOrderDialog,
      handleScreenshotChange,
      removeScreenshot,
      previewScreenshot,
      getPreviewUrl,
      handleDragOver,
      handleDragLeave,
      handleDrop,
      handlePasteEvent,
      processImageFile,
      handleMouseEnter,
      handleMouseLeave,
      handleAssignOrder,
      handleCloseAssignDialog,
      refreshOrders,
      startPollingEmployees,
      stopPollingEmployees
    }
  }
}
</script>

<style scoped>
.customer-service {
  padding: 12px;
  width: 100%;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding: 12px;
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

.main-content {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.main-tabs {
  min-height: 600px;
}

.main-tabs :deep(.el-tabs__header) {
  margin: 0;
  background: #f5f7fa;
  padding: 0 12px;
}

.main-tabs :deep(.el-tabs__content) {
  padding: 12px;
}

.employee-section {
  padding: 0;
}

.orders-section {
  padding: 0;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid #f0f0f0;
}

.section-header h3 {
  margin: 0;
  color: #303133;
  font-size: 18px;
}

.filter-controls {
  display: flex;
  align-items: center;
}

.employee-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 12px;
  min-height: 200px;
}

.employee-card {
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 16px 16px 0 16px;
  background: #fff;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
}

.employee-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

/* 骨架屏样式 */
.employee-card-skeleton {
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 16px;
  background: #fff;
  min-height: 120px;
}

.skeleton-header {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}

.skeleton-info {
  margin-left: 12px;
  flex: 1;
}

.skeleton-body {
  margin-bottom: 12px;
}

.skeleton-footer {
  display: flex;
  justify-content: flex-end;
}

.card-header {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
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

.realname-info {
  color: #606266;
  font-size: 13px;
  background: #f5f7fa;
  padding: 2px 8px;
  border-radius: 4px;
}

.status-tag {
  font-size: 12px;
}

.nickname {
  font-size: 12px;
  color: #909399;
}

.card-body {
  margin-bottom: 12px;
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
  margin-top: auto;
  padding: 12px 16px;
  margin: 12px -16px 0 -16px;
  border-top: 1px solid #f0f0f0;
}

/* 图片资料区域样式 */
.screenshots-section {
  margin-bottom: 20px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.section-title {
  margin: 0 0 12px 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  border-bottom: 2px solid #409eff;
  padding-bottom: 6px;
}

.screenshot-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.screenshot-container {
  display: flex;
  flex-direction: column;
}

.screenshot-box {
  border: 1px solid #dee2e6;
  border-radius: 6px;
  padding: 12px;
  text-align: center;
  background: #fff;
  flex: 1;
}

.screenshot-title {
  font-weight: 600;
  margin-bottom: 10px;
  color: #495057;
  font-size: 14px;
}

.screenshot-placeholder {
  width: 100%;
  min-height: 150px;
}

.placeholder-icon {
  font-size: 24px;
  color: #c0c4cc;
}

.screenshot-image {
  width: 100%;
  height: 150px;
  object-fit: cover;
  border-radius: 6px;
  cursor: pointer;
  transition: transform 0.2s;
}

.screenshot-image:hover {
  transform: scale(1.02);
}

.screenshot-uploaded {
  position: relative;
  width: 100%;
  text-align: center;
}

.screenshot-actions {
  position: absolute;
  top: 8px;
  right: 8px;
  background: rgba(0, 0, 0, 0.6);
  border-radius: 4px;
  padding: 4px;
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.3s;
}

.screenshot-uploaded:hover .screenshot-actions {
  opacity: 1;
}

/* 上传区域样式 */
.screenshot-uploader {
  width: 100%;
}

.upload-area {
  width: 100%;
  min-height: 150px;
  border: 2px dashed #ced4da;
  border-radius: 6px;
  background: #f8f9fa;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #6c757d;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  outline: none;
}

.upload-area:hover {
  border-color: #409eff;
  background: #fafbfc;
}


.upload-icon {
  font-size: 48px;
  color: #c0c4cc;
  margin-bottom: 16px;
  transition: all 0.3s ease;
}

.upload-text {
  text-align: center;
}

.upload-text p {
  margin: 4px 0;
  color: #606266;
}

.upload-text p:first-child {
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 8px;
}


.upload-preview {
  position: relative;
  width: 100%;
  text-align: center;
}

.preview-image {
  width: 100%;
  height: 200px;
  object-fit: cover;
  display: block;
}

.preview-actions {
  position: absolute;
  top: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.6);
  border-radius: 0 0 0 8px;
  padding: 8px;
  display: flex;
  gap: 4px;
}

/* 增强的上传区域样式 */
.enhanced-upload-area:focus {
  border-color: #409eff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
}

.enhanced-upload-area.drag-over {
  border-color: #409eff;
  background: linear-gradient(135deg, rgba(64, 158, 255, 0.1), rgba(64, 158, 255, 0.05));
  transform: scale(1.02);
}

.enhanced-upload-area.drag-over {
  color: #409eff;
}

.enhanced-upload-area.drag-over .upload-icon {
  color: #409eff;
  transform: scale(1.1);
}

/* 上传提示文本样式优化 */
.upload-tip {
  font-size: 12px;
  color: #909399;
  margin: 2px 0;
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
  
  .game-skills-grid {
    grid-template-columns: 1fr;
  }
}
</style>
