import { Hono } from 'hono'
import { PointrakController } from '@/controllers/PointrakController'
import { policies } from '@/middleware/policies'

const pointrakRoutes = new Hono()

// 懒加载控制器
function getController() {
  return new PointrakController()
}

// 获取积分流水记录（需要用户认证）
pointrakRoutes.get('/index', ...policies.normal(), (c) => getController().getPointrakHistory(c))

// 创建积分流水记录（需要管理员权限）
pointrakRoutes.post('/create', ...policies.admin(), (c) => getController().createPointrak(c))

// 获取积分统计（需要用户认证）
pointrakRoutes.get('/stats', ...policies.normal(), (c) => getController().getPointrakStats(c))

export { pointrakRoutes }