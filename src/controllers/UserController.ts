import type { Context } from 'hono'
import { getUserRepository, getStoryRepository } from '@/repositories/factory'
import { shareMethod } from '@/services/shareMethod'
import { z } from 'zod'

// 输入验证schemas
const createUserSchema = z.object({
  phone: z.string().regex(/^1[3-9]\d{9}$/, '手机号格式不正确'),
  password: z.string().min(6, '密码至少6位')
})

const loginSchema = z.object({
  phone: z.string().regex(/^1[3-9]\d{9}$/, '手机号格式不正确'),
  password: z.string().min(1, '密码不能为空')
})

const updateUserSchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional(),
  avatar: z.string().url().optional(),
  gender: z.enum(['男', '女', '保密']).optional(),
  age: z.number().min(1).max(120).optional(),
  memo: z.string().max(1000).optional()
})

const signInOrUpSchema = z.object({
  phone: z.string().regex(/^1[3-9]\d{9}$/, '手机号格式不正确'),
  password: z.string().min(6, '密码至少6位').optional(),
  name: z.string().optional()
})

const reportSchema = z.object({
  reason: z.string().min(1, '举报原因不能为空').max(500, '举报原因过长'),
  target_type: z.enum(['user', 'story', 'comment']),
  target_id: z.number().int().positive('目标ID必须是正整数')
})

const storiesListSchema = z.object({
  page: z.string().transform(val => parseInt(val) || 1),
  count: z.string().transform(val => Math.min(parseInt(val) || 10, 50))
})

export class UserController {
  private get userRepo() {
    return getUserRepository()
  }

  private get storyRepo() {
    return getStoryRepository()
  }

