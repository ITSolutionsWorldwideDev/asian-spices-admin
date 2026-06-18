// components/platform/client/UserForm.tsx
"use client";

import { useState, useTransition, useEffect } from "react";
import { saveUserAction, getReferenceData } from "./actions";
import { useRouter } from "next/navigation";
import { useToast } from "@/core/ui";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2, Shield, User, Mail, Lock, Home } from "react-feather";

interface StoreOption {
  id: string;
  name: string;
}

interface RoleOption {
  id: string;
  name: string;
  key: string;
}

interface StoreAssignment {
  store_id: string;
  role_id: string;
}

interface UserFormProps {
  user?: {
    id: string;
    email: string;
    name?: string;
    is_platform_admin: boolean;
    status: string;
    stores?: StoreAssignment[];
  };
}

export default function UserForm({ user }: UserFormProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [isPending, startTransition] = useTransition();

  // Reference Data State
  const [stores, setStores] = useState<StoreOption[]>([]);
  const [roles, setRoles] = useState<RoleOption[]>([]);

  const [form, setForm] = useState({
    email: user?.email ?? "",
    name: user?.name ?? "",
    password: "",
    is_platform_admin: user?.is_platform_admin ?? false,
    status: user?.status ?? "active",
    storeAssignments: (user?.stores ?? []) as StoreAssignment[], 
  });

  // Load Stores and Scoped Roles
  useEffect(() => {
    async function loadData() {
      const data = await getReferenceData();
      setStores(data.stores);
      
      // Fix for the TypeScript 'any' error by explicitly typing 'word'
      const formattedRoles = data.roles.map((r: any) => ({
        id: r.id,
        key: r.key,
        name: r.name || r.key.split('_').map((word: string) => 
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ')
      }));
      
      setRoles(formattedRoles);
    }
    loadData();
  }, []);

  const addStoreRow = () => {
    setForm({
      ...form,
      storeAssignments: [...form.storeAssignments, { store_id: "", role_id: "" }],
    });
  };

  const updateAssignment = (index: number, field: keyof StoreAssignment, value: string) => {
    const newAssigns = [...form.storeAssignments];
    newAssigns[index] = { ...newAssigns[index], [field]: value };
    setForm({ ...form, storeAssignments: newAssigns });
  };

  const removeStoreRow = (index: number) => {
    setForm({
      ...form,
      storeAssignments: form.storeAssignments.filter((_, i) => i !== index),
    });
  };

  const handleAction = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check for duplicates (Assigning the same store twice)
    const storeIds = form.storeAssignments.map(a => a.store_id);
    if (new Set(storeIds).size !== storeIds.length) {
      showToast("error", "Duplicate store assignments detected");
      return;
    }

    startTransition(async () => {
      try {
        await saveUserAction(user?.id ?? null, form);
        showToast("success", user ? "User updated" : "User created");
        router.push("/platform/users");
        router.refresh();
      } catch (err) {
        showToast("error", "Failed to save user");
      }
    });
  };

  return (
    <form onSubmit={handleAction} className="max-w-5xl mx-auto pb-10">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        
        {/* Header Area */}
        <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{user ? "Edit User Account" : "Create New User"}</h1>
            <p className="text-sm text-gray-500">Manage identity, global roles, and store-specific permissions.</p>
          </div>
          <Link href="/platform/users" className="flex items-center text-sm font-medium text-gray-600 hover:text-blue-600 transition">
            <ArrowLeft size={16} className="mr-2" /> Back
          </Link>
        </div>

        <div className="p-8 grid grid-cols-1 lg:grid-cols-12 gap-10">
          

          <div className="lg:col-span-7 space-y-6">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
              <User size={14} /> Basic Profile
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-3 text-gray-400" size={16} />
                  <input 
                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                    placeholder="John Doe"
                    value={form.name}
                    onChange={e => setForm({...form, name: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 text-gray-400" size={16} />
                  <input 
                    type="email"
                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                    placeholder="john@example.com"
                    value={form.email}
                    onChange={e => setForm({...form, email: e.target.value})}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 text-gray-400" size={16} />
                <input 
                  type="password"
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                  placeholder={user ? "Leave blank to keep current" : "Minimum 8 characters"}
                  onChange={e => setForm({...form, password: e.target.value})}
                  required={!user}
                />
              </div>
            </div>

            <hr className="border-gray-100" />

            <div className="p-4 rounded-xl border border-blue-100 bg-blue-50/50 flex items-start gap-4">
              <div className="mt-1 bg-blue-600 p-2 rounded-lg text-white">
                <Shield size={20} />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-blue-900">Platform Administrator</h4>
                  <input 
                    type="checkbox"
                    className="w-5 h-5 rounded border-blue-300 text-blue-600 focus:ring-blue-500"
                    checked={form.is_platform_admin}
                    onChange={e => setForm({...form, is_platform_admin: e.target.checked})}
                  />
                </div>
                <p className="text-xs text-blue-700 mt-1">
                  Enabling this grants full access to the Platform Dashboard, all stores, billing, and global configuration.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Store Assignments (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <Home size={14} /> Store Access
              </h3>
              <button 
                type="button"
                onClick={addStoreRow}
                className="text-xs font-bold text-blue-600 hover:bg-blue-50 px-2 py-1 rounded transition"
              >
                + Add Store
              </button>
            </div>

            <div className="space-y-4 max-h-125 overflow-y-auto pr-2 custom-scrollbar">
              {form.storeAssignments.map((assign, idx) => (
                <div key={idx} className="p-4 border rounded-xl bg-gray-50 border-gray-200 relative group animate-in fade-in slide-in-from-right-2">
                  <button 
                    type="button"
                    onClick={() => removeStoreRow(idx)}
                    className="absolute -top-2 -right-2 p-1 bg-white border rounded-full text-red-500 shadow-sm opacity-0 group-hover:opacity-100 transition"
                  >
                    <Trash2 size={14} />
                  </button>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase">Select Store</label>
                      <select 
                        className="w-full mt-1 text-sm bg-white border rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-500"
                        value={assign.store_id}
                        onChange={e => updateAssignment(idx, "store_id", e.target.value)}
                        required
                      >
                        <option value="">Choose Store...</option>
                        {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase">Assign Role</label>
                      <select 
                        className="w-full mt-1 text-sm bg-white border rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-500"
                        value={assign.role_id}
                        onChange={e => updateAssignment(idx, "role_id", e.target.value)}
                        required
                      >
                        <option value="">Choose Role...</option>
                        {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              ))}
              
              {form.storeAssignments.length === 0 && !form.is_platform_admin && (
                <div className="text-center py-12 border-2 border-dashed rounded-2xl border-gray-100">
                  <p className="text-sm text-gray-400 px-6">This user currently has no store-level permissions assigned.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-8 py-6 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
          <Link 
            href="/platform/users" 
            className="px-6 py-2.5 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-200 transition"
          >
            Cancel
          </Link>
          <button 
            type="submit"
            disabled={isPending}
            className="px-10 py-2.5 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200 disabled:bg-blue-300 transition-all flex items-center gap-2"
          >
            {isPending ? "Saving..." : user ? "Update User" : "Create Account"}
          </button>
        </div>
      </div>
    </form>
  );
}


