# AirNest Frontend

[English](#english) | [中文](#中文)

---

## 中文

现代化民宿预订平台的前端应用，基于 Next.js 15 构建。

## 🚀 快速开始

### 环境要求

- Node.js 18.17 或更高版本
- npm 或 yarn 包管理器

### 安装依赖

```bash
npm install
# 或
yarn install
```

### 环境变量配置

创建 `.env.local` 文件并配置以下环境变量：

```env
# API 配置
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_HOST=ws://localhost:8000

# Turnstile (可选)
NEXT_PUBLIC_TURNSTILE_SITE_KEY=your_turnstile_site_key
```

### 运行开发服务器

```bash
npm run dev
# 或
yarn dev
```

访问 [http://localhost:3000](http://localhost:3000) 查看应用。

### 构建生产版本

```bash
npm run build
npm run start
```

## 📁 项目结构

```
airnest_frontend/
├── app/                   # Next.js App Router
│   ├── [locale]/          # 国际化路由
│   ├── components/        # React 组件
│   ├── constants/         # 常量定义
│   ├── hooks/            # 自定义 Hooks
│   ├── services/         # API 服务
│   ├── stores/           # Zustand 状态管理
│   └── utils/            # 工具函数
├── i18n/                 # 国际化配置
├── messages/             # 多语言文件
├── public/               # 静态资源
└── middleware.ts         # Next.js 中间件
```

## 🛠️ 技术栈

- **框架**: Next.js 15 (App Router)
- **语言**: TypeScript
- **样式**: TailwindCSS
- **状态管理**: Zustand
- **国际化**: next-intl
- **构建工具**: Turbopack

## 🎨 组件架构

### 核心组件

- **`PropertyCardSSR`**: 服务端渲染的房源卡片
- **`PropertyListItem`**: 客户端房源列表项
- **`PropertyImageCarousel`**: 图片轮播组件
- **`WishlistIsland`**: 收藏功能客户端岛屿
- **`CurrencyIsland`**: 货币切换客户端岛屿

## 🌍 国际化

支持语言：

- 🇨🇳 中文 (zh)
- 🇺🇸 英文 (en)
- 🇫🇷 法语 (fr)

路由结构：

- `/zh/` - 中文版本
- `/en/` - 英文版本
- `/fr/` - 法语版本

## ⚡ 性能优化

### 图片优化

- Next.js Image 组件自动优化
- 响应式图片加载
- WebP/AVIF 格式自动转换
- 懒加载和预加载策略

### 代码分割

- 动态导入重型组件
- 路由级代码分割
- 客户端岛屿模式

### 缓存策略

- 静态资源缓存
- API 响应缓存
- 图片 CDN 缓存

## 🔧 开发脚本

```bash
# 开发模式 (Turbopack)
npm run dev

# 构建生产版本
npm run build

# 启动生产服务器
npm run start

# 类型检查
npm run type-check

# 代码格式化
npm run format

# ESLint 检查
npm run lint
```

## 🎯 核心功能

- 📋 房源浏览与搜索
- 🖼️ 多图片展示与轮播
- ❤️ 收藏夹功能
- 🌐 多语言切换
- 💱 货币转换
- 📅 日期选择
- 💬 实时聊天
- 🔐 用户认证

## 📱 响应式设计

- Mobile First 设计理念
- 支持 Phone/Tablet/Desktop
- 断点：`sm: 640px`, `md: 768px`, `lg: 1024px`, `xl: 1280px`

## 🚀 部署

### Vercel (推荐)

```bash
# 安装 Vercel CLI
npm i -g vercel

# 部署
vercel
```

### 自托管

```bash
# 构建
npm run build

# 启动 PM2
pm2 start ecosystem.config.js
```

## 🔍 开发说明

### 组件开发

- 优先使用服务端组件 (RSC)
- 交互功能使用客户端岛屿
- Props 使用 TypeScript 接口定义
- 样式使用 TailwindCSS 类名

### 性能建议

- 避免大型客户端组件
- 合理使用 `use client` 指令
- 图片使用 Next.js Image 组件
- API 调用添加适当的错误处理

---

## English

Modern vacation rental platform frontend built with Next.js 15.

## 🚀 Quick Start

### Prerequisites

- Node.js 18.17 or higher
- npm or yarn package manager

### Install Dependencies

```bash
npm install
# or
yarn install
```

### Environment Configuration

Create a `.env.local` file and configure the following environment variables:

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_HOST=ws://localhost:8000

# Turnstile (optional)
NEXT_PUBLIC_TURNSTILE_SITE_KEY=your_turnstile_site_key
```

### Run Development Server

```bash
npm run dev
# or
yarn dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the application.

### Build Production Version

```bash
npm run build
npm run start
```

## 📁 Project Structure

```
airnest_frontend/
├── app/                   # Next.js App Router
│   ├── [locale]/          # Internationalization routes
│   ├── components/        # React components
│   ├── constants/         # Constants
│   ├── hooks/            # Custom hooks
│   ├── services/         # API services
│   ├── stores/           # Zustand state management
│   └── utils/            # Utility functions
├── i18n/                 # Internationalization config
├── messages/             # Multi-language files
├── public/               # Static assets
└── middleware.ts         # Next.js middleware
```

## 🛠️ Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **State Management**: Zustand
- **Internationalization**: next-intl
- **Build Tool**: Turbopack

## 🎨 Component Architecture

### Core Components

- **`PropertyCardSSR`**: Server-side rendered property cards
- **`PropertyListItem`**: Client-side property list items
- **`PropertyImageCarousel`**: Image carousel component
- **`WishlistIsland`**: Wishlist functionality client island
- **`CurrencyIsland`**: Currency switching client island

## 🌍 Internationalization

Supported Languages:

- 🇨🇳 Chinese (zh)
- 🇺🇸 English (en)
- 🇫🇷 French (fr)

Route Structure:

- `/zh/` - Chinese version
- `/en/` - English version
- `/fr/` - French version

## ⚡ Performance Optimization

### Image Optimization
- Next.js Image component auto-optimization
- Responsive image loading
- Automatic WebP/AVIF conversion
- Lazy loading and preloading strategies

### Code Splitting
- Dynamic import for heavy components
- Route-level code splitting
- Client island pattern

### Caching Strategy
- Static asset caching
- API response caching
- Image CDN caching

## 🔧 Development Scripts

```bash
# Development mode (Turbopack)
npm run dev

# Build production version
npm run build

# Start production server
npm run start

# Type checking
npm run type-check

# Code formatting
npm run format

# ESLint check
npm run lint
```

## 🎯 Core Features

- 📋 Property browsing and search
- 🖼️ Multi-image display and carousel
- ❤️ Wishlist functionality
- 🌐 Multi-language switching
- 💱 Currency conversion
- 📅 Date selection
- 💬 Real-time chat
- 🔐 User authentication

## 📱 Responsive Design

- Mobile First design philosophy
- Support for Phone/Tablet/Desktop
- Breakpoints: `sm: 640px`, `md: 768px`, `lg: 1024px`, `xl: 1280px`

## 🚀 Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Self-hosted

```bash
# Build
npm run build

# Start with PM2
pm2 start ecosystem.config.js
```

## 🔍 Development Notes

### Component Development

- Prefer Server Components (RSC)
- Use Client Islands for interactive features
- Define Props with TypeScript interfaces
- Use TailwindCSS class names for styling

### Performance Tips

- Avoid large client components
- Use `use client` directive wisely
- Use Next.js Image component for images
- Add proper error handling for API calls

---

For more information, please refer to the [Main Project Documentation](../README.md)
