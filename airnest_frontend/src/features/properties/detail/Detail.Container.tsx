'use client';

import { useEffect, useState } from 'react';
import { useLocale } from 'next-intl';
import toast from 'react-hot-toast';
import apiService from '@auth/client/clientApiService';
import { useAuth } from '@auth/hooks/useAuth';
import { useAuthStore } from '@auth/client/authStore';
import { useLoginModal } from '@auth/client/modalStore';
import { useAddPropertyModal } from '@addProperty/hooks/useAddPropertyModal';
import { useTranslate } from '@translation/client/useTranslate';
import type { PropertyType } from '@properties/types/Property';
import { toEditableProperty } from '@properties/types/mappers';
import DetailView from './Detail.View';

export default function DetailContainer({ property }: { property: PropertyType }) {
  const { isAuthenticated, isLoading } = useAuth();
  const loginModal = useLoginModal();
  const addPropertyModal = useAddPropertyModal();
  const authStore = useAuthStore();
  const locale = useLocale();

  // —— 是否房东 ——
  const isLandlord =
    !!authStore.userId &&
    !!property.landlord &&
    authStore.userId === property.landlord.id.toString();

  // —— 收藏状态（详情页独立拉取） ——
  const [isFavorited, setIsFavorited] = useState(false);
  useEffect(() => {
    const run = async () => {
      if (isLoading) return;
      if (!isAuthenticated) {
        setIsFavorited(false);
        return;
      }
      try {
        const list = await apiService.get('/api/properties/wishlist/');
        setIsFavorited(Array.isArray(list) && list.some((p: PropertyType) => p.id === property.id));
      } catch (e) {
        console.error('wishlist check error', e);
        setIsFavorited(false);
      }
    };
    run();
  }, [property.id, isAuthenticated, isLoading]);

  const handleToggleWishlist = async () => {
    if (!isAuthenticated) {
      loginModal.open();
      return;
    }
    try {
      const res = await apiService.post(`/api/properties/${property.id}/toggle-favorite/`, {
        propertyId: property.id,
      });
      if (res.status === 'added' || res.status === 'removed') {
        const after = res.status === 'added';
        setIsFavorited(after);
        toast.success(after ? 'Added to wishlist' : 'Removed from wishlist');
      }
    } catch (e: any) {
      if (e?.message?.includes?.('Authentication')) {
        loginModal.open();
      } else {
        console.error('toggle wishlist error', e);
        toast.error('Operation failed');
      }
    }
  };

  // —— 一次性翻译（标题/描述/城市/国家） ——
  const { translateGrouped } = useTranslate();
  const [tx, setTx] = useState<{ title?: string; description?: string; city?: string; country?: string }>({});
  const [txLoading, setTxLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (locale === 'en') {
        setTx({});
        return;
      }
      const titles = property.title ? [property.title] : [];
      const cities = property.city ? [property.city] : [];
      const countries = property.country ? [property.country] : [];
      const description = property.description ? [property.description] : [];

      if (!titles.length && !cities.length && !countries.length && !description.length) {
        setTx({});
        return;
      }

      setTxLoading(true);
      try {
        const res = await translateGrouped({ titles, cities, countries, description });
        if (cancelled) return;
        setTx({
          title: property.title ? res.titles?.[property.title] ?? property.title : undefined,
          city: property.city ? res.cities?.[property.city] ?? property.city : undefined,
          country: property.country ? res.countries?.[property.country] ?? property.country : undefined,
          description: property.description
            ? res.description?.[property.description] ?? property.description
            : undefined,
        });
      } catch {
        if (!cancelled) setTx({});
      } finally {
        if (!cancelled) setTxLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [property.id, locale, translateGrouped, property.title, property.city, property.country, property.description]);

  return (
    <DetailView
      property={property}
      tx={tx}
      txLoading={txLoading}
      isLandlord={isLandlord}
      isFavorited={isFavorited}
      onToggleWishlist={handleToggleWishlist}
      onEdit={() => addPropertyModal.onOpenForEdit(toEditableProperty(property))}
    />
  );
}
