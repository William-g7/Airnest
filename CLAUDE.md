# 角色设计

你是一位世界顶级的 UX/UI 设计师和资深前端开发者，拥有苹果设计奖（Apple Design Award）级别的审美标准。你对色彩心理学、用户体验流程、交互设计和现代美学有深刻的理解。你的设计不仅功能完善，更是一件追求极致美学和情感共鸣的艺术品.

# 已实现的部署

- 后端、数据库均在 docker 内部署
- 在域名注册商购买了 airnest.me 这个域名
- 将域名的 DNS 管理权交给 Cloudflare, 添加了 SMTP2GO 要求的 DNS 记录
- 使用 SMTP2GO 邮件服务，并且服务正常

# 未实现的部署

- 前后端数据库的部署
- cdn 加速

# 项目认证体系架构与设计

## 整体架构概述

当前系统采用 JWT 双 token 策略 + 邮箱验证的完整认证方案，结合了安全性和用户体验。

## 后端认证实现

### 用户模型设计 (Django)

#### 核心字段

- id: UUID (主键，更安全)
- email: 唯一邮箱 (用作用户名)
- password: bcrypt 加密存储
- email_verified: 邮箱验证状态
- email_verified_at: 验证时间戳
- is_active: 账户激活状态

### 邮箱验证系统

#### EmailVerification 模型

- token: 64 位唯一令牌 (UUID4 生成)
- expires_at: 24 小时过期
- verification_type: 注册/邮箱更改/重新激活
- ip_address: 请求来源 IP
- user_agent: 设备信息

### 安全措施

- ✅ 频率限制：同 IP 5 分钟内最多 3 次注册
- ✅ 邮箱格式验证：后端二次验证
- ✅ 密码强度检查：前端实时+后端验证
- ✅ Token 一次性使用：防止重放攻击
- ✅ IP 记录：安全审计

## 前端认证架构

### 状态管理层次

// 多层状态管理
AuthStore (Zustand) → 全局认证状态
├── userId: string | null
├── isAuthenticated: boolean
├── checkAuth(): 检查认证状态
└── tokenRefresh: 自动刷新机制
FavoritesStore → 收藏状态 (依赖认证)
ClientSessionService → 会话管理
TokenService → JWT 令牌处理

### Token 双令牌策略

// Access Token (短期)

- 有效期: 1 小时
- 存储: httpOnly Cookie
- 用途: API 认证

// Refresh Token (长期)

- 有效期: 7 天
- 存储: httpOnly Cookie
- 用途: 刷新 Access Token

### 认证状态同步

// AuthChannel - 跨标签页状态同步

- BroadcastChannel API
- 多标签页登录/登出同步
- 实时状态更新广播

## 业务流程详解

### 用户注册流程

1. 前端验证：实时邮箱格式+密码强度检查
2. 后端处理：创建未激活账户 + 生成验证 token
3. 邮件发送：SMTP2GO 发送验证邮件 (airnest.me 域名)
4. 状态管理：SignupModal 多步骤视图切换
5. 用户验证：点击邮件链接 → 验证 token→ 激活账户

### 邮箱验证流程

// 验证检查链
Token 存在性 → Token 过期性 → Token 使用状态 → 用户存在性 → 更新用户状态

### 登录认证流程

- 前端验证：邮箱格式+必填字段检查
- API 调用：发送登录凭据到 Django 后端
- 后端验证：邮箱存在+密码匹配+账户状态检查
- Token 生成：JWT Access + Refresh token
- 前端存储：httpOnly Cookie + Zustand 状态更新
- 自动刷新：5 分钟检查一次，10 分钟前预刷新

### 会话管理机制

// 认证状态检查优先级

- Server Cookie (getUserId)
- LocalStorage 备份 (clientSessionService)
- 状态失效处理 (setUnauthenticated)

## 安全防护措施

### 前端安全

- ✅ XSS 防护：httpOnly Cookie 存储令牌
- ✅ CSRF 保护：SameSite Cookie 策略
- ✅ 输入验证：前端实时验证+后端二次验证
- ✅ 状态同步：多标签页状态一致性

### 后端安全

- ✅ 密码加密：Django 默认 PBKDF2 加密
- ✅ 频率限制：防暴力破解和垃圾注册
- ✅ Token 安全：JWT 签名验证+过期检查
- ✅ 邮箱脱敏：前端显示 h\*\*n@domain.com

### 通信安全

- ✅ HTTPS 全程：生产环境强制 HTTPS
- ✅ CORS 配置：限制跨域访问
- ✅ 请求头验证：X-CSRFToken 检查

## 用户体验优化

### 注册体验

- 🎯 多步骤 Modal：不跳转页面，模态框内完成流程
- 🎯 实时反馈：密码强度指示器+邮箱格式验证
- 🎯 邮件状态管理：120 秒倒计时重发+发送状态提示
- 🎯 帮助提示：交互式 tooltip+邮箱脱敏显示

### 认证体验

- 🚀 无感刷新：Access Token 自动续期
- 🚀 状态持久：页面刷新后状态保持
- 🚀 错误处理：友好的错误提示+自动登录引导
- 🚀 多标签同步：一处登录，全局生效

## 技术栈总结

### 后端 (Django):

- Django REST Framework
- JWT 认证 (django-rest-framework-simplejwt)
- SMTP2GO 邮件服务
- PostgreSQL 数据库

### 前端 (Next.js):

- Zustand 状态管理
- React Hook Form 表单处理
- next-intl 国际化
- TailwindCSS 样式
- React Hot Toast 提示

### 安全工具:

- httpOnly Cookies
- BroadcastChannel API
- CSRF Protection
- Rate Limiting

