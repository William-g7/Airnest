import { getAccessToken } from '../auth/session';
import { tokenService } from './tokenService';
import { useAuthStore } from '../stores/authStore';
import { ErrorType } from '../utils/errorHandler';
import { getCsrfToken, initCsrfToken } from './csrfService';

interface RequestOptions {
  forceRefresh?: boolean;
  suppressToast?: boolean;
  cacheStrategy?: 'no-cache' | 'short-cache' | 'medium-cache' | 'default';
}

export class ApiError extends Error {
  statusCode?: number;
  errorType: ErrorType;

  constructor(message: string, errorType: ErrorType = ErrorType.DEFAULT, statusCode?: number) {
    super(message);
    this.name = 'ApiError';
    this.errorType = errorType;
    this.statusCode = statusCode;
  }
}

export function createAuthError(
  type: 'token_missing' | 'token_expired' | 'refresh_failed'
): ApiError {
  switch (type) {
    case 'token_missing':
      return new ApiError('Authentication required', ErrorType.UNAUTHORIZED);
    case 'token_expired':
      return new ApiError('Your session has expired', ErrorType.UNAUTHORIZED, 401);
    case 'refresh_failed':
      return new ApiError('Failed to refresh authentication', ErrorType.UNAUTHORIZED);
    default:
      return new ApiError('Authentication error', ErrorType.UNAUTHORIZED);
  }
}

// 缓存策略函数 - 根据URL和用户状态确定适当的缓存策略
function getCacheHeaders(url: string, options: RequestOptions = {}): Record<string, string> {
  // 如果强制刷新，始终禁用缓存
  if (options.forceRefresh) {
    return {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache'
    };
  }

  // 如果指定了缓存策略，使用指定的策略
  if (options.cacheStrategy) {
    switch (options.cacheStrategy) {
      case 'no-cache':
        return { 'Cache-Control': 'no-cache, no-store, must-revalidate' };
      case 'short-cache':
        return { 'Cache-Control': 'public, max-age=300' }; // 5分钟
      case 'medium-cache':
        return { 'Cache-Control': 'public, max-age=1800' }; // 30分钟
      default:
        return {}; // 使用浏览器默认缓存策略
    }
  }

  // 自动判断缓存策略
  
  // 1. 用户私有数据 - 禁止缓存
  const privatePatterns = [
    '/api/auth/',
    '/api/properties/my/',
    '/api/auth/profile/',
    '/api/auth/verification-status/',
    '/api/properties/.+/reservations/',
    '/api/media/presigned-url/',
    '/api/media/draft-properties/'
  ];
  
  if (privatePatterns.some(pattern => new RegExp(pattern).test(url))) {
    return { 'Cache-Control': 'no-cache, no-store, must-revalidate' };
  }

  // 2. 公开房源数据 - 短期缓存
  const publicCacheablePatterns = [
    '/api/properties/$', // 房源列表
    '/api/properties/\\d+/$', // 单个房源详情
    '/api/properties/with-reviews/',
    '/api/properties/review-tags/',
    '/api/properties/\\d+/review-stats/'
  ];
  
  if (publicCacheablePatterns.some(pattern => new RegExp(pattern).test(url))) {
    return { 'Cache-Control': 'public, max-age=300' }; // 5分钟缓存
  }

  // 3. 评论数据 - 中期缓存
  if (url.includes('/reviews/') && !url.includes('/reviews/') + '[0-9]+' && url.includes('?')) {
    return { 'Cache-Control': 'public, max-age=600' }; // 10分钟缓存
  }

  // 4. 默认不缓存敏感API
  return { 'Cache-Control': 'no-cache' };
}

// Prevent multiple requests from refreshing the token at the same time
let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;
let refreshCallbacks: Array<(token: string | null) => void> = [];

const addRefreshCallback = (callback: (token: string | null) => void) => {
  refreshCallbacks.push(callback);
};

const executeRefreshCallbacks = (token: string | null) => {
  refreshCallbacks.forEach(callback => callback(token));
  refreshCallbacks = [];
};

// Handle token refresh to prevent multiple requests from refreshing at the same time
async function handleTokenRefresh(): Promise<string | null> {
  // If already refreshing, return the existing refresh Promise
  if (isRefreshing) {
    return new Promise(resolve => {
      addRefreshCallback(token => {
        resolve(token);
      });
    });
  }

  isRefreshing = true;
  refreshPromise = tokenService.refreshToken();

  try {
    const newToken = await refreshPromise;
    executeRefreshCallbacks(newToken);
    return newToken;
  } catch (error) {
    executeRefreshCallbacks(null);
    return null;
  } finally {
    isRefreshing = false;
    refreshPromise = null;
  }
}

