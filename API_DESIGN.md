# API设计文档 - 前后端分离接口规范

## 概述

本项目采用前后端分离架构，前端使用Vue 3框架，后端需要提供RESTful API接口。

## 基础配置

### API基础URL
- 开发环境: `http://localhost:8080/api`
- 生产环境: 根据实际部署情况配置

### 认证方式
- 使用JWT (JSON Web Token) 进行身份认证
- 请求头格式: `Authorization: Bearer <access_token>`

## 通用响应格式

所有API接口都应返回统一的JSON格式：

```json
{
  "code": 200,
  "message": "操作成功",
  "data": {
    // 具体数据内容
  },
  "timestamp": "2023-12-01T12:00:00Z"
}
```

### 状态码说明
- `200`: 操作成功
- `400`: 请求参数错误
- `401`: 未授权或token过期
- `403`: 权限不足
- `404`: 资源不存在
- `500`: 服务器内部错误

## 认证相关接口

### 1. 用户登录
**接口**: `POST /auth/login`

**请求参数**:
```json
{
  "username": "admin",
  "password": "admin123",
  "remember_me": true
}
```

**响应示例**:
```json
{
  "code": 200,
  "message": "登录成功",
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expires_in": 7200,
    "user": {
      "id": 1,
      "username": "admin",
      "email": "admin@example.com",
      "phone": "13800138000",
      "avatar": "https://example.com/avatar.jpg",
      "role": "admin",
      "created_at": "2023-01-01T00:00:00Z"
    }
  }
}
```

### 2. 用户注册
**接口**: `POST /auth/register`

**请求参数**:
```json
{
  "username": "newuser",
  "email": "newuser@example.com",
  "phone": "13800138001",
  "password": "password123"
}
```

**响应示例**:
```json
{
  "code": 200,
  "message": "注册成功",
  "data": {
    "user": {
      "id": 2,
      "username": "newuser",
      "email": "newuser@example.com",
      "phone": "13800138001",
      "avatar": null,
      "role": "user",
      "created_at": "2023-01-01T00:00:00Z"
    }
  }
}
```

### 3. 刷新访问令牌
**接口**: `POST /auth/refresh`

**请求参数**:
```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**响应示例**:
```json
{
  "code": 200,
  "message": "令牌刷新成功",
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expires_in": 7200
  }
}
```

### 4. 用户登出
**接口**: `POST /auth/logout`

**请求头**: 需要携带有效的访问令牌

**响应示例**:
```json
{
  "code": 200,
  "message": "登出成功"
}
```

### 5. 获取当前用户信息
**接口**: `GET /auth/me`

**请求头**: 需要携带有效的访问令牌

**响应示例**:
```json
{
  "code": 200,
  "message": "获取用户信息成功",
  "data": {
    "user": {
      "id": 1,
      "username": "admin",
      "email": "admin@example.com",
      "phone": "13800138000",
      "avatar": "https://example.com/avatar.jpg",
      "role": "admin",
      "created_at": "2023-01-01T00:00:00Z",
      "last_login": "2023-01-01T12:00:00Z"
    }
  }
}
```

### 6. 检查用户名可用性
**接口**: `GET /auth/check-username/{username}`

**响应示例**:
```json
{
  "code": 200,
  "message": "用户名可用",
  "data": {
    "available": true
  }
}
```

### 7. 检查邮箱可用性
**接口**: `GET /auth/check-email/{email}`

**响应示例**:
```json
{
  "code": 200,
  "message": "邮箱可用",
  "data": {
    "available": true
  }
}
```

### 8. 修改密码
**接口**: `POST /auth/change-password`

**请求头**: 需要携带有效的访问令牌

**请求参数**:
```json
{
  "old_password": "oldpassword123",
  "new_password": "newpassword123"
}
```

### 9. 忘记密码 - 发送重置邮件
**接口**: `POST /auth/forgot-password`

**请求参数**:
```json
{
  "email": "user@example.com"
}
```

### 10. 重置密码
**接口**: `POST /auth/reset-password`

**请求参数**:
```json
{
  "token": "reset_token_here",
  "new_password": "newpassword123"
}
```

## 错误处理

### 登录失败示例
```json
{
  "code": 401,
  "message": "用户名或密码错误",
  "data": null
}
```

### 注册失败示例
```json
{
  "code": 400,
  "message": "注册失败",
  "data": {
    "errors": {
      "username": ["用户名已存在"],
      "email": ["邮箱格式不正确"],
      "phone": ["手机号已被注册"]
    }
  }
}
```

## 前端实现说明

### 1. API服务层
- 位置: `src/api/`
- `http.js`: HTTP客户端配置和拦截器
- `auth.js`: 认证相关API接口封装

### 2. 状态管理
- 位置: `src/store/auth.js`
- 管理用户登录状态、用户信息、token等

### 3. 配置文件
- 位置: `src/config/index.js`
- API基础URL、认证配置等

### 4. 页面组件
- `src/views/Login.vue`: 登录页面
- `src/views/Register.vue`: 注册页面

## 部署建议

### 前端部署
1. 构建生产版本: `npm run build`
2. 将构建产物部署到Web服务器
3. 配置环境变量中的API基础URL

### 后端要求
1. 实现上述API接口
2. 配置CORS允许前端域名访问
3. 实现JWT令牌生成和验证
4. 数据库设计用户表结构

## 开发调试

### Mock数据
如需在后端接口未完成时进行前端开发，可以：
1. 修改 `src/config/index.js` 中的 `dev.enableMock` 为 `true`
2. 创建mock服务或使用工具如 json-server

### 演示账号
配置文件中提供了演示账号：
- 管理员: `admin` / `admin123`
- 普通用户: `testuser` / `test123`

这些账号可用于前端功能测试。
