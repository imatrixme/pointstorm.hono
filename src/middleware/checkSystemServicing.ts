import type { MiddlewareHandler } from 'hono'
import { APP_CONFIG } from '@/config/app'

export const checkSystemServicing: MiddlewareHandler = async (c, next) => {
  if (APP_CONFIG.system.maintenance) {
    return c.json({
      success: false,
      error: '系统正在维护中，请稍后再试',
      statusCode: 503,
      maintenance: true
    }, 503)
  }

  await next()
}