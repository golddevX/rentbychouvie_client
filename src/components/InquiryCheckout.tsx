'use client';

import { useEffect, useId, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { MoneyDisplay } from '@/components/MoneyDisplay';
import { SearchableSelect } from '@/components/SearchableSelect';
import { useClientSettings } from '@/components/client/ClientSettingsProvider';
import { useI18n } from '@/components/client/I18nProvider';
import { useToast } from '@/components/client/ToastProvider';
import { formatDateLabel, getNextDay, rentalDaysBetween, toIsoDateTime } from '@/lib/date';
import { aiPreviewApi, bookingsApi, productsApi, vouchersApi } from '@/lib/api';
import { getProductImage } from '@/lib/product-images';
import { getRentalDepositPolicy } from '@/lib/rental-policy';
import { AppointmentIntent, SecurityDepositOption, VoucherValidationResult } from '@/types';
import { useCartStore } from '@/store/cart.store';

type CheckoutFormValues = {
  customerName: string;
  phone: string;
  email?: string;
  note?: string;
  height?: string;
  weight?: string;
  measurements?: string;
  appointmentIntent: AppointmentIntent;
};

export function InquiryCheckout() {
  const router = useRouter();
  const { dictionary } = useI18n();
  const { settings } = useClientSettings();
  const { pushToast } = useToast();
  const items = useCartStore((state) => state.items);
  const pickupDate = useCartStore((state) => state.pickupDate);
  const returnDate = useCartStore((state) => state.returnDate);
  const summary = useCartStore((state) => state.getSummary(settings.pricingRules));
  const updateRentalDates = useCartStore((state) => state.updateRentalDates);
  const clearCart = useCartStore((state) => state.clearCart);
  const setLastBookingId = useCartStore((state) => state.setLastBookingId);
  const removeProduct = useCartStore((state) => state.removeProduct);
  const [pickupTime, setPickupTime] = useState('10:00');
  const [returnTime, setReturnTime] = useState('20:59');
  const [securityDepositOption, setSecurityDepositOption] = useState<SecurityDepositOption>('none');
  const [faceImage, setFaceImage] = useState<File | null>(null);
  const [bodyImage, setBodyImage] = useState<File | null>(null);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);
  const [unavailableIds, setUnavailableIds] = useState<string[]>([]);
  const [voucherCode, setVoucherCode] = useState('');
  const [voucher, setVoucher] = useState<VoucherValidationResult | null>(null);
  const [voucherLoading, setVoucherLoading] = useState(false);
  const [voucherError, setVoucherError] = useState<string | null>(null);
  const intentLabels: Record<AppointmentIntent, string> = {
    FITTING: dictionary.checkout.intentFitting,
    PICKUP: dictionary.checkout.intentPickup,
    DELIVERY: dictionary.checkout.intentDelivery,
  };
  const depositOptionLabels: Record<SecurityDepositOption, string> = {
    none: dictionary.cart.depositNone,
    cccd: dictionary.cart.depositCccd,
    cash_500k: dictionary.cart.depositCash500,
    cash_1m: dictionary.cart.depositCash1000,
    cash_500k_and_cccd: dictionary.cart.depositCash500AndCccd,
  };

  const formSchema = z.object({
    customerName: z.string().trim().min(1, dictionary.checkout.validation.customerNameRequired),
    phone: z.string()
      .trim()
      .min(1, dictionary.checkout.validation.phoneRequired)
      .regex(/^[0-9+\s().-]{8,20}$/, dictionary.checkout.validation.phoneInvalid),
    email: z.string().trim().email(dictionary.checkout.validation.emailInvalid).optional().or(z.literal('')),
    note: z.string().optional(),
    height: z.string().optional(),
    weight: z.string().optional(),
    measurements: z.string().optional(),
    appointmentIntent: z.enum(['FITTING', 'PICKUP', 'DELIVERY']),
  });

  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CheckoutFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      appointmentIntent: 'FITTING',
    },
  });

  useEffect(() => {
    if (!items.length || !pickupDate || !returnDate) {
      setUnavailableIds([]);
      setAvailabilityError(null);
      return;
    }

    const run = async () => {
      try {
        setAvailabilityLoading(true);
        setAvailabilityError(null);
        const responses = await Promise.all(
          items.map((item) =>
            productsApi.getAvailability(item.productSlug || item.productId, {
              pickupDate: toIsoDateTime(pickupDate, pickupTime),
              returnDate: toIsoDateTime(returnDate, returnTime),
            }),
          ),
        );
        const blocked = responses
          .filter((response) => response.data.availability.explicitCheck && !response.data.availability.explicitCheck.available)
          .map((response) => response.data.product.id);
        setUnavailableIds(blocked);
      } catch (error) {
        console.error(error);
        setAvailabilityError(dictionary.cart.unavailable);
      } finally {
        setAvailabilityLoading(false);
      }
    };

    void run();
  }, [dictionary.cart.unavailable, items, pickupDate, pickupTime, returnDate, returnTime]);

  const unavailableNames = useMemo(
    () => items.filter((item) => unavailableIds.includes(item.productId)).map((item) => item.productName),
    [items, unavailableIds],
  );
  const checkoutDepositPolicy = useMemo(
    () => getRentalDepositPolicy(
      voucher?.finalAmount ?? summary.totalRentalPrice,
      settings.pricingRules.deposit,
      securityDepositOption,
    ),
    [securityDepositOption, settings.pricingRules.deposit, summary.totalRentalPrice, voucher?.finalAmount],
  );

  useEffect(() => {
    if (!checkoutDepositPolicy.allowedOptions.includes(securityDepositOption)) {
      setSecurityDepositOption(checkoutDepositPolicy.selectedOption);
    }
  }, [checkoutDepositPolicy, securityDepositOption]);

  useEffect(() => {
    setVoucher(null);
    setVoucherError(null);
  }, [summary.totalRentalPrice, items]);

  const dateError = useMemo(() => {
    if (!pickupDate || !returnDate) return dictionary.cart.datesError;
    if (rentalDaysBetween(pickupDate, returnDate) <= 0) return dictionary.cart.invalidDate;
    const pickupAt = toIsoDateTime(pickupDate, pickupTime);
    const returnAt = toIsoDateTime(returnDate, returnTime);
    if (!pickupAt || !returnAt || new Date(returnAt) <= new Date(pickupAt)) {
      return dictionary.cart.invalidDate;
    }
    return null;
  }, [dictionary.cart.datesError, dictionary.cart.invalidDate, pickupDate, pickupTime, returnDate, returnTime]);

  const onSubmit = async (values: CheckoutFormValues) => {
    if (!items.length) {
      pushToast({ tone: 'error', title: dictionary.cart.empty });
      return;
    }
    if (dateError) {
      pushToast({ tone: 'error', title: dateError });
      return;
    }
    if (unavailableIds.length) {
      pushToast({
        tone: 'error',
        title: dictionary.checkout.unavailableError,
        description: unavailableNames.join(', '),
      });
      return;
    }

    try {
      let previewUpload: { faceImageUrl?: string; bodyImageUrl?: string | null } = {};
      if (faceImage && items[0]) {
        const previewResponse = await aiPreviewApi.generate({
          productId: items[0].productId,
          faceImage,
          bodyImage,
          customerName: values.customerName,
          phone: values.phone,
        });
        previewUpload = previewResponse.data;
      }
      const response = await bookingsApi.create({
        customerName: values.customerName,
        phone: values.phone,
        email: values.email || undefined,
        pickupDate: toIsoDateTime(pickupDate, pickupTime)!,
        returnDate: toIsoDateTime(returnDate, returnTime)!,
        appointmentIntent: values.appointmentIntent,
        productIds: items.map((item) => item.productId),
        note: values.note,
        source: 'website',
        height: values.height ? Number(values.height) : undefined,
        weight: values.weight ? Number(values.weight) : undefined,
        measurements: values.measurements || undefined,
        faceImage: previewUpload.faceImageUrl,
        bodyImage: previewUpload.bodyImageUrl || undefined,
        securityDepositOption: checkoutDepositPolicy.selectedOption,
        voucherCode: voucher?.code,
      });
      setLastBookingId(response.data.id);
      clearCart();
      router.push(`/success?bookingId=${response.data.id}`);
    } catch (error: any) {
      console.error(error);
      pushToast({
        tone: 'error',
        title: dictionary.checkout.submitError,
        description: error?.response?.data?.message,
      });
    }
  };

  const applyVoucher = async () => {
    const code = voucherCode.trim().toUpperCase();
    if (!code) return;
    setVoucherLoading(true);
    setVoucherError(null);
    try {
      const response = await vouchersApi.validate({
        code,
        subtotal: summary.totalRentalPrice,
        productIds: items.map((item) => item.productId),
      });
      setVoucher(response.data);
      setVoucherCode(response.data.code);
    } catch (error: any) {
      setVoucher(null);
      setVoucherError(error?.response?.data?.message ?? 'Voucher không hợp lệ.');
    } finally {
      setVoucherLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[var(--surface)]">
      <section className="luxury-container py-10 md:py-16">
        <div className="grid gap-6 md:grid-cols-[1.2fr_0.8fr] md:items-end">
          <div>
            <p className="label-caps">{dictionary.cart.title}</p>
            <h1 className="mt-4 text-5xl font-semibold leading-[0.9] tracking-[-0.04em] text-[var(--text-primary)] md:text-7xl">
              {dictionary.checkout.customer_info}
            </h1>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-[var(--text-secondary)]">
              {settings.inquiry.helperText}
            </p>
          </div>
          <div className="rounded-[28px] bg-[var(--surface-inverse)] px-6 py-7 text-white">
            <p className="label-caps text-white/54">{dictionary.cart.summary}</p>
            <p className="mt-3 text-2xl font-semibold">{summary.itemCount} {dictionary.cart.totalProducts.toLowerCase()}</p>
            <p className="mt-3 text-sm leading-7 text-white/68">
              {settings.policies.depositPolicy}
            </p>
          </div>
        </div>
      </section>

      <section className="luxury-container grid gap-8 pb-24 lg:grid-cols-[1.08fr_0.92fr]">
        <div className="space-y-6">
          <div className="soft-panel p-6 md:p-8">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold text-[var(--text-primary)]">{dictionary.cart.title}</h2>
              <Link href="/products" className="cinematic-link text-[var(--text-primary)]">
                {dictionary.cart.continueShopping}
              </Link>
            </div>

            {items.length === 0 ? (
              <div className="mt-6 rounded-[24px] border border-dashed border-[var(--surface-border)] px-5 py-8 text-center">
                <p className="text-lg font-semibold text-[var(--text-primary)]">{dictionary.cart.empty}</p>
              </div>
            ) : (
              <div className="mt-6 space-y-4">
                {items.map((item) => (
                  <div key={item.productId} className="flex gap-4 rounded-[24px] border border-[var(--surface-border)] bg-[var(--surface-2)] p-4">
                    <Image src={getProductImage({ id: item.productId, image: item.image, images: item.image ? [item.image] : [] })} alt={item.productName} width={96} height={112} className="h-28 w-24 rounded-[18px] object-cover" />
                    <div className="min-w-0 flex-1">
                      <p className="label-caps">{item.category}</p>
                      <h3 className="mt-1 text-lg font-semibold text-[var(--text-primary)]">{item.productName}</h3>
                      <p className="mt-2 text-sm text-[var(--text-secondary)]">
                        {[item.selectedMetadata?.size, item.selectedMetadata?.color, item.selectedMetadata?.accessories].filter(Boolean).join(' · ') || dictionary.common.luxuryService}
                      </p>
                      <div className="mt-4 flex items-center justify-between">
                        <MoneyDisplay value={item.rentalPrice} className="text-sm font-semibold text-[var(--text-primary)]" />
                        <button type="button" onClick={() => removeProduct(item.productId)} className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-secondary)]">
                          {dictionary.cart.remove}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="soft-panel p-6 md:p-8">
            <h2 className="text-2xl font-semibold text-[var(--text-primary)]">{dictionary.cart.rentalDays}</h2>
            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <label className="field">
                <span>{dictionary.cart.pickupDate}</span>
                <input
                  type="date"
                  value={pickupDate}
                  min={new Date().toISOString().slice(0, 10)}
                  onChange={(event) => {
                    const newPickup = event.target.value;
                    const correctedReturn = returnDate && returnDate <= newPickup ? '' : returnDate;
                    updateRentalDates(newPickup, correctedReturn);
                  }}
                />
              </label>
              <label className="field">
                <span>{dictionary.cart.pickupTime}</span>
                <input
                  type="time"
                  value={pickupTime}
                  onChange={(event) => setPickupTime(event.target.value)}
                />
              </label>
              <label className="field">
                <span>{dictionary.cart.returnDate}</span>
                <input
                  type="date"
                  value={returnDate}
                  min={getNextDay(pickupDate || new Date().toISOString().slice(0, 10))}
                  onChange={(event) => updateRentalDates(pickupDate, event.target.value)}
                />
              </label>
              <label className="field">
                <span>{dictionary.cart.returnTime}</span>
                <input
                  type="time"
                  value={returnTime}
                  onChange={(event) => setReturnTime(event.target.value)}
                />
              </label>
            </div>

            <div className="mt-6 grid gap-3">
              <p className="text-sm text-[var(--text-secondary)]">
                {pickupDate && returnDate
                  ? `${formatDateLabel(pickupDate)} - ${formatDateLabel(returnDate)}`
                  : dictionary.common.datesPending}
              </p>
              {dateError ? (
                <div className="rounded-[20px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                  {dateError}
                </div>
              ) : null}
              {availabilityError ? (
                <div className="rounded-[20px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
                  {availabilityError}
                </div>
              ) : null}
              {!availabilityError && unavailableNames.length > 0 ? (
                <div className="rounded-[20px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
                  {dictionary.cart.unavailable}: {unavailableNames.join(', ')}
                </div>
              ) : null}
              {!dateError && !availabilityError && !unavailableNames.length && pickupDate && returnDate ? (
                <div className="rounded-[20px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                  {availabilityLoading ? dictionary.common.loading : dictionary.product.availabilityReady}
                </div>
              ) : null}
            </div>
          </div>

          <div className="soft-panel p-6 md:p-8">
            <p className="label-caps">Chính sách cọc</p>
            <h2 className="mt-3 text-2xl font-semibold text-[var(--text-primary)]">{checkoutDepositPolicy.label}</h2>
            <p className="mt-4 text-sm leading-7 text-[var(--text-secondary)]">
              {settings.policies.depositPolicy}
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {checkoutDepositPolicy.allowedOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setSecurityDepositOption(option)}
                  className={`rounded-[18px] border px-4 py-3 text-sm font-semibold ${
                    checkoutDepositPolicy.selectedOption === option
                      ? 'border-[var(--accent-solid)] bg-[var(--accent-soft)]'
                      : 'border-[var(--surface-border)]'
                  }`}
                >
                  {depositOptionLabels[option]}
                </button>
              ))}
            </div>
            {checkoutDepositPolicy.requiresCccd ? (
              <p className="mt-4 rounded-[18px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                {dictionary.cart.cccdReminder}
              </p>
            ) : null}
          </div>
        </div>

        <aside className="space-y-6">
          <div className="soft-panel p-6 md:p-8">
            <p className="label-caps">Voucher</p>
            <div className="mt-4 flex gap-3">
              <input
                value={voucherCode}
                onChange={(event) => {
                  setVoucherCode(event.target.value.toUpperCase());
                  setVoucher(null);
                  setVoucherError(null);
                }}
                placeholder="Nhập mã giảm giá"
                className="min-w-0 flex-1 rounded-[18px] border border-[var(--surface-border)] bg-[var(--surface-2)] px-4 py-3 text-sm outline-none"
              />
              <button type="button" onClick={() => void applyVoucher()} disabled={voucherLoading || !voucherCode.trim()} className="rounded-[18px] bg-[var(--surface-inverse)] px-5 text-xs font-bold uppercase tracking-[0.12em] text-white disabled:opacity-50">
                {voucherLoading ? 'Đang kiểm tra' : 'Áp dụng'}
              </button>
            </div>
            {voucherError ? <p className="mt-3 text-sm text-rose-700">{voucherError}</p> : null}
            {voucher ? (
              <div className="mt-4 rounded-[20px] border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
                <p className="font-semibold">{voucher.code} · {voucher.name}</p>
                <div className="mt-2 flex justify-between"><span>Giảm</span><MoneyDisplay value={voucher.discountAmount} /></div>
                <div className="mt-1 flex justify-between font-semibold"><span>Tổng sau giảm</span><MoneyDisplay value={voucher.finalAmount} /></div>
              </div>
            ) : null}
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="soft-panel p-6 md:p-8">
            <h2 className="text-2xl font-semibold text-[var(--text-primary)]">{dictionary.checkout.customer_info}</h2>
            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <label className="field">
                <span>{dictionary.checkout.customerName}</span>
                <input type="text" {...register('customerName')} />
                {errors.customerName ? <p className="text-sm text-rose-700">{errors.customerName.message}</p> : null}
              </label>
              <label className="field">
                <span>{dictionary.checkout.phone}</span>
                <input type="tel" {...register('phone')} />
                {errors.phone ? <p className="text-sm text-rose-700">{errors.phone.message}</p> : null}
              </label>
              <label className="field">
                <span>{dictionary.checkout.email}</span>
                <input type="email" {...register('email')} />
                {errors.email ? <p className="text-sm text-rose-700">{errors.email.message}</p> : null}
              </label>
              <Controller
                control={control}
                name="appointmentIntent"
                render={({ field }) => (
                  <SearchableSelect
                    label={dictionary.checkout.appointment_intent}
                    value={field.value}
                    onChange={field.onChange}
                    error={errors.appointmentIntent?.message}
                    options={[
                      { value: 'FITTING', label: intentLabels.FITTING },
                      { value: 'PICKUP', label: intentLabels.PICKUP },
                      { value: 'DELIVERY', label: intentLabels.DELIVERY },
                    ]}
                  />
                )}
              />
              <label className="field">
                <span>{dictionary.checkout.height}</span>
                <input type="number" {...register('height')} />
              </label>
              <label className="field">
                <span>{dictionary.checkout.weight}</span>
                <input type="number" {...register('weight')} />
              </label>
              <label className="field md:col-span-2">
                <span>{dictionary.checkout.measurements}</span>
                <input type="text" {...register('measurements')} />
              </label>
              <label className="field md:col-span-2">
                <span>{dictionary.checkout.note}</span>
                <textarea rows={5} {...register('note')} />
              </label>
              {settings.preview.enabled ? (
                <>
                  <PremiumPhotoUpload
                    label={dictionary.preview.uploadFace}
                    file={faceImage}
                    badge={dictionary.preview.required}
                    chooseLabel={dictionary.preview.chooseImage}
                    replaceLabel={dictionary.preview.replaceImage}
                    hint={dictionary.preview.uploadHint}
                    onChange={setFaceImage}
                  />
                  <PremiumPhotoUpload
                    label={dictionary.preview.uploadBody}
                    file={bodyImage}
                    badge={dictionary.preview.optional}
                    chooseLabel={dictionary.preview.chooseImage}
                    replaceLabel={dictionary.preview.replaceImage}
                    hint={dictionary.preview.uploadHint}
                    onChange={setBodyImage}
                  />
                </>
              ) : null}
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !items.length || Boolean(dateError) || unavailableIds.length > 0}
              className="mt-6 inline-flex w-full items-center justify-center rounded-[22px] bg-[var(--accent-solid)] px-6 py-4 text-xs font-bold uppercase tracking-[0.16em] text-white disabled:opacity-50"
            >
              {isSubmitting ? dictionary.checkout.submitting : dictionary.checkout.submit}
            </button>
          </form>

          <div className="soft-panel p-6 md:p-8">
            <h2 className="text-2xl font-semibold text-[var(--text-primary)]">{dictionary.cart.summary}</h2>
            <div className="mt-6 space-y-3 text-sm text-[var(--text-secondary)]">
              <div className="flex justify-between">
                <span>{dictionary.cart.totalProducts}</span>
                <span>{summary.itemCount}</span>
              </div>
              <div className="flex justify-between">
                <span>{dictionary.cart.totalProductValue}</span>
                <MoneyDisplay value={summary.totalProductValue} />
              </div>
              <div className="flex justify-between">
                <span>{dictionary.cart.totalRental}</span>
                <MoneyDisplay value={voucher?.finalAmount ?? summary.totalRentalPrice} />
              </div>
              <div className="flex justify-between">
                <span>{dictionary.cart.depositRequired}</span>
                <MoneyDisplay value={checkoutDepositPolicy.cashAmount} />
              </div>
              <div className="flex justify-between">
                <span>{dictionary.cart.rentalDays}</span>
                <span>{summary.rentalDays || '-'}</span>
              </div>
            </div>
            <div className="mt-6 rounded-[24px] bg-[var(--accent-soft)] p-5 text-sm leading-7 text-[var(--text-secondary)]">
              <p>{settings.inquiry.depositNote}</p>
              <p className="mt-3">{settings.inquiry.pickupNote}</p>
            </div>
          </div>
        </aside>
      </section>
    </main>
  );
}

