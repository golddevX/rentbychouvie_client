'use client';

import React, { useEffect, useMemo, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { categoriesApi, productsApi } from '@/lib/api';
import { ProductCard } from '@/components/ProductCard';
import { FilterBar } from '@/components/FilterBar';
import { CategoryTreeFilter } from '@/components/CategoryTreeFilter';
import { useI18n } from '@/components/client/I18nProvider';
import type { PublicCategory, PublicProduct } from '@/types';

function flattenCategories(categories: PublicCategory[]): PublicCategory[] {
  return categories.flatMap((category) => [category, ...flattenCategories(category.children)]);
}

function categoryOptions(categories: PublicCategory[], depth = 0): Array<{
  value: string;
  label: string;
  description: string;
  depth: number;
  isGroup: boolean;
}> {
  return categories.flatMap((category) => [
    {
      value: category.slug,
      label: category.name,
      description: `${category.totalProductCount} mẫu`,
      depth,
      isGroup: depth === 0,
    },
    ...categoryOptions(category.children, depth + 1),
  ]);
}

function categoryAndDescendantIds(category: PublicCategory | undefined) {
  if (!category) return new Set<string>();
  return new Set(flattenCategories([category]).map((item) => item.id));
}

function ProductsContent() {
  const { dictionary } = useI18n();
  const searchParams = useSearchParams();
  const urlCategory = searchParams.get('category') || 'all';
  const [products, setProducts] = useState<PublicProduct[]>([]);
  const [categoryTree, setCategoryTree] = useState<PublicCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState(urlCategory);
  const [status, setStatus] = useState('all');

  useEffect(() => {
    setCategory(urlCategory);
  }, [urlCategory]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const [productsResponse, categoriesResponse] = await Promise.all([
          productsApi.getAll(),
          categoriesApi.getAll(),
        ]);
        setProducts(productsResponse.data);
        setCategoryTree(categoriesResponse.data);
      } catch (err) {
        setError(dictionary.products.loadError);
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    void fetchProducts();
  }, [dictionary.products.loadError]);

  const categories = useMemo(() => flattenCategories(categoryTree), [categoryTree]);
  const filterCategoryOptions = useMemo(() => categoryOptions(categoryTree), [categoryTree]);
  const selectedCategory = useMemo(
    () => categories.find((item) =>
      item.slug === category
      || item.id === category
      || item.name.toLocaleLowerCase('vi') === category.toLocaleLowerCase('vi'),
    ),
    [categories, category],
  );
  const selectedCategoryIds = useMemo(
    () => categoryAndDescendantIds(selectedCategory),
    [selectedCategory],
  );

  const filtered = useMemo(() => {
    return products.filter((product) => {
      const matchesQuery = !query.trim() || [
        product.name,
        product.description,
        product.category,
        product.categoryPath,
        product.brand,
        product.size,
      ].join(' ').toLowerCase().includes(query.trim().toLowerCase());
      const matchesCategory = category === 'all'
        || (selectedCategory
          ? Boolean(product.categoryId && selectedCategoryIds.has(product.categoryId))
          : product.category.toLocaleLowerCase('vi') === category.toLocaleLowerCase('vi'));
      const matchesStatus = status === 'all' || product.status === status;
      return matchesQuery && matchesCategory && matchesStatus;
    });
  }, [category, products, query, selectedCategoryIds, status]);

  const groupedProducts = useMemo(
    () => categories
      .filter((item) => item.productCount > 0)
      .map((item) => ({
        category: item,
        products: filtered.filter((product) => product.categoryId === item.id),
      }))
      .filter((group) => group.products.length > 0),
    [categories, filtered],
  );

  const popularProducts = useMemo(
    () => [...filtered]
      .sort((left, right) => (right.summary?.rentalCount || 0) - (left.summary?.rentalCount || 0))
      .slice(0, 8),
    [filtered],
  );

  const newestProducts = useMemo(
    () => filtered.slice(0, 8),
    [filtered],
  );

  return (
    <main className="page-shell luxury-shell">
      <section className="section-stack" id="collection">
        <div className="section-heading">
          <div>
            <div className="eyebrow">{dictionary.products.title}</div>
            <h2>{dictionary.products.title}</h2>
            <p>{dictionary.products.subtitle}</p>
          </div>
        </div>

        <FilterBar
          query={query}
          category={category}
          status={status}
          categories={filterCategoryOptions}
          onQueryChange={setQuery}
          onCategoryChange={setCategory}
          onStatusChange={setStatus}
        />

        {categoryTree.length > 0 && (
          <CategoryTreeFilter
            categories={categoryTree}
            selectedSlug={selectedCategory?.slug ?? category}
            allLabel={dictionary.products.allCategories}
            allCount={products.length}
            onSelect={setCategory}
          />
        )}

        {loading && <div className="soft-panel p-8">{dictionary.common.loading}</div>}

        {!loading && error && <div className="soft-panel p-8">{error}</div>}

        {!loading && !error && filtered.length === 0 && (
          <div className="soft-panel p-8">{dictionary.products.empty}</div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <div className="product-category-stack">
            <section className="product-category-section product-highlight-section">
              <div className="product-category-heading">
                <div>
                  <div className="eyebrow">Gợi ý nhanh</div>
                  <h3>Thuê nhiều</h3>
                </div>
                <span>{popularProducts.length} mẫu</span>
              </div>

              <div className="product-grid product-grid-luxury">
                {popularProducts.map((product, index) => (
                  <ProductCard key={`popular-${product.id}`} product={product} index={index} />
                ))}
              </div>
            </section>

            <section className="product-category-section product-highlight-section">
              <div className="product-category-heading">
                <div>
                  <div className="eyebrow">Vừa lên kệ</div>
                  <h3>Hàng mới</h3>
                </div>
                <span>{newestProducts.length} mẫu</span>
              </div>

              <div className="product-grid product-grid-luxury">
                {newestProducts.map((product, index) => (
                  <ProductCard key={`new-${product.id}`} product={product} index={index + 8} />
                ))}
              </div>
            </section>

            {groupedProducts.map((group, groupIndex) => (
              <section key={group.category.id} className="product-category-section">
                <div className="product-category-heading">
                  <div>
                    <div className="eyebrow">{group.category.path}</div>
                    <h3>{group.category.name}</h3>
                  </div>
                  <span>{group.products.length} mẫu</span>
                </div>

                <div className="product-grid product-grid-luxury">
                  {group.products.map((product, index) => (
                    <ProductCard key={product.id} product={product} index={(groupIndex * 6) + index} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={null}>
      <ProductsContent />
    </Suspense>
  );
}
