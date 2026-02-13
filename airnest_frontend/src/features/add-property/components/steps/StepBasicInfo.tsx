'use client';

import { useTranslations } from 'next-intl';

interface StepBasicInfoFormProps {
  basicInfo: StepBasicInfoType;
  setBasicInfo: (info: StepBasicInfoType) => void;
}

interface StepBasicInfoType {
  guests: number;
  bedrooms: number;
  beds: number;
  bathrooms: number;
}

export default function BasicInfoForm({ basicInfo, setBasicInfo } : StepBasicInfoFormProps){
  const t = useTranslations('addProperty');

  const handleIncrement = (field: keyof StepBasicInfoType) => {
    setBasicInfo({ ...basicInfo, [field]: basicInfo[field] + 1 });
  };

  const handleDecrement = (field: keyof StepBasicInfoType) => {
    if (basicInfo[field] > 1) {
      setBasicInfo({ ...basicInfo, [field]: basicInfo[field] - 1 });
    }
  };

  const fields: Record<keyof StepBasicInfoType, string> = {
    guests: t('guests'),
    bedrooms: t('bedrooms'),
    beds: t('beds'),
    bathrooms: t('bathrooms'),
  };

  return (
    <div className="flex flex-col gap-8">
      {Object.entries(fields).map(([field, label]) => (
        <div key={field} className="flex items-center justify-between">
          <span className="text-xl">{label}</span>
          <div className="flex items-center gap-4">
            <button
              onClick={() => handleDecrement(field as keyof StepBasicInfoType)}
              className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:border-black transition"
            >
              -
            </button>
            <span className="w-8 text-center">{basicInfo[field as keyof StepBasicInfoType]}</span>
            <button
              onClick={() => handleIncrement(field as keyof StepBasicInfoType)}
              className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:border-black transition"
            >
              +
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
