export type ProductStatus =
  | 'available'
  | 'reserved'
  | 'rented'
  | 'maintenance'
  | 'damaged'
  | 'retired';

export type AppointmentIntent = 'FITTING' | 'PICKUP' | 'DELIVERY';

export type SecurityDepositOption =
  | 'none'
  | 'cccd'
  | 'cash_500k'
  | 'cash_1m'
  | 'cash_500k_and_cccd';

export interface ProductScheduleSlot {
  sourceType: 'lead' | 'booking' | 'maintenance';
  sourceId: string;
  status: string;
  startDate: string;
  endDate: string;
  customerName?: string | null;
  customerPhone?: string | null;
  leadId?: string | null;
  bookingId?: string | null;
  reason?: string | null;
}

export interface ExplicitAvailabilityCheck {
  available: boolean;
  blockingSlots: ProductScheduleSlot[];
}

export interface ProductAvailabilityPayload {
  todayAvailable: boolean;
  reservedSlots: ProductScheduleSlot[];
  nextAvailableDate: string | null;
  explicitCheck?: ExplicitAvailabilityCheck | null;
}

export interface PublicProduct {
  id: string;
  code?: string | null;
  slug: string;
  name: string;
  description: string;
  category: string;
  categoryId?: string | null;
  categoryPath?: string | null;
  brand?: string | null;
  image: string | null;
  images: string[];
  rentalPrice: number;
  productValue: number;
  status: ProductStatus;
  manualStatus?: ProductStatus | string | null;
  size?: string | null;
  color?: string | null;
  accessories?: string | null;
  qrCode?: string | null;
  nextAvailableDate?: string | null;
  nearestSchedule?: ProductScheduleSlot | null;
  availability?: ProductAvailabilityPayload | null;
  variants?: Array<{
    id: string;
    name: string;
    sku: string;
    size?: string | null;
    color?: string | null;
    material?: string | null;
    imageUrls?: string[];
  }>;
  summary?: {
    rentalCount?: number;
    revenue?: number;
    scheduleState?: string;
    todayAvailable?: boolean;
  } | null;
  relatedProducts?: PublicProduct[];
}

export interface PublicCategory {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  type: string;
  description: string | null;
  sortOrder: number;
  productCount: number;
  totalProductCount: number;
  path: string;
  children: PublicCategory[];
}

export interface PublicProductAvailabilityResponse {
  product: PublicProduct;
  availability: ProductAvailabilityPayload;
}

export interface NavItemSetting {
  label: string;
  href: string;
  visible: boolean;
}

export interface FooterLinkSetting {
  label: string;
  href: string;
  visible: boolean;
}

export interface PublicClientSettings {
  branding: {
    brandName: string;
    tagline: string;
    logoUrl: string;
    faviconUrl: string;
    accentPreset: 'atelier green' | 'champagne black' | 'rose editorial' | 'quiet navy';
  };
  hero: {
    image: string;
    title: string;
    subtitle: string;
    ctaText: string;
    announcementEnabled: boolean;
    announcementText: string;
  };
  homepage: {
    featuredSections: string[];
    editorialBlocks: string[];
    trustBlock: string[];
  };
  catalog: {
    defaultSort: 'editorial' | 'newest' | 'price-low' | 'price-high' | 'availability';
    visibleFilters: string[];
    categoryOrder: string[];
    showUnavailableItems: boolean;
    badgeLogic: string;
    quickActionsEnabled: boolean;
  };
  productDetail: {
    sectionOrder: string[];
    showStylistNote: boolean;
    showMeasurements: boolean;
    showFabrics: boolean;
    relatedProductsMode: 'same category' | 'editorial picks' | 'recently viewed';
    relatedProductsLimit: number;
    rentalNoteBlock: string;
    showProductValue: boolean;
    showAvailability: boolean;
    showStatus: boolean;
    showCategory: boolean;
    showMetadata: boolean;
  };
  inquiry: {
    enabledFields: string[];
    requiredFields: string[];
    helperText: string;
    trustBlock: string[];
    pickupNote: string;
    depositNote: string;
    shippingNote: string;
    appointmentIntentOptions: Array<'fitting' | 'pickup' | 'delivery'>;
  };
  preview: {
    enabled: boolean;
    acceptedFileInfo: string;
    disclaimer: string;
    reviewCopy: string;
    turnaroundNote: string;
  };
  navigation: {
    topNavItems: NavItemSetting[];
  };
  footer: {
    contactEmail: string;
    hotline: string;
    zalo: string;
    address: string;
    socialLinks: FooterLinkSetting[];
    footerLinks: FooterLinkSetting[];
    line: string;
    appointmentLabel: string;
    noPaymentLabel: string;
    fittingLabel: string;
  };
  seo: {
    siteTitleTemplate: string;
    metaDescription: string;
    ogImage: string;
  };
  i18n: {
    enabledLocales: string[];
    defaultLocale: string;
    fallbackLocale: string;
  };
  policies: {
    rentalPolicy: string;
    depositPolicy: string;
    pickupPolicy: string;
    returnPolicy: string;
    shippingPolicy: string;
    damagePolicy: string;
  };
  depositPolicy: {
    allowCustomDepositAmount: boolean;
    allowedDepositRates: number[];
    defaultDepositRate: number;
  };
  pricingRules: {
    duration: {
      oneDayDiscountPercent: number;
      twoDayDiscountPercent: number;
    };
    earlyPickup: {
      threeDayRentalFeePerExtraDay: number;
      shortRentalFeePerExtraDay: number;
    };
    deposit: {
      noDepositMaximumRental: number;
      middleTierMaximumRental: number;
      middleTierCashDeposit: number;
      highTierCashDeposit: number;
      highTierCashWithDocument: number;
    };
  };
  contact: {
    email: string;
    hotline: string;
    zalo: string;
    address: string;
  };
}

