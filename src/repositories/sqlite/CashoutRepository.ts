import { BaseRepository } from '@/repositories/BaseRepository'
import type { ICashoutRepository } from '@/repositories/interfaces/ICashoutRepository'
import type { Cashout, CreateCashoutInput, UpdateCashoutInput, CashoutWithUser } from '@/models/Cashout'

export class SqliteCashoutRepository extends BaseRepository implements ICashoutRepository {
  
  async findById(id: number): Promise<Cashout | null> {
    return this.findOne<Cashout>('cashouts', { id })
  }

  async create(data: CreateCashoutInput): Promise<Cashout> {
    const cashoutData = {
      user: data.user,
      points: data.points,
      amount: data.amount,
      rate: data.rate,
      status: 'pending' as const,
      method: data.method,
      account: data.account,
      note: data.note || null
    }

    const cashoutId = this.insert('cashouts', cashoutData)
    
    const createdCashout = await this.findById(cashoutId)
    if (!createdCashout) {
      throw new Error('Failed to create cashout')
    }

    return createdCashout
  }

  async update(id: number, data: UpdateCashoutInput): Promise<boolean> {
    return this.updateTable('cashouts', id, { ...data, updatedAt: this.now() })
  }

  async delete(id: number): Promise<boolean> {
    return this.deleteTable('cashouts', id)
  }

  async findByUser(userId: number, limit: number, offset: number): Promise<CashoutWithUser[]> {
    return this.findCashoutsWithUsers('c.user = ?', [userId], limit, offset)
  }

  async findWithUser(id: number): Promise<CashoutWithUser | null> {
    const results = await this.findCashoutsWithUsers('c.id = ?', [id], 1, 0)
    return results[0] || null
  }

  async findByStatus(status: Cashout['status'], limit: number, offset: number): Promise<CashoutWithUser[]> {
    return this.findCashoutsWithUsers('c.status = ?', [status], limit, offset)
  }

  async findAll(
    limit: number, 
    offset: number, 
    filters?: {
      user?: number
      status?: Cashout['status']
      method?: Cashout['method']
      startTime?: number
      endTime?: number
    }
  ): Promise<CashoutWithUser[]> {
    let whereClause = '1=1'
    const params: any[] = []
    
    if (filters?.user) {
      whereClause += ' AND c.user = ?'
      params.push(filters.user)
    }
    
    if (filters?.status) {
      whereClause += ' AND c.status = ?'
      params.push(filters.status)
    }
    
    if (filters?.method) {
      whereClause += ' AND c.method = ?'
      params.push(filters.method)
    }
    
    if (filters?.startTime) {
      whereClause += ' AND c.createdAt >= ?'
      params.push(filters.startTime)
    }
    
    if (filters?.endTime) {
      whereClause += ' AND c.createdAt <= ?'
      params.push(filters.endTime)
    }
    
    return this.findCashoutsWithUsers(whereClause, params, limit, offset)
  }

  async updateStatus(id: number, status: Cashout['status'], adminNote?: string): Promise<boolean> {
    const updateData: any = { 
      status, 
      updatedAt: this.now() 
    }
    
    if (adminNote) {
      updateData.admin_note = adminNote
    }
    
    if (status === 'processing' || status === 'completed') {
      updateData.processed_at = this.now()
    }
    
    return this.updateTable('cashouts', id, updateData)
  }

  async markAsProcessed(id: number): Promise<boolean> {
    return this.updateTable('cashouts', id, { 
      processed_at: this.now(),
      updatedAt: this.now()
    })
  }

  async getCashoutCount(): Promise<number> {
    return this.count('cashouts')
  }

  async getCashoutCountByUser(userId: number): Promise<number> {
    return this.count('cashouts', { user: userId })
  }

  async getTotalAmountByUser(userId: number): Promise<number> {
    const sql = 'SELECT COALESCE(SUM(amount), 0) as total FROM cashouts WHERE user = ? AND status = \'completed\''
    const stmt = this.db.prepare(sql)
    const result = stmt.get(userId) as { total: number }
    return result.total
  }

  async getTotalAmountByStatus(status: Cashout['status']): Promise<number> {
    const sql = 'SELECT COALESCE(SUM(amount), 0) as total FROM cashouts WHERE status = ?'
    const stmt = this.db.prepare(sql)
    const result = stmt.get(status) as { total: number }
    return result.total
  }

  async getAmountByDateRange(userId: number, startTime: number, endTime: number): Promise<number> {
    const sql = `
      SELECT COALESCE(SUM(amount), 0) as total 
      FROM cashouts 
      WHERE user = ? AND createdAt >= ? AND createdAt <= ? AND status = 'completed'
    `
    const stmt = this.db.prepare(sql)
    const result = stmt.get(userId, startTime, endTime) as { total: number }
    return result.total
  }

  async getDailyStats(startTime: number, endTime: number): Promise<Array<{
    date: string
    totalAmount: number
    totalPoints: number
    count: number
  }>> {
    const sql = `
      SELECT 
        date(createdAt/1000, 'unixepoch') as date,
        SUM(amount) as totalAmount,
        SUM(points) as totalPoints,
        COUNT(*) as count
      FROM cashouts 
      WHERE createdAt >= ? AND createdAt <= ? AND status = 'completed'
      GROUP BY date(createdAt/1000, 'unixepoch')
      ORDER BY date
    `
    const stmt = this.db.prepare(sql)
    const rows = stmt.all(startTime, endTime) as any[]
    
    return rows.map(row => ({
      date: row.date,
      totalAmount: row.totalAmount || 0,
      totalPoints: row.totalPoints || 0,
      count: row.count || 0
    }))
  }

  // 私有辅助方法：查询包含用户信息的提现记录
  private async findCashoutsWithUsers(
    whereClause: string, 
    params: any[], 
    limit: number, 
    offset: number
  ): Promise<CashoutWithUser[]> {
    const sql = `
      SELECT c.*,
             u.userId, u.name as userName, u.avatar as userAvatar, u.digit as userDigit
      FROM cashouts c
      LEFT JOIN users u ON c.user = u.userId
      WHERE ${whereClause}
      ORDER BY c.createdAt DESC
      LIMIT ? OFFSET ?
    `
    
    const stmt = this.db.prepare(sql)
    const rows = stmt.all(...params, limit, offset) as any[]
    
    return rows.map(row => ({
      id: row.id,
      user: row.user,
      points: row.points,
      amount: row.amount,
      rate: row.rate,
      status: row.status,
      method: row.method,
      account: row.account,
      note: row.note,
      admin_note: row.admin_note,
      processed_at: row.processed_at,
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
}