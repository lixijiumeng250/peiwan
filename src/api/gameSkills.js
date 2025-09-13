// 游戏技能相关API接口
import http from './http'

/**
 * 根据ID获取游戏技能
 * @param {number} id - 游戏技能ID
 * @returns {Promise} 游戏技能详情
 */
export const getGameSkillById = async (id) => {
  try {
    const response = await http.get(`/game-skills/${id}`)
    return response
  } catch (error) {
    console.error('获取游戏技能详情失败:', error)
    throw error
  }
}

/**
 * 创建游戏技能
 * @param {Object} gameSkillData - 游戏技能数据
 * @param {number} gameSkillData.id - 游戏技能ID，更新时需要（可选）
 * @param {string} gameSkillData.gameName - 游戏名称（必填）
 * @param {string} gameSkillData.playStyle - 陪玩类型，可用值：TECHNICAL,ENTERTAINMENT（必填）
 * @param {string} gameSkillData.serviceType - 服务类型，可用值：RANKED,CASUAL（必填）
 * @param {string} gameSkillData.highestRank - 最高段位（可选）
 * @returns {Promise} 创建的游戏技能
 */
export const createGameSkill = async (gameSkillData) => {
  try {
    const response = await http.post('/game-skills', gameSkillData)
    return response
  } catch (error) {
    console.error('创建游戏技能失败:', error)
    throw error
  }
}

/**
 * 更新游戏技能
 * @param {number} id - 游戏技能ID
 * @param {Object} gameSkillData - 游戏技能数据
 * @param {number} gameSkillData.id - 游戏技能ID，更新时需要（可选）
 * @param {string} gameSkillData.gameName - 游戏名称（必填）
 * @param {string} gameSkillData.playStyle - 陪玩类型，可用值：TECHNICAL,ENTERTAINMENT（必填）
 * @param {string} gameSkillData.serviceType - 服务类型，可用值：RANKED,CASUAL（必填）
 * @param {string} gameSkillData.highestRank - 最高段位（可选）
 * @returns {Promise} 更新后的游戏技能
 */
export const updateGameSkill = async (id, gameSkillData) => {
  try {
    const response = await http.put(`/game-skills/${id}`, gameSkillData)
    return response
  } catch (error) {
    console.error('更新游戏技能失败:', error)
    throw error
  }
}

/**
 * 删除游戏技能
 * @param {number} id - 游戏技能ID
 * @returns {Promise} 删除结果
 */
export const deleteGameSkill = async (id) => {
  try {
    const response = await http.delete(`/game-skills/${id}`)
    return response
  } catch (error) {
    console.error('删除游戏技能失败:', error)
    throw error
  }
}

/**
 * 批量创建游戏技能
 * @param {Array} gameSkillDataArray - 游戏技能数据数组
 * @param {number} gameSkillDataArray[].id - 游戏技能ID，更新时需要（可选）
 * @param {string} gameSkillDataArray[].gameName - 游戏名称（必填）
 * @param {string} gameSkillDataArray[].playStyle - 陪玩类型，可用值：TECHNICAL,ENTERTAINMENT（必填）
 * @param {string} gameSkillDataArray[].serviceType - 服务类型，可用值：RANKED,CASUAL（必填）
 * @param {string} gameSkillDataArray[].highestRank - 最高段位（可选）
 * @returns {Promise} 创建的游戏技能数组
 */
export const batchCreateGameSkills = async (gameSkillDataArray) => {
  try {
    const response = await http.post('/game-skills/batch', gameSkillDataArray)
    return response
  } catch (error) {
    console.error('批量创建游戏技能失败:', error)
    throw error
  }
}

/**
 * 获取员工的游戏技能列表
 * @param {number} profileId - 员工资料ID
 * @returns {Promise} 游戏技能列表
 */
export const getGameSkillsByProfileId = async (profileId) => {
  try {
    const response = await http.get(`/game-skills/profile/${profileId}`)
    return response
  } catch (error) {
    console.error('获取员工游戏技能列表失败:', error)
    throw error
  }
}

/**
 * 获取当前员工的游戏技能
 * @returns {Promise} 当前员工的游戏技能列表
 */
export const getMyGameSkills = async () => {
  try {
    const response = await http.get('/game-skills/my-skills')
    return response
  } catch (error) {
    console.error('获取当前员工游戏技能失败:', error)
    throw error
  }
}

/**
 * 根据游戏名称搜索技能
 * @param {string} gameName - 游戏名称
 * @returns {Promise} 游戏技能列表
 */
export const searchGameSkillsByGameName = async (gameName) => {
  try {
    const response = await http.get(`/game-skills/game/${encodeURIComponent(gameName)}`)
    return response
  } catch (error) {
    console.error('根据游戏名称搜索技能失败:', error)
    throw error
  }
}