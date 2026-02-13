'use client';

import { useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { ErrorType } from '@errors/error';
import {
  showErrorToast,
  getErrorMessage,
  normalizeApiError,
  type NormalizedApiError,
} from '@errors/errorHandler';
import { ApiError } from '@auth/client/clientApiService';

export const useErrorHandler = () => {
  // 统一用 errors 命名空间做文案
  const tErrors = useTranslations('errors');

  // 直接弹 toast（内部已处理 silent / CANCELED）
  const handleError = useCallback((error: unknown) => {
    showErrorToast(error, tErrors);
  }, [tErrors]);

  // 只拿到可展示文本（不弹 toast）
  const getError = useCallback((error: unknown): string => {
    return getErrorMessage(error, tErrors);
  }, [tErrors]);

  // 结构化解析（给分支判断用）
  const normalize = useCallback((error: unknown): NormalizedApiError => {
    return normalizeApiError(error);
  }, []);

  // 构造一个带类型的错误（可选自定义 message / silent）
  const createError = useCallback(
    (type: ErrorType, message?: string, silent?: boolean) => {
      return new ApiError(message ?? type, type, undefined, silent);
    },
    []
  );

  // 直接根据类型弹错（便捷方法）
  const showError = useCallback(
    (type: ErrorType, message?: string) => {
      handleError(createError(type, message));
    },
    [createError, handleError]
  );

  return {
    handleError,
    getError,
    normalize,
    createError,
    showError,
    ErrorType,
  };
};
