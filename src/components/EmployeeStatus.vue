<template>
  <div class="employee-status">
    <!-- 基本信息 -->
    <div class="info-section">
      <div class="section-header">
        <h3>基本信息</h3>
        <span class="info-tip" v-if="!canEditBasicInfo">基本信息仅供查看</span>
        <el-button 
          v-if="canEditBasicInfo"
          type="primary" 
          size="small" 
          @click="saveBasicInfo"
          :loading="isSaving"
        >
          保存基本信息
        </el-button>
      </div>
      <div class="basic-info">
        <div class="info-item">
          <label>姓名:</label>
          <span>{{ employee?.name || '未设置' }}</span>
        </div>
        <div class="info-item">
          <label>性别:</label>
          <el-select 
            v-if="canEditBasicInfo"
            v-model="personalInfo.gender" 
            size="small" 
            style="width: 100px"
          >
            <el-option label="男" value="male" />
            <el-option label="女" value="female" />
          </el-select>
          <span v-else>{{ getGenderText(personalInfo.gender) }}</span>
        </div>
      </div>
    </div>

    <!-- 游戏信息 -->
    <div class="games-section">
      <div class="section-header">
        <h3>游戏信息</h3>
        <el-button 
          type="primary" 
          size="small" 
          @click="savePersonalInfo"
          :loading="isSaving"
        >
          保存修改
        </el-button>
      </div>
      <div class="games-grid">
        <div 
          v-for="(game, index) in personalInfo.games" 
          :key="index"
          class="game-card"
        >
          <div class="game-header">
            <el-input 
              v-model="game.name" 
              placeholder="游戏名称"
              size="small"
              style="width: 120px"
            />
            <div class="game-actions">
              <el-select 
                v-model="game.workStatus" 
                size="small" 
                style="width: 100px"
                :class="'status-select-' + game.workStatus"
              >
                <el-option label="空闲中" value="idle" />
                <el-option label="工作中" value="working" />
                <el-option label="休息中" value="resting" />
                <el-option label="离岗" value="offline" />
              </el-select>
              <span 
                class="delete-text"
                @click="removeGame(index)"
                :class="{ disabled: personalInfo.games.length <= 1 }"
              >
                删除
              </span>
            </div>
          </div>
          <div class="game-details">
            <div class="detail-row">
              <label>陪玩类型:</label>
              <el-select 
                v-model="game.playType" 
                size="small" 
                style="width: 100px"
                filterable
                allow-create
                default-first-option
                placeholder="选择或输入"
              >
                <el-option label="技术陪练" value="技术陪练" />
                <el-option label="娱乐陪玩" value="娱乐陪玩" />
              </el-select>
            </div>
            <div class="detail-row">
              <label>负责类型:</label>
              <el-select 
                v-model="game.gameType" 
                size="small" 
                style="width: 100px"
                placeholder="选择类型"
              >
                <el-option label="排位" value="排位" />
                <el-option label="匹配" value="匹配" />
              </el-select>
            </div>
            <div class="detail-row">
              <label>最高段位:</label>
              <el-input 
                v-model="game.level" 
                placeholder="段位"
                size="small"
                style="width: 100px"
              />
            </div>
          </div>
        </div>
      </div>
      <div class="add-game-section">
        <el-button 
          type="dashed" 
          :icon="Plus"
          @click="addGame"
          style="width: 100%"
        >
          添加游戏信息
        </el-button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'

