import { getAccessToken } from "../auth/session";
import { tokenService } from "./tokenService";
import { useAuthStore } from "../stores/authStore";
import { ErrorType } from '../utils/errorHandler';

interface RequestOptions {
    forceRefresh?: boolean;
    suppressToast?: boolean;
}

// 定义API错误类，便于错误处理和类型识别
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

// 创建认证错误
export function createAuthError(type: 'token_missing' | 'token_expired' | 'refresh_failed'): ApiError {
    switch (type) {
        case 'token_missing':
            return new ApiError(
                'Authentication required',
                ErrorType.UNAUTHORIZED
            );
        case 'token_expired':
            return new ApiError(
                'Your session has expired',
                ErrorType.UNAUTHORIZED,
                401
            );
        case 'refresh_failed':
            return new ApiError(
                'Failed to refresh authentication',
                ErrorType.UNAUTHORIZED
            );
        default:
            return new ApiError(
                'Authentication error',
                ErrorType.UNAUTHORIZED
            );
    }
}

// 用于防止多个请求同时触发刷新
let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;
let refreshCallbacks: Array<(token: string | null) => void> = [];

// 添加回调到队列
const addRefreshCallback = (callback: (token: string | null) => void) => {
    refreshCallbacks.push(callback);
};

// 执行所有回调
const executeRefreshCallbacks = (token: string | null) => {
    refreshCallbacks.forEach(callback => callback(token));
    refreshCallbacks = [];
};

// 处理令牌刷新的函数，避免多个请求同时触发刷新
async function handleTokenRefresh(): Promise<string | null> {
    // 如果已经在刷新中，返回现有的刷新Promise
    if (isRefreshing) {
        return new Promise((resolve) => {
            addRefreshCallback((token) => {
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
    options: { suppressToast?: boolean } = {}
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
        return await makeRequest<T>(method, url, token, data, customHeaders);
    } catch (error: any) {
        if (error.message.includes('HTTP error! status: 401')) {
            try {
                // 尝试刷新token
                const newToken = await handleTokenRefresh();

                if (newToken) {
                    // 刷新成功，重试请求
                    return await makeRequest<T>(method, url, newToken, data, customHeaders);
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
    customHeaders?: Record<string, string>
): Promise<T> {
    const requestUrl = `${process.env.NEXT_PUBLIC_API_URL}${url}`;
    const headers: Record<string, string> = {
        'Authorization': `Bearer ${token}`,
        ...customHeaders
    };

    const options: RequestInit = {
        method,
        headers,
        credentials: 'include'
    };

    if (data) {
        if (data instanceof FormData) {
            delete headers['Content-Type'];
            options.body = data;
        } else {
            headers['Content-Type'] = 'application/json';
            options.body = JSON.stringify(data);
        }
    }
    try {
        const response = await fetch(requestUrl, options);
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
        throw new ApiError(
            error instanceof Error ? error.message : 'Unknown error',
            ErrorType.DEFAULT
        );
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
        if (status === 400 && (errorMessage.includes('credentials') || errorMessage.includes('password'))) {
            errorType = ErrorType.AUTH_INVALID_CREDENTIALS;
        }
    }

    return new ApiError(errorMessage, errorType, status);
}

const apiService = {
    get: async function (url: string, options: RequestOptions = {}): Promise<any> {
        try {
            const headers: Record<string, string> = {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            };

            if (options.forceRefresh) {
                headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
                headers['Pragma'] = 'no-cache';
            }

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

    getwithtoken: async function <T = any>(url: string, options: { suppressToast?: boolean } = {}): Promise<T> {
        try {
            return await executeAuthenticatedRequest<T>('GET', url, undefined, undefined, options);
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    },

    post: async function <T = any>(url: string, data: any, options: { suppressToast?: boolean } = {}): Promise<T> {
        try {
            return await executeAuthenticatedRequest<T>('POST', url, data, undefined, options);
        } catch (error) {
            console.error('POST request error:', error);
            throw error;
        }
    },

    postwithouttoken: async function (url: string, data: any, options: { suppressToast?: boolean } = {}): Promise<any> {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${url}`, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
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
                console.error('JSON parsing error:', parseError);
                console.log('Response text:', text);

                const errorType = url.includes('/login/')
                    ? ErrorType.AUTH_INVALID_CREDENTIALS
                    : ErrorType.SERVER_ERROR;

                throw new ApiError(
                    'Invalid response from server',
                    errorType
                );
            }
        } catch (error) {
            // 这里不再显示toast，交给调用者处理
            throw error;
        }
    },

    patch: async function <T = any>(url: string, data: any, options: { suppressToast?: boolean } = {}): Promise<T> {
        try {
            return await executeAuthenticatedRequest<T>('PATCH', url, data, undefined, options);
        } catch (error) {
            console.error('PATCH request error:', error);
            throw error;
        }
    },

    delete: async function <T = any>(url: string, options: { suppressToast?: boolean } = {}): Promise<T> {
        try {
            return await executeAuthenticatedRequest<T>('DELETE', url, undefined, undefined, options);
        } catch (error) {
            console.error('DELETE request error:', error);
            throw error;
        }
    },

    getPropertyReservations: async function (propertyId: string): Promise<any> {
        return this.getwithtoken(`/api/properties/${propertyId}/reservations/`);
    },

    updatePropertyImagesOrder: async function (propertyId: string, imageOrders: Array<{ id: number, order: number }>): Promise<any> {
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
    }
};

export default apiService;
