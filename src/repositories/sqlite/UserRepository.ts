import { BaseRepository } from '@/repositories/BaseRepository'
import type { IUserRepository } from '@/repositories/interfaces/IUserRepository'
import type { User, CreateUserInput, UpdateUserInput, UserWithPointracks } from '@/models/User'
import { shareMethod } from '@/services/shareMethod'
import crypto from 'crypto'

export class SqliteUserRepository extends BaseRepository implements IUserRepository {
  
  async findById(id: number): Promise<User | null> {
    return this.findOne<User>('users', { userId: id })
  }

  async findByPhone(phone: string): Promise<User | null> {
    return this.findOne<User>('users', { phone })
  }

  async findByEmail(email: string): Promise<User | null> {
    if (!email) return null
    return this.findOne<User>('users', { email })
  }

  async findByDigit(digit: string): Promise<User | null> {
    return this.findOne<User>('users', { digit })
  }

  async create(userInput: CreateUserInput): Promise<User> {
    // 生成唯一的digit ID
    const digit = this.generateUniqueDigit()
    
    // 加密密码
    const hashedPassword = shareMethod.getHmacHashString(userInput.password)

    const userData = {
      name: userInput.name || '',
      email: userInput.email || null,
      phone: userInput.phone,
      digit,
      password: hashedPassword,
      points: 0,
      goldpoints: 0,
      totalearned: 0,
      level: 0
    }

    const userId = this.insert('users', userData)
    
    const user = await this.findById(userId)
    if (!user) {
      throw new Error('Failed to create user')
    }

    return user
  }

  async update(id: number, data: UpdateUserInput): Promise<boolean> {
    return this.updateRecord('users', id, data, 'userId')
  }

  async delete(id: number): Promise<boolean> {
    return this.deleteRecord('users', id, 'userId')
  }

  private updateRecord(table: string, id: number | string, data: Record<string, any>, idColumn: string = 'id'): boolean {
    return super.updateTable(table, id, data, idColumn)
  }

  private deleteRecord(table: string, id: number | string, idColumn: string = 'id'): boolean {
    return super.deleteTable(table, id, idColumn)
  }

  async validateLogin(phone: string, password: string): Promise<User | null> {
    const hashedPassword = shareMethod.getHmacHashString(password)
    return this.findOne<User>('users', { phone, password: hashedPassword })
  }

  async updatePassword(id: number, newPassword: string): Promise<boolean> {
    const hashedPassword = shareMethod.getHmacHashString(newPassword)
    return this.updateRecord('users', id, { password: hashedPassword }, 'userId')
  }

  async updatePayPassword(id: number, newPayPassword: string): Promise<boolean> {
    const hashedPayPassword = shareMethod.getHmacHashString(newPayPassword)
    return this.updateRecord('users', id, { paypassword: hashedPayPassword }, 'userId')
  }

  async updatePoints(id: number, points: number): Promise<boolean> {
    const stmt = this.db.prepare(`
      UPDATE users 
      SET points = points + ?, updatedAt = ?
      WHERE userId = ?
    `)
    
    const result = stmt.run(points, this.now(), id)
    return result.changes > 0
  }

  async updateGoldPoints(id: number, goldPoints: number): Promise<boolean> {
    const stmt = this.db.prepare(`
      UPDATE users 
      SET goldpoints = goldpoints + ?, updatedAt = ?
      WHERE userId = ?
    `)
    
    const result = stmt.run(goldPoints, this.now(), id)
    return result.changes > 0
  }

  async updateOnlineStatus(id: number, online: boolean): Promise<boolean> {
    return this.updateRecord('users', id, { online: online ? 1 : 0 }, 'userId')
  }

  async updateStatus(id: number, status: 'allow' | 'deny'): Promise<boolean> {
    return this.updateRecord('users', id, { status }, 'userId')
  }

  async findWithPointracks(id: number, limit: number = 20, offset: number = 0): Promise<UserWithPointracks | null> {
    const user = await this.findById(id)
    if (!user) return null

    const stmt = this.db.prepare(`
      SELECT id, points, detail, channel, createdAt
      FROM pointracks 
      WHERE owner = ?
      ORDER BY createdAt DESC
      LIMIT ? OFFSET ?
    `)
    
    const pointracks = stmt.all(id, limit, offset) as Array<{
      id: number
      points: number
      detail: string
      channel: string
      createdAt: number
    }>

    return {
      ...user,
      pointracks
    }
  }

  async findRichestUsers(limit: number): Promise<User[]> {
    return this.findMany<User>('users', {}, 'points', 'DESC', limit)
  }

  async findDangerousUsers(minReported: number): Promise<User[]> {
    const stmt = this.db.prepare(`
      SELECT * FROM users 
      WHERE reported >= ? 
      ORDER BY reported DESC
    `)
    
    return stmt.all(minReported) as User[]
  }

  async getUserCount(): Promise<number> {
    return this.count('users')
  }

  async getActiveUserCount(): Promise<number> {
    return this.count('users', { status: 'allow' })
  }

  // 私有方法：生成唯一的digit ID
  private generateUniqueDigit(): string {
    let digit: string
    let attempts = 0
    const maxAttempts = 100

    do {
      // 生成8位数字ID
      digit = Math.floor(10000000 + Math.random() * 90000000).toString()
      attempts++
      
      if (attempts >= maxAttempts) {
        throw new Error('Unable to generate unique digit ID')
      }
    } while (this.exists('users', { digit }))

    return digit
  }
}