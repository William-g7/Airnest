import { Metric, onCLS, onFCP, onINP, onLCP, onTTFB } from 'web-vitals';
import { sendWebVitals as sendToGA } from './gtag';

// 定义报告函数类型
type ReportHandler = (metric: Metric) => void;

// 将指标数据发送到GA4
const sendToAnalytics = (metric: Metric) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`Web Vitals: ${metric.name} = ${metric.value}`);
  }

  try {
    sendToGA({
      name: metric.name,
      delta: typeof metric.delta === 'number' ? metric.delta : 0,
      id: metric.id
    });
  } catch (error) {
    console.error('Web Vitals: 处理指标数据时出错', error);
  }
};

export function reportWebVitals(onPerfEntry: ReportHandler = sendToAnalytics) {
  if (typeof window !== 'undefined') {
    onCLS(onPerfEntry); 
    onLCP(onPerfEntry); 
    onINP(onPerfEntry); 

    onFCP(onPerfEntry); 
    onTTFB(onPerfEntry); 
  }
}
