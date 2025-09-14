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
                      <span class="label">电话:</span>
                      <span class="value">{{ employee.phone || '未填写' }}</span>
                    </div>
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
                
                <el-table 
                  :data="customerServices" 
                  stripe 
                  style="width: 100%" 
                  :header-cell-style="{ background: '#f5f7fa', color: '#606266', fontWeight: '600' }"
                  :row-style="{ height: '50px' }"
                  class="custom-table"
                  :max-height="400"
                  :scrollbar-always-on="true"
                >
                  <el-table-column prop="username" label="用户名" min-width="120" show-overflow-tooltip />
                  <el-table-column prop="realName" label="真实姓名" min-width="120" show-overflow-tooltip />
                  <el-table-column prop="phone" label="电话号码" min-width="140" show-overflow-tooltip>
                    <template #default="scope">
                      <span :class="{ 'text-muted': !scope.row.phone }">{{ scope.row.phone || '未填写' }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column label="管理员工" min-width="150" align="center">
                    <template #default="scope">
                      <el-button 
                        size="small" 
                        @click="showManagedEmployees(scope.row)"
                        type="primary"
                        text
                        class="employee-count-btn"
                      >
                        <el-icon><User /></el-icon>
                        {{ getManagedEmployeeCount(scope.row.id) }}名员工
                      </el-button>
                    </template>
                  </el-table-column>
                  <el-table-column label="操作" min-width="150" align="center" fixed="right">
                    <template #default="scope">
                      <div class="table-actions">
                        <el-button 
                          size="small" 
                          type="primary" 
                          text 
                          @click="editCustomerService(scope.row)"
                          class="action-btn"
                        >
                          <el-icon><Edit /></el-icon>
                        编辑
                      </el-button>
                      <el-button 
                        size="small" 
                        type="danger" 
                          text
                        @click="deleteCustomerService(scope.row)"
                          class="action-btn danger"
                      >
                          <el-icon><Delete /></el-icon>
                        删除
                      </el-button>
                      </div>
                    </template>
                  </el-table-column>
                </el-table>
              </div>

              <!-- 员工列表 -->
              <div class="section employee-management-section">
                <div class="section-header">
                  <h3>员工列表</h3>
                </div>
                
                <el-table 
                  :data="allEmployees" 
                  stripe 
                  style="width: 100%" 
                  :header-cell-style="{ background: '#f5f7fa', color: '#606266', fontWeight: '600' }"
                  :row-style="{ height: '50px' }"
                  class="custom-table"
                  :max-height="400"
                  :scrollbar-always-on="true"
                >
                  <el-table-column prop="username" label="用户名" min-width="120" show-overflow-tooltip />
                  <el-table-column prop="realName" label="真实姓名" min-width="120" show-overflow-tooltip />
                  <el-table-column prop="phone" label="电话号码" min-width="140" show-overflow-tooltip>
                    <template #default="scope">
                      <span :class="{ 'text-muted': !scope.row.phone }">{{ scope.row.phone || '未填写' }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column label="所属客服" min-width="200" show-overflow-tooltip>
                    <template #default="scope">
                      <div class="cs-tags-container">
                        <template v-if="getEmployeeCsList(scope.row.id).length > 0">
                          <el-tag 
                            v-for="cs in getEmployeeCsList(scope.row.id)"
                            :key="cs.id"
                            type="success" 
                            size="small"
                            class="cs-tag"
                          >
                            <el-icon><Service /></el-icon>
                            {{ cs.realName }}
                          </el-tag>
                        </template>
                        <el-tag v-else type="warning" size="small" class="cs-tag">
                          <el-icon><Warning /></el-icon>
                          未分配
                        </el-tag>
                      </div>
                    </template>
                  </el-table-column>
                  <el-table-column label="操作" min-width="150" align="center" fixed="right">
                    <template #default="scope">
                      <div class="table-actions">
                        <el-button 
                          size="small" 
                          type="primary" 
                          text 
                          @click="editEmployee(scope.row)"
                          class="action-btn"
                        >
                          <el-icon><Edit /></el-icon>
                        编辑
                      </el-button>
                      <el-button 
                        size="small" 
                        type="danger" 
                          text
                        @click="deleteEmployee(scope.row)"
                          class="action-btn danger"
                      >
                          <el-icon><Delete /></el-icon>
                        删除
                      </el-button>
                      </div>
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
            @blur="checkUsernameAvailabilityForCS"
            :class="usernameValidationStatus.cs.class"
          >
            <template #suffix>
              <el-icon v-if="usernameValidationStatus.cs.loading" class="is-loading">
                <Loading />
              </el-icon>
              <el-icon v-else-if="usernameValidationStatus.cs.status === 'success'" class="success-icon">
                <Check />
              </el-icon>
              <el-icon v-else-if="usernameValidationStatus.cs.status === 'error'" class="error-icon">
                <Close />
              </el-icon>
            </template>
          </el-input>
          <div class="form-hint" :class="usernameValidationStatus.cs.hintClass">
            {{ usernameValidationStatus.cs.message || '此昵称将作为客服的登录用户名，请确保唯一' }}
          </div>
        </el-form-item>
        <el-form-item label="电话号码" prop="phone">
          <el-input 
            v-model="customerServiceFormData.phone" 
            placeholder="请输入电话号码（可选）"
            maxlength="20"
            @blur="checkPhoneAvailabilityForCS"
            :prefix-icon="phoneValidationStatus.cs.icon"
            :class="phoneValidationStatus.cs.class"
          >
            <template #suffix>
              <el-icon v-if="phoneValidationStatus.cs.loading" class="is-loading">
                <Loading />
              </el-icon>
              <el-icon v-else-if="phoneValidationStatus.cs.status === 'success'" class="success-icon">
                <Check />
              </el-icon>
              <el-icon v-else-if="phoneValidationStatus.cs.status === 'error'" class="error-icon">
                <Close />
              </el-icon>
            </template>
          </el-input>
          <div class="form-hint" :class="phoneValidationStatus.cs.hintClass">
            {{ phoneValidationStatus.cs.message || '请输入有效的电话号码，便于联系' }}
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="addCustomerServiceVisible = false">取消</el-button>
        <el-button type="primary" @click="handleAddCustomerService">确定</el-button>
      </template>
    </el-dialog>

    <!-- 管理的员工列表对话框 -->
    <el-dialog 
      v-model="managedEmployeesVisible" 
      :title="`${currentCustomerService?.realName || '客服'} 管理的员工`" 
      width="800px"
      class="managed-employees-dialog"
    >
      <div v-if="currentCustomerService" class="managed-employees-content">
        <!-- 客服信息卡片 -->
        <div class="cs-info-card">
          <div class="cs-avatar">
            <el-avatar :size="60" class="cs-avatar-img">
              {{ currentCustomerService.realName?.charAt(0) || 'C' }}
            </el-avatar>
          </div>
          <div class="cs-details">
            <h3 class="cs-name">{{ currentCustomerService.realName }}</h3>
            <p class="cs-username">用户名: {{ currentCustomerService.username }}</p>
            <p class="cs-phone">电话: {{ currentCustomerService.phone || '未填写' }}</p>
          </div>
          <div class="cs-stats">
            <el-statistic 
              title="管理员工" 
              :value="managedEmployees.length" 
              suffix="人"
              class="stat-item"
            >
              <template #prefix>
                <el-icon><User /></el-icon>
              </template>
            </el-statistic>
          </div>
        </div>

        <!-- 员工列表 -->
        <div class="employees-list-section">
          <el-table 
            :data="managedEmployees" 
            stripe 
            style="width: 100%"
            v-loading="isLoadingManagedEmployees"
            :header-cell-style="{ background: '#f5f7fa', color: '#606266', fontWeight: '600' }"
            :row-style="{ height: '55px' }"
            class="managed-employees-table"
          >
            <el-table-column prop="username" label="用户名" min-width="120" show-overflow-tooltip />
            <el-table-column prop="realName" label="真实姓名" min-width="120" show-overflow-tooltip />
            <el-table-column prop="phone" label="电话号码" min-width="140" show-overflow-tooltip>
            <template #default="scope">
                <span :class="{ 'text-muted': scope.row.phone === '未填写' }">
                  {{ scope.row.phone }}
                </span>
              </template>
            </el-table-column>
            <el-table-column label="工作状态" min-width="100" align="center">
              <template #default="scope">
                <el-tag 
                  :type="getStatusTagType(scope.row.workStatus)" 
                  size="small"
                  class="status-tag"
                >
                {{ getStatusText(scope.row.workStatus) }}
              </el-tag>
            </template>
          </el-table-column>
            <el-table-column label="性别" min-width="80" align="center">
            <template #default="scope">
                <el-tag 
                  :type="scope.row.gender === 'MALE' ? 'primary' : 'danger'" 
                  size="small"
                  plain
                >
                  {{ getGenderText(scope.row.gender) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" min-width="120" align="center" fixed="right">
              <template #default="scope">
                <div class="table-actions">
                  <el-button 
                    size="small" 
                    type="primary"
                    text
                    @click="viewEmployeeDetail(scope.row)"
                    class="action-btn"
                  >
                    <el-icon><View /></el-icon>
                    详情
                  </el-button>
                </div>
            </template>
          </el-table-column>
        </el-table>

          <!-- 空状态 -->
          <el-empty 
            v-if="!isLoadingManagedEmployees && managedEmployees.length === 0"
            description="该客服暂未分配员工"
            :image-size="120"
          />
      </div>
      </div>
      
      <template #footer>
        <el-button @click="managedEmployeesVisible = false">关闭</el-button>
      </template>
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
          <el-input 
            v-model="editEmployeeFormData.username" 
            placeholder="请输入游戏昵称（登录用户名）"
            @blur="checkUsernameAvailabilityForEmployee"
            :class="usernameValidationStatus.employee.class"
          >
            <template #suffix>
              <el-icon v-if="usernameValidationStatus.employee.loading" class="is-loading">
                <Loading />
              </el-icon>
              <el-icon v-else-if="usernameValidationStatus.employee.status === 'success'" class="success-icon">
                <Check />
              </el-icon>
              <el-icon v-else-if="usernameValidationStatus.employee.status === 'error'" class="error-icon">
                <Close />
              </el-icon>
            </template>
          </el-input>
          <div class="form-hint" :class="usernameValidationStatus.employee.hintClass">
            {{ usernameValidationStatus.employee.message || '此昵称将作为员工的登录用户名，请确保唯一' }}
          </div>
        </el-form-item>
        <el-form-item label="电话号码" prop="phone">
          <el-input 
            v-model="editEmployeeFormData.phone" 
            placeholder="请输入电话号码（可选）"
            maxlength="20"
            @blur="checkPhoneAvailabilityForEmployee"
            :class="phoneValidationStatus.employee.class"
          >
            <template #suffix>
              <el-icon v-if="phoneValidationStatus.employee.loading" class="is-loading">
                <Loading />
              </el-icon>
              <el-icon v-else-if="phoneValidationStatus.employee.status === 'success'" class="success-icon">
                <Check />
              </el-icon>
              <el-icon v-else-if="phoneValidationStatus.employee.status === 'error'" class="error-icon">
                <Close />
              </el-icon>
            </template>
          </el-input>
          <div class="form-hint" :class="phoneValidationStatus.employee.hintClass">
            {{ phoneValidationStatus.employee.message || '请输入有效的电话号码，便于联系' }}
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editEmployeeVisible = false">取消</el-button>
        <el-button type="primary" @click="handleEditEmployee">确定</el-button>
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
          <el-input 
            v-model="editCustomerServiceFormData.username" 
            placeholder="请输入游戏昵称（登录用户名）"
            @blur="checkUsernameAvailabilityForEditCS"
            :class="usernameValidationStatus.editCS.class"
          >
            <template #suffix>
              <el-icon v-if="usernameValidationStatus.editCS.loading" class="is-loading">
                <Loading />
              </el-icon>
              <el-icon v-else-if="usernameValidationStatus.editCS.status === 'success'" class="success-icon">
                <Check />
              </el-icon>
              <el-icon v-else-if="usernameValidationStatus.editCS.status === 'error'" class="error-icon">
                <Close />
              </el-icon>
            </template>
          </el-input>
          <div class="form-hint" :class="usernameValidationStatus.editCS.hintClass">
            {{ usernameValidationStatus.editCS.message || '此昵称将作为客服的登录用户名，请确保唯一' }}
          </div>
        </el-form-item>
        <el-form-item label="电话号码" prop="phone">
          <el-input 
            v-model="editCustomerServiceFormData.phone" 
            placeholder="请输入电话号码（可选）"
            maxlength="20"
            @blur="checkPhoneAvailabilityForEditCS"
            :class="phoneValidationStatus.editCS.class"
          >
            <template #suffix>
              <el-icon v-if="phoneValidationStatus.editCS.loading" class="is-loading">
                <Loading />
              </el-icon>
              <el-icon v-else-if="phoneValidationStatus.editCS.status === 'success'" class="success-icon">
                <Check />
              </el-icon>
              <el-icon v-else-if="phoneValidationStatus.editCS.status === 'error'" class="error-icon">
                <Close />
              </el-icon>
            </template>
          </el-input>
          <div class="form-hint" :class="phoneValidationStatus.editCS.hintClass">
            {{ phoneValidationStatus.editCS.message || '请输入有效的电话号码，便于联系' }}
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editCustomerServiceVisible = false">取消</el-button>
        <el-button type="primary" @click="handleEditCustomerService">确定</el-button>
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
import config from '../config'
import {
  User,
  Service,
  UserFilled,
  Refresh,
  Upload,
  Plus,
  Warning,
  Edit,
  Delete,
  Loading,
  Check,
  Close,
  View
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
import { showImagePreview, getPreviewUrl } from '../utils/imageViewer'
import { uploadImage, validateImageFile } from '../api/upload'
import { usePolling, POLLING_CONFIG } from '../utils/polling'
import { checkPhoneAvailability, checkUsernameAvailability as checkUsernameAPI } from '../api/auth'

export default {
  name: 'Admin',
  components: {
    User,
    Service,
    UserFilled,
    Refresh,
    Upload,
    Plus,
    Warning,
    Edit,
    Delete,
    Loading,
    Check,
    Close,
    View
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
    // 员工卡片展示数据（管理员直接从用户数据获取，不调用客服API）
    const cardEmployees = ref([])
    // 当前客服管理的员工列表
    const managedEmployees = ref([])
    const isLoadingManagedEmployees = ref(false)
    
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
      username: '',
      phone: ''
    })
    
    const customerServiceFormData = reactive({
      realName: '',
      gameNickname: '',
      phone: ''
    })
    
    // 编辑客服表单数据
    const editCustomerServiceFormData = reactive({
      id: null,
      realName: '',
      username: '',
      phone: ''
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
    
    // 手机号验证状态
    const phoneValidationStatus = reactive({
      cs: {
        loading: false,
        status: '', // 'success', 'error', ''
        message: '',
        class: '',
        hintClass: ''
      },
      employee: {
        loading: false,
        status: '',
        message: '',
        class: '',
        hintClass: ''
      },
      editCS: {
        loading: false,
        status: '',
        message: '',
        class: '',
        hintClass: ''
      }
    })
    
    // 用户名验证状态
    const usernameValidationStatus = reactive({
      cs: {
        loading: false,
        status: '', // 'success', 'error', ''
        message: '',
        class: '',
        hintClass: ''
      },
      employee: {
        loading: false,
        status: '',
        message: '',
        class: '',
        hintClass: ''
      },
      editCS: {
        loading: false,
        status: '',
        message: '',
        class: '',
        hintClass: ''
      }
    })
    
    // 表单验证规则
    const customerServiceFormRules = {
      realName: [{ required: true, message: '请输入真实姓名', trigger: 'blur' }],
      gameNickname: [
        { required: true, message: '请输入游戏昵称', trigger: 'blur' },
        { min: 2, max: 20, message: '游戏昵称长度在 2 到 20 个字符', trigger: 'blur' }
      ],
      phone: [
        { 
          pattern: /^1[3-9]\d{9}$|^(\+86)?1[3-9]\d{9}$|^(\d{3,4}-?)?\d{7,8}$/,
          message: '请输入有效的电话号码',
          trigger: 'blur'
        }
      ]
    }
    
    const editEmployeeFormRules = {
      realName: [{ required: true, message: '请输入真实姓名', trigger: 'blur' }],
      username: [
        { required: true, message: '请输入游戏昵称', trigger: 'blur' },
        { min: 2, max: 20, message: '游戏昵称长度在 2 到 20 个字符', trigger: 'blur' }
      ],
      phone: [
        { 
          pattern: /^1[3-9]\d{9}$|^(\+86)?1[3-9]\d{9}$|^(\d{3,4}-?)?\d{7,8}$/,
          message: '请输入有效的电话号码',
          trigger: 'blur'
        }
      ]
    }
    
    const editCustomerServiceFormRules = {
      realName: [{ required: true, message: '请输入真实姓名', trigger: 'blur' }],
      username: [
        { required: true, message: '请输入游戏昵称', trigger: 'blur' },
        { min: 2, max: 20, message: '游戏昵称长度在 2 到 20 个字符', trigger: 'blur' }
      ],
      phone: [
        { 
          pattern: /^1[3-9]\d{9}$|^(\+86)?1[3-9]\d{9}$|^(\d{3,4}-?)?\d{7,8}$/,
          message: '请输入有效的电话号码',
          trigger: 'blur'
        }
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
        gameNickname: '',
        phone: ''
      })
      
      // 重置手机号验证状态
      phoneValidationStatus.cs = {
        loading: false,
        status: '',
        message: '',
        class: '',
        hintClass: ''
      }
      
      // 重置用户名验证状态
      usernameValidationStatus.cs = {
        loading: false,
        status: '',
        message: '',
        class: '',
        hintClass: ''
      }
      
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
        
        // 检查用户名验证状态
        if (usernameValidationStatus.cs.status === 'error') {
          ElMessage.error('请修正用户名错误后再提交')
          return
        }
        
        // 如果用户名还没有验证过，先进行验证
        if (usernameValidationStatus.cs.status === '') {
          await checkUsernameAvailabilityForCS()
          // 验证后再次检查状态
          if (usernameValidationStatus.cs.status === 'error') {
            ElMessage.error('用户名验证失败，请检查后重试')
            return
          }
        }
        
        // 检查手机号验证状态
        const phone = customerServiceFormData.phone?.trim()
        if (phone) {
          // 如果有手机号，检查验证状态
          if (phoneValidationStatus.cs.status === 'error') {
            ElMessage.error(phoneValidationStatus.cs.message || '请修正手机号错误后再提交')
            return
          }
          
          // 如果手机号还没有验证过，先进行验证
          if (phoneValidationStatus.cs.status === '') {
            await checkPhoneAvailabilityForCS()
            // 验证后再次检查状态
            if (phoneValidationStatus.cs.status === 'error') {
              ElMessage.error('手机号验证失败，请检查后重试')
              return
            }
          }
        }
        
        // 构建符合API文档要求的用户数据
        const userData = {
          username: customerServiceFormData.gameNickname.trim(), // 游戏昵称作为用户名（必填）
          realName: customerServiceFormData.realName.trim(), // 真实姓名（必填）
          phone: customerServiceFormData.phone.trim() || '', // 电话号码（可选）
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
            gameNickname: '',
            phone: ''
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
    
    // 获取客服管理的员工列表
    const fetchManagedEmployees = async (csUserId) => {
      isLoadingManagedEmployees.value = true
      try {
        console.log('获取客服管理的员工列表，客服ID:', csUserId)
        const response = await getCsEmployeeMappings()
        console.log('客服员工关系响应:', response)
        
        if (response.code === 200 && response.data) {
          // 过滤出指定客服管理的员工
          const csEmployeeRelations = response.data.filter(mapping => mapping.csUserId === csUserId)
          console.log('该客服管理的关系:', csEmployeeRelations)
          
          // 从用户列表中获取员工详细信息
          const employeeDetails = csEmployeeRelations.map(relation => {
            const employee = users.value.find(user => user.id === relation.employeeUserId)
            if (employee) {
              return {
                id: employee.id,
                username: employee.username,
                realName: employee.realName,
                phone: employee.phone || '未填写',
                workStatus: employee.workStatus || 'OFF_DUTY',
                gender: employee.gender || 'MALE',
                game: '未设置', // 可以后续从其他接口获取
                level: '未设置',
                createdAt: relation.createdAt,
                updatedAt: relation.updatedAt
              }
            }
            return null
          }).filter(Boolean)
          
          managedEmployees.value = employeeDetails
          console.log('管理的员工详细信息:', employeeDetails)
        } else {
          console.error('获取客服员工关系失败:', response.message)
          managedEmployees.value = []
        }
      } catch (error) {
        console.error('获取客服管理的员工失败:', error)
        managedEmployees.value = []
        ElMessage.error('获取员工列表失败')
      } finally {
        isLoadingManagedEmployees.value = false
      }
    }

    const showManagedEmployees = async (customerService) => {
      currentCustomerService.value = customerService
      managedEmployeesVisible.value = true
      
      // 获取该客服管理的员工列表
      await fetchManagedEmployees(customerService.id)
    }
    
    const editCustomerService = (customerService) => {
      // 填充编辑表单数据
      Object.assign(editCustomerServiceFormData, {
        id: customerService.id,
        realName: customerService.realName,
        username: customerService.username,
        phone: customerService.phone || ''
      })
      
      // 重置手机号验证状态
      phoneValidationStatus.editCS = {
        loading: false,
        status: '',
        message: '',
        class: '',
        hintClass: ''
      }
      
      // 重置用户名验证状态
      usernameValidationStatus.editCS = {
        loading: false,
        status: '',
        message: '',
        class: '',
        hintClass: ''
      }
      
      editCustomerServiceVisible.value = true
    }
    
    const handleEditCustomerService = async () => {
      try {
        submitting.value = true
        
        // 检查用户名验证状态
        if (usernameValidationStatus.editCS.status === 'error') {
          ElMessage.error('请修正用户名错误后再提交')
          return
        }
        
        // 如果用户名还没有验证过，先进行验证
        if (usernameValidationStatus.editCS.status === '') {
          await checkUsernameAvailabilityForEditCS()
          // 验证后再次检查状态
          if (usernameValidationStatus.editCS.status === 'error') {
            ElMessage.error('用户名验证失败，请检查后重试')
            return
          }
        }
        
        // 检查手机号验证状态
        const phone = editCustomerServiceFormData.phone?.trim()
        if (phone) {
          // 如果有手机号，检查验证状态
          if (phoneValidationStatus.editCS.status === 'error') {
            ElMessage.error(phoneValidationStatus.editCS.message || '请修正手机号错误后再提交')
            return
          }
          
          // 如果手机号还没有验证过，先进行验证
          if (phoneValidationStatus.editCS.status === '') {
            await checkPhoneAvailabilityForEditCS()
            // 验证后再次检查状态
            if (phoneValidationStatus.editCS.status === 'error') {
              ElMessage.error('手机号验证失败，请检查后重试')
              return
            }
          }
        }
        
        // 使用admin store更新客服
        const updateData = {
          username: editCustomerServiceFormData.username,
          realName: editCustomerServiceFormData.realName,
          phone: editCustomerServiceFormData.phone || '',
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
            username: '',
            phone: ''
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
        username: employee.username,
        phone: employee.phone || ''
      })
      
      // 重置手机号验证状态
      phoneValidationStatus.employee = {
        loading: false,
        status: '',
        message: '',
        class: '',
        hintClass: ''
      }
      
      // 重置用户名验证状态
      usernameValidationStatus.employee = {
        loading: false,
        status: '',
        message: '',
        class: '',
        hintClass: ''
      }
      
      editEmployeeVisible.value = true
    }
    
    const handleEditEmployee = async () => {
      try {
        submitting.value = true
        
        // 检查用户名验证状态
        if (usernameValidationStatus.employee.status === 'error') {
          ElMessage.error('请修正用户名错误后再提交')
          return
        }
        
        // 如果用户名还没有验证过，先进行验证
        if (usernameValidationStatus.employee.status === '') {
          await checkUsernameAvailabilityForEmployee()
          // 验证后再次检查状态
          if (usernameValidationStatus.employee.status === 'error') {
            ElMessage.error('用户名验证失败，请检查后重试')
            return
          }
        }
        
        // 检查手机号验证状态
        const phone = editEmployeeFormData.phone?.trim()
        if (phone) {
          // 如果有手机号，检查验证状态
          if (phoneValidationStatus.employee.status === 'error') {
            ElMessage.error(phoneValidationStatus.employee.message || '请修正手机号错误后再提交')
            return
          }
          
          // 如果手机号还没有验证过，先进行验证
          if (phoneValidationStatus.employee.status === '') {
            await checkPhoneAvailabilityForEmployee()
            // 验证后再次检查状态
            if (phoneValidationStatus.employee.status === 'error') {
              ElMessage.error('手机号验证失败，请检查后重试')
              return
            }
          }
        }
        
        // 使用admin store更新员工
        const updateData = {
          username: editEmployeeFormData.username,
          realName: editEmployeeFormData.realName,
          phone: editEmployeeFormData.phone || '',
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
            username: '',
            phone: ''
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
    
    // 获取员工的客服名称（支持多个客服）
    const getEmployeeCsName = (employeeUserId) => {
      const mappings = csEmployeeMappings.value.filter(m => m.employeeUserId === employeeUserId)
      if (mappings.length > 0) {
        const csNames = mappings.map(mapping => {
        const cs = customerServices.value.find(cs => cs.id === mapping.csUserId)
        return cs ? `${cs.realName} (${cs.username})` : '未知客服'
        }).filter(name => name !== '未知客服')
        
        return csNames.length > 0 ? csNames.join(', ') : '未知客服'
      }
      return '未分配'
    }
    
    // 获取员工的所有客服信息（用于标签显示）
    const getEmployeeCsList = (employeeUserId) => {
      const mappings = csEmployeeMappings.value.filter(m => m.employeeUserId === employeeUserId)
      return mappings.map(mapping => {
        const cs = customerServices.value.find(cs => cs.id === mapping.csUserId)
        return cs ? {
          id: cs.id,
          realName: cs.realName,
          username: cs.username,
          fullName: `${cs.realName} (${cs.username})`
        } : null
      }).filter(Boolean)
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
          // 检查配置是否允许显示网络错误
          if (config.errorHandling?.showNetworkErrors) {
            ElMessage.error('网络错误，请检查连接')
          } else {
            console.log('网络错误已被配置隐藏: 网络请求失败')
          }
        }
      } finally {
        isLoadingMappings.value = false
      }
    }

    // 刷新员工卡片数据：直接使用 /admin/users 接口返回的完整用户信息
    const refreshCardEmployees = async () => {
      try {
        isLoadingEmployees.value = true
        // 确保有用户数据
        if (!users.value || users.value.length === 0) {
          await refreshEmployeeList()
        }
        
        // 直接从用户列表中过滤出员工，接口已包含workStatus和gender信息
        const employeeList = (users.value || [])
          .filter(u => u.role === 'EMPLOYEE')
          .map(u => ({
            id: u.id,
            name: u.realName || u.username || '未知员工',
            username: u.username,
            realName: u.realName,
            phone: u.phone || '', // 添加电话号码字段
            avatar: '',
            workStatus: u.workStatus || 'OFF_DUTY', // 直接使用接口返回的工作状态
            gender: u.gender || 'MALE', // 直接使用接口返回的性别
            game: '未设置',
            level: '未设置',
            todayOrders: 0,
            totalOrders: 0,
            rating: 0
          }))

        cardEmployees.value = employeeList
        console.log('管理员页面 - 员工卡片数据已更新:', employeeList.length, '条记录')
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
          // 检查配置是否允许显示网络错误
          if (config.errorHandling?.showNetworkErrors) {
            ElMessage.error('网络错误，请检查连接')
          } else {
            console.log('网络错误已被配置隐藏: 网络请求失败')
          }
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
    
    // 检查新增客服用户名可用性
    const checkUsernameAvailabilityForCS = async () => {
      const username = customerServiceFormData.gameNickname?.trim()
      if (!username) {
        usernameValidationStatus.cs = {
          loading: false,
          status: '',
          message: '',
          class: '',
          hintClass: ''
        }
        return
      }
      
      if (username.length < 2 || username.length > 20) {
        usernameValidationStatus.cs = {
          loading: false,
          status: 'error',
          message: '用户名长度在 2 到 20 个字符',
          class: 'username-error',
          hintClass: 'error-hint'
        }
        return
      }
      
      usernameValidationStatus.cs.loading = true
      
      try {
        const response = await checkUsernameAPI(username)
        if (response.code === 200 && response.data === true) {
          usernameValidationStatus.cs = {
            loading: false,
            status: 'success',
            message: '用户名可用',
            class: 'username-success',
            hintClass: 'success-hint'
          }
        } else {
          usernameValidationStatus.cs = {
            loading: false,
            status: 'error',
            message: '用户名已被使用',
            class: 'username-error',
            hintClass: 'error-hint'
          }
        }
      } catch (error) {
        usernameValidationStatus.cs = {
          loading: false,
          status: 'error',
          message: '检查用户名失败，请稍后重试',
          class: 'username-error',
          hintClass: 'error-hint'
        }
      }
    }
    
    // 检查编辑客服用户名可用性
    const checkUsernameAvailabilityForEditCS = async () => {
      const username = editCustomerServiceFormData.username?.trim()
      if (!username) {
        usernameValidationStatus.editCS = {
          loading: false,
          status: '',
          message: '',
          class: '',
          hintClass: ''
        }
        return
      }
      
      if (username.length < 2 || username.length > 20) {
        usernameValidationStatus.editCS = {
          loading: false,
          status: 'error',
          message: '用户名长度在 2 到 20 个字符',
          class: 'username-error',
          hintClass: 'error-hint'
        }
        return
      }
      
      // 检查是否是原来的用户名（没有修改）
      const currentUser = customerServices.value.find(cs => cs.id === editCustomerServiceFormData.id)
      if (currentUser && currentUser.username === username) {
        usernameValidationStatus.editCS = {
          loading: false,
          status: 'success',
          message: '当前用户名',
          class: 'username-success',
          hintClass: 'success-hint'
        }
        return
      }
      
      usernameValidationStatus.editCS.loading = true
      
      try {
        const response = await checkUsernameAPI(username)
        if (response.code === 200 && response.data === true) {
          usernameValidationStatus.editCS = {
            loading: false,
            status: 'success',
            message: '用户名可用',
            class: 'username-success',
            hintClass: 'success-hint'
          }
        } else {
          usernameValidationStatus.editCS = {
            loading: false,
            status: 'error',
            message: '用户名已被使用',
            class: 'username-error',
            hintClass: 'error-hint'
          }
        }
      } catch (error) {
        usernameValidationStatus.editCS = {
          loading: false,
          status: 'error',
          message: '检查用户名失败，请稍后重试',
          class: 'username-error',
          hintClass: 'error-hint'
        }
      }
    }
    
    // 检查编辑员工用户名可用性
    const checkUsernameAvailabilityForEmployee = async () => {
      const username = editEmployeeFormData.username?.trim()
      if (!username) {
        usernameValidationStatus.employee = {
          loading: false,
          status: '',
          message: '',
          class: '',
          hintClass: ''
        }
        return
      }
      
      if (username.length < 2 || username.length > 20) {
        usernameValidationStatus.employee = {
          loading: false,
          status: 'error',
          message: '用户名长度在 2 到 20 个字符',
          class: 'username-error',
          hintClass: 'error-hint'
        }
        return
      }
      
      // 检查是否是原来的用户名（没有修改）
      const currentUser = employees.value.find(emp => emp.id === editEmployeeFormData.id)
      if (currentUser && currentUser.username === username) {
        usernameValidationStatus.employee = {
          loading: false,
          status: 'success',
          message: '当前用户名',
          class: 'username-success',
          hintClass: 'success-hint'
        }
        return
      }
      
      usernameValidationStatus.employee.loading = true
      
      try {
        const response = await checkUsernameAPI(username)
        if (response.code === 200 && response.data === true) {
          usernameValidationStatus.employee = {
            loading: false,
            status: 'success',
            message: '用户名可用',
            class: 'username-success',
            hintClass: 'success-hint'
          }
        } else {
          usernameValidationStatus.employee = {
            loading: false,
            status: 'error',
            message: '用户名已被使用',
            class: 'username-error',
            hintClass: 'error-hint'
          }
        }
      } catch (error) {
        usernameValidationStatus.employee = {
          loading: false,
          status: 'error',
          message: '检查用户名失败，请稍后重试',
          class: 'username-error',
          hintClass: 'error-hint'
        }
      }
    }
    
    // 验证手机号格式
    const validatePhoneFormat = (phone) => {
      if (!phone) return true // 手机号可选
      
      // 放宽手机号格式验证，允许更多格式通过，由后端API来最终验证
      // 只检查基本的长度和字符要求
      const trimmed = phone.trim()
      
      // 至少3位数字，最多20位（包含可能的国际区号、分隔符等）
      if (trimmed.length < 3 || trimmed.length > 20) {
        return false
      }
      
      // 只包含数字、+号、-号、空格、括号
      const phoneRegex = /^[\d\+\-\s\(\)]+$/
      return phoneRegex.test(trimmed)
    }
    
    // 检查客服手机号可用性
    const checkPhoneAvailabilityForCS = async () => {
      const phone = customerServiceFormData.phone?.trim()
      if (!phone) {
        phoneValidationStatus.cs = {
          loading: false,
          status: '',
          message: '',
          class: '',
          hintClass: ''
        }
        return
      }
      
      if (!validatePhoneFormat(phone)) {
        phoneValidationStatus.cs = {
          loading: false,
          status: 'error',
          message: '手机号格式不正确，请输入有效的手机号',
          class: 'phone-error',
          hintClass: 'error-hint'
        }
        return
      }
      
      phoneValidationStatus.cs.loading = true
      
      try {
        const response = await checkPhoneAvailability(phone)
        if (response.code === 200 && response.data === true) {
          phoneValidationStatus.cs = {
            loading: false,
            status: 'success',
            message: '手机号可用',
            class: 'phone-success',
            hintClass: 'success-hint'
          }
        } else {
          phoneValidationStatus.cs = {
            loading: false,
            status: 'error',
            message: '手机号已被其他用户使用，请更换手机号',
            class: 'phone-error',
            hintClass: 'error-hint'
          }
        }
      } catch (error) {
        phoneValidationStatus.cs = {
          loading: false,
          status: 'error',
          message: '检查手机号失败，请稍后重试',
          class: 'phone-error',
          hintClass: 'error-hint'
        }
      }
    }
    
    // 检查员工手机号可用性
    const checkPhoneAvailabilityForEmployee = async () => {
      const phone = editEmployeeFormData.phone?.trim()
      if (!phone) {
        phoneValidationStatus.employee = {
          loading: false,
          status: '',
          message: '',
          class: '',
          hintClass: ''
        }
        return
      }
      
      if (!validatePhoneFormat(phone)) {
        phoneValidationStatus.employee = {
          loading: false,
          status: 'error',
          message: '手机号格式不正确，请输入有效的手机号',
          class: 'phone-error',
          hintClass: 'error-hint'
        }
        return
      }
      
      // 检查是否是原来的手机号（没有修改）
      const currentUser = employees.value.find(emp => emp.id === editEmployeeFormData.id)
      if (currentUser && currentUser.phone === phone) {
        phoneValidationStatus.employee = {
          loading: false,
          status: 'success',
          message: '当前手机号',
          class: 'phone-success',
          hintClass: 'success-hint'
        }
        return
      }
      
      phoneValidationStatus.employee.loading = true
      
      try {
        const response = await checkPhoneAvailability(phone)
        if (response.code === 200 && response.data === true) {
          phoneValidationStatus.employee = {
            loading: false,
            status: 'success',
            message: '手机号可用',
            class: 'phone-success',
            hintClass: 'success-hint'
          }
        } else {
          phoneValidationStatus.employee = {
            loading: false,
            status: 'error',
            message: '手机号已被其他用户使用，请更换手机号',
            class: 'phone-error',
            hintClass: 'error-hint'
          }
        }
      } catch (error) {
        phoneValidationStatus.employee = {
          loading: false,
          status: 'error',
          message: '检查手机号失败，请稍后重试',
          class: 'phone-error',
          hintClass: 'error-hint'
        }
      }
    }
    
    // 检查编辑客服手机号可用性
    const checkPhoneAvailabilityForEditCS = async () => {
      const phone = editCustomerServiceFormData.phone?.trim()
      if (!phone) {
        phoneValidationStatus.editCS = {
          loading: false,
          status: '',
          message: '',
          class: '',
          hintClass: ''
        }
        return
      }
      
      if (!validatePhoneFormat(phone)) {
        phoneValidationStatus.editCS = {
          loading: false,
          status: 'error',
          message: '手机号格式不正确，请输入有效的手机号',
          class: 'phone-error',
          hintClass: 'error-hint'
        }
        return
      }
      
      // 检查是否是原来的手机号（没有修改）
      const currentUser = customerServices.value.find(cs => cs.id === editCustomerServiceFormData.id)
      if (currentUser && currentUser.phone === phone) {
        phoneValidationStatus.editCS = {
          loading: false,
          status: 'success',
          message: '当前手机号',
          class: 'phone-success',
          hintClass: 'success-hint'
        }
        return
      }
      
      phoneValidationStatus.editCS.loading = true
      
      try {
        const response = await checkPhoneAvailability(phone)
        if (response.code === 200 && response.data === true) {
          phoneValidationStatus.editCS = {
            loading: false,
            status: 'success',
            message: '手机号可用',
            class: 'phone-success',
            hintClass: 'success-hint'
          }
        } else {
          phoneValidationStatus.editCS = {
            loading: false,
            status: 'error',
            message: '手机号已被其他用户使用，请更换手机号',
            class: 'phone-error',
            hintClass: 'error-hint'
          }
        }
      } catch (error) {
        phoneValidationStatus.editCS = {
          loading: false,
          status: 'error',
          message: '检查手机号失败，请稍后重试',
          class: 'phone-error',
          hintClass: 'error-hint'
        }
      }
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
        // 数据获取函数 - 现在只需要调用用户列表接口
        async () => {
          // 获取用户数据，接口已包含workStatus和gender信息
          const userResult = await adminStore.actions.fetchUsers()
          if (!userResult || !userResult.success) {
            throw new Error('获取用户数据失败')
          }
          
          // 直接过滤出员工用户，无需额外的API调用
          const employeeList = (userResult.data || users.value || [])
            .filter(u => u.role === 'EMPLOYEE')
            .map(u => ({
              id: u.id,
              name: u.realName || u.username || '未知员工',
              username: u.username,
              realName: u.realName,
              phone: u.phone || '', // 添加电话号码字段
              avatar: '',
              workStatus: u.workStatus || 'OFF_DUTY', // 直接使用接口返回的工作状态
              gender: u.gender || 'MALE', // 直接使用接口返回的性别
              game: '未设置',
              level: '未设置',
              todayOrders: 0,
              totalOrders: 0,
              rating: 0
            }))
          
          return employeeList
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
          // 检查是否正在登出或刚刚登出，避免无效的API调用
          const { isLogoutInProgress, lastLogoutTime } = authStore.state
          const timeSinceLogout = Date.now() - lastLogoutTime
          
          if (isLogoutInProgress || timeSinceLogout < 100) {
            console.log('🚪 正在登出或刚刚登出，跳过用户信息获取')
            return
          }
          
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
      managedEmployees,
      isLoadingManagedEmployees,
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
      getEmployeeCsList,
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
      usernameValidationStatus,
      checkUsernameAvailabilityForCS,
      checkUsernameAvailabilityForEditCS,
      checkUsernameAvailabilityForEmployee,
      phoneValidationStatus,
      checkPhoneAvailabilityForCS,
      checkPhoneAvailabilityForEmployee,
      checkPhoneAvailabilityForEditCS,
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
  width: 100%;
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
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
  min-height: 200px;
}

@media (min-width: 1200px) {
  .employee-grid {
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 18px;
  }
}

@media (min-width: 1600px) {
  .employee-grid {
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 20px;
  }
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
  display: flex;
  flex-direction: column;
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
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
  transition: box-shadow 0.3s ease;
}

.customer-service-section:hover,
.employee-management-section:hover {
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
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

/* 表格美化样式 */
.custom-table {
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.custom-table :deep(.el-table__header-wrapper) {
  border-radius: 8px 8px 0 0;
}

.custom-table :deep(.el-table__body-wrapper) {
  border-radius: 0 0 8px 8px;
}

.custom-table :deep(.el-table__row) {
  transition: all 0.3s ease;
  position: relative;
}

.custom-table :deep(.el-table__row:hover) {
  background-color: #f8faff;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.1);
  z-index: 10;
}

.custom-table :deep(.el-table__cell) {
  padding: 12px 8px;
  border-bottom: 1px solid #f0f2f5;
  overflow: visible;
}

/* 操作列特殊处理，确保按钮不被裁切 */
.custom-table :deep(.el-table__cell:last-child) {
  overflow: visible;
  position: relative;
}

/* 表格滚动条样式 */
.custom-table :deep(.el-scrollbar__wrap) {
  overflow-x: auto;
}

.custom-table :deep(.el-scrollbar__bar) {
  opacity: 0.6;
}

.custom-table :deep(.el-scrollbar__bar:hover) {
  opacity: 0.8;
}

.custom-table :deep(.el-scrollbar__thumb) {
  background-color: #c1c1c1;
  border-radius: 4px;
}

.custom-table :deep(.el-scrollbar__thumb:hover) {
  background-color: #a8a8a8;
}

/* 表格容器高度自适应 */
.customer-service-section .custom-table,
.employee-management-section .custom-table {
  min-height: 300px;
  max-height: 500px;
}

.text-muted {
  color: #909399;
  font-style: italic;
}

/* 操作按钮样式 */
.table-actions {
  display: flex;
  gap: 8px;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
  position: relative;
  z-index: 5;
  padding: 2px 0;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 12px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.3s ease;
  border: 1px solid #d9ecff;
  background-color: #f0f9ff;
}

.action-btn:hover {
  border-color: #409eff;
  background-color: #ecf5ff;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  position: relative;
  z-index: 20;
}

.action-btn.danger {
  border-color: #fde2e2;
  background-color: #fef0f0;
}

.action-btn.danger:hover {
  background-color: #fef0f0;
  border-color: #fab6b6;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(245, 108, 108, 0.15);
  position: relative;
  z-index: 20;
}

/* 员工数量按钮样式 */
.employee-count-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border-radius: 16px;
  font-size: 13px;
  font-weight: 500;
  background: linear-gradient(135deg, #409eff, #66b3ff);
  color: white;
  border: none;
  transition: all 0.3s ease;
}

.employee-count-btn:hover {
  background: linear-gradient(135deg, #337ecc, #5aa3e6);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
}

/* 客服标签样式 */
.cs-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.cs-tag .el-icon {
  font-size: 12px;
}

/* 客服标签容器 */
.cs-tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
}

.cs-tags-container .cs-tag {
  margin: 0;
  flex-shrink: 0;
}

/* 手机号验证样式 */
.phone-success {
  border-color: #67c23a;
}

.phone-success:focus {
  border-color: #67c23a;
  box-shadow: 0 0 0 2px rgba(103, 194, 58, 0.2);
}

.phone-error {
  border-color: #f56c6c;
}

.phone-error:focus {
  border-color: #f56c6c;
  box-shadow: 0 0 0 2px rgba(245, 108, 108, 0.2);
}

/* 用户名验证样式 */
.username-success {
  border-color: #67c23a;
}

.username-success:focus {
  border-color: #67c23a;
  box-shadow: 0 0 0 2px rgba(103, 194, 58, 0.2);
}

.username-error {
  border-color: #f56c6c;
}

.username-error:focus {
  border-color: #f56c6c;
  box-shadow: 0 0 0 2px rgba(245, 108, 108, 0.2);
}

.success-icon {
  color: #67c23a;
}

.error-icon {
  color: #f56c6c;
}

.success-hint {
  color: #67c23a;
  font-weight: 500;
}

.error-hint {
  color: #f56c6c;
  font-weight: 500;
}

/* .is-loading 类的旋转动画效果已移除 */

/* 管理员工对话框样式 */
.managed-employees-dialog {
  border-radius: 12px;
  overflow: hidden;
}

.managed-employees-dialog :deep(.el-dialog__header) {
  background: linear-gradient(135deg, #409eff, #66b3ff);
  color: white;
  padding: 20px 24px;
  margin: 0;
}

.managed-employees-dialog :deep(.el-dialog__title) {
  color: white;
  font-size: 18px;
  font-weight: 600;
}

.managed-employees-dialog :deep(.el-dialog__close) {
  color: white;
  font-size: 20px;
}

.managed-employees-dialog :deep(.el-dialog__close:hover) {
  color: #f0f9ff;
}

.managed-employees-content {
  padding: 0;
}

/* 客服信息卡片 */
.cs-info-card {
  display: flex;
  align-items: center;
  padding: 20px 24px;
  background: linear-gradient(135deg, #f8faff, #ecf5ff);
  border-bottom: 1px solid #e9ecef;
  margin-bottom: 20px;
}

.cs-avatar {
  margin-right: 20px;
}

.cs-avatar-img {
  background: linear-gradient(135deg, #409eff, #66b3ff);
  color: white;
  font-size: 24px;
  font-weight: 600;
}

.cs-details {
  flex: 1;
}

.cs-name {
  margin: 0 0 8px 0;
  font-size: 20px;
  font-weight: 600;
  color: #303133;
}

.cs-username,
.cs-phone {
  margin: 4px 0;
  color: #606266;
  font-size: 14px;
}

.cs-stats {
  text-align: center;
}

.cs-stats .stat-item {
  background: white;
  padding: 16px 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* 员工列表区域 */
.employees-list-section {
  padding: 0 24px 20px;
}

.managed-employees-table {
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.managed-employees-table :deep(.el-table__header-wrapper) {
  border-radius: 8px 8px 0 0;
}

.managed-employees-table :deep(.el-table__body-wrapper) {
  border-radius: 0 0 8px 8px;
}

.managed-employees-table :deep(.el-table__row) {
  transition: all 0.3s ease;
}

.managed-employees-table :deep(.el-table__row:hover) {
  background-color: #f8faff;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.1);
}

.managed-employees-table :deep(.el-table__cell) {
  padding: 12px 8px;
  border-bottom: 1px solid #f0f2f5;
}

/* 对话框底部样式 */
.managed-employees-dialog :deep(.el-dialog__footer) {
  padding: 16px 24px;
  background: #f8f9fa;
  border-top: 1px solid #e9ecef;
  text-align: center;
}
</style>