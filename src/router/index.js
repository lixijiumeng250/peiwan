import { createRouter, createWebHistory } from 'vue-router'
import Layout from '../layouts/Layout.vue'
import Home from '../views/Home.vue'
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
        path: '',
        name: 'Home',
        component: Home
      },
      {
        path: '/about',
        name: 'About',
        component: () => import('../views/About.vue')
      },
        {
    path: '/admin',
    name: 'Admin',
    component: () => import('../views/Admin.vue'),
    meta: { requiresAuth: true, role: 'admin' }
  },
  {
    path: '/employee',
    name: 'Employee',
    component: () => import('../views/Employee.vue'),
    meta: { requiresAuth: true, role: 'user' }
  },
      {
        path: '/customer-service',
        name: 'CustomerService',
        component: () => import('../views/CustomerService.vue'),
        meta: { requiresAuth: true, role: 'customer-service' }
      },
      {
        path: '/customer-service/employee/:id',
        name: 'EmployeeDetail',
        component: () => import('../views/EmployeeDetail.vue'),
        meta: { requiresAuth: true, roles: ['customer-service', 'admin'] }
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
      
      // 检查单一角色权限
      if (to.meta.role && userRole !== to.meta.role) {
        next({ name: 'Home' })
        return
      }
      
      // 检查多角色权限
      if (to.meta.roles && !to.meta.roles.includes(userRole)) {
        next({ name: 'Home' })
        return
      }
    }
  }
  
  // 如果已登录用户访问登录页，重定向到首页
  if (to.name === 'Login' && authStore.getters.isAuthenticated.value) {
    next({ name: 'Home' })
    return
  }
  
  next()
})

export default router