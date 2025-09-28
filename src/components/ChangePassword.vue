<template>
  <div class="change-password-container">
    <!-- 修改密码对话框 -->
    <el-dialog
      v-model="visible"
      title="修改密码"
      width="450px"
      :before-close="handleClose"
      @close="resetForm"
    >
      <el-form
        ref="changePasswordForm"
        :model="formData"
        :rules="formRules"
        label-width="100px"
        @submit.prevent="handleSubmit"
      >
        <el-form-item label="当前密码" prop="currentPassword">
          <el-input
            v-model="formData.currentPassword"
            type="password"
            placeholder="请输入当前密码"
            show-password
            autocomplete="current-password"
          />
        </el-form-item>
        
        <el-form-item label="新密码" prop="newPassword">
          <el-input
            v-model="formData.newPassword"
            type="password"
            placeholder="请输入新密码"
            show-password
            autocomplete="new-password"
          />
          <div class="password-hint">
            密码长度至少6位，建议包含字母、数字和特殊字符
          </div>
        </el-form-item>
        
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input
            v-model="formData.confirmPassword"
            type="password"
            placeholder="请再次输入新密码"
            show-password
            autocomplete="new-password"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="handleClose">取消</el-button>
          <el-button
            type="primary"
            :loading="isLoading"
            @click="handleSubmit"
          >
            确认修改
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import authStore from '../store/auth'

// Props
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  }
})

// Emits
const emit = defineEmits(['update:modelValue', 'success'])

// 响应式数据
const changePasswordForm = ref(null)
const formData = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

// 计算属性
const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const isLoading = computed(() => authStore.getters.isLoading.value)

// 表单验证规则
const validatePassword = (rule, value, callback) => {
  if (!value) {
    callback(new Error('请输入密码'))
  } else if (value.length < 6) {
    callback(new Error('密码长度不能少于6位'))
  } else {
    callback()
  }
}

const validateConfirmPassword = (rule, value, callback) => {
  if (!value) {
    callback(new Error('请确认密码'))
  } else if (value !== formData.newPassword) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

const formRules = {
  currentPassword: [
    { required: true, message: '请输入当前密码', trigger: 'blur' }
  ],
  newPassword: [
    { required: true, validator: validatePassword, trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, validator: validateConfirmPassword, trigger: 'blur' }
  ]
}

// 方法
const resetForm = () => {
  if (changePasswordForm.value) {
    changePasswordForm.value.resetFields()
  }
  Object.assign(formData, {
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
}

const handleClose = () => {
  if (isLoading.value) {
    ElMessageBox.confirm('密码修改正在进行中，确定要关闭吗？')
      .then(() => {
        visible.value = false
      })
      .catch(() => {})
  } else {
    visible.value = false
  }
}

const handleSubmit = async () => {
  try {
    // 表单验证
    if (!changePasswordForm.value) {
      ElMessage.error('表单验证失败')
      return
    }
    
    const isValid = await changePasswordForm.value.validate()
    if (!isValid) {
      return
    }
    
    // 额外验证
    if (formData.currentPassword === formData.newPassword) {
      ElMessage.error('新密码不能与当前密码相同')
      return
    }
    
    // 构建请求数据
    const changePasswordData = {
      currentPassword: formData.currentPassword,
      newPassword: formData.newPassword,
      confirmPassword: formData.confirmPassword
    }
    
    // console.log('提交修改密码请求')
    const result = await authStore.actions.changePassword(changePasswordData)
    
    if (result.success) {
      ElMessage.success(result.message || '密码修改成功')
      visible.value = false
      resetForm()
      
      // 发出成功事件
      emit('success', result)
      
      // 记录请求ID（如果有）
      if (result.requestId) {
        // console.log('修改密码请求ID:', result.requestId)
      }
      
      // 提示用户重新登录
      setTimeout(() => {
        ElMessageBox.confirm(
          '密码已修改成功，为了安全起见，请重新登录。',
          '密码修改成功',
          {
            confirmButtonText: '立即重新登录',
            cancelButtonText: '稍后登录',
            type: 'success'
          }
        ).then(async () => {
          // 用户选择立即重新登录
          await authStore.actions.logout()
          // 跳转到登录页面，不使用reload避免意外请求
          this.$router.push('/')
        }).catch(() => {
          // 用户选择稍后登录，不做任何操作
        })
      }, 1000)
    } else {
      ElMessage.error(result.message || '密码修改失败')
    }
  } catch (error) {
    console.error('修改密码失败:', error)
    ElMessage.error(error.message || '密码修改失败，请稍后重试')
  }
}
</script>

<style scoped>
.change-password-container {
  /* 组件容器样式 */
}

.password-hint {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
  line-height: 1.4;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

/* 表单样式优化 */
:deep(.el-form-item) {
  margin-bottom: 22px;
}

:deep(.el-form-item__label) {
  font-weight: 500;
}

:deep(.el-input__wrapper) {
  border-radius: 6px;
}

/* 密码输入框样式 */
:deep(.el-input--password .el-input__wrapper) {
  padding-right: 35px;
}

/* 对话框样式优化 */
:deep(.el-dialog) {
  border-radius: 8px;
}

:deep(.el-dialog__header) {
  padding: 20px 20px 10px;
  border-bottom: 1px solid #f0f0f0;
}

:deep(.el-dialog__body) {
  padding: 20px;
}

:deep(.el-dialog__footer) {
  padding: 10px 20px 20px;
  border-top: 1px solid #f0f0f0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  :deep(.el-dialog) {
    width: 90% !important;
    margin: 0 auto;
  }
}
</style>
