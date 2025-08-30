<template>
  <div class="order-audit">
    <div class="audit-content">
      <!-- 工单基本信息 -->
      <div class="order-info-section">
        <h4>工单信息</h4>
        <div class="info-grid">
          <div class="info-item">
            <span class="label">单号:</span>
            <span class="value">{{ order.orderNumber }}</span>
          </div>
          <div class="info-item">
            <span class="label">员工:</span>
            <span class="value">{{ order.employeeName }}</span>
          </div>
          <div class="info-item">
            <span class="label">客托人:</span>
            <span class="value">{{ order.customerName }}</span>
          </div>
          <div class="info-item">
            <span class="label">游戏类型:</span>
            <span class="value">{{ order.game }}</span>
          </div>
          <div class="info-item">
            <span class="label">服务类型:</span>
            <span class="value">{{ order.serviceType }}</span>
          </div>
          <div class="info-item">
            <span class="label">游戏水平:</span>
            <span class="value">{{ order.gameLevel }}</span>
          </div>
          <div class="info-item">
            <span class="label">创建时间:</span>
            <span class="value">{{ formatDateTime(order.createdAt) }}</span>
          </div>
          <div class="info-item">
            <span class="label">完成时间:</span>
            <span class="value">{{ order.completedAt ? formatDateTime(order.completedAt) : '未完成' }}</span>
          </div>
          <div class="info-item full-width">
            <span class="label">当前状态:</span>
            <el-tag
              :type="getStatusTagType(order.status)"
              size="small"
            >
              {{ getStatusText(order.status) }}
            </el-tag>
          </div>
        </div>
      </div>

      <!-- 截图展示区域 -->
      <div class="screenshots-section">
        <h4>工单截图</h4>
        <div class="screenshots-grid">
          <!-- 接单截图 -->
          <div class="screenshot-item">
            <div class="screenshot-title">
              <span>接单截图</span>
              <el-tag size="small" type="info">必须</el-tag>
            </div>
            <div class="screenshot-content">
              <el-image
                v-if="order.screenshots?.assignment"
                :src="order.screenshots.assignment"
                :preview-src-list="[order.screenshots.assignment]"
                fit="cover"
                class="screenshot-image"
              >
                <template #error>
                  <div class="image-error">
                    <el-icon><Picture /></el-icon>
                    <span>图片加载失败</span>
                  </div>
                </template>
              </el-image>
              <div v-else class="no-screenshot">
                <el-icon><Picture /></el-icon>
                <span>暂无截图</span>
              </div>
            </div>
          </div>

          <!-- 完成截图 -->
          <div class="screenshot-item">
            <div class="screenshot-title">
              <span>完成截图</span>
              <el-tag size="small" type="success">必须</el-tag>
            </div>
            <div class="screenshot-content">
              <el-image
                v-if="order.screenshots?.completion"
                :src="order.screenshots.completion"
                :preview-src-list="[order.screenshots.completion]"
                fit="cover"
                class="screenshot-image"
              >
                <template #error>
                  <div class="image-error">
                    <el-icon><Picture /></el-icon>
                    <span>图片加载失败</span>
                  </div>
                </template>
              </el-image>
              <div v-else class="no-screenshot">
                <el-icon><Picture /></el-icon>
                <span>暂无截图</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 审核历史 -->
      <div class="audit-history-section" v-if="order.auditHistory && order.auditHistory.length > 0">
        <h4>审核历史</h4>
        <el-timeline class="audit-timeline">
          <el-timeline-item
            v-for="(item, index) in order.auditHistory"
            :key="index"
            :timestamp="formatDateTime(item.time)"
            :type="getTimelineType(item.action)"
          >
            <div class="timeline-content">
              <div class="timeline-action">{{ getActionText(item.action) }}</div>
              <div class="timeline-note" v-if="item.note">{{ item.note }}</div>
            </div>
          </el-timeline-item>
        </el-timeline>
      </div>

      <!-- 审核操作区域 -->
      <div class="audit-actions-section" v-if="order.status === 'pending_audit'">
        <h4>审核操作</h4>
        <div class="audit-form">
          <el-form
            ref="auditForm"
            :model="auditData"
            :rules="auditRules"
            label-width="80px"
          >
            <el-form-item label="审核备注" prop="note">
              <el-input
                v-model="auditData.note"
                type="textarea"
                :rows="3"
                placeholder="请输入审核备注（选填）"
              />
            </el-form-item>
          </el-form>
          
          <div class="audit-buttons">
            <el-button
              type="success"
              size="large"
              @click="handleApprove"
              :loading="isAuditing && auditAction === 'approve'"
              :disabled="isAuditing"
            >
              <el-icon><Select /></el-icon>
              同意
            </el-button>
            <el-button
              type="danger"
              size="large"
              @click="handleReject"
              :loading="isAuditing && auditAction === 'reject'"
              :disabled="isAuditing"
            >
              <el-icon><Close /></el-icon>
              拒绝
            </el-button>
          </div>
          
          <div class="audit-tips">
            <el-alert
              title="审核说明"
              type="info"
              :closable="false"
              show-icon
            >
              <template #default>
                <ul class="tips-list">
                  <li><strong>同意：</strong>工单状态变为"已审核"，员工可以获得相应奖励</li>
                  <li><strong>拒绝：</strong>工单状态变为"未通过"，员工需要重新提交截图</li>
                  <li>请仔细检查截图内容是否符合要求后再进行审核操作</li>
                </ul>
              </template>
            </el-alert>
          </div>
        </div>
      </div>

      <!-- 已审核状态显示 -->
      <div class="audit-result-section" v-else-if="order.status !== 'pending_audit'">
        <h4>审核结果</h4>
        <div class="result-display">
          <el-result
            :icon="order.status === 'approved' ? 'success' : 'error'"
            :title="order.status === 'approved' ? '审核通过' : '审核未通过'"
            :sub-title="getResultSubtitle(order.status)"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Picture,
  Select,
  Close
} from '@element-plus/icons-vue'
import customerServiceStore from '../store/customerService'

