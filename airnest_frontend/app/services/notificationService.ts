import toast from 'react-hot-toast';
import { TOAST_THEME_STYLES } from '../utils/toastStyles';

export enum NotificationType {
  // 认证相关
  AUTH_LOGOUT_ANOTHER_TAB = 'auth.logout_another_tab',
  AUTH_SESSION_EXPIRED = 'auth.session_expired',
  AUTH_LOGIN_SUCCESS = 'auth.login_success',
  AUTH_LOGIN_ERROR = 'auth.login_error',
  AUTH_LOGOUT_SUCCESS = 'auth.logout_success',
  AUTH_REQUIRED = 'auth.required',

  // 常规消息
  SUCCESS = 'general.success',
  ERROR = 'general.error',
  WARNING = 'general.warning',
  INFO = 'general.info',
}

type SupportedLocale = 'zh' | 'en' | 'fr';

interface MessageTemplate {
  [key: string]: {
    [key in SupportedLocale]: string;
  } & {
    duration?: number;
    type?: 'success' | 'error' | 'info' | 'warning';
  };
}


/**
 * 全局通知服务单例
 */
class NotificationService {
  private static instance: NotificationService | null = null;
  private lastToastTime: number = 0;
  private readonly TOAST_COOLDOWN = 2000;
  private lastToastType: string | null = null;

  // 消息模板
  private messageTemplates: MessageTemplate = {
    // 认证消息
    'auth.logout_another_tab': {
      zh: '您已在另一个窗口退出登录',
      en: 'You have been logged out in another window',
      fr: 'Vous avez été déconnecté dans une autre fenêtre',
      duration: 3000,
      type: 'info',
    },
    'auth.session_expired': {
      zh: '您的会话已过期，请重新登录',
      en: 'Your session has expired, please log in again',
      fr: 'Votre session a expiré, veuillez vous reconnecter',
      duration: 3000,
      type: 'error',
    },
    'auth.login_success': {
      zh: '登录成功',
      en: 'Login successful',
      fr: 'Connexion réussie',
      duration: 2000,
      type: 'success',
    },
    'auth.login_error': {
      zh: '登录失败',
      en: 'Login failed',
      fr: 'Échec de la connexion',
      duration: 3000,
      type: 'error',
    },
    'auth.logout_success': {
      zh: '已安全退出登录',
      en: 'Logged out successfully',
      fr: 'Déconnexion réussie',
      duration: 2000,
      type: 'success',
    },
    'auth.required': {
      zh: '请先登录后再访问',
      en: 'Please log in to access this page',
      fr: 'Veuillez vous connecter pour accéder à cette page',
      duration: 3000,
      type: 'warning',
    },

    // 常规消息
    'general.success': {
      zh: '操作成功',
      en: 'Operation successful',
      fr: 'Opération réussie',
      duration: 2000,
      type: 'success',
    },
    'general.error': {
      zh: '发生错误',
      en: 'An error occurred',
      fr: 'Une erreur est survenue',
      duration: 3000,
      type: 'error',
    },
    'general.warning': {
      zh: '警告',
      en: 'Warning',
      fr: 'Avertissement',
      duration: 3000,
      type: 'warning',
    },
    'general.info': {
      zh: '提示信息',
      en: 'Information',
      fr: 'Information',
      duration: 2500,
      type: 'info',
    },
  };

  private constructor() {
    if (typeof window !== 'undefined' && !('lastToastTime' in globalThis)) {
      (globalThis as any).lastToastTime = 0;
    }
  }

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  // 获取当前页面语言
  private getCurrentLocale(): SupportedLocale {
    let locale: SupportedLocale = 'en';

    if (typeof window !== 'undefined') {
      const localeMatch = window.location.pathname.match(/^\/([a-z]{2})/);
      if (localeMatch && localeMatch[1]) {
        const pathLocale = localeMatch[1];
        if (pathLocale === 'zh' || pathLocale === 'en' || pathLocale === 'fr') {
          locale = pathLocale;
        }
      } else {
        const browserLang = navigator.language.split('-')[0];
        if (browserLang === 'zh' || browserLang === 'en' || browserLang === 'fr') {
          locale = browserLang as SupportedLocale;
        }
      }
    }

    return locale;
  }

  // 显示通知消息
  public notify(type: NotificationType | string, customMessage?: string): void {
    const now = Date.now();
    const locale = this.getCurrentLocale();

    // 防抖检查：同一类型的消息在短时间内不重复显示
    if (now - this.lastToastTime < this.TOAST_COOLDOWN && this.lastToastType === type) {
      console.log('NotificationService: toast already displayed, skipping duplicate type:', type);
      return;
    }

    // 获取消息模板
    const template = this.messageTemplates[type as keyof typeof this.messageTemplates];
    if (!template && !customMessage) {
      console.error(
        'NotificationService: unknown message type and no custom message provided:',
        type
      );
      return;
    }

    // 确定最终显示的消息文本
    let message = customMessage || '';
    let duration = 3000;
    let toastType = 'default';

    if (template) {
      message = customMessage || template[locale] || template.en;
      duration = template.duration || duration;
      toastType = template.type || 'default';
    }

    // 更新防抖状态
    this.lastToastTime = now;
    this.lastToastType = type;

    // 确保全局变量更新 (与原有代码兼容)
    if (typeof window !== 'undefined') {
      (globalThis as any).lastToastTime = now;
    }

    // 获取样式配置
    const styleConfig = TOAST_THEME_STYLES[toastType] || TOAST_THEME_STYLES.default;

    // 显示toast通知
    if (toastType === 'success') {
      toast.success(message, {
        duration,
        ...styleConfig,
      });
    } else if (toastType === 'error') {
      toast.error(message, {
        duration,
        ...styleConfig,
      });
    } else if (toastType === 'info') {
      toast(message, {
        duration,
        ...styleConfig,
      });
    } else if (toastType === 'warning') {
      toast(message, {
        duration,
        ...styleConfig,
      });
    } else {
      toast(message, {
        duration,
        ...styleConfig,
      });
    }
  }

  // 认证错误通知
  public notifyAuthRequired(message?: string): void {
    this.notify(NotificationType.AUTH_REQUIRED, message);
  }

  // 会话过期通知
  public notifySessionExpired(): void {
    this.notify(NotificationType.AUTH_SESSION_EXPIRED);
  }

  // 其他标签页登出通知
  public notifyLogoutAnotherTab(): void {
    this.notify(NotificationType.AUTH_LOGOUT_ANOTHER_TAB);
  }

  // 添加自定义消息模板
  public addMessageTemplate(
    key: string,
    template: {
      zh: string;
      en: string;
      fr: string;
      duration?: number;
      type?: 'success' | 'error' | 'info' | 'warning';
    }
  ): void {
    this.messageTemplates[key] = template;
  }
}

// 导出通知服务单例获取函数
export const getNotificationService = (): NotificationService => {
  return NotificationService.getInstance();
};
