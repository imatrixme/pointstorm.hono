import { BaseRepository } from '@/repositories/BaseRepository'
import type { IPaySerialRepository } from '@/repositories/interfaces/IPaySerialRepository'
import type { PaySerial, CreatePaySerialInput, PaySerialWithUser } from '@/models/PaySerial'
import { nanoid } from 'nanoid'

export class SqlitePaySerialRepository extends BaseRepository implements IPaySerialRepository {
  
  async findById(id: number): Promise<PaySerial | null> {
    return this.findOne<PaySerial>('pay_serials', { id })
  }

  async findBySn(sn: string): Promise<PaySerial | null> {
    return this.findOne<PaySerial>('pay_serials', { sn })
  }

  async create(data: CreatePaySerialInput): Promise<PaySerial> {
    const paySerialData = {
      sn: nanoid(16), // 生成16位随机序列号
      password: data.password,
      point: data.point,
      expired: data.expired,
      user: data.user,
      status: 'active' as const
    }

    const paySerialId = this.insert('pay_serials', paySerialData)
    
    const createdPaySerial = await this.findById(paySerialId)
    if (!createdPaySerial) {
      throw new Error('Failed to create pay serial')
    }

    return createdPaySerial
  }

  async updateStatus(id: number, status: PaySerial['status']): Promise<boolean> {
    return this.updateTable('pay_serials', id, { status, updatedAt: this.now() })
  }

  async delete(id: number): Promise<boolean> {
    return this.deleteTable('pay_serials', id)
  }

  async validateAndUse(sn: string, password: string): Promise<PaySerial | null> {
    return this.executeTransaction(() => {
      // 查找序列号
      const paySerial = this.findOne<PaySerial>('pay_serials', { sn })
      if (!paySerial) return null

      // 检查状态
      if (paySerial.status !== 'active') return null

      // 检查密码
      if (paySerial.password !== password) return null

      // 检查是否过期
      const now = this.now()
      if (paySerial.expired < now) {
        // 标记为过期
        this.updateTable('pay_serials', paySerial.id, { status: 'expired', updatedAt: now })
        return null
      }

      // 标记为已使用
      this.updateTable('pay_serials', paySerial.id, { status: 'used', updatedAt: now })
      
      return { ...paySerial, status: 'used' as const, updatedAt: now }
    })
  }

  async checkExpired(id: number): Promise<boolean> {
    const paySerial = await this.findById(id)
    if (!paySerial) return false

    const now = this.now()
    if (paySerial.expired < now && paySerial.status === 'active') {
      await this.updateStatus(id, 'expired')
      return true
    }

    return false
  }

  async markAsUsed(id: number): Promise<boolean> {
    return this.updateStatus(id, 'used')
  }

  async findByUser(userId: number, limit: number, offset: number): Promise<PaySerialWithUser[]> {
    const sql = `
      SELECT ps.*, 
             u.userId, u.name as userName, u.avatar as userAvatar, u.digit as userDigit
      FROM pay_serials ps
      INNER JOIN users u ON ps.user = u.userId
      WHERE ps.user = ?
      ORDER BY ps.createdAt DESC
      LIMIT ? OFFSET ?
    `
    
    const stmt = this.db.prepare(sql)
    const rows = stmt.all(userId, limit, offset) as any[]
    
    return rows.map(row => ({
      id: row.id,
      sn: row.sn,
      password: row.password,
      point: row.point,
      expired: row.expired,
      status: row.status,
      user: row.user,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      userInfo: {
        userId: row.userId,
        name: row.userName,
        avatar: row.userAvatar,
        digit: row.userDigit
      }
    }))
  }

  async findWithUser(id: number): Promise<PaySerialWithUser | null> {
    const results = await this.findByUser(id, 1, 0)
    return results[0] || null
  }

  async findExpiredSerial(): Promise<PaySerial[]> {
    const now = this.now()
    const sql = 'SELECT * FROM pay_serials WHERE expired < ? AND status = \'active\''
    const stmt = this.db.prepare(sql)
    return stmt.all(now) as PaySerial[]
  }

  async getPaySerialCount(): Promise<number> {
    return this.count('pay_serials')
  }

  async getPaySerialCountByUser(userId: number): Promise<number> {
    return this.count('pay_serials', { user: userId })
  }

  async getTotalPointsByUser(userId: number): Promise<number> {
    const sql = 'SELECT COALESCE(SUM(point), 0) as total FROM pay_serials WHERE user = ?'
    const stmt = this.db.prepare(sql)
    const result = stmt.get(userId) as { total: number }
    return result.total
  }
}