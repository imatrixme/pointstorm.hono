import fetch from 'node-fetch'

async function createPocketBaseAdmin() {
  const POCKETBASE_URL = 'http://127.0.0.1:8090'
  
  try {
    console.log('🔧 Creating PocketBase admin via API...')
    
    // 尝试通过安装端点创建管理员
    const installData = {
      email: 'admin@example.com',
      password: 'admin_password',
      passwordConfirm: 'admin_password'
    }
    
    const response = await fetch(`${POCKETBASE_URL}/api/install`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(installData)
    })
    
    if (response.ok) {
      console.log('✅ Admin account created successfully via install endpoint!')
      return true
    } else {
      const errorText = await response.text()
      console.log('ℹ️  Install endpoint response:', response.status, errorText)
    }
    
    // 如果安装端点失败，尝试直接创建
    const createResponse = await fetch(`${POCKETBASE_URL}/api/admins`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(installData)
    })
    
    if (createResponse.ok) {
      console.log('✅ Admin account created successfully via admins endpoint!')
      return true
    } else {
      const errorText = await createResponse.text()
      console.log('ℹ️  Admin creation response:', createResponse.status, errorText)
    }
    
    return false
    
  } catch (error) {
    console.error('❌ Error creating admin:', error)
    return false
  }
}

// 如果直接运行此文件
if (require.main === module) {
  createPocketBaseAdmin().then(success => {
    if (success) {
      console.log('✅ Admin setup completed!')
    } else {
      console.log('⚠️  Admin setup may require manual intervention')
      console.log('📍 Please visit: http://127.0.0.1:8090/_/')
    }
  })
}

export { createPocketBaseAdmin }