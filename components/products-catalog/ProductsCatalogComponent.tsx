// apps/admin/components/products-catalog/ProductsCatalogComponent.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Table from "@/core/common/pagination/datatable";
import FilterBar from "./FilterBar";
import { CatalogProduct } from "@/core/types";
import debounce from "lodash.debounce";

type BulkState = {
  type: "INCLUDE" | "EXCLUDE";
  ids: Set<string>;
};

export default function ProductsCatalogComponent() {
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [loading, setLoading] = useState(false);

  const [selectedProductId, setSelectedProductId] = useState<string | null>(
    null,
  );
  const [productDetail, setProductDetail] = useState<any>(null);
  const [modalLoading, setModalLoading] = useState(false);

  const [allSelected, setAllSelected] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const [filters, setFilters] = useState({});

  const [bulk, setBulk] = useState<BulkState>({
    type: "INCLUDE",
    ids: new Set(),
  });
  const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set());

  const [showAssignedOnly, setShowAssignedOnly] = useState(false);

  /* ------------------------------------
     Debounced API Call
  ------------------------------------ */
  const debouncedUpdate = useMemo(
    () =>
      debounce(async (payload: any, product_id?: string) => {
        await fetch("/api/store/catalog/bulk", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        // remove loading state
        if (product_id) {
          setUpdatingIds((prev) => {
            const next = new Set(prev);
            next.delete(product_id);
            return next;
          });
        }
      }, 500),
    [],
  );

  /* ------------------------------------
     Fetch (Server-side)
  ------------------------------------ */
  const fetchProducts = async (newFilters = filters, newPage = page) => {
    setLoading(true);

    const params = new URLSearchParams({
      page: String(newPage),
      ...newFilters,
    });

    const res = await fetch(`/api/store/catalog?${params}`);
    const data = await res.json();

    setProducts(data.items);
    setTotal(data.total);
    setTotalCount(data.total);

    setLoading(false);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const updateField = (
    product_id: string,
    field: "price" | "quantity",
    value: number,
  ) => {
    setProducts((prev) =>
      prev.map((p) =>
        p.product_id === product_id
          ? {
              ...p,
              store_price: value,
              is_overridden: true,
              assigned: true, // ✅ instantly reflect in UI
            }
          : p,
      ),
    );

    // 2. show saving state
    setUpdatingIds((prev) => new Set(prev).add(product_id));

    // 3. debounce API
    debouncedUpdate(
      {
        // action: "UPDATE",
        action: "UPSERT",
        selection: {
          type: "INCLUDE",
          ids: [product_id],
        },
        data: {
          [field]: value,
        },
      },
      product_id,
    );
  };

  /* ------------------------------------
     Selection Logic
  ------------------------------------ */

  const isSelected = (id: string) => {
    if (bulk.type === "INCLUDE") return bulk.ids.has(id);
    return !bulk.ids.has(id);
  };

  const handleSelectRow = (id: string, checked: boolean) => {
    const newIds = new Set(bulk.ids);

    if (bulk.type === "INCLUDE") {
      checked ? newIds.add(id) : newIds.delete(id);
    } else {
      checked ? newIds.delete(id) : newIds.add(id);
    }

    setBulk({ ...bulk, ids: newIds });
  };

  const openProductModal = async (productId: string) => {
    try {
      setSelectedProductId(productId);
      setModalLoading(true);

      const res = await fetch(`/api/store/catalog/${productId}`);
      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      setProductDetail(data.product);
    } catch (err) {
      console.error(err);
    } finally {
      setModalLoading(false);
    }
  };

  const handleAssignAllFiltered = async () => {
    setLoading(true);
    await fetch("/api/store/catalog/bulk", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "ASSIGN",
        filters, // 🔥 key part
        selection: {
          type: "EXCLUDE", // means "everything except none"
          ids: [],
        },
      }),
    });

    fetchProducts(); // refresh
  };

  const toggleAssign = async (record: CatalogProduct) => {
    setLoading(true);

    if (record.assigned) {
      await fetch("/api/store/catalog/bulk", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "UNASSIGN",
          selection: {
            type: "INCLUDE",
            ids: [record.product_id],
          },
        }),
      });
    } else {
      await fetch("/api/store/catalog/bulk", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "UPSERT",
          selection: {
            type: "INCLUDE",
            ids: [record.product_id],
          },
          data: {
            price: record.base_price, // default price
          },
        }),
      });
    }

    fetchProducts();
  };

  const handleBulkAssignSelected = async () => {
    if (bulk.ids.size === 0) return;

    setLoading(true);

    await fetch("/api/store/catalog/bulk", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "UPSERT",
        selection: {
          type: "INCLUDE",
          ids: Array.from(bulk.ids),
        },
        data: {},
        // data: {
        //   price: null, // fallback to base price
        // },
      }),
    });

    fetchProducts();
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setBulk({
        type: "INCLUDE",
        ids: new Set(products.map((p) => p.product_id)),
      });
      setAllSelected(false);
    } else {
      setBulk({ type: "INCLUDE", ids: new Set() });
      setAllSelected(false);
    }
  };

  const handleSelectAllAcrossPages = () => {
    setBulk({ type: "EXCLUDE", ids: new Set() });
    setAllSelected(true);
  };

  /* ------------------------------------
     Columns
  ------------------------------------ */

  const columns = [
    {
      title: "Name",
      render: (_: any, record: CatalogProduct) => (
        <button
          onClick={() => openProductModal(record.product_id)}
          className="text-blue-600 hover:underline text-left"
        >
          {record.name}
        </button>
      ),
    },
    {
      title: "Price",
      render: (_: any, record: CatalogProduct) => (
        <div className="flex flex-col gap-1">
          <input
            type="number"
            min={0.01}
            value={record.store_price ?? record.base_price}
            onChange={
              (e) => {
                const value = Number(e.target.value);
                if (!value || value <= 0) return; // ❌ block invalid

                updateField(record.product_id, "price", value);
              }
              // updateField(record.product_id, "price", Number(e.target.value))
            }
            className="w-24 border px-2 py-1"
          />

          {!record.is_overridden && (
            <span className="text-xs text-gray-400">Using default price</span>
          )}

          {record.is_overridden && (
            <span className="text-xs text-green-600 mt-2">Overridden</span>
          )}

          <span className="text-xs text-gray-500 mt-2">
            Base: €{record.base_price}
          </span>
        </div>
      ),
    },
    {
      title: "Assigned",
      render: (_: any, record: CatalogProduct) => (
        <span
          className={`px-2 py-1 rounded text-xs ${
            record.assigned
              ? "bg-green-100 text-green-700"
              : "bg-gray-100 text-gray-500"
          }`}
        >
          {record.assigned ? "Assigned" : "Not Assigned"}
        </span>
      ),
    },
    {
      title: "Action",
      render: (_: any, record: CatalogProduct) => (
        <button
          onClick={() => toggleAssign(record)}
          className={`px-3 py-1 rounded text-xs ${
            record.assigned ? "bg-red-500 text-white" : "bg-blue-500 text-white"
          }`}
        >
          {record.assigned ? "Unassign" : "Assign"}
        </button>
      ),
    },
  ];

  return (
    <div className="page-wrapper2">
      <div className="content">
        <div className="page-header flex flex-col  w-full  justify-between mb-4">
          <div className=" mb-2   w-full ">
            <h4 className="text-lg font-semibold">Products Catalog</h4>
            <h6 className="text-gray-500">Assign and manage store products</h6>
          </div>
          <div className=" justify-between w-full">
            <FilterBar
              onApply={(f) => {
                setFilters(f);
                fetchProducts(f, 1);
              }}
            />

            <div className="flex flex-wrap gap-3 items-center">
              {/* <button
                onClick={handleAssignAllFiltered}
                className="bg-green-600 text-white px-4 py-2 rounded text-sm mt-4"
              >
                Assign All Filtered Products
              </button> */}

              <button
                disabled={bulk.ids.size === 0}
                onClick={handleBulkAssignSelected}
                className="bg-blue-600 text-white px-4 py-2 rounded text-sm mt-4 disabled:opacity-50"
              >
                Assign Selected ({bulk.ids.size})
              </button>

              <button
                disabled={bulk.ids.size === 0}
                onClick={async () => {
                  await fetch("/api/store/catalog/bulk", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      action: "RESET_PRICE",
                      selection: {
                        type: "INCLUDE",
                        ids: Array.from(bulk.ids),
                      },
                    }),
                  });

                  fetchProducts();
                }}
                className="bg-gray-600 text-white px-4 py-2  mt-4 rounded text-sm"
              >
                Reset to Base Price
              </button>
            </div>

            <label className="flex items-center gap-2 text-sm mt-3">
              <input
                type="checkbox"
                checked={showAssignedOnly}
                onChange={(e) => {
                  setShowAssignedOnly(e.target.checked);
                  fetchProducts({ ...filters, assigned: e.target.checked }, 1);
                }}
              />
              Show only assigned products
            </label>
          </div>
        </div>

        <div className="card table-list-card">
          <div className="card-body">
            {loading ? (
              <div className="flex items-center justify-center py-24 space-x-3">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-black" />
                <p className="text-gray-500 font-medium">Loading...</p>
              </div>
            ) : (
              <>
                {bulk.type === "INCLUDE" &&
                  bulk.ids.size > 0 &&
                  !allSelected && (
                    <div className="bg-blue-50 border px-4 py-2 mb-3 rounded text-sm">
                      {bulk.ids.size} items selected on this page.
                      <button
                        // onClick={handleSelectAllAcrossPages}
                        className="ml-2 text-blue-600 underline"
                      >
                        Select all {totalCount} items
                      </button>
                    </div>
                  )}

                {allSelected && (
                  <div className="bg-green-50 border px-4 py-2 mb-3 rounded text-sm">
                    All {totalCount} items selected.
                    <button
                      onClick={() => {
                        setBulk({ type: "INCLUDE", ids: new Set() });
                        setAllSelected(false);
                      }}
                      className="ml-2 text-red-600 underline"
                    >
                      Clear selection
                    </button>
                  </div>
                )}
                <Table
                  columns={columns}
                  dataSource={products}
                  rowKey="product_id"
                  selectable
                  selectedRowKeys={products
                    .filter((p) => isSelected(p.product_id))
                    .map((p) => p.product_id)}
                  onSelectRow={handleSelectRow}
                  onSelectAll={handleSelectAll}
                  pagination={{
                    current: page,
                    pageSize: 10,
                    total,
                  }}
                  onChange={(p) => {
                    setPage(p.current);
                    fetchProducts(filters, p.current);
                  }}
                />
              </>
            )}

            {selectedProductId && (
              <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                <div className="bg-white w-full max-w-xl rounded-lg shadow-lg p-6 relative">
                  {/* Close */}
                  <button
                    onClick={() => {
                      setSelectedProductId(null);
                      setProductDetail(null);
                    }}
                    className="absolute top-2 right-2 text-gray-500"
                  >
                    ✕
                  </button>

                  {modalLoading ? (
                    <p className="text-center py-6">Loading...</p>
                  ) : productDetail ? (
                    <div className="space-y-3">
                      <h2 className="text-xl font-bold">
                        {productDetail.name}
                      </h2>

                      <p className="text-sm text-gray-500">
                        SKU: {productDetail.sku}
                      </p>

                      <p className="text-sm text-gray-600">
                        Description:{" "}
                        {productDetail.description || "No description"}
                      </p>

                      <p className="text-sm text-gray-600">
                        Health Benefits: {productDetail.health_benefits || ""}
                      </p>

                      <div className="flex justify-between text-sm">
                        <span>Price:</span>
                        <strong>
                          €{Number(productDetail.price).toFixed(2)}
                        </strong>
                      </div>

                      <div className="flex justify-between text-sm">
                        <span>Stock:</span>
                        <strong>{productDetail.quantity}</strong>
                      </div>

                      <div className="text-xs text-gray-400">
                        Created:{" "}
                        {new Date(productDetail.created_at).toLocaleString()}
                      </div>
                    </div>
                  ) : (
                    <p className="text-center text-red-500">Failed to load</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* const toggleAssign = async (record: CatalogProduct) => {
    setLoading(true);
    const action = record.assigned ? "UNASSIGN" : "ASSIGN";

    await fetch("/api/store/catalog/bulk", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action,
        selection: {
          type: "INCLUDE",
          ids: [record.product_id],
        },
      }),
    });

    fetchProducts(); // refresh
  }; */
// 1. update UI instantly
// setProducts((prev) =>
//   prev.map((p) =>
//     p.product_id === product_id
//       ? {
//           ...p,
//           ...(field === "price"
//             ? { store_price: value }
//             : { quantity: value }),
//         }
//       : p,
//   ),
// );
// {
//   title: "Price",
//   render: (_: any, record: CatalogProduct) => (
//     <div className="flex items-center gap-2">
//       <input
//         type="number"
//         value={record.store_price ?? ""}
//         onChange={(e) =>
//           updateField(record.product_id, "price", Number(e.target.value))
//         }
//         className="w-24 border px-2 py-1"
//       />

//       {updatingIds.has(record.product_id) && (
//         <span className="text-xs text-gray-400">Saving...</span>
//       )}
//     </div>
//     // disabled={!record.assigned}
//   ),
// },

// {
//   title: "Qty",
//   render: (_: any, record: CatalogProduct) => (
//     <div className="flex items-center gap-2">
//       <input
//         type="number"
//         value={record.quantity ?? ""}
//         onChange={(e) =>
//           updateField(record.product_id, "quantity", Number(e.target.value))
//         }
//         className="w-20 border px-2 py-1"
//       />

//       {updatingIds.has(record.product_id) && (
//         <span className="text-xs text-gray-400">Saving...</span>
//       )}
//     </div>
//   ),
// },
