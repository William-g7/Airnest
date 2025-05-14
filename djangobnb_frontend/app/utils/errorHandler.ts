import toast from 'react-hot-toast';

export interface ApiError {
  message: string;
  statusCode?: number;
  errorType?: string;
}

export enum ErrorType {
  AUTH_INVALID_CREDENTIALS = 'AUTH_INVALID_CREDENTIALS',
  NETWORK_ERROR = 'NETWORK_ERROR',
  SERVER_ERROR = 'SERVER_ERROR',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  DEFAULT = 'DEFAULT',
}

export const getErrorMessage = (error: any, t?: (key: string) => string): string => {
  if (!t) {
    if (typeof error === 'string') {
      return error;
    }

    if (error instanceof Error) {
      return error.message;
    }

    return 'An error occurred';
  }

  let errorType = ErrorType.DEFAULT;

  if (typeof error === 'string') {
    if (Object.values(ErrorType).includes(error as ErrorType)) {
      errorType = error as ErrorType;
    }
  } else if (error instanceof Error) {
    for (const type of Object.values(ErrorType)) {
      if (error.message.includes(type)) {
        errorType = type;
        break;
      }
    }

    if (error.message?.includes('HTTP error! status:')) {
      const statusMatch = error.message.match(/HTTP error! status: (\d+)/);
      if (statusMatch && statusMatch[1]) {
        const statusCode = parseInt(statusMatch[1], 10);

        switch (statusCode) {
          case 401:
            errorType = ErrorType.UNAUTHORIZED;
            break;
          case 403:
            errorType = ErrorType.FORBIDDEN;
            break;
          case 404:
            errorType = ErrorType.NOT_FOUND;
            break;
          case 422:
            errorType = ErrorType.VALIDATION_ERROR;
            break;
          case 500:
          case 502:
          case 503:
          case 504:
            errorType = ErrorType.SERVER_ERROR;
            break;
        }
      }
    }
  }

  return t(`errors.${errorType}`);
};

// 显示错误提示
export const showErrorToast = (error: any, t?: (key: string) => string): void => {
  const message = getErrorMessage(error, t);
  toast.error(message);
};

// 处理不需要显示toast的错误
export const handleApiError = (error: any, t?: (key: string) => string): ApiError => {
  console.error('API Error:', error);

  let errorType = ErrorType.DEFAULT;
  let statusCode: number | undefined = undefined;

  if (error instanceof Error) {
    if (error.message?.includes('HTTP error! status:')) {
      const statusMatch = error.message.match(/HTTP error! status: (\d+)/);
      if (statusMatch && statusMatch[1]) {
        statusCode = parseInt(statusMatch[1], 10);

        switch (statusCode) {
          case 401:
            errorType = ErrorType.UNAUTHORIZED;
            break;
          case 403:
            errorType = ErrorType.FORBIDDEN;
            break;
          case 404:
            errorType = ErrorType.NOT_FOUND;
            break;
          case 422:
            errorType = ErrorType.VALIDATION_ERROR;
            break;
          case 500:
          case 502:
          case 503:
          case 504:
            errorType = ErrorType.SERVER_ERROR;
            break;
        }
      }
    } else {
      for (const type of Object.values(ErrorType)) {
        if (error.message.includes(type)) {
          errorType = type as ErrorType;
          break;
        }
      }
    }
  }

  return {
    message: getErrorMessage(error, t),
    statusCode,
    errorType,
  };
};
