import { useEffect, useState } from 'react';
import { useLocaleStore } from '../stores/localeStore';
import { useTranslationStore } from '../stores/translationStore';

// 分组翻译请求接口
export interface GroupedTranslationRequest {
    [key: string]: string[];
}

// 分组翻译响应接口
export interface GroupedTranslationResponse {
    [key: string]: Record<string, string>;
}

// 实时翻译结果接口
export interface LiveTranslationResult {
    translation: string;
    isLoading: boolean;
    error: string | null;
}

export function useTranslate() {
    const { locale } = useLocaleStore();
    const translationStore = useTranslationStore();

    // 翻译单条文本
    const translate = async (text: string, targetLocale?: string): Promise<string> => {
        if (!text) return '';
        const currentLocale = targetLocale || locale;
        return await translationStore.translateText(text, currentLocale);
    };

    // 批量翻译多条文本
    const translateMultiple = async (
        texts: string[],
        targetLocale?: string
    ): Promise<Record<string, string>> => {
        if (!texts || texts.length === 0) return {};
        const currentLocale = targetLocale || locale;
        return await translationStore.translateMultiple(texts, currentLocale);
    };

    /**
     * 分组翻译
     * 将不同类别的文本分组翻译，并按类别组织翻译结果
     */
    const translateGrouped = async (
        data: GroupedTranslationRequest,
        targetLocale?: string
    ): Promise<GroupedTranslationResponse> => {
        const currentLocale = targetLocale || locale;
        return await translationStore.translateGrouped(data, currentLocale);
    };

    /**
     * 实时翻译钩子 - 提供实时翻译状态
     * 用于UI中显示翻译状态（加载中、已完成等）
     */
    const useLiveTranslation = (text: string, targetLocale?: string): LiveTranslationResult => {
        const [result, setResult] = useState<LiveTranslationResult>({
            translation: text,
            isLoading: false,
            error: null
        });

        useEffect(() => {
            const currentLocale = targetLocale || locale;

            // 如果没有文本，不需要翻译
            if (!text) {
                setResult({
                    translation: text,
                    isLoading: false,
                    error: null
                });
                return;
            }

            let isMounted = true;

            const doTranslate = async () => {
                try {
                    setResult(prev => ({ ...prev, isLoading: true, error: null }));

                    const translatedText = await translationStore.translateText(text, currentLocale);

                    if (isMounted) {
                        setResult({
                            translation: translatedText,
                            isLoading: false,
                            error: null
                        });
                    }
                } catch (error) {
                    if (isMounted) {
                        setResult({
                            translation: text,
                            isLoading: false,
                            error: error instanceof Error ? error.message : String(error)
                        });
                    }
                }
            };

            doTranslate();

            return () => {
                isMounted = false;
            };
        }, [text, locale, targetLocale]);

        return result;
    };

    return {
        translate,
        translateMultiple,
        translateGrouped,
        useLiveTranslation,
        currentLocale: locale
    };
}