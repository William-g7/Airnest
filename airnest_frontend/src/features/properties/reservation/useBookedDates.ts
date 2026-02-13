'use client';

import { useCallback, useEffect, useState } from 'react';
import apiService from '@auth/client/clientApiService';

export function useBookedDates(propertyId: string) {
  const [bookedDates, setBookedDates] = useState<string[]>([]);
  const [partiallyBookedDates, setPartiallyBookedDates] = useState<string[]>([]);
  const [isLoadingBookedDates, setIsLoadingBookedDates] = useState(false);

  const fetchDates = useCallback(async () => {
    try {
      setIsLoadingBookedDates(true);
      const resp = await apiService.get(`/api/properties/${propertyId}/booked-dates/`);
      setBookedDates(resp.booked_dates || []);
      setPartiallyBookedDates(resp.partially_booked_dates || []);
    } catch (e) {
      console.error('Error fetching booked dates:', e);
    } finally {
      setIsLoadingBookedDates(false);
    }
  }, [propertyId]);

  useEffect(() => {
    fetchDates();
  }, [fetchDates]);

  return {
    bookedDates,
    partiallyBookedDates,
    isLoadingBookedDates,
    refetchBookedDates: fetchDates,
  };
}
