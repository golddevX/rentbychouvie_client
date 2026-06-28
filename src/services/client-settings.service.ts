import 'server-only';
import { db } from '@/lib/db';
import {
  defaultClientSettings,
  mergeClientSettings,
} from '@/lib/client-settings';
import { PublicClientSettings } from '@/types';

const CLIENT_SETTINGS_KEY = 'client-settings-v1';
const PRICING_RULES_KEY = 'pricing-rules-v1';

function mapStoredSettings(stored: Record<string, any>): Partial<PublicClientSettings> {
  if (!stored.brandingJson) return stored as Partial<PublicClientSettings>;
  return {
    branding: {
      brandName: stored.brandingJson.brandName,
      tagline: stored.brandingJson.tagline,
      logoUrl: stored.brandingJson.logoUrl,
      faviconUrl: stored.brandingJson.faviconUrl,
      accentPreset: stored.brandingJson.accentPreset,
    },
    hero: {
      image: stored.brandingJson.heroImage,
      title: stored.homepageJson?.heroTitle,
      subtitle: stored.homepageJson?.heroSubtitle,
      ctaText: stored.homepageJson?.ctaText,
      announcementEnabled: stored.homepageJson?.announcementEnabled,
      announcementText: stored.homepageJson?.announcementText,
    },
    homepage: {
      featuredSections: stored.homepageJson?.featuredSections,
      editorialBlocks: stored.homepageJson?.editorialBlocks,
      trustBlock: stored.inquiryJson?.trustBlock,
    },
    catalog: stored.catalogJson,
    productDetail: {
      ...stored.productDetailJson,
      showProductValue: true,
      showAvailability: true,
      showStatus: true,
      showCategory: true,
      showMetadata: true,
    },
    inquiry: {
      ...stored.inquiryJson,
      appointmentIntentOptions: ['fitting', 'pickup', 'delivery'],
    },
    preview: stored.previewJson,
    navigation: stored.navigationJson,
    footer: {
      ...stored.footerJson,
      line: stored.brandingJson.tagline,
      appointmentLabel: 'Hẹn riêng',
      noPaymentLabel: 'Đặt thuê trực tiếp',
      fittingLabel: 'Thử đồ tại showroom',
    },
    seo: stored.seoJson,
    i18n: stored.i18nJson,
    policies: stored.policiesJson,
    contact: {
      email: stored.footerJson?.contactEmail,
      hotline: stored.footerJson?.hotline,
      zalo: stored.footerJson?.zalo,
      address: stored.footerJson?.address,
    },
  };
}

export async function getClientSettings() {
  try {
    const [settingsRecord, pricingRecord] = await Promise.all([
      db.siteSetting.findUnique({ where: { key: CLIENT_SETTINGS_KEY } }),
      db.siteSetting.findUnique({ where: { key: PRICING_RULES_KEY } }),
    ]);
    const stored = settingsRecord ? JSON.parse(settingsRecord.value) : {};
    const pricing = pricingRecord ? JSON.parse(pricingRecord.value) : {};
    return mergeClientSettings({
      ...mapStoredSettings(stored),
      pricingRules: {
        duration: pricing.duration,
        earlyPickup: pricing.earlyPickup,
        deposit: pricing.deposit,
      },
    });
  } catch {
    return defaultClientSettings;
  }
}
