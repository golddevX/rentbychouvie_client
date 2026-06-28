import 'server-only';
import {
  BookingStatus,
  LeadDepositType,
  Prisma,
  ProductStatus,
  UserRole,
} from '@prisma/client';
import { db } from '@/lib/db';
import { publicBookingSchema } from '@/lib/validation';
import { checkProductAvailability } from './product.service';
import { validateVoucher } from './voucher.service';

const PRICING_RULES_KEY = 'pricing-rules-v1';

const DEFAULT_PRICING_RULES = {
  duration: {
    oneDayDiscountPercent: 15,
    twoDayDiscountPercent: 10,
  },
  earlyPickup: {
    threeDayRentalFeePerExtraDay: 10000,
    shortRentalFeePerExtraDay: 20000,
  },
  deposit: {
    noDepositMaximumRental: 300000,
    middleTierMaximumRental: 1000000,
    middleTierCashDeposit: 500000,
    highTierCashDeposit: 1000000,
    highTierCashWithDocument: 500000,
  },
};

type DepositOption = 'none' | 'cccd' | 'cash_500k' | 'cash_1m' | 'cash_500k_and_cccd';

function fallbackEmail(phone: string) {
  const digits = phone.replace(/\D/g, '') || 'guest';
  return `booking-${digits}@website.local`;
}

function rentalDays(pickupDate: Date, returnDate: Date) {
  const pickupDay = Date.UTC(
    pickupDate.getUTCFullYear(),
    pickupDate.getUTCMonth(),
    pickupDate.getUTCDate(),
  );
  const returnDay = Date.UTC(
    returnDate.getUTCFullYear(),
    returnDate.getUTCMonth(),
    returnDate.getUTCDate(),
  );
  return Math.max(1, Math.floor((returnDay - pickupDay) / 86400000) + 1);
}

function rentalPriceForDuration(basePrice: number, duration: number, oneDayDiscount: number, twoDayDiscount: number) {
  if (duration === 1) return Math.max(0, Math.round(basePrice * (1 - oneDayDiscount / 100)));
  if (duration === 2) return Math.max(0, Math.round(basePrice * (1 - twoDayDiscount / 100)));
  return Math.max(0, basePrice);
}

function vipDiscountRate(tier?: string | null) {
  const value = String(tier || 'REGULAR').toUpperCase();
  if (value === 'DIAMOND') return 0.15;
  if (value === 'GOLD') return 0.1;
  if (value === 'SILVER') return 0.05;
  return 0;
}

function resolveDepositPolicy(
  rentalPrice: number,
  requestedOption: DepositOption | undefined,
  rules: typeof DEFAULT_PRICING_RULES.deposit,
) {
  if (rentalPrice <= rules.noDepositMaximumRental) {
    return {
      tier: 'under_300k',
      requiredCashAmount: 0,
      requiresCccd: false,
      allowedOptions: ['none'] as DepositOption[],
      selectedOption: 'none' as DepositOption,
    };
  }

  if (rentalPrice < rules.middleTierMaximumRental) {
    const allowedOptions: DepositOption[] = ['cash_500k', 'cccd'];
    const selectedOption = requestedOption && allowedOptions.includes(requestedOption)
      ? requestedOption
      : 'cash_500k';
    return {
      tier: 'from_300k_to_under_1m',
      requiredCashAmount: selectedOption === 'cash_500k' ? rules.middleTierCashDeposit : 0,
      requiresCccd: selectedOption === 'cccd',
      allowedOptions,
      selectedOption,
    };
  }

  const allowedOptions: DepositOption[] = ['cash_1m', 'cash_500k_and_cccd'];
  const selectedOption = requestedOption && allowedOptions.includes(requestedOption)
    ? requestedOption
    : 'cash_1m';
  return {
    tier: 'from_1m',
    requiredCashAmount: selectedOption === 'cash_1m'
      ? rules.highTierCashDeposit
      : rules.highTierCashWithDocument,
    requiresCccd: selectedOption === 'cash_500k_and_cccd',
    allowedOptions,
    selectedOption,
  };
}

