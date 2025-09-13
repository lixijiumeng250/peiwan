<template>
  <div class="game-skills-container">
    <div class="section-header">
      <h3>我的游戏技能</h3>
      <div class="header-actions">
        <el-button type="primary" @click="showCreateDialog = true">
          <el-icon><Plus /></el-icon>
          添加技能
        </el-button>
        <el-button type="success" @click="showBatchCreateDialog = true">
          <el-icon><Upload /></el-icon>
          批量添加
        </el-button>
      </div>
    </div>

    <!-- 搜索栏 -->
    <div class="search-section">
      <el-input
        v-model="searchGameName"
        placeholder="输入游戏名称搜索技能"
        clearable
        @keyup.enter="searchSkills"
        @clear="loadMySkills"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
      <el-button type="primary" @click="searchSkills">搜索</el-button>
      <el-button @click="loadMySkills">重置</el-button>
    </div>

    <!-- 技能列表 -->
    <div class="skills-grid" v-loading="loading">
      <div v-for="skill in gameSkills" :key="skill.id" class="skill-card">
        <div class="skill-header">
          <h4>{{ skill.gameName }}</h4>
          <div class="skill-actions">
            <el-button size="small" @click="editSkill(skill)">编辑</el-button>
            <el-button size="small" type="danger" @click="deleteSkill(skill)">删除</el-button>
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
      
      <div v-if="gameSkills.length === 0 && !loading" class="empty-state">
        <el-empty description="暂无游戏技能" />
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

    <!-- 批量创建对话框 -->
    <el-dialog
      v-model="showBatchCreateDialog"
      title="批量添加技能"
      width="600px"
    >
      <div class="batch-create-content">
        <div class="batch-form" v-for="(skill, index) in batchSkills" :key="index">
          <el-row :gutter="20">
            <el-col :span="8">
              <el-input v-model="skill.gameName" placeholder="游戏名称" />
            </el-col>
            <el-col :span="6">
              <el-select v-model="skill.playStyle" placeholder="陪玩类型">
                <el-option label="技术型" value="TECHNICAL" />
                <el-option label="娱乐型" value="ENTERTAINMENT" />
              </el-select>
            </el-col>
            <el-col :span="6">
              <el-select v-model="skill.serviceType" placeholder="服务类型">
                <el-option label="排位赛" value="RANKED" />
                <el-option label="娱乐赛" value="CASUAL" />
              </el-select>
            </el-col>
            <el-col :span="4">
              <el-button type="danger" @click="removeBatchSkill(index)" :disabled="batchSkills.length === 1">
                <el-icon><Delete /></el-icon>
              </el-button>
            </el-col>
          </el-row>
          <el-row :gutter="20" style="margin-top: 10px;">
            <el-col :span="24">
              <el-input v-model="skill.highestRank" placeholder="最高段位（可选）" />
            </el-col>
          </el-row>
          <el-divider v-if="index < batchSkills.length - 1" />
        </div>
        <el-button type="primary" @click="addBatchSkill" style="width: 100%; margin-top: 10px;">
          <el-icon><Plus /></el-icon>
          添加一行
        </el-button>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showBatchCreateDialog = false">取消</el-button>
          <el-button type="primary" @click="saveBatchSkills">确认</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive, onMounted, defineEmits } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  getMyGameSkills, 
  createGameSkill, 
  batchCreateGameSkills,
  searchGameSkillsByGameName,
  getGameSkillById
} from '@/api/gameSkills'

