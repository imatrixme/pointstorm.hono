import { describe, test, expect, beforeAll, afterAll } from 'bun:test'
import { createTestApp } from './testApp'
import type { Hono } from 'hono'

// 测试用户数据
const testUser = {
  phone: '13800138000',
  password: 'test123456',
  name: 'Test User'
}

let userToken = ''
let userId = 0
let app: Hono

beforeAll(async () => {
  console.log('Setting up test environment...')
  // 设置测试环境变量
  process.env.NODE_ENV = 'test'
  process.env.DATABASE_PATH = ':memory:' // 使用内存数据库
  
  // 创建测试应用
  app = await createTestApp()
  console.log('Test app initialized')
})

afterAll(async () => {
  console.log('Test cleanup completed')
})

describe('API Integration Tests', () => {
  describe('Database Connection', () => {
    test('should connect to database', async () => {
      const response = await app.request('/test-db')
      expect(response.status).toBe(200)
      
      const data = await response.json()
      expect(data).toHaveProperty('message')
      expect(data).toHaveProperty('userCount')
    })
  })

  describe('User Management', () => {
    test('should register a new user', async () => {
      const response = await app.request('/user/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testUser)
      })
      
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data).toHaveProperty('userId')
      expect(data.phone).toBe(testUser.phone)
      expect(data.name).toBe(testUser.name)
      expect(data).not.toHaveProperty('password')
      
      userId = data.userId
    })

    test('should not register duplicate phone', async () => {
      const response = await app.request('/user/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testUser)
      })
      
      expect(response.status).toBe(400)
    })

    test('should login user', async () => {
      const response = await app.request(`/user/login?phone=${testUser.phone}&password=${testUser.password}`)
      
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data).toHaveProperty('utoken')
      expect(data).toHaveProperty('userId')
      expect(data.online).toBe(true)
      
      userToken = data.utoken
    })

    test('should get user information', async () => {
      const response = await app.request('/user/getinfo', {
        headers: {
          'utoken': userToken
        }
      })
      
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.userId).toBe(userId)
      expect(data.phone).toBe(testUser.phone)
    })

    test('should update user information', async () => {
      const updateData = {
        name: 'Updated Test User',
        memo: 'This is a test user'
      }
      
      const response = await app.request('/user/changeinfo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'utoken': userToken
        },
        body: JSON.stringify(updateData)
      })
      
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data).toHaveProperty('message')
    })
  })

  describe('Story Management', () => {
    let storyId = 0

    test('should create a story', async () => {
      const storyData = {
        title: 'Test Story',
        content: 'This is a test story content',
        anonymous: false
      }
      
      const response = await app.request('/story/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'utoken': userToken
        },
        body: JSON.stringify(storyData)
      })
      
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data).toHaveProperty('id')
      expect(data.title).toBe(storyData.title)
      expect(data.content).toBe(storyData.content)
      
      storyId = data.id
    })

    test('should get story list', async () => {
      const response = await app.request('/story/index?page=1&count=10', {
        headers: {
          'utoken': userToken
        }
      })
      
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(Array.isArray(data)).toBe(true)
    })

    test('should up story', async () => {
      const response = await app.request('/story/up', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'utoken': userToken
        },
        body: JSON.stringify({ storyId })
      })
      
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data).toHaveProperty('message')
    })

    test('should favorite story', async () => {
      const response = await app.request('/story/favorite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'utoken': userToken
        },
        body: JSON.stringify({ storyId })
      })
      
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data).toHaveProperty('favorited')
    })

    test('should get story comments', async () => {
      const response = await app.request(`/story/comments?storyId=${storyId}`, {
        headers: {
          'utoken': userToken
        }
      })
      
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data).toHaveProperty('id')
      expect(data).toHaveProperty('comments')
    })
  })

  describe('PaySerial Management', () => {
    let paySerialSn = ''

    test('should create pay serial', async () => {
      const paySerialData = {
        point: 100,
        password: 'test123',
        hours: 1
      }
      
      const response = await app.request('/payserial/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'utoken': userToken
        },
        body: JSON.stringify(paySerialData)
      })
      
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data).toHaveProperty('sn')
      expect(data).toHaveProperty('point')
      expect(data.point).toBe(paySerialData.point)
      
      paySerialSn = data.sn
    })

    test('should get pay serial history', async () => {
      const response = await app.request('/payserial/index?page=1&count=10', {
        headers: {
          'utoken': userToken
        }
      })
      
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(Array.isArray(data)).toBe(true)
    })
  })

  describe('Transaction Management', () => {
    test('should get transaction history', async () => {
      const response = await app.request('/transaction/index?page=1&count=10', {
        headers: {
          'utoken': userToken
        }
      })
      
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(Array.isArray(data)).toBe(true)
    })
  })

  describe('Pointrak Management', () => {
    test('should get pointrak history', async () => {
      const response = await app.request('/pointrak/index?page=1&count=10', {
        headers: {
          'utoken': userToken
        }
      })
      
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(Array.isArray(data)).toBe(true)
    })

    test('should get pointrak stats', async () => {
      const response = await app.request('/pointrak/stats', {
        headers: {
          'utoken': userToken
        }
      })
      
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data).toHaveProperty('totalPoints')
      expect(data).toHaveProperty('totalCount')
      expect(data).toHaveProperty('recentPoints')
    })
  })

  describe('Cashout Management', () => {
    test('should get cashout history', async () => {
      const response = await app.request('/cashout/index?page=1&count=10', {
        headers: {
          'utoken': userToken
        }
      })
      
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(Array.isArray(data)).toBe(true)
    })

    test('should get cashout stats', async () => {
      const response = await app.request('/cashout/stats', {
        headers: {
          'utoken': userToken
        }
      })
      
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data).toHaveProperty('totalAmount')
      expect(data).toHaveProperty('totalCount')
      expect(data).toHaveProperty('recentAmount')
    })
  })

  describe('Encryption/Decryption', () => {
    test('should encrypt and decrypt ID', async () => {
      const testId = '123'
      
      // Test encryption
      const encryptResponse = await app.request(`/user/crypt?id=${testId}`)
      expect(encryptResponse.status).toBe(200)
      const encryptData = await encryptResponse.json()
      expect(encryptData).toHaveProperty('encrypted')
      
      // Test decryption
      const decryptResponse = await app.request(`/user/decrypt?encrypted=${encryptData.encrypted}`)
      expect(decryptResponse.status).toBe(200)
      const decryptData = await decryptResponse.json()
      expect(decryptData).toHaveProperty('decrypted')
      expect(decryptData.decrypted).toBe(testId)
    })
  })

  describe('User Logout', () => {
    test('should logout user', async () => {
      const response = await app.request('/user/logout', {
        method: 'POST',
        headers: {
          'utoken': userToken
        }
      })
      
      expect(response.status).toBe(200)
    })
  })
})