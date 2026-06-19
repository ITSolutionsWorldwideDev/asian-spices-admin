// components/products/ProductForm.tsx

"use client";

import { memo } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import Select from "react-select";
import { Info, LifeBuoy, Figma, PlusCircle, X } from "react-feather";

import Image from "next/image";
import Link from "next/link";

import { useToast } from "@/core/ui";
import { useRouter } from "next/navigation";

import { useForm, Controller, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { productSchema } from "./FormSections/product.schema";

import TextEditorNew from "@/core/common/texteditor/texteditor";

import RHFSelect from "./FormSections/RHFSelect";

// const MemoTextEditor = memo(TextEditorNew);

/* ------------------ Types ------------------ */

type FormValues = any;

type Mode = "create" | "edit" | "view";

interface ProductFormProps {
  mode?: Mode;
  productId?: string;
}

type Countries = {
  id: number;
  name: string;
  iso2: string;
};

type Category = {
  id: number;
  name: string;
  slug: string;
};

type Subcategory = {
  id: number;
  category_id: number;
  name: string;
};

type Brand = {
  brand_id: number;
  name: string;
  slug: string;
};

type MediaItem = {
  media_id: number;
  file_name: string;
  file_url: string;
};

type Option = {
  value: number;
  label: string;
};

type TierPrice = {
  min_quantity: number;
  price: number;
};

type AssignedStores = {
  id: string;
  name: string;
  product_id: string;
};

// ------------------ Utils ------------------

export function getThumb(url: string, size = 300) {
  return `${url}?w=${size}&h=${size}&fit=crop`;
}

const getCodeFromSlug = (slug?: string) => {
  if (!slug) return "GEN";

  return slug
    .split("-")
    .map((word) => word.slice(0, 2))
    .join("")
    .toUpperCase()
    .slice(0, 6);
};

const generateSlug = (text: string) =>
  text
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");

const generateSKU = (
  name: string,
  categorySlug?: string,
  brandSlug?: string,
) => {
  const categoryCode = getCodeFromSlug(categorySlug);
  const brandCode = getCodeFromSlug(brandSlug);

  const namePart = name
    .replace(/[^a-zA-Z0-9]/g, "")
    .toUpperCase()
    .slice(0, 4);

  const random = Math.floor(1000 + Math.random() * 9000);

  return `${categoryCode}-${brandCode}-${namePart}-${random}`;
};

const generateItemCode = (name: string, brandSlug?: string) => {
  const brandCode = getCodeFromSlug(brandSlug);

  const namePart = name
    .replace(/[^a-zA-Z0-9]/g, "")
    .toUpperCase()
    .slice(0, 3);

  const random = Math.floor(1000 + Math.random() * 9000);

  return `IT-${brandCode}-${namePart}-${random}`;
};

const Accordion = memo(function Accordion({
  title,
  icon: Icon,
  open,
  onToggle,
  children,
}: {
  title: string;
  icon?: any;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="border rounded-md bg-white">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3"
      >
        <div className="flex items-center gap-2 font-medium text-gray-700">
          {Icon && <Icon size={18} />}
          {title}
        </div>
        <span>{open ? "−" : "+"}</span>
      </button>

      {open && <div className="border-t p-4">{children}</div>}
    </div>
  );
});

// ------------------ Component ------------------

export default function ProductFormComponent({
  mode = "create",
  productId,
}: ProductFormProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const slugTouched = useRef(false);

  const [countries, setCountries] = useState<Countries[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [saving, setSaving] = useState(false);

  const [b2bPrices, setB2bPrices] = useState<TierPrice[]>([]);
  const [selectedMedia, setSelectedMedia] = useState<number[]>([]);
  const [primaryMedia, setPrimaryMedia] = useState<number | null>(null);

  const [assignedStores, setassignedStores] = useState<AssignedStores[]>([]);

  const [mounted, setMounted] = useState(false);

  // ---------------- RHF ----------------

  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      slug: "",
      sku: "",
      item_code: "",
      category_id: null,
      subcategory_id: null,
      brand_id: null,
      country_ids: [],
      description: "",
      health_benefits: "",
      price: 0,
      quantity: 999999999,
      discount_type: null,
      discount_value: 0,
      status: 1,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "b2b_prices",
  });

  const formatFileName = (name: string) => {
    let cleaned = name.split("-").slice(1).join("-");
    if (!cleaned) cleaned = name;
    cleaned = cleaned.replace(/_/g, " ");
    return cleaned.length > 30 ? cleaned.slice(0, 30) + "..." : cleaned;
  };

  /* ---------------- Watchers ---------------- */

  const name = watch("name");
  const categoryId = watch("category_id");
  const brandId = watch("brand_id");

  const price = watch("price") || 0;
  const discountType = watch("discount_type");
  const discountValue = watch("discount_value") || 0;
  const promoDiscount = watch("promo_discount") || 0;

  useEffect(() => {
    if (!name || slugTouched.current) return;
    setValue("slug", generateSlug(name));
  }, [name]);

  useEffect(() => {
    if (!name) return;

    const category = categoryOptions.find((c) => c.value === categoryId);
    const brand = brandOptions.find((b) => b.value === brandId);

    const categorySlug = category?.slug;
    const brandSlug = brand?.slug;

    setValue("sku", generateSKU(name, categorySlug, brandSlug));
  }, [name, categoryId, brandId]);

  useEffect(() => {
    if (!name) return;
    const brand = brandOptions.find((b) => b.value === brandId);
    const brandSlug = brand?.slug;

    setValue("item_code", generateItemCode(name, brandSlug));
  }, [brandId]);

  useEffect(() => {
    if (!categoryId) {
      setValue("subcategory_id", null);
      return;
    }

    const validSubcategories = subcategories.filter(
      (s) => s.category_id === categoryId,
    );

    const currentSub = watch("subcategory_id");

    const exists = validSubcategories.some((s) => s.id === currentSub);

    if (!exists) {
      setValue("subcategory_id", null);
    }
  }, [categoryId, subcategories]);

  useEffect(() => {
    if (!discountType) {
      setValue("discount_value", null);
    }
  }, [discountType]);

  useEffect(() => {
    if (!primaryMedia && selectedMedia.length > 0) {
      setPrimaryMedia(selectedMedia[0]);
    }
  }, [selectedMedia, primaryMedia]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // ------------------ Fetch Data ------------------

  useEffect(() => {
    fetch("/api/category")
      .then((r) => r.json())
      .then((d) => setCategories(d.items || []));
    fetch("/api/subcategory")
      .then((r) => r.json())
      .then((d) => setSubcategories(d.items || []));
    fetch("/api/brand")
      .then((r) => r.json())
      .then((d) => setBrands(d.items || []));
    fetch("/api/countries")
      .then((r) => r.json())
      .then(setCountries);
  }, []);

  // const [page, setPage] = useState(1);
  // const [totalPages, setTotalPages] = useState(1);
  // const limit = 12;

  const [search, setSearch] = useState("");
const [debouncedSearch, setDebouncedSearch] = useState("");
const [page, setPage] = useState(1);
const [totalPages, setTotalPages] = useState(1);
const limit = 12;

// Debounce the input by 400ms to stop heavy re-fetching while a user types out words
useEffect(() => {
  const handler = setTimeout(() => {
    setDebouncedSearch(search);
    setPage(1); // Drop back to page 1 whenever search values actually change
  }, 400);

  return () => clearTimeout(handler);
}, [search]);


  useEffect(() => {
    // fetch(`/api/media?page=${page}&limit=${limit}`)
    //   .then((r) => r.json())
    fetch(`/api/media?page=${page}&limit=${limit}&search=${encodeURIComponent(debouncedSearch)}`)
    .then((r) => r.json())
      .then((d) => {
        const mediaArray = d.media || d.items || d.data || d;
        const fetchedMedia: MediaItem[] = Array.isArray(mediaArray)
          ? mediaArray
          : [];

        if (d.pagination) {
          setTotalPages(d.pagination.totalPages || 1);
        }

        // 🔥 SORTING & PREPENDING LOGIC:
        // Separate fetched items into selected and unselected categories
        const selectedInPayload = fetchedMedia.filter((item) =>
          selectedMedia.includes(item.media_id),
        );
        const unselectedInPayload = fetchedMedia.filter(
          (item) => !selectedMedia.includes(item.media_id),
        );

        // Put selected items first, followed by the rest of the page items
        let orderedMedia = [...selectedInPayload, ...unselectedInPayload];

        // 💡 EDGE CASE GUARD: If we are on page 1, double-check if any selected items
        // are missing from the current page payload (e.g., they were chosen from a deeper page).
        if (page === 1 && selectedMedia.length > 0) {
          const missingSelectedIds = selectedMedia.filter(
            (id) => !orderedMedia.some((item) => item.media_id === id),
          );

          if (missingSelectedIds.length > 0) {
            // Fetch the individual profiles of those missing assets so they don't look broken
            // Alternatively, if your project allows it, pass selectedMedia to your API to handle this server-side.
            console.warn(
              "Some selected media items live on subsequent pagination windows:",
              missingSelectedIds,
            );
          }
        }

        setMedia(orderedMedia);
      })
      .catch((err) =>
        console.error("Error setting media state grid array:", err),
      );
  }, [page, selectedMedia, debouncedSearch]);

  // ---------------- Options ----------------

  const toNumber = (val: any) => {
    const n = Number(val);
    return Number.isNaN(n) ? null : n;
  };

  const categoryOptions = useMemo(
    () =>
      categories.map((c) => ({
        value: c.id,
        label: c.name,
        slug: c.slug,
      })),
    [categories],
  );

  const subcategoryOptions = useMemo(() => {
    if (!categoryId) return [];

    return subcategories
      .filter((s) => s.category_id === categoryId) // ✅ string compare
      .map((s) => ({
        value: s.id,
        label: s.name,
      }));
  }, [subcategories, categoryId]);

  const brandOptions = useMemo(
    () =>
      brands.map((b) => ({
        value: b.brand_id,
        label: b.name,
        slug: b.slug,
      })),
    [brands],
  );

  const countryOptions = useMemo(
    () =>
      countries.map((c) => ({
        value: Number(c.id),
        label: c.name,
      })),
    [countries],
  );

  const [accordionOpen, setAccordionOpen] = useState(true);
  const [pricingOpen, setPricingOpen] = useState(true);
  const [storesOpen, setStoresOpen] = useState(true);
  const [imagesOpen, setImagesOpen] = useState(true);
  


  // ---------------- Discount ----------------

  const salePrice = useMemo(() => {
    let final = price;

    if (discountType === "percentage") {
      final = final - (final * discountValue) / 100;
    }

    if (discountType === "fixed") {
      final = final - discountValue;
    }

    // promo applies after discount
    if (promoDiscount) {
      final = final - promoDiscount;
    }

    return final > 0 ? final : 0;
  }, [price, discountType, discountValue, promoDiscount]);

  // ------------------------------------
  //   Submit
  // ------------------------------------

  const onSubmit = async (data: FormValues) => {
    if (selectedMedia.length === 0) {
      showToast("error", "Select at least one image");
      return;
    }

    try {
      setSaving(true);

      const cleanNaN = (obj: any) => {
        Object.keys(obj).forEach((key) => {
          if (Number.isNaN(obj[key])) {
            obj[key] = null;
          }
        });
        return obj;
      };

      const payload = cleanNaN({
        ...data,
        b2b_prices: b2bPrices,
      });

      const url =
        mode === "edit" ? `/api/products/${productId}` : `/api/products`;

      const method = mode === "edit" ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result?.detail || result?.error);
      }

      // const product = await res.json();

      const imgRes = await fetch(`/api/products/${result.id}/images`, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mediaIds: selectedMedia,
          primaryMediaId: primaryMedia,
        }),
      });

      if (!imgRes.ok) {
        const err = await imgRes.json();
        throw new Error(err?.detail || err?.error);
      }

      showToast("success", "Saved successfully");
      router.push("/products");
    } catch {
      showToast("error", "Failed");
    } finally {
      setSaving(false);
    }
  };

  const mediaGrid = useMemo(() => {
    // 1. Fallback to an empty array if media is undefined or null
    const safeMedia = Array.isArray(media) ? media : [];

    console.log("safeMedia === ", safeMedia);

    // If in view mode, only show selected media
    const itemsToRender =
      mode === "view"
        ? safeMedia.filter((item) => selectedMedia.includes(item.media_id))
        : safeMedia;

    // 2. Add an optional chaining check or rely on the safe fallback array
    return itemsToRender?.map((item) => {
      const displayName = formatFileName(item.file_name);
      const isSelected = selectedMedia.includes(item.media_id);
      const isPrimary = primaryMedia === item.media_id;

      return (
        <div
          key={item.media_id}
          onClick={() => {
            if (mode === "edit" || mode === "create") {
              setSelectedMedia((prev) =>
                isSelected
                  ? prev.filter((id) => id !== item.media_id)
                  : [...prev, item.media_id],
              );
              if (!primaryMedia) setPrimaryMedia(item.media_id);
            }
          }}
          className={`relative cursor-pointer rounded border bg-white p-1 transition ${
            isSelected ? "ring-2 ring-blue-500" : "hover:shadow-md"
          }`}
        >
          <Image
            src={getThumb(item.file_url, 200)}
            alt={item.file_name}
            width={200}
            height={200}
            className="rounded object-cover"
          />

          {/* Metadata labels row */}
          <p className="mt-2 text-xs font-medium text-gray-700 truncate px-0.5">
            {displayName}
          </p>

          {isPrimary && (
            <span className="absolute left-1 top-1 rounded bg-blue-600 px-2 py-0.5 text-xs text-white">
              Primary
            </span>
          )}

          {isSelected && (mode === "edit" || mode === "create") && (
            <div className="absolute inset-0 rounded bg-blue-500/10" />
          )}
        </div>
      );
    });
  }, [media, selectedMedia, primaryMedia, mode]);

  const safeNumber = (val: any) => {
    const n = Number(val);
    return Number.isNaN(n) ? null : n;
  };

  useEffect(() => {
    if (!productId || mode === "create") return;

    const fetchProduct = async () => {
      try {
        const res = await fetch(`/api/products/${productId}`);
        const data = await res.json();

        setValue("category_id", data.category_id || null);
        setValue("subcategory_id", data.subcategory_id || null);
        setValue("brand_id", data.brand_id || null);
        setValue("discount_type", data.discount_type || null);
        setValue("discount_value", data.discount_value || null);
        setValue("description", data.description || "");
        setValue("health_benefits", data.health_benefits || "");

        setValue(
          "country_ids",
          Array.isArray(data.country_ids)
            ? data.country_ids
                .map((id: any) => safeNumber(id))
                .filter((v: any) => v !== null)
            : [],
        );

        setValue("name", data.name || "");
        setValue("slug", data.slug || "");
        setValue("price", safeNumber(data.price) ?? 0);
        setValue("quantity", safeNumber(data.quantity) ?? 0);

        // console.log("data.images === ", data.images);

        setSelectedMedia(
          data.images
            ?.map((i: any) => Number(i.url))
            .filter((v: number) => !Number.isNaN(v)) || [],
        );

        setassignedStores(data.assignedStores || []);

        console.log("setassignedStores ==== ", data.assignedStores);

        // setPrimaryMedia(data.primary_media_id || null);
        const primary = data.images?.find((i: any) => i.is_primary);
        setPrimaryMedia(primary ? Number(primary.url) : null);
      } catch {
        showToast("error", "Failed to load product");
      }
    };

    fetchProduct();
  }, [productId, mode]);

  const isView = mode === "view";

  return (
    <div className="page-wrapper p-4 mb-10">
      <div className="content max-w-6xl mx-auto">
        <div className="flex flex-wrap justify-between items-center mb-6">
          <div>
            <h4 className="text-2xl font-semibold">
              {mode === "edit" || mode === "view" ? "Update/View" : "Create"}{" "}
              Product
            </h4>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="border rounded shadow-sm">
            <Accordion
              title="Product Information"
              icon={Info}
              open={accordionOpen}
              onToggle={() => setAccordionOpen(!accordionOpen)}
            >
              <div className="p-4 border-t space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-1 font-medium">
                      Product Name <span className="text-red-500">*</span>
                    </label>

                    <input
                      {...register("name")}
                      disabled={isView}
                      placeholder="Name"
                      className="w-full border rounded p-2 focus:outline-none focus:ring focus:ring-blue-200"
                    />
                    {errors.name && (
                      <p className="text-sm text-red-600 mt-1">
                        {errors.name.message as string}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block mb-1 font-medium">
                      Slug <span className="text-red-500">*</span>
                    </label>

                    <input
                      {...register("slug")}
                      onChange={(e) => {
                        slugTouched.current = true;
                        setValue("slug", generateSlug(e.target.value));
                      }}
                      disabled={isView}
                      className="w-full border rounded p-2 focus:outline-none focus:ring focus:ring-blue-200"
                    />

                    {errors.slug && (
                      <p className="text-sm text-red-600 mt-1">
                        {errors.slug.message as string}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="relative">
                    <label className="block mb-1 font-medium">
                      SKU <span className="text-red-500">*</span>
                    </label>
                    <input
                      {...register("sku")}
                      readOnly
                      className="w-full border rounded p-2 focus:outline-none focus:ring focus:ring-blue-200"
                    />

                    {errors.sku && (
                      <p className="text-red-600 text-sm">
                        {errors.sku.message as string}
                      </p>
                    )}
                  </div>

                  <div className="relative">
                    <label className="block mb-1 font-medium">
                      Item Code <span className="text-red-500">*</span>
                    </label>
                    <input
                      {...register("item_code")}
                      readOnly
                      className="w-full border rounded p-2 focus:outline-none focus:ring focus:ring-blue-200"
                    />

                    {errors.item_code && (
                      <p className="text-red-600 text-sm">
                        {errors.item_code.message as string}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col">
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-medium">
                        Category <span className="text-red-500">*</span>
                      </label>
                    </div>

                    <RHFSelect
                      name="category_id"
                      control={control}
                      options={categoryOptions}
                      placeholder="Select Category"
                      isDisabled={isView}
                    />

                    {errors.category_id && (
                      <p className="text-sm text-red-600 mt-1">
                        {errors.category_id.message as string}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block mb-1 font-medium">
                      Sub Category <span className="text-red-500">*</span>
                    </label>

                    <RHFSelect
                      name="subcategory_id"
                      control={control}
                      options={subcategoryOptions}
                      placeholder="Select Subcategory"
                      isDisabled={!categoryId || isView}
                    />
                    {errors.subcategory_id && (
                      <p className="text-sm text-red-600 mt-1">
                        {errors.subcategory_id.message as string}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-1 font-medium">
                      Brand <span className="text-red-500">*</span>
                    </label>

                    <RHFSelect
                      name="brand_id"
                      control={control}
                      options={brandOptions}
                      placeholder="Select Brand"
                      isDisabled={isView}
                    />
                    {errors.brand_id && (
                      <p className="text-sm text-red-600 mt-1">
                        {errors.brand_id.message as string}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block mb-1 font-medium">
                      Available in Countries{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <RHFSelect
                      name="country_ids"
                      control={control}
                      options={countryOptions}
                      isMulti
                      isDisabled={isView}
                    />
                    {/* <Controller
                      control={control}
                      name="country_ids"
                      render={({ field }) => (
                        <Select
                          isMulti
                          options={countryOptions}
                          value={countryOptions.filter((c) =>
                            field.value?.includes(c.value),
                          )}
                          onChange={(selected) =>
                            field.onChange(
                              selected
                                ? selected.map((s) => Number(s.value))
                                : [],
                            )
                          }
                          isDisabled={isView}
                        />
                      )}
                    /> */}
                  </div>
                </div>

                <div>
                  <label className="block mb-1 font-medium">Description</label>

                  <Controller
                    control={control}
                    name="description"
                    render={({ field }) => (
                      <TextEditorNew
                        value={field.value}
                        onChange={field.onChange}
                      />
                    )}
                    disabled={isView}
                  />

                  <p className="text-gray-500 text-sm mt-1">Maximum 60 Words</p>
                </div>

                <div>
                  <label className="block mb-1 font-medium">
                    Health Benefits
                  </label>

                  <Controller
                    control={control}
                    name="health_benefits"
                    render={({ field }) => (
                      <TextEditorNew
                        value={field.value}
                        onChange={field.onChange}
                      />
                    )}
                    disabled={isView}
                  />
                </div>
              </div>
            </Accordion>

            <Accordion
              title="Pricing & Stocks"
              icon={LifeBuoy}
              open={pricingOpen}
              onToggle={() => setPricingOpen(!pricingOpen)}
            >
              <div className="p-4 border-t space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* <div>
                    <label className="block mb-1 text-sm font-medium">
                      Quantity <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      {...register("quantity", { valueAsNumber: true })}
                      placeholder="0"
                      min={0}
                      step="1"
                      disabled={isView}
                      className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                    />

                    {errors.quantity && (
                      <p className="text-red-600 text-sm">
                        {errors.quantity.message as string}
                      </p>
                    )}
                  </div> */}

                  <div>
                    <label className="block mb-1 text-sm font-medium">
                      Price <span className="text-red-500">*</span>
                    </label>

                    <input
                      type="number"
                      {...register("price", { valueAsNumber: true })}
                      placeholder="0.00"
                      min={0}
                      step="0.01"
                      disabled={isView}
                      className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                    />
                    {errors.price && (
                      <p className="text-red-600 text-sm">
                        {errors.price.message as string}
                      </p>
                    )}
                  </div>
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

                  <button
                    type="button"
                    className="mt-3 px-4 py-2 bg-gray-200 rounded"
                    onClick={() => append({ min_quantity: 1, price: 0 })}
                  >
                    Add Tier
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-1 text-sm font-medium">
                      Discount Type
                    </label>
                    <RHFSelect
                      name="discount_type"
                      control={control}
                      options={[
                        { value: "percentage", label: "Percentage (%)" },
                        { value: "fixed", label: "Fixed Amount" },
                      ]}
                      isDisabled={isView}
                    />

                    {errors.discount_type && (
                      <p className="text-sm text-red-600 mt-1">
                        {errors.discount_type.message as string}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block mb-1 text-sm font-medium">
                      Discount Value
                    </label>

                    <input
                      type="number"
                      {...register("discount_value")}
                      className="w-full rounded border px-3 py-2 text-sm"
                      placeholder="0.00"
                      min={0}
                      disabled={isView}
                    />
                    {errors.discount_value && (
                      <p className="text-sm text-red-600 mt-1">
                        {errors.discount_value.message as string}
                      </p>
                    )}
                  </div>
                  {/* , { valueAsNumber: true } */}

                  {/* Promo Code */}
                  <div>
                    <label className="block mb-1 text-sm font-medium">
                      Promo Code
                    </label>

                    <input
                      type="text"
                      {...register("promo_code")}
                      placeholder="e.g. SAVE10"
                      className="w-full rounded border px-3 py-2 text-sm"
                      disabled
                      // disabled={isView}
                    />
                    {errors.promo_code && (
                      <p className="text-sm text-red-600 mt-1">
                        {errors.promo_code.message as string}
                      </p>
                    )}
                  </div>

                  {/* Promo Discount */}
                  <div>
                    <label className="block mb-1 text-sm font-medium">
                      Promo Discount
                    </label>

                    <input
                      type="number"
                      {...register("promo_discount")} // , { valueAsNumber: true }
                      placeholder="0.00"
                      className="w-full rounded border px-3 py-2 text-sm"
                      disabled={isView}
                    />
                    {errors.promo_discount && (
                      <p className="text-sm text-red-600 mt-1">
                        {errors.promo_discount.message as string}
                      </p>
                    )}
                  </div>

                  {/* Final Price */}
                  <div>
                    <label className="block text-sm mb-1">
                      Final Sale Price
                    </label>

                    <input
                      value={salePrice.toFixed(2)}
                      readOnly
                      className="w-full rounded border px-3 py-2 text-sm bg-gray-100"
                      disabled={isView}
                    />
                  </div>
                </div>
              </div>
            </Accordion>
            <Accordion
              title="Images"
              icon={Figma}
              open={imagesOpen}
              onToggle={() => setImagesOpen(!imagesOpen)}
            >

              {/* 🔍 SEARCH FIELD */}
  {mode !== "view" && (
    <div className="mb-5 max-w-md">
      <label htmlFor="image-search" className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
        Search Gallery By Name
      </label>
      <div className="relative rounded-md shadow-sm">
        <input
          id="image-search"
          type="text"
          placeholder="Type image name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-3 pr-10 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch("")}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={16} />
          </button>
        )}
      </div>
    </div>
  )}

  {/* 🖼️ IMAGE GRID */}
  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
    {media.length > 0 ? (
      mediaGrid
    ) : (
      <div className="col-span-full py-8 text-center text-sm text-gray-400 border border-dashed border-gray-200 rounded">
        No images found matching "{search}"
      </div>
    )}
  </div>

  {/* 🚀 PAGINATION FOOTER CONTROL PANEL */}
  {mode !== "view" && totalPages > 1 && (
    <div className="flex items-center justify-between border-t border-gray-100 mt-6 pt-4 text-sm">
      <span className="text-gray-500">
        Page <strong>{page}</strong> of <strong>{totalPages}</strong>
      </span>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={page === 1}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          className="px-3 py-1.5 border border-gray-200 rounded text-gray-700 font-medium bg-white hover:bg-gray-50 disabled:opacity-50 transition"
        >
          Previous
        </button>
        <button
          type="button"
          disabled={page === totalPages}
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          className="px-3 py-1.5 border border-gray-200 rounded text-gray-700 font-medium bg-white hover:bg-gray-50 disabled:opacity-50 transition"
        >
          Next
        </button>
      </div>
    </div>
  )}

  {selectedMedia.length === 0 && (
    <p className="mt-4 text-sm text-gray-500">
      Select at least one image for this product.
    </p>
  )}



              {/* <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                
                {mediaGrid}
              </div>

             
              {mode !== "view" && totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-gray-100 mt-6 pt-4 text-sm">
                  <span className="text-gray-500">
                    Page <strong>{page}</strong> of{" "}
                    <strong>{totalPages}</strong>
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={page === 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      className="px-3 py-1.5 border border-gray-200 rounded text-gray-700 font-medium bg-white hover:bg-gray-50 disabled:opacity-50 transition"
                    >
                      Previous
                    </button>
                    <button
                      type="button"
                      disabled={page === totalPages}
                      onClick={() =>
                        setPage((p) => Math.min(totalPages, p + 1))
                      }
                      className="px-3 py-1.5 border border-gray-200 rounded text-gray-700 font-medium bg-white hover:bg-gray-50 disabled:opacity-50 transition"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}

              {selectedMedia.length === 0 && (
                <p className="mt-4 text-sm text-gray-500">
                  Select at least one image for this product.
                </p>
              )} */}
               
            </Accordion>

            <Accordion
              title={`Assigned Stores (${assignedStores.length})`}
              icon={LifeBuoy}
              open={storesOpen}
              onToggle={() => setStoresOpen(!storesOpen)}
            >
              <div className="p-4">
                {assignedStores.length === 0 ? (
                  <p className="text-gray-500">No stores assigned.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {assignedStores.map((store) => (
                      <div
                        key={store.id}
                        className="flex items-center gap-3 p-3 rounded-lg border bg-white shadow-sm hover:shadow-md transition"
                      >
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <LifeBuoy size={18} className="text-blue-600" />
                        </div>

                        <div>
                          <p className="font-semibold">{store.name}</p>
                          <p className="text-xs text-gray-500">
                            Assigned Store
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* <div className="p-4 border-t space-y-4">
                <ul className="space-y-3">
                  {assignedStores?.map((store) => (
                    <li
                      key={store.id}
                      className="flex items-center gap-3 rounded-lg border border-gray-200 p-3"
                    >
                      <div className="h-3 w-3 rounded-full bg-green-500"></div>

                      <div className="flex-1">
                        <p className="font-medium">{store.name}</p>
                      </div>

                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                        Assigned
                      </span>
                    </li>
                  ))}
                </ul>
              </div> */}
            </Accordion>
          </div>

          <div className="flex justify-end gap-3 my-4">
            <Link href="/products" className="btn btn-secondary">
              Cancel
            </Link>
            {mode !== "view" && (
              <button
                disabled={saving}
                className="bg-blue-600 text-white px-6 py-2 rounded"
              >
                {saving
                  ? "Saving..."
                  : mode === "edit"
                    ? "Update Product"
                    : "Add Product"}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}


/*
  const discountOptions = [
    { value: "percentage", label: "Percentage (%)" },
    { value: "fixed", label: "Fixed Amount" },
  ];

  // ---------------- B2B ----------------

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
*/

// 👇 UPDATE THIS LINE TO EXTRACT THE ARRAY SAFELY 👇
/* fetch("/api/media")
      .then((r) => r.json())
      .then((d) => {
        console.log("Raw API Response structure (d) === ", d);
        console.log("Target paginated media array (d.media) === ", d.media);

        // 🚀 Update: Extracts from d.media to align with your API pagination wrapper
        const mediaArray = d.media || d.items || d.data || d;

        setMedia(Array.isArray(mediaArray) ? mediaArray : []);
      })
      .catch((err) =>
        console.error("Error setting media state grid array:", err),
      );*/

/* const mediaGrid = useMemo(() => {
    // If in view mode, only show selected media
    const itemsToRender =
      mode === "view"
        ? media.filter((item) => selectedMedia.includes(item.media_id))
        : media;

    return itemsToRender.map((item) => {
      const isSelected = selectedMedia.includes(item.media_id);
      const isPrimary = primaryMedia === item.media_id;

      return (
        <div
          key={item.media_id}
          onClick={() => {
            if (mode === "edit" || mode === "create") {
              setSelectedMedia((prev) =>
                isSelected
                  ? prev.filter((id) => id !== item.media_id)
                  : [...prev, item.media_id],
              );
              if (!primaryMedia) setPrimaryMedia(item.media_id);
            }
          }}
          className={`relative cursor-pointer rounded border bg-white p-1 transition ${
            isSelected ? "ring-2 ring-blue-500" : "hover:shadow-md"
          }`}
        >
          <Image
            src={getThumb(item.file_url, 200)}
            alt={item.file_name}
            width={200}
            height={200}
            className="rounded object-cover"
          />

          {isPrimary && (
            <span className="absolute left-1 top-1 rounded bg-blue-600 px-2 py-0.5 text-xs text-white">
              Primary
            </span>
          )}

          {isSelected && (mode === "edit" || mode === "create") && (
            <div className="absolute inset-0 rounded bg-blue-500/10" />
          )}
        </div>
      );
    });
  }, [media, selectedMedia, primaryMedia, mode]); */
