import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { prettyJSON } from 'hono/pretty-json'
import { initDatabase } from '@/database/client'
import { setupRoutes } from '@/routes'
import { errorHandler } from '@/middleware/errorHandler'
import { responseHelpers } from '@/middleware/responseHelpers'

// 创建测试应用
const createTestApp = async () => {
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
      name: 'PointStorm API (Test)',
      version: '1.0.0',
      message: 'Hono.js backend service - Test Environment'
    })
  })

  // 初始化数据库（测试环境）
  await initDatabase()

  // 设置路由
  setupRoutes(app)

  return app
}

export { createTestApp }