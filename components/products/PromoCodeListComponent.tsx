// components/products/PromoCodeListComponent.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import Table from "@/core/common/pagination/datatable";
import { Trash2, PlusCircle, Tag } from "react-feather";
import { useToast } from "@/core/ui";
import { TbTrash } from "react-icons/tb";

type PromoCode = {
  id: number;
  code: string;
  discount_type: "PERCENT" | "FLAT";
  discount_value: number;
  min_order_amount: number;
  max_discount_amount: number | null;
  usage_limit: number | null;
  usage_count: number;
  starts_at: string;
  expires_at: string | null;
  status: number;
};

export default function PromoCodeListComponent() {
  const [promos, setPromos] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const { showToast } = useToast();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  // Form Field States
  const [formData, setFormData] = useState({
    code: "",
    discount_type: "PERCENT",
    discount_value: "",
    min_order_amount: "",
    max_discount_amount: "",
    usage_limit: "",
    expires_at: "",
    status: "1",
  });

  const fetchPromos = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/products/promos?search=${search}`);
      const data = await res.json();
      setPromos(data.items || []);
    } catch {
      showToast("error", "Failed to compile active voucher structures");
    } finally {
      setLoading(false);
    }
  }, [search, showToast]);

  useEffect(() => {
    fetchPromos();
  }, [fetchPromos]);

  const handleCreatePromo = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/products/promos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Execution failed");

      showToast("success", "Promo Code minted successfully");
      setShowCreateModal(false);
      setFormData({
        code: "",
        discount_type: "PERCENT",
        discount_value: "",
        min_order_amount: "",
        max_discount_amount: "",
        usage_limit: "",
        expires_at: "",
        status: "1",
      });
      fetchPromos();
    } catch (err: any) {
      showToast("error", err.message);
    }
  };

  const handleDelete = async () => {
    if (!selectedId) return;
    try {
      const res = await fetch(`/api/products/promos?id=${selectedId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Failed to destroy targeted database entry");
      }

      setShowDeleteModal(false);
      setSelectedId(null);
      fetchPromos();
      showToast("success", "Rule detached successfully");
    } catch (err: any) {
      showToast("error", err.message || "Failed to destroy targeted database entry");
    }
  };

  const columns = [
    {
      title: "Promo Code",
      dataIndex: "code",
      render: (text: string) => (
        <span className="flex items-center font-mono font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded w-max">
          <Tag size={12} className="mr-1" /> {text}
        </span>
      ),
    },
    {
      title: "Discount Scheme",
      dataIndex: "discount_value",
      render: (val: number, record: PromoCode) =>
        record.discount_type === "PERCENT"
          ? `${val}% Off`
          : `€${val.toLocaleString()}`,
    },
    {
      title: "Min Order Value",
      dataIndex: "min_order_amount",
      render: (val: number) => `€${val.toLocaleString()}`,
    },
    {
      title: "Usage metrics",
      dataIndex: "usage_count",
      render: (count: number, record: PromoCode) => (
        <span className="text-sm font-medium">
          {count} / {record.usage_limit || "∞"}
        </span>
      ),
    },
    {
      title: "Expiration",
      dataIndex: "expires_at",
      render: (date: string) =>
        date ? new Date(date).toLocaleDateString() : "Never Expires",
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (s: number) => (
        <span
          className={`px-2 py-1 rounded-full text-white text-xs font-semibold ${s ? "bg-green-600" : "bg-red-600"}`}
        >
          {s ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      title: "Action",
      dataIndex: "action",
      render: (_: any, record: PromoCode) => (
        <button
          onClick={() => {
            setSelectedId(record.id);
            setShowDeleteModal(true);
          }}
          className="p-2 text-red-500 hover:text-red-700 transition-colors"
        >
          <Trash2 size={16} />
        </button>
      ),
    },
  ];

  return (
    <>
      <div className="pt-0 page-wrapper">
        <div className="content">
          <div className="page-header flex flex-wrap justify-between items-center gap-3 mb-4">
            <div>
              <h4 className="text-lg font-semibold">Campaign Promo Rules</h4>
              <h6 className="text-gray-500">
                Manage digital codes and cart rule activations
              </h6>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium"
            >
              <PlusCircle className="mr-2" size={16} /> New Promo Code
            </button>
          </div>

          <div className="card table-list-card mb-4">
            <div className="card-header">
              <input
                placeholder="Search code patterns..."
                className="px-3 py-2 border rounded text-sm w-full max-w-xs"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="card-body">
              <div className="overflow-x-auto">
                {loading ? (
                  <div className="flex items-center justify-center py-24">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-black" />
                  </div>
                ) : (
                  <Table columns={columns} dataSource={promos} rowKey="id" />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CREATE PROMO DIALOG OVERLAY */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 overflow-y-auto">
          <div className="bg-white text-black rounded-lg p-6 max-w-md w-full shadow-xl">
            <h4 className="text-lg font-bold mb-4">New Promo Rule</h4>
            <form onSubmit={handleCreatePromo} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                  Promo Code String
                </label>
                <input
                  required
                  placeholder="e.g. SUMMER50"
                  className="w-full px-3 py-2 border rounded text-sm font-mono uppercase"
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({ ...formData, code: e.target.value })
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                    Type
                  </label>
                  <select
                    className="w-full px-3 py-2 border rounded text-sm"
                    value={formData.discount_type}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        discount_type: e.target.value,
                      })
                    }
                  >
                    <option value="PERCENT">Percentage (%)</option>
                    <option value="FLAT">Flat Amount (€)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                    Value
                  </label>
                  <input
                    required
                    type="number"
                    step="0.01"
                    className="w-full px-3 py-2 border rounded text-sm"
                    value={formData.discount_value}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        discount_value: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                    Min Order (€)
                  </label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 border rounded text-sm"
                    value={formData.min_order_amount}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        min_order_amount: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                    Max Cap Amount (€)
                  </label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 border rounded text-sm"
                    placeholder="Optional"
                    value={formData.max_discount_amount}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        max_discount_amount: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                    Usage Limit
                  </label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 border rounded text-sm"
                    placeholder="Unlimited if empty"
                    value={formData.usage_limit}
                    onChange={(e) =>
                      setFormData({ ...formData, usage_limit: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                    Expiration Date
                  </label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border rounded text-sm"
                    value={formData.expires_at}
                    onChange={(e) =>
                      setFormData({ ...formData, expires_at: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-gray-200 rounded text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                >
                  Save Code
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REMOVE VERIFICATION MODAL */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full text-center">
            <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mx-auto mb-3">
              <TbTrash size={28} className="text-red-600" />
            </span>
            <h4 className="text-lg font-bold mb-2">Purge Promo Code</h4>
            <p className="text-gray-600 mb-4">
              Are you sure you want to delete this promotion? Historical
              checkout metrics linked here might be affected.
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
