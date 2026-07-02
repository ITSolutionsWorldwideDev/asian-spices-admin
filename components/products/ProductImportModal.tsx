// components/products/ProductImportModal.tsx
"use client";

import { useState } from "react";
import { Download, Upload } from "react-feather";
import * as XLSX from "xlsx";

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

      // move to step 2 only if preview exists
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
      <div className="bg-white rounded-lg p-6 w-full max-w-lg">

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
              {/* <a
                href="/assets/migration_sample/products-sample.xlsx"
                className="px-3 py-2 bg-gray-200 rounded flex items-center"
              >
                <Download size={14} className="mr-2" />
                Sample File
              </a> */}

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
        {step === 2 && preview && (
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
                    <th className="p-2">Row</th>
                    <th>SKU</th>
                    <th>Status</th>
                    <th>Errors</th>
                  </tr>
                </thead>

                <tbody>
                  {preview.rows.map((r) => (
                    <tr key={r.row} className="border-t text-black">
                      <td className="p-2">{r.row}</td>
                      <td>{r.data?.SKU}</td>

                      <td>
                        {r.isValid ? (
                          <span className="text-green-600">Valid</span>
                        ) : (
                          <span className="text-red-600">Error</span>
                        )}
                      </td>

                      <td className="text-red-500 text-xs">
                        {r.errors.join(", ")}
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
  /* ---------------- PREVIEW FILE ---------------- */

  // const handlePreview = async () => {
  //   if (!file) return;

  //   setLoading(true);

  //   const formData = new FormData();
  //   formData.append("file", file);

  //   const res = await fetch("/api/products/import/preview", {
  //     method: "POST",
  //     body: formData,
  //   });

  //   const data = await res.json();

  //   setPreview(data);
  //   setLoading(false);
  // };

  // const validateFile = async (file: File) => {
  //   const buffer = await file.arrayBuffer();
  //   const workbook = XLSX.read(buffer, { type: "buffer" });
  //   const sheet = workbook.Sheets[workbook.SheetNames[0]];
  //   const rows = XLSX.utils.sheet_to_json<any>(sheet);

  //   const errors: string[] = [];

  //   rows.forEach((row, i) => {
  //     if (!row.Name) errors.push(`Row ${i + 2}: Name missing`);
  //     if (!row.SKU) errors.push(`Row ${i + 2}: SKU missing`);
  //     if (row.base_price && isNaN(row.base_price))
  //       errors.push(`Row ${i + 2}: Invalid price`);

  //     if (row["B2B Prices"]) {
  //       try {
  //         JSON.parse(row["B2B Prices"]);
  //       } catch {
  //         errors.push(`Row ${i + 2}: Invalid B2B JSON`);
  //       }
  //     }
  //   });

  //   return errors;
  // };

  /* const upload = async () => {
    if (!file) return;

    // const errors = await validateFile(file);

    // if (errors.length) {
    //   alert(errors.slice(0, 5).join("\n"));
    //   return;
    // }

    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/products/import", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    setLoading(false);

    if (res.ok) {
      onSuccess();
      onClose();
    } else {
      alert(data.error || "Import failed");
    }
  }; */

 /*  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 w-full max-w-lg">
        <h4 className="text-lg font-semibold mb-4">Import Products</h4>

       
        <a
          href="/assets/migration_sample/products-sample.xlsx"
          download="products-sample.xlsx"
          className="flex items-center px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 mb-4"
        >
          <Download size={16} className="mr-2" />
          Download Sample Excel
        </a>

        <a
          href="/api/products/template"
          className="flex items-center px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 mb-4"
        >
          <Download size={16} className="mr-2" />
          Download Dynamic Template
        </a>

        
        <label className="flex items-center justify-center w-full border border-dashed border-gray-300 rounded p-4 cursor-pointer hover:bg-gray-50 mb-4">
          <Upload size={20} className="mr-2 text-gray-600" />
          {file ? (
            <span className="text-gray-800">{file.name}</span>
          ) : (
            <span className="text-gray-500">
              Click to select Excel file (.xlsx/.xls)
            </span>
          )}
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="hidden"
          />
        </label>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            onClick={upload}
            disabled={!file || loading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Importing..." : "Upload & Import"}
          </button>
        </div>
      
        <h2 className="text-lg font-bold mb-4">Import Preview</h2>

        {!preview && (
          <>
            <input
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />

            <button
              onClick={handlePreview}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
            >
              Generate Preview
            </button>
          </>
        )}

        

        {preview && (
          <div className="mt-4">
            <div className="flex gap-4 mb-4">
              <span>Total: {preview.total}</span>
              <span className="text-green-600">Valid: {preview.valid}</span>
              <span className="text-red-600">Invalid: {preview.invalid}</span>
            </div>

            <div className="max-h-[400px] overflow-auto border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th>Row</th>
                    <th>SKU</th>
                    <th>Status</th>
                    <th>Errors</th>
                  </tr>
                </thead>

                <tbody>
                  {preview.rows.map((r, i) => (
                    <tr key={i} className="border-t">
                      <td>{r.row}</td>
                      <td>{r.data.SKU}</td>

                      <td>
                        {r.isValid ? (
                          <span className="text-green-600">Valid</span>
                        ) : (
                          <span className="text-red-600">Error</span>
                        )}
                      </td>

                      <td className="text-red-500">{r.errors.join(", ")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button
              className="mt-4 px-4 py-2 bg-green-600 text-white rounded"
              disabled={preview.invalid > 0}
            >
              Confirm Import
            </button>
          </div>
        )}
      </div>
    </div>
  ); */

/* "use client";

import { useState } from "react";
import { Download, Upload } from "react-feather";

export default function ProductImportModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const upload = async () => {
    if (!file) return;

    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/products/import", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    setLoading(false);

    if (res.ok) {
      onSuccess();
      onClose();
    } else {
      alert(data.error || "Import failed");
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 w-full max-w-lg">
        <h4 className="text-lg font-semibold mb-4">Import Products</h4>


        <a
          href="/assets/migration_sample/products-sample.xlsx"
          download="products-sample.xlsx"
          className="lex items-center px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300  mb-4"
        >
            <Download size={16} className="mr-2" />
          Download Sample Excel
        </a>

        <input
          type="file"
          accept=".xlsx,.xls"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="w-full border p-2 rounded my-4"
        />

        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded">
            Cancel
          </button>
          <button
            onClick={upload}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded"
          >
            {loading ? "Importing..." : "Upload & Import"}
          </button>
        </div>
      </div>
    </div>
  );
}
 */
