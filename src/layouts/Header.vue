<template>
  <header class="header">
    <div class="header-content">
      <div class="logo">
        <img src="https://picsum.photos/40/40" alt="Logo" />
        <span class="site-name">陪玩管理系统</span>
      </div>
      <nav class="nav">
        <!-- 员工角色只显示员工主页 -->
        <template v-if="userRole?.toUpperCase() === 'EMPLOYEE'">
          <router-link to="/employee" class="nav-item">员工页面</router-link>
        </template>
        
        <!-- 客服角色只显示客服管理 -->
        <template v-else-if="userRole?.toUpperCase() === 'CS'">
          <router-link to="/customer-service" class="nav-item">客服页面</router-link>
        </template>
        
        <!-- 管理员角色只显示管理员页面 -->
        <template v-else-if="userRole?.toUpperCase() === 'ADMIN'">
          <router-link to="/admin" class="nav-item">管理员页面</router-link>
        </template>
        
        <!-- 其他情况（未登录或其他角色）显示基础导航 -->
        <template v-else>
          <router-link to="/" class="nav-item">首页</router-link>
          <router-link to="/about" class="nav-item">关于</router-link>
        </template>
      </nav>
      <div class="auth-nav">
        <!-- 未登录状态 -->
        <template v-if="!isAuthenticated">
          <router-link to="/login" class="auth-button login-btn">登录</router-link>
          <router-link to="/register" class="auth-button register-btn">注册</router-link>
        </template>
        
        <!-- 已登录状态 -->
        <template v-else>
          <el-dropdown @command="handleUserAction" trigger="hover">
            <div class="user-info">
              <el-avatar 
                :src="currentUser?.avatar" 
                :size="32"
                class="user-avatar"
              >
                {{ currentUser?.realName?.charAt(0) || currentUser?.username?.charAt(0)?.toUpperCase() }}
              </el-avatar>
              <div class="user-text">
                <span class="username">{{ currentUser?.username }}</span>
                <span class="real-name" v-if="currentUser?.realName">{{ currentUser?.realName }}</span>
              </div>
              <el-icon class="dropdown-icon"><ArrowDown /></el-icon>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="change-password">
                  <el-icon><Lock /></el-icon>
                  修改密码
                </el-dropdown-item>
                <el-dropdown-item divided command="logout">
                  <el-icon><SwitchButton /></el-icon>
                  退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </template>
      </div>
    </div>
    
    <!-- 修改密码对话框 -->
    <ChangePassword 
      v-model="showChangePassword" 
      @success="handlePasswordChangeSuccess"
    />
  </header>
</template>

<script>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  ArrowDown, 
  SwitchButton,
  Lock 
} from '@element-plus/icons-vue'
import authStore from '../store/auth'
import ChangePassword from '../components/ChangePassword.vue'

export default {
  name: 'Header',
  components: {
    ArrowDown,
    SwitchButton,
    Lock,
    ChangePassword
  },
  setup() {
    const router = useRouter()
    
    // 响应式数据
    const showChangePassword = ref(false)
    
    // 计算属性
    const isAuthenticated = computed(() => authStore.getters.isAuthenticated.value)
    const currentUser = computed(() => authStore.getters.currentUser.value)
    const userRole = computed(() => authStore.getters.userRole.value)
    
    // 处理用户操作
    const handleUserAction = async (command) => {
      switch (command) {
        case 'change-password':
          showChangePassword.value = true
          break
        case 'logout':
          try {
            const result = await ElMessageBox.confirm(
              '确定要退出登录吗？',
              '确认退出',
              {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning'
              }
            )
            
            if (result === 'confirm') {
              await authStore.actions.logout()
              ElMessage.success('退出登录成功')
              router.push('/login')
            }
          } catch (error) {
            if (error !== 'cancel') {
              console.error('退出登录失败:', error)
              ElMessage.error('退出登录失败')
            }
          }
          break
      }
    }
    
    // 处理密码修改成功
    const handlePasswordChangeSuccess = (result) => {
      console.log('Header - 密码修改成功:', result)
      // 不需要显示额外的成功提示，ChangePassword组件已经显示了
    }
    
    return {
      isAuthenticated,
      currentUser,
      userRole,
      showChangePassword,
      handleUserAction,
      handlePasswordChangeSuccess
    }
  }
}
</script>

<style scoped>
.header {
  height: 60px;
  background-color: #fff;
  border-bottom: 1px solid #e4e7ed;
  position: sticky;
  top: 0;
  z-index: 1000;
}

.header-content {
  max-width: 1320px;
  margin: 0 auto;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 10px;
}

.logo img {
  width: 40px;
  height: 40px;
  border-radius: 4px;
}

.site-name {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.nav {
  display: flex;
  gap: 30px;
}

.nav-item {
  color: #606266;
  text-decoration: none;
  font-size: 14px;
  transition: color 0.3s;
}

.nav-item:hover,
.nav-item.router-link-active {
  color: #409eff;
}

.auth-nav {
  display: flex;
  gap: 12px;
  align-items: center;
}

.auth-button {
  padding: 8px 16px;
  border-radius: 6px;
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s;
  border: 1px solid transparent;
}

.login-btn {
  color: #409eff;
  border-color: #409eff;
}

.login-btn:hover {
  background-color: #409eff;
  color: white;
}

.register-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.register-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 12px;
  border-radius: 20px;
  background: #f5f7fa;
  cursor: pointer;
  transition: all 0.3s;
}

.user-info:hover {
  background: #e6f3ff;
}

.user-avatar {
  flex-shrink: 0;
}

.user-text {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  line-height: 1.2;
}

.username {
  font-size: 12px;
  font-weight: 400;
  color: #909399;
  max-width: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.real-name {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
  max-width: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dropdown-icon {
  font-size: 12px;
  color: #909399;
  transition: transform 0.3s;
}

.user-info:hover .dropdown-icon {
  transform: rotate(180deg);
}

@media (max-width: 768px) {
  .header-content {
    max-width: 375px;
    padding: 0 15px;
  }
  
  .nav {
    gap: 20px;
  }
  
  .auth-nav {
    gap: 8px;
  }
  
  .auth-button {
    padding: 6px 12px;
    font-size: 13px;
  }
}

@media (max-width: 480px) {
  .header-content {
    flex-wrap: wrap;
    height: auto;
    min-height: 60px;
    padding: 10px 15px;
  }
  
  .logo {
    order: 1;
    flex: 1;
  }
  
  .auth-nav {
    order: 2;
  }
  
  .nav {
    order: 3;
    width: 100%;
    justify-content: center;
    margin-top: 10px;
    gap: 15px;
  }
}
</style>