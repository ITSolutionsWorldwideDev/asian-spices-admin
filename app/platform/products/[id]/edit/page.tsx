// app/platform/products/[id]/edit/page.tsx

import ProductFormComponent from "@/components/products/ProductForm.client";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditProduct({ params }: PageProps) {
  const { id } = await params;

  return <ProductFormComponent mode="edit" productId={id} />;
}
