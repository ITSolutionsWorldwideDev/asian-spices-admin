// app/(auth)/unauthorized/page.tsx

"use client";

import { signOut } from "next-auth/react";
import Link from "next/link";
import { Shield, LogOut, ArrowLeft, Home } from "react-feather";

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-gray-100 p-8 text-center animate-in fade-in zoom-in duration-300">
        
        {/* Warning Icon */}
        <div className="mx-auto w-20 h-20 bg-red-50 text-red-600 rounded-full flex items-center justify-center mb-6">
          <Shield size={40} />
        </div>

        {/* Text Content */}
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Access Denied
        </h1>
        <p className="text-gray-500 mb-8 leading-relaxed">
          You are signed in, but your account does not have the <strong>Platform Administrator</strong> privileges required to access the Super Admin panel.
        </p>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-xl transition shadow-lg shadow-red-100"
          >
            <LogOut size={18} />
            Sign Out & Switch Account
          </button>

          <div className="grid grid-cols-2 gap-3">
            <Link
              href="/login"
              className="flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-4 rounded-xl transition"
            >
              <ArrowLeft size={16} />
              Back
            </Link>
            
            <Link
              href="/"
              className="flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-4 rounded-xl transition"
            >
              <Home size={16} />
              Home
            </Link>
          </div>
        </div>

        {/* Footer Help */}
        <p className="mt-8 text-xs text-gray-400">
          If you believe this is an error, please contact your system administrator.
        </p>
      </div>
    </div>
  );
}