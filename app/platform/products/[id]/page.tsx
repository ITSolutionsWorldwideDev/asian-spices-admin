// app/platform/products/[id]/page.tsx

import ProductFormComponent from "@/components/products/ProductForm.client";

interface ViewProductPageProps {
  params: Promise<{ id: string }>;
}

export default async function ViewProduct({ params }: ViewProductPageProps) {
  const { id } = await params;

  return <ProductFormComponent mode="view" productId={id} />;
}
