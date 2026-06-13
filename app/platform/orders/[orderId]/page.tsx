// apps/admin/app/platform/orders/[orderId]/page.tsx

import { requirePlatformAdmin } from "@/lib/auth/guards";
import OrderDetailsClient from "./OrderDetailsClient";

export default async function Page({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  await requirePlatformAdmin();

  const { orderId } = await params;

  return <OrderDetailsClient orderId={orderId} />;
}
