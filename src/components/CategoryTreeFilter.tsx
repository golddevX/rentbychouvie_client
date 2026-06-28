'use client';

import type { PublicCategory } from '@/types';

type CategoryTreeFilterProps = {
  categories: PublicCategory[];
  selectedSlug: string;
  allLabel: string;
  allCount: number;
  onSelect: (slug: string) => void;
};

function CategoryBranch({
  category,
  selectedSlug,
  onSelect,
  depth = 0,
}: {
  category: PublicCategory;
  selectedSlug: string;
  onSelect: (slug: string) => void;
  depth?: number;
}) {
  const active = selectedSlug === category.slug;

  return (
    <div className={depth === 0 ? 'category-tree-group' : 'category-tree-branch'}>
      <button
        type="button"
        className={`category-tree-node ${depth === 0 ? 'category-tree-root' : 'category-tree-child'} ${active ? 'is-active' : ''}`}
        onClick={() => onSelect(category.slug)}
      >
        <span className="category-tree-node-copy">
          <span className="category-tree-node-label">{category.name}</span>
          {category.description ? (
            <span className="category-tree-node-description">{category.description}</span>
          ) : null}
        </span>
        <strong>{category.totalProductCount}</strong>
      </button>

      {category.children.length > 0 ? (
        <div className="category-tree-children">
          {category.children.map((child) => (
            <CategoryBranch
              key={child.id}
              category={child}
              selectedSlug={selectedSlug}
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
}: CategoryTreeFilterProps) {
  return (
    <div className="category-tree-panel">
      <div className="category-tree-panel-heading">
        <div>
          <span className="label-caps">Danh mục sản phẩm</span>
          <h3>Chọn theo nhóm</h3>
        </div>
        <button
          type="button"
          className={`category-tree-all ${selectedSlug === 'all' ? 'is-active' : ''}`}
          onClick={() => onSelect('all')}
        >
          <span>{allLabel}</span>
          <strong>{allCount}</strong>
        </button>
      </div>

      <div className="category-tree-groups">
        {categories.map((category) => (
          <CategoryBranch
            key={category.id}
            category={category}
            selectedSlug={selectedSlug}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  );
}
