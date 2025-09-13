
<template>
  <div class="employee-personal-status">
    <!-- 基本信息 -->
    <div class="info-section">
      <div class="section-header">
        <h3>基本信息</h3>
        <span v-if="userRole === 'customer-service'" class="readonly-tip">客服只读模式</span>
      </div>
      <div class="basic-info">
        <div class="info-grid">
          <div class="info-item" v-if="employee?.username">
            <label>用户名:</label>
            <span>{{ employee.username }}</span>
          </div>
          <div class="info-item" v-if="employee?.realName">
            <label>真实姓名:</label>
            <span>{{ employee.realName }}</span>
          </div>
          <div class="info-item gender-item">
            <label>性别:</label>
            <div class="gender-control">
              <!-- 显示模式 -->
              <span v-if="!isEditingGender" class="gender-display" @click="startEditGender">
                {{ getGenderText(personalInfo.gender) || (userRole === 'customer-service' ? '未设置' : '点击设置') }}
                <el-icon v-if="userRole !== 'customer-service'" class="edit-icon"><EditPen /></el-icon>
              </span>
              <!-- 编辑模式 -->
              <div v-else class="gender-edit">
                <el-select
                  v-model="editingGenderValue"
                  placeholder="选择性别"
                  size="small"
                  style="width: 100px; margin-right: 8px;"
                  @change="saveGender"
                  @blur="cancelEditGender"
                  filterable
                  allow-create
                  default-first-option
                >
                  <el-option label="男" value="MALE" />
                  <el-option label="女" value="FEMALE" />
                </el-select>
                <el-button size="small" @click="cancelEditGender">取消</el-button>
              </div>
            </div>
          </div>
        </div>
        <div v-if="!employee?.username && !employee?.realName && !personalInfo.gender" class="empty-state-small">
          <span class="empty-text">暂无基本信息</span>
        </div>
      </div>
    </div>

    
    <!-- 擅长游戏 -->
    <div class="game-skills-section">
      <div class="section-header">
        <h3>擅长游戏</h3>
        <el-button 
          v-if="userRole !== 'customer-service'"
          type="primary" 
          size="small" 
          @click="showCreateDialog = true"
        >
          添加技能
        </el-button>
        <span v-else class="readonly-tip">客服只读模式</span>
      </div>
      

      <!-- 技能列表 -->
      <div class="skills-grid">
        <div v-for="skill in gameSkills" :key="skill.id" class="skill-card">
          <div class="skill-header">
            <h4>{{ skill.gameName }}</h4>
            <div v-if="userRole !== 'customer-service'" class="skill-actions">
              <el-button size="small" @click="editSkill(skill)">编辑</el-button>
              <el-button size="small" type="danger" @click="deleteSkill(skill)">删除</el-button>
            </div>
            <div v-else class="skill-readonly">
              <el-tag size="small" type="info">只读</el-tag>
            </div>
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
        
        <div v-if="gameSkills.length === 0" class="empty-state">
          <el-empty description="暂无游戏技能" />
        </div>
      </div>
    </div>

    <!-- 创建/编辑技能对话框 -->
    <el-dialog
      v-model="showCreateDialog"
      :title="editingSkill ? '编辑技能' : '添加技能'"
      width="500px"
    >
      <el-form
        ref="skillFormRef"
        :model="skillForm"
        :rules="skillRules"
        label-width="120px"
      >
        <el-form-item label="游戏名称" prop="gameName">
          <el-input v-model="skillForm.gameName" placeholder="请输入游戏名称" />
        </el-form-item>
        <el-form-item label="陪玩类型" prop="playStyle">
          <el-select v-model="skillForm.playStyle" placeholder="请选择陪玩类型">
            <el-option label="技术型" value="TECHNICAL" />
            <el-option label="娱乐型" value="ENTERTAINMENT" />
          </el-select>
        </el-form-item>
        <el-form-item label="服务类型" prop="serviceType">
          <el-select v-model="skillForm.serviceType" placeholder="请选择服务类型">
            <el-option label="排位赛" value="RANKED" />
            <el-option label="娱乐赛" value="CASUAL" />
          </el-select>
        </el-form-item>
        <el-form-item label="最高段位" prop="highestRank">
          <el-input v-model="skillForm.highestRank" placeholder="请输入最高段位" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showCreateDialog = false">取消</el-button>
          <el-button type="primary" @click="saveSkill">确认</el-button>
        </span>
      </template>
    </el-dialog>

  </div>
</template>

