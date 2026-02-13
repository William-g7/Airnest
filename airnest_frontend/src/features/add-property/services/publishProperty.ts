import apiService from '@auth/client/clientApiService';
import type { ImagePreviewData, R2ImageData } from '@addProperty/types';
import { uploadImagesToR2Batch } from './r2Upload';

export async function ensureDraftId({
  currentPropertyId,
  draftTitle,
  category,
  placeType,
  city,
}: {
  currentPropertyId?: string;
  draftTitle: string;
  category: string;
  placeType: string;
  city: string;
}): Promise<string> {
  if (currentPropertyId) return currentPropertyId;

  const res = await apiService.post('/api/properties/draft/', {
    title: draftTitle,
    category,
    place_type: placeType,
    city,
  });

  if (res?.success && res?.data?.id) return res.data.id.toString();
  throw new Error('Failed to create draft');
}

export async function uploadImagesIfNeeded(
  imagePreviewData: ImagePreviewData[],
  propertyId: string,
  fallbackExisting: R2ImageData[]
): Promise<R2ImageData[]> {
  if (imagePreviewData.length > 0) {
    return uploadImagesToR2Batch(imagePreviewData, propertyId);
  }
  return fallbackExisting;
}

export async function publishProperty(propertyId: string, payload: any) {
  return apiService.post(`/api/properties/${propertyId}/publish/`, payload);
}
