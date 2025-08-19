import { ErrorHandler } from 'hono'

export const errorHandler: ErrorHandler = (err, c) => {
  console.error('Error caught by error handler:', err)
  
  // 如果错误有状态码，使用该状态码
  const status = (err as any)?.status || 500
  
  return c.json({
    success: false,
    error: err.message || 'Internal Server Error',
    statusCode: status
  }, status)
}