# AirNest | 天高路远 自在有巢 ｜ Wander Far, Nest Near

[English](#english) | [中文](#中文)

---

## 中文

### 📖 项目简介

AirNest 是一个现代化的全栈民宿预订平台，采用前后端分离架构，致力于提供优秀的用户体验和高性能的技术实现。项目参考 Airbnb 的设计理念，结合现代 Web 技术栈，打造了一个功能完善、性能卓越的民宿分享平台。

**在线体验：**

- 🌐 前端：https://www.airnest.me
- 🔧 API：https://api.airnest.me

### 🎯 设计目标

- **用户体验至上**：流畅的交互、直观的界面、响应式设计
- **性能优化**：首屏加载优化、图片优化、缓存策略
- **技术先进性**：采用最新的技术栈和最佳实践
- **国际化支持**：多语言界面，全球化用户体验
- **安全可靠**：完善的认证体系、数据安全保障

### 🛠️ 技术栈

#### 前端技术栈

- **框架**：Next.js 15 (React 18)
- **样式**：TailwindCSS + CSS Modules
- **状态管理**：Zustand
- **国际化**：next-intl
- **图像优化**：Next.js Image + Cloudflare R2
- **类型安全**：TypeScript
- **构建工具**：Turbopack

#### 后端技术栈

- **框架**：Django 5.1 + Django REST Framework
- **数据库**：PostgreSQL (Neon)
- **认证**：JWT (Simple JWT)
- **缓存**：Redis (Upstash)
- **文件存储**：Cloudflare R2
- **邮件服务**：SMTP2GO
- **WebSocket**：Django Channels
- **翻译服务**：Google Translate API v3

#### 基础设施

- **前端部署**：Vercel
- **后端部署**：Render
- **CDN**：Cloudflare
- **域名管理**：Cloudflare DNS

### 🏗️ 架构设计

#### 整体架构

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   用户前端       │    │    API网关       │    │   后端服务       │
│   (Vercel)      │◄──►│  (Cloudflare)   │◄──►│   (Render)      │
│   www.airnest.me│    │                 │    │ api.airnest.me  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                    ┌─────────────────┐
                    │   媒体存储       │
                    │ (Cloudflare R2) │
                    │ cdn.airnest.me  │
                    └─────────────────┘
```

#### 数据流架构

- **SSR + ISR**：服务端渲染 + 增量静态再生
- **Client Islands**：客户端岛屿式交互组件
- **API First**：RESTful API + WebSocket
- **CDN 加速**：全球边缘节点分发

### ⚡ 性能优化亮点

#### 1. 图片优化

- **背景**：从多 URL 方法到单一 URL + Next.js 优化
- **实现**：
  - 使用 Next.js Image 智能优化
  - 根据屏幕尺寸自动选择最佳图片质量和尺寸
  - 自动 WebP/AVIF 转换，响应式 srcset，懒加载
- **效果**：减少 50%的图片传输时间，提升 70%的内存使用效率

#### 2. 首屏性能优化

- **RSC 外壳 + Client Islands**：服务器渲染核心内容，客户端渲染交互组件
- **LCP 优化**：优先加载首屏最大图片，其余图片延迟加载
- **资源预连接**：预连接图片 CDN 域名
- **智能预取**：基于用户行为预取关键资源

#### 3. 缓存策略优化

- **多层缓存**：
  - Vercel CDN 缓存（静态资源）
  - Cloudflare CDN 缓存（API 响应）
  - Redis 缓存（数据库查询）
  - 浏览器缓存（客户端存储）
- **缓存策略**：按数据类型设置不同 TTL，用户相关数据 5 分钟，静态数据 1 小时

#### 4. 搜索与筛选优化

- **服务端搜索**：URL 参数作为单一真相源，支持 SEO
- **渐进式加载**：SSR 首批 5 条 + 客户端滚动加载
- **防抖优化**：搜索输入 300ms 防抖，节省 API 调用

### 🔐 安全架构

#### 认证体系

- **JWT 双 Token 策略**：Access Token(1h) + Refresh Token(7d)
- **邮箱验证系统**：注册验证、找回密码、邮箱变更
- **跨标签页同步**：BroadcastChannel API 实现状态同步
- **安全存储**：HttpOnly Cookie + SameSite 策略

#### 数据安全

- **CSRF 保护**：Django CSRF + 自定义 Token
- **XSS 防护**：CSP 策略 + 输入过滤
- **频率限制**：登录、注册、API 调用限制
- **数据脱敏**：敏感信息显示脱敏

### 🌍 国际化设计

- **多语言支持**：中文、英文、法语
- **路由国际化**：/zh、/en、/fr 路径
- **动态翻译**：Google Translate API 集成
- **货币本地化**：多货币显示 + 实时汇率

### 📱 功能特性

#### ✅ 已完成功能

**用户系统**

- 用户注册/登录/登出
- 邮箱验证与找回密码
- 个人资料管理
- 头像上传（R2 存储）

**房源管理**

- 房源发布（草稿/发布状态）
- 多图片上传（前端 R2 直传）
- 房源编辑与删除
- 分类筛选与搜索

**预订系统**

- 房源浏览与详情
- 日期选择与价格计算
- 预订创建与管理
- 收藏夹功能

**评价系统**

- 用户评价与评分
- 标签化评价
- 评价统计与展示

**国际化**

- 多语言界面切换
- 货币单位转换
- 时区地区本地化

**实时通信**

- WebSocket 聊天系统

**管理后台**

- Django Admin 集成
- 数据管理与统计
- 用户管理

#### 🚧 待完善功能

**房源系统**

- 地图系统集成

**聊天系统**

- 更加智能的聊天通知
- 在线状态显示

**支付系统**

- 第三方支付集成（Stripe/PayPal）
- 退款机制
- 收入分成计算

**高级搜索**

- 地图搜索
- 高级筛选器
- 搜索历史与推荐

**社交功能**

- 用户关注系统
- 房源分享
- 社交登录

**移动端**

- PWA 支持
- 原生 APP
- 推送通知

**业务功能**

- 优惠券系统
- 会员等级
- 推荐算法
- 数据分析看板

### 🔧 技术选型理由

#### 前端选型

- **Next.js**：SSR/ISR 支持，优秀的性能，丰富的生态
- **TailwindCSS**：原子化 CSS，开发效率高，包体积小
- **Zustand**：轻量级状态管理，比 Redux 简单，比 Context 性能好
- **TypeScript**：类型安全，IDE 支持好，团队协作友好

#### 后端选型

- **Django**：快速开发，生态丰富，Admin 后台
- **PostgreSQL**：关系型数据库，数据一致性好，查询功能强大
- **Redis**：高性能缓存，WebSocket 消息队列
- **Cloudflare R2**：低成本存储，全球 CDN 加速

### 📊 性能指标

- **Lighthouse 评分**：Performance 99+, 其余三项满分
- **首屏加载时间**：< 1.1s (PC 端)
- **图片优化效果**：传输体积减少 60%
- **缓存命中率**：静态资源 95%，API 响应 80%

### 🚨 已知限制

**技术债务**

- 组件缺乏单元测试
- API 文档需要补充
- 性能监控需要完善

**功能限制**

- 搜索功能相对简单
- 缺少复杂的业务规则
- 移动端体验可优化

**扩展性**

- 单体后端架构，大规模时需要微服务化
- 数据库读写分离未实现
- 国际化内容需要专业翻译

### 🔮 未来规划

**短期目标（1-3 个月）**

- 完善支付系统集成
- 优化移动端体验
- 补充自动化测试

**中期目标（3-6 个月）**

- 实现高级搜索功能
- 添加社交功能
- 性能监控体系

**长期目标（6 个月+）**

- 微服务架构重构
- AI 推荐系统
- 数据分析平台

---

## English

### 📖 Project Overview

AirNest is a modern full-stack vacation rental platform built with a decoupled frontend-backend architecture, dedicated to delivering exceptional user experience and high-performance technical implementation. Inspired by Airbnb's design philosophy and leveraging cutting-edge web technologies, we've created a feature-rich, high-performance home-sharing platform.

**Live Demo:**

- 🌐 Frontend: https://www.airnest.me
- 🔧 API: https://api.airnest.me

### 🎯 Design Goals

- **User Experience First**: Smooth interactions, intuitive interface, responsive design
- **Performance Optimization**: First-screen loading optimization, image optimization, caching strategies
- **Technical Excellence**: Latest tech stack and best practices
- **Internationalization**: Multi-language interface, global user experience
- **Security & Reliability**: Comprehensive authentication system, data security assurance

### 🛠️ Tech Stack

#### Frontend

- **Framework**: Next.js 15 (React 18)
- **Styling**: TailwindCSS + CSS Modules
- **State Management**: Zustand
- **Internationalization**: next-intl
- **Image Optimization**: Next.js Image + Cloudflare R2
- **Type Safety**: TypeScript
- **Build Tool**: Turbopack

#### Backend

- **Framework**: Django 5.1 + Django REST Framework
- **Database**: PostgreSQL (Neon)
- **Authentication**: JWT (Simple JWT)
- **Cache**: Redis (Upstash)
- **File Storage**: Cloudflare R2
- **Email Service**: SMTP2GO
- **WebSocket**: Django Channels
- **Translation**: Google Translate API v3

#### Infrastructure

##### Overall Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   User Frontend │    │   API Gateway   │    │ Backend Service │
│   (Vercel)      │◄──►│  (Cloudflare)   │◄──►│   (Render)      │
│   www.airnest.me│    │                 │    │ api.airnest.me  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                    ┌─────────────────┐
                    │  Media Storage  │
                    │ (Cloudflare R2) │
                    │ cdn.airnest.me  │
                    └─────────────────┘
```

- **Frontend Deployment**: Vercel
- **Backend Deployment**: Render
- **CDN**: Cloudflare
- **Domain Management**: Cloudflare DNS

### ⚡ Performance Optimization Highlights

#### 1. Image Architecture Upgrade

- **Challenge**: Evolution from multi-URL approach to single URL + Next.js optimization
- **Implementation**:
  - Smart optimization using Next.js Image
  - Automatic selection of optimal image quality and size based on screen dimensions
  - Automatic WebP/AVIF conversion, responsive srcset, lazy loading
- **Results**: 50% reduction in image transfer time, 70% improvement in memory efficiency

#### 2. First-Screen Performance

- **RSC Shell + Client Islands**: Server-rendered core content, client-rendered interactive components
- **LCP Optimization**: Priority loading for first-screen largest image, delayed loading for others
- **Resource Preconnection**: Preconnect to image CDN domains
- **Smart Prefetching**: User behavior-based critical resource prefetching

#### 3. Multi-Layer Caching Strategy

- **Cache Layers**:
  - Vercel CDN cache (static assets)
  - Cloudflare CDN cache (API responses)
  - Redis cache (database queries)
  - Browser cache (client storage)
- **Cache Strategy**: Different TTL by data type, user-related data 5min, static data 1h

#### 4. Search & Filter Optimization

- **Server-Side Search**: URL parameters as single source of truth, SEO-friendly
- **Progressive Loading**: SSR first 5 items + client-side infinite scroll
- **Debouncing**: 300ms search input debouncing, API call optimization

### ✅ Completed Features

**User System**

- User registration/login/logout
- Email verification & password recovery
- Profile management
- Avatar upload (R2 storage)

**Property Management**

- Property publishing (draft/published status)
- Multiple image upload (R2 direct upload)
- Property editing & deletion
- Category filtering & search

**Booking System**

- Property browsing & details
- Date selection & price calculation
- Booking creation & management
- Wishlist functionality

**Review System**

- User reviews & ratings
- Tag-based reviews
- Review statistics & display

**Internationalization**

- Multi-language interface switching
- Currency conversion
- Regional localization

**Real-time Communication**

- WebSocket chat system
- Message notifications
- Online status display

**Admin Panel**

- Django Admin integration
- Data management & statistics
- User management

### 🚧 Future Features

**Prooperty System**

- Map system integration

**Chat System**

- Smarter chat notifications
- Online status display

  **Payment System**

- Third-party payment integration (Stripe/PayPal)
- Refund mechanism
- Revenue sharing calculation

**Advanced Search**

- Map search
- Advanced filters
- Search history & recommendations

**Social Features**

- User following system
- Property sharing
- Social login

**Mobile Support**

- PWA support
- Native app
- Push notifications

**Business Features**

- Coupon system
- Membership tiers
- Recommendation algorithm
- Analytics dashboard

### 📊 Performance Metrics

- **Lighthouse Score**: Performance 99+, other three metrics perfect score
- **First Screen Load**: < 1.1s (Desktop)
- **Image Optimization**: 60% reduction in transfer size
- **Cache Hit Rate**: Static assets 95%, API responses 80%

### 🚨 Known Limitations

**Technical Debt**

- Components lack unit tests
- API documentation needs improvement
- Performance monitoring needs enhancement

**Feature Limitations**

- Search functionality is relatively simple
- Lacks complex business rules
- Mobile experience can be optimized

**Scalability**

- Monolithic backend architecture, needs microservices for large scale
- Database read/write separation not implemented
- Internationalization content needs professional translation

---

### 📄 License & Contact

**⚠️ Academic Purpose Only**

This project is created solely for educational and learning purposes. If there are any copyright concerns, please contact the author at william.gxgx@gmail.com.

We welcome contributions, suggestions, and feedback to help improve this project!

**🤝 Contributing**

Feel free to:

- Report bugs and issues
- Suggest new features
- Submit pull requests
- Provide feedback on code quality and architecture

---

**Made with ❤️ for learning modern web development**
