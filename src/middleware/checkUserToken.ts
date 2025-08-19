import type { MiddlewareHandler } from 'hono'
import { shareMethod } from '@/services/shareMethod'

declare module 'hono' {
  interface Context {
    user?: import('@/models/User').User
  }
}

export const checkUserToken: MiddlewareHandler = async (c, next) => {
  const utoken = c.req.header('utoken')
  
  if (!utoken) {
    return c.quickError(403, '未登陆用户, 请先登录')
  }

  try {
    const user = await shareMethod.getUserFromToken(utoken)
    
    if (!user) {
      return c.quickError(403, '非法用户! 禁止操作')
    }

    // 将用户信息添加到上下文中
    c.user = user
    
    await next()
  } catch (error) {
    return c.quickError(403, '用户认证失败')
  }
}