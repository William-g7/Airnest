'use client';

import React, { Component, type ErrorInfo, type ReactNode } from 'react';

type Props = {
  children: ReactNode;
  fallback?: ReactNode | ((error: Error | null, reset: () => void) => ReactNode);
  onError?: (error: Error, info: ErrorInfo) => void;
};

type State = { hasError: boolean; error: Error | null };

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    this.props.onError?.(error, info);
    if (process.env.NODE_ENV !== 'production') {
      console.error('ErrorBoundary caught:', error, info);
    }
  }

  private reset = () => this.setState({ hasError: false, error: null });

  render(): ReactNode {
    const { hasError, error } = this.state;
    const { children, fallback } = this.props;

    if (!hasError) return children;

    if (typeof fallback === 'function') return (fallback as any)(error, this.reset);
    if (fallback) return fallback;

    return (
      <div className="p-4 rounded-lg border border-red-300 bg-red-50 text-red-800">
        <h3 className="text-lg font-semibold mb-2">Something went wrong</h3>
        {error && (
          <pre className="text-xs bg-red-100 p-2 rounded overflow-auto max-h-40 mb-3">
            {String(error)}
          </pre>
        )}
        <button
          onClick={this.reset}
          className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }
}
