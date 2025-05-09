import { getAccessToken } from "../auth/session";
import { tokenService } from "./tokenService";
import { useAuthStore } from "../stores/authStore";
import { showErrorToast } from '../utils/errorHandler';

interface RequestOptions {
    forceRefresh?: boolean;
    suppressToast?: boolean;
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
        const error = new Error('No authentication token available');
        if (!options.suppressToast) {
            showErrorToast(error);
        }
        throw error;
    }

    try {
        return await makeRequest<T>(method, url, token, data, customHeaders);
    } catch (error: any) {
        if (error.message.includes('HTTP error! status: 401')) {
            try {
                const newToken = await handleTokenRefresh();

                if (newToken) {
                    return await makeRequest<T>(method, url, newToken, data, customHeaders);
                } else {
                    useAuthStore.getState().setUnauthenticated();
                    const authError = new Error('Authentication failed. Please login again.');
                    if (!options.suppressToast) {
                        showErrorToast(authError);
                    }
                    throw authError;
                }
            } catch (refreshError) {
                if (!options.suppressToast) {
                    showErrorToast(refreshError);
                }
                throw refreshError;
            }
        }

        if (!options.suppressToast) {
            showErrorToast(error);
        }
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
            throw new Error(`HTTP error! status: ${response.status}`);
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
            throw new Error('Invalid JSON response');
        }
    } catch (error) {
        throw error;
    }
}

// 处理未认证请求的错误
function handleUnauthenticatedResponseError(response: Response, responseData: any): Error {
    if (!response.ok) {
        if (responseData && responseData.email) {
            return new Error(responseData.email[0]);
        } else if (responseData && responseData.detail) {
            return new Error(responseData.detail);
        } else if (responseData && responseData.non_field_errors) {
            return new Error(responseData.non_field_errors[0]);
        } else if (responseData && responseData.password) {
            return new Error(responseData.password[0]);
        } else if (typeof responseData === 'object' && Object.keys(responseData).length > 0) {
            const firstErrorKey = Object.keys(responseData)[0];
            const errorValue = responseData[firstErrorKey];
            const errorMessage = Array.isArray(errorValue) ? errorValue[0] : errorValue;
            return new Error(errorMessage || 'API Error');
        } else {
            return new Error('AUTH_INVALID_CREDENTIALS');
        }
    }
    return new Error('Unknown error');
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
                const error = new Error(`HTTP error! status: ${response.status}`);
                showErrorToast(error);
                throw error;
            }
            const data = await response.json();
            return data;
        } catch (error) {
            showErrorToast(error);
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
                const error = new Error('Empty response received');
                if (!options.suppressToast) {
                    showErrorToast(error);
                }
                throw error;
            }

            try {
                const responseData = JSON.parse(text);
                if (!response.ok) {
                    const error = handleUnauthenticatedResponseError(response, responseData);
                    if (!options.suppressToast) {
                        showErrorToast(error);
                    }
                    throw error;
                }
                return responseData;
            } catch (parseError) {
                console.error('JSON parsing error:', parseError);
                console.log('Response text:', text);

                const error = url.includes('/login/')
                    ? new Error('AUTH_INVALID_CREDENTIALS')
                    : new Error('Invalid response from server. Please try again later.');

                if (!options.suppressToast) {
                    showErrorToast(error);
                }
                throw error;
            }
        } catch (error) {
            if (!options.suppressToast) {
                showErrorToast(error);
            }
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
