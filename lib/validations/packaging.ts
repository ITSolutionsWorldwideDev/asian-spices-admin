// /apps/admin/lib/validation/packaging.ts

import { z } from "zod";

export const packagingTypeSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(2, "Name must be at least 2 characters long").max(255),
  sku: z
    .string()
    .min(3, "SKU must be at least 3 characters")
    .max(100)
    .regex(
      /^[A-Z0-9_-]+$/i,
      "SKU must be alphanumeric (dashes and underscores allowed)",
    ),
  package_type: z.enum(["box", "envelope", "bag", "tube", "gift_wrap"], {
    error: "Please select a valid package structural type",
  }),
  description: z.string().max(1000).optional().nullable().default(""),
  length_cm: z
    .number()
    .positive("Length must be a positive measurement dimension"),
  width_cm: z
    .number()
    .positive("Width must be a positive measurement dimension"),
  height_cm: z
    .number()
    .positive("Height must be a positive measurement dimension"),
  empty_weight_kg: z
    .number()
    .nonnegative("Empty weight cannot be a negative value")
    .default(0),
  max_weight_kg: z
    .number()
    .positive("Max structural weight threshold must be positive")
    .nullable()
    .optional(),
  material: z.string().max(100).optional().nullable().default(""),
  color: z.string().max(100).optional().nullable().default(""),
  is_fragile: z.boolean().default(false),
  is_active: z.boolean().default(true),
});

export type PackagingTypeInput = z.infer<typeof packagingTypeSchema>;
