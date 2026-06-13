// apps/admin/components/products/addproduct.tsx

"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import Select, { SingleValue } from "react-select";
import { Info, LifeBuoy, Figma, PlusCircle, X } from "react-feather";
import TextEditorNew from "@/core/common/texteditor/texteditor";
import { memo } from "react";

const MemoTextEditor = memo(TextEditorNew);

import Image from "next/image";
import Link from "next/link";

import { all_routes } from "@/data/all_routes";
import { useToast } from "@/core/ui";
import { useRouter } from "next/navigation";

/* ------------------ Types ------------------ */

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
};

type Subcategory = {
  id: number;
  category_id: number;
  name: string;
};

type Brand = {
  brand_id: number;
  name: string;
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

// ------------------ Utils ------------------

export function getThumb(url: string, size = 300) {
  return `${url}?w=${size}&h=${size}&fit=crop`;
}

export function generateSlug(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "") // remove symbols
    .replace(/\s+/g, "-") // spaces → hyphens
    .replace(/-+/g, "-"); // collapse hyphens
}

const generateSKU = (name: string, categoryId?: number | null) => {
  if (!name) return "";
  return `SKU-${categoryId ?? "X"}-${name
    .toUpperCase()
    .replace(/\s+/g, "-")
    .slice(0, 10)}-${Date.now().toString().slice(-4)}`;
};

const generateItemCode = (brandId?: number | null) => {
  return `ITEM-${brandId ?? "X"}-${Math.floor(1000 + Math.random() * 9000)}`;
};

// ⬆️ OUTSIDE AddProductComponent
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

function useDebounce<T>(value: T, delay = 400) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);

  return debounced;
}

