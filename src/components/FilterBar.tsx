'use client';

import { useI18n } from '@/components/client/I18nProvider';
import { CategoryTreeFilter } from '@/components/CategoryTreeFilter';
import { SearchableSelect } from '@/components/SearchableSelect';
import type { PublicCategory } from '@/types';

type FilterBarProps = {
  query: string;
  category: string;
  status: string;
  categories: PublicCategory[];
  onQueryChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onStatusChange: (value: string) => void;
};

export function FilterBar({
  query,
  category,
  status,
  categories,
  onQueryChange,
  onCategoryChange,
  onStatusChange,
}: FilterBarProps) {
  const { dictionary } = useI18n();

  return (
    <div className="filter-bar">
      <label className="field">
        <span>{dictionary.products.search}</span>
        <input
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder={dictionary.products.searchPlaceholder}
        />
      </label>
      <CategoryTreeFilter
        label={dictionary.products.category}
        selectedSlug={category}
        onSelect={onCategoryChange}
        categories={categories}
        allLabel={dictionary.products.allCategories}
        allCount={categories.reduce((total, item) => total + item.totalProductCount, 0)}
      />
      <SearchableSelect
        label={dictionary.products.status}
        value={status}
        onChange={onStatusChange}
        options={[
          { value: 'all', label: dictionary.products.allStatuses },
          { value: 'available', label: dictionary.common.available },
          { value: 'reserved', label: dictionary.common.reserved },
          { value: 'rented', label: dictionary.common.rented },
          { value: 'maintenance', label: dictionary.common.maintenance },
          { value: 'damaged', label: dictionary.common.damaged },
          { value: 'retired', label: dictionary.common.retired },
        ]}
      />
    </div>
  );
}
