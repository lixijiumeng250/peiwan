/**
 * 日期格式化工具函数
 */

/**
 * 格式化日期时间
 * @param {string|Date} dateTime - 日期时间字符串或Date对象
 * @param {string} format - 格式化模板，默认为 'YYYY-MM-DD HH:mm:ss'
 * @returns {string} 格式化后的日期时间字符串
 */
export function formatDateTime(dateTime, format = 'YYYY-MM-DD HH:mm:ss') {
  if (!dateTime) return '-'
  
  try {
    const date = new Date(dateTime)
    if (isNaN(date.getTime())) return '-'
    
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    const seconds = String(date.getSeconds()).padStart(2, '0')
    
    return format
      .replace('YYYY', year)
      .replace('MM', month)
      .replace('DD', day)
      .replace('HH', hours)
      .replace('mm', minutes)
      .replace('ss', seconds)
  } catch (error) {
    console.error('日期格式化错误:', error)
    return '-'
  }
}

/**
 * 格式化为简短的日期时间格式
 * @param {string|Date} dateTime - 日期时间字符串或Date对象
 * @returns {string} 格式化后的日期时间字符串 (MM-DD HH:mm)
 */
export function formatShortDateTime(dateTime) {
  return formatDateTime(dateTime, 'MM-DD HH:mm')
}

/**
 * 格式化为仅日期格式
 * @param {string|Date} dateTime - 日期时间字符串或Date对象
 * @returns {string} 格式化后的日期字符串 (YYYY-MM-DD)
 */
export function formatDate(dateTime) {
  return formatDateTime(dateTime, 'YYYY-MM-DD')
}

/**
 * 格式化为仅时间格式
 * @param {string|Date} dateTime - 日期时间字符串或Date对象
 * @returns {string} 格式化后的时间字符串 (HH:mm:ss)
 */
export function formatTime(dateTime) {
  return formatDateTime(dateTime, 'HH:mm:ss')
}
