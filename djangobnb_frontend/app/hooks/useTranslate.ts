import { useState, useEffect } from 'react';
import { useTranslationStore } from '@/app/stores/translationStore';
import { useLocaleStore } from '@/app/stores/localeStore';

export function useTranslate() {
    const { translateText } = useTranslationStore();
    const { locale } = useLocaleStore();

    //翻译单个文本
    const translate = async (text: string, targetLocale?: string) => {
        if (!text) return '';
        return await translateText(text, targetLocale || locale);
    };


    // 批量翻译多个文本
    const translateMultiple = async (texts: string[], targetLocale?: string): Promise<Record<string, string>> => {
        if (!texts || texts.length === 0) return {};
        const currentLocale = targetLocale || locale;

        if (currentLocale === 'en') {
            return texts.reduce((result, text) => {
                result[text] = text;
                return result;
            }, {} as Record<string, string>);
        }

        try {
            // 使用单个翻译API进行批量处理，避免404错误
            const results: Record<string, string> = {};

            // 并行处理所有翻译请求
            const promises = texts.map(async (text) => {
                if (!text) return;
                try {
                    const response = await translateText(text, currentLocale);
                    results[text] = response;
                } catch (err) {
                    // 后端翻译出错降级兜底，使用原文
                    console.error(`Error translating text "${text}":`, err);
                    results[text] = text;
                }
            });

            await Promise.all(promises);
            return results;
        } catch (error) {
            console.error('Batch translation error:', error);
            return texts.reduce((result, text) => {
                result[text] = text;
                return result;
            }, {} as Record<string, string>);
        }
    };

    //在组件中实时显示翻译的Hook
    const useLiveTranslation = (text: string, targetLocale?: string) => {
        const [translation, setTranslation] = useState(text);
        const [isLoading, setIsLoading] = useState(false);
        const currentLocale = targetLocale || locale;

        useEffect(() => {
            // 防止组件卸载后，翻译还在进行
            let isMounted = true;

            if (currentLocale === 'en' || !text) {
                setTranslation(text);
                return;
            }

            setIsLoading(true);

            translateText(text, currentLocale)
                .then(result => {
                    if (isMounted) {
                        setTranslation(result);
                        setIsLoading(false);
                    }
                })
                .catch(() => {
                    if (isMounted) {
                        setTranslation(text);
                        setIsLoading(false);
                    }
                });

            return () => {
                isMounted = false;
            };
        }, [text, currentLocale]);

        return { translation, isLoading, originalText: text };
    };

    return {
        translate,
        useLiveTranslation,
        translateMultiple
    };
} 