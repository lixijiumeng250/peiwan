<template>
  <div class="auth-page">
    <div class="auth-container">
      <div class="auth-card">
        <h2 class="auth-title">登录</h2>
        <p class="auth-subtitle">欢迎回到陪玩管理系统</p>
        
        <form @submit.prevent="handleLogin" class="auth-form">
          <div class="form-group">
            <label for="username">用户名</label>
            <input
              id="username"
              type="text"
              v-model="loginForm.username"
              placeholder="请输入用户名"
              required
              class="form-input"
              :class="{ 'error': errors.username }"
              @input="clearErrors"
            />
            <span v-if="errors.username" class="error-message">{{ errors.username }}</span>
          </div>
          
          <div class="form-group">
            <label for="password">密码</label>
            <div class="password-input-wrapper">
              <input
                id="password"
                :type="showPassword ? 'text' : 'password'"
                v-model="loginForm.password"
                placeholder="请输入密码"
                required
                class="form-input"
                :class="{ 'error': errors.password }"
                @input="clearErrors"
              />
              <button
                type="button"
                class="password-toggle"
                @click="togglePasswordVisibility"
                :title="showPassword ? '隐藏密码' : '显示密码'"
              >
                {{ showPassword ? '👁️' : '👁️‍🗨️' }}
              </button>
            </div>
            <span v-if="errors.password" class="error-message">{{ errors.password }}</span>
          </div>
          
          <div class="form-options">
            <label class="checkbox-label">
              <input type="checkbox" v-model="rememberMe" />
              <span class="checkmark"></span>
              记住我
            </label>
            <a href="#" class="forgot-password" @click.prevent="handleForgotPassword">忘记密码？</a>
          </div>
          
          <button type="submit" class="auth-button" :disabled="isLoading">
            <span v-if="isLoading" class="loading-spinner"></span>
            {{ isLoading ? '登录中...' : '登录' }}
          </button>
        </form>
        
        <div class="auth-footer">
          <p>还没有账号？ <router-link to="/register" class="auth-link">立即注册</router-link></p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import authStore from '../store/auth'
import { ElMessage } from 'element-plus'

export default {
  name: 'Login',
  data() {
    return {
      loginForm: {
        username: '',
        password: ''
      },
      rememberMe: false,
      errors: {},
      showPassword: false
    }
  },
  computed: {
    isLoading() {
      return authStore.getters.isLoading.value
    },
    errorMessage() {
      return authStore.getters.error.value
    },
    isDev() {
      return import.meta.env.DEV
    }
  },
  methods: {
    // 表单验证
    validateForm() {
      this.errors = {}
      let isValid = true
      
      // 验证用户名
      if (!this.loginForm.username) {
        this.errors.username = '请输入用户名'
        isValid = false
      } else if (this.loginForm.username.length < 3) {
        this.errors.username = '用户名至少需要3个字符'
        isValid = false
      }
      
      // 验证密码
      if (!this.loginForm.password) {
        this.errors.password = '请输入密码'
        isValid = false
      } else if (this.loginForm.password.length < 6) {
        this.errors.password = '密码至少需要6个字符'
        isValid = false
      }
      
      return isValid
    },
    
    // 清除错误信息
    clearErrors() {
      this.errors = {}
      authStore.actions.clearError()
    },
    
    // 处理登录
    async handleLogin() {
      // 清除之前的错误
      this.clearErrors()
      
      // 验证表单
      if (!this.validateForm()) {
        return
      }
      
      try {
        // 调用登录API
        const result = await authStore.actions.login({
          username: this.loginForm.username,
          password: this.loginForm.password,
          rememberMe: this.rememberMe
        })
        
        if (result.success) {
          // 登录成功，显示成功消息（顶部轻提示）
          this.$nextTick(() => {
            ElMessage({
              message: `欢迎回来，${result.user?.username || '用户'}！`,
              type: 'success',
              duration: 2000,
              offset: 12
            })
          })
          
          // 等待状态更新完成后再跳转
          await this.$nextTick()
          
          // 根据用户角色跳转到不同的页面
          let redirectPath = this.$route.query.redirect
          if (!redirectPath) {
            // 如果没有重定向路径，根据角色判断
            const userRole = result.user?.role?.toUpperCase()
            if (userRole === 'ADMIN') {
              redirectPath = '/admin'
            } else if (userRole === 'EMPLOYEE') {
              redirectPath = '/employee'
            } else if (userRole === 'CS') {
              redirectPath = '/customer-service'
            } else {
              redirectPath = '/employee' // 默认跳转到员工页面
            }
          }
          
          // 使用setTimeout确保状态完全更新后再跳转
          setTimeout(() => {
            this.$router.push(redirectPath)
          }, 100)
        } else {
          let errorMessage = result.message || '用户名或密码错误'
          let messageType = 'error'
          let duration = 3000
          
          // 如果是"未找到用户信息"错误，提供更友好的提示
          if (errorMessage.includes('未找到用户')) {
            errorMessage = '未找到用户信息。如果您刚刚注册，请稍等片刻后再试，或检查用户名是否正确。'
            messageType = 'warning'
            duration = 5000
          }
          
          ElMessage({
            message: errorMessage,
            type: messageType,
            duration: duration,
            offset: 12,
            showClose: true
          })
        }
        
      } catch (error) {
        console.error('登录过程发生错误:', error)
        ElMessage({
          message: '登录过程中发生错误，请稍后重试',
          type: 'error',
          duration: 3000,
          offset: 12
        })
      }
    },
    
    // 切换密码显示状态
    togglePasswordVisibility() {
      this.showPassword = !this.showPassword
    },
    
    // 忘记密码处理
    handleForgotPassword() {
      // TODO: 实现忘记密码功能
      alert('忘记密码功能正在开发中，请联系管理员')
    },
    
    // 快速登录（演示用）
    quickLogin(role = 'user') {
      if (role === 'admin') {
        this.loginForm.username = 'admin'
        this.loginForm.password = '123456'
      } else {
        this.loginForm.username = 'testuser'
        this.loginForm.password = 'test123'
      }
    }
  },
  
  // 组件挂载时初始化
  mounted() {
    // 如果已经登录，直接跳转
    if (authStore.getters.isAuthenticated.value) {
      this.$router.push('/')
      return
    }
    
    // 处理来自注册页面的参数
    if (this.$route.query.fromRegister === 'true') {
      // 自动填充用户名
      if (this.$route.query.username) {
        this.loginForm.username = this.$route.query.username
      }
      
      // 显示提示信息
      if (this.$route.query.tip) {
        this.$nextTick(() => {
          ElMessage({
            message: this.$route.query.tip,
            type: 'info',
            duration: 5000,
            showClose: true
          })
        })
      }
    }
    
    // 清除之前的错误状态
    authStore.actions.clearError()
  },
  
  // 组件卸载时清理
  beforeUnmount() {
    authStore.actions.clearError()
  }
}
</script>

