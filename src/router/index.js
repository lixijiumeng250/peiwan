import { createRouter, createWebHistory } from 'vue-router'
import Layout from '../layouts/Layout.vue'
import Login from '../views/Login.vue'
import Register from '../views/Register.vue'
import NotFound from '../views/NotFound.vue'
import authStore from '../store/auth'

const routes = [
  {
    path: '/',
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
      },
      {
        path: '/polling-test',
        name: 'PollingTest',
        component: () => import('../views/PollingTest.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: '',
        redirect: '/employee' // 默认重定向到员工页面
      }
    ]
  },
  {
    path: '/login',
    name: 'Login',
    component: Login
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
router.beforeEach((to, from, next) => {
  // 检查是否需要认证
  if (to.matched.some(record => record.meta.requiresAuth)) {
    // 检查用户是否已登录
    if (!authStore.getters.isAuthenticated.value) {
      // 未登录，重定向到登录页
      next({
        name: 'Login',
        query: { redirect: to.fullPath }
      })
      return
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
  
  // 如果已登录用户访问登录页，根据角色重定向
  if (to.name === 'Login' && authStore.getters.isAuthenticated.value) {
    const userRole = authStore.getters.userRole.value?.toUpperCase()
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
  
  next()
})

export default router