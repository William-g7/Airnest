'use client';

import { useTranslations } from 'next-intl';
import { useSearchStore } from '@/app/stores/searchStore';
import { propertyCategories } from '@/app/constants/propertyCategores';
import Image from 'next/image';

const Categories = () => {
    const t = useTranslations('categories');
    const { category, setCategory } = useSearchStore();

    const handleCategoryClick = (categoryValue: string) => {
        if (category === categoryValue) {
            setCategory('');
        } else {
            setCategory(categoryValue);
        }
    };

    const getCategoryClass = (categoryValue: string) => {
        const baseClasses = "pb-4 flex flex-col items-center space-y-2 border-b-2 transition-all duration-300 ease-in-out";

        if (category === categoryValue) {
            return `${baseClasses} border-airbnb opacity-100`;
        }

        return `${baseClasses} border-white opacity-50 hover:opacity-100 hover:border-airbnb`;
    };

    return (
        <div className="pt-2 cursor-pointer pb-6 w-full">
            <div className="flex justify-between items-center overflow-x-auto scrollbar-hide">
                {propertyCategories.map((item) => (
                    <div
                        key={item.value}
                        className={getCategoryClass(item.value)}
                        onClick={() => handleCategoryClick(item.value)}
                    >
                        <div className="w-6 h-6 relative">
                            <Image
                                src={item.icon}
                                alt={item.label}
                                width={24}
                                height={24}
                                className="object-contain"
                            />
                        </div>
                        <span className="text-xs font-semibold whitespace-nowrap">{t(item.value, { fallback: item.label })}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Categories;
