"use client";

import { useEffect, useState, useCallback, useRef } from "react";
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

    const [translationsLoading, setTranslationsLoading] = useState(false);
    const [translationContext, setTranslationContext] = useState<TranslationContext>({
        titles: {},
        cities: {},
        countries: {}
    });

    const isTranslatingRef = useRef(false);

    const { translateMultiple } = useTranslate();
    const { locale } = useLocaleStore();

    const { location, checkIn, checkOut, guests, category } = useSearchStore();
    const searchParams = useSearchParams();

    const serializedParams = searchParams.toString();

    const batchTranslateProperties = useCallback(async (propertyData: PropertyType[]) => {
        if (locale === 'en' || propertyData.length === 0 || isTranslatingRef.current) {
            return;
        }

        isTranslatingRef.current = true;
        setTranslationsLoading(true);

        try {
            const titleTexts = propertyData.map(p => p.title).filter(Boolean);
            const cityTexts = propertyData.map(p => p.city).filter(Boolean);
            const countryTexts = propertyData.map(p => p.country).filter(Boolean);

            if (titleTexts.length === 0 && cityTexts.length === 0 && countryTexts.length === 0) {
                setTranslationsLoading(false);
                isTranslatingRef.current = false;
                return;
            }

            const [translatedTitles, translatedCities, translatedCountries] = await Promise.all([
                translateMultiple(titleTexts),
                translateMultiple(cityTexts),
                translateMultiple(countryTexts)
            ]);

            if (isTranslatingRef.current) {
                setTranslationContext({
                    titles: translatedTitles,
                    cities: translatedCities,
                    countries: translatedCountries
                });
            }
        } catch (error) {
            console.error("Error translating properties:", error);

            if (isTranslatingRef.current) {
                setTranslationContext({
                    titles: {},
                    cities: {},
                    countries: {}
                });
            }
        } finally {
            if (isTranslatingRef.current) {
                setTranslationsLoading(false);
                isTranslatingRef.current = false;
            }
        }
    }, [locale, translateMultiple]);

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

            batchTranslateProperties(data);
        } catch (error) {
            setError(t('loadError'));
            console.error("Error fetching properties:", error);
        } finally {
            setIsLoading(false);
        }
    }, [isMyProperties, isWishlist, searchParams, location, checkIn, checkOut, guests, category, t, batchTranslateProperties]);

    useEffect(() => {
        if (serializedParams !== lastSearchParams) {
            console.log(`Search params changed from "${lastSearchParams}" to "${serializedParams}"`);
            setLastSearchParams(serializedParams);
            getProperties();
        }
    }, [serializedParams, lastSearchParams, getProperties]);

    useEffect(() => {
        if (properties.length > 0 && !isTranslatingRef.current) {
            batchTranslateProperties(properties);
        }
    }, [locale, properties]);

    useEffect(() => {
        getProperties();

        return () => {
            isTranslatingRef.current = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if (isLoading) {
        return <div>{t('loading')}</div>;
    }

    if (error) {
        return <div className="text-red-500">{error}</div>;
    }

    if (properties.length === 0) {
        const hasFilters = searchParams.get('location') ||
            searchParams.get('check_in') ||
            searchParams.get('check_out') ||
            searchParams.get('guests') ||
            searchParams.get('category') ||
            location ||
            checkIn ||
            checkOut ||
            guests > 1 ||
            category;

        return (
            <div className="text-center py-10">
                <h3 className="text-lg font-semibold">{t('noPropertiesFound')}</h3>
                {isMyProperties && (
                    <p className="text-gray-500 mt-2">
                        {t('noListedProperties')}
                    </p>
                )}
                {!isMyProperties && !isWishlist && hasFilters && (
                    <p className="text-gray-500 mt-2">
                        {t('noPropertiesMatch')}
                    </p>
                )}
            </div>
        );
    }

    return (
        <>
            {translationsLoading && <div className="text-sm text-gray-500 mb-4">{t('translating')}...</div>}

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
    );
};

export default PropertyList;