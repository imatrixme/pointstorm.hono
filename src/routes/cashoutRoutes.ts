import { Hono } from 'hono'
import { CashoutController } from '@/controllers/CashoutController'
import { policies } from '@/middleware/policies'

const cashoutRoutes = new Hono()

// 懒加载控制器
function getController() {
  return new CashoutController()
}

// 创建提现申请（需要用户认证）
cashoutRoutes.post('/create', ...policies.normal(), (c) => getController().createCashout(c))

// 获取提现记录（需要用户认证）
cashoutRoutes.get('/index', ...policies.normal(), (c) => getController().getCashoutHistory(c))

// 处理提现申请（需要管理员权限）
cashoutRoutes.post('/process', ...policies.admin(), (c) => getController().processCashout(c))

// 获取提现统计（需要用户认证）
cashoutRoutes.get('/stats', ...policies.normal(), (c) => getController().getCashoutStats(c))

// 取消提现申请（需要用户认证）
cashoutRoutes.post('/cancel', ...policies.normal(), (c) => getController().cancelCashout(c))

export { cashoutRoutes }