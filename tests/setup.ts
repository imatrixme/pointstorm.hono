// 测试环境配置
import { beforeAll, afterAll } from 'vitest'

beforeAll(async () => {
  // 设置测试环境变量
  process.env.NODE_ENV = 'test'
  process.env.DATABASE_PATH = ':memory:' // 使用内存数据库进行测试
  
  console.log('Test environment initialized')
})

afterAll(async () => {
  console.log('Test environment cleaned up')
})