'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import apiService from '@/app/services/apiService';
import { ReservationType } from '@/app/constants/reservationType';
import { useTranslations } from 'next-intl';
import { formatLocalizedDate, calculateNights } from '@/app/utils/dateUtils';
import CurrencyDisplay from '@/app/components/common/CurrencyDisplay';

const MyReservationsPage = () => {
  const t = useTranslations('myreservations');
  const [reservations, setReservations] = useState<ReservationType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchReservations = async () => {
      try {
        const response = await apiService.getwithtoken('/api/properties/reservations/');
        setReservations(response);
      } catch (error) {
        setError(t('loadError'));
        console.error('Error fetching reservations:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReservations();
  }, [t]);

  if (isLoading) {
    return (
      <main className="max-w-[1500px] mx-auto px-6 pb-12">
        <h1 className="text-2xl font-semibold my-8">{t('title')}</h1>
        <div className="text-center">{t('loading')}</div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="max-w-[1500px] mx-auto px-6 pb-12">
        <h1 className="text-2xl font-semibold my-8">{t('title')}</h1>
        <div className="text-red-500 text-center">{error}</div>
      </main>
    );
  }

  // 确保图片URL是完整的
  const getCompleteImageUrl = (url: string) => {
    // 检查URL是否已经是完整URL
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }

    // 如果是相对URL，添加域名
    if (url.startsWith('/')) {
      return `http://localhost:8000${url}`;
    }

    return `http://localhost:8000/${url}`;
  };

  return (
    <main className="max-w-[1500px] mx-auto px-6 pb-12">
      <h1 className="text-2xl font-semibold my-8">{t('title')}</h1>

      {reservations.length === 0 ? (
        <div className="text-center py-8">{t('noReservations')}</div>
      ) : (
        <div className="grid grid-cols-1 gap-8">
          {reservations.map(reservation => {
            // 检查图片信息
            const hasImages = reservation.property.images && reservation.property.images.length > 0;
            const imageUrl = hasImages ? reservation.property.images[0].imageURL : '';
            const completeImageUrl = hasImages ? getCompleteImageUrl(imageUrl) : '';

            return (
              <div
                key={reservation.id}
                className="border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow p-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 md:gap-6 items-start">
                  <div className="col-span-1 md:col-span-1 aspect-video md:aspect-square w-full max-w-full">
                    {hasImages ? (
                      <div className="relative w-full h-0 pb-[75%] rounded-lg overflow-hidden bg-gray-100">
                        <img
                          src={completeImageUrl}
                          alt={reservation.property.title}
                          className="absolute inset-0 w-full h-full object-cover"
                          onError={e => {
                            console.error(`图片加载失败: ${completeImageUrl}`);
                            e.currentTarget.src = '/beach_1.jpg';
                            e.currentTarget.onerror = null;
                          }}
                        />
                      </div>
                    ) : (
                      <div className="relative w-full h-0 pb-[75%] rounded-lg bg-gray-200">
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span>{t('noImage')}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="col-span-1 md:col-span-4 p-2 md:p-4">
                    <h2 className="text-xl font-semibold mb-4">{reservation.property.title}</h2>

                    <div className="space-y-3 text-gray-600">
                      <div className="flex flex-col space-y-1">
                        <div className="flex flex-wrap items-center">
                          <span className="font-medium min-w-[70px]">
                            <strong>{t('checkIn')}: </strong>
                          </span>
                          <span className="ml-2">
                            {formatLocalizedDate(
                              reservation.check_in,
                              reservation.property.timezone,
                              'long'
                            )}
                          </span>
                          <span className="ml-2 text-sm bg-gray-100 text-gray-700 px-2 py-0.5 rounded-md">
                            {t('notEarlierThan')} 15:00
                          </span>
                        </div>
                        <div className="flex items-center text-sm text-gray-500 pl-[70px] md:pl-[78px]">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4 mr-1"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          <span>{t('checkInInstructions')}</span>
                        </div>
                      </div>

                      <div className="flex flex-col space-y-1">
                        <div className="flex flex-wrap items-center">
                          <span className="font-medium min-w-[70px]">
                            <strong>{t('checkOut')}: </strong>
                          </span>
                          <span className="ml-2">
                            {formatLocalizedDate(
                              reservation.check_out,
                              reservation.property.timezone,
                              'long'
                            )}
                          </span>
                          <span className="ml-2 text-sm bg-gray-100 text-gray-700 px-2 py-0.5 rounded-md">
                            {t('notLaterThan')} 11:00
                          </span>
                        </div>
                        <div className="flex items-center text-sm text-gray-500 pl-[70px] md:pl-[78px]">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4 mr-1"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          <span>{t('checkOutInstructions')}</span>
                        </div>
                      </div>

                      <div className="flex items-center mt-2">
                        <div>
                          <span className="font-medium">
                            <strong>{t('duration')}: </strong>
                          </span>
                          <span>
                            {calculateNights(reservation.check_in, reservation.check_out)}{' '}
                            {t('nights')}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center">
                        <div>
                          <span className="font-medium">
                            <strong>{t('totalPrice')}: </strong>
                          </span>
                          <span>
                            <CurrencyDisplay
                              amount={parseFloat(reservation.total_price.toString())}
                              showOriginal={true}
                            />
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6">
                      <Link
                        href={{
                          pathname: '/properties/[id]',
                          params: { id: reservation.property.id.toString() },
                        }}
                        className="px-6 py-2 text-sm bg-airbnb text-white rounded-md hover:bg-airbnb_dark transition inline-block"
                      >
                        {t('viewProperty')}
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
};

export default MyReservationsPage;
