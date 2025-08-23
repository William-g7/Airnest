# AirNest Backend

[English](#english) | [中文](#中文)

---

## 中文

现代化民宿预订平台的后端API服务，基于 Django 5.1 + DRF 构建。

## 🚀 快速开始

### 环境要求

- Python 3.11+
- PostgreSQL 14+
- Redis 6+
- Docker & Docker Compose (推荐)

### Docker 快速启动（推荐）

```bash
# 克隆项目
git clone <repository-url>
cd airnest_backend

# 启动服务
docker compose up -d

# 执行迁移
docker compose exec web python manage.py migrate

# 创建超级用户
docker compose exec web python manage.py createsuperuser
```

访问：
- API: http://localhost:8000
- Admin: http://localhost:8000/admin

### 本地开发设置

```bash
# 创建虚拟环境
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 安装依赖
pip install -r requirements.txt

# 配置环境变量
cp .env.example .env

# 数据库迁移
python manage.py migrate

# 启动开发服务器
python manage.py runserver
```

### 环境变量配置

```env
# 数据库配置
DATABASE_URL=postgresql://user:password@localhost:5432/airnest

# Redis配置
REDIS_URL=redis://localhost:6379/0

# Django设置
SECRET_KEY=your-secret-key
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# 邮件配置
SMTP_HOST=smtp.example.com
SMTP_USER=your-email
SMTP_PASSWORD=your-password

# 存储配置
CLOUDFLARE_R2_ACCESS_KEY_ID=your-access-key
CLOUDFLARE_R2_SECRET_ACCESS_KEY=your-secret-key
CLOUDFLARE_R2_BUCKET_NAME=your-bucket

# 外部服务
GOOGLE_TRANSLATE_API_KEY=your-api-key
TURNSTILE_SECRET_KEY=your-secret-key
```

## 📁 项目结构

```
airnest_backend/backend/
├── airnest_backend/           # 项目配置
│   ├── settings.py           # Django设置
│   ├── urls.py              # 主路由
│   └── storage.py           # 存储配置
├── useraccount/             # 用户认证
├── property/                # 房源管理
├── chat/                    # 聊天系统
├── media_upload/            # 文件上传
├── templates/               # 邮件模板
└── manage.py               # Django管理脚本
```

## 🛠️ 技术栈

- **框架**: Django 5.1 + Django REST Framework
- **数据库**: PostgreSQL
- **缓存**: Redis
- **认证**: JWT (Simple JWT)
- **文件存储**: Cloudflare R2
- **WebSocket**: Django Channels
- **邮件服务**: SMTP2GO
- **翻译**: Google Translate API v3

## 🔌 API 端点

### 认证相关
```
POST /api/auth/register/          # 用户注册
POST /api/auth/login/             # 用户登录
POST /api/auth/refresh/           # 刷新token
POST /api/auth/logout/            # 用户登出
POST /api/auth/verify-email/      # 邮箱验证
POST /api/auth/forgot-password/   # 忘记密码
```

### 房源管理
```
GET    /api/properties/           # 房源列表
POST   /api/properties/draft/     # 创建草稿
GET    /api/properties/{id}/      # 房源详情
POST   /api/properties/{id}/publish/  # 发布房源
PUT    /api/properties/{id}/      # 更新房源
DELETE /api/properties/{id}/      # 删除房源
```

### 文件上传
```
POST /api/media/presigned-url/    # 获取预签名URL
POST /api/media/upload/           # 直接上传
```

### 其他功能
```
GET  /api/reservations/           # 预订管理
POST /api/wishlist/toggle/        # 收藏切换
GET  /api/reviews/               # 评价系统
```

## 🌐 WebSocket 端点

```
ws://localhost:8000/ws/chat/{conversation_id}/  # 聊天室
```

## 🔧 管理命令

```bash
# 数据库管理
python manage.py makemigrations
python manage.py migrate
python manage.py dbshell

# 用户管理
python manage.py createsuperuser
python manage.py create_admin  # 批量创建

# 缓存管理
python manage.py clear_cache

# 开发工具
python manage.py shell
python manage.py runserver
python manage.py collectstatic
```

## 🎯 核心功能

- 🔐 JWT认证 + 邮箱验证系统
- 🏠 房源CRUD + 图片管理
- 📅 预订系统 + 日期检查
- ❤️ 收藏夹 + 用户偏好
- ⭐ 评价系统 + 标签化评价
- 💬 实时聊天 + WebSocket
- 🌐 多语言 + 自动翻译
- 📁 R2存储 + CDN加速

## 📊 性能特性

- **缓存策略**: Redis多层缓存
- **数据库优化**: 查询优化 + 索引策略
- **文件存储**: R2直传 + CDN分发
- **WebSocket**: 高并发聊天支持
- **API限流**: 防止滥用

## 🔒 安全特性

- CSRF保护
- CORS配置
- 输入验证与过滤
- SQL注入防护
- 敏感信息加密存储
- 频率限制

## 🚀 部署

### Render (推荐)

```bash
# 推送代码到Git仓库
git push origin main

# 在Render中配置:
# - Runtime: Docker
# - Build Command: docker build -t backend .
# - Start Command: python manage.py migrate && gunicorn airnest_backend.wsgi
```

### 自托管

```bash
# 生产环境构建
docker build -t airnest-backend .

# 启动服务
docker run -d \
  --name airnest-backend \
  -p 8000:8000 \
  --env-file .env \
  airnest-backend
```

---

## English

Modern vacation rental platform backend API service built with Django 5.1 + DRF.

## 🚀 Quick Start

### Prerequisites

- Python 3.11+
- PostgreSQL 14+
- Redis 6+
- Docker & Docker Compose (recommended)

### Docker Quick Start (Recommended)

```bash
# Clone project
git clone <repository-url>
cd airnest_backend

# Start services
docker compose up -d

# Run migrations
docker compose exec web python manage.py migrate

# Create superuser
docker compose exec web python manage.py createsuperuser
```

Access:
- API: http://localhost:8000
- Admin: http://localhost:8000/admin

### Local Development Setup

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env

# Database migration
python manage.py migrate

# Start development server
python manage.py runserver
```

### Environment Variables

```env
# Database Configuration
DATABASE_URL=postgresql://user:password@localhost:5432/airnest

# Redis Configuration
REDIS_URL=redis://localhost:6379/0

# Django Settings
SECRET_KEY=your-secret-key
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Email Configuration
SMTP_HOST=smtp.example.com
SMTP_USER=your-email
SMTP_PASSWORD=your-password

# Storage Configuration
CLOUDFLARE_R2_ACCESS_KEY_ID=your-access-key
CLOUDFLARE_R2_SECRET_ACCESS_KEY=your-secret-key
CLOUDFLARE_R2_BUCKET_NAME=your-bucket

# External Services
GOOGLE_TRANSLATE_API_KEY=your-api-key
TURNSTILE_SECRET_KEY=your-secret-key
```

## 📁 Project Structure

```
airnest_backend/backend/
├── airnest_backend/           # Project configuration
│   ├── settings.py           # Django settings
│   ├── urls.py              # Main routing
│   └── storage.py           # Storage configuration
├── useraccount/             # User authentication
├── property/                # Property management
├── chat/                    # Chat system
├── media_upload/            # File upload
├── templates/               # Email templates
└── manage.py               # Django management script
```

## 🛠️ Tech Stack

- **Framework**: Django 5.1 + Django REST Framework
- **Database**: PostgreSQL
- **Cache**: Redis
- **Authentication**: JWT (Simple JWT)
- **File Storage**: Cloudflare R2
- **WebSocket**: Django Channels
- **Email Service**: SMTP2GO
- **Translation**: Google Translate API v3

## 🔌 API Endpoints

### Authentication
```
POST /api/auth/register/          # User registration
POST /api/auth/login/             # User login
POST /api/auth/refresh/           # Refresh token
POST /api/auth/logout/            # User logout
POST /api/auth/verify-email/      # Email verification
POST /api/auth/forgot-password/   # Forgot password
```

### Property Management
```
GET    /api/properties/           # Property list
POST   /api/properties/draft/     # Create draft
GET    /api/properties/{id}/      # Property details
POST   /api/properties/{id}/publish/  # Publish property
PUT    /api/properties/{id}/      # Update property
DELETE /api/properties/{id}/      # Delete property
```

### File Upload
```
POST /api/media/presigned-url/    # Get presigned URL
POST /api/media/upload/           # Direct upload
```

### Other Features
```
GET  /api/reservations/           # Booking management
POST /api/wishlist/toggle/        # Wishlist toggle
GET  /api/reviews/               # Review system
```

## 🌐 WebSocket Endpoints

```
ws://localhost:8000/ws/chat/{conversation_id}/  # Chat room
```

## 🔧 Management Commands

```bash
# Database Management
python manage.py makemigrations
python manage.py migrate
python manage.py dbshell

# User Management
python manage.py createsuperuser
python manage.py create_admin  # Batch creation

# Cache Management
python manage.py clear_cache

# Development Tools
python manage.py shell
python manage.py runserver
python manage.py collectstatic
```

## 🎯 Core Features

- 🔐 JWT Authentication + Email Verification
- 🏠 Property CRUD + Image Management
- 📅 Booking System + Date Validation
- ❤️ Wishlist + User Preferences
- ⭐ Review System + Tagged Reviews
- 💬 Real-time Chat + WebSocket
- 🌐 Multi-language + Auto Translation
- 📁 R2 Storage + CDN Acceleration

## 📊 Performance Features

- **Caching Strategy**: Redis multi-layer caching
- **Database Optimization**: Query optimization + indexing
- **File Storage**: R2 direct upload + CDN distribution
- **WebSocket**: High-concurrency chat support
- **API Rate Limiting**: Abuse prevention

## 🔒 Security Features

- CSRF protection
- CORS configuration
- Input validation and filtering
- SQL injection protection
- Encrypted sensitive data storage
- Rate limiting

## 🚀 Deployment

### Render (Recommended)

```bash
# Push code to Git repository
git push origin main

# Configure in Render:
# - Runtime: Docker
# - Build Command: docker build -t backend .
# - Start Command: python manage.py migrate && gunicorn airnest_backend.wsgi
```

### Self-hosted

```bash
# Production build
docker build -t airnest-backend .

# Start service
docker run -d \
  --name airnest-backend \
  -p 8000:8000 \
  --env-file .env \
  airnest-backend
```

---

For more information, please refer to the [Main Project Documentation](../README.md)