function composeBookingNote(input: {
  appointmentIntent: string;
  note?: string;
  height?: number;
  weight?: number;
  measurements?: string;
  faceImage?: string;
  bodyImage?: string;
}) {
  return [
    '[ĐẶT THUÊ TRỰC TIẾP TỪ WEBSITE]',
    `Hình thức khách chọn: ${input.appointmentIntent}`,
    input.note?.replace(/[<>]/g, '').trim(),
    input.height ? `Chiều cao: ${input.height}` : '',
    input.weight ? `Cân nặng: ${input.weight}` : '',
    input.measurements?.trim() ? `Số đo: ${input.measurements.trim()}` : '',
    input.faceImage ? `Ảnh khuôn mặt: ${input.faceImage}` : '',
    input.bodyImage ? `Ảnh toàn thân: ${input.bodyImage}` : '',
  ].filter(Boolean).join('\n');
}

async function getPricingRules(client: Prisma.TransactionClient) {
  const record = await client.siteSetting.findUnique({ where: { key: PRICING_RULES_KEY } });
  if (!record) return DEFAULT_PRICING_RULES;
  try {
    const parsed = JSON.parse(record.value);
    return {
      duration: { ...DEFAULT_PRICING_RULES.duration, ...parsed.duration },
      earlyPickup: { ...DEFAULT_PRICING_RULES.earlyPickup, ...parsed.earlyPickup },
      deposit: { ...DEFAULT_PRICING_RULES.deposit, ...parsed.deposit },
    };
  } catch {
    return DEFAULT_PRICING_RULES;
  }
}

async function resolveBookingActor(client: Prisma.TransactionClient) {
  const configuredId = process.env.PUBLIC_BOOKING_CREATED_BY_ID?.trim();
  if (configuredId) {
    const configured = await client.user.findFirst({
      where: { id: configuredId, isActive: true, archivedAt: null },
    });
    if (configured) return configured;
  }

  return client.user.findFirst({
    where: {
      isActive: true,
      archivedAt: null,
      role: { in: [UserRole.SUPER_ADMIN, UserRole.MANAGER, UserRole.SALES] },
    },
    orderBy: { createdAt: 'asc' },
  });
}

