'use client';

import { useTranslations } from 'next-intl';
import { showErrorToast, ErrorType, getErrorMessage } from '@/app/utils/errorHandler';
import { useCallback } from 'react';

export const useErrorHandler = () => {
    const tErrors = useTranslations('errors');

    // 显示错误信息的toast
    const handleError = useCallback((error: any) => {
        showErrorToast(error, tErrors);
    }, [tErrors]);

    // 获取错误消息文本（不显示toast）
    const getError = useCallback((error: any): string => {
        return getErrorMessage(error, tErrors);
    }, [tErrors]);

    // 创建一个可直接显示的特定类型错误
    const createError = useCallback((type: ErrorType): Error => {
        return new Error(type);
    }, []);

    // 显示特定类型的错误
    const showError = useCallback((type: ErrorType) => {
        const error = createError(type);
        handleError(error);
    }, [createError, handleError]);

    return {
        handleError,
        getError,
        createError,
        showError,
        ErrorType
    };
}; 