import type { Transaction, CreateTransactionInput, TransactionWithUsers } from '@/models/Transaction'

export interface ITransactionRepository {
  // 基础CRUD操作
  findById(id: number): Promise<Transaction | null>
  findBySn(sn: string): Promise<Transaction | null>
  create(transaction: CreateTransactionInput & { fromUser: number }): Promise<Transaction>
  updateStatus(id: number, status: Transaction['status']): Promise<boolean>
  
  // 用户交易查询
  findByFromUser(userId: number, limit: number, offset: number): Promise<TransactionWithUsers[]>
  findByToUser(userId: number, limit: number, offset: number): Promise<TransactionWithUsers[]>
  findByUser(userId: number, limit: number, offset: number): Promise<TransactionWithUsers[]>
  
  // 状态查询
  findByStatus(status: Transaction['status'], limit: number, offset: number): Promise<TransactionWithUsers[]>
  findPendingByUser(userId: number): Promise<Transaction[]>
  
  // 关联查询
  findWithUsers(id: number): Promise<TransactionWithUsers | null>
  
  // 统计功能
  getTransactionCount(): Promise<number>
  getTransactionCountByUser(userId: number): Promise<number>
  getTotalAmountByUser(userId: number): Promise<{ sent: number, received: number }>
  
  // 管理员功能
  findAll(limit: number, offset: number, filters?: {
    fromUser?: number
    toUser?: number
    status?: Transaction['status']
    startTime?: number
    endTime?: number
  }): Promise<TransactionWithUsers[]>
}