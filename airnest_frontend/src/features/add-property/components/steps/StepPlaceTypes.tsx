'use client';
import Image from 'next/image';
import { placeTypeOptions } from '@addProperty/types';
import { useTranslations } from 'next-intl';

interface StepPlaceTypeProps {
  selectedType: string;
  setSelectedType: (type: string) => void;
}

export default function StepPlaceTypes({ selectedType, setSelectedType } : StepPlaceTypeProps){
  const t = useTranslations('placeTypes');

  return (
    <div className="flex flex-col gap-4">
      {placeTypeOptions.map(type => (
        <div
          key={type.value}
          onClick={() => setSelectedType(type.value)}
          className={`
                        p-6 flex justify-between items-center border rounded-xl cursor-pointer
                        hover:border-black transition-all
                        ${selectedType === type.value ? 'border-black bg-gray-50' : 'border-gray-200'}
                    `}
        >
          <div className="flex flex-col gap-2">
            <h3 className="text-lg font-semibold">{t(`${type.value}.title`)}</h3>
            <p className="text-gray-500">{t(`${type.value}.description`)}</p>
          </div>
          <div className="w-12 h-12 relative">
            <Image src={type.icon} alt={t(`${type.value}.title`)} fill className="object-contain" />
          </div>
        </div>
      ))}
    </div>
  );
};
