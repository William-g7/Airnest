import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { parseJwt } from '@auth/utils/jwt';

// bff业务通道: 从httponly的access token中取到token添加到请求中;
// 把客户端→后端的条件请求头透传（If-Modified-Since / If-None-Match 等），并且
// 把后端→客户端/CDN 的缓存头“增强但不乱改”（遵从私有/禁存储，给公开资源补 s-maxage / stale-while-revalidate / Vary 等），同时避免把“带认证的请求”卡进 CDN
// 如果后端返回401， 再用refresh token去后端刷新一次，成功后重新发送原请求，并写好新的at/rt
const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL;

/**
 * 从前端请求中挑选“安全且有用”的请求头转发到后端
 * - 包含条件请求头（If-Modified-Since / If-None-Match）以支持 304
 * - 不转发 cookie（BFF 以 HttpOnly Token 代替）
 */
function collectForwardableHeaders(request: NextRequest): Record<string, string> {
  const forwardedHeaders: Record<string, string> = {};
  const headerNamesToForward = [
    'accept',
    'accept-language',
    'user-agent',
    'content-type',
    'if-modified-since',
  ];
  for (const headerName of headerNamesToForward) {
    const value = request.headers.get(headerName);
    if (value) forwardedHeaders[headerName] = value;
  }
  return forwardedHeaders;
}

/**
 * 合并 Vary 响应头，去重、大小写不敏感
 */
function mergeVaryHeaders(existingVary: string | null, additionalHeaders: string[]): string {
  const normalized = (existingVary || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => s.toLowerCase());
  const unique = new Set(normalized);
  for (const name of additionalHeaders) unique.add(name.toLowerCase());
  return Array.from(unique).join(', ');
}

function buildTargetUrl(path: string, req: NextRequest) {
  const normalized = path.endsWith('/') ? path : path + '/';
  const url = new URL(`/api/${normalized}`, BACKEND_API_URL); 
  url.search = req.nextUrl.search || '';
  return url;
}

/**
 * 在不违背 no-store/private 的前提下，向 Cache-Control 注入共享缓存增强指令
 * - s-maxage：只作用于 CDN/共享缓存，不影响浏览器缓存时长
 * - stale-while-revalidate：后台回源时允许用旧副本
 * - stale-if-error：后端报错时允许用旧副本
 */
function enhanceCacheControlHeader(
  existing: string | null,
  patch: Partial<{
    sMaxage: number;
    staleWhileRevalidate: number;
    staleIfError: number;
  }>,
): string {
  const directives = new Map<string, string | true>();

  (existing || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .forEach((token) => {
      const [k, v] = token.split('=');
      directives.set(k.toLowerCase(), v ? v : true);
    });

  const hasNoStore = directives.has('no-store');
  const isPrivate = directives.has('private');

  if (!hasNoStore && !isPrivate) {
    if (patch.sMaxage != null) directives.set('s-maxage', String(patch.sMaxage));
    if (patch.staleWhileRevalidate != null)
      directives.set('stale-while-revalidate', String(patch.staleWhileRevalidate));
    if (patch.staleIfError != null) directives.set('stale-if-error', String(patch.staleIfError));
  }

  return Array.from(directives.entries())
    .map(([k, v]) => (v === true ? k : `${k}=${v}`))
    .join(', ');
}

/**
 * 透传后端的缓存相关响应头
 */
function passThroughCachingHeaders(backendResponse: Response, clientResponse: NextResponse) {
  const cacheHeaderNames = ['cache-control', 'expires', 'last-modified', 'vary'];
  for (const name of cacheHeaderNames) {
    const value = backendResponse.headers.get(name);
    if (value) clientResponse.headers.set(name, value);
  }
}

/**
 * 确定某个路径是否属于“公开可缓存”的 GET（可用 CDN 缓存）
 */
const PUBLIC_GET_ALLOWLIST = [
  /^property_list$/,
  /^properties_with_reviews$/,
  /^property_detail\/\d+$/,
  /^property_with_reviews\/\d+$/,
  /^property_review_stats\/\d+$/,
  /^get_review_tags$/,
  /^get_booked_dates\/\d+$/,
];

function isPublicCacheableGET(method: string, path: string) {
  if (method !== 'GET') return false;
  const trimmed = path.replace(/^\/+|\/+$/g, '');
  return PUBLIC_GET_ALLOWLIST.some((regex) => regex.test(trimmed));
}

/**
 * 构建发往后端的 fetch init
 * - attachAuth = true 时，从 BFF 的 HttpOnly Cookie 取 access token 加到 Authorization
 * - 只在写操作时/或私有接口时带上鉴权；公开 GET 默认不带，提高 CDN 命中
 */
async function buildBackendRequestInit(
  method: string,
  request: NextRequest,
  attachAuth: boolean,
  cachedBody?: string,
  overrideAccess?: string,
): Promise<RequestInit> {
  const headers = collectForwardableHeaders(request);

  if (attachAuth) {
    const cookieStore = await cookies();
    const accessToken = overrideAccess || cookieStore.get('bff_access_token')?.value;
    if (accessToken) headers['authorization'] = `Bearer ${accessToken}`;
  }

  const init: RequestInit = { method, headers };

  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method) && cachedBody !== undefined) {
    (init as any).body = cachedBody; 
  }
  return init;
}

