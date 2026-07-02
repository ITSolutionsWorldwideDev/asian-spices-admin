// components/products/FormSections/product.schema.ts

import { z } from "zod";

const toNumber = (val: any) =>
  val === "" || val === null || val === undefined ? undefined : Number(val);

const emptyToNull = (val: any) => {
  if (val === "" || val === undefined) return null;
  return val;
};

export const productSchema = z
  .object({
    name: z.string().min(1, "Product name is required"),
    slug: z.string().min(1),
    sku: z.string(),
    item_code: z.string(),

    category_id: z.string().nullable().refine(Boolean, {
      message: "Category is required",
    }),

    subcategory_id: z.string().nullable().refine(Boolean, {
      message: "Subcategory is required",
    }),

    brand_id: z.string().nullable().refine(Boolean, {
      message: "Brand is required",
    }),

    country_ids: z.array(z.coerce.number()).optional(),

    base_price: z.preprocess(
      toNumber,
      z.number().min(1, "Base price must be greater than 0"),
    ),
    purchase_price: z.preprocess(toNumber, z.number().nullable().optional()),
    sale_price: z.preprocess(toNumber, z.number().nullable().optional()),
    customer_type: z.enum(["B2C", "B2B"]).default("B2C"),
    quantity: z.preprocess(toNumber, z.number().min(1)),

    description: z.string().optional(),
    health_benefits: z.string().optional(),

    discount_type: z
      .preprocess(emptyToNull, z.enum(["percentage", "fixed"]).nullable())
      .optional(),

    discount_value: z
      .preprocess(emptyToNull, z.coerce.number().nullable())
      .optional(),

    promo_code: z.preprocess(emptyToNull, z.string().nullable()).optional(),
    status: z.coerce.number(),
  })
  .superRefine((data, ctx) => {
    // Standard discount validation
    if (data.discount_type && !data.discount_value) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Discount value is required when type is set",
        path: ["discount_value"],
      });
    }

    if (
      data.discount_type === "percentage" &&
      data.discount_value != null &&
      data.discount_value > 100
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Percentage cannot exceed 100",
        path: ["discount_value"],
      });
    }

    if (
      data.base_price &&
      data.discount_type === "fixed" &&
      data.discount_value &&
      data.discount_value > data.base_price
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Fixed discount value cannot exceed base price",
        path: ["discount_value"],
      });
    }
  });

/* import { z } from "zod";

const toNumber = (val: any) =>
  val === "" || val === null || val === undefined ? undefined : Number(val);

const emptyToNull = (val: any) => {
  if (val === "" || val === undefined) return null;
  return val;
};

export const productSchema = z
  .object({
    name: z.string().min(1, "Product name is required"),
    slug: z.string().min(1),
    sku: z.string(),
    item_code: z.string(),

    category_id: z.string().nullable().refine(Boolean, {
      message: "Category is required",
    }),

    subcategory_id: z.string().nullable().refine(Boolean, {
      message: "Subcategory is required",
    }),

    brand_id: z.string().nullable().refine(Boolean, {
      message: "Brand is required",
    }),

    country_ids: z.array(z.coerce.number()).optional(),

    base_price: z.preprocess(toNumber, z.number().min(1)),
    quantity: z.preprocess(toNumber, z.number().min(1)),

    description: z.string().optional(),
    health_benefits: z.string().optional(),

    discount_type: z
      .preprocess(emptyToNull, z.enum(["percentage", "fixed"]).nullable())
      .optional(),

    discount_value: z
      .preprocess(emptyToNull, z.coerce.number().nullable())
      .optional(),

    promo_code: z.preprocess(emptyToNull, z.string().nullable()).optional(),

    promo_discount: z
      .preprocess(emptyToNull, z.coerce.number().nullable())
      .optional(),

    status: z.coerce.number(),
  })
  .superRefine((data, ctx) => {
    if (data.discount_type && !data.discount_value) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Discount value is required",
        path: ["discount_value"],
      });
    }

    if (
      data.discount_type === "percentage" &&
      data.discount_value != null &&
      data.discount_value > 100
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Percentage cannot exceed 100",
        path: ["discount_value"],
      });
    }

    if (data.promo_code && !data.promo_discount) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Promo discount is required",
        path: ["promo_discount"],
      });
    }

    const totalDiscount =
      (data.discount_value || 0) + (data.promo_discount || 0);

    if (data.base_price && totalDiscount > data.base_price) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Total discount exceeds product price",
        path: ["promo_discount"],
      });
    }
  });
 */
