/** 把 'YYYY-MM-DD' 解析为本地 Date（避免时区偏移） */
export function parseLocalISODate(isoDate: string): Date {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  if (!m) return new Date(isoDate); // 不是纯日期就交给原生解析
  const [, y, mo, d] = m;
  return new Date(Number(y), Number(mo) - 1, Number(d));
}

/** 将 UTC ISO 转成“给定时区的墙上日期”（只保留年月日，用于日历比较） */
export function toZonedDay(isoUTC: string, timeZone: string): Date {
  const date = new Date(isoUTC);
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour12: false,
  });
  const parts = Object.fromEntries(
    fmt
      .formatToParts(date)
      .filter(p => p.type !== 'literal')
      .map(p => [p.type, p.value]),
  ) as Record<string, string>;
  return new Date(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
  );
}

/** 将 'YYYY-MM-DD' 当作该时区正午再转为本地 Date（用于需要具体时分秒的场景） */
export function toZonedDateFromYMD(ymd: string, timeZone: string): Date {
  const noon = new Date(`${ymd}T12:00:00Z`); // 用 Z 避免本地偏移
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false,
  });
  const parts = Object.fromEntries(
    fmt
      .formatToParts(noon)
      .filter(p => p.type !== 'literal')
      .map(p => [p.type, p.value]),
  ) as Record<string, string>;
  return new Date(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second),
  );
}

/** YYYY-MM-DD */
export function formatDateYYYYMMDD(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * 在给定时区下格式化日期
 * - iso 可以是 'YYYY-MM-DD' 或 ISO 字符串
 * - style 用 DateTimeFormat 的 dateStyle
 * - locale 建议从 next-intl 的 useLocale() 传入
 */
export function formatLocalizedDate(
  iso: string,
  timeZone: string,
  style: 'short' | 'medium' | 'long' | 'full' = 'medium',
  locale = 'en',
): string {
  const isYMD = /^\d{4}-\d{2}-\d{2}$/.test(iso);
  const d = isYMD ? toZonedDateFromYMD(iso, timeZone) : new Date(iso);
  return new Intl.DateTimeFormat(locale, { timeZone, dateStyle: style }).format(d);
}

/**
 * 计算“晚数”：严格按房源时区的墙上日来算（避免 DST/时差带来的 ±1 天）
 * - 输入可以是 'YYYY-MM-DD' 或 ISO 字符串
 */
export function calculateNightsZoned(
  checkInISO: string,
  checkOutISO: string,
  timeZone: string,
): number {
  // 先得到“墙上日期”
  const startDay = /^\d{4}-\d{2}-\d{2}$/.test(checkInISO)
    ? toZonedDay(`${checkInISO}T00:00:00Z`, timeZone)
    : toZonedDay(checkInISO, timeZone);

  const endDay = /^\d{4}-\d{2}-\d{2}$/.test(checkOutISO)
    ? toZonedDay(`${checkOutISO}T00:00:00Z`, timeZone)
    : toZonedDay(checkOutISO, timeZone);

  // 用 UTC 的 00:00 来计算纯“天数差”，避免本地夏令时影响
  const dayKey = (d: Date) => Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000;
  const diff = Math.trunc(dayKey(endDay) - dayKey(startDay));
  return Math.max(0, diff);
}
