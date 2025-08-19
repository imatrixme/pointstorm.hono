import { PocketBaseClient } from '@/repositories/pocketbase/PocketBaseClient'
import { repositoryFactory } from '@/repositories/factory'

async function testPocketBaseBasic() {
  try {
    console.log('🚀 Starting basic PocketBase connection test...')
    
    // 1. 测试连接
    console.log('\n📡 Step 1: Testing PocketBase connection...')
    const pb = PocketBaseClient.getInstance()
    console.log('✅ PocketBase client initialized')
    console.log(`📍 PocketBase URL: ${pb.baseUrl}`)
    
    // 2. 测试健康检查
    console.log('\n💓 Step 2: Testing health endpoint...')
    try {
      const healthResponse = await fetch(`${pb.baseUrl}/api/health`)
      const healthData = await healthResponse.json()
      console.log('✅ Health check passed:', healthData.message)
    } catch (error) {
      console.error('❌ Health check failed:', error)
      return
    }
    
    // 3. 切换到PocketBase Repository（仅初始化，不执行操作）
    console.log('\n🔄 Step 3: Testing repository factory switch...')
    repositoryFactory.setRepositoryType('pocketbase')
    const userRepo = repositoryFactory.getUserRepository()
    console.log('✅ Repository factory switched to PocketBase')
    console.log('✅ UserRepository instance created successfully')
    
    // 4. 显示设置说明
    console.log('\n📋 Setup Instructions:')
    console.log('1. Open PocketBase Admin Dashboard:')
    console.log(`   ${pb.baseUrl}/_/`)
    console.log('2. Create admin account with:')
    console.log('   Email: admin@example.com')
    console.log('   Password: admin_password')
    console.log('3. After admin setup, run: npm run pocketbase:init')
    console.log('4. Then run: npm run pocketbase:test')
    
    console.log('\n🎉 Basic PocketBase connection test completed!')
    
  } catch (error) {
    console.error('❌ Basic PocketBase test failed:', error)
    process.exit(1)
  }
}

// 如果直接运行此文件
if (require.main === module) {
  testPocketBaseBasic()
}

export { testPocketBaseBasic }