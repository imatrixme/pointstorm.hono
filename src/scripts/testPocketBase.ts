import { PocketBaseClient } from '@/repositories/pocketbase/PocketBaseClient'
import { repositoryFactory } from '@/repositories/factory'
import { initializePocketBase } from './initPocketBase'

async function testPocketBaseIntegration() {
  try {
    console.log('🚀 Starting PocketBase integration test...')
    
    // 1. 初始化PocketBase
    console.log('\n📋 Step 1: Initializing PocketBase...')
    await initializePocketBase()
    
    // 2. 切换到PocketBase Repository
    console.log('\n🔄 Step 2: Switching to PocketBase repository...')
    repositoryFactory.setRepositoryType('pocketbase')
    
    // 3. 测试用户Repository
    console.log('\n👤 Step 3: Testing UserRepository...')
    const userRepo = repositoryFactory.getUserRepository()
    
    // 创建测试用户
    const testUser = await userRepo.create({
      phone: '13800138001',
      password: 'test123456',
      name: 'PocketBase测试用户',
      email: 'test@pocketbase.com'
    })
    
    console.log('✅ Created test user:', {
      userId: testUser.userId,
      name: testUser.name,
      phone: testUser.phone,
      points: testUser.points
    })
    
    // 测试查找用户
    const foundUser = await userRepo.findById(testUser.userId)
    console.log('✅ Found user by ID:', foundUser ? 'Success' : 'Failed')
    
    // 测试用户登录
    const loginUser = await userRepo.validateLogin('13800138001', 'test123456')
    console.log('✅ User login validation:', loginUser ? 'Success' : 'Failed')
    
    // 测试更新积分
    const pointsUpdated = await userRepo.updatePoints(testUser.userId, 500)
    console.log('✅ Points update:', pointsUpdated ? 'Success' : 'Failed')
    
    // 检查积分更新
    const updatedUser = await userRepo.findById(testUser.userId)
    console.log('✅ Updated user points:', updatedUser?.points)
    
    // 4. 测试用户统计
    console.log('\n📊 Step 4: Testing user statistics...')
    const userCount = await userRepo.getUserCount()
    const activeCount = await userRepo.getActiveUserCount()
    console.log('✅ User statistics:', { total: userCount, active: activeCount })
    
    // 5. 清理测试数据
    console.log('\n🧹 Step 5: Cleaning up test data...')
    const deleted = await userRepo.delete(testUser.userId)
    console.log('✅ Test user deleted:', deleted ? 'Success' : 'Failed')
    
    console.log('\n🎉 PocketBase integration test completed successfully!')
    
    // 显示连接信息
    const pb = PocketBaseClient.getInstance()
    console.log(`\n📍 PocketBase Dashboard: ${pb.baseUrl}/_/`)
    console.log('   Admin credentials: admin@example.com / admin_password')
    
  } catch (error) {
    console.error('❌ PocketBase integration test failed:', error)
    process.exit(1)
  }
}

// 如果直接运行此文件
if (require.main === module) {
  testPocketBaseIntegration()
}

export { testPocketBaseIntegration }