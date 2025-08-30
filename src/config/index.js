// 应用配置
export default {
  // API配置
  api: {
    // 基础URL - 生产环境需要替换为实际的后端地址
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api',
    // 请求超时时间
    timeout: 10000,
    // 重试次数
    retryCount: 3
  },
  
  // 认证配置
  auth: {
    // Token存储键名
    tokenKey: 'access_token',
    refreshTokenKey: 'refresh_token',
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
    // 是否启用mock数据 - 临时启用以便前端独立运行
    enableMock: true,
    // 演示账号
    demoAccounts: [
      {
        username: 'admin',
        password: 'admin123',
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
  }
}
