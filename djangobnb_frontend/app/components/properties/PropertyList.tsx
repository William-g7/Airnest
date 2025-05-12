"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations } from 'next-intl';
import apiService from "../../services/apiService";
import PropertyListItem from "./PropertyListItem";
import { PropertyType } from "@/app/constants/propertyType";
import { useSearchStore } from "@/app/stores/searchStore";
import { useSearchParams } from "next/navigation";
import { useTranslate } from '@/app/hooks/useTranslate';
import { useLocaleStore } from '@/app/stores/localeStore';

interface TranslationContext {
    titles: Record<string, string>;
    cities: Record<string, string>;
    countries: Record<string, string>;
}

interface PropertyListProps {
    isMyProperties?: boolean;
    isWishlist?: boolean;
}

const PropertyList = ({ isMyProperties, isWishlist }: PropertyListProps) => {
    const t = useTranslations('properties');
    const [properties, setProperties] = useState<PropertyType[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [lastSearchParams, setLastSearchParams] = useState("");

    const [isTranslating, setIsTranslating] = useState(false);
    const [translationContext, setTranslationContext] = useState<TranslationContext>({
        titles: {},
        cities: {},
        countries: {}
    });

    const { translateGrouped } = useTranslate();
    const { locale } = useLocaleStore();

    const { location, checkIn, checkOut, guests, category } = useSearchStore();
    const searchParams = useSearchParams();
    const serializedParams = searchParams.toString();

    const getProperties = useCallback(async () => {
        try {
            setIsLoading(true);
            let endpoint = '/api/properties/';

            if (isMyProperties) {
                endpoint = '/api/properties/my/';
            } else if (isWishlist) {
                endpoint = '/api/properties/wishlist/';
            } else {
                const params = new URLSearchParams();

                const locationParam = searchParams.get('location');
                const checkInParam = searchParams.get('check_in');
                const checkOutParam = searchParams.get('check_out');
                const guestsParam = searchParams.get('guests');
                const categoryParam = searchParams.get('category');

                if (locationParam) params.append('location', locationParam);
                if (checkInParam) params.append('check_in', checkInParam);
                if (checkOutParam) params.append('check_out', checkOutParam);
                if (guestsParam && parseInt(guestsParam) > 1) params.append('guests', guestsParam);
                if (categoryParam) params.append('category', categoryParam);

                if (params.toString() === '' && (location || checkIn || checkOut || guests > 1 || category)) {
                    if (location) params.append('location', location);
                    if (checkIn) params.append('check_in', checkIn);
                    if (checkOut) params.append('check_out', checkOut);
                    if (guests > 1) params.append('guests', guests.toString());
                    if (category) params.append('category', category);
                }

                const queryString = params.toString();
                if (queryString) {
                    endpoint = `/api/properties/?${queryString}`;
                }

                console.log(`Fetching properties with endpoint: ${endpoint}`);
            }

            const data = (isMyProperties || isWishlist)
                ? await apiService.getwithtoken(endpoint)
                : await apiService.get(endpoint);

            setProperties(data);
        } catch (error) {
            setError(t('loadError'));
            console.error("Error fetching properties:", error);
        } finally {
            setIsLoading(false);
        }
    }, [isMyProperties, isWishlist, searchParams, location, checkIn, checkOut, guests, category, t]);

    // 初始加载房源数据
    useEffect(() => {
        getProperties();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // 搜索参数变化时重新加载
    useEffect(() => {
        if (serializedParams !== lastSearchParams) {
            console.log(`Search params changed from "${lastSearchParams}" to "${serializedParams}"`);
            setLastSearchParams(serializedParams);
            getProperties();
        }
    }, [serializedParams, lastSearchParams, getProperties]);

    // 当语言变化或房源加载完成时触发翻译
    useEffect(() => {
        // 重置翻译上下文
        setTranslationContext({
            titles: {},
            cities: {},
            countries: {}
        });

        // 如果语言不是英语且房源已加载，则执行翻译
        if (locale !== 'en' && properties.length > 0 && !isLoading) {
            translateAllProperties();
        }
    }, [locale, properties, isLoading]);

    const translateAllProperties = async () => {
        if (locale === 'en' || properties.length === 0 || isTranslating) {
            return;
        }

        setIsTranslating(true);
        console.log(`开始翻译${properties.length}个房源`);

        try {
            const titles: string[] = [];
            const cities: string[] = [];
            const countries: string[] = [];

            properties.forEach(property => {
                if (property.title) titles.push(property.title);
                if (property.city) cities.push(property.city);
                if (property.country) countries.push(property.country);
            });

            const translationsResult = await translateGrouped({
                titles,
                cities,
                countries
            }, locale);

            setTranslationContext({
                titles: translationsResult.titles || {},
                cities: translationsResult.cities || {},
                countries: translationsResult.countries || {}
            });

            console.log(`Trnaslation success, translated ${properties.length} properties`);
        } catch (error) {
            console.error("Translation error:", error);
        } finally {
            setIsTranslating(false);
        }
    };

    return (
        <>
            {isLoading ? (
                <div>{t('loading')}</div>
            ) : error ? (
                <div className="text-red-500">{error}</div>
            ) : properties.length === 0 ? (
                <div className="text-center py-10">
                    <h3 className="text-lg font-semibold">{t('noPropertiesFound')}</h3>
                    {isMyProperties && (
                        <p className="text-gray-500 mt-2">
                            {t('noListedProperties')}
                        </p>
                    )}
                    {!isMyProperties && !isWishlist && (searchParams.get('location') ||
                        searchParams.get('check_in') ||
                        searchParams.get('check_out') ||
                        searchParams.get('guests') ||
                        searchParams.get('category') ||
                        location ||
                        checkIn ||
                        checkOut ||
                        guests > 1 ||
                        category) && (
                            <p className="text-gray-500 mt-2">
                                {t('noPropertiesMatch')}
                            </p>
                        )}
                </div>
            ) : (
                <>
                    {isTranslating && <div className="text-sm text-gray-500 mb-4">{t('translationInProgress')}</div>}

                    {properties.map((property) => (
                        <PropertyListItem
                            key={property.id}
                            property={property}
                            translations={{
                                title: translationContext.titles[property.title] || '',
                                city: translationContext.cities[property.city] || '',
                                country: translationContext.countries[property.country] || ''
                            }}
                        />
                    ))}
                </>
            )}
        </>
    );
};

export default PropertyList;