export async function createPublicBooking(input: unknown) {
  const parsed = publicBookingSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false as const,
      status: 400,
      payload: {
        message: 'Thông tin đặt thuê chưa hợp lệ.',
        issues: parsed.error.flatten(),
      },
    };
  }

  const data = parsed.data;
  const pickupDate = new Date(data.pickupDate);
  const returnDate = new Date(data.returnDate);
  const productIds = [...new Set(data.productIds)];

  try {
    const result = await db.$transaction(async (tx) => {
      const actor = await resolveBookingActor(tx);
      if (!actor) {
        throw new Error('Chưa cấu hình nhân viên tiếp nhận đơn đặt thuê từ website.');
      }

      const products = await tx.product.findMany({
        where: {
          id: { in: productIds },
          archivedAt: null,
          isActive: true,
          status: { in: [ProductStatus.AVAILABLE, ProductStatus.RESERVED] },
        },
      });
      if (products.length !== productIds.length) {
        throw new Error('Một hoặc nhiều sản phẩm không tồn tại hoặc đã ngừng cho thuê.');
      }

      for (const product of products) {
        const availability = await checkProductAvailability(product.id, pickupDate, returnDate, tx);
        if (!availability.available) {
          throw new Error(`${product.name} đã có lịch trong khoảng ngày được chọn.`);
        }
      }

      const pricingRules = await getPricingRules(tx);
      const actualRentalDays = rentalDays(pickupDate, returnDate);
      const pricingDuration = Math.min(3, actualRentalDays);
      const basePrice = products.reduce(
        (sum, product) => sum + Math.max(Number(product.rentalPrice || product.price || 0), 0),
        0,
      );
      const rentalPrice = products.reduce((sum, product) => {
        const productRentalPrice = Math.max(Number(product.rentalPrice || product.price || 0), 0);
        return sum + rentalPriceForDuration(
          productRentalPrice,
          pricingDuration,
          pricingRules.duration.oneDayDiscountPercent,
          pricingRules.duration.twoDayDiscountPercent,
        );
      }, 0);
      const extraDays = Math.max(0, actualRentalDays - pricingDuration);
      const earlyPickupFee = extraDays * (
        pricingDuration === 3
          ? pricingRules.earlyPickup.threeDayRentalFeePerExtraDay
          : pricingRules.earlyPickup.shortRentalFeePerExtraDay
      );
      const subtotalPrice = rentalPrice + earlyPickupFee;
      const voucher = data.voucherCode
        ? await validateVoucher({ code: data.voucherCode, subtotal: subtotalPrice, productIds }, tx)
        : null;
      const afterVoucher = voucher?.finalAmount ?? subtotalPrice;
      const email = data.email?.trim() || fallbackEmail(data.phone);
      const existingCustomer = await tx.customer.findFirst({
        where: {
          archivedAt: null,
          OR: [{ phone: data.phone.trim() }, { email }],
        },
        orderBy: { updatedAt: 'desc' },
      });
      const customer = existingCustomer
        ? await tx.customer.update({
            where: { id: existingCustomer.id },
            data: { name: data.customerName.trim(), phone: data.phone.trim() },
          })
        : await tx.customer.create({
            data: {
              name: data.customerName.trim(),
              phone: data.phone.trim(),
              email,
            },
          });
      const vipDiscount = Math.round(afterVoucher * vipDiscountRate(customer.vipTier));
      const totalPrice = Math.max(afterVoucher - vipDiscount, 0);
      const productValue = products.reduce(
        (sum, product) => sum + Math.max(Number(product.productValue || product.price || 0), 0),
        0,
      );
      const depositPolicy = resolveDepositPolicy(
        totalPrice,
        data.securityDepositOption,
        pricingRules.deposit,
      );
      const depositPolicySnapshot = {
        allowPartialDeposit: true,
        allowedDepositRates: [30, 50, 100],
        defaultDepositRate: 50,
        allowCustomDepositAmount: true,
      };

      const booking = await tx.booking.create({
        data: {
          customerId: customer.id,
          status: BookingStatus.PENDING,
          startDate: pickupDate,
          endDate: returnDate,
          rentalDays: actualRentalDays,
          pickupDate,
          returnDate,
          durationDays: actualRentalDays,
          basePrice,
          subtotalPrice,
          voucherId: voucher?.voucherId,
          voucherCode: voucher?.code,
          voucherDiscount: voucher?.discountAmount ?? 0,
          vipTierAtTime: customer.vipTier,
          vipDiscount,
          priceAdjustment: totalPrice - basePrice,
          totalPrice,
          productValue,
          productValueTotal: productValue,
          selectedDepositType: LeadDepositType.PERCENT,
          selectedDepositRate: depositPolicySnapshot.defaultDepositRate,
          depositPolicySnapshot,
          rentalPaymentPolicySnapshot: { requireRentalPaymentBeforePickup: true },
          bookingDepositRequired: depositPolicy.requiredCashAmount,
          depositRequired: depositPolicy.requiredCashAmount,
          securityDepositRequired: depositPolicy.requiredCashAmount,
          securityDepositOption: depositPolicy.selectedOption,
          accessories: JSON.stringify({
            included: [],
            shoes: false,
            bag: false,
            cccdCaptured: false,
            customerWillBringCccd: depositPolicy.requiresCccd,
            depositPolicy,
          }),
          notes: composeBookingNote(data),
          createdById: actor.id,
        },
      });

      await tx.bookingItem.createMany({
        data: products.map((product) => ({
          bookingId: booking.id,
          productId: product.id,
          productNameAtTime: product.name,
          quantity: 1,
          pricePerDay: rentalPriceForDuration(
            Math.max(Number(product.rentalPrice || product.price || 0), 0),
            pricingDuration,
            pricingRules.duration.oneDayDiscountPercent,
            pricingRules.duration.twoDayDiscountPercent,
          ),
          productValueAtTime: Math.max(Number(product.productValue || product.price || 0), 0),
          rentalPriceAtTime: Math.max(Number(product.rentalPrice || product.price || 0), 0),
        })),
      });

      if (voucher) {
        await tx.voucherUsage.create({
          data: {
            voucherId: voucher.voucherId,
            bookingId: booking.id,
            customerId: customer.id,
            discountAmount: voucher.discountAmount,
          },
        });
        await tx.voucher.update({
          where: { id: voucher.voucherId },
          data: { usedCount: { increment: 1 } },
        });
      }

      return {
        id: booking.id,
        bookingId: booking.id,
        status: booking.status,
        customer,
        pickupDate: booking.pickupDate,
        returnDate: booking.returnDate,
        rentalDays: booking.rentalDays,
        productCount: products.length,
        productIds,
        voucherCode: booking.voucherCode,
        voucherDiscount: booking.voucherDiscount,
        rentalSubtotal: booking.subtotalPrice,
        rentalTotal: booking.totalPrice,
        securityDepositRequired: booking.securityDepositRequired,
        securityDepositOption: booking.securityDepositOption,
      };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

    return { ok: true as const, status: 201, payload: result };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Chưa thể tạo đơn đặt thuê.';
    return { ok: false as const, status: 400, payload: { message } };
  }
}
