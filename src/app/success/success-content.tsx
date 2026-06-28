'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useI18n } from '@/components/client/I18nProvider';
import { useCartStore } from '@/store/cart.store';

export function SuccessContent() {
  const { dictionary } = useI18n();
  const params = useSearchParams();
  const storedBookingId = useCartStore((state) => state.lastBookingId);
  const bookingId = params.get('bookingId') || storedBookingId;

  return (
    <main className="min-h-screen bg-[var(--surface)]">
      <section className="luxury-container py-20 md:py-28">
        <div className="mx-auto max-w-3xl rounded-[32px] bg-[var(--surface-2)] p-8 text-center shadow-[var(--shadow-soft)] md:p-12">
          <p className="label-caps">{dictionary.checkout.success_title}</p>
          <h1 className="mt-4 text-5xl font-semibold leading-[0.92] tracking-[-0.04em] text-[var(--text-primary)] md:text-7xl">
            {dictionary.success.title}
          </h1>
          <p className="mt-5 text-sm leading-8 text-[var(--text-secondary)] md:text-base">
            {dictionary.success.description}
          </p>
          {bookingId ? (
            <div className="mt-8 rounded-[24px] bg-[var(--accent-soft)] px-5 py-4 text-sm font-semibold text-[var(--text-primary)]">
              {dictionary.success.bookingCode}: {bookingId}
            </div>
          ) : null}
          <Link href="/products" className="mt-8 inline-flex rounded-[24px] bg-[var(--accent-solid)] px-7 py-4 text-xs font-bold uppercase tracking-[0.16em] text-white">
            {dictionary.success.backToProducts}
          </Link>
        </div>
      </section>
    </main>
  );
}
