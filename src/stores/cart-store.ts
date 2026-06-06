import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem, DeliveryAddress, OrderTypeChoice } from "@/types/cart";

/**
 * Selection des items pour les slots du palier choisi (Loyalty v3).
 * Le serveur valide a la creation de commande que ces IDs correspondent
 * aux regles du palier.
 */
export interface LoyaltySelection {
  /** UUID du palier (loyalty_rewards.id) */
  rewardId: string;
  /** menu_item_id choisi pour le slot main (sandwich) — required si slot_main */
  mainId: string | null;
  /** menu_item_id choisi pour le slot fries — required si slot_fries */
  friesId: string | null;
  /** menu_item_id choisi pour le slot drink — required si slot_drink */
  drinkId: string | null;
  /** menu_item_id choisi pour le slot dessert — required si slot_dessert */
  dessertId: string | null;
  /** Personnalisation du plat principal (protéine, sauces) — offert, prix 0 */
  mainExtras?: { id: string; name: string }[];
  /** variante choisie pour le plat principal (taille...) */
  mainVariantId?: string | null;
}

interface CartState {
  items: CartItem[];
  orderType: OrderTypeChoice | null;
  scheduledSlot: string | null;
  deliveryAddress: DeliveryAddress | null;
  /** @deprecated v2 — garde pour migration douce de l'ancien state persiste. Toujours null. */
  loyaltyRewardId: string | null;
  /** Loyalty v3 : palier choisi + items selectionnes pour chaque slot. */
  loyaltySelection: LoyaltySelection | null;
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
  /** @deprecated — remplace par setLoyaltySelection. No-op kept for back compat. */
  setLoyaltyRewardId: (id: string | null) => void;
  setLoyaltySelection: (selection: LoyaltySelection | null) => void;
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
      loyaltySelection: null,
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
      // V2 no-op (le state persiste peut encore contenir loyaltyRewardId, on l'ignore)
      setLoyaltyRewardId: () => set({ loyaltyRewardId: null }),
      setLoyaltySelection: (loyaltySelection) => set({ loyaltySelection }),
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
          loyaltySelection: null,
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
