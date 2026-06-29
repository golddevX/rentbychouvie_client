import 'server-only';
import {
  BookingStatus,
  LeadStatus,
  Prisma,
  ProductHoldStatus,
  ProductStatus,
} from '@prisma/client';
import { db } from '@/lib/db';
import type { PublicCategory } from '@/types';

type DbClient = typeof db | Prisma.TransactionClient;

const PUBLIC_PRODUCT_STATUSES: ProductStatus[] = [
  ProductStatus.AVAILABLE,
  ProductStatus.RESERVED,
];

const ACTIVE_LEAD_STATUSES: LeadStatus[] = [
  LeadStatus.DEPOSIT_RECEIVED,
  LeadStatus.APPOINTMENT_CREATED,
  LeadStatus.APPOINTMENT_COMPLETED,
];

const BOOKING_LOCK_STATUSES: BookingStatus[] = [
  BookingStatus.DEPOSIT_RECEIVED,
  BookingStatus.CONFIRMED,
  BookingStatus.AWAITING_REMAINING_PAYMENT,
  BookingStatus.AWAITING_SECURITY_DEPOSIT,
  BookingStatus.READY_FOR_PICKUP,
  BookingStatus.SCHEDULED_PICKUP,
  BookingStatus.PICKED_UP,
  BookingStatus.RETURN_PENDING,
  BookingStatus.RETURNED,
  BookingStatus.SETTLEMENT_PENDING,
];

function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function parseImages(value?: string | null) {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed.filter(Boolean).map(String);
  } catch {
    // A single URL/path is also a valid legacy value.
  }
  return [value];
}

function hasProductImage(product: { image: string | null }) {
  // return parseImages(product.image).some((image) => image.trim().length > 0);
  return true;
}

function mapProduct(product: {
  id: string;
  code: string | null;
  name: string;
  description: string | null;
  category: string;
  categoryId: string | null;
  categoryPath: string | null;
  brand: string | null;
  price: number;
  rentalPrice: number;
  productValue: number;
  image: string | null;
  qrCode: string | null;
  status: ProductStatus;
}) {
  const images = parseImages(product.image);
  return {
    id: product.id,
    code: product.code,
    slug: slugify(product.name) || product.id,
    name: product.name,
    description: product.description || '',
    category: product.category,
    categoryId: product.categoryId,
    categoryPath: product.categoryPath,
    brand: product.brand,
    image: images[0] || null,
    images,
    rentalPrice: Number(product.rentalPrice || product.price || 0),
    productValue: Number(product.productValue || product.price || 0),
    status: product.status.toLowerCase(),
    manualStatus: product.status.toLowerCase(),
    qrCode: product.qrCode,
    nextAvailableDate: null,
    nearestSchedule: null,
    availability: null,
  };
}

async function resolveProduct(client: DbClient, idOrSlug: string) {
  const direct = await client.product.findFirst({
    where: {
      id: idOrSlug,
      archivedAt: null,
      isActive: true,
      status: { in: PUBLIC_PRODUCT_STATUSES },
    },
  });
  if (direct && hasProductImage(direct)) return direct;

  const candidates = await client.product.findMany({
    where: {
      archivedAt: null,
      isActive: true,
      status: { in: PUBLIC_PRODUCT_STATUSES },
    },
  });
  return candidates.find(
    (product) => hasProductImage(product) && slugify(product.name) === idOrSlug,
  ) ?? null;
}

