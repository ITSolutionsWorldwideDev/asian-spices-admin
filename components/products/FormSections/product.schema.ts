// apps/admin/components/products/FormSections/product.schema.ts
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

    price: z.preprocess(toNumber, z.number().min(1)),
    quantity: z.preprocess(toNumber, z.number().min(1)),

    // country_ids: z.array(z.number()).optional(),

    description: z.string().optional(),
    health_benefits: z.string().optional(),

    // price: z.number().min(1, "Price is required"),
    // quantity: z.number().min(1, "Quantity is required"),

    // discount_type: z.enum(["percentage", "fixed"]).optional(),
    // discount_value: z.coerce.number().nullable(),

    // promo_code: z.string().optional(),
    // promo_discount: z.coerce.number().nullable(),

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

    // status: z.number(),
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

    if (data.price && totalDiscount > data.price) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Total discount exceeds product price",
        path: ["promo_discount"],
      });
    }
  });

/* export const productSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  slug: z.string().min(1, "Slug is required"),
  sku: z.string().min(1),
  item_code: z.string().min(1),

  category_id: z.number(),
  subcategory_id: z.number(),
  brand_id: z.number(),

  country_ids: z.array(z.number()).optional(),

  description: z.string().optional(),

  price: z.number().min(1),
  quantity: z.number().min(1),

  discount_type: z.enum(["percentage", "fixed"]).optional(),
  discount_value: z.number().optional(),

  promo_code: z.string().optional(),
  promo_discount: z.number().optional(),

  status: z.number(),
}); */
