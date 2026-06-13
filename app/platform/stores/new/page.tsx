// apps/admin/app/(platform)/platform/stores/new/page.tsx
import StoreForm from "../[storeId]/StoreForm";

export default function NewStorePage() {
  return (
    <>
      <div className="page-wrapper">
        <div className="content">
          <StoreForm />
        </div>
      </div>
    </>
  );
}
