"use client";

import { useState } from "react";
import { FileChartColumn } from "lucide-react";

export default function UploadDocument() {
  const [chamberFiles, setChamberFiles] = useState<File[]>([]);
  const [poaFiles, setPoaFiles] = useState<File[]>([]);
  //  console.log(chamberFiles)
  //  console.log(poaFiles)
  // Format file size
  const formatSize = (size: number) => {
    if (size < 1024) return size + " B";
    if (size < 1024 * 1024) return (size / 1024).toFixed(1) + " KB";
    return (size / (1024 * 1024)).toFixed(1) + " MB";
  };

  // Handle file selection
  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "chamber" | "poa",
  ) => {
    const files = e.target.files;
    if (!files) return;

    const selectedFiles = Array.from(files);

    if (type === "chamber") {
      const updated = [...chamberFiles, ...selectedFiles];

      if (updated.length > 5) {
        alert("Maximum 5 files allowed");
        return;
      }

      setChamberFiles(updated);
    } else {
      const updated = [...poaFiles, ...selectedFiles];

      if (updated.length > 5) {
        alert("Maximum 5 files allowed");
        return;
      }

      setPoaFiles(updated);
    }
  };

  // Remove file
  const removeFile = (index: number, type: "chamber" | "poa") => {
    if (type === "chamber") {
      setChamberFiles(chamberFiles.filter((_, i) => i !== index));
    } else {
      setPoaFiles(poaFiles.filter((_, i) => i !== index));
    }
  };

  // Reusable Upload Box
  const UploadBox = ({
    title,
    description,
    files,
    type,
    name,
    required = false,
  }: {
    title: string;
    description: string;
    files: File[];
    type: "chamber" | "poa";
    name: string;
    required?: boolean;
  }) => {
    return (
      <div className="space-y-3">
        <div>
          <label className="font-semibold text-gray-800">
            {title} {required && <span className="text-red-500">*</span>}
          </label>
          <p className="text-sm text-gray-500">{description}</p>
        </div>

        {/* Upload Area */}
        <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg h-40 cursor-pointer hover:bg-gray-50 transition text-center px-4">
          <input
            type="file"
            name={name}
            multiple
            className="hidden"
            onChange={(e) => handleFileChange(e, type)}
            accept=".jpg,.jpeg,.png,.heic,.pdf"
          />

          <p className="text-gray-600">Click to upload or drag and drop</p>
          <p className="text-xs text-gray-400 mt-1">
            JPG, PNG, HEIC, PDF (max 10MB)
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {files.length} / 5 files uploaded
          </p>
        </label>

        {/* File List */}
        {files.map((file, index) => (
          <div
            key={index}
            className="flex justify-between items-center border rounded-lg px-4 py-2 bg-gray-50"
          >
            <div className="flex items-center gap-2">
              <FileChartColumn className="text-[#FF6900]" />
              <div>
                <p className="text-sm text-gray-700">{file.name}</p>
                <p className="text-xs text-gray-400">{formatSize(file.size)}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => removeFile(index, type)}
              className="text-[#FF6900] text-lg font-bold cursor-pointer"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="bg-gray-100 flex justify-center p-6">
      <div className="w-full max-w-3xl bg-white rounded-xl shadow-md p-8 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Document Upload</h1>
          <p className="text-gray-500 mt-2">
            Upload business documents for verification
          </p>
        </div>

        {/* Alert */}
        <div className="bg-orange-50 border border-orange-200 text-orange-700 p-4 rounded-lg text-sm">
          <p className="font-semibold">Privacy Notice</p>
          <p className="mt-1">
            Do NOT upload personal IDs. Only business documents allowed.
          </p>
        </div>

        {/* Upload Sections */}
        {/* Must be less than 6 months old */}
        <UploadBox
          title="Chamber of Commerce Extract"
          description=""
          files={chamberFiles}
          type="chamber"
          name="chamberFiles"
          required
        />

        <UploadBox
          title="Power of Attorney (Optional)"
          description="Only if you're not the owner"
          files={poaFiles}
          type="poa"
          name="power_of_attorney_document"
        />

        {/* Requirements */}
        <div className="bg-gray-50 border rounded-lg p-4 text-sm text-gray-600 space-y-1">
          <p className="font-semibold text-gray-700">File Requirements:</p>
          <p>✔ JPG, PNG, HEIC, PDF</p>
          <p>✔ Max size: 10MB</p>
          <p>✔ Max 5 files</p>
        </div>
      </div>
    </div>
  );
}
