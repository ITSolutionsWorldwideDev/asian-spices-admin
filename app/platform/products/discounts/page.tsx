// app/platform/products/discounts/page.tsx

// // import DiscountListComponent from "@/components/products/DiscountListComponent"; // Assuming you have a list view for discounts
// import { requireStorePermission } from "@/lib/auth/guards";
// import { PERMISSIONS } from "@/lib/auth/permissions";

// export default async function ProductDiscountsPage() {
//   // await requireStorePermission(PERMISSIONS.MANAGE_DISCOUNTS);

//   return (
//     <>
//       <DiscountListComponent />
//     </>
//   );
// }

export default function ProductDiscountsPage() {
  return (
    <div className="p-6">
      <h1 className="text-lg font-semibold">Product Discounts</h1>
      <p className="text-sm text-gray-500 mt-1">
        Discounts page is ready. Connect your discounts component here.
      </p>
    </div>
  );
}