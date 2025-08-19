import type { IUserRepository } from '@/repositories/interfaces/IUserRepository'
import type { User, CreateUserInput, UpdateUserInput, UserWithPointracks } from '@/models/User'
import { PocketBaseClient } from './PocketBaseClient'
import { shareMethod } from '@/services/shareMethod'
import { nanoid } from 'nanoid'

export class PocketBaseUserRepository implements IUserRepository {
  private get pb() {
    return PocketBaseClient.getInstance()
  }

  private get collection() {
    return this.pb.collection('users')
  }

  async findById(userId: number): Promise<User | null> {
    try {
      const record = await this.collection.getFirstListItem(`userId = ${userId}`)
      return this.mapRecordToUser(record)
    } catch (error: any) {
      if (error.status === 404) return null
      throw error
    }
  }

  async findByPhone(phone: string): Promise<User | null> {
    try {
      const record = await this.collection.getFirstListItem(`phone = "${phone}"`)
      return this.mapRecordToUser(record)
    } catch (error: any) {
      if (error.status === 404) return null
      throw error
    }
  }

  async create(userData: CreateUserInput): Promise<User> {
    const hashedPassword = shareMethod.getHmacHashString(userData.password)
    
    // 生成唯一的userId
    const userId = Date.now() + Math.floor(Math.random() * 1000)
    
    const data = {
      userId,
      name: userData.name || `用户${userId}`,
      email: userData.email || '',
      phone: userData.phone,
      digit: nanoid(8),
      password: hashedPassword,
      passwordConfirm: hashedPassword, // PocketBase需要密码确认
      avatar: 'https://via.placeholder.com/100',
      language: 'zh',
      status: 'allow',
      online: false,
      reported: 0,
      role: 'normal',
      gender: '保密',
      age: 0,
      level: 1,
      memo: '',
      points: 1000, // 新用户初始积分
      goldpoints: 0,
      totalearned: 0
    }

    const record = await this.collection.create(data)
    return this.mapRecordToUser(record)
  }

  async update(userId: number, data: UpdateUserInput): Promise<boolean> {
    try {
      const record = await this.collection.getFirstListItem(`userId = ${userId}`)
      await this.collection.update(record.id, data)
      return true
    } catch (error) {
      console.error('Update user error:', error)
      return false
    }
  }

  async delete(userId: number): Promise<boolean> {
    try {
      const record = await this.collection.getFirstListItem(`userId = ${userId}`)
      await this.collection.delete(record.id)
      return true
    } catch (error) {
      console.error('Delete user error:', error)
      return false
    }
  }

  async validateLogin(phone: string, password: string): Promise<User | null> {
    try {
      const user = await this.findByPhone(phone)
      if (!user || !user.password) return null

      const hashedPassword = shareMethod.getHmacHashString(password)
      return hashedPassword === user.password ? user : null
    } catch (error) {
      console.error('Validate login error:', error)
      return null
    }
  }

  async updatePassword(userId: number, newPassword: string): Promise<boolean> {
    const hashedPassword = shareMethod.getHmacHashString(newPassword)
    return this.update(userId, { password: hashedPassword } as any)
  }

  async updatePayPassword(userId: number, newPayPassword: string): Promise<boolean> {
    const hashedPayPassword = shareMethod.getHmacHashString(newPayPassword)
    return this.update(userId, { paypassword: hashedPayPassword } as any)
  }

  async updatePoints(userId: number, pointsChange: number): Promise<boolean> {
    try {
      const user = await this.findById(userId)
      if (!user) return false

      const newPoints = Math.max(0, user.points + pointsChange)
      return this.update(userId, { points: newPoints } as any)
    } catch (error) {
      console.error('Update points error:', error)
      return false
    }
  }

  async updateOnlineStatus(userId: number, online: boolean): Promise<boolean> {
    return this.update(userId, { online } as any)
  }

  async getUserCount(): Promise<number> {
    try {
      const result = await this.collection.getList(1, 1)
      return result.totalItems
    } catch (error) {
      console.error('Get user count error:', error)
      return 0
    }
  }

