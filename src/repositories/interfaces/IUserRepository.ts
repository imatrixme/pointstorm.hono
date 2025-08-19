import type { User, CreateUserInput, UpdateUserInput, UserWithPointracks } from '@/models/User'

export interface IUserRepository {
  // 基础CRUD操作
  findById(id: number): Promise<User | null>
  findByPhone(phone: string): Promise<User | null>
  findByEmail(email: string): Promise<User | null>
  findByDigit(digit: string): Promise<User | null>
  create(user: CreateUserInput): Promise<User>
  update(id: number, data: UpdateUserInput): Promise<boolean>
  delete(id: number): Promise<boolean>
  
  // 认证相关
  validateLogin(phone: string, password: string): Promise<User | null>
  updatePassword(id: number, newPassword: string): Promise<boolean>
  updatePayPassword(id: number, newPayPassword: string): Promise<boolean>
  
  // 积分操作
  updatePoints(id: number, points: number): Promise<boolean>
  updateGoldPoints(id: number, goldPoints: number): Promise<boolean>
  
  // 状态操作
  updateOnlineStatus(id: number, online: boolean): Promise<boolean>
  updateStatus(id: number, status: 'allow' | 'deny'): Promise<boolean>
  
  // 关联查询
  findWithPointracks(id: number, limit?: number, offset?: number): Promise<UserWithPointracks | null>
  
  // 管理员功能
  findRichestUsers(limit: number): Promise<User[]>
  findDangerousUsers(minReported: number): Promise<User[]>
  
  // 统计功能
  getUserCount(): Promise<number>
  getActiveUserCount(): Promise<number>
}