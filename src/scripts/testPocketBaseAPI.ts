import { repositoryFactory } from '@/repositories/factory'

async function testPocketBaseAPI() {
  try {
    console.log('🚀 Starting PocketBase API integration test...')
    
    // 1. 切换到PocketBase Repository
    console.log('\n🔄 Step 1: Switching to PocketBase repository...')
    process.env.DB_TYPE = 'pocketbase'
    repositoryFactory.setRepositoryType('pocketbase')
    console.log('✅ Repository switched to PocketBase')
    
    // 2. 获取Repository实例
    console.log('\n👤 Step 2: Getting UserRepository instance...')
    const userRepo = repositoryFactory.getUserRepository()
    console.log('✅ UserRepository instance created')
    
    // 3. 测试用户创建（这需要users集合存在）
    console.log('\n📝 Step 3: Testing user creation...')
    try {
      const testUser = await userRepo.create({
        phone: '13800138888',
        password: 'test123456',
        name: 'PocketBase测试用户',
        email: 'pbtest@example.com'
      })
      
      console.log('✅ User created successfully:', {
        userId: testUser.userId,
        name: testUser.name,
        phone: testUser.phone,
        points: testUser.points
      })
      
      // 4. 测试用户查询
      console.log('\n🔍 Step 4: Testing user query...')
      const foundUser = await userRepo.findById(testUser.userId)
      if (foundUser) {
        console.log('✅ User found:', foundUser.name)
      } else {
        console.log('❌ User not found')
      }
      
      // 5. 测试用户更新
      console.log('\n📝 Step 5: Testing user update...')
      const updated = await userRepo.updatePoints(testUser.userId, 500)
      console.log('✅ Points updated:', updated ? 'Success' : 'Failed')
      
      // 6. 验证更新
      const updatedUser = await userRepo.findById(testUser.userId)
      console.log('✅ Updated points:', updatedUser?.points)
      
      // 7. 测试用户登录
      console.log('\n🔐 Step 6: Testing user login...')
      const loginUser = await userRepo.validateLogin('13800138888', 'test123456')
      console.log('✅ Login test:', loginUser ? 'Success' : 'Failed')
      
      // 8. 清理测试数据
      console.log('\n🧹 Step 7: Cleaning up test data...')
      const deleted = await userRepo.delete(testUser.userId)
      console.log('✅ User deleted:', deleted ? 'Success' : 'Failed')
      
      console.log('\n🎉 PocketBase API test completed successfully!')
      console.log('✅ Data was successfully stored and retrieved from PocketBase!')
      
    } catch (error: any) {
      if (error.message.includes('Collection') || error.status === 404) {
        console.log('❌ Collection not found. Please create the users collection first.')
        console.log('📋 Instructions:')
        console.log('1. Visit: http://127.0.0.1:8090/_/')
        console.log('2. Login with: admin@example.com / admin_password')
        console.log('3. Create a collection named "users" with fields:')
        console.log('   - userId (Number)')
        console.log('   - name (Text)')
        console.log('   - phone (Text, Unique)')
        console.log('   - email (Email)')
        console.log('   - password (Text)')
        console.log('   - points (Number, Default: 1000)')
        console.log('   - status (Select: allow, deny)')
        console.log('   - role (Select: normal, advance, admin)')
        console.log('   - online (Bool, Default: false)')
        return
      }
      throw error
    }
    
  } catch (error) {
    console.error('❌ PocketBase API test failed:', error)
    process.exit(1)
  }
}

// 如果直接运行此文件
if (require.main === module) {
  testPocketBaseAPI()
}

export { testPocketBaseAPI }