export interface User {
  userId: number
  name: string
  email?: string
  phone: string
  digit: string
  password?: string
  paypassword?: string
  avatar: string
  language: string
  status: 'allow' | 'deny'
  online: boolean
  reported: number
  role: 'normal' | 'advance' | 'admin'
  gender: '男' | '女' | '保密'
  age: number
  level: number
  memo: string
  points: number
  goldpoints: number
  totalearned: number
  upline?: number  // 推荐人ID
  createdAt: number
  updatedAt: number
}

export interface CreateUserInput {
  phone: string
  password: string
  name?: string
  email?: string
}

export interface UpdateUserInput {
  name?: string
  email?: string
  avatar?: string
  language?: string
  gender?: '男' | '女' | '保密'
  age?: number
  memo?: string
  upline?: number
}

export interface UserWithPointracks extends User {
  pointracks: Array<{
    id: number
    points: number
    detail: string
    channel: string
    createdAt: number
  }>
}