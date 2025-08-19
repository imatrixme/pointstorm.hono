import type { Context } from 'hono'
import { getTransactionRepository, getUserRepository } from '@/repositories/factory'
import { shareMethod } from '@/services/shareMethod'
import { z } from 'zod'

// 输入验证schemas
const createTransactionSchema = z.object({
  toUser: z.number().int().positive('接收用户ID必须是正整数'),
  serial: z.number().int().positive('序列号必须是正整数'),
  point: z.number().int().positive('积分数量必须是正整数')
})

const transactionListSchema = z.object({
  page: z.string().transform(val => parseInt(val) || 1),
  count: z.string().transform(val => Math.min(parseInt(val) || 10, 50))
})

export class TransactionController {
  private get transactionRepo() {
    return getTransactionRepository()
  }

  private get userRepo() {
    return getUserRepository()
  }

  /**
   * 创建交易
   * POST /transaction/create
   */
  async createTransaction(c: Context) {
    try {
      const user = c.user!
      const body = await c.req.json()
      const validatedData = createTransactionSchema.parse(body)

      // 检查接收用户是否存在
      const toUser = await this.userRepo.findById(validatedData.toUser)
      if (!toUser) {
        return c.quickError(404, '接收用户不存在')
      }

      // 检查发送者积分是否充足
      if (user.points < validatedData.point) {
        return c.quickError(400, '积分不足')
      }

      // 创建交易记录
      const transaction = await this.transactionRepo.create({
        fromUser: user.userId,
        toUser: validatedData.toUser,
        serial: validatedData.serial,
        point: validatedData.point
      })

      const transactionWithUsers = await this.transactionRepo.findWithUsers(transaction.id)

      return c.ok(transactionWithUsers)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return c.quickError(400, error.errors[0].message)
      }
      
      const { statusCode, message } = shareMethod.analyzeError(error)
      return c.quickError(statusCode, message)
    }
  }

  /**
   * 确认交易（输入密码）
   * POST /transaction/password
   */
  async passwordTransaction(c: Context) {
    try {
      const user = c.user!
      const { transactionId, password } = await c.req.json()

      if (!transactionId || !password) {
        return c.quickError(400, '缺少交易ID或密码')
      }

      // 查找交易记录
      const transaction = await this.transactionRepo.findById(transactionId)
      if (!transaction) {
        return c.quickError(404, '交易不存在')
      }

      // 检查交易是否属于当前用户
      if (transaction.fromUser !== user.userId) {
        return c.quickError(403, '您只能操作自己的交易')
      }

      // 检查交易状态
      if (transaction.status !== 'pending') {
        return c.quickError(400, '交易状态不正确')
      }

      // 验证密码（这里简化处理，实际应该有加密验证）
      if (password !== user.password) {
        return c.quickError(400, '密码错误')
      }

      // 更新交易状态为需要密码确认
      await this.transactionRepo.updateStatus(transactionId, 'password')

      return c.ok({ message: '密码验证成功，等待对方确认' })
    } catch (error) {
      const { statusCode, message } = shareMethod.analyzeError(error)
      return c.quickError(statusCode, message)
    }
  }

  /**
   * 接受交易
   * POST /transaction/success
   */
  async successTransaction(c: Context) {
    try {
      const user = c.user!
      const { transactionId } = await c.req.json()

      if (!transactionId) {
        return c.quickError(400, '缺少交易ID')
      }

      const transaction = await this.transactionRepo.findById(transactionId)
      if (!transaction) {
        return c.quickError(404, '交易不存在')
      }

      // 检查是否是接收方
      if (transaction.toUser !== user.userId) {
        return c.quickError(403, '您不能接受这个交易')
      }

      // 检查交易状态
      if (transaction.status !== 'password') {
        return c.quickError(400, '交易状态不正确')
      }

      // 执行积分转移和状态更新
      const fromUser = await this.userRepo.findById(transaction.fromUser)
      if (!fromUser || fromUser.points < transaction.point) {
        await this.transactionRepo.updateStatus(transactionId, 'fail')
        return c.quickError(400, '发送方积分不足，交易失败')
      }

      // 更新用户积分
      await this.userRepo.updatePoints(transaction.fromUser, -transaction.point)
      await this.userRepo.updatePoints(transaction.toUser, transaction.point)

      // 更新交易状态
      await this.transactionRepo.updateStatus(transactionId, 'success')

      return c.ok({ message: '交易成功完成' })
    } catch (error) {
      const { statusCode, message } = shareMethod.analyzeError(error)
      return c.quickError(statusCode, message)
    }
  }

  /**
   * 拒绝交易
   * POST /transaction/refuse
   */
  async refuseTransaction(c: Context) {
    try {
      const user = c.user!
      const { transactionId } = await c.req.json()

      if (!transactionId) {
        return c.quickError(400, '缺少交易ID')
      }

      const transaction = await this.transactionRepo.findById(transactionId)
      if (!transaction) {
        return c.quickError(404, '交易不存在')
      }

      // 检查是否是接收方
      if (transaction.toUser !== user.userId) {
        return c.quickError(403, '您不能拒绝这个交易')
      }

      // 检查交易状态
      if (!['pending', 'password'].includes(transaction.status)) {
        return c.quickError(400, '交易状态不正确')
      }

      // 更新交易状态
      await this.transactionRepo.updateStatus(transactionId, 'refuse')

      return c.ok({ message: '交易已拒绝' })
    } catch (error) {
      const { statusCode, message } = shareMethod.analyzeError(error)
      return c.quickError(statusCode, message)
    }
  }

  /**
   * 获取用户交易记录
   * GET /transaction/index?page=1&count=10
   */
  async getTransactionHistory(c: Context) {
    try {
      const user = c.user!
      const query = c.req.query()
      const { page, count } = transactionListSchema.parse(query)
      
      const offset = (page - 1) * count
      
      const transactions = await this.transactionRepo.findByUser(user.userId, count, offset)
      
      return c.ok(transactions)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return c.quickError(400, error.errors[0].message)
      }
      
      const { statusCode, message } = shareMethod.analyzeError(error)
      return c.quickError(statusCode, message)
    }
  }
}