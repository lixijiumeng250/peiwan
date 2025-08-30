<template>
  <div class="auth-page">
    <div class="auth-container">
      <div class="auth-card">
        <h2 class="auth-title">注册</h2>
        <p class="auth-subtitle">创建您的陪玩管理系统账号</p>
        
        <form @submit.prevent="handleRegister" class="auth-form">
          <div class="form-group">
            <label for="username">用户名</label>
            <input
              id="username"
              type="text"
              v-model="registerForm.username"
              placeholder="请输入用户名"
              required
              class="form-input"
              :class="{ 'error': errors.username }"
            />
            <span v-if="errors.username" class="error-message">{{ errors.username }}</span>
          </div>
          
          <div class="form-group">
            <label for="email">邮箱</label>
            <input
              id="email"
              type="email"
              v-model="registerForm.email"
              placeholder="请输入邮箱地址"
              required
              class="form-input"
              :class="{ 'error': errors.email }"
            />
            <span v-if="errors.email" class="error-message">{{ errors.email }}</span>
          </div>
          
          <div class="form-group">
            <label for="phone">手机号</label>
            <input
              id="phone"
              type="tel"
              v-model="registerForm.phone"
              placeholder="请输入手机号"
              required
              class="form-input"
              :class="{ 'error': errors.phone }"
            />
            <span v-if="errors.phone" class="error-message">{{ errors.phone }}</span>
          </div>
          
          <div class="form-group">
            <label for="password">密码</label>
            <div class="password-input-wrapper">
              <input
                id="password"
                :type="showPassword ? 'text' : 'password'"
                v-model="registerForm.password"
                placeholder="请输入密码"
                required
                class="form-input"
                :class="{ 'error': errors.password }"
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
          
          <div class="form-group">
            <label for="confirmPassword">确认密码</label>
            <div class="password-input-wrapper">
              <input
                id="confirmPassword"
                :type="showConfirmPassword ? 'text' : 'password'"
                v-model="registerForm.confirmPassword"
                placeholder="请再次输入密码"
                required
                class="form-input"
                :class="{ 'error': errors.confirmPassword }"
              />
              <button
                type="button"
                class="password-toggle"
                @click="toggleConfirmPasswordVisibility"
                :title="showConfirmPassword ? '隐藏密码' : '显示密码'"
              >
                {{ showConfirmPassword ? '👁️' : '👁️‍🗨️' }}
              </button>
            </div>
            <span v-if="errors.confirmPassword" class="error-message">{{ errors.confirmPassword }}</span>
          </div>
          
          <div class="form-options">
            <label class="checkbox-label">
              <input type="checkbox" v-model="agreeTerms" required />
              <span class="checkmark"></span>
              我已阅读并同意 <a href="#" class="terms-link">服务条款</a> 和 <a href="#" class="terms-link">隐私政策</a>
            </label>
          </div>
          
          <button type="submit" class="auth-button" :disabled="isLoading || !agreeTerms">
            <span v-if="isLoading" class="loading-spinner"></span>
            {{ isLoading ? '注册中...' : '注册' }}
          </button>
        </form>
        
        <div class="auth-footer">
          <p>已有账号？ <router-link to="/login" class="auth-link">立即登录</router-link></p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import authStore from '../store/auth'