// 通用的认证请求执行函数
async function executeAuthenticatedRequest<T>(
  method: string,
  url: string,
  data?: any,
  customHeaders?: Record<string, string>,
  options: RequestOptions = {}
): Promise<T> {
  const token = await getAccessToken();
  if (!token) {
    // 创建标准化的认证错误
    const error = createAuthError('token_missing');

    // 通知认证状态已变化（如果不需要抑制消息）
    if (!options.suppressToast) {
      useAuthStore.getState().setUnauthenticated('token_missing');
    }

    throw error;
  }

  try {
    return await makeRequest<T>(method, url, token, data, customHeaders, options);
  } catch (error: any) {
    if (error.message.includes('HTTP error! status: 401')) {
      try {
        // 尝试刷新token
        const newToken = await handleTokenRefresh();

        if (newToken) {
          // 刷新成功，重试请求
          return await makeRequest<T>(method, url, newToken, data, customHeaders, options);
        } else {
          // 刷新失败，需要重新登录
          useAuthStore.getState().setUnauthenticated('session_expired');
          throw createAuthError('refresh_failed');
        }
      } catch (refreshError) {
        if (!options.suppressToast) {
          useAuthStore.getState().setUnauthenticated('session_expired');
        }
        throw refreshError;
      }
    }

    // 处理其他API错误
    throw error;
  }
}

// 执行实际的HTTP请求
async function makeRequest<T>(
  method: string,
  url: string,
  token: string,
  data?: any,
  customHeaders?: Record<string, string>,
  options: RequestOptions = {}
): Promise<T> {
  const requestUrl = `${process.env.NEXT_PUBLIC_API_URL}${url}`;
  const csrfToken = getCsrfToken();
  // 获取当前语言环境
  let currentLocale = 'en';
  if (typeof window !== 'undefined') {
    // 尝试从URL或localStorage获取当前语言
    const pathname = window.location.pathname;
    const localeMatch = pathname.match(/^\/([a-z]{2})\//);
    if (localeMatch) {
      currentLocale = localeMatch[1];
    }
  }

  // 获取缓存策略
  const cacheHeaders = getCacheHeaders(url, options);
  
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    'X-CSRFToken': csrfToken,
    'Accept-Language': currentLocale,
    ...cacheHeaders,
    ...customHeaders,
  };

  const requestOptions: RequestInit = {
    method,
    headers,
    credentials: 'include',
  };

  if (data) {
    if (data instanceof FormData) {
      delete headers['Content-Type'];
      requestOptions.body = data;
    } else {
      headers['Content-Type'] = 'application/json';
      requestOptions.body = JSON.stringify(data);
    }
  }
  try {
    const response = await fetch(requestUrl, requestOptions);
    if (!response.ok) {
      const statusError = new ApiError(
        `HTTP error! status: ${response.status}`,
        getErrorTypeFromStatus(response.status),
        response.status
      );
      throw statusError;
    }
    if (method === 'DELETE' && response.status === 204) {
      return {} as T;
    }
    const text = await response.text();
    if (!text) {
      return {} as T;
    }
    try {
      const parsedData = JSON.parse(text) as T;
      return parsedData;
    } catch (error) {
      throw new ApiError('Invalid JSON response', ErrorType.SERVER_ERROR);
    }
  } catch (error) {
    // 如果已经是ApiError类型，直接抛出
    if (error instanceof ApiError) {
      throw error;
    }
    // 否则包装成ApiError
    throw new ApiError(error instanceof Error ? error.message : 'Unknown error', ErrorType.DEFAULT);
  }
}

// 从HTTP状态码获取错误类型
function getErrorTypeFromStatus(status: number): ErrorType {
  switch (status) {
    case 400:
      return ErrorType.VALIDATION_ERROR;
    case 401:
      return ErrorType.UNAUTHORIZED;
    case 403:
      return ErrorType.FORBIDDEN;
    case 404:
      return ErrorType.NOT_FOUND;
    case 422:
      return ErrorType.VALIDATION_ERROR;
    case 500:
    case 502:
    case 503:
    case 504:
      return ErrorType.SERVER_ERROR;
    default:
      return ErrorType.DEFAULT;
  }
}