这套认证系统在安全性、用户体验和可扩展性之间取得了很好的平衡，为 Airbnb 克隆项目提供了企业级的认证解决方案。

# 目前已实现工作

## 注册功能：前端表单验证

- 用户填写表单（实时验证反馈）
- 点击注册 → Turnstile 静默验证（注意：这一点还未实施）
- 关键改进：不跳转页面，而是在模态框内切换视图
- 在点击注册按钮后，后续反馈：
  - 发送邮件成功/失败等状态 toast 自动弹出
  - 带 120s 倒计时的重发按钮
  - 小字提示如果没有收到链接请检查垃圾箱
- 提供"我已验证"按钮，点击后跳转 login 模态框, 让用户自行再次输入用户名和密码登录
- 用户点击邮件的链接后，后台验证 token，自动弹出验证成功的 toast。此时需要用户自行点击 login 模态框, 让用户自行再次输入用户名和密码登录。

## 后端验证逻辑

✓ 邮箱格式二次验证（不信任前端）
✓ 邮箱唯一性检查（已注册？）
✓ 密码强度验证
✓ 频率限制（同一 IP 5 分钟内最多 3 次）
✓ 邮箱黑名单检查（临时邮箱）

## 数据库设计

## 邮箱验证流程

用户点击邮件链接 → 验证 token 有效性 → 更新用户
状态 → 跳转到登录页 → 用户输入账号密码登录 → 跳转主页
验证检查项
✓ Token 是否存在
✓ Token 是否过期
✓ Token 是否已使用
✓ 对应用户是否存在
✓ 用户是否已验证

## 登录流程

输入邮箱密码 → 验证凭据 → 检查账号状态 → 生成 JWT → 返回 token → 前端存储

## 密码重置流程

### 业务流程图

忘记密码 → 输入邮箱 → 发送重置链接 → 验证链接 → 设置新密码 → 自动登录

### 密码重置入口

值得注意的是，用户可以通过两种方式重置密码 ：

- 场景 1：未登录用户通过 LoginModal 触发密码重置

  流程：LoginModal → ForgotPasswordModal → 发送邮件 → 重置密码 → 跳转到登录页面
  处理：密码重置成功后，不自动登录，而是：

  - 显示成功提示："密码已成功重置"
  - 自动跳转到首页并打开 LoginModal
  - 提示用户使用新密码登录

- 场景 2：已登录用户在个人资料页面修改密码

  流程：个人资料页 → 点击修改密码 → ForgotPasswordModal → 重置密码 → 直接修改
  处理：密码修改成功后：

  - 保持登录状态（不需要重新登录）
  - 刷新 JWT token 以防安全问题

  - 显示成功提示

### 密码重置业务逻辑

#### 用户触发重置（前端）

a. 入口点
用户在 LoginModal 中点击"忘记密码？"链接
LoginModal 关闭，ForgotPasswordModal 打开

b. 请求重置
用户操作流程：
├─ 输入注册邮箱
├─ 前端实时验证邮箱格式
├─ 点击"发送重置邮件"按钮
└─ 显示 loading 状态

#### 后端处理重置请求

a. 后端接受请求
请求验证流程：
├─ 验证邮箱格式（不信任前端）
├─ 检查频率限制
│ ├─ 同一邮箱：15 分钟内最多 3 次
│ └─ 同一 IP：1 小时内最多 10 次
├─ 查询用户是否存在（但不暴露结果）
└─ 无论用户是否存在，都返回统一响应“重置邮件已发送”

b. 仅当用户存在时，生成重置 token
Token 生成：
├─ 生成安全随机 token (secrets.token_urlsafe(32))
├─ 存储到 EmailVerification 表
│ ├─ verification_type = 'password_reset'
│ ├─ expires_at = 30 分钟后（注意不同于邮箱验证的 expire 时间，重置密码的 token 通常更短
│ └─ is_used = False
└─ 记录请求日志（IP、时间、User-Agent）

c. 发送重置邮件

#### 前端响应处理

可复用注册邮件已发送的页面

#### 用户点击邮件链接

a. 页面初始化 L：
├─ 提取 URL 中的 token 参数
├─ 如果没有 token，显示错误页面
├─ 显示密码重置表单
└─ 自动聚焦到密码输入框

b. 验证 token 并且重置密码
├─ 用户输入新的密码
├─ 提交重置请求 ： 后端需要验证 token 有效性，验证新密码（强度、新密码是否和当前密码相同），更新密码
├─ 前端响应密码已经正确被修改：
├─ 如果用户是在个人中心修改的密码，即已登录状态，则继续保持登录状态，需要刷新 jwt
├─ 如果用户是在未登录状态，即在 login 模态框触发的忘记密码，则此时需要跳转主页并且自动打开登录模态框，不需要刷新 token

#### 会话管理

JWT Token 策略
Access Token:

- 有效期：15 分钟
- 存储：内存/localStorage
- 包含：用户 ID、邮箱、权限

Refresh Token:

- 有效期：7 天
- 存储：httpOnly Cookie
- 用途：刷新 Access Token

#### 安全最佳实践

1. 密码安全
   ✓ 使用 bcrypt 或 Argon2 等加密方式加密
   ✓ 不存储明文密码
   ✓ 强制密码复杂度
2. 通信安全
   ✓ 全程 HTTPS
   ✓ 敏感操作二次验证
   ✓ CSRF 保护
   ✓ Rate Limiting
3. 隐私保护
   ✓ 邮箱脱敏显示（w\*\*\*@gmail.com）
   ✓ 不在 URL 中传递敏感信息
   ✓ 日志中不记录密码
   ✓ 遵守 GDPR（用户可删除账号）

