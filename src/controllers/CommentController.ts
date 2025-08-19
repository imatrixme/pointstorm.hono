import type { Context } from 'hono'
import { shareMethod } from '@/services/shareMethod'
import { z } from 'zod'

// 输入验证schemas
const createCommentSchema = z.object({
  story: z.number().int().positive('故事ID必须是正整数'),
  content: z.string().min(1, '评论内容不能为空').max(1000, '评论内容不能超过1000字符'),
  anonymous: z.boolean().optional().default(false)
})

const commentListSchema = z.object({
  page: z.string().transform(val => parseInt(val) || 1),
  count: z.string().transform(val => Math.min(parseInt(val) || 10, 50)),
  story: z.string().transform(val => parseInt(val)).optional()
})

export class CommentController {
  /**
   * 创建评论
   * POST /comment/create
   */
  async createComment(c: Context) {
    try {
      const user = c.user!
      const body = await c.req.json()
      const validatedData = createCommentSchema.parse(body)

      // TODO: 实现评论创建逻辑
      // 这里需要：
      // 1. 检查故事是否存在
      // 2. 创建评论记录
      // 3. 增加故事评论数
      
      return c.quickError(501, '评论功能尚未实现')
    } catch (error) {
      if (error instanceof z.ZodError) {
        return c.quickError(400, error.errors[0].message)
      }
      
      const { statusCode, message } = shareMethod.analyzeError(error)
      return c.quickError(statusCode, message)
    }
  }

  /**
   * 获取评论列表
   * GET /comment/index?page=1&count=10&story=123
   */
  async indexComment(c: Context) {
    try {
      const query = c.req.query()
      const { page, count, story } = commentListSchema.parse(query)
      
      // TODO: 实现评论查询逻辑
      // 这里需要：
      // 1. 根据故事ID查询评论
      // 2. 支持分页
      // 3. 包含用户信息
      
      return c.quickError(501, '评论查询功能尚未实现')
    } catch (error) {
      if (error instanceof z.ZodError) {
        return c.quickError(400, error.errors[0].message)
      }
      
      const { statusCode, message } = shareMethod.analyzeError(error)
      return c.quickError(statusCode, message)
    }
  }
}