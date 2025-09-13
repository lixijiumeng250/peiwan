// 文件上传相关API接口
import http from './http'
import config from '../config'

/**
 * 上传图片
 * @param {File} file - 图片文件
 * @returns {Promise} 上传结果，返回图片URL
 */
export const uploadImage = async (file) => {
  try {
    const formData = new FormData()
    formData.append('file', file)
    
    const response = await http.post('/upload/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    return response
  } catch (error) {
    console.error('上传图片失败:', error)
    throw error
  }
}


/**
 * 解析上传接口返回的图片路径
 * @param {string} imagePath - 图片路径，格式: /api/uploads/2025/09/09/filename.png
 * @returns {Object} 解析结果 {year, month, day, filename}
 */
export const parseImagePath = (imagePath) => {
  if (!imagePath) return null
  
  // 移除开头的 /api/uploads/ 或 /uploads/
  const cleanPath = imagePath.replace(/^\/api\/uploads\/|^\/uploads\//, '')
  
  // 分割路径: 2025/09/09/filename.png
  const parts = cleanPath.split('/')
  if (parts.length !== 4) {
    console.warn('图片路径格式不正确:', imagePath)
    return null
  }
  
  return {
    year: parts[0],
    month: parts[1],
    day: parts[2],
    filename: parts[3]
  }
}

/**
 * 查看上传的图片
 * @param {string|Object} input - 可以是路径字符串或包含年月日文件名的对象
 * @param {string} month - 月份 (当第一个参数是年份时使用)
 * @param {string} day - 日期 (当第一个参数是年份时使用)
 * @param {string} filename - 文件名 (当第一个参数是年份时使用)
 * @returns {string} 图片查看URL
 */
export const getImageUrl = (input, month, day, filename) => {
  // 如果没有输入，返回空字符串
  if (!input) return ''
  
  // 如果输入是完整的HTTP URL，直接返回
  if (typeof input === 'string' && (input.startsWith('http://') || input.startsWith('https://'))) {
    return input
  }
  
  let year, parsedMonth, parsedDay, parsedFilename
  
  // 情况1: 传入的是上传接口返回的路径字符串
  if (typeof input === 'string' && input.includes('/')) {
    const parsed = parseImagePath(input)
    if (!parsed) return ''
    
    year = parsed.year
    parsedMonth = parsed.month
    parsedDay = parsed.day
    parsedFilename = parsed.filename
  }
  // 情况2: 传入的是对象 {year, month, day, filename}
  else if (typeof input === 'object' && input.year) {
    year = input.year
    parsedMonth = input.month
    parsedDay = input.day
    parsedFilename = input.filename
  }
  // 情况3: 分别传入年月日和文件名参数
  else if (typeof input === 'string' && month && day && filename) {
    year = input
    parsedMonth = month
    parsedDay = day
    parsedFilename = filename
  }
  // 情况4: 只有文件名，无法确定路径
  else {
    console.warn('无法解析图片路径:', input)
    return ''
  }
  
  // 构建查看API的URL
  return `${config.api.baseURL}/upload/view/${year}/${parsedMonth}/${parsedDay}/${parsedFilename}`
}

/**
 * 验证图片文件
 * @param {File} file - 文件对象
 * @returns {Object} 验证结果
 */
export const validateImageFile = (file) => {
  if (!file) {
    return { valid: false, message: '请选择文件' }
  }

  // 检查文件类型
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, message: '只支持 JPG、PNG、GIF、WebP 格式的图片' }
  }

  // 检查文件大小 (最大 5MB)
  const maxSize = 5 * 1024 * 1024
  if (file.size > maxSize) {
    return { valid: false, message: '图片大小不能超过 5MB' }
  }

  return { valid: true, message: '验证通过' }
}

/**
 * 获取图片查看器可用的图片URL
 * @param {string} imagePath - 上传接口返回的图片路径
 * @returns {string} 可用于图片查看的URL
 */
export const getViewableImageUrl = (imagePath) => {
  const url = getImageUrl(imagePath)
  if (!url) return ''
  
  // 确保URL是完整的，如果不是则添加协议和域名
  if (url.startsWith('/')) {
    // 相对路径，添加当前域名
    return `${window.location.origin}${url}`
  }
  
  return url
}

/**
 * 批量获取图片查看URL
 * @param {Array<string>} imagePaths - 图片路径数组
 * @returns {Array<string>} 图片查看URL数组
 */
export const getMultipleImageUrls = (imagePaths) => {
  if (!Array.isArray(imagePaths)) return []
  
  return imagePaths.map(path => getImageUrl(path)).filter(url => url)
}
