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
                  <el-option label="工作中" value="working" />
                  <el-option label="空闲中" value="idle" />
                  <el-option label="离线" value="offline" />
                </el-select>
                <el-button
                  :icon="Refresh"
                  @click="refreshEmployeeList"
                  :loading="isLoadingEmployees"
                >
                  刷新
                </el-button>
              </div>
            </div>

            <!-- 员工卡片网格 -->
            <div class="employee-grid" v-loading="isLoadingEmployees">
              <div
                v-for="employee in filteredEmployees"
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
                    {{ employee.name.charAt(0) }}
                  </el-avatar>
                  <div class="employee-info">
                    <h4 class="employee-name">{{ employee.name }}</h4>
                    <div class="employee-meta">
                      <el-tag
                        :type="getStatusTagType(employee.status)"
                        size="small"
                        class="status-tag"
                      >
                        {{ getStatusText(employee.status) }}
                      </el-tag>
                      <span class="nickname">{{ employee.nickname || '未设置' }}</span>
                    </div>
                  </div>
                </div>

                <div class="card-body">
                  <div class="info-row">
                    <span class="label">擅长游戏:</span>
                    <span class="value">{{ employee.game || '未设置' }}</span>
                  </div>
                  <div class="info-row">
                    <span class="label">等级:</span>
                    <span class="value highlight">{{ employee.level || '未设置' }}</span>
                  </div>
                  <div class="info-row">
                    <span class="label">今日工单:</span>
                    <span class="value highlight">{{ employee.todayOrders || 0 }}</span>
                    <span class="label">总工单:</span>
                    <span class="value">{{ employee.totalOrders || 0 }}</span>
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
                </div>
              </div>
            </div>

            <!-- 空状态 -->
            <el-empty
              v-if="!isLoadingEmployees && employees.length === 0"
              description="暂无员工数据"
            />
          </div>
        </el-tab-pane>

        <!-- 员工管理标签页 -->
        <el-tab-pane label="员工管理" name="management">
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
                  <el-table-column prop="nickname" label="昵称" width="120" />
                  <el-table-column prop="name" label="姓名" width="120" />
                  <el-table-column label="管理列表" width="150">
                    <template #default="scope">
                      <el-button 
                        size="small" 
                        @click="showManagedEmployees(scope.row)"
                        type="text"
                      >
                        管理{{ scope.row.managedEmployees?.length || 0 }}名员工
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
                  <el-button type="success" @click="showAddEmployeeDialog">
                    新增员工
                  </el-button>
                </div>
                
                <el-table :data="allEmployees" stripe style="width: 100%">
                  <el-table-column prop="nickname" label="昵称" width="120" />
                  <el-table-column prop="name" label="姓名" width="120" />
                  <el-table-column label="分配客服" width="150">
                    <template #default="scope">
                      <el-select
                        :model-value="scope.row.assignedCustomerService"
                        placeholder="选择客服"
                        size="small"
                        @change="(value) => assignEmployeeToCustomerService(scope.row, value)"
                      >
                        <el-option
                          v-for="cs in customerServices"
                          :key="cs.id"
                          :label="cs.name"
                          :value="cs.id"
                        />
                      </el-select>
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
      </el-tabs>
    </div>

    <!-- 新增员工对话框 -->
    <el-dialog v-model="addEmployeeVisible" title="新增员工" width="500px">
      <el-form
        ref="employeeForm"
        :model="employeeFormData"
        :rules="employeeFormRules"
        label-width="100px"
      >
        <el-form-item label="昵称" prop="nickname">
          <el-input v-model="employeeFormData.nickname" placeholder="请输入昵称" />
        </el-form-item>
        <el-form-item label="姓名" prop="name">
          <el-input v-model="employeeFormData.name" placeholder="请输入真实姓名" />
        </el-form-item>
        <el-form-item label="用户名" prop="username">
          <el-input v-model="employeeFormData.username" placeholder="请输入登录用户名" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="employeeFormData.password" type="password" placeholder="请输入密码" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="employeeFormData.email" placeholder="请输入邮箱" />
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="employeeFormData.phone" placeholder="请输入手机号" />
        </el-form-item>
        <el-form-item label="擅长游戏" prop="game">
          <el-input v-model="employeeFormData.game" placeholder="请输入擅长游戏" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="addEmployeeVisible = false">取消</el-button>
        <el-button type="primary" @click="handleAddEmployee" :loading="submitting">确定</el-button>
      </template>
    </el-dialog>

    <!-- 新增客服对话框 -->
    <el-dialog v-model="addCustomerServiceVisible" title="新增客服" width="500px">
      <el-form
        ref="customerServiceForm"
        :model="customerServiceFormData"
        :rules="customerServiceFormRules"
        label-width="100px"
      >
        <el-form-item label="昵称" prop="nickname">
          <el-input v-model="customerServiceFormData.nickname" placeholder="请输入昵称" />
        </el-form-item>
        <el-form-item label="姓名" prop="name">
          <el-input v-model="customerServiceFormData.name" placeholder="请输入真实姓名" />
        </el-form-item>
        <el-form-item label="用户名" prop="username">
          <el-input v-model="customerServiceFormData.username" placeholder="请输入登录用户名" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="customerServiceFormData.password" type="password" placeholder="请输入密码" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="customerServiceFormData.email" placeholder="请输入邮箱" />
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="customerServiceFormData.phone" placeholder="请输入手机号" />
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
        <h4>{{ currentCustomerService.name }} 管理的员工</h4>
        <el-table :data="currentCustomerService.managedEmployees || []" stripe style="width: 100%">
          <el-table-column prop="nickname" label="昵称" width="120" />
          <el-table-column prop="name" label="姓名" width="120" />
          <el-table-column prop="game" label="擅长游戏" width="150" />
          <el-table-column label="状态" width="100">
            <template #default="scope">
              <el-tag :type="getStatusTagType(scope.row.status)" size="small">
                {{ getStatusText(scope.row.status) }}
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
    <el-dialog v-model="editEmployeeVisible" title="编辑员工信息" width="500px">
      <el-form
        ref="editEmployeeForm"
        :model="editEmployeeFormData"
        :rules="editEmployeeFormRules"
        label-width="80px"
      >
        <el-form-item label="昵称" prop="nickname">
          <el-input v-model="editEmployeeFormData.nickname" placeholder="请输入昵称" />
        </el-form-item>
        <el-form-item label="姓名" prop="name">
          <el-input v-model="editEmployeeFormData.name" placeholder="请输入真实姓名" />
        </el-form-item>
        <el-form-item label="用户名" prop="username">
          <el-input v-model="editEmployeeFormData.username" placeholder="请输入登录用户名" />
        </el-form-item>
        <el-form-item label="性别">
          <el-select v-model="editEmployeeFormData.gender" style="width: 100%">
            <el-option label="男" value="male" />
            <el-option label="女" value="female" />
          </el-select>
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="editEmployeeFormData.email" placeholder="请输入邮箱" />
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="editEmployeeFormData.phone" placeholder="请输入手机号" />
        </el-form-item>
        <el-form-item label="擅长游戏" prop="game">
          <el-input v-model="editEmployeeFormData.game" placeholder="请输入擅长游戏" />
        </el-form-item>
        <el-form-item label="游戏等级" prop="level">
          <el-input v-model="editEmployeeFormData.level" placeholder="请输入游戏等级" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editEmployeeVisible = false">取消</el-button>
        <el-button type="primary" @click="handleEditEmployee" :loading="submitting">确定</el-button>
      </template>
    </el-dialog>

    <!-- 编辑客服对话框 -->
    <el-dialog v-model="editCustomerServiceVisible" title="编辑客服信息" width="500px">
      <el-form
        ref="editCustomerServiceForm"
        :model="editCustomerServiceFormData"
        :rules="editCustomerServiceFormRules"
        label-width="80px"
      >
        <el-form-item label="昵称" prop="nickname">
          <el-input v-model="editCustomerServiceFormData.nickname" placeholder="请输入昵称" />
        </el-form-item>
        <el-form-item label="姓名" prop="name">
          <el-input v-model="editCustomerServiceFormData.name" placeholder="请输入真实姓名" />
        </el-form-item>
        <el-form-item label="用户名" prop="username">
          <el-input v-model="editCustomerServiceFormData.username" placeholder="请输入登录用户名" />
        </el-form-item>
        <el-form-item label="性别">
          <el-select v-model="editCustomerServiceFormData.gender" style="width: 100%">
            <el-option label="男" value="male" />
            <el-option label="女" value="female" />
          </el-select>
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="editCustomerServiceFormData.email" placeholder="请输入邮箱" />
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="editCustomerServiceFormData.phone" placeholder="请输入手机号" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editCustomerServiceVisible = false">取消</el-button>
        <el-button type="primary" @click="handleEditCustomerService" :loading="submitting">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, computed, onMounted, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  User,
  Service,
  UserFilled,
  Refresh
} from '@element-plus/icons-vue'
import customerServiceStore from '../store/customerService'

