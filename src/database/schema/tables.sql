-- 用户表
CREATE TABLE IF NOT EXISTS users (
    userId INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT DEFAULT '',
    email TEXT UNIQUE,
    phone TEXT NOT NULL UNIQUE,
    digit TEXT NOT NULL UNIQUE,
    password TEXT,
    paypassword TEXT,
    avatar TEXT DEFAULT 'http://ilockup.oss-cn-hangzhou.aliyuncs.com/publickavatar.png',
    language TEXT DEFAULT 'zh-Hans',
    status TEXT DEFAULT 'allow' CHECK (status IN ('allow', 'deny')),
    online INTEGER DEFAULT 0,
    reported INTEGER DEFAULT 0,
    role TEXT DEFAULT 'normal' CHECK (role IN ('normal', 'advance', 'admin')),
    gender TEXT DEFAULT '保密' CHECK (gender IN ('男', '女', '保密')),
    age INTEGER DEFAULT 19,
    level INTEGER DEFAULT 0,
    memo TEXT DEFAULT '',
    points INTEGER DEFAULT 0,
    goldpoints INTEGER DEFAULT 0,
    totalearned INTEGER DEFAULT 0,
    createdAt INTEGER DEFAULT (strftime('%s', 'now')),
    updatedAt INTEGER DEFAULT (strftime('%s', 'now'))
);

-- 故事表
CREATE TABLE IF NOT EXISTS stories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    content TEXT,
    anonymous INTEGER DEFAULT 0,
    language TEXT,
    ups INTEGER DEFAULT 0,
    downs INTEGER DEFAULT 0,
    favos INTEGER DEFAULT 0,
    views INTEGER DEFAULT 0,
    reported INTEGER DEFAULT 0,
    status TEXT DEFAULT 'allow' CHECK (status IN ('allow', 'deny')),
    owner INTEGER NOT NULL,
    createdAt INTEGER DEFAULT (strftime('%s', 'now')),
    updatedAt INTEGER DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (owner) REFERENCES users (userId)
);

-- 交易表
CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sn TEXT,
    fromUser INTEGER NOT NULL,
    toUser INTEGER NOT NULL,
    serial INTEGER NOT NULL,
    point INTEGER NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'password', 'fail', 'success', 'refuse')),
    createdAt INTEGER DEFAULT (strftime('%s', 'now')),
    updatedAt INTEGER DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (fromUser) REFERENCES users (userId),
    FOREIGN KEY (toUser) REFERENCES users (userId),
    FOREIGN KEY (serial) REFERENCES payserials (id)
);

-- 积分流水表
CREATE TABLE IF NOT EXISTS pointracks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sn TEXT,
    points INTEGER NOT NULL,
    owner INTEGER NOT NULL,
    detail TEXT DEFAULT '无',
    channel TEXT NOT NULL CHECK (channel IN (
        'just_reward', 'outer_banner_show', 'outer_banner_click', 'outer_screen_show', 
        'outer_screen_click', 'outer_screen_click_video', 'outer_rewardvideo_show', 
        'outer_rewardvideo_click', 'inner_txt_show', 'inner_txt_click', 'inner_img_show', 
        'inner_img_click', 'inner_video_show', 'inner_video_click', 'game_play', 
        'game_defeat', 'game_victory', 'shopping', 'promotion', 'envelop'
    )),
    createdAt INTEGER DEFAULT (strftime('%s', 'now')),
    updatedAt INTEGER DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (owner) REFERENCES users (userId)
);

-- 支付序列号表
CREATE TABLE IF NOT EXISTS payserials (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sn TEXT,
    owner INTEGER NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'expired')),
    createdAt INTEGER DEFAULT (strftime('%s', 'now')),
    updatedAt INTEGER DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (owner) REFERENCES users (userId)
);

-- 提现表
CREATE TABLE IF NOT EXISTS cashouts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sn TEXT,
    owner INTEGER NOT NULL,
    points INTEGER NOT NULL,
    alipayAccount TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'rejected')),
    memo TEXT DEFAULT '',
    createdAt INTEGER DEFAULT (strftime('%s', 'now')),
    updatedAt INTEGER DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (owner) REFERENCES users (userId)
);