export default {
  name: 'EmployeeStatus',
  components: {
    Plus
  },
  props: {
    employeeId: {
      type: Number,
      required: true
    },
    employee: {
      type: Object,
      default: null
    },
    userRole: {
      type: String,
      default: 'user'
    }
  },
  emits: ['refresh'],
  setup(props, { emit }) {
    // 响应式数据
    const isSaving = ref(false)
    
    // 计算属性 - 权限控制
    const canEditBasicInfo = computed(() => {
      return props.userRole === 'admin'
    })
    
    // 个人信息数据
    const personalInfo = reactive({
      gender: 'male',
      games: [
        {
          name: '王者荣耀',
          workStatus: 'idle',
          playType: '技术陪练',
          gameType: '排位',
          level: '王者50星'
        },
        {
          name: '和平精英',
          workStatus: 'idle',
          playType: '娱乐陪玩',
          gameType: '匹配',
          level: '战神'
        }
      ]
    })
    
    // 保存基本信息
    const saveBasicInfo = async () => {
      isSaving.value = true
      
      try {
        // 这里应该调用API保存基本信息
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        ElMessage.success('基本信息保存成功')
        emit('refresh')
      } catch (error) {
        ElMessage.error('保存失败：' + error.message)
      } finally {
        isSaving.value = false
      }
    }
    
    // 保存游戏信息
    const savePersonalInfo = async () => {
      isSaving.value = true
      
      try {
        // 这里应该调用API保存游戏数据
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        ElMessage.success('游戏信息保存成功')
        emit('refresh')
      } catch (error) {
        ElMessage.error('保存失败：' + error.message)
      } finally {
        isSaving.value = false
      }
    }
    
    // 获取性别显示文本
    const getGenderText = (gender) => {
      return gender === 'male' ? '男' : gender === 'female' ? '女' : '未设置'
    }
    
    // 添加游戏
    const addGame = () => {
      personalInfo.games.push({
        name: '',
        workStatus: 'idle',
        playType: '技术陪练',
        gameType: '排位',
        level: ''
      })
    }
    
    // 删除游戏
    const removeGame = (index) => {
      if (personalInfo.games.length > 1) {
        personalInfo.games.splice(index, 1)
      }
    }
    
    // 初始化数据
    const initData = () => {
      if (props.employee) {
        // 从props中初始化数据
        personalInfo.gender = props.employee.gender || 'male'
        
        // 如果有现有游戏数据，则使用现有数据
        if (props.employee.games && props.employee.games.length > 0) {
          personalInfo.games = props.employee.games.map(game => ({ ...game }))
        }
      }
    }
    
    // 生命周期
    onMounted(() => {
      initData()
    })
    
    return {
      // 响应式数据
      personalInfo,
      isSaving,
      
      // 计算属性
      canEditBasicInfo,
      
      // 方法
      saveBasicInfo,
      savePersonalInfo,
      getGenderText,
      addGame,
      removeGame
    }
  }
}
</script>

<style scoped>
.employee-status {
  padding: 20px;
}

.info-section,
.games-section {
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
}

.section-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.tip {
  font-size: 12px;
  color: #909399;
}

.info-tip {
  font-size: 12px;
  color: #909399;
  font-style: italic;
}

.basic-info {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
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

.games-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.game-card {
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 16px;
  background: #fafafa;
  transition: all 0.3s ease;
}

.game-card:hover {
  border-color: #409eff;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.1);
}

.game-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e4e7ed;
}

.game-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.game-details {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.detail-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.detail-row label {
  font-size: 13px;
  color: #606266;
  min-width: 70px;
  font-weight: 500;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .games-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .employee-status {
    padding: 10px;
  }
  
  .basic-info {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .game-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .detail-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 6px;
  }
  
  .detail-row label {
    min-width: auto;
  }
}

/* 空游戏卡片样式 */
.game-card:has(input[value=""]) {
  opacity: 0.6;
  background: #f9f9f9;
}

/* 选择器样式调整 */
.el-select {
  width: 100%;
}

.el-input {
  width: 100%;
}

/* 保存按钮样式 */
.section-header .el-button {
  margin-left: auto;
}

/* 添加游戏按钮样式 */
.add-game-section {
  margin-top: 20px;
}

.add-game-section .el-button {
  border-style: dashed;
  color: #409eff;
  background-color: #f5f7fa;
  border-color: #d9ecff;
  transition: all 0.3s ease;
}

.add-game-section .el-button:hover {
  background-color: #ecf5ff;
  border-color: #409eff;
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
</style>
