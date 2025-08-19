import type { PaySerial, CreatePaySerialInput, PaySerialWithUser } from '@/models/PaySerial'

export interface IPaySerialRepository {
  // 基本CRUD
  findById(id: number): Promise<PaySerial | null>
  findBySn(sn: string): Promise<PaySerial | null>
  create(paySerial: CreatePaySerialInput): Promise<PaySerial>
  updateStatus(id: number, status: PaySerial['status']): Promise<boolean>
  delete(id: number): Promise<boolean>

  // 验证和使用
  validateAndUse(sn: string, password: string): Promise<PaySerial | null>
  checkExpired(id: number): Promise<boolean>
  markAsUsed(id: number): Promise<boolean>

  // 查询方法
  findByUser(userId: number, limit: number, offset: number): Promise<PaySerialWithUser[]>
  findWithUser(id: number): Promise<PaySerialWithUser | null>
  findExpiredSerial(): Promise<PaySerial[]>

  // 统计方法
  getPaySerialCount(): Promise<number>
  getPaySerialCountByUser(userId: number): Promise<number>
  getTotalPointsByUser(userId: number): Promise<number>
}