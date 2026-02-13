'use client';

import Image from 'next/image';
import { Link } from '@i18n/navigation';
import { useTranslations } from 'next-intl';
import Button from '@sharedUI/Button';
import ContactButton from './ContactButton'; // 

type Host = {
  id: string;
  username: string;
  name?: string;
  avatar_url?: string | null;
};

interface HostCardProps {
  landlord: Host;
  isLandlord: boolean;
  onEdit: () => void;
}

export default function HostCard({ landlord, isLandlord, onEdit }: HostCardProps) {
  const t = useTranslations('property');

  return (
    <div className="flex items-center justify-between">
      <Link
        href={{ pathname: '/landlords/[id]', params: { id: String(landlord.id) } }}
        className="flex-grow"
      >
        <div className="py-6 flex items-center space-x-4">
          {landlord.avatar_url ? (
            <Image
              src={landlord.avatar_url || '/profile-placeholder.jpg'}
              alt={t('hostAlt')}
              width={50}
              height={50}
              className="rounded-full"
            />
          ) : (
            <div className="w-[50px] h-[50px] rounded-full bg-gray-300" />
          )}
          <div className="flex flex-col">
            <span className="text-lg font-semibold">
              {landlord.name || landlord.username}
            </span>
            <span className="text-sm text-gray-500">{t('host')}</span>
          </div>
        </div>
      </Link>

      <div className="w-[200px]">
        {isLandlord ? (
          <Button onClick={onEdit} label={t('editProperty')} className="w-full" />
        ) : (
          <ContactButton landlordId={String(landlord.id)} />
        )}
      </div>
    </div>
  );
}
