'use client'

import Dexie from 'dexie';

const CACHE_VALIDITY_PERIOD = 7 * 24 * 60 * 60 * 1000; // 7天

export class TranslationDatabase extends Dexie {
  translations!: Dexie.Table<
    {
      id: string; // 复合键: "原文_语言" 
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

function hashKey(text: string, locale: string) {
  let header = 0;
  const string = `${locale}:${text}`;
  for (let i = 0; i < string.length; i++) {
    header = ( header * 31 + string.charCodeAt(i)) | 0;
  }
  return `t:${locale}:${(header>>>0).toString(36)}`;
}

export async function getCachedTranslation(
  db: TranslationDatabase,
  text: string, 
  locale: string
): Promise<string | null> {
  try {
    const id = hashKey(text, locale);
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

export async function saveTranslation(
  db: TranslationDatabase,
  text: string, 
  locale: string, 
  translation: string
): Promise<void> {
  try {
    const id = hashKey(text, locale);
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

export async function clearTranslationCache(db: TranslationDatabase): Promise<void> {
  try {
    await db.translations.clear();
    console.info('Translation cache cleared successfully');
  } catch (error) {
    console.error('Error clearing translation cache:', error);
  }
}