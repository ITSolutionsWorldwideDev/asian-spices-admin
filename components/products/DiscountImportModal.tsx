// components/products/DiscountImportModal.tsx
"use client";

import { useState } from "react";
import { Download, Upload } from "react-feather";

type ImportPreviewRow = {
  row: number;
  data: any;
  isValid: boolean;
  errors: string[];
};

type ImportPreviewResponse = {
  total: number;
  valid: number;
  invalid: number;
  rows: ImportPreviewRow[];
};

export default function DiscountImportModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [step, setStep] = useState<1 | 2>(1);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<ImportPreviewResponse | null>(null);

  /* ---------------- STEP 1: PREVIEW ---------------- */
  const generatePreview = async () => {
    if (!file) return;
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/products/discounts/import/preview", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      setPreview(data);
      setStep(2);
    } catch (err) {
      alert("Failed to generate structural discount preview matrix");
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- STEP 2: CONFIRM IMPORT ---------------- */
  const confirmImport = async () => {
    if (!preview) return;
    setLoading(true);

    try {
      const res = await fetch("/api/products/discounts/import/confirm", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          rows: preview.rows,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Discount matrix import sequence failed");
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-xl shadow-xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h4 className="text-lg font-semibold text-gray-900">
            Import Product Discounts (Step {step}/2)
          </h4>
          <button className="text-gray-400 hover:text-gray-600" onClick={onClose}>✕</button>
        </div>

        {/* ================= STEP 1 ================= */}
        {step === 1 && (
          <div>
            <div className="flex gap-3 mb-4">
              <a
                href="/api/products/discounts/template"
                className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-sm font-medium rounded flex items-center text-gray-700 transition-colors"
              >
                <Download size={14} className="mr-2" />
                Download Discount Template
              </a>
            </div>

            <label className="block border border-dashed border-gray-300 bg-gray-50 rounded-lg p-8 text-center cursor-pointer hover:bg-gray-100 transition-all">
              <Upload className="mx-auto mb-2 text-gray-400" />
              <span className="text-sm font-medium text-gray-700 block">
                {file ? file.name : "Click to select Excel sheet"}
              </span>
              <input
                type="file"
                className="hidden"
                accept=".xlsx,.xls"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </label>

            <button
              onClick={generatePreview}
              disabled={!file || loading}
              className="mt-4 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded w-full disabled:opacity-50 transition-colors"
            >
              {loading ? "Analyzing Discount Data..." : "Generate Discount Preview"}
            </button>
          </div>
        )}

        {/* ================= STEP 2 ================= */}
        {step === 2 && preview && (
          <div>
            <div className="flex gap-4 mb-4 text-sm font-medium">
              <span className="text-gray-600">Total Rows: {preview.total}</span>
              <span className="text-green-600">Valid rows: {preview.valid}</span>
              <span className="text-red-600">Errors identified: {preview.invalid}</span>
            </div>

            <div className="max-h-80 overflow-y-auto border border-gray-200 rounded-lg">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 border-b border-gray-200 text-gray-700 sticky top-0">
                  <tr>
                    <th className="p-3 text-center w-16">Row</th>
                    <th className="p-3">Product SKU</th>
                    <th className="p-3">Scope</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Errors / Rule Violations</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {preview.rows.map((r) => (
                    <tr key={r.row} className="hover:bg-gray-50 transition-colors">
                      <td className="p-3 text-center text-gray-500 font-medium">{r.row}</td>
                      <td className="p-3 font-mono text-xs text-gray-900">{r.data?.SKU || "N/A"}</td>
                      <td className="p-3">
                        <span className="text-xs px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 font-medium">
                          {r.data?.["Customer Type"] || "B2C"}
                        </span>
                      </td>
                      <td className="p-3">
                        {r.isValid ? (
                          <span className="inline-flex items-center text-green-600 text-xs font-semibold">● Valid</span>
                        ) : (
                          <span className="inline-flex items-center text-red-600 text-xs font-semibold">● Blocked</span>
                        )}
                      </td>
                      <td className="p-3 text-red-500 text-xs font-medium max-w-xs truncate">
                        {r.errors.join(", ")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between mt-5 gap-3">
              <button
                onClick={() => setStep(1)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded transition-colors"
              >
                Back
              </button>
              <button
                onClick={confirmImport}
                disabled={preview.invalid > 0 || loading}
                className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded disabled:opacity-50 transition-colors"
              >
                {loading ? "Writing Records..." : "Confirm Discount Matrix Import"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}