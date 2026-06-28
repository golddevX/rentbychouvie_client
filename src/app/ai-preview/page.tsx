'use client';

import { useEffect, useState } from 'react';
import { TryOnDemo } from '@/components/TryOnDemo';
import { SearchableSelect } from '@/components/SearchableSelect';
import { useI18n } from '@/components/client/I18nProvider';
import { productsApi } from '@/lib/api';
import { formatVND } from '@/lib/money';
import { PublicProduct } from '@/types';

export default function AIPreviewPage() {
  const { dictionary } = useI18n();
  const [products, setProducts] = useState<PublicProduct[]>([]);
  const [productId, setProductId] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    productsApi.getAll({ status: 'available' })
      .then((response) => {
        setProducts(response.data);
        setProductId(response.data[0]?.id || '');
      })
      .finally(() => setLoading(false));
  }, []);

  const product = products.find((item) => item.id === productId) || null;

  return (
    <main className="min-h-screen bg-[var(--surface)]">
      <section className="luxury-container py-12 md:py-16">
        <p className="label-caps">{dictionary.preview.pageEyebrow}</p>
        <h1 className="mt-4 max-w-4xl text-5xl font-semibold leading-none tracking-tight text-[var(--text-primary)] md:text-7xl">
          {dictionary.preview.pageTitle}
        </h1>
        <SearchableSelect
          className="mt-8 max-w-xl"
          label={dictionary.preview.selectProduct}
          value={productId}
          loading={loading}
          onChange={setProductId}
          searchPlaceholder={`${dictionary.products.search}...`}
          options={products.map((item) => ({
            value: item.id,
            label: item.name,
            description: `${item.category} · ${formatVND(item.rentalPrice)}`,
            keywords: `${item.code || ''} ${item.category} ${item.status}`,
          }))}
        />
      </section>
      <section className="luxury-container pb-20">
        {loading ? <div className="soft-panel p-8">{dictionary.common.loading}</div> : <TryOnDemo product={product} />}
      </section>
    </main>
  );
}