/**
 * 401 场景下，使用 refresh token 向后端刷新 access/refresh token
 */
async function refreshTokensViaBackend() {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get('bff_refresh_token')?.value;
  if (!refreshToken) return null;

  const response = await fetch(`${BACKEND_API_URL}/api/auth/token/refresh/`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ refresh: refreshToken }),
  });

  if (!response.ok) return null;
  return (await response.json()) as { access: string; refresh?: string };
}

/**
 * 把新 token 写入前端 Cookie（仅在 401→刷新成功 的分支里调用）
 * 同时写入 bff_user_id 方便前端读取（非敏感）
 */
const cookieDomain =
  process.env.NODE_ENV === 'production' ? '.airnest.me' : undefined;
type AuthTokens = { access: string; refresh?: string };
function setAuthCookies(response: NextResponse, tokens: AuthTokens) {
  response.cookies.set('bff_access_token', tokens.access, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    domain: cookieDomain,
    maxAge: 60 * 60, // 1h
  });

  if (tokens.refresh) {
    response.cookies.set('bff_refresh_token', tokens.refresh, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      domain: cookieDomain,
      maxAge: 60 * 60 * 24 * 7, // 7d
    });
  }

  try {
    const payload = parseJwt<{ user_id?: string; sub?: string }>(tokens.access);
    const userId = payload.user_id || payload.sub;
    if (userId) {
      response.cookies.set('bff_user_id', userId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7,
      });
    }
  } catch {
    // ignore parse errors
  }
}

function normalizePath(p: string) {
  return p.replace(/^\/+|\/+$/g, '');
}

function isTranslateGet(method: string, path: string) {
  return method === 'GET' && normalizePath(path) === 'translate';
}

// GET /backend/translate?l=<locale>&q=<t1>&q=<t2>...
async function handleTranslateGet(request: NextRequest) {
  console.log('[BFF] /backend/translate hit:', request.nextUrl.toString());
  const url = request.nextUrl;
  const locale = url.searchParams.get('l') || 'en';
  const queries = url.searchParams.getAll('q').filter(Boolean);

  // 去重
  const uniq = Array.from(new Set(queries));
  // 英文恒等返回
  if (locale === 'en' || uniq.length === 0) {
    const resp = NextResponse.json(
      { translations: Object.fromEntries(uniq.map(t => [t, t])) },
      { status: 200 }
    );
    // 直接设置公共缓存（CDN 可缓存）
    resp.headers.set(
      'cache-control',
      'public, max-age=0, s-maxage=86400, stale-while-revalidate=60, stale-if-error=604800'
    );
    // 因为使用 l 参数区分语言，不需要 Vary: Accept-Language
    return resp;
  }

  // 调后端批量翻译（POST），不带 Authorization（公共数据）
  const backendRes = await fetch(`${BACKEND_API_URL}/api/translate/batch/`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'accept': 'application/json',
    },
    body: JSON.stringify({ texts: uniq, target_language: locale }),
  });

  // 默认兜底：原文原样
  let payload: any = { translations: Object.fromEntries(uniq.map(t => [t, t])) };

  if (backendRes.ok) {
    try {
      const data = await backendRes.json();
      if (data?.translations && typeof data.translations === 'object') {
        payload = { translations: data.translations };
      }
    } catch {
      // ignore parse errors → 继续用兜底 payload
    }
  }

  const resp = NextResponse.json(payload, { status: backendRes.status || 200 });
  // 直接设置可公共缓存
  resp.headers.set(
    'cache-control',
    'public, max-age=0, s-maxage=86400, stale-while-revalidate=60, stale-if-error=604800'
  );
  // 如需协商语言才加：resp.headers.set('vary', mergeVaryHeaders(resp.headers.get('vary'), ['Accept-Language']));
  return resp;
}