-- 评论表
CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content TEXT,
    anonymous INTEGER DEFAULT 0,
    ups INTEGER DEFAULT 0,
    reported INTEGER DEFAULT 0,
    status TEXT DEFAULT 'allow' CHECK (status IN ('allow', 'deny')),
    owner INTEGER NOT NULL,
    story INTEGER NOT NULL,
    replyto INTEGER,
    createdAt INTEGER DEFAULT (strftime('%s', 'now')),
    updatedAt INTEGER DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (owner) REFERENCES users (userId),
    FOREIGN KEY (story) REFERENCES stories (id),
    FOREIGN KEY (replyto) REFERENCES users (userId)
);

-- 图片表
CREATE TABLE IF NOT EXISTS photos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    url TEXT NOT NULL,
    story INTEGER,
    owner INTEGER NOT NULL,
    createdAt INTEGER DEFAULT (strftime('%s', 'now')),
    updatedAt INTEGER DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (story) REFERENCES stories (id),
    FOREIGN KEY (owner) REFERENCES users (userId)
);

-- 设备表
CREATE TABLE IF NOT EXISTS devices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    deviceId TEXT NOT NULL UNIQUE,
    deviceType TEXT,
    deviceModel TEXT,
    systemVersion TEXT,
    appVersion TEXT,
    registrationId TEXT,
    owner INTEGER NOT NULL,
    createdAt INTEGER DEFAULT (strftime('%s', 'now')),
    updatedAt INTEGER DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (owner) REFERENCES users (userId)
);

-- 签到表
CREATE TABLE IF NOT EXISTS daysigns (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    owner INTEGER NOT NULL,
    signDate TEXT NOT NULL,
    consecutive INTEGER DEFAULT 1,
    reward INTEGER DEFAULT 0,
    createdAt INTEGER DEFAULT (strftime('%s', 'now')),
    updatedAt INTEGER DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (owner) REFERENCES users (userId),
    UNIQUE(owner, signDate)
);

-- 每日积分表
CREATE TABLE IF NOT EXISTS pointrackdailys (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    owner INTEGER NOT NULL,
    date TEXT NOT NULL,
    golden INTEGER DEFAULT 0,
    createdAt INTEGER DEFAULT (strftime('%s', 'now')),
    updatedAt INTEGER DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (owner) REFERENCES users (userId),
    UNIQUE(owner, date)
);

-- 推送消息表
CREATE TABLE IF NOT EXISTS pushnotes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    target INTEGER NOT NULL,
    status TEXT DEFAULT 'unread' CHECK (status IN ('unread', 'read')),
    type TEXT DEFAULT 'system' CHECK (type IN ('system', 'personal', 'activity')),
    createdAt INTEGER DEFAULT (strftime('%s', 'now')),
    updatedAt INTEGER DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (target) REFERENCES users (userId)
);

-- 抽奖表
CREATE TABLE IF NOT EXISTS lotteries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    owner INTEGER NOT NULL,
    type TEXT NOT NULL,
    reward INTEGER NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'claimed')),
    createdAt INTEGER DEFAULT (strftime('%s', 'now')),
    updatedAt INTEGER DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (owner) REFERENCES users (userId)
);

-- Wiki表
CREATE TABLE IF NOT EXISTS wikis (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT,
    status TEXT DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
    createdAt INTEGER DEFAULT (strftime('%s', 'now')),
    updatedAt INTEGER DEFAULT (strftime('%s', 'now'))
);

-- 聊天群组表
CREATE TABLE IF NOT EXISTS chatgroups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    avatar TEXT,
    memberCount INTEGER DEFAULT 0,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    createdAt INTEGER DEFAULT (strftime('%s', 'now')),
    updatedAt INTEGER DEFAULT (strftime('%s', 'now'))
);

-- 特殊活动表
CREATE TABLE IF NOT EXISTS specialactivities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    imageUrl TEXT,
    startTime INTEGER,
    endTime INTEGER,
    views INTEGER DEFAULT 0,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'ended')),
    createdAt INTEGER DEFAULT (strftime('%s', 'now')),
    updatedAt INTEGER DEFAULT (strftime('%s', 'now'))
);

-- 步数捐赠表
CREATE TABLE IF NOT EXISTS stepdonations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    owner INTEGER NOT NULL,
    steps INTEGER NOT NULL,
    date TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
    createdAt INTEGER DEFAULT (strftime('%s', 'now')),
    updatedAt INTEGER DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (owner) REFERENCES users (userId)
);

-- 公告表
CREATE TABLE IF NOT EXISTS anouncements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    type TEXT DEFAULT 'general' CHECK (type IN ('general', 'urgent', 'maintenance')),
    creator INTEGER NOT NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    createdAt INTEGER DEFAULT (strftime('%s', 'now')),
    updatedAt INTEGER DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (creator) REFERENCES users (userId)
);

