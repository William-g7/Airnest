'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import PropertyTag from '../../properties/tags/PropertyTag';
import { TAG_CATEGORIES, getTagsByCategory, PropertyTagId, TagCategory } from '@addProperty/types';

interface TagSelectorProps {
  value: PropertyTagId[]; 
  onChange: (next: PropertyTagId[]) => void;
  min?: number;
  max?: number;
}

export default function TagSelector({
  value,
  onChange,
  min = 1,
  max = 5
}: TagSelectorProps) {
  const t = useTranslations('addProperty');

  const chosen = useMemo(() => new Set(value), [value]);
  const count  = value.length;

  const toggle = (id: PropertyTagId) => {
    if (chosen.has(id)) {
      const next = value.filter(v => v !== id);
      onChange(next);
    } else {
      if (count >= max) return;
      onChange([...value, id]);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <label className="text-xl">{t('propertyTagsTitle')}</label>
        <span className="text-sm text-gray-500">
          {t('propertyTagsCounter', { count, max })}
        </span>
      </div>

      {/* 分组展示*/}
      <div className="space-y-4">
        {TAG_CATEGORIES.map((cat: TagCategory) => {
          const tags = getTagsByCategory(cat);
          if (!tags.length) return null;
          return (
            <div key={cat} className="space-y-2">
              <div className="text-sm font-medium text-gray-600">
                {t(`tagCategory.${cat}`)}
              </div>
              <div className="flex flex-wrap gap-2">
                {tags.map(tag => (
                  <PropertyTag
                    key={tag.id}
                    tagId={tag.id}
                    size="small"
                    selected={chosen.has(tag.id)}
                    onClick={() => toggle(tag.id)}
                    disabled={!chosen.has(tag.id) && count >= max}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* 校验信息 */}
      {count < min && (
        <p className="text-xs text-red-600">{t('propertyTagsTooFew', { min })}</p>
      )}
    </div>
  );
}
