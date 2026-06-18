// app/(platform)/users/page.tsx
import UsersListComponent from "@/components/platform/client/UsersList";

export default function UsersPage() {
  return (
    <div className="page-wrapper">
      <div className="content">
        <h1 className="text-2xl font-bold mb-4">Users</h1>
        <UsersListComponent />
      </div>
    </div>
  );
}
