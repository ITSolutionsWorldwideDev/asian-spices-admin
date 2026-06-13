// ✅ apps/admin/app/platform/stores/[storeId]/shipping/layout.tsx

import ShippingTabs from "@/components/shipping/store/ShippingTabs";

export default async function ShippingLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ storeId: string }>;
}) {
  const { storeId } = await params;

  return (
    <div className="mx-auto">
      <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm space-y-6">
        <ShippingTabs storeId={storeId} />
        {children}
      </div>
    </div>
  );
}
