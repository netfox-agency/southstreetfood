// Auto-generated types will replace this file via `supabase gen types typescript`
// For now, manual types matching our schema

export type UserRole = "customer" | "kitchen" | "admin";
export type OrderType = "collect" | "delivery" | "dine_in";
export type OrderStatus =
  | "pending_payment"
  | "paid"
  | "accepted"
  | "preparing"
  | "ready"
  | "out_for_delivery"
  | "delivered"
  | "picked_up"
  | "cancelled"
  | "refunded";
export type PaymentStatus = "pending" | "succeeded" | "failed" | "refunded";
export type DayOfWeek = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          phone: string | null;
          role: UserRole;
          loyalty_points: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          phone?: string | null;
          role?: UserRole;
          loyalty_points?: number;
        };
        Update: {
          full_name?: string | null;
          phone?: string | null;
          role?: UserRole;
          loyalty_points?: number;
        };
      };
      categories: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          display_order: number;
          image_url: string | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string | null;
          display_order?: number;
          image_url?: string | null;
          is_active?: boolean;
        };
        Update: {
          name?: string;
          slug?: string;
          description?: string | null;
          display_order?: number;
          image_url?: string | null;
          is_active?: boolean;
        };
      };
      menu_items: {
        Row: {
          id: string;
          category_id: string;
          name: string;
          slug: string;
          description: string | null;
          base_price: number;
          image_url: string | null;
          is_available: boolean;
          is_featured: boolean;
          display_order: number;
          allergens: string[] | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          category_id: string;
          name: string;
          slug: string;
          description?: string | null;
          base_price: number;
          image_url?: string | null;
          is_available?: boolean;
          is_featured?: boolean;
          display_order?: number;
          allergens?: string[] | null;
        };
        Update: {
          category_id?: string;
          name?: string;
          slug?: string;
          description?: string | null;
          base_price?: number;
          image_url?: string | null;
          is_available?: boolean;
          is_featured?: boolean;
          display_order?: number;
          allergens?: string[] | null;
        };
      };
      menu_item_variants: {
        Row: {
          id: string;
          menu_item_id: string;
          name: string;
          price_modifier: number;
          is_default: boolean;
          is_available: boolean;
        };
        Insert: {
          id?: string;
          menu_item_id: string;
          name: string;
          price_modifier: number;
          is_default?: boolean;
          is_available?: boolean;
        };
        Update: {
          name?: string;
          price_modifier?: number;
          is_default?: boolean;
          is_available?: boolean;
        };
      };
      extra_groups: {
        Row: {
          id: string;
          name: string;
          min_selections: number;
          max_selections: number | null;
          display_order: number;
        };
        Insert: {
          id?: string;
          name: string;
          min_selections?: number;
          max_selections?: number | null;
          display_order?: number;
        };
        Update: {
          name?: string;
          min_selections?: number;
          max_selections?: number | null;
          display_order?: number;
        };
      };
      extra_items: {
        Row: {
          id: string;
          extra_group_id: string;
          name: string;
          price: number;
          is_available: boolean;
          display_order: number;
        };
        Insert: {
          id?: string;
          extra_group_id: string;
          name: string;
          price: number;
          is_available?: boolean;
          display_order?: number;
        };
        Update: {
          name?: string;
          price?: number;
          is_available?: boolean;
          display_order?: number;
        };
      };
      menu_item_extra_groups: {
        Row: {
          menu_item_id: string;
          extra_group_id: string;
        };
        Insert: {
          menu_item_id: string;
          extra_group_id: string;
        };
        Update: never;
      };
      orders: {
        Row: {
          id: string;
          order_number: number;
          user_id: string | null;
          order_type: OrderType;
          status: OrderStatus;
          payment_status: PaymentStatus;
          stripe_payment_intent_id: string | null;
          subtotal: number;
          delivery_fee: number;
          discount_amount: number;
          total: number;
          customer_name: string;
          customer_phone: string;
          customer_email: string | null;
          scheduled_at: string | null;
          estimated_ready_at: string | null;
          notes: string | null;
          loyalty_points_earned: number;
          loyalty_reward_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          order_type: OrderType;
          status?: OrderStatus;
          payment_status?: PaymentStatus;
          stripe_payment_intent_id?: string | null;
          subtotal: number;
          delivery_fee?: number;
          discount_amount?: number;
          total: number;
          customer_name: string;
          customer_phone: string;
          customer_email?: string | null;
          scheduled_at?: string | null;
          estimated_ready_at?: string | null;
          notes?: string | null;
          loyalty_points_earned?: number;
          loyalty_reward_id?: string | null;
        };
        Update: {
          status?: OrderStatus;
          payment_status?: PaymentStatus;
          stripe_payment_intent_id?: string | null;
          estimated_ready_at?: string | null;
          loyalty_points_earned?: number;
          updated_at?: string;
          order_type?: OrderType;
          subtotal?: number;
          delivery_fee?: number;
          discount_amount?: number;
          total?: number;
          customer_name?: string;
          customer_phone?: string;
          customer_email?: string | null;
          scheduled_at?: string | null;
          notes?: string | null;
          loyalty_reward_id?: string | null;
          user_id?: string | null;
        };
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          menu_item_id: string;
          variant_id: string | null;
          quantity: number;
          unit_price: number;
          extras_price: number;
          item_name: string;
          variant_name: string | null;
          extras_json: Record<string, unknown>[] | null;
          special_instructions: string | null;
        };
        Insert: {
          id?: string;
          order_id: string;
          menu_item_id: string;
          variant_id?: string | null;
          quantity: number;
          unit_price: number;
          extras_price?: number;
          item_name: string;
          variant_name?: string | null;
          extras_json?: Record<string, unknown>[] | null;
          special_instructions?: string | null;
        };
        Update: never;
      };
      delivery_addresses: {
        Row: {
          id: string;
          order_id: string;
          street: string;
          city: string;
          postal_code: string;
          lat: number | null;
          lng: number | null;
          delivery_instructions: string | null;
        };
        Insert: {
          id?: string;
          order_id: string;
          street: string;
          city: string;
          postal_code: string;
          lat?: number | null;
          lng?: number | null;
          delivery_instructions?: string | null;
        };
        Update: never;
      };
      saved_addresses: {
        Row: {
          id: string;
          user_id: string;
          label: string | null;
          street: string;
          city: string;
          postal_code: string;
          lat: number | null;
          lng: number | null;
          is_default: boolean;
        };
        Insert: {
          id?: string;
          user_id: string;
          label?: string | null;
          street: string;
          city: string;
          postal_code: string;
          lat?: number | null;
          lng?: number | null;
          is_default?: boolean;
        };
        Update: {
          label?: string | null;
          street?: string;
          city?: string;
          postal_code?: string;
          lat?: number | null;
          lng?: number | null;
          is_default?: boolean;
        };
      };
      loyalty_rewards: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          points_cost: number;
          reward_type: string;
          reward_value: number | null;
          reward_menu_item_id: string | null;
          is_active: boolean;
          image_url: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          points_cost: number;
          reward_type: string;
          reward_value?: number | null;
          reward_menu_item_id?: string | null;
          is_active?: boolean;
          image_url?: string | null;
        };
        Update: {
          name?: string;
          description?: string | null;
          points_cost?: number;
          reward_type?: string;
          reward_value?: number | null;
          reward_menu_item_id?: string | null;
          is_active?: boolean;
          image_url?: string | null;
        };
      };
      loyalty_transactions: {
        Row: {
          id: string;
          user_id: string;
          order_id: string | null;
          points: number;
          description: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          order_id?: string | null;
          points: number;
          description?: string | null;
        };
        Update: never;
      };
      time_slots: {
        Row: {
          id: string;
          day_of_week: DayOfWeek;
          start_time: string;
          end_time: string;
          max_orders: number;
          is_active: boolean;
        };
        Insert: {
          id?: string;
          day_of_week: DayOfWeek;
          start_time: string;
          end_time: string;
          max_orders?: number;
          is_active?: boolean;
        };
        Update: {
          start_time?: string;
          end_time?: string;
          max_orders?: number;
          is_active?: boolean;
        };
      };
      reservations: {
        Row: {
          id: string;
          reservation_number: number;
          customer_name: string;
          customer_phone: string;
          customer_email: string | null;
          party_size: number;
          reservation_date: string;
          reservation_time: string;
          notes: string | null;
          status: "pending" | "confirmed" | "seated" | "completed" | "cancelled" | "no_show";
          created_at: string;
          updated_at: string;
          treated_at: string | null;
          treated_by: string | null;
        };
        Insert: {
          id?: string;
          customer_name: string;
          customer_phone: string;
          customer_email?: string | null;
          party_size?: number;
          reservation_date: string;
          reservation_time: string;
          notes?: string | null;
          status?: "pending" | "confirmed" | "seated" | "completed" | "cancelled" | "no_show";
        };
        Update: {
          customer_name?: string;
          customer_phone?: string;
          customer_email?: string | null;
          party_size?: number;
          reservation_date?: string;
          reservation_time?: string;
          notes?: string | null;
          status?: "pending" | "confirmed" | "seated" | "completed" | "cancelled" | "no_show";
          treated_at?: string | null;
          treated_by?: string | null;
        };
      };
      restaurant_settings: {
        Row: {
          id: number;
          restaurant_name: string;
          phone: string | null;
          email: string | null;
          address: string | null;
          opening_hours: Record<string, unknown> | null;
          delivery_enabled: boolean;
          collect_enabled: boolean;
          min_order_delivery: number | null;
          delivery_radius_km: number | null;
          delivery_zones: Record<string, unknown> | null;
          base_delivery_fee: number | null;
          loyalty_points_per_euro: number;
          estimated_prep_minutes: number;
          is_open_override: boolean | null;
          updated_at: string;
        };
        Insert: {
          id?: number;
          restaurant_name?: string;
          phone?: string | null;
          email?: string | null;
          address?: string | null;
          opening_hours?: Record<string, unknown> | null;
          delivery_enabled?: boolean;
          collect_enabled?: boolean;
          min_order_delivery?: number | null;
          delivery_radius_km?: number | null;
          delivery_zones?: Record<string, unknown> | null;
          base_delivery_fee?: number | null;
          loyalty_points_per_euro?: number;
          estimated_prep_minutes?: number;
          is_open_override?: boolean | null;
        };
        Update: {
          restaurant_name?: string;
          phone?: string | null;
          email?: string | null;
          address?: string | null;
          opening_hours?: Record<string, unknown> | null;
          delivery_enabled?: boolean;
          collect_enabled?: boolean;
          min_order_delivery?: number | null;
          delivery_radius_km?: number | null;
          delivery_zones?: Record<string, unknown> | null;
          base_delivery_fee?: number | null;
          loyalty_points_per_euro?: number;
          estimated_prep_minutes?: number;
          is_open_override?: boolean | null;
        };
      };
    };
    Enums: {
      user_role: UserRole;
      order_type: OrderType;
      order_status: OrderStatus;
      payment_status: PaymentStatus;
      day_of_week: DayOfWeek;
    };
  };
}
