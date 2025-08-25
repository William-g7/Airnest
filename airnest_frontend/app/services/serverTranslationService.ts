import { PropertyType } from '../constants/propertyType';

export interface TranslationData {
  titles: Record<string, string>;
  cities: Record<string, string>;
  countries: Record<string, string>;
}

/**
 * 为服务端渲染的房源获取翻译数据
 * 包含长期缓存策略（1周）以提高性能
 */
export async function getServerTranslations(
  properties: PropertyType[], 
  targetLocale: string
): Promise<TranslationData> {
  // 如果是英文或没有房源，直接返回空翻译
  if (targetLocale === 'en' || properties.length === 0) {
    return { titles: {}, cities: {}, countries: {} };
  }

  try {
    // 收集所有需要翻译的文本（去重）
    const titlesToTranslate = [...new Set(
      properties.map(p => p.title).filter(Boolean)
    )];
    const citiesToTranslate = [...new Set(
      properties.map(p => p.city).filter(Boolean)
    )];
    const countriesToTranslate = [...new Set(
      properties.map(p => p.country).filter(Boolean)
    )];

    // 合并所有文本进行批量翻译
    const allTexts = [
      ...titlesToTranslate,
      ...citiesToTranslate, 
      ...countriesToTranslate
    ];

    if (allTexts.length === 0) {
      return { titles: {}, cities: {}, countries: {} };
    }

    console.log(` 服务端翻译请求: ${allTexts.length}个文本, 目标语言: ${targetLocale}`);

    const apiUrl = `${process.env.API_URL || process.env.NEXT_PUBLIC_API_URL}/api/translate/batch/`;
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        texts: allTexts,
        target_language: targetLocale
      }),
      cache: 'force-cache',
      next: { 
        revalidate: 604800 // 7天 = 7 * 24 * 60 * 60秒
      }
    });

    if (!response.ok) {
      console.error(`翻译API请求失败: ${response.status} ${response.statusText}`);
      return createFallbackTranslations(properties);
    }

    const result = await response.json();
    const translations = result.translations || {};

    // 将翻译结果按类型分类
    const translationData: TranslationData = {
      titles: {},
      cities: {},
      countries: {}
    };

    // 分类翻译结果
    titlesToTranslate.forEach(title => {
      if (translations[title]) {
        translationData.titles[title] = translations[title];
      }
    });

    citiesToTranslate.forEach(city => {
      if (translations[city]) {
        translationData.cities[city] = translations[city];
      }
    });

    countriesToTranslate.forEach(country => {
      if (translations[country]) {
        translationData.countries[country] = translations[country];
      }
    });

    return translationData;

  } catch (error) {
    console.error('服务端翻译失败:', error);
    // 翻译失败时返回原文作为fallback
    return createFallbackTranslations(properties);
  }
}

/**
 * 创建fallback翻译数据（使用原文）
 */
function createFallbackTranslations(properties: PropertyType[]): TranslationData {
  const fallback: TranslationData = {
    titles: {},
    cities: {},
    countries: {}
  };

  properties.forEach(property => {
    if (property.title) fallback.titles[property.title] = property.title;
    if (property.city) fallback.cities[property.city] = property.city;
    if (property.country) fallback.countries[property.country] = property.country;
  });

  return fallback;
}

/**
 * 生成翻译缓存键，用于更精细的缓存控制
 */
export function generateTranslationCacheKey(
  propertyIds: string[], 
  locale: string
): string {
  const sortedIds = propertyIds.sort().join('-');
  return `translations-${locale}-${sortedIds}`;
}