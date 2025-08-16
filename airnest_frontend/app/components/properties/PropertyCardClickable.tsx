'use client';

import { useRouter } from '@/i18n/navigation';

interface PropertyCardClickableProps {
  propertyId: string;
  children: React.ReactNode;
}

export function PropertyCardClickable({ propertyId, children }: PropertyCardClickableProps) {
  const router = useRouter();

  const handleClick = () => {
    router.push({ pathname: '/properties/[id]', params: { id: propertyId } });
  };

  return (
    <div onClick={handleClick} className="cursor-pointer">
      {children}
    </div>
  );
}