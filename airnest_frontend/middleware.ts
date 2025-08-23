import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
import { NextRequest } from 'next/server';

const intlMiddleware = createMiddleware(routing);

function generateNonce() {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const buffer = new Uint8Array(16);
    crypto.getRandomValues(buffer);
    return btoa(String.fromCharCode.apply(null, buffer as unknown as number[]));
  }

  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

export default async function middleware(request: NextRequest) {
  const response = intlMiddleware(request);

  if (request.method === 'GET' || request.method === 'HEAD') {
    const accept = request.headers.get('accept') || '';
    const isHtml = accept.includes('text/html');
    if (isHtml ){
      const nonce = generateNonce() ;

      response.headers.set('x-middleware-override-headers', 'x-csp-nonce');
      response.headers.set('x-middleware-request-x-csp-nonce', nonce);

      response.cookies.set('csp-nonce', nonce, {
        httpOnly: true, 
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 5,
        path: '/',
      });

      const isDev = process.env.NODE_ENV === 'development';
      // Cloudflare Turnstile域名
      const cloudflareDomains = 'challenges.cloudflare.com';
      // Cloudflare R2存储域名
      const r2Domains = '*.r2.cloudflarestorage.com';
      // 汇率API域名
      const exchangeRateApiDomain = 'api.exchangerate-api.com';

      const cspHeader = isDev
        ? `
          default-src 'self';
          script-src 'self' 'unsafe-eval' 'unsafe-inline' ${cloudflareDomains};
          style-src 'self' 'unsafe-inline';
          img-src 'self' data: blob:;
          font-src 'self' data:;
          connect-src 'self' ${process.env.NEXT_PUBLIC_API_URL} ${process.env.NEXT_PUBLIC_WS_HOST} ws://localhost:* ${cloudflareDomains} ${r2Domains} ${exchangeRateApiDomain};
          frame-src 'self' ${cloudflareDomains};
          worker-src 'self' blob:;
        `
        : `
          default-src 'self';
          script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https: ${cloudflareDomains} ;
          style-src 'self';
          img-src 'self' data: blob:;
          font-src 'self' data:;
          connect-src 'self' ${process.env.NEXT_PUBLIC_API_URL} ${process.env.NEXT_PUBLIC_WS_HOST} ${cloudflareDomains} ${r2Domains} ${exchangeRateApiDomain};
          frame-src 'self' ${cloudflareDomains};
          base-uri 'self';
          form-action 'self';
          frame-ancestors 'self';
          upgrade-insecure-requests;
        `;

      const cleanCspHeader = cspHeader.replace(/\s{2,}/g, ' ').trim();

      response.headers.set('Content-Security-Policy', cleanCspHeader);
      response.headers.set('X-Content-Type-Options', 'nosniff');
      response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
      response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
   }
  }

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