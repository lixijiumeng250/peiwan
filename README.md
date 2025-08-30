# 🎮 陪玩管理系统

> 现代化的陪玩服务管理平台 - 前端项目

一个基于 Vue 3 + Vite 构建的现代化陪玩服务管理系统前端项目，采用前后端分离架构，提供完整的用户认证、管理功能和响应式用户界面。

## ✨ 项目特色

- 🚀 **现代化技术栈**: Vue 3 + Vite + Element Plus
- 🎨 **精美UI设计**: 响应式设计，完美适配桌面端和移动端
- 🔐 **完整认证系统**: 登录、注册、权限管理、JWT认证
- 🔧 **前后端分离**: 完全独立的前端项目，支持Mock模式开发
- 📱 **移动端友好**: 响应式布局，支持各种屏幕尺寸
- ⚡ **开发体验**: 热更新、TypeScript支持、代码规范检查

## 🛠️ 技术栈

### 核心框架
- **Vue 3** - 渐进式JavaScript框架
- **Vite** - 下一代前端构建工具
- **Vue Router 4** - 官方路由管理器
- **Element Plus** - Vue 3 UI组件库

### 开发工具
- **Axios** - HTTP客户端
- **ESLint** - 代码质量检查
- **PostCSS** - CSS处理工具

### 架构特点
- **组件化开发** - 可复用的Vue组件
- **模块化设计** - 清晰的代码结构
- **状态管理** - 响应式状态管理
- **API抽象** - 统一的API调用层

## 📁 项目结构

```
peiwan/
├── public/                 # 静态资源
│   └── vite.svg           # 网站图标
├── src/                   # 源代码目录
│   ├── api/               # API接口层
│   │   ├── auth.js        # 认证相关API
│   │   ├── http.js        # HTTP客户端配置
│   │   └── mock.js        # Mock API服务
│   ├── assets/            # 静态资源
│   │   └── vue.svg        # Vue logo
│   ├── components/        # 公共组件
│   │   └── HelloWorld.vue # 示例组件
│   ├── config/            # 配置文件
│   │   └── index.js       # 应用配置
│   ├── layouts/           # 布局组件
│   │   ├── Footer.vue     # 页脚组件
│   │   ├── Header.vue     # 页头组件
│   │   └── Layout.vue     # 主布局
│   ├── router/            # 路由配置
│   │   └── index.js       # 路由定义
│   ├── store/             # 状态管理
│   │   └── auth.js        # 认证状态管理
│   ├── views/             # 页面组件
│   │   ├── About.vue      # 关于页面
│   │   ├── Admin.vue      # 管理页面
│   │   ├── Home.vue       # 首页
│   │   ├── Login.vue      # 登录页面
│   │   ├── NotFound.vue   # 404页面
│   │   └── Register.vue   # 注册页面
│   ├── App.vue            # 根组件
│   ├── main.js            # 应用入口
│   └── style.css          # 全局样式
├── API_DESIGN.md          # API设计文档
├── README.md              # 项目说明文档
├── index.html             # HTML模板
├── package.json           # 项目配置
├── vite.config.js         # Vite配置
└── package-lock.json      # 依赖锁定文件
```

## 🚀 快速开始

### 环境要求

- Node.js >= 16.0.0
- npm >= 8.0.0

### 安装依赖

```bash
# 克隆项目
git clone [项目地址]
cd peiwan

# 安装依赖
npm install
```

### 开发模式

```bash
# 启动开发服务器
npm run dev

# 访问应用
# 浏览器打开 http://localhost:8000
```

### 生产构建

```bash
# 构建生产版本
npm run build

# 预览构建结果
npm run preview
```

## 🎯 功能特性

### 🔐 用户认证系统

#### 登录功能
- **路径**: `/login`
- **功能**: 用户登录认证
- **特性**: 
  - 用户名/密码验证
  - 记住登录状态
  - 密码显示/隐藏切换
  - 表单验证和错误提示
  - 加载状态显示

