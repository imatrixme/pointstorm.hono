import type { MiddlewareHandler } from 'hono'

export const checkAdminRole: MiddlewareHandler = async (c, next) => {
  const user = c.user
  
  if (!user) {
    return c.quickError(403, '用户未登录')
  }

  if (user.role !== 'admin') {
    return c.quickError(403, '权限不足，需要管理员权限')
  }

  await next()
}