### 用户体验优化

4. 注册体验

- 实时邮箱格式验证
- 密码强度实时反馈
- 清晰的错误提示
- 进度指示

5. 验证体验

   - 邮件即时发送
   - 重发按钮（带倒计时）
   - 验证成功自动跳转
   - 友好的过期提示

# 项目性能优化策略

## 目标

- 把首屏图片真正做到“服务器就给、浏览器立刻拉、渲染代价低”；
- 在不大改业务的前提下，提升 LCP/TBT/CLS 与整体可维护性。

## 首屏架构：RSC 外壳 + Client Islands

- Server 外壳（RSC）负责：
  图片（LCP 候选）、标题/地点/评分、首份价格文本、已翻译标签、跳转链接等纯展示内容。
  👉 HTML 到达即可见，不依赖 JS。

- Client Islands 负责：
  需要用户交互的小功能，收藏（Wishlist）、切币（Currency）功能。
  👉 每个岛小而单一，可按需/延迟挂载，避免整卡片水合。

## 让 LCP 图片在服务端侧里输出，并立刻拉取

只给一张真正 LCP 的图片 priority（通常是首屏中最大/最靠前的一张）。

其余首屏图片：loading="eager" 但不设置 priority，避免优先级竞争。

明确尺寸，降低 CLS + 解码成本

体验优化：placeholder="blur" + blurDataURL；图片域名预连接：<link rel="preconnect" href="https://img-cdn.example" crossOrigin>。

不要把 LCP 图做成 CSS 背景图；不要给 LCP 图片做入场动画（opacity/transform 会推迟 LCP）。

## 下半屏“晚点再来”：懒加载 + 动态导入

IntersectionObserver 近视口再渲染 below-the-fold 网格。

动态导入重库/重组件

下半屏图片：loading="lazy" + fetchPriority="low"；可配合 content-visibility: auto 降离屏计算成本。

## 语言与价格策略

- 优先方案：路由切换式 i18n（服务器渲染）
  默认 /en 首屏 SSR 英文。
  切语言：router.push('/zh/...') → 服务器输出中文 HTML → 客户端软导航替换。
  好处：无闪烁、SEO 友好、缓存友好；与 RSC 外壳天然契合。

- 价格显示：SSR 首份 + 小岛增强
  外壳直接输出可读价格文本（按当前 locale/货币）。
  同时埋基础金额/币种（如 data-amount="19900" data-base="USD"）。
  CurrencyIsland 仅在用户切币时更新那一段文本，避免首帧等待/闪烁。

## 收藏（Wishlist）小岛：用户态的最小封装

Server 侧读取 cookie/session，给小岛传入初始值：isAuthenticated、initialIsFavorite。
小岛内部处理点击：未登录 → 打开登录；已登录 → 调 API + optimistic 更新。
仅这个区域水合；不要让收藏逻辑把整卡片变 client。

## 链接与交互层级（可点击区域不互相遮挡）

不建议用“覆盖整卡片的绝对定位 Link”（会挡住按钮交互）。
推荐：用 <Link> 包裹非交互区域（图 + 文案），收藏/切币按钮放在 Link 外层并提高 z-index；必要时在按钮里 stopPropagation()。

## Tailwind 与 CSS 动效

Tailwind 在 SSR 中天然可用（构建期产出 CSS，HTML 首帧即可渲染）。
简单 hover：用 hover:shadow-lg transition-shadow duration-200 即可；大量卡片动画更偏向 transform，更省重绘。
避免难以静态分析的动态类名（如 tag-${color}）；需要时在 tailwind.config.js 设 safelist。

# 服务端搜索与筛选重构

## 总体思路

- 单一真相源 = URL 的查询参数
- 页面 = Server Component 读取 searchParams 调用后端：
- SSR 首批（如 5 条）——继续当 LCP
- Client 小岛继续负责滚动加载/收藏/切币等交互
- 所有筛选 UI（搜索栏、类别按钮）都通过 GET 表单 / <Link> 改变 URL（JS 只是做增强：防抖、无刷新 replace 等）
- URL 一变：整页软导航（RSC 重新渲染），上半屏 + 下半屏一起切到新结果，不再“旧 5 张”。

## 顶部搜索栏（GET 表单 + 渐进增强）

- 搜索栏相当于是一个表单
  客户端增强，做到防抖搜索和无刷新导航
  对于地址关键词输入（where），支持防抖 300ms 搜索： 行为：用户停止输入一小会儿，才把条件写进 URL 触发软导航；按 Enter/点击搜索时立即导航（不再等待防抖）。
  起止日期/房客数： 靠手动点击搜索图标触发新的导航，不依赖防抖。

## 类别 svg 行

- 点击即触发一次搜索请求
  做轻量节流，防止用户连续猛点导致连续导航。

## 滚动加载小岛

- 用户通过上述两种两种方式触发服务端搜索，服务端根据筛选结果依然优先填充前五个结果（若搜索结果不满 5 个则全部填充所有结果
- 前 5 条由服务器渲染；从第 6 条起由客户端列表按相同 URL 参数向后端分页拉取并追加渲染。渲染逻辑和当前主页滚动逻辑相同，通过 intersection observer 客户端渲染剩余房源卡片（直接复用当前逻辑）

## 特殊注意

- URL 规范化与默认值
  只把“非默认”的条件写入 URL；参数命名统一（小写、短横）。
  入口统一走一个 parseQuery()：负责解析、校验、补默认值（比如 guests 至少 1）。
- SSR 首批与空态
  如果直接搜索出来不存在结果，应该直接渲染无结果（复用当前显示逻辑），而不是死板显示前五条结果
