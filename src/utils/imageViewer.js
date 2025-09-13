import { createApp, h } from 'vue'
import { ElDialog, ElImage, ElMessage } from 'element-plus'
import { getImageUrl, parseImagePath, getViewableImageUrl } from '../api/upload'

/**
 * 显示图片预览（支持上传接口返回的路径）
 * @param {string} imagePath - 图片路径或上传接口返回的路径
 */
export function showImagePreview(imagePath) {
  // 解析并获取可用的图片URL
  let url = imagePath
  
  // 如果是上传接口返回的路径格式，转换为查看URL
  if (imagePath && !imagePath.startsWith('http') && imagePath.includes('/uploads/')) {
    url = getViewableImageUrl(imagePath)
  } else if (imagePath && !imagePath.startsWith('http')) {
    // 尝试解析为上传路径
    url = getImageUrl(imagePath)
  }
  
  if (!url) {
    ElMessage.error('无效的图片路径')
    return
  }

  showImageDialog(url)
}

/**
 * 显示图片对话框
 * @param {string} url - 图片URL
 */
function showImageDialog(url) {
  // 创建一个临时的 div 元素
  const container = document.createElement('div')
  document.body.appendChild(container)
  
  // 创建 Vue 应用实例
  const app = createApp({
    data() {
      return {
        visible: true,
        imageUrl: url
      }
    },
    methods: {
      handleClose() {
        this.visible = false
        // 延迟销毁，等待动画完成
        setTimeout(() => {
          app.unmount()
          document.body.removeChild(container)
        }, 300)
      }
    },
    render() {
      return h(ElDialog, {
        modelValue: this.visible,
        'onUpdate:modelValue': (val) => {
          this.visible = val
          if (!val) {
            this.handleClose()
          }
        },
        title: '图片预览',
        width: '60%',
        modal: true,
        'show-close': true,
        'destroy-on-close': true,
        center: true
      }, {
        default: () => h('div', {
          style: {
            textAlign: 'center',
            padding: '20px'
          }
        }, [
          h(ElImage, {
            src: this.imageUrl,
            style: {
              maxWidth: '100%',
              maxHeight: '70vh'
            },
            fit: 'contain',
            'preview-src-list': [this.imageUrl],
            'initial-index': 0
          })
        ])
      })
    }
  })
  
  // 挂载应用
  app.mount(container)
}

/**
 * 批量显示图片预览
 * @param {Array<string>} imagePaths - 图片路径数组
 * @param {number} initialIndex - 初始显示的图片索引
 */
export function showMultipleImages(imagePaths, initialIndex = 0) {
  if (!Array.isArray(imagePaths) || imagePaths.length === 0) {
    ElMessage.error('没有图片可以显示')
    return
  }

  // 处理所有图片路径
  const urls = imagePaths.map(path => {
    if (path && !path.startsWith('http') && path.includes('/uploads/')) {
      return getViewableImageUrl(path)
    } else if (path && !path.startsWith('http')) {
      return getImageUrl(path)
    }
    return path
  }).filter(url => url)

  if (urls.length === 0) {
    ElMessage.error('没有有效的图片路径')
    return
  }

  showImageGallery(urls, initialIndex)
}

/**
 * 显示图片画廊
 * @param {Array<string>} urls - 图片URL数组
 * @param {number} initialIndex - 初始显示的图片索引
 */