export default {
  name: 'OrderAudit',
  components: {
    Picture,
    Select,
    Close
  },
  props: {
    order: {
      type: Object,
      required: true
    }
  },
  emits: ['audit-success', 'close'],
  setup(props, { emit }) {
    // 响应式数据
    const auditForm = ref(null)
    const isAuditing = ref(false)
    const auditAction = ref('')
    
    // 审核表单数据
    const auditData = reactive({
      note: ''
    })
    
    // 表单验证规则
    const auditRules = {
      note: [
        { max: 200, message: '备注不能超过200个字符', trigger: 'blur' }
      ]
    }
    
    // 方法
    const getStatusTagType = (status) => {
      const statusMap = {
        'pending_audit': 'warning',
        'approved': 'success',
        'rejected': 'danger'
      }
      return statusMap[status] || 'info'
    }
    
    const getStatusText = (status) => {
      const statusMap = {
        'pending_audit': '待审核',
        'approved': '已审核',
        'rejected': '未通过'
      }
      return statusMap[status] || '未知'
    }
    
    const getTimelineType = (action) => {
      const typeMap = {
        'submitted': 'primary',
        'approved': 'success',
        'rejected': 'danger',
        'resubmitted': 'warning'
      }
      return typeMap[action] || 'info'
    }
    
    const getActionText = (action) => {
      const actionMap = {
        'submitted': '员工提交工单',
        'approved': '客服审核通过',
        'rejected': '客服审核拒绝',
        'resubmitted': '员工重新提交'
      }
      return actionMap[action] || '未知操作'
    }
    
    const getResultSubtitle = (status) => {
      if (status === 'approved') {
        return '工单已通过审核，员工可以获得相应奖励'
      } else if (status === 'rejected') {
        return '工单未通过审核，员工需要重新提交截图'
      }
      return ''
    }
    
    const formatDateTime = (dateString) => {
      if (!dateString) return '-'
      
      const date = new Date(dateString)
      return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
    }
    
    const handleApprove = async () => {
      try {
        await auditForm.value?.validate()
        
        const result = await ElMessageBox.confirm(
          '确定要通过这个工单的审核吗？',
          '确认审核',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'success'
          }
        )
        
        if (result === 'confirm') {
          await performAudit('approve')
        }
      } catch (error) {
        if (error !== 'cancel') {
          console.error('审核操作失败:', error)
        }
      }
    }
    
    const handleReject = async () => {
      try {
        await auditForm.value?.validate()
        
        const result = await ElMessageBox.confirm(
          '确定要拒绝这个工单吗？员工需要重新提交截图。',
          '确认审核',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          }
        )
        
        if (result === 'confirm') {
          await performAudit('reject')
        }
      } catch (error) {
        if (error !== 'cancel') {
          console.error('审核操作失败:', error)
        }
      }
    }
    
    const performAudit = async (action) => {
      try {
        isAuditing.value = true
        auditAction.value = action
        
        const result = await customerServiceStore.actions.auditOrder(props.order.id, {
          action,
          note: auditData.note
        })
        
        if (result.success) {
          ElMessage.success(result.message)
          emit('audit-success')
        } else {
          ElMessage.error(result.message)
        }
      } catch (error) {
        ElMessage.error('审核操作失败，请稍后重试')
        console.error('审核操作失败:', error)
      } finally {
        isAuditing.value = false
        auditAction.value = ''
      }
    }
    
    return {
      // 响应式数据
      auditForm,
      isAuditing,
      auditAction,
      auditData,
      auditRules,
      
      // 方法
      getStatusTagType,
      getStatusText,
      getTimelineType,
      getActionText,
      getResultSubtitle,
      formatDateTime,
      handleApprove,
      handleReject
    }
  }
}
</script>

