export interface Cashout {
  id: number
  user: number         // 用户ID
  points: number       // 提现积分数量
  amount: number       // 提现金额（分）
  rate: number         // 汇率（积分:分）
  status: 'pending' | 'processing' | 'completed' | 'rejected'
  method: 'alipay' | 'wechat' | 'bank'  // 提现方式
  account: string      // 账户信息
  note?: string        // 备注信息
  admin_note?: string  // 管理员备注
  processed_at?: number // 处理时间
  createdAt: number
  updatedAt: number
}

export interface CreateCashoutInput {
  user: number
  points: number
  amount: number
  rate: number
  method: 'alipay' | 'wechat' | 'bank'
  account: string
  note?: string
}

export interface UpdateCashoutInput {
  status?: 'pending' | 'processing' | 'completed' | 'rejected'
  admin_note?: string
  processed_at?: number
}

export interface CashoutWithUser extends Cashout {
  userInfo: {
    userId: number
    name: string
    avatar?: string
    digit?: string
  }
}