export async function getProductSchedule(productId: string, client: DbClient = db) {
  const inventoryItems = await client.inventoryItem.findMany({
    where: { productId, archivedAt: null },
    select: { id: true },
  });
  const inventoryItemIds = inventoryItems.map((item) => item.id);

  const [leadItems, bookingItems, maintenanceBlocks] = await Promise.all([
    client.leadItem.findMany({
      where: { productId, status: 'RESERVED' },
      select: { leadId: true },
    }),
    client.bookingItem.findMany({
      where: { productId },
      select: { bookingId: true },
    }),
    inventoryItemIds.length
      ? client.calendarBlock.findMany({
        where: { inventoryItemId: { in: inventoryItemIds } },
      })
      : Promise.resolve([]),
  ]);

  const [leads, bookings] = await Promise.all([
    leadItems.length
      ? client.lead.findMany({
        where: {
          id: { in: [...new Set(leadItems.map((item) => item.leadId))] },
          archivedAt: null,
          productHoldStatus: ProductHoldStatus.RESERVED,
          status: { in: ACTIVE_LEAD_STATUSES },
          pickupDate: { not: null },
          returnDate: { not: null },
        },
      })
      : Promise.resolve([]),
    bookingItems.length
      ? client.booking.findMany({
        where: {
          id: { in: [...new Set(bookingItems.map((item) => item.bookingId))] },
          archivedAt: null,
          status: { in: BOOKING_LOCK_STATUSES },
        },
      })
      : Promise.resolve([]),
  ]);

  return [
    ...leads
      .filter((lead) => lead.pickupDate && lead.returnDate)
      .map((lead) => ({
        sourceType: 'lead' as const,
        sourceId: lead.id,
        leadId: lead.id,
        status: lead.status.toLowerCase(),
        startDate: lead.pickupDate!,
        endDate: lead.returnDate!,
      })),
    ...bookings.map((booking) => ({
      sourceType: 'booking' as const,
      sourceId: booking.id,
      bookingId: booking.id,
      status: booking.status.toLowerCase(),
      startDate: booking.pickupDate || booking.startDate,
      endDate: booking.returnDate || booking.endDate,
    })),
    ...maintenanceBlocks.map((block) => ({
      sourceType: 'maintenance' as const,
      sourceId: block.id,
      status: 'maintenance',
      startDate: block.startDate,
      endDate: block.endDate,
      reason: block.reason,
    })),
  ].sort((left, right) => left.startDate.getTime() - right.startDate.getTime());
}

export async function checkProductAvailability(
  productId: string,
  pickupDate: Date,
  returnDate: Date,
  client: DbClient = db,
) {
  const schedule = await getProductSchedule(productId, client);
  const blockingSlots = schedule.filter(
    (slot) => pickupDate < slot.endDate && returnDate > slot.startDate,
  );
  return { available: blockingSlots.length === 0, blockingSlots };
}