  /**
   * 用户注册
   */
  async createUser(c: Context) {
    try {
      const body = await c.req.json()
      const validatedData = createUserSchema.parse(body)

      // 检查手机号是否已存在
      const existingUser = await this.userRepo.findByPhone(validatedData.phone)
      if (existingUser) {
        return c.quickError(400, '一个电话号码只能注册一个账号，请勿重复注册。')
      }

      const user = await this.userRepo.create(validatedData)
      
      // 移除敏感信息
      const { password, paypassword, ...safeUser } = user
      
      return c.ok(safeUser)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return c.quickError(400, error.errors[0].message)
      }
      
      const { statusCode, message } = shareMethod.analyzeError(error)
      return c.quickError(statusCode, message)
    }
  }

  /**
   * 用户登录
   */
  async login(c: Context) {
    try {
      const { phone, password } = c.req.query()
      
      if (!phone || !password) {
        return c.quickError(400, '手机号和密码不能为空')
      }

      const validatedData = loginSchema.parse({ phone, password })
      
      const user = await this.userRepo.validateLogin(validatedData.phone, validatedData.password)
      if (!user) {
        return c.quickError(404, '登录失败, 请尝试使用手机验证码快速登录')
      }

      // 更新在线状态
      await this.userRepo.updateOnlineStatus(user.userId, true)

      // 生成token
      const token = shareMethod.getUserToken(user.userId)

      // 返回用户信息（移除敏感信息）
      const { password: _, paypassword, ...safeUser } = user
      
      return c.ok({
        ...safeUser,
        utoken: token,
        online: true
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
   * 用户登出
   */
  async logout(c: Context) {
    try {
      const user = c.user!
      await this.userRepo.updateOnlineStatus(user.userId, false)
      return c.ok()
    } catch (error) {
      return c.quickError(500, '发生错误, 登出失败')
    }
  }

  /**
   * 重置密码
   */
  async resetPassword(c: Context) {
    try {
      const { oldpwd, newpwd } = c.req.query()
      
      if (!oldpwd || !newpwd) {
        return c.quickError(400, '缺少必要参数, 请完善后重试')
      }

      const user = c.user!
      
      // 验证旧密码
      const validUser = await this.userRepo.validateLogin(user.phone, oldpwd)
      if (!validUser) {
        return c.quickError(403, '原密码错误')
      }

      // 更新密码
      const success = await this.userRepo.updatePassword(user.userId, newpwd)
      
      if (!success) {
        return c.quickError(500, '密码更新失败')
      }

      return c.ok({ message: '密码更新成功' })
    } catch (error) {
      const { statusCode, message } = shareMethod.analyzeError(error)
      return c.quickError(statusCode, message)
    }
  }

  /**
   * 重置支付密码
   */
  async resetPayPassword(c: Context) {
    try {
      const { newpaypass } = c.req.query()
      
      if (!newpaypass) {
        return c.quickError(400, '新支付密码不能为空')
      }

      const user = c.user!
      const success = await this.userRepo.updatePayPassword(user.userId, newpaypass)
      
      if (!success) {
        return c.quickError(500, '支付密码更新失败')
      }

      return c.ok({ message: '支付密码更新成功' })
    } catch (error) {
      const { statusCode, message } = shareMethod.analyzeError(error)
      return c.quickError(statusCode, message)
    }
  }

  /**
   * 获取用户信息
   */
  async getInformation(c: Context) {
    try {
      const user = c.user!
      
      // 获取最新用户信息
      const latestUser = await this.userRepo.findById(user.userId)
      if (!latestUser) {
        return c.quickError(404, '用户不存在')
      }

      // 移除敏感信息
      const { password, paypassword, ...safeUser } = latestUser
      
      return c.ok(safeUser)
    } catch (error) {
      const { statusCode, message } = shareMethod.analyzeError(error)
      return c.quickError(statusCode, message)
    }
  }

  /**
   * 修改用户信息
   */
  async changeNormalInformation(c: Context) {
    try {
      const body = await c.req.json()
      const validatedData = updateUserSchema.parse(body)
      
      const user = c.user!
      const success = await this.userRepo.update(user.userId, validatedData)
      
      if (!success) {
        return c.quickError(500, '信息更新失败')
      }

      return c.ok({ message: '信息更新成功' })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return c.quickError(400, error.errors[0].message)
      }
      
      const { statusCode, message } = shareMethod.analyzeError(error)
      return c.quickError(statusCode, message)
    }
  }

  /**
   * 积分操作（预留接口）
   */
  async pointPlus(c: Context) {
    // TODO: 实现积分增减逻辑
    return c.quickError(501, '积分操作功能尚未实现')
  }

  /**
   * 获取积分操作XToken（预留接口）
   */
  async getPointPlusXToken(c: Context) {
    // TODO: 实现XToken生成逻辑
    return c.quickError(501, 'XToken功能尚未实现')
  }

  /**
   * 获取七牛上传token
   */
  async getQiniuUploadToken(c: Context) {
    // TODO: 实现七牛上传token生成
    return c.quickError(501, '七牛上传token功能尚未实现')
  }

  /**
   * ID加密
   */
  async getCrypt(c: Context) {
    try {
      const { id } = c.req.query()
      
      if (!id) {
        return c.quickError(400, '缺少ID参数')
      }

      const encrypted = shareMethod.getAESCrypt(id)
      return c.ok({ encrypted })
    } catch (error) {
      return c.quickError(500, '加密失败')
    }
  }

  /**
   * ID解密
   */
  async getDecrypt(c: Context) {
    try {
      const { encrypted } = c.req.query()
      
      if (!encrypted) {
        return c.quickError(400, '缺少加密字符串参数')
      }

      const decrypted = shareMethod.getAESDecrypt(encrypted)
      return c.ok({ decrypted })
    } catch (error) {
      return c.quickError(500, '解密失败，请检查加密字符串是否正确')
    }
  }

  /**
   * 快速登录或注册
   * POST /user/sign
   */
  async signInOrUp(c: Context) {
    try {
      const body = await c.req.json()
      const validatedData = signInOrUpSchema.parse(body)

      // 检查用户是否存在
      let user = await this.userRepo.findByPhone(validatedData.phone)
      
      if (user) {
        // 用户存在，执行登录逻辑
        if (validatedData.password) {
          const validatedUser = await this.userRepo.validateLogin(validatedData.phone, validatedData.password)
          if (!validatedUser) {
            return c.quickError(401, '密码错误')
          }
          user = validatedUser
        }
        
        // 更新在线状态
        await this.userRepo.updateOnlineStatus(user.userId, true)
      } else {
        // 用户不存在，执行注册逻辑
        if (!validatedData.password) {
          return c.quickError(400, '新用户必须提供密码')
        }
        
        user = await this.userRepo.create({
          phone: validatedData.phone,
          password: validatedData.password,
          name: validatedData.name
        })
      }

      // 生成token
      const token = shareMethod.getUserToken(user.userId)

      // 返回用户信息（移除敏感信息）
      const { password, paypassword, ...safeUser } = user
      
      return c.ok({
        ...safeUser,
        utoken: token,
        online: true
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
   * 举报功能
   * POST /user/report
   */
  async reportIllegal(c: Context) {
    try {
      const user = c.user!
      const body = await c.req.json()
      const validatedData = reportSchema.parse(body)

      // TODO: 实现举报功能，记录到数据库
      // 这里可以创建一个 reports 表来记录举报信息
      
      return c.ok({ message: '举报成功，我们会尽快处理' })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return c.quickError(400, error.errors[0].message)
      }
      
      const { statusCode, message } = shareMethod.analyzeError(error)
      return c.quickError(statusCode, message)
    }
  }

  /**
   * 获取用户发布的故事
   * GET /user/stories?page=1&count=10
   */
  async getOwnedStories(c: Context) {
    try {
      const user = c.user!
      const query = c.req.query()
      const { page, count } = storiesListSchema.parse(query)
      
      const offset = (page - 1) * count
      
      const stories = await this.storyRepo.findByOwner(user.userId, count, offset)
      
      return c.ok(stories)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return c.quickError(400, error.errors[0].message)
      }
      
      const { statusCode, message } = shareMethod.analyzeError(error)
      return c.quickError(statusCode, message)
    }
  }

  /**
   * 绑定推荐人
   * POST /user/bindup
   */
  async bindUplinePromotion(c: Context) {
    try {
      const user = c.user!
      const { uplineUserId } = await c.req.json()
      
      if (!uplineUserId) {
        return c.quickError(400, '缺少推荐人ID')
      }

      // 检查推荐人是否存在
      const uplineUser = await this.userRepo.findById(uplineUserId)
      if (!uplineUser) {
        return c.quickError(404, '推荐人不存在')
      }

      // 检查是否已经绑定过推荐人
      if (user.upline) {
        return c.quickError(400, '您已经绑定过推荐人')
      }

      // 不能绑定自己为推荐人
      if (uplineUserId === user.userId) {
        return c.quickError(400, '不能绑定自己为推荐人')
      }

      // 更新用户的推荐人
      const success = await this.userRepo.update(user.userId, { upline: uplineUserId })
      
      if (!success) {
        return c.quickError(500, '绑定推荐人失败')
      }

      return c.ok({ message: '绑定推荐人成功' })
    } catch (error) {
      const { statusCode, message } = shareMethod.analyzeError(error)
      return c.quickError(statusCode, message)
    }
  }
}