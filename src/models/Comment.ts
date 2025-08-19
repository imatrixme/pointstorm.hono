export interface Comment {
  id: number
  content: string
  anonymous: boolean
  ups: number
  reported: number
  status: 'allow' | 'deny'
  owner: number
  story: number
  replyto?: number
  createdAt: number
  updatedAt: number
}

export interface CreateCommentInput {
  content: string
  story: number
  anonymous?: boolean
  replyto?: number
}

export interface UpdateCommentInput {
  content?: string
  status?: 'allow' | 'deny'
}

export interface CommentWithOwner extends Comment {
  ownerInfo: {
    userId: number
    name: string
    avatar: string
    digit: string
    anonymous?: boolean
  }
}

export interface CommentWithReply extends Comment {
  replytoInfo?: {
    userId: number
    name: string
    digit: string
  }
}