import type { Cashout, CreateCashoutInput, UpdateCashoutInput, CashoutWithUser } from '@/models/Cashout'

export interface ICashoutRepository {
  // 基本CRUD
  findById(id: number): Promise<Cashout | null>
  create(cashout: CreateCashoutInput): Promise<Cashout>
  update(id: number, data: UpdateCashoutInput): Promise<boolean>
  delete(id: number): Promise<boolean>

  // 查询方法
  findByUser(userId: number, limit: number, offset: number): Promise<CashoutWithUser[]>
  findWithUser(id: number): Promise<CashoutWithUser | null>
  findByStatus(status: Cashout['status'], limit: number, offset: number): Promise<CashoutWithUser[]>
  
  // 管理员查询
  findAll(limit: number, offset: number, filters?: {
    user?: number
    status?: Cashout['status']
    method?: Cashout['method']
    startTime?: number
    endTime?: number
  }): Promise<CashoutWithUser[]>

  // 状态更新
  updateStatus(id: number, status: Cashout['status'], adminNote?: string): Promise<boolean>
  markAsProcessed(id: number): Promise<boolean>

  // 统计方法
  getCashoutCount(): Promise<number>
  getCashoutCountByUser(userId: number): Promise<number>
  getTotalAmountByUser(userId: number): Promise<number>
  getTotalAmountByStatus(status: Cashout['status']): Promise<number>
  
  // 按时间统计
  getAmountByDateRange(userId: number, startTime: number, endTime: number): Promise<number>
  getDailyStats(startTime: number, endTime: number): Promise<Array<{
    date: string
    totalAmount: number
    totalPoints: number
    count: number
  }>>
}