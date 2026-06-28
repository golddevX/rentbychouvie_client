'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useMemo, useState } from 'react';
import { useCartStore } from '@/store/cart.store';
import { getProductImage } from '@/lib/product-images';
import { formatDateLabel } from '@/lib/date';
import { MoneyDisplay } from '@/components/MoneyDisplay';
import { useI18n } from '@/components/client/I18nProvider';
import { useClientSettings } from '@/components/client/ClientSettingsProvider';

export function LuxuryMiniCart() {
  const { dictionary } = useI18n();
  const { settings } = useClientSettings();
  const [open, setOpen] = useState(false);
  const items = useCartStore((state) => state.items);
  const removeProduct = useCartStore((state) => state.removeProduct);
  const summary = useCartStore((state) => state.getSummary(settings.pricingRules));
  const badgeLabel = useMemo(() => `${items.length}`, [items.length]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-3 rounded-full bg-[var(--accent-solid)] px-5 py-3 text-sm font-semibold text-white shadow-[var(--shadow-hover)]"
      >
        <span>{dictionary.header.cart}</span>
        <span className="grid h-8 min-w-8 place-items-center rounded-full bg-white/14 px-2 text-xs">
          {badgeLabel}
        </span>
      </button>

      <div
        className={`fixed inset-0 z-50 transition ${open ? 'pointer-events-auto bg-black/28 opacity-100' : 'pointer-events-none opacity-0'}`}
        onClick={() => setOpen(false)}
      />
      <aside
        className={`fixed right-0 top-0 z-[60] h-full w-[min(92vw,420px)] border-l border-[var(--surface-border)] bg-[var(--surface-2)] shadow-[var(--shadow-hover)] transition-transform duration-300 ${open ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-[var(--surface-border)] px-6 py-5">
            <div>
              <p className="label-caps">{dictionary.cart.summary}</p>
              <h2 className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">{dictionary.header.cart}</h2>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-full border border-[var(--surface-border)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em]"
            >
              {dictionary.gallery.close}
            </button>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto px-6 py-6">
            {items.length === 0 ? (
              <div className="rounded-[28px] border border-dashed border-[var(--surface-border)] bg-[var(--surface)] px-5 py-8 text-center">
                <p className="text-lg font-semibold text-[var(--text-primary)]">{dictionary.cart.empty}</p>
              </div>
            ) : (
              items.map((item) => (
                <div key={item.productId} className="flex gap-4 rounded-[26px] border border-[var(--surface-border)] bg-[var(--surface)] p-4">
                  <Image src={getProductImage({ id: item.productId, image: item.image, images: item.image ? [item.image] : [] })} alt={item.productName} width={80} height={96} className="h-24 w-20 rounded-[18px] object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="label-caps">{item.category}</p>
                    <h3 className="mt-1 text-base font-semibold text-[var(--text-primary)]">{item.productName}</h3>
                    <p className="mt-2 text-sm text-[var(--text-secondary)]">{item.selectedMetadata?.size || item.selectedMetadata?.color || dictionary.common.luxuryService}</p>
                    <div className="mt-3 flex items-center justify-between">
                      <MoneyDisplay value={item.rentalPrice} className="text-sm font-semibold text-[var(--text-primary)]" />
                      <button type="button" onClick={() => removeProduct(item.productId)} className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--text-secondary)]">
                        {dictionary.cart.remove}
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="border-t border-[var(--surface-border)] px-6 py-5">
            <div className="space-y-2 text-sm text-[var(--text-secondary)]">
              <div className="flex justify-between">
                <span>{dictionary.cart.totalProducts}</span>
                <span>{summary.itemCount}</span>
              </div>
              <div className="flex justify-between">
                <span>{dictionary.cart.totalRental}</span>
                <MoneyDisplay value={summary.totalRentalPrice} />
              </div>
              <div className="flex justify-between">
                <span>{dictionary.cart.depositRequired}</span>
                <span className="max-w-[220px] text-right text-xs font-medium text-[var(--text-primary)]">{summary.depositPolicyLabel}</span>
              </div>
              <div className="flex justify-between">
                <span>{dictionary.cart.rentalDays}</span>
                <span>
                  {summary.pickupDate && summary.returnDate
                    ? `${formatDateLabel(summary.pickupDate)} - ${formatDateLabel(summary.returnDate)}`
                    : dictionary.common.datesPending}
                </span>
              </div>
            </div>
            <Link href="/cart" onClick={() => setOpen(false)} className="mt-5 inline-flex w-full items-center justify-center rounded-[22px] bg-[var(--accent-solid)] px-6 py-4 text-xs font-bold uppercase tracking-[0.16em] text-white">
              {dictionary.cart.checkout}
            </Link>
          </div>
        </div>
      </aside>
    </>
  );
}
