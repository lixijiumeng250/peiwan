<template>
  <div class="admin-dashboard">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <h1>管理员控制台</h1>
      </div>
      <div class="stats-bar">
        <el-statistic
          title="总员工数"
          :value="totalEmployeeCount"
          suffix="人"
          class="stat-item"
        >
          <template #prefix>
            <el-icon><User /></el-icon>
          </template>
        </el-statistic>
        <el-statistic
          title="客服数量"
          :value="customerServiceCount"
          suffix="人"
          class="stat-item"
        >
          <template #prefix>
            <el-icon><Service /></el-icon>
          </template>
        </el-statistic>
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
      </div>
    </div>

    <!-- 主要内容区域 -->
    <div class="content-area">
      <el-tabs
        v-model="activeTab"
        type="card"
        class="admin-tabs"
        @tab-change="handleTabChange"
      >
        <!-- 员工列表标签页 -->
        <el-tab-pane label="员工列表" name="employees">
          <div class="employees-section">
            <div class="section-header">
              <h3>员工状态总览</h3>
              <div class="filter-controls">
                <el-select
                  v-model="employeeStatusFilter"
                  placeholder="筛选状态"
                  clearable
                  @change="handleEmployeeFilter"
                  style="width: 120px; margin-right: 10px;"
                >
                  <el-option label="全部" value="" />
                  <el-option label="工作中" value="BUSY" />
                  <el-option label="空闲中" value="IDLE" />
                  <el-option label="休息中" value="RESTING" />
                  <el-option label="离线" value="OFF_DUTY" />
                </el-select>
                <el-button
                  :icon="Refresh"
                  @click="() => refreshEmployeeList(true)"
                  :loading="isLoadingEmployees"
                >
                  刷新
                </el-button>
              </div>
            </div>

            <!-- 员工卡片网格 -->
            <div class="employee-grid" v-loading="isLoadingEmployees || isInitializing">
              <!-- 初始化加载状态 -->
              <template v-if="isInitializing">
                <div v-for="n in 8" :key="n" class="employee-card-skeleton">
                  <el-skeleton animated>
                    <template #template>
                      <div class="skeleton-header">
                        <el-skeleton-item variant="circle" style="width: 45px; height: 45px;" />
                        <div class="skeleton-info">
                          <el-skeleton-item variant="text" style="width: 80px; margin-bottom: 8px;" />
                          <el-skeleton-item variant="text" style="width: 60px;" />
                        </div>
                      </div>
                      <div class="skeleton-body">
                        <el-skeleton-item variant="text" style="width: 100%; margin-bottom: 6px;" />
                        <el-skeleton-item variant="text" style="width: 80%; margin-bottom: 6px;" />
                      </div>
                      <div class="skeleton-footer">
                        <el-skeleton-item variant="button" style="width: 50px; height: 20px;" />
                      </div>
                    </template>
                  </el-skeleton>
                </div>
              </template>
              
              <!-- 正常显示员工卡片（与客服页面一致） -->
              <template v-else>
                <div
                  v-for="employee in filteredCardEmployees"
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
                      {{ (employee.name || employee.realName || employee.username || 'U').charAt(0) }}
                    </el-avatar>
                    <div class="employee-info">
                      <h4 class="employee-name">{{ employee.username }}</h4>
                      <div class="employee-meta">
                        <span class="realname-info">姓名: {{ employee.realName }}</span>
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
              v-if="!isLoadingEmployees && !isInitializing && cardEmployees.length === 0"
              description="暂无员工数据"
            />
          </div>
        </el-tab-pane>

        <!-- 人员管理标签页 -->
        <el-tab-pane label="人员管理" name="management">
          <div class="management-section">
            <div class="management-grid">
              <!-- 客服列表 -->
              <div class="section customer-service-section">
                <div class="section-header">
                  <h3>客服列表</h3>
                  <el-button type="primary" @click="showAddCustomerServiceDialog">
                    新增客服
                  </el-button>
                </div>
                
                <el-table :data="customerServices" stripe style="width: 100%">
                  <el-table-column prop="username" label="用户名" width="120" />
                  <el-table-column prop="realName" label="真实姓名" width="120" />
                  <el-table-column label="管理员工" width="150">
                    <template #default="scope">
                      <el-button 
                        size="small" 
                        @click="showManagedEmployees(scope.row)"
                        type="text"
                      >
                        {{ getManagedEmployeeCount(scope.row.id) }}名员工
                      </el-button>
                    </template>
                  </el-table-column>
                  <el-table-column label="操作" width="150">
                    <template #default="scope">
                      <el-button size="small" @click="editCustomerService(scope.row)">
                        编辑
                      </el-button>
                      <el-button 
                        size="small" 
                        type="danger" 
                        @click="deleteCustomerService(scope.row)"
                      >
                        删除
                      </el-button>
                    </template>
                  </el-table-column>
                </el-table>
              </div>

              <!-- 员工列表 -->
              <div class="section employee-management-section">
                <div class="section-header">
                  <h3>员工列表</h3>
                </div>
                
                <el-table :data="allEmployees" stripe style="width: 100%">
                  <el-table-column prop="username" label="用户名" width="120" />
                  <el-table-column prop="realName" label="真实姓名" width="120" />
                  <el-table-column label="所属客服" width="150">
                    <template #default="scope">
                      <span>{{ getEmployeeCsName(scope.row.id) }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column label="操作" width="150">
                    <template #default="scope">
                      <el-button size="small" @click="editEmployee(scope.row)">
                        编辑
                      </el-button>
                      <el-button 
                        size="small" 
                        type="danger" 
                        @click="deleteEmployee(scope.row)"
                      >
                        删除
                      </el-button>
                    </template>
                  </el-table-column>
                </el-table>
              </div>
            </div>
          </div>
        </el-tab-pane>

        <!-- 客服员工关系管理标签页 -->
        <el-tab-pane label="关系管理" name="mappings">
          <div class="mappings-section">
            <div class="section-header">
              <h3>客服员工关系管理</h3>
              <div class="mapping-controls">
                <el-button type="primary" @click="showAddMappingDialog">
                  新增关系
                </el-button>
                <el-button type="success" @click="showBatchAddMappingDialog">
                  批量分配
                </el-button>
                <el-button
                  :icon="Refresh"
                  @click="() => refreshMappings(true)"
                  :loading="isLoadingMappings"
                >
                  刷新
                </el-button>
              </div>
            </div>

            <el-table :data="csEmployeeMappings" stripe style="width: 100%">
              <el-table-column prop="csUsername" label="客服用户名" min-width="140" />
              <el-table-column prop="csRealName" label="客服姓名" min-width="120" />
              <el-table-column prop="employeeUsername" label="员工用户名" min-width="140" />
              <el-table-column prop="employeeRealName" label="员工姓名" min-width="120" />
              <el-table-column prop="createdAt" label="创建时间" min-width="180">
                <template #default="scope">
                  {{ formatDateTime(scope.row.createdAt) }}
                </template>
              </el-table-column>
              <el-table-column label="操作" min-width="250" fixed="right">
                <template #default="scope">
                  <div class="button-group">
                    <el-button size="small" @click="editMapping(scope.row)">
                      编辑
                    </el-button>
                    <el-button 
                      size="small" 
                      type="warning" 
                      @click="reassignEmployee(scope.row)"
                    >
                      重新分配
                    </el-button>
                    <el-button 
                      size="small" 
                      type="danger" 
                      @click="deleteMapping(scope.row)"
                    >
                      删除
                    </el-button>
                  </div>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>


    <!-- 新增客服对话框 -->
    <el-dialog v-model="addCustomerServiceVisible" title="新增客服" width="400px">
      <el-form
        ref="customerServiceForm"
        :model="customerServiceFormData"
        :rules="customerServiceFormRules"
        label-width="100px"
      >
        <el-form-item label="真实姓名" prop="realName">
          <el-input v-model="customerServiceFormData.realName" placeholder="请输入真实姓名" />
        </el-form-item>
        <el-form-item label="游戏昵称" prop="gameNickname">
          <el-input 
            v-model="customerServiceFormData.gameNickname" 
            placeholder="请输入游戏昵称（登录用户名）"
            @blur="checkUsernameAvailability('customerService')"
          />
          <div class="form-hint">此昵称将作为客服的登录用户名，请确保唯一</div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="addCustomerServiceVisible = false">取消</el-button>
        <el-button type="primary" @click="handleAddCustomerService" :loading="submitting">确定</el-button>
      </template>
    </el-dialog>

    <!-- 管理的员工列表对话框 -->
    <el-dialog v-model="managedEmployeesVisible" title="管理的员工列表" width="600px">
      <div v-if="currentCustomerService">
        <h4>{{ currentCustomerService.realName }} 管理的员工</h4>
        <el-table :data="employees" stripe style="width: 100%">
          <el-table-column prop="username" label="用户名" width="120" />
          <el-table-column prop="realName" label="真实姓名" width="120" />
          <el-table-column prop="game" label="擅长游戏" width="150" />
          <el-table-column label="状态" width="100">
            <template #default="scope">
              <el-tag :type="getStatusTagType(scope.row.workStatus)" size="small">
                {{ getStatusText(scope.row.workStatus) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="100">
            <template #default="scope">
              <el-button size="small" @click="viewEmployeeDetail(scope.row)">详情</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-dialog>

    <!-- 编辑员工对话框 -->
    <el-dialog v-model="editEmployeeVisible" title="编辑员工信息" width="400px">
      <el-form
        ref="editEmployeeForm"
        :model="editEmployeeFormData"
        :rules="editEmployeeFormRules"
        label-width="100px"
      >
        <el-form-item label="真实姓名" prop="realName">
          <el-input v-model="editEmployeeFormData.realName" placeholder="请输入真实姓名" />
        </el-form-item>
        <el-form-item label="游戏昵称" prop="username">
          <el-input v-model="editEmployeeFormData.username" placeholder="请输入游戏昵称（登录用户名）" />
          <div class="form-hint">此昵称将作为员工的登录用户名，请确保唯一</div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editEmployeeVisible = false">取消</el-button>
        <el-button type="primary" @click="handleEditEmployee" :loading="submitting">确定</el-button>
      </template>
    </el-dialog>

    <!-- 编辑客服对话框 -->
    <el-dialog v-model="editCustomerServiceVisible" title="编辑客服信息" width="400px">
      <el-form
        ref="editCustomerServiceForm"
        :model="editCustomerServiceFormData"
        :rules="editCustomerServiceFormRules"
        label-width="100px"
      >
        <el-form-item label="真实姓名" prop="realName">
          <el-input v-model="editCustomerServiceFormData.realName" placeholder="请输入真实姓名" />
        </el-form-item>
        <el-form-item label="游戏昵称" prop="username">
          <el-input v-model="editCustomerServiceFormData.username" placeholder="请输入游戏昵称（登录用户名）" />
          <div class="form-hint">此昵称将作为客服的登录用户名，请确保唯一</div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editCustomerServiceVisible = false">取消</el-button>
        <el-button type="primary" @click="handleEditCustomerService" :loading="submitting">确定</el-button>
      </template>
    </el-dialog>

    <!-- 新增关系对话框 -->
    <el-dialog v-model="addMappingVisible" title="新增客服员工关系" width="500px">
      <el-form
        ref="mappingForm"
        :model="mappingFormData"
        :rules="mappingFormRules"
        label-width="100px"
      >
        <el-form-item label="选择客服" prop="csUserId">
          <el-select v-model="mappingFormData.csUserId" placeholder="请选择客服" style="width: 100%">
            <el-option
              v-for="cs in customerServices"
              :key="cs.id"
              :label="`${cs.realName} (${cs.username})`"
              :value="cs.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="选择员工" prop="employeeUserId">
          <el-select v-model="mappingFormData.employeeUserId" placeholder="请选择员工" style="width: 100%">
            <el-option
              v-for="emp in allEmployees"
              :key="emp.id"
              :label="`${emp.realName} (${emp.username})`"
              :value="emp.id"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="addMappingVisible = false">取消</el-button>
        <el-button type="primary" @click="handleAddMapping" :loading="submitting">确定</el-button>
      </template>
    </el-dialog>

    <!-- 批量分配对话框 -->
    <el-dialog v-model="batchAddMappingVisible" title="批量分配员工" width="600px">
      <el-form
        ref="batchMappingForm"
        :model="batchMappingFormData"
        :rules="batchMappingFormRules"
        label-width="100px"
      >
        <el-form-item label="选择客服" prop="csUserId">
          <el-select v-model="batchMappingFormData.csUserId" placeholder="请选择客服" style="width: 100%">
            <el-option
              v-for="cs in customerServices"
              :key="cs.id"
              :label="`${cs.realName} (${cs.username})`"
              :value="cs.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="选择员工" prop="employeeUserIds">
          <el-select
            v-model="batchMappingFormData.employeeUserIds"
            placeholder="请选择要分配的员工"
            multiple
            style="width: 100%"
          >
            <el-option
              v-for="emp in allEmployees"
              :key="emp.id"
              :label="`${emp.realName} (${emp.username})`"
              :value="emp.id"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="batchAddMappingVisible = false">取消</el-button>
        <el-button type="primary" @click="handleBatchAddMapping" :loading="submitting">确定</el-button>
      </template>
    </el-dialog>

    <!-- 编辑关系对话框 -->
    <el-dialog v-model="editMappingVisible" title="编辑客服员工关系" width="500px">
      <el-form
        ref="editMappingForm"
        :model="editMappingFormData"
        :rules="editMappingFormRules"
        label-width="100px"
      >
        <el-form-item label="选择客服" prop="csUserId">
          <el-select v-model="editMappingFormData.csUserId" placeholder="请选择客服" style="width: 100%">
            <el-option
              v-for="cs in customerServices"
              :key="cs.id"
              :label="`${cs.realName} (${cs.username})`"
              :value="cs.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="选择员工" prop="employeeUserId">
          <el-select v-model="editMappingFormData.employeeUserId" placeholder="请选择员工" style="width: 100%">
            <el-option
              v-for="emp in allEmployees"
              :key="emp.id"
              :label="`${emp.realName} (${emp.username})`"
              :value="emp.id"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editMappingVisible = false">取消</el-button>
        <el-button type="primary" @click="handleEditMapping" :loading="submitting">确定</el-button>
      </template>
    </el-dialog>

    <!-- 重新分配对话框 -->
    <el-dialog v-model="reassignVisible" title="重新分配员工" width="500px">
      <el-form
        ref="reassignForm"
        :model="reassignFormData"
        :rules="reassignFormRules"
        label-width="120px"
      >
        <el-form-item label="员工信息">
          <div>{{ currentMapping?.employeeRealName }} ({{ currentMapping?.employeeUsername }})</div>
        </el-form-item>
        <el-form-item label="当前客服">
          <div>{{ currentMapping?.csRealName }} ({{ currentMapping?.csUsername }})</div>
        </el-form-item>
        <el-form-item label="新客服" prop="newCsUserId">
          <el-select v-model="reassignFormData.newCsUserId" placeholder="请选择新客服" style="width: 100%">
            <el-option
              v-for="cs in customerServices"
              :key="cs.id"
              :label="`${cs.realName} (${cs.username})`"
              :value="cs.id"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="reassignVisible = false">取消</el-button>
        <el-button type="primary" @click="handleReassign" :loading="submitting">确定</el-button>
      </template>
    </el-dialog>

    <!-- 发派工单对话框（与客服页面一致） -->
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
                    :src="assignOrderData.screenshotUrl" 
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
        <el-button type="primary" @click="handleAssignOrder" :loading="submitting">发派工单</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { handleApiError } from '../utils/errorHandler'
import authStore from '../store/auth'
import {
  User,
  Service,
  UserFilled,
  Refresh,
  Upload,
  Plus
} from '@element-plus/icons-vue'
import customerServiceStore from '../store/customerService'
import adminStore from '../store/admin'
import { 
  updateUser, 
  deleteUser
} from '../api/admin'
import {
  getAllCSEmployeeMappings as getCsEmployeeMappings,
  createCSEmployeeMapping as createCsEmployeeMapping,
  updateCSEmployeeMapping as updateCsEmployeeMapping,
  deleteCSEmployeeMapping as deleteCsEmployeeMapping,
  batchCreateCSEmployeeMappings as batchCreateCsEmployeeMappings,
  reassignEmployee as reassignEmployeeApi
} from '../api/csEmployeeMappings'
import { showImagePreview } from '../utils/imageViewer'
import { uploadImage, validateImageFile } from '../api/upload'
import { usePolling, POLLING_CONFIG } from '../utils/polling'

export default {
  name: 'Admin',
  components: {
    User,
    Service,
    UserFilled,
    Refresh,
    Upload,
    Plus
  },
  setup() {
    const router = useRouter()
    
    // 轮询管理
    const { startSmartPolling, stopPolling } = usePolling()
    
    // 响应式数据
    const activeTab = ref('employees')
    const employeeStatusFilter = ref('')
    const isLoadingEmployees = ref(false)
    const submitting = ref(false)
    const isLoadingMappings = ref(false)
    const isInitializing = ref(true)
    const assignOrderVisible = ref(false)
    
    // 对话框状态
    const addCustomerServiceVisible = ref(false)
    const managedEmployeesVisible = ref(false)
    const editEmployeeVisible = ref(false)
    const editCustomerServiceVisible = ref(false)
    const addMappingVisible = ref(false)
    const batchAddMappingVisible = ref(false)
    const editMappingVisible = ref(false)
    const reassignVisible = ref(false)
    const currentCustomerService = ref(null)
    const currentMapping = ref(null)
    const assignOrderForm = ref(null)
    const uploadRef = ref(null)
    const uploadArea = ref(null)
    const isDragOver = ref(false)
    
    // 客服员工关系数据
    const csEmployeeMappings = ref([])
    // 员工卡片展示数据（按客服页面逻辑：关系 + /cs/employees enrich）
    const cardEmployees = ref([])
    
    // 使用admin store的数据
    const users = computed(() => {
      console.log('Admin页面 - 用户数据更新:', adminStore.state.users)
      return adminStore.state.users
    })
    const employees = computed(() => {
      const emp = users.value.filter(user => user.role === 'EMPLOYEE')
      console.log('Admin页面 - 员工数据:', emp)
      return emp
    })
    const customerServices = computed(() => {
      const cs = users.value.filter(user => user.role === 'CS')
      console.log('Admin页面 - 客服数据:', cs)
      return cs
    })
    
    // 表单数据
    // 编辑员工表单数据
    const editEmployeeFormData = reactive({
      id: null,
      realName: '',
      username: ''
    })
    
    const customerServiceFormData = reactive({
      realName: '',
      gameNickname: ''
    })
    
    // 编辑客服表单数据
    const editCustomerServiceFormData = reactive({
      id: null,
      realName: '',
      username: ''
    })
    
    // 关系表单数据
    const mappingFormData = reactive({
      csUserId: null,
      employeeUserId: null
    })
    
    // 批量关系表单数据
    const batchMappingFormData = reactive({
      csUserId: null,
      employeeUserIds: []
    })
    
    // 编辑关系表单数据
    const editMappingFormData = reactive({
      id: null,
      csUserId: null,
      employeeUserId: null
    })
    
    // 重新分配表单数据
    const reassignFormData = reactive({
      employeeUserId: null,
      newCsUserId: null
    })
    
    // 表单验证规则
    const customerServiceFormRules = {
      realName: [{ required: true, message: '请输入真实姓名', trigger: 'blur' }],
      gameNickname: [
        { required: true, message: '请输入游戏昵称', trigger: 'blur' },
        { min: 2, max: 20, message: '游戏昵称长度在 2 到 20 个字符', trigger: 'blur' }
      ]
    }
    
    const editEmployeeFormRules = {
      realName: [{ required: true, message: '请输入真实姓名', trigger: 'blur' }],
      username: [
        { required: true, message: '请输入游戏昵称', trigger: 'blur' },
        { min: 2, max: 20, message: '游戏昵称长度在 2 到 20 个字符', trigger: 'blur' }
      ]
    }
    
    const editCustomerServiceFormRules = {
      realName: [{ required: true, message: '请输入真实姓名', trigger: 'blur' }],
      username: [
        { required: true, message: '请输入游戏昵称', trigger: 'blur' },
        { min: 2, max: 20, message: '游戏昵称长度在 2 到 20 个字符', trigger: 'blur' }
      ]
    }
    
    const mappingFormRules = {
      csUserId: [{ required: true, message: '请选择客服', trigger: 'change' }],
      employeeUserId: [{ required: true, message: '请选择员工', trigger: 'change' }]
    }
    
    const batchMappingFormRules = {
      csUserId: [{ required: true, message: '请选择客服', trigger: 'change' }],
      employeeUserIds: [{ required: true, message: '请选择员工', trigger: 'change' }]
    }
    
    const editMappingFormRules = {
      csUserId: [{ required: true, message: '请选择客服', trigger: 'change' }],
      employeeUserId: [{ required: true, message: '请选择员工', trigger: 'change' }]
    }
    
    const reassignFormRules = {
      newCsUserId: [{ required: true, message: '请选择新客服', trigger: 'change' }]
    }
    
    // 计算属性
    const totalEmployeeCount = computed(() => (employees.value || []).length)
    const customerServiceCount = computed(() => (customerServices.value || []).length)
    const onlineEmployeeCount = computed(() => 
      (cardEmployees.value || []).filter(emp => emp.workStatus && emp.workStatus !== 'OFF_DUTY').length
    )
    
    const filteredCardEmployees = computed(() => {
      if (!employeeStatusFilter.value) return cardEmployees.value || []
      return (cardEmployees.value || []).filter(emp => emp.workStatus === employeeStatusFilter.value)
    })
    
    const allEmployees = computed(() => employees.value || [])
    
    // 用户统计
    const userStats = computed(() => {
      const userList = users.value || []
      const total = userList.length
      const active = userList.filter(user => user.isActive).length
      const admins = userList.filter(user => user.role === 'ADMIN').length
      const cs = userList.filter(user => user.role === 'CS').length
      const employees = userList.filter(user => user.role === 'EMPLOYEE').length
      
      return { total, active, admins, cs, employees }
    })
    
    // 方法
    const getStatusTagType = (status) => {
      // 与客服页面保持一致：BUSY-警示、IDLE-成功、RESTING-主要、OFF_DUTY-危险
      const statusMap = {
        'BUSY': 'warning',
        'IDLE': 'success',
        'RESTING': 'primary',
        'OFF_DUTY': 'danger'
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
    
    const formatDateTime = (dateString) => {
      if (!dateString) return '-'
      
      try {
        const date = new Date(dateString)
        if (isNaN(date.getTime())) return '-'
        
        return date.toLocaleString('zh-CN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        })
      } catch (error) {
        return '-'
      }
    }
    
    const handleTabChange = (tabName) => {
      activeTab.value = tabName
    }
    
    const handleEmployeeFilter = () => {
      // 筛选逻辑已通过计算属性实现
    }
    
    const refreshEmployeeList = async (showMessage = false) => {
      isLoadingEmployees.value = true
      try {
        const result = await adminStore.actions.fetchUsers()
        if (result && result.success) {
          if (showMessage) {
            ElMessage.success('用户列表已刷新')
          }
        } else {
          ElMessage.error(result?.message || '刷新失败')
        }
      } catch (error) {
        console.error('刷新用户列表失败:', error)
        ElMessage.error('刷新失败')
      } finally {
        isLoadingEmployees.value = false
      }
    }
    
    const viewEmployeeDetail = (employee) => {
      // 使用客服页面一致的员工对象字段
      const employeeForStore = {
        id: employee.id,
        employeeUserId: employee.id,
        userId: employee.id,
        csEmployeeUserId: employee.userId || employee.id,
        name: employee.name,
        username: employee.username,
        realName: employee.realName || employee.name,
        avatar: employee.avatar,
        workStatus: employee.workStatus,
        gender: employee.gender,
        game: employee.game,
        level: employee.level,
        todayOrders: employee.todayOrders || 0,
        totalOrders: employee.totalOrders || 0,
        rating: employee.rating || 0
      }

      customerServiceStore.actions.setCurrentEmployee(employeeForStore)

      router.push({
        name: 'CSEmployeeDetail',
        params: { id: employee.id }
      })
    }

    // 发派工单（管理员与客服一致）
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
    const assignOrderRules = {}

    const showAssignOrderDialog = (employee) => {
      assignOrderData.employeeId = employee.id
      assignOrderData.employeeName = employee.name || employee.realName
      assignOrderData.customerName = ''
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

    const handleDragOver = (event) => {
      event.preventDefault()
      isDragOver.value = true
    }
    const handleDragLeave = (event) => {
      event.preventDefault()
      isDragOver.value = false
    }
    const processImageFile = (file) => {
      const validation = validateImageFile(file)
      if (!validation.valid) {
        ElMessage.error(validation.message)
        return
      }
      if (assignOrderData.screenshotUrl) {
        URL.revokeObjectURL(assignOrderData.screenshotUrl)
      }
      assignOrderData.screenshotFile = file
      assignOrderData.screenshotUrl = URL.createObjectURL(file)
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
    const handleMouseEnter = () => {
      if (uploadArea.value) uploadArea.value.focus()
    }
    const handleMouseLeave = () => {
      if (uploadArea.value) uploadArea.value.blur()
    }

    const handleAssignOrder = async () => {
      try {
        const hasScreenshot = !!assignOrderData.screenshotFile
        const hasAnyInfo = !!(assignOrderData.customerName || assignOrderData.game || assignOrderData.playStyle || assignOrderData.serviceType || assignOrderData.gameLevel)
        if (!hasScreenshot && !hasAnyInfo) {
          ElMessage.warning('请至少上传截图或填写一些工单信息')
          return
        }
        submitting.value = true
        let screenshotUrl = null
        if (assignOrderData.screenshotFile) {
          const uploadResult = await uploadImage(assignOrderData.screenshotFile)
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
          await refreshCardEmployees()
        } else {
          ElMessage.error(result.message)
        }
      } catch (error) {
        const shouldShowError = handleApiError(error, { component: 'Admin', action: 'assignOrder' })
        if (shouldShowError) {
          ElMessage.error('发派工单失败：' + (error.message || '请稍后重试'))
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
    
    
    const showAddCustomerServiceDialog = () => {
      Object.assign(customerServiceFormData, {
        realName: '',
        gameNickname: ''
      })
      addCustomerServiceVisible.value = true
    }
    
    const handleAddCustomerService = async () => {
      try {
        submitting.value = true
        
        // 先进行表单验证
        const customerServiceForm = document.querySelector('.el-form')
        if (!customerServiceForm) {
          ElMessage.error('表单验证失败')
          return
        }
        
        // 验证必填字段
        if (!customerServiceFormData.realName.trim()) {
          ElMessage.error('请输入真实姓名')
          return
        }
        
        if (!customerServiceFormData.gameNickname.trim()) {
          ElMessage.error('请输入游戏昵称')
          return
        }
        
        if (customerServiceFormData.gameNickname.trim().length < 2 || customerServiceFormData.gameNickname.trim().length > 20) {
          ElMessage.error('游戏昵称长度在 2 到 20 个字符')
          return
        }
        
        // 检查用户名是否重复
        const isUsernameAvailable = await checkUsernameAvailability('customerService')
        if (isUsernameAvailable === false) {
          return
        }
        
        // 构建符合API文档要求的用户数据
        const userData = {
          username: customerServiceFormData.gameNickname.trim(), // 游戏昵称作为用户名（必填）
          realName: customerServiceFormData.realName.trim(), // 真实姓名（必填）
          role: 'CS', // 角色固定为客服
          isActive: true, // 管理员创建的用户默认为激活状态
          lastLogin: '', // 新建用户最后登录时间为空
          createdAt: '', // 后端自动生成
          updatedAt: '', // 后端自动生成
          deleted: 0 // 默认为0（未删除）
        }
        
        console.log('提交创建客服用户请求:', userData)
        const result = await adminStore.actions.createUser(userData)
        
        if (result.success) {
          addCustomerServiceVisible.value = false
          
          // 重置表单
          Object.assign(customerServiceFormData, {
            realName: '',
            gameNickname: ''
          })
          
          ElMessage.success(result.message || '客服用户创建成功，默认密码为123456，用户已激活')
          
          // 记录请求ID（如果有）
          if (result.requestId) {
            console.log('创建客服用户请求ID:', result.requestId)
          }
        } else {
          ElMessage.error(result.message || '录入客服失败')
        }
      } catch (error) {
        console.error('录入客服失败:', error)
        const shouldShowError = handleApiError(error, { component: 'Admin', action: 'addCustomerService' })
        if (shouldShowError) {
          ElMessage.error(error.message || '录入客服失败，请稍后重试')
        }
      } finally {
        submitting.value = false
      }
    }
    
    const showManagedEmployees = (customerService) => {
      currentCustomerService.value = customerService
      managedEmployeesVisible.value = true
    }
    
    const editCustomerService = (customerService) => {
      // 填充编辑表单数据
      Object.assign(editCustomerServiceFormData, {
        id: customerService.id,
        realName: customerService.realName,
        username: customerService.username
      })
      
      editCustomerServiceVisible.value = true
    }
    
    const handleEditCustomerService = async () => {
      try {
        submitting.value = true
        
        // 使用admin store更新客服
        const updateData = {
          username: editCustomerServiceFormData.username,
          realName: editCustomerServiceFormData.realName,
          role: 'CS',
          isActive: true
        }
        
        const result = await adminStore.actions.updateUser(editCustomerServiceFormData.id, updateData)
        
        if (result.success) {
          ElMessage.success('客服信息修改成功')
          editCustomerServiceVisible.value = false
          
          // 重置表单
          Object.assign(editCustomerServiceFormData, {
            id: null,
            realName: '',
            username: ''
          })
        } else {
          ElMessage.error(result.message || '修改失败')
        }
      } catch (error) {
        ElMessage.error('修改失败')
      } finally {
        submitting.value = false
      }
    }
    
    const deleteCustomerService = async (customerService) => {
      try {
        await ElMessageBox.confirm(
          `确定要删除客服 ${customerService.realName} 吗？`,
          '确认删除',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          }
        )
        
        const result = await adminStore.actions.deleteUser(customerService.id)
        if (result.success) {
          ElMessage.success('删除成功')
        } else {
          ElMessage.error(result.message || '删除失败')
        }
      } catch (error) {
        if (error !== 'cancel') {
          ElMessage.error('删除失败')
        }
      }
    }
    
    const editEmployee = (employee) => {
      // 填充编辑表单数据
      Object.assign(editEmployeeFormData, {
        id: employee.id,
        realName: employee.realName,
        username: employee.username
      })
      
      editEmployeeVisible.value = true
    }
    
    const handleEditEmployee = async () => {
      try {
        submitting.value = true
        
        // 使用admin store更新员工
        const updateData = {
          username: editEmployeeFormData.username,
          realName: editEmployeeFormData.realName,
          role: 'EMPLOYEE',
          isActive: true
        }
        
        const result = await adminStore.actions.updateUser(editEmployeeFormData.id, updateData)
        
        if (result.success) {
          ElMessage.success('员工信息修改成功')
          editEmployeeVisible.value = false
          
          // 重置表单
          Object.assign(editEmployeeFormData, {
            id: null,
            realName: '',
            username: ''
          })
        } else {
          ElMessage.error(result.message || '修改失败')
        }
      } catch (error) {
        ElMessage.error('修改失败')
      } finally {
        submitting.value = false
      }
    }
    
    const deleteEmployee = async (employee) => {
      try {
        await ElMessageBox.confirm(
          `确定要删除员工 ${employee.realName} 吗？`,
          '确认删除',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          }
        )
        
        const result = await adminStore.actions.deleteUser(employee.id)
        if (result.success) {
          ElMessage.success('删除成功')
        } else {
          ElMessage.error(result.message || '删除失败')
        }
      } catch (error) {
        if (error !== 'cancel') {
          ElMessage.error('删除失败')
        }
      }
    }
    
    const assignEmployeeToCustomerService = (employee, customerServiceId) => {
      employee.assignedCustomerService = customerServiceId
      const customerService = customerServices.value.find(cs => cs.id === customerServiceId)
      if (customerService) {
        // 更新客服管理的员工列表
        if (!customerService.managedEmployees) {
          customerService.managedEmployees = []
        }
        const existingIndex = customerService.managedEmployees.findIndex(emp => emp.id === employee.id)
        if (existingIndex === -1) {
          customerService.managedEmployees.push({
            id: employee.id,
            nickname: employee.nickname,
            name: employee.name,
            game: employee.game,
            status: employee.status
          })
        }
        ElMessage.success(`已将 ${employee.name} 分配给 ${customerService.name}`)
      }
    }
    
    // 获取客服管理的员工数量
    const getManagedEmployeeCount = (csUserId) => {
      return csEmployeeMappings.value.filter(mapping => mapping.csUserId === csUserId).length
    }
    
    // 获取员工的客服名称
    const getEmployeeCsName = (employeeUserId) => {
      const mapping = csEmployeeMappings.value.find(m => m.employeeUserId === employeeUserId)
      if (mapping) {
        const cs = customerServices.value.find(cs => cs.id === mapping.csUserId)
        return cs ? `${cs.realName} (${cs.username})` : '未知客服'
      }
      return '未分配'
    }
    
    // 刷新客服员工关系
    const refreshMappings = async (showMessage = false) => {
      isLoadingMappings.value = true
      try {
        console.log('开始刷新客服员工关系列表')
        const response = await getCsEmployeeMappings()
        console.log('刷新关系列表响应:', response)
        
        if (response.code === 200 && response.data) {
          csEmployeeMappings.value = response.data
          console.log('关系列表数据:', response.data)
          if (showMessage) {
            ElMessage.success('关系列表已刷新')
          }
        } else {
          console.error('刷新失败，响应码:', response.code, '消息:', response.message)
          ElMessage.error(response.message || '刷新失败')
        }
      } catch (error) {
        console.error('刷新关系列表失败，错误详情:', error)
        if (error.response) {
          console.error('错误响应:', error.response.data)
          ElMessage.error(error.response.data?.message || '刷新失败')
        } else {
          ElMessage.error('网络错误，请检查连接')
        }
      } finally {
        isLoadingMappings.value = false
      }
    }

    // 刷新员工卡片数据：基于 /admin/users，然后对每位员工用 X-User-Id 查询 /employee/profile
    const refreshCardEmployees = async () => {
      try {
        isLoadingEmployees.value = true
        // 确保有用户数据
        if (!users.value || users.value.length === 0) {
          await refreshEmployeeList()
        }
        // 1) 过滤出员工用户
        const baseList = (users.value || [])
          .filter(u => u.role === 'EMPLOYEE')
          .map(u => ({
            id: u.id,
            name: u.realName || u.username || '未知员工',
            username: u.username,
            realName: u.realName,
            avatar: '',
            workStatus: 'OFF_DUTY',
            gender: 'MALE',
            game: '未设置',
            level: '未设置',
            todayOrders: 0,
            totalOrders: 0,
            rating: 0
          }))

        // 2) 为每位员工调用 /employee/profile（携带 X-User-Id）
        const { getProfileForUser } = await import('../api/employee')
        const profilePromises = baseList.map(e => getProfileForUser(e.id))
        const results = await Promise.allSettled(profilePromises)

        // 3) 合并资料中的性别与工作状态
        results.forEach((res, idx) => {
          if (res.status === 'fulfilled' && res.value && (res.value.code === 200 || res.value.code === 0)) {
            const data = res.value.data || {}
            baseList[idx] = {
              ...baseList[idx],
              gender: data.gender || baseList[idx].gender,
              workStatus: data.workStatus || baseList[idx].workStatus,
              avatar: data.avatar || baseList[idx].avatar
            }
          }
        })
        cardEmployees.value = baseList
      } catch (error) {
        console.error('刷新员工卡片数据失败:', error)
      } finally {
        isLoadingEmployees.value = false
      }
    }
    
    // 显示新增关系对话框
    const showAddMappingDialog = () => {
      Object.assign(mappingFormData, {
        csUserId: null,
        employeeUserId: null
      })
      addMappingVisible.value = true
    }
    
    // 显示批量分配对话框
    const showBatchAddMappingDialog = () => {
      Object.assign(batchMappingFormData, {
        csUserId: null,
        employeeUserIds: []
      })
      batchAddMappingVisible.value = true
    }
    
    // 处理新增关系
    const handleAddMapping = async () => {
      try {
        submitting.value = true
        
        // 检查关系是否已存在
        const existingMapping = csEmployeeMappings.value.find(mapping => 
          mapping.csUserId === mappingFormData.csUserId && 
          mapping.employeeUserId === mappingFormData.employeeUserId
        )
        
        if (existingMapping) {
          ElMessage.warning('该客服员工关系已存在，请勿重复创建')
          return
        }
        
        console.log('创建关系请求数据:', mappingFormData)
        const response = await createCsEmployeeMapping(mappingFormData)
        console.log('创建关系响应:', response)
        
        if (response.code === 200) {
          addMappingVisible.value = false
          ElMessage.success('关系创建成功')
          await refreshMappings()
        } else {
          console.error('创建关系失败，响应码:', response.code, '消息:', response.message)
          ElMessage.error(response.message || '创建失败')
        }
      } catch (error) {
        console.error('创建关系失败，错误详情:', error)
        if (error.response) {
          console.error('错误响应:', error.response.data)
          // 检查是否是唯一约束冲突
          if (error.response.data?.message?.includes('Duplicate entry') || 
              error.response.data?.message?.includes('uk_cs_employee')) {
            ElMessage.error('该客服员工关系已存在，请勿重复创建')
          } else {
            ElMessage.error(error.response.data?.message || '创建失败')
          }
        } else {
          ElMessage.error('网络错误，请检查连接')
        }
      } finally {
        submitting.value = false
      }
    }
    
    // 处理批量分配
    const handleBatchAddMapping = async () => {
      try {
        submitting.value = true
        
        // 检查批量分配中是否有重复关系
        const duplicateMappings = []
        batchMappingFormData.employeeUserIds.forEach(employeeId => {
          const existingMapping = csEmployeeMappings.value.find(mapping => 
            mapping.csUserId === batchMappingFormData.csUserId && 
            mapping.employeeUserId === employeeId
          )
          if (existingMapping) {
            duplicateMappings.push(employeeId)
          }
        })
        
        if (duplicateMappings.length > 0) {
          const employeeNames = duplicateMappings.map(id => {
            const emp = allEmployees.value.find(e => e.id === id)
            return emp ? emp.realName : `ID:${id}`
          }).join('、')
          ElMessage.warning(`以下员工已分配给该客服，将跳过：${employeeNames}`)
          
          // 过滤掉已存在的关系
          batchMappingFormData.employeeUserIds = batchMappingFormData.employeeUserIds.filter(
            id => !duplicateMappings.includes(id)
          )
          
          if (batchMappingFormData.employeeUserIds.length === 0) {
            ElMessage.info('没有新的关系需要创建')
            return
          }
        }
        
        const response = await batchCreateCsEmployeeMappings(batchMappingFormData)
        if (response.code === 200) {
          batchAddMappingVisible.value = false
          ElMessage.success('批量分配成功')
          await refreshMappings()
        } else {
          ElMessage.error(response.message || '批量分配失败')
        }
      } catch (error) {
        console.error('批量分配失败:', error)
        if (error.response?.data?.message?.includes('Duplicate entry')) {
          ElMessage.error('部分关系已存在，请检查后重试')
        } else {
          ElMessage.error('批量分配失败')
        }
      } finally {
        submitting.value = false
      }
    }
    
    // 编辑关系
    const editMapping = (mapping) => {
      currentMapping.value = mapping
      Object.assign(editMappingFormData, {
        id: mapping.id,
        csUserId: mapping.csUserId,
        employeeUserId: mapping.employeeUserId
      })
      editMappingVisible.value = true
    }
    
    // 处理编辑关系
    const handleEditMapping = async () => {
      try {
        submitting.value = true
        
        const response = await updateCsEmployeeMapping(editMappingFormData.id, {
          csUserId: editMappingFormData.csUserId,
          employeeUserId: editMappingFormData.employeeUserId
        })
        if (response.code === 200) {
          editMappingVisible.value = false
          ElMessage.success('关系更新成功')
          await refreshMappings()
        } else {
          ElMessage.error(response.message || '更新失败')
        }
      } catch (error) {
        console.error('更新关系失败:', error)
        ElMessage.error('更新失败')
      } finally {
        submitting.value = false
      }
    }
    
    // 删除关系
    const deleteMapping = async (mapping) => {
      try {
        await ElMessageBox.confirm(
          `确定要删除 ${mapping.csRealName} 和 ${mapping.employeeRealName} 的关系吗？`,
          '确认删除',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          }
        )
        
        const response = await deleteCsEmployeeMapping(mapping.id)
        if (response.code === 200) {
          ElMessage.success('删除成功')
          await refreshMappings()
        } else {
          ElMessage.error(response.message || '删除失败')
        }
      } catch (error) {
        if (error !== 'cancel') {
          console.error('删除关系失败:', error)
          ElMessage.error('删除失败')
        }
      }
    }
    
    // 重新分配员工
    const reassignEmployee = (mapping) => {
      currentMapping.value = mapping
      Object.assign(reassignFormData, {
        employeeUserId: mapping.employeeUserId,
        newCsUserId: null
      })
      reassignVisible.value = true
    }
    
    // 检查用户名可用性
    const checkUsernameAvailability = async (formType) => {
      const username = customerServiceFormData.gameNickname
      
      if (!username || username.trim().length < 2) {
        return
      }
      
      // 检查当前用户列表中是否已存在该用户名
      const existingUser = users.value.find(user => user.username === username.trim())
      if (existingUser) {
        ElMessage.warning(`游戏昵称 "${username}" 已被使用，请选择其他昵称`)
        return false
      }
      
      return true
    }
    
    // 处理重新分配
    const handleReassign = async () => {
      try {
        submitting.value = true
        
        const response = await reassignEmployeeApi(reassignFormData)
        if (response.code === 200) {
          reassignVisible.value = false
          ElMessage.success('重新分配成功')
          await refreshMappings()
        } else {
          ElMessage.error(response.message || '重新分配失败')
        }
      } catch (error) {
        console.error('重新分配失败:', error)
        ElMessage.error('重新分配失败')
      } finally {
        submitting.value = false
      }
    }
    
    // 开始智能轮询员工卡片数据
    const startPollingEmployeeCards = () => {
      const interval = POLLING_CONFIG.ADMIN_USERS * 1000
      
      // 使用智能轮询，只有数据变化时才更新UI
      startSmartPolling(
        'admin-employee-cards',
        // 数据获取函数
        async () => {
          // 1. 获取基础用户数据
          const userResult = await adminStore.actions.fetchUsers()
          if (!userResult || !userResult.success) {
            throw new Error('获取用户数据失败')
          }
          
          // 2. 过滤出员工用户
          const baseList = (userResult.data || users.value || [])
            .filter(u => u.role === 'EMPLOYEE')
            .map(u => ({
              id: u.id,
              name: u.realName || u.username || '未知员工',
              username: u.username,
              realName: u.realName,
              avatar: '',
              workStatus: 'OFF_DUTY',
              gender: 'MALE',
              game: '未设置',
              level: '未设置',
              todayOrders: 0,
              totalOrders: 0,
              rating: 0
            }))

          // 3. 为每位员工获取详细资料
          const { getProfileForUser } = await import('../api/employee')
          const profilePromises = baseList.map(e => getProfileForUser(e.id))
          const results = await Promise.allSettled(profilePromises)

          // 4. 合并资料中的性别与工作状态
          results.forEach((res, idx) => {
            if (res.status === 'fulfilled' && res.value && (res.value.code === 200 || res.value.code === 0)) {
              const data = res.value.data || {}
              baseList[idx] = {
                ...baseList[idx],
                gender: data.gender || baseList[idx].gender,
                workStatus: data.workStatus || baseList[idx].workStatus,
                avatar: data.avatar || baseList[idx].avatar
              }
            }
          })
          
          return baseList
        },
        // 数据变化时的回调
        (newData, oldData) => {
          console.log('管理员页面员工卡片数据发生变化，更新UI')
          console.log('新数据:', newData?.length || 0, '条记录')
          console.log('旧数据:', oldData?.length || 0, '条记录')
          
          // 更新员工卡片数据
          cardEmployees.value = newData || []
        },
        interval
      )
      
      console.log(`开始智能轮询管理员页面员工卡片，间隔: ${POLLING_CONFIG.ADMIN_USERS}秒`)
    }

    // 停止轮询员工卡片数据
    const stopPollingEmployeeCards = () => {
      stopPolling('admin-employee-cards')
      console.log('停止轮询管理员页面员工卡片')
    }

    const initializeData = async () => {
      try {
        // 确保用户信息已加载
        const currentUser = authStore.getters.currentUser.value
        if (!currentUser) {
          await authStore.actions.fetchCurrentUser()
        }
        
        // 初始化：管理用用户数据（管理标签使用）
        await refreshEmployeeList()
        // 关系表（管理标签使用）
        await refreshMappings()
        // 员工卡片（按客服逻辑）
        await refreshCardEmployees()
      } catch (error) {
        console.error('页面初始化失败:', error)
      } finally {
        isInitializing.value = false
      }
    }

    // 生命周期
    onMounted(() => {
      initializeData()
      
      // 延迟开始轮询，避免与初始加载冲突
      setTimeout(() => {
        startPollingEmployeeCards()
      }, 3000)
    })
    
    onUnmounted(() => {
      stopPollingEmployeeCards()
    })
    
    return {
      // 响应式数据
      activeTab,
      employeeStatusFilter,
      isLoadingEmployees,
      submitting,
      isLoadingMappings,
      isInitializing,
      assignOrderVisible,
      addCustomerServiceVisible,
      managedEmployeesVisible,
      editEmployeeVisible,
      editCustomerServiceVisible,
      addMappingVisible,
      batchAddMappingVisible,
      editMappingVisible,
      reassignVisible,
      currentCustomerService,
      currentMapping,
      csEmployeeMappings,
      employees,
      cardEmployees,
      customerServices,
      assignOrderForm,
      uploadRef,
      uploadArea,
      isDragOver,
      assignOrderData,
      assignOrderRules,
      customerServiceFormData,
      editEmployeeFormData,
      editCustomerServiceFormData,
      mappingFormData,
      batchMappingFormData,
      editMappingFormData,
      reassignFormData,
      customerServiceFormRules,
      editEmployeeFormRules,
      editCustomerServiceFormRules,
      mappingFormRules,
      batchMappingFormRules,
      editMappingFormRules,
      reassignFormRules,
      
      // 计算属性
      totalEmployeeCount,
      customerServiceCount,
      onlineEmployeeCount,
      filteredCardEmployees,
      allEmployees,
      userStats,
      
      // 方法
      getStatusTagType,
      getStatusText,
      getGenderText,
      formatDateTime,
      handleTabChange,
      handleEmployeeFilter,
      refreshEmployeeList,
      viewEmployeeDetail,
      showAssignOrderDialog,
      handleScreenshotChange,
      removeScreenshot,
      previewScreenshot,
      handleDragOver,
      handleDragLeave,
      handleDrop,
      handlePasteEvent,
      processImageFile,
      handleMouseEnter,
      handleMouseLeave,
      handleAssignOrder,
      handleCloseAssignDialog,
      showAddCustomerServiceDialog,
      handleAddCustomerService,
      showManagedEmployees,
      editCustomerService,
      handleEditCustomerService,
      deleteCustomerService,
      editEmployee,
      handleEditEmployee,
      deleteEmployee,
      assignEmployeeToCustomerService,
      getManagedEmployeeCount,
      getEmployeeCsName,
      refreshMappings,
      showAddMappingDialog,
      showBatchAddMappingDialog,
      handleAddMapping,
      handleBatchAddMapping,
      editMapping,
      handleEditMapping,
      deleteMapping,
      reassignEmployee,
      handleReassign,
      checkUsernameAvailability,
      refreshMappings,
      refreshCardEmployees,
      startPollingEmployeeCards,
      stopPollingEmployeeCards
    }
  }
}
</script>

<style scoped>
.admin-dashboard {
  padding: 12px;
  max-width: 1400px;
  margin: 0 auto;
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

.content-area {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.admin-tabs {
  min-height: 600px;
}

.admin-tabs :deep(.el-tabs__header) {
  margin: 0;
  background: #f5f7fa;
  padding: 0 12px;
}

.admin-tabs :deep(.el-tabs__content) {
  padding: 12px;
}

.employees-section {
  min-height: 400px;
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

.management-section {
  min-height: 500px;
}

.management-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 30px;
}

.section {
  background: #f8f9fa;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 12px;
}

.customer-service-section,
.employee-management-section {
  background: #f8f9fa;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 12px;
}

@media (max-width: 1200px) {
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
  
  .management-grid {
    grid-template-columns: 1fr;
    gap: 20px;
  }
}

@media (max-width: 768px) {
  .section-header {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }
  
  .filter-controls,
  .mapping-controls {
    justify-content: center;
  }
  
  .employee-meta {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
}

.mappings-section {
  min-height: 500px;
}

.mapping-controls {
  display: flex;
  gap: 10px;
  align-items: center;
}

.button-group {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}

.button-group .el-button {
  margin: 0;
}

.form-hint {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
  line-height: 1.4;
}

/* 发派工单对话框样式（与客服页面一致） */
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

.upload-tip {
  font-size: 12px;
  color: #909399;
  margin: 2px 0;
}
</style>