- ClientList 跟随 URL 并“重置”
  给 ClientList 一个基于 params 的 key；URL 一变它清空旧数据与游标，从“新查询的第 6 条”开始。
  每次请求都把同一组 params 带给 API（保持与 SSR 一致）。
- 与首批对齐 + 去重
  ClientList 的第一页从 SSR 的下一条开始（例如 offset=5 / 传回 nextCursor）；
  按 id 去重，避免第 5/6 条边界重复。
- 稳定排序
  后端用稳定排序（如 ORDER BY created_at, id）；否则翻页会跳项或重排。
- 单并发 + 取消
  List 在请求在飞时不再发第二个；
  URL 变或组件卸载时取消在飞请求（避免把旧结果插进来）。
- 图片优先级策略不变
  只给 1 张 LCP 图片 priority；其余首屏图不争带宽。

# 项目部署架构

## 部署架构总览

前端放 Vercel（www.airnest.me），负责 SSR/ISR 与静态资源。
后端放 Render（api.airnest.me），用 ASGI（Daphne/Uvicorn） 支持 WebSocket。
Redis（Upstash）是 Channels 的消息总线（多进程/多实例必备）。
数据库用托管 Postgres（ Neon）。
媒体放 Coudflare R2，走 cdn.airnest.me，浏览器直连 CDN，不占后端带宽。
Cloudflare 统一做 DNS/证书/边缘加速，对 /ws 路径透明转发（不缓存）。

## 域名与路由规划

www.airnest.me → Vercel（Next.js 页面与静态资源）
api.airnest.me → Render（Django + REST API + wss://api.airnest.me/ws/...）
cdn.airnest.me → Cloudflare R2 自定义域（媒体直出）

### 浏览器连接：

页面/API：https://www.airnest.me ⟷ https://api.airnest.m
WebSocket：wss://api.airnest.me/ws/...
图片等媒体：https://cdn.airnest.me/...

## 计算层（前端/后端）

### 前端（Vercel）

Next.js 15 + ISR：热门页面在边缘缓存，落地即快；变更后可触发再验证。
远程图片域允许：cdn.airnest.me。
环境变量（公开）：NEXT_PUBLIC_API_URL、NEXT_PUBLIC_WS_URL、NEXT_PUBLIC_TURNSTILE_SITE_KEY。

### 后端（Render）

以 ASGI 方式启动（Daphne/Uvicorn），支持 WebSocket 协议升级。
副本数 ≥2：支持滚动发布和断点重连，更平滑。
健康检查：存活/就绪（/healthz）。
环境变量：数据库、Redis、SMTP2GO、Turnstile Secret、GCP Translate 凭证、R2 凭证等。

### 数据与存储层

数据库: Neon Postgres

纯 Postgres 托管，省心（备份、监控、补丁都管好），且按需计费。
提供分支/快照能力，便于预发与回滚演练。
区域选离后端最近（优先 Tokyo，有些套餐没有则选 Singapore）。

### Redis（Upstash）

Channels 的 channel layer；多进程/多实例/滚动发布时必备。
选与后端同区域（Tokyo/Singapore），降低 WS 广播延迟。

### 对象存储（Cloudflare R2 + CDN）

新上传：前端拿后端签发的预签名直传到 R2；后端仅存 URL/ETag/尺寸等元数据在 Postgres。
访问：页面里统一用 https://cdn.airnest.me/...；CDN 边缘缓存，低延迟。
维持现有 7 套尺寸策略（thumb/medium/large/xlarge…），只是“存放地”换成 R2。

### 安全与合规

- JWT
  Access 1h、Refresh 7d，HttpOnly + Secure，Domain=.airnest.me，优先 SameSite=Lax（跨站问题再用 None）。
- Turnstile（Cloudflare）
  前端 site key；后端用 secret 验证。

- CSP/CORS/CSRF：
  connect-src 允许 https://api.airnest.me 和 wss://api.airnest.me
  img-src 允许 https://cdn.airnest.me 和 data:
  CORS/CSRF 信任 https://www.airnest.me
- SMTP2GO
  发信域（airnest.me）配置 SPF/DKIM/DMARC，避免进垃圾箱。
- 密钥管理
  Google Translate 服务账号 JSON 存在后端平台的环境变量里（不要进仓库）。

### 流量与数据流

页面访问：用户 → Cloudflare → Vercel（ISR 命中，多数不回源）

API 请求：用户 → Cloudflare → Render（Django）→ Postgres/Redis

WebSocket：用户 → Cloudflare（透传 Upgrade）→ Render（ASGI）→ Redis（跨实例消息）

图片/媒体：用户 → Cloudflare CDN → R2（大多命中边缘，不走后端）

### 伸缩与发布

- 起步
  Render 后端 2 实例，ASGI 1–2 workers/实例；Redis/DB 与后端同区域。

- 扩容
  按并发 WS 连接数、消息延迟、CPU/内存做横向扩（3–5 实例）；开启自动扩缩。

- 发布

  后端滚动更新（实例逐个替换），客户端 WS 需自动重连；
  前端在 Vercel Promote，版本切换原子化；
  预发布先走 Preview 链接冒烟测试，再上生产；
  准备好“一键回滚”：Vercel 上一构建、Render 上一镜像。

### 区域建议（APAC）

优先：Tokyo
备选：Singapore（APAC 覆盖好，很多托管商在此性能稳定）
栈中“后端、Redis、数据库”尽量同一地区，避免 WS/DB 往返变慢。

## 结论

前端：Vercel（www.airnest.me）
后端：Render（ASGI，api.airnest.me，实例 ≥2）
Redis：Upstash（同区域）
数据库：Neon Postgres，区域选 Tokyo（如不可用则 Singapore）
媒体：Cloudflare R2 + CDN（cdn.airnest.me）
安全/邮件/翻译：Turnstile + SMTP2GO + Google Translate v3