export const productService = {
  async categories() {
    const [categories, productCounts] = await Promise.all([
      db.productCategory.findMany({
        where: { archivedAt: null, isActive: true, active: true },
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      }),
      db.product.groupBy({
        by: ['categoryId'],
        where: {
          archivedAt: null,
          isActive: true,
          status: { in: PUBLIC_PRODUCT_STATUSES },
          categoryId: { not: null },
        },
        _count: { _all: true },
      }),
    ]);
    const directCounts = new Map(
      productCounts
        .filter((row) => row.categoryId)
        .map((row) => [row.categoryId as string, row._count._all]),
    );
    const childrenByParent = new Map<string | null, typeof categories>();
    for (const category of categories) {
      const siblings = childrenByParent.get(category.parentId) ?? [];
      siblings.push(category);
      childrenByParent.set(category.parentId, siblings);
    }

    const buildTree = (parentId: string | null, parentPath = ''): PublicCategory[] =>
      (childrenByParent.get(parentId) ?? []).map((category) => {
        const children = buildTree(category.id, parentPath ? `${parentPath} / ${category.name}` : category.name);
        const productCount = directCounts.get(category.id) ?? 0;
        const totalProductCount = productCount + children.reduce(
          (sum, child) => sum + child.totalProductCount,
          0,
        );
        return {
          id: category.id,
          name: category.name,
          slug: category.slug,
          parentId: category.parentId,
          type: category.type,
          description: category.description,
          sortOrder: category.sortOrder,
          productCount,
          totalProductCount,
          path: parentPath ? `${parentPath} / ${category.name}` : category.name,
          children,
        };
      });

    return buildTree(null);
  },

  async list(searchParams: URLSearchParams) {
    const search = searchParams.get('search')?.trim();
    const category = searchParams.get('category')?.trim();
    const requestedStatus = searchParams.get('status')?.trim().toUpperCase();
    const status = PUBLIC_PRODUCT_STATUSES.includes(requestedStatus as ProductStatus)
      ? requestedStatus as ProductStatus
      : undefined;

    let categoryFilter: Prisma.ProductWhereInput = {};
    if (category) {
      const categories = await db.productCategory.findMany({
        where: { archivedAt: null, isActive: true, active: true },
        select: { id: true, name: true, slug: true, parentId: true },
      });
      const selected = categories.find((item) =>
        item.id === category
        || item.slug === category
        || item.name.toLocaleLowerCase('vi') === category.toLocaleLowerCase('vi'),
      );
      if (selected) {
        const categoryIds = new Set([selected.id]);
        let added = true;
        while (added) {
          added = false;
          for (const item of categories) {
            if (item.parentId && categoryIds.has(item.parentId) && !categoryIds.has(item.id)) {
              categoryIds.add(item.id);
              added = true;
            }
          }
        }
        categoryFilter = { categoryId: { in: [...categoryIds] } };
      } else {
        categoryFilter = { category: { equals: category, mode: 'insensitive' } };
      }
    }

    const where: Prisma.ProductWhereInput = {
      archivedAt: null,
      isActive: true,
      status: status ?? { in: PUBLIC_PRODUCT_STATUSES },
      ...categoryFilter,
      ...(search
        ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { code: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
            { category: { contains: search, mode: 'insensitive' } },
          ],
        }
        : {}),
    };
    const products = await db.product.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    const visible = products.filter(hasProductImage);
    const productIds = visible.map((p) => p.id);
    const allVariants = productIds.length
      ? await db.productVariant.findMany({
        where: { productId: { in: productIds }, isActive: true, archivedAt: null },
        select: { productId: true, size: true, color: true },
      })
      : [];
    const variantsByProduct = new Map<string, typeof allVariants>();
    for (const v of allVariants) {
      const arr = variantsByProduct.get(v.productId) ?? [];
      arr.push(v);
      variantsByProduct.set(v.productId, arr);
    }
    return visible.map((p) => {
      const pv = variantsByProduct.get(p.id) ?? [];
      const sizes = [...new Set(pv.map((v) => v.size?.trim()).filter(Boolean))];
      const colors = [...new Set(pv.map((v) => v.color?.trim()).filter(Boolean))];
      return {
        ...mapProduct(p),
        size: sizes.join(', ') || null,
        color: colors.join(', ') || null,
        accessories: null,
      };
    });
  },

  async detail(idOrSlug: string) {
    const product = await resolveProduct(db, idOrSlug);
    if (!product) return null;
    const [variants, related, schedule] = await Promise.all([
      db.productVariant.findMany({
        where: { productId: product.id, isActive: true, archivedAt: null },
        orderBy: { createdAt: 'asc' },
      }),
      db.product.findMany({
        where: {
          id: { not: product.id },
          category: product.category,
          archivedAt: null,
          isActive: true,
          status: { in: PUBLIC_PRODUCT_STATUSES },
        },
        orderBy: { createdAt: 'desc' },
        take: 4,
      }),
      getProductSchedule(product.id),
    ]);
    const now = new Date();
    const currentSlot = schedule.find((slot) => slot.startDate <= now && slot.endDate > now) ?? null;
    const sizes = [...new Set(variants.map((v) => v.size?.trim()).filter(Boolean))];
    const colors = [...new Set(variants.map((v) => v.color?.trim()).filter(Boolean))];
    return {
      ...mapProduct(product),
      size: sizes.join(', ') || null,
      color: colors.join(', ') || null,
      accessories: null,
      variants: variants.map((variant) => ({
        ...variant,
        imageUrls: parseImages(variant.imageUrls),
      })),
      relatedProducts: related.filter(hasProductImage).map(mapProduct),
      nextAvailableDate: currentSlot?.endDate ?? now,
      nearestSchedule: schedule.find((slot) => slot.endDate > now) ?? null,
      availability: {
        todayAvailable: product.status === ProductStatus.AVAILABLE && !currentSlot,
        reservedSlots: schedule,
        nextAvailableDate: currentSlot?.endDate ?? now,
        explicitCheck: null,
      },
    };
  },

  async availability(idOrSlug: string, searchParams: URLSearchParams) {
    const product = await resolveProduct(db, idOrSlug);
    if (!product) return null;
    const schedule = await getProductSchedule(product.id);
    const now = new Date();
    const currentSlot = schedule.find((slot) => slot.startDate <= now && slot.endDate > now) ?? null;
    const pickupDate = searchParams.get('pickupDate');
    const returnDate = searchParams.get('returnDate');
    let explicitCheck = null;
    if (pickupDate && returnDate) {
      const start = new Date(pickupDate);
      const end = new Date(returnDate);
      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
        throw new Error('Ngày nhận hoặc ngày trả không hợp lệ.');
      }
      explicitCheck = await checkProductAvailability(product.id, start, end);
    }
    return {
      product: mapProduct(product),
      availability: {
        todayAvailable: product.status === ProductStatus.AVAILABLE && !currentSlot,
        reservedSlots: schedule,
        nextAvailableDate: currentSlot?.endDate ?? now,
        explicitCheck,
      },
    };
  },
};
