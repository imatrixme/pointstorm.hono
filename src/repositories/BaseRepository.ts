import type Database from 'better-sqlite3'
import { getDatabase } from '@/database/client'
import moment from 'moment'

export abstract class BaseRepository {
  protected db: Database.Database

  constructor() {
    this.db = getDatabase()
  }

  protected now(): number {
    return Math.floor(Date.now() / 1000)
  }

  protected formatTimestamp(timestamp: number): string {
    return moment.unix(timestamp).format('YYYY-MM-DD HH:mm:ss')
  }

  protected generateSn(prefix: string = ''): string {
    const timestamp = Date.now()
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
    return `${prefix}${timestamp}${random}`
  }

  protected executeTransaction<T>(callback: () => T): T {
    const transaction = this.db.transaction(callback)
    return transaction()
  }

  protected prepareCachedStatement(sql: string) {
    return this.db.prepare(sql)
  }

  // 构建WHERE子句的辅助方法
  protected buildWhereClause(conditions: Record<string, any>): { where: string, params: any[] } {
    const clauses: string[] = []
    const params: any[] = []

    for (const [key, value] of Object.entries(conditions)) {
      if (value !== undefined && value !== null) {
        clauses.push(`${key} = ?`)
        params.push(value)
      }
    }

    return {
      where: clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '',
      params
    }
  }

  // 构建分页子句
  protected buildLimitClause(limit: number, offset: number = 0): string {
    return `LIMIT ${limit} OFFSET ${offset}`
  }

  // 构建排序子句
  protected buildOrderClause(orderBy: string = 'createdAt', direction: 'ASC' | 'DESC' = 'DESC'): string {
    return `ORDER BY ${orderBy} ${direction}`
  }

  // 检查记录是否存在
  protected exists(table: string, conditions: Record<string, any>): boolean {
    const { where, params } = this.buildWhereClause(conditions)
    const stmt = this.db.prepare(`SELECT 1 FROM ${table} ${where} LIMIT 1`)
    const result = stmt.get(...params)
    return !!result
  }

  // 通用计数方法
  protected count(table: string, conditions: Record<string, any> = {}): number {
    const { where, params } = this.buildWhereClause(conditions)
    const stmt = this.db.prepare(`SELECT COUNT(*) as count FROM ${table} ${where}`)
    const result = stmt.get(...params) as { count: number }
    return result.count
  }

  // 通用单条查询
  protected findOne<T>(table: string, conditions: Record<string, any>): T | null {
    const { where, params } = this.buildWhereClause(conditions)
    const stmt = this.db.prepare(`SELECT * FROM ${table} ${where} LIMIT 1`)
    const result = stmt.get(...params) as T | undefined
    return result || null
  }

  // 通用多条查询
  protected findMany<T>(
    table: string, 
    conditions: Record<string, any> = {},
    orderBy?: string,
    direction?: 'ASC' | 'DESC',
    limit?: number,
    offset?: number
  ): T[] {
    const { where, params } = this.buildWhereClause(conditions)
    
    let sql = `SELECT * FROM ${table} ${where}`
    
    if (orderBy) {
      sql += ` ${this.buildOrderClause(orderBy, direction)}`
    }
    
    if (limit !== undefined) {
      sql += ` ${this.buildLimitClause(limit, offset)}`
    }
    
    const stmt = this.db.prepare(sql)
    return stmt.all(...params) as T[]
  }

  // 通用插入
  protected insert(table: string, data: Record<string, any>): number {
    const now = this.now()
    const insertData = {
      ...data,
      createdAt: data.createdAt || now,
      updatedAt: data.updatedAt || now
    }

    const keys = Object.keys(insertData)
    const placeholders = keys.map(() => '?').join(', ')
    const values = Object.values(insertData)

    const stmt = this.db.prepare(
      `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})`
    )
    
    const result = stmt.run(...values)
    return result.lastInsertRowid as number
  }

  // 通用更新
  protected updateTable(table: string, id: number | string, data: Record<string, any>, idColumn: string = 'id'): boolean {
    if (Object.keys(data).length === 0) return true

    const updateData = {
      ...data,
      updatedAt: this.now()
    }

    const keys = Object.keys(updateData)
    const setClause = keys.map(key => `${key} = ?`).join(', ')
    const values = Object.values(updateData)

    const stmt = this.db.prepare(
      `UPDATE ${table} SET ${setClause} WHERE ${idColumn} = ?`
    )
    
    const result = stmt.run(...values, id)
    return result.changes > 0
  }

  // 通用删除
  protected deleteTable(table: string, id: number | string, idColumn: string = 'id'): boolean {
    const stmt = this.db.prepare(`DELETE FROM ${table} WHERE ${idColumn} = ?`)
    const result = stmt.run(id)
    return result.changes > 0
  }

  // 检查数据完整性
  protected validateForeignKey(table: string, column: string, value: any): boolean {
    if (!value) return true // null值认为有效
    
    const stmt = this.db.prepare(`SELECT 1 FROM ${table} WHERE ${column} = ? LIMIT 1`)
    const result = stmt.get(value)
    return !!result
  }
}