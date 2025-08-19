import type { MiddlewareHandler } from 'hono'

export const checkUserDenied: MiddlewareHandler = async (c, next) => {
  const user = c.user
  
  if (!user) {
    return c.quickError(403, '用户未登录')
  }

  if (user.status === 'deny') {
    return c.quickError(403, '您的账户已被禁用，请联系管理员')
  }

  await next()
}