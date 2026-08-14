// components/products/ProductImportModal.tsx
"use client";

import { useState } from "react";
import { Download, Upload } from "react-feather";

type ImportPreviewRow = {
  row: number;
  data: any;
  isValid: boolean;
  fieldErrors: Record<string, string>;
  errors: string[];
};

type ImportPreviewResponse = {
  total: number;
  valid: number;
  invalid: number;
  rows: ImportPreviewRow[];
  wrongTemplate?: boolean;
  error?: string;
};

export default function ProductImportModal({
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

      const res = await fetch("/api/products/import/preview", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      setPreview(data);
      setStep(2);
    } catch (err) {
      alert("Failed to generate preview");
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- STEP 2: IMPORT ---------------- */

  const confirmImport = async () => {
    if (!preview) return;

    setLoading(true);

    try {
      const res = await fetch("/api/products/import/confirm", {
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
        throw new Error(data.error || "Import failed");
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
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl">

        {/* ---------------- HEADER ---------------- */}
        <div className="flex justify-between items-center mb-4">
          <h4 className="text-lg font-semibold">
            Import Products (Step {step}/2)
          </h4>

          <button onClick={onClose}>✕</button>
        </div>

        {/* ================= STEP 1 ================= */}
        {step === 1 && (
          <div>

            {/* Download links */}
            <div className="flex gap-3 mb-4">
              <a
                href="/api/products/template"
                className="px-3 py-2 bg-gray-200 rounded flex items-center"
              >
                <Download size={14} className="mr-2" />
                Download Sample template
              </a>
            </div>

            {/* File upload */}
            <label className="block border border-dashed bg-gray-100 text-black p-6 text-center cursor-pointer">
              <Upload className="mx-auto mb-2" />
              {file ? file.name : "Click to select Excel file"}
              <input
                type="file"
                className="hidden"
                accept=".xlsx,.xls"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </label>

            {/* Next button */}
            <button
              onClick={generatePreview}
              disabled={!file || loading}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded w-full disabled:opacity-50"
            >
              {loading ? "Generating Preview..." : "Generate Preview"}
            </button>
          </div>
        )}

        {/* ================= STEP 2 ================= */}
        {step === 2 && preview && preview.wrongTemplate && (
          <div>
            <div className="bg-red-50 border border-red-200 text-red-700 rounded p-4 text-sm">
              {preview.error}
            </div>

            <div className="flex justify-between mt-4">
              <button
                onClick={() => setStep(1)}
                className="px-4 py-2 bg-gray-200 rounded"
              >
                Back
              </button>

              <a
                href="/api/products/template"
                className="px-4 py-2 bg-blue-600 text-white rounded flex items-center"
              >
                <Download size={14} className="mr-2" />
                Download Sample template
              </a>
            </div>
          </div>
        )}

        {step === 2 && preview && !preview.wrongTemplate && (
          <div>

            {/* Summary */}
            <div className="flex gap-4 mb-4 text-sm">
              <span>Total: {preview.total}</span>
              <span className="text-green-600">Valid: {preview.valid}</span>
              <span className="text-red-600">Invalid: {preview.invalid}</span>
            </div>

            {/* Table */}
            <div className="max-h-100 overflow-auto border rounded">
              <table className="w-full text-sm">
                <thead className="bg-gray-100 text-black ">
                  <tr>
                    <th className="p-2 text-left">Row</th>
                    <th className="text-left">SKU</th>
                    <th className="text-left">Status</th>
                    <th className="text-left">Errors</th>
                  </tr>
                </thead>

                <tbody>
                  {preview.rows.map((r) => (
                    <tr key={r.row} className="border-t text-black align-top">
                      <td className="p-2">{r.row}</td>
                      <td>{r.data?.SKU}</td>

                      <td>
                        {r.isValid ? (
                          <span className="text-green-600">Valid</span>
                        ) : (
                          <span className="text-red-600">Error</span>
                        )}
                      </td>

                      <td className="text-xs py-2">
                        {Object.entries(r.fieldErrors ?? {}).map(([field, message]) => (
                          <div key={field} className="text-red-500">
                            <span className="font-medium">{field}:</span> {message}
                          </div>
                        ))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Actions */}
            <div className="flex justify-between mt-4">

              <button
                onClick={() => setStep(1)}
                className="px-4 py-2 bg-gray-200 rounded"
              >
                Back
              </button>

              <button
                onClick={confirmImport}
                disabled={preview.invalid > 0 || loading}
                className="px-4 py-2 bg-green-600 text-white rounded disabled:opacity-50"
              >
                {loading ? "Importing..." : "Confirm Import"}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
