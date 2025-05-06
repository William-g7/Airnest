'use client';

import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { useSearchStore } from "@/app/stores/searchStore";

const ResetLogo = () => {
    const router = useRouter();
    const pathname = usePathname();
    const { resetFilters } = useSearchStore();

    const handleLogoClick = () => {
        resetFilters();
        router.push('/');
    };

    return (
        <div className="flex-shrink-0 cursor-pointer" onClick={handleLogoClick}>
            <Image src="/logo.png" alt="logo" width={100} height={38} />
        </div>
    );
};

export default ResetLogo; 