export default {
  name: 'Admin',
  components: {
    User,
    Service,
    UserFilled,
    Refresh
  },
  setup() {
    const router = useRouter()
    
    // 响应式数据
    const activeTab = ref('employees')
    const employeeStatusFilter = ref('')
    const isLoadingEmployees = ref(false)
    const submitting = ref(false)
    
    // 对话框状态
    const addEmployeeVisible = ref(false)
    const addCustomerServiceVisible = ref(false)
    const managedEmployeesVisible = ref(false)
    const editEmployeeVisible = ref(false)
    const editCustomerServiceVisible = ref(false)
    const currentCustomerService = ref(null)
    
    // 模拟数据
    const employees = ref([
      { 
        id: 1, 
        nickname: '梦之追忆', 
        name: '张三', 
        status: 'working', 
        game: '王者荣耀', 
        level: '王者50星',
        todayOrders: 3,
        totalOrders: 156,
        avatar: 'https://picsum.photos/100/100?random=1',
        assignedCustomerService: 1
      },
      { 
        id: 2, 
        nickname: '竞学弟', 
        name: '李四', 
        status: 'idle', 
        game: '英雄联盟', 
        level: '钻石1',
        todayOrders: 1,
        totalOrders: 89,
        avatar: 'https://picsum.photos/100/100?random=2',
        assignedCustomerService: 1
      },
      { 
        id: 3, 
        nickname: '清水健', 
        name: '王五', 
        status: 'idle', 
        game: '和平精英', 
        level: '战神',
        todayOrders: 2,
        totalOrders: 234,
        avatar: 'https://picsum.photos/100/100?random=3',
        assignedCustomerService: null
      }
    ])
    
    const customerServices = ref([
      {
        id: 1,
        nickname: 'kefu01',
        name: '客服小王',
        managedEmployees: [
          { id: 1, nickname: '梦之追忆', name: '张三', game: '王者荣耀', status: 'working' },
          { id: 2, nickname: '竞学弟', name: '李四', game: '英雄联盟', status: 'idle' }
        ]
      }
    ])
    
    // 表单数据
    const employeeFormData = reactive({
      nickname: '',
      name: '',
      username: '',
      password: '',
      email: '',
      phone: '',
      game: ''
    })
    
    // 编辑员工表单数据
    const editEmployeeFormData = reactive({
      id: null,
      nickname: '',
      name: '',
      username: '',
      email: '',
      phone: '',
      game: '',
      level: '',
      gender: 'male'
    })
    
    const customerServiceFormData = reactive({
      nickname: '',
      name: '',
      username: '',
      password: '',
      email: '',
      phone: ''
    })
    
    // 编辑客服表单数据
    const editCustomerServiceFormData = reactive({
      id: null,
      nickname: '',
      name: '',
      username: '',
      email: '',
      phone: '',
      gender: 'male'
    })
    
    // 表单验证规则
    const employeeFormRules = {
      nickname: [{ required: true, message: '请输入昵称', trigger: 'blur' }],
      name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
      username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
      password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
      email: [{ required: true, message: '请输入邮箱', trigger: 'blur' }]
    }
    
    const customerServiceFormRules = {
      nickname: [{ required: true, message: '请输入昵称', trigger: 'blur' }],
      name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
      username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
      password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
      email: [{ required: true, message: '请输入邮箱', trigger: 'blur' }]
    }
    
    const editEmployeeFormRules = {
      nickname: [{ required: true, message: '请输入昵称', trigger: 'blur' }],
      name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
      username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
      email: [{ required: true, message: '请输入邮箱', trigger: 'blur' }],
      phone: [{ required: true, message: '请输入手机号', trigger: 'blur' }],
      game: [{ required: true, message: '请输入擅长游戏', trigger: 'blur' }],
      level: [{ required: true, message: '请输入游戏等级', trigger: 'blur' }]
    }
    
    const editCustomerServiceFormRules = {
      nickname: [{ required: true, message: '请输入昵称', trigger: 'blur' }],
      name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
      username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
      email: [{ required: true, message: '请输入邮箱', trigger: 'blur' }],
      phone: [{ required: true, message: '请输入手机号', trigger: 'blur' }]
    }
    
    // 计算属性
    const totalEmployeeCount = computed(() => employees.value.length)
    const customerServiceCount = computed(() => customerServices.value.length)
    const onlineEmployeeCount = computed(() => 
      employees.value.filter(emp => emp.status !== 'offline').length
    )
    
    const filteredEmployees = computed(() => {
      if (!employeeStatusFilter.value) return employees.value
      return employees.value.filter(emp => emp.status === employeeStatusFilter.value)
    })
    
    const allEmployees = computed(() => employees.value)
    
    // 方法
    const getStatusTagType = (status) => {
      const statusMap = {
        'working': 'success',
        'idle': 'info',
        'offline': 'danger'
      }
      return statusMap[status] || 'info'
    }
    
    const getStatusText = (status) => {
      const statusMap = {
        'working': '工作中',
        'idle': '空闲中',
        'offline': '离线'
      }
      return statusMap[status] || '未知'
    }
    
    const handleTabChange = (tabName) => {
      activeTab.value = tabName
    }
    
    const handleEmployeeFilter = () => {
      // 筛选逻辑已通过计算属性实现
    }
    
    const refreshEmployeeList = async () => {
      isLoadingEmployees.value = true
      // 模拟API调用
      setTimeout(() => {
        isLoadingEmployees.value = false
        ElMessage.success('员工列表已刷新')
      }, 1000)
    }
    
    const viewEmployeeDetail = (employee) => {
      // 将员工信息转换为客服store期望的格式
      const employeeForStore = {
        id: employee.id,
        name: employee.name,
        nickname: employee.nickname,
        avatar: employee.avatar,
        status: employee.status,
        game: employee.game,
        level: employee.level,
        orderWillingness: 85, // 默认值
        todayOrders: employee.todayOrders || 0,
        totalOrders: employee.totalOrders || 0,
        rating: 4.5 // 默认值
      }
      
      // 设置当前员工到客服store
      customerServiceStore.actions.setCurrentEmployee(employeeForStore)
      
      // 跳转到员工详情页面
      router.push({
        name: 'EmployeeDetail',
        params: { id: employee.id }
      })
    }
    
    const showAddEmployeeDialog = () => {
      Object.assign(employeeFormData, {
        nickname: '',
        name: '',
        username: '',
        password: '',
        email: '',
        phone: '',
        game: ''
      })
      addEmployeeVisible.value = true
    }
    
    const handleAddEmployee = async () => {
      submitting.value = true
      // 模拟API调用
      setTimeout(() => {
        const newEmployee = {
          id: employees.value.length + 1,
          nickname: employeeFormData.nickname,
          name: employeeFormData.name,
          status: 'idle',
          game: employeeFormData.game,
          level: '新手',
          todayOrders: 0,
          totalOrders: 0,
          avatar: `https://picsum.photos/100/100?random=${employees.value.length + 1}`,
          assignedCustomerService: null
        }
        employees.value.push(newEmployee)
        addEmployeeVisible.value = false
        submitting.value = false
        ElMessage.success('员工添加成功')
      }, 1000)
    }
    
    const showAddCustomerServiceDialog = () => {
      Object.assign(customerServiceFormData, {
        nickname: '',
        name: '',
        username: '',
        password: '',
        email: '',
        phone: ''
      })
      addCustomerServiceVisible.value = true
    }
    
    const handleAddCustomerService = async () => {
      submitting.value = true
      // 模拟API调用
      setTimeout(() => {
        const newCustomerService = {
          id: customerServices.value.length + 1,
          nickname: customerServiceFormData.nickname,
          name: customerServiceFormData.name,
          managedEmployees: []
        }
        customerServices.value.push(newCustomerService)
        addCustomerServiceVisible.value = false
        submitting.value = false
        ElMessage.success('客服添加成功')
      }, 1000)
    }
    
    const showManagedEmployees = (customerService) => {
      currentCustomerService.value = customerService
      managedEmployeesVisible.value = true
    }
    
    const editCustomerService = (customerService) => {
      // 填充编辑表单数据
      Object.assign(editCustomerServiceFormData, {
        id: customerService.id,
        nickname: customerService.nickname,
        name: customerService.name,
        username: customerService.username || customerService.nickname,
        email: customerService.email || '',
        phone: customerService.phone || '',
        gender: customerService.gender || 'male'
      })
      
      editCustomerServiceVisible.value = true
    }
    
    const handleEditCustomerService = async () => {
      try {
        submitting.value = true
        
        // 模拟API调用
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // 更新客服数据
        const customerServiceIndex = customerServices.value.findIndex(cs => cs.id === editCustomerServiceFormData.id)
        if (customerServiceIndex !== -1) {
          Object.assign(customerServices.value[customerServiceIndex], {
            nickname: editCustomerServiceFormData.nickname,
            name: editCustomerServiceFormData.name,
            username: editCustomerServiceFormData.username,
            email: editCustomerServiceFormData.email,
            phone: editCustomerServiceFormData.phone,
            gender: editCustomerServiceFormData.gender
          })
        }
        
        ElMessage.success('客服信息修改成功')
        editCustomerServiceVisible.value = false
        
        // 重置表单
        Object.assign(editCustomerServiceFormData, {
          id: null,
          nickname: '',
          name: '',
          username: '',
          email: '',
          phone: '',
          gender: 'male'
        })
      } catch (error) {
        ElMessage.error('修改失败')
      } finally {
        submitting.value = false
      }
    }
    
    const deleteCustomerService = async (customerService) => {
      try {
        await ElMessageBox.confirm(
          `确定要删除客服 ${customerService.name} 吗？`,
          '确认删除',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          }
        )
        
        const index = customerServices.value.findIndex(cs => cs.id === customerService.id)
        if (index > -1) {
          customerServices.value.splice(index, 1)
          ElMessage.success('删除成功')
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
        nickname: employee.nickname,
        name: employee.name,
        username: employee.username || employee.nickname,
        email: employee.email || '',
        phone: employee.phone || '',
        game: employee.game,
        level: employee.level || '',
        gender: employee.gender || 'male'
      })
      
      editEmployeeVisible.value = true
    }
    
    const handleEditEmployee = async () => {
      try {
        submitting.value = true
        
        // 模拟API调用
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // 更新员工数据
        const employeeIndex = employees.value.findIndex(emp => emp.id === editEmployeeFormData.id)
        if (employeeIndex !== -1) {
          Object.assign(employees.value[employeeIndex], {
            nickname: editEmployeeFormData.nickname,
            name: editEmployeeFormData.name,
            username: editEmployeeFormData.username,
            email: editEmployeeFormData.email,
            phone: editEmployeeFormData.phone,
            game: editEmployeeFormData.game,
            level: editEmployeeFormData.level,
            gender: editEmployeeFormData.gender
          })
        }
        
        ElMessage.success('员工信息修改成功')
        editEmployeeVisible.value = false
        
        // 重置表单
        Object.assign(editEmployeeFormData, {
          id: null,
          nickname: '',
          name: '',
          username: '',
          email: '',
          phone: '',
          game: '',
          level: '',
          gender: 'male'
        })
      } catch (error) {
        ElMessage.error('修改失败')
      } finally {
        submitting.value = false
      }
    }
    
    const deleteEmployee = async (employee) => {
      try {
        await ElMessageBox.confirm(
          `确定要删除员工 ${employee.name} 吗？`,
          '确认删除',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          }
        )
        
        const index = employees.value.findIndex(emp => emp.id === employee.id)
        if (index > -1) {
          employees.value.splice(index, 1)
          ElMessage.success('删除成功')
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
    
    // 生命周期
    onMounted(() => {
      refreshEmployeeList()
    })
    
    return {
      // 响应式数据
      activeTab,
      employeeStatusFilter,
      isLoadingEmployees,
      submitting,
      addEmployeeVisible,
      addCustomerServiceVisible,
      managedEmployeesVisible,
      editEmployeeVisible,
      editCustomerServiceVisible,
      currentCustomerService,
      employees,
      customerServices,
      employeeFormData,
      customerServiceFormData,
      editEmployeeFormData,
      editCustomerServiceFormData,
      employeeFormRules,
      customerServiceFormRules,
      editEmployeeFormRules,
      editCustomerServiceFormRules,
      
      // 计算属性
      totalEmployeeCount,
      customerServiceCount,
      onlineEmployeeCount,
      filteredEmployees,
      allEmployees,
      
      // 方法
      getStatusTagType,
      getStatusText,
      handleTabChange,
      handleEmployeeFilter,
      refreshEmployeeList,
      viewEmployeeDetail,
      showAddEmployeeDialog,
      handleAddEmployee,
      showAddCustomerServiceDialog,
      handleAddCustomerService,
      showManagedEmployees,
      editCustomerService,
      handleEditCustomerService,
      deleteCustomerService,
      editEmployee,
      handleEditEmployee,
      deleteEmployee,
      assignEmployeeToCustomerService
    }
  }
}
</script>

<style scoped>
.admin-dashboard {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding: 20px;
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
  padding: 0 20px;
}

.admin-tabs :deep(.el-tabs__content) {
  padding: 20px;
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
  gap: 20px;
  min-height: 200px;
}

.employee-card {
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 16px;
  background: #fff;
  cursor: pointer;
  transition: all 0.3s ease;
}

.employee-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.card-header {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
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

.status-tag {
  font-size: 12px;
}

.nickname {
  font-size: 12px;
  color: #909399;
}

.card-body {
  margin-bottom: 16px;
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
  padding: 20px;
}

.customer-service-section,
.employee-management-section {
  background: #f8f9fa;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 20px;
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
  
  .filter-controls {
    justify-content: center;
  }
  
  .employee-meta {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
}
</style>