import { PublicClientSettings } from '@/types';

export const defaultClientSettings: PublicClientSettings = {
  branding: {
    brandName: 'ChouVie',
    tagline: 'Dịch vụ cho thuê thời trang',
    logoUrl: '/luxury/chouvie-symbol.png?v=1',
    faviconUrl: '/favicon.ico',
    accentPreset: 'atelier green',
  },
  hero: {
    image: '/luxury/anh-bia.png',
    title: '',
    subtitle:
      'Chọn mẫu bạn thích cho tiệc cưới, sự kiện hay buổi chụp hình. Shop sẽ hỗ trợ chốt lịch, thử đồ và tiền cọc rõ ràng.',
    ctaText: 'Khám phá bộ sưu tập',
    announcementEnabled: true,
    announcementText: 'Cuối tuần này còn lịch thử đồ riêng. Bạn nên đặt sớm nếu cần đồ đi tiệc hoặc dự cưới.',
  },
  homepage: {
    featuredSections: ['Mẫu mới lên kệ', 'Gợi ý đi tiệc cưới', 'Đầm dạ tiệc nổi bật'],
    editorialBlocks: [
      'Mỗi dịp đặc biệt đều xứng đáng với một bộ đồ thật vừa ý.',
      'Bạn có thể chọn mẫu, chọn lịch và tạo đơn thuê trực tiếp trên website.',
    ],
    trustBlock: ['Đơn thuê vào thẳng hệ thống quản trị', 'Shop duyệt trước khi thu cọc'],
  },
  catalog: {
    defaultSort: 'editorial',
    visibleFilters: ['Tìm kiếm', 'Danh mục', 'Ngày nhận', 'Ngày trả'],
    categoryOrder: ['Dress', 'Gown', 'Ao Dai', 'Vest'],
    showUnavailableItems: false,
    badgeLogic: 'Hiển thị giá thuê và nút xem thử AI trên thẻ sản phẩm.',
    quickActionsEnabled: true,
  },
  productDetail: {
    sectionOrder: ['Thư viện ảnh', 'Tóm tắt', 'Ngày thuê', 'Lưu ý thuê', 'Xem thử AI', 'Mẫu liên quan'],
    showStylistNote: true,
    showMeasurements: true,
    showFabrics: true,
    relatedProductsMode: 'same category',
    relatedProductsLimit: 4,
    rentalNoteBlock: 'Đơn thuê được tạo trực tiếp và shop sẽ duyệt lại tình trạng sản phẩm trước khi xác nhận giữ mẫu.',
    showProductValue: true,
    showAvailability: true,
    showStatus: true,
    showCategory: true,
    showMetadata: true,
  },
  inquiry: {
    enabledFields: ['Tên', 'Số điện thoại', 'Email', 'Ghi chú phối đồ'],
    requiredFields: ['Tên', 'Số điện thoại'],
    helperText: 'Điền thông tin nhận đồ để tạo đơn thuê trực tiếp. Shop sẽ duyệt và liên hệ xác nhận.',
    trustBlock: ['Đơn thuê vào thẳng hệ thống quản trị', 'Shop duyệt trước khi thu cọc'],
    pickupNote: 'Thời gian nhận và trả đồ được lưu trực tiếp trong đơn thuê.',
    depositNote: 'Mức cọc áp dụng cùng chính sách tại Admin và chỉ thu sau khi shop duyệt đơn.',
    shippingNote: 'Nếu cần giao tận nơi, shop sẽ xác nhận riêng theo khu vực và thời gian.',
    appointmentIntentOptions: ['fitting', 'pickup', 'delivery'],
  },
  preview: {
    enabled: true,
    acceptedFileInfo: 'Ưu tiên ảnh chính diện, ánh sáng tự nhiên, định dạng JPG hoặc PNG.',
    disclaimer: 'Ảnh xem thử chỉ để tham khảo phom dáng, không thay thế buổi thử đồ thật.',
    reviewCopy: 'Stylist sẽ xem nhanh tổng thể phom, phần vai và độ cân đối của trang phục.',
    turnaroundNote: 'Phần lớn yêu cầu xem thử sẽ được phản hồi trong vòng 1 ngày làm việc.',
  },
  navigation: {
    topNavItems: [
      { label: 'Bộ sưu tập', href: '/products', visible: true },
      { label: 'Xem thử AI', href: '/ai-preview', visible: true },
      { label: 'Giỏ thuê', href: '/cart', visible: true },
    ],
  },
  footer: {
    contactEmail: 'atelier@chouvie.vn',
    hotline: '0944389199 | 0939797921',
    zalo: 'ChouVie Atelier',
    address: 'A18 Lý Chính Thắng, phường Tân An, TP Cần Thơ',
    socialLinks: [
      { label: 'Instagram', href: 'https://instagram.com', visible: true },
      { label: 'TikTok', href: 'https://tiktok.com', visible: true },
    ],
    footerLinks: [
      { label: 'Chính sách thuê', href: '/cart#rental-policy', visible: true },
      { label: 'Chính sách nhận trả', href: '/cart#rental-policy', visible: true },
      { label: 'Liên hệ', href: '/cart', visible: true },
    ],
    line: 'Dịch vụ cho thuê thời trang',
    appointmentLabel: 'Hẹn riêng',
    noPaymentLabel: 'Đặt thuê trực tiếp',
    fittingLabel: 'Thử đồ tại showroom',
  },
  seo: {
    siteTitleTemplate: '%s | ChouVie Rental Fashion',
    metaDescription: 'Website cho thuê thời trang cao cấp với lịch thử đồ riêng và xem thử AI.',
    ogImage:
      'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1600&q=90',
  },
  i18n: {
    enabledLocales: ['vi', 'en'],
    defaultLocale: 'vi',
    fallbackLocale: 'vi',
  },
  policies: {
    rentalPolicy:
      `CHÍNH SÁCH THUÊ VÁY

1. Quy định chung
- Khách hàng vui lòng thanh toán 100% váy khi thuê để shop giữ lịch.
- Trường hợp giá trị váy giá cao vui lòng đặt cọc 500.000đ - 1.000.000đ hoặc CCCD/giấy tờ tùy thân tùy theo giá trị váy.
- Thời gian thuê mặc định là 3 ngày thuê, tính từ ngày nhận váy. Nếu nhu cầu thuê ít ngày hơn, nàng vui lòng báo nhân viên để được giảm.
- Mỗi lần thuê áp dụng 1 ưu đãi nếu có.

2. Nhận & trả váy
- Khách kiểm tra kỹ váy khi nhận, bao gồm form váy và phụ kiện đi kèm.
- Nàng vui lòng trả váy đúng hạn, đúng tình trạng ban đầu.
- Quá hạn sẽ phụ thu theo ngày hoặc phát sinh phí nếu ảnh hưởng lịch khách sau.

3. Bồi thường & hư hỏng
- Xước váy: 5% - 10% giá trị váy.
- Vết bẩn khó tẩy như dầu, nhớt: 10% - 15% giá trị váy.
- Rách váy: Bồi thường 100% giá trị váy, trừ khấu hao 5% mỗi lượt thuê.
- Các lỗi nhẹ như dơ nhẹ, bung chỉ shop sẽ hỗ trợ xử lý.
- Không tự ý giặt/ủi nếu không có hướng dẫn từ shop.

4. Quy định đổi váy/hủy lịch
- Hỗ trợ đổi mẫu khi báo trước 3 ngày.
- Váy mới có giá trị bằng đơn cũ. Nếu cao hơn, nàng vui lòng bù thêm.
- Trường hợp váy không vừa hoặc có lỗi: Nàng báo shop trong vòng 1 giờ kể từ khi nhận váy để được hỗ trợ đổi.
- Sau 1 giờ shop xin phép không giải quyết vì đã giữ lịch và từ chối khách khác.
- Tiền cọc/tiền thuê KHÔNG HOÀN dưới mọi hình thức. Shop hỗ trợ đổi lịch nếu nàng báo trước tối thiểu 3 ngày.

5. Lưu ý
Shop không chịu trách nhiệm với các sự cố phát sinh trong quá trình sử dụng.
Khách hàng đồng ý với chính sách khi xác nhận thuê váy.`,
    depositPolicy:
      'Cọc tài sản sẽ được thu sau khi xác nhận giữ mẫu và được hoàn lại sau khi shop kiểm tra lúc nhận trả.',
    pickupPolicy: 'Việc bàn giao được thực hiện sau khi đã xác nhận lịch và kiểm tra tình trạng sản phẩm.',
    returnPolicy: 'Vui lòng trả đồ đúng thời gian đã hẹn để tránh phát sinh phí trả trễ.',
    shippingPolicy: 'Giao tận nơi là lựa chọn linh hoạt và sẽ được shop xác nhận riêng theo từng trường hợp.',
    damagePolicy:
      'Hư hỏng, thiếu phụ kiện hoặc cần vệ sinh chuyên sâu có thể được khấu trừ vào cọc tài sản.',
  },
  depositPolicy: {
    allowCustomDepositAmount: true,
    allowedDepositRates: [30, 50, 100],
    defaultDepositRate: 50,
  },
  pricingRules: {
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
  },
  contact: {
    email: 'atelier@chouvie.vn',
    hotline: '0944389199 | 0939797921',
    zalo: 'ChouVie Atelier',
    address: 'A18 Lý Chính Thắng, phường Tân An, TP Cần Thơ',
  },
};

