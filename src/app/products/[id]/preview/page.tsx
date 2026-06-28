'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { PublicProduct } from '@/types';
import { productsApi } from '@/lib/api';
import { TryOnDemo } from '@/components/TryOnDemo';
import { useI18n } from '@/components/client/I18nProvider';

export default function ProductPreviewPage() {
  const { dictionary } = useI18n();
  const params = useParams();
  const productId = params.id as string;
  const [product, setProduct] = useState<PublicProduct | null>(null);
  const [loading, setLoading] = useState(productId !== 'demo');

  useEffect(() => {
    if (productId === 'demo') return;

    const fetchProduct = async () => {
      try {
        const response = await productsApi.getById(productId);
        setProduct(response.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId]);

  return (
    <main className="min-h-screen bg-[var(--surface)]">
      <section className="luxury-container py-12 md:py-16">
        <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <p className="label-caps">{dictionary.preview.pageEyebrow}</p>
            <h1 className="mt-4 max-w-4xl text-5xl font-semibold leading-none tracking-tight text-[var(--text-primary)] md:text-7xl">
              {dictionary.preview.pageTitle}
            </h1>
          </div>
          <Link
            href={product ? `/products/${product.id}` : '/products'}
            className="rounded-[22px] border border-[var(--surface-border)] px-6 py-4 text-center text-xs font-bold uppercase tracking-[0.16em] text-[var(--text-primary)] transition hover:bg-[var(--accent-solid)] hover:text-[var(--surface-2)]"
          >
            {product ? dictionary.preview.backToPiece : dictionary.preview.collection}
          </Link>
        </div>
      </section>

      <section className="luxury-container pb-20">
        {loading ? (
          <div className="soft-panel p-8">
            <div className="grid gap-8 lg:grid-cols-2">
              <div className="skeleton h-80 rounded-[28px]" />
              <div className="skeleton h-80 rounded-[28px]" />
            </div>
          </div>
        ) : (
          <TryOnDemo product={product} />
        )}
      </section>
    </main>
  );
}