<style scoped>
.order-audit {
  max-height: 70vh;
  overflow-y: auto;
}

.audit-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.order-info-section,
.screenshots-section,
.audit-history-section,
.audit-actions-section,
.audit-result-section {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 20px;
}

.order-info-section h4,
.screenshots-section h4,
.audit-history-section h4,
.audit-actions-section h4,
.audit-result-section h4 {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  border-bottom: 2px solid #409eff;
  padding-bottom: 8px;
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.info-item.full-width {
  grid-column: 1 / -1;
}

.label {
  font-weight: 500;
  color: #606266;
  min-width: 80px;
}

.value {
  color: #303133;
}

.screenshots-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.screenshot-item {
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  overflow: hidden;
  background: #fff;
}

.screenshot-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #f5f7fa;
  border-bottom: 1px solid #e4e7ed;
  font-weight: 500;
  color: #303133;
}

.screenshot-content {
  padding: 16px;
  text-align: center;
}

.screenshot-image {
  width: 100%;
  height: 200px;
  border-radius: 4px;
  cursor: pointer;
}

.no-screenshot,
.image-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: #c0c4cc;
  background: #f5f7fa;
  border-radius: 4px;
}

.no-screenshot .el-icon,
.image-error .el-icon {
  font-size: 48px;
  margin-bottom: 8px;
}

.audit-timeline {
  margin-top: 16px;
}

.timeline-content {
  margin-left: 16px;
}

.timeline-action {
  font-weight: 500;
  color: #303133;
  margin-bottom: 4px;
}

.timeline-note {
  font-size: 14px;
  color: #606266;
}

.audit-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.audit-buttons {
  display: flex;
  gap: 16px;
  justify-content: center;
}

.audit-buttons .el-button {
  min-width: 120px;
}

.audit-tips {
  margin-top: 16px;
}

.tips-list {
  margin: 0;
  padding-left: 20px;
  color: #606266;
}

.tips-list li {
  margin-bottom: 4px;
}

.result-display {
  text-align: center;
}

@media (max-width: 768px) {
  .info-grid {
    grid-template-columns: 1fr;
  }
  
  .screenshots-grid {
    grid-template-columns: 1fr;
  }
  
  .screenshot-image {
    height: 150px;
  }
  
  .audit-buttons {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
