import { PocketBaseClient } from '@/repositories/pocketbase/PocketBaseClient'

async function testPocketBaseConnection() {
  try {
    console.log('🔧 Testing PocketBase connection and basic operations...')
    
    const pb = PocketBaseClient.getInstance()
    console.log(`📍 Connected to: ${pb.baseUrl}`)
    
    // 测试健康检查
    try {
      const healthResponse = await fetch(`${pb.baseUrl}/api/health`)
      const healthData = await healthResponse.json()
      console.log('✅ Health check:', healthData.message)
    } catch (error) {
      console.error('❌ Health check failed:', error)
      return
    }
    
    // 列出现有集合（不需要认证）
    try {
      const collections = await pb.collections.getFullList()
      console.log('📋 Existing collections:', collections.length)
      collections.forEach(collection => {
        console.log(`  - ${collection.name} (${collection.type})`)
      })
    } catch (error: any) {
      console.log('ℹ️  Collections list result:', error.status, error.message)
    }
    
    // 如果没有集合，可能需要手动在Web界面创建
    console.log('\n📋 Next steps:')
    console.log('1. Visit PocketBase Admin: http://127.0.0.1:8090/_/')
    console.log('2. Login with: admin@example.com / admin_password')
    console.log('3. Create a test collection named "users" with these fields:')
    console.log('   - userId (Number)')
    console.log('   - name (Text)')
    console.log('   - phone (Text)')
    console.log('   - points (Number)')
    console.log('4. Then run the API test')
    
  } catch (error) {
    console.error('❌ Connection test failed:', error)
  }
}

// 如果直接运行此文件
if (require.main === module) {
  testPocketBaseConnection()
}

export { testPocketBaseConnection }