export function mergeClientSettings(input?: Partial<PublicClientSettings> | null): PublicClientSettings {
  if (!input) return defaultClientSettings;
  const logoUrl = input.branding?.logoUrl;
  const normalizedLogoUrl = logoUrl && !logoUrl.includes('chouvie-logo-lockup') && !logoUrl.includes('chouvie-logo-horizontal')
    ? logoUrl
    : defaultClientSettings.branding.logoUrl;

  return {
    ...defaultClientSettings,
    ...input,
    branding: {
      ...defaultClientSettings.branding,
      ...input.branding,
      logoUrl: normalizedLogoUrl,
    },
    hero: { ...defaultClientSettings.hero, ...input.hero },
    homepage: { ...defaultClientSettings.homepage, ...input.homepage },
    catalog: { ...defaultClientSettings.catalog, ...input.catalog },
    productDetail: { ...defaultClientSettings.productDetail, ...input.productDetail },
    inquiry: { ...defaultClientSettings.inquiry, ...input.inquiry },
    preview: { ...defaultClientSettings.preview, ...input.preview },
    navigation: {
      ...defaultClientSettings.navigation,
      ...input.navigation,
      topNavItems: input.navigation?.topNavItems ?? defaultClientSettings.navigation.topNavItems,
    },
    footer: {
      ...defaultClientSettings.footer,
      ...input.footer,
      socialLinks: input.footer?.socialLinks ?? defaultClientSettings.footer.socialLinks,
      footerLinks: input.footer?.footerLinks ?? defaultClientSettings.footer.footerLinks,
    },
    seo: { ...defaultClientSettings.seo, ...input.seo },
    i18n: { ...defaultClientSettings.i18n, ...input.i18n },
    policies: { ...defaultClientSettings.policies, ...input.policies },
    depositPolicy: { ...defaultClientSettings.depositPolicy, ...input.depositPolicy },
    pricingRules: {
      duration: { ...defaultClientSettings.pricingRules.duration, ...input.pricingRules?.duration },
      earlyPickup: { ...defaultClientSettings.pricingRules.earlyPickup, ...input.pricingRules?.earlyPickup },
      deposit: { ...defaultClientSettings.pricingRules.deposit, ...input.pricingRules?.deposit },
    },
    contact: { ...defaultClientSettings.contact, ...input.contact },
  };
}
