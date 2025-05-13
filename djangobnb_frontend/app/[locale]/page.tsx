'use client';

import Categories from "../components/Categories";
import PropertyList from "../components/properties/PropertyList";
import { useTranslations } from 'next-intl';
import { useSearchParamsSync } from "../hooks/useSearchParamsSync";
import PropertyListErrorBoundary from "../components/properties/PropertyListErrorBoundary";
import AnimatedText from "../components/common/AnimatedText";

export default function Home() {
    const t = useTranslations('app');
    useSearchParamsSync();

    return (
        <main className="max-w-[1500px] mx-auto px-6">
            <div className="pt-12 pb-4">
                <AnimatedText
                    tagline={t('tagline')}
                    description={t('description')}
                    resetOnScrollTop={true}
                    maxAnimations={2}
                />
            </div>

            <Categories />

            <div className="mt-6">
                <PropertyListErrorBoundary>
                    <PropertyList />
                </PropertyListErrorBoundary>
            </div>
        </main>
    );
} 