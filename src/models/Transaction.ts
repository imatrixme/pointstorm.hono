export interface Transaction {
  id: number
  sn: string
  fromUser: number
  toUser: number
  serial: number
  point: number
  status: 'pending' | 'password' | 'fail' | 'success' | 'refuse'
  createdAt: number
  updatedAt: number
}

export interface CreateTransactionInput {
  toUser: number
  serial: number
  point: number
}

export interface TransactionWithUsers extends Transaction {
  fromUserInfo: {
    userId: number
    name: string
    digit: string
    avatar: string
  }
  toUserInfo: {
    userId: number
    name: string
    digit: string
    avatar: string
  }
}