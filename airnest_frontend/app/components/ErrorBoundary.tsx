'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { useTranslations } from 'next-intl';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

// 由于useTranslations钩子不能在class组件中使用，我们创建一个包装函数组件
export default function ErrorBoundaryWithTranslation(props: ErrorBoundaryProps) {
  // 可能获取翻译失败
  let errorText;
  try {
    const t = useTranslations('errors');
    errorText = {
      title: t('errorBoundary.title'),
      message: t('errorBoundary.message'),
      retry: t('errorBoundary.retry'),
    };
  } catch (e) {
    // 提供默认文本
    errorText = {
      title: '出现了问题',
      message: '此部分加载时发生错误',
      retry: '重试',
    };
  }

  return <ErrorBoundaryClass {...props} errorText={errorText} />;
}

class ErrorBoundaryClass extends Component<
  ErrorBoundaryProps & { errorText: any },
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps & { errorText: any }) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('Error boundary:', error, errorInfo);
    
    // 在生产环境记录错误信息
    if (process.env.NODE_ENV === 'production') {
      // 可以在这里添加自定义的错误上报逻辑
      console.error('Production error:', {
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'unknown',
        url: typeof window !== 'undefined' ? window.location.href : 'unknown'
      });
    }
  }

  resetError = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    const { hasError, error } = this.state;
    const { children, fallback, errorText } = this.props;

    if (hasError) {
      if (fallback) {
        return fallback;
      }

      return (
        <div className="p-4 rounded-lg border border-red-300 bg-red-50 text-red-800">
          <h3 className="text-lg font-semibold mb-2">{errorText.title}</h3>
          <p className="mb-4">{errorText.message}</p>
          {error && (
            <pre className="text-sm bg-red-100 p-2 rounded overflow-auto max-h-40 mb-4">
              {error.toString()}
            </pre>
          )}
          <button
            onClick={this.resetError}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            {errorText.retry}
          </button>
        </div>
      );
    }

    return children;
  }
}