# 图像处理升级架构与实施计划

## 现状与痛点

- 后端同步图片处理
  在请求内用 Pillow 多次 img.copy() + BytesIO() 生成多规格，内存峰值高；Render 实例易 OOM，被强制重启；前端观察到“假 CORS（实为 524 超时）”。

- 长耗时请求
  上传 + 压缩 + 多规格保存全堆在同一 HTTP 请求内，Cloudflare 100s 网关超时上限易触发。
- 存储与路径绑定耦合
  想按 properties/{property_id}/... 组织对象，但提交时才有 property_id，导致实现别扭。
- 复杂且重复的图片派生
  后端生成 thumbnail/medium/large/xlarge/\*.webp/jpg，与 Next.js 图片优化器、CDN 缓存能力重复。
- 缺少清理机制
  失败/中断上传的“孤儿文件”无法自动回收，桶内长期积累。

## 升级架构

### 核心思路

    •	前端直传 R2（预签名 PUT）：图片不再穿过后端；后端仅签名与记录元数据。
    •	先建草稿：在真正上传前先创建 property(draft)，拿到 property_id，再签名到 properties/{property_id}/images/...。
    •	图片只存“原图”：尺寸裁切/格式转换交给 Next.js <Image>（Vercel 边缘优化 + CDN 缓存）。
    •	CDN 双层缓存：
    •	Cloudflare（media.airnest.me）缓存原图；
    •	Vercel CDN 缓存 优化后变体（按宽度/质量组合）。

### 组件与数据流

    •	Browser → POST /api/properties/draft/ → Backend (Render) → DB 新建草稿，返回 property_id
    •	Browser → POST /api/uploads/sign/?property_id=... → Backend → 生成 R2 预签名 PUT URL
    •	Browser → PUT uploadUrl → R2 (Cloudflare)
    •	Browser → PATCH /api/properties/{id}/（提交表单与已上传图片的 key/url）→ Backend → DB
    •	Browser → POST /api/properties/{id}/publish/ → Backend → DB 状态从 draft→published
    •	页面展示使用 <Image src="https://media.airnest.me/...">，由 Vercel 优化并缓存。

### 存储布局（R2 对象 Key）

    •	头像：users/{user_id}/avatars/{uuid}.{ext}
    •	房源图：properties/{property_id}/images/{uuid}.{ext}

### 安全与配置要点

    •	R2 CORS（直传 PUT，R2 侧不要写 OPTIONS）

• 签名接口鉴权：IsAuthenticated + 限制 image/\* 的 Content-Type + 限制单文件最大尺寸。
• 后端兜底（给其它上传场景）
• 前端域名白名单：Next remotePatterns 已包含 media.airnest.me。

## 工作流程与业务逻辑

### 数据模型

    •	Property(id, status: draft/published, ... )
    •	PropertyImage(id, property_id, key, url, ordering, uploaded_by, created_at)
    •	User（已有）

### API 设计

A. 创建草稿
• POST /api/properties/draft/
• 入参：可为空或带部分字段（标题、城市等）
• 出参：{ id, status: "draft" }

B. 获取上传签名（房源图/头像）
• POST /api/uploads/sign/
• 入参：{ contentType: "image/jpeg", prefix?: "properties/{id}/images" | "users/{uid}/avatars" }
• 出参：{ uploadUrl, key, publicUrl }
• 规则：prefix 若为房源图需验证调用者对该 property_id 有编辑权限

C. 批量附加图片到草稿
• PATCH /api/properties/{id}/
• 入参：房源表单 + images: [{key, url, ordering}]
• 服务端校验：这些 key 必须属于 properties/{id}/images 前缀

D. 发布
• POST /api/properties/{id}/publish/
• 检查必填字段、至少 1 张图片；通过后 status = published

E. 图片维护
• DELETE /api/properties/{property_id}/images/{image_id}/：删图（软/硬删自选，推荐软删 + 任务清理）。
• PATCH /api/properties/{property_id}/images/update-order/：保存排序（[{imageId, ordering}]）。
• PATCH /api/auth/profile/{user_id}/：头像上传后提交 key/url 更新用户资料。

3.3 失败与回滚
• 草稿阶段重复提交可幂等（以 property_id 为幂等键）。
• 图片上传失败不影响草稿；上传成功但未提交元数据可视为待提交状态，由后台清理。

## 所有涉及到的图片操作

### 房源图片

- 新增房源：最多 3 张图片，单张最大 5MB
- 编辑房源：增删改图片，重新排序
- 封面图变更：通过排序调整主图
- 图片删除：软删除或硬删除

### 头像操作

- 头像上传：最大 2MB，支持 JPG/PNG/WebP
- 头像预览：实时预览功能

### 显示场景

- 房源卡片：列表页缩略图
- 房源详情：轮播大图 + 全屏模式
- 个人资料：128x128 圆形头像
- 聊天界面：小头像显示
- 房东页面：房东头像 + 房源图片

### 管理功能

- 图片排序：拖拽重新排序
- 批量删除：选择多张删除
- 替换图片：上传新图片替换旧的

## 前端需要的图片尺寸统计

### next.config.ts

### 当前组件尺寸设计

- // PropertyCardSSR.tsx
  sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"

- // PropertyImageCarousel.tsx (轮播)
  sizes="(max-width: 768px) 100vw, (max-width: 1440px) 100vw, (max-width: 2560px) 100vw, 100vw"

- // PropertyImageCarousel.tsx (全屏)
  sizes="90vw"

