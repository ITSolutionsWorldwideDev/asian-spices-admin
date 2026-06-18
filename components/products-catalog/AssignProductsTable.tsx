// components/products-catalog/AssignProductsTable.tsx

"use client";

import { CatalogProduct } from "@/core/types";
// import { CatalogProduct } from "@/core/types/catalog";
// import { CatalogProduct } from "@/types/catalog";
import PriceInput from "./PriceInput";
import QuantityInput from "./QuantityInput";

type Props = {
  products: CatalogProduct[];
  setProducts: (data: CatalogProduct[]) => void;
};

export default function AssignProductsTable({ products, setProducts }: Props) {
  const toggleAssign = (id: string) => {
    setProducts(
      products.map((p) =>
        p.product_id === id
          ? { ...p, assigned: !p.assigned }
          : p
      )
    );
  };

  const updateField = (
    id: string,
    field: "store_price" | "quantity" | "status",
    value: any
  ) => {
    setProducts(
      products.map((p) =>
        p.product_id === id ? { ...p, [field]: value } : p
      )
    );
  };

  return (
    <div className="overflow-x-auto border rounded">
      <table className="w-full text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2">✔</th>
            <th>Name</th>
            <th>SKU</th>
            <th>Category</th>
            <th>Brand</th>
            <th>Price</th>
            <th>Qty</th>
            <th>Status</th>
          </tr>
        </thead>

        <tbody>
          {products.map((p) => (
            <tr key={p.product_id} className="border-t">
              <td className="text-center">
                <input
                  type="checkbox"
                  checked={p.assigned}
                  onChange={() => toggleAssign(p.product_id)}
                />
              </td>

              <td>{p.name}</td>
              <td>{p.sku}</td>
              <td>{p.category}</td>
              <td>{p.brand}</td>

              <td>
                {p.assigned && (
                  <PriceInput
                    value={p.store_price}
                    onChange={(val) =>
                      updateField(p.product_id, "store_price", val)
                    }
                  />
                )}
              </td>

              <td>
                {p.assigned && (
                  <QuantityInput
                    value={p.quantity}
                    onChange={(val) =>
                      updateField(p.product_id, "quantity", val)
                    }
                  />
                )}
              </td>

              <td>
                {p.assigned && (
                  <select
                    value={p.status ?? 1}
                    onChange={(e) =>
                      updateField(
                        p.product_id,
                        "status",
                        Number(e.target.value)
                      )
                    }
                    className="border px-2 py-1 rounded"
                  >
                    <option value={1}>Active</option>
                    <option value={0}>Inactive</option>
                  </select>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}