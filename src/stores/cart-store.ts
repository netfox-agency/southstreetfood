import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem, DeliveryAddress, OrderTypeChoice } from "@/types/cart";

interface CartState {
  items: CartItem[];
  orderType: OrderTypeChoice;
  scheduledSlot: string | null;
  deliveryAddress: DeliveryAddress | null;
  loyaltyRewardId: string | null;
  customerNotes: string;

  // Actions
  addItem: (item: Omit<CartItem, "id">) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  setOrderType: (type: OrderTypeChoice) => void;
  setScheduledSlot: (slot: string | null) => void;
  setDeliveryAddress: (address: DeliveryAddress | null) => void;
  setLoyaltyRewardId: (id: string | null) => void;
  setCustomerNotes: (notes: string) => void;
  clear: () => void;

  // Computed
  itemCount: () => number;
  subtotal: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      orderType: "collect",
      scheduledSlot: null,
      deliveryAddress: null,
      loyaltyRewardId: null,
      customerNotes: "",

      addItem: (item) => {
        const id = crypto.randomUUID();
        set((state) => ({
          items: [...state.items, { ...item, id }],
        }));
      },

      removeItem: (id) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        }));
      },

      updateQuantity: (id, quantity) => {
        if (quantity <= 0) {
          get().removeItem(id);
          return;
        }
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id ? { ...item, quantity } : item
          ),
        }));
      },

      setOrderType: (orderType) => {
        set({ orderType });
        if (orderType === "collect") {
          set({ deliveryAddress: null });
        }
      },

      setScheduledSlot: (scheduledSlot) => set({ scheduledSlot }),
      setDeliveryAddress: (deliveryAddress) => set({ deliveryAddress }),
      setLoyaltyRewardId: (loyaltyRewardId) => set({ loyaltyRewardId }),
      setCustomerNotes: (customerNotes) => set({ customerNotes }),

      clear: () =>
        set({
          items: [],
          orderType: "collect",
          scheduledSlot: null,
          deliveryAddress: null,
          loyaltyRewardId: null,
          customerNotes: "",
        }),

      itemCount: () =>
        get().items.reduce((sum, item) => sum + item.quantity, 0),

      subtotal: () =>
        get().items.reduce(
          (sum, item) =>
            sum + (item.unitPrice + item.extrasPrice) * item.quantity,
          0
        ),
    }),
    {
      name: "ssf-cart",
    }
  )
);
