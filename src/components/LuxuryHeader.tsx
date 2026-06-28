'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LanguageSwitcher } from '@/components/client/LanguageSwitcher';
import { useClientSettings } from '@/components/client/ClientSettingsProvider';
import { useI18n } from '@/components/client/I18nProvider';
import { useCartStore } from '@/store/cart.store';
import { categoriesApi } from '@/lib/api';
import { SearchableSelect, SearchableSelectOption } from '@/components/SearchableSelect';
import type { PublicCategory } from '@/types';

const HIDDEN_HREFS = new Set(['/ai-preview']);

function categoryOptions(categories: PublicCategory[], depth = 0): SearchableSelectOption[] {
  return categories.flatMap((category) => [
    {
      value: category.slug,
      label: category.name,
      description: `${category.totalProductCount} mẫu`,
      keywords: category.path,
      depth,
      isGroup: depth === 0,
    },
    ...categoryOptions(category.children, depth + 1),
  ]);
}

export function LuxuryHeader() {
  const { dictionary } = useI18n();
  const { settings } = useClientSettings();
  const router = useRouter();
  const itemCount = useCartStore((state) => state.items.length);
  const navItems = settings.navigation.topNavItems.filter(
    (item) => item.visible && !HIDDEN_HREFS.has(item.href),
  );

  const [categories, setCategories] = useState<SearchableSelectOption[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    categoriesApi
      .getAll()
      .then((res) => {
        const opts: SearchableSelectOption[] = [
          { value: 'all', label: 'Tất cả danh mục' },
          ...categoryOptions(res.data),
        ];
        setCategories(opts);
      })
      .catch(() => {});
  }, []);

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);
    if (value === 'all') {
      router.push('/products');
    } else {
      router.push(`/products?category=${encodeURIComponent(value)}`);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-[color:var(--surface-elevated)] backdrop-blur-2xl">
      <nav className="luxury-container flex min-h-24 flex-col items-stretch justify-between gap-3 border-b border-[var(--surface-border)] py-3 md:h-24 md:flex-row md:items-center md:gap-6 md:py-0">
        <Link href="/" className="group flex min-w-0 items-center gap-3 pr-28 md:pr-0" aria-label={settings.branding.brandName}>
          {settings.branding.logoUrl && (
            <span className="brand-logo-mark" aria-hidden="true">
              <img src={settings.branding.logoUrl} alt={settings.branding.brandName} />
            </span>
          )}
          <span className="brand-wordmark" aria-hidden="true">
            <span>Rent by</span>
            <span>Chouvie</span>
          </span>
        </Link>

        <div className="header-nav-scroll order-3 flex w-full items-center gap-2 overflow-x-auto pb-1 md:order-none md:w-auto md:flex-1 md:justify-center md:overflow-visible md:pb-0">
          {navItems.map((item) => (
            <Link key={`${item.href}-${item.label}`} className="header-nav-pill" href={item.href}>
              {item.label}
            </Link>
          ))}

          {categories.length > 0 && (
            <SearchableSelect
              value={selectedCategory}
              options={categories}
              onChange={handleCategoryChange}
              placeholder="Danh mục"
              searchPlaceholder="Tìm danh mục..."
              emptyText="Không tìm thấy danh mục"
              className="header-category-select"
            />
          )}
        </div>

        <div className="absolute right-4 top-4 flex items-center gap-2 md:static md:gap-3">
          <LanguageSwitcher />
          <Link
            href="/cart"
            className="inline-flex items-center gap-2 rounded-full border border-[var(--surface-border)] bg-white/60 px-3 py-2 text-xs font-bold uppercase tracking-[0.12em] text-[var(--text-primary)] shadow-sm transition hover:bg-[var(--accent-soft)] md:gap-3 md:px-4"
          >
            <span className="hidden sm:inline">{dictionary.header.cart}</span>
            <span className="grid h-7 min-w-7 place-items-center rounded-full bg-[var(--accent-solid)] px-2 text-[10px] text-white">
              {itemCount}
            </span>
          </Link>
        </div>
      </nav>
    </header>
  );
}
