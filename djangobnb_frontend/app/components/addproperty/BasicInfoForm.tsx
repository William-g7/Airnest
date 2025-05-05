'use client'

import { useTranslations } from 'next-intl';

interface BasicInfoFormProps {
    basicInfo: BasicInfoType;
    setBasicInfo: (info: BasicInfoType) => void;
}

interface BasicInfoType {
    guests: number;
    bedrooms: number;
    beds: number;
    bathrooms: number;
}

const BasicInfoForm: React.FC<BasicInfoFormProps> = ({ basicInfo, setBasicInfo }) => {
    const t = useTranslations('addProperty');

    const handleIncrement = (field: keyof BasicInfoType) => {
        setBasicInfo({ ...basicInfo, [field]: basicInfo[field] + 1 });
    };

    const handleDecrement = (field: keyof BasicInfoType) => {
        if (basicInfo[field] > 1) {
            setBasicInfo({ ...basicInfo, [field]: basicInfo[field] - 1 });
        }
    };

    const fields: Record<keyof BasicInfoType, string> = {
        guests: t('guests'),
        bedrooms: t('bedrooms'),
        beds: t('beds'),
        bathrooms: t('bathrooms')
    };

    return (
        <div className="flex flex-col gap-8">
            {Object.entries(fields).map(([field, label]) => (
                <div key={field} className="flex items-center justify-between">
                    <span className="text-xl">{label}</span>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => handleDecrement(field as keyof BasicInfoType)}
                            className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:border-black transition"
                        >
                            -
                        </button>
                        <span className="w-8 text-center">{basicInfo[field as keyof BasicInfoType]}</span>
                        <button
                            onClick={() => handleIncrement(field as keyof BasicInfoType)}
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

export default BasicInfoForm;