'use client';

import {create} from 'zustand';
import {translateText, translateBatch} from '@translation/services/apiTranslationService';
import type {TranslationDatabase} from '@translation/client/translationDatabase';
import {memoryTranslationCache as memoryCache} from '@translation/cache/memoryCache';

let dbInstance: TranslationDatabase | null = null;
let dbPromise: Promise<TranslationDatabase | null> | null = null;

async function getDatabase(): Promise<TranslationDatabase | null> {
  if (dbInstance) return dbInstance;
  if (dbPromise) return dbPromise;
  dbPromise = (async () => {
    try {
      const {TranslationDatabase} = await import('@translation/client/translationDatabase');
      dbInstance = new TranslationDatabase();
      return dbInstance;
    } catch (e) {
      console.error('failed to load indexedDB, will use memeory cache instead:', e);
      dbPromise = null;
      return null;
    }
  })();
  return dbPromise;
}

function shouldUsePersistentCache(locale: string) {
  return locale !== 'en';
}

type GroupedTranslationResponse = Record<string, Record<string, string>>;

interface TranslationState {
  pendingTranslations: string[];
  translateText: (text: string, locale: string) => Promise<string>;
  translateMultiple: (texts: string[], locale: string) => Promise<Record<string, string>>;
  translateGrouped: (data: Record<string, string[]>, locale: string) => Promise<GroupedTranslationResponse>;
  clearCache: () => Promise<void>;
}

// 读缓存：优先内存，其次 IndexedDB
async function getCached(text: string, locale: string): Promise<string | null> {
  if (!shouldUsePersistentCache(locale)) {
    return memoryCache.get(text, locale);
  }
  const memory = memoryCache.get(text, locale);
  if (memory) return memory;
  try {
    const db = await getDatabase();
    if (!db) return null;
    const {getCachedTranslation} = await import('@translation/client/translationDatabase');
    return await getCachedTranslation(db, text, locale);
  } catch (e) {
    console.error('failed to read cache from database:', e);
    return null;
  }
}

async function saveCached(text: string, locale: string, translation: string) {
  memoryCache.set(text, locale, translation);
  if (!shouldUsePersistentCache(locale)) return;
  try {
    const db = await getDatabase();
    if (!db) return;
    const {saveTranslation} = await import('@translation/client/translationDatabase');
    await saveTranslation(db, text, locale, translation);
  } catch (e) {
    console.error('failed to wirte cache to database', e);
  }
}

export const useTranslationStore = create<TranslationState>()((set, get) => ({
  pendingTranslations: [],

  async translateText(text, locale) {
    if (!text?.trim()) return '';
    if (locale === 'en') return text;

    const cached = await getCached(text, locale);
    if (cached) return cached;

    set(s => ({pendingTranslations: [...s.pendingTranslations, text]}));
    try {
      const translated = await translateText(text, locale);
      await saveCached(text, locale, translated);
      return translated;
    } catch (e) {
      console.error('failed to translate a text：', e);
      return text;
    } finally {
      set(s => ({pendingTranslations: s.pendingTranslations.filter(t => t !== text)}));
    }
  },

  async translateMultiple(texts, locale) {
    if (!texts?.length) return {};
    if (locale === 'en') {
      return texts.reduce<Record<string, string>>((acc, t) => (acc[t] = t, acc), {});
    }

    const results: Record<string, string> = {};
    const uncached: string[] = [];
    await Promise.all(texts.map(async (t) => {
      if (!t) { results[t] = ''; return; }
      const cached = await getCached(t, locale);
      if (cached) results[t] = cached;
      else uncached.push(t);
    }));

    if (!uncached.length) return results;

    set(s => ({pendingTranslations: [...s.pendingTranslations, ...uncached]}));
    try {
      const translations = await translateBatch(uncached, locale);
      Object.assign(results, translations);
      await Promise.all(Object.entries(translations).map(([orig, tran]) => saveCached(orig, locale, tran)));
      return results;
    } catch (e) {
      console.error('failed to translate group texts：', e);
      for (const t of uncached) results[t] = t;
      return results;
    } finally {
      set(s => ({pendingTranslations: s.pendingTranslations.filter(t => !uncached.includes(t))}));
    }
  },

  async translateGrouped(groups, locale) {
    if (locale === 'en') {
      const res: GroupedTranslationResponse = {};
      for (const [k, arr] of Object.entries(groups)) {
        res[k] = (arr ?? []).reduce<Record<string, string>>((acc, t) => (acc[t] = t, acc), {});
      }
      return res;
    }

    const allTexts: string[] = [];
    const belong: Record<string, string> = {};
    for (const [cat, arr] of Object.entries(groups)) {
      for (const t of (arr ?? [])) {
        if (!t?.trim()) continue;
        allTexts.push(t);
        belong[t] = cat;
      }
    }
    if (!allTexts.length) return {};

    const flat = await get().translateMultiple(allTexts, locale);
    const out: GroupedTranslationResponse = {};
    for (const [orig, tran] of Object.entries(flat)) {
      const cat = belong[orig];
      if (!cat) continue;
      (out[cat] ??= {})[orig] = tran;
    }
    return out;
  },

  async clearCache() {
    try {
      memoryCache.clear();
      if (dbInstance) {
        const {clearTranslationCache} = await import('@translation/client/translationDatabase');
        await clearTranslationCache(dbInstance);
      }
    } catch (e) {
      console.error('failed to clear cache in database:', e);
    }
  }
}));
