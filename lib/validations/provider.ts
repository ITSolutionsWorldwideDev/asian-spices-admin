// lib/validation/provider.ts

import { z } from "zod";

export const providerSchema = z.object({
  id: z.string().uuid().optional(),

  name: z.string().min(2, "Name must be at least 2 characters"),

  slug: z
    .string()
    .min(2, "Slug is required")
    .regex(/^[a-z0-9-]+$/, "Only lowercase, numbers, hyphens allowed"),

  is_active: z.boolean(),

  credentials: z.record(z.string(), z.string()).optional(),
});

export type ProviderInput = z.infer<typeof providerSchema>;