// 处理未认证请求的错误
function handleUnauthenticatedResponseError(response: Response, responseData: any): ApiError {
  const status = response.status;
  let errorMessage = 'Unknown error';
  let errorType = ErrorType.DEFAULT;

  if (!response.ok) {
    // 获取最合适的错误消息
    if (responseData && responseData.email) {
      errorMessage = responseData.email[0];
      errorType = ErrorType.VALIDATION_ERROR;
    } else if (responseData && responseData.detail) {
      errorMessage = responseData.detail;
    } else if (responseData && responseData.non_field_errors) {
      errorMessage = responseData.non_field_errors[0];
    } else if (responseData && responseData.password) {
      errorMessage = responseData.password[0];
      errorType = ErrorType.VALIDATION_ERROR;
    } else if (typeof responseData === 'object' && Object.keys(responseData).length > 0) {
      const firstErrorKey = Object.keys(responseData)[0];
      const errorValue = responseData[firstErrorKey];
      errorMessage = Array.isArray(errorValue) ? errorValue[0] : errorValue;
    }

    // 根据状态码设置错误类型
    errorType = getErrorTypeFromStatus(status);

    // 特殊处理登录错误
    if (
      status === 400 &&
      (errorMessage.includes('credentials') || errorMessage.includes('password'))
    ) {
      errorType = ErrorType.AUTH_INVALID_CREDENTIALS;
    }
  }

  return new ApiError(errorMessage, errorType, status);
}

