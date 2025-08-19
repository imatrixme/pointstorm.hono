import type { Context } from 'hono'
import { getStoryRepository } from '@/repositories/factory'
import { shareMethod } from '@/services/shareMethod'
import { z } from 'zod'

// 输入验证schemas
const createStorySchema = z.object({
  title: z.string().min(1, '标题不能为空').max(200, '标题不能超过200字符'),
  content: z.string().min(1, '内容不能为空').max(10000, '内容不能超过10000字符'),
  anonymous: z.boolean().optional().default(false),
  language: z.string().optional()
})

const updateStorySchema = z.object({
  title: z.string().min(1).max(200).optional(),
  content: z.string().min(1).max(10000).optional(),
  anonymous: z.boolean().optional()
})

const indexListSchema = z.object({
  page: z.string().transform(val => parseInt(val) || 1),
  count: z.string().transform(val => Math.min(parseInt(val) || 10, 50)), // 限制最大50条
  owner: z.string().transform(val => val === '0' ? undefined : parseInt(val)).optional()
})

export class StoryController {
  private get storyRepo() {
    return getStoryRepository()
  }

  /**
   * 故事列表索引
   * GET /story/index?page=1&count=10&owner=123
   */
  async indexList(c: Context) {
    try {
      const user = c.user!
      const query = c.req.query()
      const { page, count, owner } = indexListSchema.parse(query)
      
      const offset = (page - 1) * count
      
      const filters = {
        owner,
        status: 'allow' as const,
        language: user.language
      }

      const stories = await this.storyRepo.findAll(count, offset, filters)
      
      // 为每个故事获取用户交互状态（如果用户已登录）
      const storiesWithInteractions = await Promise.all(
        stories.map(async (story) => {
          const interactions = await this.storyRepo.checkUserUpDown(story.id, user.userId)
          return {
            ...story,
            userInteractions: interactions
          }
        })
      )
      
      return c.ok(storiesWithInteractions)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return c.quickError(400, error.errors[0].message)
      }
      
      const { statusCode, message } = shareMethod.analyzeError(error)
      return c.quickError(statusCode, message)
    }
  }

  /**
   * 创建故事
   * POST /story/create
   */
  async createStory(c: Context) {
    try {
      const user = c.user!
      const body = await c.req.json()
      const validatedData = createStorySchema.parse(body)
      
      const storyData = {
        ...validatedData,
        owner: user.userId,
        language: validatedData.language || user.language
      }

      const story = await this.storyRepo.create(storyData)
      
      // 返回包含创建者信息的故事
      const storyWithOwner = await this.storyRepo.findWithOwner(story.id)
      
      return c.ok(storyWithOwner)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return c.quickError(400, error.errors[0].message)
      }
      
      const { statusCode, message } = shareMethod.analyzeError(error)
      return c.quickError(statusCode, message)
    }
  }

  /**
   * 点赞故事
   * POST /story/up
   */
  async upStory(c: Context) {
    try {
      const user = c.user!
      const { storyId } = await c.req.json()
      
      if (!storyId) {
        return c.quickError(400, '缺少故事ID')
      }

      // 检查故事是否存在
      const story = await this.storyRepo.findById(storyId)
      if (!story) {
        return c.quickError(404, '故事不存在')
      }

      const success = await this.storyRepo.upStory(storyId, user.userId)
      
      if (!success) {
        return c.quickError(400, '您已经点过赞了')
      }

      return c.ok({ message: '点赞成功' })
    } catch (error) {
      const { statusCode, message } = shareMethod.analyzeError(error)
      return c.quickError(statusCode, message)
    }
  }

  /**
   * 点踩故事
   * POST /story/down
   */
  async downStory(c: Context) {
    try {
      const user = c.user!
      const { storyId } = await c.req.json()
      
      if (!storyId) {
        return c.quickError(400, '缺少故事ID')
      }

      // 检查故事是否存在
      const story = await this.storyRepo.findById(storyId)
      if (!story) {
        return c.quickError(404, '故事不存在')
      }

      const success = await this.storyRepo.downStory(storyId, user.userId)
      
      if (!success) {
        return c.quickError(400, '您已经点过踩了')
      }

      return c.ok({ message: '点踩成功' })
    } catch (error) {
      const { statusCode, message } = shareMethod.analyzeError(error)
      return c.quickError(statusCode, message)
    }
  }

  /**
   * 收藏/取消收藏故事
   * POST /story/favorite
   */
  async favoriteStory(c: Context) {
    try {
      const user = c.user!
      const { storyId } = await c.req.json()
      
      if (!storyId) {
        return c.quickError(400, '缺少故事ID')
      }

      // 检查故事是否存在
      const story = await this.storyRepo.findById(storyId)
      if (!story) {
        return c.quickError(404, '故事不存在')
      }

      const favorited = await this.storyRepo.favoriteStory(storyId, user.userId)
      
      return c.ok({ 
        message: favorited ? '收藏成功' : '取消收藏成功',
        favorited 
      })
    } catch (error) {
      const { statusCode, message } = shareMethod.analyzeError(error)
      return c.quickError(statusCode, message)
    }
  }

  /**
   * 举报故事
   * POST /story/report
   */
  async reportIllegal(c: Context) {
    try {
      const { storyId } = await c.req.json()
      
      if (!storyId) {
        return c.quickError(400, '缺少故事ID')
      }

      // 检查故事是否存在
      const story = await this.storyRepo.findById(storyId)
      if (!story) {
        return c.quickError(404, '故事不存在')
      }

      await this.storyRepo.reportStory(storyId)
      
      return c.ok({ message: '举报成功，我们会尽快处理' })
    } catch (error) {
      const { statusCode, message } = shareMethod.analyzeError(error)
      return c.quickError(statusCode, message)
    }
  }

  /**
   * 获取故事评论
   * GET /story/comments?storyId=123
   */
  async getStoryComments(c: Context) {
    try {
      const { storyId } = c.req.query()
      
      if (!storyId) {
        return c.quickError(400, '缺少故事ID')
      }

      const storyWithDetails = await this.storyRepo.findWithComments(parseInt(storyId))
      
      if (!storyWithDetails) {
        return c.quickError(404, '故事不存在')
      }

      // 增加浏览量
      await this.storyRepo.incrementViews(parseInt(storyId))
      
      return c.ok(storyWithDetails)
    } catch (error) {
      const { statusCode, message } = shareMethod.analyzeError(error)
      return c.quickError(statusCode, message)
    }
  }

  /**
   * 删除故事
   * POST /story/deleteStory
   */
  async deleteStory(c: Context) {
    try {
      const user = c.user!
      const { storyId } = await c.req.json()
      
      if (!storyId) {
        return c.quickError(400, '缺少故事ID')
      }

      // 检查故事是否存在并且属于当前用户
      const story = await this.storyRepo.findById(storyId)
      if (!story) {
        return c.quickError(404, '故事不存在')
      }

      if (story.owner !== user.userId && user.role !== 'admin') {
        return c.quickError(403, '您只能删除自己的故事')
      }

      const success = await this.storyRepo.delete(storyId)
      
      if (!success) {
        return c.quickError(500, '删除失败')
      }

      return c.ok({ message: '删除成功' })
    } catch (error) {
      const { statusCode, message } = shareMethod.analyzeError(error)
      return c.quickError(statusCode, message)
    }
  }
}