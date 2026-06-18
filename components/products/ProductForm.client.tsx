// components/products/ProductForm.client.tsx

"use client";

import dynamic from "next/dynamic";

const ProductFormComponent = dynamic(
  () => import("./ProductForm"),
  {
    ssr: false,
    loading: () => <p>Loading product form...</p>,
  }
);

export default ProductFormComponent;