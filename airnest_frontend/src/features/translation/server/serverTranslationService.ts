import 'server-only';
import { PropertyType } from '@properties/types/Property';
import { UserContextData } from '@auth/server/session';

export interface TranslationData {
  titles: Record<string, string>;
  cities: Record<string, string>;
  countries: Record<string, string>;
}

/**
 * 服务器侧：首屏 5 条房源的 title/city/country 统一用 BFF GET /backend/translate
 * - 便于 CDN 公共缓存
 * - 不带 Authorization
 * - 相对路径即可，Next.js 服务端 fetch 支持相对路径命中本应用路由
 */
export async function getServerTranslations(
  properties: PropertyType[],
  targetLocale: string,
  _userContext?: UserContextData
): Promise<TranslationData> {
  if (targetLocale === 'en' || properties.length === 0) {
    return { titles: {}, cities: {}, countries: {} };
  }

  const titlesToTranslate = Array.from(new Set(properties.map(p => p.title).filter(Boolean))) as string[];
  const citiesToTranslate = Array.from(new Set(properties.map(p => p.city).filter(Boolean))) as string[];
  const countriesToTranslate = Array.from(new Set(properties.map(p => p.country).filter(Boolean))) as string[];

  const allTexts = [...titlesToTranslate, ...citiesToTranslate, ...countriesToTranslate];
  if (allTexts.length === 0) {
    return { titles: {}, cities: {}, countries: {} };
  }

  // 稳定排序，提升 CDN 命中（同集合生成同 URL）
  allTexts.sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));

  try {
    const qs = new URLSearchParams();
    qs.set('l', targetLocale);
    for (const q of allTexts) qs.append('q', q);
    
    const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/backend/translate?${qs.toString()}`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });

    if (!res.ok) {
      console.error(`Failed to translate (server GET): ${res.status} ${res.statusText}`);
      return createFallbackTranslations(properties);
    }

    const data = await res.json();
    const translations: Record<string, string> = data?.translations ?? {};

    const out: TranslationData = { titles: {}, cities: {}, countries: {} };
    for (const t of titlesToTranslate) if (translations[t]) out.titles[t] = translations[t];
    for (const c of citiesToTranslate) if (translations[c]) out.cities[c] = translations[c];
    for (const c of countriesToTranslate) if (translations[c]) out.countries[c] = translations[c];

    return out;
  } catch (error) {
    console.error('Failed to translate in server side (GET via BFF):', error);
    return createFallbackTranslations(properties);
  }
}

// 使用原文作为 fallback
function createFallbackTranslations(properties: PropertyType[]): TranslationData {
  const fallback: TranslationData = { titles: {}, cities: {}, countries: {} };
  for (const p of properties) {
    if (p.title) fallback.titles[p.title] = p.title;
    if (p.city) fallback.cities[p.city] = p.city;
    if (p.country) fallback.countries[p.country] = p.country;
  }
  return fallback;
}
