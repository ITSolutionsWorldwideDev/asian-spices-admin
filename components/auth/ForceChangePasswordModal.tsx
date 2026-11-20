"use client";

import { FormEvent, useState } from "react";
import { useSession } from "next-auth/react";
import { AUTH_ROLES } from "@/core/auth/core/constants";

const FORCE_CHANGE_ROLES = new Set<string>([
  AUTH_ROLES.STORE_OWNER,
  AUTH_ROLES.ADMIN,
]);

export default function ForceChangePasswordModal() {
  const { data: session, status, update } = useSession();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const isPartnerOrStoreAdmin = (session?.user?.storeRoles || []).some((r) =>
    FORCE_CHANGE_ROLES.has(r.role),
  );

  const mustShow =
    status === "authenticated" &&
    !session?.user?.isPlatformAdmin &&
    isPartnerOrStoreAdmin &&
    session?.user?.mustChangePassword === false;

  if (!mustShow) return null;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (password.length < 6) {
      setErrorMsg("Password must be at least 6 characters");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, confirmPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Failed to update password");
        return;
      }

      setSuccessMsg("Password updated successfully");
      await update({ mustChangePassword: true });
      setPassword("");
      setConfirmPassword("");
    } catch {
      setErrorMsg("Failed to update password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/60 p-4">
      <div
        className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="force-change-password-title"
      >
        <h3
          id="force-change-password-title"
          className="mb-2 text-xl font-semibold text-gray-900"
        >
          Set a new password
        </h3>
        <p className="mb-4 text-sm text-gray-600">
          For security, you must choose a new password before continuing.
        </p>

        {errorMsg && <p className="mb-3 text-sm text-red-600">{errorMsg}</p>}
        {successMsg && (
          <p className="mb-3 text-sm text-green-600">{successMsg}</p>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              New password <span className="text-red-600">*</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                className="form-control w-full pr-10"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                required
                minLength={6}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                <i
                  className={`fa ${showPassword ? "fa-eye-slash" : "fa-eye"}`}
                />
              </button>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Repeat new password <span className="text-red-600">*</span>
            </label>
            <div className="relative">
              <input
                type={showConfirm ? "text" : "password"}
                className="form-control w-full pr-10"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                required
                minLength={6}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                onClick={() => setShowConfirm((v) => !v)}
                aria-label={
                  showConfirm ? "Hide confirm password" : "Show confirm password"
                }
              >
                <i
                  className={`fa ${showConfirm ? "fa-eye-slash" : "fa-eye"}`}
                />
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-login w-full"
            disabled={loading}
          >
            {loading ? "Updating..." : "Update password"}
          </button>
        </form>
      </div>
    </div>
  );
}
