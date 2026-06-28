'use client';

import {
  KeyboardEvent,
  ReactNode,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';

export type SearchableSelectOption = {
  value: string;
  label: string;
  description?: string;
  keywords?: string;
  icon?: ReactNode;
  disabled?: boolean;
  depth?: number;
  isGroup?: boolean;
};

type SearchableSelectProps = {
  value: string;
  options: SearchableSelectOption[];
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  loadingText?: string;
  disabled?: boolean;
  loading?: boolean;
  error?: string;
  className?: string;
  name?: string;
};

function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('vi-VN')
    .trim();
}

export function SearchableSelect({
  value,
  options,
  onChange,
  label,
  placeholder = 'Chọn một mục',
  searchPlaceholder = 'Tìm kiếm...',
  emptyText = 'Không tìm thấy kết quả',
  loadingText = 'Đang tải...',
  disabled = false,
  loading = false,
  error,
  className = '',
  name,
}: SearchableSelectProps) {
  const generatedId = useId();
  const listboxId = `${generatedId}-listbox`;
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);

  const selected = options.find((option) => option.value === value);
  const filteredOptions = useMemo(() => {
    const normalizedQuery = normalize(query);
    if (!normalizedQuery) return options;
    return options.filter((option) =>
      normalize(`${option.label} ${option.description || ''} ${option.keywords || ''}`)
        .includes(normalizedQuery),
    );
  }, [options, query]);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, []);

  useEffect(() => {
    if (!open) return;
    requestAnimationFrame(() => searchRef.current?.focus());
  }, [open]);

  useEffect(() => {
    setActiveIndex((current) => Math.min(current, Math.max(filteredOptions.length - 1, 0)));
  }, [filteredOptions.length]);

  const selectOption = (option: SearchableSelectOption) => {
    if (option.disabled) return;
    onChange(option.value);
    setOpen(false);
    setQuery('');
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (disabled || loading) return;
    if (!open && ['Enter', ' ', 'ArrowDown', 'ArrowUp'].includes(event.key)) {
      event.preventDefault();
      setOpen(true);
      return;
    }
    if (!open) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      setOpen(false);
      setQuery('');
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((current) => Math.min(current + 1, filteredOptions.length - 1));
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((current) => Math.max(current - 1, 0));
    }
    if (event.key === 'Enter' && filteredOptions[activeIndex]) {
      event.preventDefault();
      selectOption(filteredOptions[activeIndex]);
    }
  };

  return (
    <div ref={rootRef} className={`relative ${className}`} onKeyDown={onKeyDown}>
      {name ? <input type="hidden" name={name} value={value} /> : null}
      {label ? (
        <label id={`${generatedId}-label`} className="mb-2 block text-[0.86rem] text-[var(--text-secondary)]">
          {label}
        </label>
      ) : null}

      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-labelledby={label ? `${generatedId}-label` : undefined}
        disabled={disabled || loading}
        onClick={() => setOpen((current) => {
          if (!current) {
            setActiveIndex(Math.max(
              0,
              filteredOptions.findIndex((option) => option.value === value),
            ));
          }
          return !current;
        })}
        className={`flex min-h-[50px] w-full items-center justify-between gap-3 rounded-[18px] border bg-white/80 px-4 py-3 text-left outline-none transition ${
          open
            ? 'border-[var(--text-primary)] shadow-[0_0_0_3px_rgba(28,20,15,0.08)]'
            : 'border-[var(--surface-border)] hover:border-[rgba(28,20,15,0.28)]'
        } ${error ? 'border-rose-400' : ''} disabled:cursor-not-allowed disabled:opacity-55`}
      >
        <span className="flex min-w-0 items-center gap-3">
          {selected?.icon ? (
            <span className="grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-[10px] bg-[var(--accent-soft)]">
              {selected.icon}
            </span>
          ) : null}
          <span className="min-w-0">
            <span className={`block truncate text-sm font-semibold ${selected ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]'}`}>
              {loading ? loadingText : selected?.label || placeholder}
            </span>
            {selected?.description ? (
              <span className="mt-0.5 block truncate text-xs text-[var(--text-muted)]">
                {selected.description}
              </span>
            ) : null}
          </span>
        </span>
        <svg
          viewBox="0 0 20 20"
          fill="none"
          aria-hidden="true"
          className={`h-4 w-4 shrink-0 text-[var(--text-muted)] transition-transform ${open ? 'rotate-180' : ''}`}
        >
          <path d="m5 7.5 5 5 5-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {error ? <p className="mt-2 text-sm text-rose-700">{error}</p> : null}

      {open ? (
        <div className="absolute z-50 mt-2 w-full min-w-[260px] overflow-hidden rounded-[22px] border border-[var(--surface-border)] bg-white p-2 shadow-[0_24px_70px_rgba(34,23,12,0.18)]">
          <div className="relative p-1">
            <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className="pointer-events-none absolute left-5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]">
              <circle cx="8.5" cy="8.5" r="5.5" stroke="currentColor" strokeWidth="1.7" />
              <path d="m13 13 4 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
            </svg>
            <input
              ref={searchRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={searchPlaceholder}
              aria-label={searchPlaceholder}
              className="w-full rounded-[18px] border border-[rgba(126,85,65,0.18)] bg-white py-3.5 pl-12 pr-4 text-[0.95rem] font-medium text-[var(--text-primary)] outline-none transition placeholder:text-[#8a7a70] focus:border-[rgba(126,85,65,0.38)] focus:shadow-[0_0_0_4px_rgba(126,85,65,0.08)]"
            />
          </div>

          <div id={listboxId} role="listbox" className="mt-1 max-h-72 overflow-y-auto overscroll-contain p-1">
            {filteredOptions.length ? filteredOptions.map((option, index) => {
              const isSelected = option.value === value;
              const isActive = index === activeIndex;
              return (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  disabled={option.disabled}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => selectOption(option)}
                  style={{ paddingLeft: `${12 + (option.depth ?? 0) * 20}px` }}
                  className={`flex w-full items-center gap-3 rounded-[15px] px-3 py-3 text-left transition ${
                    isActive ? 'bg-[var(--accent-soft)]' : 'hover:bg-[var(--surface)]'
                  } ${option.isGroup ? 'mt-1 border-t border-[var(--surface-border)] first:mt-0 first:border-t-0' : ''} disabled:cursor-not-allowed disabled:opacity-45`}
                >
                  {(option.depth ?? 0) > 0 ? (
                    <span className="h-px w-3 shrink-0 bg-[var(--surface-border)]" aria-hidden="true" />
                  ) : null}
                  {option.icon ? (
                    <span className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-[11px] bg-[var(--surface)]">
                      {option.icon}
                    </span>
                  ) : null}
                  <span className="min-w-0 flex-1">
                    <span className={`block truncate text-sm text-[var(--text-primary)] ${option.isGroup ? 'font-bold uppercase tracking-[0.08em]' : 'font-semibold'}`}>
                      {option.label}
                    </span>
                    {option.description ? (
                      <span className="mt-0.5 block truncate text-xs text-[var(--text-muted)]">
                        {option.description}
                      </span>
                    ) : null}
                  </span>
                  {isSelected ? (
                    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className="h-4 w-4 shrink-0 text-[var(--text-primary)]">
                      <path d="m4.5 10.5 3.2 3.2 7.8-8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : null}
                </button>
              );
            }) : (
              <div className="px-4 py-8 text-center text-sm text-[var(--text-muted)]">
                {emptyText}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
