import 'server-only';
import { headers } from 'next/headers';

export class HttpError extends Error {
  constructor(public message: string, public status: number) {
    super(message);
    this.name = 'HttpError';
  }
}

function backendPath(inputPath: string) {
  const path = inputPath.startsWith('/api/') ? inputPath.slice(4) : inputPath;
  return path.startsWith('/api/backend/')
    ? path
    : `/api/backend${path.startsWith('/') ? path : '/' + path}`;
}

export async function fetchServer<T>(endpoint: string, init: RequestInit = {}): Promise<T> {
  const origin = process.env.NEXT_PUBLIC_SITE_URL!;
  const url = new URL(backendPath(endpoint), origin).toString();

  const h = await headers();
  const cookie = h.get('cookie');
  const acceptLang = h.get('accept-language') || 'en';

  const res = await fetch(url, {
    cache: init.cache ?? 'no-store',
    method: init.method ?? 'GET',
    headers: {
      Accept: 'application/json',
      'Accept-Language': acceptLang,
      ...(cookie ? { cookie } : {}),
      ...(init.headers || {}),
    },
    body: init.body,
  });

  if (!res.ok) throw new HttpError(`BFF ${endpoint} -> ${res.status}`, res.status);

  const ct = res.headers.get('content-type') || '';
  if (!ct.includes('application/json')) {
    const text = await res.text();
    throw new HttpError(`Unexpected content-type: ${ct}; body=${text.slice(0, 200)}`, res.status);
  }
  return (await res.json()) as T;
}

export async function serverApiCall<T = unknown>(endpoint: string, options: RequestInit = {}) {
  try { return await fetchServer<T>(endpoint, options); }
  catch (e) { console.warn(`[ServerAPI] ${endpoint} ->`, e); return null; }
}
