import type { Property } from './Property';
import type { EditableProperty } from './EditableProperty';

export function getDefaultTimezone(): string {
  try {
    // 在浏览器端能拿到用户本地时区
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

export function toEditableProperty(p: Property): EditableProperty {
  // 去掉统计类字段，保证 timezone 一定有值
  const { average_rating, total_reviews, positive_review_rate, ...rest } = p;
  return {
    ...rest,
    timezone: p.timezone ?? getDefaultTimezone(),
  };
}
