import type { Context } from 'hono'
import { getPointrakRepository } from '@/repositories/factory'
import { shareMethod } from '@/services/shareMethod'
import { z } from 'zod'

// 输入验证schemas
const pointrakListSchema = z.object({
  page: z.string().transform(val => parseInt(val) || 1),
  count: z.string().transform(val => Math.min(parseInt(val) || 10, 50)),
  channel: z.string().optional()
})

const createPointrakSchema = z.object({
  points: z.number().int('积分必须是整数'),
  owner: z.number().int().positive('用户ID必须是正整数'),
  detail: z.string().optional(),
  channel: z.enum([
    'just_reward',
    'outer_banner_show', 'outer_banner_click',
    'outer_screen_show', 'outer_screen_click', 'outer_screen_click_video',
    'outer_rewardvideo_show', 'outer_rewardvideo_click',
    'inner_txt_show', 'inner_txt_click',
    'inner_img_show', 'inner_img_click',
    'inner_video_show', 'inner_video_click',
    'game_play', 'game_defeat', 'game_victory',
    'shopping', 'promotion', 'envelop'
  ])
})

export class PointrakController {
  private get pointrakRepo() {
    return getPointrakRepository()
  }

  /**
   * 获取用户积分流水
   * GET /pointrak/index?page=1&count=10&channel=game_play
   */
  async getPointrakHistory(c: Context) {
    try {
      const user = c.user!
      const query = c.req.query()
      const { page, count, channel } = pointrakListSchema.parse(query)
      
      const offset = (page - 1) * count
      
      const filters: any = { owner: user.userId }
      if (channel) {
        filters.channel = channel
      }
      
      const pointraks = await this.pointrakRepo.findAll(count, offset, filters)
      
      return c.ok(pointraks)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return c.quickError(400, error.errors[0].message)
      }
      
      const { statusCode, message } = shareMethod.analyzeError(error)
      return c.quickError(statusCode, message)
    }
  }

  /**
   * 创建积分流水记录（管理员接口）
   * POST /pointrak/create
   */
  async createPointrak(c: Context) {
    try {
      const user = c.user!
      
      // 检查管理员权限
      if (user.role !== 'admin') {
        return c.quickError(403, '权限不足')
      }
      
      const body = await c.req.json()
      const validatedData = createPointrakSchema.parse(body)
      
      const pointrak = await this.pointrakRepo.create(validatedData)
      
      return c.ok(pointrak)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return c.quickError(400, error.errors[0].message)
      }
      
      const { statusCode, message } = shareMethod.analyzeError(error)
      return c.quickError(statusCode, message)
    }
  }

  /**
   * 获取积分统计
   * GET /pointrak/stats
   */
  async getPointrakStats(c: Context) {
    try {
      const user = c.user!
      
      const totalPoints = await this.pointrakRepo.getTotalPointsByOwner(user.userId)
      const totalCount = await this.pointrakRepo.getPointrakCountByOwner(user.userId)
      
      // 获取最近30天的积分
      const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000)
      const recentPoints = await this.pointrakRepo.getPointsByDateRange(user.userId, thirtyDaysAgo, Date.now())
      
      return c.ok({
        totalPoints,
        totalCount,
        recentPoints
      })
    } catch (error) {
      const { statusCode, message } = shareMethod.analyzeError(error)
      return c.quickError(statusCode, message)
    }
  }
}