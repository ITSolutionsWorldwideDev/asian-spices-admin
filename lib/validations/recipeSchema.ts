//  lib/validations/recipeSchema.ts

import { z } from "zod";

export const recipeSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title is required")
    .min(3, "Title must be at least 3 characters"),

  slug: z
    .string()
    .trim()
    .min(1, "Slug is required")
    .min(3, "Slug must be at least 3 characters"),

  shortDescription: z.string().optional(),

  content: z.string().optional(),

  youtubeUrl: z
    .string()
    .trim()
    .optional()
    .refine(
      (value) => {
        if (!value) return true;

        try {
          new URL(value);
          return true;
        } catch {
          return false;
        }
      },
      {
        message: "Invalid YouTube URL",
      },
    ),

  thumbnailUrl: z.string().optional(),

  categoryId: z
    .string()
    .trim()
    .refine((v) => v.length > 0, {
      message: "Category is required",
    })
    .refine(
      (v) =>
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
          v,
        ),
      {
        message: "Invalid category ID",
      },
    ),

  status: z.enum(["draft", "published", "archived"]),

  seoTitle: z.string().optional(),

  seoDescription: z.string().optional(),

  seoKeywords: z.string().optional(),
});