#### 注册功能
- **路径**: `/register`
- **功能**: 新用户注册
- **特性**:
  - 完整的注册表单（用户名、邮箱、手机号、密码）
  - 实时表单验证
  - 用户名/邮箱可用性检查
  - 密码强度验证
  - 确认密码匹配验证
  - 服务条款同意

### 🏠 页面导航

#### 首页
- **路径**: `/`
- **功能**: 系统欢迎页面
- **特性**: 简洁的介绍界面

#### 管理页面
- **路径**: `/admin`
- **功能**: 管理员功能页面
- **特性**: 管理员专用功能

#### 关于页面
- **路径**: `/about`
- **功能**: 系统介绍页面

### 🎨 UI/UX特性

- **响应式设计**: 适配桌面端、平板和手机
- **现代化界面**: 卡片式设计、渐变背景
- **交互反馈**: 加载状态、悬停效果、动画过渡
- **用户友好**: 清晰的错误提示、表单验证

## 🔧 开发指南

### Mock模式开发

项目内置Mock API服务，支持前端独立开发：

```javascript
// src/config/index.js
dev: {
  enableMock: true  // 启用Mock模式
}
```

**演示账号**:
- 管理员: `admin` / `admin123`
- 普通用户: `testuser` / `test123`

### API接口集成

当后端API准备就绪时：

1. 修改配置文件:
```javascript
// src/config/index.js
dev: {
  enableMock: false  // 禁用Mock模式
}
api: {
  baseURL: 'https://your-api-domain.com/api'  // 配置真实API地址
}
```

2. 参考 `API_DESIGN.md` 文档实现后端接口

### 添加新页面

1. 在 `src/views/` 创建Vue组件
2. 在 `src/router/index.js` 添加路由配置
3. 在导航组件中添加链接（可选）

### 状态管理

使用响应式状态管理：

```javascript
// src/store/auth.js
import authStore from '../store/auth'

// 在组件中使用
export default {
  computed: {
    isLoggedIn() {
      return authStore.getters.isAuthenticated.value
    }
  },
  methods: {
    async login() {
      await authStore.actions.login(loginData)
    }
  }
}
```

## 🌐 部署指南

### 开发环境部署

```bash
# 启动开发服务器
npm run dev
```

### 生产环境部署

```bash
# 构建生产版本
npm run build

# 将 dist/ 目录部署到Web服务器
```

### Docker部署（可选）

```dockerfile
FROM node:16-alpine as builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### 环境变量配置

创建 `.env` 文件：

```env
# API基础URL
VITE_API_BASE_URL=https://your-api-domain.com/api

# 应用配置
VITE_APP_TITLE=陪玩管理系统
```

## 📚 API文档

详细的API接口文档请参考 [API_DESIGN.md](./API_DESIGN.md)，包含：

- 完整的RESTful API规范
- 请求/响应格式说明
- 认证流程详解
- 错误处理机制
- 前后端对接指南

## 🔍 浏览器支持

- Chrome >= 87
- Firefox >= 78
- Safari >= 14
- Edge >= 88

## 📝 更新日志

### v1.0.0 (2024-01-01)
- ✨ 初始版本发布
- 🔐 完整的用户认证系统
- 🎨 响应式UI设计
- 🔧 Mock API支持
- 📱 移动端适配

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 📞 联系方式

- 项目维护者: [您的姓名]
- 邮箱: [您的邮箱]
- 项目地址: [项目GitHub地址]

## 🙏 致谢

感谢以下开源项目：

- [Vue.js](https://vuejs.org/) - 渐进式JavaScript框架
- [Vite](https://vitejs.dev/) - 下一代前端构建工具
- [Element Plus](https://element-plus.org/) - Vue 3 UI组件库
- [Axios](https://axios-http.com/) - HTTP客户端库

---

**🎮 让我们一起打造最好的陪玩管理平台！**