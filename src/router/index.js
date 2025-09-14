import { createRouter, createWebHistory } from 'vue-router'
import Layout from '../layouts/Layout.vue'
import Login from '../views/Login.vue'
import Register from '../views/Register.vue'
import NotFound from '../views/NotFound.vue'
import authStore from '../store/auth'
import { usePolling } from '../utils/polling'

const routes = [
  {
    path: '/',
    name: 'Login',
    component: Login
  },
  {
    path: '/app',
    component: Layout,
    children: [
      {
        path: '/admin',
        name: 'Admin',
        component: () => import('../views/Admin.vue'),
        meta: { requiresAuth: true, role: 'ADMIN' }
      },
      {
        path: '/employee',
        name: 'Employee',
        component: () => import('../views/Employee.vue'),
        meta: { requiresAuth: true, role: 'EMPLOYEE' }
      },
      {
        path: '/customer-service',
        name: 'CustomerService',
        component: () => import('../views/CustomerService.vue'),
        meta: { requiresAuth: true, role: 'CS' }
      },
      {
        path: '/customer-service/employee/:id',
        name: 'CSEmployeeDetail',
        component: () => import('../views/CSEmployeeDetail.vue'),
        // 允许管理员和客服访问，用于管理员复用客服详情页
        meta: { requiresAuth: true, roles: ['CS', 'ADMIN'] }
      },
      {
        path: '/employee/:id',
        name: 'EmployeeDetail',
        component: () => import('../views/EmployeeDetail.vue'),
        meta: { requiresAuth: true, roles: ['EMPLOYEE', 'ADMIN'] }
      }
    ]
  },
  {
    path: '/login',
    redirect: '/'
  },
  {
    path: '/register',
    name: 'Register',
    component: Register
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: NotFound
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫
router.beforeEach(async (to, from, next) => {
  // 首先检查登出状态，如果正在登出或刚刚登出，立即处理
  const { isLogoutInProgress, lastLogoutTime } = authStore.state
  const timeSinceLogout = Date.now() - lastLogoutTime
  
  if (isLogoutInProgress || timeSinceLogout < 5000) {
    console.log('🚪 检测到登出状态，强制清理轮询并跳转到登录页')
    
    // 强制清除所有轮询
    const { forceStopAllPolling } = usePolling()
    forceStopAllPolling()
    
    // 如果目标不是登录页，重定向到登录页
    if (to.path !== '/' && to.name !== 'Login') {
      next('/')
      return
    }
  }
  
  // 如果跳转到登录页面，强制清除所有轮询
  if (to.path === '/' || to.name === 'Login') {
    const { clearAllPolling, forceStopAllPolling, getActivePollingKeys } = usePolling()
    
    const activePolling = getActivePollingKeys()
    console.log('🔄 跳转到登录页面，当前活跃轮询:', activePolling)
    
    if (activePolling.length > 0) {
      clearAllPolling()
      
      // 延迟检查并强制清理残留轮询
      setTimeout(() => {
        const stillActive = getActivePollingKeys()
        if (stillActive.length > 0) {
          console.log('🚨 路由跳转时发现残留轮询，启动强制清理:', stillActive)
          forceStopAllPolling()
        }
      }, 50)
    }
    
    console.log('🔄 登录页面轮询清理完成')
  }
  
  // 检查是否需要认证
  if (to.matched.some(record => record.meta.requiresAuth)) {
    // Cookie 模式：只有在内存中没有用户信息时才向后端确认
    if (!authStore.getters.isAuthenticated.value) {
      try {
        // 检查是否刚刚登出，如果是则直接跳转到登录页，避免无效的API调用
        const { isLogoutInProgress, lastLogoutTime } = authStore.state
        const timeSinceLogout = Date.now() - lastLogoutTime
        
        if (isLogoutInProgress || timeSinceLogout < 5000) {
          console.log('🚪 刚刚登出或正在登出中，直接重定向到登录页，跳过认证检查')
          next({
            path: '/',
            query: { redirect: to.fullPath }
          })
          return
        }
        
        console.log('🔐 需要认证检查，当前无用户信息，调用 fetchCurrentUser')
        const ok = await authStore.actions.fetchCurrentUser()
        if (!ok) {
          // 未登录，重定向到根路径（登录页）
          console.log('🔐 认证检查失败，重定向到登录页')
          next({
            path: '/',
            query: { redirect: to.fullPath }
          })
          return
        }
        console.log('🔐 认证检查成功，继续路由')
      } catch (error) {
        // 认证检查失败，重定向到登录页
        console.log('🔐 认证检查异常，重定向到登录页:', error.message)
        next({
          path: '/',
          query: { redirect: to.fullPath }
        })
        return
      }
    }
    
    // 检查角色权限
    if (to.meta.role || to.meta.roles) {
      const userRole = authStore.getters.userRole.value
      
      // 检查单一角色权限（不区分大小写）
      if (to.meta.role && userRole?.toUpperCase() !== to.meta.role.toUpperCase()) {
        // 根据用户角色重定向到对应页面
        if (userRole?.toUpperCase() === 'ADMIN') {
          next({ name: 'Admin' })
        } else if (userRole?.toUpperCase() === 'EMPLOYEE') {
          next({ name: 'Employee' })
        } else if (userRole?.toUpperCase() === 'CS') {
          next({ name: 'CustomerService' })
        } else {
          next({ name: 'Employee' }) // 默认跳转到员工页面
        }
        return
      }
      
      // 检查多角色权限（不区分大小写）
      if (to.meta.roles && !to.meta.roles.some(role => role.toUpperCase() === userRole?.toUpperCase())) {
        // 根据用户角色重定向到对应页面
        if (userRole?.toUpperCase() === 'ADMIN') {
          next({ name: 'Admin' })
        } else if (userRole?.toUpperCase() === 'EMPLOYEE') {
          next({ name: 'Employee' })
        } else if (userRole?.toUpperCase() === 'CS') {
          next({ name: 'CustomerService' })
        } else {
          next({ name: 'Employee' }) // 默认跳转到员工页面
        }
        return
      }
    }
  }
  
  // 如果访问根路径（登录页），检查认证状态并重定向
  if (to.path === '/') {
    // 检查是否刚刚登出，如果是则直接显示登录页
    const { isLogoutInProgress, lastLogoutTime } = authStore.state
    const timeSinceLogout = Date.now() - lastLogoutTime
    
    if (isLogoutInProgress || timeSinceLogout < 2000) {
      console.log('🚪 刚刚登出或正在登出中，显示登录页')
      next()
      return
    }
    
    // 如果内存中已有用户信息，直接重定向
    if (authStore.getters.isAuthenticated.value) {
      const userRole = authStore.getters.userRole.value?.toUpperCase()
      console.log('🔄 已登录用户访问根路径，重定向到对应页面，角色:', userRole)
      
      if (userRole === 'ADMIN') {
        next({ name: 'Admin' })
      } else if (userRole === 'EMPLOYEE') {
        next({ name: 'Employee' })
      } else if (userRole === 'CS') {
        next({ name: 'CustomerService' })
      } else {
        next({ name: 'Employee' }) // 默认跳转到员工页面
      }
      return
    }
    
    // 如果内存中没有用户信息，检查后端认证状态
    try {
      console.log('🔍 访问根路径，检查后端认证状态')
      const isAuthenticated = await authStore.actions.fetchCurrentUser()
      
      if (isAuthenticated) {
        // 认证成功，根据角色重定向
        const userRole = authStore.getters.userRole.value?.toUpperCase()
        console.log('✅ 后端认证有效，重定向到对应页面，角色:', userRole)
        
        if (userRole === 'ADMIN') {
          next({ name: 'Admin' })
        } else if (userRole === 'EMPLOYEE') {
          next({ name: 'Employee' })
        } else if (userRole === 'CS') {
          next({ name: 'CustomerService' })
        } else {
          next({ name: 'Employee' }) // 默认跳转到员工页面
        }
        return
      } else {
        // 未认证，显示登录页
        console.log('❌ 后端认证无效，显示登录页')
        next()
        return
      }
    } catch (error) {
      console.error('🚨 检查认证状态失败:', error)
      // 发生错误时，显示登录页
      next()
      return
    }
  }
  
  next()
})

export default router