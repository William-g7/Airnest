import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import apiService from '@/app/services/apiService';
import { useLocaleStore } from './localeStore';

// 缓存有效期
const CACHE_VALIDITY_PERIOD = 7 * 24 * 60 * 60 * 1000;

interface TranslationState {
    cache: Record<string, {
        translations: Record<string, string>;
        lastUpdated: number;
    }>;
    pendingTranslations: string[];
    translateText: (text: string, targetLocale?: string) => Promise<string>;
    clearCache: () => void;
}

export const useTranslationStore = create<TranslationState>()(
    persist(
        (set, get) => ({
            cache: {},
            pendingTranslations: [],

            translateText: async (text: string, targetLocale?: string) => {
                if (!text || text.trim() === '') return '';

                const currentLocale = targetLocale || useLocaleStore.getState().locale;
                if (currentLocale === 'en') return text;

                const cacheKey = text;
                const cachedItem = get().cache[cacheKey];

                if (
                    cachedItem &&
                    cachedItem.translations[currentLocale] &&
                    Date.now() - cachedItem.lastUpdated < CACHE_VALIDITY_PERIOD
                ) {
                    return cachedItem.translations[currentLocale];
                }

                // 如果已经在翻译中，则等待完成
                if (get().pendingTranslations.includes(text)) {
                    return new Promise((resolve) => {
                        const checkCache = () => {
                            const updatedCache = get().cache[cacheKey];
                            if (
                                updatedCache &&
                                updatedCache.translations[currentLocale]
                            ) {
                                resolve(updatedCache.translations[currentLocale]);
                            } else {
                                setTimeout(checkCache, 100);
                            }
                        };
                        checkCache();
                    });
                }

                // 标记为正在翻译
                set(state => ({
                    pendingTranslations: [...state.pendingTranslations, text]
                }));

                try {
                    const response = await apiService.post('/api/translate/', {
                        text,
                        target_language: currentLocale
                    });

                    const translatedText = response.translated_text || text;

                    set(state => {
                        const existingItem = state.cache[cacheKey] || {
                            translations: {},
                            lastUpdated: Date.now()
                        };

                        return {
                            cache: {
                                ...state.cache,
                                [cacheKey]: {
                                    translations: {
                                        ...existingItem.translations,
                                        [currentLocale]: translatedText
                                    },
                                    lastUpdated: Date.now()
                                }
                            },
                            pendingTranslations: state.pendingTranslations.filter(t => t !== text)
                        };
                    });

                    return translatedText;
                } catch (error) {
                    console.error('Translation error:', error);

                    set(state => ({
                        pendingTranslations: state.pendingTranslations.filter(t => t !== text)
                    }));

                    return text;
                }
            },

            clearCache: () => set({ cache: {} })
        }),
        {
            name: 'djangobnb-translations',
            partialize: (state) => ({ cache: state.cache })
        }
    )
); 