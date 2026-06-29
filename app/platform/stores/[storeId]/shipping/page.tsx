// app/platform/stores/[storeId]/shipping/page.tsx
import { redirect } from "next/navigation";

export default async function StoreShippingPage({
  params,
}: {
  params: Promise<{ storeId: string }>;
}) {
  const { storeId } = await params;
  redirect(`/platform/stores/${storeId}/shipping/providers`);
}
