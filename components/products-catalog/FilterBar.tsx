// apps/admin/components/products-catalog/FilterBar.tsx

"use client";

import { useEffect, useState } from "react";

/* ------------------------------------
   Types
------------------------------------ */

type Countries = {
  id: number;
  name: string;
  iso2: string;
};

type Category = {
  id: string;
  name: string;
};

type Subcategory = {
  id: string;
  name: string;
  category_id: string;
};

type Brand = {
  brand_id: string;
  name: string;
};

type Filters = {
  search?: string;
  country?: string;
  category?: string;
  subcategory?: string;
  brand?: string;
  status?: string;
  sort?: string;
};

export default function FilterBar({
  onApply,
}: {
  onApply: (filters: Filters) => void;
}) {
  const [filters, setFilters] = useState<Filters>({});

  const [categories, setCategories] = useState<Category[]>([]);
  const [countries, setCountries] = useState<Countries[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);

  /* ------------------------------------
     Fetch Dropdown Data
  ------------------------------------ */
  useEffect(() => {
    fetch("/api/countries")
      .then((r) => r.json())
      .then((d) => setCountries(d || []));

    fetch("/api/category")
      .then((r) => r.json())
      .then((d) => setCategories(d.items || []));

    fetch("/api/subcategory")
      .then((r) => r.json())
      .then((d) => setSubcategories(d.items || []));

    fetch("/api/brand")
      .then((r) => r.json())
      .then((d) => setBrands(d.items || []));
  }, []);

  /* ------------------------------------
     Update Filter
  ------------------------------------ */
  const update = (key: keyof Filters, value: string) => {
    let updated = { ...filters, [key]: value };


    if (key === "category") {
      updated.subcategory = "";
    }

    setFilters(updated);
    onApply(updated);
  };

  /* ------------------------------------
     Derived Subcategories
  ------------------------------------ */
  const filteredSubcategories = filters.category
    ? subcategories.filter((s) => s.category_id === filters.category)
    : subcategories;

  return (
    <div className="flex flex-wrap gap-3 items-center">
      {/* 🔍 Search */}
      <input
        placeholder="Search products..."
        className="px-3 py-2 border rounded text-sm"
        onChange={(e) => update("search", e.target.value)}
      />


      <select
        className="px-3 py-2 border rounded text-sm"
        value={filters.category || ""}
        onChange={(e) => update("category", e.target.value)}
      >
        <option value="">All Categories</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>


      <select
        className="px-3 py-2 border rounded text-sm"
        value={filters.subcategory || ""}
        onChange={(e) => update("subcategory", e.target.value)}
        disabled={!filters.category}
      >
        <option value="">All Subcategories</option>
        {filteredSubcategories.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </select>


      <select
        className="px-3 py-2 border rounded text-sm"
        value={filters.brand || ""}
        onChange={(e) => update("brand", e.target.value)}
      >
        <option value="">All Brands</option>
        {brands.map((b) => (
          <option key={b.brand_id} value={b.brand_id}>
            {b.name}
          </option>
        ))}
      </select>

      <select
        className="px-3 py-2 border rounded text-sm"
        value={filters.country || ""}
        onChange={(e) => update("country", e.target.value)}
      >
        <option value="">All Countries</option>
        {countries.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>


      <select
        className="px-3 py-2 border rounded text-sm"
        value={filters.status || ""}
        onChange={(e) => update("status", e.target.value)}
      >
        <option value="">All Status</option>
        <option value="1">Active</option>
        <option value="0">Inactive</option>
      </select>


      <select
        className="px-3 py-2 border rounded text-sm"
        value={filters.sort || ""}
        onChange={(e) => update("sort", e.target.value)}
      >
        <option value="">Sort</option>
        <option value="name_asc">Name A-Z</option>
        <option value="name_desc">Name Z-A</option>
        <option value="price_asc">Price Low → High</option>
        <option value="price_desc">Price High → Low</option>
      </select>
    </div>
  );
}

/* "use client";

import { useState } from "react";

type Filters = {
  search?: string;
  category?: string;
  brand?: string;
  status?: string;
  sort?: string;
};

export default function FilterBar({
  onApply,
}: {
  onApply: (filters: Filters) => void;
}) {
  const [filters, setFilters] = useState<Filters>({});

  const update = (key: keyof Filters, value: string) => {
    const updated = { ...filters, [key]: value };
    setFilters(updated);
    onApply(updated);
  };

  return (
    <div className="flex flex-wrap gap-3">
      <input
        placeholder="Search products..."
        className="px-3 py-2 border rounded"
        onChange={(e) => update("search", e.target.value)}
      />

      <input
        placeholder="Category"
        className="px-3 py-2 border rounded"
        onChange={(e) => update("category", e.target.value)}
      />

      <input
        placeholder="Brand"
        className="px-3 py-2 border rounded"
        onChange={(e) => update("brand", e.target.value)}
      />

      <select
        className="px-3 py-2 border rounded"
        onChange={(e) => update("status", e.target.value)}
      >
        <option value="">All Status</option>
        <option value="1">Active</option>
        <option value="0">Inactive</option>
      </select>

      <select
        className="px-3 py-2 border rounded"
        onChange={(e) => update("sort", e.target.value)}
      >
        <option value="">Sort</option>
        <option value="name_asc">Name A-Z</option>
        <option value="name_desc">Name Z-A</option>
        <option value="price_asc">Price Low → High</option>
        <option value="price_desc">Price High → Low</option>
      </select>
    </div>
  );
} */