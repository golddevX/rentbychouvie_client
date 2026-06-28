import { z } from 'zod';

export const leadSchema = z.object({
  customerName: z.string().trim().min(1).max(120),
  phone: z.string().trim().regex(/^[0-9+\s().-]{8,20}$/),
  email: z.string().trim().email().optional().or(z.literal('')),
  pickupDate: z.string().datetime(),
  returnDate: z.string().datetime(),
  appointmentIntent: z.enum(['fitting', 'pickup', 'delivery', 'FITTING', 'PICKUP', 'DELIVERY'])
    .transform((value) => value.toUpperCase() as 'FITTING' | 'PICKUP' | 'DELIVERY'),
  selectedDepositType: z.enum(['percent', 'custom_amount']),
  selectedDepositRate: z.union([z.literal(30), z.literal(50), z.literal(100), z.null()]),
  customDepositAmount: z.number().min(0).nullable().optional(),
  productIds: z.array(z.string().min(1)).min(1),
  note: z.string().max(1500).optional(),
  source: z.literal('website'),
  height: z.number().positive().optional(),
  weight: z.number().positive().optional(),
  measurements: z.string().max(300).optional(),
  faceImage: z.string().refine(
    (value) => value.startsWith('/uploads/') || z.string().url().safeParse(value).success,
    'Ảnh khuôn mặt không hợp lệ.',
  ).optional(),
  bodyImage: z.string().refine(
    (value) => value.startsWith('/uploads/') || z.string().url().safeParse(value).success,
    'Ảnh toàn thân không hợp lệ.',
  ).optional(),
  voucherCode: z.string().max(80).optional(),
}).superRefine((value, context) => {
  if (new Date(value.returnDate) <= new Date(value.pickupDate)) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['returnDate'], message: 'Ngày trả phải sau ngày nhận.' });
  }
  if (value.selectedDepositType === 'percent' && value.selectedDepositRate === null) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['selectedDepositRate'], message: 'Vui lòng chọn mức cọc.' });
  }
  if (
    value.selectedDepositType === 'custom_amount'
    && (!value.customDepositAmount || value.customDepositAmount <= 0)
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['customDepositAmount'],
      message: 'Số tiền cọc tùy chỉnh phải lớn hơn 0.',
    });
  }
});

export const publicBookingSchema = z.object({
  customerName: z.string().trim().min(1).max(120),
  phone: z.string().trim().regex(/^[0-9+\s().-]{8,20}$/),
  email: z.string().trim().email().optional().or(z.literal('')),
  pickupDate: z.string().datetime(),
  returnDate: z.string().datetime(),
  appointmentIntent: z.enum(['FITTING', 'PICKUP', 'DELIVERY']),
  productIds: z.array(z.string().min(1)).min(1),
  note: z.string().max(1500).optional(),
  source: z.literal('website'),
  height: z.number().positive().optional(),
  weight: z.number().positive().optional(),
  measurements: z.string().max(300).optional(),
  faceImage: z.string().refine(
    (value) => value.startsWith('/uploads/') || z.string().url().safeParse(value).success,
    'Ảnh khuôn mặt không hợp lệ.',
  ).optional(),
  bodyImage: z.string().refine(
    (value) => value.startsWith('/uploads/') || z.string().url().safeParse(value).success,
    'Ảnh toàn thân không hợp lệ.',
  ).optional(),
  securityDepositOption: z.enum([
    'none',
    'cccd',
    'cash_500k',
    'cash_1m',
    'cash_500k_and_cccd',
  ]).optional(),
  voucherCode: z.string().max(80).optional(),
}).superRefine((value, context) => {
  if (new Date(value.returnDate) <= new Date(value.pickupDate)) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['returnDate'],
      message: 'Ngày trả phải sau ngày nhận.',
    });
  }
});

export const previewMetadataSchema = z.object({
  productId: z.string().min(1),
  customerName: z.string().trim().max(120).optional(),
  phone: z.string().trim().max(30).optional(),
});
