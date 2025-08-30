<template>
  <div class="employee-work-records">
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
          :icon="Refresh"
          @click="handleRefresh"
          :loading="isLoading"
        >
          刷新
        </el-button>
      </div>
    </div>

    <!-- 工作记录表格 -->
    <div class="records-table" v-loading="isLoading">
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
          width="120"
          sortable="custom"
        >
          <template #default="scope">
            {{ formatDateTime(scope.row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column
          prop="completedAt"
          label="完成时间"
          width="120"
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
      v-if="!isLoading && workRecordList.length === 0"
      description="暂无工作记录"
    />

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

    <!-- 工单详情对话框 -->
    <el-dialog
      v-model="orderDetailVisible"
      title="工单详情"
      width="800px"
    >
      <div v-if="currentOrderDetail" class="order-detail-content">
        <div class="detail-section">
          <h4>基本信息</h4>
          <div class="detail-grid">
            <div class="detail-item">
              <label>单号：</label>
              <span>{{ currentOrderDetail.orderNumber }}</span>
            </div>
            <div class="detail-item">
              <label>客托人：</label>
              <span>{{ currentOrderDetail.customerName }}</span>
            </div>
            <div class="detail-item">
              <label>游戏类型：</label>
              <span>{{ currentOrderDetail.game }}</span>
            </div>
            <div class="detail-item">
              <label>服务类型：</label>
              <span>{{ currentOrderDetail.serviceType }}</span>
            </div>
            <div class="detail-item">
              <label>状态：</label>
              <el-tag :type="getStatusTagType(currentOrderDetail.status)">
                {{ getStatusText(currentOrderDetail.status) }}
              </el-tag>
            </div>
            <div class="detail-item">
              <label>创建时间：</label>
              <span>{{ formatDateTime(currentOrderDetail.createdAt) }}</span>
            </div>
          </div>
        </div>
        
        <div class="detail-section" v-if="currentOrderDetail.screenshots?.length">
          <h4>截图记录</h4>
          <div class="screenshots-grid">
            <div 
              v-for="(screenshot, index) in currentOrderDetail.screenshots" 
              :key="index"
              class="screenshot-item"
            >
              <img :src="screenshot.url" :alt="screenshot.type" />
              <p>{{ screenshot.type === 'accept' ? '接单截图' : '完成截图' }}</p>
              <p>{{ formatDateTime(screenshot.uploadedAt) }}</p>
            </div>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { ref, computed, onMounted, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { Search, Refresh } from '@element-plus/icons-vue'

export default {
  name: 'EmployeeWorkRecords',
  components: {
    Search,
    Refresh
  },
  props: {
    employeeId: {
      type: Number,
      required: true
    },
    employee: {
      type: Object,
      default: null
    }
  },
  emits: ['refresh'],
  setup(props, { emit }) {
    // 响应式数据
    const statusFilter = ref('')
    const dateRange = ref([])
    const isLoading = ref(false)
    const isUploading = ref(false)
    
    // 对话框状态
    const acceptScreenshotVisible = ref(false)
    const completeScreenshotVisible = ref(false)
    const continueOrderVisible = ref(false)
    const orderDetailVisible = ref(false)
    const currentOrder = ref(null)
    const currentOrderDetail = ref(null)
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
    
    // 模拟工作记录数据
    const mockWorkRecords = ref([
      {
        id: 1,
        orderNumber: 'ORD-2023-001',
        customerName: '张三',
        game: '王者荣耀',
        serviceType: '技术陪练',
        status: 'pending',
        createdAt: '2023-12-01T10:00:00Z',
        completedAt: null,
        screenshots: []
      },
      {
        id: 2,
        orderNumber: 'ORD-2023-002',
        customerName: '李四',
        game: '和平精英',
        serviceType: '娱乐陪玩',
        status: 'in_progress',
        createdAt: '2023-12-01T11:00:00Z',
        completedAt: null,
        screenshots: [
          {
            type: 'accept',
            url: 'https://picsum.photos/200/150?random=1',
            uploadedAt: '2023-12-01T11:30:00Z'
          }
        ]
      },
      {
        id: 3,
        orderNumber: 'ORD-2023-003',
        customerName: '王五',
        game: '英雄联盟',
        serviceType: '代练',
        status: 'completed',
        createdAt: '2023-12-01T09:00:00Z',
        completedAt: '2023-12-01T12:00:00Z',
        screenshots: [
          {
            type: 'accept',
            url: 'https://picsum.photos/200/150?random=2',
            uploadedAt: '2023-12-01T09:30:00Z'
          },
          {
            type: 'complete',
            url: 'https://picsum.photos/200/150?random=3',
            uploadedAt: '2023-12-01T11:45:00Z'
          }
        ]
      }
    ])
    
    // 计算属性
    const workRecordList = computed(() => {
      let filtered = mockWorkRecords.value
      
      // 状态筛选
      if (statusFilter.value) {
        filtered = filtered.filter(record => record.status === statusFilter.value)
      }
      
      // 日期筛选
      if (dateRange.value && dateRange.value.length === 2) {
        const [startDate, endDate] = dateRange.value
        filtered = filtered.filter(record => {
          const recordDate = new Date(record.createdAt).toISOString().split('T')[0]
          return recordDate >= startDate && recordDate <= endDate
        })
      }
      
      return filtered
    })
    
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
    
    const handleFilterChange = () => {
      // 筛选变化处理
    }
    
    const handleSearch = () => {
      // 搜索处理
    }
    
    const handleRefresh = () => {
      // 刷新处理
      emit('refresh')
    }
    
    const handleSortChange = ({ prop, order }) => {
      sortConfig.prop = prop
      sortConfig.order = order
      // 排序处理
    }
    
    const handlePageChange = (page) => {
      pagination.page = page
    }
    
    const handlePageSizeChange = (pageSize) => {
      pagination.pageSize = pageSize
      pagination.page = 1
    }
    
    // 上传接单截图
    const uploadAcceptScreenshot = (order) => {
      currentOrder.value = order
      acceptScreenshotVisible.value = true
    }
    
    // 上传完成截图
    const uploadCompleteScreenshot = (order) => {
      currentOrder.value = order
      completeScreenshotVisible.value = true
    }
    
    // 续单确认
    const continueOrder = (order) => {
      currentOrder.value = order
      continueOrderVisible.value = true
    }
    
    // 查看工单详情
    const viewOrderDetail = (order) => {
      currentOrderDetail.value = order
      orderDetailVisible.value = true
    }
    
    // 处理接单文件变化
    const handleAcceptFileChange = (file) => {
      acceptFile.value = file
    }
    
    // 处理完成文件变化
    const handleCompleteFileChange = (file) => {
      completeFile.value = file
    }
    
    // 提交接单截图
    const submitAcceptScreenshot = async () => {
      if (!acceptFile.value) {
        ElMessage.warning('请选择接单截图')
        return
      }
      
      isUploading.value = true
      try {
        await new Promise(resolve => setTimeout(resolve, 2000))
        
        // 更新工单状态
        const order = mockWorkRecords.value.find(r => r.id === currentOrder.value.id)
        if (order) {
          order.status = 'in_progress'
          order.screenshots.push({
            type: 'accept',
            url: URL.createObjectURL(acceptFile.value.raw),
            uploadedAt: new Date().toISOString()
          })
        }
        
        ElMessage.success('接单成功，工单状态已更新为进行中')
        acceptScreenshotVisible.value = false
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
    
    // 提交完成截图
    const submitCompleteScreenshot = async () => {
      if (!completeFile.value) {
        ElMessage.warning('请选择完成截图')
        return
      }
      
      isUploading.value = true
      try {
        await new Promise(resolve => setTimeout(resolve, 2000))
        
        // 更新工单状态
        const order = mockWorkRecords.value.find(r => r.id === currentOrder.value.id)
        if (order) {
          order.status = 'pending_audit'
          order.screenshots.push({
            type: 'complete',
            url: URL.createObjectURL(completeFile.value.raw),
            uploadedAt: new Date().toISOString()
          })
        }
        
        ElMessage.success('工单已提交审核')
        completeScreenshotVisible.value = false
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
    
    // 开始续单
    const startContinueOrder = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        ElMessage.success('续单已创建，请上传新的接单截图')
        continueOrderVisible.value = false
        
        // 直接打开接单截图对话框
        acceptScreenshotVisible.value = true
      } catch (error) {
        ElMessage.error('续单失败：' + error.message)
      }
    }
    
    // 结束工单
    const finishOrder = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        ElMessage.success('工单已结束')
        continueOrderVisible.value = false
        emit('refresh')
      } catch (error) {
        ElMessage.error('操作失败：' + error.message)
      }
    }
    
    return {
      // 响应式数据
      statusFilter,
      dateRange,
      isLoading,
      isUploading,
      acceptScreenshotVisible,
      completeScreenshotVisible,
      continueOrderVisible,
      orderDetailVisible,
      currentOrder,
      currentOrderDetail,
      acceptUploadRef,
      completeUploadRef,
      pagination,
      
      // 计算属性
      workRecordList,
      
      // 方法
      getStatusTagType,
      getStatusText,
      formatDateTime,
      handleFilterChange,
      handleSearch,
      handleRefresh,
      handleSortChange,
      handlePageChange,
      handlePageSizeChange,
      uploadAcceptScreenshot,
      uploadCompleteScreenshot,
      continueOrder,
      viewOrderDetail,
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
.employee-work-records {
  padding: 20px;
}

.actions-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 16px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
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
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.pagination-wrapper {
  margin-top: 20px;
  text-align: right;
}

/* 对话框样式 */
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

.order-detail-content {
  max-height: 500px;
  overflow-y: auto;
}

.detail-section {
  margin-bottom: 24px;
}

.detail-section h4 {
  margin: 0 0 16px 0;
  color: #303133;
  font-size: 16px;
  font-weight: 600;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.detail-item label {
  font-weight: 500;
  color: #606266;
  min-width: 80px;
}

.screenshots-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}

.screenshot-item {
  text-align: center;
}

.screenshot-item img {
  width: 100%;
  max-width: 200px;
  height: 150px;
  object-fit: cover;
  border-radius: 6px;
  border: 1px solid #e4e7ed;
}

.screenshot-item p {
  margin: 8px 0 4px 0;
  font-size: 12px;
  color: #909399;
}

/* 响应式设计 */
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
  
  .detail-grid {
    grid-template-columns: 1fr;
  }
  
  .screenshots-grid {
    grid-template-columns: 1fr;
  }
}
</style>
