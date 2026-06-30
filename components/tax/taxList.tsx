// components/tax/taxList.tsx

"use client";

import { useEffect, useState } from "react";
import Table from "@/core/common/pagination/datatable";
import { Edit, Percent, Trash2 } from "react-feather";
import { TbCirclePlus } from "react-icons/tb";
import { useToast } from "@/core/ui";

type TaxRule = {
  id: string;
  country_code: string;
  tax_name: string;
  tax_rate: string;
  is_active: boolean;
  category_id: string | null;
};

type Category = { id: string; name: string };
type Country = { id: string; name: string; iso2: string; emoji: string };

export default function TaxListComponent() {
  const [rules, setRules] = useState<TaxRule[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);

  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    id: null as string | null,
    country_code: "",
    tax_name: "VAT",
    tax_rate: "",
    is_active: true,
    category_id: "" as string, // ✅ single category reference assignment
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [taxRes, catRes, countryRes] = await Promise.all([
        fetch("/api/tax-rules"),
        fetch("/api/category"),
        fetch("/api/countries"),
      ]);
      const taxData = await taxRes.json();
      const catData = await catRes.json();
      const countryData = await countryRes.json();

      setRules(taxData.items || []);
      setCategories(catData.items || []);
      setCountries(Array.isArray(countryData) ? countryData : []);
    } catch (err) {
      showToast("error", "Failed to resolve engine parameters");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openAddModal = () => {
    setIsEditMode(false);
    setFormData({
      id: null,
      country_code: "",
      tax_name: "VAT",
      tax_rate: "",
      is_active: true,
      category_id: "",
    });
    setIsModalOpen(true);
  };

  const openEditModal = (record: TaxRule) => {
    setIsEditMode(true);
    setFormData({
      id: record.id,
      country_code: record.country_code,
      tax_name: record.tax_name,
      tax_rate: record.tax_rate,
      is_active: record.is_active,
      category_id: record.category_id || "",
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (
      !confirm(
        "Are you absolute sure you want to delete this tax rule configuration record?",
      )
    )
      return;
    try {
      const res = await fetch(`/api/tax-rules?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      showToast("success", "Tax structure rule removed successfully");
      fetchData();
    } catch (err) {
      showToast("error", "Failed to delete target tax configuration profile");
    }
  };

  const handleSubmit = async () => {
    try {
      const payload = {
        ...formData,
        category_id: formData.category_id || null // Ensure clean value pass
      };
      
      const res = await fetch("/api/tax-rules", {
        method: isEditMode ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      // 🌟 Extract the custom error payload if response isn't OK
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to preserve tax parameters");
      }

      showToast(
        "success",
        isEditMode ? "Tax structure updated" : "Tax entry initialized",
      );
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      // 🌟 Pass the exact message to your toast system
      showToast("error", err.message || "An unexpected error occurred");
    }
  };

  const columns = [
    {
      title: "Country",
      render: (_: any, r: TaxRule) => {
        const countryObj = countries.find((c) => c.iso2 === r.country_code);
        return (
          <span className="font-medium flex items-center gap-1.5">
            <span>{countryObj?.emoji || "🌐"}</span>
            <span>{countryObj ? countryObj.name : r.country_code}</span>
          </span>
        );
      },
    },
    { title: "Tax Type", dataIndex: "tax_name" },
    {
      title: "Percentage",
      render: (_: any, r: TaxRule) => <span>{r.tax_rate}%</span>,
    },
    {
      title: "Linked Category",
      render: (_: any, r: TaxRule) => {
        const matchedCategory = categories.find(
          (cat) => cat.id === r.category_id,
        );
        return (
          <span className="text-sm font-medium text-gray-700">
            {matchedCategory ? (
              matchedCategory.name
            ) : (
              <span className="text-gray-400 italic">
                Global System Baseline
              </span>
            )}
          </span>
        );
      },
    },
    {
      title: "Status",
      render: (_: any, r: TaxRule) =>
        r.is_active ? (
          <span className="text-green-600 font-medium">Active</span>
        ) : (
          <span className="text-red-600 font-medium">Disabled</span>
        ),
    },
    {
      title: "Action",
      render: (_: any, r: TaxRule) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => openEditModal(r)}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded transition"
          >
            <Edit size={16} />
          </button>
          <button
            onClick={() => handleDelete(r.id)}
            className="p-2 text-red-600 hover:bg-red-50 rounded transition"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h4 className="text-lg font-semibold">Tax Framework Manager</h4>
            <h6 className="text-gray-500">
              Manage country-specific taxation profiles rules
            </h6>
          </div>
          <button
            onClick={openAddModal}
            className="flex items-center gap-1 px-4 py-2 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 transition"
          >
            <TbCirclePlus size={18} /> Add Tax Rule
          </button>
        </div>

        <div className="card bg-white p-4 shadow rounded">
          {loading ? (
            <p className="text-center py-12 text-gray-400 animate-pulse">
              Loading tax parameters...
            </p>
          ) : (
            <Table columns={columns} dataSource={rules} rowKey="id" />
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded w-full max-w-xl p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4 text-gray-900">
              {isEditMode ? "Modify Tax Scope" : "Initialize New Tax Scope"}
            </h3>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">
                  Country
                </label>
                <select
                  disabled={isEditMode}
                  value={formData.country_code}
                  onChange={(e) =>
                    setFormData({ ...formData, country_code: e.target.value })
                  }
                  className="w-full border rounded px-3 py-2 bg-white disabled:bg-gray-100 h-[42px] border-gray-300"
                >
                  <option value="">Select Country Location...</option>
                  {countries.map((country) => (
                    <option key={country.id} value={country.iso2}>
                      {country.emoji} {country.name} ({country.iso2})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">
                  Tax Code Name
                </label>
                <input
                  type="text"
                  placeholder="VAT / IVA / MwSt"
                  value={formData.tax_name}
                  onChange={(e) =>
                    setFormData({ ...formData, tax_name: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded px-3 py-2 h-[42px]"
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-1 text-gray-700">
                Tax Percentage (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  placeholder="21.00"
                  value={formData.tax_rate}
                  onChange={(e) =>
                    setFormData({ ...formData, tax_rate: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded px-3 py-2 pr-8 h-[42px]"
                />
                <Percent
                  size={14}
                  className="absolute right-3 top-3.5 text-gray-400"
                />
              </div>
            </div>

            {/* ✅ Swapped Multi Checkbox Layout to Single Target Dropdown Menu Select */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1 text-gray-700">
                Apply to Category Scope
              </label>
              <select
                value={formData.category_id}
                onChange={(e) =>
                  setFormData({ ...formData, category_id: e.target.value })
                }
                className="w-full border border-gray-300 rounded px-3 py-2 bg-white h-[42px]"
              >
                <option value="">
                  Global System Rule (Applies to all products without custom
                  rules)
                </option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <label className="flex items-center gap-2 mb-6 cursor-pointer select-none text-sm font-medium text-gray-700">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) =>
                  setFormData({ ...formData, is_active: e.target.checked })
                }
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
              />
              Rule is active and available at checkout
            </label>

            <div className="flex justify-end gap-2 border-t pt-4 border-gray-100">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded text-gray-700 transition font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition font-medium"
              >
                Save Configuration
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* "use client";

import { useEffect, useState } from "react";
import Table from "@/core/common/pagination/datatable";
import { Edit, Percent } from "react-feather";
import { TbCirclePlus } from "react-icons/tb";
import { useToast } from "@/core/ui";

type TaxRule = {
  id: string;
  country_code: string;
  tax_name: string;
  tax_rate: string;
  is_active: boolean;
  assigned_categories: string[];
};

type Category = { id: string; name: string };

type Country = {
  id: string;
  name: string;
  iso2: string;
  emoji: string;
};

export default function TaxListComponent() {
  const [rules, setRules] = useState<TaxRule[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);

  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    id: null as string | null,
    country_code: "",
    tax_name: "VAT",
    tax_rate: "",
    is_active: true,
    assigned_categories: [] as string[],
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [taxRes, catRes, countryRes] = await Promise.all([
        fetch("/api/tax-rules"),
        fetch("/api/category"),
        fetch("/api/countries")
      ]);
      const taxData = await taxRes.json();
      const catData = await catRes.json();
      const countryData = await countryRes.json();

      setRules(taxData.items || []);
      setCategories(catData.items || []);
      setCountries(Array.isArray(countryData) ? countryData : []);
    } catch (err) {
      showToast("error", "Failed to resolve engine parameters");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openAddModal = () => {
    setIsEditMode(false);
    setFormData({
      id: null,
      country_code: "",
      tax_name: "VAT",
      tax_rate: "",
      is_active: true,
      assigned_categories: [],
    });
    setIsModalOpen(true);
  };

  const openEditModal = (record: TaxRule) => {
    setIsEditMode(true);
    setFormData({
      id: record.id,
      country_code: record.country_code,
      tax_name: record.tax_name,
      tax_rate: record.tax_rate,
      is_active: record.is_active,
      assigned_categories: record.assigned_categories,
    });
    setIsModalOpen(true);
  };

  const handleCategoryToggle = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      assigned_categories: prev.assigned_categories.includes(id)
        ? prev.assigned_categories.filter((item) => item !== id)
        : [...prev.assigned_categories, id],
    }));
  };

  const handleSubmit = async () => {
    try {
      const res = await fetch("/api/tax-rules", {
        method: isEditMode ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error();
      showToast(
        "success",
        isEditMode ? "Tax structure updated" : "Tax entry initialized",
      );
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      showToast("error", "Failed to preserve tax parameters");
    }
  };

  const columns = [
    { 
      title: "Country", 
      render: (_: any, r: TaxRule) => {
        // Find matching country to display name & emoji inside table row rows
        const countryObj = countries.find(c => c.iso2 === r.country_code);
        return (
          <span className="font-medium flex items-center gap-1.5">
            <span>{countryObj?.emoji || "🌐"}</span>
            <span>{countryObj ? countryObj.name : r.country_code}</span>
          </span>
        );
      }
    },
    { title: "Tax Type", dataIndex: "tax_name" },
    {
      title: "Percentage",
      render: (_: any, r: TaxRule) => <span>{r.tax_rate}%</span>,
    },
    {
      title: "Linked Categories",
      render: (_: any, r: TaxRule) => (
        <span className="text-xs text-gray-500">
          {r.assigned_categories.length === 0
            ? "None"
            : `${r.assigned_categories.length} Category Rules Connected`}
        </span>
      ),
    },
    {
      title: "Status",
      render: (_: any, r: TaxRule) =>
        r.is_active ? (
          <span className="text-green-600 font-medium">Active</span>
        ) : (
          <span className="text-red-600 font-medium">Disabled</span>
        ),
    },
    {
      title: "Action",
      render: (_: any, r: TaxRule) => (
        <button onClick={() => openEditModal(r)} className="p-2 text-blue-600">
          <Edit size={16} />
        </button>
      ),
    },
  ];

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h4 className="text-lg font-semibold">Tax Framework Manager</h4>
            <h6 className="text-gray-500">
              Manage country-specific taxation rules
            </h6>
          </div>
          <button
            onClick={openAddModal}
            className="flex items-center gap-1 px-4 py-2 bg-blue-600 text-white rounded"
          >
            <TbCirclePlus size={18} /> Add Tax Rule
          </button>
        </div>

        <div className="card bg-white p-4 shadow rounded">
          {loading ? (
            <p className="text-center py-12">Loading tax parameters...</p>
          ) : (
            <Table columns={columns} dataSource={rules} rowKey="id" />
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded w-full max-w-xl p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">
              {isEditMode ? "Modify Tax Scope" : "Initialize New Tax Scope"}
            </h3>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-1">Country</label>
                <select
                  disabled={isEditMode}
                  value={formData.country_code}
                  onChange={(e) => setFormData({ ...formData, country_code: e.target.value })}
                  className="w-full border rounded px-3 py-2 bg-white disabled:bg-gray-100 h-[42px]"
                >
                  <option value="">Select Country Location...</option>
                  {countries.map((country) => (
                    <option key={country.id} value={country.iso2}>
                      {country.emoji} {country.name} ({country.iso2})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Tax Code Name
                </label>
                <input
                  type="text"
                  placeholder="VAT / IVA / MwSt"
                  value={formData.tax_name}
                  onChange={(e) =>
                    setFormData({ ...formData, tax_name: e.target.value })
                  }
                  className="w-full border rounded px-3 py-2"
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">
                Tax Percentage (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  placeholder="21.00"
                  value={formData.tax_rate}
                  onChange={(e) =>
                    setFormData({ ...formData, tax_rate: e.target.value })
                  }
                  className="w-full border rounded px-3 py-2 pr-8"
                />
                <Percent
                  size={14}
                  className="absolute right-3 top-3 text-gray-400"
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                Apply to Categories
              </label>
              <div className="border rounded p-3 max-h-40 overflow-y-auto bg-gray-50 grid grid-cols-2 gap-2">
                {categories.map((cat) => (
                  <label
                    key={cat.id}
                    className="flex items-center gap-2 text-sm cursor-pointer p-1 hover:bg-white rounded"
                  >
                    <input
                      type="checkbox"
                      checked={formData.assigned_categories.includes(cat.id)}
                      onChange={() => handleCategoryToggle(cat.id)}
                      className="rounded text-blue-600"
                    />
                    {cat.name}
                  </label>
                ))}
              </div>
            </div>

            <label className="flex items-center gap-2 mb-6">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) =>
                  setFormData({ ...formData, is_active: e.target.checked })
                }
              />
              Rule is active and available at checkout
            </label>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 bg-gray-200 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="px-4 py-2 bg-blue-600 text-white rounded"
              >
                Save Configuration
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} */
