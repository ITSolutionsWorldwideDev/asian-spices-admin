// app/(store)/users/page.tsx

import UsersListComponent from "@/components/store/users/UsersList";

export default function UsersPage() {
  return (
    <div className="page-wrapper2">
      <div className="content">
        <h1 className="text-2xl font-bold mb-4">Users</h1>
        <UsersListComponent />
      </div>
    </div>
  );
}
