<template>
  <div class="cs-employee-detail">
    <!-- 通知弹窗组件 -->
    <NotificationPopup />
    
    <!-- 员工状态通知弹窗（叠加支持） -->
    <EmployeeStatusNotificationPopup
      v-for="(stack, idx) in statusPopupStacks"
      :key="stack.id"
      v-model="stack.visible"
      :notifications="stack.notifications"
      :stack-index="idx"
      :style="{ '--stack-index': idx }"
      @mark-as-read="(ids) => handleStatusNotificationMarkAsRead(ids, stack.id)"
      @go-to-employee-list="() => handleGoToEmployeeList(stack.id)"
    />
    
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
        <div class="employee-info" v-if="employeeInfo">
          <el-avatar
            :src="employeeInfo.avatar"
            :size="60"
            class="employee-avatar"
          >
            {{ employeeInfo.realName?.charAt(0) || employeeInfo.username?.charAt(0)?.toUpperCase() }}
          </el-avatar>
          <div class="info-text">
            <h2 class="employee-name">{{ employeeInfo.username }}</h2>
            <div class="employee-meta">
              <span class="realname-info">姓名: {{ employeeInfo?.realName || '' }}</span>
              <el-tag
                :type="getStatusTagType(employeeInfo?.workStatus)"
                size="small"
              >
                {{ getStatusText(employeeInfo?.workStatus) }}
              </el-tag>
            </div>
          </div>
        </div>
      </div>
      <div class="header-actions">
        <!-- 管理员与客服均可见派单按钮 -->
        <el-button
          v-if="['CS','ADMIN'].includes(userRole?.toUpperCase())"
          type="success"
          :icon="DocumentAdd"
          @click="showAssignOrderDialog"
          :disabled="!employeeInfo || employeeInfo.workStatus === 'OFF_DUTY'"
        >
          发派工单
        </el-button>
      </div>
    </div>

    <!-- 主要内容区域 -->
    <div class="content-area">
      <el-tabs
        v-model="activeTab"
        type="card"
        class="detail-tabs"
      >
        <!-- 基本信息标签页 -->
        <el-tab-pane label="基本信息" name="info">
          <div class="basic-info-section">
            <!-- 基本信息 -->
            <el-card class="info-card">
              <template #header>
                <h3>基本信息</h3>
              </template>
              <div class="basic-info">
                <div class="info-item">
                  <label>用户名:</label>
                  <span>{{ employeeInfo?.username || '' }}</span>
                </div>
                <div class="info-item">
                  <label>真实姓名:</label>
                  <span>{{ employeeInfo?.realName || '' }}</span>
                </div>
                <div class="info-item">
                  <label>性别:</label>
                  <span>{{ getGenderText(employeeInfo?.gender) }}</span>
                </div>
              </div>
            </el-card>

            <!-- 游戏技能 -->
            <el-card class="skills-card">
              <template #header>
                <h3>擅长游戏</h3>
              </template>
              
              <div v-loading="skillsLoading">
                <!-- 技能列表 -->
                <div v-if="gameSkills.length > 0" class="skills-grid">
                  <div v-for="skill in gameSkills" :key="skill.id" class="skill-card">
                    <div class="skill-header">
                      <h4>{{ skill.gameName }}</h4>
                    </div>
                    <div class="skill-content">
                      <div class="skill-item">
                        <span class="label">陪玩类型:</span>
                        <span class="value">{{ getPlayStyleLabel(skill.playStyle) }}</span>
                      </div>
                      <div class="skill-item">
                        <span class="label">服务类型:</span>
                        <span class="value">{{ getServiceTypeLabel(skill.serviceType) }}</span>
                      </div>
                      <div class="skill-item" v-if="skill.highestRank">
                        <span class="label">最高段位:</span>
                        <span class="value">{{ skill.highestRank }}</span>
                      </div>
                      <div class="skill-item">
                        <span class="label">创建时间:</span>
                        <span class="value">{{ formatDate(skill.createdAt) }}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <!-- 空状态 -->
                <div v-else class="empty-state">
                  <el-empty description="该员工暂无游戏技能" />
                </div>
              </div>
            </el-card>
          </div>
        </el-tab-pane>

        <!-- 工作记录标签页 -->
        <el-tab-pane label="工作记录" name="records">
          <EmployeeWorkRecords
            :employee-id="employeeId"
            :employee="employeeInfo"
            @refresh="refreshWorkRecords"
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
        <el-form-item label="委托信息">
          <el-input
            type="textarea"
            v-model="assignOrderData.clientInfo"
            placeholder="请输入委托信息（可选）"
            :rows="3"
            maxlength="500"
            show-word-limit
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
                        <p class="upload-tip">支持jpg/png格式文件</p>
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
import { ref, computed, onMounted, onActivated, onUnmounted, onDeactivated, watch, reactive, nextTick, onBeforeUnmount } from 'vue'
import { useRoute, useRouter, onBeforeRouteLeave } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { handleApiError } from '../utils/errorHandler'
import { usePolling, POLLING_CONFIG } from '../utils/polling'
import {
  ArrowLeft,
  DocumentAdd,
  Refresh,
  Upload,
  Plus,
  View,
  Delete
} from '@element-plus/icons-vue'
import customerServiceStore from '../store/customerService'
import { showImagePreview, getPreviewUrl } from '../utils/imageViewer'
import { uploadImage, validateImageFile } from '../api/upload'
import { getEmployeeGameSkillsForCS, getProfileForUser } from '../api/employee'
import authStore from '../store/auth'
import EmployeeWorkRecords from '../components/EmployeeWorkRecords.vue'
import NotificationPopup from '../components/NotificationPopup.vue'
import EmployeeStatusNotificationPopup from '../components/EmployeeStatusNotificationPopup.vue'
import { useEmployeeStatusNotifications } from '../composables/useEmployeeStatusNotifications.js'
import { useUnreadCount } from '../composables/useUnreadCount.js'

