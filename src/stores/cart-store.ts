import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem, DeliveryAddress, OrderTypeChoice } from "@/types/cart";

interface CartState {
  items: CartItem[];
  orderType: OrderTypeChoice | null;
  scheduledSlot: string | null;
  deliveryAddress: DeliveryAddress | null;
  loyaltyRewardId: string | null;
  customerNotes: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;

  // Actions
  addItem: (item: Omit<CartItem, "id">) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  setOrderType: (type: OrderTypeChoice | null) => void;
  setScheduledSlot: (slot: string | null) => void;
  setDeliveryAddress: (address: DeliveryAddress | null) => void;
  setLoyaltyRewardId: (id: string | null) => void;
  setCustomerNotes: (notes: string) => void;
  setCustomerName: (name: string) => void;
  setCustomerPhone: (phone: string) => void;
  setCustomerEmail: (email: string) => void;
  clear: () => void;

  // Computed
  itemCount: () => number;
  subtotal: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      orderType: null,
      scheduledSlot: null,
      deliveryAddress: null,
      loyaltyRewardId: null,
      customerNotes: "",
      customerName: "",
      customerPhone: "",
      customerEmail: "",

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
        const capped = Math.min(quantity, 50);
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id ? { ...item, quantity: capped } : item
          ),
        }));
      },

      setOrderType: (orderType) => {
        set({ orderType });
        // Only "delivery" needs an address. Clear it for collect.
        if (orderType !== "delivery") {
          set({ deliveryAddress: null });
        }
      },

      setScheduledSlot: (scheduledSlot) => set({ scheduledSlot }),
      setDeliveryAddress: (deliveryAddress) => set({ deliveryAddress }),
      setLoyaltyRewardId: (loyaltyRewardId) => set({ loyaltyRewardId }),
      setCustomerNotes: (customerNotes) => set({ customerNotes }),
      setCustomerName: (customerName) => set({ customerName }),
      setCustomerPhone: (customerPhone) => set({ customerPhone }),
      setCustomerEmail: (customerEmail) => set({ customerEmail }),

      clear: () =>
        set({
          items: [],
          orderType: null,
          scheduledSlot: null,
          deliveryAddress: null,
          loyaltyRewardId: null,
          customerNotes: "",
          customerName: "",
          customerPhone: "",
          customerEmail: "",
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
