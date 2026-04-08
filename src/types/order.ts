import type { Database } from "./database";

export type Order = Database["public"]["Tables"]["orders"]["Row"];
export type OrderItem = Database["public"]["Tables"]["order_items"]["Row"];
export type DeliveryAddressRow = Database["public"]["Tables"]["delivery_addresses"]["Row"];

export interface OrderWithItems extends Order {
  order_items: OrderItem[];
  delivery_address?: DeliveryAddressRow | null;
}
