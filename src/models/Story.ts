export interface Story {
  id: number
  title: string
  content: string
  anonymous: boolean
  language: string
  ups: number
  downs: number
  favos: number
  views: number
  reported: number
  status: 'allow' | 'deny'
  owner: number
  createdAt: number
  updatedAt: number
}

export interface CreateStoryInput {
  title: string
  content: string
  anonymous?: boolean
  language?: string
}

export interface UpdateStoryInput {
  title?: string
  content?: string
  anonymous?: boolean
}

export interface StoryWithOwner extends Story {
  ownerInfo: {
    userId: number
    name: string
    avatar: string
    digit: string
  }
}

export interface StoryWithDetails extends Story {
  ownerInfo: {
    userId: number
    name: string
    avatar: string
    digit: string
  }
  photos: Array<{
    id: number
    url: string
  }>
  comments: Array<{
    id: number
    content: string
    anonymous: boolean
    ups: number
    owner: number
    ownerInfo?: {
      name: string
      avatar: string
      digit: string
    }
    createdAt: number
  }>
  userInteractions?: {
    upped: boolean
    downed: boolean
    favorited: boolean
  }
}