export default {
  name: 'Register',
  data() {
    return {
      registerForm: {
        username: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: ''
      },
      agreeTerms: false,
      errors: {},
      showPassword: false,
      showConfirmPassword: false,
      usernameCheckTimeout: null,
      emailCheckTimeout: null
    }
  },
  computed: {
    isLoading() {
      return authStore.getters.isLoading.value
    },
    errorMessage() {
      return authStore.getters.error.value
    }
  },
  watch: {
    // 实时验证 - 防抖处理
    'registerForm.username'() {
      this.debouncedValidateUsername()
    },
    'registerForm.email'() {
      this.debouncedValidateEmail()
    },
    'registerForm.phone'() {
      this.validatePhone()
    },
    'registerForm.password'() {
      this.validatePassword()
      // 密码变化时重新验证确认密码
      if (this.registerForm.confirmPassword) {
        this.validateConfirmPassword()
      }
    },
    'registerForm.confirmPassword'() {
      this.validateConfirmPassword()
    }
  },
  methods: {
    // 防抖验证用户名
    debouncedValidateUsername() {
      clearTimeout(this.usernameCheckTimeout)
      this.usernameCheckTimeout = setTimeout(() => {
        this.validateUsername()
      }, 500)
    },
    
    // 防抖验证邮箱
    debouncedValidateEmail() {
      clearTimeout(this.emailCheckTimeout)
      this.emailCheckTimeout = setTimeout(() => {
        this.validateEmail()
      }, 500)
    },
    
    // 验证用户名
    async validateUsername() {
      const username = this.registerForm.username
      
      if (!username) {
        delete this.errors.username
        return
      }
      
      if (username.length < 3) {
        this.errors.username = '用户名至少需要3个字符'
        return
      }
      
      if (username.length > 20) {
        this.errors.username = '用户名不能超过20个字符'
        return
      }
      
      if (!/^[a-zA-Z0-9_\u4e00-\u9fa5]+$/.test(username)) {
        this.errors.username = '用户名只能包含字母、数字、下划线和中文'
        return
      }
      
      // 检查用户名可用性
      try {
        const isAvailable = await authStore.actions.checkUsername(username)
        if (!isAvailable) {
          this.errors.username = '用户名已被占用'
        } else {
          delete this.errors.username
        }
      } catch (error) {
        console.warn('检查用户名可用性失败:', error)
        delete this.errors.username
      }
    },
    
    // 验证邮箱
    async validateEmail() {
      const email = this.registerForm.email
      
      if (!email) {
        delete this.errors.email
        return
      }
      
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        this.errors.email = '请输入有效的邮箱地址'
        return
      }
      
      // 检查邮箱可用性
      try {
        const isAvailable = await authStore.actions.checkEmail(email)
        if (!isAvailable) {
          this.errors.email = '邮箱已被注册'
        } else {
          delete this.errors.email
        }
      } catch (error) {
        console.warn('检查邮箱可用性失败:', error)
        delete this.errors.email
      }
    },
    
    // 验证手机号
    validatePhone() {
      const phone = this.registerForm.phone
      
      if (!phone) {
        delete this.errors.phone
        return
      }
      
      const phoneRegex = /^1[3-9]\d{9}$/
      if (!phoneRegex.test(phone)) {
        this.errors.phone = '请输入有效的手机号'
      } else {
        delete this.errors.phone
      }
    },
    
    // 验证密码
    validatePassword() {
      const password = this.registerForm.password
      
      if (!password) {
        delete this.errors.password
        return
      }
      
      if (password.length < 6) {
        this.errors.password = '密码至少需要6个字符'
      } else if (password.length > 20) {
        this.errors.password = '密码不能超过20个字符'
      } else if (!/(?=.*[a-zA-Z])(?=.*\d)/.test(password)) {
        this.errors.password = '密码必须包含字母和数字'
      } else {
        delete this.errors.password
      }
    },
    
    // 验证确认密码
    validateConfirmPassword() {
      const confirmPassword = this.registerForm.confirmPassword
      
      if (!confirmPassword) {
        delete this.errors.confirmPassword
        return
      }
      
      if (confirmPassword !== this.registerForm.password) {
        this.errors.confirmPassword = '两次输入的密码不一致'
      } else {
        delete this.errors.confirmPassword
      }
    },
    
    // 验证整个表单
    validateForm() {
      this.validateUsername()
      this.validateEmail()
      this.validatePhone()
      this.validatePassword()
      this.validateConfirmPassword()
      
      // 检查必填字段
      const requiredFields = ['username', 'email', 'phone', 'password', 'confirmPassword']
      requiredFields.forEach(field => {
        if (!this.registerForm[field]) {
          this.errors[field] = '此字段为必填项'
        }
      })
      
      return Object.keys(this.errors).length === 0
    },
    
    // 清除错误信息
    clearErrors() {
      this.errors = {}
      authStore.actions.clearError()
    },
    
    // 处理注册
    async handleRegister() {
      // 清除之前的错误
      authStore.actions.clearError()
      
      // 验证表单
      if (!this.validateForm()) {
        return
      }
      
      if (!this.agreeTerms) {
        alert('请同意服务条款和隐私政策')
        return
      }
      
      try {
        // 调用注册API
        const result = await authStore.actions.register({
          username: this.registerForm.username,
          email: this.registerForm.email,
          phone: this.registerForm.phone,
          password: this.registerForm.password
        })
        
        if (result.success) {
          // 注册成功
          alert(`注册成功！欢迎加入，${result.user?.username || '用户'}！`)
          
          // 跳转到登录页面
          this.$router.push('/login')
        } else {
          // 注册失败，显示错误消息
          alert(result.message || '注册失败，请稍后重试')
        }
        
      } catch (error) {
        console.error('注册过程发生错误:', error)
        alert('注册过程中发生错误，请稍后重试')
      }
    },
    
    // 切换密码显示状态
    togglePasswordVisibility() {
      this.showPassword = !this.showPassword
    },
    
    // 切换确认密码显示状态
    toggleConfirmPasswordVisibility() {
      this.showConfirmPassword = !this.showConfirmPassword
    },
    
    // 快速填写表单（演示用）
    quickFill() {
      this.registerForm = {
        username: 'testuser' + Date.now().toString().slice(-4),
        email: `test${Date.now().toString().slice(-4)}@example.com`,
        phone: '13800138000',
        password: 'test123456',
        confirmPassword: 'test123456'
      }
      this.agreeTerms = true
    }
  },
  
  // 组件挂载时初始化
  mounted() {
    // 如果已经登录，直接跳转
    if (authStore.getters.isAuthenticated.value) {
      this.$router.push('/')
      return
    }
    
    // 清除之前的错误状态
    authStore.actions.clearError()
  },
  
  // 组件卸载时清理
  beforeUnmount() {
    clearTimeout(this.usernameCheckTimeout)
    clearTimeout(this.emailCheckTimeout)
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
  margin-bottom: 24px;
}

.checkbox-label {
  display: flex;
  align-items: flex-start;
  font-size: 14px;
  color: #606266;
  cursor: pointer;
  line-height: 1.4;
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
  margin-top: 2px;
  flex-shrink: 0;
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

.terms-link {
  color: #409eff;
  text-decoration: none;
}

.terms-link:hover {
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