-- 紧急版本表
CREATE TABLE IF NOT EXISTS emergencyversions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    version TEXT NOT NULL,
    platform TEXT NOT NULL CHECK (platform IN ('ios', 'android')),
    forceUpdate INTEGER DEFAULT 0,
    updateUrl TEXT,
    description TEXT,
    creator INTEGER NOT NULL,
    createdAt INTEGER DEFAULT (strftime('%s', 'now')),
    updatedAt INTEGER DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (creator) REFERENCES users (userId)
);

-- 移动应用表
CREATE TABLE IF NOT EXISTS mobileapps (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    iconUrl TEXT,
    downloadUrl TEXT,
    version TEXT,
    platform TEXT CHECK (platform IN ('ios', 'android', 'both')),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    createdAt INTEGER DEFAULT (strftime('%s', 'now')),
    updatedAt INTEGER DEFAULT (strftime('%s', 'now'))
);

-- 挖矿入口表
CREATE TABLE IF NOT EXISTS digentries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    iconUrl TEXT,
    url TEXT,
    reward INTEGER DEFAULT 0,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    createdAt INTEGER DEFAULT (strftime('%s', 'now')),
    updatedAt INTEGER DEFAULT (strftime('%s', 'now'))
);

-- 兑换入口表
CREATE TABLE IF NOT EXISTS redeeentries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    iconUrl TEXT,
    url TEXT,
    cost INTEGER DEFAULT 0,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    createdAt INTEGER DEFAULT (strftime('%s', 'now')),
    updatedAt INTEGER DEFAULT (strftime('%s', 'now'))
);

-- 应用推广销售表
CREATE TABLE IF NOT EXISTS appromosales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    appName TEXT NOT NULL,
    appIcon TEXT,
    appUrl TEXT,
    price REAL NOT NULL,
    commission REAL DEFAULT 0,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    createdAt INTEGER DEFAULT (strftime('%s', 'now')),
    updatedAt INTEGER DEFAULT (strftime('%s', 'now'))
);

-- 应用推广码表
CREATE TABLE IF NOT EXISTS appromocodes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT NOT NULL UNIQUE,
    sale INTEGER NOT NULL,
    buyer INTEGER NOT NULL,
    recommender INTEGER,
    status TEXT DEFAULT 'unused' CHECK (status IN ('unused', 'used', 'expired')),
    createdAt INTEGER DEFAULT (strftime('%s', 'now')),
    updatedAt INTEGER DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (sale) REFERENCES appromosales (id),
    FOREIGN KEY (buyer) REFERENCES users (userId),
    FOREIGN KEY (recommender) REFERENCES users (userId)
);

-- 应用推广设备表
CREATE TABLE IF NOT EXISTS appromodevices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code INTEGER NOT NULL,
    owner INTEGER NOT NULL,
    deviceId TEXT NOT NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    createdAt INTEGER DEFAULT (strftime('%s', 'now')),
    updatedAt INTEGER DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (code) REFERENCES appromocodes (id),
    FOREIGN KEY (owner) REFERENCES users (userId)
);

-- 静态页面表
CREATE TABLE IF NOT EXISTS statichtmls (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL CHECK (type IN ('privacy', 'eula', 'terms')),
    content TEXT NOT NULL,
    version TEXT DEFAULT '1.0',
    createdAt INTEGER DEFAULT (strftime('%s', 'now')),
    updatedAt INTEGER DEFAULT (strftime('%s', 'now'))
);

-- 垃圾检查表
CREATE TABLE IF NOT EXISTS spamchecks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    keyword TEXT NOT NULL UNIQUE,
    type TEXT DEFAULT 'blacklist' CHECK (type IN ('blacklist', 'whitelist')),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    createdAt INTEGER DEFAULT (strftime('%s', 'now')),
    updatedAt INTEGER DEFAULT (strftime('%s', 'now'))
);

-- 分享方式表
CREATE TABLE IF NOT EXISTS sharemethods (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL,
    config TEXT, -- JSON配置
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    createdAt INTEGER DEFAULT (strftime('%s', 'now')),
    updatedAt INTEGER DEFAULT (strftime('%s', 'now'))
);

