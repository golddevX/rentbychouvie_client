import apiClient from './api-client';
import {
  CreateLeadPayload,
  CreatePublicBookingPayload,
  PublicClientSettings,
  PublicLeadResponse,
  PublicBookingResponse,
  PublicCategory,
  PublicProduct,
  PublicProductAvailabilityResponse,
  VoucherValidationResult,
  AIPreviewResponse,
} from '@/types';

export const productsApi = {
  getAll: (params?: { category?: string; search?: string; status?: string }) =>
    apiClient.get<PublicProduct[]>('/public/products', { params }),

  getById: (idOrSlug: string) =>
    apiClient.get<PublicProduct>(`/public/products/${idOrSlug}`),

  getAvailability: (idOrSlug: string, params?: { pickupDate?: string; returnDate?: string }) =>
    apiClient.get<PublicProductAvailabilityResponse>(`/public/products/${idOrSlug}/availability`, { params }),
};

export const categoriesApi = {
  getAll: () => apiClient.get<PublicCategory[]>('/public/categories'),
};

export const leadsApi = {
  create: (data: CreateLeadPayload) => apiClient.post<PublicLeadResponse>('/public/leads', data),
};

export const bookingsApi = {
  create: (data: CreatePublicBookingPayload) =>
    apiClient.post<PublicBookingResponse>('/public/bookings', data),
};

export const vouchersApi = {
  validate: (data: { code: string; subtotal: number; productIds: string[] }) =>
    apiClient.post<VoucherValidationResult>('/public/vouchers/validate', data),
};

export const clientSettingsApi = {
  getPublic: () => apiClient.get<PublicClientSettings>('/public/client-settings'),
};

export const aiPreviewApi = {
  generate: (input: {
    productId: string;
    faceImage: File;
    bodyImage?: File | null;
    customerName?: string;
    phone?: string;
  }) => {
    const form = new FormData();
    form.append('productId', input.productId);
    form.append('faceImage', input.faceImage);
    if (input.bodyImage) form.append('bodyImage', input.bodyImage);
    if (input.customerName) form.append('customerName', input.customerName);
    if (input.phone) form.append('phone', input.phone);
    return apiClient.post<AIPreviewResponse>('/public/ai-preview', form);
  },
  getResult: (requestId: string) =>
    apiClient.get<AIPreviewResponse>(`/public/ai-preview/${requestId}`),
};
