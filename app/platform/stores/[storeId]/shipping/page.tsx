// apps/admin/app/platform/stores/[storeId]/shipping/page.tsx

// import { pool } from "@/core/db";
// import { requirePlatformAdmin } from "@/lib/auth/guards";
// import ShippingTabs from "@/components/shipping/store/ShippingTabs";

import { redirect } from "next/navigation";

export default async function StoreShippingPage({
  params,
}: {
  params: Promise<{ storeId: string }>;
}) {
  // await requirePlatformAdmin();

  const { storeId } = await params;
  redirect(`/platform/stores/${storeId}/shipping/providers`);

  // Get all providers
  /* const { rows: providers } = await pool.query(`
    SELECT id, name, slug, is_active
    FROM shipping_providers
    WHERE is_active = true
    ORDER BY name
  `);

  // Get store assignments
  const { rows: assignments } = await pool.query(
    `
    SELECT *
    FROM store_shipping_providers
    WHERE store_id = $1
    `,
    [storeId],
  );

  return (
    <div className=" mx-auto">
      <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm space-y-6">
        
        <ShippingTabs storeId={storeId}/>
      </div>
    </div>
  ); */
}


/* 
  
  
import StoreShippingClient from "@/components/shipping/store/StoreShippingClient";
  <StoreShippingClient
          storeId={storeId}
          providers={providers}
          assignments={assignments}
        /> */