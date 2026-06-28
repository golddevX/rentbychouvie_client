import 'server-only';
import { Prisma, VoucherDiscountType } from '@prisma/client';
import { db } from '@/lib/db';

type DbClient = typeof db | Prisma.TransactionClient;

export async function validateVoucher(
  input: { code: string; subtotal: number; productIds?: string[] },
  client: DbClient = db,
) {
  const code = String(input.code || '').trim().toUpperCase().replace(/\s+/g, '');
  const subtotal = Math.max(Number(input.subtotal || 0), 0);
  if (!code) throw new Error('Vui lòng nhập mã voucher.');

  const voucher = await client.voucher.findFirst({
    where: { code, archivedAt: null },
  });
  if (!voucher) throw new Error('Voucher không tồn tại.');
  const now = new Date();
  if (!voucher.isActive) throw new Error('Voucher đang tạm khóa.');
  if (voucher.startsAt && voucher.startsAt > now) throw new Error('Voucher chưa đến thời gian sử dụng.');
  if (voucher.endsAt && voucher.endsAt < now) throw new Error('Voucher đã hết hạn.');
  if (voucher.usageLimit !== null && voucher.usedCount >= voucher.usageLimit) {
    throw new Error('Voucher đã hết lượt sử dụng.');
  }
  if (subtotal < voucher.minOrderValue) {
    throw new Error(`Đơn thuê tối thiểu ${Math.round(voucher.minOrderValue).toLocaleString('vi-VN')} ₫.`);
  }

  const productIds = [...new Set(input.productIds || [])];
  const productScopes = await client.voucherProduct.findMany({
    where: { voucherId: voucher.id },
  });
  if (voucher.categoryId || productScopes.length) {
    const products = await client.product.findMany({
      where: { id: { in: productIds }, archivedAt: null },
      select: { id: true, categoryId: true },
    });
    const scopedIds = new Set(productScopes.map((scope) => scope.productId));
    const eligible = products.some(
      (product) => product.categoryId === voucher.categoryId || scopedIds.has(product.id),
    );
    if (!eligible) throw new Error('Voucher không áp dụng cho sản phẩm đã chọn.');
  }

  const rawDiscount = voucher.discountType === VoucherDiscountType.PERCENT
    ? subtotal * (voucher.discountValue / 100)
    : voucher.discountValue;
  const discountAmount = Math.max(0, Math.round(Math.min(
    subtotal,
    voucher.maxDiscountAmount === null
      ? rawDiscount
      : Math.min(rawDiscount, voucher.maxDiscountAmount),
  )));
  return {
    valid: true as const,
    voucherId: voucher.id,
    code: voucher.code,
    name: voucher.name,
    discountType: voucher.discountType,
    discountValue: voucher.discountValue,
    discountAmount,
    subtotal,
    finalAmount: Math.max(subtotal - discountAmount, 0),
  };
}