function PremiumPhotoUpload({
  label,
  file,
  badge,
  chooseLabel,
  replaceLabel,
  hint,
  onChange,
}: {
  label: string;
  file: File | null;
  badge: string;
  chooseLabel: string;
  replaceLabel: string;
  hint: string;
  onChange: (file: File | null) => void;
}) {
  const inputId = useId();

  return (
    <div className="field h-full">
      <div className="flex min-h-[26px] items-center justify-between gap-3">
        <span className="min-w-0 truncate">{label}</span>
        <span className="inline-flex min-w-[112px] shrink-0 items-center justify-center whitespace-nowrap rounded-full border border-[var(--surface-border)] bg-[var(--surface)] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--text-muted)]">
          {badge}
        </span>
      </div>

      <label
        htmlFor={inputId}
        className={`group relative flex h-full min-h-[132px] cursor-pointer items-center gap-4 overflow-hidden rounded-[24px] border p-4 transition duration-300 focus-within:ring-4 focus-within:ring-[var(--accent-soft)] ${
          file
            ? 'border-[var(--text-muted)] bg-[var(--accent-soft)]/55'
            : 'border-dashed border-[var(--surface-border)] bg-white/55 hover:-translate-y-0.5 hover:border-[var(--text-muted)] hover:bg-white/80 hover:shadow-[var(--shadow-soft)]'
        }`}
      >
        <input
          id={inputId}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
          className="sr-only"
          onChange={(event) => onChange(event.target.files?.[0] ?? null)}
        />

        <span className="grid h-14 w-14 shrink-0 place-items-center rounded-[18px] border border-[var(--surface-border)] bg-[var(--surface-2)] text-[var(--text-primary)] shadow-sm transition duration-300 group-hover:scale-105">
          {file ? (
            <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6 fill-none stroke-current" strokeWidth="1.7">
              <path d="m7.5 12.5 3 3 6-7" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="12" cy="12" r="9" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6 fill-none stroke-current" strokeWidth="1.7">
              <path d="M12 16V5m0 0L8.5 8.5M12 5l3.5 3.5M5 14.5v3A1.5 1.5 0 0 0 6.5 19h11a1.5 1.5 0 0 0 1.5-1.5v-3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </span>

        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold text-[var(--text-primary)]">
            {file ? file.name : chooseLabel}
          </span>
          <span className="mt-1 block text-xs leading-5 text-[var(--text-muted)]">
            {file ? replaceLabel : hint}
          </span>
        </span>
      </label>
    </div>
  );
}
