import type { Context } from 'hono'
import { getCashoutRepository, getUserRepository } from '@/repositories/factory'
import { shareMethod } from '@/services/shareMethod'
import { z } from 'zod'

// 输入验证schemas
const createCashoutSchema = z.object({
  points: z.number().int().positive('积分数量必须是正整数'),
  method: z.enum(['alipay', 'wechat', 'bank'], { errorMap: () => ({ message: '提现方式无效' }) }),
  account: z.string().min(1, '账户信息不能为空').max(200, '账户信息过长'),
  note: z.string().max(500, '备注信息过长').optional()
})

const cashoutListSchema = z.object({
  page: z.string().transform(val => parseInt(val) || 1),
  count: z.string().transform(val => Math.min(parseInt(val) || 10, 50)),
  status: z.enum(['pending', 'processing', 'completed', 'rejected']).optional()
})

const updateCashoutSchema = z.object({
  status: z.enum(['pending', 'processing', 'completed', 'rejected']),
  admin_note: z.string().max(500, '管理员备注过长').optional()
})

export class CashoutController {
  private get cashoutRepo() {
    return getCashoutRepository()
  }

  private get userRepo() {
    return getUserRepository()
  }

  /**
   * 创建提现申请
   * POST /cashout/create
   */
  async createCashout(c: Context) {
    try {
      const user = c.user!
      const body = await c.req.json()
      const validatedData = createCashoutSchema.parse(body)

      // 检查用户积分是否充足
      if (user.points < validatedData.points) {
        return c.quickError(400, '积分不足')
      }

      // 计算提现金额（这里假设汇率为 100积分 = 1分）
      const rate = 100 // 100积分 = 1分
      const amount = Math.floor(validatedData.points / rate)
      
      if (amount < 1) {
        return c.quickError(400, '提现积分过少，至少需要100积分')
      }

      // 创建提现记录
      const cashout = await this.cashoutRepo.create({
        user: user.userId,
        points: validatedData.points,
        amount,
        rate,
        method: validatedData.method,
        account: validatedData.account,
        note: validatedData.note
      })

      // 冻结用户积分
      await this.userRepo.updatePoints(user.userId, -validatedData.points)

      const cashoutWithUser = await this.cashoutRepo.findWithUser(cashout.id)

      return c.ok(cashoutWithUser)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return c.quickError(400, error.errors[0].message)
      }
      
      const { statusCode, message } = shareMethod.analyzeError(error)
      return c.quickError(statusCode, message)
    }
  }

  /**
   * 获取提现记录
   * GET /cashout/index?page=1&count=10&status=pending
   */
  async getCashoutHistory(c: Context) {
    try {
      const user = c.user!
      const query = c.req.query()
      const { page, count, status } = cashoutListSchema.parse(query)
      
      const offset = (page - 1) * count
      
      let cashouts
      if (user.role === 'admin') {
        // 管理员可以查看所有提现记录
        const filters: any = {}
        if (status) filters.status = status
        cashouts = await this.cashoutRepo.findAll(count, offset, filters)
      } else {
        // 普通用户只能查看自己的提现记录
        cashouts = await this.cashoutRepo.findByUser(user.userId, count, offset)
        if (status) {
          cashouts = cashouts.filter(c => c.status === status)
        }
      }
      
      return c.ok(cashouts)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return c.quickError(400, error.errors[0].message)
      }
      
      const { statusCode, message } = shareMethod.analyzeError(error)
      return c.quickError(statusCode, message)
    }
  }

  /**
   * 处理提现申请（管理员接口）
   * POST /cashout/process
   */
  async processCashout(c: Context) {
    try {
      const user = c.user!
      
      // 检查管理员权限
      if (user.role !== 'admin') {
        return c.quickError(403, '权限不足')
      }
      
      const { cashoutId, status, admin_note } = await c.req.json()
      
      if (!cashoutId) {
        return c.quickError(400, '缺少提现ID')
      }
      
      const validatedData = updateCashoutSchema.parse({ status, admin_note })

      // 检查提现记录是否存在
      const cashout = await this.cashoutRepo.findById(cashoutId)
      if (!cashout) {
        return c.quickError(404, '提现记录不存在')
      }

      // 如果拒绝提现，需要返还积分给用户
      if (validatedData.status === 'rejected' && cashout.status === 'pending') {
        await this.userRepo.updatePoints(cashout.user, cashout.points)
      }

      // 更新提现状态
      await this.cashoutRepo.updateStatus(cashoutId, validatedData.status, validatedData.admin_note)

      const updatedCashout = await this.cashoutRepo.findWithUser(cashoutId)

      return c.ok(updatedCashout)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return c.quickError(400, error.errors[0].message)
      }
      
      const { statusCode, message } = shareMethod.analyzeError(error)
      return c.quickError(statusCode, message)
    }
  }

  /**
   * 获取提现统计
   * GET /cashout/stats
   */
  async getCashoutStats(c: Context) {
    try {
      const user = c.user!
      
      if (user.role === 'admin') {
        // 管理员查看全局统计
        const pendingAmount = await this.cashoutRepo.getTotalAmountByStatus('pending')
        const processingAmount = await this.cashoutRepo.getTotalAmountByStatus('processing')
        const completedAmount = await this.cashoutRepo.getTotalAmountByStatus('completed')
        const rejectedAmount = await this.cashoutRepo.getTotalAmountByStatus('rejected')
        
        return c.ok({
          pendingAmount,
          processingAmount,
          completedAmount,
          rejectedAmount
        })
      } else {
        // 普通用户查看个人统计
        const totalAmount = await this.cashoutRepo.getTotalAmountByUser(user.userId)
        const totalCount = await this.cashoutRepo.getCashoutCountByUser(user.userId)
        
        // 获取最近30天的提现金额
        const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000)
        const recentAmount = await this.cashoutRepo.getAmountByDateRange(user.userId, thirtyDaysAgo, Date.now())
        
        return c.ok({
          totalAmount,
          totalCount,
          recentAmount
        })
      }
    } catch (error) {
      const { statusCode, message } = shareMethod.analyzeError(error)
      return c.quickError(statusCode, message)
    }
  }

  /**
   * 取消提现申请
   * POST /cashout/cancel
   */
  async cancelCashout(c: Context) {
    try {
      const user = c.user!
      const { cashoutId } = await c.req.json()
      
      if (!cashoutId) {
        return c.quickError(400, '缺少提现ID')
      }

      // 检查提现记录是否存在
      const cashout = await this.cashoutRepo.findById(cashoutId)
      if (!cashout) {
        return c.quickError(404, '提现记录不存在')
      }

      // 检查是否属于当前用户
      if (cashout.user !== user.userId) {
        return c.quickError(403, '您只能取消自己的提现申请')
      }

      // 只有pending状态的提现可以取消
      if (cashout.status !== 'pending') {
        return c.quickError(400, '该提现申请无法取消')
      }

      // 返还积分并更新状态
      await this.userRepo.updatePoints(user.userId, cashout.points)
      await this.cashoutRepo.updateStatus(cashoutId, 'rejected', '用户取消')

      return c.ok({ message: '提现申请已取消，积分已返还' })
    } catch (error) {
      const { statusCode, message } = shareMethod.analyzeError(error)
      return c.quickError(statusCode, message)
    }
  }
}