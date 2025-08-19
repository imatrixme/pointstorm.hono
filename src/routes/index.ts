import type { Hono } from 'hono'
import { userRoutes } from './userRoutes'
import { storyRoutes } from './storyRoutes'
import { transactionRoutes } from './transactionRoutes'
import { paySerialRoutes } from './paySerialRoutes'
import { pointrakRoutes } from './pointrakRoutes'
import { cashoutRoutes } from './cashoutRoutes'
import { commentRoutes } from './commentRoutes'

export function setupRoutes(app: Hono) {
  // 用户相关路由
  app.route('/user', userRoutes)
  
  // 故事相关路由
  app.route('/story', storyRoutes)
  
  // 交易相关路由
  app.route('/transaction', transactionRoutes)
  
  // 支付序列号路由
  app.route('/payserial', paySerialRoutes)
  
  // 积分流水路由
  app.route('/pointrak', pointrakRoutes)
  
  // 提现路由
  app.route('/cashout', cashoutRoutes)
  
  // 评论路由
  app.route('/comment', commentRoutes)
  
  // 其他路由...
  
  // 测试路由
  app.get('/test-db', async (c) => {
    try {
      const { getUserRepository } = await import('@/repositories/factory')
      const userRepo = getUserRepository()
      const count = await userRepo.getUserCount()
      return c.json({ 
        message: 'Database connection successful',
        userCount: count,
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      return c.json({ 
        error: 'Database connection failed',
        details: (error as Error).message 
      }, 500)
    }
  })
}