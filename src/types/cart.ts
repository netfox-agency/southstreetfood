export interface CartExtra {
  id: string;
  name: string;
  price: number; // cents
}

export interface CartItem {
  id: string; // unique cart line id
  menuItemId: string;
  menuItemName: string;
  menuItemImage: string | null;
  variantId: string | null;
  variantName: string | null;
  extras: CartExtra[];
  quantity: number;
  unitPrice: number; // base + variant modifier (cents)
  extrasPrice: number; // total extras price per unit (cents)
  specialInstructions: string | null;
}

export interface DeliveryAddress {
  street: string;
  city: string;
  postalCode: string;
  lat?: number;
  lng?: number;
  instructions?: string;
}

export type OrderTypeChoice = "collect" | "delivery" | "dine_in";
