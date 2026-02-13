import 'server-only';
import { checkBFFSession } from '@auth/server/session';
import type { PropertyType } from '@properties/types/Property';
import { fetchServer, HttpError } from '@api/server/fetchServer';

export async function getUserWishlistProperties(): Promise<PropertyType[]> {
  try {
    return await fetchServer<PropertyType[]>('/api/properties/wishlist/');
  } catch (e) {
    if (e instanceof HttpError && e.status === 401) return [];
    console.warn('wishlist fetch failed:', e);
    return [];
  }
}

export async function getFavoritesSSR(): Promise<PropertyType[]> {
  const session = await checkBFFSession();
  if (!session?.valid) return [];
  const items = await getUserWishlistProperties();
  return items ?? [];
}

export async function getWishlistIds(): Promise<string[]> {
  try {
    const list = await fetchServer<PropertyType[]>('/api/properties/wishlist/');
    return list.map(p => p.id);
  } catch (e) {
    if (e instanceof HttpError && e.status === 401) return [];
    console.warn('getWishlistIds failed:', e);
    return [];
  }
}