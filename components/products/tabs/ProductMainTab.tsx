// apps/admin/components/products/tabs/ProductMainTab.tsx

"use client";

import { Controller } from "react-hook-form";
import RHFSelect from "../FormSections/RHFSelect";
import TextEditorNew from "@/core/common/texteditor/texteditor";

interface Props {
  register: any;
  control: any;
  errors: any;
  categoryOptions: any[];
  subcategoryOptions: any[];
  brandOptions: any[];
  countryOptions: any[];
  categoryId: any;
  isView: boolean;
  slugTouched: any;
  setValue: any;
}

const generateSlug = (text: string) =>
  text
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");

export default function ProductMainTab({
  register,
  control,
  errors,
  categoryOptions,
  subcategoryOptions,
  brandOptions,
  countryOptions,
  categoryId,
  isView,
  slugTouched,
  setValue,
}: Props) {
  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label>Product Name *</label>

          <input
            {...register("name")}
            disabled={isView}
            className="w-full border rounded p-2"
          />

          {errors.name && (
            <p className="text-red-500 text-sm">{errors.name.message}</p>
          )}
        </div>

        <div>
          <label>Slug *</label>

          <input
            {...register("slug")}
            disabled={isView}
            onChange={(e) => {
              slugTouched.current = true;
              setValue("slug", generateSlug(e.target.value));
            }}
            className="w-full border rounded p-2"
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label>SKU</label>

          <input
            {...register("sku")}
            readOnly
            className="w-full border rounded p-2 bg-gray-50"
          />
        </div>

        <div>
          <label>Item Code</label>

          <input
            {...register("item_code")}
            readOnly
            className="w-full border rounded p-2 bg-gray-50"
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label>Category *</label>

          <RHFSelect
            name="category_id"
            control={control}
            options={categoryOptions}
            isDisabled={isView}
          />
        </div>

        <div>
          <label>Subcategory *</label>

          <RHFSelect
            name="subcategory_id"
            control={control}
            options={subcategoryOptions}
            isDisabled={!categoryId || isView}
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label>Brand *</label>

          <RHFSelect
            name="brand_id"
            control={control}
            options={brandOptions}
            isDisabled={isView}
          />
        </div>

        <div>
          <label>Countries *</label>

          <RHFSelect
            name="country_ids"
            control={control}
            options={countryOptions}
            isMulti
            isDisabled={isView}
          />
        </div>
      </div>

      <div>
        <label>Description</label>

        <Controller
          control={control}
          name="description"
          render={({ field }) => (
            <TextEditorNew
              value={field.value || ""}
              onChange={field.onChange}
              readOnly={isView}
            />
          )}
        />
      </div>

      <div>
        <label>Health Benefits</label>

        <Controller
          control={control}
          name="health_benefits"
          render={({ field }) => (
            <TextEditorNew
              value={field.value || ""}
              onChange={field.onChange}
              readOnly={isView}
            />
          )}
        />
      </div>
    </div>
  );
}