export default {
  name: 'EmployeeGameSkills',
  props: {
    employeeId: {
      type: Number,
      required: true
    }
  },
  emits: ['refresh'],
  setup(props, { emit }) {
    const loading = ref(false)
    const gameSkills = ref([])
    const searchGameName = ref('')
    const showCreateDialog = ref(false)
    const showBatchCreateDialog = ref(false)
    const editingSkill = ref(null)
    const skillFormRef = ref(null)

    const skillForm = reactive({
      gameName: '',
      playStyle: '',
      serviceType: '',
      highestRank: ''
    })

    const batchSkills = ref([
      {
        gameName: '',
        playStyle: '',
        serviceType: '',
        highestRank: ''
      }
    ])

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

    // 加载我的技能
    const loadMySkills = async () => {
      loading.value = true
      try {
        const response = await getMyGameSkills()
        gameSkills.value = response.data || []
      } catch (error) {
        let errorMessage = '加载技能列表失败'
        
        // 根据错误类型提供更具体的错误信息
        if (error.message?.includes('无法获取员工资料ID')) {
          errorMessage = '无法获取员工信息，请确保已正确登录'
        } else if (error.response?.status === 404) {
          errorMessage = 'API接口不存在，请联系管理员'
        } else if (error.response?.status === 401) {
          errorMessage = '登录已过期，请重新登录'
        } else if (error.response?.status === 403) {
          errorMessage = '权限不足，无法访问游戏技能'
        }
        
        ElMessage.error(errorMessage)
        console.error('加载技能列表失败:', error)
      } finally {
        loading.value = false
      }
    }

    // 搜索技能
    const searchSkills = async () => {
      if (!searchGameName.value.trim()) {
        loadMySkills()
        return
      }
      
      loading.value = true
      try {
        const response = await searchGameSkillsByGameName(searchGameName.value)
        gameSkills.value = response.data || []
      } catch (error) {
        ElMessage.error('搜索技能失败')
        console.error('搜索技能失败:', error)
      } finally {
        loading.value = false
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
        
        // TODO: 调用删除API
        ElMessage.success('删除成功')
        await loadMySkills()
      } catch (error) {
        if (error !== 'cancel') {
          ElMessage.error('删除失败')
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
              skillData.id = editingSkill.value.id
              // TODO: 调用更新API
            } else {
              await createGameSkill(skillData)
            }
            
            ElMessage.success(editingSkill.value ? '更新成功' : '添加成功')
            showCreateDialog.value = false
            resetForm()
            await loadMySkills()
          } catch (error) {
            ElMessage.error(editingSkill.value ? '更新失败' : '添加失败')
            console.error('保存技能失败:', error)
          }
        }
      })
    }

    // 重置表单
    const resetForm = () => {
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

    // 添加批量技能行
    const addBatchSkill = () => {
      batchSkills.value.push({
        gameName: '',
        playStyle: '',
        serviceType: '',
        highestRank: ''
      })
    }

    // 移除批量技能行
    const removeBatchSkill = (index) => {
      if (batchSkills.value.length > 1) {
        batchSkills.value.splice(index, 1)
      }
    }

    // 保存批量技能
    const saveBatchSkills = async () => {
      const validSkills = batchSkills.value.filter(skill => 
        skill.gameName && skill.playStyle && skill.serviceType
      )
      
      if (validSkills.length === 0) {
        ElMessage.warning('请至少填写一个完整的技能信息')
        return
      }
      
      try {
        await batchCreateGameSkills(validSkills)
        ElMessage.success('批量添加成功')
        showBatchCreateDialog.value = false
        resetBatchSkills()
        await loadMySkills()
      } catch (error) {
        ElMessage.error('批量添加失败')
        console.error('批量添加失败:', error)
      }
    }

    // 重置批量技能
    const resetBatchSkills = () => {
      batchSkills.value = [{
        gameName: '',
        playStyle: '',
        serviceType: '',
        highestRank: ''
      }]
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

    // 监听刷新事件
    const handleRefresh = () => {
      loadMySkills()
    }

    onMounted(() => {
      loadMySkills()
    })

    return {
      loading,
      gameSkills,
      searchGameName,
      showCreateDialog,
      showBatchCreateDialog,
      editingSkill,
      skillForm,
      skillFormRef,
      batchSkills,
      skillRules,
      loadMySkills,
      searchSkills,
      editSkill,
      deleteSkill,
      saveSkill,
      addBatchSkill,
      removeBatchSkill,
      saveBatchSkills,
      getPlayStyleLabel,
      getServiceTypeLabel,
      formatDate
    }
  }
}
</script>

<style scoped>
.game-skills-container {
  padding: 0;
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
}

.header-actions {
  display: flex;
  gap: 10px;
}

.search-section {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.search-section .el-input {
  width: 300px;
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
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.skill-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.skill-header h4 {
  margin: 0;
  color: #303133;
  font-size: 16px;
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

.batch-create-content {
  max-height: 400px;
  overflow-y: auto;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>