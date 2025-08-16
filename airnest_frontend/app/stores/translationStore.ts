import { create } from 'zustand';
import { translateText, translateBatch } from '@/app/services/translationService';
import { useLocaleStore } from './localeStore';
import MemoryTranslationCache from '@/app/services/memoryCache';

// 动态导入的数据库实例
let dbInstance: any = null;
let dbPromise: Promise<any> | null = null;

// 内存缓存实例（用于英语用户或降级）
const memoryCache = new MemoryTranslationCache();

// 条件加载IndexedDB数据库
async function getDatabase() {
  // 如果已经有数据库实例，直接返回
  if (dbInstance) return dbInstance;
  
  // 如果正在加载，等待加载完成
  if (dbPromise) return await dbPromise;
  
  // 开始异步加载数据库
  dbPromise = (async () => {
    try {
      console.log('🗄️ 动态加载IndexedDB翻译缓存...');
      const { TranslationDatabase } = await import('@/app/services/translationDatabase');
      dbInstance = new TranslationDatabase();
      console.log('✅ IndexedDB翻译缓存加载成功');
      return dbInstance;
    } catch (error) {
      console.error('❌ IndexedDB加载失败，降级到内存缓存:', error);
      dbPromise = null; // 重置promise，允许重试
      return null;
    }
  })();
  
  return await dbPromise;
}

// 判断是否需要持久化缓存
function shouldUsePersistentCache(locale: string): boolean {
  // 英语用户不需要翻译，无需持久化缓存
  if (locale === 'en') return false;
  
  // 其他语言用户需要持久化缓存
  return true;
}

interface GroupedTranslationResponse {
  [key: string]: Record<string, string>;
}

interface TranslationState {
  pendingTranslations: string[];
  translateText: (text: string, targetLocale?: string) => Promise<string>;
  translateMultiple: (texts: string[], targetLocale?: string) => Promise<Record<string, string>>;
  translateGrouped: (
    data: Record<string, string[]>,
    targetLocale?: string
  ) => Promise<GroupedTranslationResponse>;
  clearCache: () => Promise<void>;
}

// 智能缓存获取：根据语言选择缓存策略
async function getCachedTranslation(text: string, locale: string): Promise<string | null> {
  // 英语用户优先使用内存缓存
  if (!shouldUsePersistentCache(locale)) {
    return memoryCache.get(text, locale);
  }

  // 首先尝试内存缓存（更快）
  const memoryResult = memoryCache.get(text, locale);
  if (memoryResult) return memoryResult;

  // 然后尝试IndexedDB（持久化）
  try {
    const db = await getDatabase();
    if (!db) return null;

    const { getCachedTranslation: getFromDB } = await import('@/app/services/translationDatabase');
    return await getFromDB(db, text, locale);
  } catch (error) {
    console.error('Error reading from IndexedDB:', error);
    return null;
  }
}

// 智能缓存保存：根据语言选择缓存策略
async function saveTranslation(text: string, locale: string, translation: string): Promise<void> {
  // 总是保存到内存缓存（快速访问）
  memoryCache.set(text, locale, translation);

  // 非英语用户同时保存到IndexedDB（持久化）
  if (shouldUsePersistentCache(locale)) {
    try {
      const db = await getDatabase();
      if (!db) return;

      const { saveTranslation: saveToDB } = await import('@/app/services/translationDatabase');
      await saveToDB(db, text, locale, translation);
    } catch (error) {
      console.error('Error saving to IndexedDB:', error);
    }
  }
}

