import { BaseRepository } from '@/repositories/BaseRepository'
import type { ITransactionRepository } from '@/repositories/interfaces/ITransactionRepository'
import type { Transaction, CreateTransactionInput, TransactionWithUsers } from '@/models/Transaction'
import { nanoid } from 'nanoid'

export class SqliteTransactionRepository extends BaseRepository implements ITransactionRepository {
  
  async findById(id: number): Promise<Transaction | null> {
    return this.findOne<Transaction>('transactions', { id })
  }

  async findBySn(sn: string): Promise<Transaction | null> {
    return this.findOne<Transaction>('transactions', { sn })
  }

  async create(data: CreateTransactionInput & { fromUser: number }): Promise<Transaction> {
    const transactionData = {
      sn: nanoid(20), // 生成20位随机交易号
      fromUser: data.fromUser,
      toUser: data.toUser,
      serial: data.serial,
      point: data.point,
      status: 'pending' as const
    }

    const transactionId = this.insert('transactions', transactionData)
    
    const createdTransaction = await this.findById(transactionId)
    if (!createdTransaction) {
      throw new Error('Failed to create transaction')
    }

    return createdTransaction
  }

  async updateStatus(id: number, status: Transaction['status']): Promise<boolean> {
    return this.updateTable('transactions', id, { status, updatedAt: this.now() })
  }

  async delete(id: number): Promise<boolean> {
    return this.deleteTable('transactions', id)
  }

  async findByFromUser(userId: number, limit: number, offset: number): Promise<TransactionWithUsers[]> {
    return this.findTransactionsWithUsers('t.fromUser = ?', [userId], limit, offset)
  }

  async findByToUser(userId: number, limit: number, offset: number): Promise<TransactionWithUsers[]> {
    return this.findTransactionsWithUsers('t.toUser = ?', [userId], limit, offset)
  }

  async findByUser(userId: number, limit: number, offset: number): Promise<TransactionWithUsers[]> {
    return this.findTransactionsWithUsers('(t.fromUser = ? OR t.toUser = ?)', [userId, userId], limit, offset)
  }

  async findByStatus(status: Transaction['status'], limit: number, offset: number): Promise<TransactionWithUsers[]> {
    return this.findTransactionsWithUsers('t.status = ?', [status], limit, offset)
  }

  async findPendingByUser(userId: number): Promise<Transaction[]> {
    return this.findMany<Transaction>('transactions', { fromUser: userId, status: 'pending' })
  }

  async findWithUsers(id: number): Promise<TransactionWithUsers | null> {
    const results = await this.findTransactionsWithUsers('t.id = ?', [id], 1, 0)
    return results[0] || null
  }

  async getTransactionCount(): Promise<number> {
    return this.count('transactions')
  }

  async getTransactionCountByUser(userId: number): Promise<number> {
    const sql = 'SELECT COUNT(*) as count FROM transactions WHERE fromUser = ? OR toUser = ?'
    const stmt = this.db.prepare(sql)
    const result = stmt.get(userId, userId) as { count: number }
    return result.count
  }

  async getTotalAmountByUser(userId: number): Promise<{ sent: number, received: number }> {
    const sentSql = `
      SELECT COALESCE(SUM(point), 0) as total 
      FROM transactions 
      WHERE fromUser = ? AND status = 'success'
    `
    const receivedSql = `
      SELECT COALESCE(SUM(point), 0) as total 
      FROM transactions 
      WHERE toUser = ? AND status = 'success'
    `
    
    const sentStmt = this.db.prepare(sentSql)
    const receivedStmt = this.db.prepare(receivedSql)
    
    const sentResult = sentStmt.get(userId) as { total: number }
    const receivedResult = receivedStmt.get(userId) as { total: number }
    
    return {
      sent: sentResult.total,
      received: receivedResult.total
    }
  }

  async findAll(
    limit: number, 
    offset: number, 
    filters?: {
      fromUser?: number
      toUser?: number
      status?: Transaction['status']
      startTime?: number
      endTime?: number
    }
  ): Promise<TransactionWithUsers[]> {
    let whereClause = '1=1'
    const params: any[] = []
    
    if (filters?.fromUser) {
      whereClause += ' AND t.fromUser = ?'
      params.push(filters.fromUser)
    }
    
    if (filters?.toUser) {
      whereClause += ' AND t.toUser = ?'
      params.push(filters.toUser)
    }
    
    if (filters?.status) {
      whereClause += ' AND t.status = ?'
      params.push(filters.status)
    }
    
    if (filters?.startTime) {
      whereClause += ' AND t.createdAt >= ?'
      params.push(filters.startTime)
    }
    
    if (filters?.endTime) {
      whereClause += ' AND t.createdAt <= ?'
      params.push(filters.endTime)
    }
    
    return this.findTransactionsWithUsers(whereClause, params, limit, offset)
  }

  // 私有辅助方法：查询包含用户信息的交易记录
  private async findTransactionsWithUsers(
    whereClause: string, 
    params: any[], 
    limit: number, 
    offset: number
  ): Promise<TransactionWithUsers[]> {
    const sql = `
      SELECT t.*,
             fu.userId as fromUserId, fu.name as fromUserName, 
             fu.avatar as fromUserAvatar, fu.digit as fromUserDigit,
             tu.userId as toUserId, tu.name as toUserName,
             tu.avatar as toUserAvatar, tu.digit as toUserDigit
      FROM transactions t
      LEFT JOIN users fu ON t.fromUser = fu.userId
      LEFT JOIN users tu ON t.toUser = tu.userId
      WHERE ${whereClause}
      ORDER BY t.createdAt DESC
      LIMIT ? OFFSET ?
    `
    
    const stmt = this.db.prepare(sql)
    const rows = stmt.all(...params, limit, offset) as any[]
    
    return rows.map(row => ({
      id: row.id,
      sn: row.sn,
      fromUser: row.fromUser,
      toUser: row.toUser,
      serial: row.serial,
      point: row.point,
      status: row.status,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      fromUserInfo: {
        userId: row.fromUserId,
        name: row.fromUserName,
        digit: row.fromUserDigit,
        avatar: row.fromUserAvatar
      },
      toUserInfo: {
        userId: row.toUserId,
        name: row.toUserName,
        digit: row.toUserDigit,
        avatar: row.toUserAvatar
      }
    }))
  }
}