export default {
  name: 'CSEmployeeDetail',
  components: {
    ArrowLeft,
    DocumentAdd,
    Refresh,
    Upload,
    Plus,
    EmployeeWorkRecords,
    NotificationPopup,
    EmployeeStatusNotificationPopup
  },
  setup() {
    const route = useRoute()
    const router = useRouter()
    // 用户角色（用于控制是否显示派单按钮）
    const userRole = computed(() => authStore.getters.userRole.value)
    
    // 轮询管理
    const { startPolling, stopPolling, startSmartPolling } = usePolling()
    
    // 使用员工状态通知组合式函数
    const {
      employeeStatusNotifications,
      unreadEmployeeStatusCount,
      fetchEmployeeStatusNotifications,
      markEmployeeStatusNotificationAsRead,
      markAllEmployeeStatusNotificationsAsRead,
      getEmployeeStatusNotificationData,
      getStatusText: getNotificationStatusText,
      getStatusColor,
      getStatusIcon,
      updateEmployeeStatusNotifications
    } = useEmployeeStatusNotifications()
    
    // 使用未读数量管理
    const {
      unreadCount,
      fetchUnreadCount,
      updateUnreadCount,
      decreaseUnreadCount
    } = useUnreadCount()
    
    // 员工状态通知弹窗叠加管理
    const statusPopupStacks = ref([])
    
    // 监听员工状态通知变化，创建弹窗
    watch(employeeStatusNotifications, (newNotifications, oldNotifications) => {
      if (!Array.isArray(newNotifications)) return
      
      // 如果是初始加载（oldNotifications为空或undefined）
      if (!Array.isArray(oldNotifications) || oldNotifications.length === 0) {
        const unreadNotifications = newNotifications.filter(n => !n.isRead)
        if (unreadNotifications.length > 0) {
          // console.log(`员工详情页初始加载发现 ${unreadNotifications.length} 条未读员工状态通知`)
          
          // 为初始未读通知创建弹窗栈条目
          statusPopupStacks.value.push({
            id: Date.now() + Math.random(),
            notifications: unreadNotifications,
            visible: true
          })
          // console.log(`显示初始员工状态通知弹窗，共 ${unreadNotifications.length} 条`)
        }
        return
      }
      
      // 找出新的未读通知（非初始加载）
      const oldIds = new Set(oldNotifications.map(n => n.id))
      const newUnreadNotifications = newNotifications.filter(n => 
        !n.isRead && !oldIds.has(n.id)
      )
      
      if (newUnreadNotifications.length > 0) {
        // console.log(`员工详情页发现 ${newUnreadNotifications.length} 条新的员工状态通知`)
        
        // 为每批未读通知创建一个叠加弹窗栈条目
        statusPopupStacks.value.push({
          id: Date.now() + Math.random(),
          notifications: newUnreadNotifications,
          visible: true
        })
        // console.log(`显示员工状态通知弹窗(叠加)，本批 ${newUnreadNotifications.length} 条`)
      }
    }, { deep: true, immediate: true })
    
    // 响应式数据
    const activeTab = ref('info')
    const isRefreshing = ref(false)
    const skillsLoading = ref(false)
    const assignOrderVisible = ref(false)
    const submitting = ref(false)
    const assignOrderForm = ref(null)
    const uploadRef = ref(null)
    const uploadArea = ref(null)
    const isDragOver = ref(false)
    
    // 员工信息
    const employeeInfo = ref(null)
    const gameSkills = ref([])
    
    // 员工ID
    const employeeId = computed(() => parseInt(route.params.id))
    
    // 发派工单表单数据
    const assignOrderData = reactive({
      employeeId: null,
      employeeName: '',
      customerName: '',
      clientInfo: '',
      game: '',
      playStyle: '',
      serviceType: '',
      gameLevel: '',
      screenshotFile: null,
      screenshotUrl: null
    })
    
    // 表单验证规则
    const assignOrderRules = {
      // 所有字段都为可选
    }
    
    // 方法
    const getStatusTagType = (status) => {
      const statusMap = {
        'BUSY': 'warning',        // 工作中 - 黄色 (与其他页面一致)
        'IDLE': 'success',        // 空闲中 - 绿色 (与其他页面一致)
        'RESTING': 'primary',     // 休息中 - 蓝色 (与其他页面一致)
        'OFF_DUTY': 'danger',     // 离岗 - 红色 (与其他页面一致)
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
        'OFF_DUTY': '离线',
        // 兼容小写格式
        'working': '工作中',
        'idle': '空闲中',
        'resting': '休息中',
        'offline': '离线'
      }
      return statusMap[status] || '未知'
    }

    const getGenderText = (gender) => {
      if (gender === 'male') return '男'
      if (gender === 'female') return '女'
      if (gender === 'MALE') return '男'
      if (gender === 'FEMALE') return '女'
      return ''
    }

    const getPlayStyleLabel = (style) => {
      const map = {
        'TECHNICAL': '技术型',
        'ENTERTAINMENT': '娱乐型'
      }
      return map[style] || style
    }
    
    const getServiceTypeLabel = (type) => {
      const map = {
        'RANKED': '排位赛',
        'CASUAL': '娱乐赛'
      }
      return map[type] || type
    }
    
    const formatDate = (dateStr) => {
      if (!dateStr) return ''
      return new Date(dateStr).toLocaleString()
    }
    
    const goBack = async () => {
      // 返回前确保停止轮询
      // console.log('goBack: 停止轮询')
      stopPollingEmployeeInfo()
      
      // 在返回前更新未读数量，确保返回页面时数据是最新的
      try {
        await fetchUnreadCount()
        // console.log('返回前已更新未读数量')
      } catch (error) {
        console.error('返回前更新未读数量失败:', error)
      }
      
      // 管理员从管理员页面进入时返回管理员页，其它角色返回客服页
      const role = userRole.value?.toUpperCase()
      if (role === 'ADMIN') {
        router.push({ name: 'Admin' })
      } else {
        router.push({ name: 'CustomerService' })
      }
    }
    
    // 加载员工基本信息
    const loadEmployeeInfo = async () => {
      try {
        // 检查用户角色，如果是管理员则使用不同的逻辑
        const role = userRole.value?.toUpperCase()
        
        // 首先尝试从store中获取员工信息
        const currentEmployee = customerServiceStore.getters.currentEmployee.value
        
        if (currentEmployee && currentEmployee.id === employeeId.value) {
          // 如果store中有当前员工信息，直接使用
          employeeInfo.value = {
            id: currentEmployee.id,
            userId: currentEmployee.csEmployeeUserId || currentEmployee.employeeUserId || currentEmployee.id, // 使用CS API返回的userId
            username: currentEmployee.username || currentEmployee.employeeUsername,
            realName: currentEmployee.realName || currentEmployee.employeeRealName || currentEmployee.name,
            gender: currentEmployee.gender,
            workStatus: currentEmployee.workStatus,
            game: currentEmployee.game,
            todayOrders: currentEmployee.todayOrders || 0,
            totalOrders: currentEmployee.totalOrders || 0,
            rating: currentEmployee.rating || 0,
            avatar: currentEmployee.avatar
          }
          // console.log('从store获取员工信息:', employeeInfo.value)
        } else if (role === 'ADMIN') {
          // 管理员角色：直接使用路由参数中的employeeId作为userId来设置X-User-ID
          // console.log('管理员模式：使用employeeId作为userId:', employeeId.value)
          
          // 首先尝试从store中获取员工基本信息
          if (currentEmployee && currentEmployee.id === employeeId.value) {
            employeeInfo.value = {
              id: currentEmployee.id,
              userId: employeeId.value, // 管理员模式下，直接使用employeeId作为userId用于X-User-ID
              username: currentEmployee.username || currentEmployee.employeeUsername,
              realName: currentEmployee.realName || currentEmployee.employeeRealName || currentEmployee.name,
              gender: currentEmployee.gender || 'MALE',
              workStatus: currentEmployee.workStatus || 'OFF_DUTY',
              game: currentEmployee.game || '未设置',
              todayOrders: currentEmployee.todayOrders || 0,
              totalOrders: currentEmployee.totalOrders || 0,
              rating: currentEmployee.rating || 0,
              avatar: currentEmployee.avatar || ''
            }
            // console.log('管理员模式：从store获取员工信息，设置userId为employeeId:', employeeInfo.value)
          } else {
            // 如果store中没有信息，创建基本结构
            employeeInfo.value = {
              id: employeeId.value,
              userId: employeeId.value, // 管理员模式下，直接使用employeeId作为userId用于X-User-ID
              username: '',
              realName: '',
              gender: 'MALE',
              workStatus: 'OFF_DUTY',
              game: '未设置',
              todayOrders: 0,
              totalOrders: 0,
              rating: 0,
              avatar: ''
            }
            // console.log('管理员模式：创建基本员工信息结构，设置userId为employeeId:', employeeInfo.value)
          }
        } else {
          // 客服角色：使用原有逻辑调用客服API
          const result = await customerServiceStore.actions.fetchEmployees()
          
          if (result.success) {
            // 从刷新后的员工列表中找到当前员工
            const employees = customerServiceStore.getters.employeeList.value
            const employee = employees.find(emp => emp.id === employeeId.value)
            
            if (employee) {
              employeeInfo.value = {
                id: employee.id,
                userId: employee.csEmployeeUserId || employee.employeeUserId || employee.id, // 使用CS API返回的userId
                username: employee.username || employee.employeeUsername,
                realName: employee.realName || employee.employeeRealName || employee.name,
                gender: employee.gender,
                workStatus: employee.workStatus,
                game: employee.game,
                todayOrders: employee.todayOrders || 0,
                totalOrders: employee.totalOrders || 0,
                rating: employee.rating || 0,
                avatar: employee.avatar
              }
              // console.log('客服模式：从员工列表获取员工信息:', employeeInfo.value)
            } else {
              ElMessage.error('员工不存在')
              goBack()
              return
            }
          } else {
            ElMessage.error('获取员工信息失败')
            goBack()
            return
          }
        }
      } catch (error) {
        console.error('加载员工信息失败:', error)
        const shouldShowError = handleApiError(error, { component: 'CSEmployeeDetail', action: 'loadEmployeeInfo' })
        if (shouldShowError) {
          ElMessage.error('加载员工信息失败')
        }
      }
    }
    
    // 加载游戏技能 - 使用客服专用接口获取员工游戏技能
    const loadGameSkills = async () => {
      try {
        skillsLoading.value = true
        
        if (!employeeInfo.value?.userId) {
          // console.log('员工userId不存在，无法获取游戏技能')
          gameSkills.value = []
          return
        }
        
        // 使用客服专用接口，设置X-User-Id为员工的userId（来自/api/cs/employees接口）
        // console.log('准备获取游戏技能，员工userId:', employeeInfo.value.userId)
        const response = await getEmployeeGameSkillsForCS(employeeInfo.value.userId)
        
        if (response.code === 200 && response.data) {
          gameSkills.value = response.data
          // console.log('成功获取员工游戏技能:', response.data)
        } else {
          gameSkills.value = []
          // console.log('获取游戏技能响应为空或失败:', response)
        }
      } catch (error) {
        console.error('加载游戏技能失败:', error)
        gameSkills.value = []
        // 不显示错误消息，因为游戏技能可能为空是正常的
      } finally {
        skillsLoading.value = false
      }
    }

    // 加载员工个人资料（通过 X-User-Id 指定员工）并合并到基本信息
    const loadEmployeeProfile = async () => {
      try {
        if (!employeeInfo.value?.userId) {
          // console.log('员工userId不存在，无法获取个人资料')
          return null
        }
        const resp = await getProfileForUser(employeeInfo.value.userId)
        if (resp && resp.code === 200 && resp.data) {
          const profile = resp.data
          // 合并性别、工作状态与 profileId
          employeeInfo.value = {
            ...employeeInfo.value,
            gender: profile.gender || employeeInfo.value.gender,
            workStatus: profile.workStatus || employeeInfo.value.workStatus,
            profileId: profile.id
          }
          return profile
        }
      } catch (error) {
        console.error('加载员工个人资料失败:', error)
      }
      return null
    }
    
    const refreshData = async () => {
      isRefreshing.value = true
      try {
        // 先加载员工信息，再加载游戏技能
        await loadEmployeeInfo()
        await loadGameSkills()
        ElMessage.success('数据刷新成功')
      } catch (error) {
        ElMessage.error('数据刷新失败')
      } finally {
        isRefreshing.value = false
      }
    }
    
    const refreshWorkRecords = async () => {
      if (!employeeId.value) return
      
      // 检查用户角色，管理员不调用客服API
      const role = userRole.value?.toUpperCase()
      if (role === 'ADMIN') {
        // console.log('管理员角色，跳过工作记录刷新')
        return
      }
      
      const result = await customerServiceStore.actions.fetchWorkRecords(employeeId.value)
      if (!result.success) {
        ElMessage.error(result.message)
      }
    }
    
    const showAssignOrderDialog = () => {
      if (!employeeInfo.value) return
      
      assignOrderData.employeeId = employeeInfo.value.id
      assignOrderData.employeeName = employeeInfo.value.realName || employeeInfo.value.username
      assignOrderData.customerName = ''
      assignOrderData.clientInfo = ''
      assignOrderData.game = ''
      assignOrderData.playStyle = ''
      assignOrderData.serviceType = ''
      assignOrderData.gameLevel = ''
      assignOrderData.screenshotFile = null
      assignOrderData.screenshotUrl = null
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
        const hasAnyInfo = !!(assignOrderData.customerName || assignOrderData.clientInfo || assignOrderData.game || assignOrderData.playStyle || assignOrderData.serviceType || assignOrderData.gameLevel)
        
        if (!hasScreenshot && !hasAnyInfo) {
          ElMessage.warning('请至少上传截图或填写一些工单信息')
          return
        }
        
        submitting.value = true
        
        // 先上传截图（如果有）
        let screenshotUrl = null
        if (assignOrderData.screenshotFile) {
          const uploadResult = await uploadImage(assignOrderData.screenshotFile)
          screenshotUrl = uploadResult.data
        }
        
        const orderData = {
          employeeId: assignOrderData.employeeId,
          customerName: assignOrderData.customerName || '未填写',
          clientInfo: assignOrderData.clientInfo || '未填写',
          game: assignOrderData.game || '未指定',
          playStyle: assignOrderData.playStyle || '未指定',
          serviceType: assignOrderData.serviceType || '未指定',
          gameLevel: assignOrderData.gameLevel || '未指定',
          screenshot: screenshotUrl
        }
        
        const result = await customerServiceStore.actions.assignOrder(orderData)
        
        if (result.success) {
          ElMessage.success(result.message)
          assignOrderVisible.value = false
          // 刷新工作记录
          if (activeTab.value === 'records') {
            await refreshWorkRecords()
          }
          // 刷新员工信息
          await loadEmployeeInfo()
        } else {
          ElMessage.error(result.message)
        }
      } catch (error) {
        console.error('发派工单失败:', error)
        const shouldShowError = handleApiError(error, { component: 'CSEmployeeDetail', action: 'assignOrder' })
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
    
    // 开始轮询员工信息（基于个人资料 /employee/profile）
    const startPollingEmployeeInfo = () => {
      const pollingKey = `employee-detail-${employeeId.value}`
      const interval = POLLING_CONFIG.CS_EMPLOYEES * 1000
      
      // 数据获取函数
      const dataFetcher = async () => {
        // console.log('轮询获取员工个人资料...')
        try {
          const targetUserId = employeeInfo.value?.userId
          if (!targetUserId) return employeeInfo.value
          const resp = await getProfileForUser(targetUserId)
          if (resp && resp.code === 200 && resp.data) {
            return resp.data
          }
        } catch (error) {
          console.error('轮询获取个人资料失败:', error)
        }
        return employeeInfo.value
      }
      
      // 数据变化处理函数
      const onEmployeeInfoChange = (newData, oldData, changes) => {
        // console.log('检测到员工个人资料变化，更新UI')
        // 合并变更到显示信息
        const merged = {
          ...employeeInfo.value,
          gender: newData?.gender ?? employeeInfo.value?.gender,
          workStatus: newData?.workStatus ?? employeeInfo.value?.workStatus,
          profileId: newData?.id ?? employeeInfo.value?.profileId
        }
        // 判断关键字段是否变化
        const genderChanged = oldData && newData && oldData.gender !== newData.gender
        const statusChanged = oldData && newData && oldData.workStatus !== newData.workStatus
        employeeInfo.value = merged
        
        if (genderChanged || statusChanged) {
          ElMessage.info('员工资料已更新')
          // 关键资料变化后刷新游戏技能
          loadGameSkills()
        }
      }
      
      // 开始智能轮询
      startSmartPolling(pollingKey, dataFetcher, onEmployeeInfoChange, interval)
      
      // console.log(`开始轮询员工详情信息，间隔: ${POLLING_CONFIG.CS_EMPLOYEES}秒`)
    }
    
    // 停止轮询员工信息
    const stopPollingEmployeeInfo = () => {
      const pollingKey = `employee-detail-${employeeId.value}`
      // console.log(`正在停止轮询: ${pollingKey}`)
      stopPolling(pollingKey)
      // console.log(`轮询已停止: ${pollingKey}`)
      
      // 额外保险：检查并清除所有可能的轮询键
      const possibleKeys = [
        `employee-detail-${employeeId.value}`,
        `employee-detail-${route.params.id}`,
        'employee-detail'
      ]
      
      possibleKeys.forEach(key => {
        if (key && key !== pollingKey) {
          // console.log(`检查并停止可能的轮询键: ${key}`)
          stopPolling(key)
        }
      })
    }
    
    
    // 监听路由参数变化
    watch(() => route.params.id, async (newId, oldId) => {
      // console.log(`员工详情页面ID变化: ${oldId} -> ${newId}`)
      if (newId !== oldId && newId) {
        // 停止旧的轮询
        stopPollingEmployeeInfo()
        
        await nextTick()
        setTimeout(async () => {
          await loadEmployeeInfo()
          await loadEmployeeProfile()
          await loadGameSkills()
          // 启动新的轮询
          startPollingEmployeeInfo()
        }, 100)
      }
    }, { immediate: false })

    // 生命周期
    onMounted(async () => {
      // console.log('CSEmployeeDetail onMounted, employeeId:', employeeId.value)
      await nextTick()
      setTimeout(async () => {
        await loadEmployeeInfo()
        await loadEmployeeProfile()
        await loadGameSkills()
        
        // 获取未读通知数量
        try {
          await fetchUnreadCount()
          // console.log('员工详情页面已获取未读数量')
        } catch (error) {
          console.error('获取未读数量失败:', error)
        }
        
        // 延迟启动轮询，避免与初始加载冲突
        setTimeout(() => {
          startPollingEmployeeInfo()
        }, 3000) // 延迟3秒开始轮询
      }, 50)
    })

    // 组件激活时刷新数据（用于keep-alive场景）
    onActivated(async () => {
      // console.log('CSEmployeeDetail onActivated, employeeId:', employeeId.value)
      await nextTick()
      await loadEmployeeInfo()
      await loadEmployeeProfile()
      await loadGameSkills()
      
      // 获取未读通知数量
      try {
        await fetchUnreadCount()
        // console.log('员工详情页面激活时已获取未读数量')
      } catch (error) {
        console.error('员工详情页面激活时获取未读数量失败:', error)
      }
      
      // 重新启动轮询
      startPollingEmployeeInfo()
    })
    
    // 组件卸载时停止轮询
    onUnmounted(() => {
      // console.log('CSEmployeeDetail onUnmounted, 停止轮询')
      stopPollingEmployeeInfo()
    })
    
    // 组件停用（离开路由但未销毁）时停止轮询，避免返回总览时继续请求
    onDeactivated(() => {
      // console.log('CSEmployeeDetail onDeactivated, 停止轮询')
      stopPollingEmployeeInfo()
    })
    
    // 路由离开前停止轮询（确保在任何路由切换时都停止）
    onBeforeRouteLeave((to, from, next) => {
      // console.log('CSEmployeeDetail beforeRouteLeave, 停止轮询')
      stopPollingEmployeeInfo()
      next()
    })
    
    // 组件销毁前停止轮询（额外保险）
    onBeforeUnmount(() => {
      // console.log('CSEmployeeDetail onBeforeUnmount, 停止轮询')
      stopPollingEmployeeInfo()
    })
    
    // 员工状态通知弹窗事件处理
    const handleStatusNotificationMarkAsRead = async (notificationIds, stackId = null) => {
      try {
        // 批量标记为已读
        const promises = notificationIds.map(id => 
          markEmployeeStatusNotificationAsRead(id)
        )
        await Promise.all(promises)
        
        // 从叠加栈中移除该弹窗
        if (stackId) {
          statusPopupStacks.value = statusPopupStacks.value.filter(p => p.id !== stackId)
        }
        
        // 重新获取未读数量以确保数据同步
        try {
          await fetchUnreadCount()
          // console.log('标记已读后已更新未读数量')
        } catch (error) {
          console.error('更新未读数量失败:', error)
        }
        
        // console.log(`已处理 ${notificationIds.length} 条员工状态通知`)
      } catch (error) {
        console.error('处理员工状态通知失败:', error)
        ElMessage.error('标记已读失败')
      }
    }

    const handleGoToEmployeeList = async (stackId = null) => {
      // 从叠加栈中移除该弹窗
      if (stackId) {
        statusPopupStacks.value = statusPopupStacks.value.filter(p => p.id !== stackId)
      }
      
      // 在跳转前更新未读数量，确保返回客服页面时数据是最新的
      try {
        await fetchUnreadCount()
        // console.log('返回客服页面前已更新未读数量')
      } catch (error) {
        console.error('返回客服页面前更新未读数量失败:', error)
      }
      
      // 跳转到客服页面
      router.push('/customer-service')
    }
    
    return {
      // 响应式数据
      activeTab,
      isRefreshing,
      skillsLoading,
      assignOrderVisible,
      submitting,
      assignOrderForm,
      uploadRef,
      uploadArea,
      isDragOver,
      employeeId,
      employeeInfo,
      gameSkills,
      assignOrderData,
      assignOrderRules,
      
      // 方法
      getStatusTagType,
      getStatusText,
      getGenderText,
      getPlayStyleLabel,
      getServiceTypeLabel,
      formatDate,
      goBack,
      refreshData,
      refreshWorkRecords,
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
      startPollingEmployeeInfo,
      stopPollingEmployeeInfo,
      userRole,
      
      // 员工状态通知相关
      statusPopupStacks,
      employeeStatusNotifications,
      unreadEmployeeStatusCount,
      handleStatusNotificationMarkAsRead,
      handleGoToEmployeeList,
      
      // 未读数量相关
      unreadCount,
      fetchUnreadCount,
      updateUnreadCount
    }
  }
}
</script>

<style scoped>
.cs-employee-detail {
  padding: 12px;
  width: 100%;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding: 12px;
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
  padding: 12px;
}

/* 基本信息样式 */
.basic-info-section {
  width: 100%;
}

.info-card {
  margin-bottom: 20px;
  width: 100%;
}

.skills-card {
  margin-bottom: 20px;
  width: 100%;
}

.basic-info {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.info-item label {
  font-weight: 500;
  color: #606266;
  min-width: 70px;
}

.highlight {
  color: #409eff;
  font-weight: 600;
}


.skills-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.skill-card {
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 16px;
  background: #fafafa;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.skill-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e4e7ed;
}

.skill-header h4 {
  margin: 0;
  color: #303133;
  font-size: 16px;
  font-weight: 600;
}

.skill-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.skill-item {
  display: flex;
  align-items: center;
  font-size: 14px;
}

.skill-item .label {
  font-weight: 500;
  color: #606266;
  margin-right: 8px;
  min-width: 70px;
}

.skill-item .value {
  color: #303133;
}

.empty-state {
  text-align: center;
  padding: 40px;
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
  
  .basic-info {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .skills-grid {
    grid-template-columns: 1fr;
  }
}
</style>
