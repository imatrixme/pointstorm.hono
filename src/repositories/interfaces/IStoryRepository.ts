import type { Story, CreateStoryInput, UpdateStoryInput, StoryWithOwner, StoryWithDetails } from '@/models/Story'

export interface IStoryRepository {
  // 基础CRUD操作
  findById(id: number): Promise<Story | null>
  create(story: CreateStoryInput & { owner: number }): Promise<Story>
  update(id: number, data: UpdateStoryInput): Promise<boolean>
  delete(id: number): Promise<boolean>
  
  // 列表查询
  findAll(limit: number, offset: number, filters?: {
    owner?: number
    status?: 'allow' | 'deny'
    language?: string
  }): Promise<StoryWithOwner[]>
  
  // 用户故事
  findByOwner(ownerId: number, limit: number, offset: number): Promise<Story[]>
  
  // 关联查询
  findWithOwner(id: number): Promise<StoryWithOwner | null>
  findWithComments(id: number): Promise<StoryWithDetails | null>
  
  // 互动操作
  upStory(storyId: number, userId: number): Promise<boolean>
  downStory(storyId: number, userId: number): Promise<boolean>
  favoriteStory(storyId: number, userId: number): Promise<boolean>
  checkUserUpDown(storyId: number, userId: number): Promise<{ upped: boolean, downed: boolean, favorited: boolean }>
  
  // 浏览量
  incrementViews(id: number): Promise<boolean>
  
  // 举报
  reportStory(id: number): Promise<boolean>
  updateStatus(id: number, status: 'allow' | 'deny'): Promise<boolean>
  
  // 统计
  getStoryCount(): Promise<number>
  getStoryCountByOwner(ownerId: number): Promise<number>
}