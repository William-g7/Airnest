import React from 'react';

interface TagsLineProps {
  tagIds: string[];
  renderTag?: (tagId: string) => React.ReactNode;
  max?: number;
  className?: string;
  /** 当为 true 时，不再限制一行高度，允许多行展示 */
  expand?: boolean;
}

/** 卡片底部“标签行” */
export default function TagsLine({
  tagIds = [],
  renderTag,
  max = 2,
  className = '',
  expand = false,
}: TagsLineProps) {
  const ids = (tagIds ?? []).slice(0, max);

  const containerBase =
    'flex flex-wrap gap-2 ' +
    (expand ? '' : 'max-h-8 overflow-hidden');

  return (
    <div className={`${containerBase} ${className}`}>
      {ids.map((id) => {
        const node =
          renderTag?.(id) ?? (
            <span
              key={id}
              className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium border border-gray-200 bg-gray-50 text-gray-700"
            >
              {id}
            </span>
          );

        return React.isValidElement(node) && node.key != null ? node : <span key={id}>{node}</span>;
      })}
    </div>
  );
}
