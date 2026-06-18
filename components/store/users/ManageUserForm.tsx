// components/store/users/ManageUserForm.tsx

"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { userSchema, type UserFormValues } from "@/lib/validations/user";
import { useRouter } from "next/navigation";
import { useToast } from "@/core/ui";
import { useState } from "react";
import { SubmitHandler } from "react-hook-form";

interface ManageUserProps {
  initialData?: any; // Rename user to initialData internally or update the prop
  userId?: string;
  roles: { id: string; name: string }[]; // Pass roles from server
}

export default function ManageUserForm({
  initialData,
  userId,
  roles,
}: ManageUserProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      name: initialData?.name || "",
      email: initialData?.email || "",
      status: (initialData?.status as "active" | "suspended") || "active",
      is_platform_admin: !!initialData?.is_platform_admin, // Force to boolean
      role_id: initialData?.role_id || "",
      password: "",
    },
  });

  const onSubmit: SubmitHandler<UserFormValues> = async (data) => {
    setLoading(true);
    try {
      const url = userId ? `/api/store-users/${userId}` : "/api/store-users";
      const method = userId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save");
      }

      showToast("success", `User ${userId ? "updated" : "created"}`);
      router.push("/users");
      router.refresh();
    } catch (error: any) {
      showToast("error", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="max-w-3xl bg-white p-8 rounded-xl border border-gray-200 shadow-sm space-y-6"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Name & Email */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-2">
              Full Name
            </label>
            <input
              {...register("name")}
              className="w-full p-2.5 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.name && (
              <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2">
              Email Address
            </label>
            <input
              {...register("email")}
              disabled={!!userId}
              className="w-full p-2.5 border border-gray-200 rounded-lg disabled:bg-gray-100"
            />
            {errors.email && (
              <p className="text-red-500 text-xs mt-1">
                {errors.email.message}
              </p>
            )}
          </div>
        </div>

        {/* Status & Role */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-2">
              Assign Role
            </label>
            <select
              {...register("role_id")}
              className="w-full p-2.5 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a role</option>
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>
            {errors.role_id && (
              <p className="text-red-500 text-xs mt-1">
                {errors.role_id.message}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2">
              Account Status
            </label>
            <select
              {...register("status")}
              className="w-full p-2.5 border border-gray-200 rounded-lg"
            >
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </div>

        {!userId && (
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold mb-2">
              Initial Password
            </label>
            <input
              type="password"
              {...register("password")}
              className="w-full p-2.5 border border-gray-200 rounded-lg"
            />
            {errors.password && (
              <p className="text-red-500 text-xs mt-1">
                {errors.password.message}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="flex justify-end gap-3 pt-6 border-t">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-2 font-medium text-gray-600 hover:bg-gray-50 rounded-lg"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Processing..." : userId ? "Save Changes" : "Create User"}
        </button>
      </div>
    </form>
  );
}
