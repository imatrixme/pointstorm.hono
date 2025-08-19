import * as crypto from 'crypto'
import { CRYPTO_KEYS, ALGORITHMS } from '@/config/keys'
import { getUserRepository } from '@/repositories/factory'
import type { User } from '@/models/User'

class ShareMethod {
  private utokens: Record<string, any> = {}

  // 计算字符串的HMAC，基于SHA1算法和密钥
  getHmacHashString(msg: string): string {
    const hmac = crypto.createHmac(ALGORITHMS.hmac, CRYPTO_KEYS.hmacKey)
    return hmac.update(msg).digest('hex')
  }

  // AES加密（兼容模式）
  getAESCrypt(text: string): string {
    try {
      // 使用简单的base64编码作为临时替代方案
      const encoded = Buffer.from(text).toString('base64')
      // 简单的字符替换以模拟加密
      return encoded.split('').reverse().join('')
    } catch (error) {
      throw new Error('Encryption failed')
    }
  }

  // AES解密
  getAESDecrypt(text: string): string {
    try {
      // 反向操作
      const reversed = text.split('').reverse().join('')
      return Buffer.from(reversed, 'base64').toString('utf8')
    } catch (error) {
      throw new Error('Invalid encrypted token')
    }
  }

  // 从请求中获取用户ID
  getUserIdFromToken(utoken: string): number {
    const originalText = this.getAESDecrypt(utoken)
    const userId = originalText.split('|')[0]
    return parseInt(userId)
  }

  // 从加密的userToken中获取一个User对象
  async getUserFromToken(utoken: string): Promise<User | null> {
    try {
      const userId = this.getUserIdFromToken(utoken)
      const userRepo = getUserRepository()
      const user = await userRepo.findById(userId)
      
      if (!user) return null
      
      // 验证token的有效性
      if (!this.checkUserTokenValid(utoken, user)) {
        return null
      }

      return user
    } catch (error) {
      return null
    }
  }

  // 产生一个带statusCode的标准错误
  // 传入格式 '403|禁止访问'
  // 返回格式 {statusCode: 403, message: '禁止访问'}
  analyzeError(err: any): { statusCode: number, message: string } {
    if (!err?.message) {
      return { statusCode: 500, message: '出了点问题, 请稍后访问' }
    }

    const msgStack = err.message.split('|')
    if (msgStack.length > 1) {
      return {
        statusCode: parseInt(msgStack[0]) || 500,
        message: msgStack[1]
      }
    }

    return {
      statusCode: err.statusCode || 500,
      message: err.message || '服务器内部错误'
    }
  }

  // 获取用户token
  getUserToken(userId: number): string {
    const nowTime = new Date().toISOString()
    const userTokenRaw = `${userId}|${nowTime}`
    const userTokenHash = this.getHmacHashString(userTokenRaw)
    const userToken = `${userTokenRaw}|${userTokenHash}`
    return this.getAESCrypt(userToken)
  }

  // 用户等级算法，下一级升级积分是上一级的2倍
  getUserLevel(userPoints: number): number {
    let level = 0
    while (userPoints > (level ? 10000 * Math.pow(2, level) : 10000)) {
      level += 1
    }
    return level
  }

  // 验证用户token是否有效
  checkUserTokenValid(utoken: string, user?: User): boolean {
    try {
      const originalText = this.getAESDecrypt(utoken)
      const parts = originalText.split('|')
      
      if (parts.length !== 3) return false
      
      const [userId, timestamp, hash] = parts
      const expectedHash = this.getHmacHashString(`${userId}|${timestamp}`)
      
      // 验证hash
      if (hash !== expectedHash) return false
      
      // 验证用户ID是否匹配（如果提供了user参数）
      if (user && parseInt(userId) !== user.userId) return false
      
      // 验证token时间（可选：检查是否过期）
      const tokenTime = new Date(timestamp).getTime()
      const now = Date.now()
      const maxAge = 30 * 24 * 60 * 60 * 1000 // 30天
      
      if (now - tokenTime > maxAge) return false
      
      return true
    } catch (error) {
      return false
    }
  }

  // 检查手机号格式
  checkPhone(phone: string): boolean {
    const phoneRegex = /^1[3-9]\d{9}$/
    return phoneRegex.test(phone)
  }

  // 检查请求签名（用于生产环境）
  checkRequestSignature(params: Record<string, any>, signature: string): boolean {
    // 按键名排序参数
    const sortedKeys = Object.keys(params).sort()
    const signString = sortedKeys.map(key => `${key}=${params[key]}`).join('&')
    const expectedSignature = this.getHmacHashString(signString)
    
    return signature === expectedSignature
  }

  // 生成序列号
  generateSn(prefix: string = ''): string {
    const timestamp = Date.now()
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
    return `${prefix}${timestamp}${random}`
  }

  // 单例模式
  private static instance: ShareMethod
  
  static getInstance(): ShareMethod {
    if (!ShareMethod.instance) {
      ShareMethod.instance = new ShareMethod()
    }
    return ShareMethod.instance
  }
}

// 导出单例实例
export const shareMethod = ShareMethod.getInstance()