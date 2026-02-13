import type { NextRequest } from 'next/server';

/**
 * 在 HTTPS（含反向代理/平台）下返回 true，本地 http 下返回 false。
 */
export function cookieSecureFlag(req: NextRequest): boolean {
  // 反向代理常用头（Vercel/Cloudflare/大多数CDN都会带）
  const xfProto = req.headers.get('x-forwarded-proto')?.split(',')[0]?.trim().toLowerCase();
  if (xfProto === 'https') return true;

  // Next 的 Url 协议判断
  const protocol = req.nextUrl.protocol; // 'https:' | 'http:'
  if (protocol === 'https:') return true;

  // 本地开发域名：不要加 Secure，否则 cookie 不会被写入
  const host = req.headers.get('host') ?? req.nextUrl.host ?? '';
  if (host.startsWith('localhost') || host.startsWith('127.0.0.1')) return false;

  // 兜底：生产环境一律加 Secure，其余不加
  return process.env.NODE_ENV === 'production';
}
