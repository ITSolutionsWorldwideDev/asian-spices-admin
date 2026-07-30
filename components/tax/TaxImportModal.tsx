"use client";

import { useState } from "react";
import { Download, Upload } from "react-feather";
import { useToast } from "@/core/ui";

type ImportError = {
  row: number;
  error: string;
};

type ImportResult = {
  total: number;
  inserted: number;
  updated: number;
  failed: number;
  errors: ImportError[];
};

export default function TaxImportModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const { showToast } = useToast();

  const handleImport = async () => {
    if (!file) return;

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/tax-rules/import", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Import failed");
      }

      setResult(data);
      showToast("success", "Tax import processed");
      onSuccess();
    } catch (error: any) {
      showToast("error", error?.message || "Tax import failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-auto">
        <div className="flex justify-between items-center mb-4">
          <h4 className="text-lg font-semibold">Import Tax Rules (CSV)</h4>
          <button onClick={onClose}>✕</button>
        </div>

        <div className="mb-4 text-sm text-gray-600">
          BSense format columns: <b>Country</b>, <b>Tax Type</b>,{" "}
          <b>Percentage</b>, <b>Linked Category</b>, <b>Status</b>.
        </div>

        <a
          href="/api/tax-rules/template"
          className="inline-flex items-center px-3 py-2 bg-gray-100 rounded mb-4"
        >
          <Download size={14} className="mr-2" />
          Download CSV Template
        </a>

        <label className="block border border-dashed bg-gray-100 p-6 text-center cursor-pointer rounded">
          <Upload className="mx-auto mb-2" />
          {file ? file.name : "Click to select CSV file"}
          <input
            type="file"
            className="hidden"
            accept=".csv"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
        </label>

        <div className="flex justify-end gap-2 mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded"
          >
            Close
          </button>
          <button
            onClick={handleImport}
            disabled={!file || loading}
            className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
          >
            {loading ? "Uploading..." : "Upload CSV"}
          </button>
        </div>

        {result && (
          <div className="mt-6 border-t pt-4">
            <div className="flex gap-4 text-sm mb-3">
              <span>Total: {result.total}</span>
              <span className="text-green-700">Inserted: {result.inserted}</span>
              <span className="text-blue-700">Updated: {result.updated}</span>
              <span className="text-red-700">Failed: {result.failed}</span>
            </div>

            {result.errors.length > 0 && (
              <div className="max-h-56 overflow-auto border rounded">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="text-left p-2">Row</th>
                      <th className="text-left p-2">Error</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.errors.map((item, idx) => (
                      <tr key={`${item.row}-${idx}`} className="border-t">
                        <td className="p-2">{item.row}</td>
                        <td className="p-2 text-red-600">{item.error}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
