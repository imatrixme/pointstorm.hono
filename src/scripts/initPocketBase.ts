import { PocketBaseClient } from '@/repositories/pocketbase/PocketBaseClient'
import * as fs from 'fs'
import * as path from 'path'

async function initializePocketBase() {
  try {
    console.log('Initializing PocketBase...')
    
    // 初始化客户端连接
    await PocketBaseClient.initialize()
    
    // 读取schema配置
    const schemaPath = path.join(process.cwd(), 'pocketbase', 'schema.json')
    const schemaContent = fs.readFileSync(schemaPath, 'utf-8')
    const schema = JSON.parse(schemaContent)
    
    // 创建集合
    console.log('Creating collections...')
    await PocketBaseClient.createCollectionsFromSchema(schema)
    
    console.log('PocketBase initialization completed successfully!')
    
    // 显示连接信息
    const pb = PocketBaseClient.getInstance()
    console.log(`PocketBase URL: ${pb.baseUrl}`)
    console.log(`Admin Dashboard: ${pb.baseUrl}/_/`)
    
  } catch (error) {
    console.error('PocketBase initialization failed:', error)
    process.exit(1)
  }
}

// 如果直接运行此文件
if (require.main === module) {
  initializePocketBase()
}

export { initializePocketBase }