  async findAll(limit: number, offset: number, filters?: {
    status?: 'allow' | 'deny'
    role?: 'normal' | 'advance' | 'admin'
    online?: boolean
  }): Promise<User[]> {
    try {
      const page = Math.floor(offset / limit) + 1
      
      let filter = ''
      if (filters?.status) filter += `status = "${filters.status}"`
      if (filters?.role) filter += (filter ? ' && ' : '') + `role = "${filters.role}"`
      if (filters?.online !== undefined) filter += (filter ? ' && ' : '') + `online = ${filters.online}`

      const result = await this.collection.getList(page, limit, {
        filter,
        sort: '-created'
      })

      return result.items.map(record => this.mapRecordToUser(record))
    } catch (error) {
      console.error('Find all users error:', error)
      return []
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    try {
      const record = await this.collection.getFirstListItem(`email = "${email}"`)
      return this.mapRecordToUser(record)
    } catch (error: any) {
      if (error.status === 404) return null
      throw error
    }
  }

  async findByDigit(digit: string): Promise<User | null> {
    try {
      const record = await this.collection.getFirstListItem(`digit = "${digit}"`)
      return this.mapRecordToUser(record)
    } catch (error: any) {
      if (error.status === 404) return null
      throw error
    }
  }

  async updateGoldPoints(userId: number, goldPoints: number): Promise<boolean> {
    try {
      const user = await this.findById(userId)
      if (!user) return false

      const newGoldPoints = Math.max(0, user.goldpoints + goldPoints)
      return this.update(userId, { goldpoints: newGoldPoints } as any)
    } catch (error) {
      console.error('Update gold points error:', error)
      return false
    }
  }

  async updateStatus(userId: number, status: 'allow' | 'deny'): Promise<boolean> {
    return this.update(userId, { status } as any)
  }

  async findWithPointracks(userId: number, limit: number = 20, offset: number = 0): Promise<UserWithPointracks | null> {
    try {
      const user = await this.findById(userId)
      if (!user) return null

      const page = Math.floor(offset / limit) + 1
      const pointracksCollection = this.pb.collection('pointraks')
      const result = await pointracksCollection.getList(page, limit, {
        filter: `owner = ${userId}`,
        sort: '-created'
      })

      const pointracks = result.items.map(record => ({
        id: parseInt(record.id),
        points: record.points,
        detail: record.detail,
        channel: record.channel,
        createdAt: new Date(record.created).getTime()
      }))

      return {
        ...user,
        pointracks
      }
    } catch (error) {
      console.error('Find with pointracks error:', error)
      return null
    }
  }

  async findRichestUsers(limit: number): Promise<User[]> {
    try {
      const result = await this.collection.getList(1, limit, {
        sort: '-points'
      })
      return result.items.map(record => this.mapRecordToUser(record))
    } catch (error) {
      console.error('Find richest users error:', error)
      return []
    }
  }

  async findDangerousUsers(minReported: number): Promise<User[]> {
    try {
      const result = await this.collection.getList(1, 100, {
        filter: `reported >= ${minReported}`,
        sort: '-reported'
      })
      return result.items.map(record => this.mapRecordToUser(record))
    } catch (error) {
      console.error('Find dangerous users error:', error)
      return []
    }
  }

  async getActiveUserCount(): Promise<number> {
    try {
      const result = await this.collection.getList(1, 1, {
        filter: 'online = true'
      })
      return result.totalItems
    } catch (error) {
      console.error('Get active user count error:', error)
      return 0
    }
  }

  private mapRecordToUser(record: any): User {
    return {
      userId: record.userId,
      name: record.name,
      email: record.email,
      phone: record.phone,
      digit: record.digit,
      password: record.password,
      paypassword: record.paypassword,
      avatar: record.avatar,
      language: record.language,
      status: record.status,
      online: record.online,
      reported: record.reported || 0,
      role: record.role,
      gender: record.gender,
      age: record.age || 0,
      level: record.level || 1,
      memo: record.memo || '',
      points: record.points || 0,
      goldpoints: record.goldpoints || 0,
      totalearned: record.totalearned || 0,
      upline: record.upline,
      createdAt: new Date(record.created).getTime(),
      updatedAt: new Date(record.updated).getTime()
    }
  }
}