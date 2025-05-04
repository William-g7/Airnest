'use client';

import { useTransition, useState } from 'react';
import { localeNames } from '../../i18n/routing';
import { usePathname, useRouter } from '../../i18n/navigation';
import { useParams } from 'next/navigation';

export default function LanguageSwitcher() {
    const pathname = usePathname();
    const params = useParams();
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [isOpen, setIsOpen] = useState(false);

    const handleLocaleChange = (locale: string) => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('userLocale', locale);
        }
        setIsOpen(false);
        startTransition(() => {
            // @ts-expect-error
            router.replace({ pathname, params }, { locale });
        });
    };

    return (
        <div className="relative">
            <button
                className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                onClick={() => setIsOpen(!isOpen)}
                disabled={isPending}
            >
                🌏
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 py-2 w-24 bg-white rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 z-50">
                    {Object.entries(localeNames).map(([locale, name]) => (
                        <button
                            key={locale}
                            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
                            onClick={() => handleLocaleChange(locale)}
                        >
                            {name}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
} 