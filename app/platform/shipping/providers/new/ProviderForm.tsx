// apps/admin/app/platform/shipping/providers/new/ProviderForm.tsx

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { slugify } from "@/lib/utils/slugify";
import { providerSchema } from "@/lib/validations/provider";
import { PROVIDER_CONFIGS } from "@/lib/shipping/providerConfigs";

type Provider = {
  id?: string;
  name?: string;
  slug?: string;
  is_active?: boolean;
  credentials?: Record<string, string>;
};

export default function ProviderForm({ provider }: { provider?: Provider }) {
  const router = useRouter();

  const [isSlugLocked, setIsSlugLocked] = useState(!!provider?.slug);

  //   const adapter = getProviderAdapter(slug);
  // const result = await adapter.testConnection({ apiKey, apiSecret });

  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<null | {
    success: boolean;
    message: string;
  }>(null);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  type Credentials = Record<string, string | undefined>;

  const [form, setForm] = useState<{
    name: string;
    slug: string;
    is_active: boolean;
    credentials: Credentials;
  }>({
    name: provider?.name || "",
    slug: provider?.slug || "",
    is_active: provider?.is_active ?? true,
    credentials: provider?.credentials || {}, // ✅ now fully valid
  });

  // 🔑 Resolve provider config dynamically
  const config = PROVIDER_CONFIGS[form.slug] || null;

  // Reset test state when credentials change
  useEffect(() => {
    setTestResult(null);
  }, [form.credentials, form.slug]);

  useEffect(() => {
    if (!isSlugLocked) {
      setForm((prev) => ({
        ...prev,
        slug: slugify(prev.name),
      }));
    }
  }, [form.name, isSlugLocked]);

  // Handle credential change
  const handleCredentialChange = (key: string, value: string) => {
    setForm((prev: any) => ({
      ...prev,
      credentials: {
        ...prev.credentials,
        [key]: value,
      },
    }));
  };

  // 🔌 Test Connection
  const handleTestConnection = async () => {
    if (!config) return;

    setTesting(true);
    setTestResult(null);

    try {
      const res = await fetch(
        "/api/platform/shipping/providers/test-connection",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            slug: form.slug,
            credentials: form.credentials,
            // ...form.credentials,
          }),
        },
      );

      const data = await res.json();

      setTestResult({
        success: data.success,
        message: data.success
          ? "Connection successful ✅"
          : data.error || "Connection failed",
      });
    } catch (err) {
      setTestResult({
        success: false,
        message: "Network error",
      });
    } finally {
      setTesting(false);
    }
  };

  // 💾 Save Provider
  const handleSubmit = async () => {
    setLoading(true);
    setError("");

    try {
      if (config) {
        for (const field of config.credentials) {
          if (field.required && !form.credentials[field.name]) {
            setError(`${field.label} is required`);
            return;
          }
        }
      }

      const res = await fetch("/api/platform/shipping/providers", {
        method: provider?.id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: provider?.id,
          name: form.name,
          slug: form.slug,
          is_active: form.is_active,
          credentials: form.credentials,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        if (
          data.error &&
          typeof data.error === "object" &&
          data.error.fieldErrors
        ) {
          // Map Zod errors directly to your field state errors
          const formattedErrors: Record<string, string> = {};
          for (const [key, value] of Object.entries(data.error.fieldErrors)) {
            if (Array.isArray(value) && value.length > 0) {
              formattedErrors[key] = value[0];
            }
          }
          setErrors(formattedErrors);
          setError("Please fix validation issues below.");
        } else {
          setError(data.error || "Something went wrong");
        }
        return;
      }

      router.push("/platform/shipping/providers");
    } catch (err) {
      setError("Failed to save provider");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card p-6 space-y-4">
      <h2 className="text-lg font-semibold">
        {provider ? "Edit Provider" : "Create Provider"}
      </h2>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <div className="grid grid-cols-1 gap-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Name<span className="text-red-500 ml-1">*</span>
          </label>
          <input
            placeholder="Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
            required
          />
          {errors.name && <p className="text-red-500 text-xs">{errors.name}</p>}
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Slug<span className="text-red-500 ml-1">*</span>
          </label>
          <div className="flex gap-2">
            <input
              placeholder="Slug (cheapcargo)"
              disabled={isSlugLocked}
              className={`w-full px-4 py-2 border rounded-lg transition font-mono text-sm ${
                isSlugLocked
                  ? "bg-gray-100 text-gray-500 cursor-not-allowed border-gray-200"
                  : "bg-white border-blue-300 ring-2 ring-blue-100 outline-none"
              }`}
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
            />

            <button
              type="button"
              onClick={() => setIsSlugLocked((prev) => !prev)}
              className="px-3 py-2 border rounded text-xs"
            >
              {isSlugLocked ? "Unlock" : "Lock"}
            </button>
          </div>

          {errors.slug && <p className="text-red-500 text-xs">{errors.slug}</p>}

          <p className="text-xs text-gray-400 mt-1">
            Used internally. Changing this may break integrations.
          </p>
        </div>
      </div>

      {/* 🔑 Dynamic Credentials */}
      {config && (
        <div className="border-t pt-4">
          <h3 className="font-medium mb-2">API Credentials</h3>

          <div className="grid grid-cols-1 gap-6">
            <div className="grid gap-4">
              {config.credentials.map((field) => (
                <div key={field.name}>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {field.name}
                    <span className="text-red-500 ml-1">*</span>
                  </label>

                  <input
                    key={field.name}
                    type={field.type || "text"}
                    placeholder={field.label}
                    value={form.credentials[field.name] || ""}
                    onChange={(e) =>
                      handleCredentialChange(field.name, e.target.value)
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center gap-3 mt-2">
        <button
          type="button"
          onClick={handleTestConnection}
          disabled={testing || !config}
          className="px-4 py-2 rounded-lg border text-sm hover:bg-gray-50 disabled:opacity-50"
        >
          {testing ? "Testing..." : "Test Connection"}
        </button>

        {testResult && (
          <p className={testResult.success ? "text-green-600" : "text-red-600"}>
            {testResult.message}
          </p>
        )}
      </div>

      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={form.is_active}
          onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
        />
        Active
      </label>

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="btn btn-primary"
      >
        {loading ? "Saving..." : "Save"}
      </button>
    </div>
  );
}
