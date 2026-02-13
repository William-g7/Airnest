import toast from 'react-hot-toast';
import { ErrorType } from '@errors/error';
import { ApiError } from '@auth/client/clientApiService';

export type NormalizedApiError = {
  message: string;
  statusCode?: number;
  errorType: ErrorType;
  silent?: boolean;
};

export const normalizeApiError = (error: unknown): NormalizedApiError => {
  if (error instanceof ApiError) {
    return {
      message: error.message,
      statusCode: error.statusCode,
      errorType: error.errorType,
      silent: error.silent,
    };
  }

  if (typeof error === 'string') {
    return { message: error, errorType: ErrorType.DEFAULT };
  }

  if (error instanceof Error) {
    return { message: error.message || 'An error occurred', errorType: ErrorType.DEFAULT };
  }

  return { message: 'An error occurred', errorType: ErrorType.DEFAULT };
};

const i18nKeyByType: Record<ErrorType, string> = {
  [ErrorType.UNAUTHORIZED]: 'errors.UNAUTHORIZED',
  [ErrorType.FORBIDDEN]: 'errors.FORBIDDEN',
  [ErrorType.NOT_FOUND]: 'errors.NOT_FOUND',
  [ErrorType.VALIDATION_ERROR]: 'errors.VALIDATION_ERROR',
  [ErrorType.SERVER_ERROR]: 'errors.SERVER_ERROR',
  [ErrorType.NETWORK_ERROR]: 'errors.NETWORK_ERROR',
  [ErrorType.RATE_LIMITED]: 'errors.RATE_LIMITED',
  [ErrorType.CANCELED]: 'errors.CANCELED',
  [ErrorType.AUTH_INVALID_CREDENTIALS]: 'errors.AUTH_INVALID_CREDENTIALS',
  [ErrorType.DEFAULT]: 'errors.DEFAULT',
};

export const getErrorMessage = (error: unknown, t?: (key: string) => string): string => {
  const { errorType, message } = normalizeApiError(error);

  if (!t) return message;

  // 规则：校验错误优先返回服务端具体文案，其它类型返回本地化统一文案
  if (errorType === ErrorType.VALIDATION_ERROR && message) return message;

  const key = i18nKeyByType[errorType] || i18nKeyByType[ErrorType.DEFAULT];
  return t(key);
};

export const showErrorToast = (error: unknown, t?: (key: string) => string): void => {
  const { errorType, silent } = normalizeApiError(error);
  if (silent || errorType === ErrorType.CANCELED) return; 
  toast.error(getErrorMessage(error, t));
};

// 也保留一个返回结构化对象的入口（给组件做分支处理）
export const handleApiError = (error: unknown, t?: (key: string) => string): NormalizedApiError => {
  const normalized = normalizeApiError(error);
  return {
    ...normalized,
    message: getErrorMessage(error, t),
  };
};
