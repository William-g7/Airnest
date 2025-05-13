'use client';

import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { useSearchStore } from "@/app/stores/searchStore";

const ResetLogo = () => {
    const router = useRouter();
    const { resetFilters } = useSearchStore();

    const handleLogoClick = () => {
        resetFilters();
        router.push('/');
    };

    return (
        <div
            className="flex-shrink-0 cursor-pointer transition-transform duration-300"
            onClick={handleLogoClick}
            style={{ transform: `scale(var(--logo-scale, 1))` }}
        >
            <Image src="/logo.png" alt="Airnest" width={100} height={38} />
        </div>
    );
};

export default ResetLogo; 