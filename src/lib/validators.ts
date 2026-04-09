import { z } from "zod";

// Upper bounds — deliberately loose enough for normal use, strict enough to
// stop abuse / payload-bloat attacks.
const MAX_ITEM_QTY = 50;
const MAX_ITEMS_PER_ORDER = 50;
const MAX_EXTRAS_PER_ITEM = 20;
const MAX_NAME = 120;

export const createOrderSchema = z.object({
  orderType: z.enum(["collect", "delivery", "dine_in"]),
  customerName: z.string().trim().min(2, "Nom requis").max(MAX_NAME),
  customerPhone: z
    .string()
    .trim()
    .min(10, "Numero de telephone invalide")
    .max(20)
    .regex(/^[\d\s+()-]+$/, "Format invalide"),
  customerEmail: z
    .string()
    .trim()
    .max(190)
    .email("Email invalide")
    .optional()
    .or(z.literal("")),
  notes: z.string().max(500).optional(),
  items: z
    .array(
      z.object({
        menuItemId: z.string().uuid(),
        variantId: z.string().uuid().optional().nullable(),
        quantity: z.number().int().positive().max(MAX_ITEM_QTY),
        // NOTE: server re-computes these from DB. We still validate shape
        // to reject obvious tampering and keep the old client contract.
        unitPrice: z.number().int().nonnegative().max(1_000_00),
        extrasPrice: z.number().int().nonnegative().max(1_000_00),
        itemName: z.string().max(MAX_NAME),
        variantName: z.string().max(MAX_NAME).optional().nullable(),
        extras: z
          .array(
            z.object({
              id: z.string().uuid(),
              name: z.string().max(MAX_NAME),
              price: z.number().int().nonnegative().max(1_000_00),
            })
          )
          .max(MAX_EXTRAS_PER_ITEM),
        specialInstructions: z.string().max(200).optional().nullable(),
      })
    )
    .min(1, "Le panier est vide")
    .max(MAX_ITEMS_PER_ORDER),
  deliveryAddress: z
    .object({
      street: z.string().trim().min(3, "Adresse requise").max(200),
      city: z.string().trim().min(2, "Ville requise").max(100),
      postalCode: z.string().trim().min(4, "Code postal invalide").max(10),
      lat: z.number().optional(),
      lng: z.number().optional(),
      instructions: z.string().max(200).optional(),
    })
    .optional()
    .nullable(),
});

// Reservation creation — public form, 30 days ahead max.
export const createReservationSchema = z.object({
  customer_name: z.string().trim().min(2, "Nom requis").max(MAX_NAME),
  customer_phone: z
    .string()
    .trim()
    .min(10, "Telephone invalide")
    .max(20)
    .regex(/^[\d\s+()-]+$/, "Format invalide"),
  customer_email: z
    .string()
    .trim()
    .max(190)
    .email("Email invalide")
    .optional()
    .nullable()
    .or(z.literal("")),
  party_size: z.coerce.number().int().min(1, "1 personne minimum").max(20),
  reservation_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date invalide (YYYY-MM-DD)"),
  reservation_time: z
    .string()
    .regex(/^\d{2}:\d{2}(:\d{2})?$/, "Heure invalide (HH:MM)"),
  notes: z.string().max(500).optional().nullable(),
});

export const updateReservationSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["pending", "confirmed", "cancelled", "completed", "no_show"]),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;

export const loginSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(6, "6 caracteres minimum"),
});

export const signupSchema = z.object({
  fullName: z.string().min(2, "Nom requis"),
  email: z.string().email("Email invalide"),
  password: z.string().min(6, "6 caracteres minimum"),
  phone: z
    .string()
    .min(10, "Numero invalide")
    .regex(/^[\d\s+()-]+$/, "Format invalide"),
});
