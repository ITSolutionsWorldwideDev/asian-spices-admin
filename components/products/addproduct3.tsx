// components/products/addproduct3.tsx

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Mode = "create" | "edit";

interface Props {
  mode?: Mode;
  productId?: string;
}

type TierPrice = {
  min_quantity: number;
  price: number;
};

type ImageItem = {
  url: string;
  alt_text?: string;
  is_primary: boolean;
  sort_order: number;
};

export default function AddProduct3({ mode = "create", productId }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    sku: "",
    item_code: "",
    description: "",
    category_id: "",
    subcategory_id: "",
    brand_id: "",
    quantity: 0,
    price: 0,
    status: 1,
  });

  const [b2bPrices, setB2bPrices] = useState<TierPrice[]>([]);
  const [images, setImages] = useState<ImageItem[]>([]);
  const [imageInput, setImageInput] = useState("");

  /* ---------------- SLUG ---------------- */
  const slugify = (text: string) =>
    text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

  useEffect(() => {
    if (!formData.name) return;
    setFormData((prev) => ({
      ...prev,
      slug: slugify(prev.name),
    }));
  }, [formData.name]);

  /* ---------------- B2B ---------------- */

  const addTier = () => {
    setB2bPrices([...b2bPrices, { min_quantity: 1, price: 0 }]);
  };

  const updateTier = (index: number, field: keyof TierPrice, value: number) => {
    const updated = [...b2bPrices];
    updated[index][field] = value;
    setB2bPrices(updated);
  };

  const removeTier = (index: number) => {
    setB2bPrices(b2bPrices.filter((_, i) => i !== index));
  };

  /* ---------------- IMAGES ---------------- */

  const addImage = () => {
    if (!imageInput.trim()) return;

    setImages([
      ...images,
      {
        url: imageInput,
        is_primary: images.length === 0,
        sort_order: images.length,
      },
    ]);

    setImageInput("");
  };

  const setPrimary = (index: number) => {
    setImages(
      images.map((img, i) => ({
        ...img,
        is_primary: i === index,
      })),
    );
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  /* ---------------- SUBMIT ---------------- */

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setSaving(true);

      const payload = {
        ...formData,
        b2b_prices: b2bPrices,
      };

      const url =
        mode === "edit" ? `/api/products/${productId}` : `/api/products`;

      const method = mode === "edit" ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Save failed");

      const product = await res.json();

      await fetch(`/api/products/${product.id}/images`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ images }),
      });

      router.push("/products");
    } catch (err) {
      alert("Failed to save product");
    } finally {
      setSaving(false);
    }
  };

  /* ---------------- UI ---------------- */

  return (
    <div className="page-wrapper p-4 mb-10">
      <div className="content max-w-6xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-10">
          <h1 className="text-3xl font-semibold">
            {mode === "edit" ? "Edit Product" : "Create Product"}
          </h1>

          {/* ---------------- GENERAL SECTION ---------------- */}
          <section className="bg-white shadow rounded-xl p-6 space-y-6">
            <h2 className="text-lg font-semibold border-b pb-2">
              General Information
            </h2>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm mb-1">Product Name</label>
                <input
                  className="input"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>

              <div>
                <label className="block text-sm mb-1">Slug</label>
                <input
                  className="input"
                  value={formData.slug}
                  onChange={(e) =>
                    setFormData({ ...formData, slug: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block text-sm mb-1">SKU</label>
                <input
                  className="input"
                  value={formData.sku}
                  onChange={(e) =>
                    setFormData({ ...formData, sku: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block text-sm mb-1">Item Code</label>
                <input
                  className="input"
                  value={formData.item_code}
                  onChange={(e) =>
                    setFormData({ ...formData, item_code: e.target.value })
                  }
                />
              </div>
            </div>

            <div>
              <label className="block text-sm mb-1">Description</label>
              <textarea
                rows={4}
                className="input w-full"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
            </div>
          </section>

          {/* ---------------- PRICING SECTION ---------------- */}
          <section className="bg-white shadow rounded-xl p-6 space-y-6">
            <h2 className="text-lg font-semibold border-b pb-2">Pricing</h2>

            <div>
              <label className="block text-sm mb-1">B2C Price</label>
              <input
                type="number"
                className="input w-40"
                value={formData.price}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    price: Number(e.target.value),
                  })
                }
                required
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
                  {b2bPrices.map((tier, index) => (
                    <tr key={index} className="border-t">
                      <td className="p-2">
                        <input
                          type="number"
                          className="input"
                          value={tier.min_quantity}
                          onChange={(e) =>
                            updateTier(
                              index,
                              "min_quantity",
                              Number(e.target.value),
                            )
                          }
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          className="input"
                          value={tier.price}
                          onChange={(e) =>
                            updateTier(index, "price", Number(e.target.value))
                          }
                        />
                      </td>
                      <td className="p-2">
                        <button
                          type="button"
                          onClick={() => removeTier(index)}
                          className="text-red-600"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <button
                type="button"
                onClick={addTier}
                className="mt-3 px-4 py-2 bg-gray-200 rounded"
              >
                Add Tier
              </button>
            </div>
          </section>

          {/* ---------------- INVENTORY ---------------- */}
          <section className="bg-white shadow rounded-xl p-6 space-y-4">
            <h2 className="text-lg font-semibold border-b pb-2">Inventory</h2>

            <div>
              <label className="block text-sm mb-1">Stock Quantity</label>
              <input
                type="number"
                className="input w-40"
                value={formData.quantity}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    quantity: Number(e.target.value),
                  })
                }
              />
            </div>
          </section>

          {/* ---------------- IMAGES ---------------- */}
          <section className="bg-white shadow rounded-xl p-6 space-y-4">
            <h2 className="text-lg font-semibold border-b pb-2">Images</h2>

            <div className="flex gap-3">
              <input
                className="input flex-1"
                placeholder="Paste image URL"
                value={imageInput}
                onChange={(e) => setImageInput(e.target.value)}
              />
              <button
                type="button"
                onClick={addImage}
                className="px-4 py-2 bg-gray-200 rounded"
              >
                Add
              </button>
            </div>

            <div className="grid grid-cols-5 gap-4">
              {images.map((img, index) => (
                <div key={index} className="border rounded p-2 relative">
                  <img
                    src={img.url}
                    className="h-24 w-full object-cover rounded"
                  />

                  {img.is_primary && (
                    <span className="absolute top-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                      Primary
                    </span>
                  )}

                  <div className="flex justify-between mt-2 text-sm">
                    <button
                      type="button"
                      onClick={() => setPrimary(index)}
                      className="text-blue-600"
                    >
                      Set Primary
                    </button>
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="text-red-600"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ---------------- SUBMIT ---------------- */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg"
            >
              {saving ? "Saving..." : "Save Product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
