// apps/admin/components/settings/ManageRoleForm.tsx

"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { roleSchema, type RoleFormValues } from "@/lib/validations/roles";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  initialData?: any;
  permissions: { id: string, key: string }[];
  roleId?: string;
}

export default function ManageRoleForm({ initialData, permissions, roleId }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<RoleFormValues>({
    resolver: zodResolver(roleSchema),
    defaultValues: {
      key: initialData?.key || "",
      scope: initialData?.scope || "store",
      permissions: initialData?.permissions || [],
    }
  });

  const selectedPermissions = watch("permissions");

  const togglePermission = (id: string) => {
    const current = [...selectedPermissions];
    const index = current.indexOf(id);
    if (index > -1) current.splice(index, 1);
    else current.push(id);
    setValue("permissions", current, { shouldValidate: true });
  };

  const onSubmit = async (data: RoleFormValues) => {
    setLoading(true);
    const method = roleId ? "PUT" : "POST";
    const url = roleId ? `/api/roles/${roleId}` : "/api/roles";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      router.push("/settings/roles");
      router.refresh();
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 bg-white p-8 rounded-xl border">
      <div className="grid grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-bold mb-2">Role Key</label>
          <input {...register("key")} className="w-full p-2 border rounded" placeholder="e.g. support_staff" />
        </div>
        <div>
          <label className="block text-sm font-bold mb-2">Scope</label>
          <select {...register("scope")} className="w-full p-2 border rounded">
            <option value="store">Store</option>
            <option value="platform">Platform</option>
          </select>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-bold mb-4">Permissions Matrix</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {permissions.map((perm) => (
            <label key={perm.id} className={`flex items-center p-3 border rounded-lg cursor-pointer transition ${selectedPermissions.includes(perm.id) ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'}`}>
              <input 
                type="checkbox" 
                className="hidden" 
                checked={selectedPermissions.includes(perm.id)}
                onChange={() => togglePermission(perm.id)}
              />
              <span className="text-sm font-mono">{perm.key}</span>
            </label>
          ))}
        </div>
        {errors.permissions && <p className="text-red-500 text-xs mt-2">{errors.permissions.message}</p>}
      </div>

      <div className="flex justify-end gap-4 border-t pt-6">
        <button type="submit" disabled={loading} className="bg-blue-600 text-white px-8 py-2 rounded font-bold">
          {loading ? "Saving..." : "Save Role"}
        </button>
      </div>
    </form>
  );
}