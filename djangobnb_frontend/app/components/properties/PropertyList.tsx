"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations } from 'next-intl';
import apiService from "../../services/apiService";
import PropertyListItem from "./PropertyListItem";
import { PropertyType } from "@/app/constants/propertyType";
import { useSearchStore } from "@/app/stores/searchStore";
import { useSearchParams } from "next/navigation";

interface PropertyListProps {
    isMyProperties?: boolean;
    isWishlist?: boolean;
}

const PropertyList: React.FC<PropertyListProps> = ({ isMyProperties, isWishlist }) => {
    const t = useTranslations('properties');
    const [properties, setProperties] = useState<PropertyType[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [lastSearchParams, setLastSearchParams] = useState("");

    const { location, checkIn, checkOut, guests } = useSearchStore();
    const searchParams = useSearchParams();

    const serializedParams = searchParams.toString();

    // 使用useCallback包装getProperties函数，避免不必要的重新创建
    const getProperties = useCallback(async () => {
        try {
            setIsLoading(true);
            let endpoint = '/api/properties/';

            if (isMyProperties) {
                endpoint = '/api/properties/my/';
            } else if (isWishlist) {
                endpoint = '/api/properties/wishlist/';
            } else {
                // 只有在显示普通房源列表时才应用筛选条件
                // 优先使用URL参数构建查询
                const params = new URLSearchParams();

                // 直接从URL读取参数
                const locationParam = searchParams.get('location');
                const checkInParam = searchParams.get('check_in');
                const checkOutParam = searchParams.get('check_out');
                const guestsParam = searchParams.get('guests');

                if (locationParam) params.append('location', locationParam);
                if (checkInParam) params.append('check_in', checkInParam);
                if (checkOutParam) params.append('check_out', checkOutParam);
                if (guestsParam && parseInt(guestsParam) > 1) params.append('guests', guestsParam);

                // 如果URL没有参数，使用状态中的值
                if (params.toString() === '' && (location || checkIn || checkOut || guests > 1)) {
                    if (location) params.append('location', location);
                    if (checkIn) params.append('check_in', checkIn);
                    if (checkOut) params.append('check_out', checkOut);
                    if (guests > 1) params.append('guests', guests.toString());
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
    }, [isMyProperties, isWishlist, searchParams, location, checkIn, checkOut, guests, t]);



    // 只有当URL参数真正变化时才重新获取数据
    useEffect(() => {
        if (serializedParams !== lastSearchParams) {
            console.log(`Search params changed from "${lastSearchParams}" to "${serializedParams}"`);
            setLastSearchParams(serializedParams);
            getProperties();
        }
    }, [serializedParams, lastSearchParams, getProperties]);

    // 组件挂载时获取一次数据
    useEffect(() => {
        getProperties();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if (isLoading) {
        return <div>{t('loading')}</div>;
    }

    if (error) {
        return <div className="text-red-500">{error}</div>;
    }

    if (properties.length === 0) {
        // 检查是否有任何筛选条件（从URL或状态）
        const hasFilters = searchParams.get('location') ||
            searchParams.get('check_in') ||
            searchParams.get('check_out') ||
            searchParams.get('guests') ||
            location ||
            checkIn ||
            checkOut ||
            guests > 1;

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
                        {t('noMatchingProperties')}
                    </p>
                )}
            </div>
        );
    }

    return (
        <>
            {properties.map((property) => (
                <PropertyListItem
                    key={property.id}
                    property={property}
                />
            ))}
        </>
    );
};

export default PropertyList;