import { BaseRepository } from '@/repositories/BaseRepository'
import type { IStoryRepository } from '@/repositories/interfaces/IStoryRepository'
import type { Story, CreateStoryInput, UpdateStoryInput, StoryWithOwner, StoryWithDetails } from '@/models/Story'

export class SqliteStoryRepository extends BaseRepository implements IStoryRepository {
  
  async findById(id: number): Promise<Story | null> {
    return this.findOne<Story>('stories', { id })
  }

  async create(story: CreateStoryInput & { owner: number }): Promise<Story> {
    const storyData = {
      ...story,
      anonymous: story.anonymous ? 1 : 0,
      ups: 0,
      downs: 0,
      favos: 0,
      views: 0,
      reported: 0,
      status: 'allow'
    }

    const storyId = this.insert('stories', storyData)
    
    const createdStory = await this.findById(storyId)
    if (!createdStory) {
      throw new Error('Failed to create story')
    }

    return createdStory
  }

  async update(id: number, data: UpdateStoryInput): Promise<boolean> {
    return this.updateRecord('stories', id, data)
  }

  async delete(id: number): Promise<boolean> {
    return this.deleteRecord('stories', id)
  }

  async findAll(
    limit: number, 
    offset: number, 
    filters?: {
      owner?: number
      status?: 'allow' | 'deny'
      language?: string
    }
  ): Promise<StoryWithOwner[]> {
    let sql = `
      SELECT s.*, 
             u.userId, u.name as ownerName, u.avatar as ownerAvatar, u.digit as ownerDigit
      FROM stories s
      INNER JOIN users u ON s.owner = u.userId
      WHERE 1=1
    `
    
    const params: any[] = []
    
    if (filters?.owner) {
      sql += ' AND s.owner = ?'
      params.push(filters.owner)
    }
    
    if (filters?.status) {
      sql += ' AND s.status = ?'
      params.push(filters.status)
    }
    
    if (filters?.language) {
      sql += ' AND s.language = ?'
      params.push(filters.language)
    }
    
    sql += ' ORDER BY s.createdAt DESC LIMIT ? OFFSET ?'
    params.push(limit, offset)
    
    const stmt = this.db.prepare(sql)
    const rows = stmt.all(...params) as any[]
    
    return rows.map(row => ({
      id: row.id,
      title: row.title,
      content: row.content,
      anonymous: Boolean(row.anonymous),
      language: row.language,
      ups: row.ups,
      downs: row.downs,
      favos: row.favos,
      views: row.views,
      reported: row.reported,
      status: row.status,
      owner: row.owner,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      ownerInfo: {
        userId: row.userId,
        name: row.ownerName,
        avatar: row.ownerAvatar,
        digit: row.ownerDigit
      }
    }))
  }

  async findByOwner(ownerId: number, limit: number, offset: number): Promise<Story[]> {
    return this.findMany<Story>('stories', { owner: ownerId }, 'createdAt', 'DESC', limit, offset)
  }

  async findWithOwner(id: number): Promise<StoryWithOwner | null> {
    const sql = `
      SELECT s.*, 
             u.userId, u.name as ownerName, u.avatar as ownerAvatar, u.digit as ownerDigit
      FROM stories s
      INNER JOIN users u ON s.owner = u.userId
      WHERE s.id = ?
    `
    
    const stmt = this.db.prepare(sql)
    const row = stmt.get(id) as any
    
    if (!row) return null
    
    return {
      id: row.id,
      title: row.title,
      content: row.content,
      anonymous: Boolean(row.anonymous),
      language: row.language,
      ups: row.ups,
      downs: row.downs,
      favos: row.favos,
      views: row.views,
      reported: row.reported,
      status: row.status,
      owner: row.owner,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      ownerInfo: {
        userId: row.userId,
        name: row.ownerName,
        avatar: row.ownerAvatar,
        digit: row.ownerDigit
      }
    }
  }

  async findWithComments(id: number): Promise<StoryWithDetails | null> {
    const story = await this.findWithOwner(id)
    if (!story) return null

    // 获取关联的图片
    const photosSql = `SELECT id, url FROM photos WHERE story = ? ORDER BY createdAt ASC`
    const photosStmt = this.db.prepare(photosSql)
    const photos = photosStmt.all(id) as Array<{ id: number, url: string }>

    // 获取评论（限制5条最新的）
    const commentsSql = `
      SELECT c.id, c.content, c.anonymous, c.ups, c.owner, c.createdAt,
             u.name as ownerName, u.avatar as ownerAvatar, u.digit as ownerDigit
      FROM comments c
      LEFT JOIN users u ON c.owner = u.userId
      WHERE c.story = ? AND c.status = 'allow'
      ORDER BY c.createdAt DESC
      LIMIT 5
    `
    const commentsStmt = this.db.prepare(commentsSql)
    const commentRows = commentsStmt.all(id) as any[]
    
    const comments = commentRows.map(row => ({
      id: row.id,
      content: row.content,
      anonymous: Boolean(row.anonymous),
      ups: row.ups,
      owner: row.owner,
      createdAt: row.createdAt,
      ownerInfo: row.ownerName ? {
        name: row.ownerName,
        avatar: row.ownerAvatar,
        digit: row.ownerDigit
      } : undefined
    }))

    return {
      ...story,
      photos,
      comments
    }
  }

