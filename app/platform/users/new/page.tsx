// app/(platform)/users/new/page.tsx
import UserForm from "@/components/platform/client/UserForm";

export default function NewUserPage() {
  return (
    <div className="page-wrapper">
      <div className="content">
        <UserForm />
      </div>
    </div>
  );
}
