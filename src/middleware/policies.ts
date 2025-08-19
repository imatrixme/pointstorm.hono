import type { MiddlewareHandler } from 'hono'
import { checkSystemServicing } from './checkSystemServicing'
import { checkUserToken } from './checkUserToken'
import { checkSignature } from './checkSignature'
import { checkUserDenied } from './checkUserDenied'
import { checkAdminRole } from './checkAdminRole'
import { APP_CONFIG } from '@/config/app'

// 中间件组合工厂
export class PolicyFactory {
  
  // 普通用户策略
  static normal(): MiddlewareHandler[] {
    const middlewares = [
      checkSystemServicing,
      checkUserToken,
      checkUserDenied
    ]

    if (APP_CONFIG.system.requireSignature) {
      middlewares.push(checkSignature)
    }

    return middlewares
  }

  // 管理员策略
  static admin(): MiddlewareHandler[] {
    const middlewares = [
      checkSystemServicing,
      checkUserToken,
      checkUserDenied,
      checkAdminRole
    ]

    if (APP_CONFIG.system.requireSignature) {
      middlewares.push(checkSignature)
    }

    return middlewares
  }

  // 公开访问策略（只检查系统维护）
  static public(): MiddlewareHandler[] {
    return [checkSystemServicing]
  }

  // 点数操作策略（需要额外的防刷验证）
  static pointOperation(): MiddlewareHandler[] {
    const middlewares = [
      checkSystemServicing,
      checkUserToken,
      checkUserDenied,
      // TODO: 添加防刷中间件 checkUserpointApiSpamed
      // TODO: 添加XToken验证 checkUserpointXToken
    ]

    if (APP_CONFIG.system.requireSignature) {
      middlewares.push(checkSignature)
    }

    return middlewares
  }
}

// 便捷导出
export const policies = {
  normal: PolicyFactory.normal,
  admin: PolicyFactory.admin,
  public: PolicyFactory.public,
  pointOperation: PolicyFactory.pointOperation
}