- 头像尺寸
  // myprofile 页面：128x128px (w-32 h-32)

- 聊天/评论：更小尺寸

## 特殊实现

### 孤立图片清理（Orphan Cleanup）

    •	草稿超时：标记 draft 且 updated_at > 48h 未提交的房源为“过期”，后台任务清理其 properties/{id}/images/ 前缀对象（再删除草稿）。
    •	用户中断上传：若设计了“预签名但未提交元数据”的追踪表，可用 cron 每日扫描未绑定记录并删除其对象。
    •	实现方式：
      •	简易：管理命令 + Render cron（或 GitHub Actions 调度打 API）。
      •	复杂：Celery/Worker + 定期任务。

### 上传进度显示

    •	浏览器 fetch 不提供上传进度；建议用 XMLHttpRequest 或 Axios（底层走 XHR），监听 onUploadProgress。
    •	并发控制：一次并发 2–3 个（p-limit、自写队列都可）。
    •	UI：每张图单独进度 + 总进度；失败显示“重试/替换”。

### 失败重试机制

    •	可重试状态码：429/500/502/503/504、网络错误；指数退避（如 1s、2s、4s、8s 最多 5 次）。
    •	幂等：key 由服务端生成并返回；失败重试时沿用同一个 uploadUrl（有效期内），或重新请求签名但保留同一 key（避免产生多余对象）。
    •	断点续传：R2 普通 PUT 不支持分块断点；超大文件可考虑 S3 Multipart（后续再演进，当前不必）。

