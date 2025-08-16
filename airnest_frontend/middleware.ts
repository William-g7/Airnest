import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
import { NextRequest } from 'next/server';

const intlMiddleware = createMiddleware(routing);

// 生成随机nonce (16字节的Base64编码)
function generateNonce() {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const buffer = new Uint8Array(16);
    crypto.getRandomValues(buffer);
    return btoa(String.fromCharCode.apply(null, buffer as unknown as number[]));
  }

  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

export default async function middleware(request: NextRequest) {
  // 排除图标文件和静态资源，避免被 i18n 处理
  const pathname = request.nextUrl.pathname;
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.endsWith('.ico') ||
    pathname.endsWith('.svg') ||
    pathname.endsWith('.png') ||
    pathname.endsWith('.jpg') ||
    pathname.endsWith('.jpeg') ||
    pathname.endsWith('.gif') ||
    pathname.endsWith('.webp') ||
    pathname.endsWith('.js') ||
    pathname.endsWith('.css') ||
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml' ||
    pathname === '/icon.svg' ||
    pathname === '/favicon.ico'
  ) {
    // 对于静态资源，跳过 i18n 中间件，但仍然添加安全头
    return;
  }
  
  const nonce = generateNonce();

  const response = await intlMiddleware(request);

  response.cookies.set('csp-nonce', nonce, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 5,
    path: '/',
  });

  const isDev = process.env.NODE_ENV === 'development';

  const reportUri = '/api/csp-report';

  // Cloudflare Turnstile域名
  const cloudflareDomains = 'challenges.cloudflare.com';

  const cspHeader = isDev
    ? `
      default-src 'self';
      script-src 'self' 'unsafe-eval' 'unsafe-inline' ${cloudflareDomains};
      style-src 'self' 'unsafe-inline';
      img-src 'self' data: blob: ${process.env.NEXT_PUBLIC_API_URL};
      font-src 'self' data:;
      connect-src 'self' ${process.env.NEXT_PUBLIC_API_URL} ${process.env.NEXT_PUBLIC_WS_HOST} ws://localhost:* ${cloudflareDomains};
      frame-src 'self' ${cloudflareDomains};
      worker-src 'self' blob:;
      report-uri ${reportUri};
    `
    : `
      default-src 'self';
      script-src 'self' 'unsafe-inline' ${cloudflareDomains};
      style-src 'self' 'nonce-${nonce}' 'unsafe-inline';
      img-src 'self' data: blob: ${process.env.NEXT_PUBLIC_API_URL};
      font-src 'self' data:;
      connect-src 'self' ${process.env.NEXT_PUBLIC_API_URL} ${process.env.NEXT_PUBLIC_WS_HOST} ${cloudflareDomains};
      frame-src 'self' ${cloudflareDomains};
      base-uri 'self';
      form-action 'self';
      frame-ancestors 'self';
      block-all-mixed-content;
      upgrade-insecure-requests;
      report-uri ${reportUri};
    `;

  const cleanCspHeader = cspHeader.replace(/\s{2,}/g, ' ').trim();

  response.headers.set('Content-Security-Policy', cleanCspHeader);

  // 创建干净的 CSP Report-Only 头值，去除换行符和多余空格
  const reportOnlyCsp = `default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' ${cloudflareDomains}; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: ${process.env.NEXT_PUBLIC_API_URL}; font-src 'self' data:; connect-src 'self' ${process.env.NEXT_PUBLIC_API_URL} ${process.env.NEXT_PUBLIC_WS_HOST} ${cloudflareDomains}; frame-src 'self' ${cloudflareDomains}; report-uri ${reportUri}`;

  response.headers.set('Content-Security-Policy-Report-Only', reportOnlyCsp);

  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  return response;
}
export const config = {
  // 匹配所有路径，除了以下内容：
  // - 以 /api 开头的 API 路由
  // - 以 /_next 开头的 Next.js 内部路由
  // - 以 /_ 开头的其他内部路由
  // - 静态文件如图片、字体等
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
