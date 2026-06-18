// components/products-catalog/AssignedProductsTable.tsx
"use client";

import { CatalogProduct } from "@/core/types";
// import { CatalogProduct } from "@/types/catalog";
import PriceInput from "./PriceInput";
import QuantityInput from "./QuantityInput";

type Props = {
  products: CatalogProduct[];
  setProducts: (data: CatalogProduct[]) => void;
};

export default function AssignedProductsTable({
  products,
  setProducts,
}: Props) {
  const assigned = products.filter((p) => p.assigned);

  const updateField = (id: string, field: any, value: any) => {
    setProducts(
      products.map((p) =>
        p.product_id === id ? { ...p, [field]: value } : p
      )
    );
  };

  return (
    <div className="border rounded mt-6">
      <h3 className="p-3 font-semibold">Assigned Products</h3>

      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-100">
            <th>Name</th>
            <th>Price</th>
            <th>Qty</th>
            <th>Status</th>
          </tr>
        </thead>

        <tbody>
          {assigned.map((p) => (
            <tr key={p.product_id} className="border-t">
              <td>{p.name}</td>

              <td>
                <PriceInput
                  value={p.store_price}
                  onChange={(val) =>
                    updateField(p.product_id, "store_price", val)
                  }
                />
              </td>

              <td>
                <QuantityInput
                  value={p.quantity}
                  onChange={(val) =>
                    updateField(p.product_id, "quantity", val)
                  }
                />
              </td>

              <td>
                <select
                  value={p.status ?? 1}
                  onChange={(e) =>
                    updateField(
                      p.product_id,
                      "status",
                      Number(e.target.value)
                    )
                  }
                >
                  <option value={1}>Active</option>
                  <option value={0}>Inactive</option>
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}