import 'server-only';
import {
  LeadAppointmentIntent,
  LeadDepositType,
  LeadStatus,
  Prisma,
  ProductHoldStatus,
  ProductStatus,
} from '@prisma/client';
import { db } from '@/lib/db';
import { leadSchema } from '@/lib/validation';
import { checkProductAvailability } from './product.service';
import { validateVoucher } from './voucher.service';

const PRICING_RULES_KEY = 'pricing-rules-v1';
const DEFAULT_DURATION_RULES = {
  oneDayDiscountPercent: 15,
  twoDayDiscountPercent: 10,
};
const DEFAULT_DEPOSIT_RULES = {
  noDepositMaximumRental: 300000,
  middleTierMaximumRental: 1000000,
  middleTierCashDeposit: 500000,
  highTierCashDeposit: 1000000,
  highTierCashWithDocument: 500000,
};

function fallbackEmail(phone: string) {
  const digits = phone.replace(/\D/g, '') || 'guest';
  return `lead-${digits}@website.local`;
}

function rentalDays(pickupDate: Date, returnDate: Date) {
  const effectivePickup = new Date(pickupDate);
  if (effectivePickup.getHours() >= 20) {
    effectivePickup.setDate(effectivePickup.getDate() + 1);
    effectivePickup.setHours(0, 0, 0, 0);
  }
  return Math.min(3, Math.max(1, Math.ceil((returnDate.getTime() - effectivePickup.getTime()) / 86400000)));
}

function adjustedRentalPrice(base: number, days: number, rules: typeof DEFAULT_DURATION_RULES) {
  if (days === 1) return Math.round(base * (1 - rules.oneDayDiscountPercent / 100));
  if (days === 2) return Math.round(base * (1 - rules.twoDayDiscountPercent / 100));
  return base;
}

function cashDepositRequired(rentalPrice: number, rules: typeof DEFAULT_DEPOSIT_RULES) {
  if (rentalPrice <= rules.noDepositMaximumRental) return 0;
  if (rentalPrice < rules.middleTierMaximumRental) return rules.middleTierCashDeposit;
  return rules.highTierCashDeposit;
}

function composeNote(input: {
  note?: string;
  height?: number;
  weight?: number;
  measurements?: string;
  faceImage?: string;
  bodyImage?: string;
}) {
  return [
    input.note?.replace(/[<>]/g, '').trim(),
    input.height ? `Chiều cao: ${input.height}` : '',
    input.weight ? `Cân nặng: ${input.weight}` : '',
    input.measurements?.trim() ? `Số đo: ${input.measurements.trim()}` : '',
    input.faceImage ? `Ảnh khuôn mặt: ${input.faceImage}` : '',
    input.bodyImage ? `Ảnh toàn thân: ${input.bodyImage}` : '',
  ].filter(Boolean).join('\n') || null;
}

async function getPricingRules(client: Prisma.TransactionClient) {
  const record = await client.siteSetting.findUnique({ where: { key: PRICING_RULES_KEY } });
  if (!record) return { duration: DEFAULT_DURATION_RULES, deposit: DEFAULT_DEPOSIT_RULES };
  try {
    const parsed = JSON.parse(record.value);
    return {
      duration: { ...DEFAULT_DURATION_RULES, ...parsed.duration },
      deposit: { ...DEFAULT_DEPOSIT_RULES, ...parsed.deposit },
    };
  } catch {
    return { duration: DEFAULT_DURATION_RULES, deposit: DEFAULT_DEPOSIT_RULES };
  }
}

export async function createLead(input: unknown) {
  const parsed = leadSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false as const,
      status: 400,
      payload: {
        message: 'Thông tin yêu cầu chưa hợp lệ.',
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
      const products = await tx.product.findMany({
        where: {
          id: { in: productIds },
          archivedAt: null,
          isActive: true,
          status: { in: [ProductStatus.AVAILABLE, ProductStatus.RESERVED] },
        },
      });
      if (products.length !== productIds.length) {
        throw new Error('Một hoặc nhiều sản phẩm không tồn tại hoặc không được phép hiển thị.');
      }

      for (const product of products) {
        const availability = await checkProductAvailability(product.id, pickupDate, returnDate, tx);
        if (!availability.available) {
          throw new Error(`${product.name} đã có lịch trong khoảng ngày được chọn.`);
        }
      }

      const pricingRules = await getPricingRules(tx);
      const days = rentalDays(pickupDate, returnDate);
      const rentalSubtotal = products.reduce((sum, product) => {
        const base = Math.max(Number(product.rentalPrice || product.price || 0), 0);
        return sum + adjustedRentalPrice(base, days, pricingRules.duration);
      }, 0);
      const voucher = data.voucherCode
        ? await validateVoucher({
            code: data.voucherCode,
            subtotal: rentalSubtotal,
            productIds,
          }, tx)
        : null;
      const rentalTotal = voucher?.finalAmount ?? rentalSubtotal;
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

      const selectedDepositType = data.selectedDepositType === 'custom_amount'
        ? LeadDepositType.CUSTOM_AMOUNT
        : LeadDepositType.PERCENT;
      const selectedDepositRate = selectedDepositType === LeadDepositType.PERCENT
        ? Number(data.selectedDepositRate)
        : 0;
      const customDepositAmount = selectedDepositType === LeadDepositType.CUSTOM_AMOUNT
        ? Number(data.customDepositAmount)
        : null;
      const lead = await tx.lead.create({
        data: {
          customerId: customer.id,
          source: 'website',
          notes: composeNote(data),
          status: LeadStatus.PRODUCT_SELECTED,
          productHoldStatus: ProductHoldStatus.NONE,
          depositStatus: 'NONE',
          contactDeadlineAt: new Date(Date.now() + 60 * 60 * 1000),
          depositAmountRequired: cashDepositRequired(rentalTotal, pricingRules.deposit),
          productId: products[0].id,
          selectedDepositType,
          selectedDepositRate,
          customDepositAmount,
          pickupDate,
          returnDate,
          rentalDates: JSON.stringify({
            startDate: pickupDate.toISOString(),
            endDate: returnDate.toISOString(),
          }),
          appointmentIntent: data.appointmentIntent as LeadAppointmentIntent,
          quotedPrice: rentalTotal,
          voucherCode: voucher?.code || null,
          voucherDiscount: voucher?.discountAmount || 0,
        },
      });
      await tx.leadItem.createMany({
        data: products.map((product) => ({
          leadId: lead.id,
          productId: product.id,
          productNameAtTime: product.name,
          productValueAtTime: Math.max(Number(product.productValue || product.price || 0), 0),
          rentalPriceAtTime: Math.max(Number(product.rentalPrice || product.price || 0), 0),
          status: 'REQUESTED',
        })),
      });

      return {
        id: lead.id,
        leadId: lead.id,
        status: lead.status,
        source: lead.source,
        customer,
        pickupDate: lead.pickupDate,
        returnDate: lead.returnDate,
        appointmentIntent: lead.appointmentIntent,
        depositRequired: lead.depositAmountRequired,
        productCount: products.length,
        productIds,
        voucherCode: lead.voucherCode,
        voucherDiscount: lead.voucherDiscount,
        rentalSubtotal,
        rentalTotal,
      };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

    return { ok: true as const, status: 201, payload: result };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Chưa thể tạo yêu cầu thuê.';
    return { ok: false as const, status: 400, payload: { message } };
  }
}
