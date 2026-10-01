// components/products/ProductImportModal.tsx
"use client";

import { useState } from "react";
import { Download, Upload } from "react-feather";

type ImportAction = "create" | "update" | "skip" | "error";

type ImportPreviewRow = {
  row: number;
  data: any;
  isValid: boolean;
  action?: ImportAction;
  changes?: string[];
  fieldErrors: Record<string, string>;
  errors: string[];
};

type ImportPreviewResponse = {
  total: number;
  valid: number;
  invalid: number;
  create?: number;
  update?: number;
  skip?: number;
  rows: ImportPreviewRow[];
  wrongTemplate?: boolean;
  error?: string;
};

function actionLabel(action?: ImportAction) {
  switch (action) {
    case "create":
      return { text: "New", className: "text-green-600" };
    case "update":
      return { text: "Update", className: "text-blue-600" };
    case "skip":
      return { text: "Unchanged", className: "text-gray-500" };
    default:
      return { text: "Error", className: "text-red-600" };
  }
}

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
    } catch {
      alert("Failed to generate preview");
    } finally {
      setLoading(false);
    }
  };

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

      const parts = [
        `${data.inserted ?? 0} new`,
        `${data.updated ?? 0} updated`,
        `${data.skipped ?? 0} unchanged/skipped`,
      ];
      alert(`Import complete: ${parts.join(", ")}`);

      onSuccess();
      onClose();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const canConfirm =
    !!preview &&
    !preview.wrongTemplate &&
    preview.invalid === 0 &&
    (preview.create ?? 0) + (preview.update ?? 0) > 0;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 w-full max-w-3xl">
        <div className="flex justify-between items-center mb-4">
          <h4 className="text-lg font-semibold">
            Import Products (Step {step}/2)
          </h4>

          <button onClick={onClose}>✕</button>
        </div>

        {step === 1 && (
          <div>
            <div className="flex gap-3 mb-4">
              <a
                href="/api/products/template"
                className="px-3 py-2 bg-gray-200 rounded flex items-center"
              >
                <Download size={14} className="mr-2" />
                Download Sample template
              </a>
            </div>

            <p className="text-sm text-gray-600 mb-3">
              Existing products (matched by Name, Brand, and Weight) are skipped
              if unchanged, or updated when the sheet has different values. New
              rows are inserted.
            </p>

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

            <button
              onClick={generatePreview}
              disabled={!file || loading}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded w-full disabled:opacity-50"
            >
              {loading ? "Generating Preview..." : "Generate Preview"}
            </button>
          </div>
        )}

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
            <div className="flex flex-wrap gap-4 mb-4 text-sm">
              <span>Total: {preview.total}</span>
              <span className="text-green-600">
                New: {preview.create ?? 0}
              </span>
              <span className="text-blue-600">
                Update: {preview.update ?? 0}
              </span>
              <span className="text-gray-500">
                Unchanged: {preview.skip ?? 0}
              </span>
              <span className="text-red-600">Invalid: {preview.invalid}</span>
            </div>

            <div className="max-h-100 overflow-auto border rounded">
              <table className="w-full text-sm">
                <thead className="bg-gray-100 text-black ">
                  <tr>
                    <th className="p-2 text-left">Row</th>
                    <th className="text-left">SKU</th>
                    <th className="text-left">Item Code</th>
                    <th className="text-left">Weight</th>
                    <th className="text-left">Action</th>
                    <th className="text-left">Changes</th>
                    <th className="text-left">Errors</th>
                  </tr>
                </thead>

                <tbody>
                  {preview.rows.map((r) => {
                    const label = actionLabel(r.action);
                    return (
                      <tr key={r.row} className="border-t text-black align-top">
                        <td className="p-2">{r.row}</td>
                        <td>{r.data?.SKU}</td>
                        <td>{r.data?.["Item Code"]}</td>
                        <td>{r.data?.Weight || ""}</td>
                        <td>
                          <span className={label.className}>{label.text}</span>
                        </td>
                        <td className="text-xs py-2 text-blue-700">
                          {r.action === "update" && r.changes?.length
                            ? r.changes.join(", ")
                            : "—"}
                        </td>
                        <td className="text-xs py-2">
                          {Object.entries(r.fieldErrors ?? {}).map(
                            ([field, message]) => (
                              <div key={field} className="text-red-500">
                                <span className="font-medium">{field}:</span>{" "}
                                {message}
                              </div>
                            ),
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between mt-4">
              <button
                onClick={() => setStep(1)}
                className="px-4 py-2 bg-gray-200 rounded"
              >
                Back
              </button>

              <button
                onClick={confirmImport}
                disabled={!canConfirm || loading}
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
