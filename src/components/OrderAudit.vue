<template>
  <div class="order-audit">
    <div class="audit-content">
      <!-- 工单基本信息 -->
      <div class="order-info-section">
        <h4 class="section-title">单号：{{ order.orderNumber }}</h4>
        <div class="info-grid">
          <div class="info-item">
            <span class="label">员工:</span>
            <span class="value">{{ order.employeeName }}</span>
          </div>
          <div class="info-item">
            <span class="label">游戏类型:</span>
            <span class="value">{{ order.game }}</span>
          </div>
          <div class="info-item">
            <span class="label">服务类型:</span>
            <span class="value">{{ order.serviceType }}</span>
          </div>
          <!-- 续单信息 -->
          <template v-if="order.additionalInfo">
            <div class="info-item" v-if="parseRenewalInfo(order.additionalInfo).duration">
              <span class="label">续单时长:</span>
              <span class="value">{{ parseRenewalInfo(order.additionalInfo).duration }}</span>
            </div>
            <div class="info-item" v-if="parseRenewalInfo(order.additionalInfo).price">
              <span class="label">续单单价:</span>
              <span class="value">{{ parseRenewalInfo(order.additionalInfo).price }}</span>
            </div>
          </template>
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

      <!-- 委托信息区域 -->
      <div class="client-info-section" v-if="order.clientInfo && order.clientInfo.trim()">
        <h4 class="section-title">委托信息</h4>
        <div class="client-info-content">
          {{ order.clientInfo }}
        </div>
      </div>

      <!-- 截图展示区域 -->
      <div class="screenshots-section">
        <h4>工单截图</h4>
        <div class="screenshots-grid">
          <!-- 派单截图 -->
          <div class="screenshot-item">
            <div class="screenshot-title">
              <span>派单截图</span>
              <el-tag size="small" type="primary">客服上传</el-tag>
            </div>
            <div class="screenshot-content">
              <el-image
                v-if="order.orderInfoScreenshotUrl"
                :src="order.orderInfoScreenshotUrl"
                :preview-src-list="[order.orderInfoScreenshotUrl]"
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
              <div class="screenshot-time" v-if="order.createdAt">
                <span class="time-label">派单时间：</span>
                <span class="time-value">{{ formatDateTime(order.createdAt) }}</span>
              </div>
            </div>
          </div>

          <!-- 接单截图 -->
          <div class="screenshot-item">
            <div class="screenshot-title">
              <span>接单截图</span>
              <el-tag size="small" type="info">员工上传</el-tag>
            </div>
            <div class="screenshot-content">
              <el-image
                v-if="order.acceptanceScreenshotUrl"
                :src="order.acceptanceScreenshotUrl"
                :preview-src-list="[order.acceptanceScreenshotUrl]"
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
              <div class="screenshot-time" v-if="order.acceptedAt">
                <span class="time-label">接单时间：</span>
                <span class="time-value">{{ formatDateTime(order.acceptedAt) }}</span>
              </div>
            </div>
          </div>

          <!-- 完成截图 -->
          <div class="screenshot-item">
            <div class="screenshot-title">
              <span>完成截图</span>
              <el-tag size="small" type="success">员工上传</el-tag>
            </div>
            <div class="screenshot-content">
              <el-image
                v-if="order.completionScreenshotUrl"
                :src="order.completionScreenshotUrl"
                :preview-src-list="[order.completionScreenshotUrl]"
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
              <div class="screenshot-time" v-if="order.completedAt">
                <span class="time-label">完成时间：</span>
                <span class="time-value">{{ formatDateTime(order.completedAt) }}</span>
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
      <div class="audit-actions-section" v-if="order.status === 'PENDING_AUDIT' || order.status === 'REJECTED_TO_SUBMIT' || order.status === 'RESUBMITTING'">
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
              通过
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
                  <li><strong>通过：</strong>工单状态变为"已完成"，员工可以获得相应奖励</li>
                  <li><strong>拒绝：</strong>工单状态变为"未通过"，员工可以重新提交截图</li>
                  <li>请仔细检查截图内容是否符合要求后再进行审核操作</li>
                </ul>
              </template>
            </el-alert>
          </div>
        </div>
      </div>

      <!-- 已审核状态显示 -->
      <div class="audit-result-section" v-else-if="order.status !== 'PENDING_AUDIT' && order.status !== 'REJECTED_TO_SUBMIT' && order.status !== 'RESUBMITTING'">
        <h4>审核结果</h4>
        <div class="result-display">
          <el-result
            :icon="order.status === 'COMPLETED' ? 'success' : 'error'"
            :title="order.status === 'COMPLETED' ? '审核通过' : '审核未通过'"
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
import { formatDateTime } from '../utils/dateFormatter'

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
        'PENDING_ACCEPTANCE': 'info',
        'IN_PROGRESS': 'primary',
        'PENDING_AUDIT': 'warning',
        'COMPLETED': 'success',
        'REJECTED': 'danger',
        'REJECTED_TO_SUBMIT': 'warning',
        'RESUBMITTING': 'warning'
      }
      return statusMap[status] || 'info'
    }
    
    const getStatusText = (status) => {
      const statusMap = {
        'PENDING_ACCEPTANCE': '待接单',
        'IN_PROGRESS': '进行中',
        'PENDING_AUDIT': '待审核',
        'COMPLETED': '已完成',
        'REJECTED': '未通过',
        'REJECTED_TO_SUBMIT': '重新审核中',
        'RESUBMITTING': '重新审核中'
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
      if (status === 'COMPLETED') {
        return '工单已通过审核，员工可以获得相应奖励'
      } else if (status === 'REJECTED') {
        return '工单未通过审核，员工需要重新提交截图'
      } else if (status === 'REJECTED_TO_SUBMIT') {
        return '员工正在重新提交工单，请等待审核'
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
    
    // 解析续单信息
    const parseRenewalInfo = (additionalInfo) => {
      if (!additionalInfo) return { duration: '', price: '' }
      
      // 解析格式：续单时长：2，续单单价：111
      const durationMatch = additionalInfo.match(/续单时长[：:]\s*([^，,]+)/)
      const priceMatch = additionalInfo.match(/续单单价[：:]\s*([^，,]+)/)
      
      return {
        duration: durationMatch ? durationMatch[1].trim() : '',
        price: priceMatch ? priceMatch[1].trim() : ''
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
      parseRenewalInfo,
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
  grid-template-columns: 1fr 1fr 1fr;
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

.screenshot-time {
  margin-top: 8px;
  padding: 6px 8px;
  background-color: #f5f7fa;
  border-radius: 4px;
  font-size: 12px;
  color: #606266;
  text-align: center;
  border: 1px solid #e4e7ed;
}

.time-label {
  font-weight: 500;
  color: #909399;
}

.time-value {
  color: #409eff;
  font-weight: 500;
}

.client-info-text {
  min-height: 40px;
  padding: 12px 16px;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border: 1px solid #dee2e6;
  border-radius: 8px;
  font-size: 14px;
  color: #495057;
  line-height: 1.6;
  white-space: pre-wrap;
  word-wrap: break-word;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-top: 4px;
  position: relative;
}

.client-info-text::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background: linear-gradient(to bottom, #409eff, #67c23a);
  border-radius: 8px 0 0 8px;
}

/* 委托信息区域样式 */
.client-info-section {
  margin-bottom: 20px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 12px;
  border: 1px solid #e9ecef;
}

.client-info-section .section-title {
  margin: 0 0 12px 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  padding-bottom: 6px;
  border-bottom: 2px solid #409eff;
}

.client-info-content {
  padding: 16px 20px;
  background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
  border: 1px solid #dee2e6;
  border-radius: 8px;
  font-size: 14px;
  color: #495057;
  line-height: 1.6;
  white-space: pre-wrap;
  word-wrap: break-word;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  position: relative;
  min-height: 60px;
}

.client-info-content::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  background: linear-gradient(to bottom, #409eff, #67c23a);
  border-radius: 8px 0 0 8px;
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


