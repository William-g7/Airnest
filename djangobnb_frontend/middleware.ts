import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

// 使用集中化的路由配置
export default createMiddleware(routing);

// 配置中间件应该匹配的路径
export const config = {
    // 匹配所有路径，除了以下内容：
    // - 以 /api 开头的 API 路由
    // - 以 /_next 开头的 Next.js 内部路由
    // - 以 /_ 开头的其他内部路由
    // - 静态文件如图片、字体等
    matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
}; 