function showImageGallery(urls, initialIndex = 0) {
  // 创建一个临时的 div 元素
  const container = document.createElement('div')
  document.body.appendChild(container)
  
  // 创建 Vue 应用实例
  const app = createApp({
    data() {
      return {
        visible: true,
        imageUrls: urls,
        currentIndex: Math.max(0, Math.min(initialIndex, urls.length - 1))
      }
    },
    computed: {
      currentImageUrl() {
        return this.imageUrls[this.currentIndex]
      },
      hasPrevious() {
        return this.currentIndex > 0
      },
      hasNext() {
        return this.currentIndex < this.imageUrls.length - 1
      }
    },
    methods: {
      handleClose() {
        this.visible = false
        // 延迟销毁，等待动画完成
        setTimeout(() => {
          app.unmount()
          document.body.removeChild(container)
        }, 300)
      },
      previousImage() {
        if (this.hasPrevious) {
          this.currentIndex--
        }
      },
      nextImage() {
        if (this.hasNext) {
          this.currentIndex++
        }
      },
      goToImage(index) {
        if (index >= 0 && index < this.imageUrls.length) {
          this.currentIndex = index
        }
      }
    },
    render() {
      return h(ElDialog, {
        modelValue: this.visible,
        'onUpdate:modelValue': (val) => {
          this.visible = val
          if (!val) {
            this.handleClose()
          }
        },
        title: `图片预览 (${this.currentIndex + 1}/${this.imageUrls.length})`,
        width: '70%',
        modal: true,
        'show-close': true,
        'destroy-on-close': true,
        center: true
      }, {
        default: () => h('div', {
          style: {
            textAlign: 'center',
            padding: '20px'
          }
        }, [
          h(ElImage, {
            src: this.currentImageUrl,
            style: {
              maxWidth: '100%',
              maxHeight: '70vh'
            },
            fit: 'contain',
            'preview-src-list': this.imageUrls,
            'initial-index': this.currentIndex
          }),
          
          // 导航按钮
          this.imageUrls.length > 1 ? h('div', {
            style: {
              marginTop: '20px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '10px'
            }
          }, [
            h('button', {
              disabled: !this.hasPrevious,
              onClick: this.previousImage,
              style: {
                padding: '8px 16px',
                borderRadius: '4px',
                border: '1px solid #dcdfe6',
                backgroundColor: this.hasPrevious ? '#409eff' : '#f5f7fa',
                color: this.hasPrevious ? 'white' : '#c0c4cc',
                cursor: this.hasPrevious ? 'pointer' : 'not-allowed'
              }
            }, '上一张'),
            
            h('span', {
              style: {
                margin: '0 15px',
                fontSize: '14px',
                color: '#606266'
              }
            }, `${this.currentIndex + 1} / ${this.imageUrls.length}`),
            
            h('button', {
              disabled: !this.hasNext,
              onClick: this.nextImage,
              style: {
                padding: '8px 16px',
                borderRadius: '4px',
                border: '1px solid #dcdfe6',
                backgroundColor: this.hasNext ? '#409eff' : '#f5f7fa',
                color: this.hasNext ? 'white' : '#c0c4cc',
                cursor: this.hasNext ? 'pointer' : 'not-allowed'
              }
            }, '下一张')
          ]) : null
        ])
      })
    }
  })
  
  // 挂载应用
  app.mount(container)
}

/**
 * 获取图片预览URL（用于img标签的src）
 * @param {string} imagePath - 图片路径
 * @returns {string} 可用的图片URL
 */
export function getPreviewUrl(imagePath) {
  if (!imagePath) return ''
  
  // 如果是上传接口返回的路径格式，转换为查看URL
  if (!imagePath.startsWith('http') && imagePath.includes('/uploads/')) {
    return getViewableImageUrl(imagePath)
  } else if (!imagePath.startsWith('http')) {
    // 尝试解析为上传路径
    return getImageUrl(imagePath)
  }
  
  return imagePath
}

/**
 * 验证图片路径并获取图片信息
 * @param {string} imagePath - 图片路径
 * @returns {Object|null} 图片信息
 */
export function getImageInfo(imagePath) {
  if (!imagePath) return null
  
  const parsed = parseImagePath(imagePath)
  if (!parsed) {
    // 如果不是标准的上传路径，但是是有效URL，也返回基本信息
    if (imagePath.startsWith('http')) {
      return {
        url: imagePath,
        originalPath: imagePath,
        isExternalUrl: true
      }
    }
    return null
  }
  
  return {
    ...parsed,
    url: getImageUrl(imagePath),
    originalPath: imagePath,
    isExternalUrl: false
  }
}
