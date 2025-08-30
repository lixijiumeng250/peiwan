# 🛠️ 开发者指南

## 📋 项目架构

### 技术选型
- **前端框架**: Vue 3 (Composition API)
- **构建工具**: Vite 
- **UI框架**: Element Plus
- **路由管理**: Vue Router 4
- **HTTP客户端**: Axios
- **状态管理**: 响应式状态管理

### 目录结构说明

```
src/
├── api/                   # API接口层
│   ├── auth.js           # 认证API
│   ├── http.js           # HTTP配置
│   └── mock.js           # Mock服务
├── components/           # 可复用组件
├── config/              # 配置文件
├── layouts/             # 布局组件
├── router/              # 路由配置
├── store/               # 状态管理
├── views/               # 页面组件
└── style.css            # 全局样式
```

## 🔧 开发环境设置

### 1. 环境要求
```bash
Node.js >= 16.0.0
npm >= 8.0.0
```

### 2. 依赖安装
```bash
npm install
```

### 3. 开发服务器
```bash
npm run dev
# 服务器启动在 http://localhost:8000
```

### 4. 构建生产版本
```bash
npm run build
```

## 📝 编码规范

### Vue组件规范
```vue
<template>
  <!-- 使用语义化的HTML结构 -->
  <div class="component-name">
    <h1>{{ title }}</h1>
  </div>
</template>

<script>
export default {
  name: 'ComponentName',  // 必须提供组件名
  props: {
    title: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      // 响应式数据
    }
  },
  computed: {
    // 计算属性
  },
  methods: {
    // 方法定义
  },
  mounted() {
    // 生命周期钩子
  }
}
</script>

<style scoped>
/* 使用scoped样式避免样式污染 */
.component-name {
  /* 样式定义 */
}
</style>
```

### API调用规范
```javascript
// 在api/目录下定义API接口
export const getUserInfo = async (userId) => {
  try {
    // Mock模式检查
    if (isMockEnabled()) {
      return await mockAPI.getUserInfo(userId)
    }
    
    // 真实API调用
    const response = await http.get(`/users/${userId}`)
    return response
  } catch (error) {
    console.error('获取用户信息失败:', error)
    throw error
  }
}
```

### 状态管理规范
```javascript
// 使用响应式状态管理
import { reactive, computed } from 'vue'

const state = reactive({
  user: null,
  loading: false
})

const getters = {
  isLoggedIn: computed(() => !!state.user)
}

const actions = {
  async login(credentials) {
    state.loading = true
    try {
      // 登录逻辑
    } finally {
      state.loading = false
    }
  }
}

export default { state, getters, actions }
```

## 🎨 样式指南

### CSS变量使用
```css
:root {
  --primary-color: #409eff;
  --success-color: #67c23a;
  --warning-color: #e6a23c;
  --danger-color: #f56c6c;
}
```

### 响应式设计
```css
/* 移动端优先 */
.container {
  padding: 15px;
}

/* 平板端 */
@media (min-width: 768px) {
  .container {
    padding: 20px;
  }
}

/* 桌面端 */
@media (min-width: 1024px) {
  .container {
    padding: 30px;
  }
}
```

## 🔍 调试技巧

### 1. Vue DevTools
安装Vue DevTools浏览器扩展进行组件调试

### 2. 控制台调试
```javascript
// 在组件中添加调试信息
mounted() {
  console.log('组件已挂载:', this.$options.name)
}
```

### 3. 网络请求调试
```javascript
// 在http.js中查看请求日志
console.log('发送请求:', {
  url: config.url,
  method: config.method,
  data: config.data
})
```

## 🧪 测试指南

### Mock API测试
1. 确认Mock模式已启用
2. 查看控制台API调用日志
3. 验证数据格式和响应时间

### 功能测试流程
1. **登录测试**:
   - 正确凭据登录
   - 错误凭据处理
   - 表单验证测试

2. **注册测试**:
   - 完整注册流程
   - 字段验证测试
   - 重复数据检查

3. **界面测试**:
   - 响应式布局测试
   - 交互反馈测试
   - 错误状态显示

## 📦 新功能开发

### 1. 添加新页面
```bash
# 1. 创建页面组件
touch src/views/NewPage.vue

# 2. 添加路由配置
# 编辑 src/router/index.js

# 3. 添加导航链接（可选）
# 编辑 src/layouts/Header.vue
```

### 2. 添加新API接口
```bash
# 1. 在api目录添加接口定义
# 编辑 src/api/auth.js 或创建新文件

# 2. 添加Mock数据
# 编辑 src/api/mock.js

# 3. 在组件中调用
# 导入并使用API方法
```

### 3. 添加新组件
```bash
# 1. 创建组件文件
touch src/components/NewComponent.vue

# 2. 在页面中导入使用
# 在需要的页面组件中import和注册
```

## 🚀 部署流程

### 1. 开发环境
```bash
npm run dev
```

### 2. 生产构建
```bash
npm run build
# 构建产物在 dist/ 目录
```

### 3. 预览构建
```bash
npm run preview
```

### 4. 部署到服务器
```bash
# 将dist目录内容上传到Web服务器
# 配置服务器支持SPA路由
```

## 🔧 常见问题

### Q: 页面空白怎么办？
A: 检查浏览器控制台错误，通常是JavaScript运行时错误

### Q: API调用失败？
A: 确认Mock模式设置，检查网络和CORS配置

### Q: 样式不生效？
A: 检查CSS选择器优先级，确认scoped样式范围

### Q: 路由不工作？
A: 检查路由配置，确认组件导入路径正确

## 📚 参考资源

- [Vue 3 官方文档](https://vuejs.org/)
- [Vite 官方文档](https://vitejs.dev/)
- [Element Plus 文档](https://element-plus.org/)
- [Vue Router 文档](https://router.vuejs.org/)
- [Axios 文档](https://axios-http.com/)

---

**Happy Coding! 🚀**