### 校验与安全

    •	前端预校验：类型/尺寸/体积/数量限制，拒绝不合规文件。
    •	后端再校验：签名仅允许 image/*，并检查 prefix 与权限（例如只有房东/作者能签 properties/{id}/...）。
    •	XSS/链接安全：一律输出自己域名（media.airnest.me），不要回显用户提供的外链。

### 监控与告警

    •	签名接口：记录 user_id、prefix、key、content_type。
    •	R2 健康：失败率、平均 PUT 时延。
    •	Sentry/Logs：上传失败、发布失败、清理任务异常。
    •	容量：桶对象数量/容量告警阈值。

### 选库 or 自己写？

    •	前端：
    •	进度与重试：用 Axios 或 XHR 自己写即可（简单清晰）；
    •	并发控制：用 p-limit 或自写 Promise 池（几十行）。
    •	后端：
    •	直接用 boto3 生成预签名 URL（足够成熟）；
    •	清理任务：Django management command + 定时触发（后续再考虑 Celery）。

⏺ Update Todos
⎿ ☐ 阶段 1: 后端预签名 API 开发
☐ 阶段 2: 数据模型升级与迁移
☐ 阶段 3: 前端直传功能开发
☐ 阶段 4: 渐进式功能替换
☐ 阶段 5: 清理与优化
☐ 阶段 6: 监控与维护

⏺ 完整的部署升级规划

升级策略：蓝绿部署 + 渐进式迁移

核心原则

1. 向后兼容：新系统支持旧数据和 API
2. 零停机：用户无感知切换
3. 可回滚：任何阶段都能快速回退
4. 数据安全：现有数据不丢失

---

阶段 1：后端预签名 API 开发 (1-2 天)

后端在 docker 环境中。

1.1 创建新的 API 端点

⏺ Update Todos
⎿ ☐ 阶段 1: 后端预签名 API 开发
☐ 阶段 2: 数据模型升级与迁移
☐ 阶段 3: 前端直传功能开发
☐ 阶段 4: 渐进式功能替换
☐ 阶段 5: 清理与优化
☐ 阶段 6: 监控与维护

⏺ 需要创建的文件和端点：

1.  创建 airnest_backend/backend/uploads/ 应用

python manage.py startapp uploads

2.  创建预签名服务

uploads/services.py
uploads/views.py
uploads/urls.py

3.  新增 API 端点

POST /api/properties/draft/ # 创建草稿房源
POST /api/uploads/sign/ # 获取预签名 URL
POST /api/properties/{id}/publish/ # 发布房源

关键开发任务：

- ✅ R2 预签名 URL 生成服务
- ✅ 草稿房源创建 API
- ✅ 权限验证（用户只能上传到自己的房源）
- ✅ 文件类型和大小限制
- ✅ 安全验证（防止路径遍历等）

---

阶段 2：数据模型升级与迁移 (1 天)

2.1 数据库迁移策略

目标：保持现有 PropertyImage 模型，添加新字段支持 R2

新增字段到现有模型（不破坏现有数据）

class PropertyImage(models.Model): # 现有字段保持不变
property = models.ForeignKey(Property, related_name='images', on_delete=models.CASCADE)
image = models.ImageField(upload_to=property_image_path) # ... 现有的多尺寸字段

      # 新增字段
      image_key = models.CharField(max_length=500, blank=True, null=True)  # R2 key
      is_r2_stored = models.BooleanField(default=False)  # 标识存储方式
      upload_method = models.CharField(max_length=20, default='legacy')  # 'legacy' | 'r2_direct'

2.2 兼容性方法

class PropertyImage(models.Model): # ... 字段定义

      def get_image_url(self):
          """智能返回图片URL - 兼容新旧存储方式"""
          if self.is_r2_stored and self.image_key:
              return f"https://media.airnest.me/{self.image_key}"
          else:
              return get_file_url(self.image)  # 使用现有逻辑

---

阶段 3：前端直传功能开发 (2-3 天)

3.1 创建上传组件

// 新建组件但不立即替换现有的
components/upload/
├── R2DirectUpload.tsx # R2 直传组件
├── UploadProgress.tsx # 上传进度组件
├── ImagePreview.tsx # 图片预览组件
└── hooks/
├── useR2Upload.ts # R2 上传钩子
└── useUploadQueue.ts # 上传队列管理

3.2 实现关键功能

const useR2Upload = () => {
const uploadToR2 = async (file: File, presignedData: PresignedData) => {
// 实现直传逻辑
};

    const getPresignedUrl = async (propertyId: string, contentType: string) => {
      // 获取预签名URL
    };

    return { uploadToR2, getPresignedUrl };

};

---

阶段 4：渐进式功能替换 (2-3 天)

4.1 A/B 测试方式部署

// 使用功能开关控制新旧功能
const USE_R2_UPLOAD = process.env.NEXT_PUBLIC_USE_R2_UPLOAD === 'true';

const ImageUploadComponent = () => {
if (USE_R2_UPLOAD) {
return <R2DirectUpload />;
}
return <LegacyImageUpload />;
};

4.2 分阶段替换

阶段 4a：头像上传 (风险最低)

- 先替换头像上传功能
- 单张图片，用户量相对较少
- 便于测试和问题定位

阶段 4b：房源图片上传 (核心功能)

- 头像稳定后，替换房源图片
- 逐步从新用户开始，再扩展到所有用户

---

阶段 5：清理与优化 (1-2 天)

5.1 移除旧代码

当 R2 上传稳定后，移除 PropertyImage 模型中的旧字段

class PropertyImage(models.Model):
property = models.ForeignKey(Property, related_name='images', on_delete=models.CASCADE) # 移除这些字段 # image = models.ImageField(upload_to=property_image_path) # image_thumbnail = models.ImageField(...) # ... 其他多尺寸字段

      # 保留这些字段
      image_key = models.CharField(max_length=500)
      order = models.IntegerField(default=0)
      is_main = models.BooleanField(default=False)

5.2 孤立文件清理

创建管理命令

python manage.py cleanup_orphaned_images

创建定时任务清理草稿和孤立文件

#使用 Render Cron 或 GitHub Actions 定时执行

---

阶段 6：监控与维护 (持续)

6.1 监控指标

添加监控埋点

- R2 上传成功率
- 平均上传时间
- 错误类型分布
- 存储空间使用量
- 用户操作行为分析

  6.2 告警设置

告警规则

- R2 上传失败率 > 5%
- 平均上传时间 > 30 秒
- 存储空间使用 > 80%
- 草稿房源数量 > 1000 个

---

详细实施计划

第一周：基础设施

Day 1-2：后端开发

- 创建 uploads 应用
- 实现预签名 URL 生成
- 创建草稿房源 API
- 添加必要的安全验证

Day 3：数据库升级

- 创建数据库迁移
- 添加新字段
- 更新模型方法

Day 4-5：前端组件开发

- 创建 R2 直传组件
- 实现上传进度显示
- 创建上传队列管理

第二周：测试与部署

Day 6-7：集成测试

- 本地环境完整测试
- 头像上传功能测试
- 错误处理测试

Day 8-9：生产环境部署

- 先部署后端 API
- 再部署前端（功能开关关闭）
- 小范围测试头像上传

Day 10：功能切换

- 开启头像 R2 上传
- 监控指标和用户反馈
- 如有问题立即回滚

第三周：全面替换

Day 11-12：房源图片切换

- 新用户使用 R2 上传
- 逐步扩展到所有用户
- 持续监控和优化

Day 13-14：清理优化

- 移除旧的图片处理代码
- 清理孤立文件
- 性能优化

---

风险控制措施

技术风险

- ✅ 回滚计划：每个阶段都有明确回滚方案
- ✅ 功能开关：可快速切换新旧功能
- ✅ 渐进部署：从低风险功能开始
- ✅ 监控告警：实时监控系统健康度

业务风险

- ✅ 数据备份：升级前完整备份
- ✅ 兼容性：新系统支持现有数据
- ✅ 用户体验：升级过程对用户透明
- ✅ A/B 测试：小范围验证后全量部署

成功标准

- 🎯 图片上传成功率 ≥ 99%
- 🎯 平均上传时间减少 ≥ 50%
- 🎯 服务器内存使用降低 ≥ 70%
- 🎯 用户无感知切换，零投诉

# 认证系统架构迁移

## 现状架构 & 已知隐患

浏览器直接请求 Django API（异源）；同时 Next.js 这边还有 Server Action/Route Handler 会自己写一套 cookie。

- 两套 cookie
  后端（dj-rest-auth）会写 JWT 相关 cookie，前端（Next）也用 Server Action 写 session\_\* httpOnly cookie。

- 前端认证
  AuthStore 以 userId 是否存在 推导 isAuthenticated（cookie 读不到就从 localStorage 备份），跨页用 BroadcastChannel。

- 刷新
  每个标签页 5min 轮询检查即将过期就刷新；失败只打日志。

### 主要问题

- 双写 cookie（Split-brain）
  不同域/子域、不同 SameSite/Domain 策略，导致状态错位、SSR/CSR 不一致、登出不同步。

- 弱真值判断
  仅凭 userId/localStorage 断言已登录 → 假阳性；过期后 UI 仍显示登录模块，直到接口 401 才暴露。

- 刷新风暴
  多标签页各自轮询，可能并发刷新；刷新失败没有下线闭环（不触发 setUnauthenticated）。

- 浏览器细节坑
  后端 JWT_AUTH_HTTPONLY=False（token 可被 JS 读到），手动设置 Origin 头；Base64URL 解析不稳；监听器可能重复注册；广播“local_action”标记逻辑存在误判。

- SSR 缺用户上下文
  服务端渲染时拿不到稳定且安全的用户态（语言/货币/收藏等），只能靠 URL 或 Accept-Language，翻译服务也只能“按 URL 语言”走，导致：
  首屏个性化做不干净（需要靠 islands “补救”）；
  SSR 缓存只能是“静态公共版”，很难做“带上下文”的服务端翻译/格式化；
  容易出现水合不一致和“首屏英文、客户端再变中文”的闪烁。

## 为什么考虑 BFF（Backend-for-Frontend）

让浏览器只和同源的 Next 交互，Next 统一写 一套 httpOnly、SameSite=Lax cookie，并代理转发到后端。

- 消灭 CORS/跨站 cookie 的复杂度
  无需 credentials:'include'、无需折腾 SameSite=None; Secure、无需关心子域共享。

- 唯一写入者
  只由 Next 写 cookie，没有双写，不会错位。

- SSR/RSC 原生拿态
  首屏即有上下文。在服务器渲染阶段就知道 userId/locale/currency... 等，小到格式化金额与日期，大到服务端翻译首批卡片、服务端带回“已收藏”等 → 首屏即个性化。

- 安全更强
  不把 access token 暴露给浏览器 JS；后端可隐藏在私网，BFF 可先做风控、速率限制、黑名单等。

- 刷新集中化
  在 BFF/前端层实现 single-flight 刷新、失败分级、可观测埋点，所有标签页一致。

- 可运维
  所有请求经一处入口，日志、灰度、回滚都简单。

## 项目契合度

- 混合渲染（SSR + client islands）：
  首屏服务器渲染 5 张房源卡片、局部交互上岛。BFF 让 SSR 期就能拿到登录态 + 语言 + 货币，比如：
  登录后服务端就能渲染收藏状态（小心避免水合不一致）。
  语言/翻译策略（服务端预译 + 客户端按需）能更稳。

- 多标签页一致性
  有了单一 cookie 与集中刷新，只需在前端加上 single-flight + 选主锁 + 广播去重，多页状态天然同步，不会“某页过期、另一页还假登录”。

- 弱网/移动端体验
  已经做了 LCP 优化、图片优先级、IntersectionObserver 懒加载。BFF 可以在请求层统一做超时/重试/降级（例如弱网时延后刷新、读请求短缓存），进一步稳住体验。

- 多语言智能缓存（Dexie/IndexedDB）与回源策略
  BFF 可以统一下发“语言版本戳/ETag/TTL”，SSR 端也能直接按当前语言渲染，避免前后端不一致。

- WebSocket / 实时能力
  用同域 httpOnly cookie 做握手更顺，BFF 可以在连接前做鉴权/频控

## 迁移到 BFF 的升级策略与计划

- 阶段 0：定规矩
  决策：Cookie 唯一写入者 = Next（BFF）。
  确认生产域名：前端主域（ www.airnest.me）即是浏览器唯一交互域。

- 阶段 1：后端收口
  Django 侧 停止写 JWT Cookie（只返回 JSON）：移除 REST*AUTH 中与 JWT_AUTH*\* 写入相关配置；保留 SIMPLE_JWT 过期策略。
  保留 /token/refresh/、登录、登出等接口，但不再 Set-Cookie。
  CORS 暂保留允许前端域，等完全切到 BFF 再收紧。

- 阶段 2：Next 搭好 BFF
  新增同域端点：
  POST /api/auth/login：转发后端登录，Next 写 access_token、refresh_token（httpOnly、SameSite=Lax、Secure in prod）。
  POST /api/auth/refresh：转发刷新，Next 覆盖写 cookie。
  POST /api/auth/logout：清 cookie（可选通知后端黑名单）。
  GET /api/auth/session：权威校验，返回 {valid, userId, accessExp, refreshExp}。

  通用转发：/api/backend/\* 代理后端业务接口。
  在 Route Handler 里用 cookies() 读 token → 给后端加 Authorization: Bearer xxx（或带上 refresh 以做后端验证）。
  移除前端 Server Action 自己写 token cookie 的逻辑（避免双写）。

- 阶段 3：前端认证层重构（2–3 天）

  AuthStore.checkAuth() 以 /api/auth/session 为准；localStorage 的 userId 仅作占位（不直接判定登录）。

  刷新策略：
  改为 基于过期时间的 setTimeout + visibilitychange/focus/online 触发 立即自查；
  tokenService.refreshToken() 调用 同域 /api/auth/refresh；实现 single-flight（in-flight promise 合并）；
  刷新失败区分网络/鉴权，鉴权失败 → setUnauthenticated('session_expired') + 广播。

  多标签页：
  localStorage 锁（带超时）+ BroadcastChannel；只有主 tab 刷新，成功后广播 TOKEN_REFRESHED（不传 token，只传“请自查/新 exp”信号）。
  广播载荷加 originTabId 与 eventId，做去重；initializeListeners() 加幂等守卫。

  清理细节：
  删除手写 Origin 头；Base64URL 解码修正；local_action 逻辑改为结构化字段 local: true。

- 阶段 4：SSR/页面侧联动
  建立“UserContext”，让 SSR 有上下文
  RSC 读 cookies() 拿登录态/语言/货币，首屏渲染与 islands 保持一致，避免水合警告。
  语言/翻译链路：BFF 下发语言戳/首屏翻译；客户端 Dexie 命中失败再回源。

- 验收标准
  DevTools 里 只有一处 Set-Cookie（来自 /api/auth/\*），浏览器只持有一套 httpOnly cookie。
  刷新/登出在多标签页一致；长时间挂起后回到前台会自动矫正。
  SSR/CSR 一致，无水合警告；首页收藏/语言/货币首屏即正确。
  压测 6 个标签页并发、弱网、离线 → 在线、被动过期，均稳定。