export default function AddProductComponent({
  mode = "create",
  productId,
}: ProductFormProps) {
  const router = useRouter();

  const { showToast } = useToast();

  type FormErrors = Partial<Record<keyof typeof formData | "media", string>>;

  const [countries, setCountries] = useState<Countries[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [saving, setSaving] = useState(false);

  const [errors, setErrors] = useState<FormErrors>({});

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    sku: "",
    item_code: "",
    country_id: null as number | null,
    category_id: null as number | null,
    subcategory_id: null as number | null,
    brand_id: null as number | null,
    // country_of_origin: "fgdf",
    description: "",
    health_benefits: "",
    price: 0,
    quantity: 999999999,
    discount_type: "",
    discount_value: 0,
    status: 1,
  });

  // console.log(formData);
  // const [name, setName] = useState(formData.name);
  const [b2bPrices, setB2bPrices] = useState<TierPrice[]>([]);
  // const [images, setImages] = useState<ImageItem[]>([]);
  // const [imageInput, setImageInput] = useState("");
  // const [price, setPrice] = useState(formData.price);
  // const [quantity, setQuantity] = useState(formData.quantity);

  const [selectedMedia, setSelectedMedia] = useState<number[]>([]);
  const [primaryMedia, setPrimaryMedia] = useState<number | null>(null);

  const [mounted, setMounted] = useState(false);

  const [slugTouched, setSlugTouched] = useState(false);

  const handleChange = useCallback(
    (field: keyof typeof formData, value: any) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
    },
    [],
  );

  /* ------------------ Fetch Data ------------------ */
  useEffect(() => {
    fetch("/api/countries")
      .then((res) => res.json())
      .then((data) => setCountries(data));

    fetch("/api/category")
      .then((r) => r.json())
      .then((d) => setCategories(d.items || []));

    fetch("/api/subcategory")
      .then((r) => r.json())
      .then((d) => setSubcategories(d.items || []));

    fetch("/api/brand")
      .then((r) => r.json())
      .then((d) => setBrands(d.items || []));

    fetch("/api/media")
      .then((r) => r.json())
      .then((d) => setMedia(d || []));
  }, []);

  const discounttypeOption = [
    { value: "Percentage", label: "Percentage" },
    { value: "Cash", label: "Cash" },
  ];

  const [accordionOpen, setAccordionOpen] = useState(true);
  const [pricingOpen, setPricingOpen] = useState(true);
  const [imagesOpen, setImagesOpen] = useState(true);

  /* ------------------ Auto Generate ------------------ */
  const debouncedName = useDebounce(formData.name, 400);

  useEffect(() => {
    if (!debouncedName) return;

    setFormData((prev) => ({
      ...prev,
      sku: generateSKU(debouncedName, prev.category_id),
    }));
  }, [debouncedName, formData.category_id]);

  useEffect(() => {
    if (!debouncedName || slugTouched) return;

    setFormData((prev) => ({
      ...prev,
      slug: generateSlug(debouncedName),
    }));
  }, [debouncedName, slugTouched]);

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      item_code: generateItemCode(prev.brand_id),
    }));
  }, [formData.brand_id]);

  useEffect(() => {
    if (mode === "create") {
      setSlugTouched(false);
    }
  }, [mode]);

  // useEffect(() => {
  //   if (!discountType) {
  //     setValue("discount_value", null);
  //   }
  // }, [discountType]);

  useEffect(() => {
    if (!primaryMedia && selectedMedia.length > 0) {
      setPrimaryMedia(selectedMedia[0]);
    }
  }, [selectedMedia, primaryMedia]);

  useEffect(() => {
    setMounted(true);
  }, []);

  /* ------------------ Select Options ------------------ */
  // const countriesOptions: Option[] = countries.map((c) => ({
  //   value: c.id,
  //   label: c.name,
  // }));

  const countriesOptions = useMemo(
    () =>
      countries.map((c) => ({
        value: c.id,
        label: c.name,
      })),
    [countries],
  );

  const categoryOptions: Option[] = categories.map((c) => ({
    value: c.id,
    label: c.name,
  }));

  const brandOptions: Option[] = brands.map((b) => ({
    value: b.brand_id,
    label: b.name,
  }));

  const subcategoryOptions: Option[] = subcategories
    .filter((s) => s.category_id === formData.category_id)
    .map((s) => ({
      value: s.id,
      label: s.name,
    }));

  const selectedCountry =
    countriesOptions.find((c) => Number(c.value) === formData.country_id) ||
    null;

  const selectedCategory =
    categoryOptions.find((c) => c.value === formData.category_id) || null;

  const selectedSubcategory =
    subcategoryOptions.find((s) => s.value === formData.subcategory_id) || null;

  const selectedBrand =
    brandOptions.find((b) => b.value === formData.brand_id) || null;

  const validateForm = () => {
    const newErrors: FormErrors = {};

    // console.log("formData === ", formData);

    if (!formData.name.trim()) newErrors.name = "Product name is required";
    if (!formData.slug.trim()) newErrors.slug = "Slug is required";
    if (!formData.sku) newErrors.sku = "SKU is required";
    if (!formData.category_id) newErrors.category_id = "Category is required";

    if (!formData.subcategory_id)
      newErrors.subcategory_id = "Subcategory is required";

    if (!formData.brand_id) newErrors.brand_id = "Brand is required";
    if (!formData.item_code) newErrors.item_code = "Item code is required";
    if (!formData.price) newErrors.price = "Price is required";
    if (!formData.quantity) newErrors.quantity = "Quantity is required";

    if (selectedMedia.length === 0)
      newErrors.media = "At least one image is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

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

  /* ---------------- Discount ---------------- */

  const calculateSalePrice = () => {
    const { price, discount_type, discount_value } = formData;

    if (!discount_type || !discount_value) return price;

    if (discount_type === "percentage") {
      return price - (price * discount_value) / 100;
    }

    if (discount_type === "fixed") {
      return price - discount_value;
    }

    return price;
  };

  const salePrice = calculateSalePrice();

  // ------------------------------------
  //   Submit
  // ------------------------------------
  const handleSubmit = async () => {
    if (mode !== "view" && !validateForm()) {
      showToast("error", "Please fix validation errors"); //  errors
      return;
    }

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

      if (!res.ok) throw new Error("Product creation failed");

      const product = await res.json();

      // 2️⃣ Attach images
      // if (selectedMedia.length > 0) {
      await fetch(`/api/products/${product.id}/images`, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mediaIds: selectedMedia,
          primaryMediaId: primaryMedia,
        }),
      });
      // }

      showToast(
        "success",
        mode === "edit" ? "Product updated" : "Product created",
      );

      setTimeout(() => {
        router.push("/products");
      }, 3000);
    } catch (err) {
      console.error(err);
      showToast("error", "Action failed");
    } finally {
      setSaving(false);
    }
  };

  const mediaGrid = useMemo(() => {
    // If in view mode, only show selected media
    const itemsToRender =
      mode === "view"
        ? media.filter((item) => selectedMedia.includes(item.media_id))
        : media;

    // console.log("selectedMedia 2=== ", selectedMedia);
    // console.log("itemsToRender2 === ", itemsToRender);

    return itemsToRender.map((item) => {
      const isSelected = selectedMedia.includes(item.media_id);
      const isPrimary = primaryMedia === item.media_id;

      return (
        <div
          key={item.media_id}
          onClick={() => {
            if (mode === "edit") {
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

          {isSelected && mode === "edit" && (
            <div className="absolute inset-0 rounded bg-blue-500/10" />
          )}
        </div>
      );
    });
  }, [media, selectedMedia, primaryMedia, mode]);

  /* const mediaGrid = useMemo(() => {
    return media.map((item) => {
      const isSelected = selectedMedia.includes(item.media_id);
      const isPrimary = primaryMedia === item.media_id;

      return (
        <div
          key={item.media_id}
          onClick={() => {
            setSelectedMedia((prev) =>
              isSelected
                ? prev.filter((id) => id !== item.media_id)
                : [...prev, item.media_id],
            );
            if (!primaryMedia) setPrimaryMedia(item.media_id);
          }}
          className={`relative cursor-pointer rounded border bg-white p-1 transition ${isSelected ? "ring-2 ring-blue-500" : "hover:shadow-md"} `}
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

  
          {isSelected && (
            <div className="absolute inset-0 rounded bg-blue-500/10" />
          )}
        </div>
      );
    });
  }, [media, selectedMedia, primaryMedia]); */

  useEffect(() => {
    if (!productId || mode === "create") return;

    const fetchProduct = async () => {
      try {
        const res = await fetch(`/api/products/${productId}`);
        const data = await res.json();

        setFormData({
          name: data.name,
          slug: data.slug,
          sku: data.sku,
          item_code: data.item_code,
          country_id: data.country_id,
          category_id: data.category_id,
          subcategory_id: data.subcategory_id,
          brand_id: data.brand_id,
          // country_of_origin: data.country_of_origin,
          description: data.description,
          health_benefits: data.health_benefits,
          price: Number(data.price),
          quantity: Number(data.quantity),
          discount_type: data.discount_type,
          discount_value: Number(data.discount_value),
          status: data.status,
        });

        setSelectedMedia(data.images?.map((i: any) => i.media_id) || []);
        setPrimaryMedia(data.primary_media_id || null);
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

        <form
          className="space-y-6"
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
        >
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
                      type="text"
                      disabled={isView}
                      value={formData.name || ""}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      className="w-full border rounded p-2 focus:outline-none focus:ring focus:ring-blue-200"
                    />
                    {errors.name && (
                      <p className="text-sm text-red-600 mt-1">{errors.name}</p>
                    )}
                  </div>
                  <div>
                    <label className="block mb-1 font-medium">
                      Slug <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      disabled={isView}
                      value={formData.slug || ""}
                      onChange={(e) => {
                        setSlugTouched(true);
                        setFormData((prev) => ({
                          ...prev,
                          slug: generateSlug(e.target.value),
                        }));
                      }}
                      className="w-full border rounded p-2 focus:outline-none focus:ring focus:ring-blue-200"
                    />
                    {errors.slug && (
                      <p className="text-sm text-red-600 mt-1">{errors.slug}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="relative">
                    <label className="block mb-1 font-medium">
                      SKU <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      disabled={isView}
                      value={formData.sku || ""}
                      readOnly
                      className="w-full border rounded p-2 pr-20 bg-gray-100"
                    />
                    {errors.sku && (
                      <p className="text-red-600 text-sm">{errors.sku}</p>
                    )}
                  </div>

                  <div className="relative">
                    <label className="block mb-1 font-medium">
                      Item Code <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      disabled={isView}
                      value={formData.item_code || ""}
                      readOnly
                      className="w-full border rounded p-2 pr-20 bg-gray-100"
                    />
                    {errors.item_code && (
                      <p className="text-red-600 text-sm">{errors.item_code}</p>
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
                    <Select
                      classNamePrefix="react-select"
                      options={categoryOptions}
                      value={selectedCategory}
                      isDisabled={isView}
                      placeholder="Select Category"
                      onChange={(opt: SingleValue<Option>) =>
                        setFormData({
                          ...formData,
                          category_id: opt?.value ?? null,
                          subcategory_id: null,
                        })
                      }
                    />

                    {errors.category_id && (
                      <p className="text-sm text-red-600 mt-1">
                        {errors.category_id}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block mb-1 font-medium">
                      Sub Category <span className="text-red-500">*</span>
                    </label>
                    <Select
                      classNamePrefix="react-select"
                      options={subcategoryOptions}
                      value={selectedSubcategory}
                      placeholder="Select Subcategory"
                      isDisabled={!formData.category_id}
                      onChange={(opt: SingleValue<Option>) =>
                        setFormData({
                          ...formData,
                          subcategory_id: opt?.value ?? null,
                        })
                      }
                    />

                    {errors.subcategory_id && (
                      <p className="text-sm text-red-600 mt-1">
                        {errors.subcategory_id}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-1 font-medium">
                      Brand <span className="text-red-500">*</span>
                    </label>
                    <Select
                      classNamePrefix="react-select"
                      options={brandOptions}
                      value={selectedBrand}
                      isDisabled={isView}
                      placeholder="Select Brand"
                      onChange={(opt: SingleValue<Option>) =>
                        setFormData({
                          ...formData,
                          brand_id: opt?.value ?? null,
                        })
                      }
                    />
                    {errors.brand_id && (
                      <p className="text-sm text-red-600 mt-1">
                        {errors.brand_id}
                      </p>
                    )}
                  </div>

                  <div className="relative">
                    <label className="block mb-1 font-medium">
                      Country of Origin
                    </label>

                    <Select
                      classNamePrefix="react-select"
                      options={countriesOptions}
                      value={selectedCountry}
                      isDisabled={isView}
                      placeholder="Select Country"
                      onChange={(opt: SingleValue<Option>) =>
                        setFormData({
                          ...formData,
                          country_id: opt?.value ?? null,
                        })
                      }
                    />

                    <input
                      type="text"
                      disabled={isView}
                      // value={formData.country_of_origin || ""}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          country_of_origin: e.target.value,
                        }))
                      }
                      className="w-full border rounded p-2 pr-20"
                    />
                  </div>
                </div>

                <div>
                  <label className="block mb-1 font-medium">Description</label>

                  <MemoTextEditor
                    value={formData.description}
                    readOnly={isView}
                    onChange={(val: string) =>
                      setFormData((prev) => ({
                        ...prev,
                        description: val,
                      }))
                    }
                  />

                  <p className="text-gray-500 text-sm mt-1">Maximum 60 Words</p>
                </div>

                <div>
                  <label className="block mb-1 font-medium">
                    Health Benefits
                  </label>

                  <MemoTextEditor
                    value={formData.health_benefits}
                    readOnly={isView}
                    onChange={(val: string) =>
                      setFormData((prev) => ({
                        ...prev,
                        health_benefits: val,
                      }))
                    }
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
                      disabled={isView}
                      value={formData.quantity || 0}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          quantity: Number(e.target.value),
                        }))
                      }
                      className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                      placeholder="0"
                      min={0}
                      step="1"
                    />
                    {errors.quantity && (
                      <p className="text-red-600 text-sm">{errors.quantity}</p>
                    )}
                  </div> */}

                  <div>
                    <label className="block mb-1 text-sm font-medium">
                      Price <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      disabled={isView}
                      value={formData.price || 0}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          price: Number(e.target.value),
                        }))
                      }
                      className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                      placeholder="0.00"
                      min={0}
                      step="0.01"
                    />
                    {errors.price && (
                      <p className="text-red-600 text-sm">{errors.price}</p>
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
                      {b2bPrices.map((tier, index) => (
                        <tr key={index} className="border-t">
                          <td className="p-2">
                            <input
                              type="number"
                              className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
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
                              className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                              value={tier.price}
                              onChange={(e) =>
                                updateTier(
                                  index,
                                  "price",
                                  Number(e.target.value),
                                )
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-1 text-sm font-medium">
                      Discount Type
                    </label>
                    <Select
                      classNamePrefix="react-select"
                      isDisabled={isView}
                      options={discounttypeOption}
                      value={discounttypeOption.find(
                        (d) => d.value === formData.discount_type,
                      )}
                      onChange={(opt) =>
                        setFormData((prev) => ({
                          ...prev,
                          discounttype: opt?.value ?? null,
                        }))
                      }
                      placeholder="Choose"
                    />
                    {errors.discount_type && (
                      <p className="text-red-600 text-sm">
                        {errors.discount_type}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block mb-1 text-sm font-medium">
                      Discount Value
                    </label>
                    <input
                      type="number"
                      disabled={isView}
                      value={formData.discount_value || ""}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          discount_value: Number(e.target.value),
                        }))
                      }
                      className="w-full rounded border px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                      placeholder="0.00"
                      min={0}
                      step="0.01"
                    />
                    {errors.discount_value && (
                      <p className="text-red-600 text-sm">
                        {errors.discount_value}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm mb-1">
                      Final Sale Price
                    </label>
                    <input
                      className="w-full rounded border px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                      value={salePrice.toFixed(2)}
                      readOnly
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
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {mediaGrid}
              </div>

              {selectedMedia.length === 0 && (
                <p className="mt-4 text-sm text-gray-500">
                  Select at least one image for this product.
                </p>
              )}
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

{
  /* 
                  
                  <div className="grid grid-cols-3 gap-4 mt-4">
  <div>
    <label className="block text-sm mb-1">Discount Type</label>
    <select
      className="input"
      value={formData.discount_type}
      onChange={(e) =>
        setFormData({
          ...formData,
          discount_type: e.target.value,
        })
      }
    >
      <option value="">No Discount</option>
      <option value="percentage">Percentage (%)</option>
      <option value="fixed">Fixed Amount</option>
    </select>
  </div>

  <div>
    <label className="block text-sm mb-1">Discount Value</label>
    <input
      type="number"
      className="input"
      value={formData.discount_value}
      onChange={(e) =>
        setFormData({
          ...formData,
          discount_value: Number(e.target.value),
        })
      }
      disabled={!formData.discount_type}
    />
  </div>
</div>
                  */
}
