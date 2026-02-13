'use client';

import toast, { type ToastOptions, type IconTheme } from 'react-hot-toast';
import { BASE_TOAST_OPTIONS, TOAST_THEME_STYLES } from './toastStyles';

function mergeOptions(theme: Partial<ToastOptions>, opts?: ToastOptions): ToastOptions {
  const style = {
    ...BASE_TOAST_OPTIONS.style,
    ...theme.style,
    ...opts?.style,
  };

  let iconTheme: IconTheme | undefined;
  if (theme.iconTheme || opts?.iconTheme) {
    iconTheme = {
      primary:
        opts?.iconTheme?.primary ??
        (theme.iconTheme as IconTheme | undefined)?.primary ??
        '#fff',
      secondary:
        opts?.iconTheme?.secondary ??
        (theme.iconTheme as IconTheme | undefined)?.secondary ??
        '#000',
    };
  }

  return {
    ...BASE_TOAST_OPTIONS,
    ...theme,
    ...opts,
    style,
    ...(iconTheme ? { iconTheme } : {}), // 只在需要时设置
  };
}

export const toastSuccess = (msg: string, opts?: ToastOptions) =>
  toast.success(msg, mergeOptions(TOAST_THEME_STYLES.success, opts));

export const toastError = (msg: string, opts?: ToastOptions) =>
  toast.error(msg, mergeOptions(TOAST_THEME_STYLES.error, opts));

export const toastInfo = (msg: string, opts?: ToastOptions) =>
  toast(msg, mergeOptions(TOAST_THEME_STYLES.info, opts));

export const toastWarning = (msg: string, opts?: ToastOptions) =>
  toast(msg, mergeOptions(TOAST_THEME_STYLES.warning, opts));

export const toastDefault = (msg: string, opts?: ToastOptions) =>
  toast(msg, mergeOptions(TOAST_THEME_STYLES.default, opts));
