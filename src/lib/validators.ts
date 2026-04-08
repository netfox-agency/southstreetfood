import { z } from "zod";

export const createOrderSchema = z.object({
  orderType: z.enum(["collect", "delivery"]),
  customerName: z.string().min(2, "Nom requis"),
  customerPhone: z
    .string()
    .min(10, "Numero de telephone invalide")
    .regex(/^[\d\s+()-]+$/, "Format invalide"),
  customerEmail: z.string().email("Email invalide").optional().or(z.literal("")),
  scheduledAt: z.string().optional(),
  notes: z.string().max(500).optional(),
  loyaltyRewardId: z.string().uuid().optional().nullable(),
  items: z
    .array(
      z.object({
        menuItemId: z.string().uuid(),
        variantId: z.string().uuid().optional().nullable(),
        quantity: z.number().int().positive(),
        extras: z.array(
          z.object({
            id: z.string().uuid(),
            name: z.string(),
            price: z.number().int().nonnegative(),
          })
        ),
        specialInstructions: z.string().max(200).optional().nullable(),
      })
    )
    .min(1, "Le panier est vide"),
  deliveryAddress: z
    .object({
      street: z.string().min(3, "Adresse requise"),
      city: z.string().min(2, "Ville requise"),
      postalCode: z
        .string()
        .regex(/^\d{5}$/, "Code postal invalide"),
      lat: z.number().optional(),
      lng: z.number().optional(),
      instructions: z.string().max(200).optional(),
    })
    .optional()
    .nullable(),
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
