// 应用配置
export default {
  // API配置
  api: {
    // 基础URL - 强制使用相对路径通过Vite代理
    baseURL: '/api',
    // 请求超时时间
    timeout: 10000,
    // 重试次数
    retryCount: 3
  },
  
  // 认证配置
  auth: {
    // Token存储键名
    tokenKey: 'accessToken',
    refreshTokenKey: 'refreshToken',
    userInfoKey: 'user_info',
    // Token过期前多少秒开始刷新
    refreshBeforeExpire: 300
  },
  
  // 应用信息
  app: {
    name: '陪玩管理系统',
    version: '1.0.0',
    description: '现代化的陪玩服务管理平台'
  },
  
  // 开发配置
  dev: {
    // 是否启用调试日志
    enableLog: import.meta.env.DEV || true,
    // 是否启用mock数据 - 后端已开发完成，使用真实API
    enableMock: false,
    // 演示账号
    demoAccounts: [
      {
        username: 'admin',
        password: '123456',
        role: 'admin',
        description: '管理员账号'
      },
      {
        username: 'testuser',
        password: 'test123',
        role: 'user',
        description: '普通用户账号'
      }
    ]
  },
  
  // 错误处理配置
  errorHandling: {
    // 是否显示网络错误提示
    showNetworkErrors: false,
    // 是否显示服务器错误提示
    showServerErrors: true,
    // 是否显示认证错误提示
    showAuthErrors: true,
    // 是否显示权限错误提示
    showPermissionErrors: true,
    // 是否显示验证错误提示
    showValidationErrors: true
  }
}