-- 积分奖励配置表
CREATE TABLE IF NOT EXISTS pointawardconfigs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    configKey TEXT NOT NULL UNIQUE,
    configValue TEXT NOT NULL,
    description TEXT,
    creator INTEGER NOT NULL,
    createdAt INTEGER DEFAULT (strftime('%s', 'now')),
    updatedAt INTEGER DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (creator) REFERENCES users (userId)
);

-- 金融配置表
CREATE TABLE IF NOT EXISTS financeconfigs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    configKey TEXT NOT NULL UNIQUE,
    configValue TEXT NOT NULL,
    description TEXT,
    creator INTEGER NOT NULL,
    createdAt INTEGER DEFAULT (strftime('%s', 'now')),
    updatedAt INTEGER DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (creator) REFERENCES users (userId)
);

-- 金币配置表
CREATE TABLE IF NOT EXISTS goldconfigs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    configKey TEXT NOT NULL UNIQUE,
    configValue TEXT NOT NULL,
    description TEXT,
    creator INTEGER NOT NULL,
    createdAt INTEGER DEFAULT (strftime('%s', 'now')),
    updatedAt INTEGER DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (creator) REFERENCES users (userId)
);

-- 抽奖配置表
CREATE TABLE IF NOT EXISTS lotteryconfigs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    configKey TEXT NOT NULL UNIQUE,
    configValue TEXT NOT NULL,
    description TEXT,
    creator INTEGER NOT NULL,
    createdAt INTEGER DEFAULT (strftime('%s', 'now')),
    updatedAt INTEGER DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (creator) REFERENCES users (userId)
);

-- 多对多关联表
-- 用户故事顶踩关联表
CREATE TABLE IF NOT EXISTS user_story_ups (
    userId INTEGER,
    storyId INTEGER,
    createdAt INTEGER DEFAULT (strftime('%s', 'now')),
    PRIMARY KEY (userId, storyId),
    FOREIGN KEY (userId) REFERENCES users (userId) ON DELETE CASCADE,
    FOREIGN KEY (storyId) REFERENCES stories (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS user_story_downs (
    userId INTEGER,
    storyId INTEGER,
    createdAt INTEGER DEFAULT (strftime('%s', 'now')),
    PRIMARY KEY (userId, storyId),
    FOREIGN KEY (userId) REFERENCES users (userId) ON DELETE CASCADE,
    FOREIGN KEY (storyId) REFERENCES stories (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS user_story_favos (
    userId INTEGER,
    storyId INTEGER,
    createdAt INTEGER DEFAULT (strftime('%s', 'now')),
    PRIMARY KEY (userId, storyId),
    FOREIGN KEY (userId) REFERENCES users (userId) ON DELETE CASCADE,
    FOREIGN KEY (storyId) REFERENCES stories (id) ON DELETE CASCADE
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_users_phone ON users (phone);
CREATE INDEX IF NOT EXISTS idx_users_digit ON users (digit);
CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);
CREATE INDEX IF NOT EXISTS idx_users_status ON users (status);

CREATE INDEX IF NOT EXISTS idx_stories_owner ON stories (owner);
CREATE INDEX IF NOT EXISTS idx_stories_status ON stories (status);
CREATE INDEX IF NOT EXISTS idx_stories_created ON stories (createdAt);

CREATE INDEX IF NOT EXISTS idx_transactions_from ON transactions (fromUser);
CREATE INDEX IF NOT EXISTS idx_transactions_to ON transactions (toUser);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions (status);

CREATE INDEX IF NOT EXISTS idx_pointracks_owner ON pointracks (owner);
CREATE INDEX IF NOT EXISTS idx_pointracks_channel ON pointracks (channel);
CREATE INDEX IF NOT EXISTS idx_pointracks_created ON pointracks (createdAt);

CREATE INDEX IF NOT EXISTS idx_comments_story ON comments (story);
CREATE INDEX IF NOT EXISTS idx_comments_owner ON comments (owner);

CREATE INDEX IF NOT EXISTS idx_devices_owner ON devices (owner);
CREATE INDEX IF NOT EXISTS idx_devices_deviceid ON devices (deviceId);

CREATE INDEX IF NOT EXISTS idx_daysigns_owner ON daysigns (owner);
CREATE INDEX IF NOT EXISTS idx_daysigns_date ON daysigns (signDate);

CREATE INDEX IF NOT EXISTS idx_pushnotes_target ON pushnotes (target);
CREATE INDEX IF NOT EXISTS idx_pushnotes_status ON pushnotes (status);