'use client';

import Categories from "../components/Categories";
import PropertyList from "../components/properties/PropertyList";
import { useTranslations } from 'next-intl';

export default function Home() {
    const t = useTranslations('app');

    return (
        <main className="max-w-[1500px]mx-auto px-6">
            <h1 className="text-3xl font-bold text-center mb-6">{t('tagline')}</h1>
            <p className="text-center mb-8 text-gray-600">{t('description')}</p>

            <Categories />

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
                <PropertyList />
            </div>
        </main>
    );
} 