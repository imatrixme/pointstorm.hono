import type { MiddlewareHandler } from 'hono'
import { shareMethod } from '@/services/shareMethod'
import { APP_CONFIG } from '@/config/app'

export const checkSignature: MiddlewareHandler = async (c, next) => {
  // 开发环境跳过签名验证
  if (!APP_CONFIG.system.requireSignature) {
    await next()
    return
  }

  const signature = c.req.header('signature')
  
  if (!signature) {
    return c.quickError(403, '缺少签名参数')
  }

  try {
    // 获取请求参数
    const params: Record<string, any> = {}
    
    // 从URL参数获取
    const queries = c.req.queries()
    Object.entries(queries).forEach(([key, value]) => {
      params[key] = Array.isArray(value) ? value[0] : value
    })
    
    // 从POST body获取（如果是JSON）
    if (c.req.header('content-type')?.includes('application/json')) {
      const body = await c.req.json().catch(() => ({}))
      Object.assign(params, body)
    }

    // 验证签名
    const isValid = shareMethod.checkRequestSignature(params, signature)
    
    if (!isValid) {
      return c.quickError(403, '操作被禁止, 您涉嫌恶意篡改数据。')
    }

    await next()
  } catch (error) {
    return c.quickError(403, '签名验证失败')
  }
}