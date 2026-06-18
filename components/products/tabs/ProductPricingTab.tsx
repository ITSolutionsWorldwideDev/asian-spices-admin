// components/products/tabs/ProductPricingTab.tsx

"use client";

interface Props {
  register: any;
  control: any;
  errors: any;
  fields: any[];
  append: any;
  remove: any;
  salePrice: number;
  isView: boolean;
}

import RHFSelect from "../FormSections/RHFSelect";

export default function ProductPricingTab({
  register,
  control,
  errors,
  fields,
  append,
  remove,
  salePrice,
  isView,
}: Props) {
  return (
    <div className="space-y-6">
      <div>
        <label>Price *</label>

        <input
          type="number"
          step="0.01"
          {...register("price")}
          disabled={isView}
          className="w-full border rounded p-2"
        />
      </div>

      <div>
        <h3 className="font-medium mb-3">B2B Tier Pricing</h3>

        <table className="w-full border">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 text-left">Min Quantity</th>
              <th className="p-2 text-left">Price</th>
              <th className="p-2"></th>
            </tr>
          </thead>
          <tbody>
            {fields.map((tier, index) => (
              <tr key={index} className="border-t">
                <td className="p-2">
                  <input
                    {...register(`b2b_prices.${index}.min_quantity`, {
                      valueAsNumber: true,
                    })}
                    disabled={isView}
                    className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </td>
                <td className="p-2">
                  <input
                    {...register(`b2b_prices.${index}.price`, {
                      valueAsNumber: true,
                    })}
                    disabled={isView}
                    className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </td>
                <td className="p-2">
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="text-red-600"
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!isView && (
          <button
            type="button"
            className="mt-3 px-4 py-2 bg-gray-200 rounded"
            onClick={() => append({ min_quantity: 1, price: 0 })}
          >
            Add Tier
          </button>
        )}
      </div>


      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label>Discount Type</label>

          <RHFSelect
            name="discount_type"
            control={control}
            isDisabled={isView}
            options={[
              {
                value: "percentage",
                label: "Percentage",
              },
              {
                value: "fixed",
                label: "Fixed Amount",
              },
            ]}
          />
        </div>

        <div>
          <label>Discount Value</label>

          <input
            type="number"
            {...register("discount_value")}
            disabled={isView}
            className="w-full border rounded p-2"
          />
        </div>

        <div>
          <label>Promo Code</label>

          <input
            {...register("promo_code")}
            disabled
            className="w-full border rounded p-2"
          />
        </div>

        <div>
          <label>Promo Discount</label>

          <input
            type="number"
            {...register("promo_discount")}
            disabled={isView}
            className="w-full border rounded p-2"
          />
        </div>

        <div>
          <label>Final Sale Price</label>

          <input
            value={salePrice.toFixed(2)}
            readOnly
            className="w-full border rounded p-2"
          />
        </div>
      </div>
    </div>
  );
}