  async upStory(storyId: number, userId: number): Promise<boolean> {
    return this.executeTransaction(() => {
      // 检查是否已经点赞
      const checkStmt = this.db.prepare('SELECT 1 FROM user_story_ups WHERE userId = ? AND storyId = ?')
      const exists = checkStmt.get(userId, storyId)
      
      if (exists) return false
      
      // 添加点赞记录
      const insertStmt = this.db.prepare('INSERT INTO user_story_ups (userId, storyId) VALUES (?, ?)')
      insertStmt.run(userId, storyId)
      
      // 更新故事的点赞数
      const updateStmt = this.db.prepare('UPDATE stories SET ups = ups + 1, updatedAt = ? WHERE id = ?')
      updateStmt.run(this.now(), storyId)
      
      return true
    })
  }

  async downStory(storyId: number, userId: number): Promise<boolean> {
    return this.executeTransaction(() => {
      // 检查是否已经点踩
      const checkStmt = this.db.prepare('SELECT 1 FROM user_story_downs WHERE userId = ? AND storyId = ?')
      const exists = checkStmt.get(userId, storyId)
      
      if (exists) return false
      
      // 添加点踩记录
      const insertStmt = this.db.prepare('INSERT INTO user_story_downs (userId, storyId) VALUES (?, ?)')
      insertStmt.run(userId, storyId)
      
      // 更新故事的点踩数
      const updateStmt = this.db.prepare('UPDATE stories SET downs = downs + 1, updatedAt = ? WHERE id = ?')
      updateStmt.run(this.now(), storyId)
      
      return true
    })
  }

  async favoriteStory(storyId: number, userId: number): Promise<boolean> {
    return this.executeTransaction(() => {
      // 检查是否已经收藏
      const checkStmt = this.db.prepare('SELECT 1 FROM user_story_favos WHERE userId = ? AND storyId = ?')
      const exists = checkStmt.get(userId, storyId)
      
      if (exists) {
        // 取消收藏
        const deleteStmt = this.db.prepare('DELETE FROM user_story_favos WHERE userId = ? AND storyId = ?')
        deleteStmt.run(userId, storyId)
        
        const updateStmt = this.db.prepare('UPDATE stories SET favos = favos - 1, updatedAt = ? WHERE id = ?')
        updateStmt.run(this.now(), storyId)
        
        return false
      } else {
        // 添加收藏
        const insertStmt = this.db.prepare('INSERT INTO user_story_favos (userId, storyId) VALUES (?, ?)')
        insertStmt.run(userId, storyId)
        
        const updateStmt = this.db.prepare('UPDATE stories SET favos = favos + 1, updatedAt = ? WHERE id = ?')
        updateStmt.run(this.now(), storyId)
        
        return true
      }
    })
  }

  async checkUserUpDown(storyId: number, userId: number): Promise<{ upped: boolean, downed: boolean, favorited: boolean }> {
    const upStmt = this.db.prepare('SELECT 1 FROM user_story_ups WHERE userId = ? AND storyId = ?')
    const downStmt = this.db.prepare('SELECT 1 FROM user_story_downs WHERE userId = ? AND storyId = ?')
    const favoStmt = this.db.prepare('SELECT 1 FROM user_story_favos WHERE userId = ? AND storyId = ?')
    
    return {
      upped: Boolean(upStmt.get(userId, storyId)),
      downed: Boolean(downStmt.get(userId, storyId)),
      favorited: Boolean(favoStmt.get(userId, storyId))
    }
  }

  async incrementViews(id: number): Promise<boolean> {
    const stmt = this.db.prepare('UPDATE stories SET views = views + 1, updatedAt = ? WHERE id = ?')
    const result = stmt.run(this.now(), id)
    return result.changes > 0
  }

  async reportStory(id: number): Promise<boolean> {
    const stmt = this.db.prepare('UPDATE stories SET reported = reported + 1, updatedAt = ? WHERE id = ?')
    const result = stmt.run(this.now(), id)
    return result.changes > 0
  }

  async updateStatus(id: number, status: 'allow' | 'deny'): Promise<boolean> {
    return this.updateRecord('stories', id, { status })
  }

  async getStoryCount(): Promise<number> {
    return this.count('stories')
  }

  async getStoryCountByOwner(ownerId: number): Promise<number> {
    return this.count('stories', { owner: ownerId })
  }

  // 私有辅助方法
  private updateRecord(table: string, id: number, data: Record<string, any>): boolean {
    return super.updateTable(table, id, data)
  }

  private deleteRecord(table: string, id: number): boolean {
    return super.deleteTable(table, id)
  }
}