import PocketBase from 'pocketbase'
import { APP_CONFIG } from '@/config/app'

class PocketBaseClient {
  private static instance: PocketBase
  private static initialized = false

  static getInstance(): PocketBase {
    if (!PocketBaseClient.instance) {
      const pocketbaseUrl = process.env.POCKETBASE_URL || 'http://127.0.0.1:8090'
      PocketBaseClient.instance = new PocketBase(pocketbaseUrl)
    }
    return PocketBaseClient.instance
  }

  static async initialize(): Promise<void> {
    if (PocketBaseClient.initialized) return

    const pb = PocketBaseClient.getInstance()
    
    try {
      // 尝试使用管理员账户登录
      const adminEmail = process.env.POCKETBASE_ADMIN_EMAIL || 'admin@example.com'
      const adminPassword = process.env.POCKETBASE_ADMIN_PASSWORD || 'admin_password'
      
      await pb.admins.authWithPassword(adminEmail, adminPassword)
      console.log('Connected to PocketBase as admin')
      
      PocketBaseClient.initialized = true
    } catch (error) {
      console.warn('PocketBase admin auth failed, continuing without auth:', error)
      // 继续执行，某些操作可能不需要管理员权限
    }
  }

  static async createCollectionsFromSchema(schema: any): Promise<void> {
    const pb = PocketBaseClient.getInstance()
    
    try {
      for (const collectionData of schema.collections) {
        try {
          // 检查集合是否已存在
          await pb.collections.getOne(collectionData.name)
          console.log(`Collection '${collectionData.name}' already exists`)
        } catch (error) {
          // 集合不存在，创建新集合
          await pb.collections.create(collectionData)
          console.log(`Created collection '${collectionData.name}'`)
        }
      }
    } catch (error) {
      console.error('Error creating collections:', error)
      throw error
    }
  }

  static getCollectionName(tableName: string): string {
    // 映射SQLite表名到PocketBase集合名
    const mapping: Record<string, string> = {
      'users': 'users',
      'stories': 'stories', 
      'transactions': 'transactions',
      'pay_serials': 'pay_serials',
      'pointraks': 'pointraks',
      'cashouts': 'cashouts'
    }
    
    return mapping[tableName] || tableName
  }
}

export { PocketBaseClient }