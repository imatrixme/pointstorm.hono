import type { Context } from 'hono'
import { getPaySerialRepository, getUserRepository } from '@/repositories/factory'
import { shareMethod } from '@/services/shareMethod'
import { z } from 'zod'

// 输入验证schemas
const createPaySerialSchema = z.object({
  point: z.number().int().positive('积分数量必须是正整数'),
  password: z.string().min(6, '密码至少6位').max(50, '密码不能超过50位'),
  hours: z.number().int().min(1, '有效期至少1小时').max(8760, '有效期不能超过1年').default(24) // 默认24小时
})

const usePaySerialSchema = z.object({
  sn: z.string().min(1, '序列号不能为空'),
  password: z.string().min(1, '密码不能为空')
})

const paySerialListSchema = z.object({
  page: z.string().transform(val => parseInt(val) || 1),
  count: z.string().transform(val => Math.min(parseInt(val) || 10, 50))
})

export class PaySerialController {
  private get paySerialRepo() {
    return getPaySerialRepository()
  }

  private get userRepo() {
    return getUserRepository()
  }

  /**
   * 创建支付序列号
   * POST /payserial/create
   */
  async createPaySerial(c: Context) {
    try {
      const user = c.user!
      const body = await c.req.json()
      const validatedData = createPaySerialSchema.parse(body)

      // 检查用户积分是否充足
      if (user.points < validatedData.point) {
        return c.quickError(400, '积分不足')
      }

      // 计算过期时间（当前时间 + 指定小时数）
      const now = Date.now()
      const expiredTime = now + (validatedData.hours * 60 * 60 * 1000)

      // 创建支付序列号
      const paySerial = await this.paySerialRepo.create({
        point: validatedData.point,
        password: validatedData.password,
        expired: expiredTime,
        user: user.userId
      })

      // 扣除用户积分
      await this.userRepo.updatePoints(user.userId, -validatedData.point)

      return c.ok({
        id: paySerial.id,
        sn: paySerial.sn,
        point: paySerial.point,
        expired: paySerial.expired,
        status: paySerial.status,
        createdAt: paySerial.createdAt
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return c.quickError(400, error.errors[0].message)
      }
      
      const { statusCode, message } = shareMethod.analyzeError(error)
      return c.quickError(statusCode, message)
    }
  }

  /**
   * 使用支付序列号
   * POST /payserial/use
   */
  async usePaySerial(c: Context) {
    try {
      const user = c.user!
      const body = await c.req.json()
      const { sn, password } = usePaySerialSchema.parse(body)

      // 验证并使用序列号
      const paySerial = await this.paySerialRepo.validateAndUse(sn, password)
      
      if (!paySerial) {
        return c.quickError(400, '序列号无效、已过期或密码错误')
      }

      // 给当前用户增加积分
      await this.userRepo.updatePoints(user.userId, paySerial.point)

      return c.ok({
        message: '兑换成功',
        point: paySerial.point
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return c.quickError(400, error.errors[0].message)
      }
      
      const { statusCode, message } = shareMethod.analyzeError(error)
      return c.quickError(statusCode, message)
    }
  }

  /**
   * 获取用户的支付序列号列表
   * GET /payserial/index?page=1&count=10
   */
  async getPaySerialHistory(c: Context) {
    try {
      const user = c.user!
      const query = c.req.query()
      const { page, count } = paySerialListSchema.parse(query)
      
      const offset = (page - 1) * count
      
      const paySerials = await this.paySerialRepo.findByUser(user.userId, count, offset)
      
      // 过滤敏感信息（密码）
      const sanitizedPaySerials = paySerials.map(ps => ({
        id: ps.id,
        sn: ps.sn,
        point: ps.point,
        expired: ps.expired,
        status: ps.status,
        createdAt: ps.createdAt,
        updatedAt: ps.updatedAt
        // 不返回password字段
      }))
      
      return c.ok(sanitizedPaySerials)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return c.quickError(400, error.errors[0].message)
      }
      
      const { statusCode, message } = shareMethod.analyzeError(error)
      return c.quickError(statusCode, message)
    }
  }
}