<style scoped>
.auth-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.auth-container {
  width: 100%;
  max-width: 400px;
}

.auth-card {
  background: white;
  border-radius: 12px;
  padding: 40px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.auth-title {
  font-size: 28px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 8px;
}

.auth-subtitle {
  color: #909399;
  margin-bottom: 32px;
  font-size: 14px;
}

.auth-form {
  text-align: left;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  color: #606266;
  font-weight: 500;
  font-size: 14px;
}

.form-input {
  width: 100%;
  height: 44px;
  padding: 0 12px;
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.3s;
  background-color: #fff;
}

.form-input:focus {
  outline: none;
  border-color: #409eff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.1);
}

.form-input.error {
  border-color: #f56c6c;
}

.form-input.error:focus {
  box-shadow: 0 0 0 2px rgba(245, 108, 108, 0.1);
}

.form-input::placeholder {
  color: #c0c4cc;
}

.password-input-wrapper {
  position: relative;
}

.password-toggle {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  color: #909399;
  font-size: 16px;
  transition: color 0.3s;
}

.password-toggle:hover {
  color: #409eff;
}

.error-message {
  color: #f56c6c;
  font-size: 12px;
  margin-top: 4px;
  display: block;
}

.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  font-size: 14px;
  color: #606266;
  cursor: pointer;
}

.checkbox-label input[type="checkbox"] {
  display: none;
}

.checkmark {
  width: 16px;
  height: 16px;
  border: 1px solid #dcdfe6;
  border-radius: 3px;
  margin-right: 8px;
  position: relative;
  transition: all 0.3s;
}

.checkbox-label input[type="checkbox"]:checked + .checkmark {
  background-color: #409eff;
  border-color: #409eff;
}

.checkbox-label input[type="checkbox"]:checked + .checkmark::after {
  content: '✓';
  position: absolute;
  top: -2px;
  left: 2px;
  color: white;
  font-size: 12px;
}

.forgot-password {
  color: #409eff;
  text-decoration: none;
  font-size: 14px;
}

.forgot-password:hover {
  text-decoration: underline;
}

.auth-button {
  width: 100%;
  height: 44px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.auth-button:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.auth-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid transparent;
  border-top: 2px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.auth-footer {
  margin-top: 24px;
  text-align: center;
}

.auth-footer p {
  color: #909399;
  font-size: 14px;
}

.auth-link {
  color: #409eff;
  text-decoration: none;
  font-weight: 500;
}

.auth-link:hover {
  text-decoration: underline;
}

@media (max-width: 480px) {
  .auth-card {
    padding: 30px 20px;
  }
  
  .auth-title {
    font-size: 24px;
  }
}
</style>
