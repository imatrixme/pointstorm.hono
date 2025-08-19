import { Hono } from 'hono'
import { StoryController } from '@/controllers/StoryController'
import { policies } from '@/middleware/policies'

const storyRoutes = new Hono()

// 懒加载控制器
function getController() {
  return new StoryController()
}

// 故事列表（需要用户认证以确定语言和交互状态）
storyRoutes.get('/index', ...policies.normal(), (c) => getController().indexList(c))

// 创建故事（需要用户认证）
storyRoutes.post('/create', ...policies.normal(), (c) => getController().createStory(c))

// 故事互动（需要用户认证）
storyRoutes.post('/up', ...policies.normal(), (c) => getController().upStory(c))
storyRoutes.post('/down', ...policies.normal(), (c) => getController().downStory(c))
storyRoutes.post('/favorite', ...policies.normal(), (c) => getController().favoriteStory(c))

// 举报故事（需要用户认证）
storyRoutes.post('/report', ...policies.normal(), (c) => getController().reportIllegal(c))

// 获取故事详情和评论（需要用户认证）
storyRoutes.get('/comments', ...policies.normal(), (c) => getController().getStoryComments(c))

// 删除故事（需要用户认证）
storyRoutes.post('/deleteStory', ...policies.normal(), (c) => getController().deleteStory(c))

export { storyRoutes }