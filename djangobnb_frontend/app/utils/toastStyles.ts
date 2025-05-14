// 定义共享的 toast 样式配置
// 在一个地方维护所有 toast 样式，确保 UI 一致性

import { ToastOptions } from 'react-hot-toast';

// 主色调
export const AIRBNB_COLORS = {
  primary: '#FF5A5F', // Airbnb 主题红色
  green: '#00A699', // Airbnb 绿色
  yellow: '#FFB400', // 警告黄色
  dark: '#222222', // 深黑色
  gray: '#484848', // 中灰色
  light: '#f7f7f7', // 浅灰色背景
};

// 基础 toast 选项
export const BASE_TOAST_OPTIONS: Partial<ToastOptions> = {
  duration: 3000,
  style: {
    background: AIRBNB_COLORS.light,
    color: AIRBNB_COLORS.gray,
    borderRadius: '8px',
    padding: '16px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
    fontSize: '14px',
    fontWeight: '500',
    minWidth: '300px',
    maxWidth: '500px',
  },
};

export const TOAST_THEME_STYLES: Record<string, Partial<ToastOptions>> = {
  success: {
    duration: 3000,
    style: {
      background: AIRBNB_COLORS.primary,
      color: '#fff',
      fontWeight: '500',
      minWidth: '300px',
    },
    iconTheme: {
      primary: '#fff',
      secondary: AIRBNB_COLORS.primary,
    },
  },
  error: {
    duration: 4000,
    style: {
      background: AIRBNB_COLORS.dark,
      color: '#fff',
      fontWeight: '500',
      minWidth: '300px',
    },
    iconTheme: {
      primary: '#fff',
      secondary: AIRBNB_COLORS.dark,
    },
  },
  info: {
    duration: 3000,
    style: {
      background: AIRBNB_COLORS.green,
      color: '#fff',
      fontWeight: '500',
      minWidth: '300px',
    },
    iconTheme: {
      primary: '#fff',
      secondary: AIRBNB_COLORS.green,
    },
  },
  warning: {
    duration: 4000,
    style: {
      background: AIRBNB_COLORS.yellow,
      color: AIRBNB_COLORS.gray,
      fontWeight: '500',
      minWidth: '300px',
    },
    iconTheme: {
      primary: AIRBNB_COLORS.gray,
      secondary: AIRBNB_COLORS.yellow,
    },
  },
  default: {
    duration: 3000,
    style: {
      background: '#fff',
      color: AIRBNB_COLORS.gray,
      fontWeight: '500',
      border: '1px solid #e2e8f0',
      minWidth: '300px',
    },
  },
};
