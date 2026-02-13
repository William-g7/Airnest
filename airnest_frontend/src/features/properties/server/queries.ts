import 'server-only';
import type { PropertyType } from '@properties/types/Property';
import { fetchServer } from '@api/server/fetchServer';
import { getWishlistIds } from '@favorites/server/queries';

export async function getProperties(
  params: Record<string, string> = {},
  endpoint = '/api/properties/with-reviews/'
): Promise<PropertyType[]> {
  const qs = new URLSearchParams(params).toString();
  return await fetchServer<PropertyType[]>(`${endpoint}${qs ? `?${qs}` : ''}`).catch(() => []);
}

export async function getPropertyById(id: string): Promise<PropertyType | null> {
  return await fetchServer<PropertyType>(`/api/properties/${id}/`).catch(() => null);
}

export async function getPropertyByIdWithReviews(id: string): Promise<PropertyType | null> {
  return await fetchServer<PropertyType>(`/api/properties/${id}/with-reviews/`).catch(() => null);
}

export async function getPropertiesWithPersonalization(params: Record<string, string> = {}) {
  const [properties, wishlist] = await Promise.all([
    getProperties(params),
    getWishlistIds(),
  ]);
  return { properties, userWishlist: wishlist };
}