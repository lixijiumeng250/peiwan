<template>
  <div class="work-records">
    <!-- 操作栏 -->
    <div class="actions-bar">
      <div class="filter-section">
        <el-select
          v-model="statusFilter"
          placeholder="筛选状态"
          clearable
          @change="handleFilterChange"
          style="width: 140px; margin-right: 12px;"
        >
          <el-option label="全部" value="" />
          <el-option label="待接单" value="pending" />
          <el-option label="进行中" value="in_progress" />
          <el-option label="待审核" value="pending_audit" />
          <el-option label="已结单" value="completed" />
          <el-option label="未通过" value="rejected" />
        </el-select>
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          format="YYYY-MM-DD"
          value-format="YYYY-MM-DD"
          @change="handleFilterChange"
          style="width: 240px; margin-right: 12px;"
        />
        <el-button
          :icon="Search"
          @click="handleSearch"
        >
          搜索
        </el-button>
      </div>
      <div class="action-buttons">
                  <el-button
            v-if="userRole === 'customer-service'"
            type="success"
            :icon="DocumentAdd"
            @click="handleAssignOrder"
            :disabled="!employee || employee.status === 'offline'"
          >
            发派工单
          </el-button>
        <el-button
          :icon="Refresh"
          @click="handleRefresh"
          :loading="isLoading('workRecords')"
        >
          刷新
        </el-button>
      </div>
    </div>

    <!-- 工作记录表格 -->
    <div class="records-table" v-loading="isLoading('workRecords')">
      <el-table
        :data="workRecordList"
        stripe
        style="width: 100%"
        @sort-change="handleSortChange"
      >
        <el-table-column
          prop="orderNumber"
          label="单号"
          width="100"
          sortable="custom"
        />
        <el-table-column
          prop="customerName"
          label="客托人"
          width="100"
        />
        <el-table-column
          prop="game"
          label="游戏类型"
          width="100"
        />
        <el-table-column
          prop="serviceType"
          label="服务类型"
          width="100"
        />
        <el-table-column
          prop="status"
          label="完成状态"
          width="100"
        >
          <template #default="scope">
            <el-tag
              :type="getStatusTagType(scope.row.status)"
              size="small"
            >
              {{ getStatusText(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column
          prop="createdAt"
          label="创建时间"
          width="150"
          sortable="custom"
        >
          <template #default="scope">
            {{ formatDateTime(scope.row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column
          prop="completedAt"
          label="完成时间"
          width="150"
          sortable="custom"
        >
          <template #default="scope">
            {{ scope.row.completedAt ? formatDateTime(scope.row.completedAt) : '-' }}
          </template>
        </el-table-column>
        <el-table-column
          label="操作"
          width="200"
          fixed="right"
        >
          <template #default="scope">
            <!-- 待接单状态：上传接单截图 -->
            <el-button
              v-if="scope.row.status === 'pending'"
              type="primary"
              size="small"
              @click="uploadAcceptScreenshot(scope.row)"
            >
              接单
            </el-button>
            
            <!-- 进行中状态：上传完成截图 -->
            <el-button
              v-if="scope.row.status === 'in_progress'"
              type="success"
              size="small"
              @click="uploadCompleteScreenshot(scope.row)"
            >
              完成
            </el-button>
            
            <!-- 已结单状态：选择是否续单 -->
            <template v-if="scope.row.status === 'completed'">
              <el-button
                type="warning"
                size="small"
                @click="continueOrder(scope.row)"
              >
                续单
              </el-button>
              <el-button
                size="small"
                @click="viewOrderDetail(scope.row)"
              >
                详情
              </el-button>
            </template>
            
            <!-- 其他状态：查看详情 -->
            <el-button
              v-if="['pending_audit', 'rejected'].includes(scope.row.status)"
              size="small"
              @click="viewOrderDetail(scope.row)"
            >
              详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handlePageSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </div>

    <!-- 空状态 -->
    <el-empty
      v-if="!isLoading('workRecords') && workRecordList.length === 0"
      description="暂无工作记录"
    />

    <!-- 工单详情对话框 -->
    <el-dialog
      v-model="orderDetailVisible"
      title="工单详情"
      width="800px"
      :before-close="handleCloseDetailDialog"
    >
      <OrderAudit
        v-if="currentOrderDetail"
        :order="currentOrderDetail"
        @audit-success="handleAuditSuccess"
        @close="orderDetailVisible = false"
      />
    </el-dialog>

    <!-- 上传接单截图对话框 -->
    <el-dialog
      v-model="acceptScreenshotVisible"
      title="上传接单截图"
      width="500px"
    >
      <el-form label-width="100px">
        <el-form-item label="工单信息">
          <div class="order-info">
            <p>单号：{{ currentOrder?.orderNumber }}</p>
            <p>客托人：{{ currentOrder?.customerName }}</p>
            <p>游戏类型：{{ currentOrder?.game }}</p>
            <p>服务类型：{{ currentOrder?.serviceType }}</p>
          </div>
        </el-form-item>
        <el-form-item label="接单截图" required>
          <el-upload
            ref="acceptUploadRef"
            :auto-upload="false"
            :limit="1"
            accept="image/*"
            :on-change="handleAcceptFileChange"
          >
            <el-button type="primary">选择图片</el-button>
            <template #tip>
              <div class="el-upload__tip">
                只能上传jpg/png文件，且不超过2MB
              </div>
            </template>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="acceptScreenshotVisible = false">取消</el-button>
        <el-button 
          type="primary" 
          @click="submitAcceptScreenshot"
          :loading="isUploading"
        >
          确认接单
        </el-button>
      </template>
    </el-dialog>

    <!-- 上传完成截图对话框 -->
    <el-dialog
      v-model="completeScreenshotVisible"
      title="上传完成截图"
      width="500px"
    >
      <el-form label-width="100px">
        <el-form-item label="工单信息">
          <div class="order-info">
            <p>单号：{{ currentOrder?.orderNumber }}</p>
            <p>客托人：{{ currentOrder?.customerName }}</p>
            <p>游戏类型：{{ currentOrder?.game }}</p>
            <p>服务类型：{{ currentOrder?.serviceType }}</p>
          </div>
        </el-form-item>
        <el-form-item label="完成截图" required>
          <el-upload
            ref="completeUploadRef"
            :auto-upload="false"
            :limit="1"
            accept="image/*"
            :on-change="handleCompleteFileChange"
          >
            <el-button type="primary">选择图片</el-button>
            <template #tip>
              <div class="el-upload__tip">
                只能上传jpg/png文件，且不超过2MB
              </div>
            </template>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="completeScreenshotVisible = false">取消</el-button>
        <el-button 
          type="primary" 
          @click="submitCompleteScreenshot"
          :loading="isUploading"
        >
          提交完成
        </el-button>
      </template>
    </el-dialog>

    <!-- 续单确认对话框 -->
    <el-dialog
      v-model="continueOrderVisible"
      title="是否续单"
      width="400px"
    >
      <div class="continue-order-content">
        <p>工单 {{ currentOrder?.orderNumber }} 已完成，是否需要续单？</p>
        <div class="order-summary">
          <p>客托人：{{ currentOrder?.customerName }}</p>
          <p>游戏类型：{{ currentOrder?.game }}</p>
          <p>服务类型：{{ currentOrder?.serviceType }}</p>
        </div>
      </div>
      <template #footer>
        <el-button @click="finishOrder">不续单</el-button>
        <el-button 
          type="primary" 
          @click="startContinueOrder"
        >
          续单
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Search,
  DocumentAdd,
  Refresh
} from '@element-plus/icons-vue'
import customerServiceStore from '../store/customerService'
import OrderAudit from './OrderAudit.vue'

export default {
  name: 'WorkRecords',
  components: {
    Search,
    DocumentAdd,
    Refresh,
    OrderAudit
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
      default: 'customer-service'
    }
  },
  emits: ['refresh', 'assign-order'],
  setup(props, { emit }) {
    // 响应式数据
    const statusFilter = ref('')
    const dateRange = ref([])
    const orderDetailVisible = ref(false)
    const currentOrderDetail = ref(null)
    
    // 新增的对话框状态
    const acceptScreenshotVisible = ref(false)
    const completeScreenshotVisible = ref(false)
    const continueOrderVisible = ref(false)
    const currentOrder = ref(null)
    const isUploading = ref(false)
    const acceptUploadRef = ref(null)
    const completeUploadRef = ref(null)
    const acceptFile = ref(null)
    const completeFile = ref(null)
    
    // 分页数据
    const pagination = reactive({
      page: 1,
      pageSize: 10,
      total: 0
    })
    
    // 排序数据
    const sortConfig = reactive({
      prop: '',
      order: ''
    })
    
    // 计算属性
    const workRecordList = computed(() => customerServiceStore.getters.workRecordList.value)
    const isLoading = computed(() => customerServiceStore.getters.isLoading.value)
    const workRecordsPagination = computed(() => customerServiceStore.getters.workRecordsPagination.value)
    
    // 监听分页信息变化
    watch(workRecordsPagination, (newPagination) => {
      if (newPagination) {
        pagination.page = newPagination.page
        pagination.pageSize = newPagination.pageSize
        pagination.total = newPagination.total
      }
    }, { immediate: true })
    
    // 方法
    const getStatusTagType = (status) => {
      const statusMap = {
        'pending': 'info',
        'in_progress': 'primary',
        'pending_audit': 'warning',
        'completed': 'success',
        'rejected': 'danger'
      }
      return statusMap[status] || 'info'
    }
    
    const getStatusText = (status) => {
      const statusMap = {
        'pending': '待接单',
        'in_progress': '进行中',
        'pending_audit': '待审核',
        'completed': '已结单',
        'rejected': '未通过'
      }
      return statusMap[status] || '未知'
    }
    
    const formatDateTime = (dateString) => {
      if (!dateString) return '-'
      
      const date = new Date(dateString)
      return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    }
    
    const loadWorkRecords = async (params = {}) => {
      if (!props.employeeId) return
      
      const queryParams = {
        page: pagination.page,
        pageSize: pagination.pageSize,
        status: statusFilter.value,
        startDate: dateRange.value?.[0],
        endDate: dateRange.value?.[1],
        sortBy: sortConfig.prop,
        sortOrder: sortConfig.order === 'ascending' ? 'asc' : 'desc',
        ...params
      }
      
      const result = await customerServiceStore.actions.fetchWorkRecords(props.employeeId, queryParams)
      if (!result.success) {
        ElMessage.error(result.message)
      } else {
        emit('refresh')
      }
    }
    
    const handleFilterChange = () => {
      pagination.page = 1
      loadWorkRecords()
    }
    
    const handleSearch = () => {
      handleFilterChange()
    }
    
    const handleRefresh = () => {
      loadWorkRecords()
    }
    
    const handleAssignOrder = () => {
      emit('assign-order')
    }
    
    const handlePageChange = (page) => {
      pagination.page = page
      loadWorkRecords()
    }
    
    const handlePageSizeChange = (pageSize) => {
      pagination.pageSize = pageSize
      pagination.page = 1
      loadWorkRecords()
    }
    
    const handleSortChange = ({ prop, order }) => {
      sortConfig.prop = prop
      sortConfig.order = order
      pagination.page = 1
      loadWorkRecords()
    }
    
    const viewOrderDetail = async (record) => {
      try {
        const result = await customerServiceStore.actions.fetchOrderDetail(record.id)
        if (result.success) {
          currentOrderDetail.value = result.data
          orderDetailVisible.value = true
        } else {
          ElMessage.error(result.message)
        }
      } catch (error) {
        ElMessage.error('获取工单详情失败')
      }
    }
    
    const handleCloseDetailDialog = (done) => {
      currentOrderDetail.value = null
      done()
    }
    
    const handleAuditSuccess = () => {
      orderDetailVisible.value = false
      currentOrderDetail.value = null
      // 刷新工作记录列表
      loadWorkRecords()
      emit('refresh')
    }
    
    // 新增方法：上传接单截图
    const uploadAcceptScreenshot = (order) => {
      currentOrder.value = order
      acceptScreenshotVisible.value = true
    }
    
    // 新增方法：上传完成截图
    const uploadCompleteScreenshot = (order) => {
      currentOrder.value = order
      completeScreenshotVisible.value = true
    }
    
    // 新增方法：续单确认
    const continueOrder = (order) => {
      currentOrder.value = order
      continueOrderVisible.value = true
    }
    
    // 新增方法：处理接单文件变化
    const handleAcceptFileChange = (file) => {
      acceptFile.value = file
    }
    
    // 新增方法：处理完成文件变化
    const handleCompleteFileChange = (file) => {
      completeFile.value = file
    }
    
    // 新增方法：提交接单截图
    const submitAcceptScreenshot = async () => {
      if (!acceptFile.value) {
        ElMessage.warning('请选择接单截图')
        return
      }
      
      isUploading.value = true
      try {
        // 这里应该调用API上传文件并更新工单状态
        await new Promise(resolve => setTimeout(resolve, 2000))
        
        ElMessage.success('接单成功，工单状态已更新为进行中')
        acceptScreenshotVisible.value = false
        loadWorkRecords()
        emit('refresh')
      } catch (error) {
        ElMessage.error('上传失败：' + error.message)
      } finally {
        isUploading.value = false
        acceptFile.value = null
        if (acceptUploadRef.value) {
          acceptUploadRef.value.clearFiles()
        }
      }
    }
    
    // 新增方法：提交完成截图
    const submitCompleteScreenshot = async () => {
      if (!completeFile.value) {
        ElMessage.warning('请选择完成截图')
        return
      }
      
      isUploading.value = true
      try {
        // 这里应该调用API上传文件并更新工单状态
        await new Promise(resolve => setTimeout(resolve, 2000))
        
        ElMessage.success('工单已提交审核')
        completeScreenshotVisible.value = false
        loadWorkRecords()
        emit('refresh')
      } catch (error) {
        ElMessage.error('上传失败：' + error.message)
      } finally {
        isUploading.value = false
        completeFile.value = null
        if (completeUploadRef.value) {
          completeUploadRef.value.clearFiles()
        }
      }
    }
    
    // 新增方法：开始续单
    const startContinueOrder = async () => {
      try {
        // 这里应该调用API创建续单
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        ElMessage.success('续单已创建，请上传新的接单截图')
        continueOrderVisible.value = false
        
        // 直接打开接单截图对话框
        acceptScreenshotVisible.value = true
      } catch (error) {
        ElMessage.error('续单失败：' + error.message)
      }
    }
    
    // 新增方法：结束工单
    const finishOrder = async () => {
      try {
        // 这里应该调用API结束工单
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        ElMessage.success('工单已结束')
        continueOrderVisible.value = false
        loadWorkRecords()
        emit('refresh')
      } catch (error) {
        ElMessage.error('操作失败：' + error.message)
      }
    }
    
    // 监听员工ID变化
    watch(() => props.employeeId, () => {
      if (props.employeeId) {
        // 重置筛选条件
        statusFilter.value = ''
        dateRange.value = []
        pagination.page = 1
        sortConfig.prop = ''
        sortConfig.order = ''
        loadWorkRecords()
      }
    })
    
    // 生命周期
    onMounted(() => {
      if (props.employeeId) {
        loadWorkRecords()
      }
    })
    
    return {
      // 响应式数据
      statusFilter,
      dateRange,
      orderDetailVisible,
      currentOrderDetail,
      pagination,
      
      // 新增的响应式数据
      acceptScreenshotVisible,
      completeScreenshotVisible,
      continueOrderVisible,
      currentOrder,
      isUploading,
      acceptUploadRef,
      completeUploadRef,
      
      // Props
      userRole: computed(() => props.userRole),
      
      // 计算属性
      workRecordList,
      isLoading,
      
      // 方法
      getStatusTagType,
      getStatusText,
      formatDateTime,
      handleFilterChange,
      handleSearch,
      handleRefresh,
      handleAssignOrder,
      handlePageChange,
      handlePageSizeChange,
      handleSortChange,
      viewOrderDetail,
      handleCloseDetailDialog,
      handleAuditSuccess,
      
      // 新增的方法
      uploadAcceptScreenshot,
      uploadCompleteScreenshot,
      continueOrder,
      handleAcceptFileChange,
      handleCompleteFileChange,
      submitAcceptScreenshot,
      submitCompleteScreenshot,
      startContinueOrder,
      finishOrder
    }
  }
}
</script>

<style scoped>
.work-records {
  min-height: 400px;
}

.actions-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 6px;
}

.filter-section {
  display: flex;
  align-items: center;
}

.action-buttons {
  display: flex;
  gap: 12px;
}

.records-table {
  background: #fff;
  border-radius: 6px;
  overflow: hidden;
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  padding: 20px;
  background: #fff;
  border-top: 1px solid #e4e7ed;
}

@media (max-width: 768px) {
  .actions-bar {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }
  
  .filter-section {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }
  
  .filter-section .el-select,
  .filter-section .el-date-picker {
    width: 100% !important;
    margin-right: 0 !important;
  }
  
  .action-buttons {
    justify-content: center;
  }
}

/* 新增对话框样式 */
.order-info {
  background: #f5f7fa;
  padding: 16px;
  border-radius: 6px;
  margin-bottom: 16px;
}

.order-info p {
  margin: 0 0 8px 0;
  color: #606266;
}

.order-info p:last-child {
  margin-bottom: 0;
}

.continue-order-content {
  text-align: center;
}

.continue-order-content p {
  font-size: 16px;
  color: #303133;
  margin-bottom: 20px;
}

.order-summary {
  background: #f5f7fa;
  padding: 16px;
  border-radius: 6px;
  text-align: left;
}

.order-summary p {
  margin: 0 0 8px 0;
  color: #606266;
}

.order-summary p:last-child {
  margin-bottom: 0;
}

.el-upload__tip {
  color: #909399;
  font-size: 12px;
  margin-top: 8px;
}
</style>
