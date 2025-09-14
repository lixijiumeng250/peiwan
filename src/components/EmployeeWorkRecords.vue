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
          <el-option label="待接单" value="PENDING_ACCEPTANCE" />
          <el-option label="进行中" value="IN_PROGRESS" />
          <el-option label="待审核" value="PENDING_AUDIT" />
          <el-option label="已结单" value="COMPLETED" />
          <el-option label="未通过" value="REJECTED" />
          <el-option label="重新审核中" value="REJECTED_TO_SUBMIT" />
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
          min-width="120"
          sortable="custom"
        />
        <el-table-column
          prop="customerName"
          label="委托人"
          min-width="120"
        />
        <el-table-column
          prop="game"
          label="游戏类型"
          min-width="120"
        />
        <el-table-column
          prop="playStyle"
          label="陪玩类型"
          min-width="120"
        >
          <template #default="scope">
            {{ getPlayStyleLabel(scope.row.playStyle) }}
          </template>
        </el-table-column>
        <el-table-column
          prop="serviceType"
          label="服务类型"
          min-width="120"
        >
          <template #default="scope">
            {{ getServiceTypeLabel(scope.row.serviceType) }}
          </template>
        </el-table-column>
        <el-table-column
          prop="status"
          label="完成状态"
          min-width="120"
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
          min-width="160"
          sortable="custom"
        >
          <template #default="scope">
            {{ formatDateTime(scope.row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column
          prop="completedAt"
          label="完成时间"
          min-width="160"
        >
          <template #default="scope">
            {{ scope.row.completedAt ? formatDateTime(scope.row.completedAt) : '-' }}
          </template>
        </el-table-column>
        <el-table-column
          label="操作"
          min-width="240"
          fixed="right"
        >
          <template #default="scope">
            <!-- 客服/管理员 只读操作 -->
            <template v-if="userRole?.toUpperCase() === 'CS' || userRole?.toUpperCase() === 'ADMIN'">
              <!-- 只显示查看详情按钮 -->
              <el-button
                size="small"
                @click="viewOrderDetail(scope.row)"
              >
                查看详情
              </el-button>
            </template>
            
            <!-- 员工角色的操作 -->
            <template v-else>
              <!-- 待接单状态：上传接单截图 -->
              <el-button
                v-if="scope.row.status === 'PENDING_ACCEPTANCE'"
                type="primary"
                size="small"
                @click="uploadAcceptScreenshot(scope.row)"
              >
                接单
              </el-button>
              
              <!-- 进行中状态：上传完成截图 -->
              <el-button
                v-if="scope.row.status === 'IN_PROGRESS'"
                type="success"
                size="small"
                @click="uploadCompleteScreenshot(scope.row)"
              >
                完成
              </el-button>
              
              <!-- 已结单状态：续单 -->
              <template v-if="scope.row.status === 'COMPLETED'">
                <el-button
                  type="warning"
                  size="small"
                  @click="showContinueOrderDialog(scope.row)"
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
              
              <!-- 被拒绝状态：重新提交 -->
              <template v-if="scope.row.status === 'REJECTED'">
                <el-button
                  type="danger"
                  size="small"
                  @click="reuploadScreenshots(scope.row)"
                >
                  重新提交
                </el-button>
                <el-button
                  size="small"
                  @click="viewOrderDetail(scope.row)"
                >
                  详情
                </el-button>
              </template>
              
              <!-- 待审核状态和重新审核状态：查看详情 -->
              <el-button
                v-if="['PENDING_AUDIT', 'REJECTED_TO_SUBMIT', 'RESUBMITTING'].includes(scope.row.status)"
                size="small"
                @click="viewOrderDetail(scope.row)"
              >
                详情
              </el-button>
            </template>
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
      width="600px"
      class="accept-dialog"
    >
      <div v-if="currentOrder" class="accept-content">
        <!-- 工单基本信息 -->
        <div class="order-info-section">
          <h4 class="section-title">工单信息</h4>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">单号：</span>
              <span class="info-value">{{ currentOrder.orderNumber || currentOrder.id }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">委托人：</span>
              <span class="info-value">{{ currentOrder.customerName }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">游戏类型：</span>
              <span class="info-value">{{ currentOrder.game }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">陪玩类型：</span>
              <span class="info-value">{{ getPlayStyleLabel(currentOrder.playStyle) }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">服务类型：</span>
              <span class="info-value">{{ getServiceTypeLabel(currentOrder.serviceType) }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">状态：</span>
              <el-tag 
                :type="getStatusTagType(currentOrder.status)" 
                size="small"
              >
                {{ getStatusText(currentOrder.status) }}
              </el-tag>
            </div>
          </div>
        </div>

        <!-- 图片资料区域 -->
        <div class="screenshots-section">
          <h4 class="section-title">图片资料</h4>
          <div class="screenshot-grid">
            <!-- 派单图片 -->
            <div class="screenshot-container">
              <div class="screenshot-box">
                <div class="screenshot-title">派单图片</div>
                <div class="screenshot-placeholder" v-if="!getOrderInfoScreenshotForDialog(currentOrder)">
                  <el-icon class="placeholder-icon"><Picture /></el-icon>
                  <span>暂无派单图片</span>
                </div>
                <img 
                  v-else
                  :src="getPreviewUrl(getOrderInfoScreenshotForDialog(currentOrder))" 
                  alt="派单图片"
                  @click="previewImage(getOrderInfoScreenshotForDialog(currentOrder))"
                  class="screenshot-image"
                />
              </div>
            </div>
            
            <!-- 接单图片 -->
            <div class="screenshot-container">
              <div class="screenshot-box">
                <div class="screenshot-title">接单图片</div>
                <div class="screenshot-placeholder" v-if="!acceptFile">
                  <el-upload
                    ref="acceptUploadRef"
                    :auto-upload="false"
                    :limit="1"
                    accept="image/*"
                    :on-change="handleAcceptFileChange"
                    :show-file-list="false"
                    class="screenshot-uploader"
                  >
                    <div 
                      class="upload-content enhanced-upload-area"
                      @dragover.prevent="handleAcceptDragOver"
                      @dragleave.prevent="handleAcceptDragLeave"
                      @drop.prevent="handleDropAccept"
                      @paste.prevent="handleAcceptPasteEvent"
                      @mouseenter="handleAcceptMouseEnter"
                      @mouseleave="handleAcceptMouseLeave"
                      :class="{ 'drag-over': isDragOverAccept }"
                      ref="acceptUploadArea"
                      tabindex="0"
                    >
                      <el-icon class="upload-icon"><Plus /></el-icon>
                      <div class="upload-text">
                        <p>点击上传接单图片</p>
                        <p class="upload-tip">支持：点击选择 | 拖拽上传 | 粘贴</p>
                        <p class="upload-tip">jpg/png文件，不超过2MB</p>
                      </div>
                    </div>
                  </el-upload>
                </div>
                <div v-else class="screenshot-uploaded">
                  <img 
                    :src="acceptFileUrl" 
                    alt="接单图片"
                    class="screenshot-image"
                    @click="previewAcceptImage"
                  />
                  <div class="screenshot-actions">
                    <el-button 
                      type="primary" 
                      size="small" 
                      text
                      @click.stop="previewAcceptImage"
                    >
                      预览
                    </el-button>
                    <el-button 
                      type="danger" 
                      size="small" 
                      text
                      @click.stop="removeAcceptFile"
                    >
                      删除
                    </el-button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="acceptScreenshotVisible = false">取消</el-button>
          <el-button 
            type="primary" 
            @click="submitAcceptScreenshot"
            :loading="isUploading"
            :disabled="!acceptFile"
          >
            确认接单
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 上传完成截图对话框 -->
    <el-dialog
      v-model="completeScreenshotVisible"
      title="上传完成截图"
      width="600px"
      class="complete-dialog"
    >
      <div v-if="currentOrder" class="complete-content">
        <!-- 工单基本信息 -->
        <div class="order-info-section">
          <h4 class="section-title">工单信息</h4>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">单号：</span>
              <span class="info-value">{{ currentOrder.orderNumber || currentOrder.id }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">委托人：</span>
              <span class="info-value">{{ currentOrder.customerName }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">游戏类型：</span>
              <span class="info-value">{{ currentOrder.game }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">陪玩类型：</span>
              <span class="info-value">{{ getPlayStyleLabel(currentOrder.playStyle) }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">服务类型：</span>
              <span class="info-value">{{ getServiceTypeLabel(currentOrder.serviceType) }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">状态：</span>
              <el-tag 
                :type="getStatusTagType(currentOrder.status)" 
                size="small"
              >
                {{ getStatusText(currentOrder.status) }}
              </el-tag>
            </div>
          </div>
        </div>

        <!-- 图片资料区域 -->
        <div class="screenshots-section">
          <h4 class="section-title">图片资料</h4>
          <div class="screenshot-grid three-columns">
            <!-- 派单图片 -->
            <div class="screenshot-container">
              <div class="screenshot-box">
                <div class="screenshot-title">派单图片</div>
                <div class="screenshot-placeholder" v-if="!getOrderInfoScreenshotForDialog(currentOrder)">
                  <el-icon class="placeholder-icon"><Picture /></el-icon>
                  <span>暂无派单图片</span>
                </div>
                <img 
                  v-else
                  :src="getPreviewUrl(getOrderInfoScreenshotForDialog(currentOrder))" 
                  alt="派单图片"
                  @click="previewImage(getOrderInfoScreenshotForDialog(currentOrder))"
                  class="screenshot-image"
                />
              </div>
            </div>
            
            <!-- 接单图片 -->
            <div class="screenshot-container">
              <div class="screenshot-box">
                <div class="screenshot-title">接单图片</div>
                <div class="screenshot-placeholder" v-if="!getAcceptScreenshotForDialog(currentOrder)">
                  <el-icon class="placeholder-icon"><Picture /></el-icon>
                  <span>暂无接单图片</span>
                </div>
                <img 
                  v-else
                  :src="getPreviewUrl(getAcceptScreenshotForDialog(currentOrder))" 
                  alt="接单图片"
                  @click="previewImage(getAcceptScreenshotForDialog(currentOrder))"
                  class="screenshot-image"
                />
              </div>
            </div>
            
            <!-- 完成图片 -->
            <div class="screenshot-container">
              <div class="screenshot-box">
                <div class="screenshot-title">完成图片</div>
                <div class="screenshot-placeholder" v-if="!completeFile">
                  <el-upload
                    ref="completeUploadRef"
                    :auto-upload="false"
                    :limit="1"
                    accept="image/*"
                    :on-change="handleCompleteFileChange"
                    :show-file-list="false"
                    class="screenshot-uploader"
                  >
                    <div 
                      class="upload-content enhanced-upload-area"
                      @dragover.prevent="handleDragOver"
                      @dragleave.prevent="handleDragLeave"
                      @drop.prevent="handleDropComplete"
                      @paste.prevent="handleCompletePasteEvent"
                      @mouseenter="handleCompleteMouseEnter"
                      @mouseleave="handleCompleteMouseLeave"
                      :class="{ 'drag-over': isDragOverComplete }"
                      ref="completeUploadArea"
                      tabindex="0"
                    >
                      <el-icon class="upload-icon"><Plus /></el-icon>
                      <div class="upload-text">
                        <p>点击上传完成图片</p>
                        <p class="upload-tip">支持：点击选择 | 拖拽上传 | 粘贴</p>
                        <p class="upload-tip">jpg/png文件，不超过2MB</p>
                      </div>
                    </div>
                  </el-upload>
                </div>
                <div v-else class="screenshot-uploaded">
                  <img 
                    :src="completeFileUrl" 
                    alt="完成图片"
                    class="screenshot-image"
                    @click="previewCompleteImage"
                  />
                  <div class="screenshot-actions">
                    <el-button 
                      type="primary" 
                      size="small" 
                      text
                      @click.stop="previewCompleteImage"
                    >
                      预览
                    </el-button>
                    <el-button 
                      type="danger" 
                      size="small" 
                      text
                      @click.stop="removeCompleteFile"
                    >
                      删除
                    </el-button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="completeScreenshotVisible = false">取消</el-button>
          <el-button 
            type="primary" 
            @click="submitCompleteScreenshot"
            :loading="isUploading"
            :disabled="!completeFile"
          >
            提交完成
          </el-button>
        </div>
      </template>
    </el-dialog>


    <!-- 续单确认对话框 -->
    <el-dialog
      v-model="continueOrderVisible"
      title="续单确认"
      width="600px"
      class="continue-dialog"
    >
      <div v-if="currentOrder" class="continue-content">
        <!-- 工单基本信息 -->
        <div class="order-info-section">
          <h4 class="section-title">工单信息</h4>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">单号：</span>
              <span class="info-value">{{ currentOrder.orderNumber || currentOrder.id }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">委托人：</span>
              <span class="info-value">{{ currentOrder.customerName }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">游戏类型：</span>
              <span class="info-value">{{ currentOrder.game }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">陪玩类型：</span>
              <span class="info-value">{{ getPlayStyleLabel(currentOrder.playStyle) }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">服务类型：</span>
              <span class="info-value">{{ getServiceTypeLabel(currentOrder.serviceType) }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">状态：</span>
              <el-tag 
                :type="getStatusTagType(currentOrder.status)" 
                size="small"
              >
                {{ getStatusText(currentOrder.status) }}
              </el-tag>
            </div>
          </div>
        </div>
      </div>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="continueOrderVisible = false">否</el-button>
          <el-button 
            type="primary" 
            @click="confirmContinueOrder"
          >
            是
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 重新上传截图对话框 -->
    <el-dialog
      v-model="reuploadScreenshotVisible"
      title="重新上传截图"
      width="800px"
      class="reupload-dialog"
    >
      <div v-if="currentOrder" class="reupload-content">
        <!-- 工单基本信息 -->
        <div class="order-info-section">
          <h4 class="section-title">工单信息</h4>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">单号：</span>
              <span class="info-value">{{ currentOrder.orderNumber || currentOrder.id }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">委托人：</span>
              <span class="info-value">{{ currentOrder.customerName }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">游戏类型：</span>
              <span class="info-value">{{ currentOrder.game }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">陪玩类型：</span>
              <span class="info-value">{{ getPlayStyleLabel(currentOrder.playStyle) }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">服务类型：</span>
              <span class="info-value">{{ getServiceTypeLabel(currentOrder.serviceType) }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">状态：</span>
              <el-tag 
                :type="getStatusTagType(currentOrder.status)" 
                size="small"
              >
                {{ getStatusText(currentOrder.status) }}
              </el-tag>
            </div>
          </div>
        </div>

        <!-- 拒绝原因显示 -->
        <div class="reject-reason-section" v-if="currentOrder.auditComments">
          <h4 class="section-title">拒绝原因</h4>
          <el-alert
            :title="currentOrder.auditComments || '客服未提供拒绝原因'"
            type="warning"
            :closable="false"
            show-icon
          />
        </div>

        <!-- 图片资料区域 -->
        <div class="screenshots-section">
          <h4 class="section-title">图片资料</h4>
          <div class="screenshot-grid three-columns">
            <!-- 派单图片 -->
            <div class="screenshot-container">
              <div class="screenshot-box">
                <div class="screenshot-title">派单图片</div>
                <div class="screenshot-placeholder" v-if="!getOrderInfoScreenshotForDialog(currentOrder)">
                  <el-icon class="placeholder-icon"><Picture /></el-icon>
                  <span>暂无派单图片</span>
                </div>
                <img 
                  v-else
                  :src="getPreviewUrl(getOrderInfoScreenshotForDialog(currentOrder))" 
                  alt="派单图片"
                  @click="previewImage(getOrderInfoScreenshotForDialog(currentOrder))"
                  class="screenshot-image"
                />
              </div>
            </div>

            <!-- 接单图片 -->
            <div class="screenshot-container">
              <div class="screenshot-box">
                <div class="screenshot-title">接单图片</div>
                <div class="screenshot-placeholder" v-if="!getAcceptScreenshotForDialog(currentOrder)">
                  <el-icon class="placeholder-icon"><Picture /></el-icon>
                  <span>暂无接单图片</span>
                </div>
                <img 
                  v-else
                  :src="getPreviewUrl(getAcceptScreenshotForDialog(currentOrder))" 
                  alt="接单图片"
                  @click="previewImage(getAcceptScreenshotForDialog(currentOrder))"
                  class="screenshot-image"
                />
              </div>
            </div>
            
            <!-- 完成图片 -->
            <div class="screenshot-container">
              <div class="screenshot-box">
                <div class="screenshot-title">完成图片</div>
                <div class="screenshot-placeholder" v-if="!reuploadCompleteFile">
                  <el-upload
                    ref="reuploadCompleteUploadRef"
                    :auto-upload="false"
                    :limit="1"
                    accept="image/*"
                    :on-change="handleReuploadCompleteFileChange"
                    :show-file-list="false"
                    class="screenshot-uploader"
                  >
                    <div 
                      class="upload-area enhanced-upload-area"
                      @dragover.prevent="handleReuploadCompleteDragOver"
                      @dragleave.prevent="handleReuploadCompleteDragLeave"
                      @drop.prevent="handleReuploadCompleteDrop"
                      @paste.prevent="handleReuploadCompletePasteEvent"
                      @mouseenter="handleReuploadCompleteMouseEnter"
                      @mouseleave="handleReuploadCompleteMouseLeave"
                      :class="{ 'drag-over': isDragOverReuploadComplete }"
                      ref="reuploadCompleteUploadArea"
                      tabindex="0"
                    >
                      <el-icon class="upload-icon"><Plus /></el-icon>
                      <div class="upload-text">
                        <p>点击重新上传完成图片</p>
                        <p class="upload-tip">支持：点击选择 | 拖拽上传 | 粘贴</p>
                        <p class="upload-tip">jpg/png文件，不超过2MB</p>
                      </div>
                    </div>
                  </el-upload>
                </div>
                <div v-else class="upload-preview">
                  <img 
                    :src="reuploadCompleteFileUrl" 
                    alt="完成图片"
                    class="screenshot-image"
                    @click="previewReuploadCompleteImage"
                  />
                  <div class="preview-actions">
                    <el-button 
                      type="primary" 
                      size="small" 
                      text
                      @click.stop="previewReuploadCompleteImage"
                    >
                      预览
                    </el-button>
                    <el-button 
                      type="danger" 
                      size="small" 
                      text
                      @click.stop="removeReuploadCompleteFile"
                    >
                      删除
                    </el-button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 提示信息 -->
        <div class="tips-section">
          <el-alert
            title="重新提交说明"
            type="info"
            :closable="false"
            show-icon
          >
            <template #default>
              <ul class="tips-list">
                <li>派单图片和接单图片为历史记录，无需重新上传</li>
                <li>上传完成图片后工单状态将变为"重新审核中"</li>
              </ul>
            </template>
          </el-alert>
        </div>
      </div>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="reuploadScreenshotVisible = false">取消</el-button>
          <el-button 
            type="danger" 
            @click="submitReuploadScreenshots"
            :loading="isReUploading"
            :disabled="!reuploadCompleteFile"
          >
            重新提交审核
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 工单详情对话框 -->
    <el-dialog
      v-model="orderDetailVisible"
      title="工单详情"
      width="800px"
      class="audit-dialog"
    >
      <div v-if="currentOrderDetail" class="audit-content">
        <!-- 工单基本信息 -->
        <div class="order-info-section">
          <h4 class="section-title">基本信息</h4>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">单号：</span>
              <span class="info-value">{{ currentOrderDetail.orderNumber || currentOrderDetail.id }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">委托人：</span>
              <span class="info-value">{{ currentOrderDetail.customerName }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">游戏类型：</span>
              <span class="info-value">{{ currentOrderDetail.game }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">陪玩类型：</span>
              <span class="info-value">{{ getPlayStyleLabel(currentOrderDetail.playStyle) }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">服务类型：</span>
              <span class="info-value">{{ getServiceTypeLabel(currentOrderDetail.serviceType) }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">状态：</span>
              <el-tag 
                :type="getStatusTagType(currentOrderDetail.status)" 
                size="small"
              >
                {{ getStatusText(currentOrderDetail.status) }}
              </el-tag>
            </div>
          </div>
        </div>

        <!-- 截图区域 -->
        <div class="screenshots-section">
          <h4 class="section-title">图片资料</h4>
          <div class="screenshot-grid">
            <div class="screenshot-container">
              <div class="screenshot-box">
                <div class="screenshot-title">派单图片</div>
                <div class="screenshot-placeholder" v-if="!getOrderInfoScreenshot()">
                  <el-icon class="placeholder-icon"><Picture /></el-icon>
                  <span>暂无派单图片</span>
                </div>
                <img 
                  v-else
                  :src="getPreviewUrl(getOrderInfoScreenshot())" 
                  alt="派单图片"
                  @click="previewImage(getOrderInfoScreenshot())"
                  class="screenshot-image"
                />
              </div>
            </div>
            
            <div class="screenshot-container">
              <div class="screenshot-box">
                <div class="screenshot-title">接单图片</div>
                <div class="screenshot-placeholder" v-if="!getAcceptScreenshot()">
                  <el-icon class="placeholder-icon"><Picture /></el-icon>
                  <span>暂无接单图片</span>
                </div>
                <img 
                  v-else
                  :src="getPreviewUrl(getAcceptScreenshot())" 
                  alt="接单图片"
                  @click="previewImage(getAcceptScreenshot())"
                  class="screenshot-image"
                />
              </div>
            </div>
            
            <div class="screenshot-container">
              <div class="screenshot-box">
                <div class="screenshot-title">完成图片</div>
                <div class="screenshot-placeholder" v-if="!getCompleteScreenshot()">
                  <el-icon class="placeholder-icon"><Picture /></el-icon>
                  <span>暂无完成图片</span>
                </div>
                <img 
                  v-else
                  :src="getPreviewUrl(getCompleteScreenshot())" 
                  alt="完成图片"
                  @click="previewImage(getCompleteScreenshot())"
                  class="screenshot-image"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- 审核区域 (仅客服/管理员可见且工单状态为待审核或重新审核时) -->
        <div 
          v-if="(userRole?.toUpperCase() === 'CS' || userRole?.toUpperCase() === 'ADMIN') && ['PENDING_AUDIT', 'REJECTED_TO_SUBMIT', 'RESUBMITTING'].includes(currentOrderDetail?.status)" 
          class="audit-section"
        >
          <div class="audit-container">
            <h4 class="section-title">审核操作</h4>
            <div class="audit-buttons">
              <el-button 
                type="success" 
                size="large"
                @click="handleAuditApprove"
                class="audit-btn approve-btn"
              >
                <el-icon><Check /></el-icon>
                <span>{{ getApproveButtonText(currentOrderDetail?.status) }}</span>
              </el-button>
              <el-button 
                type="danger" 
                size="large"
                @click="handleAuditReject"
                class="audit-btn reject-btn"
              >
                <el-icon><Close /></el-icon>
                <span>{{ getRejectButtonText(currentOrderDetail?.status) }}</span>
              </el-button>
            </div>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { ref, computed, onMounted, onActivated, onUnmounted, watch, reactive, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { Search, Refresh, Picture, Check, Close, Plus } from '@element-plus/icons-vue'
import { getAssignedOrders, acceptOrder, completeOrder, renewOrder, getEmployeeOrdersForCS, getEmployeeOrdersForAdmin } from '../api/employee'
import { getOrders, auditOrder, getEmployeeOrders } from '../api/customerService'
import { uploadImage, validateImageFile } from '../api/upload'
import { showImagePreview, getPreviewUrl, getImageInfo } from '../utils/imageViewer'
import { handleApiError } from '../utils/errorHandler'
import { usePolling, POLLING_CONFIG } from '../utils/polling'
import authStore from '../store/auth'

// 包装上传函数以保持一致性
const uploadAcceptImage = uploadImage
const uploadCompleteImage = uploadImage

export default {
  name: 'EmployeeWorkRecords',
  components: {
    Search,
    Refresh,
    Picture,
    Check,
    Close,
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
    }
  },
  emits: ['refresh'],
  setup(props, { emit }) {
    // 轮询管理
    const { startPolling, stopPolling, startOrderSmartPolling } = usePolling()
    
    // 响应式数据
    const statusFilter = ref('')
    const dateRange = ref([])
    const isLoading = ref(false)
    const isUploading = ref(false)
    
    // 用户操作标记，用于避免在用户自己操作时显示"工单已更新"提示
    const userOperationInProgress = ref(false)
    
    // 计算用户角色
    const userRole = computed(() => authStore.getters.userRole.value)
    
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
    const acceptFileUrl = ref(null)
    const completeFile = ref(null)
    const completeFileUrl = ref(null)
    
    // 重新上传相关数据
    const reuploadScreenshotVisible = ref(false)
    const isReUploading = ref(false)
    const reuploadAcceptFile = ref(null)
    const reuploadAcceptFileUrl = ref(null)
    const reuploadCompleteFile = ref(null)
    const reuploadCompleteFileUrl = ref(null)
    const reuploadAcceptUploadRef = ref(null)
    const reuploadCompleteUploadRef = ref(null)
    const reuploadAcceptUploadArea = ref(null)
    const reuploadCompleteUploadArea = ref(null)
    const isDragOverReuploadAccept = ref(false)
    const isDragOverReuploadComplete = ref(false)
    
    // 拖拽功能相关
    const isDragOverComplete = ref(false)
    const completeUploadArea = ref(null)
    
    // 接单截图的拖拽功能
    const isDragOverAccept = ref(false)
    const acceptUploadArea = ref(null)
    
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
    
    // 工作记录数据
    const workRecords = ref([])
    
    // 加载工单数据（带重试机制）
    const loadWorkRecords = async (forceRefresh = false, retryCount = 0) => {
      const maxRetries = 2
      isLoading.value = true
      
      try {
        console.log(`开始加载工作记录，employeeId: ${props.employeeId}, forceRefresh: ${forceRefresh}, retryCount: ${retryCount}`)
        
        // 如果是强制刷新，清除可能的缓存
        if (forceRefresh) {
          workRecords.value = []
        }
        
        // 根据用户角色选择不同的接口
        const userRole = authStore.getters.userRole.value
        let response
        
        if (userRole?.toUpperCase() === 'CS') {
          // 客服角色根据是否指定员工选择不同的接口
          console.log('客服角色 - 检查参数:', {
            userRole: userRole,
            employeeId: props.employeeId,
            employee: props.employee,
            'employee.userId': props.employee?.userId
          })
          
          if (props.employeeId) {
            // 在员工详情页面，使用新的客服获取指定员工工单接口
            console.log('客服角色，查看特定员工工单，调用getEmployeeOrders，员工ID:', props.employeeId)
            response = await getEmployeeOrders(props.employeeId)
          } else {
            // 查看所有工单，使用原有的cs/orders接口（仅在客服主页面）
            console.log('客服角色，查看所有工单，调用getOrders')
            response = await getOrders({})
          }
        } else if (userRole?.toUpperCase() === 'ADMIN') {
          // 管理员角色：使用X-User-Id请求头调用员工工单接口
          if (props.employeeId && props.employee?.userId) {
            console.log('管理员角色，查看特定员工工单，调用getEmployeeOrdersForAdmin，员工userId:', props.employee.userId)
            response = await getEmployeeOrdersForAdmin(props.employee.userId)
          } else {
            console.log('管理员角色，缺少员工userId，返回空数据')
            response = { code: 200, data: [] }
          }
        } else {
          // 员工角色使用原有的 employee 接口
          console.log('员工角色，调用getAssignedOrders')
          response = await getAssignedOrders()
        }
        
        if ((response.code === 0 || response.code === 200) && response.data) {
          console.log('API响应数据:', response.data)
          if (response.data.length > 0) {
            console.log('第一条工单数据结构:', response.data[0])
            console.log('第一条工单的ID字段:', response.data[0].id)
            console.log('第一条工单的orderNumber字段:', response.data[0].orderNumber)
            console.log('第一条工单的状态:', response.data[0].status)
          }
          
          // 处理数据格式，确保字段映射正确
          const processedData = response.data.map(order => {
            let processedOrder = { ...order }
            
            // 确保ID字段一致性 - 统一使用id字段，如果没有id但有orderNumber，则用orderNumber作为id
            if (!processedOrder.id && processedOrder.orderNumber) {
              processedOrder.id = processedOrder.orderNumber
            }
            // 如果有id但没有orderNumber，则用id作为orderNumber
            if (processedOrder.id && !processedOrder.orderNumber) {
              processedOrder.orderNumber = processedOrder.id
            }
            
            // 如果是客服接口返回的数据，可能需要从clientInfo中解析字段
            if (order.clientInfo && !order.customerName) {
              const clientInfo = order.clientInfo
              
              // 解析clientInfo中的信息
              const customerMatch = clientInfo.match(/客户:\s*([^,]+)/)
              const gameMatch = clientInfo.match(/游戏:\s*([^,]+)/)
              const playStyleMatch = clientInfo.match(/陪玩类型:\s*([^,]+)/)
              const serviceTypeMatch = clientInfo.match(/服务类型:\s*([^,]+)/)
              
              processedOrder = {
                ...processedOrder,
                customerName: customerMatch ? customerMatch[1].trim() : '',
                game: gameMatch ? gameMatch[1].trim() : '',
                playStyle: playStyleMatch ? (playStyleMatch[1].trim() === '技术型' ? 'TECHNICAL' : 'ENTERTAINMENT') : '',
                serviceType: serviceTypeMatch ? (serviceTypeMatch[1].trim() === '排位赛' ? 'RANKED' : 'CASUAL') : ''
              }
            }
            
            return processedOrder
          })
          
          workRecords.value = processedData || []
          
          // 调试日志：检查处理后的数据
          if (processedData.length > 0) {
            console.log('处理后的第一条工单数据:', processedData[0])
            console.log('处理后的工单ID:', processedData[0].id)
            console.log('处理后的工单orderNumber:', processedData[0].orderNumber)
            
            // 检查截图相关字段
            console.log('=== 工单截图字段检查 ===')
            console.log('- screenshots:', processedData[0]?.screenshots)
            console.log('- acceptScreenshot:', processedData[0]?.acceptScreenshot)
            console.log('- completeScreenshot:', processedData[0]?.completeScreenshot)
            console.log('- acceptImageUrl:', processedData[0]?.acceptImageUrl)
            console.log('- completeImageUrl:', processedData[0]?.completeImageUrl)
            console.log('- imageUrl:', processedData[0]?.imageUrl)
            console.log('- 所有字段:', Object.keys(processedData[0]))
            console.log('========================')
          }
        } else {
          console.error('获取工单数据失败，响应:', response)
          // 如果响应失败且还有重试次数，则重试
          if (retryCount < maxRetries) {
            console.log(`获取数据失败，进行第 ${retryCount + 1} 次重试...`)
            await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1))) // 递增延迟
            return await loadWorkRecords(forceRefresh, retryCount + 1)
          }
          workRecords.value = []
          pagination.total = 0
          ElMessage.error(response.message || '加载工单失败')
        }
      } catch (error) {
        console.error('加载工单数据失败:', error)
        // 如果出错且还有重试次数，则重试
        if (retryCount < maxRetries) {
          console.log(`加载失败，进行第 ${retryCount + 1} 次重试...`)
          await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1))) // 递增延迟
          return await loadWorkRecords(forceRefresh, retryCount + 1)
        }
        workRecords.value = []
        pagination.total = 0
        
        // 使用新的错误处理函数，静默处理认证错误
        const shouldShowError = handleApiError(error, { 
          component: 'EmployeeWorkRecords',
          action: 'loadWorkRecords'
        })
        
        // 只有在不是认证错误时才显示错误消息
        if (shouldShowError) {
          ElMessage.error(`加载工作记录失败: ${error.message}`)
        }
      } finally {
        isLoading.value = false
      }
    }
    
    // 计算属性
    const workRecordList = computed(() => {
      let filtered = workRecords.value
      
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
      
      // 更新总数
      pagination.total = filtered.length
      
      // 分页处理
      const startIndex = (pagination.page - 1) * pagination.pageSize
      const endIndex = startIndex + pagination.pageSize
      
      return filtered.slice(startIndex, endIndex)
    })
    
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
        'COMPLETED': '已结单',
        'REJECTED': '未通过',
        'REJECTED_TO_SUBMIT': '重新审核中',
        'RESUBMITTING': '重新审核中'
      }
      return statusMap[status] || '未知'
    }
    
    // 获取审核按钮文本
    const getApproveButtonText = (status) => {
      return '通过'
    }
    
    const getRejectButtonText = (status) => {
      return '拒绝'
    }

    const getPlayStyleLabel = (style) => {
      const map = {
        'TECHNICAL': '技术型',
        'ENTERTAINMENT': '娱乐型'
      }
      return map[style] || style || '未设置'
    }

    const getServiceTypeLabel = (type) => {
      const map = {
        'RANKED': '排位赛',
        'CASUAL': '娱乐赛'
      }
      return map[type] || type || '未设置'
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
    
    const handleRefresh = async () => {
      await loadWorkRecords(true) // 强制刷新
      emit('refresh')
    }
    
    // 添加一个方法供父组件调用来刷新数据
    const refreshData = async (forceRefresh = true) => {
      await loadWorkRecords(forceRefresh)
    }
    
    // 开始智能轮询
    const startPollingData = () => {
      // 检查用户角色和员工信息
      const userRole = authStore.getters.userRole.value
      if (userRole?.toUpperCase() === 'ADMIN' && (!props.employeeId || !props.employee?.userId)) {
        console.log('管理员角色但缺少员工信息，跳过工单轮询')
        return
      }
      
      const pollingKey = `employee-orders-${props.employeeId || 'all'}`
      const interval = POLLING_CONFIG.EMPLOYEE_ORDERS * 1000
      
      // 数据获取函数
      const dataFetcher = async () => {
        // 首先检查用户是否已登出
        const isAuthenticated = authStore.getters.isAuthenticated.value
        const isLogoutInProgress = authStore.state.isLogoutInProgress
        
        if (!isAuthenticated || isLogoutInProgress) {
          console.log('🚫 用户已登出或登出进行中，停止轮询数据获取')
          // 立即停止当前轮询
          stopPollingData()
          throw new Error('用户已登出，停止轮询')
        }
        
        console.log('轮询获取工单数据...')
        
        // 根据用户角色选择不同的接口
        const userRole = authStore.getters.userRole.value
        let response
        
        if (userRole?.toUpperCase() === 'CS') {
          // 客服角色
          if (props.employeeId) {
            // 查看特定员工的工单，使用新的客服接口
            response = await getEmployeeOrders(props.employeeId)
          } else {
            // 查看所有工单
            response = await getOrders({})
          }
        } else if (userRole?.toUpperCase() === 'ADMIN') {
          // 管理员角色：使用X-User-Id请求头调用员工工单接口
          if (props.employeeId && props.employee?.userId) {
            response = await getEmployeeOrdersForAdmin(props.employee.userId)
          } else {
            response = { code: 200, data: [] }
          }
        } else {
          // 员工角色
          response = await getAssignedOrders()
        }
        
        if ((response.code === 0 || response.code === 200) && response.data) {
          // 处理数据格式，确保字段映射正确
          const processedData = response.data.map(order => {
            let processedOrder = { ...order }
            
            // 确保ID字段一致性
            if (!processedOrder.id && processedOrder.orderNumber) {
              processedOrder.id = processedOrder.orderNumber
            }
            if (processedOrder.id && !processedOrder.orderNumber) {
              processedOrder.orderNumber = processedOrder.id
            }
            
            // 如果是客服接口返回的数据，可能需要从clientInfo中解析字段
            if (order.clientInfo && !order.customerName) {
              const clientInfo = order.clientInfo
              
              const customerMatch = clientInfo.match(/客户:\s*([^,]+)/)
              const gameMatch = clientInfo.match(/游戏:\s*([^,]+)/)
              const playStyleMatch = clientInfo.match(/陪玩类型:\s*([^,]+)/)
              const serviceTypeMatch = clientInfo.match(/服务类型:\s*([^,]+)/)
              
              processedOrder = {
                ...processedOrder,
                customerName: customerMatch ? customerMatch[1].trim() : '',
                game: gameMatch ? gameMatch[1].trim() : '',
                playStyle: playStyleMatch ? (playStyleMatch[1].trim() === '技术型' ? 'TECHNICAL' : 'ENTERTAINMENT') : '',
                serviceType: serviceTypeMatch ? (serviceTypeMatch[1].trim() === '排位赛' ? 'RANKED' : 'CASUAL') : ''
              }
            }
            
            return processedOrder
          })
          
          return processedData || []
        }
        
        return workRecords.value || []
      }
      
      // 数据变化处理函数
      const onOrderChange = (newData, oldData, changes) => {
        console.log('检测到工单数据变化，更新UI')
        
        if (changes && changes.length > 0 && !userOperationInProgress.value) {
          // 只有在不是用户自己操作时才显示变化通知
          ElMessage.info(`工单数据已更新 (${changes.length}个变化)`)
        }
        
        // 更新工单数据
        workRecords.value = newData
        
        // 触发父组件刷新事件
        if (!userOperationInProgress.value) {
          emit('refresh')
        }
        
        // 重置用户操作标记
        if (userOperationInProgress.value) {
          setTimeout(() => {
            userOperationInProgress.value = false
          }, 1000) // 1秒后重置标记
        }
      }
      
      // 开始智能轮询
      startOrderSmartPolling(pollingKey, dataFetcher, onOrderChange, interval)
      
      console.log(`开始智能轮询工单数据，间隔: ${POLLING_CONFIG.EMPLOYEE_ORDERS}秒`)
    }
    
    // 停止轮询
    const stopPollingData = () => {
      const pollingKey = `employee-orders-${props.employeeId || 'all'}`
      console.log('🛑 EmployeeWorkRecords 停止轮询工单数据')
      
      try {
        stopPolling(pollingKey)
        console.log('✅ 工单轮询已停止:', pollingKey)
      } catch (e) {
        console.warn('⚠️ 停止工单轮询失败:', e)
      }
      
      // 额外保险：如果是特定的员工轮询，也尝试停止通用的轮询key
      if (props.employeeId) {
        try {
          stopPolling('employee-orders-all')
          stopPolling(`employee-orders`)
          console.log('✅ 额外清理了通用工单轮询')
        } catch (e) {
          console.warn('⚠️ 清理通用工单轮询失败:', e)
        }
      }
    }
    
    // 手动刷新数据
    const manualRefresh = async () => {
      try {
        console.log('手动刷新工单数据')
        await loadWorkRecords(true) // 强制刷新并显示加载状态
        ElMessage.success('工单数据已刷新')
        emit('refresh')
      } catch (error) {
        console.warn('手动刷新失败:', error)
        ElMessage.error('刷新失败，请稍后重试')
      }
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
      console.log('点击接单，工单信息:', order)
      console.log('工单ID:', order.id)
      console.log('工单ID类型:', typeof order.id)
      console.log('order对象的所有键:', Object.keys(order))
      console.log('order对象是否有id属性:', order.hasOwnProperty('id'))
      console.log('order对象是否有orderNumber属性:', order.hasOwnProperty('orderNumber'))
      
      // 确保order对象有正确的id字段
      if (!order.id && order.orderNumber) {
        console.log('修复工单ID字段')
        order.id = order.orderNumber
      }
      
      currentOrder.value = order
      acceptScreenshotVisible.value = true
    }
    
    // 上传完成截图
    const uploadCompleteScreenshot = (order) => {
      currentOrder.value = order
      completeScreenshotVisible.value = true
    }
    
    // 显示续单确认对话框
    const showContinueOrderDialog = (order) => {
      currentOrder.value = order
      continueOrderVisible.value = true
    }
    
    // 确认续单
    const confirmContinueOrder = async () => {
      try {
        userOperationInProgress.value = true // 设置用户操作标记
        console.log('开始续单，工单ID:', currentOrder.value.id)
        console.log('续单前工单状态:', currentOrder.value.status)
        
        const response = await renewOrder(currentOrder.value.id)
        console.log('续单API响应:', response)
        
        if (response && (response.code === 0 || response.code === 200 || response.status === 200)) {
          ElMessage.success('续单成功，工单状态已更新为进行中')
          continueOrderVisible.value = false
          
          // 如果API返回了新的工单数据，可以直接更新
          if (response.data) {
            console.log('续单API返回的新工单数据:', response.data)
          }
          
          // 刷新工单列表
          console.log('开始刷新工单列表...')
          await loadWorkRecords(true)
          console.log('工单列表刷新完成')
          emit('refresh')
        } else {
          console.error('续单失败，响应:', response)
          ElMessage.error(response?.message || '续单失败')
        }
      } catch (error) {
        console.error('续单异常:', error)
        const shouldShowError = handleApiError(error, { component: 'EmployeeWorkRecords', action: 'renewOrder' })
        if (shouldShowError) {
          ElMessage.error('续单失败：' + error.message)
        }
      }
    }
    
    // 查看工单详情
    const viewOrderDetail = (order) => {
      console.log('查看工单详情，工单数据:', order)
      console.log('工单截图相关字段检查:')
      console.log('- screenshots:', order?.screenshots)
      console.log('- orderInfoScreenshotUrl:', order?.orderInfoScreenshotUrl)
      console.log('- acceptScreenshotUrl:', order?.acceptScreenshotUrl)
      console.log('- completeScreenshotUrl:', order?.completeScreenshotUrl)
      console.log('- acceptScreenshot:', order?.acceptScreenshot)
      console.log('- completeScreenshot:', order?.completeScreenshot)
      console.log('- acceptImageUrl:', order?.acceptImageUrl)
      console.log('- completeImageUrl:', order?.completeImageUrl)
      console.log('- imageUrl:', order?.imageUrl)
      console.log('- 所有字段:', Object.keys(order))
      
      // 直接使用工单列表中的数据
      currentOrderDetail.value = order
      orderDetailVisible.value = true
    }
    
    // 审核通过
    const approveOrder = async (order) => {
      try {
        userOperationInProgress.value = true // 设置用户操作标记
        await auditOrder(order.id, {
          action: 'APPROVE',
          comments: '审核通过'
        })
        ElMessage.success('工单审核通过')
        await loadWorkRecords(true) // 重新加载数据
        emit('refresh')
      } catch (error) {
        console.error('审核失败:', error)
        const shouldShowError = handleApiError(error, { component: 'EmployeeWorkRecords', action: 'auditOrder' })
        if (shouldShowError) {
          ElMessage.error('审核失败：' + error.message)
        }
      }
    }
    
    // 审核拒绝
    const rejectOrder = async (order) => {
      try {
        userOperationInProgress.value = true // 设置用户操作标记
        await auditOrder(order.id, {
          action: 'REJECT',
          comments: '审核未通过'
        })
        ElMessage.success('工单已拒绝')
        await loadWorkRecords(true) // 重新加载数据
        emit('refresh')
      } catch (error) {
        console.error('审核失败:', error)
        const shouldShowError = handleApiError(error, { component: 'EmployeeWorkRecords', action: 'auditOrder' })
        if (shouldShowError) {
          ElMessage.error('审核失败：' + error.message)
        }
      }
    }
    
    // 获取派单截图（用于工单详情页面）
    const getOrderInfoScreenshot = () => {
      if (!currentOrderDetail.value) return null
      
      console.log('获取派单截图，当前工单详情:', currentOrderDetail.value)
      console.log('orderInfoScreenshotUrl:', currentOrderDetail.value.orderInfoScreenshotUrl)
      
      // 直接使用独立的派单截图字段
      return currentOrderDetail.value.orderInfoScreenshotUrl || null
    }
    
    // 获取派单截图（用于对话框）
    const getOrderInfoScreenshotForDialog = (order) => {
      if (!order) return null
      
      console.log('获取对话框派单截图，当前工单:', order)
      console.log('orderInfoScreenshotUrl:', order.orderInfoScreenshotUrl)
      
      // 直接使用独立的派单截图字段
      return order.orderInfoScreenshotUrl || null
    }
    
    // 获取接单截图（用于对话框）
    const getAcceptScreenshotForDialog = (order) => {
      if (!order) return null
      
      console.log('获取对话框接单截图，当前工单:', order)
      console.log('acceptanceScreenshotUrl:', order.acceptanceScreenshotUrl)
      console.log('acceptScreenshotUrl:', order.acceptScreenshotUrl)
      console.log('acceptImageUrl:', order.acceptImageUrl)
      
      // 尝试多个可能的接单截图字段名称
      return order.acceptanceScreenshotUrl || order.acceptScreenshotUrl || order.acceptImageUrl || null
    }
    
    // 获取接单截图
    const getAcceptScreenshot = () => {
      if (!currentOrderDetail.value) return null
      
      console.log('获取接单截图，当前工单详情:', currentOrderDetail.value)
      console.log('acceptanceScreenshotUrl:', currentOrderDetail.value.acceptanceScreenshotUrl)
      
      // 直接使用独立的接单截图字段
      return currentOrderDetail.value.acceptanceScreenshotUrl || null
    }
    
    // 获取完成截图
    const getCompleteScreenshot = () => {
      if (!currentOrderDetail.value) return null
      
      console.log('获取完成截图，当前工单详情:', currentOrderDetail.value)
      console.log('completionScreenshotUrl:', currentOrderDetail.value.completionScreenshotUrl)
      
      // 直接使用独立的完成截图字段
      return currentOrderDetail.value.completionScreenshotUrl || null
    }
    
    // 处理审核通过 (从详情页)
    const handleAuditApprove = async () => {
      try {
        userOperationInProgress.value = true // 设置用户操作标记
        await auditOrder(currentOrderDetail.value.id, {
          action: 'APPROVE',
          comments: '审核通过'
        })
        ElMessage.success('工单审核通过')
        orderDetailVisible.value = false
        await loadWorkRecords(true) // 重新加载数据
        emit('refresh')
      } catch (error) {
        console.error('审核失败:', error)
        const shouldShowError = handleApiError(error, { component: 'EmployeeWorkRecords', action: 'auditOrder' })
        if (shouldShowError) {
          ElMessage.error('审核失败：' + error.message)
        }
      }
    }
    
    // 处理审核拒绝 (从详情页)
    const handleAuditReject = async () => {
      try {
        userOperationInProgress.value = true // 设置用户操作标记
        await auditOrder(currentOrderDetail.value.id, {
          action: 'REJECT',
          comments: '审核未通过'
        })
        ElMessage.success('工单已拒绝')
        orderDetailVisible.value = false
        await loadWorkRecords(true) // 重新加载数据
        emit('refresh')
      } catch (error) {
        console.error('审核失败:', error)
        const shouldShowError = handleApiError(error, { component: 'EmployeeWorkRecords', action: 'auditOrder' })
        if (shouldShowError) {
          ElMessage.error('审核失败：' + error.message)
        }
      }
    }
    
    // 处理接单文件变化
    const handleAcceptFileChange = (file) => {
      const validation = validateImageFile(file.raw)
      if (!validation.valid) {
        ElMessage.warning(validation.message)
        return
      }
      
      // 清理之前的URL
      if (acceptFileUrl.value) {
        URL.revokeObjectURL(acceptFileUrl.value)
      }
      
      acceptFile.value = file
      acceptFileUrl.value = URL.createObjectURL(file.raw)
    }
    
    // 预览接单图片
    const previewAcceptImage = () => {
      if (acceptFileUrl.value) {
        showImagePreview(acceptFileUrl.value)
      }
    }
    
    // 删除接单文件
    const removeAcceptFile = () => {
      if (acceptFileUrl.value) {
        URL.revokeObjectURL(acceptFileUrl.value)
      }
      acceptFile.value = null
      acceptFileUrl.value = null
      // 清空上传组件
      if (acceptUploadRef.value) {
        acceptUploadRef.value.clearFiles()
      }
    }
    
    // 处理接单文件（通用函数）
    const processAcceptImageFile = (file) => {
      const validation = validateImageFile(file)
      if (!validation.valid) {
        ElMessage.warning(validation.message)
        return false
      }
      
      // 清理之前的URL
      if (acceptFileUrl.value) {
        URL.revokeObjectURL(acceptFileUrl.value)
      }
      
      // 创建文件对象
      const fileObj = {
        raw: file,
        name: file.name || `accept_screenshot_${Date.now()}.png`
      }
      
      acceptFile.value = fileObj
      acceptFileUrl.value = URL.createObjectURL(file)
      
      ElMessage.success('接单截图上传成功')
      return true
    }
    
    // 接单截图拖拽处理函数
    const handleAcceptDragOver = (event) => {
      event.preventDefault()
      isDragOverAccept.value = true
    }
    
    const handleAcceptDragLeave = (event) => {
      event.preventDefault()
      if (!event.currentTarget.contains(event.relatedTarget)) {
        isDragOverAccept.value = false
      }
    }
    
    const handleDropAccept = (event) => {
      event.preventDefault()
      isDragOverAccept.value = false
      
      const files = event.dataTransfer.files
      if (files.length === 0) return
      
      const file = files[0]
      if (!file.type.startsWith('image/')) {
        ElMessage.warning('只能上传图片文件')
        return
      }
      
      processAcceptImageFile(file)
    }
    
    // 接单截图键盘事件处理（简化版）
    const handleAcceptKeydown = (event) => {
      // 粘贴功能由@paste事件处理，这里可以保留其他快捷键
    }
    
    // 接单截图传统paste事件处理
    const handleAcceptPasteEvent = (event) => {
      event.preventDefault()
      const items = event.clipboardData?.items
      
      if (!items) {
        ElMessage.warning('无法获取剪贴板内容')
        return
      }
      
      for (let i = 0; i < items.length; i++) {
        const item = items[i]
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile()
          if (file) {
            processAcceptImageFile(file)
            return
          }
        }
      }
      
      ElMessage.warning('剪贴板中没有图片')
    }

    // 接单截图键盘快捷键处理（直接使用传统paste事件）
    const handleAcceptPaste = () => {
      // 不需要额外处理，paste事件会自动触发handleAcceptPasteEvent
    }
    
    // 接单截图鼠标进入上传区域时自动获取焦点
    const handleAcceptMouseEnter = () => {
      if (acceptUploadArea.value) {
        acceptUploadArea.value.focus()
      }
    }

    // 接单截图鼠标离开上传区域时移除焦点
    const handleAcceptMouseLeave = () => {
      if (acceptUploadArea.value) {
        acceptUploadArea.value.blur()
      }
    }
    
    // 处理完成文件变化
    const handleCompleteFileChange = (file) => {
      const validation = validateImageFile(file.raw)
      if (!validation.valid) {
        ElMessage.warning(validation.message)
        return
      }
      
      // 清理之前的URL
      if (completeFileUrl.value) {
        URL.revokeObjectURL(completeFileUrl.value)
      }
      
      completeFile.value = file
      completeFileUrl.value = URL.createObjectURL(file.raw)
    }
    
    // 预览完成图片
    const previewCompleteImage = () => {
      if (completeFileUrl.value) {
        showImagePreview(completeFileUrl.value)
      }
    }
    
    // 删除完成文件
    const removeCompleteFile = () => {
      if (completeFileUrl.value) {
        URL.revokeObjectURL(completeFileUrl.value)
      }
      completeFile.value = null
      completeFileUrl.value = null
      // 清空上传组件
      if (completeUploadRef.value) {
        completeUploadRef.value.clearFiles()
      }
    }
    
    // 处理文件（通用函数）
    const processImageFile = (file) => {
      const validation = validateImageFile(file)
      if (!validation.valid) {
        ElMessage.warning(validation.message)
        return false
      }
      
      // 清理之前的URL
      if (completeFileUrl.value) {
        URL.revokeObjectURL(completeFileUrl.value)
      }
      
      // 创建文件对象
      const fileObj = {
        raw: file,
        name: file.name || `screenshot_${Date.now()}.png`
      }
      
      completeFile.value = fileObj
      completeFileUrl.value = URL.createObjectURL(file)
      
      ElMessage.success('图片上传成功')
      return true
    }
    
    // 拖拽处理函数
    const handleDragOver = (event) => {
      event.preventDefault()
      isDragOverComplete.value = true
    }
    
    const handleDragLeave = (event) => {
      event.preventDefault()
      // 只有当离开整个拖拽区域时才设置为false
      if (!event.currentTarget.contains(event.relatedTarget)) {
        isDragOverComplete.value = false
      }
    }
    
    const handleDropComplete = (event) => {
      event.preventDefault()
      isDragOverComplete.value = false
      
      const files = event.dataTransfer.files
      if (files.length === 0) return
      
      const file = files[0]
      if (!file.type.startsWith('image/')) {
        ElMessage.warning('只能上传图片文件')
        return
      }
      
      processImageFile(file)
    }
    
    // 完成截图键盘事件处理（简化版）
    const handleKeydown = (event) => {
      // 粘贴功能由@paste事件处理，这里可以保留其他快捷键
    }
    
    // 完成截图传统paste事件处理
    const handleCompletePasteEvent = (event) => {
      event.preventDefault()
      const items = event.clipboardData?.items
      
      if (!items) {
        ElMessage.warning('无法获取剪贴板内容')
        return
      }
      
      for (let i = 0; i < items.length; i++) {
        const item = items[i]
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile()
          if (file) {
            processImageFile(file)
            return
          }
        }
      }
      
      ElMessage.warning('剪贴板中没有图片')
    }

    // 完成截图键盘快捷键处理（直接使用传统paste事件）
    const handlePaste = () => {
      // 不需要额外处理，paste事件会自动触发handleCompletePasteEvent
    }
    
    // 完成截图鼠标进入上传区域时自动获取焦点
    const handleCompleteMouseEnter = () => {
      if (completeUploadArea.value) {
        completeUploadArea.value.focus()
      }
    }

    // 完成截图鼠标离开上传区域时移除焦点
    const handleCompleteMouseLeave = () => {
      if (completeUploadArea.value) {
        completeUploadArea.value.blur()
      }
    }
    
    
    // 提交接单截图
    const submitAcceptScreenshot = async () => {
      if (!acceptFile.value) {
        ElMessage.warning('请选择接单截图')
        return
      }
      
      isUploading.value = true
      userOperationInProgress.value = true // 设置用户操作标记
      try {
        // 先上传图片
        console.log('开始上传接单截图...', acceptFile.value.raw)
        console.log('文件名:', acceptFile.value.raw.name)
        console.log('文件大小:', acceptFile.value.raw.size)
        console.log('文件类型:', acceptFile.value.raw.type)
        
        const uploadResult = await uploadImage(acceptFile.value.raw)
        console.log('图片上传完整结果:', JSON.stringify(uploadResult, null, 2))
        
        // 根据API文档，图片URL在response.data字段中
        if (!uploadResult || (uploadResult.code !== 0 && uploadResult.code !== 200)) {
          console.error('图片上传失败，响应码:', uploadResult?.code)
          console.error('错误消息:', uploadResult?.message)
          throw new Error(uploadResult?.message || '图片上传失败')
        }
        
        const imageUrl = uploadResult.data
        console.log('提取的图片URL:', imageUrl)
        console.log('图片URL类型:', typeof imageUrl)
        console.log('图片URL是否为空:', !imageUrl)
        
        if (!imageUrl) {
          throw new Error('图片上传成功但未返回图片URL')
        }
        
        console.log('接单截图上传结果:', uploadResult)
        console.log('接单截图URL:', imageUrl)
        console.log('解析后的预览URL:', getPreviewUrl(imageUrl))
        console.log('准备调用接单API，orderId:', currentOrder.value.id)
        console.log('orderId类型:', typeof currentOrder.value.id)
        console.log('完整的工单对象:', currentOrder.value)
        console.log('工单对象的所有键:', Object.keys(currentOrder.value))
        
        // 调用接单API
        const acceptData = { 
          imageUrl: imageUrl
        }
        console.log('发送接单请求数据:', acceptData)
        await acceptOrder(currentOrder.value.id, acceptData)
        
        ElMessage.success('接单成功，工单状态已更新为进行中')
        acceptScreenshotVisible.value = false
        await loadWorkRecords(true) // 重新加载数据
        emit('refresh')
      } catch (error) {
        const shouldShowError = handleApiError(error, { component: 'EmployeeWorkRecords', action: 'acceptOrder' })
        if (shouldShowError) {
          ElMessage.error('接单失败：' + error.message)
        }
      } finally {
        isUploading.value = false
        // 清理文件和URL
        if (acceptFileUrl.value) {
          URL.revokeObjectURL(acceptFileUrl.value)
        }
        acceptFile.value = null
        acceptFileUrl.value = null
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
      userOperationInProgress.value = true // 设置用户操作标记
      try {
        // 先上传图片
        console.log('开始上传完成截图...', completeFile.value.raw)
        const uploadResult = await uploadCompleteImage(completeFile.value.raw)
        console.log('图片上传结果:', uploadResult)
        
        // 根据API文档，图片URL在response.data字段中
        if (!uploadResult || (uploadResult.code !== 0 && uploadResult.code !== 200)) {
          throw new Error(uploadResult?.message || '图片上传失败')
        }
        
        const imageUrl = uploadResult.data
        if (!imageUrl) {
          throw new Error('图片上传成功但未返回图片URL')
        }
        
        console.log('完成截图上传结果:', uploadResult)
        console.log('完成截图URL:', imageUrl)
        console.log('解析后的预览URL:', getPreviewUrl(imageUrl))
        
        // 调用完成订单API
        const completeData = { 
          imageUrl: imageUrl
        }
        console.log('发送完成请求数据:', completeData)
        await completeOrder(currentOrder.value.id, completeData)
        
        ElMessage.success('工单已提交审核')
        completeScreenshotVisible.value = false
        await loadWorkRecords(true) // 重新加载数据
        emit('refresh')
      } catch (error) {
        const shouldShowError = handleApiError(error, { component: 'EmployeeWorkRecords', action: 'completeOrder' })
        if (shouldShowError) {
          ElMessage.error('提交完成失败：' + error.message)
        }
      } finally {
        isUploading.value = false
        // 清理文件和URL
        if (completeFileUrl.value) {
          URL.revokeObjectURL(completeFileUrl.value)
        }
        completeFile.value = null
        completeFileUrl.value = null
        if (completeUploadRef.value) {
          completeUploadRef.value.clearFiles()
        }
      }
    }
    
    // 重新上传截图
    const reuploadScreenshots = (order) => {
      console.log('重新上传截图，工单信息:', order)
      currentOrder.value = order
      
      // 清理之前的文件
      clearReuploadFiles()
      
      reuploadScreenshotVisible.value = true
    }
    
    // 清理重新上传的文件
    const clearReuploadFiles = () => {
      if (reuploadAcceptFileUrl.value) {
        URL.revokeObjectURL(reuploadAcceptFileUrl.value)
      }
      if (reuploadCompleteFileUrl.value) {
        URL.revokeObjectURL(reuploadCompleteFileUrl.value)
      }
      reuploadAcceptFile.value = null
      reuploadAcceptFileUrl.value = null
      reuploadCompleteFile.value = null
      reuploadCompleteFileUrl.value = null
      
      if (reuploadAcceptUploadRef.value) {
        reuploadAcceptUploadRef.value.clearFiles()
      }
      if (reuploadCompleteUploadRef.value) {
        reuploadCompleteUploadRef.value.clearFiles()
      }
    }
    
    // 重新上传接单图片文件变化处理
    const handleReuploadAcceptFileChange = (file) => {
      const validation = validateImageFile(file.raw)
      if (!validation.valid) {
        ElMessage.error(validation.message)
        return
      }
      
      // 清理之前的URL
      if (reuploadAcceptFileUrl.value) {
        URL.revokeObjectURL(reuploadAcceptFileUrl.value)
      }
      
      reuploadAcceptFile.value = file
      reuploadAcceptFileUrl.value = URL.createObjectURL(file.raw)
    }
    
    // 重新上传完成图片文件变化处理
    const handleReuploadCompleteFileChange = (file) => {
      const validation = validateImageFile(file.raw)
      if (!validation.valid) {
        ElMessage.error(validation.message)
        return
      }
      
      // 清理之前的URL
      if (reuploadCompleteFileUrl.value) {
        URL.revokeObjectURL(reuploadCompleteFileUrl.value)
      }
      
      reuploadCompleteFile.value = file
      reuploadCompleteFileUrl.value = URL.createObjectURL(file.raw)
    }
    
    // 重新上传接单图片预览
    const previewReuploadAcceptImage = () => {
      if (reuploadAcceptFileUrl.value) {
        showImagePreview(reuploadAcceptFileUrl.value)
      }
    }
    
    // 重新上传完成图片预览
    const previewReuploadCompleteImage = () => {
      if (reuploadCompleteFileUrl.value) {
        showImagePreview(reuploadCompleteFileUrl.value)
      }
    }
    
    // 删除重新上传的接单图片
    const removeReuploadAcceptFile = () => {
      if (reuploadAcceptFileUrl.value) {
        URL.revokeObjectURL(reuploadAcceptFileUrl.value)
      }
      reuploadAcceptFile.value = null
      reuploadAcceptFileUrl.value = null
      if (reuploadAcceptUploadRef.value) {
        reuploadAcceptUploadRef.value.clearFiles()
      }
    }
    
    // 删除重新上传的完成图片
    const removeReuploadCompleteFile = () => {
      if (reuploadCompleteFileUrl.value) {
        URL.revokeObjectURL(reuploadCompleteFileUrl.value)
      }
      reuploadCompleteFile.value = null
      reuploadCompleteFileUrl.value = null
      if (reuploadCompleteUploadRef.value) {
        reuploadCompleteUploadRef.value.clearFiles()
      }
    }
    
    // 重新上传接单图片拖拽处理
    const handleReuploadAcceptDragOver = (event) => {
      event.preventDefault()
      isDragOverReuploadAccept.value = true
    }
    
    const handleReuploadAcceptDragLeave = (event) => {
      event.preventDefault()
      isDragOverReuploadAccept.value = false
    }
    
    const handleReuploadAcceptDrop = (event) => {
      event.preventDefault()
      isDragOverReuploadAccept.value = false
      
      const files = event.dataTransfer.files
      if (files.length === 0) return
      
      const file = files[0]
      if (!file.type.startsWith('image/')) {
        ElMessage.warning('只能上传图片文件')
        return
      }
      
      processReuploadAcceptImageFile(file)
    }
    
    const handleReuploadAcceptPasteEvent = (event) => {
      event.preventDefault()
      const clipboardData = event.clipboardData || window.clipboardData
      const items = clipboardData.items

      for (let i = 0; i < items.length; i++) {
        const item = items[i]
        if (item.type.indexOf('image') !== -1) {
          const file = item.getAsFile()
          processReuploadAcceptImageFile(file)
          break
        }
      }
    }
    
    const handleReuploadAcceptMouseEnter = () => {
      if (reuploadAcceptUploadArea.value) {
        reuploadAcceptUploadArea.value.focus()
      }
    }
    
    const handleReuploadAcceptMouseLeave = () => {
      if (reuploadAcceptUploadArea.value) {
        reuploadAcceptUploadArea.value.blur()
      }
    }
    
    // 重新上传完成图片拖拽处理
    const handleReuploadCompleteDragOver = (event) => {
      event.preventDefault()
      isDragOverReuploadComplete.value = true
    }
    
    const handleReuploadCompleteDragLeave = (event) => {
      event.preventDefault()
      isDragOverReuploadComplete.value = false
    }
    
    const handleReuploadCompleteDrop = (event) => {
      event.preventDefault()
      isDragOverReuploadComplete.value = false
      
      const files = event.dataTransfer.files
      if (files.length === 0) return
      
      const file = files[0]
      if (!file.type.startsWith('image/')) {
        ElMessage.warning('只能上传图片文件')
        return
      }
      
      processReuploadCompleteImageFile(file)
    }
    
    const handleReuploadCompletePasteEvent = (event) => {
      event.preventDefault()
      const clipboardData = event.clipboardData || window.clipboardData
      const items = clipboardData.items

      for (let i = 0; i < items.length; i++) {
        const item = items[i]
        if (item.type.indexOf('image') !== -1) {
          const file = item.getAsFile()
          processReuploadCompleteImageFile(file)
          break
        }
      }
    }
    
    const handleReuploadCompleteMouseEnter = () => {
      if (reuploadCompleteUploadArea.value) {
        reuploadCompleteUploadArea.value.focus()
      }
    }
    
    const handleReuploadCompleteMouseLeave = () => {
      if (reuploadCompleteUploadArea.value) {
        reuploadCompleteUploadArea.value.blur()
      }
    }
    
    // 处理重新上传的接单图片文件
    const processReuploadAcceptImageFile = (file) => {
      const validation = validateImageFile(file)
      if (!validation.valid) {
        ElMessage.error(validation.message)
        return
      }
      
      // 清理之前的URL
      if (reuploadAcceptFileUrl.value) {
        URL.revokeObjectURL(reuploadAcceptFileUrl.value)
      }
      
      reuploadAcceptFile.value = { raw: file }
      reuploadAcceptFileUrl.value = URL.createObjectURL(file)
      
      ElMessage.success('接单截图上传成功')
      return true
    }
    
    // 处理重新上传的完成图片文件
    const processReuploadCompleteImageFile = (file) => {
      const validation = validateImageFile(file)
      if (!validation.valid) {
        ElMessage.error(validation.message)
        return
      }
      
      // 清理之前的URL
      if (reuploadCompleteFileUrl.value) {
        URL.revokeObjectURL(reuploadCompleteFileUrl.value)
      }
      
      reuploadCompleteFile.value = { raw: file }
      reuploadCompleteFileUrl.value = URL.createObjectURL(file)
      
      ElMessage.success('完成截图上传成功')
      return true
    }
    
    // 提交重新上传的截图
    const submitReuploadScreenshots = async () => {
      if (!reuploadCompleteFile.value) {
        ElMessage.warning('请上传完成图片')
        return
      }
      
      isReUploading.value = true
      userOperationInProgress.value = true // 设置用户操作标记
      try {
        // 上传完成图片
        console.log('开始重新上传完成截图...', reuploadCompleteFile.value.raw)
        const completeUploadResult = await uploadImage(reuploadCompleteFile.value.raw)
        const completeImageUrl = completeUploadResult.data
        
        if (!completeImageUrl) {
          throw new Error('完成图片上传成功但未返回图片URL')
        }
        
        console.log('完成图片上传成功，URL:', completeImageUrl)
        
        // 调用重新提交API（使用专门的重新提交接口）
        const { resubmitOrder } = await import('../api/employee')
        await resubmitOrder(currentOrder.value.id, { imageUrl: completeImageUrl })
        
        ElMessage.success('完成图片重新上传成功，工单状态已变为重新审核中')
        reuploadScreenshotVisible.value = false
        clearReuploadFiles()
        await loadWorkRecords(true) // 重新加载数据
        emit('refresh')
      } catch (error) {
        const shouldShowError = handleApiError(error, { component: 'EmployeeWorkRecords', action: 'reuploadScreenshots' })
        if (shouldShowError) {
          ElMessage.error('重新上传失败：' + error.message)
        }
      } finally {
        isReUploading.value = false
      }
    }
    
    
    // 预览图片
    const previewImage = (imageUrl) => {
      console.log('预览图片，原始路径:', imageUrl)
      console.log('处理后的路径:', getPreviewUrl(imageUrl))
      showImagePreview(imageUrl)
    }
    
    // 测试图片路径解析功能
    const testImagePathParsing = () => {
      const testPath = "/api/uploads/2025/09/09/66a1c3ce-67e7-4af8-9017-6455a04db1d4.png"
      console.log('=== 图片路径解析测试 ===')
      console.log('测试路径:', testPath)
      console.log('解析后的预览URL:', getPreviewUrl(testPath))
      console.log('图片信息:', getImageInfo(testPath))
      console.log('========================')
    }
    
    // 监听employeeId变化
    watch(() => props.employeeId, async (newEmployeeId, oldEmployeeId) => {
      console.log(`employeeId 变化: ${oldEmployeeId} -> ${newEmployeeId}`)
      if (newEmployeeId !== oldEmployeeId) {
        // 等待DOM更新完成
        await nextTick()
        // 延迟一点时间确保组件完全初始化
        setTimeout(() => {
          loadWorkRecords(true) // 强制刷新
        }, 100)
      }
    }, { immediate: false })

    // 生命周期
    onMounted(async () => {
      console.log('EmployeeWorkRecords onMounted, employeeId:', props.employeeId)
      // 如果是在员工详情页面，等待员工信息加载完成
      if (props.employeeId) {
        console.log('在员工详情页面，等待员工信息加载完成...')
        // 不在这里立即加载，等待 watch 监听器触发
      } else {
        // 在客服主页面，正常加载
        await nextTick()
        setTimeout(() => {
          loadWorkRecords(true)
        }, 50)
      }
      
      // 开始轮询
      setTimeout(() => {
        startPollingData()
      }, 2000) // 延迟2秒开始轮询，避免与初始加载冲突
      
      // 开发环境下测试图片路径解析功能
      if (import.meta.env.DEV) {
        testImagePathParsing()
      }
    })

    // 组件激活时刷新数据（用于keep-alive场景）
    onActivated(async () => {
      console.log('EmployeeWorkRecords onActivated, employeeId:', props.employeeId)
      await nextTick()
      loadWorkRecords(true)
      
      // 重新开始轮询
      startPollingData()
    })
    
    // 组件卸载时停止轮询
    onUnmounted(() => {
      console.log('EmployeeWorkRecords onUnmounted, 停止轮询')
      stopPollingData()
    })

    // 监听员工信息变化，当员工信息加载完成后重新获取工单
    watch(() => props.employee, (newEmployee, oldEmployee) => {
      console.log('EmployeeWorkRecords - watch触发:', { 
        newEmployee, 
        oldEmployee,
        hasUserId: !!newEmployee?.userId,
        employeeId: props.employeeId
      })
      
      // 确保在员工详情页面且员工信息包含userId
      if (props.employeeId && newEmployee && newEmployee.userId) {
        console.log('EmployeeWorkRecords - 员工信息已更新，重新加载工单:', {
          userId: newEmployee.userId,
          realName: newEmployee.realName
        })
        // 延迟一点确保数据稳定
        setTimeout(() => {
          loadWorkRecords(true)
        }, 100)
      }
    }, { immediate: true, deep: true })
    
    return {
      // 响应式数据
      statusFilter,
      dateRange,
      isLoading,
      isUploading,
      userOperationInProgress,
      acceptScreenshotVisible,
      completeScreenshotVisible,
      continueOrderVisible,
      orderDetailVisible,
      currentOrder,
      currentOrderDetail,
      acceptUploadRef,
      completeUploadRef,
      acceptFile,
      acceptFileUrl,
      completeFile,
      completeFileUrl,
      isDragOverComplete,
      completeUploadArea,
      isDragOverAccept,
      acceptUploadArea,
      pagination,
      
      // 重新上传相关数据
      reuploadScreenshotVisible,
      isReUploading,
      reuploadAcceptFile,
      reuploadAcceptFileUrl,
      reuploadCompleteFile,
      reuploadCompleteFileUrl,
      reuploadAcceptUploadRef,
      reuploadCompleteUploadRef,
      reuploadAcceptUploadArea,
      reuploadCompleteUploadArea,
      isDragOverReuploadAccept,
      isDragOverReuploadComplete,
      
      // 计算属性
      workRecordList,
      userRole,
      
      // 方法
      getStatusTagType,
      getStatusText,
      getApproveButtonText,
      getRejectButtonText,
      getPlayStyleLabel,
      getServiceTypeLabel,
      formatDateTime,
      handleFilterChange,
      handleSearch,
      handleRefresh,
      handleSortChange,
      handlePageChange,
      handlePageSizeChange,
      uploadAcceptScreenshot,
      uploadCompleteScreenshot,
      showContinueOrderDialog,
      confirmContinueOrder,
      viewOrderDetail,
      approveOrder,
      rejectOrder,
      getOrderInfoScreenshot,
      getOrderInfoScreenshotForDialog,
      getAcceptScreenshotForDialog,
      getAcceptScreenshot,
      getCompleteScreenshot,
      handleAuditApprove,
      handleAuditReject,
      handleAcceptFileChange,
      handleCompleteFileChange,
      submitAcceptScreenshot,
      submitCompleteScreenshot,
      loadWorkRecords,
      refreshData,
      startPollingData,
      stopPollingData,
      manualRefresh,
      previewImage,
      getPreviewUrl,
      getImageInfo,
      testImagePathParsing,
      previewAcceptImage,
      removeAcceptFile,
      previewCompleteImage,
      removeCompleteFile,
      handleDragOver,
      handleDragLeave,
      handleDropComplete,
      handleKeydown,
      handlePaste,
      processImageFile,
      handleAcceptDragOver,
      handleAcceptDragLeave,
      handleDropAccept,
      handleAcceptKeydown,
      handleAcceptPaste,
      handleAcceptPasteEvent,
      handleAcceptMouseEnter,
      handleAcceptMouseLeave,
      processAcceptImageFile,
      handleCompletePasteEvent,
      handleCompleteMouseEnter,
      handleCompleteMouseLeave,
      
      // 重新上传相关方法
      reuploadScreenshots,
      clearReuploadFiles,
      handleReuploadAcceptFileChange,
      handleReuploadCompleteFileChange,
      previewReuploadAcceptImage,
      previewReuploadCompleteImage,
      removeReuploadAcceptFile,
      removeReuploadCompleteFile,
      handleReuploadAcceptDragOver,
      handleReuploadAcceptDragLeave,
      handleReuploadAcceptDrop,
      handleReuploadAcceptPasteEvent,
      handleReuploadAcceptMouseEnter,
      handleReuploadAcceptMouseLeave,
      handleReuploadCompleteDragOver,
      handleReuploadCompleteDragLeave,
      handleReuploadCompleteDrop,
      handleReuploadCompletePasteEvent,
      handleReuploadCompleteMouseEnter,
      handleReuploadCompleteMouseLeave,
      processReuploadAcceptImageFile,
      processReuploadCompleteImageFile,
      submitReuploadScreenshots
    }
  }
}
</script>

<style scoped>
.employee-work-records {
  padding: 16px;
  width: 100%;
}

.actions-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding: 12px 16px;
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

/* 审核对话框样式 */
.audit-dialog :deep(.el-dialog) {
  border-radius: 12px;
  overflow: hidden;
}

.audit-content {
  padding: 0;
}

.section-title {
  margin: 0 0 12px 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  border-bottom: 2px solid #409eff;
  padding-bottom: 6px;
}

.order-info-section {
  margin-bottom: 20px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  align-items: center;
}

.accept-dialog .info-grid {
  grid-template-columns: repeat(2, 1fr);
  gap: 12px 16px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.info-label {
  font-weight: 600;
  color: #606266;
  min-width: 70px;
  font-size: 14px;
}

.info-value {
  color: #303133;
  font-weight: 500;
  font-size: 14px;
  flex: 1;
}

.screenshots-section {
  margin-bottom: 20px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.screenshot-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.screenshot-grid.three-columns {
  grid-template-columns: repeat(3, 1fr);
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
  height: 150px;
  border: 2px dashed #ced4da;
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #6c757d;
  background: #f8f9fa;
  gap: 8px;
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

.audit-section {
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
  margin-top: 20px;
}

.audit-container {
  display: flex;
  align-items: center;
  gap: 20px;
}

.audit-container .section-title {
  margin: 0;
  border-bottom: none;
  padding-bottom: 0;
  min-width: 80px;
}

.audit-buttons {
  display: flex;
  gap: 16px;
}

.audit-btn {
  min-width: 130px;
  height: 44px;
  font-size: 15px;
  font-weight: 600;
  border-radius: 8px;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.approve-btn {
  background: #67c23a;
  border-color: #67c23a;
  color: #fff;
}

.approve-btn:hover {
  background: #5daf34;
  border-color: #5daf34;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(103, 194, 58, 0.3);
}

.approve-btn:focus {
  background: #67c23a;
  border-color: #67c23a;
}

.reject-btn {
  background: #f56c6c;
  border-color: #f56c6c;
  color: #fff;
}

.reject-btn:hover {
  background: #f26a6a;
  border-color: #f26a6a;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(245, 108, 108, 0.3);
}

.reject-btn:focus {
  background: #f56c6c;
  border-color: #f56c6c;
}


/* 审核对话框响应式设计 */
@media (max-width: 768px) {
  .audit-dialog {
    width: 95% !important;
  }
  
  .screenshot-grid,
  .screenshot-grid.three-columns {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .info-grid {
    grid-template-columns: 1fr;
    gap: 15px;
  }
  
  .info-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .info-value {
    text-align: left;
  }
  
  .audit-container {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .audit-buttons {
    width: 100%;
    justify-content: center;
  }
}

/* 接单对话框样式 */
.accept-dialog :deep(.el-dialog) {
  border-radius: 12px;
  overflow: hidden;
}

/* 续单对话框样式 */
.continue-dialog :deep(.el-dialog) {
  border-radius: 12px;
  overflow: hidden;
}

.continue-content {
  padding: 0;
}


/* 完成对话框样式 */
.complete-dialog :deep(.el-dialog) {
  border-radius: 12px;
  overflow: hidden;
}

.accept-content {
  padding: 0;
}

.complete-content {
  padding: 0;
}

/* 完成图片上传区域样式优化 */
.complete-dialog .screenshot-grid.three-columns {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  max-width: 100%;
  overflow: hidden;
}

.complete-dialog .screenshot-container {
  display: flex;
  flex-direction: column;
  min-width: 0; /* 防止内容溢出 */
}

.complete-dialog .screenshot-box {
  border: 1px solid #dee2e6;
  border-radius: 8px;
  padding: 12px;
  text-align: center;
  background: #fff;
  flex: 1;
  min-height: 200px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.complete-dialog .screenshot-title {
  font-weight: 600;
  margin-bottom: 12px;
  color: #495057;
  font-size: 14px;
  flex-shrink: 0;
}

.complete-dialog .screenshot-placeholder {
  width: 100%;
  height: 150px;
  border: 2px dashed #ced4da;
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #6c757d;
  background: #f8f9fa;
  gap: 8px;
  flex: 1;
  min-height: 150px;
  overflow: hidden;
}

.complete-dialog .upload-content {
  width: 100%;
  height: 100%;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  background: #fafafa;
  transition: all 0.3s;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 150px;
}

.complete-dialog .upload-content:hover {
  border-color: #409eff;
  background: #f0f9ff;
}

.complete-dialog .upload-icon {
  font-size: 32px;
  color: #c0c4cc;
  margin-bottom: 12px;
  transition: all 0.3s;
}

.complete-dialog .upload-text {
  text-align: center;
  padding: 0 8px;
}

.complete-dialog .upload-text p {
  margin: 0 0 4px 0;
  color: #606266;
  font-size: 13px;
  line-height: 1.4;
}

.complete-dialog .upload-text .upload-tip {
  font-size: 11px;
  color: #909399;
  margin: 2px 0;
  line-height: 1.3;
}

.complete-dialog .screenshot-image {
  width: 100%;
  height: 150px;
  object-fit: cover;
  border-radius: 6px;
  cursor: pointer;
  transition: transform 0.2s;
  flex-shrink: 0;
}

.complete-dialog .screenshot-image:hover {
  transform: scale(1.02);
}

.complete-dialog .screenshot-uploaded {
  position: relative;
  width: 100%;
  height: 150px;
  text-align: center;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.complete-dialog .screenshot-actions {
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

.complete-dialog .screenshot-uploaded:hover .screenshot-actions {
  opacity: 1;
}

/* 完成图片上传区域拖拽状态优化 */
.complete-dialog .enhanced-upload-area.drag-over {
  border-color: #409eff;
  background: linear-gradient(135deg, rgba(64, 158, 255, 0.1), rgba(64, 158, 255, 0.05));
  transform: scale(1.02);
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.2);
}

.complete-dialog .enhanced-upload-area.drag-over .upload-icon {
  color: #409eff;
  transform: scale(1.1);
}

.complete-dialog .enhanced-upload-area.drag-over .upload-text p {
  color: #409eff;
}

.complete-dialog .enhanced-upload-area:focus {
  border-color: #409eff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
  outline: none;
}

.complete-dialog .enhanced-upload-area:hover {
  border-color: #409eff;
  background: #f0f9ff;
}

.complete-dialog .enhanced-upload-area:hover .upload-icon {
  color: #409eff;
  transform: scale(1.05);
}

.complete-dialog .enhanced-upload-area:hover .upload-text p:first-of-type {
  color: #409eff;
  font-weight: 600;
}

.upload-section {
  margin-bottom: 20px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}


.upload-area {
  margin-top: 12px;
}

.screenshot-uploader {
  width: 100%;
}

.upload-content {
  width: 100%;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  background: #fafafa;
  transition: all 0.3s;
  cursor: pointer;
  position: relative;
  overflow: hidden;
}

.screenshot-placeholder .upload-content {
  border: 1px solid #e4e7ed;
  background: #fafafa;
}

.screenshot-placeholder .upload-content:hover {
  border-color: #409eff;
}

.upload-content:hover {
  border-color: #409eff;
}

.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  min-height: 180px;
}

.upload-icon {
  font-size: 48px;
  color: #c0c4cc;
  margin-bottom: 16px;
}

.upload-text {
  text-align: center;
}

.upload-text p {
  margin: 0;
  color: #606266;
}

.upload-text .upload-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
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

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

/* 增强的上传区域样式 */
.enhanced-upload-area {
  transition: all 0.3s ease;
  position: relative;
  outline: none;
}

.enhanced-upload-area:focus {
  border-color: #409eff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
}

.enhanced-upload-area.drag-over {
  border-color: #409eff;
  background: linear-gradient(135deg, rgba(64, 158, 255, 0.1), rgba(64, 158, 255, 0.05));
  transform: scale(1.02);
}

.enhanced-upload-area.drag-over .upload-placeholder {
  color: #409eff;
}

.enhanced-upload-area.drag-over .upload-icon {
  color: #409eff;
  transform: scale(1.1);
}


/* 上传提示文本样式优化 */
.upload-tip {
  font-size: 13px;
  color: #909399;
  margin: 4px 0;
}

.upload-tip:first-of-type {
  color: #606266;
  font-weight: 500;
}

/* 重新上传对话框样式 */
.reupload-dialog :deep(.el-dialog) {
  border-radius: 12px;
}

.reupload-dialog :deep(.el-dialog__header) {
  background: linear-gradient(135deg, #ff9800, #f57c00);
  color: white;
  padding: 20px 24px;
  border-radius: 12px 12px 0 0;
}

.reupload-dialog :deep(.el-dialog__title) {
  color: white;
  font-weight: 600;
  font-size: 18px;
}

.reupload-dialog :deep(.el-dialog__headerbtn) {
  top: 20px;
  right: 24px;
}

.reupload-dialog :deep(.el-dialog__headerbtn .el-dialog__close) {
  color: white;
  font-size: 20px;
}

.reupload-dialog :deep(.el-dialog__body) {
  padding: 24px;
  max-height: 70vh;
  overflow-y: auto;
}

.reupload-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.reject-reason-section {
  background: #fff3cd;
  border-radius: 8px;
  padding: 16px;
  border: 1px solid #ffeaa7;
}

.reject-reason-section .section-title {
  color: #856404;
  margin-bottom: 12px;
}

.tips-section {
  background: #e3f2fd;
  border-radius: 8px;
  padding: 16px;
}

.tips-list {
  margin: 0;
  padding-left: 20px;
  color: #1565c0;
}

.tips-list li {
  margin-bottom: 8px;
  line-height: 1.5;
}

.tips-list li:last-child {
  margin-bottom: 0;
}

@media (max-width: 768px) {
  .accept-dialog,
  .complete-dialog,
  .continue-dialog,
  .reupload-dialog {
    width: 95% !important;
  }
  
  .upload-placeholder {
    padding: 30px 15px;
    min-height: 150px;
  }
  
  .upload-icon {
    font-size: 36px;
  }
  
  .preview-image {
    height: 150px;
  }
  
  /* 完成对话框移动端优化 */
  .complete-dialog .screenshot-grid.three-columns {
    grid-template-columns: 1fr;
    gap: 12px;
  }
  
  .complete-dialog .screenshot-box {
    min-height: 180px;
    padding: 10px;
  }
  
  .complete-dialog .screenshot-placeholder {
    min-height: 140px;
    height: 140px;
  }
  
  .complete-dialog .upload-content {
    min-height: 140px;
  }
  
  .complete-dialog .screenshot-image {
    height: 140px;
  }
  
  .complete-dialog .screenshot-uploaded {
    height: 140px;
  }
  
  .complete-dialog .upload-text p {
    font-size: 12px;
  }
  
  .complete-dialog .upload-text .upload-tip {
    font-size: 10px;
  }
  
  .complete-dialog .upload-icon {
    font-size: 28px;
    margin-bottom: 8px;
  }
}

@media (max-width: 480px) {
  .complete-dialog .screenshot-box {
    min-height: 160px;
    padding: 8px;
  }
  
  .complete-dialog .screenshot-placeholder {
    min-height: 120px;
    height: 120px;
  }
  
  .complete-dialog .upload-content {
    min-height: 120px;
  }
  
  .complete-dialog .screenshot-image {
    height: 120px;
  }
  
  .complete-dialog .screenshot-uploaded {
    height: 120px;
  }
  
  .complete-dialog .upload-icon {
    font-size: 24px;
    margin-bottom: 6px;
  }
  
  .complete-dialog .upload-text p {
    font-size: 11px;
  }
  
  .complete-dialog .upload-text .upload-tip {
    font-size: 9px;
  }
}
</style>


