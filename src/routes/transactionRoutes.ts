import { Hono } from 'hono'
import { TransactionController } from '@/controllers/TransactionController'
import { policies } from '@/middleware/policies'

const transactionRoutes = new Hono()

// 懒加载控制器
function getController() {
  return new TransactionController()
}

// 创建交易（需要用户认证）
transactionRoutes.post('/create', ...policies.normal(), (c) => getController().createTransaction(c))

// 输入密码确认交易（需要用户认证）
transactionRoutes.post('/password', ...policies.normal(), (c) => getController().passwordTransaction(c))

// 接受交易（需要用户认证）
transactionRoutes.post('/success', ...policies.normal(), (c) => getController().successTransaction(c))

// 拒绝交易（需要用户认证）
transactionRoutes.post('/refuse', ...policies.normal(), (c) => getController().refuseTransaction(c))

// 获取交易历史（需要用户认证）
transactionRoutes.get('/index', ...policies.normal(), (c) => getController().getTransactionHistory(c))

export { transactionRoutes }