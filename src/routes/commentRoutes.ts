import { Hono } from 'hono'
import { CommentController } from '@/controllers/CommentController'
import { policies } from '@/middleware/policies'

const commentRoutes = new Hono()

// 懒加载控制器
function getController() {
  return new CommentController()
}

// 创建评论（需要用户认证）
commentRoutes.post('/create', ...policies.normal(), (c) => getController().createComment(c))

// 获取评论列表（需要用户认证）
commentRoutes.get('/index', ...policies.normal(), (c) => getController().indexComment(c))

export { commentRoutes }