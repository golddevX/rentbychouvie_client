'use client';

import { CSSProperties, useEffect, useMemo, useRef, useState } from 'react';
import type { PublicCategory } from '@/types';

type CategoryTreeFilterProps = {
  categories: PublicCategory[];
  selectedSlug: string;
  allLabel: string;
  allCount: number;
  onSelect: (slug: string) => void;
  label?: string;
  placeholder?: string;
  compact?: boolean;
};

function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('vi-VN')
    .trim();
}

function findCategory(categories: PublicCategory[], slug: string): PublicCategory | undefined {
  for (const category of categories) {
    if (category.slug === slug) return category;
    const child = findCategory(category.children, slug);
    if (child) return child;
  }
  return undefined;
}

function findAncestorSlugs(
  categories: PublicCategory[],
  slug: string,
  ancestors: string[] = [],
): string[] {
  for (const category of categories) {
    if (category.slug === slug) return ancestors;
    const result = findAncestorSlugs(category.children, slug, [...ancestors, category.slug]);
    if (result.length > 0) return result;
  }
  return [];
}

function filterTree(categories: PublicCategory[], query: string): PublicCategory[] {
  const normalizedQuery = normalize(query);
  if (!normalizedQuery) return categories;

  return categories.flatMap((category) => {
    const children = filterTree(category.children, query);
    const matches = normalize(`${category.name} ${category.path}`).includes(normalizedQuery);
    return matches || children.length > 0 ? [{ ...category, children }] : [];
  });
}

function CategoryBranch({
  category,
  selectedSlug,
  expanded,
  forceExpanded,
  onToggle,
  onSelect,
  depth = 0,
}: {
  category: PublicCategory;
  selectedSlug: string;
  expanded: Set<string>;
  forceExpanded: boolean;
  onToggle: (slug: string) => void;
  onSelect: (slug: string) => void;
  depth?: number;
}) {
  const hasChildren = category.children.length > 0;
  const isExpanded = forceExpanded || expanded.has(category.slug);
  const isSelected = selectedSlug === category.slug;
  const depthStyle = { '--category-depth': depth } as CSSProperties;

  return (
    <div
      role="treeitem"
      aria-expanded={hasChildren ? isExpanded : undefined}
      aria-selected={isSelected}
      style={depthStyle}
    >
      <div className={`category-tree-row ${isSelected ? 'is-active' : ''}`}>
        {hasChildren ? (
          <button
            type="button"
            className="category-tree-toggle"
            aria-label={`${isExpanded ? 'Thu gọn' : 'Mở rộng'} ${category.name}`}
            onClick={() => onToggle(category.slug)}
          >
            <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className={isExpanded ? 'is-expanded' : ''}>
              <path d="m7.5 5 5 5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        ) : (
          <span className="category-tree-leaf" aria-hidden="true" />
        )}

        <button
          type="button"
          className="category-tree-option"
          aria-current={isSelected ? 'true' : undefined}
          onClick={() => onSelect(category.slug)}
        >
          <span>
            <span className="category-tree-option-name">{category.name}</span>
            {depth === 0 && category.description ? (
              <span className="category-tree-option-description">{category.description}</span>
            ) : null}
          </span>
          <strong>{category.totalProductCount}</strong>
        </button>
      </div>

      {hasChildren && isExpanded ? (
        <div role="group" className="category-tree-nested">
          {category.children.map((child) => (
            <CategoryBranch
              key={child.id}
              category={child}
              selectedSlug={selectedSlug}
              expanded={expanded}
              forceExpanded={forceExpanded}
              onToggle={onToggle}
              onSelect={onSelect}
              depth={depth + 1}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function CategoryTreeFilter({
  categories,
  selectedSlug,
  allLabel,
  allCount,
  onSelect,
  label,
  placeholder,
  compact = false,
}: CategoryTreeFilterProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const selectedCategory = useMemo(
    () => findCategory(categories, selectedSlug),
    [categories, selectedSlug],
  );
  const visibleCategories = useMemo(
    () => filterTree(categories, query),
    [categories, query],
  );

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
    setExpanded((current) => new Set([
      ...current,
      ...findAncestorSlugs(categories, selectedSlug),
    ]));
    requestAnimationFrame(() => searchRef.current?.focus());
  }, [categories, open, selectedSlug]);

  const closeAndSelect = (slug: string) => {
    onSelect(slug);
    setOpen(false);
    setQuery('');
  };

  const toggleBranch = (slug: string) => {
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  };

  return (
    <div
      ref={rootRef}
      className={`category-tree-select ${compact ? 'category-tree-select-compact' : ''}`}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          setOpen(false);
          setQuery('');
        }
      }}
    >
      {label ? <span className="category-tree-select-label">{label}</span> : null}
      <button
        type="button"
        className={`category-tree-select-control ${open ? 'is-open' : ''}`}
        aria-haspopup="tree"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <span className="category-tree-select-value">
          <span>{selectedCategory?.name ?? placeholder ?? allLabel}</span>
          {!compact && selectedCategory?.path ? <small>{selectedCategory.path}</small> : null}
        </span>
        <span className="category-tree-select-meta">
          <strong>{selectedCategory?.totalProductCount ?? allCount}</strong>
          <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className={open ? 'is-open' : ''}>
            <path d="m5 7.5 5 5 5-5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </button>

      {open ? (
        <div className="category-tree-dropdown">
          <div className="category-tree-search">
            <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <circle cx="8.5" cy="8.5" r="5.5" stroke="currentColor" strokeWidth="1.7" />
              <path d="m13 13 4 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
            </svg>
            <input
              ref={searchRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Tìm danh mục..."
              aria-label="Tìm danh mục"
            />
          </div>

          <div className="category-tree-scroll">
            <button
              type="button"
              className={`category-tree-all-option ${selectedSlug === 'all' ? 'is-active' : ''}`}
              onClick={() => closeAndSelect('all')}
            >
              <span>{allLabel}</span>
              <strong>{allCount}</strong>
            </button>

            {visibleCategories.length > 0 ? (
              <div role="tree" aria-label="Danh mục sản phẩm" className="category-tree-list">
                {visibleCategories.map((category) => (
                  <CategoryBranch
                    key={category.id}
                    category={category}
                    selectedSlug={selectedSlug}
                    expanded={expanded}
                    forceExpanded={Boolean(query.trim())}
                    onToggle={toggleBranch}
                    onSelect={closeAndSelect}
                  />
                ))}
              </div>
            ) : (
              <p className="category-tree-empty">Không tìm thấy danh mục</p>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
