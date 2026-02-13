'use client';

import { useTranslations } from 'next-intl';
import PropertyTag from '@properties/tags/PropertyTag';

export default function Features({ tagIds }: { tagIds: string[] }) {
  const t = useTranslations('property');

  if (!tagIds || tagIds.length === 0) return null;

  return (
    <div className="mt-2">
      <div className="flex flex-wrap gap-3">
        {tagIds.map((id) => (
          <PropertyTag key={id} tagId={id} size="medium" />
        ))}
      </div>
    </div>
  );
}
