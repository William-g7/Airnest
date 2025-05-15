export const GA_MEASUREMENT_ID = 'G-6NEJE2CTMB';

// 页面浏览跟踪
export const pageview = (url: string) => {
  if (typeof window !== 'undefined' && 'gtag' in window) {
    window.gtag('config', GA_MEASUREMENT_ID, {
      page_path: url,
    });
  }
};

// 事件跟踪
export interface GTagEvent {
  action: string;
  category: string;
  label: string;
  value?: number;
}

// 追踪自定义事件
export const event = ({ action, category, label, value }: GTagEvent) => {
  if (typeof window !== 'undefined' && 'gtag' in window) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
};

// 跟踪 Web Vitals 性能指标
export const sendWebVitals = ({ name, delta, id }: { name: string; delta: number; id: string }) => {
  if (typeof window !== 'undefined' && 'gtag' in window) {
    window.gtag('event', name, {
      event_category: 'Web Vitals',
      value: Math.round(name === 'CLS' ? delta * 1000 : delta),
      event_label: id,
      non_interaction: true,
    });
  }
};
