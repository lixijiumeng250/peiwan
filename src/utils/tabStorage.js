// 标签页隔离存储工具
// 为每个标签页创建独立的存储空间，避免多标签页用户权限混淆

class TabStorage {
  constructor() {
    // 为每个标签页生成唯一ID
    this.tabId = this.getOrCreateTabId()
    // console.log('TabStorage 初始化，标签页ID:', this.tabId)
  }

  /**
   * 获取或创建标签页ID
   */
  getOrCreateTabId() {
    // 尝试从sessionStorage获取已有的tabId
    let tabId = sessionStorage.getItem('__tab_id__')
    
    if (!tabId) {
      // 如果没有，创建新的tabId
      tabId = `tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      sessionStorage.setItem('__tab_id__', tabId)
    }
    
    return tabId
  }

  /**
   * 获取带标签页ID的key
   */
  getTabKey(key) {
    return `${key}_${this.tabId}`
  }

  /**
   * 设置标签页隔离的sessionStorage项
   */
  setItem(key, value) {
    const tabKey = this.getTabKey(key)
    sessionStorage.setItem(tabKey, value)
    // console.log(`TabStorage.setItem: ${key} -> ${tabKey}`)
  }

  /**
   * 获取标签页隔离的sessionStorage项
   */
  getItem(key) {
    const tabKey = this.getTabKey(key)
    const value = sessionStorage.getItem(tabKey)
    // console.log(`TabStorage.getItem: ${key} -> ${tabKey} = ${value ? '有值' : '无值'}`)
    return value
  }

  /**
   * 删除标签页隔离的sessionStorage项
   */
  removeItem(key) {
    const tabKey = this.getTabKey(key)
    sessionStorage.removeItem(tabKey)
    // console.log(`TabStorage.removeItem: ${key} -> ${tabKey}`)
  }

  /**
   * 清除当前标签页的所有存储项
   */
  clear() {
    const keysToRemove = []
    
    // 遍历所有sessionStorage项，找到属于当前标签页的
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i)
      if (key && key.endsWith(`_${this.tabId}`)) {
        keysToRemove.push(key)
      }
    }
    
    // 删除找到的项
    keysToRemove.forEach(key => {
      sessionStorage.removeItem(key)
    })
    
    // 也删除tabId本身
    sessionStorage.removeItem('__tab_id__')
    
    // console.log(`TabStorage.clear: 清除了 ${keysToRemove.length} 个项目`)
  }

  /**
   * 获取当前标签页ID
   */
  getTabId() {
    return this.tabId
  }

  /**
   * 检查是否存在某个key
   */
  hasItem(key) {
    const tabKey = this.getTabKey(key)
    return sessionStorage.getItem(tabKey) !== null
  }

  /**
   * 获取当前标签页的所有存储项（调试用）
   */
  getAllItems() {
    const items = {}
    
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i)
      if (key && key.endsWith(`_${this.tabId}`)) {
        const originalKey = key.replace(`_${this.tabId}`, '')
        items[originalKey] = sessionStorage.getItem(key)
      }
    }
    
    return items
  }

  /**
   * 监听标签页关闭事件，清理存储
   */
  setupCleanupOnClose() {
    window.addEventListener('beforeunload', () => {
      // 标签页关闭时清理存储（可选）
      // 注意：这可能会在页面刷新时也触发，需要谨慎使用
      // console.log('标签页即将关闭，准备清理存储')
    })
  }

  /**
   * 监听存储变化，防止跨标签页数据污染
   */
  setupStorageListener() {
    window.addEventListener('storage', (e) => {
      // 只监听 localStorage 变化，sessionStorage 不会跨标签页
      // 这里主要用于调试和监控
      // console.log('存储变化检测:', e)
    })
  }

  /**
   * 强制刷新当前标签页的认证状态
   */
  forceRefreshAuth() {
    // console.log(`强制刷新认证状态 - 标签页ID: ${this.tabId}`)
    
    // 触发自定义事件，通知认证状态需要刷新
    window.dispatchEvent(new CustomEvent('tabAuthRefresh', {
      detail: { tabId: this.tabId }
    }))
  }

  /**
   * 检查当前标签页的认证完整性
   */
  validateAuthIntegrity() {
    const token = this.getItem('accessToken')
    const userInfo = this.getItem('user_info')
    
    // console.log(`认证完整性检查 - 标签页ID: ${this.tabId}`, {
    //   hasToken: !!token,
    //   hasUserInfo: !!userInfo,
    //   tokenLength: token ? token.length : 0
    // })
    
    // 如果有token但没有用户信息，或者反之，说明数据不完整
    if ((token && !userInfo) || (!token && userInfo)) {
      console.warn('认证数据不完整，清理数据')
      this.removeItem('accessToken')
      this.removeItem('refreshToken')
      this.removeItem('user_info')
      return false
    }
    
    return !!(token && userInfo)
  }

  /**
   * 迁移现有的sessionStorage数据到标签页隔离存储
   * 优化：只在首次访问时迁移，避免数据污染
   */
  migrateExistingData(keys) {
    // console.log('开始迁移现有数据到标签页隔离存储...')
    
    // 检查是否已经迁移过
    const migrationKey = '__migration_completed__'
    if (sessionStorage.getItem(migrationKey)) {
      // console.log('数据已迁移，跳过迁移过程')
      return
    }
    
    keys.forEach(key => {
      const existingValue = sessionStorage.getItem(key)
      if (existingValue && !this.hasItem(key)) {
        // 如果存在旧数据且当前标签页还没有该数据，则迁移
        this.setItem(key, existingValue)
        // console.log(`迁移数据: ${key}`)
        // 迁移后清除原始数据，避免污染其他标签页
        sessionStorage.removeItem(key)
      }
    })
    
    // 标记迁移完成
    sessionStorage.setItem(migrationKey, 'true')
    // console.log('数据迁移完成')
  }
}

// 创建单例实例
const tabStorage = new TabStorage()

// 在开发环境下暴露到全局，便于调试
if (import.meta.env.DEV) {
  window.__tabStorage = tabStorage
  
  // 添加调试工具
  window.__debugTabStorage = () => {
    // console.log('=== 标签页存储调试信息 ===')
    // console.log('标签页ID:', tabStorage.getTabId())
    // console.log('所有存储项:', tabStorage.getAllItems())
    // console.log('认证完整性:', tabStorage.validateAuthIntegrity())
    
    // 显示所有sessionStorage项
    // console.log('所有sessionStorage项:')
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i)
      const value = sessionStorage.getItem(key)
      // console.log(`  ${key}: ${value}`)
    }
  }
}

export default tabStorage