export const useTranslationStore = create<TranslationState>()((set, get) => ({
  pendingTranslations: [],

  translateText: async (text: string, targetLocale?: string) => {
    if (!text || text.trim() === '') return '';

    const currentLocale = targetLocale || useLocaleStore.getState().locale;

    if (currentLocale === 'en') {
      return text;
    }

    try {
      const cachedTranslation = await getCachedTranslation(text, currentLocale);
      if (cachedTranslation) {
        return cachedTranslation;
      }

      set(state => ({
        pendingTranslations: [...state.pendingTranslations, text],
      }));

      const translatedText = await translateText(text, currentLocale);

      await saveTranslation(text, currentLocale, translatedText);

      set(state => ({
        pendingTranslations: state.pendingTranslations.filter(t => t !== text),
      }));

      return translatedText;
    } catch (error) {
      console.error('Translation error:', error);

      set(state => ({
        pendingTranslations: state.pendingTranslations.filter(t => t !== text),
      }));

      return text;
    }
  },

  translateMultiple: async (texts: string[], targetLocale?: string) => {
    if (!texts || texts.length === 0) return {};

    const currentLocale = targetLocale || useLocaleStore.getState().locale;

    if (currentLocale === 'en') {
      return texts.reduce(
        (acc, text) => {
          acc[text] = text;
          return acc;
        },
        {} as Record<string, string>
      );
    }

    const uncachedTexts: string[] = [];
    const results: Record<string, string> = {};

    await Promise.all(
      texts.map(async text => {
        if (!text) {
          results[text] = '';
          return;
        }

        const cachedTranslation = await getCachedTranslation(text, currentLocale);
        if (cachedTranslation) {
          results[text] = cachedTranslation;
        } else {
          uncachedTexts.push(text);
        }
      })
    );

    if (uncachedTexts.length === 0) {
      return results;
    }

    set(state => ({
      pendingTranslations: [...state.pendingTranslations, ...uncachedTexts],
    }));

    try {
      const translations = await translateBatch(uncachedTexts, currentLocale);

      Object.assign(results, translations);

      await Promise.all(
        Object.entries(translations).map(([originalText, translatedText]) =>
          saveTranslation(originalText, currentLocale, translatedText)
        )
      );

      set(state => ({
        pendingTranslations: state.pendingTranslations.filter(t => !uncachedTexts.includes(t)),
      }));

      return results;
    } catch (error) {
      console.error('Batch translation error:', error);

      set(state => ({
        pendingTranslations: state.pendingTranslations.filter(t => !uncachedTexts.includes(t)),
      }));

      return texts.reduce(
        (result, text) => {
          result[text] = text;
          return result;
        },
        {} as Record<string, string>
      );
    }
  },

  // 期望输入格式：
  // {
  // titles: ['Hello', 'Welcome'],
  // buttons: ['Save', 'Cancel']
  // }
  // 期望输出格式：
  // {
  // titles: {
  //     Hello: 'Hello',
  //     Welcome: 'Welcome'
  // },
  // buttons: {
  //     Save: 'Save',
  //     Cancel: 'Cancel'
  // }
  translateGrouped: async (data: Record<string, string[]>, targetLocale?: string) => {
    const currentLocale = targetLocale || useLocaleStore.getState().locale;

    if (currentLocale === 'en') {
      const result: GroupedTranslationResponse = {};
      Object.entries(data).forEach(([category, texts]) => {
        if (texts && texts.length > 0) {
          result[category] = texts.reduce(
            (obj, text) => {
              obj[text] = text;
              return obj;
            },
            {} as Record<string, string>
          );
        }
      });
      return result;
    }

    const allTexts: string[] = [];
    const textCategories: Record<string, string> = {};

    Object.entries(data).forEach(([category, texts]) => {
      if (texts && texts.length > 0) {
        texts.forEach(text => {
          if (text && text.trim() !== '') {
            allTexts.push(text);
            textCategories[text] = category;
          }
        });
      }
    });

    if (allTexts.length === 0) {
      return {};
    }

    const translations = await get().translateMultiple(allTexts, currentLocale);

    const result: GroupedTranslationResponse = {};

    Object.entries(translations).forEach(([originalText, translatedText]) => {
      const category = textCategories[originalText];
      if (category) {
        if (!result[category]) {
          result[category] = {};
        }
        result[category]![originalText] = translatedText;
      }
    });

    return result;
  },

  clearCache: async () => {
    try {
      // 清除内存缓存
      memoryCache.clear();
      console.info('Memory cache cleared successfully');

      // 清除IndexedDB缓存（如果已加载）
      if (dbInstance) {
        const { clearTranslationCache } = await import('@/app/services/translationDatabase');
        await clearTranslationCache(dbInstance);
        console.info('IndexedDB cache cleared successfully');
      }
    } catch (error) {
      console.error('Error clearing translation cache:', error);
    }
  },
}));