export interface RentalCartItem {
  productId: string;
  productSlug: string;
  productName: string;
  image: string | null;
  rentalPrice: number;
  productValue: number;
  quantity: number;
  category: string;
  status: ProductStatus;
  selectedMetadata?: {
    size?: string | null;
    color?: string | null;
    accessories?: string | null;
  };
}

export interface CreateLeadPayload {
  customerName: string;
  phone: string;
  email?: string;
  pickupDate: string;
  returnDate: string;
  appointmentIntent: AppointmentIntent | 'fitting' | 'pickup' | 'delivery';
  productIds: string[];
  note?: string;
  source: 'website';
  height?: number;
  weight?: number;
  measurements?: string;
  faceImage?: string;
  bodyImage?: string;
  selectedDepositType?: 'percent' | 'custom_amount';
  selectedDepositRate?: 30 | 50 | 100 | null;
  customDepositAmount?: number | null;
  voucherCode?: string;
}

export interface CreatePublicBookingPayload {
  customerName: string;
  phone: string;
  email?: string;
  pickupDate: string;
  returnDate: string;
  appointmentIntent: AppointmentIntent;
  productIds: string[];
  note?: string;
  source: 'website';
  height?: number;
  weight?: number;
  measurements?: string;
  faceImage?: string;
  bodyImage?: string;
  securityDepositOption?: SecurityDepositOption;
  voucherCode?: string;
}

export interface AIPreviewResponse {
  requestId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  previewImageUrl: string | null;
  faceImageUrl?: string;
  bodyImageUrl?: string | null;
  message?: string;
}

export interface VoucherValidationResult {
  valid: true;
  voucherId: string;
  code: string;
  name: string;
  discountType: 'PERCENT' | 'FIXED';
  discountValue: number;
  discountAmount: number;
  subtotal: number;
  finalAmount: number;
}

export interface PublicLeadResponse {
  id: string;
  status: string;
  source: string;
  customer: {
    id: string;
    name: string;
    phone: string;
    email: string;
  };
  pickupDate: string;
  returnDate: string;
  appointmentIntent: AppointmentIntent;
  depositPolicy?: string;
  depositRequired: number;
  productCount: number;
  productIds: string[];
  voucherCode?: string | null;
  voucherDiscount?: number;
  rentalSubtotal?: number;
  rentalTotal?: number;
}

export interface PublicBookingResponse {
  id: string;
  bookingId: string;
  status: string;
  customer: {
    id: string;
    name: string;
    phone: string;
    email: string;
  };
  pickupDate: string;
  returnDate: string;
  rentalDays: number;
  productCount: number;
  productIds: string[];
  voucherCode?: string | null;
  voucherDiscount: number;
  rentalSubtotal: number;
  rentalTotal: number;
  securityDepositRequired: number;
  securityDepositOption: SecurityDepositOption;
}

export interface BackendError {
  message: string | string[];
  statusCode: number;
  error?: string;
}
