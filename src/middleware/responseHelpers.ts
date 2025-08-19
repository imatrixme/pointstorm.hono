import type { MiddlewareHandler } from 'hono'

declare module 'hono' {
  interface Context {
    quickError: (statusCode: number, message: string) => Response
    ok: (data?: any) => Response
  }
}

export const responseHelpers: MiddlewareHandler = async (c, next) => {
  // 快速错误响应
  c.quickError = (statusCode: number, message: string) => {
    return c.json({
      success: false,
      error: message,
      statusCode
    }, statusCode as any)
  }

  // 成功响应
  c.ok = (data?: any) => {
    if (data === undefined) {
      return c.json({ success: true })
    }
    return c.json(data)
  }

  await next()
}