<script>
import { ref, reactive, computed, onMounted, watch, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search, EditPen } from '@element-plus/icons-vue'
import { getProfile, updateProfile } from '../api/employee'
import { getMyGameSkills, createGameSkill, updateGameSkill, deleteGameSkill } from '../api/gameSkills'

export default {
  name: 'EmployeePersonalStatus',
  components: {
    Plus,
    Search,
    EditPen
  },
  props: {
    employee: {
      type: Object,
      default: null
    },
    userRole: {
      type: String,
      default: 'user'
    },
    gameSkillsData: {
      type: Array,
      default: null
    }
  },
  emits: ['refresh'],
  setup(props, { emit }) {
    // 响应式数据
    const isSaving = ref(false)
    const isSavingBasicInfo = ref(false)
    
    // 个人信息数据
    const personalInfo = reactive({
      id: 0,
      userId: 0,
      gender: '',
      workStatus: '',
      createdAt: '',
      updatedAt: '',
      deleted: 0
    })
    
    // 性别内联编辑相关
    const isEditingGender = ref(false)
    const editingGenderValue = ref('')
    
    // 游戏技能相关数据
    const gameSkills = ref([])
    const showCreateDialog = ref(false)
    const editingSkill = ref(null)
    const skillFormRef = ref(null)
    
    const skillForm = reactive({
      gameName: '',
      playStyle: '',
      serviceType: '',
      highestRank: ''
    })
    
    const skillRules = {
      gameName: [
        { required: true, message: '请输入游戏名称', trigger: 'blur' }
      ],
      playStyle: [
        { required: true, message: '请选择陪玩类型', trigger: 'change' }
      ],
      serviceType: [
        { required: true, message: '请选择服务类型', trigger: 'change' }
      ]
    }

    // 加载个人资料
    const loadProfile = async () => {
      try {
        const response = await getProfile()
        if (response && (response.code === 0 || response.code === 200) && response.data) {
          const profile = response.data
          // 更新完整的个人资料信息
          // 优先使用profile中的userId，其次使用employee的各种userId字段
          const userId = profile.userId || 
                        props.employee?.csEmployeeUserId || 
                        props.employee?.employeeUserId || 
                        props.employee?.userId || 
                        props.employee?.id || 0
          
          Object.assign(personalInfo, {
            id: profile.id || 0,
            userId: userId,
            gender: profile.gender || '',
            workStatus: profile.workStatus || '',
            createdAt: profile.createdAt || '',
            updatedAt: profile.updatedAt || '',
            deleted: profile.deleted || 0
          })
          
          console.log('加载的个人资料:', personalInfo)
        }
      } catch (error) {
        console.error('加载个人资料失败:', error)
        // 不显示错误消息，避免影响页面体验
      }
    }
    
    // 加载游戏技能
    const loadGameSkills = async () => {
      try {
        const response = await getMyGameSkills()
        gameSkills.value = response.data || []
      } catch (error) {
        console.error('加载游戏技能失败:', error)
        // 不显示错误，避免影响页面体验
      }
    }
    
        
    // 获取性别显示文本
    const getGenderText = (gender) => {
      return gender === 'MALE' ? '男' : gender === 'FEMALE' ? '女' : '未设置'
    }
    
    // 性别内联编辑方法
    const startEditGender = () => {
      if (props.userRole === 'customer-service') return
      
      editingGenderValue.value = personalInfo.gender || ''
      isEditingGender.value = true
      
      // 下一个tick后聚焦到select
      nextTick(() => {
        const selectElement = document.querySelector('.gender-edit .el-select__wrapper')
        if (selectElement) {
          selectElement.click()
        }
      })
    }
    
    const cancelEditGender = () => {
      isEditingGender.value = false
      editingGenderValue.value = ''
    }
    
    const saveGender = async () => {
      if (!editingGenderValue.value) {
        cancelEditGender()
        return
      }
      
      try {
        isSavingBasicInfo.value = true
        
        // 根据接口文档构建完整的 EmployeeProfile 对象
        // 优先使用已加载的personalInfo中的userId，其次使用employee的各种userId字段
        const userId = personalInfo.userId || 
                      props.employee?.csEmployeeUserId || 
                      props.employee?.employeeUserId || 
                      props.employee?.userId || 
                      props.employee?.id
        
        console.log('更新员工资料 - userId:', userId, 'employee对象:', props.employee)
        
        const updateData = {
          id: personalInfo.id || 0, // 员工资料ID，如果没有则为0（新建）
          userId: userId, // 用户ID - 使用正确的userId字段
          gender: editingGenderValue.value, // 更新的性别
          workStatus: personalInfo.workStatus, // 保持原有工作状态
          createdAt: personalInfo.createdAt || '', // 保持原有创建时间
          updatedAt: personalInfo.updatedAt || '', // 保持原有更新时间
          deleted: personalInfo.deleted || 0 // 保持原有删除标记
        }
        
        console.log('发送更新请求的数据:', updateData)
        
        await updateProfile(updateData)
        
        // 更新本地数据
        personalInfo.gender = editingGenderValue.value
        
        ElMessage.success('性别更新成功')
        isEditingGender.value = false
        
        // 通知父组件刷新
        emit('refresh')
      } catch (error) {
        console.error('更新性别失败:', error)
        ElMessage.error(error.message || '更新性别失败')
      } finally {
        isSavingBasicInfo.value = false
        editingGenderValue.value = ''
      }
    }
    
    // 编辑技能
    const editSkill = (skill) => {
      editingSkill.value = skill
      Object.assign(skillForm, {
        gameName: skill.gameName,
        playStyle: skill.playStyle,
        serviceType: skill.serviceType,
        highestRank: skill.highestRank || ''
      })
      showCreateDialog.value = true
    }
    
    // 删除技能
    const deleteSkill = async (skill) => {
      try {
        await ElMessageBox.confirm('确定要删除这个技能吗？', '确认删除', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
        
        await deleteGameSkill(skill.id)
        ElMessage.success('删除成功')
        await loadGameSkills()
      } catch (error) {
        if (error !== 'cancel') {
          ElMessage.error('删除失败')
          console.error('删除技能失败:', error)
        }
      }
    }
    
    // 保存技能
    const saveSkill = async () => {
      if (!skillFormRef.value) return
      
      await skillFormRef.value.validate(async (valid) => {
        if (valid) {
          try {
            const skillData = { ...skillForm }
            if (editingSkill.value) {
              await updateGameSkill(editingSkill.value.id, skillData)
            } else {
              await createGameSkill(skillData)
            }
            
            ElMessage.success(editingSkill.value ? '更新成功' : '添加成功')
            showCreateDialog.value = false
            resetSkillForm()
            await loadGameSkills()
          } catch (error) {
            ElMessage.error(editingSkill.value ? '更新失败' : '添加失败')
            console.error('保存技能失败:', error)
          }
        }
      })
    }
    
    // 重置技能表单
    const resetSkillForm = () => {
      editingSkill.value = null
      Object.assign(skillForm, {
        gameName: '',
        playStyle: '',
        serviceType: '',
        highestRank: ''
      })
      if (skillFormRef.value) {
        skillFormRef.value.resetFields()
      }
    }
    
    // 获取陪玩类型标签
    const getPlayStyleLabel = (style) => {
      const map = {
        'TECHNICAL': '技术型',
        'ENTERTAINMENT': '娱乐型'
      }
      return map[style] || style
    }
    
    // 获取服务类型标签
    const getServiceTypeLabel = (type) => {
      const map = {
        'RANKED': '排位赛',
        'CASUAL': '娱乐赛'
      }
      return map[type] || type
    }
    
    // 格式化日期
    const formatDate = (dateStr) => {
      if (!dateStr) return ''
      return new Date(dateStr).toLocaleString()
    }
    
    // 初始化数据
    const initData = () => {
      if (props.employee) {
        // 从props中初始化基本用户信息
        // 优先使用employee的各种userId字段
        const userId = props.employee.csEmployeeUserId || 
                      props.employee.employeeUserId || 
                      props.employee.userId || 
                      props.employee.id || 0
        
        personalInfo.userId = userId
        personalInfo.gender = props.employee.gender || ''
        personalInfo.workStatus = props.employee.workStatus || ''
        
        console.log('初始化员工数据 - userId:', userId, 'employee对象:', props.employee)
      }
      
      // 始终尝试从API加载完整的员工资料
      loadProfile()
      
      // 加载游戏技能 - 如果有传入数据则使用，否则从API加载
      if (props.gameSkillsData && Array.isArray(props.gameSkillsData)) {
        gameSkills.value = props.gameSkillsData
      } else {
        loadGameSkills()
      }
    }
    
    // 监听props变化
    watch(() => props.employee, (newEmployee) => {
      if (newEmployee) {
        // 优先使用employee的各种userId字段
        const userId = newEmployee.csEmployeeUserId || 
                      newEmployee.employeeUserId || 
                      newEmployee.userId || 
                      newEmployee.id || 0
        
        personalInfo.userId = userId
        personalInfo.gender = newEmployee.gender || ''
        personalInfo.workStatus = newEmployee.workStatus || ''
        
        console.log('监听到employee变化 - userId:', userId, 'newEmployee:', newEmployee)
      }
    }, { deep: true })
    
    watch(() => props.gameSkillsData, (newGameSkillsData) => {
      if (newGameSkillsData && Array.isArray(newGameSkillsData)) {
        gameSkills.value = newGameSkillsData
      }
    }, { deep: true })
    
    // 生命周期
    onMounted(() => {
      initData()
    })
    
    return {
      // 响应式数据
      personalInfo,
      gameSkills,
      showCreateDialog,
      editingSkill,
      skillForm,
      skillFormRef,
      skillRules,
      isEditingGender,
      editingGenderValue,
      isSavingBasicInfo,
      
      // 方法
      getGenderText,
      editSkill,
      deleteSkill,
      saveSkill,
      resetSkillForm,
      startEditGender,
      cancelEditGender,
      saveGender,
      getPlayStyleLabel,
      getServiceTypeLabel,
      formatDate
    }
  }
}
</script>

<style scoped>
.employee-personal-status {
  padding: 12px;
}

.info-section,
.games-section {
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 12px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
}

.section-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.info-tip {
  font-size: 12px;
  color: #909399;
  font-style: italic;
}

.readonly-tip {
  font-size: 12px;
  color: #909399;
  font-style: italic;
}

.skill-readonly {
  display: flex;
  align-items: center;
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
  min-width: 60px;
}


/* 工作状态颜色样式 */
.status-select-idle :deep(.el-input__wrapper) {
  background-color: #f0f9ff;
  border-color: #67c23a;
}

.status-select-idle :deep(.el-input__inner) {
  color: #67c23a;
  font-weight: 500;
}

.status-select-working :deep(.el-input__wrapper) {
  background-color: #fef0e6;
  border-color: #e6a23c;
}

.status-select-working :deep(.el-input__inner) {
  color: #e6a23c;
  font-weight: 500;
}

.status-select-resting :deep(.el-input__wrapper) {
  background-color: #f5f7fa;
  border-color: #909399;
}

.status-select-resting :deep(.el-input__inner) {
  color: #909399;
  font-weight: 500;
}

.status-select-offline :deep(.el-input__wrapper) {
  background-color: #fef0f0;
  border-color: #f56c6c;
}

.status-select-offline :deep(.el-input__inner) {
  color: #f56c6c;
  font-weight: 500;
}

/* 删除文字样式 */
.delete-text {
  color: #f56c6c;
  font-size: 12px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: all 0.3s ease;
  user-select: none;
}

.delete-text:hover {
  background-color: #fef0f0;
  color: #f56c6c;
}

.delete-text.disabled {
  color: #c0c4cc;
  cursor: not-allowed;
}

.delete-text.disabled:hover {
  background-color: transparent;
  color: #c0c4cc;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .games-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .employee-personal-status {
    padding: 10px;
  }
  
  .basic-info {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  }

/* 擅长游戏样式 */
.game-skills-section {
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 12px;
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
  transition: all 0.3s ease;
}

.skill-card:hover {
  border-color: #409eff;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.1);
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

.skill-actions {
  display: flex;
  gap: 4px;
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
  grid-column: 1 / -1;
  text-align: center;
  padding: 40px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .skills-grid {
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  }
}

@media (max-width: 768px) {
  .employee-personal-status {
    padding: 10px;
  }
  
  .basic-info {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
    
  
  .skills-grid {
    grid-template-columns: 1fr;
  }
  
  .skill-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
}

.empty-state-small {
  text-align: center;
  padding: 20px;
  color: #909399;
  font-size: 14px;
  background: #fafafa;
  border-radius: 8px;
  border: 1px dashed #dcdfe6;
}

.empty-text {
  color: #909399;
}

/* 基本信息网格布局 */
.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px 40px;
  align-items: center;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.info-item label {
  font-weight: 500;
  color: #606266;
  white-space: nowrap;
  min-width: 70px;
}

.info-item span {
  color: #303133;
}

.gender-item {
  min-width: 150px;
}

.gender-control {
  display: inline-flex;
  align-items: center;
}

.gender-display {
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  min-width: 60px;
  color: #606266;
}

.gender-display:hover {
  background-color: #f5f7fa;
  color: #409eff;
}

.gender-display .edit-icon {
  font-size: 12px;
  opacity: 0.6;
  transition: opacity 0.3s ease;
}

.gender-display:hover .edit-icon {
  opacity: 1;
}

.gender-edit {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 响应式布局 */
@media (max-width: 768px) {
  .info-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .info-item {
    justify-content: space-between;
  }
  
  .info-item label {
    min-width: 80px;
  }
  
  .gender-edit {
    flex-wrap: wrap;
  }
}
</style>


