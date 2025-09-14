import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import authStore from './store/auth'
import { setupGlobalErrorHandler } from './utils/errorHandler'

const app = createApp(App)
app.use(router)
app.use(ElementPlus)

// 设置全局错误处理
setupGlobalErrorHandler(app)

// 直接启动应用，不自动初始化认证状态
app.mount('#app')
