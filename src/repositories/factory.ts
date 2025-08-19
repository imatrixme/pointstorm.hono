import type { IUserRepository } from '@/repositories/interfaces/IUserRepository'
import type { IStoryRepository } from '@/repositories/interfaces/IStoryRepository'
import type { IPointrakRepository } from '@/repositories/interfaces/IPointrakRepository'
import type { ITransactionRepository } from '@/repositories/interfaces/ITransactionRepository'
import type { IPaySerialRepository } from '@/repositories/interfaces/IPaySerialRepository'
import type { ICashoutRepository } from '@/repositories/interfaces/ICashoutRepository'
import { APP_CONFIG } from '@/config/app'

// SQLite implementations
import { SqliteUserRepository } from '@/repositories/sqlite/UserRepository'
import { SqliteStoryRepository } from '@/repositories/sqlite/StoryRepository'
import { SqliteTransactionRepository } from '@/repositories/sqlite/TransactionRepository'
import { SqlitePaySerialRepository } from '@/repositories/sqlite/PaySerialRepository'
import { SqlitePointrakRepository } from '@/repositories/sqlite/PointrakRepository'
import { SqliteCashoutRepository } from '@/repositories/sqlite/CashoutRepository'

// PocketBase implementations (future)
// import { PocketBaseUserRepository } from '@/repositories/pocketbase/UserRepository'

type RepositoryType = 'sqlite' | 'pocketbase'

class RepositoryFactory {
  private repositoryType: RepositoryType
  private repositories: Map<string, any> = new Map()

  constructor() {
    this.repositoryType = (APP_CONFIG.database.type as RepositoryType) || 'sqlite'
  }

  // 单例模式获取Repository实例
  private getRepository<T>(key: string, createFn: () => T): T {
    if (!this.repositories.has(key)) {
      this.repositories.set(key, createFn())
    }
    return this.repositories.get(key)
  }

  getUserRepository(): IUserRepository {
    return this.getRepository('user', () => {
      switch (this.repositoryType) {
        case 'sqlite':
          return new SqliteUserRepository()
        case 'pocketbase':
          // return new PocketBaseUserRepository()
          throw new Error('PocketBase UserRepository not implemented yet')
        default:
          throw new Error(`Unknown repository type: ${this.repositoryType}`)
      }
    })
  }

  getStoryRepository(): IStoryRepository {
    return this.getRepository('story', () => {
      switch (this.repositoryType) {
        case 'sqlite':
          return new SqliteStoryRepository()
        case 'pocketbase':
          throw new Error('PocketBase StoryRepository not implemented yet')
        default:
          throw new Error(`Unknown repository type: ${this.repositoryType}`)
      }
    })
  }

  getPointrakRepository(): IPointrakRepository {
    return this.getRepository('pointrak', () => {
      switch (this.repositoryType) {
        case 'sqlite':
          return new SqlitePointrakRepository()
        case 'pocketbase':
          throw new Error('PocketBase PointrakRepository not implemented yet')
        default:
          throw new Error(`Unknown repository type: ${this.repositoryType}`)
      }
    })
  }

  getTransactionRepository(): ITransactionRepository {
    return this.getRepository('transaction', () => {
      switch (this.repositoryType) {
        case 'sqlite':
          return new SqliteTransactionRepository()
        case 'pocketbase':
          throw new Error('PocketBase TransactionRepository not implemented yet')
        default:
          throw new Error(`Unknown repository type: ${this.repositoryType}`)
      }
    })
  }

  getPaySerialRepository(): IPaySerialRepository {
    return this.getRepository('payserial', () => {
      switch (this.repositoryType) {
        case 'sqlite':
          return new SqlitePaySerialRepository()
        case 'pocketbase':
          throw new Error('PocketBase PaySerialRepository not implemented yet')
        default:
          throw new Error(`Unknown repository type: ${this.repositoryType}`)
      }
    })
  }

  getCashoutRepository(): ICashoutRepository {
    return this.getRepository('cashout', () => {
      switch (this.repositoryType) {
        case 'sqlite':
          return new SqliteCashoutRepository()
        case 'pocketbase':
          throw new Error('PocketBase CashoutRepository not implemented yet')
        default:
          throw new Error(`Unknown repository type: ${this.repositoryType}`)
      }
    })
  }

  // 清理所有Repository实例（主要用于测试）
  clear(): void {
    this.repositories.clear()
  }

  // 切换Repository类型（主要用于测试）
  setRepositoryType(type: RepositoryType): void {
    this.repositoryType = type
    this.clear()
  }
}

// 导出单例实例
export const repositoryFactory = new RepositoryFactory()

// 便捷方法
export const getUserRepository = () => repositoryFactory.getUserRepository()
export const getStoryRepository = () => repositoryFactory.getStoryRepository()
export const getPointrakRepository = () => repositoryFactory.getPointrakRepository()
export const getTransactionRepository = () => repositoryFactory.getTransactionRepository()
export const getPaySerialRepository = () => repositoryFactory.getPaySerialRepository()
export const getCashoutRepository = () => repositoryFactory.getCashoutRepository()