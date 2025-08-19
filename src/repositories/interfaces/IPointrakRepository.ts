import type { Pointrak, CreatePointrakInput, PointrakWithOwner } from '@/models/Pointrak'

export interface IPointrakRepository {
  // 基础CRUD操作
  findById(id: number): Promise<Pointrak | null>
  create(pointrak: CreatePointrakInput): Promise<Pointrak>
  
  // 列表查询
  findByOwner(ownerId: number, limit: number, offset: number): Promise<Pointrak[]>
  findAll(limit: number, offset: number, filters?: {
    owner?: number
    channel?: string
    startTime?: number
    endTime?: number
  }): Promise<PointrakWithOwner[]>
  
  // 管理员查询
  findByOwnerForAdmin(ownerId: number, limit: number, offset: number): Promise<PointrakWithOwner[]>
  
  // 统计功能
  getPointrakCount(): Promise<number>
  getPointrakCountByOwner(ownerId: number): Promise<number>
  getTotalPointsByOwner(ownerId: number): Promise<number>
  getTotalPointsByChannel(channel: string): Promise<number>
  
  // 按时间统计
  getPointsByDateRange(ownerId: number, startTime: number, endTime: number): Promise<number>
  getDailyStats(startTime: number, endTime: number): Promise<Array<{
    date: string
    totalPoints: number
    userCount: number
  }>>
}