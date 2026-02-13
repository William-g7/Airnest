'use client';

import React, { useEffect, useId, useMemo, useRef, useState } from 'react';

export type SelectOption = { value: string; label: string };
export type SelectGroup = { group: string; options: SelectOption[] };
type Options = SelectOption[] | SelectGroup[];

function isGrouped(options: Options): options is SelectGroup[] {
  return Array.isArray(options) && options.length > 0 && 'options' in options[0]!;
}

interface SelectProps {
  options: Options;
  value: string | null;
  onChange: (v: string | null) => void;
  placeholder?: string;
  searchable?: boolean;
  loading?: boolean;
  className?: string;
  disabled?: boolean;
  maxHeight?: string;
  clearable?: boolean;
  renderGroupLabel?: (group: string) => React.ReactNode;
  renderOption?: (opt: SelectOption, active: boolean, selected: boolean) => React.ReactNode;
  renderValue?: (opt: SelectOption | null, placeholder: string) => React.ReactNode;
}

export default function Select({
  options,
  value,
  onChange,
  placeholder = 'Select…',
  searchable = false,
  loading = false,
  className = '',
  disabled = false,
  maxHeight = '240px',
  clearable = true,
  renderGroupLabel,
  renderOption,
  renderValue,
} : SelectProps){
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [hi, setHi] = useState(-1);
  const triggerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const labelId = useId();
  const listboxId = useId();

  const flat: SelectOption[] = useMemo(() => {
    if (!options.length) return [];
    return isGrouped(options) ? options.flatMap(g => g.options) : (options as SelectOption[]);
  }, [options]);

  const selected = flat.find(o => o.value === value) ?? null;

  const filtered: Options = useMemo(() => {
    if (!q) return options;
    const match = (o: SelectOption) =>
      o.label.toLowerCase().includes(q.toLowerCase()) || o.value.toLowerCase().includes(q.toLowerCase());

    if (isGrouped(options)) {
      const groups = options
        .map(g => ({ ...g, options: g.options.filter(match) }))
        .filter(g => g.options.length);
      return groups;
    }
    return (options as SelectOption[]).filter(match);
  }, [options, q]);

  // 外点点击关闭
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!triggerRef.current) return;
      if (!triggerRef.current.contains(e.target as Node) && !listRef.current?.contains(e.target as Node)) {
        setOpen(false);
        setQ('');
        setHi(-1);
      }
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  // 打开后自动聚焦搜索框
  useEffect(() => {
    if (open && searchable) inputRef.current?.focus();
  }, [open, searchable]);

  // 键盘交互
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!open) return;
      if (e.key === 'Escape') {
        setOpen(false);
        setQ('');
        setHi(-1);
        return;
      }
      const flatFiltered = isGrouped(filtered)
        ? (filtered as SelectGroup[]).flatMap(g => g.options)
        : (filtered as SelectOption[]);

      if (!flatFiltered.length) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHi(prev => (prev + 1) % flatFiltered.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHi(prev => (prev <= 0 ? flatFiltered.length - 1 : prev - 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (hi >= 0) {
          const opt = flatFiltered[hi];
          if (opt) {
            onChange(opt.value);
            setOpen(false);
            setQ('');
            setHi(-1);
          }
        }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, hi, filtered, onChange]);

  const toggle = () => !disabled && setOpen(o => !o);
  const clear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
  };

  const renderOpt = (opt: SelectOption, index: number, baseIndex: number) => {
    const active = hi === baseIndex + index;
    const sel = value === opt.value;
    return (
      <div
        key={opt.value}
        role="option"
        aria-selected={sel}
        className={[
          'px-3 py-2 text-sm cursor-pointer transition-colors',
          active ? 'bg-blue-50 text-blue-600' : 'hover:bg-blue-50 hover:text-blue-600',
          sel ? 'bg-blue-100 text-blue-700 font-medium' : '',
        ].join(' ')}
        onMouseEnter={() => setHi(baseIndex + index)}
        onClick={() => {
          onChange(opt.value);
          setOpen(false);
          setQ('');
          setHi(-1);
        }}
      >
        {renderOption ? renderOption(opt, active, sel) : opt.label}
      </div>
    );
  };

  return (
    <div className={`relative ${className}`} ref={triggerRef}>
      {/* Trigger */}
      <div
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-labelledby={labelId}
        aria-controls={listboxId}
        onClick={toggle}
        className={[
          'relative w-full p-4 border rounded-lg cursor-pointer transition-all duration-200 bg-white',
          disabled ? 'bg-gray-100 cursor-not-allowed' : 'hover:border-black',
          open ? 'border-black ring-1 ring-black' : 'border-gray-300',
          loading ? 'opacity-50' : '',
        ].join(' ')}
      >
        <div id={labelId} className="flex items-center justify-between">
          <span className={`flex-1 text-left ${!selected ? 'text-gray-500' : 'text-gray-900'}`}>
            {renderValue ? renderValue(selected, placeholder) : (selected?.label ?? placeholder)}
          </span>

          <div className="flex items-center gap-2">
            {clearable && !!value && !disabled && (
              <button
                onClick={clear}
                className="p-1 text-gray-400 hover:text-gray-600"
                aria-label="Clear selection"
              >
                ×
              </button>
            )}
            {loading ? (
              <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
            ) : (
              <span className={`text-gray-400 text-xs ${open ? 'rotate-180' : ''}`}>▼</span>
            )}
          </div>
        </div>
      </div>

      {/* Dropdown */}
      {open && (
        <div
          ref={listRef}
          role="listbox"
          id={listboxId}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg"
        >
          {searchable && (
            <div className="p-2 border-b border-gray-100">
              <input
                ref={inputRef}
                type="text"
                value={q}
                onChange={e => setQ(e.target.value)}
                placeholder="Search…"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          <div className="overflow-y-auto" style={{ maxHeight }}>
            {options.length === 0 ? (
              <div className="px-3 py-4 text-sm text-gray-500 text-center">No options</div>
            ) : isGrouped(filtered) ? (
              (filtered as SelectGroup[]).map((g, gi) => {
                const offset = (filtered as SelectGroup[]).slice(0, gi).reduce((acc, x) => acc + x.options.length, 0);
                return (
                  <div key={g.group}>
                    <div className="px-3 py-2 text-xs font-semibold text-gray-600 bg-gray-50 border-b border-gray-100">
                      {renderGroupLabel ? renderGroupLabel(g.group) : g.group}
                    </div>
                    {g.options.map((opt, oi) => renderOpt(opt, oi, offset))}
                  </div>
                );
              })
            ) : (
              (filtered as SelectOption[]).map((opt, i) => renderOpt(opt, i, 0))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
