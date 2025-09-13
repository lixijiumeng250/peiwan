# 轮询刷新功能说明

## 功能概述

为了解决客服发派工单后，员工端需要手动刷新才能看到新工单的问题，我们实现了一个智能的前端轮询刷新机制。

## 核心特性

### 1. 智能轮询管理
- **页面可见性检测**：当页面隐藏时自动暂停轮询，页面重新可见时恢复轮询
- **组件生命周期管理**：组件卸载时自动停止轮询，避免内存泄漏
- **多组件支持**：支持多个组件同时进行不同频率的轮询

### 2. 轮询配置
```javascript
export const POLLING_CONFIG = {
  EMPLOYEE_ORDERS: 15,    // 员工工单列表：15秒
  CS_EMPLOYEES: 20,       // 客服员工列表：20秒
  ADMIN_USERS: 30,        // 管理员用户列表：30秒
  ORDER_DETAIL: 10,       // 工单详情：10秒
  EMPLOYEE_STATUS: 25     // 员工状态：25秒
}
```

### 3. 用户体验优化
- **静默刷新**：轮询时不显示加载状态，避免界面闪烁
- **状态指示器**：显示轮询状态，让用户知道系统正在自动刷新
- **智能提示**：检测到新数据时显示提示消息

## 实现细节

### 1. 轮询管理器 (`src/utils/polling.js`)
```javascript
// 使用示例
const { startPolling, stopPolling } = usePolling()

// 开始轮询
startPolling('key', callback, interval)

// 停止轮询
stopPolling('key')
```

### 2. 员工工单组件 (`src/components/EmployeeWorkRecords.vue`)
- 自动轮询工单列表
- 检测新工单并提示用户
- 显示轮询状态指示器

### 3. 客服页面 (`src/views/CustomerService.vue`)
- 轮询员工列表状态
- 实时更新员工工作状态

## 使用方法

### 1. 在组件中使用轮询
```javascript
import { usePolling, POLLING_CONFIG } from '../utils/polling'

export default {
  setup() {
    const { startPolling, stopPolling } = usePolling()
    
    // 开始轮询
    const startPollingData = () => {
      startPolling('my-data', async () => {
        // 刷新数据的逻辑
        await refreshData()
      }, POLLING_CONFIG.EMPLOYEE_ORDERS * 1000)
    }
    
    // 停止轮询
    const stopPollingData = () => {
      stopPolling('my-data')
    }
    
    onMounted(() => {
      startPollingData()
    })
    
    onUnmounted(() => {
      stopPollingData()
    })
  }
}
```

### 2. 测试轮询功能
访问 `/polling-test` 页面可以测试轮询功能：
- 查看轮询状态
- 观察轮询日志
- 测试开始/停止功能

## 技术优势

1. **性能优化**：页面隐藏时暂停轮询，节省资源
2. **内存安全**：组件卸载时自动清理定时器
3. **用户体验**：静默刷新，不干扰用户操作
4. **可配置性**：不同组件可以设置不同的轮询间隔
5. **状态透明**：用户可以看到轮询状态

## 注意事项

1. **网络请求频率**：轮询间隔不宜过短，避免给服务器造成压力
2. **错误处理**：轮询失败时会记录警告，不会中断轮询
3. **数据一致性**：轮询只刷新数据，不处理复杂的业务逻辑
4. **浏览器兼容性**：使用标准的 `setInterval` 和 `clearInterval` API

## 未来扩展

1. **WebSocket 支持**：可以结合 WebSocket 实现真正的实时通信
2. **智能轮询**：根据用户活跃度动态调整轮询频率
3. **离线检测**：网络断开时暂停轮询，恢复时重新开始
4. **数据对比**：只更新发生变化的数据，减少不必要的重渲染
