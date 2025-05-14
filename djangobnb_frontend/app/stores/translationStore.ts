import { create } from 'zustand';
import { translateText, translateBatch } from '@/app/services/translationService';
import { useLocaleStore } from './localeStore';
import Dexie from 'dexie';

const CACHE_VALIDITY_PERIOD = 7 * 24 * 60 * 60 * 1000;

class TranslationDatabase extends Dexie {
  translations!: Dexie.Table<
    {
      id: string; // 复合键: "原文_语言" (如 "Hello_fr")
      text: string; // 原文
      locale: string; // 目标语言
      translation: string; // 翻译文本
      lastUpdated: number; // 最后更新时间戳
    },
    string
  >;

  constructor() {
    super('TranslationDB');
    this.version(1).stores({
      translations: 'id, text, locale, lastUpdated',
    });
  }
}

// 创建数据库实例
const db = new TranslationDatabase();

interface TranslatedTexts {
  [locale: string]: string;
}

interface CacheItem {
  translations: TranslatedTexts;
  lastUpdated: number;
}

interface TranslationCache {
  [text: string]: CacheItem;
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

async function getCachedTranslation(text: string, locale: string): Promise<string | null> {
  try {
    const id = `${text}_${locale}`;
    const record = await db.translations.get(id);

    if (record && Date.now() - record.lastUpdated < CACHE_VALIDITY_PERIOD) {
      return record.translation;
    }

    return null;
  } catch (error) {
    console.error('Error reading from IndexedDB:', error);
    return null;
  }
}

async function saveTranslation(text: string, locale: string, translation: string): Promise<void> {
  try {
    const id = `${text}_${locale}`;
    await db.translations.put({
      id,
      text,
      locale,
      translation,
      lastUpdated: Date.now(),
    });
  } catch (error) {
    console.error('Error saving to IndexedDB:', error);
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
      await db.translations.clear();
      console.info('Translation cache cleared successfully');
    } catch (error) {
      console.error('Error clearing translation cache:', error);
    }
  },
}));