const apiService = {
  get: async function (url: string, options: RequestOptions = {}): Promise<any> {
    try {
      // 获取当前语言环境
      let currentLocale = 'en';
      if (typeof window !== 'undefined') {
        const pathname = window.location.pathname;
        const localeMatch = pathname.match(/^\/([a-z]{2})\//);
        if (localeMatch) {
          currentLocale = localeMatch[1];
        }
      }

      const headers: Record<string, string> = {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'Accept-Language': currentLocale,
      };

      // 应用缓存策略
      const cacheHeaders = getCacheHeaders(url, options);
      Object.assign(headers, cacheHeaders);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${url}`, {
        method: 'GET',
        headers,
        cache: options.forceRefresh ? 'reload' : 'default',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new ApiError(
          `HTTP error! status: ${response.status}`,
          getErrorTypeFromStatus(response.status),
          response.status
        );
      }
      const data = await response.json();
      return data;
    } catch (error) {
      // 这里不再显示toast，交给调用者处理
      throw error;
    }
  },

  getwithtoken: async function <T = any>(
    url: string,
    options: RequestOptions = {}
  ): Promise<T> {
    try {
      return await executeAuthenticatedRequest<T>('GET', url, undefined, undefined, options);
    } catch (error) {
      // 只在不抑制错误时记录控制台错误
      if (!options.suppressToast) {
        console.error('API request failed:', error);
      }
      throw error;
    }
  },

  post: async function <T = any>(
    url: string,
    data: any,
    options: RequestOptions = {}
  ): Promise<T> {
    try {
      return await executeAuthenticatedRequest<T>('POST', url, data, undefined, options);
    } catch (error) {
      if (!options.suppressToast) {
        console.error('POST request error:', error);
      }
      throw error;
    }
  },

  postwithouttoken: async function (
    url: string,
    data: any,
    options: { suppressToast?: boolean } = {}
  ): Promise<any> {
    try {
      await initCsrfToken();
      const csrfToken = getCsrfToken();

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${url}`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'X-CSRFToken': csrfToken,
        },
        body: JSON.stringify(data),
        credentials: 'include',
      });

      const text = await response.text();
      if (!text) {
        throw new ApiError('Empty response received', ErrorType.SERVER_ERROR);
      }

      try {
        const responseData = JSON.parse(text);
        if (!response.ok) {
          throw handleUnauthenticatedResponseError(response, responseData);
        }
        return responseData;
      } catch (parseError) {
        // 如果JSON解析失败，但我们有响应体，先检查是否包含有用的错误信息
        if (text && text.includes('A user is already registered')) {
          throw new ApiError('A user is already registered with this e-mail address.', ErrorType.VALIDATION_ERROR);
        }

        const errorType = url.includes('/login/')
          ? ErrorType.AUTH_INVALID_CREDENTIALS
          : ErrorType.SERVER_ERROR;

        throw new ApiError('Invalid response from server', errorType);
      }
    } catch (error) {
      throw error;
    }
  },

  patch: async function <T = any>(
    url: string,
    data: any,
    options: RequestOptions = {}
  ): Promise<T> {
    try {
      return await executeAuthenticatedRequest<T>('PATCH', url, data, undefined, options);
    } catch (error) {
      if (!options.suppressToast) {
        console.error('PATCH request error:', error);
      }
      throw error;
    }
  },

  delete: async function <T = any>(
    url: string,
    options: RequestOptions = {}
  ): Promise<T> {
    try {
      return await executeAuthenticatedRequest<T>('DELETE', url, undefined, undefined, options);
    } catch (error) {
      if (!options.suppressToast) {
        console.error('DELETE request error:', error);
      }
      throw error;
    }
  },

  getPropertyReservations: async function (propertyId: string): Promise<any> {
    return this.getwithtoken(`/api/properties/${propertyId}/reservations/`);
  },

  updatePropertyImagesOrder: async function (
    propertyId: string,
    imageOrders: Array<{ id: number; order: number }>
  ): Promise<any> {
    const url = `/api/properties/${propertyId}/images/update-order/`;
    try {
      const response = await this.post(url, { image_orders: imageOrders });
      return response;
    } catch (error) {
      throw error;
    }
  },

  deletePropertyImage: async function (propertyId: string, imageId: number): Promise<any> {
    const url = `/api/properties/${propertyId}/images/${imageId}/`;
    try {
      const response = await this.delete(url);
      return response;
    } catch (error) {
      throw error;
    }
  },

  // 评论相关API
  getReviewTags: async function (): Promise<any> {
    return this.get('/api/properties/review-tags/', { cacheStrategy: 'medium-cache' });
  },

  getPropertyReviews: async function (
    propertyId: string, 
    page: number = 1, 
    pageSize: number = 10
  ): Promise<any> {
    return this.get(`/api/properties/${propertyId}/reviews/?page=${page}&page_size=${pageSize}`, { cacheStrategy: 'short-cache' });
  },

  getPropertyReviewStats: async function (propertyId: string): Promise<any> {
    return this.get(`/api/properties/${propertyId}/review-stats/`, { cacheStrategy: 'short-cache' });
  },

  createPropertyReview: async function (
    propertyId: string,
    reviewData: {
      rating: number;
      title?: string;
      content: string;
      tag_keys?: string[];
    }
  ): Promise<any> {
    return this.post(`/api/properties/${propertyId}/reviews/`, reviewData);
  },

  updateReview: async function (
    reviewId: string,
    reviewData: {
      rating?: number;
      title?: string;
      content?: string;
      tag_keys?: string[];
    }
  ): Promise<any> {
    return this.patch(`/api/properties/reviews/${reviewId}/`, reviewData);
  },

  deleteReview: async function (reviewId: string): Promise<any> {
    return this.delete(`/api/properties/reviews/${reviewId}/`);
  },

  // 获取带评论统计的房源列表
  getPropertiesWithReviews: async function (params?: URLSearchParams): Promise<any> {
    const queryString = params ? `?${params.toString()}` : '';
    return this.get(`/api/properties/with-reviews/${queryString}`, { cacheStrategy: 'short-cache' });
  },

  // 获取单个房源的详细信息（包含评论统计）
  getPropertyWithReviews: async function (propertyId: string): Promise<any> {
    return this.get(`/api/properties/${propertyId}/with-reviews/`, { cacheStrategy: 'short-cache' });
  },

  // 邮箱验证相关API
  sendVerificationEmail: async function (data: {
    email: string;
    verification_type?: string;
    language?: string;
  }): Promise<any> {
    return this.postwithouttoken('/api/auth/send-verification/', data);
  },

  verifyEmailToken: async function (token: string): Promise<any> {
    return this.postwithouttoken('/api/auth/verify-email/', { token });
  },

  resendVerificationEmail: async function (data: {
    verification_type?: string;
    language?: string;
  }): Promise<any> {
    return this.post('/api/auth/resend-verification/', data);
  },

  getVerificationStatus: async function (): Promise<any> {
    return this.getwithtoken('/api/auth/verification-status/');
  },

  cancelVerification: async function (verification_type: string): Promise<any> {
    return this.post('/api/auth/cancel-verification/', { verification_type });
  },

  // 密码重置相关API
  verifyResetToken: async function (token: string): Promise<any> {
    return this.postwithouttoken('/api/auth/verify-reset-token/', { token });
  },
  
  resetPassword: async function (data: {
    token: string;
    password: string;
  }): Promise<any> {
    return this.postwithouttoken('/api/auth/reset-password/', data);
  },

  changePassword: async function (data: {
    current_password: string;
    new_password: string;
  }): Promise<any> {
    return this.post('/api/auth/change-password/', data);
  },

  // R2直传相关API
  createDraftProperty: async function (initialData?: any): Promise<any> {
    return this.post('/api/properties/draft/', initialData || {});
  },

  getPresignedUploadUrl: async function (data: {
    file_type: string;
    file_size: number;
    prefix?: string;
    propertyId?: string;
  }): Promise<any> {
    return this.post('/api/media/presigned-url/', data);
  },

  updatePropertyImages: async function (propertyId: string, images: any[]): Promise<any> {
    return this.post('/api/media/draft-properties/images/', { draft_id: propertyId, images });
  },

  publishDraftProperty: async function (propertyId: string, propertyData?: any): Promise<any> {
    const payload = { draft_id: propertyId, ...(propertyData || {}) };
    return this.post('/api/media/draft-properties/publish/', payload);
  },

  deletePropertyImageR2: async function (propertyId: string, imageKey: string): Promise<any> {
    return this.post('/api/media/delete-file/', { file_key: imageKey, property_id: propertyId });
  },
};

export default apiService;
