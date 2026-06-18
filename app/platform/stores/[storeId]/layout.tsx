// app/platform/stores/[storeId]/layout.tsx

import StoreTabs from "./StoreTabs";

export default async function StoreLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ storeId: string }>;
}) {
  const { storeId } = await params;
  return (
    <div className="page-wrapper">
      <div className="content space-y-6">
        <StoreTabs storeId={storeId} />
        {children}
      </div>
    </div>
  );
}
