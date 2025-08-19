import Database from 'better-sqlite3'
import { APP_CONFIG } from '@/config/app'
import fs from 'fs'
import path from 'path'

let db: Database.Database | null = null

export async function initDatabase(): Promise<Database.Database> {
  if (db) return db

  try {
    // 确保数据目录存在
    const dbPath = path.resolve(APP_CONFIG.database.path)
    const dbDir = path.dirname(dbPath)
    
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true })
    }

    // 创建数据库连接
    db = new Database(dbPath)
    
    // 启用外键约束
    db.pragma('foreign_keys = ON')
    
    // 设置日志模式以提高性能
    db.pragma('journal_mode = WAL')
    
    console.log(`SQLite database initialized at: ${dbPath}`)
    
    // 运行数据库初始化脚本
    await runMigrations(db)
    
    return db
  } catch (error) {
    console.error('Failed to initialize database:', error)
    throw error
  }
}

export function getDatabase(): Database.Database {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.')
  }
  return db
}

async function runMigrations(database: Database.Database) {
  try {
    // 读取并执行数据库表创建脚本
    const schemaPath = path.join(process.cwd(), 'src', 'database', 'schema', 'tables.sql')
    
    if (fs.existsSync(schemaPath)) {
      const schema = fs.readFileSync(schemaPath, 'utf8')
      
      // 分割SQL语句并执行
      const statements = schema
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0)
      
      database.transaction(() => {
        for (const statement of statements) {
          try {
            database.exec(statement)
          } catch (error) {
            // 忽略表已存在的错误
            if (!(error as Error).message.includes('already exists')) {
              throw error
            }
          }
        }
      })()
      
      console.log('Database schema initialized successfully')
    }
  } catch (error) {
    console.error('Failed to run migrations:', error)
    throw error
  }
}

export function closeDatabase() {
  if (db) {
    db.close()
    db = null
  }
}