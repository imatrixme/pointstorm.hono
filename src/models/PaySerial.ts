export interface PaySerial {
  id: number
  sn: string           // 支付序列号
  password: string     // 支付密码
  point: number        // 积分数量
  expired: number      // 过期时间戳
  status: 'active' | 'used' | 'expired'
  user: number         // 创建用户
  createdAt: number
  updatedAt: number
}

export interface CreatePaySerialInput {
  point: number
  password: string
  expired: number
  user: number
}

export interface PaySerialWithUser extends PaySerial {
  userInfo: {
    userId: number
    name: string
    avatar?: string
    digit?: string
  }
}