/**
 * 统一的后端代理逻辑
 * - 公开 GET 默认不带 Authorization，利于 CDN；其它请求带上 Authorization
 * - 401 自动刷新 token 并重试一次
 * - 透传缓存响应头；在公开响应且允许 public 时增加 s-maxage/stale-*（仅 CDN 生效）
 * - 如果本次响应设置了 Cookie（刷新了 token），强制 private, no-store + Vary: Cookie，避免被 CDN 缓存
 */
async function proxyToBackend(method: string, path: string, request: NextRequest) {
  const target = buildTargetUrl(path, request);
  const isPublicGet = isPublicCacheableGET(method, path);
  const needsBody = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);
  const cachedBody = needsBody ? await request.text() : undefined;

  // 公开 GET 不带鉴权，其余情况附加鉴权
  let backendInit = await buildBackendRequestInit(method, request, !isPublicGet, cachedBody);
  let backendResponse = await fetch(target.toString(), backendInit);

  // 如果 401，尝试用 refresh token 刷新，然后附带新 access 重试一次
  let refreshedTokens: AuthTokens | null = null;
  if (backendResponse.status === 401) {
    refreshedTokens = await refreshTokensViaBackend();
    if (refreshedTokens?.access) {
      backendInit = await buildBackendRequestInit(method, request, true, cachedBody, refreshedTokens.access);
      backendResponse = await fetch(target.toString(), backendInit);
    }
  }

  // 构造返回给前端的响应，并透传后端正文（含 304 等状态）
  const clientResponse = new NextResponse(backendResponse.body, {
    status: backendResponse.status,
    statusText: backendResponse.statusText,
  });

  // 透传 content-type
  const contentType = backendResponse.headers.get('content-type');
  if (contentType) clientResponse.headers.set('content-type', contentType);

  // 透传缓存相关响应头（Cache-Control / Vary / Last-Modified）
  passThroughCachingHeaders(backendResponse, clientResponse);

  // 若本次在 BFF 刷新过refreshed token, 为避免 CDN 缓存到“携带 Set-Cookie 的响应”，强制私有且禁存储，并对 Cookie 进行 Vary
  if (refreshedTokens) {
    setAuthCookies(clientResponse, refreshedTokens);
    clientResponse.headers.set('cache-control', 'private, no-store');
    clientResponse.headers.set('vary', mergeVaryHeaders(clientResponse.headers.get('vary'), ['Cookie']));
    return clientResponse;
  }

  // 仅对公开 GET 且后端明确允许 public 的响应做 CDN 缓存增强
  const cacheControl = clientResponse.headers.get('cache-control');
  const hasSetCookieHeader = clientResponse.headers.get('set-cookie'); // 防御：带 Set-Cookie 的响应一律不增强
  const looksPublic =
    !!cacheControl && /public/i.test(cacheControl) && !/no-store|private/i.test(cacheControl);

  if (isPublicGet && looksPublic && !hasSetCookieHeader) {
    // 增强策略：把浏览器侧 max-age 保持不变，仅对共享缓存（CDN）提升寿命并允许 stale
    const upgraded = enhanceCacheControlHeader(cacheControl, {
      sMaxage: 3600,            // CDN 生效的 TTL
      staleWhileRevalidate: 30, // 回源刷新期间可用旧副本
      staleIfError: 86400,      // 后端出错时，旧副本兜底一天
    });
    clientResponse.headers.set('cache-control', upgraded);

    // 确保多语言维度被区分（后端可能已设置，这里兜底合并）
    clientResponse.headers.set('vary', mergeVaryHeaders(clientResponse.headers.get('vary'), ['Accept-Language']));
  }

  return clientResponse;
}

// ---- Next.js Route Handlers ----
interface RouteParams {
  params: Promise<{ path: string[] }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { path } = await params;
  const joined = path.join('/');

  if (isTranslateGet('GET', joined)) {
    return handleTranslateGet(request);
  }

  return proxyToBackend('GET', joined, request);
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { path } = await params;
  return proxyToBackend('POST', path.join('/'), request);
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { path } = await params;
  return proxyToBackend('PUT', path.join('/'), request);
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { path } = await params;
  return proxyToBackend('PATCH', path.join('/'), request);
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { path } = await params;
  return proxyToBackend('DELETE', path.join('/'), request);
}