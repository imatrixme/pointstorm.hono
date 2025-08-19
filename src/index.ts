import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { prettyJSON } from 'hono/pretty-json'
import { initDatabase } from '@/database/client'
import { setupRoutes } from '@/routes'
import { errorHandler } from '@/middleware/errorHandler'
import { responseHelpers } from '@/middleware/responseHelpers'

const app = new Hono()

// 中间件设置
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'utoken']
}))
app.use('*', logger())
app.use('*', prettyJSON())
app.use('*', responseHelpers)
app.onError(errorHandler)

// 根路径
app.get('/', (c) => {
  return c.json({
    name: 'PointStorm API',
    version: '1.0.0',
    message: 'Hono.js backend service'
  })
})

// 异步启动函数
async function startServer() {
  try {
    // 初始化数据库
    await initDatabase()

    // 设置路由
    setupRoutes(app)

    // 启动服务
    const port = parseInt(process.env.PORT || '3000')
    
    // 使用 @hono/node-server
    const { serve } = await import('@hono/node-server')
    serve({
      fetch: app.fetch,
      port,
    })
    
    console.log(`Server is running on http://localhost:${port}`)
    
  } catch (error) {
    console.error('Failed to start server:', error)
    process.exit(1)
  }
}

// 启动服务器
startServer()

// 导出app用于测试
export { app }

export default {
  port: parseInt(process.env.PORT || '3000'),
  fetch: app.fetch,
}