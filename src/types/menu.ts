import type { Database } from "./database";

export type Category = Database["public"]["Tables"]["categories"]["Row"];
export type MenuItem = Database["public"]["Tables"]["menu_items"]["Row"];
export type MenuItemVariant = Database["public"]["Tables"]["menu_item_variants"]["Row"];
export type ExtraGroup = Database["public"]["Tables"]["extra_groups"]["Row"];
export type ExtraItem = Database["public"]["Tables"]["extra_items"]["Row"];

export interface MenuItemWithDetails extends MenuItem {
  category: Category;
  variants: MenuItemVariant[];
  extra_groups: (ExtraGroup & { items: ExtraItem[] })[];
}

export interface CategoryWithItems extends Category {
  menu_items: MenuItem[];
}
