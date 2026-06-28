import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { PublicProduct, RentalCartItem } from '@/types';
import { rentalDaysBetween } from '@/lib/date';
import { getRentalDepositPolicy } from '@/lib/rental-policy';

type CartSummary = {
  itemCount: number;
  totalProductValue: number;
  totalRentalPrice: number;
  pickupDate: string;
  returnDate: string;
  rentalDays: number;
  depositPolicyLabel: string;
  estimatedDeposit: number;
};

interface CartStore {
  items: RentalCartItem[];
  pickupDate: string;
  returnDate: string;
  lastBookingId: string | null;
  hydrated: boolean;
  addProduct: (product: PublicProduct) => void;
  removeProduct: (productId: string) => void;
  clearCart: () => void;
  updateRentalDates: (pickupDate: string, returnDate: string) => void;
  setLastBookingId: (bookingId: string | null) => void;
  setHydrated: (hydrated: boolean) => void;
  getSummary: (pricingRules?: {
    duration?: { oneDayDiscountPercent?: number; twoDayDiscountPercent?: number };
    earlyPickup?: { threeDayRentalFeePerExtraDay?: number; shortRentalFeePerExtraDay?: number };
    deposit?: Parameters<typeof getRentalDepositPolicy>[1];
  }) => CartSummary;
}

function toCartItem(product: PublicProduct): RentalCartItem {
  return {
    productId: product.id,
    productSlug: product.slug,
    productName: product.name,
    image: product.image,
    rentalPrice: Number(product.rentalPrice || 0),
    productValue: Number(product.productValue || 0),
    quantity: 1,
    category: product.category,
    status: product.status,
    selectedMetadata: {
      size: product.size,
      color: product.color,
      accessories: product.accessories,
    },
  };
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      pickupDate: '',
      returnDate: '',
      lastBookingId: null,
      hydrated: false,

      addProduct: (product) =>
        set((state) => {
          if (state.items.some((item) => item.productId === product.id)) {
            return state;
          }
          return {
            items: [...state.items, toCartItem(product)],
          };
        }),

      removeProduct: (productId) =>
        set((state) => ({
          items: state.items.filter((item) => item.productId !== productId),
        })),

      clearCart: () =>
        set({
          items: [],
          pickupDate: '',
          returnDate: '',
        }),

      updateRentalDates: (pickupDate, returnDate) => set({ pickupDate, returnDate }),
      setLastBookingId: (lastBookingId) => set({ lastBookingId }),
      setHydrated: (hydrated) => set({ hydrated }),

      getSummary: (pricingRules) => {
        const state = get();
        const totalProductValue = state.items.reduce((sum, item) => sum + item.productValue * item.quantity, 0);
        const rentalDays = rentalDaysBetween(state.pickupDate, state.returnDate);
        const durationDays = Math.min(3, Math.max(1, rentalDays || 3));
        const oneDayDiscount = Number(pricingRules?.duration?.oneDayDiscountPercent ?? 15);
        const twoDayDiscount = Number(pricingRules?.duration?.twoDayDiscountPercent ?? 10);
        const durationRate = durationDays === 1
          ? 1 - oneDayDiscount / 100
          : durationDays === 2
            ? 1 - twoDayDiscount / 100
            : 1;
        const adjustedRentalPrice = state.items.reduce(
          (sum, item) => sum + Math.round(item.rentalPrice * durationRate) * item.quantity,
          0,
        );
        const extraDays = Math.max(0, rentalDays - durationDays);
        const extraDayFee = durationDays === 3
          ? Number(pricingRules?.earlyPickup?.threeDayRentalFeePerExtraDay ?? 10000)
          : Number(pricingRules?.earlyPickup?.shortRentalFeePerExtraDay ?? 20000);
        const totalRentalPrice = adjustedRentalPrice + extraDays * extraDayFee;
        const depositPolicy = getRentalDepositPolicy(totalRentalPrice, pricingRules?.deposit);

        return {
          itemCount: state.items.length,
          totalProductValue,
          totalRentalPrice,
          depositPolicyLabel: depositPolicy.label,
          estimatedDeposit: depositPolicy.cashAmount,
          pickupDate: state.pickupDate,
          returnDate: state.returnDate,
          rentalDays,
        };
      },
    }),
    {
      name: 'rental-fashion-cart-v2',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        items: state.items,
        pickupDate: state.pickupDate,
        returnDate: state.returnDate,
        lastBookingId: state.lastBookingId,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    },
  ),
);
