export const APP_CONFIG = {
  // 服务配置
  port: parseInt(process.env.PORT || '3000'),
  env: process.env.NODE_ENV || 'development',
  
  // 数据库配置
  database: {
    path: process.env.DB_PATH || './data/pointstorm.db',
    type: process.env.DB_TYPE || 'sqlite' // sqlite | pocketbase
  },

  // 服务配置
  services: {
    // 七牛云配置
    qiniu: {
      accessKey: process.env.QINIU_ACCESS_KEY || '',
      secretKey: process.env.QINIU_SECRET_KEY || '',
      bucket: process.env.QINIU_BUCKET || 'pointstorm'
    },
    
    // JPush配置
    jpush: {
      appKey: process.env.JPUSH_APP_KEY || '',
      masterSecret: process.env.JPUSH_MASTER_SECRET || ''
    }
  },

  // 系统设置
  system: {
    // 是否处于维护模式
    maintenance: process.env.SYSTEM_MAINTENANCE === 'true',
    
    // 签名验证（生产环境启用）
    requireSignature: process.env.NODE_ENV === 'production',
    
    // 默认用户头像
    defaultAvatar: 'http://ilockup.oss-cn-hangzhou.aliyuncs.com/publickavatar.png'
  }
}