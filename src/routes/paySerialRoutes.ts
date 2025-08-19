import { Hono } from 'hono'
import { PaySerialController } from '@/controllers/PaySerialController'
import { policies } from '@/middleware/policies'

const paySerialRoutes = new Hono()

// 懒加载控制器
function getController() {
  return new PaySerialController()
}

// 创建支付序列号（需要用户认证）
paySerialRoutes.post('/create', ...policies.normal(), (c) => getController().createPaySerial(c))

// 使用支付序列号（需要用户认证）
paySerialRoutes.post('/use', ...policies.normal(), (c) => getController().usePaySerial(c))

// 获取支付序列号历史（需要用户认证）
paySerialRoutes.get('/index', ...policies.normal(), (c) => getController().getPaySerialHistory(c))

export { paySerialRoutes }