import apiService from '@auth/client/clientApiService';

export const favoritesClientApi = {
  list: () => apiService.get('/api/properties/wishlist/', { suppressToast: true }),
  toggle: (propertyId: string) =>
    apiService.post(`/api/properties/${propertyId}/toggle-favorite/`, { propertyId }),
};