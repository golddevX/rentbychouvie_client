'use client';

import React, { CSSProperties, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { PublicProduct } from '@/types';
import { productsApi } from '@/lib/api';
import { useCartStore } from '@/store/cart.store';
import { GalleryModal } from '@/components/GalleryModal';
import { ProductCard } from '@/components/ProductCard';
import { TryOnDemo } from '@/components/TryOnDemo';
import { MoneyDisplay } from '@/components/MoneyDisplay';
import { useToast } from '@/components/client/ToastProvider';
import { getProductGallery } from '@/lib/product-images';
import { useI18n } from '@/components/client/I18nProvider';
import { useClientSettings } from '@/components/client/ClientSettingsProvider';
import { formatDateLabel, getNextDay, toIsoDateTime } from '@/lib/date';

function DetailSkeleton() {
  return (
    <div className="luxury-container grid gap-10 py-12 lg:grid-cols-[1.05fr_0.95fr]">
      <div className="skeleton aspect-[4/5] rounded-[42px]" />
      <div className="space-y-5">
        <div className="skeleton h-3 w-32 rounded-full" />
        <div className="skeleton h-14 w-4/5 rounded-full" />
        <div className="skeleton h-5 w-full rounded-full" />
        <div className="skeleton h-5 w-2/3 rounded-full" />
        <div className="skeleton h-44 rounded-[24px]" />
      </div>
    </div>
  );
}

function ProductImageMarquee({
  images,
  productName,
  onSelect,
}: {
  images: string[];
  productName: string;
  onSelect: (index: number) => void;
}) {
  if (images.length === 1) {
    return (
      <button
        type="button"
        onClick={() => onSelect(0)}
        className="relative block aspect-[4/5] w-full overflow-hidden rounded-[42px] bg-[var(--accent-soft)]"
      >
        <Image
          src={images[0]}
          alt={`${productName} editorial 1`}
          fill
          sizes="(max-width: 768px) 100vw, 55vw"
          className="object-cover transition duration-[1400ms] hover:scale-[1.025]"
        />
      </button>
    );
  }

  const repeatedImages = Array.from(
    { length: Math.max(1, Math.ceil(3 / images.length)) },
    () => images,
  ).flat();
  const marqueeStyle = {
    '--detail-marquee-duration': `${Math.max(24, repeatedImages.length * 7)}s`,
  } as CSSProperties;

  const renderGroup = (duplicate = false) => (
    <div
      className="detail-gallery-marquee-group"
      aria-hidden={duplicate || undefined}
    >
      {repeatedImages.map((image, index) => {
        const imageIndex = index % images.length;
        return (
          <button
            key={`${duplicate ? 'duplicate-' : ''}${image}-${index}`}
            type="button"
            tabIndex={duplicate ? -1 : undefined}
            onClick={() => onSelect(imageIndex)}
            className="detail-gallery-marquee-item"
          >
            <Image
              src={image}
              alt={duplicate ? '' : `${productName} editorial ${imageIndex + 1}`}
              fill
              sizes="(max-width: 768px) 82vw, 38vw"
              className="object-cover transition duration-[1400ms] hover:scale-[1.025]"
            />
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="detail-gallery-marquee" style={marqueeStyle}>
      <div className="detail-gallery-marquee-track">
        {renderGroup()}
        {renderGroup(true)}
      </div>
    </div>
  );
}

export default function ProductDetailPage() {
  const { dictionary } = useI18n();
  const { settings } = useClientSettings();
  const { pushToast } = useToast();
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;
  const [product, setProduct] = useState<PublicProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [activeImage, setActiveImage] = useState(0);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [availabilityMessage, setAvailabilityMessage] = useState<string | null>(null);
  const addProduct = useCartStore((state) => state.addProduct);
  const updateRentalDates = useCartStore((state) => state.updateRentalDates);
  const storePickupDate = useCartStore((state) => state.pickupDate);
  const storeReturnDate = useCartStore((state) => state.returnDate);
  const [datesInitialized, setDatesInitialized] = useState(false);

  useEffect(() => {
    if (!datesInitialized && (storePickupDate || storeReturnDate)) {
      if (storePickupDate) setStartDate(storePickupDate);
      if (storeReturnDate) {
        if (storePickupDate && storeReturnDate <= storePickupDate) {
          setEndDate('');
        } else {
          setEndDate(storeReturnDate);
        }
      }
      setDatesInitialized(true);
    }
  }, [storePickupDate, storeReturnDate, datesInitialized]);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await productsApi.getById(productId);
        setProduct(response.data);
      } catch (err) {
        setError(dictionary.product.loadError);
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    void fetchProduct();
  }, [dictionary.product.loadError, productId]);

  const gallery = getProductGallery(product);
  const relatedProducts = product?.relatedProducts ?? [];
  const availableSizes = useMemo(
    () => Array.from(
      new Set(
        [product?.size, ...(product?.variants ?? []).map((variant) => variant.size)]
          .map((size) => size?.trim())
          .filter((size): size is string => Boolean(size)),
      ),
    ),
    [product?.size, product?.variants],
  );
  const sizeDisplay = availableSizes.join(' · ');
  const metadataBlocks = useMemo(
    () => [
      [dictionary.product.size, sizeDisplay],
      [dictionary.product.color, product?.color],
      [dictionary.product.accessories, product?.accessories],
    ].filter(([, value]) => Boolean(value)),
    [dictionary.product.accessories, dictionary.product.color, dictionary.product.size, product?.accessories, product?.color, sizeDisplay],
  );

  const handleAddToCart = () => {
    if (!product) return;
    if (startDate && endDate && endDate <= startDate) {
      pushToast({
        tone: 'error',
        title: dictionary.cart.invalidDate,
      });
      return;
    }
    addProduct(product);
    if (startDate || endDate) {
      updateRentalDates(startDate, endDate);
    }
    pushToast({
      tone: 'success',
      title: dictionary.products.add_to_cart,
      description: product.name,
    });
  };

  const handleRentNow = () => {
    if (!product) return;
    if (!startDate || !endDate) {
      pushToast({
        tone: 'error',
        title: dictionary.cart.datesError,
      });
      return;
    }
    if (endDate <= startDate) {
      pushToast({
        tone: 'error',
        title: dictionary.cart.invalidDate,
      });
      return;
    }
    addProduct(product);
    updateRentalDates(startDate, endDate);
    router.push('/checkout');
  };

  const handleCheckAvailability = async () => {
    if (!product || !startDate || !endDate) {
      setAvailabilityMessage(dictionary.common.datesPending);
      return;
    }
    if (endDate <= startDate) {
      setAvailabilityMessage(dictionary.cart.invalidDate);
      return;
    }

    try {
      const response = await productsApi.getAvailability(product.slug || product.id, {
        pickupDate: toIsoDateTime(startDate),
        returnDate: toIsoDateTime(endDate),
      });
      const available = response.data.availability.explicitCheck?.available ?? response.data.availability.todayAvailable;
      setAvailabilityMessage(available ? dictionary.product.availabilityReady : dictionary.product.availabilityBlocked);
    } catch (nextError) {
      console.error(nextError);
      setAvailabilityMessage(dictionary.product.loadError);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[var(--surface)]">
        <DetailSkeleton />
      </main>
    );
  }

  if (!product) {
    return (
      <main className="min-h-screen bg-[var(--surface)]">
        <div className="luxury-container py-20">
          <div className="soft-panel mx-auto max-w-xl p-8 text-center">
            <p className="label-caps">{dictionary.product.unavailable}</p>
            <h1 className="mt-4 text-3xl font-semibold text-[var(--text-primary)]">
              {dictionary.product.notFound}
            </h1>
            <p className="mt-3 text-sm leading-7 text-[var(--text-secondary)]">
              {error || dictionary.product.loadError}
            </p>
            <Link
              href="/products"
              className="mt-8 inline-flex rounded-[22px] bg-[var(--accent-solid)] px-7 py-4 text-xs font-bold uppercase tracking-[0.16em] text-[var(--surface-2)]"
            >
              {dictionary.product.returnCollection}
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--surface)]">
      <section className="luxury-container grid gap-14 py-12 md:py-24 lg:grid-cols-[1.2fr_0.8fr]">
        <ProductImageMarquee
          images={gallery}
          productName={product.name}
          onSelect={(index) => {
            setActiveImage(index);
            setGalleryOpen(true);
          }}
        />

        <aside className="lg:sticky lg:top-28 lg:self-start">
          <div className="rounded-[28px] bg-[var(--surface)]/78 p-1 backdrop-blur-xl">
          <div className="rounded-[26px] bg-[var(--surface-2)]/86 p-6 md:p-9">
            <p className="label-caps">{product.category}</p>
            <h1 className="mt-4 text-5xl font-semibold leading-[0.9] tracking-[-0.04em] text-[var(--text-primary)] md:text-7xl">
              {product.name}
            </h1>
            <p className="mt-5 text-sm leading-7 text-[var(--text-secondary)]">
              {product.description || dictionary.product.fallbackDescription}
            </p>

            {sizeDisplay ? (
              <div className="mt-6 flex items-center gap-3">
                <span className="label-caps">{dictionary.product.size}</span>
                <div className="flex flex-wrap gap-2">
                  {availableSizes.map((size) => (
                    <span
                      key={size}
                      className="inline-flex min-h-9 min-w-9 items-center justify-center rounded-full border border-[var(--surface-border)] bg-[var(--accent-soft)] px-3 text-xs font-bold text-[var(--text-primary)]"
                    >
                      {size}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="mt-8 flex items-end justify-between border-y border-[var(--surface-border)] py-7">
              <div>
                <p className="label-caps">{dictionary.product.rentalPrice}</p>
                <p className="mt-2 text-3xl font-semibold text-[var(--text-primary)]"><MoneyDisplay value={product.rentalPrice} /></p>
                {settings.productDetail.showProductValue ? (
                  <p className="mt-2 text-sm text-[var(--text-secondary)]">
                    {dictionary.product.productValue}: <MoneyDisplay value={product.productValue} />
                  </p>
                ) : null}
              </div>
              <Link
                href={`/products/${product.id}/preview`}
                className="rounded-[20px] border border-[var(--surface-border)] px-5 py-3 text-xs font-bold uppercase tracking-[0.14em] transition hover:bg-[var(--accent-solid)] hover:text-[var(--surface-2)]"
              >
                {dictionary.product.aiPreview}
              </Link>
            </div>

            <div className="mt-7 grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="label-caps">{dictionary.cart.pickupDate}</span>
                <input
                  type="date"
                  value={startDate}
                  min={new Date().toISOString().slice(0, 10)}
                  onChange={(event) => {
                    const newStart = event.target.value;
                    setStartDate(newStart);
                    if (endDate && endDate <= newStart) setEndDate('');
                  }}
                  className="mt-2 w-full rounded-[20px] border border-[var(--surface-border)] bg-[var(--surface-2)] px-4 py-3 text-sm outline-none transition focus:ring-4 focus:ring-[var(--accent-soft)]"
                />
              </label>

              <label className="block">
                <span className="label-caps">{dictionary.cart.returnDate}</span>
                <input
                  type="date"
                  value={endDate}
                  min={getNextDay(startDate || new Date().toISOString().slice(0, 10))}
                  onChange={(event) => setEndDate(event.target.value)}
                  className="mt-2 w-full rounded-[20px] border border-[var(--surface-border)] bg-[var(--surface-2)] px-4 py-3 text-sm outline-none transition focus:ring-4 focus:ring-[var(--accent-soft)]"
                />
              </label>
            </div>

            <div className="mt-4 rounded-[20px] border border-[var(--surface-border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--text-secondary)]">
              {startDate && endDate
                ? `${formatDateLabel(startDate)} - ${formatDateLabel(endDate)}`
                : dictionary.common.datesPending}
            </div>
            {availabilityMessage ? (
              <div className="mt-4 rounded-[20px] border border-[var(--surface-border)] bg-[var(--accent-soft)] p-4 text-sm text-[var(--text-secondary)]">
                {availabilityMessage}
              </div>
            ) : null}

            <div className="mt-7 space-y-3">
              <button
                type="button"
                onClick={handleRentNow}
                className="w-full rounded-[22px] bg-[var(--accent-solid)] px-6 py-4 text-xs font-bold uppercase tracking-[0.16em] text-[var(--surface-2)] transition hover:-translate-y-0.5"
              >
                {dictionary.product.rentNow}
              </button>
              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={handleAddToCart}
                  className="rounded-[22px] border border-[var(--surface-border)] px-6 py-4 text-xs font-bold uppercase tracking-[0.16em] text-[var(--text-primary)] transition hover:bg-[var(--accent-soft)]"
                >
                  {dictionary.product.addToCart}
                </button>
                <button
                  type="button"
                  onClick={() => void handleCheckAvailability()}
                  className="rounded-[22px] border border-[var(--surface-border)] px-6 py-4 text-xs font-bold uppercase tracking-[0.16em] text-[var(--text-primary)] transition hover:bg-[var(--accent-soft)]"
                >
                  {dictionary.product.availability}
                </button>
              </div>
            </div>
          </div>
          </div>

          <div className="mt-7 grid gap-4 md:grid-cols-2">
            {metadataBlocks.map(([title, copy]) => (
              <div key={String(title)} className="rounded-[24px] bg-[var(--surface-2)]/72 p-6">
                <p className="label-caps">{title}</p>
                <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">{copy}</p>
              </div>
            ))}
            <div className="rounded-[24px] bg-[var(--surface-2)]/72 p-6 md:col-span-2">
              <p className="label-caps">{dictionary.product.metadata}</p>
              <p className="mt-3 text-sm leading-7 text-[var(--text-secondary)]">{settings.productDetail.rentalNoteBlock}</p>
            </div>
          </div>
        </aside>
      </section>

      <section className="luxury-container pb-20">
        <TryOnDemo product={product} />
      </section>

      {relatedProducts.length ? (
        <section className="luxury-container pb-24">
          <div className="section-heading">
            <div>
              <div className="eyebrow">{dictionary.product.relatedTitle}</div>
              <h2>{dictionary.product.relatedTitle}</h2>
            </div>
          </div>
          <div className="product-grid product-grid-luxury">
            {relatedProducts.slice(0, settings.productDetail.relatedProductsLimit).map((item, index) => (
              <ProductCard key={item.id} product={item} index={index} />
            ))}
          </div>
        </section>
      ) : null}

      <GalleryModal
        images={gallery}
        title={product.name}
        initialIndex={activeImage}
        open={galleryOpen}
        onClose={() => setGalleryOpen(false)}
      />
    </main>
  );
}
