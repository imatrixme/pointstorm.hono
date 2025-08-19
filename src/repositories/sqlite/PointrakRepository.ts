import { BaseRepository } from '@/repositories/BaseRepository'
import type { IPointrakRepository } from '@/repositories/interfaces/IPointrakRepository'
import type { Pointrak, CreatePointrakInput, PointrakWithOwner } from '@/models/Pointrak'
import { nanoid } from 'nanoid'

export class SqlitePointrakRepository extends BaseRepository implements IPointrakRepository {
  
  async findById(id: number): Promise<Pointrak | null> {
    return this.findOne<Pointrak>('pointraks', { id })
  }

  async create(data: CreatePointrakInput): Promise<Pointrak> {
    const pointrakData = {
      sn: nanoid(20), // 生成20位流水号
      points: data.points,
      owner: data.owner,
      detail: data.detail || '',
      channel: data.channel
    }

    const pointrakId = this.insert('pointraks', pointrakData)
    
    const createdPointrak = await this.findById(pointrakId)
    if (!createdPointrak) {
      throw new Error('Failed to create pointrak')
    }

    return createdPointrak
  }

  async findByOwner(ownerId: number, limit: number, offset: number): Promise<Pointrak[]> {
    return this.findMany<Pointrak>('pointraks', { owner: ownerId }, 'createdAt', 'DESC', limit, offset)
  }

  async findAll(
    limit: number, 
    offset: number, 
    filters?: {
      owner?: number
      channel?: string
      startTime?: number
      endTime?: number
    }
  ): Promise<PointrakWithOwner[]> {
    let sql = `
      SELECT p.*, 
             u.userId, u.name as ownerName, u.avatar as ownerAvatar, u.digit as ownerDigit
      FROM pointraks p
      INNER JOIN users u ON p.owner = u.userId
      WHERE 1=1
    `
    
    const params: any[] = []
    
    if (filters?.owner) {
      sql += ' AND p.owner = ?'
      params.push(filters.owner)
    }
    
    if (filters?.channel) {
      sql += ' AND p.channel = ?'
      params.push(filters.channel)
    }
    
    if (filters?.startTime) {
      sql += ' AND p.createdAt >= ?'
      params.push(filters.startTime)
    }
    
    if (filters?.endTime) {
      sql += ' AND p.createdAt <= ?'
      params.push(filters.endTime)
    }
    
    sql += ' ORDER BY p.createdAt DESC LIMIT ? OFFSET ?'
    params.push(limit, offset)
    
    const stmt = this.db.prepare(sql)
    const rows = stmt.all(...params) as any[]
    
    return rows.map(row => ({
      id: row.id,
      sn: row.sn,
      points: row.points,
      owner: row.owner,
      detail: row.detail,
      channel: row.channel,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      ownerInfo: {
        userId: row.userId,
        name: row.ownerName,
        digit: row.ownerDigit,
        avatar: row.ownerAvatar
      }
    }))
  }

  async findByOwnerForAdmin(ownerId: number, limit: number, offset: number): Promise<PointrakWithOwner[]> {
    return this.findAll(limit, offset, { owner: ownerId })
  }

  async getPointrakCount(): Promise<number> {
    return this.count('pointraks')
  }

  async getPointrakCountByOwner(ownerId: number): Promise<number> {
    return this.count('pointraks', { owner: ownerId })
  }

  async getTotalPointsByOwner(ownerId: number): Promise<number> {
    const sql = 'SELECT COALESCE(SUM(points), 0) as total FROM pointraks WHERE owner = ?'
    const stmt = this.db.prepare(sql)
    const result = stmt.get(ownerId) as { total: number }
    return result.total
  }

  async getTotalPointsByChannel(channel: string): Promise<number> {
    const sql = 'SELECT COALESCE(SUM(points), 0) as total FROM pointraks WHERE channel = ?'
    const stmt = this.db.prepare(sql)
    const result = stmt.get(channel) as { total: number }
    return result.total
  }

  async getPointsByDateRange(ownerId: number, startTime: number, endTime: number): Promise<number> {
    const sql = `
      SELECT COALESCE(SUM(points), 0) as total 
      FROM pointraks 
      WHERE owner = ? AND createdAt >= ? AND createdAt <= ?
    `
    const stmt = this.db.prepare(sql)
    const result = stmt.get(ownerId, startTime, endTime) as { total: number }
    return result.total
  }

  async getDailyStats(startTime: number, endTime: number): Promise<Array<{
    date: string
    totalPoints: number
    userCount: number
  }>> {
    const sql = `
      SELECT 
        date(createdAt/1000, 'unixepoch') as date,
        SUM(points) as totalPoints,
        COUNT(DISTINCT owner) as userCount
      FROM pointraks 
      WHERE createdAt >= ? AND createdAt <= ?
      GROUP BY date(createdAt/1000, 'unixepoch')
      ORDER BY date
    `
    const stmt = this.db.prepare(sql)
    const rows = stmt.all(startTime, endTime) as any[]
    
    return rows.map(row => ({
      date: row.date,
      totalPoints: row.totalPoints || 0,
      userCount: row.userCount || 0
    }))
  }
}