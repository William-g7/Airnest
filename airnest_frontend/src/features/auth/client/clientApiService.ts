import { useAuthStore } from './authStore';
import { ErrorType } from '@errors/error';

interface RequestOptions {
  forceRefresh?: boolean;
  suppressToast?: boolean;
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

export class ApiError extends Error {
  statusCode?: number;
  errorType: ErrorType;
  silent?: boolean;
  constructor(message: string, errorType: ErrorType = ErrorType.DEFAULT, statusCode?: number, silent?: boolean) {
    super(message);
    this.name = 'ApiError';
    this.errorType = errorType;
    this.statusCode = statusCode;
    this.silent = !!silent;
  }
}

/* ---------------- 小工具 ---------------- */

function toBackend(url: string) {
  const path = url.startsWith('/api/') ? url.slice(4) : url;
  return path.startsWith('/api/backend/') ? path : `/api/backend${path.startsWith('/') ? path : '/' + path}`;
}

function detectLocale(): string {
  if (typeof document !== 'undefined') {
    const htmlLang = document.documentElement?.lang;
    if (htmlLang) return htmlLang;
  }
  if (typeof window !== 'undefined') {
    const m = window.location.pathname.match(/^\/([a-z]{2}(?:-[a-z]{2})?)\b/i);
    if (m) return m[1];
  }
  return 'en';
}

function errorTypeFromStatus(status: number): ErrorType {
  switch (status) {
    case 400: return ErrorType.VALIDATION_ERROR;
    case 401: return ErrorType.UNAUTHORIZED;
    case 403: return ErrorType.FORBIDDEN;
    case 404: return ErrorType.NOT_FOUND;
    case 408: return ErrorType.NETWORK_ERROR;
    case 422: return ErrorType.VALIDATION_ERROR;
    case 429: return ErrorType.RATE_LIMITED;
    case 500:
    case 502:
    case 503:
    case 504: return ErrorType.SERVER_ERROR;
    default:  return ErrorType.DEFAULT;
  }
}

/* ---------------- 统一请求核心 ---------------- */

async function request<T>(
  method: 'GET'|'POST'|'PATCH'|'DELETE',
  url: string,
  data?: any,
  options: RequestOptions = {}
): Promise<T> {
  const bffUrl = toBackend(url);
  const locale = detectLocale();

  const headers: Record<string,string> = {
    Accept: 'application/json',
    'Accept-Language': locale,
    ...(options.headers || {}),
  };

  const init: RequestInit = {
    method,
    credentials: 'include',
    headers,
    signal: options.signal,
  };

  if (data !== undefined) {
    if (data instanceof FormData) {
      init.body = data;
    } else {
      headers['Content-Type'] = headers['Content-Type'] ?? 'application/json';
      init.body = typeof data === 'string' ? data : JSON.stringify(data);
    }
  }

  if (method === 'GET') {
    (init as any).cache = options.forceRefresh ? 'reload' : 'default';
  }

  let res: Response;
  try {
    res = await fetch(bffUrl, init);
  } catch (e: any) {
    if (e?.name === 'AbortError') {
      throw new ApiError('Request canceled', ErrorType.CANCELED, undefined, true /* silent */);
    }
    throw new ApiError(e?.message || 'Network error', ErrorType.NETWORK_ERROR, undefined, options.suppressToast);
  }

  if (!res.ok) {
    if (res.status === 401) {
      useAuthStore.getState().setUnauthenticated('session_expired');
    }

    let message = `HTTP error! status: ${res.status}`;
    try {
      const text = await res.text();
      if (text) {
        try {
          const json = JSON.parse(text);
          // DRF / 常见错误体兜底提取
          const detail =
            json?.detail ||
            json?.message ||
            json?.non_field_errors?.[0] ||
            json?.email?.[0] ||
            json?.password?.[0] ||
            // 展开 errors: { field: [msg] }
            (json?.errors && Object.values(json.errors).flat?.()[0]) ||
            Object.values(json)[0];
          if (detail) message = String(detail);
        } catch {
          message = text.slice(0, 300);
        }
      }
    } catch { /* ignore */ }

    throw new ApiError(message, errorTypeFromStatus(res.status), res.status, options.suppressToast);
  }

  if (res.status === 204) return {} as T;
  const raw = await res.text();
  if (!raw) return {} as T;

  const ct = res.headers.get('content-type') || '';
  if (ct.includes('application/json')) {
    try {
      return JSON.parse(raw) as T;
    } catch {
      throw new ApiError('Invalid JSON response', ErrorType.SERVER_ERROR, res.status, options.suppressToast);
    }
  } else {
    return raw as unknown as T;
  }
}

/* ---------------- 对外暴露的薄封装 ---------------- */

const clientApiService = {
  // 基础 HTTP
  get   : <T=any>(url: string, options?: RequestOptions)        => request<T>('GET', url, undefined, options),
  post  : <T=any>(url: string, data?: any, options?: RequestOptions) => request<T>('POST', url, data, options),
  patch : <T=any>(url: string, data?: any, options?: RequestOptions) => request<T>('PATCH', url, data, options),
  delete: <T=any>(url: string, options?: RequestOptions)        => request<T>('DELETE', url, undefined, options),

  // 业务方法
  // 预定相关
  getPropertyReservations(propertyId: string) {
    return this.get(`/api/properties/${propertyId}/reservations/`);
  },

  // 房源图片相关
  updatePropertyImagesOrder(propertyId: string, imageOrders: Array<{ id: number; order: number }>) {
    return this.post(`/api/properties/${propertyId}/images/update-order/`, { image_orders: imageOrders });
  },

  deletePropertyImage(propertyId: string, imageId: number) {
    return this.delete(`/api/properties/${propertyId}/images/${imageId}/`);
  },

  // 评论相关
  getReviewTags() {
    return this.get('/api/properties/review-tags/');
  },
  getPropertyReviews(propertyId: string, page = 1, pageSize = 10) {
    return this.get(`/api/properties/${propertyId}/reviews/?page=${page}&page_size=${pageSize}`);
  },
  getPropertyReviewStats(propertyId: string) {
    return this.get(`/api/properties/${propertyId}/review-stats/`);
  },
  createPropertyReview(propertyId: string, reviewData: { rating: number; title?: string; content: string; tag_keys?: string[] }) {
    return this.post(`/api/properties/${propertyId}/reviews/`, reviewData);
  },
  updateReview(reviewId: string, reviewData: { rating?: number; title?: string; content?: string; tag_keys?: string[] }) {
    return this.patch(`/api/properties/reviews/${reviewId}/`, reviewData);
  },
  deleteReview(reviewId: string) {
    return this.delete(`/api/properties/reviews/${reviewId}/`);
  },

  // 房源详情相关
  getPropertiesWithReviews(params?: URLSearchParams) {
    const query = params ? `?${params.toString()}` : '';
    return this.get(`/api/properties/with-reviews/${query}`);
  },
  getPropertyWithReviews(propertyId: string) {
    return this.get(`/api/properties/${propertyId}/with-reviews/`);
  },

  // 邮箱验证/密码重置
  sendVerificationEmail(data: { email: string; verification_type?: string; language?: string; }) {
    return this.post('/api/auth/send-verification/', data);
  },
  verifyEmailToken(token: string) {
    return this.post('/api/auth/verify-email/', { token });
  },
  resendVerificationEmail(data: { verification_type?: string; language?: string; }) {
    return this.post('/api/auth/resend-verification/', data);
  },
  getVerificationStatus() {
    return this.get('/api/auth/verification-status/');
  },
  cancelVerification(verification_type: string) {
    return this.post('/api/auth/cancel-verification/', { verification_type });
  },

  // 密码重置
  verifyResetToken(token: string) {
    return this.post('/api/auth/verify-reset-token/', { token });
  },
  resetPassword(data: { token: string; password: string; }) {
    return this.post('/api/auth/reset-password/', data);
  },
  changePassword(data: { current_password: string; new_password: string; }) {
    return this.post('/api/auth/change-password/', data);
  },

  // R2 直传
  createDraftProperty(initialData?: any) {
    return this.post('/api/properties/draft/', initialData || {});
  },
  getPresignedUploadUrl(data: { file_type: string; file_size: number; prefix?: string; propertyId?: string; }) {
    return this.post('/api/media/presigned-url/', data);
  },
  updatePropertyImages(propertyId: string, images: any[]) {
    return this.post('/api/media/draft-properties/images/', { draft_id: propertyId, images });
  },
  publishDraftProperty(propertyId: string, propertyData?: any) {
    const payload = { draft_id: propertyId, ...(propertyData || {}) };
    return this.post('/api/media/draft-properties/publish/', payload);
  },
  deletePropertyImageR2(propertyId: string, imageKey: string) {
    return this.post('/api/media/delete-file/', { file_key: imageKey, property_id: propertyId });
  },
};

export default clientApiService;
