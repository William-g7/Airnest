'use client';

import { useMemo, useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@i18n/navigation';
import { useLoginModal } from '@auth/client/modalStore';
import { useAuth } from '@auth/hooks/useAuth';
import apiService from '@auth/client/clientApiService';
import toast from 'react-hot-toast';

import {
  toZonedDay,
  formatDateYYYYMMDD,
  calculateNightsZoned
} from '@daysPicker/dateUtils';

export interface UseReservationOptions {
  propertyId: string;
  pricePerNight: number;
  timeZone: string;
}

export function useReservation({ propertyId, pricePerNight, timeZone }: UseReservationOptions) {
  const t = useTranslations('property');
  const router = useRouter();
  const loginModal = useLoginModal();
  const { isAuthenticated } = useAuth();

  const [dates, setDates] = useState<[Date | null, Date | null]>([null, null]);
  const [guests, setGuests] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const nights = useMemo(() => {
    if (!dates[0] || !dates[1]) return 0;

    const ymdStart = formatDateYYYYMMDD(toZonedDay(dates[0].toISOString(), timeZone));
    const ymdEnd   = formatDateYYYYMMDD(toZonedDay(dates[1].toISOString(), timeZone));

    return calculateNightsZoned(ymdStart, ymdEnd, timeZone);
  }, [dates, timeZone]);

  // （可选）把费用都四舍五入到分，避免浮点误差
  const round2 = (n: number) => Math.round(n * 100) / 100;

  const totals = useMemo(() => {
    const subtotal   = round2(pricePerNight * nights);
    const cleaningFee= round2(subtotal * 0.10);
    const serviceFee = round2(subtotal * 0.15);
    const taxes      = round2(subtotal * 0.12);
    const total      = round2(subtotal + cleaningFee + serviceFee + taxes);
    return { subtotal, cleaningFee, serviceFee, taxes, total };
  }, [pricePerNight, nights]);

  const handleReservation = useCallback(async () => {
    if (!dates[0] || !dates[1]) {
      toast.error(t('selectDates'));
      return;
    }
    if (nights <= 0) {
      // 可在 i18n 里加一个 'invalidDates'，没有就复用 'selectDates'
      toast.error(t('invalidDates') ?? t('selectDates'));
      return;
    }
    if (!isAuthenticated) {
      loginModal.open();
      return;
    }

    try {
      setIsSubmitting(true);

      // ✅ 提交给后端的日期也用“房源时区的墙上日”的 YYYY-MM-DD
      const check_in  = formatDateYYYYMMDD(toZonedDay(dates[0].toISOString(), timeZone));
      const check_out = formatDateYYYYMMDD(toZonedDay(dates[1].toISOString(), timeZone));

      const response = await apiService.post(`/api/properties/${propertyId}/reserve/`, {
        check_in,
        check_out,
        guests,
        total_price: totals.total,
      });

      if (response?.success) {
        toast.success(t('reservationSuccess'));
        router.push({ pathname: '/myreservations' });
      } else {
        toast.error(response?.error || t('reservationFailed'));
      }
    } catch (err: any) {
      console.error('Error making reservation:', err);
      if (
        err?.response?.status === 401 ||
        err?.message?.toLowerCase?.().includes('authentication') ||
        err?.message?.toLowerCase?.().includes('token')
      ) {
        loginModal.open();
      } else {
        toast.error(t('reservationFailed'));
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [dates, nights, isAuthenticated, guests, totals.total, loginModal, propertyId, router, t, timeZone]);

  return {
    // state
    dates,
    guests,
    nights,
    totals,
    isSubmitting,
    // setters
    setDates,
    setGuests,
    // actions
    handleReservation,
  };
}
