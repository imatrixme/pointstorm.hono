import { Hono } from 'hono'
import { UserController } from '@/controllers/UserController'
import { policies } from '@/middleware/policies'

const userRoutes = new Hono()

// 懒加载控制器
function getController() {
  return new UserController()
}

// 公开接口（不需要认证）
userRoutes.post('/register', ...policies.public(), (c) => getController().createUser(c))
userRoutes.post('/login', ...policies.public(), (c) => getController().login(c))
userRoutes.post('/sign', ...policies.public(), (c) => getController().signInOrUp(c))

// 加密解密接口（公开）
userRoutes.get('/crypt', ...policies.public(), (c) => getController().getCrypt(c))
userRoutes.get('/decrypt', ...policies.public(), (c) => getController().getDecrypt(c))

// 需要用户认证的接口
userRoutes.post('/logout', ...policies.normal(), (c) => getController().logout(c))
userRoutes.post('/password/reset', ...policies.normal(), (c) => getController().resetPassword(c))
userRoutes.post('/paypassword/reset', ...policies.normal(), (c) => getController().resetPayPassword(c))
userRoutes.get('/getinfo', ...policies.normal(), (c) => getController().getInformation(c))
userRoutes.post('/changeinfo', ...policies.normal(), (c) => getController().changeNormalInformation(c))

// 积分相关（特殊策略）
userRoutes.post('/userpoint', ...policies.pointOperation(), (c) => getController().pointPlus(c))
userRoutes.get('/userpoint/xtoken', ...policies.pointOperation(), (c) => getController().getPointPlusXToken(c))

// 举报功能
userRoutes.post('/report', ...policies.normal(), (c) => getController().reportIllegal(c))

// 获取用户发布的故事
userRoutes.get('/stories', ...policies.normal(), (c) => getController().getOwnedStories(c))

// 绑定推荐人
userRoutes.post('/bindup', ...policies.normal(), (c) => getController().bindUplinePromotion(c))

// 七牛上传token
userRoutes.get('/upload/token', ...policies.normal(), (c) => getController().getQiniuUploadToken(c))

export { userRoutes }