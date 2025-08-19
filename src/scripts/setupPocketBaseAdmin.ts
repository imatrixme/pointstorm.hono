import { PocketBaseClient } from '@/repositories/pocketbase/PocketBaseClient'

async function setupPocketBaseAdmin() {
  try {
    console.log('🔧 Setting up PocketBase admin account...')
    
    const pb = PocketBaseClient.getInstance()
    
    // 尝试创建管理员账户
    const adminData = {
      email: 'admin@example.com',
      password: 'admin_password',
      passwordConfirm: 'admin_password'
    }
    
    try {
      await pb.admins.create(adminData)
      console.log('✅ Admin account created successfully!')
    } catch (error: any) {
      if (error.status === 400 && error.message.includes('already exists')) {
        console.log('ℹ️  Admin account already exists')
      } else {
        console.log('⚠️  Admin creation failed, but continuing...')
        console.log('Error:', error.message)
      }
    }
    
    // 尝试登录
    try {
      await pb.admins.authWithPassword(adminData.email, adminData.password)
      console.log('✅ Admin login successful!')
      
      // 显示管理员信息
      console.log('👤 Admin info:', pb.authStore.model)
      
    } catch (error: any) {
      console.log('❌ Admin login failed:', error.message)
      throw error
    }
    
    console.log(`\n📍 PocketBase Admin Dashboard: ${pb.baseUrl}/_/`)
    console.log(`   Email: ${adminData.email}`)
    console.log(`   Password: ${adminData.password}`)
    
  } catch (error) {
    console.error('❌ Setup failed:', error)
    process.exit(1)
  }
}

// 如果直接运行此文件
if (require.main === module) {
  setupPocketBaseAdmin()
}

export { setupPocketBaseAdmin }